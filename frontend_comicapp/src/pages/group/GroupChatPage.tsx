import React, {
  useEffect,
  useState,
  useContext,
  useRef,
  useCallback,
  useMemo,
} from "react";
import axios from "axios";
import io, { Socket } from "socket.io-client";
import { useParams } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User as UserIcon,
  Hash,
  Send,
  Reply,
  X,
  Pin,
  PinOff,
} from "lucide-react";
import { toast } from "react-toastify";

// ==== Types ====
type MessageType = "USER" | "BOT" | "SYSTEM";

interface GroupMember {
  userId: number;
  username: string;
  avatarUrl?: string | null;
  role: string;
}

interface GroupDetails {
  groupId: number;
  name: string;
  channelId?: number;
  members: GroupMember[];
}

interface ApiGroupResponse {
  success: boolean;
  data: GroupDetails;
}

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

interface ApiOk<T> {
  success: boolean;
  data: T;
  meta?: unknown;
}

interface ChatError {
  message: string;
  error?: any;
}

// ==== Const ====
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";
const BOT_USER_ID = 99;

function authConfig() {
  const token = localStorage.getItem("token");
  return {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  } as const;
}

const GroupChatPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { user, isLoggedIn } = useContext(AuthContext);

  const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);

  // ----- State: group info -----
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [groupError, setGroupError] = useState<string | null>(null);

  // ----- State: chat -----
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // message đang hover (để show menu bên cạnh)
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);
  // message đang reply
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // =========================
  // 1. Load Group Details
  // =========================
  useEffect(() => {
    const fetchGroupDetails = async () => {
      if (!groupId) return;
      try {
        const res = await axios.get<ApiGroupResponse>(
          `${API_BASE}/groups/${groupId}`,
          authConfig()
        );
        if (res.data.success) {
          setGroup(res.data.data);
        } else {
          setGroupError("Không thể tải thông tin nhóm.");
        }
      } catch (err) {
        setGroupError("Đã xảy ra lỗi khi tải thông tin nhóm.");
      } finally {
        setLoadingGroup(false);
      }
    };

    fetchGroupDetails();
  }, [groupId]);

  const isMember =
    !!group &&
    !!user &&
    group.members.some((member) => member.userId === user.userId);

  const myMember = useMemo(
    () => group?.members.find((m) => m.userId === user?.userId),
    [group, user?.userId]
  );
  const isLeader = myMember?.role === "leader";

  // =========================
  // 2. Load messages for channel
  // =========================
  const fetchMessages = useCallback(async (channelId: number) => {
    if (!channelId) return;
    setLoadingMessages(true);
    setChatError(null);

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
      setChatError(msg);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Pinned messages (đầu trang)
  const pinnedMessages = useMemo(
    () => messages.filter((m) => m.isPinned),
    [messages]
  );

  // =========================
  // 3. Init socket + join channel
  // =========================
  useEffect(() => {
    const channelId = group?.channelId;

    if (!isLoggedIn || !user?.userId) {
      setChatError("Bạn cần đăng nhập để sử dụng chat.");
      return;
    }

    if (!channelId || !group) return;

    if (!isMember) {
      setChatError("Bạn không phải là thành viên của nhóm này.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setChatError("Không tìm thấy token xác thực.");
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
      setChatError(null);

      socket.emit("chat:join", { channelId });
      fetchMessages(channelId);
    });

    socket.on(
      "chat:onlineUsers",
      (data: { channelId: number; userIds: number[] }) => {
        if (data.channelId === channelId) {
          setOnlineUserIds(data.userIds || []);
        }
      }
    );

    socket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        socket.connect();
      }
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err);
      setChatError(`Lỗi kết nối chat: ${err.message}`);
    });

    socket.on("chat:message", (msg: Message) => {
      console.log("📥 [chat:message] nhận được:", msg);
      setMessages((prev) => [...prev, msg]);
    });

    // KHÔNG check mute / blocked cho chat group nữa

    socket.on("chat:error", (data: ChatError) => {
      console.error("Chat error:", data);
      toast.error(`Lỗi chat: ${data.message}`);
    });

    return () => {
      socket.emit("chat:leave", { channelId });
      socket.off("chat:onlineUsers");
      socket.off("chat:message");
      socket.off("chat:error");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isLoggedIn, user?.userId, group, isMember, fetchMessages]);

  // =========================
  // 4. Auto scroll when new messages
  // =========================
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // =========================
  // 5. Send message + reply
  // =========================
  const handleSendMessage = () => {
    const channelId = group?.channelId;
    if (
      !newMessage.trim() ||
      !socketRef.current ||
      !channelId ||
      !user?.userId
    ) {
      return;
    }

    const data = {
      channelId,
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

  // =========================
  // 6. Pin / Unpin (chỉ leader)
  // =========================
  const handleTogglePin = async (msg: Message) => {
    if (!isLeader) return;
    try {
      const url = msg.isPinned
        ? `${API_BASE}/chat/messages/${msg.messageId}/unpin`
        : `${API_BASE}/chat/messages/${msg.messageId}/pin`;

      await axios.post(url, {}, authConfig());

      // cập nhật local state
      setMessages((prev) =>
        prev.map((m) =>
          m.messageId === msg.messageId
            ? { ...m, isPinned: !msg.isPinned }
            : m
        )
      );
    } catch (e: any) {
      const msgError =
        e?.response?.data?.message || e?.message || "Lỗi khi pin tin nhắn";
      toast.error(msgError);
    }
  };

  // =========================
  // 7. Render guard
  // =========================
  if (loadingGroup) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="text-sm text-muted-foreground">
          Đang tải thông tin nhóm...
        </div>
      </div>
    );
  }

  if (groupError) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="text-sm text-red-500">{groupError}</div>
      </div>
    );
  }

  if (!group || !group.channelId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="text-sm text-muted-foreground">
          Không tìm thấy kênh chat cho nhóm này.
        </div>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="text-sm text-red-500">
          Bạn không phải là thành viên của nhóm này.
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !user?.userId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="text-sm text-red-500">
          Vui lòng đăng nhập để truy cập chat.
        </div>
      </div>
    );
  }

  // =========================
  // 8. Render main layout
  // =========================
  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-6 py-4 bg-card/70 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Hash className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">
              {group.name}
            </h1>
            <div className="mt-1 inline-flex items-center gap-1 text-[11px] bg-muted/70 px-2 py-0.5 rounded-full">
              <Hash className="w-3 h-3" />
              <span className="truncate max-w-[220px]">
                Chat nhóm · #{group.channelId}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{onlineUserIds.length} đang online</span>
          </div>
          <div className="flex items-center gap-1.5">
            <UserIcon className="w-4 h-4" />
            <span>
              {group.members.length} thành viên ·{" "}
              {onlineUserIds.length}/{group.members.length} online
            </span>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 gap-4 px-4 py-4 overflow-hidden">
        {/* Chat */}
        <section className="flex-1 min-w-0 flex flex-col">
          <div className="flex flex-col h-full bg-card/80 backdrop-blur border border-border/70 rounded-2xl shadow-md overflow-hidden">
            <div className="flex-1 flex flex-col bg-gradient-to-b from-muted/40 to-muted/10">
              <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3 scrollbar-thin">
                {/* Pinned messages */}
                {pinnedMessages.length > 0 && (
                  <div className="mb-2 rounded-xl border border-border/70 bg-background/80 px-3 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Pin className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Tin nhắn được ghim
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {pinnedMessages.map((msg) => (
                        <div
                          key={`pinned-${msg.messageId}`}
                          className="flex items-start justify-between gap-2 rounded-lg bg-muted/70 px-2.5 py-1.5 text-[11px]"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="font-semibold truncate">
                                {msg.sender?.username || "Ẩn danh"}
                              </span>
                              <span className="text-[9px] text-muted-foreground">
                                {msg.createdAt
                                  .split("T")[1]
                                  ?.split(".")[0] ?? ""}
                              </span>
                            </div>
                            <div className="truncate">
                              {msg.content || "<Không có nội dung>"}
                            </div>
                          </div>
                          {isLeader && (
                            <button
                              type="button"
                              onClick={() => handleTogglePin(msg)}
                              className="ml-1 flex-shrink-0 p-1 rounded-full hover:bg-background/90 transition"
                              title="Bỏ ghim"
                            >
                              <PinOff className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages */}
                {loadingMessages && (
                  <p className="text-[11px] text-muted-foreground text-center">
                    Đang tải tin nhắn...
                  </p>
                )}
                {chatError && !loadingMessages && (
                  <p className="text-[11px] text-red-500 text-center">
                    {chatError}
                  </p>
                )}
                {!loadingMessages &&
                  messages.length === 0 &&
                  group.channelId && (
                    <p className="text-[11px] text-muted-foreground text-center mt-4">
                      Chưa có tin nhắn nào trong kênh này. Hãy là người nhắn
                      đầu tiên ✨
                    </p>
                  )}

                {messages.map((msg) => {
                  const isSelf = msg.sender?.userId === user.userId;
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

                  const parentMsg =
                    msg.replyToId !== null
                      ? messages.find(
                          (m) => m.messageId === msg.replyToId
                        )
                      : null;

                  const showMenu = hoveredMessageId === msg.messageId;

                  return (
                    <div
                      key={msg.messageId}
                      className={`relative flex w-full ${
                        isSelf ? "justify-end" : "justify-start"
                      }`}
                      onMouseEnter={() => setHoveredMessageId(msg.messageId)}
                      onMouseLeave={() =>
                        setHoveredMessageId((curr) =>
                          curr === msg.messageId ? null : curr
                        )
                      }
                    >
                      {/* Tin của mình -> menu bên TRÁI bubble */}
                      {isSelf && showMenu && (
                        <div className="mr-2 flex items-center">
                          <div className="flex items-center gap-1 bg-background/95 border border-border/60 rounded-full px-2 py-0.5 shadow-sm text-[11px]">
                            <button
                              type="button"
                              onClick={() => handleClickReply(msg)}
                              className="p-0.5 rounded-full hover:bg-muted/80 transition"
                              title="Trả lời"
                            >
                              <Reply className="w-3 h-3" />
                            </button>
                            {isLeader && (
                              <button
                                type="button"
                                onClick={() => handleTogglePin(msg)}
                                className="p-0.5 rounded-full hover:bg-muted/80 transition"
                                title={
                                  msg.isPinned ? "Bỏ ghim" : "Ghim tin nhắn"
                                }
                              >
                                {msg.isPinned ? (
                                  <PinOff className="w-3 h-3" />
                                ) : (
                                  <Pin className="w-3 h-3" />
                                )}
                              </button>
                            )}
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
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : isBot
                              ? "bg-amber-50 text-amber-900 border border-amber-200 rounded-bl-md"
                              : "bg-card text-foreground border border-border/40 rounded-bl-md"
                          }
                        `}
                      >
                        {/* icon pin nhỏ trên bubble */}
                        {msg.isPinned && (
                          <div className="absolute -top-2 right-3 bg-background/90 border border-border/70 rounded-full px-1 py-0.5 flex items-center gap-1 text-[9px] text-muted-foreground">
                            <Pin className="w-3 h-3" />
                            <span>Đã ghim</span>
                          </div>
                        )}

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

                        {/* reply preview */}
                        {msg.replyToId !== null && parentMsg && (
                          <div
                            className="
                              mb-2 px-3 py-2 rounded-xl 
                              bg-muted/80 
                              border-l-4 border-primary
                              text-[11px]
                            "
                          >
                            <div className="font-semibold text-foreground mb-0.5">
                              {parentMsg.sender?.username || "Ẩn danh"}
                            </div>
                            <div className="line-clamp-2 text-muted-foreground">
                              {parentMsg.content}
                            </div>
                          </div>
                        )}

                        <div className="leading-snug break-words whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      </div>

                      {/* Tin người khác -> menu bên PHẢI bubble */}
                      {!isSelf && showMenu && (
                        <div className="ml-2 flex items-center">
                          <div className="flex items-center gap-1 bg-background/95 border border-border/60 rounded-full px-2 py-0.5 shadow-sm text-[11px]">
                            <button
                              type="button"
                              onClick={() => handleClickReply(msg)}
                              className="p-0.5 rounded-full hover:bg-muted/80 transition"
                              title="Trả lời"
                            >
                              <Reply className="w-3 h-3" />
                            </button>
                            {isLeader && (
                              <button
                                type="button"
                                onClick={() => handleTogglePin(msg)}
                                className="p-0.5 rounded-full hover:bg-muted/80 transition"
                                title={
                                  msg.isPinned ? "Bỏ ghim" : "Ghim tin nhắn"
                                }
                              >
                                {msg.isPinned ? (
                                  <PinOff className="w-3 h-3" />
                                ) : (
                                  <Pin className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>

              {/* Input + reply bar */}
              <div className="border-t border-border/60 bg-background/95 px-3.5 py-3 space-y-2">
                {replyingTo && (
                  <div className="flex items-start justify-between gap-2 px-3 py-2 rounded-xl bg-muted/80 border border-border/70 text-[11px] mb-1.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Trả lời{" "}
                        {replyingTo.sender?.username || "ẩn danh"}
                      </span>
                      <span className="line-clamp-2 text-muted-foreground/80">
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
                    placeholder={`Nhắn gì đó trong "${group.name}"...`}
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
          </div>
        </section>

        {/* Sidebar thành viên */}
        <aside className="w-72 shrink-0 border border-border/60 rounded-2xl bg-card/70 backdrop-blur-sm p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Thành viên nhóm</h2>
            <span className="text-xs text-muted-foreground">
              {group.members.length}
            </span>
          </div>

          <ScrollArea className="flex-1">
            <ul className="space-y-2 pr-1">
              {group.members.map((member) => {
                const isCurrent = member.userId === user.userId;
                const isOnline = onlineUserIds.includes(member.userId);

                return (
                  <li
                    key={member.userId}
                    className={`flex items-center gap-3 p-2 rounded-xl border border-transparent hover:border-border/60 hover:bg-muted/60 transition-colors text-sm ${
                      isCurrent ? "bg-muted/70 border-border/70" : ""
                    }`}
                  >
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        {member.avatarUrl && (
                          <AvatarImage
                            src={member.avatarUrl}
                            alt={member.username}
                          />
                        )}
                        <AvatarFallback>
                          {member.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={`
                          absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-background
                          ${
                            isOnline
                              ? "bg-emerald-400"
                              : "bg-muted-foreground/40"
                          }
                        `}
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium leading-tight">
                        {member.username}
                        {isCurrent && (
                          <span className="ml-1 text-[10px] text-emerald-500">
                            (Bạn)
                          </span>
                        )}
                      </span>
                      <span className="text-[11px] text-muted-foreground capitalize">
                        {member.role}
                        {isOnline ? " · Online" : ""}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
};

export default GroupChatPage;
