import { useState, useMemo, useEffect } from "react";
import {
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  Loader2,
  CheckCheck,
  ListFilter,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Link } from "react-router-dom";
import axios from "axios";
import { cn } from "@/lib/utils";

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
const DETAILED_HISTORY_KEY = "detailed_reading_history";

export default function ChapterList({
  chapters,
  comicSlug,
  comicId,
}: ChapterListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  // Tăng số lượng chương mỗi trang vì grid 2 cột chứa được nhiều hơn
  const chaptersPerPage = 20;

  const [unlockedStatus, setUnlockedStatus] = useState<Record<number, boolean>>(
    {}
  );
  const [isChecking, setIsChecking] = useState(true);
  const [readChapterIds, setReadChapterIds] = useState<Set<number>>(new Set());

  // --- LOGIC: Load History (Giữ nguyên) ---
  useEffect(() => {
    const loadHistory = () => {
      try {
        const historyJson = localStorage.getItem(DETAILED_HISTORY_KEY);
        if (!historyJson) {
          setReadChapterIds(new Set());
          return;
        }

        const historyObj: Record<string, ComicHistory> =
          JSON.parse(historyJson);
        let chapterIds: number[] = [];
        if (comicId != null && historyObj[String(comicId)]) {
          const chaptersOfComic = historyObj[String(comicId)].chapters || {};
          chapterIds = Object.keys(chaptersOfComic).map((id) => Number(id));
        } else {
          chapterIds = Object.values(historyObj).flatMap((ch) =>
            Object.keys(ch.chapters || {}).map((id) => Number(id))
          );
        }
        setReadChapterIds(new Set(chapterIds.filter(Number.isFinite)));
      } catch (error) {
        console.error("Lỗi history:", error);
        setReadChapterIds(new Set());
      }
    };
    loadHistory();
    const onStorage = (e: StorageEvent) => {
      if (e.key === DETAILED_HISTORY_KEY) loadHistory();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [comicId]);

  // --- LOGIC: Check Unlock (Giữ nguyên logic, chỉ clean code tí) ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    const lockedIds = chapters.filter((c) => c.isLocked).map((c) => c.id);

    if (!lockedIds.length || !token) {
      setIsChecking(false);
      return;
    }

    let aborted = false;
    const controller = new AbortController();

    (async () => {
      setIsChecking(true);
      const needCheck = lockedIds.filter(
        (id) => unlockedStatus[id] === undefined
      );
      if (!needCheck.length) {
        setIsChecking(false);
        return;
      }

      // Chunk requests
      const chunkSize = 8;
      for (let i = 0; i < needCheck.length; i += chunkSize) {
        if (aborted) break;
        const chunk = needCheck.slice(i, i + chunkSize);

        try {
          const results = await Promise.allSettled(
            chunk.map((id) =>
              axios.get<ApiOk<UnlockCheck>>(
                `${import.meta.env.VITE_API_URL}/chapters/${id}/check-unlock`,
                { headers: { Authorization: `Bearer ${token}` } }
              )
            )
          );

          const newStatus: Record<number, boolean> = {};
          results.forEach((r) => {
            if (r.status === "fulfilled" && r.value.data?.data) {
              const data = r.value.data.data;
              newStatus[Number(data.chapterId)] = !!data.isUnlocked;
            }
          });

          if (!aborted)
            setUnlockedStatus((prev) => ({ ...prev, ...newStatus }));
        } catch (e) {
          console.error(e);
        }
      }
      if (!aborted) setIsChecking(false);
    })();

    return () => {
      aborted = true;
      controller.abort();
    };
  }, [chapters]); // Bỏ unlockedStatus khỏi deps để tránh loop vô hạn nếu code sai

  // --- Helpers ---
  const formatNumber = (num: unknown) => {
    const parsed = typeof num === "number" ? num : Number(num);
    if (isNaN(parsed)) return "N/A";
    return Number.isInteger(parsed)
      ? parsed.toString()
      : parsed.toFixed(2).replace(/\.?0+$/, "");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    // Format ngắn gọn hơn cho mobile
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }).format(date);
  };

  // --- Filter & Sort ---
  const filteredChapters = useMemo(() => {
    let result = chapters.filter(
      (ch) =>
        ch.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatNumber(ch.number).includes(searchTerm)
    );

    switch (sortBy) {
      case "newest":
        result.sort((a, b) => Number(b.number) - Number(a.number));
        break;
      case "oldest":
        result.sort((a, b) => Number(a.number) - Number(b.number));
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

  const displayedChaptersWithIsNew = displayedChapters.map((ch) => ({
    ...ch,
    isNew: new Date(ch.time) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  }));

  const hasReadChapter = (chapterId: number) => readChapterIds.has(chapterId);

  // --- UI RENDER ---
  return (
    <div className="relative w-full rounded-[24px] bg-card border border-border shadow-sm overflow-hidden mt-6 group/list">
      {/* 1. Header & Controls */}
      <div className="p-6 border-b border-border/50 bg-secondary/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <ListFilter className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              Danh sách chương{" "}
              <span className="text-muted-foreground text-base font-normal">
                ({chapters.length})
              </span>
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm số chương..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 bg-background/50 border-border focus-visible:ring-primary/50"
              />
            </div>
            <Select value={sortBy} onValueChange={(val) => setSortBy(val)}>
              <SelectTrigger className="w-full sm:w-[160px] bg-background/50 border-border">
                <span className="truncate">
                  {sortBy === "newest"
                    ? "Mới nhất trước"
                    : sortBy === "oldest"
                    ? "Cũ nhất trước"
                    : "Xem nhiều nhất"}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất trước</SelectItem>
                <SelectItem value="oldest">Cũ nhất trước</SelectItem>
                <SelectItem value="mostViewed">Xem nhiều nhất</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 2. Chapter Grid */}
      <div className="p-4 md:p-6 bg-card/50">
        {displayedChaptersWithIsNew.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
            {displayedChaptersWithIsNew.map((chapter) => {
              const isChapterUnlocked = unlockedStatus[chapter.id] || false;
              const isRead = hasReadChapter(chapter.id);

              // Logic hiển thị icon khoá
              const showLock = chapter.isLocked;
              const LockIcon = isChecking
                ? Loader2
                : isChapterUnlocked
                ? Unlock
                : Lock;

              const lockColor = isChecking
                ? "text-muted-foreground animate-spin"
                : isChapterUnlocked
                ? "text-green-500"
                : "text-red-500";

              return (
                <Link
                  key={chapter.id}
                  to={`/truyen-tranh/${comicSlug}/chapter/${Math.floor(
                    Number(chapter.number)
                  )}`}
                  className="group relative"
                >
                  <div
                    className={cn(
                      "flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300",
                      // Style cơ bản
                      "bg-secondary/20 border-border/50 hover:border-primary/50 hover:bg-primary/5 hover:shadow-md",
                      // Style khi đã đọc: mờ đi
                      isRead &&
                        "bg-transparent border-transparent opacity-60 hover:opacity-100 grayscale-[0.3]"
                    )}
                  >
                    {/* Left: Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Chapter Number Box */}
                      <div
                        className={cn(
                          "flex-shrink-0 w-12 h-12 rounded-lg flex flex-col items-center justify-center border font-bold text-sm",
                          isRead
                            ? "bg-secondary/30 border-border text-muted-foreground"
                            : "bg-background border-border text-foreground shadow-sm group-hover:border-primary/50 group-hover:text-primary transition-colors"
                        )}
                      >
                        <span>#{formatNumber(chapter.number)}</span>
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "font-semibold truncate text-sm sm:text-base transition-colors",
                              isRead
                                ? "text-muted-foreground"
                                : "text-foreground group-hover:text-primary"
                            )}
                          >
                            {chapter.title ||
                              `Chương ${formatNumber(chapter.number)}`}
                          </span>

                          {/* Badges */}
                          {chapter.isNew && !isRead && (
                            <Badge
                              variant="destructive"
                              className="h-4 px-1 text-[10px] uppercase animate-pulse"
                            >
                              New
                            </Badge>
                          )}
                          {showLock && (
                            <div className="p-1 rounded-full bg-background border border-border shadow-sm">
                              <LockIcon className={cn("w-3 h-3", lockColor)} />
                            </div>
                          )}
                        </div>

                        {/* Meta info (Mobile: 1 dòng, Desktop: 1 dòng) */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />{" "}
                            {formatDate(chapter.time)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />{" "}
                            {chapter.views?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Status Icon */}
                    <div className="flex-shrink-0 pl-2">
                      {isRead ? (
                        <div className="flex items-center gap-1 text-xs text-primary/70 font-medium bg-primary/10 px-2 py-1 rounded-full">
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Đã đọc</span>
                        </div>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-transform group-hover:translate-x-1" />
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p>Không tìm thấy chương nào phù hợp.</p>
          </div>
        )}
      </div>

      {/* 3. Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-border/50 bg-secondary/20">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="border-border hover:bg-background hover:text-primary"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Trước
          </Button>

          <span className="text-sm font-medium text-muted-foreground">
            Trang{" "}
            <span className="text-foreground font-bold">{currentPage}</span> /{" "}
            {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="border-border hover:bg-background hover:text-primary"
          >
            Sau <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
