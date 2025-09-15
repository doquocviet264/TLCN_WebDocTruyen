// src/components/MonthlyRankings.tsx
import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Eye, BookOpen } from "lucide-react";

// --- Interfaces ---
interface ComicRank {
  id: number;
  rank: number;
  slug: string;
  title: string;
  image: string;
  rating: string | number;
  views: number;
  latestChapter: string;
  trend: string;
}

interface RankingsData {
  top: ComicRank[];
  favorites: ComicRank[];
  new: ComicRank[];
}

// --- Component Skeleton ---
const RankingItemSkeleton = () => (
  <div className="flex items-center gap-3 p-2">
    <Skeleton className="w-12 h-16 rounded-md flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

// --- Component Chính ---
export function MonthlyRankings() {
  const [rankings, setRankings] = useState<RankingsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setLoading(true);
        const response = await axios.get<RankingsData>("http://localhost:3000/api/comics/rankings");
        setRankings(response.data);
      } catch (error) {
        console.error("Failed to fetch rankings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, []);

  const renderRankingList = (comics: ComicRank[] | undefined) => {
    if (!comics || comics.length === 0) {
      return <p className="text-center text-muted-foreground p-4">Không có dữ liệu.</p>;
    }

    return comics.map((comic) => (
      <Link key={comic.id} to={`/truyen/${comic.slug}`} className="block group">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors duration-200">
          {/* Ảnh bìa */}
          <img
            src={comic.image || "/placeholder.svg"}
            alt={comic.title}
            className="w-12 h-16 object-cover rounded-md flex-shrink-0"
          />
          {/* Thông tin */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
              {comic.title}
            </h4>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <div className="flex items-center" title="Đánh giá">
                <Star className="w-3 h-3 text-yellow-500 mr-1" />
                <span>{comic.rating}</span>
              </div>
              <div className="flex items-center" title="Lượt xem">
                <Eye className="w-3 h-3 text-sky-500 mr-1" />
                <span>{comic.views.toLocaleString('vi-VN')}</span>
              </div>
              <div className="flex items-center" title="Chương mới">
                <BookOpen className="w-3 h-3 text-green-500 mr-1" />
                <span>{comic.latestChapter.replace('Chap ', '')}</span>
              </div>
            </div>
          </div>
          {/* Thứ hạng */}
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                        ${comic.rank <= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            {comic.rank}
          </div>
        </div>
      </Link>
    ));
  };

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
      <h3 className="text-xl font-montserrat font-bold mb-4">Bảng Xếp Hạng</h3>

      <Tabs defaultValue="top" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="top">Top Xem</TabsTrigger>
          <TabsTrigger value="favorites">Yêu Thích</TabsTrigger>
          <TabsTrigger value="new">Mới Nhất</TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <RankingItemSkeleton key={i} />)}
          </div>
        ) : (
          <>
            <TabsContent value="top" className="space-y-1">
              {renderRankingList(rankings?.top)}
            </TabsContent>
            <TabsContent value="favorites" className="space-y-1">
              {renderRankingList(rankings?.favorites)}
            </TabsContent>
            <TabsContent value="new" className="space-y-1">
              {renderRankingList(rankings?.new)}
            </TabsContent>
          </>
        )}
      </Tabs>
    </Card>
  );
}

export default MonthlyRankings;