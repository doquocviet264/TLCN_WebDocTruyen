import React, { useState, useEffect } from "react";
import axios from "axios";
import { clampText, cn, timeAgo } from "./utils";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Star,
  X,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import PostComments from "./PostComments";

/** ================== Types khớp với backend (FeedRespItem) ================== */
type PostType = "review" | "find_similar";

type PostImage = {
  postimageId?: number;
  postId?: number;
  imageUrl: string;
  imageNumber?: number;
  createdAt?: string;
};

type PostAuthor = {
  userId: number;
  username: string;
  avatar?: string | null;
};

type PostComic = {
  comicId: number;
  author?: string | null;
  title?: string | null;
  slug?: string | null;
  coverImage?: string | null;
  description?: string | null;
  status?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type PostCardData = {
  postId: number;
  type: PostType; // chữ thường
  author: PostAuthor;

  // review-specific fields
  ratingStoryLine?: number | null;
  ratingCharacters?: number | null;
  ratingArt?: number | null;
  ratingEmotion?: number | null;
  ratingCreativity?: number | null;
  avgRating?: string | null;

  title?: string | null;
  content: string;

  comicId?: number | null;
  comic?: PostComic | null;

  images: PostImage[]; // { imageUrl }
  genres: Array<{ genreId?: number; name?: string }> | [];

  likesCount: number;
  hasLiked?: boolean; // BE có thể không trả, để optional
  commentsCount?: number;
  createdAt: string;
  updatedAt: string;
};

type UserLite = {
  id: number;
  name: string;
  avatarUrl?: string;
};

interface Props {
  post: PostCardData;
  onPostUpdate: (updatedPost: Partial<PostCardData> & { postId: number }) => void;
  currentUser?: UserLite;
}

/** ================== API config ================== */
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";
function authConfig() {
  const token = localStorage.getItem("token");
  return {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  } as const;
}

/** Loại báo cáo cho post (giống comment) */
const POST_REPORT_TYPE_LABELS: Record<string, string> = {
  spam: "Spam / Quảng cáo",
  inappropriate: "Nội dung phản cảm",
  fake: "Thông tin sai lệch",
  harassment: "Quấy rối / xúc phạm",
  other: "Khác",
};

/** Toggle like: BE nên trả lại { hasLiked, likesCount } hoặc full post */
async function toggleLikeApi(postId: number, hasLiked: boolean) {
  const url = `${API_BASE}/community/posts/${postId}/like`;
  const config = authConfig();

  let res;
  if (hasLiked) {
    // Unlike
    res = await axios.delete<{ success?: boolean; data?: any }>(url, config);
  } else {
    // Like
    res = await axios.post<{ success?: boolean; data?: any }>(url, null, config);
  }

  return res.data?.data ?? res.data ?? {};
}

/** Tính điểm trung bình hiển thị sao nếu là review */
function computeStarScore(p: PostCardData): number {
  // Ưu tiên avgRating (string) nếu có
  if (p.avgRating != null) {
    const v = parseFloat(String(p.avgRating));
    if (Number.isFinite(v)) return Math.max(0, Math.min(5, v));
  }
  // Nếu không có avgRating thì lấy trung bình 5 tiêu chí có giá trị
  const nums = [
    p.ratingStoryLine,
    p.ratingCharacters,
    p.ratingArt,
    p.ratingEmotion,
    p.ratingCreativity,
  ].filter((x): x is number => typeof x === "number");
  if (!nums.length) return 0;
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  return Math.max(0, Math.min(5, avg));
}

/** ====== Labels & helpers cho 5 tiêu chí ====== */
const RATING_LABEL: Record<
  "ratingStoryLine" | "ratingCharacters" | "ratingArt" | "ratingEmotion" | "ratingCreativity",
  string
> = {
  ratingStoryLine: "Cốt truyện",
  ratingCharacters: "Nhân vật",
  ratingArt: "Hình ảnh",
  ratingEmotion: "Cảm xúc",
  ratingCreativity: "Sáng tạo",
};

function RatingStars({ value }: { value: number }) {
  const rounded = Math.round(value || 0);
  return (
    <span className="inline-flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn("h-4 w-4", i < rounded ? "text-yellow-400 fill-current" : "text-neutral-600")}
        />
      ))}
    </span>
  );
}

export function PostCard({ post, onPostUpdate, currentUser }: Props) {
  const [localPost, setLocalPost] = useState<PostCardData>(post);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [viewer, setViewer] = useState<{ open: boolean; index: number }>({ open: false, index: 0 });

  // Report dialog state
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportType, setReportType] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Fallback currentUser nếu không truyền từ cha
  const [me, setMe] = useState<UserLite>(() => {
    if (currentUser) return currentUser;
    return { id: 0, name: "Bạn", avatarUrl: undefined };
  });

  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  useEffect(() => {
    if (currentUser) {
      setMe(currentUser);
    }
  }, [currentUser]);

  /** Like (optimistic) */
  const onToggleLike = async () => {
    const old = localPost;
    const nextHasLiked = !Boolean(old.hasLiked);
    const nextLikes = (old.likesCount ?? 0) + (nextHasLiked ? 1 : -1);

    const optimistic = { ...old, hasLiked: nextHasLiked, likesCount: nextLikes };
    setLocalPost(optimistic);

    try {
      const updated = await toggleLikeApi(old.postId, old.hasLiked || false);
      const merged: PostCardData = {
        ...optimistic,
        ...("hasLiked" in updated ? { hasLiked: updated.hasLiked } : {}),
        ...("likesCount" in updated ? { likesCount: updated.likesCount } : {}),
        ...updated,
      };
      setLocalPost(merged);
      onPostUpdate({ postId: old.postId, hasLiked: merged.hasLiked, likesCount: merged.likesCount });
    } catch (e: any) {
      setLocalPost(old);
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        toast.error("Bạn cần đăng nhập để thích bài viết.");
      } else {
        toast.error(e?.response?.data?.error?.message || e?.message || "Không thể thả tim. Thử lại!");
      }
    }
  };

  const openViewer = (index: number) => setViewer({ open: true, index });
  const closeViewer = () => setViewer({ open: false, index: 0 });

  const onCommentSubmitted = () => {
    setLocalPost((p) => ({ ...p, commentsCount: (p.commentsCount ?? 0) + 1 }));
    onPostUpdate({ postId: localPost.postId, commentsCount: (localPost.commentsCount ?? 0) + 1 });
  };

  const starScore = localPost.type === "review" ? computeStarScore(localPost) : 0;

  // Chuẩn hoá ảnh (nếu backend có lúc trả string[])
  const normalizedImages = (localPost.images || [])
    .map((img: any) => (typeof img === "string" ? img : img?.imageUrl))
    .filter(Boolean) as string[];

  /** ====== helper: class cho grid ảnh ====== */
  const gridClass =
    normalizedImages.length >= 3
      ? "grid-cols-3"
      : normalizedImages.length === 2
      ? "grid-cols-2"
      : "grid-cols-1";

  /** ====== Report Dialog handlers ====== */
  const handleReportOpenChange = (open: boolean) => {
    if (!open) {
      // reset state khi đóng
      setReportType("");
      setReportDetails("");
    }
    setIsReportOpen(open);
  };

  const handleSubmitReport = async () => {
    if (!reportType) {
      toast.error("Vui lòng chọn loại báo cáo.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Bạn cần đăng nhập để gửi báo cáo.");
      return;
    }

    try {
      setIsSubmittingReport(true);

      const title = `Báo cáo bài viết #${localPost.postId} - ${
        POST_REPORT_TYPE_LABELS[reportType] || "Báo cáo"
      }`;

      await axios.post(
        `${API_BASE}/reports`,
        {
          title,
          description: reportDetails?.trim() || "(Không có mô tả bổ sung)",
          type: "post",
          targetId: localPost.postId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Cảm ơn bạn đã gửi báo cáo!");
      handleReportOpenChange(false);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Gửi báo cáo thất bại, vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <>
      <Card className="shadow-xl overflow-hidden">
        {/* Header: avatar + tên + thời gian + loại + tiêu đề + dấu 3 chấm */}
        <CardHeader className="p-4 flex items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={localPost.author.avatar ?? undefined} alt={localPost.author.username} />
            <AvatarFallback>{(localPost.author.username || "U").charAt(0)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className="font-medium shrink-0 truncate">{localPost.author.username}</span>

            <span
              className="text-xs opacity-70 shrink-0"
              title={new Date(localPost.createdAt).toISOString()}
            >
              {timeAgo(localPost.createdAt)}
            </span>

            <Badge variant="outline" className="shrink-0">
              {localPost.type === "review" ? "Đánh giá" : "Tìm truyện"}
            </Badge>

            {!!localPost.title && (
              <span className="font-semibold truncate">• {localPost.title}</span>
            )}
          </div>

          {/* Dấu 3 chấm + menu Báo cáo */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setIsReportOpen(true)}
              >
                Báo cáo bài viết
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        {/* Content */}
        <CardContent className="px-4 pb-3">
          {/* Nếu là review: đặt phần tổng quan & tiêu chí dưới header */}
          {localPost.type === "review" && (
            <>
              {/* Dòng tổng quan: tên comic + sao trung bình */}
              <div className="text-sm flex items-center gap-2">
                {!!localPost.comic?.title && (
                  <Link
                    to={localPost.comic?.slug ? `/truyen-tranh/${localPost.comic.slug}` : "#"}
                    className="hover:underline"
                  >
                    {localPost.comic.title}
                  </Link>
                )}
                <span className="inline-flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < Math.round(starScore) ? "text-yellow-400 fill-current" : "text-neutral-600"
                      )}
                    />
                  ))}
                </span>
                <span className="text-xs opacity-70">
                  ({(Math.round(starScore * 100) / 100).toFixed(2)}/5)
                </span>
              </div>

              {/* Bảng 5 tiêu chí */}
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-20 opacity-80">{RATING_LABEL.ratingStoryLine}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <RatingStars value={localPost.ratingStoryLine ?? 0} />
                    <span className="text-xs opacity-70">{localPost.ratingStoryLine ?? 0}/5</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-20 opacity-80">{RATING_LABEL.ratingCharacters}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <RatingStars value={localPost.ratingCharacters ?? 0} />
                    <span className="text-xs opacity-70">{localPost.ratingCharacters ?? 0}/5</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-20 opacity-80">{RATING_LABEL.ratingArt}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <RatingStars value={localPost.ratingArt ?? 0} />
                    <span className="text-xs opacity-70">{localPost.ratingArt ?? 0}/5</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-20 opacity-80">{RATING_LABEL.ratingEmotion}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <RatingStars value={localPost.ratingEmotion ?? 0} />
                    <span className="text-xs opacity-70">{localPost.ratingEmotion ?? 0}/5</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:col-span-2">
                  <span className="w-20 opacity-80">{RATING_LABEL.ratingCreativity}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <RatingStars value={localPost.ratingCreativity ?? 0} />
                    <span className="text-xs opacity-70 w-8 text-right">
                      {localPost.ratingCreativity ?? 0}/5
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Nội dung text */}
          <p className="mt-3 whitespace-pre-wrap">{clampText(localPost.content, 420)}</p>

          {/* ===== Images (khung cố định) ===== */}
          {normalizedImages.length > 0 && (
            <div
              className={cn(
                "mt-3 grid gap-2",
                gridClass,
                normalizedImages.length === 1 ? "max-w-[520px] mx-auto" : ""
              )}
            >
              {normalizedImages.map((src, i) => (
                <button
                  key={i}
                  className="relative group overflow-hidden rounded-xl border bg-muted h-56 sm:h-64"
                  onClick={() => openViewer(i)}
                  aria-label="Xem ảnh"
                >
                  <img
                    src={src}
                    alt="post"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </button>
              ))}
            </div>
          )}
        </CardContent>

        {/* Actions */}
        <CardFooter className="p-4 flex items-center gap-3 text-sm">
          <Button variant="outline" size="sm" onClick={onToggleLike} className="gap-1">
            <Heart className={cn("h-4 w-4", localPost.hasLiked ? "fill-current" : "")} />
            {localPost.likesCount ?? 0}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCommentsOpen((v) => !v)}
            className="gap-1"
          >
            <MessageCircle className="h-4 w-4" />
            {localPost.commentsCount ?? 0}
          </Button>
        </CardFooter>

        {/* Comments Section */}
        {isCommentsOpen && (
          <div className="px-4 pb-4 border-t pt-4">
            <PostComments
              postId={localPost.postId}
              currentUser={me}
              onCommentSubmitted={onCommentSubmitted}
            />
          </div>
        )}
      </Card>

      {/* Report Post Dialog */}
      <Dialog open={isReportOpen} onOpenChange={handleReportOpenChange}>
        <DialogContent className="sm:max-w-[425px] bg-muted text-foreground">
          <DialogHeader>
            <DialogTitle>Báo cáo bài viết</DialogTitle>
            <DialogDescription>
              Nếu bạn thấy bài viết này có vấn đề, hãy chọn loại và mô tả chi tiết để chúng tôi kiểm tra.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="post-report-type" className="text-right text-sm font-medium">
                Loại báo cáo
              </label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="post-report-type" className="col-span-3">
                  <SelectValue placeholder="Chọn loại..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Spam / Quảng cáo</SelectItem>
                  <SelectItem value="inappropriate">Nội dung phản cảm</SelectItem>
                  <SelectItem value="fake">Thông tin sai lệch</SelectItem>
                  <SelectItem value="harassment">Quấy rối / xúc phạm</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="post-report-details" className="text-right text-sm font-medium">
                Chi tiết
              </label>
              <Textarea
                id="post-report-details"
                placeholder="Mô tả thêm về vấn đề bạn gặp phải..."
                className="col-span-3 min-h-[100px]"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Hủy
              </Button>
            </DialogClose>
            <Button type="submit" onClick={handleSubmitReport} disabled={isSubmittingReport}>
              {isSubmittingReport && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmittingReport ? "Đang gửi..." : "Gửi báo cáo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Modal */}
      <ImageViewer
        images={normalizedImages}
        open={viewer.open}
        startIndex={viewer.index}
        onClose={closeViewer}
      />
    </>
  );
}

/** ================== Image Viewer ================== */
function ImageViewer({
  images,
  open,
  startIndex,
  onClose,
}: {
  images: string[];
  open: boolean;
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    setIndex(startIndex);
  }, [open, startIndex]);

  const prevImg = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const nextImg = () => setIndex((i) => (i + 1) % images.length);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="bg-transparent border-none shadow-none max-w-4xl p-0"
        onInteractOutside={onClose}
      >
        <div className="relative">
          <img
            src={images[index]}
            alt="viewer"
            className="w-full max-h-[80vh] object-contain rounded-xl"
          />
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 rounded-full h-9 w-9"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </Button>
          {images.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                onClick={prevImg}
                className="absolute inset-y-0 left-2 my-auto h-10 w-10 rounded-full"
                aria-label="Ảnh trước"
              >
                ‹
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={nextImg}
                className="absolute inset-y-0 right-2 my-auto h-10 w-10 rounded-full"
                aria-label="Ảnh sau"
              >
                ›
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
