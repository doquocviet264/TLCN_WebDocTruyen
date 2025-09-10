import { Heart, Star, User, Clock, Tag, BookOpen, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface ComicHeaderProps {
  comic: {
    id: string;
    title: string;
    author: string;
    image: string;
    lastUpdate: string;
    status: string;
    genres: string[];
    rating: number;
    reviewCount: number;
    followers: number;
    isFollowing: boolean;
  };
  onFollowToggle: () => void;
}

export function ComicHeader({ comic, onFollowToggle }: ComicHeaderProps) {
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

  // Tính rating chính xác đến 1 chữ số thập phân
  const displayRating = (comic.rating).toFixed(1);
  const fullStars = Math.floor(comic.rating);
  const hasHalfStar = (comic.rating) % 1 >= 0.3 && (comic.rating ) % 1 <= 0.7;

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
        <Badge variant={comic.status === "Hoàn thành" ? "default" : "secondary"}>{comic.status}</Badge>
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
              if (i < fullStars) {
                return <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />;
              }
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

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="flex-none flex items-center justify-center space-x-2 bg-transparent max-w-[150px] sm:max-w-none"
            aria-label="Đọc từ đầu"
          >
            <Play className="h-4 w-4" />
            <span className="truncate">Đọc từ đầu</span>
          </Button>

          <Button
            variant="outline"
            className="flex-none flex items-center justify-center space-x-2 bg-secondary text-secondary-foreground hover:bg-secondary/10 max-w-[150px] sm:max-w-none"
            aria-label="Đọc chương mới nhất"
          >
            <BookOpen className="h-4 w-4" />
            <span className="truncate">Đọc mới nhất</span>
          </Button>
        </div>
      </div>
    </div>
  </div>
</Card>
  );
}

export default ComicHeader;