import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useDetailedReadingHistory } from "../../hook/useReadingHistory";

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
  // Props cho tính năng tự động chạy
  isAutoPlayOn: boolean;
  autoScrollSpeed: number;
  autoPageInterval: number;
  setIsAutoPlayOn: (value: boolean) => void;
}

export function ChapterReader({
  loading,
  images,
  imageWidth,
  readingMode,
  currentPage,
  changePage,
  comicId,
  chapterId,
  chapterNumber,
  isAutoPlayOn,
  autoScrollSpeed,
  autoPageInterval,
  setIsAutoPlayOn,
}: ChapterReaderProps) {
  
  // Hook để lưu lịch sử đọc
  useDetailedReadingHistory({
    comicId,
    chapterId,
    chapterNumber
  });

  // Ref để lưu ID của interval, giúp quản lý và xóa nó một cách an toàn
  const intervalRef = useRef<number | null>(null);

  // useEffect để xử lý logic tự động chạy
  useEffect(() => {
    // Hàm cleanup để đảm bảo interval cũ bị xóa trước khi tạo cái mới
    const cleanup = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Nếu chế độ tự động chạy được bật
    if (isAutoPlayOn) {
      if (readingMode === 'long-strip') {
        const pixelsPerTick = autoScrollSpeed / 2; // Tinh chỉnh giá trị để tốc độ hợp lý
        intervalRef.current = window.setInterval(() => {
          // Kiểm tra nếu đã cuộn đến cuối trang
          if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 10) { // Thêm 10px buffer
            cleanup();
            setIsAutoPlayOn(false); // Tắt tự động khi hết
          } else {
            window.scrollBy(0, pixelsPerTick);
          }
        }, 20); // Chạy mỗi 20ms để cuộn mượt
      } else if (readingMode === 'paginated') {
        intervalRef.current = window.setInterval(() => {
          // Kiểm tra nếu đang ở trang cuối
          if (currentPage >= images.length - 1) {
            cleanup();
            setIsAutoPlayOn(false); // Tắt tự động khi hết trang
          } else {
            changePage('next');
          }
        }, autoPageInterval * 1000); // Chuyển giây sang mili giây
      }
    }

    // Trả về hàm cleanup, React sẽ gọi nó khi component unmount hoặc các dependency thay đổi
    return cleanup;
  }, [isAutoPlayOn, readingMode, autoScrollSpeed, autoPageInterval, currentPage, images.length, changePage, setIsAutoPlayOn]);

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