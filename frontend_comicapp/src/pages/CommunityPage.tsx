import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { MessageCircle, Loader2 } from "lucide-react"; // Icon nút chat & loading

// --- Component Imports ---
import { CommunityHeader } from "../components/CommunityPage/CommunityHeader";
import { CommunityComposer } from "../components/CommunityPage/CommunityComposer";
import { CommunityFeed } from "../components/CommunityPage/CommunityFeed";
import { CommunitySidebar } from "../components/CommunityPage/CommunitySidebar";
import CommunityChat from "../components/CommunityPage/CommunityChat";
import { Button } from "@/components/ui/button";

// --- Types ---
type PostType = "review" | "find_similar";
type PostTypeOrAll = PostType | "all";
type SortUI = "NEW" | "TOP_LIKES" | "TOP_COMMENTS";

type FetchPostParams = {
  page: number;
  q?: string;
  type?: PostTypeOrAll;
  sort?: SortUI;
  genres?: string[];
  pageSize?: number;
};

type ApiOk<T> = { success: true; data: T; meta?: unknown };
type Genre = { genreId: number; name: string };

// --- Config ---
const API_BASE = import.meta.env.VITE_API_URL;

function authConfig() {
  const token = localStorage.getItem("token");
  return {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  } as const;
}

export default function CommunityPage() {
  // --- States ---
  const [q, setQ] = useState("");
  const [type, setType] = useState<PostTypeOrAll>("all");
  const [sort, setSort] = useState<SortUI>("NEW");
  const [genres, setGenres] = useState<string[]>([]); // Lưu tên thể loại đã chọn
  const [isChatVisible, setIsChatVisible] = useState(false);

  // Dữ liệu Genres cho Sidebar
  const [genresMaster, setGenresMaster] = useState<Genre[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);

  // Refresh Feed Key
  const [refreshKey, setRefreshKey] = useState(0);

  // --- Effects ---

  // 1. Fetch danh sách thể loại khi load trang
  useEffect(() => {
    (async () => {
      try {
        setGenresLoading(true);
        const res = await axios.get<ApiOk<Genre[]>>(
          `${API_BASE}/genres`,
          authConfig()
        );
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setGenresMaster(list);
      } catch (e: any) {
        console.error("Lỗi lấy genres:", e);
        // Không toast lỗi này để tránh làm phiền user nếu API lỗi ngầm
        setGenresMaster([]);
      } finally {
        setGenresLoading(false);
      }
    })();
  }, []);

  // 2. Map tên thể loại -> ID (Để Feed sử dụng khi gọi API lọc)
  const genreNameToId = useMemo<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    for (const g of genresMaster) {
      if (g?.name) m[g.name] = g.genreId;
    }
    return m;
  }, [genresMaster]);

  // --- Helpers ---

  // Trigger reload feed khi đăng bài mới
  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  // Object filters truyền vào Feed
  const filters: Omit<FetchPostParams, "page"> = useMemo(
    () => ({ q, type, sort, genres }),
    [q, type, sort, genres]
  );

  // Kiểm tra có đang lọc gì không để hiện nút "Xóa bộ lọc"
  const hasActiveFilters = useMemo(() => {
    return (
      q.trim() !== "" || type !== "all" || sort !== "NEW" || genres.length > 0
    );
  }, [q, type, sort, genres]);

  const clearFilters = () => {
    setQ("");
    setType("all");
    setSort("NEW");
    setGenres([]);
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 relative">
      {/* 1. Header (Thanh tìm kiếm & Filter chính) */}
      <CommunityHeader
        q={q}
        setQ={setQ}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* 2. Main Layout (Grid 12 Cột) */}
      <main className="flex-1 container px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* CỘT CHÍNH (Chiếm 8-9 phần): Đăng bài & Danh sách bài viết */}
        <section className="lg:col-span-8 xl:col-span-9 space-y-8 min-w-0">
          {/* Composer: Khung đăng bài */}
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <CommunityComposer onPostCreated={triggerRefresh} />
          </div>

          {/* Feed: Danh sách bài đăng */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <CommunityFeed
              filters={filters}
              sort={sort}
              setSort={setSort}
              type={type}
              setType={setType}
              refreshKey={refreshKey}
              apiBase={API_BASE}
              genreNameToId={genreNameToId}
            />
          </div>
        </section>

        {/* SIDEBAR (Chiếm 3-4 phần): Bộ lọc chi tiết & Mẹo */}
        <aside className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 space-y-6">
          {/* Skeleton loading khi chưa tải xong genre */}
          {genresLoading ? (
            <div className="space-y-4 p-4 border rounded-xl bg-card/50">
              <div className="h-6 bg-muted rounded w-1/2 animate-pulse" />
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-16 bg-muted rounded-md animate-pulse"
                  />
                ))}
              </div>
            </div>
          ) : (
            <CommunitySidebar
              allGenres={genresMaster.map((g) => g.name)}
              selectedGenres={genres}
              onGenresChange={setGenres}
            />
          )}
        </aside>
      </main>

      {/* 3. Floating Chat Button (Nút chat nổi) */}
      <Button
        onClick={() => setIsChatVisible(!isChatVisible)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_20px_rgba(var(--primary),0.4)] transition-all duration-300 hover:scale-110 flex items-center justify-center border-2 border-background"
        aria-label={isChatVisible ? "Close chat" : "Open chat"}
      >
        <MessageCircle
          className={`w-7 h-7 transition-transform duration-300 ${
            isChatVisible ? "rotate-90 scale-0" : "scale-100"
          }`}
        />
        <span
          className={`absolute transition-transform duration-300 text-xl font-bold ${
            isChatVisible ? "scale-100 rotate-0" : "scale-0 -rotate-90"
          }`}
        >
          ✕
        </span>
      </Button>

      {/* 4. Chat Window (Cửa sổ chat) */}
      {isChatVisible && (
        <div className="fixed bottom-24 right-6 z-40 w-[350px] sm:w-[400px] h-[500px] max-h-[70vh] bg-card border border-border shadow-2xl rounded-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 origin-bottom-right">
          <CommunityChat />
        </div>
      )}
    </div>
  );
}
