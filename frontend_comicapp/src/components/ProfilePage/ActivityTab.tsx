import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Heart, MessageCircle } from "lucide-react";

interface Comic {
  id: number
  title: string
  cover: string
  status: string
  lastReadChapter: number
  lastChapterNumber: number
  lastRead: string
}

interface CommentItem {
  id: string | number;
  content: string;
  comicTitle: string;
  comicSlug?: string;
  chapterTitle?: string | null;
  chapterUrl?: string | null;
  timestampISO: string;
}

interface ActivityData {
  readingList: Comic[];
  favoriteComics: Comic[];
  commentHistory: CommentItem[]; 
}

type ApiOk<T> = { success: true; data: T; meta?: unknown };
type ApiErr = { success: false; error: { message: string; code: string; status: number } };

export function ProfileActivityTab() {
  const [activityData, setActivityData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // comment expand
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserActivity = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Bạn chưa đăng nhập.");
          setLoading(false);
          return;
        }

        const res = await axios.get<ApiOk<ActivityData> | ApiErr>(
          `${import.meta.env.VITE_API_URL}/user/activity`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if ((res.data as ApiOk<ActivityData>).success) {
          const data = (res.data as ApiOk<ActivityData>).data;
          setActivityData(data);
          // khởi tạo 5 comment đầu từ activity
          setComments(data.commentHistory ?? []);
          // mặc định cho phép “Xem thêm”
          setHasMoreComments(true);
        } else {
          const err = res.data as ApiErr;
          const msg = err.error?.message || "Không thể lấy dữ liệu hoạt động.";
          setError(msg);
          toast.error(msg);
        }
      } catch (err: any) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          localStorage.removeItem("token");
          navigate(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
        } else {
          const msg =
            err?.response?.data?.error?.message ||
            err?.response?.data?.message ||
            err?.message ||
            "Không thể lấy dữ liệu hoạt động.";
          setError(msg);
          toast.error(msg);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserActivity();
  }, [navigate]);

  const loadMoreComments = async () => {
    try {
      setLoadingMore(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Bạn chưa đăng nhập.");
        return;
      }
      const limit = 5;
      const offset = comments.length;

      const res = await axios.get<ApiOk<CommentItem[]> | ApiErr>(
        `${import.meta.env.VITE_API_URL}/user/comments`,
        {
          params: { limit, offset },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if ((res.data as ApiOk<CommentItem[]>).success) {
        const more = (res.data as ApiOk<CommentItem[]>).data ?? [];
        if (more.length === 0) {
          setHasMoreComments(false);
          return;
        }
        setComments((prev) => [...prev, ...more]);
        if (more.length < limit) setHasMoreComments(false);
      } else {
        const err = res.data as ApiErr;
        const msg = err.error?.message || "Không thể tải thêm bình luận.";
        toast.error(msg);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Không thể tải thêm bình luận.";
      toast.error(msg);
    } finally {
      setLoadingMore(false);
    }
  };

  const formatTimeAgo = (ts: string) => {
    const now = new Date();
    const t = new Date(ts);
    const diff = Math.floor((now.getTime() - t.getTime()) / 1000);
    if (diff < 60) return "Vừa xong";
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-6">
            <div className="text-center">Đang tải dữ liệu hoạt động...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-6">
            <div className="text-center text-destructive">Lỗi: {error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!activityData) {
    return (
      <div className="space-y-6">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-6">
            <div className="text-center">Không có dữ liệu hoạt động</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const following = activityData.favoriteComics;

  return (
    <div className="space-y-6">
      {/* Đang đọc */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Đang đọc
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate("/history")}>
            Xem tất cả
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activityData.readingList.length > 0 ? (
              activityData.readingList.slice(0, 5).map((c) => {
                const anyC = c as any;
                const isCompleted = !!anyC.isCompleted;
                const statusText = isCompleted ? "Hoàn thành" : "Đang đọc";
                return (
                  <div
                    key={anyC.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-background/50 border border-border/50"
                  >
                    <img
                      src={anyC.cover || "/placeholder.svg"}
                      alt={anyC.title}
                      className="w-16 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold line-clamp-1" title={anyC.title}>
                        {anyC.title}
                      </h3>
                      <div className="text-sm text-muted-foreground">
                        Tiến độ: Ch. {anyC.lastReadChapter} / {anyC.lastChapterNumber}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(anyC.lastReadISO || anyC.lastRead)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isCompleted && anyC.continueUrl && (
                        <Button size="sm" onClick={() => navigate(anyC.continueUrl)}>
                          Đọc tiếp
                        </Button>
                      )}
                      <Badge variant={isCompleted ? "secondary" : "default"}>{statusText}</Badge>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-muted-foreground">Chưa có lịch sử đọc</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Truyện theo dõi */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Truyện theo dõi
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate("/following")}>
            Xem tất cả
          </Button>
        </CardHeader>
        <CardContent>
          {following.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {following.slice(0, 5).map((comic) => {
                const anyC = comic as any;
                return (
                  <div
                    key={anyC.id}
                    className="text-center cursor-pointer"
                    onClick={() => anyC.slug && navigate(`/comics/${anyC.slug}`)}
                    title={anyC.title}
                  >
                    <img
                      src={anyC.cover || "/placeholder.svg"}
                      alt={anyC.title}
                      className="w-full aspect-[3/4] object-cover rounded mb-2 bg-muted"
                    />
                    <p className="text-sm font-medium truncate">{anyC.title}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">Chưa theo dõi truyện nào</div>
          )}
        </CardContent>
      </Card>

      {/* Bình luận gần đây */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Bình luận gần đây
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {comments.length > 0 ? (
            <>
              {comments.map((c) => (
                <div key={c.id} className="p-4 rounded-lg bg-background/50 border border-border/50">
                  <p className="text-sm line-clamp-2">“{c.content}”</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {c.comicTitle}
                    {c.chapterTitle ? ` • ${c.chapterTitle}` : ""} • {formatTimeAgo(c.timestampISO)}
                  </p>
                </div>
              ))}

              {/* ✅ Nút "Xem thêm" ở cuối */}
              {hasMoreComments && (
                <div className="text-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loadingMore}
                    onClick={loadMoreComments}
                  >
                    {loadingMore ? "Đang tải..." : "Xem thêm"}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Chưa có bình luận nào
            </div>
          )}
        </div>
      </CardContent>
    </Card>

    </div>
  );
}
