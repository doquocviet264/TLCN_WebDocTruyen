import React, { useState, useEffect, useRef, useMemo } from "react";
import poster from "./poster.png";

// --- Các interface và component ComicCard giữ nguyên ---
interface Comic {
  id: number;
  title: string;
  chapter: string;
  image: string;
}

interface ComicCardProps {
  title: string;
  chapter: string;
  imageUrl: string;
}

const ComicCard: React.FC<ComicCardProps> = ({ title, chapter, imageUrl }) => (
  <div className="rounded-lg shadow-md overflow-hidden bg-card w-[190px]">
    <img src={imageUrl} alt={title} className="w-full h-[280px] object-cover" />
    <div className="p-2">
      <h4 className="text-sm font-semibold truncate">{title}</h4>
      <p className="text-xs text-muted-foreground">{chapter}</p>
    </div>
  </div>
);

const featuredComics: Comic[] = [
  { id: 1, title: "One Piece", chapter: "Chap 1125", image: poster },
  { id: 2, title: "Jujutsu Kaisen", chapter: "Chap 265", image: poster },
  { id: 3, title: "My Hero Academia", chapter: "Chap 432", image: poster },
  { id: 4, title: "Solo Leveling", chapter: "Chap 179", image: poster },
  { id: 5, title: "Attack on Titan", chapter: "Chap 139", image: poster },
  { id: 6, title: "Naruto", chapter: "Chap 700", image: poster },
  { id: 7, title: "Bleach", chapter: "Chap 686", image: poster },
];

const TRANSITION_DURATION_MS = 500;

const FeaturedCarousel: React.FC = () => {
  const slideCount = featuredComics.length;
  const clonedComics = useMemo(() => {
    return [...featuredComics, ...featuredComics, ...featuredComics];
  }, []);
  const initialIndex = slideCount;

  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const ITEM_WIDTH = 190 + 16; // 190px width + 16px (mx-2)

  // --- Hàm di chuyển ---
  const goToNext = (): void => {
    if (!isTransitioning) return;
    setCurrentIndex((prevIndex) => prevIndex + 1);
  };

  const goToPrevious = (): void => {
    if (!isTransitioning) return;
    setCurrentIndex((prevIndex) => prevIndex - 1);
  };

  // --- Hook để tự động di chuyển ---
  useEffect(() => {
    if (!isTransitioning) return; // Không tự động chạy khi đang reset vị trí

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      goToNext();
    }, 2000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentIndex, isTransitioning]);

  // --- Hook xử lý hiệu ứng lặp vô tận ---
  useEffect(() => {
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
      const enableTransitionTimer = setTimeout(() => {
        setIsTransitioning(true);
      }, 50);
      return () => clearTimeout(enableTransitionTimer);
    }
  }, [currentIndex, initialIndex, slideCount, isTransitioning]);

  if (clonedComics.length === 0) {
    return null;
  }

  return (
    <div className="relative overflow-hidden w-full group">
      <div
        className={`flex ease-in-out ${isTransitioning ? 'transition-transform duration-500' : 'transition-none'}`}
        style={{ transform: `translateX(-${currentIndex * ITEM_WIDTH}px)` }}
      >
        {clonedComics.map((comic, index) => (
          <div key={`${comic.id}-${index}`} className="mx-2 flex-shrink-0">
            <ComicCard
              title={comic.title}
              chapter={comic.chapter}
              imageUrl={comic.image}
            />
          </div>
        ))}
      </div>

      <button
        onClick={goToPrevious}
        className="absolute top-1/2 left-2 -translate-y-1/2 bg-black bg-opacity-30 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-opacity-50"
        aria-label="Previous slide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={goToNext}
        className="absolute top-1/2 right-2 -translate-y-1/2 bg-black bg-opacity-30 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-opacity-50"
        aria-label="Next slide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default FeaturedCarousel;