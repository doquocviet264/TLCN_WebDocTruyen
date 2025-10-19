import { Card } from "@/components/ui/card";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom"; // Nên dùng Link thay cho window.location.href

const DETAILED_HISTORY_KEY = 'detailed_reading_history';
const MAX_ITEMS_TO_SHOW = 10; // Tăng số lượng hiển thị nếu muốn

// --- INTERFACES ---

interface ComicHistory {
  lastReadChapterId: number;
  lastReadChapterNumber: number;
  lastReadAt: string;
}
interface Comic {
  title: string;
  slug: string;
  image: string;
}
interface ReadingHistoryItem {
  id: number;
  title: string;
  slug: string;
  image: string;
  lastChapter: number;
}

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

const ReadingHistorySkeleton = () => (
  <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
    <Skeleton className="h-6 w-48 mb-4" />
    <div className="flex space-x-3 overflow-x-auto pb-2">
      {/* Tạo skeleton dựa trên số lượng item muốn hiển thị */}
      {Array.from({ length: 5 }).map((_, index) => <ComicItemSkeleton key={index} />)}
    </div>
  </Card>
);


export default function ReadingHistory() {
  const [readingHistory, setReadingHistory] = useState<ReadingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReadingHistory = async () => {
      try {
        const token = localStorage.getItem("token");

        if (token) {
          const response = await axios.get<ReadingHistoryItem[]>(
            `${import.meta.env.VITE_API_URL}/history?limit=${MAX_ITEMS_TO_SHOW}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setReadingHistory(response.data);
        } else {
          const localHistoryJson = localStorage.getItem(DETAILED_HISTORY_KEY);
          if (!localHistoryJson) {
            setReadingHistory([]); // Không có lịch sử, set mảng rỗng
            return;
          }

          const historyObject: { [comicId: string]: ComicHistory } = JSON.parse(localHistoryJson);
          const historyArray = Object.entries(historyObject).map(([comicId, comicData]) => ({
            id: Number(comicId),
            ...comicData
          }));
          historyArray.sort((a, b) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime());
          // Lấy thông tin chi tiết cho mỗi comic từ localStorage
          const historyWithDetails = await Promise.all(
            historyArray.slice(0, 5).map(async (item: any) => {
              try {
                const comicResponse = await axios.get<Comic>(
                  `${import.meta.env.VITE_API_URL}/comics/id/${item.id}`
                );
                return {
                  id: item.id,
                  title: comicResponse.data.title,
                  slug: comicResponse.data.slug,
                  image: comicResponse.data.image,
                  lastChapter: item.lastReadChapterNumber,
                  lastReadAt: item.lastReadAt
                } as ReadingHistoryItem;
              } catch (error) {
                console.error("Lỗi khi lấy thông tin truyện:", error);
                return null;
              }
            })
          );
          console.log(historyWithDetails);
          setReadingHistory(historyWithDetails.filter((item): item is ReadingHistoryItem => item !== null));
        }
      } catch (error) {
        console.error("Lỗi khi lấy lịch sử đọc:", error);
        setReadingHistory([]); // Set mảng rỗng nếu có lỗi
      } finally {
        setLoading(false);
      }
    };

    fetchReadingHistory();
  }, []);

  if (loading) {
    return <ReadingHistorySkeleton />;
  }
  
  const formatNumber = (num: unknown) => {
    const parsed = typeof num === "number" ? num : Number(num);
    if (isNaN(parsed)||parsed === 0) return "mới";
    return Number.isInteger(parsed) ? parsed.toString() : parsed.toFixed(2).replace(/\.?0+$/, "");
  };

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
      <h3 className="font-semibold mb-4">Lịch sử đọc truyện</h3>

      {readingHistory.length > 0 ? (
        <div className="flex space-x-3 overflow-x-auto pb-2">
          {readingHistory.map((comic) => (
            <Link 
              key={comic.id} 
              to={`/truyen-tranh/${comic.slug}/chapter/${formatNumber(comic.lastChapter)}`}
              className="group cursor-pointer flex-shrink-0 w-28"
            >
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2">
                <img
                  src={comic.image || "/placeholder.svg"}
                  alt={comic.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder.svg";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-1 left-1 right-1 p-1 text-white text-xs">
                  <div className="font-medium truncate">{comic.title}</div>
                  <div className="text-xs opacity-80">Chương {formatNumber(comic.lastChapter)}</div>
                </div>
              </div>
            </Link>
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