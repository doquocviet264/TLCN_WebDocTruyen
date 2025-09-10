import { useState, useMemo } from "react"
import { Clock, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem
} from "@/components/ui/select"
import { Link } from "react-router-dom"

interface Chapter {
  number: number;
  title: string;
  time: string;
  isNew?: boolean;
  views?: number;
}

interface ChapterListProps {
  chapters: Chapter[];
  comicSlug: string;
}

export function ChapterList({ chapters, comicSlug }: ChapterListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const chaptersPerPage = 10;

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
      {displayedChapters.map((chapter) => (
        <Link
          key={chapter.number}
          to={`/comic/${comicSlug}/chapter/${chapter.number}`}
          className="block"
        >
          <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/40 transition-colors group cursor-pointer overflow-hidden">
            {/* Số chương + badge */}
            <div className="flex items-center space-x-2 min-w-[100px] shrink-0">
              <span className="font-medium text-sm group-hover:text-primary transition-colors">
                Chương {formatNumber(chapter.number)}
              </span>
              {chapter.isNew && (
                <Badge variant="destructive" className="text-xs px-2 py-0.5">Mới</Badge>
              )}
            </div>

            {/* Tên chương - căn trái và chiếm phần còn lại */}
            <span className="text-sm text-muted-foreground truncate font-medium flex-1 text-left">
              {chapter.title}
            </span>

            {/* Lượt xem */}
            <div className="flex items-center space-x-1 text-muted-foreground min-w-[90px] justify-end text-right">
              <Eye className="h-4 w-4" />
              <span className="text-xs tabular-nums">{(chapter.views || 0).toLocaleString()}</span>
            </div>

            {/* Ngày cập nhật */}
            <div className="flex items-center space-x-1 text-muted-foreground min-w-[140px] justify-end text-right">
              <Clock className="h-4 w-4" />
              <span className="text-xs tabular-nums">{formatDate(chapter.time)}</span>
            </div>
          </div>
        </Link>
      ))}
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

export default ChapterList;
