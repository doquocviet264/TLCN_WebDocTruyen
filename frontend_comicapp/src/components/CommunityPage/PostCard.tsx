import React, { useState, useEffect } from "react";
import axios from "axios";
import { clampText, cn, timeAgo } from "./utils";
import {
  Heart,
  MessageCircle,
  Star,
  X,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
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

/** ================== Types ================== */
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
  type: PostType;
  author: PostAuthor;

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

  images: PostImage[];
  genres: Array<{ genreId?: number; name?: string }> | [];

  likesCount: number;
  hasLiked?: boolean;
  commentsCount?: number; // Optional type causes the error
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
  onPostUpdate: (
    updatedPost: Partial<PostCardData> & { postId: number }
  ) => void;
  currentUser?: UserLite;
}

const POST_REPORT_TYPE_LABELS: Record<string, string> = {
  spam: "Spam / Quảng cáo",
  inappropriate: "Nội dung phản cảm",
  fake: "Thông tin sai lệch",
  harassment: "Quấy rối / xúc phạm",
  other: "Khác",
};

async function toggleLikeApi(postId: number, hasLiked: boolean) {
  const token = localStorage.getItem("token");
  if (!token) {
    toast.error("Bạn cần đăng nhập để thích bài viết.");
    return Promise.reject("Unauthorized");
  }

  const url = `${import.meta.env.VITE_API_URL}/community/posts/${postId}/like`;
  const config = { headers: { Authorization: `Bearer ${token}` } };

  try {
    const res = hasLiked
      ? await axios.delete<{ success?: boolean; data?: any }>(url, config)
      : await axios.post<{ success?: boolean; data?: any }>(url, {}, config);
      
    return res.data?.data ?? res.data ?? {};
  } catch (error) {
    throw error;
  }
}

function computeStarScore(p: PostCardData): number {
  if (p.avgRating != null) {
    const v = parseFloat(String(p.avgRating));
    if (Number.isFinite(v)) return Math.max(0, Math.min(5, v));
  }
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

const RATING_LABEL: Record<string, string> = {
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
          className={cn(
            "h-4 w-4",
            i < rounded ? "text-yellow-400 fill-current" : "text-neutral-600"
          )}
        />
      ))}
    </span>
  );
}

export function PostCard({ post, onPostUpdate, currentUser }: Props) {
  const [localPost, setLocalPost] = useState<PostCardData>(post);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [viewer, setViewer] = useState<{ open: boolean; index: number }>({
    open: false,
    index: 0,
  });

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportType, setReportType] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

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

  const onToggleLike = async () => {
    const old = localPost;
    const nextHasLiked = !Boolean(old.hasLiked);
    const nextLikes = (old.likesCount ?? 0) + (nextHasLiked ? 1 : -1);

    const optimistic = {
      ...old,
      hasLiked: nextHasLiked,
      likesCount: nextLikes,
    };
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
      onPostUpdate({
        postId: old.postId,
        hasLiked: merged.hasLiked,
        likesCount: merged.likesCount,
      });
    } catch (e: any) {
      setLocalPost(old);
      if (e !== "Unauthorized") {
         const msg = e?.response?.data?.error?.message || e?.message || "Không thể thả tim. Thử lại!";
         toast.error(msg);
      }
    }
  };

  const openViewer = (index: number) => setViewer({ open: true, index });
  const closeViewer = () => setViewer({ open: false, index: 0 });

  const onCommentSubmitted = () => {
    setLocalPost((p) => ({ ...p, commentsCount: (p.commentsCount ?? 0) + 1 }));
    onPostUpdate({
      postId: localPost.postId,
      commentsCount: (localPost.commentsCount ?? 0) + 1, // ✅ FIX: commentsCount ?? 0
    });
  };

  const starScore = localPost.type === "review" ? computeStarScore(localPost) : 0;

  const normalizedImages = (localPost.images || [])
    .map((img: any) => (typeof img === "string" ? img : img?.imageUrl))
    .filter(Boolean) as string[];

  const gridClass =
    normalizedImages.length >= 3
      ? "grid-cols-3"
      : normalizedImages.length === 2
      ? "grid-cols-2"
      : "grid-cols-1";

  const handleReportOpenChange = (open: boolean) => {
    if (!open) {
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
        `${import.meta.env.VITE_API_URL}/reports`,
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
      const msg = err?.response?.data?.message || err?.message || "Gửi báo cáo thất bại.";
      toast.error(msg);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <>
      <Card className="shadow-xl overflow-hidden mb-4">
        {/* Header */}
        <CardHeader className="p-4 flex flex-row items-start gap-3 space-y-0">
          <Avatar className="h-10 w-10 shrink-0 cursor-pointer">
            <AvatarImage
              src={localPost.author.avatar ?? undefined}
              alt={localPost.author.username}
            />
            <AvatarFallback>
              {(localPost.author.username || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm truncate cursor-pointer hover:underline">
                {localPost.author.username}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span
                className="text-xs text-muted-foreground shrink-0"
                title={new Date(localPost.createdAt).toLocaleString()}
                >
                {timeAgo(localPost.createdAt)}
                </span>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
                 <Badge variant="secondary" className="shrink-0 text-[10px] font-normal h-5 px-1.5">
                    {localPost.type === "review" ? "Review" : "Tìm truyện"}
                 </Badge>
                 {!!localPost.title && (
                    <span className="font-medium text-sm truncate max-w-full">
                        {localPost.title}
                    </span>
                 )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={() => setIsReportOpen(true)}
              >
                Báo cáo bài viết
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        {/* Content */}
        <CardContent className="px-4 pb-3 pt-0">
          {localPost.type === "review" && (
            <div className="mb-4 bg-secondary/20 rounded-lg p-3 border border-border/50">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/50">
                <div className="flex items-center gap-2 overflow-hidden">
                    {!!localPost.comic?.title ? (
                    <Link
                        to={localPost.comic?.slug ? `/truyen-tranh/${localPost.comic.slug}` : "#"}
                        className="font-semibold text-sm hover:underline truncate text-primary"
                    >
                        {localPost.comic.title}
                    </Link>
                    ) : (
                        <span className="text-sm italic text-muted-foreground">Truyện chưa cập nhật</span>
                    )}
                </div>
                
                <div className="flex items-center gap-1 shrink-0 bg-background/80 px-2 py-1 rounded-md shadow-sm border border-border/50">
                    <span className="font-bold text-sm">{(Math.round(starScore * 10) / 10).toFixed(1)}</span>
                    <Star className="h-3.5 w-3.5 text-yellow-500 fill-current" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {Object.entries(RATING_LABEL).map(([key, label]) => {
                    const val = (localPost as any)[key] ?? 0;
                    return (
                        <div key={key} className="flex items-center justify-between group">
                            <span className="text-muted-foreground">{label}</span>
                            <div className="flex items-center gap-1.5">
                                <RatingStars value={val} />
                            </div>
                        </div>
                    )
                })}
              </div>
            </div>
          )}

          <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 mb-3 break-words">
            {clampText(localPost.content, 420)}
          </div>

          {normalizedImages.length > 0 && (
            <div
              className={cn(
                "grid gap-1.5 rounded-lg overflow-hidden mt-2",
                gridClass,
                normalizedImages.length === 1 ? "max-w-md" : "w-full"
              )}
            >
              {normalizedImages.map((src, i) => (
                <div
                  key={i}
                  className="relative group cursor-pointer bg-muted aspect-[4/3] overflow-hidden"
                  onClick={() => openViewer(i)}
                >
                  <img
                    src={src}
                    alt={`post-img-${i}`}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
              ))}
            </div>
          )}
          
          {localPost.genres && localPost.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                  {localPost.genres.map((g, idx) => (
                      <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded border border-border/50">
                          #{g.name}
                      </span>
                  ))}
              </div>
          )}
        </CardContent>

        {/* Footer Actions */}
        <CardFooter className="px-2 py-2 border-t bg-muted/30 flex items-center justify-between">
            <div className="flex gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleLike}
                    className={cn(
                    "gap-1.5 h-9 px-3 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors",
                    localPost.hasLiked && "text-red-500 hover:text-red-600"
                    )}
                >
                    <Heart
                    className={cn(
                        "h-4 w-4 transition-transform active:scale-75",
                        localPost.hasLiked && "fill-current"
                    )}
                    />
                    <span className="text-xs font-medium">{localPost.likesCount > 0 ? localPost.likesCount : "Thích"}</span>
                </Button>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCommentsOpen((v) => !v)}
                    className="gap-1.5 h-9 px-3 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-colors"
                >
                    <MessageCircle className="h-4 w-4" />
                    {/* ✅ FIX: Thêm (localPost.commentsCount ?? 0) để tránh lỗi undefined */}
                    <span className="text-xs font-medium">
                      {(localPost.commentsCount ?? 0) > 0 ? localPost.commentsCount : "Bình luận"}
                    </span>
                </Button>
            </div>
        </CardFooter>

        {isCommentsOpen && (
          <div className="px-4 pb-4 bg-muted/10 border-t border-border/50 animate-in slide-in-from-top-2">
            <div className="pt-4">
                <PostComments
                postId={localPost.postId}
                currentUser={me}
                onCommentSubmitted={onCommentSubmitted}
                />
            </div>
          </div>
        )}
      </Card>

      {/* Report & Viewer Modals */}
      <Dialog open={isReportOpen} onOpenChange={handleReportOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Báo cáo bài viết</DialogTitle>
            <DialogDescription>
              Giúp chúng tôi hiểu vấn đề với bài viết này.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <label htmlFor="post-report-type" className="text-sm font-medium">Lý do</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="post-report-type"><SelectValue placeholder="Chọn lý do..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Spam / Quảng cáo</SelectItem>
                  <SelectItem value="inappropriate">Nội dung phản cảm</SelectItem>
                  <SelectItem value="fake">Thông tin sai lệch</SelectItem>
                  <SelectItem value="harassment">Quấy rối / xúc phạm</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="post-report-details" className="text-sm font-medium">Chi tiết</label>
              <Textarea
                id="post-report-details"
                placeholder="Mô tả cụ thể..."
                className="min-h-[80px]"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Hủy</Button></DialogClose>
            <Button type="submit" onClick={handleSubmitReport} disabled={isSubmittingReport}>
              {isSubmittingReport && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gửi báo cáo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImageViewer
        images={normalizedImages}
        open={viewer.open}
        startIndex={viewer.index}
        onClose={closeViewer}
      />
    </>
  );
}

function ImageViewer({ images, open, startIndex, onClose }: { images: string[]; open: boolean; startIndex: number; onClose: () => void; }) {
  const [index, setIndex] = useState(startIndex);
  useEffect(() => { setIndex(startIndex); }, [open, startIndex]);

  useEffect(() => {
      if (!open) return;
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === "ArrowLeft") prevImg();
          if (e.key === "ArrowRight") nextImg();
          if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, index, images.length]);

  const prevImg = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const nextImg = () => setIndex((i) => (i + 1) % images.length);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-transparent border-none shadow-none max-w-[95vw] h-[95vh] p-0 flex items-center justify-center focus:outline-none" onInteractOutside={onClose}>
        <div className="relative w-full h-full flex items-center justify-center">
          <img src={images[index]} alt={`viewer-${index}`} className="max-w-full max-h-full object-contain rounded-md shadow-2xl" />
          <Button variant="secondary" size="icon" className="absolute top-4 right-4 rounded-full bg-black/50 hover:bg-black/70 text-white border-none z-50" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
          {images.length > 1 && (
            <>
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); prevImg(); }} className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/30 hover:bg-black/60 text-white z-10"><span className="text-2xl pb-1">‹</span></Button>
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); nextImg(); }} className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/30 hover:bg-black/60 text-white z-10"><span className="text-2xl pb-1">›</span></Button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm">{index + 1} / {images.length}</div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}