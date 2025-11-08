import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { AlertTriangle, Image as ImageIcon } from "lucide-react";
import { PostCard } from "./PostCard";
import { PostSkeleton } from "./PostSkeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** ===== Types ===== */
type PostType = "review" | "find_similar";
type PostTypeOrAll = PostType | "all";
export type SortUI = "NEW" | "TOP_LIKES" | "TOP_COMMENTS";

export type FetchPostParams = {
  page: number;
  q?: string;
  type?: PostTypeOrAll;
  sort?: SortUI;
  genres?: string[]; // tên thể loại từ Sidebar
  pageSize?: number;
};

// FeedRespItem khớp dữ liệu BE
export type FeedRespItem = {
  postId: number;
  userId: number;

  type: PostType;

  ratingStoryLine?: number | null;
  ratingCharacters?: number | null;
  ratingArt?: number | null;
  ratingEmotion?: number | null;
  ratingCreativity?: number | null;

  avgRating?: string | null;

  title?: string | null;
  content: string;

  comicId?: number | null;
  comic?: {
    comicId: number;
    author?: string | null;
    title?: string | null;
    slug?: string | null;
    coverImage?: string | null;
    description?: string | null;
    status?: string | null;
    createdAt?: string;
    updatedAt?: string;
  } | null;

  author: {
    userId: number;
    username: string;
    avatar?: string | null;
  };

  images:
    | Array<{
        postimageId?: number;
        postId?: number;
        imageUrl: string;
        imageNumber?: number;
        createdAt?: string;
      }>
    | string[];

  genres: Array<{
    genreId?: number;
    name?: string;
  }> | [];

  likesCount: number;
  hasLiked?: boolean;
  commentsCount?: number;

  createdAt: string;
  updatedAt: string;
};

type ListApiOk = {
  success: true;
  data: FeedRespItem[]; // mảng trực tiếp
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    sort?: "new" | "old" | "top" | "hot";
    [k: string]: any;
  };
};

/** ===== Props ===== */
type Props = {
  filters: Omit<FetchPostParams, "page">;
  refreshKey: number;
  sort: SortUI;
  setSort: (sort: SortUI) => void;
  type: PostTypeOrAll;
  setType: (type: PostTypeOrAll) => void;
  apiBase: string;
  genreNameToId: Record<string, number>; // ✅ để convert tên -> id
};

/** ===== Helpers ===== */
function authConfig() {
  const token = localStorage.getItem("token");
  return {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  } as const;
}

// Map UI sort -> BE sort
const mapSortToApi = (s?: SortUI) => {
  if (!s || s === "NEW") return "new";
  if (s === "TOP_LIKES") return "top";
  if (s === "TOP_COMMENTS") return "hot"; // ✅ dùng hot cho "nổi nhất nhiều comment"
  return "new";
};

// Có thể tránh trùng post khi loadMore
function uniqByPostId(list: FeedRespItem[]): FeedRespItem[] {
  const seen = new Set<number>();
  const out: FeedRespItem[] = [];
  for (const it of list) {
    if (!seen.has(it.postId)) {
      seen.add(it.postId);
      out.push(it);
    }
  }
  return out;
}

/** ===== Component ===== */
export function CommunityFeed({
  filters,
  refreshKey,
  sort,
  setSort,
  type,
  setType,
  apiBase,
  genreNameToId,
}: Props) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<FeedRespItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadRef = useRef(false);

  // ===== Fetch posts (đúng shape BE bạn cung cấp) =====
  const fetchPosts = async (params: FetchPostParams) => {
    const { page, q, type, sort, genres, pageSize } = params;
    const apiSort = mapSortToApi(sort);
    const apiType = type && type !== "all" ? type : undefined;
    const limit = pageSize || 12;

    // ✅ convert tên -> id -> "1,2,3"
    const genreIds =
      genres && genres.length
        ? genres
            .map((name) => genreNameToId[name])
            .filter((id): id is number => Number.isInteger(id) && id > 0)
            .join(",")
        : undefined;

    // Nếu user chọn "nhiều bình luận" (hot) mà BE cần cửa sổ thời gian thì gửi mặc định 30 ngày
    const extraParams =
      apiSort === "hot"
        ? { lastDays: 30 } // có thể cho user chọn lastDays tuỳ UI
        : {};

    const resp = await axios.get<ListApiOk | any>(`${apiBase}/community/posts`, {
      ...authConfig(),
      params: {
        page: page || 1,
        limit,
        q: q || undefined,
        type: apiType,      // "review" | "find_similar" | undefined
        sort: apiSort,      // "new" | "old" | "top" | "hot"
        genreIds,           // ✅ BE expects "1,2,3"
        genreMode: "any",   // hoặc "all" nếu bạn muốn
        ...extraParams,
      },
    });

    const body = resp.data;
    // Theo BE: { success: true, data: FeedRespItem[], meta: {...} }
    if (body?.success === true && Array.isArray(body?.data)) {
      const arr = body.data as FeedRespItem[];
      const meta = body.meta ?? {};
      const hasMoreByMeta =
        typeof meta.page === "number" && typeof meta.pages === "number"
          ? meta.page < meta.pages
          : arr.length >= limit;
      return { items: arr, hasMore: hasMoreByMeta, meta };
    }

    // Fallback nếu có gì đó lệch
    if (Array.isArray(body)) {
      return { items: body as FeedRespItem[], hasMore: (body as any[]).length >= limit, meta: {} };
    }

    return { items: [] as FeedRespItem[], hasMore: false, meta: {} };
  };

  const loadFeed = async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;
      const { items: data, hasMore } = await fetchPosts({
        ...filters,
        page: currentPage,
        sort,
      });

      setHasMore(Boolean(hasMore));
      setItems((prev) => {
        const next = reset ? data : [...prev, ...data];
        return uniqByPostId(next);
      });
      if (reset) setPage(1);
      setError(null);
    } catch (e: any) {
      const msg =
        e?.response?.data?.error?.message ||
        e?.message ||
        "Lỗi tải bài viết. Vui lòng thử lại.";
      setError(msg);
      setHasMore(false);
      if (reset) setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce khi filter đổi + khi composer tạo bài mới (refreshKey)
  useEffect(() => {
    const handler = setTimeout(() => {
      loadFeed(true);
    }, 400);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q, filters.type, filters.sort, filters.genres, refreshKey, genreNameToId]);

  // Load lần đầu
  useEffect(() => {
    if (!loadRef.current) {
      loadFeed(true);
      loadRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = async () => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    try {
      setLoading(true);
      const { items: data, hasMore } = await fetchPosts({
        ...filters,
        page: nextPage,
        sort,
      });
      setHasMore(Boolean(hasMore));
      setItems((prev) => uniqByPostId([...prev, ...data]));
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message || e?.message || "Lỗi tải thêm bài viết.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Đồng bộ cập nhật 1 bài trong danh sách
  const onPostUpdate = (updated: Partial<FeedRespItem> & { postId: number }) => {
    setItems((prev) => prev.map((p) => (p.postId === updated.postId ? { ...p, ...updated } : p)));
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filter row (Type/Sort) */}
      <div className="flex flex-wrap items-center gap-2">
        {(["all", "review", "find_similar"] as const).map((t) => (
          <Button
            key={t}
            variant={type === t ? "secondary" : "outline"}
            size="sm"
            onClick={() => setType(t)}
          >
            {t === "all" ? "Tất cả" : t === "review" ? "Đánh giá" : "Tìm truyện"}
          </Button>
        ))}

        {/* Sort */}
        <div className="ml-auto flex items-center gap-2 text-sm">
          <span>Sắp xếp:</span>
          <Select value={sort} onValueChange={(v) => setSort(v as SortUI)}>
            <SelectTrigger className="w-auto">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NEW">Mới nhất</SelectItem>
              <SelectItem value="TOP_LIKES">Nổi bật</SelectItem>
              <SelectItem value="TOP_COMMENTS">Nhiều bình luận</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Feed list */}
      {items.map((p) => (
        <PostCard key={p.postId} post={p as any} onPostUpdate={onPostUpdate} />
      ))}

      {/* Load more / Skeleton / Empty */}
      {loading && items.length === 0 && (
        <div className="space-y-4">
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}

      {!loading && items.length === 0 && (
        <Card className="rounded-2xl text-center p-6">
          <ImageIcon className="mx-auto h-10 w-10" />
          <div className="mt-2 font-medium">Không có bài viết phù hợp</div>
          <div className="text-sm">Hãy thử thay đổi bộ lọc hoặc từ khoá.</div>
        </Card>
      )}

      {hasMore && (
        <div className="pt-2">
          <Button variant="outline" onClick={loadMore} disabled={loading} className="w-full">
            {loading ? "Đang tải…" : "Tải thêm"}
          </Button>
        </div>
      )}
    </div>
  );
}
