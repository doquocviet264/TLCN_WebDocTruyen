import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ComicCard } from "@/components/ComicCard";
import { useSearchParams } from "react-router-dom";
const statuses = ["Đang cập nhật", "Hoàn thành", "Tạm ngưng"];

const countries = [
  { value: "all", label: "Tất cả quốc gia" },
  { value: "nhat-ban", label: "Nhật Bản", genre: "Manga" },
  { value: "han-quoc", label: "Hàn Quốc", genre: "Manhwa" },
  { value: "trung-quoc", label: "Trung Quốc", genre: "Manhua" },
  { value: "my", label: "Mỹ", genre: "Comic" },
  { value: "viet-nam", label: "Việt Nam", genre: "Việt Nam" },
];

interface Comic {
  id: number;
  slug: string;
  title: string;
  image: string;
  lastChapter: number;
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
  const [filters, setFilters] = useState({
    searchQuery: "",
    selectedGenres: [] as string[],
    selectedStatus: "all",
    selectedCountry: "all",
    sortBy: "newest",
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [comics, setComics] = useState<Comic[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalComics, setTotalComics] = useState<number>(0);
  const itemsPerPage = 40;
  const [genres, setGenres] = useState<string[]>([]);

  // Lấy query từ URL
  const query = searchParams.get("q") || "";

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/genre`);
        if (!res.ok) throw new Error("Lỗi khi lấy genres");
        const data = await res.json();
        setGenres(data.map((g: any) => g.name));
      } catch (err) {
        console.error(err);
      }
    };
    fetchGenres();
  }, []);

  // Effect chính để fetch dữ liệu
  useEffect(() => {
    const fetchComics = async () => {
      try {
        // Ưu tiên query từ URL, nếu không có thì dùng từ appliedFilters
        const searchQuery = query || appliedFilters.searchQuery;
        
        const queryParams = new URLSearchParams({
          q: searchQuery,
          genres: appliedFilters.selectedGenres.join(","),
          status: appliedFilters.selectedStatus,
          country: appliedFilters.selectedCountry,
          sortBy: appliedFilters.sortBy,
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
        });
        
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/comics/search?${queryParams}`
        );
        
        if (!response.ok) throw new Error("Lỗi khi lấy dữ liệu");
        const data = await response.json();
        
        setComics(data.comics || []);
        setTotalPages(data.totalPages || 1);
        setTotalComics(data.totalComics || 0);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu truyện:", error);
        setComics([]);
        setTotalPages(1);
        setTotalComics(0);
      }
    };
    
    fetchComics();
  }, [query, appliedFilters, currentPage]); // Thêm query vào dependencies

  // Cập nhật filters khi query thay đổi (cho UI)
  useEffect(() => {
    if (query) {
      setFilters(prev => ({ ...prev, searchQuery: query }));
    }
  }, [query]);

  // Các hàm xử lý filter giữ nguyên
  const handleGenreChange = (genre: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      selectedGenres: checked
        ? [...prev.selectedGenres, genre]
        : prev.selectedGenres.filter((g) => g !== genre),
    }));
  };

  const handleFilterChange = (key: keyof typeof filters, value: string | string[]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setAppliedFilters(filters);
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-montserrat font-bold">Tìm kiếm truyện</h1>

        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            placeholder="Tìm theo tên truyện, tác giả..."
            value={filters.searchQuery}
            onChange={(e) => handleFilterChange("searchQuery", e.target.value)}
            className="pl-10 h-12 text-lg bg-card/60 backdrop-blur-sm border-border"
          />
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <Select
            value={filters.sortBy}
            onValueChange={(value) => handleFilterChange("sortBy", value)}
          >
            <SelectTrigger className="w-auto">
              <SelectValue placeholder="Sắp xếp theo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="oldest">Cũ nhất</SelectItem>
              <SelectItem value="rating">Đánh giá cao</SelectItem>
              <SelectItem value="popular">Phổ biến</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.selectedStatus}
            onValueChange={(value) => handleFilterChange("selectedStatus", value)}
          >
            <SelectTrigger className="w-auto">
              <SelectValue placeholder="Chọn tình trạng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả tình trạng</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.selectedCountry}
            onValueChange={(value) =>
              handleFilterChange("selectedCountry", value)
            }
          >
            <SelectTrigger className="w-auto">
              <SelectValue placeholder="Chọn quốc gia" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.value} value={country.value}>
                  {country.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={applyFilters} className="ml-2">
            Lọc
          </Button>
        </div>
      </div>

      <Card className="p-4 bg-card/60 backdrop-blur-sm border-border">
        <h3 className="font-semibold mb-3">Chọn thể loại</h3>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {genres.map((genre) => (
            <div key={genre} className="flex items-center space-x-2">
              <Checkbox
                id={genre}
                checked={filters.selectedGenres.includes(genre)}
                onCheckedChange={(checked) =>
                  handleGenreChange(genre, !!checked)
                }
                className="border border-muted-foreground data-[state=unchecked]:bg-background"
              />
              <label
                htmlFor={genre}
                className="text-sm cursor-pointer select-none"
              >
                {genre}
              </label>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">
            Kết quả tìm kiếm ({totalComics} truyện)
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {comics.map((comic) => (
            <ComicCard
              key={comic.id}
              imageUrl={comic.image}
              title={comic.title}
              href={`/truyen-tranh/${comic.slug}`}
              lastChapter={formatNumber(comic.lastChapter)}
              lastChapterUrl={`/truyen-tranh/${comic.slug}/chapter/${formatNumber(
                comic.lastChapter
              )}`}
            />
          ))}
        </div>

        {comics.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Không tìm thấy truyện phù hợp với bộ lọc.
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              {"<"}
            </Button>

            {Array.from({ length: totalPages })
              .map((_, i) => i + 1)
              .filter(
                (page) =>
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 2 && page <= currentPage + 2)
              )
              .map((page, i, arr) => {
                const prev = arr[i - 1];
                if (prev && page - prev > 1) {
                  return (
                    <span key={`ellipsis-${page}`} className="px-2">
                      ...
                    </span>
                  );
                }
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                );
              })}

            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              {">"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
