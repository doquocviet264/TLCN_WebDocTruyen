import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Search, Filter, SlidersHorizontal, X, Loader2, Globe, Tag, Info, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ComicCard } from "@/components/ComicCard";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

// --- Config Data ---
const statuses = [
  { value: "Đang cập nhật", label: "Đang tiến hành" },
  { value: "Hoàn thành", label: "Đã hoàn thành" },
  { value: "Tạm ngưng", label: "Tạm ngưng" }
];

const countries = [
  { value: "all", label: "Tất cả quốc gia" },
  { value: "nhat-ban", label: "🇯🇵 Manga" },
  { value: "han-quoc", label: "🇰🇷 Manhwa" },
  { value: "trung-quoc", label: "🇨🇳 Manhua" },
  { value: "my", label: "🇺🇸 Comic" },
  { value: "viet-nam", label: "🇻🇳 Việt Nam" },
];

const sortOptions = [
    { value: "newest", label: "Mới cập nhật" },
    { value: "oldest", label: "Cũ nhất" },
    { value: "rating", label: "Đánh giá cao" },
    { value: "popular", label: "Xem nhiều nhất" },
];

// --- Types ---
type ApiOk<T> = { success: true; data: T; meta?: unknown };
type ApiErr = { success: false; error: { message: string; code: string; status: number } };

interface Comic {
  id: number;
  slug: string;
  title: string;
  image: string;
  lastChapter: number | string;
}

interface SearchData {
  comics: Comic[];
  totalComics: number;
  totalPages: number;
  currentPage: number;
}
interface Genre {
  id: number;
  name: string;
}

const formatNumber = (num: unknown) => {
  const parsed = typeof num === "number" ? num : Number(num);
  if (isNaN(parsed) || parsed === 0) return "mới";
  return Number.isInteger(parsed)
    ? parsed.toString()
    : parsed.toFixed(2).replace(/\.?0+$/, "");
};

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const queryFromURL = searchParams.get("q") || "";

  // --- States ---
  const [filters, setFilters] = useState({
    searchQuery: "",
    selectedGenres: [] as string[],
    selectedStatus: "all",
    selectedCountry: "all",
    sortBy: "newest",
  });
  // Gộp appliedFilters vào logic chung để đơn giản hóa,
  // Mỗi khi user đổi filter -> update state -> trigger useEffect fetch
  // Nếu muốn nút "Áp dụng" trên mobile, ta có thể tách ra sau.
  // Ở bản này mình làm "Live Filter" (chọn là lọc ngay) cho mượt.

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [comics, setComics] = useState<Comic[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalComics, setTotalComics] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenreExpanded, setIsGenreExpanded] = useState(false);

  const [genres, setGenres] = useState<string[]>([]);
  const itemsPerPage = 40;

  // --- Effects ---
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await axios.get<ApiOk<Genre[]>>(`${import.meta.env.VITE_API_URL}/genres`);
        if (res.data?.success && Array.isArray(res.data.data)) {
          setGenres(res.data.data.map((g) => g.name).filter(Boolean));
        }
      } catch (error) { console.error("Lỗi lấy genres"); }
    };
    fetchGenres();
  }, []);

  useEffect(() => {
    if (queryFromURL) {
      setFilters((prev) => ({ ...prev, searchQuery: queryFromURL }));
      setCurrentPage(1);
    }
  }, [queryFromURL]);

  // Main Fetch Effect - Trigger khi filters hoặc page thay đổi
  useEffect(() => {
    const fetchComics = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          q: filters.searchQuery,
          genres: filters.selectedGenres.join(","),
          status: filters.selectedStatus,
          country: filters.selectedCountry,
          sortBy: filters.sortBy,
          page: String(currentPage),
          limit: String(itemsPerPage),
        });

        const res = await axios.get<ApiOk<SearchData> | ApiErr>(
          `${import.meta.env.VITE_API_URL}/comics/search?${params.toString()}`
        );

        if (res.data.success) {
          const data = (res.data as ApiOk<SearchData>).data;
          setComics(data.comics || []);
          setTotalPages(data.totalPages || 1);
          setTotalComics(data.totalComics || 0);
        } else {
          setComics([]); setTotalPages(1); setTotalComics(0);
        }
      } catch (error) {
        // toast.error("Lỗi kết nối"); // Optional: đỡ spam toast khi gõ search liên tục
        setComics([]);
      } finally {
        setIsLoading(false);
        if (currentPage > 1) window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    // Debounce nhẹ cho search text
    const timeoutId = setTimeout(() => {
        fetchComics();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters, currentPage]);

  // --- Handlers ---
  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset về trang 1 khi đổi filter
  };

  const toggleGenre = (genre: string) => {
    setFilters((prev) => {
      const isSelected = prev.selectedGenres.includes(genre);
      return {
        ...prev,
        selectedGenres: isSelected
          ? prev.selectedGenres.filter((g) => g !== genre)
          : [...prev.selectedGenres, genre],
      };
    });
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
      setFilters({
          searchQuery: "",
          selectedGenres: [],
          selectedStatus: "all",
          selectedCountry: "all",
          sortBy: "newest"
      });
      setCurrentPage(1);
  }

  // --- Helpers for Active Chips ---
  const activeFiltersCount = useMemo(() => {
      let count = filters.selectedGenres.length;
      if (filters.searchQuery) count++;
      if (filters.selectedStatus !== 'all') count++;
      if (filters.selectedCountry !== 'all') count++;
      return count;
  }, [filters]);

  const displayedGenres = isGenreExpanded ? genres : genres.slice(0, 20);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-[400px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none z-0" />

      <div className="container mx-auto px-4 py-8 relative z-10">
        
        {/* --- HERO SEARCH --- */}
        <div className="max-w-4xl mx-auto space-y-6 mb-10 text-center">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500 animate-in fade-in slide-in-from-top-4 duration-700">
                Thư Viện Truyện
            </h1>
            
            <div className="relative group max-w-2xl mx-auto">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative flex items-center bg-card rounded-full shadow-xl border border-border/50 overflow-hidden h-14">
                    <Search className="ml-5 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm tên truyện, tác giả..."
                        value={filters.searchQuery}
                        onChange={(e) => handleFilterChange("searchQuery", e.target.value)}
                        className="border-0 shadow-none h-full text-lg bg-transparent focus-visible:ring-0 rounded-none placeholder:text-muted-foreground/50 px-4"
                    />
                    {filters.searchQuery && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="mr-2 h-8 w-8 rounded-full hover:bg-muted"
                            onClick={() => handleFilterChange("searchQuery", "")}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>

        {/* --- FILTER PANEL --- */}
        <div className="bg-card/40 backdrop-blur-md border border-border/60 rounded-[24px] p-6 mb-8 shadow-sm animate-in slide-in-from-bottom-4 duration-700">
            {/* 1. Dropdown Filters */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center mb-6">
                <div className="flex items-center gap-2 text-primary font-bold text-lg">
                    <SlidersHorizontal className="w-5 h-5" />
                    <span>Bộ lọc</span>
                </div>
                
                <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                    <Select value={filters.sortBy} onValueChange={(val) => handleFilterChange("sortBy", val)}>
                        <SelectTrigger className="w-[160px] bg-background/50 border-border h-10 rounded-xl">
                            <SelectValue placeholder="Sắp xếp" />
                        </SelectTrigger>
                        <SelectContent>
                            {sortOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={filters.selectedStatus} onValueChange={(val) => handleFilterChange("selectedStatus", val)}>
                        <SelectTrigger className="w-[160px] bg-background/50 border-border h-10 rounded-xl">
                            <SelectValue placeholder="Tình trạng" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả tình trạng</SelectItem>
                            {statuses.map(st => <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={filters.selectedCountry} onValueChange={(val) => handleFilterChange("selectedCountry", val)}>
                        <SelectTrigger className="w-[180px] bg-background/50 border-border h-10 rounded-xl">
                            <SelectValue placeholder="Quốc gia" />
                        </SelectTrigger>
                        <SelectContent>
                            {countries.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Separator className="bg-border/50 mb-6" />

            {/* 2. Genre Cloud */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <Filter className="w-4 h-4" /> Thể loại
                    </span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {displayedGenres.map((genre) => {
                        const isSelected = filters.selectedGenres.includes(genre);
                        return (
                            <Badge
                                key={genre}
                                variant="outline"
                                onClick={() => toggleGenre(genre)}
                                className={cn(
                                    "cursor-pointer px-3 py-1.5 text-sm transition-all duration-200 select-none rounded-lg border",
                                    isSelected 
                                        ? "bg-primary/10 border-primary text-primary shadow-[0_0_10px_rgba(var(--primary),0.2)]" 
                                        : "bg-background/50 border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                                )}
                            >
                                {genre}
                            </Badge>
                        )
                    })}
                    {genres.length > 20 && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setIsGenreExpanded(!isGenreExpanded)}
                            className="h-8 text-xs text-primary hover:text-primary/80"
                        >
                            {isGenreExpanded ? "Thu gọn" : `+${genres.length - 20} khác`}
                        </Button>
                    )}
                </div>
            </div>

            {/* --- 3. ACTIVE FILTERS CHIPS (Phần mới thêm) --- */}
            {activeFiltersCount > 0 && (
                <div className="pt-4 border-t border-border/50 animate-in fade-in zoom-in duration-300">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground mr-2">Đang lọc:</span>
                        
                        {/* Chip: Reset All */}
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={clearAllFilters}
                            className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg gap-1"
                        >
                            <RotateCcw className="w-3 h-3" /> Xóa tất cả
                        </Button>

                        {/* Chip: Search Query */}
                        {filters.searchQuery && (
                            <Badge variant="secondary" className="h-7 px-2 gap-1 bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-colors group cursor-pointer" onClick={() => handleFilterChange("searchQuery", "")}>
                                <Search className="w-3 h-3" /> "{filters.searchQuery}"
                                <X className="w-3 h-3 ml-1 opacity-50 group-hover:opacity-100" />
                            </Badge>
                        )}

                        {/* Chips: Country */}
                        {filters.selectedCountry !== 'all' && (
                            <Badge variant="secondary" className="h-7 px-2 gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-colors group cursor-pointer" onClick={() => handleFilterChange("selectedCountry", "all")}>
                                <Globe className="w-3 h-3" /> {countries.find(c => c.value === filters.selectedCountry)?.label}
                                <X className="w-3 h-3 ml-1 opacity-50 group-hover:opacity-100" />
                            </Badge>
                        )}

                        {/* Chips: Status */}
                        {filters.selectedStatus !== 'all' && (
                            <Badge variant="secondary" className="h-7 px-2 gap-1 bg-purple-500/10 text-purple-600 border-purple-500/20 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-colors group cursor-pointer" onClick={() => handleFilterChange("selectedStatus", "all")}>
                                <Info className="w-3 h-3" /> {statuses.find(s => s.value === filters.selectedStatus)?.label}
                                <X className="w-3 h-3 ml-1 opacity-50 group-hover:opacity-100" />
                            </Badge>
                        )}

                        {/* Chips: Genres */}
                        {filters.selectedGenres.map(genre => (
                            <Badge 
                                key={genre}
                                variant="secondary" 
                                className="h-7 px-2 gap-1 bg-primary/10 text-primary border-primary/20 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-colors group cursor-pointer" 
                                onClick={() => toggleGenre(genre)}
                            >
                                <Tag className="w-3 h-3" /> {genre}
                                <X className="w-3 h-3 ml-1 opacity-50 group-hover:opacity-100" />
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* --- RESULTS SECTION --- */}
        <div className="space-y-6">
            <div className="flex items-center justify-between">
               <h2 className="text-2xl font-bold flex items-center gap-2">
                  Kết quả <Badge variant="secondary" className="rounded-lg px-2.5 bg-secondary text-secondary-foreground">{totalComics}</Badge>
               </h2>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {Array.from({length: 12}).map((_, i) => (
                        <div key={i} className="aspect-[2/3] rounded-xl bg-muted animate-pulse" />
                    ))}
                </div>
            ) : comics.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-card/30 rounded-[32px] border border-dashed border-border/50">
                    <div className="p-4 rounded-full bg-muted/50 mb-4">
                        <Search className="w-10 h-10 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Không tìm thấy truyện nào</h3>
                    <p className="text-muted-foreground max-w-md mb-6">
                        Thử thay đổi từ khóa hoặc bộ lọc của bạn để tìm được kết quả tốt hơn nhé.
                    </p>
                    <Button variant="outline" onClick={clearAllFilters} className="rounded-xl">Xóa toàn bộ lọc</Button>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {comics.map((comic) => (
                        <ComicCard
                            key={comic.id}
                            imageUrl={comic.image}
                            title={comic.title}
                            href={`/truyen-tranh/${comic.slug}`}
                            lastChapter={formatNumber(comic.lastChapter)}
                            lastChapterUrl={`/truyen-tranh/${comic.slug}/chapter/${formatNumber(comic.lastChapter)}`}
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
                <div className="flex justify-center mt-12 pb-8">
                    <div className="flex items-center gap-1.5 bg-card/50 backdrop-blur border border-border p-2 rounded-2xl shadow-lg">
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => p - 1)}
                            className="rounded-xl w-10 h-10"
                        >
                            {"<"}
                        </Button>

                        <div className="flex gap-1 px-2 overflow-x-auto max-w-[200px] sm:max-w-none scrollbar-hide">
                            {Array.from({ length: totalPages }).map((_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1))
                                .map((page, i, arr) => {
                                    const prev = arr[i - 1];
                                    return (
                                        <div key={page} className="flex items-center">
                                            {prev && page - prev > 1 && <span className="text-muted-foreground px-1 text-xs">...</span>}
                                            <Button
                                                variant={page === currentPage ? "default" : "ghost"}
                                                size="sm"
                                                onClick={() => setCurrentPage(page)}
                                                className={cn("w-10 h-10 rounded-xl font-bold transition-all text-sm", page === currentPage && "shadow-md")}
                                            >
                                                {page}
                                            </Button>
                                        </div>
                                    );
                                })}
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((p) => p + 1)}
                            className="rounded-xl w-10 h-10"
                        >
                            {">"}
                        </Button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}