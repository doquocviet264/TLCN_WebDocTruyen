import { Link } from "react-router-dom";
import { Loader2, BookOpen } from "lucide-react";

// Khai báo interface cho props
interface Comic {
  id: string | number;
  slug?: string;
  title: string;
  image?: string;
  lastChapter?: number | string;
}

interface SearchResultsProps {
  results: Comic[];
  isLoading: boolean;
  searchQuery: string;
  onViewAll: () => void;
  onClose: () => void;
  isMobile?: boolean;
}
const formatNumber = (num: unknown) => {
  const parsed = typeof num === "number" ? num : Number(num);
  if (isNaN(parsed) || parsed === 0) return "mới";
  return Number.isInteger(parsed)
    ? parsed.toString()
    : parsed.toFixed(2).replace(/\.?0+$/, "");
};
const SearchResults = ({ 
  results, 
  isLoading, 
  searchQuery, 
  onViewAll, 
  onClose,
  isMobile = false 
}: SearchResultsProps) => {
  if (isLoading) {
    return (
      <div className={`absolute top-full mt-2 w-full bg-card border border-border rounded-lg shadow-lg z-50 ${
        isMobile ? 'left-0 right-0 mx-4' : ''
      }`}>
        <div className="p-4 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm">Đang tìm kiếm...</span>
        </div>
      </div>
    );
  }

  if (!searchQuery) {
    return null;
  }

  return (
    <div className={`absolute top-full mt-2 w-full bg-card border border-border rounded-lg shadow-lg z-50 ${
      isMobile ? 'left-0 right-0 mx-4' : ''
    }`}>
      <div className="p-3 border-b border-border">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm">
            Kết quả tìm kiếm cho "<span className="text-primary">{searchQuery}</span>"
          </h3>
          <button 
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Đóng
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {results.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Không tìm thấy truyện phù hợp</p>
          </div>
        ) : (
          <>
            {results.slice(0, 10).map((comic, index) => (
            <Link
                key={comic.id || index}
                to={`/comic/${comic.slug || comic.id}`}
                className="flex items-center p-3 border-b border-border last:border-b-0 hover:bg-accent/50 transition-colors"
                onClick={onClose}
            >
                <img
                src={comic.image || "/placeholder-cover.jpg"}
                alt={comic.title}
                className="w-10 h-14 object-cover rounded flex-shrink-0"
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder-cover.jpg";
                }}
                />
                <div className="ml-3 flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-1">{comic.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                    {comic.lastChapter ? `Chapter ${formatNumber(comic.lastChapter)}` : 'Chưa có chapter'}
                </p>
                </div>
            </Link>
            ))}
            
            {results.length > 10 && (
              <button
                onClick={onViewAll}
                className="w-full p-3 text-center text-sm text-primary hover:bg-accent/50 border-t border-border"
              >
                Xem tất cả {results.length} kết quả
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResults;