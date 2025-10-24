import { useState, useMemo, useEffect } from "react";
import { Clock, Eye, ChevronLeft, ChevronRight, Lock, Unlock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { Link } from "react-router-dom";
import axios from "axios";

// --- Interfaces ---
interface Chapter {
  id: number;
  number: number;
  title: string;
  views: number;
  isLocked: boolean;
  time: string;
  isNew?: boolean;
}

interface ChapterListProps {
  chapters: Chapter[];
  comicSlug: string;
  comicId?: number;
}

interface UnlockCheck {
  chapterId: string;
  isUnlocked: boolean;
  message: string;
}

interface ReadingHistoryItem {
  comicId: number;
  chapterId: number;
  lastReadAt: string;
}
interface ChapterHistory {
  chapterNumber: number;
  readAt: string;
}

interface ComicHistory {
  lastReadChapterId: number;
  lastReadChapterNumber: number;
  lastReadAt: string;
  chapters: { [chapterId: number]: ChapterHistory };
}
type ApiOk<T> = { success: true; data: T; meta?: unknown };
const DETAILED_HISTORY_KEY = 'detailed_reading_history';

export default function ChapterList({ chapters, comicSlug,comicId}: ChapterListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const chaptersPerPage = 10;

  // State để quản lý trạng thái mở khóa
  const [unlockedStatus, setUnlockedStatus] = useState<Record<number, boolean>>({});
  const [isChecking, setIsChecking] = useState(true);

  const [readChapterIds, setReadChapterIds] = useState<Set<number>>(new Set());

  // Lấy lịch sử đọc từ localStorage
  useEffect(() => {
    const loadHistory = () => {
      try {
        const historyJson = localStorage.getItem(DETAILED_HISTORY_KEY);
        if (!historyJson) {
          setReadChapterIds(new Set());
          return;
        }

        const historyObj: Record<string, ComicHistory> = JSON.parse(historyJson);

        // Nếu có comicId -> chỉ lấy chương đã đọc của truyện này
        // Nếu không có comicId -> gom tất cả chapterId đã đọc (vẫn hoạt động đúng)
        let chapterIds: number[] = [];
        if (comicId != null && historyObj[String(comicId)]) {
          const chaptersOfComic = historyObj[String(comicId)].chapters || {};
          chapterIds = Object.keys(chaptersOfComic).map(id => Number(id));
        } else {
          // Quét tất cả comics (fallback khi thiếu comicId)
          chapterIds = Object.values(historyObj).flatMap(ch =>
            Object.keys(ch.chapters || {}).map(id => Number(id))
          );
        }

        setReadChapterIds(new Set(chapterIds.filter(Number.isFinite)));
      } catch (error) {
        console.error("Lỗi khi lấy detailed_reading_history:", error);
        setReadChapterIds(new Set());
      }
    };

    loadHistory();

    // Đồng bộ khi localStorage thay đổi ở tab khác
    const onStorage = (e: StorageEvent) => {
      if (e.key === DETAILED_HISTORY_KEY) loadHistory();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [comicId]);

  // useEffect để kiểm tra các chương bị khóa
  useEffect(() => {

  const token = localStorage.getItem("token");
  const lockedIds = chapters.filter(c => c.isLocked).map(c => c.id);

  // Không có chương khoá hoặc không có token -> thoát sớm
  if (!lockedIds.length || !token) {
    setIsChecking(false);
    return;
  }

  let aborted = false;
  const controller = new AbortController();

  (async () => {
    setIsChecking(true);

    // Bỏ qua id đã có kết quả trong cache
    const needCheck = lockedIds.filter(id => unlockedStatus[id] === undefined);
    if (!needCheck.length) {
      setIsChecking(false);
      return;
    }

    // Giới hạn concurrency đơn giản bằng cách chunk
    const chunkSize = 8;
    const chunks: number[][] = [];
    for (let i = 0; i < needCheck.length; i += chunkSize) {
      chunks.push(needCheck.slice(i, i + chunkSize));
    }

    const newStatus: Record<number, boolean> = {};
    try {
      for (const chunk of chunks) {
        if (aborted) break;

        // Promise.allSettled để không fail cả lô
        const results = await Promise.allSettled(
          chunk.map(id =>
            axios.get<ApiOk<UnlockCheck>>(
              `${import.meta.env.VITE_API_URL}/chapters/${id}/check-unlock`,
              { headers: { Authorization: `Bearer ${token}` }}
            )
          )
        );

        results.forEach((r) => {
          if (r.status === "fulfilled") {
            const data = r.value.data?.data;
            if (data) {
              const cid = Number(data.chapterId);
              newStatus[cid] = !!data.isUnlocked;
            }
          } else {
          }
        });

        // Cập nhật dần để UI phản hồi sớm
        if (!aborted) {
          setUnlockedStatus(prev => ({ ...prev, ...newStatus }));
        }
      }
    } catch (e) {
      console.error("Lỗi khi kiểm tra mở khóa chương:", e);
    } finally {
      if (!aborted) setIsChecking(false);
    }
  })();

  return () => {
    aborted = true;
    controller.abort();
  };
}, [chapters, ]);


  const formatNumber = (num: unknown) => {
    const parsed = typeof num === "number" ? num : Number(num);
    if (isNaN(parsed)) return "N/A";
    return Number.isInteger(parsed) ? parsed.toString() : parsed.toFixed(2).replace(/\.?0+$/, '');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hour}:${minute}`;
  };

  const filteredChapters = useMemo(() => {
    let result = chapters.filter(ch =>
      ch.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatNumber(ch.number).includes(searchTerm)
    );

    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
        break;
      case "mostViewed":
        result.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
    }

    return result;
  }, [chapters, searchTerm, sortBy]);

  const totalPages = Math.ceil(filteredChapters.length / chaptersPerPage);
  const displayedChapters = filteredChapters.slice(
    (currentPage - 1) * chaptersPerPage,
    currentPage * chaptersPerPage
  );

  // Đánh dấu chương mới trong vòng 3 ngày
  const displayedChaptersWithIsNew = displayedChapters.map(ch => ({
    ...ch,
    isNew: new Date(ch.time) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  }));

  const hasReadChapter = (chapterId: number) => {
    return readChapterIds.has(chapterId);
  };

  return (
    <Card className="p-4 sm:p-6 bg-card/60 backdrop-blur-md border border-border/40 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
        <h2 className="text-lg sm:text-xl font-semibold font-montserrat text-foreground">Danh sách chương</h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Input
            placeholder="Tìm chương..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:max-w-[200px]"
          />
          <Select value={sortBy} onValueChange={(val) => setSortBy(val)}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <span className="text-sm">
                {sortBy === "newest" ? "Mới nhất" : sortBy === "oldest" ? "Cũ nhất" : "Lượt xem cao"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="oldest">Cũ nhất</SelectItem>
              <SelectItem value="mostViewed">Lượt xem cao</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        {displayedChaptersWithIsNew.map((chapter) => {
          const isChapterUnlocked = unlockedStatus[chapter.id] || false;
          const isRead = hasReadChapter(chapter.id);

          return (
            <Link
              key={chapter.id}
              to={`/truyen-tranh/${comicSlug}/chapter/${Math.floor(Number(chapter.number))}`}
              className="block"
            >
              <div
                className={`flex items-center gap-4 p-3 rounded-lg hover:bg-muted/40 transition-colors group cursor-pointer overflow-hidden
                  ${isRead ? 'opacity-50 pointer-events-auto' : ''}`}
              >
                <div className="flex items-center space-x-2 min-w-[100px] shrink-0">
                  <span className={`font-medium text-sm group-hover:text-primary transition-colors ${isRead ? 'text-gray-400 group-hover:text-gray-400' : ''}`}>
                    Chương {formatNumber(chapter.number)}
                  </span>
                  {chapter.isNew && !isRead && (
                    <Badge variant="destructive" className="text-xs px-2 py-0.5">Mới</Badge>
                  )}
                  {chapter.isLocked && (
                    isChecking ? (
                      <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                    ) : isChapterUnlocked ? (
                      <Unlock className={`w-4 h-4 ${isRead ? 'text-gray-400' : 'text-green-500'}`} />
                    ) : (
                      <Lock className={`w-4 h-4 ${isRead ? 'text-gray-400' : 'text-red-500'}`} />
                    )
                  )}
                </div>

                <span className={`text-sm truncate font-medium flex-1 text-left ${isRead ? 'text-gray-400' : 'text-muted-foreground'}`}>
                  {chapter.title}
                </span>

                <div className="flex items-center space-x-1 text-muted-foreground min-w-[90px] justify-end text-right">
                  <Eye className="h-4 w-4" />
                  <span className="text-xs tabular-nums">{(chapter.views || 0).toLocaleString()}</span>
                </div>

                <div className="flex items-center space-x-1 text-muted-foreground min-w-[140px] justify-end text-right">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs tabular-nums">{formatDate(chapter.time)}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <Button
            variant="ghost"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Trang {currentPage} / {totalPages}
          </span>
          <Button
            variant="ghost"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </Card>
  );
}

