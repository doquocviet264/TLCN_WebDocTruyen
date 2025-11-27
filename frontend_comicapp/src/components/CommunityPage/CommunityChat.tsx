import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
} from "react";
import io, { Socket } from "socket.io-client";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { Send, Hash } from "lucide-react";

// --- Types ---
type MessageType = "USER" | "BOT" | "SYSTEM";

interface Sender {
  userId: number;
  username: string;
  avatar: string | null;
}

interface Message {
  messageId: number;
  channelId: number;
  sender: Sender | null;
  content: string;
  messageType: MessageType;
  replyToId: number | null;
  isDeleted: boolean;
  deletedBy: Sender | null;
  isPinned: boolean;
  createdAt: string;
}

interface Channel {
  channelId: number;
  name: string;
  slug: string;
  type: "GLOBAL" | "ROOM" | "PRIVATE";
  isActive: boolean;
  createdAt: string;
}

interface ApiOk<T> {
  success: boolean;
  data: T;
  meta?: unknown;
}

interface ChatError {
  message: string;
  error?: any;
}

// --- Constants ---
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";
const BOT_USER_ID = 99;

function authConfig() {
  const token = localStorage.getItem("token");
  return {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  } as const;
}

const CommunityChat: React.FC = () => {
  const { isLoggedIn, user } = useContext(AuthContext);

  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(
    null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // --- Auto scroll xuống cuối ---
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // --- Load messages cho 1 channel ---
  const fetchMessages = useCallback(async (channelId: number) => {
    if (!channelId) return;
    setLoadingMessages(true);
    setError(null);

    try {
      const res = await axios.get<ApiOk<Message[]>>(
        `${API_BASE}/chat/channels/${channelId}/messages`,
        {
          ...authConfig(),
          params: { limit: 20 },
        }
      );

      let fetchedMessages = Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      // chuẩn hoá: ASC theo messageId
      fetchedMessages = [...fetchedMessages].sort(
        (a, b) => a.messageId - b.messageId
      );

      setMessages(fetchedMessages);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Lỗi khi tải tin nhắn";
      toast.error(msg);
      setError(msg);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // --- Init socket 1 lần theo user ---
  useEffect(() => {
    if (!isLoggedIn || !user?.userId) {
      setError("Bạn cần đăng nhập để sử dụng chat.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Không tìm thấy token xác thực.");
      return;
    }

    const socketUrl =
      import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

    const socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", async () => {
      console.log("✅ Socket connected:", socket.id);
      setError(null);

      // 1) Load danh sách kênh
      try {
        setLoadingChannels(true);
        const res = await axios.get<ApiOk<Channel[]>>(
          `${API_BASE}/chat/channels`,
          authConfig()
        );

        const fetchedChannels = Array.isArray(res.data?.data)
          ? res.data.data
          : [];

        setChannels(fetchedChannels);

        // 2) Auto join kênh đầu tiên
        if (fetchedChannels.length > 0) {
          const firstId = fetchedChannels[0].channelId;

          console.log("➡️ Auto join channel", firstId);
          socket.emit("chat:join", { channelId: firstId });
          setSelectedChannelId(firstId);

          // 3) Load messages cho kênh này
          fetchMessages(firstId);
        }
      } catch (e: any) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Lỗi khi tải danh sách kênh";
        toast.error(msg);
        setError(msg);
        setChannels([]);
      } finally {
        setLoadingChannels(false);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        socket.connect();
      }
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err);
      setError(`Lỗi kết nối chat: ${err.message}`);
    });

    // ✅ Nhận realtime
    socket.on("chat:message", (msg: Message) => {
      console.log("📥 [chat:message] nhận được:", msg);
      setMessages((prev) => [...prev, msg]);
    });

    socket.on(
      "chat:blocked",
      (data: { channelId: number; reason: string; muteUntil?: string }) => {
        if (data.channelId === selectedChannelId) {
          toast.warn(`Tin nhắn của bạn đã bị chặn: ${data.reason}.`);
          if (data.muteUntil) {
            toast.warn(
              `Bạn đã bị mute đến ${new Date(
                data.muteUntil
              ).toLocaleTimeString()}.`
            );
          }
        }
      }
    );

    socket.on("chat:error", (data: ChatError) => {
      console.error("Chat error:", data);
      toast.error(`Lỗi chat: ${data.message}`);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isLoggedIn, user?.userId, fetchMessages, selectedChannelId]);

  // --- Đổi kênh ---
  const joinChannel = useCallback(
    (channelId: number) => {
      if (!socketRef.current || selectedChannelId === channelId) return;
      const socket = socketRef.current;

      if (selectedChannelId !== null) {
        socket.emit("chat:leave", { channelId: selectedChannelId });
      }

      console.log("➡️ Chuyển sang channel", channelId);
      socket.emit("chat:join", { channelId });
      setSelectedChannelId(channelId);
      setMessages([]);
      fetchMessages(channelId);
    },
    [selectedChannelId, fetchMessages]
  );

  // --- Gửi tin nhắn ---
  const handleSendMessage = () => {
    if (
      !newMessage.trim() ||
      !socketRef.current ||
      !selectedChannelId ||
      !user?.userId
    ) {
      return;
    }

    const data = {
      channelId: selectedChannelId,
      content: newMessage.trim(),
      replyToId: null,
    };

    console.log("📤 Emit chat:send", data);
    socketRef.current.emit("chat:send", data);
    setNewMessage("");
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // --- UI ---
  if (!isLoggedIn || !user?.userId) {
    return (
      <div className="p-4 text-center text-red-500">
        Vui lòng đăng nhập để truy cập chat.
      </div>
    );
  }

  return (
    <div
      className="
        fixed bottom-6 right-6
        w-[420px] h-[560px]
        md:w-[460px] md:h-[620px]
        bg-gradient-to-b from-background/95 to-background/85
        backdrop-blur-xl
        border border-border/70
        rounded-3xl shadow-2xl
        flex flex-col z-[1002]
        overflow-hidden
      "
    >
      {/* Header */}
      <div
        className="
          flex items-center justify-between
          px-4 py-3.5
          border-b border-border/60
          bg-gradient-to-r from-primary/90 via-primary to-primary/80
          text-primary-foreground
        "
      >
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-sm tracking-wide">
            Kênh chat
          </span>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 text-[10px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Online</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] bg-black/15 px-2 py-0.5 rounded-full">
            <Hash className="w-3 h-3" />
            <span className="truncate max-w-[120px]">
              {channels.find((c) => c.channelId === selectedChannelId)?.name ||
                "Chưa chọn kênh"}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <main className="flex-1 flex overflow-hidden">
        {/* Channels */}
        <aside className="w-44 md:w-48 flex-shrink-0 border-r border-border/60 bg-muted/60 p-3 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold tracking-wide px-1">
              Kênh chat
            </h3>
            <span className="text-[10px] text-muted-foreground">
              {channels.length || 0}
            </span>
          </div>

          {loadingChannels && (
            <p className="text-[11px] text-muted-foreground px-1">
              Đang tải kênh...
            </p>
          )}
          {error && (
            <p className="text-[11px] text-red-500 px-1">{error}</p>
          )}
          {!loadingChannels && channels.length === 0 && (
            <p className="text-[11px] text-muted-foreground px-1">
              Không có kênh nào.
            </p>
          )}

          <ul className="space-y-1.5 mt-1 overflow-y-auto pr-1 scrollbar-thin">
            {channels.map((channel) => {
              const isActive = selectedChannelId === channel.channelId;
              return (
                <li
                  key={channel.channelId}
                  onClick={() => joinChannel(channel.channelId)}
                  className={`
                    flex items-center gap-2
                    px-2.5 py-1.5 rounded-xl text-[11px] cursor-pointer
                    transition-all
                    ${
                      isActive
                        ? "bg-primary/15 text-primary font-medium shadow-sm"
                        : "text-foreground/80 hover:bg-accent/70"
                    }
                  `}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isActive ? "bg-primary" : "bg-muted-foreground/60"
                    }`}
                  />
                  <span className="truncate">{channel.name}</span>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Messages + input */}
        <div className="flex-1 flex flex-col bg-gradient-to-b from-muted/40 to-muted/10">
          {/* Messages */}
          <div
            className="
              flex-1 overflow-y-auto
              px-3.5 py-3
              space-y-2.5
              scrollbar-thin
            "
          >
            {loadingMessages && (
              <p className="text-[11px] text-muted-foreground text-center">
                Đang tải tin nhắn...
              </p>
            )}
            {error && !loadingMessages && (
              <p className="text-[11px] text-red-500 text-center">
                {error}
              </p>
            )}
            {!loadingMessages &&
              messages.length === 0 &&
              selectedChannelId && (
                <p className="text-[11px] text-muted-foreground text-center mt-4">
                  Chưa có tin nhắn nào trong kênh này. Hãy là người nhắn đầu
                  tiên ✨
                </p>
              )}
            {!selectedChannelId && (
              <p className="text-[11px] text-muted-foreground text-center mt-4">
                Chọn một kênh ở bên trái để bắt đầu chat.
              </p>
            )}

            {messages.map((msg) => {
              const isSelf = msg.sender?.userId === user?.userId;
              const isBot =
                msg.messageType === "BOT" ||
                msg.sender?.userId === BOT_USER_ID;
              const isSystem = msg.messageType === "SYSTEM";

              const timeText = msg.createdAt
                ? msg.createdAt.split("T")[1]?.split(".")[0] ?? ""
                : "";

              if (isSystem) {
                return (
                  <div
                    key={msg.messageId}
                    className="
                      text-[10px] px-3 py-1.5 mx-auto max-w-[85%]
                      rounded-full
                      bg-muted text-muted-foreground
                      flex items-center justify-between gap-3
                    "
                  >
                    <span className="truncate">{msg.content}</span>
                    <span className="text-[9px] opacity-70">
                      {timeText}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.messageId}
                  className={`flex w-full ${
                    isSelf ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`
                      max-w-[78%] px-3.5 py-2.5 rounded-2xl text-[12px]
                      shadow-sm
                      ${
                        isSelf
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : isBot
                          ? "bg-amber-50 text-amber-900 border border-amber-200 rounded-bl-md"
                          : "bg-card text-foreground border border-border/40 rounded-bl-md"
                      }
                    `}
                  >
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span
                        className={`
                          font-semibold text-[11px]
                          ${
                            isBot
                              ? "text-[var(--comic-comment-color)]"
                              : ""
                          }
                        `}
                      >
                        {isBot && "🤖 "}
                        {msg.sender?.username || "Ẩn danh"}
                      </span>
                      <span className="text-[9px] opacity-70">
                        {timeText}
                      </span>
                    </div>
                    <div className="leading-snug break-words whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border/60 bg-background/95 px-3.5 py-3">
            <div className="flex items-center gap-2.5">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhắn gì đó..."
                className="
                  flex-1 px-3.5 py-2.5
                  text-[12px]
                  rounded-2xl
                  bg-muted/70
                  border border-border/70
                  focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                  placeholder:text-muted-foreground/70
                "
              />
              <button
                onClick={handleSendMessage}
                className="
                  inline-flex items-center gap-1.5
                  px-3.5 py-2.5
                  rounded-2xl
                  bg-primary text-primary-foreground
                  text-[11px] font-medium
                  hover:brightness-110 active:scale-95
                  transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
                disabled={!newMessage.trim()}
              >
                <span>Gửi</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CommunityChat;
