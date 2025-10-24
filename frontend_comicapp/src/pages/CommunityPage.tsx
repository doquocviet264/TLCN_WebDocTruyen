import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Image as ImageIcon,
  Search,
  Filter,
  Star,
  MoreHorizontal,
  Upload,
  X,
  AlertTriangle,
} from "lucide-react";

/**
 * CommunityPage.tsx — single-file React + TypeScript + TailwindCSS demo
 * - Feed bài viết (Review / Tìm truyện tương tự)
 * - Composer đăng bài (upload ảnh, rating, validate)
 * - Like, bình luận (optimistic), lưu bookmark (client-only)
 * - Filter/Search/Sort/Genres (giả lập)
 * - Load more + skeleton + empty state
 *
 * Gắn vào dự án React + Vite + Tailwind là chạy. Không phụ thuộc shadcn/ui.
 */

/* ==========================
   Types
========================== */

type PostType = "REVIEW" | "FIND_SIMILAR";

interface User {
  id: number;
  name: string;
  avatarUrl?: string;
}

interface Comment {
  id: number;
  author: User;
  content: string;
  createdAt: string; // ISO
}

interface Post {
  id: number;
  type: PostType;
  author: User;
  title?: string;
  comicTitle?: string; // cho REVIEW
  rating?: number; // 1–5 cho REVIEW
  genres?: string[]; // cho FIND_SIMILAR
  content: string;
  images: string[]; // url ảnh
  likes: number;
  hasLiked: boolean;
  commentsCount: number;
  createdAt: string; // ISO
}

/* ==========================
   Utilities
========================== */

function cn(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

function timeAgo(iso: string) {
  const now = new Date();
  const then = new Date(iso);
  const diff = (now.getTime() - then.getTime()) / 1000; // sec
  if (diff < 60) return `${Math.floor(diff)}s trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h trước`;
  return `${Math.floor(diff / 86400)}d trước`;
}

function clampText(text: string, max = 280) {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

/* ==========================
   Sample Data
========================== */

const USERS: User[] = [
  { id: 1, name: "Akira", avatarUrl: "https://i.pravatar.cc/64?img=1" },
  { id: 2, name: "Linh", avatarUrl: "https://i.pravatar.cc/64?img=5" },
  { id: 3, name: "Ken", avatarUrl: "https://i.pravatar.cc/64?img=14" },
  { id: 4, name: "Mai", avatarUrl: "https://i.pravatar.cc/64?img=21" },
];

const GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Isekai",
  "Romance",
  "Sci-Fi",
  "Sports",
];

let _postIdCounter = 1000;
let _commentIdCounter = 8000;

// Seed vài bài post giả lập
const SEED_POSTS: Post[] = [
  {
    id: 1,
    type: "REVIEW",
    author: USERS[0],
    title: "Review nhanh Solo Leveling",
    comicTitle: "Solo Leveling",
    rating: 5,
    content:
      "Art quá đã, pacing arc đầu hơi nhanh nhưng từ chap 45 trở đi phê cực. Ai mê power fantasy thì quất liền.",
    images: [
      "https://picsum.photos/seed/solo1/720/400",
      "https://picsum.photos/seed/solo2/720/400",
    ],
    likes: 124,
    hasLiked: false,
    commentsCount: 8,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h trước
  },
  {
    id: 2,
    type: "FIND_SIMILAR",
    author: USERS[1],
    title: "Tìm truyện giống Chainsaw Man",
    genres: ["Action", "Horror"],
    content:
      "Mình thích vibe điên rồ + ẩn dụ xã hội như CSM. Có truyện nào tương tự không các bác?",
    images: ["https://picsum.photos/seed/csm/720/400"],
    likes: 41,
    hasLiked: false,
    commentsCount: 12,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30m trước
  },
  {
    id: 3,
    type: "REVIEW",
    author: USERS[2],
    comicTitle: "One Piece",
    rating: 4,
    content:
      "Build world quá khủng, đôi lúc kéo dài nhưng payoff xứng đáng. Arc Wano cảm xúc mạnh!",
    images: [
      "https://picsum.photos/seed/op1/720/400",
      "https://picsum.photos/seed/op2/720/400",
      "https://picsum.photos/seed/op3/720/400",
    ],
    likes: 300,
    hasLiked: true,
    commentsCount: 32,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // 1d trước
  },
];

// In-memory "DB"
let DB_POSTS: Post[] = [...SEED_POSTS];
const DB_COMMENTS: Record<number, Comment[]> = {
  1: [
    {
      id: ++_commentIdCounter,
      author: USERS[3],
      content: "Chuẩn bài! Art xịn thật.",
      createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    },
  ],
  2: [],
  3: [],
};

/* ==========================
   Fake API (mock)
========================== */

function delay(ms = 600) {
  return new Promise((res) => setTimeout(res, ms));
}

interface FetchPostParams {
  page: number;
  q?: string;
  type?: PostType | "ALL";
  sort?: "NEW" | "TOP_LIKES" | "TOP_COMMENTS";
  genres?: string[];
  pageSize?: number;
}

async function fetchPosts({
  page,
  q,
  type = "ALL",
  sort = "NEW",
  genres = [],
  pageSize = 6,
}: FetchPostParams): Promise<{ items: Post[]; hasMore: boolean }> {
  await delay(500);
  let items = [...DB_POSTS];
  if (q && q.trim()) {
    const kw = q.toLowerCase();
    items = items.filter(
      (p) =>
        p.content.toLowerCase().includes(kw) ||
        p.title?.toLowerCase().includes(kw) ||
        p.comicTitle?.toLowerCase().includes(kw)
    );
  }
  if (type !== "ALL") items = items.filter((p) => p.type === type);
  if (genres.length) {
    items = items.filter((p) => {
      if (p.type === "FIND_SIMILAR") {
        return p.genres?.some((g) => genres.includes(g));
      }
      return false;
    });
  }
  if (sort === "NEW")
    items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  if (sort === "TOP_LIKES") items.sort((a, b) => b.likes - a.likes);
  if (sort === "TOP_COMMENTS")
    items.sort((a, b) => b.commentsCount - a.commentsCount);

  const start = (page - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);
  return { items: slice, hasMore: start + pageSize < items.length };
}

async function toggleLike(postId: number): Promise<{ hasLiked: boolean; likes: number }> {
  await delay(250);
  const post = DB_POSTS.find((p) => p.id === postId)!;
  post.hasLiked = !post.hasLiked;
  post.likes += post.hasLiked ? 1 : -1;
  return { hasLiked: post.hasLiked, likes: post.likes };
}

async function fetchComments(
  postId: number,
  cursor?: string
): Promise<{ items: Comment[]; nextCursor?: string }> {
  await delay(300);
  const list = DB_COMMENTS[postId] || [];
  const pageSize = 4;
  const start = cursor ? parseInt(cursor, 10) : 0;
  const next = start + pageSize;
  return {
    items: list.slice(start, next),
    nextCursor: next < list.length ? String(next) : undefined,
  };
}

async function createComment(postId: number, content: string): Promise<Comment> {
  await delay(200);
  const c: Comment = {
    id: ++_commentIdCounter,
    author: USERS[Math.floor(Math.random() * USERS.length)],
    content,
    createdAt: new Date().toISOString(),
  };
  DB_COMMENTS[postId] = DB_COMMENTS[postId] || [];
  DB_COMMENTS[postId].unshift(c);
  const post = DB_POSTS.find((p) => p.id === postId);
  if (post) post.commentsCount += 1;
  return c;
}

async function uploadImages(files: File[]): Promise<string[]> {
  // Trả URL giả (object URLs). Trong thực tế sẽ gọi Cloudinary/S3.
  await delay(400);
  return files.map((f) => URL.createObjectURL(f));
}

async function createPost(input: {
  type: PostType;
  comicTitle?: string;
  rating?: number;
  genres?: string[];
  content: string;
  images: File[];
  title?: string;
}): Promise<Post> {
  await delay(600);
  const uploaded = await uploadImages(input.images);
  const p: Post = {
    id: ++_postIdCounter,
    type: input.type,
    author: USERS[0],
    title: input.title,
    comicTitle: input.comicTitle,
    rating: input.rating,
    genres: input.genres,
    content: input.content,
    images: uploaded,
    likes: 0,
    hasLiked: false,
    commentsCount: 0,
    createdAt: new Date().toISOString(),
  };
  DB_POSTS.unshift(p);
  DB_COMMENTS[p.id] = [];
  return p;
}

/* ==========================
   Simple Toast (no lib)
========================== */

function useToast() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; type?: "success" | "error" }[]>([]);
  const push = (msg: string, type: "success" | "error" = "success") => {
    const id = Math.random();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2500);
  };
  const View = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 shadow-lg text-sm",
            t.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
          )}
        >
          {t.type === "success" ? (
            <span className="font-medium">✔</span>
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
  return { push, View } as const;
}

/* ==========================
   Main Component
========================== */

export default function CommunityPage() {
  // Filters
  const [q, setQ] = useState("");
  const [type, setType] = useState<FetchPostParams["type"]>("ALL");
  const [sort, setSort] = useState<FetchPostParams["sort"]>("NEW");
  const [genres, setGenres] = useState<string[]>([]);

  // Feed
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Composer
  const [tab, setTab] = useState<PostType>("REVIEW");
  const [title, setTitle] = useState(""); // optional
  const [comicTitle, setComicTitle] = useState("");
  const [rating, setRating] = useState(0);
  const [simGenres, setSimGenres] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Comments state per post
  const [openComments, setOpenComments] = useState<Record<number, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [commentPages, setCommentPages] = useState<Record<number, string | undefined>>({});
  const [commentLists, setCommentLists] = useState<Record<number, Comment[]>>({});
  const [commentLoading, setCommentLoading] = useState<Record<number, boolean>>({});

  const { push: toast, View: ToastView } = useToast();

  // Fetch feed
  const loadFeed = async (reset = false) => {
    try {
      setLoading(true);
      const { items: data, hasMore } = await fetchPosts({ page: reset ? 1 : page, q, type, sort, genres });
      setHasMore(hasMore);
      setItems((prev) => (reset ? data : [...prev, ...data]));
      setError(null);
    } catch (e) {
      setError("Lỗi tải bài viết. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  const qRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (qRef.current) clearTimeout(qRef.current);
    qRef.current = setTimeout(() => {
      setPage(1);
      loadFeed(true);
    }, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, type, sort, genres.join(",")]);

  useEffect(() => {
    loadFeed(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = async () => {
    if (!hasMore || loading) return;
    setPage((p) => p + 1);
    const nextPage = page + 1;
    try {
      setLoading(true);
      const { items: data, hasMore } = await fetchPosts({ page: nextPage, q, type, sort, genres });
      setHasMore(hasMore);
      setItems((prev) => [...prev, ...data]);
    } catch (e) {
      setError("Lỗi tải thêm bài viết.");
    } finally {
      setLoading(false);
    }
  };

  // Like optimistic
  const onToggleLike = async (post: Post) => {
    // optimistic
    setItems((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, hasLiked: !p.hasLiked, likes: p.likes + (p.hasLiked ? -1 : 1) } : p))
    );
    try {
      const res = await toggleLike(post.id);
      setItems((prev) => prev.map((p) => (p.id === post.id ? { ...p, ...res } : p)));
    } catch (e) {
      // rollback
      setItems((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, hasLiked: !p.hasLiked, likes: p.likes + (p.hasLiked ? -1 : 1) } : p))
      );
      toast("Không thể thả tim. Thử lại!", "error");
    }
  };

  // Comments open/close + fetch
  const toggleComments = async (postId: number) => {
    setOpenComments((o) => ({ ...o, [postId]: !o[postId] }));
    const willOpen = !openComments[postId];
    if (willOpen && !commentLists[postId]) {
      setCommentLoading((s) => ({ ...s, [postId]: true }));
      const { items, nextCursor } = await fetchComments(postId);
      setCommentLists((s) => ({ ...s, [postId]: items }));
      setCommentPages((s) => ({ ...s, [postId]: nextCursor }));
      setCommentLoading((s) => ({ ...s, [postId]: false }));
    }
  };

  const loadMoreComments = async (postId: number) => {
    setCommentLoading((s) => ({ ...s, [postId]: true }));
    const cursor = commentPages[postId];
    const { items, nextCursor } = await fetchComments(postId, cursor);
    setCommentLists((s) => ({ ...s, [postId]: [...(s[postId] || []), ...items] }));
    setCommentPages((s) => ({ ...s, [postId]: nextCursor }));
    setCommentLoading((s) => ({ ...s, [postId]: false }));
  };

  const submitComment = async (post: Post) => {
    const text = (commentInputs[post.id] || "").trim();
    if (text.length < 1) return;
    // optimistic
    const temp: Comment = {
      id: Math.random(),
      author: USERS[0],
      content: text,
      createdAt: new Date().toISOString(),
    } as Comment;
    setCommentInputs((s) => ({ ...s, [post.id]: "" }));
    setCommentLists((s) => ({ ...s, [post.id]: [temp, ...(s[post.id] || [])] }));
    setItems((prev) => prev.map((p) => (p.id === post.id ? { ...p, commentsCount: p.commentsCount + 1 } : p)));

    try {
      const saved = await createComment(post.id, text);
      // replace temp by saved (rough: prepend saved again and filter temp)
      setCommentLists((s) => ({
        ...s,
        [post.id]: [saved, ...(s[post.id] || []).filter((c) => c !== temp)],
      }));
      toast("Đã thêm bình luận!");
    } catch (e) {
      // rollback
      setCommentLists((s) => ({ ...s, [post.id]: (s[post.id] || []).filter((c) => c !== temp) }));
      setItems((prev) => prev.map((p) => (p.id === post.id ? { ...p, commentsCount: p.commentsCount - 1 } : p)));
      toast("Không thể bình luận. Thử lại!", "error");
    }
  };

  // Composer handlers
  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : [];
    const next = [...files, ...list].slice(0, 5);
    setFiles(next);
  };
  const removeFile = (idx: number) => setFiles((arr) => arr.filter((_, i) => i !== idx));

  const canSubmit = useMemo(() => {
    if (content.trim().length < 10) return false;
    if (tab === "REVIEW") return !!comicTitle && rating >= 1 && rating <= 5 && files.length <= 5;
    return files.length <= 5; // FIND_SIMILAR
  }, [content, tab, comicTitle, rating, files.length]);

  const submitPost = async () => {
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      const post = await createPost({
        type: tab,
        title: title || undefined,
        comicTitle: tab === "REVIEW" ? comicTitle : undefined,
        rating: tab === "REVIEW" ? rating : undefined,
        genres: tab === "FIND_SIMILAR" ? simGenres : undefined,
        content: content.trim(),
        images: files,
      });
      // reset form
      setTitle("");
      setComicTitle("");
      setRating(0);
      setSimGenres([]);
      setContent("");
      setFiles([]);
      // refresh feed (prepend)
      setItems((prev) => [post, ...prev]);
      toast("Đăng bài thành công!");
    } catch (e) {
      toast("Đăng bài thất bại", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Image viewer modal
  const [viewer, setViewer] = useState<{ open: boolean; images: string[]; index: number }>({ open: false, images: [], index: 0 });
  const openViewer = (images: string[], index: number) => setViewer({ open: true, images, index });
  const closeViewer = () => setViewer((v) => ({ ...v, open: false }));
  const prevImg = () => setViewer((v) => ({ ...v, index: (v.index - 1 + v.images.length) % v.images.length }));
  const nextImg = () => setViewer((v) => ({ ...v, index: (v.index + 1) % v.images.length }));

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <ToastView />
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl font-semibold">Cộng đồng</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm bài, truyện, từ khoá…"
                className="w-64 pl-9 pr-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              />
            </div>
            <button className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800">
              <Filter className="h-4 w-4" />
              Lọc
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Composer */}
        <section className="lg:col-span-2">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 shadow-xl">
            <div className="flex items-center gap-2 px-4 pt-4">
              <button
                onClick={() => setTab("REVIEW")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm border",
                  tab === "REVIEW"
                    ? "bg-emerald-600 border-emerald-500 text-white"
                    : "bg-neutral-900 border-neutral-800 hover:bg-neutral-800"
                )}
              >
                Đánh giá truyện
              </button>
              <button
                onClick={() => setTab("FIND_SIMILAR")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm border",
                  tab === "FIND_SIMILAR"
                    ? "bg-emerald-600 border-emerald-500 text-white"
                    : "bg-neutral-900 border-neutral-800 hover:bg-neutral-800"
                )}
              >
                Tìm truyện tương tự
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Title optional */}
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tiêu đề (tuỳ chọn)"
                className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              />

              {tab === "REVIEW" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={comicTitle}
                    onChange={(e) => setComicTitle(e.target.value)}
                    placeholder="Tên truyện (bắt buộc)"
                    className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-400">Đánh giá:</span>
                    {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        onClick={() => setRating(n)}
                        className={cn(
                          "p-1 rounded-md",
                          rating >= n ? "text-yellow-400" : "text-neutral-600"
                        )}
                        aria-label={`Rating ${n}`}
                      >
                        <Star className={cn("h-5 w-5", rating >= n ? "fill-current" : undefined)} />
                      </button>
                    ))}
                    {rating > 0 && <span className="text-sm text-neutral-300 ml-1">{rating}/5</span>}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-wrap gap-2">
                    {GENRES.map((g) => {
                      const active = simGenres.includes(g);
                      return (
                        <button
                          key={g}
                          onClick={() =>
                            setSimGenres((prev) =>
                              prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
                            )
                          }
                          className={cn(
                            "px-3 py-1.5 rounded-full border text-sm",
                            active
                              ? "bg-emerald-600 border-emerald-500 text-white"
                              : "bg-neutral-900 border-neutral-800 hover:bg-neutral-800"
                          )}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-sm text-neutral-400 flex items-center">Chọn thể loại bạn thích (tuỳ chọn)</div>
                </div>
              )}

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  tab === "REVIEW"
                    ? "Viết cảm nhận (≥ 10 ký tự)…"
                    : "Mô tả truyện bạn muốn tìm (ví dụ: giống Solo Leveling, main mạnh dần, art đẹp)…"
                }
                className="w-full min-h-28 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              />

              {/* Upload */}
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 w-fit px-3 py-2 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 cursor-pointer">
                  <Upload className="h-4 w-4" />
                  <span>Thêm ảnh (tối đa 5)</span>
                  <input type="file" hidden multiple accept="image/*" onChange={onFiles} />
                </label>
                {files.length > 0 && (
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                    {files.map((f, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={URL.createObjectURL(f)}
                          className="h-24 w-full object-cover rounded-lg border border-neutral-800"
                          alt={f.name}
                        />
                        <button
                          onClick={() => removeFile(i)}
                          className="absolute top-1 right-1 hidden group-hover:flex items-center justify-center h-7 w-7 rounded-full bg-black/70"
                          aria-label="Xoá ảnh"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-xs text-neutral-500">Nội dung tối thiểu 10 ký tự. Ảnh ≤ 5 tấm.</div>
                <button
                  onClick={submitPost}
                  disabled={!canSubmit || submitting}
                  className={cn(
                    "px-4 py-2 rounded-xl font-medium",
                    canSubmit && !submitting
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                  )}
                >
                  {submitting ? "Đang đăng…" : "Đăng bài"}
                </button>
              </div>
            </div>
          </div>

          {/* Feed */}
          <div className="mt-6 space-y-4">
            {error && (
              <div className="rounded-xl border border-rose-700 bg-rose-900/40 text-rose-100 p-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> {error}
              </div>
            )}

            {/* Filter row (Type/Sort/Genres quick) */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Type */}
              {(["ALL", "REVIEW", "FIND_SIMILAR"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    "px-3 py-1.5 rounded-full border text-sm",
                    type === t
                      ? "bg-neutral-200 text-neutral-900 border-neutral-300"
                      : "bg-neutral-900 border-neutral-800 hover:bg-neutral-800"
                  )}
                >
                  {t === "ALL" ? "Tất cả" : t === "REVIEW" ? "Đánh giá" : "Tìm truyện"}
                </button>
              ))}

              {/* Sort */}
              <div className="ml-auto flex items-center gap-2 text-sm">
                <span className="text-neutral-400">Sắp xếp:</span>
                {(
                  [
                    { k: "NEW", n: "Mới nhất" },
                    { k: "TOP_LIKES", n: "Nổi bật" },
                    { k: "TOP_COMMENTS", n: "Nhiều bình luận" },
                  ] as const
                ).map((o) => (
                  <button
                    key={o.k}
                    onClick={() => setSort(o.k)}
                    className={cn(
                      "px-3 py-1.5 rounded-full border",
                      sort === o.k
                        ? "bg-neutral-200 text-neutral-900 border-neutral-300"
                        : "bg-neutral-900 border-neutral-800 hover:bg-neutral-800"
                    )}
                  >
                    {o.n}
                  </button>
                ))}
              </div>
            </div>

            {items.map((p) => (
              <article key={p.id} className="rounded-2xl border border-neutral-800 bg-neutral-900/60 shadow-xl">
                {/* Header */}
                <div className="p-4 flex items-start gap-3">
                  <img
                    src={p.author.avatarUrl}
                    alt={p.author.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{p.author.name}</span>
                      <span className="text-xs text-neutral-400" title={new Date(p.createdAt).toISOString()}>
                        {timeAgo(p.createdAt)}
                      </span>
                      <span
                        className={cn(
                          "ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border",
                          p.type === "REVIEW"
                            ? "bg-yellow-500/10 border-yellow-400/30 text-yellow-300"
                            : "bg-sky-500/10 border-sky-400/30 text-sky-300"
                        )}
                      >
                        {p.type === "REVIEW" ? "Đánh giá" : "Tìm truyện"}
                      </span>
                    </div>
                    {p.type === "REVIEW" && (
                      <div className="mt-0.5 text-sm text-neutral-300 flex items-center gap-2">
                        <a href="#" className="hover:underline">
                          {p.comicTitle}
                        </a>
                        <span className="inline-flex items-center gap-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star key={i} className={cn("h-4 w-4", i < (p.rating || 0) ? "text-yellow-400 fill-current" : "text-neutral-600")} />
                          ))}
                        </span>
                      </div>
                    )}
                    {p.title && <div className="mt-1 font-semibold text-neutral-100">{p.title}</div>}
                  </div>
                  <button className="p-2 rounded-lg hover:bg-neutral-800" aria-label="More">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-4 pb-3">
                  <p className="text-neutral-200 whitespace-pre-wrap">{clampText(p.content, 420)}</p>
                </div>

                {/* Images */}
                {p.images?.length > 0 && (
                  <div className={cn("px-4 pb-3 grid gap-2", p.images.length >= 3 ? "grid-cols-3" : p.images.length === 2 ? "grid-cols-2" : "grid-cols-1")}
                  >
                    {p.images.map((src, i) => (
                      <button key={i} className="relative group" onClick={() => openViewer(p.images, i)} aria-label="Xem ảnh">
                        <img src={src} className="h-48 w-full object-cover rounded-xl border border-neutral-800" alt="post" />
                        <span className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/20 transition" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="px-4 pb-4">
                  <div className="flex items-center gap-3 text-sm">
                    <button
                      onClick={() => onToggleLike(p)}
                      className={cn(
                        "inline-flex items-center gap-1 px-3 py-1.5 rounded-full border",
                        p.hasLiked
                          ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
                          : "border-neutral-800 bg-neutral-900 hover:bg-neutral-800"
                      )}
                    >
                      <Heart className={cn("h-4 w-4", p.hasLiked ? "fill-current" : undefined)} /> {p.likes}
                    </button>

                    <button
                      onClick={() => toggleComments(p.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-neutral-800 bg-neutral-900 hover:bg-neutral-800"
                    >
                      <MessageCircle className="h-4 w-4" /> {p.commentsCount}
                    </button>

                    <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-neutral-800 bg-neutral-900 hover:bg-neutral-800">
                      <Bookmark className="h-4 w-4" /> Lưu
                    </button>

                    <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-neutral-800 bg-neutral-900 hover:bg-neutral-800">
                      <Share2 className="h-4 w-4" /> Chia sẻ
                    </button>
                  </div>
                </div>

                {/* Comments */}
                {openComments[p.id] && (
                  <div className="px-4 pb-4">
                    <div className="flex items-center gap-2">
                      <img src={USERS[0].avatarUrl} className="h-8 w-8 rounded-full" alt="me" />
                      <input
                        value={commentInputs[p.id] || ""}
                        onChange={(e) => setCommentInputs((s) => ({ ...s, [p.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") submitComment(p);
                        }}
                        placeholder="Viết bình luận…"
                        className="flex-1 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                      />
                      <button
                        onClick={() => submitComment(p)}
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        Gửi
                      </button>
                    </div>

                    <div className="mt-3 space-y-3">
                      {(commentLists[p.id] || []).map((c) => (
                        <div key={c.id} className="flex items-start gap-2">
                          <img src={c.author.avatarUrl} className="h-7 w-7 rounded-full" alt={c.author.name} />
                          <div className="flex-1">
                            <div className="text-sm">
                              <span className="font-medium">{c.author.name}</span>
                              <span className="ml-2 text-xs text-neutral-400" title={new Date(c.createdAt).toISOString()}>
                                {timeAgo(c.createdAt)}
                              </span>
                            </div>
                            <div className="text-neutral-200 whitespace-pre-wrap">{c.content}</div>
                          </div>
                        </div>
                      ))}

                      {commentLoading[p.id] && <CommentSkeleton />}

                      {commentPages[p.id] && (
                        <button
                          onClick={() => loadMoreComments(p.id)}
                          className="w-full text-center mt-1 px-3 py-2 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800"
                        >
                          Xem thêm bình luận
                        </button>
                      )}

                      {(!commentLists[p.id] || commentLists[p.id].length === 0) && !commentLoading[p.id] && (
                        <div className="text-sm text-neutral-500">Chưa có bình luận nào. Hãy là người đầu tiên!</div>
                      )}
                    </div>
                  </div>
                )}
              </article>
            ))}

            {/* Load more / Skeleton / Empty */}
            {loading && items.length === 0 && (
              <div className="space-y-4">
                <PostSkeleton />
                <PostSkeleton />
              </div>
            )}

            {!loading && items.length === 0 && (
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-10 text-center">
                <ImageIcon className="mx-auto h-10 w-10 text-neutral-700" />
                <div className="mt-2 font-medium">Không có bài viết phù hợp</div>
                <div className="text-sm text-neutral-500">Hãy thử thay đổi bộ lọc hoặc từ khoá.</div>
              </div>
            )}

            {hasMore && (
              <div className="pt-2">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="w-full px-4 py-2 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800"
                >
                  {loading ? "Đang tải…" : "Tải thêm"}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Right sidebar */}
        <aside className="lg:col-span-1">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
            <div className="font-semibold">Thể loại phổ biến</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {GENRES.map((g) => {
                const active = genres.includes(g);
                return (
                  <button
                    key={g}
                    onClick={() =>
                      setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]))
                    }
                    className={cn(
                      "px-3 py-1.5 rounded-full border text-sm",
                      active
                        ? "bg-neutral-200 text-neutral-900 border-neutral-300"
                        : "bg-neutral-900 border-neutral-800 hover:bg-neutral-800"
                    )}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
            {genres.length > 0 && (
              <button
                onClick={() => setGenres([])}
                className="mt-4 w-full px-3 py-2 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-sm"
              >
                Xoá bộ lọc thể loại
              </button>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
            <div className="font-semibold">Mẹo</div>
            <ul className="mt-2 list-disc list-inside text-sm text-neutral-400 space-y-1">
              <li>Dùng tab "Tìm truyện tương tự" để hỏi đề xuất theo thể loại.</li>
              <li>Giữ nội dung ngắn gọn, tập trung ý chính.</li>
              <li>Tối đa 5 ảnh/bài để tối ưu trải nghiệm.</li>
            </ul>
          </div>
        </aside>
      </main>

      {/* Image Viewer Modal */}
      {viewer.open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={closeViewer}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={viewer.images[viewer.index]} alt="viewer" className="w-full max-h-[80vh] object-contain rounded-xl" />
            <button
              className="absolute top-2 right-2 inline-flex items-center justify-center h-9 w-9 rounded-full bg-black/60"
              onClick={closeViewer}
              aria-label="Đóng"
            >
              <X className="h-5 w-5 text-white" />
            </button>
            <div className="absolute inset-y-0 left-0 flex items-center p-2">
              <button
                onClick={prevImg}
                className="h-10 w-10 rounded-full bg-black/60 text-white"
                aria-label="Ảnh trước"
              >
                ‹
              </button>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center p-2">
              <button
                onClick={nextImg}
                className="h-10 w-10 rounded-full bg-black/60 text-white"
                aria-label="Ảnh sau"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================
   Skeletons
========================== */

function PostSkeleton() {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-neutral-800" />
        <div className="flex-1">
          <div className="h-3 w-40 rounded bg-neutral-800" />
          <div className="mt-2 h-3 w-24 rounded bg-neutral-800" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-neutral-800" />
        <div className="h-3 w-11/12 rounded bg-neutral-800" />
        <div className="h-3 w-10/12 rounded bg-neutral-800" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="h-28 rounded-xl bg-neutral-800" />
        <div className="h-28 rounded-xl bg-neutral-800" />
        <div className="h-28 rounded-xl bg-neutral-800" />
      </div>
      <div className="mt-4 h-9 w-40 rounded-full bg-neutral-800" />
    </div>
  );
}

function CommentSkeleton() {
  return (
    <div className="flex items-start gap-2 animate-pulse">
      <div className="h-7 w-7 rounded-full bg-neutral-800" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-40 rounded bg-neutral-800" />
        <div className="h-3 w-3/4 rounded bg-neutral-800" />
      </div>
    </div>
  );
}
