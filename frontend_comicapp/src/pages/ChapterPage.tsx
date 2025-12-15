import React, { useState, useContext, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

// Component imports
import { ChapterReader } from "../components/ChapterPage/ChapterReader";
import { ChapterControlFooter } from "../components/ChapterPage/ChapterControlFooter";
import { SettingsSheet } from "../components/ChapterPage/SettingsSheet";
import { ReportDialog } from "../components/ChapterPage/ReportDialog";
import { CommentsSheet } from "../components/ChapterPage/CommentsSheet";
import { LockedOverlay } from "../components/ChapterPage/LockedOverlay"; // Đã tách ra
import { AuthContext } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
// Interfaces
interface ChapterData {
  id: number;
  comicId: number;
  comicTitle: string;
  comicSlug: string;
  chapterNumber: number;
  chapterTitle: string;
  images: string[];
  allChapters: { id: number; name: string }[];
  prevChapterSlug: string | null;
  nextChapterSlug: string | null;
  isLocked: boolean;
  cost: number;
}

interface UnlockResponse { msg: string; success?: boolean; }
interface CheckUnlockResponse { isUnlocked: boolean; chapterId: string; message: string; }
interface ReviewAudio {
  chapterId: number;
  audioUrl: string;
  totalDuration: number;
  timeline: { segments: { pageIndex: number; lineId: string; start: number; end: number }[]; };
}
type ApiOk<T> = { success: true; data: T; meta?: unknown };
type AudioCue = { timestamp: number; imageIndex: number };

export default function ChapterPage() {
  const { slug, chapterNumber } = useParams<{ slug: string; chapterNumber: string; }>();
  const navigate = useNavigate();
  const { isLoggedIn } = useContext(AuthContext);

  // --- States ---
  const [loading, setLoading] = useState(true);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [chapterData, setChapterData] = useState<ChapterData | null>(null);

  // UI Visibility States
  const [isFooterVisible, setIsFooterVisible] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  // Settings States
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [readingMode, setReadingMode] = useState<"long-strip" | "paginated">("long-strip");
  const [imageWidth, setImageWidth] = useState("max-w-2xl");

  // Reader States
  const [currentPage, setCurrentPage] = useState(0);
  const [scrollToImageIndex, setScrollToImageIndex] = useState<number | null>(null);
  
  // Auto Play States
  const [isAutoPlayOn, setIsAutoPlayOn] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(5);
  const [autoPageInterval, setAutoPageInterval] = useState(5);

  // Audio States
  const [isAudioModeOn, setIsAudioModeOn] = useState(false);
  const [reviewAudio, setReviewAudio] = useState<ReviewAudio | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const activeImageIndex = null; // Placeholder nếu cần dùng sau này

  // --- Effect 1: Audio Logic ---
  useEffect(() => {
    const fetchReviewAudio = async () => {
      if (!isAudioModeOn || !chapterData) return;

      try {
        setIsAudioLoading(true);
        const res = await axios.get<ApiOk<ReviewAudio>>(`${import.meta.env.VITE_API_URL}/reviews/published/${chapterData.id}`);
        const data = res.data.data;
        setReviewAudio(data);

        if (audioRef.current) {
          audioRef.current.src = data.audioUrl;
          audioRef.current.currentTime = 0;
        }
      } catch (err: any) {
        console.error("Lỗi audio:", err);
        const status = err?.response?.status;
        if (status === 404) toast.info("Chương này chưa có audio review.");
        else toast.error("Không thể tải audio review.");
        
        // Reset state nếu lỗi
        setIsAudioModeOn(false);
        setReviewAudio(null);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
        }
      } finally {
        setIsAudioLoading(false);
      }
    };
    fetchReviewAudio();
  }, [isAudioModeOn, chapterData?.id]);

  // --- Effect 2: Fetch Data ---
  useEffect(() => {
    const fetchChapterData = async () => {
      try {
        setLoading(true);
        setIsAutoPlayOn(false);
        setCurrentPage(0);
        setScrollToImageIndex(null);
        window.scrollTo({ top: 0, behavior: "auto" });

        // 1. Get Chapter Data
        const res = await axios.get<ApiOk<ChapterData>>(`${import.meta.env.VITE_API_URL}/chapters/${slug}/${chapterNumber}`);
        const chapter = res.data.data;
        setChapterData(chapter);

        // 2. Get History (if logged in)
        if (isLoggedIn) {
          try {
            const token = localStorage.getItem("token");
            const historyRes = await axios.get<{ data: { pageNumber: number | null } | null }>(
              `${import.meta.env.VITE_API_URL}/history/${chapter.comicId}`,
              { headers: { Authorization: token ? `Bearer ${token}` : "" } }
            );
            const savedPage = historyRes.data.data?.pageNumber;

            if (typeof savedPage === "number" && savedPage >= 0 && chapter.images && savedPage < chapter.images.length) {
              setCurrentPage(savedPage);
              setScrollToImageIndex(savedPage);
            }
          } catch (err) {
            console.error("Lỗi history:", err);
          }
        }

        // 3. Check Lock Status
        if (chapter.isLocked) {
          await checkUnlockStatus(chapter.id);
        }
      } catch (error) {
        console.error("Lỗi fetch chapter:", error);
        toast.error("Không thể tải chương này.");
      } finally {
        setLoading(false);
      }
    };
    fetchChapterData();
  }, [slug, chapterNumber, isLoggedIn]);

  const checkUnlockStatus = async (chapterId: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get<ApiOk<CheckUnlockResponse>>(
        `${import.meta.env.VITE_API_URL}/chapters/${chapterId}/check-unlock`,
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );
      if (res.data.data.isUnlocked) {
        setChapterData(prev => prev ? { ...prev, isLocked: false } : prev);
      }
    } catch (e) { console.error(e); }
  };

  // --- Handlers ---
  const handleUnlockChapter = async () => {
    if (!chapterData) return;
    try {
      setUnlockLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.post<ApiOk<UnlockResponse>>(
        `${import.meta.env.VITE_API_URL}/chapters/${chapterData.id}/unlock`,
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setChapterData(prev => prev ? { ...prev, isLocked: false } : prev);
        toast.success("Mở khóa thành công!");
      } else {
        toast.error("Lỗi khi mở khóa.");
      }
    } catch (error: any) {
      const status = error.response?.status;
      const msg = error.response?.data?.msg;
      
      if (status === 401) {
        toast.error("Vui lòng đăng nhập.");
        navigate(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      } else if (msg === "Không đủ vàng để mở khóa chương") {
        toast.error("Số dư không đủ.");
      } else {
        toast.error(msg || "Lỗi khi mở khóa.");
      }
    } finally {
      setUnlockLoading(false);
    }
  };

  const changePage = (direction: "next" | "prev") => {
    if (!chapterData || readingMode !== "paginated") return;
    setCurrentPage(prev => {
      if (direction === "next") return Math.min(prev + 1, chapterData.images.length - 1);
      return Math.max(prev - 1, 0);
    });
  };

  // --- Effects ---
  useEffect(() => { setIsAutoPlayOn(false); }, [readingMode]);
  
  useEffect(() => {
    document.body.classList.toggle("dark", isDarkMode);
    return () => document.body.classList.remove("dark");
  }, [isDarkMode]);

  // --- Data prep ---
  const audioCues: AudioCue[] = reviewAudio?.timeline?.segments?.map((seg) => ({
    timestamp: seg.start,
    imageIndex: Math.max(0, seg.pageIndex - 1),
  })) ?? [];

  // --- RENDER ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
           <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
           <span className="text-sm font-medium text-muted-foreground">Đang tải chương...</span>
        </div>
      </div>
    );
  }

  if (!chapterData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Không tìm thấy chương</h2>
          <Button onClick={() => navigate(-1)}>Quay lại</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <audio ref={audioRef} style={{ display: "none" }} />
      
      <div className="bg-background text-foreground min-h-screen flex flex-col transition-colors duration-300">
        
        {/* Main Content Area */}
        {/* pb-20 để nội dung không bị footer che mất */}
        <main onClick={() => setIsFooterVisible(prev => !prev)} className="flex-1 relative pb-20 min-h-screen">
          
          {chapterData.isLocked ? (
            <LockedOverlay 
              isLoggedIn={isLoggedIn}
              cost={chapterData.cost}
              isDarkMode={isDarkMode}
              unlockLoading={unlockLoading}
              onLogin={() => navigate(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`)}
              onUnlock={handleUnlockChapter}
            />
          ) : (
            <ChapterReader
              key={`${chapterData.id}-${readingMode}`}
              loading={loading}
              images={chapterData.images}
              imageWidth={imageWidth}
              readingMode={readingMode}
              currentPage={currentPage}
              changePage={changePage}
              comicId={chapterData.comicId}
              chapterId={chapterData.id}
              chapterNumber={chapterData.chapterNumber}
              isAutoPlayOn={isAutoPlayOn}
              autoScrollSpeed={autoScrollSpeed}
              autoPageInterval={autoPageInterval}
              setIsAutoPlayOn={setIsAutoPlayOn}
              scrollToImageIndex={scrollToImageIndex ?? activeImageIndex}
              isAudioModeOn={isAudioModeOn}
              audioRef={audioRef}
              audioCues={audioCues}
              isAudioLoading={isAudioLoading}
            />
          )}
        </main>

        {/* Footer Controls (Chỉ hiện khi chưa khóa) */}
        {isFooterVisible && !chapterData.isLocked && (
          <ChapterControlFooter
            chapterData={chapterData}
            onSettingsClick={() => setIsSettingsOpen(true)}
            onReportClick={() => setIsReportOpen(true)}
            onCommentsClick={() => setIsCommentsOpen(true)}
            onScrollTopClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          />
        )}

        {/* Components / Modals */}
        <SettingsSheet
          isOpen={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          readingMode={readingMode}
          setReadingMode={(val) => setReadingMode(val as "long-strip" | "paginated")}
          imageWidth={imageWidth}
          setImageWidth={setImageWidth}
          isAutoPlayOn={isAutoPlayOn}
          setIsAutoPlayOn={setIsAutoPlayOn}
          autoScrollSpeed={autoScrollSpeed}
          setAutoScrollSpeed={setAutoScrollSpeed}
          autoPageInterval={autoPageInterval}
          setAutoPageInterval={setAutoPageInterval}
          isAudioModeOn={isAudioModeOn}
          setIsAudioModeOn={setIsAudioModeOn}
        />

        <ReportDialog
          isOpen={isReportOpen}
          onOpenChange={setIsReportOpen}
          comicTitle={chapterData.comicTitle}
          chapterNumber={chapterData.chapterNumber}
          chapterId={chapterData.id}
        />

        <CommentsSheet
          isOpen={isCommentsOpen}
          onOpenChange={setIsCommentsOpen}
          comicId={chapterData.comicId}
          chapterId={chapterData.id}
          comicSlug={chapterData.comicSlug}
        />
      </div>
    </div>
  );
}