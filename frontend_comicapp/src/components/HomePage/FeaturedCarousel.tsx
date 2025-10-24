import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Comic {
  id: number;
  slug: string;
  title: string;
  chapter: number;
  image: string;
}
interface FeaturedResponse {
  success: boolean;
  data: Comic[];
  meta: any;
}

const formatNumber = (num: unknown) => {
    const parsed = typeof num === "number" ? num : Number(num);
    if (isNaN(parsed)||parsed === 0) return "mới";
    return Number.isInteger(parsed) ? parsed.toString() : parsed.toFixed(2).replace(/\.?0+$/, "");
};
const ComicCard = ({ slug, title, chapter, image }: Comic) => (
  <Link to={`/truyen-tranh/${slug}`} className="block w-[190px] h-[280px] rounded-lg shadow-md overflow-hidden relative group">
    {/* Ảnh nền */}
    <img 
      src={image || "/placeholder.svg"} 
      alt={title} 
      className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110" 
    />

    {/* Lớp phủ Gradient */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
    
    {/* Thông tin truyện */}
    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
      <h4 
        className="font-bold text-base truncate transition-all duration-300 
                   group-hover:whitespace-normal group-hover:line-clamp-2 group-hover:text-wrap"
      >
        {title}
      </h4>
      {/* Chương mới nhất */}
      <p className="text-sm font-light">{chapter ? `Chap ${formatNumber(chapter)}` : "Mới"}</p>
    </div>
  </Link>
);

//Component Carousel chính
const TRANSITION_DURATION_MS = 500;
export default function FeaturedCarousel() {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);

  const slideCount = comics.length;
  const clonedComics = useMemo(() => {
    if (slideCount === 0) return [];
    return [...comics, ...comics, ...comics];
  }, [comics]);
  const initialIndex = slideCount;

  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const ITEM_WIDTH = 190 + 16; // 190px width + 16px (mx-2)

  const goToNext = (): void => {
    if (!isTransitioning) return;
    setCurrentIndex((prevIndex) => prevIndex + 1);
  };

  const goToPrevious = (): void => {
    if (!isTransitioning) return;
    setCurrentIndex((prevIndex) => prevIndex - 1);
  };

  //Fetch dữ liệu từ API
  useEffect(() => {
    const fetchFeaturedComics = async () => {
      try {
        setLoading(true);
        const response = await axios.get<FeaturedResponse>(`${import.meta.env.VITE_API_URL}/comics/featured`);
        setComics(response.data.data || []);
        setCurrentIndex(response.data.data?.length || 0);
      } catch (error) {
        console.error("Không thể tải feature", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedComics();
  }, []);

  //Các hook xử lý logic carousel 
  useEffect(() => {
    if (!isTransitioning || slideCount === 0) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(goToNext, 3000); // Tăng thời gian chờ lên 3s
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [currentIndex, isTransitioning, slideCount]);

  useEffect(() => {
    if (slideCount === 0) return;
    if (currentIndex === initialIndex + slideCount) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(initialIndex);
      }, TRANSITION_DURATION_MS);
      return () => clearTimeout(timer);
    }
    if (currentIndex === initialIndex - 1) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(initialIndex + slideCount - 1);
      }, TRANSITION_DURATION_MS);
      return () => clearTimeout(timer);
    }
    if (!isTransitioning) {
      const timer = setTimeout(() => setIsTransitioning(true), 50);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, initialIndex, slideCount, isTransitioning]);
  //Giao diện khi đang tải dữ liệu
  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="flex gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="w-[190px] h-[280px] rounded-lg flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (comics.length === 0) return null;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      {/* Tiêu đề */}
      <h2 className="text-2xl sm:text-3xl font-montserrat font-bold text-foreground mb-4">
        Truyện Đề Cử
      </h2>
      <div className="relative overflow-hidden group/carousel">
        {/* Slider */}
        <div
          className={`flex ${isTransitioning ? 'transition-transform duration-500 ease-in-out' : 'transition-none'}`}
          style={{ transform: `translateX(-${currentIndex * ITEM_WIDTH}px)` }}
        >
          {clonedComics.map((comic, index) => (
            <div key={`${comic.id}-${index}`} className="mx-2 flex-shrink-0">
              <ComicCard
                id={comic.id}
                slug={comic.slug}
                title={comic.title}
                chapter={comic.chapter}
                image={comic.image}
              />
            </div>
          ))}
        </div>

        {/* Nút điều khiển */}
        <button
          onClick={goToPrevious}
          className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10 hover:bg-black/50"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={goToNext}
          className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10 hover:bg-black/50"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};
