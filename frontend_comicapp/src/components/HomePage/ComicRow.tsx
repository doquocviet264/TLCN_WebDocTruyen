import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react"; 
import { useRef } from "react";

// --- Interfaces ---
interface Comic {
  id?: string;
  comicId?: string;
  slug: string;
  title: string;
  image: string;
  lastChapter?: number | null; 
}

interface ComicRowProps {
  title: string;
  comics: Comic[];
  isLoading?: boolean;
}
const formatNumber = (num: unknown) => {
    const parsed = typeof num === "number" ? num : Number(num);
    if (isNaN(parsed)||parsed === 0) return "mới";
    return Number.isInteger(parsed) ? parsed.toString() : parsed.toFixed(2).replace(/\.?0+$/, "");
  };
// --- Component Card cho mỗi truyện trong hàng ---
const ComicRowCard = ({ comic }: { comic: Comic }) => (
  <Link to={`/truyen-tranh/${comic.slug}`} className="block w-40 flex-shrink-0 group">
    <div className="relative overflow-hidden rounded-lg shadow-md aspect-[3/4]">
      {/* Ảnh nền */}
      <img
        src={comic.image || "/placeholder.svg"}
        alt={comic.title}
        className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
      />
      {/* Lớp phủ Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      {/* Thông tin truyện */}
      <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
        <h4 className="font-semibold text-sm truncate group-hover:whitespace-normal group-hover:line-clamp-2">
          {comic.title}
        </h4>
        <p className="text-xs font-light">
          {comic.lastChapter ? `Chap ${formatNumber(comic.lastChapter)}` : "Mới"}
        </p>
      </div>
    </div>
  </Link>
);

// --- Component Skeleton ---
const ComicRowSkeleton = () => (
  <div>
    <Skeleton className="h-8 w-48 mb-4" />
    <div className="flex gap-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={i} className="w-40 h-[213px] rounded-lg flex-shrink-0" />
      ))}
    </div>
  </div>
);

// --- Component Chính ---
export function ComicRow({ title, comics, isLoading }: ComicRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  };

  if (isLoading) {
    return <ComicRowSkeleton />;
  }

  if (!comics || comics.length === 0) {
    return null;
  }

  return (
    <section>
      {/* Tiêu đề + nút */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl sm:text-3xl font-montserrat font-bold text-foreground">
          {title}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll("left")}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Danh sách truyện */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mb-4"
      >
        {comics.map((comic) => (
          <ComicRowCard key={comic.comicId || comic.id} comic={comic} />
        ))}
      </div>
    </section>
  );
}

export default ComicRow;
