import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Eye, BookOpen } from "lucide-react";
interface Comic{
  id: number;
  rank: number;
  slug: string;
  title: string;
  image: string;
  rating: string | null;
  views: string | null;
  latestChapter: string | null;
}

interface RankingsData {
  top: Comic[];
  favorites: Comic[];
  new: Comic[];
}
interface RankResponse {
  success: boolean;
  data: RankingsData;
  meta: any;
}

// Component Skeleton
const RankingItemSkeleton = () => (
  <div className="flex items-center gap-3 p-2">
    <Skeleton className="w-12 h-16 rounded-md flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

export default function MonthlyRankings() {
  const [rankings, setRankings] = useState<RankingsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch rankings data
  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setLoading(true);
        const response = await axios.get<RankResponse>(`${import.meta.env.VITE_API_URL}/comics/rankings`);
        setRankings(response.data.data);
      } catch (error) {
        console.error("Failed to fetch rankings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, []);


  const renderRankingList = (comics: Comic[] | undefined) => {
    if (!comics || comics.length === 0) {
      return <p className="text-center text-muted-foreground p-4">Không có dữ liệu.</p>;
    }
    const formatNumber = (num: unknown) => {
      const parsed = typeof num === "number" ? num : Number(num);
      if (isNaN(parsed)||parsed === 0) return "mới";
      return Number.isInteger(parsed) ? parsed.toString() : parsed.toFixed(2).replace(/\.?0+$/, "");
    };
    return comics.map((comic) => (
      <Link key={comic.id} to={`/truyen-tranh/${comic.slug}`} className="block group">
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
                <span>{Number(comic.rating || 0).toFixed(1)}</span>
              </div>
              <div className="flex items-center" title="Lượt xem">
                <Eye className="w-3 h-3 text-sky-500 mr-1" />
                <span>{comic.views || 0}</span>
              </div>
              <div className="flex items-center" title="Chương mới">
                <BookOpen className="w-3 h-3 text-green-500 mr-1" />
                <span>{formatNumber(comic.latestChapter)}</span>
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
