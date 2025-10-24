import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react"; // Đảm bảo bạn có icon Star

interface RelatedComic {
  id: string;
  slug: string;
  title: string;
  image: string;
  rating: number | string;
  views: number;
  lastChapter: number;
  latestChapterTime: string; 
}

interface RelatedComicsProps {
  relatedComics: RelatedComic[];
}

export default function RelatedComics({ relatedComics}: RelatedComicsProps) {
  const formatViews = (views?: number | null) => {
    const v = views || 0;
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M lượt xem";
    if (v >= 1_000) return (v / 1_000).toFixed(1) + "K lượt xem";
    return v.toLocaleString() + " lượt xem";
  };


  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000; // years
    if (interval > 1) return Math.floor(interval) + " năm trước";
    interval = seconds / 2592000; // months
    if (interval > 1) return Math.floor(interval) + " tháng trước";
    interval = seconds / 86400; // days
    if (interval > 1) return Math.floor(interval) + " ngày trước";
    interval = seconds / 3600; // hours
    if (interval > 1) return Math.floor(interval) + " giờ trước";
    interval = seconds / 60; // minutes
    if (interval > 1) return Math.floor(interval) + " phút trước";
    return Math.floor(seconds) + " giây trước";
  };
  console.log("Related Comics:", relatedComics);

  return (
    <Card className="p-4 sm:p-6 bg-card/50 backdrop-blur-sm border-border/50">
      <h2 className="text-xl font-montserrat font-bold mb-6">Truyện Liên Quan</h2>
      <div className="space-y-4">
        {relatedComics.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Không có truyện liên quan nào.</p>
        ) : (
          relatedComics.map((comic) => (
            <Link key={comic.id} to={`/truyen-tranh/${comic.slug}`} className="block group">
              <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors duration-200">
                <img
                  src={comic.image || "/placeholder.svg"}
                  alt={comic.title}
                  className="w-16 h-20 object-cover rounded-md flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold truncate group-hover:text-primary transition-colors">
                    {comic.title}
                  </h3>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <div className="flex items-center mr-3">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 mr-1" />
                      <span>{comic.rating}</span>
                    </div>
                    <span>{formatViews(comic.views)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 truncate">
                    Chương {comic.lastChapter} &bull; {timeAgo(comic.latestChapterTime)}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </Card>
  );
}
