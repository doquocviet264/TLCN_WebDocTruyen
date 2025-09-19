import { Card } from "@/components/ui/card"
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Skeleton } from "@/components/ui/skeleton";

const HISTORY_KEY = 'reading_history';

// Định nghĩa interface cho dữ liệu lịch sử đọc
interface ReadingHistoryItem {
  id: number;
  title: string;
  slug: string;
  image: string;
  lastChapter: number;
  lastReadAt: string;
  chapterTitle?: string;
}

interface Comic {
  title: string;
  slug: string;
  image: string;
}

// Skeleton component cho mỗi item truyện
const ComicItemSkeleton = () => (
  <div className="flex-shrink-0 w-28">
    <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2">
      <Skeleton className="w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-1 left-1 right-1 p-1">
        <Skeleton className="h-3 w-20 mb-1 bg-white/20" />
        <Skeleton className="h-2 w-12 bg-white/20" />
      </div>
    </div>
  </div>
);

// Skeleton component cho toàn bộ section
const ReadingHistorySkeleton = () => (
  <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
    <Skeleton className="h-6 w-48 mb-4" />
    <div className="flex space-x-3 overflow-x-auto pb-2">
      <ComicItemSkeleton />
      <ComicItemSkeleton />
      <ComicItemSkeleton />
      <ComicItemSkeleton />
      <ComicItemSkeleton />
    </div>
  </Card>
);

export function ReadingHistory() {
  const [readingHistory, setReadingHistory] = useState<ReadingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReadingHistory();
  }, []);

  const fetchReadingHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      
      if (token) {
        // Nếu có token, lấy từ server
        const response = await axios.get<ReadingHistoryItem[]>(
          `${import.meta.env.VITE_API_URL}/history?limit=5`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setReadingHistory(response.data);
      } else {
        // Nếu không có token, lấy từ localStorage và loại bỏ trùng lặp
        const localHistory = localStorage.getItem(HISTORY_KEY);
        if (localHistory) {
          const parsedHistory = JSON.parse(localHistory);
          
          // Loại bỏ các item trùng comicId, chỉ giữ lại item mới nhất
          const uniqueHistory = removeDuplicates(parsedHistory);
          
          // Lấy thông tin chi tiết cho mỗi comic từ localStorage
          const historyWithDetails = await Promise.all(
            uniqueHistory.slice(0, 5).map(async (item: any) => {
              try {
                const comicResponse = await axios.get<Comic>(
                  `${import.meta.env.VITE_API_URL}/comics/id/${item.comicId}`
                );
                return {
                  id: item.comicId,
                  title: comicResponse.data.title,
                  slug: comicResponse.data.slug,
                  image: comicResponse.data.image,
                  lastChapter: item.chapterNumber,
                  lastReadAt: item.lastReadAt
                } as ReadingHistoryItem;
              } catch (error) {
                console.error("Lỗi khi lấy thông tin truyện:", error);
                return null;
              }
            })
          );
          
          setReadingHistory(historyWithDetails.filter((item): item is ReadingHistoryItem => item !== null));
        }
      }
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử đọc:", error);
      
      // Fallback: thử lấy từ localStorage nếu server lỗi
      try {
        const localHistory = localStorage.getItem(HISTORY_KEY);
        if (localHistory) {
          const parsedHistory = JSON.parse(localHistory);
          // Loại bỏ trùng lặp
          const uniqueHistory = removeDuplicates(parsedHistory);
          
          // Format đơn giản cho localStorage
          const simpleHistory = uniqueHistory.slice(0, 5).map((item: any) => ({
            id: item.comicId,
            title: `Truyện #${item.comicId}`,
            slug: `comic-${item.comicId}`,
            image: "/placeholder.svg",
            lastChapter: item.chapterNumber,
            lastReadAt: item.lastReadAt
          })) as ReadingHistoryItem[];
          setReadingHistory(simpleHistory);
        }
      } catch (localError) {
        console.error("Lỗi khi lấy lịch sử từ localStorage:", localError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Hàm loại bỏ các item trùng comicId, giữ lại item mới nhất
  const removeDuplicates = (history: any[]): any[] => {
    const uniqueMap = new Map();
    
    history.forEach(item => {
      const existingItem = uniqueMap.get(item.comicId);
      
      // Nếu chưa có hoặc nếu item hiện tại mới hơn
      if (!existingItem || new Date(item.lastReadAt) > new Date(existingItem.lastReadAt)) {
        uniqueMap.set(item.comicId, item);
      }
    });
    
    return Array.from(uniqueMap.values()).sort((a, b) => 
      new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime()
    );
  };

  // Hàm để lấy lịch sử từ localStorage (phiên bản đơn giản)
  const getLocalHistory = (): ReadingHistoryItem[] => {
    try {
      const localHistory = localStorage.getItem(HISTORY_KEY);
      if (!localHistory) return [];

      const parsedHistory = JSON.parse(localHistory);
      // Loại bỏ trùng lặp
      const uniqueHistory = removeDuplicates(parsedHistory);
      
      return uniqueHistory.slice(0, 5).map((item: any) => ({
        id: item.comicId,
        title: `Truyện #${item.comicId}`,
        slug: `comic-${item.comicId}`,
        image: "/placeholder.svg",
        lastChapter: item.chapterNumber,
        lastReadAt: item.lastReadAt
      })) as ReadingHistoryItem[];
    } catch (error) {
      console.error("Lỗi khi đọc lịch sử từ localStorage:", error);
      return [];
    }
  };

  // Hiển thị skeleton khi loading
  if (loading) {
    return <ReadingHistorySkeleton />;
  }

  const displayHistory = readingHistory.length > 0 ? readingHistory : getLocalHistory();
  const formatNumber = (num: unknown) => {
    const parsed = typeof num === "number" ? num : Number(num);
    if (isNaN(parsed)||parsed === 0) return "mới";
    return Number.isInteger(parsed) ? parsed.toString() : parsed.toFixed(2).replace(/\.?0+$/, "");
  };
  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
      <h3 className="font-semibold mb-4">Lịch sử đọc truyện</h3>

      {displayHistory.length > 0 ? (
        <div className="flex space-x-3 overflow-x-auto pb-2">
          {displayHistory.map((comic) => (
            <div 
              key={comic.id} 
              className="group cursor-pointer flex-shrink-0 w-28"
              onClick={() => window.location.href = `/truyen-tranh/${comic.slug}`}
            >
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2">
                <img
                  src={comic.image || "/placeholder.svg"}
                  alt={comic.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder.svg";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-1 left-1 right-1 p-1 text-white text-xs">
                  <div className="font-medium truncate">{comic.title}</div>
                  {comic.lastChapter && (<div className="text-xs opacity-80">Ch. {formatNumber(comic.lastChapter)}</div>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Không có lịch sử đọc truyện</p>
        </div>
      )}
    </Card>
  );
}

export default ReadingHistory;