from typing import Any, Dict, List, Optional, Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from rag import RAGBot


app = FastAPI(title="Comic RAG Bot", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

bot = RAGBot()


class HistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(default="", max_length=2000)


class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None
    personaId: Optional[str] = None
    history: Optional[List[HistoryItem]] = None


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/chat")
def chat(req: ChatRequest):
    ctx: Dict[str, Any] = dict(req.context or {})

    # Lấy history tối đa 10 tin nhắn gần nhất
    if req.history:
        cleaned = []
        for h in req.history[-10:]:
            text = (h.content or "").strip()
            if not text:
                continue
            cleaned.append(
                {
                    "role": h.role,
                    "content": text[:800],  # cắt để không phình prompt
                }
            )
        if cleaned:
            ctx["history"] = cleaned

    return bot.process(req.message, context=ctx, persona_id=req.personaId)
