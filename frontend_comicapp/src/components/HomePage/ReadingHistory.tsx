import { Card } from "@/components/ui/card";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
const DETAILED_HISTORY_KEY = 'detailed_reading_history';
const MAX_ITEMS_TO_SHOW = 10; //Số lượng bình luận


interface ComicHistory {
  lastReadChapterNumber: number;
  lastReadAt: string;
}
interface SubComic {
  title: string;
  slug: string;
  image: string;
}
interface Comic {
  id: number;
  title: string;
  slug: string;
  image: string;
  lastChapter: string;
  chapterTitle?: string;
  lastReadAt: string;
}
type ApiOk<T> = { success: true; data: T; meta?: unknown };
type ApiErr = { success: false; error: { message: string; code: string; status: number } };

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
      {Array.from({ length: 5 }).map((_, index) => <ComicItemSkeleton key={index} />)}
    </div>
  </Card>
);


export default function ReadingHistory() {
  const [readingHistory, setReadingHistory] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);


  //Fetch reading history
  useEffect(() => {
    const fetchReadingHistory = async () => {
      try {
        const token = localStorage.getItem("token");

        if (token) {
          const response = await axios.get<ApiOk<Comic[]> | ApiErr>(
            `${import.meta.env.VITE_API_URL}/history?limit=${MAX_ITEMS_TO_SHOW}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (response.data.success) {
            setReadingHistory((response.data as ApiOk<Comic[]>).data || []);
          } else {
            const err = response.data as ApiErr;
            toast.error(err.error?.message || "Không thể tải lịch sử từ tài khoản.");
          }
        } else {
          const localHistoryJson = localStorage.getItem(DETAILED_HISTORY_KEY);
          if (!localHistoryJson) {
            setReadingHistory([]);
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
                const res = await axios.get<ApiOk<SubComic> | ApiErr>(
                  `${import.meta.env.VITE_API_URL}/comics/id/${item.id}`
                );
                if (!res.data.success) return null;

                const d = (res.data as ApiOk<SubComic>).data;
                return {
                  id: item.id,
                  title: d.title,
                  slug: d.slug,
                  image: d.image,
                  lastChapter: item.lastChapter,
                  lastReadAt: item.lastReadAt,
                } as Comic;
              } catch (error) { 
                console.error("Lỗi khi lấy lịch sử đọc truyện:", error);
                return null;
              }
            })
          );
          console.log(historyWithDetails);
          setReadingHistory(historyWithDetails.filter((item): item is Comic => item !== null));
        }
      } catch (error) {
        console.error("Lỗi khi lấy lịch sử đọc:", error);
        setReadingHistory([]); 
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
  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} năm trước`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} tháng trước`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} ngày trước`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} giờ trước`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} phút trước`;
    return `Vừa xong`;
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
                  <div className="text-xs opacity-80">Chương {formatNumber(comic.lastChapter)} {comic.chapterTitle ? ` — ${comic.chapterTitle}` : ""}</div>
                </div>
                {/* Overlay khi hover: hiện đầy đủ tên + thời gian đọc cuối */}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 flex flex-col justify-end text-white text-xs">
                  <div className="font-semibold text-[13px] leading-snug whitespace-normal line-clamp-none">
                    {comic.title}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="opacity-80 shrink-0">{timeAgo(comic.lastReadAt)}</span>
                  </div>
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