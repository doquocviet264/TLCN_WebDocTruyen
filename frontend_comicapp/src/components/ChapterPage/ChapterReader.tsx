import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useReadingHistory } from "../../hook/useReadingHistory";
interface ChapterReaderProps {
  loading: boolean;
  images: string[];
  imageWidth: string; // vd: 'max-w-3xl'
  readingMode: 'long-strip' | 'paginated';
  currentPage: number;
  changePage: (direction: 'next' | 'prev') => void;
  comicId: number;
  chapterId: number;
  chapterNumber: number;
}

export function ChapterReader({ loading, images, imageWidth, readingMode, currentPage, changePage, comicId, chapterId, chapterNumber }: ChapterReaderProps) {
  useReadingHistory({
    comicId, 
    chapterId,
    chapterNumber
  });
  if (loading) {
    return (
      <div className={`mx-auto space-y-2 px-2 md:px-4 ${imageWidth}`}>
        <Skeleton className="h-[80vh] w-full" />
        <Skeleton className="h-[80vh] w-full" />
      </div>
    );
  }

  return (
    <div className={`mx-auto ${imageWidth} transition-all duration-300`}>
      <div className="flex flex-col items-center gap-1">
        {readingMode === 'long-strip' ? (
          images.map((src, index) => (
            <img
              key={index}
              src={src}
              alt={`Trang ${index + 1}`}
              className="w-full h-auto"
              loading="lazy"
            />
          ))
        ) : (
          <div className="w-full relative">
            <img
              src={images[currentPage]}
              alt={`Trang ${currentPage + 1}`}
              className="w-full h-auto mx-auto"
            />
            <div className="absolute top-1/2 left-0 right-0 flex justify-between transform -translate-y-1/2 px-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => changePage('prev')}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => changePage('next')}
                disabled={currentPage === images.length - 1}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
            <p className="text-center mt-2 text-muted-foreground">
              {currentPage + 1} / {images.length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
