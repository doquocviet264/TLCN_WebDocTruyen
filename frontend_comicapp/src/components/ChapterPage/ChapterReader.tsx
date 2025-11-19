import {
  useEffect,
  useRef,
  useState,
  createRef,
  RefObject,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useDetailedReadingHistory } from "../../hook/useReadingHistory";
import { audioCues } from "../../mocks/mock-audio-script";

interface ChapterReaderProps {
  loading: boolean;
  images: string[];
  imageWidth: string; // vd: 'max-w-3xl'
  readingMode: "long-strip" | "paginated";
  currentPage: number;
  changePage: (direction: "next" | "prev") => void;
  comicId: number;
  chapterId: number;
  chapterNumber: number;
  // auto play
  isAutoPlayOn: boolean;
  autoScrollSpeed: number;
  autoPageInterval: number;
  setIsAutoPlayOn: (value: boolean) => void;
  // index cần scroll tới lúc vào chapter (từ lịch sử đọc)
  scrollToImageIndex?: number | null;
  // audio mode
  isAudioModeOn: boolean;
  audioRef: RefObject<HTMLAudioElement | null>;
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
  // refs cho từng ảnh
  const imageRefs = useRef<RefObject<HTMLImageElement>[]>([]);
  const intervalRef = useRef<number | null>(null);

  // index ảnh đang "được xem" ở chế độ cuộn
  const [visibleIndex, setVisibleIndex] = useState(0);

  // XÓA: loadedCount

  // flag đảm bảo chỉ auto-scroll tới lịch sử 1 lần khi đã thành công
  const hasScrolledToInitial = useRef(false);

  // Tạo ref cho từng ảnh khi images thay đổi
  useEffect(() => {
    imageRefs.current = images.map(
      (_, i) => imageRefs.current[i] ?? createRef<HTMLImageElement>()
    );
    // XÓA: setLoadedCount(0);
    hasScrolledToInitial.current = false;
  }, [images, chapterId]);

  // Reset khi đổi chapter hoặc đổi mode
  useEffect(() => {
    setVisibleIndex(0);
    hasScrolledToInitial.current = false;

    if (readingMode === "long-strip") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [chapterId, readingMode]);

  // Auto-scroll tới trang đã đọc (scrollToImageIndex) ở long-strip,
  useEffect(() => {
    if (readingMode !== "long-strip") return;
    if (scrollToImageIndex == null) return;
    if (hasScrolledToInitial.current) return;
    if (!images.length) return;

    const idx = Math.min(
      Math.max(scrollToImageIndex, 0),
      images.length - 1
    );

    // XÓA: check loadedCount

    // Dùng setTimeout(0) để đợi DOM cập nhật refs
    const timer = setTimeout(() => {
      const ref = imageRefs.current[idx];
      const el = ref?.current;
      if (!el) {
        console.warn("[ScrollInit] Ref chưa sẵn sàng cho index", idx);
        return;
      }

      const offset = 0; // nếu có header fixed, set số px ở đây
      const top = el.offsetTop - offset;

      console.log("[ScrollInit] Cuộn ngay tới index", idx, "=> top:", top);

      window.scrollTo({ top, behavior: "auto" });
      hasScrolledToInitial.current = true;
    }, 0); // Chạy ngay sau khi DOM update

    return () => clearTimeout(timer);
  }, [
    readingMode,
    scrollToImageIndex,
    images.length,
    chapterId,
    // XÓA: loadedCount
  ]);

  // Xác định ảnh hiện tại cho long-strip bằng scroll + requestAnimationFrame
  useEffect(() => {
    if (readingMode !== "long-strip") return;
    if (!images.length) return;

    let frameId: number | null = null;

    const computeVisible = () => {
      const refs = imageRefs.current;
      if (!refs.length) return;

      const targetY = window.innerHeight * 0.25;
      let bestIndex = 0;
      let bestDist = Infinity;

      refs.forEach((ref, index) => {
        const el = ref.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        // Tính toán điểm "trọng tâm" để check, 1/3 từ trên xuống
        const focusY = rect.top + rect.height / 3; 
        const dist = Math.abs(focusY - targetY);

        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = index;
        }
      });

      setVisibleIndex((prev) =>
        prev !== bestIndex ? bestIndex : prev
      );
    };

    const handleScroll = () => {
      if (frameId != null) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(computeVisible);
    };

    computeVisible(); // Chạy 1 lần lúc đầu

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });
    window.addEventListener("resize", handleScroll);

    return () => {
      if (frameId != null) cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [readingMode, images.length, chapterId]);

  // Lưu lịch sử đọc: long-strip dùng visibleIndex, paginated dùng currentPage
  useDetailedReadingHistory({
    comicId,
    chapterId,
    chapterNumber,
    pageNumber:
      readingMode === "long-strip" ? visibleIndex : currentPage,
  });

  // AUDIO SCROLLING
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let animationFrameId: number;

    const updateScroll = () => {
      const currentTime = audio.currentTime;

      // Tìm cue hiện tại
      const currentCueIndex = audioCues
        .slice()
        .reverse()
        .findIndex((cue) => cue.timestamp <= currentTime);

      if (currentCueIndex === -1) {
        animationFrameId = requestAnimationFrame(updateScroll);
        return;
      }

      const currentCue =
        audioCues[audioCues.length - 1 - currentCueIndex];
      const nextCue =
        audioCues[audioCues.length - currentCueIndex];
      if (!nextCue) {
        // Đã là cue cuối
        animationFrameId = requestAnimationFrame(updateScroll);
        return;
      }

      // Lấy element
      const startEl =
        imageRefs.current[currentCue.imageIndex]?.current ?? null;
      const endEl =
        imageRefs.current[nextCue.imageIndex]?.current ?? null;

      if (!startEl || !endEl) {
        animationFrameId = requestAnimationFrame(updateScroll);
        return;
      }

      // Tính toán vị trí cuộn mượt (interpolation)
      const startY =
        startEl.getBoundingClientRect().top + window.scrollY;
      const endY =
        endEl.getBoundingClientRect().top + window.scrollY;

      const segmentDuration =
        nextCue.timestamp - currentCue.timestamp;
      const timeIntoSegment =
        currentTime - currentCue.timestamp;
      const progress = Math.min(
        timeIntoSegment / segmentDuration,
        1
      );

      const newScrollY =
        startY + (endY - startY) * progress;

      window.scrollTo({ top: newScrollY, behavior: "auto" });
      animationFrameId = requestAnimationFrame(updateScroll);
    };
    
    // Chặn cuộn tay khi đang ở audio mode
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
    };

    if (isAudioModeOn && readingMode === "long-strip") {
      window.addEventListener("wheel", handleWheel, {
        passive: false,
      });

      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch((err) =>
          console.error("Lỗi khi phát audio:", err)
        );
      }

      animationFrameId = requestAnimationFrame(updateScroll);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("wheel", handleWheel);
      if (audio && !audio.paused) audio.pause();
    };
  }, [isAudioModeOn, audioRef, readingMode, images, chapterId]);

  // AUTO PLAY
  useEffect(() => {
    const cleanup = () => {
      if (intervalRef.current != null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    if (isAutoPlayOn) {
      if (readingMode === "long-strip") {
        const pixelsPerTick = autoScrollSpeed / 2; // Điều chỉnh tốc độ
        intervalRef.current = window.setInterval(() => {
          if (
            window.innerHeight + window.scrollY >=
            document.documentElement.scrollHeight - 10 // Đệm 10px
          ) {
            // Đã cuộn hết
            cleanup();
            setIsAutoPlayOn(false);
          } else {
            window.scrollBy(0, pixelsPerTick);
          }
        }, 20); // 50 tick/giây
      } else if (readingMode === "paginated") {
        intervalRef.current = window.setInterval(() => {
          if (currentPage >= images.length - 1) {
            cleanup();
            setIsAutoPlayOn(false);
          } else {
            changePage("next");
          }
        }, autoPageInterval * 1000);
      }
    }

    return cleanup;
  }, [
    isAutoPlayOn,
    readingMode,
    autoScrollSpeed,
    autoPageInterval,
    currentPage,
    images.length,
    changePage,
    setIsAutoPlayOn,
  ]);

  // LOADING
  if (loading) {
    return (
      <div className={`mx-auto space-y-2 px-2 md:px-4 ${imageWidth}`}>
        <Skeleton className="h-[80vh] w-full" />
        <Skeleton className="h-[80vh] w-full" />
      </div>
    );
  }

  // UI
  return (
    <div className={`mx-auto ${imageWidth} transition-all duration-300`}>
      <div className="flex flex-col items-center gap-1">
        {readingMode === "long-strip" ? (
          images.map((src, index) => (
            <img
              key={index}
              src={src}
              ref={imageRefs.current[index]}
              alt={`Trang ${index + 1}`}
              // THAY ĐỔI: Thêm min-height và bg để "giữ chỗ"
              className="w-full h-auto min-h-[800px] bg-gray-200 dark:bg-gray-800"
              loading="lazy"
              // XÓA: onLoad
            />
          ))
        ) : (
          <div className="w-full relative">
            {/* TODO: Thêm preload ảnh tiếp theo cho paginated 
              <img src={images[currentPage + 1]} style={{ display: 'none' }} />
            */}
            <img
              src={images[currentPage]}
              alt={`Trang ${currentPage + 1}`}
              className="w-full h-auto mx-auto"
            />
            <div className="absolute top-1/2 left-0 right-0 flex justify-between transform -translate-y-1/2 px-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => changePage("prev")}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => changePage("next")}
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