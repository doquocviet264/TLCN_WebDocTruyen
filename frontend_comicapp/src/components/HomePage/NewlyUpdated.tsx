import { Star, MessageCircle, Heart, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

interface Chapter {
  chapterNumber: number;
  time: string;
}

interface Comic {
  id: number;
  slug: string;
  title: string;
  author: string;
  image: string;
  rating: number;
  comments: number;
  hearts: number;
  Chapters: Chapter[]
}
interface NewlyUpdatedResponse {
  success: boolean;
  data: Comic[];
  meta: any;
}

// Component Skeleton cho mỗi card truyện
const ComicCardSkeleton = () => (
  <div className="w-full">
    <Skeleton className="relative w-full rounded-t-lg" style={{ paddingTop: "150%" }} />
    <div className="p-3 space-y-2 bg-card rounded-b-lg">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-full" />
    </div>
  </div>
);

export default function NewlyUpdated() {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewlyUpdatedComics = async () => {
      try {
        setLoading(true);
        const response = await axios.get<NewlyUpdatedResponse>(`${import.meta.env.VITE_API_URL}/comics/newly-updated`);
        setComics(response.data.data || []);
      } catch (err) {
        console.error("Không thể tải danh sách truyện. Vui lòng thử lại sau.", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNewlyUpdatedComics();
  }, []);

  const formatNumber = (num: unknown) => {
    const parsed = typeof num === "number" ? num : Number(num);
    if (isNaN(parsed)) return "N/A";
    return Number.isInteger(parsed) ? parsed.toString() : parsed.toFixed(2).replace(/\.?0+$/, "");
  };

  const timeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diff = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diff < 60) return `${diff} giây trước`;
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
    if (diff < 31536000) return `${Math.floor(diff / 2592000)} tháng trước`;
    return `${Math.floor(diff / 31536000)} năm trước`;
  };
  if (loading){
    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 max-w-[1280px] mx-auto">
      {Array.from({ length: 12 }).map((_, index) => <ComicCardSkeleton key={index} />)}
    </div>
  }

  return (
    <section className="space-y-6 px-4 sm:px-6 lg:px-8">
      <h2 className="text-2xl sm:text-3xl font-montserrat font-bold text-foreground">
        Truyện mới cập nhật
      </h2>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 max-w-[1280px] mx-auto">
          {comics.map((comic) => (
            <Link
              key={comic.id}
              to={`/truyen-tranh/${comic.slug}`}
              className="no-underline group"
            >
              <Card
                className="overflow-hidden rounded-lg bg-card/90 backdrop-blur-sm border border-border/40 hover:shadow-lg transition-all duration-300 flex flex-col h-full"
                style={{ padding: 0 }}
              >
                <div className="relative w-full" style={{ paddingTop: "130%", overflow: "hidden" }}>
                  <img
                    src={comic.image || "/placeholder.svg"}
                    alt={comic.title}
                    className="absolute inset-0 w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 rounded-t-lg bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <CardContent className="p-3 flex flex-col flex-1 custom-card-content">
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base group-hover:text-primary transition-colors line-clamp-1 text-foreground">
                      {comic.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">{comic.author}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1 text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span>{Number(comic.rating || 0).toFixed(1)}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-blue-500">
                        <MessageCircle className="h-4 w-4" />
                        <span>{comic.comments}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-red-500">
                        <Heart className="h-4 w-4 fill-current" />
                        <span>{comic.hearts}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-grow"></div>

                  <div className="space-y-1 pt-1 border-t border-border/30">
                    {(comic.Chapters || []).slice(0, 3).map((chapter) => (
                      <div key={chapter.chapterNumber} className="flex items-center justify-between text-xs">
                        <Link 
                          to={`/truyen-tranh/${comic.slug}/chapter/${formatNumber(chapter.chapterNumber)}`}
                          className="text-muted-foreground hover:text-primary transition-colors truncate max-w-[90px]"
                        >
                          Chương {formatNumber(chapter.chapterNumber)}
                        </Link>
                        <div className="flex items-center space-x-1 text-muted-foreground flex-shrink-0">
                          <Clock className="h-3 w-3" />
                          <span>{timeAgo(chapter.time)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
      </div>
    </section>
  );
}
