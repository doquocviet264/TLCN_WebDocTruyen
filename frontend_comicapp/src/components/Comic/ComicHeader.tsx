import { Heart, Star, User, Clock, Tag, BookOpen, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import axios from "axios";

interface ComicHeaderProps {
  comic: {
    id: number;
    slug: string; // ✅ cần để điều hướng chương
    title: string;
    author: string;
    image: string;
    lastUpdate: string;
    status: string;
    genres: string[];
    rating: number;
    reviewCount: number;
    followers: number;
    liker: number;
    isFollowing: boolean;
    isFavorite: boolean;
  };
  firstChapter: number;
  lastChapter: number;
  onFollowToggle: () => void;
  onFavoriteToggle: () => void;
}

interface ComicHistoryItem {
  id: number;
  title: string;
  slug: string;
  image: string;
  lastChapter: string; 
  chapterTitle: string;
  lastReadAt: string;
}
type ApiOk<T> = { success: true; data: T; meta?: unknown };


interface ComicHistoryLS {
  lastReadChapterId: number;
  lastReadChapterNumber: number;
  lastReadAt: string;
  chapters: { [chapterId: number]: { chapterNumber: number; readAt: string } };
}

const DETAILED_HISTORY_KEY = "detailed_reading_history";

export default function ComicHeader({
  comic,
  firstChapter,
  lastChapter,
  onFollowToggle,
  onFavoriteToggle,
}: ComicHeaderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [continueChapter, setContinueChapter] = useState<number | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const formatNumber = (num: unknown) => {
    const parsed = typeof num === "number" ? num : Number(num);
    if (isNaN(parsed)) return "N/A";
    return Number.isInteger(parsed) ? parsed.toString() : parsed.toFixed(2).replace(/\.?0+$/, '');
  };
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);

    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        if (token) {
          try {
            const res = await axios.get<ApiOk<ComicHistoryItem | null>>(
              `${import.meta.env.VITE_API_URL}/history/${comic.id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );

            const item = res.data?.data; // null | ComicHistoryItem
            if (item) {
              const chInt = formatNumber(item.lastChapter);
              setContinueChapter(Number(chInt));
              return;
            }
          } catch (e) {
            console.warn("Không lấy được /history/{comicId} từ server, fallback localStorage.", e);
          }
        }

        // 2) Fallback: đọc từ localStorage schema mới
        const ls = localStorage.getItem(DETAILED_HISTORY_KEY);
        if (ls) {
          const obj: Record<string, ComicHistoryLS> = JSON.parse(ls);
          const entry = obj[String(comic.id)];
          if (entry && Number.isFinite(entry.lastReadChapterNumber)) {
            setContinueChapter(Number(entry.lastReadChapterNumber));
            return;
          }
        }

        // 3) Không có lịch sử
        setContinueChapter(null);
      } catch (err) {
        console.error("Lỗi khi tải lịch sử đọc:", err);
        setContinueChapter(null);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();
  }, [comic.id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const displayRating = (comic.rating).toFixed(1);
  const fullStars = Math.floor(comic.rating);
  const hasHalfStar = (comic.rating % 1 >= 0.3) && (comic.rating % 1 <= 0.7);

  return (
    <Card className="p-3 sm:p-6 bg-card/50 backdrop-blur-sm border-border/50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
        {/* Hình ảnh */}
        <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden shadow-lg min-w-[135px] max-w-[220px] mx-auto md:mx-0">
          <img
            src={comic.image || "/placeholder.svg"}
            alt={comic.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Thông tin */}
        <div className="md:col-span-2 space-y-3 sm:space-y-4">
          <h1 className="text-2xl sm:text-3xl font-montserrat font-bold text-balance text-center md:text-left">
            {comic.title}
          </h1>

          {/* Ngày cập nhật */}
          <div className="flex items-center justify-center md:justify-start space-x-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Cập nhật: {formatDate(comic.lastUpdate)}</span>
          </div>

          {/* Tác giả */}
          <div className="flex items-center justify-center md:justify-start space-x-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Tác giả: <span className="font-medium">{comic.author}</span>
            </span>
          </div>

          {/* Trạng thái */}
          <div className="flex items-center justify-center md:justify-start space-x-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Tình trạng: </span>
            <Badge variant={comic.status === "Hoàn thành" ? "default" : "secondary"}>
              {comic.status}
            </Badge>
          </div>

          {/* Thể loại */}
          <div className="flex flex-col sm:flex-row items-center md:items-start space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Thể loại:</span>
            </div>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {comic.genres.map((genre) => (
                <Badge key={genre} variant="outline" className="text-xs">
                  {genre}
                </Badge>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center justify-center md:justify-start space-x-4">
            <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2">
              <div className="flex items-center space-x-1" aria-label={`Đánh giá: ${displayRating} trên 5 sao`}>
                {[...Array(5)].map((_, i) => {
                  if (i < fullStars) return <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />;
                  if (i === fullStars && hasHalfStar) {
                    return (
                      <div key={i} className="relative h-4 w-4">
                        <Star className="h-4 w-4 text-muted-foreground absolute" />
                        <Star className="h-4 w-4 text-yellow-500 fill-current absolute" style={{ clipPath: "inset(0 50% 0 0)" }} />
                      </div>
                    );
                  }
                  return <Star key={i} className="h-4 w-4 text-muted-foreground" />;
                })}
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-lg">{displayRating}</span>
                <span className="text-sm text-muted-foreground">({comic.reviewCount.toLocaleString()} đánh giá)</span>
              </div>
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 pt-4">
            {/* Theo dõi */}
            <Button
              onClick={onFollowToggle}
              variant={comic.isFollowing ? "outline" : "default"}
              className={`flex items-center justify-center space-x-2 ${
                comic.isFollowing
                  ? "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  : "bg-primary hover:bg-primary/90"
              } transition-all duration-200 hover:scale-105 flex-none`}
              aria-label={comic.isFollowing ? "Bỏ theo dõi" : "Theo dõi"}
            >
              <Heart className={`h-4 w-4 ${comic.isFollowing ? "fill-current" : ""}`} />
              <span>{comic.isFollowing ? "Đã theo dõi" : "Theo dõi"}</span>
              <span className="text-xs opacity-80">({comic.followers.toLocaleString()})</span>
            </Button>

            {/* ✅ Yêu thích */}
            <Button
              onClick={onFavoriteToggle}
              variant={comic.isFavorite ? "outline" : "secondary"}
              className={`flex items-center justify-center space-x-2 flex-none ${
                comic.isFavorite
                  ? "border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
                  : "hover:border-red-500 hover:text-red-600"
              }`}
              aria-label={comic.isFavorite ? "Bỏ yêu thích" : "Yêu thích"}
            >
              <Star className={`h-4 w-4 ${comic.isFavorite ? "fill-current" : ""}`} />
              <span>{comic.isFavorite ? "Đã yêu thích" : "Yêu thích"}</span>
              <span className="text-xs opacity-80">({comic.followers.toLocaleString()})</span>
            </Button>

            <div className="flex flex-wrap gap-2">
              {/* Nếu có lịch sử → Xem tiếp; nếu không → Đọc từ đầu */}
              {!loadingHistory && continueChapter != null ? (
                <Button
                  asChild
                  variant="outline"
                  className="flex-none flex items-center justify-center space-x-2 bg-transparent max-w-[150px] sm:max-w-none"
                  aria-label="Xem tiếp"
                >
                  <a href={`/truyen-tranh/${comic.slug}/chapter/${Math.floor(continueChapter)}`}>
                    <Play className="h-4 w-4" />
                    <span className="truncate">Xem tiếp (Chương {Math.floor(continueChapter)})</span>
                  </a>
                </Button>
              ) : (
                <Button
                  asChild
                  variant="outline"
                  className="flex-none flex items-center justify-center space-x-2 bg-transparent max-w-[150px] sm:max-w-none"
                  aria-label="Đọc từ đầu"
                >
                  <a href={`/truyen-tranh/${comic.slug}/chapter/${formatNumber(firstChapter)}`}>
                    <Play className="h-4 w-4" />
                    <span className="truncate">Đọc từ đầu</span>
                  </a>
                </Button>
              )}

              <Button
                asChild
                variant="outline"
                className="flex-none flex items-center justify-center space-x-2 bg-secondary text-secondary-foreground hover:bg-secondary/10 max-w-[150px] sm:max-w-none"
                aria-label="Đọc chương mới nhất"
              >
                <a href={`/truyen-tranh/${comic.slug}/chapter/${formatNumber(lastChapter)}`}>
                  <BookOpen className="h-4 w-4" />
                  <span className="truncate">Đọc mới nhất</span>
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
