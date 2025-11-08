import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { CommunityHeader } from "../components/CommunityPage/CommunityHeader";
import { CommunityComposer } from "../components/CommunityPage/CommunityComposer";
import { CommunityFeed } from "../components/CommunityPage/CommunityFeed";
import { CommunitySidebar } from "../components/CommunityPage/CommunitySidebar";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import { PostCardData } from "../components/CommunityPage/PostCard";

type PostType = "review" | "find_similar";
type PostTypeOrAll = PostType | "all";
type SortUI = "NEW" | "TOP_LIKES" | "TOP_COMMENTS";

type FetchPostParams = {
  page: number;
  q?: string;
  type?: PostTypeOrAll;
  sort?: SortUI;
  genres?: string[]; // Sidebar vẫn trả NAME
  pageSize?: number;
};

type ApiOk<T> = { success: true; data: T; meta?: unknown };
type Genre = { genreId: number; name: string };

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";

// gắn token/cookie cho mọi request (nếu cần)
function authConfig() {
  const token = localStorage.getItem("token");
  return {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  } as const;
}

export default function CommunityPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<PostTypeOrAll>("all");
  const [sort, setSort] = useState<SortUI>("NEW");
  const [genres, setGenres] = useState<string[]>([]); // tên

  // Genres cho sidebar (fetch từ API)
  const [genresMaster, setGenresMaster] = useState<Genre[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setGenresLoading(true);
        const res = await axios.get<ApiOk<Genre[]>>(`${API_BASE}/genres`, authConfig());
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setGenresMaster(list);
      } catch (e: any) {
        const msg =
          e?.response?.data?.error?.message ||
          e?.response?.data?.message ||
          e?.message ||
          "Lỗi khi lấy thể loại";
        toast.error(msg);
        setGenresMaster([]);
      } finally {
        setGenresLoading(false);
      }
    })();
  }, []);

  // map tên -> id để FE chuyển sang genreIds cho BE
  const genreNameToId = useMemo<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    for (const g of genresMaster) {
      if (g?.name) m[g.name] = g.genreId;
    }
    return m;
  }, [genresMaster]);

  // Trigger Feed refresh (sau khi đăng bài)
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  const filters: Omit<FetchPostParams, "page"> = useMemo(
    () => ({ q, type, sort, genres }),
    [q, type, sort, genres]
  );

  const hasActiveFilters = useMemo(() => {
    return q.trim() !== "" || type !== "all" || sort !== "NEW" || genres.length > 0;
  }, [q, type, sort, genres]);

  const clearFilters = () => {
    setQ("");
    setType("all");
    setSort("NEW");
    setGenres([]);
  };

  return (
    <div className="min-h-screen">
      <CommunityHeader
        q={q}
        setQ={setQ}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <main className="flex-1 container px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột chính (Composer + Feed) */}
        <section className="lg:col-span-2 space-y-6">
          <CommunityComposer onPostCreated={triggerRefresh} />

          <CommunityFeed
            filters={filters}
            sort={sort}
            setSort={setSort}
            type={type}
            setType={setType}
            refreshKey={refreshKey}
            apiBase={API_BASE}
            genreNameToId={genreNameToId}   // ✅ truyền map để Feed tự convert sang genreIds
          />
        </section>

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <CommunitySidebar
            allGenres={genresMaster.map((g) => g.name)} // ✅ Sidebar vẫn dùng tên
            selectedGenres={genres}
            onGenresChange={setGenres}
          />
          {/* Bạn có thể hiển thị skeleton/loader khi genresLoading === true */}
        </aside>
      </main>
    </div>
  );
}
