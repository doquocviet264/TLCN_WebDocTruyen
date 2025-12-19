import { useEffect, useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { X, Send, Bot, Sparkles, Check, RefreshCw } from "lucide-react"; // Thêm icon RefreshCw
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area"; // Nếu bạn có component này, hoặc dùng div overflow-y-auto

/* ================= TYPES ================= */

type ComicResult = {
  comicId: number;
  title: string;
  slug: string;
  genre?: string;
  status?: string;
  chapterCount?: number;
};

type ChatIntent = "SEARCH_COMIC" | "FAQ" | "SOCIAL" | "no" | string;

type ChatbotMsg = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  intent?: ChatIntent;
  results?: ComicResult[];
};

// Cập nhật Type cho 5 tính cách
type PersonaId = "1" | "2" | "3" | "4" | "5";

/* ================= PERSONAS ================= */

const PERSONAS: Record<
  PersonaId,
  { name: string; desc: string; welcome: string; color: string }
> = {
  "1": {
    name: "Hệ Thống Lạnh Lùng 🤖",
    desc: "Chính xác, ngắn gọn, máy móc.",
    welcome:
      "Ding! 🔔 Hệ thống đã khởi động.\n\nXin chào Ký chủ. Trạng thái hoạt động: 100%.\nĐang chờ lệnh nhập liệu để tìm kiếm dữ liệu...",
    color: "text-blue-500",
  },
  "2": {
    name: "Quản Gia Hoàn Hảo 🎩",
    desc: "Lịch thiệp, tận tụy, tôn trọng.",
    welcome:
      "Kính chào Chủ nhân đã trở về dinh thự. ☕\n\nThần đã chuẩn bị trà bánh, Ngài muốn thưởng thức tác phẩm nào hôm nay ạ?",
    color: "text-amber-600",
  },
  "3": {
    name: "Đạo Hữu Tu Tiên ☯️",
    desc: "Cổ trang, thâm sâu, Hán Việt.",
    welcome:
      "Vô lượng thọ phật 🙏. Đạo hữu dạo này tu vi có tinh tiến không?\n\nHôm nay ghé Tàng Kinh Các chắc là muốn tìm cơ duyên đột phá?",
    color: "text-emerald-600",
  },
  "4": {
    name: "Đồng Đạo Wibu 🎌",
    desc: "Sôi nổi, nhiệt tình, slang.",
    welcome:
      "Hello đồng chí! 🙋‍♂️ Cơm nước gì chưa?\n\nNay có bộ nào mới 'cháy' không, share tui với coi! 😎",
    color: "text-pink-500",
  },
  "5": {
    name: "Cô Nàng Khó Ở 😒",
    desc: "Đanh đá nhưng quan tâm (Tsundere).",
    welcome:
      "Hừ! 😤 Lại là cậu à? Đừng có tưởng bở là tôi đang đợi cậu nhé.\n\nRảnh quá không có việc gì làm thì tìm truyện mà đọc đi!",
    color: "text-red-500",
  },
};

/* ================= UTILS ================= */

function nowIso() {
  return new Date().toISOString();
}

/* ================= PROPS ================= */

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  socket: Socket | null;
  isLoggedIn: boolean;
};

/* ================= COMPONENT ================= */

export default function ChatbotWidget({
  open,
  onOpenChange,
  socket,
  isLoggedIn,
}: Props) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatbotMsg[]>([]);
  // Mặc định chọn Wibu (số 4) cho thân thiện, hoặc để null bắt chọn
  const [personaId, setPersonaId] = useState<PersonaId>("4"); 
  const [personaPicked, setPersonaPicked] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);

  const canChat = useMemo(() => isLoggedIn, [isLoggedIn]);

  /* ===== INIT MESSAGE ===== */
  useEffect(() => {
    if (!open) return;
    if (messages.length > 0) return;

    setMessages([
      {
        role: "assistant",
        content:
          "✨ **Xin chào!** Trước khi bắt đầu, bạn muốn mình nói chuyện theo phong cách nào?",
        createdAt: nowIso(),
      },
    ]);

    setPersonaPicked(false);
  }, [open, messages.length]);

  /* ===== SOCKET EVENTS ===== */
  useEffect(() => {
    if (!socket) return;

    const onUserEcho = (m: any) => {
      const text = (m?.content ?? "").toString().trim();
      if (!text) return;
      setMessages((prev) => [
        ...prev,
        { role: "user", content: text, createdAt: m?.createdAt || nowIso() },
      ]);
    };

    const onBotReply = (m: any) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: (m?.content ?? "").toString(),
          createdAt: m?.createdAt || nowIso(),
          intent: m?.intent,
          results: Array.isArray(m?.results) ? m.results : [],
        },
      ]);
    };

    const onErr = (e: any) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            (e?.message ?? "Có lỗi xảy ra, bạn thử lại nhé.").toString(),
          createdAt: nowIso(),
        },
      ]);
    };

    socket.on("chatbot:message", onUserEcho);
    socket.on("chatbot:reply", onBotReply);
    socket.on("chatbot:error", onErr);

    return () => {
      socket.off("chatbot:message", onUserEcho);
      socket.off("chatbot:reply", onBotReply);
      socket.off("chatbot:error", onErr);
    };
  }, [socket]);

  /* ===== AUTO SCROLL ===== */
  useEffect(() => {
    if (!open) return;
    // Scroll nhẹ nhàng xuống cuối
    if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open, personaPicked]); // Thêm dependencies

  /* ===== ACTIONS ===== */

  const pickPersona = (id: PersonaId) => {
    setPersonaId(id);
    setPersonaPicked(true);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `✅ ${PERSONAS[id].welcome}`, // Dùng welcome text ngắn gọn
        createdAt: nowIso(),
      },
    ]);
  };

  const send = () => {
    const text = input.trim();
    if (!text) return;

    if (!canChat) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "🔒 Bạn cần đăng nhập để sử dụng chatbot.",
          createdAt: nowIso(),
        },
      ]);
      return;
    }

    if (!personaPicked) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Bạn chọn giúp mình 1 tính cách trước đã nhé 👇",
          createdAt: nowIso(),
        },
      ]);
      return;
    }

    // Lấy lịch sử chat
    const history = messages
      .slice(-10)
      .map((m) => ({
        role: m.role,
        content: (m.content ?? "").toString().slice(0, 800),
      }))
      .filter((m) => m.content.trim().length > 0);

    socket!.emit("chatbot:ask", {
      content: text,
      personaId, // Gửi ID tính cách lên server
      context: { page: "home" },
      history,
    });

    setInput("");
  };

  const close = () => onOpenChange(false);

  if (!open) return null;

  /* ================= RENDER ================= */

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-[380px] max-w-[95vw]">
      <Card className="bg-background/95 backdrop-blur-md border shadow-2xl flex flex-col h-[600px] max-h-[80vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-2">
                Trợ lý AI
                {personaPicked && (
                   <span className={`text-[10px] px-1.5 py-0.5 rounded-full border bg-muted ${PERSONAS[personaId].color}`}>
                     {PERSONAS[personaId].name.split(" ")[0]}...
                   </span>
                )}
              </div>
              <div className="text-[10px] text-green-500 flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Online
              </div>
            </div>
          </div>

          <div className="flex gap-1">
             {/* Nút reset tính cách */}
             {personaPicked && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPersonaPicked(false)} title="Đổi tính cách">
                    <RefreshCw className="h-4 w-4" />
                </Button>
             )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={close}>
                <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body Chat List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-3 space-y-4 scroll-smooth"
        >
          {/* Persona picker - Hiển thị khi chưa chọn */}
          {!personaPicked && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">
                Chọn nhân vật
              </div>
              <div className="grid grid-cols-1 gap-2">
                {(Object.keys(PERSONAS) as PersonaId[]).map((id) => (
                  <button
                    key={id}
                    onClick={() => pickPersona(id)}
                    className="group relative flex flex-col items-start gap-1 rounded-xl border bg-card p-3 text-left hover:bg-accent hover:text-accent-foreground transition-all hover:shadow-md"
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className={`font-semibold text-sm ${PERSONAS[id].color}`}>
                        {PERSONAS[id].name}
                      </span>
                      <Bot className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-50" />
                    </div>
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {PERSONAS[id].desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              } animate-in fade-in zoom-in-95 duration-200`}
            >
                {/* Avatar Bot nhỏ bên trái */}
                {m.role === "assistant" && (
                     <div className="mr-2 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                         <Bot className="h-3.5 w-3.5 text-primary" />
                     </div>
                )}

              <div className={`max-w-[85%] flex flex-col gap-1 ${m.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words shadow-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted/80 text-foreground rounded-tl-none border"
                  }`}
                >
                  {m.content}
                </div>

                {/* Comic Results */}
                {m.role === "assistant" &&
                  m.intent === "SEARCH_COMIC" &&
                  m.results &&
                  m.results.length > 0 && (
                    <div className="mt-1 w-full space-y-2">
                      {m.results.map((c) => (
                        <a
                          key={c.comicId}
                          href={`/truyen-tranh/${c.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex flex-col gap-1 rounded-xl border bg-card/50 p-3 hover:bg-accent/50 transition-colors group"
                        >
                          <div className="text-sm font-bold text-primary group-hover:underline">
                             {c.title}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px]">
                                {c.genre || "Truyện"}
                            </span>
                             <span>•</span>
                             <span>{c.chapterCount ?? 0} chương</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                  
                  {/* Time stamp nhỏ */}
                  <span className="text-[10px] text-muted-foreground/60 px-1">
                      {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
              </div>
            </div>
          ))}
        </div>

        {/* Input Footer */}
        <div className="p-3 border-t bg-background shrink-0">
          <form 
            onSubmit={(e) => {
                e.preventDefault();
                send();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                !isLoggedIn
                  ? "Đăng nhập để chat..."
                  : !personaPicked
                  ? "Chọn nhân vật ở trên..."
                  : "Nhập tin nhắn..."
              }
              disabled={!isLoggedIn}
              className="rounded-full bg-muted/50 border-transparent focus:border-primary focus:bg-background transition-all"
            />
            <Button 
                type="submit" 
                size="icon" 
                className="rounded-full shrink-0" 
                disabled={!isLoggedIn || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          
          {/* Quick Switch bar (chỉ hiện tên ngắn gọn) */}
          {personaPicked && (
             <div className="mt-2 flex gap-1 overflow-x-auto pb-1 no-scrollbar mask-gradient">
                 {(Object.keys(PERSONAS) as PersonaId[]).map(id => (
                     <button
                        key={id}
                        onClick={() => {
                            setPersonaId(id);
                            // Thông báo chuyển đổi nhẹ
                            setMessages(prev => [...prev, {
                                role: "assistant",
                                content: `🔁 Đã đổi sang chế độ **${PERSONAS[id].name}**.`,
                                createdAt: nowIso()
                            }]);
                        }}
                        className={`text-[10px] px-2 py-1 rounded-full border whitespace-nowrap transition-colors ${
                            personaId === id 
                            ? "bg-primary/10 border-primary text-primary font-medium" 
                            : "bg-transparent border-transparent text-muted-foreground hover:bg-muted"
                        }`}
                     >
                         {PERSONAS[id].name.split(" ")[0]} {PERSONAS[id].name.split(" ").pop()}
                     </button>
                 ))}
             </div>
          )}
        </div>
      </Card>
    </div>
  );
}