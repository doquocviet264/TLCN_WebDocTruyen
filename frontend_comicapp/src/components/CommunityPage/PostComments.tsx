import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "react-toastify";

export type User = { id: number; name: string; avatarUrl?: string };
export type CommentItem = {
  id: number;
  parentId: number | null;
  author: User;
  content: string;
  createdAt: string;
  // Optional counts provided by BE; fall back to 0
  repliesCount?: number;
  // Optional eager data (if BE already embeds replies)
  replies?: CommentItem[];
};

// Generic API envelope your BE usually returns
export type ApiOk<T> = { success: true; data: T; meta?: any };

const API_BASE = import.meta.env.VITE_API_URL
const authConfig = () => {
  const token = localStorage.getItem("token");
  return { headers: token ? { Authorization: `Bearer ${token}` } : undefined } as const;
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
};


function mapToCommentItem(raw: any): CommentItem {
  const id = Number(raw?.id ?? raw?.commentId ?? raw?.postCommentId);
  const parentIdRaw = raw?.parentId ?? raw?.parent_id ?? raw?.parentCommentId ?? raw?.parent_comment_id ?? null;
  const parentId = parentIdRaw == null ? null : Number(parentIdRaw);
  const u = raw?.author || raw?.user || {};
  const userId = Number(u?.id ?? u?.userId ?? 0);
  const name = String(u?.username ?? u?.name ?? "User");
  const avatarUrl = u?.avatar ?? u?.avatarUrl ?? undefined;

  // Do NOT hydrate replies from BE here to prevent auto showing
  const repliesArr: CommentItem[] = [];

  // Prefer explicit counts from BE; fallback to 0 (we don't rely on embedded replies length)
  const repliesCount = Number(
    raw?.repliesCount ?? raw?.replies_count ?? raw?.replyCount ?? 0
  );

  return {
    id,
    parentId,
    author: { id: userId, name, avatarUrl },
    content: String(raw?.content ?? ""),
    createdAt: raw?.createdAt ?? new Date().toISOString(),
    repliesCount,
    replies: repliesArr,
  };
}

// Insert a new comment/reply into the existing tree
function insertIntoTree(tree: CommentItem[], item: CommentItem, parentId: number | null): CommentItem[] {
  if (parentId == null) return [item, ...tree];
  return tree.map((c) => {
    if (c.id === parentId) {
      const replies = Array.isArray(c.replies) ? c.replies : [];
      return {
        ...c,
        repliesCount: (c.repliesCount ?? replies.length) + 1,
        replies: [item, ...replies],
      };
    }
    if (c.replies && c.replies.length) {
      return { ...c, replies: insertIntoTree(c.replies, item, parentId) };
    }
    return c;
  });
}

// Replace (upsert) a branch's replies after lazy fetch
function setRepliesForComment(tree: CommentItem[], commentId: number, replies: CommentItem[]): CommentItem[] {
  return tree.map((c) => {
    if (c.id === commentId) {
      return { ...c, replies, repliesCount: replies.length };
    }
    if (c.replies && c.replies.length) {
      return { ...c, replies: setRepliesForComment(c.replies, commentId, replies) };
    }
    return c;
  });
}

// ===== Main component =====
interface PostCommentsProps {
  postId: number;
  currentUser: User | null; // allow null -> disable input
  onCommentSubmitted?: () => void; // optional callback for parent (e.g., to bump commentsCount)
}

export default function PostComments({ postId, currentUser, onCommentSubmitted }: PostCommentsProps) {
  const [input, setInput] = useState("");
  const [items, setItems] = useState<CommentItem[]>([]); // only root comments here
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  // Fetch root comments (paginated)
  async function fetchRootComments(p: number) {
    const res = await axios.get<ApiOk<any> | any>(
      `${API_BASE}/community/posts/${postId}/comments`,
      { ...authConfig(), params: { page: p, limit: 10 } }
    );
    const body = res.data?.success ? res.data : res.data;
    let list: CommentItem[] = Array.isArray(body?.data) ? body.data.map(mapToCommentItem) : [];

    // IMPORTANT: Only keep ROOT comments here. Replies (have parentId) are hidden until user toggles.
    list = list.filter((c) => c.parentId === null);

    // Infer pagination meta (support multiple shapes)
    const meta = body?.meta || {};
    const totalPages = meta.totalPages ?? meta.pages ?? meta.total_pages ?? 1;
    const curr = meta.page ?? meta.currentPage ?? p;

    return { list, hasMore: curr < totalPages };
  }

  // Lazy fetch replies of a given root comment (all replies for simplicity)
  async function fetchReplies(commentId: number) {
    const res = await axios.get<ApiOk<any> | any>(
      `${API_BASE}/community/posts/${postId}/comments/${commentId}/replies`,
      authConfig()
    );
    const body = res.data?.success ? res.data : res.data;
    const list: CommentItem[] = Array.isArray(body?.data) ? body.data.map(mapToCommentItem) : [];
    return list;
  }

  // Create new comment or reply
  async function createComment(payload: { content: string; parentId?: number | null }) {
    const res = await axios.post<ApiOk<any> | any>(
      `${API_BASE}/community/posts/${postId}/comments`,
      payload,
      authConfig()
    );
    const body = res.data?.success ? res.data.data : res.data;
    return mapToCommentItem(body);
  }

  // Initial load
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { list, hasMore } = await fetchRootComments(1);
        setItems(list);
        setHasMore(hasMore);
        setPage(1);
      } catch (e: any) {
        const msg = e?.response?.data?.error?.message || e?.message || "Lỗi tải bình luận";
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [postId]);

  // Load more root comments
  const loadMore = async () => {
    if (!hasMore || loading) return;
    const next = page + 1;
    try {
      setLoading(true);
      const { list, hasMore: hm } = await fetchRootComments(next);
      setItems((prev) => [...prev, ...list]);
      setHasMore(hm);
      setPage(next);
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message || e?.message || "Lỗi tải thêm bình luận";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Submit root comment or reply
  const submit = async (parentId: number | null = null) => {
    const text = input.trim();
    if (!text) return;

    if (!currentUser) {
      toast.error("Vui lòng đăng nhập để bình luận");
      return;
    }

    const payload = { content: text, parentId: parentId ?? undefined };

    try {
      const saved = await createComment(payload);
      setInput("");
      setReplyingTo(null);

      if (parentId == null) {
      // New root comment -> prepend
      setItems((prev) => [saved, ...prev]);
    } else {
      // New reply -> insert into the correct root branch
      setItems((prev) => insertIntoTree(prev, saved, parentId));
    }
    // Notify parent card if provided
    onCommentSubmitted?.();
  } catch (e: any) {
      const msg = e?.response?.data?.error?.message || e?.message || "Không thể gửi bình luận";
      toast.error(msg);
    }
  };
  // Inline reply submit (text từ ô nhập dưới comment)
const submitReplyText = async (parentId: number, text: string) => {
  const content = text.trim();
  if (!content) return;

  if (!currentUser) {
    toast.error("Vui lòng đăng nhập để trả lời");
    return;
  }

  try {
    const saved = await createComment({ content, parentId });
    setItems((prev) => insertIntoTree(prev, saved, parentId));
    onCommentSubmitted?.();
  } catch (e: any) {
    const msg = e?.response?.data?.error?.message || e?.message || "Không thể gửi trả lời";
    toast.error(msg);
  }
};
  return (
    <div className="space-y-4">
      {/* Input */}
      <Card className="p-3 bg-background/60 border-border/50">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentUser?.avatarUrl} />
            <AvatarFallback>{currentUser?.name?.charAt(0) ?? "?"}</AvatarFallback>
          </Avatar>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            disabled={!currentUser}
            placeholder={currentUser ? "Viết bình luận…" : "Đăng nhập để bình luận"}
            className="flex-1"
          />
          <Button onClick={() => submit()} disabled={!currentUser || !input.trim()}>Gửi</Button>
        </div>
      </Card>

      {/* List */}
      <div className="space-y-3">
        {items.map((c) => (
          <ThreadedComment
            key={c.id}
            item={c}
            postId={postId}
            currentUser={currentUser}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            requestReplies={async (id) => {
              const replies = await fetchReplies(id);
              setItems((prev) => setRepliesForComment(prev, id, replies));
            }}
            onSubmitReply={submitReplyText}
          />
        ))}

        {loading && (
          <div className="text-sm text-muted-foreground text-center py-2">Đang tải…</div>
        )}

        {hasMore && !loading && (
          <Button variant="outline" onClick={loadMore} className="w-full">Xem thêm bình luận</Button>
        )}

        {!items.length && !loading && (
          <div className="text-sm text-muted-foreground">Chưa có bình luận nào.</div>
        )}
      </div>
    </div>
  );
}

// ===== Single threaded comment (root + its replies) =====
interface ThreadedProps {
  item: CommentItem;
  postId: number;
  currentUser: User | null;
  replyingTo: number | null;
  setReplyingTo: (id: number | null) => void;
  requestReplies: (commentId: number) => Promise<void>; // lazy fetch
  onSubmitReply: (parentId: number, text: string) => Promise<void>; // inline reply submit
}

function ThreadedComment({
  item,
  currentUser,
  replyingTo,
  setReplyingTo,
  requestReplies,
  onSubmitReply,
}: ThreadedProps) {
  const [showReplies, setShowReplies] = useState(false);

  // Count to display on the toggle button
  const repliesCount = useMemo(() => item.repliesCount ?? item.replies?.length ?? 0, [item]);

  const hasReplies = repliesCount > 0;

  const toggleReplies = async () => {
    if (!hasReplies) return;
    if (showReplies) {
      setShowReplies(false);
      return;
    }
    // if no replies hydrated yet -> fetch
    if (!item.replies || item.replies.length === 0) {
      try {
        await requestReplies(item.id);
      } catch (e: any) {
        const msg = e?.response?.data?.error?.message || e?.message || "Lỗi tải trả lời";
        toast.error(msg);
        return;
      }
    }
    setShowReplies(true);
  };

  return (
    <Card className="p-3 bg-background/60 border-border/50">
      {/* Root comment */}
      <div className="flex items-start gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={item.author.avatarUrl} />
          <AvatarFallback>{item.author.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="text-sm flex items-center gap-2">
            <span className="font-medium">{item.author.name}</span>
            <span className="text-xs text-muted-foreground" title={new Date(item.createdAt).toISOString()}>
              {timeAgo(item.createdAt)}
            </span>
          </div>
          <div className="whitespace-pre-wrap text-sm mt-1">{item.content}</div>

          <div className="flex items-center gap-3 mt-1">
            <Button
              variant="link"
              size="sm"
              className="px-0 h-auto text-xs"
              onClick={() => { setReplyingTo(item.id); setShowReplies(true); }}
              disabled={!currentUser}
            >
              Trả lời
            </Button>
            {hasReplies && (
              <Button
                variant="link"
                size="sm"
                className="px-0 h-auto text-xs"
                onClick={toggleReplies}
              >
                {showReplies ? "Ẩn trả lời" : `Hiển thị ${repliesCount} trả lời`}
              </Button>
            )}
          </div>

          {/* Inline reply editor under comment */}
          {replyingTo === item.id && (
            <InlineReplyBox
              currentUser={currentUser}
              onCancel={() => setReplyingTo(null)}
              onSend={async (text) => {
                await onSubmitReply(item.id, text);
                setReplyingTo(null);
                setShowReplies(true);
              }}
            />
          )}

          {/* Replies */}
          {showReplies && Array.isArray(item.replies) && item.replies.length > 0 && (
            <div className="mt-3 ml-6 space-y-3 border-l pl-3">
              {item.replies.map((r) => (
                <div key={r.id} className="flex items-start gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={r.author.avatarUrl} />
                    <AvatarFallback>{r.author.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="text-sm flex items-center gap-2">
                      <span className="font-medium">{r.author.name}</span>
                      <span className="text-xs text-muted-foreground" title={new Date(r.createdAt).toISOString()}>
                        {timeAgo(r.createdAt)}
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap text-sm mt-1">{r.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
function InlineReplyBox({
  currentUser,
  onCancel,
  onSend,
}: {
  currentUser: User | null;
  onCancel: () => void;
  onSend: (text: string) => Promise<void> | void;
}) {
  const [text, setText] = React.useState("");
  return (
    <div className="mt-2 flex items-center gap-2">
      <Avatar className="h-7 w-7">
        <AvatarImage src={currentUser?.avatarUrl} />
        <AvatarFallback>{currentUser?.name?.charAt(0) ?? "?"}</AvatarFallback>
      </Avatar>
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={async (e) => {
          if (e.key === "Enter" && text.trim()) {
            await onSend(text);
            setText("");
          }
        }}
        placeholder="Viết trả lời…"
        className="flex-1"
      />
      <Button
        onClick={async () => {
          if (text.trim()) {
            await onSend(text);
            setText("");
          }
        }}
        disabled={!text.trim()}
      >
        Gửi
      </Button>
      <Button variant="ghost" size="sm" onClick={onCancel}>Huỷ</Button>
    </div>
  );
}

