import React, { useState, useEffect, useRef, useContext } from "react";
import io, { Socket } from "socket.io-client";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { Send, Hash, Reply, X, Globe2, Users, Lock } from "lucide-react";

// --- Types ---
type ChannelType = "global" | "room" | "private";

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
  replyToId: number | null;
  createdAt: string;
  isPinned?: boolean;
}

interface Channel {
  channelId: number;
  name: string;
  type: ChannelType;
  isActive: boolean;
  createdAt: string;
}

interface Room {
  channelId: number;
  name: string;
  type: ChannelType;
  isActive: boolean;
  joined: boolean;
  createdAt?: string;
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

  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // Rooms (Explore)
  const [showRooms, setShowRooms] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState<number | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const selectedChannelIdRef = useRef<number | null>(null);

  // --- Auto scroll xuống cuối ---
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // --- Load messages cho 1 channel ---
  const fetchMessages = async (channelId: number) => {
    if (!channelId) return;
    setLoadingMessages(true);
    setError(null);

    try {
      const res = await axios.get<ApiOk<Message[]>>(
        `${API_BASE}/chat/channels/${channelId}/messages`,
        {
          ...authConfig(),
          params: { limit: 50 },
        }
      );

      let fetchedMessages = Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      // bỏ các tin rỗng
      fetchedMessages = fetchedMessages.filter(
        (m) => m.content && m.content.trim().length > 0
      );

      fetchedMessages = [...fetchedMessages].sort(
        (a, b) => a.messageId - b.messageId
      );

      setMessages(fetchedMessages);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "Lỗi khi tải tin nhắn";
      toast.error(msg);
      setError(msg);
    } finally {
      setLoadingMessages(false);
    }
  };

  // --- Init socket 1 lần theo user (KHÔNG phụ thuộc selectedChannelId) ---
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

      // Lấy danh sách kênh từ BE
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

        // Auto join kênh đầu tiên nếu chưa chọn
        if (fetchedChannels.length > 0 && !selectedChannelIdRef.current) {
          const firstId = fetchedChannels[0].channelId;
          selectedChannelIdRef.current = firstId;
          setSelectedChannelId(firstId);
          socket.emit("chat:join", { channelId: firstId });
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

    // Nhận tin nhắn realtime
    socket.on("chat:message", (msg: Message) => {
      if (!msg || !msg.content || !msg.content.trim().length) return;
      console.log("📥 [chat:message] nhận được:", msg);

      // Chỉ append nếu đang ở đúng channel
      if (msg.channelId === selectedChannelIdRef.current) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    // Tin nhắn bị chặn (từ khóa cấm)
    socket.on(
      "chat:blocked",
      (data: { channelId: number; reason: string; detail?: string }) => {
        if (data.channelId === selectedChannelIdRef.current) {
          if (data.reason === "BANNED_KEYWORD") {
            toast.warn(
              "Tin nhắn của bạn chứa từ ngữ không phù hợp và đã bị chặn."
            );
          } else {
            toast.warn(`Tin nhắn của bạn đã bị chặn: ${data.reason}.`);
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
      selectedChannelIdRef.current = null;
    };
  }, [isLoggedIn, user?.userId]); // <-- không phụ thuộc selectedChannelId

  // --- Đổi kênh ---
  const joinChannel = (channelId: number) => {
    const socket = socketRef.current;
    if (!socket || selectedChannelIdRef.current === channelId) return;

    if (selectedChannelIdRef.current !== null) {
      socket.emit("chat:leave", { channelId: selectedChannelIdRef.current });
    }

    socket.emit("chat:join", { channelId });
    selectedChannelIdRef.current = channelId;
    setSelectedChannelId(channelId);
    setMessages([]);
    setReplyingTo(null);
    fetchMessages(channelId);
  };

  // --- Gửi tin nhắn ---
  const handleSendMessage = () => {
    if (
      !newMessage.trim() ||
      !socketRef.current ||
      !selectedChannelIdRef.current ||
      !user?.userId
    ) {
      return;
    }

    const data = {
      channelId: selectedChannelIdRef.current,
      content: newMessage.trim(),
      replyToId: replyingTo ? replyingTo.messageId : null,
    };

    console.log("📤 Emit chat:send", data);
    socketRef.current.emit("chat:send", data);
    setNewMessage("");
    setReplyingTo(null);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClickReply = (msg: Message) => {
    setReplyingTo(msg);
  };

  // --- Khám phá room ---
  const openRooms = async () => {
    setShowRooms(true);
    setLoadingRooms(true);
    try {
      const res = await axios.get<ApiOk<Room[]>>(
        `${API_BASE}/chat/rooms`,
        authConfig()
      );
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setRooms(data);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "Lỗi khi tải danh sách room";
      toast.error(msg);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleJoinRoom = async (room: Room) => {
    // Nếu đã joined thì chỉ cần chuyển channel
    if (room.joined) {
      joinChannel(room.channelId);
      setShowRooms(false);
      return;
    }

    try {
      setJoiningRoomId(room.channelId);
      await axios.post<ApiOk<{ channelId: number; joined: boolean }>>(
        `${API_BASE}/chat/channels/${room.channelId}/join`,
        null,
        authConfig()
      );

      // update rooms joined flag
      setRooms((prev) =>
        prev.map((r) =>
          r.channelId === room.channelId ? { ...r, joined: true } : r
        )
      );

      // nếu kênh chưa nằm trong channels thì thêm vào
      setChannels((prev) => {
        if (prev.some((c) => c.channelId === room.channelId)) return prev;
        const newChannel: Channel = {
          channelId: room.channelId,
          name: room.name,
          type: room.type,
          isActive: room.isActive,
          createdAt: room.createdAt || new Date().toISOString(),
        };
        return [...prev, newChannel];
      });

      joinChannel(room.channelId);
      setShowRooms(false);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "Tham gia phòng thất bại";
      toast.error(msg);
    } finally {
      setJoiningRoomId(null);
    }
  };

  // --- UI guard ---
  if (!isLoggedIn || !user?.userId) {
    return (
      <div className="p-4 text-center text-red-500">
        Vui lòng đăng nhập để truy cập chat.
      </div>
    );
  }

  const renderChannelTypeBadge = (type: ChannelType) => {
    switch (type) {
      case "global":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[9px]">
            <Globe2 className="w-3 h-3" />
            Global
          </span>
        );
      case "room":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 text-sky-700 px-2 py-0.5 text-[9px]">
            <Users className="w-3 h-3" />
            Room
          </span>
        );
      case "private":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-50 text-zinc-700 px-2 py-0.5 text-[9px]">
            <Lock className="w-3 h-3" />
            Private
          </span>
        );
      default:
        return null;
    }
  };

  const activeChannel = channels.find((c) => c.channelId === selectedChannelId);

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
            Chat cộng đồng
          </span>
          <span className="text-[10px] opacity-80">
            Trao đổi, chia sẻ cùng mọi người
          </span>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 text-[10px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Online</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] bg-black/15 px-2 py-0.5 rounded-full max-w-[180px]">
            <Hash className="w-3 h-3" />
            <span className="truncate">
              {activeChannel?.name || "Chưa chọn kênh"}
            </span>
            {activeChannel && renderChannelTypeBadge(activeChannel.type)}
          </div>
        </div>
      </div>

      {/* Body */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Channels */}
        <aside className="w-44 md:w-48 flex-shrink-0 border-r border-border/60 bg-muted/60 p-3 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold tracking-wide px-1">
              Kênh chat
            </h3>
            <button
              type="button"
              onClick={openRooms}
              className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-background/80 border border-border/60 hover:bg-accent/70 transition"
            >
              <Globe2 className="w-3 h-3" />
              Khám phá
            </button>
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
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="truncate">{channel.name}</span>
                    <span className="text-[9px] text-muted-foreground">
                      {channel.type === "global"
                        ? "Kênh chung"
                        : channel.type === "room"
                        ? "Phòng chủ đề"
                        : "Kênh nhóm dịch"}
                    </span>
                  </div>
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
              space-y-3
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
              const timeText = msg.createdAt
                ? msg.createdAt.split("T")[1]?.split(".")[0] ?? ""
                : "";

              return (
                <div
                  key={msg.messageId}
                  className={`
                    relative flex w-full
                    ${isSelf ? "justify-end" : "justify-start"}
                  `}
                  onMouseEnter={() => setHoveredMessageId(msg.messageId)}
                  onMouseLeave={() =>
                    setHoveredMessageId((curr) =>
                      curr === msg.messageId ? null : curr
                    )
                  }
                >
                  {/* action pill (chỉ còn Reply) */}
                  {hoveredMessageId === msg.messageId && (
                    <div
                      className={`flex items-center ${
                        isSelf ? "mr-2 order-1" : "ml-2 order-3"
                      }`}
                    >
                      <div className="flex items-center gap-1 bg-background/95 border border-border/60 rounded-full px-2 py-0.5 shadow-sm text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleClickReply(msg)}
                          className="p-0.5 rounded-full hover:bg-muted/80 transition"
                          title="Trả lời"
                        >
                          <Reply className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* bubble */}
                  <div
                    className={`
                      max-w-[78%] px-3.5 py-2.5 rounded-2xl text-[12px]
                      shadow-sm relative
                      ${
                        isSelf
                          ? "bg-primary text-primary-foreground rounded-br-md order-2"
                          : "bg-card text-foreground border border-border/40 rounded-bl-md order-2"
                      }
                    `}
                  >
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="font-semibold text-[11px]">
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

          {/* Input + reply bar */}
          <div className="border-t border-border/60 bg-background/95 px-3.5 py-3 space-y-2">
            {replyingTo && (
              <div className="flex items-start justify-between gap-2 px-3 py-2 rounded-xl bg-muted/80 border border-border/70 text-[11px]">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Trả lời {replyingTo.sender?.username || "ẩn danh"}
                  </span>
                  <span className="text-[10px] line-clamp-1 text-muted-foreground/80">
                    {replyingTo.content}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="mt-0.5 rounded-full p-1 hover:bg-black/10 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

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
                disabled={!newMessage.trim() || !selectedChannelId}
              >
                <span>Gửi</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Khám phá room */}
        {showRooms && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-[10]">
            <div className="bg-background/95 border border-border/70 rounded-2xl shadow-xl w-[85%] max-h-[80%] flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-semibold">Khám phá phòng</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRooms(false)}
                  className="rounded-full p-1 hover:bg-muted/80 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 scrollbar-thin">
                {loadingRooms && (
                  <p className="text-[11px] text-muted-foreground">
                    Đang tải danh sách phòng...
                  </p>
                )}

                {!loadingRooms && rooms.length === 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    Hiện chưa có phòng chủ đề nào.
                  </p>
                )}

                {rooms.map((room) => (
                  <div
                    key={room.channelId}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-muted/70 border border-border/60 text-[11px]"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-[12px]">
                        {room.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Phòng chủ đề
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleJoinRoom(room)}
                      disabled={joiningRoomId === room.channelId}
                      className={`
                        inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px]
                        ${
                          room.joined
                            ? "bg-primary/10 text-primary border border-primary/40"
                            : "bg-primary text-primary-foreground"
                        }
                        disabled:opacity-60 disabled:cursor-not-allowed
                      `}
                    >
                      {joiningRoomId === room.channelId
                        ? "Đang tham gia..."
                        : room.joined
                        ? "Đã tham gia"
                        : "Tham gia"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CommunityChat;
