import json
import logging
from typing import Any, Dict, List, Optional

from groq import Groq

from config import (
    GROQ_API_KEY,
    GROQ_MODEL_NAME,
    TOP_N_FINAL,
    FAQ_JSON_PATH,
    FAQ_MIN_SCORE,
    FAQ_TOP_K,
)
from comic_store import ComicStore
# Import hàm check greeting mới
from personas import PERSONAS, is_greeting 

logger = logging.getLogger(__name__)


# ================= FAQ HELPER (Giữ nguyên) =================

def load_faq_items() -> List[Dict[str, Any]]:
    try:
        with open(FAQ_JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else []
    except Exception:
        return []

def score_faq_match(query: str, faq: Dict[str, Any]) -> float:
    q = (query or "").lower()
    title = (faq.get("title") or "").lower()
    content = (faq.get("content") or "").lower()
    keywords = faq.get("keywords") or []

    score = 0.0
    for kw in keywords:
        if kw and str(kw).lower().strip() in q:
            score += 3.0
    if q and (q in title or q in content):
        score += 1.5
    return score

def find_best_faq(query: str, faqs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    scored = []
    for f in faqs:
        s = score_faq_match(query, f)
        if s > 0:
            scored.append((s, f))
    scored.sort(key=lambda x: x[0], reverse=True)
    
    best = []
    for s, f in scored[:FAQ_TOP_K]:
        if s >= FAQ_MIN_SCORE:
            best.append({**f, "score": s})
    return best


# ================= RAG BOT CLASS (LOGIC MỚI) =================

class RAGBot:
    def __init__(self):
        self.store = ComicStore()
        self.faqs = load_faq_items()

        self.llm = None
        if GROQ_API_KEY:
            self.llm = Groq(api_key=GROQ_API_KEY)

        logger.info("Groq enabled: %s", bool(self.llm))
        self.default_persona_id = "1"
        self._faq_cache: Dict[str, str] = {}

    # ---------- Helpers ----------
    def _persona(self, persona_id: Optional[str]) -> Dict[str, Any]:
        pid = str(persona_id or self.default_persona_id)
        # Fallback về 1 nếu pid không tồn tại
        return PERSONAS.get(pid, PERSONAS.get("1"))

    def _extract_history(self, ctx: Dict[str, Any]) -> List[Dict[str, str]]:
        raw = ctx.get("history") or []
        if not isinstance(raw, list):
            return []
        cleaned = []
        for item in raw[-10:]:
            if isinstance(item, dict) and item.get("content"):
                cleaned.append({"role": item.get("role"), "content": item.get("content")[:800]})
        return cleaned

    def _history_text(self, history: List[Dict[str, str]]) -> str:
        if not history: return ""
        return "\n".join([f"{'User' if h['role']=='user' else 'Bot'}: {h['content']}" for h in history])

    def _build_candidates_text(self, candidates: List[Dict[str, Any]]) -> str:
        lines = []
        for i, c in enumerate(candidates[:8], start=1):
            lines.append(f'[{i}] id={c.get("comicId")}, title="{c.get("title")}"')
        return "\n".join(lines)

    # ================= 1. INTENT CLASSIFIER (PHÂN LOẠI Ý ĐỊNH) =================
    
    def classify_intent(self, message: str) -> Dict[str, Any]:
        """
        Dùng LLM xác định user muốn: SOCIAL (Tám chuyện), FAQ (Hỏi lỗi/HDSD) hay SEARCH (Tìm truyện)
        """
        if not self.llm:
            return {"intent": "SEARCH"} # Fallback an toàn

        prompt = f"""
Bạn là bộ phân loại ý định (Intent Classifier).
Câu chat của User: "{message}"

Hãy phân loại câu trên vào 1 trong 3 nhóm sau:
1. SOCIAL: Chào hỏi, khen chê bot, tán gẫu vu vơ, cảm xúc (VD: "buồn quá", "kể chuyện đi", "mày tên gì", "ngu thế", "yêu bot").
2. FAQ: Hỏi về cách dùng web, lỗi, tài khoản, nạp xu, tính năng web (VD: "làm sao để đăng ký", "web bị lỗi ảnh", "nạp tiền ở đâu").
3. SEARCH: Muốn tìm truyện, hỏi về nội dung truyện, tìm theo thể loại (VD: "tìm truyện kinh dị", "truyện nào main bá", "naruto", "có truyện gì hay không").
ưu tiên trò chuyện xã giao (SOCIAL) nếu không chắc chắn lắm.
Trả về JSON duy nhất: {{ "intent": "SOCIAL" | "FAQ" | "SEARCH" }}
"""
        try:
            res = self.llm.chat.completions.create(
                model=GROQ_MODEL_NAME, 
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                response_format={"type": "json_object"},
                max_tokens=50
            )
            return json.loads(res.choices[0].message.content)
        except Exception as e:
            logger.error(f"Intent Error: {e}")
            return {"intent": "SEARCH"}

    # ================= 2. SOCIAL CHAT GENERATOR =================

    def _chat_social_with_llm(self, message: str, persona: Dict[str, Any], history: List[Dict[str, str]]) -> str:
        """Sinh câu trả lời xã giao dựa trên tính cách"""
        if not self.llm:
            return persona["social_response"]

        hist_txt = self._history_text(history)
        prompt = f"""
{persona["instruction"]}

NGỮ CẢNH: User đang trò chuyện xã giao (không tìm truyện).
Lịch sử chat:
{hist_txt}

User: "{message}"

NHIỆM VỤ:
- Trả lời user theo đúng tính cách trên.
- Nếu user than buồn/vui, hãy chia sẻ cảm xúc.
- Nếu user trêu chọc, hãy đáp trả thông minh.
- Ngắn gọn (dưới 3 câu).
"""
        try:
            res = self.llm.chat.completions.create(
                model=GROQ_MODEL_NAME,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8, # Tăng nhiệt độ để sáng tạo hơn
                max_tokens=150
            )
            return res.choices[0].message.content.strip()
        except Exception:
            return persona["social_response"]

    # ================= 3. LOGIC SEARCH & FAQ (Như cũ) =================
    
    def _call_llm_search(self, user_query, candidates, persona, history):
        # ... (Copy lại hàm _call_llm_search từ code cũ của bạn) ...
        # Để tiết kiệm không gian tôi viết tắt, bạn paste lại đoạn code cũ vào đây nhé
        if not self.llm: return {"reply_text": "", "recommendations": []}
        
        hist_txt = self._history_text(history)
        prompt = f"""
{persona["instruction"]}
User tìm truyện: "{user_query}"
Danh sách ứng viên:
{self._build_candidates_text(candidates)}

Lịch sử: {hist_txt}

Yêu cầu: Chọn 2-3 truyện phù hợp nhất. Giải thích ngắn gọn đúng tính cách.
Format JSON: {{ "reply_text": "...", "recommendations": [{{"comicId": 1, "title": "..."}}] }}
"""
        try:
            res = self.llm.chat.completions.create(
                model=GROQ_MODEL_NAME, messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}, temperature=0.5
            )
            return json.loads(res.choices[0].message.content)
        except: return {"reply_text": "", "recommendations": []}

    def _call_llm_faq(self, user_query, faq_title, faq_content, persona, history, cache_key):
        if cache_key in self._faq_cache: return self._faq_cache[cache_key]
        if not self.llm: return faq_content
        
        prompt = f"""
{persona["instruction"]}
User hỏi: "{user_query}"
Thông tin: "{faq_title}" - "{faq_content}"
Hãy trả lời lại theo giọng điệu persona. Ngắn gọn.
"""
        try:
            res = self.llm.chat.completions.create(
                model=GROQ_MODEL_NAME, messages=[{"role": "user", "content": prompt}]
            )
            text = res.choices[0].message.content.strip()
            self._faq_cache[cache_key] = text
            return text
        except: return faq_content

    # ================= MAIN PROCESS =================

    def process(self, message: str, context: Optional[Dict[str, Any]] = None, persona_id: Optional[str] = None) -> Dict[str, Any]:
        msg = (message or "").strip()
        persona = self._persona(persona_id)
        history = self._extract_history(context or {})

        if not msg:
            return {"intent": "no", "reply": "Bạn nhập nội dung giúp mình nhé.", "results": []}

        if is_greeting(msg):
             return {"intent": "SOCIAL", "reply": persona["social_response"], "results": []}

        intent_data = self.classify_intent(msg)
        intent = intent_data.get("intent", "SEARCH")
        
        logger.info(f"User query: '{msg}' -> Detected Intent: {intent}")

        # ---------------- STEP 3: BRANCHING ----------------
        
        # === A. XỬ LÝ SOCIAL ===
        if intent == "SOCIAL":
            reply = self._chat_social_with_llm(msg, persona, history)
            return {"intent": "SOCIAL", "reply": reply, "results": []}

        # === B. XỬ LÝ FAQ ===
        if intent == "FAQ":
            faq_hits = find_best_faq(msg, self.faqs)
            if faq_hits:
                best = faq_hits[0]
                cache_key = f'{persona_id}:{best["id"]}'
                reply = self._call_llm_faq(msg, best["title"], best["content"], persona, history, cache_key)
                return {"intent": "FAQ", "reply": reply, "results": []}
            # Nếu AI bảo là FAQ mà không tìm thấy FAQ nào trong DB -> Chuyển sang tìm truyện hoặc Social fallback
            # (Ở đây ta cho nó chạy xuống Search cho chắc ăn)
        
        # === C. XỬ LÝ SEARCH (Mặc định) ===
        candidates, _ = self.store.search(msg)
        
        if candidates:
            brain = self._call_llm_search(msg, candidates, persona, history)
            
            # Xử lý kết quả trả về từ LLM (như code cũ)
            recs = brain.get("recommendations") or []
            id_map = {int(c["comicId"]): c for c in candidates if c.get("comicId")}
            final_comics = []
            
            for r in recs:
                if int(r.get("comicId", 0)) in id_map:
                    final_comics.append(id_map[int(r["comicId"])])
            
            # Fallback nếu LLM trả về rỗng
            if not final_comics and candidates:
                final_comics = candidates[:3]

            reply_text = brain.get("reply_text") or "Mình tìm thấy vài bộ này:"
            
            # Format output
            results = [
                {
                    "comicId": c.get("comicId"),
                    "title": c.get("title"),
                    "slug": c.get("slug"),
                    "genre": c.get("genre"),
                    "chapterCount": c.get("chapterCount"),
                    "status": c.get("status")
                } for c in final_comics
            ]
            
            return {"intent": "SEARCH_COMIC", "reply": reply_text, "results": results}

        # ---------------- STEP 4: FALLBACK ----------------
        # Không phải Social, không có FAQ, Search không ra truyện
        return {
            "intent": "no",
            "reply": persona["not_found_response"],
            "results": []
        }