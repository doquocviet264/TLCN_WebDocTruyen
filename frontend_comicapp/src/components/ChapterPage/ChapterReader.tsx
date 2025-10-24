import { useEffect, useRef, createRef, RefObject  } from 'react';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useDetailedReadingHistory } from "../../hook/useReadingHistory";
import { audioCues } from '../../mocks/mock-audio-script';
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
  scrollToImageIndex: number;

  isAudioModeOn: boolean;
  audioRef: RefObject<HTMLAudioElement>;
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
  scrollToImageIndex,
  isAudioModeOn,
  audioRef,
}: ChapterReaderProps) {
  
  // Hook để lưu lịch sử đọc
  useDetailedReadingHistory({
    comicId,
    chapterId,
    chapterNumber
  });

  // Tạo một ref để giữ một mảng các ref cho mỗi ảnh
const imageRefs = useRef<RefObject<HTMLImageElement>[]>([]);
const animationFrameRef = useRef<number | null>(null);
// Mỗi khi images thay đổi, đảm bảo đã có ref cho từng ảnh
useEffect(() => {
  imageRefs.current = images.map((_, i) => imageRefs.current[i] ?? createRef<HTMLImageElement>());
}, [images]);

//LOGIC CHO AUDIO SCROLLING
useEffect(() => {
  const audio = audioRef.current;
  if (!audio) return;
  let animationFrameId: number;

  const updateScroll = () => {
    const currentTime = audio.currentTime;

    // Tìm cue hiện tại và cue tiếp theo
    const currentCueIndex = audioCues.slice().reverse().findIndex(cue => cue.timestamp <= currentTime);
    if (currentCueIndex === -1) {
      animationFrameId = requestAnimationFrame(updateScroll);
      return;
    }

    const currentCue = audioCues[audioCues.length - 1 - currentCueIndex];
    const nextCue = audioCues[audioCues.length - currentCueIndex];
    if (!nextCue) {
      animationFrameId = requestAnimationFrame(updateScroll);
      return;
    }

    // Lấy phần tử ảnh tương ứng
    const startEl = imageRefs.current[currentCue.imageIndex]?.current ?? null;
    const endEl   = imageRefs.current[nextCue.imageIndex]?.current ?? null;
    if (!startEl || !endEl) {
      animationFrameId = requestAnimationFrame(updateScroll);
      return;
    }

    const startY = startEl.getBoundingClientRect().top + window.scrollY;
    const endY   = endEl.getBoundingClientRect().top + window.scrollY;

    const segmentDuration = nextCue.timestamp - currentCue.timestamp;
    const timeIntoSegment = currentTime - currentCue.timestamp;
    const progress = Math.min(timeIntoSegment / segmentDuration, 1);

    const newScrollY = startY + (endY - startY) * progress;

    window.scrollTo({ top: newScrollY, behavior: 'auto' });

    // Tiếp tục lặp
    animationFrameId = requestAnimationFrame(updateScroll);
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
  };

  if (isAudioModeOn && readingMode === 'long-strip') {
    window.addEventListener('wheel', handleWheel, { passive: false });

    // Bắt đầu phát audio và animation
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => console.error("Lỗi khi phát audio:", err));
    }

    animationFrameId = requestAnimationFrame(updateScroll);
  }

  return () => {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('wheel', handleWheel);
    if (!audio.paused) audio.pause();
  };
}, [isAudioModeOn, audioRef, readingMode, images]);

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
              ref={imageRefs.current[index]}
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