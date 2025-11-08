import React, {
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChapterReader } from "../components/ChapterPage/ChapterReader";
import { ChapterControlFooter } from "../components/ChapterPage/ChapterControlFooter";
import { SettingsSheet } from "../components/ChapterPage/SettingsSheet";
import { ReportDialog } from "../components/ChapterPage/ReportDialog";
import { CommentsSheet } from "../components/ChapterPage/CommentsSheet";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { toast } from "react-toastify";

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

interface UnlockResponse {
  msg: string;
  success?: boolean;
}

interface CheckUnlockResponse {
  isUnlocked: boolean;
  chapterId: string;
  message: string;
}

type ApiOk<T> = { success: true; data: T; meta?: unknown };

export default function ChapterPage() {
  const { slug, chapterNumber } = useParams<{
    slug: string;
    chapterNumber: string;
  }>();

  const navigate = useNavigate();
  const { isLoggedIn } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [chapterData, setChapterData] = useState<ChapterData | null>(null);

  const [isFooterVisible, setIsFooterVisible] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [readingMode, setReadingMode] = useState<
    "long-strip" | "paginated"
  >("long-strip");
  const [imageWidth, setImageWidth] = useState("max-w-2xl");

  // Trang hiện tại (cho chế độ phân trang)
  const [currentPage, setCurrentPage] = useState(0);

  // Index cần scroll tới khi vào chế độ cuộn (lấy từ lịch sử đọc)
  const [scrollToImageIndex, setScrollToImageIndex] = useState<
    number | null
  >(null);

  // Auto play
  const [isAutoPlayOn, setIsAutoPlayOn] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(5);
  const [autoPageInterval, setAutoPageInterval] = useState(5);

  // Audio mode
  const [isAudioModeOn, setIsAudioModeOn] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Chỉ dùng nếu sau này bạn muốn click thumbnail để nhảy đến ảnh
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(
    null
  );

  const toggleAudioMode = () => {
    setIsAudioModeOn((prev) => !prev);
  };

  // Fetch dữ liệu chapter + lịch sử đọc
  useEffect(() => {
    const fetchChapterData = async () => {
      try {
        setLoading(true);
        setIsAutoPlayOn(false);
        setCurrentPage(0);
        setScrollToImageIndex(null);
        setActiveImageIndex(null);
        window.scrollTo({ top: 0, behavior: "auto" });

        const res = await axios.get<ApiOk<ChapterData>>(
          `${import.meta.env.VITE_API_URL}/chapters/${slug}/${chapterNumber}`
        );
        const chapter = res.data.data;
        setChapterData(chapter);

        // Lấy lịch sử đọc (nếu đăng nhập)
        if (isLoggedIn) {
          try {
            const token = localStorage.getItem("token");

            const historyRes = await axios.get<{
              data: { pageNumber: number | null } | null;
            }>(
              `${import.meta.env.VITE_API_URL}/history/${chapter.comicId}`,
              {
                headers: {
                  Authorization: token ? `Bearer ${token}` : "",
                },
              }
            );
            const savedPage = historyRes.data.data?.pageNumber;

            if (
              typeof savedPage === "number" &&
              savedPage >= 0 &&
              chapter.images &&
              savedPage < chapter.images.length
            ) {
              // Dùng cho paginated
              setCurrentPage(savedPage);
              // Dùng cho long-strip: scroll tới ảnh đó
              setScrollToImageIndex(savedPage);
            } else {
              setCurrentPage(0);
              setScrollToImageIndex(null);
            }
          } catch (err) {
            console.error("Lỗi khi lấy lịch sử đọc:", err);
            setCurrentPage(0);
            setScrollToImageIndex(null);
          }
        }

        // Kiểm tra mở khoá nếu chapter có flag isLocked
        if (chapter.isLocked) {
          await checkUnlockStatus(chapter.id);
        }
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu chương:", error);
        toast.error("Có lỗi xảy ra khi tải dữ liệu chương");
      } finally {
        setLoading(false);
      }
    };

    fetchChapterData();
  }, [slug, chapterNumber, isLoggedIn]);

  // Kiểm tra trạng thái mở khóa
  const checkUnlockStatus = async (chapterId: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get<ApiOk<CheckUnlockResponse>>(
        `${import.meta.env.VITE_API_URL}/chapters/${chapterId}/check-unlock`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (res.data.data.isUnlocked) {
        setChapterData((prev) =>
          prev ? { ...prev, isLocked: false } : prev
        );
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra trạng thái mở khóa:", error);
    }
  };

  // Tắt auto play khi đổi mode
  useEffect(() => {
    setIsAutoPlayOn(false);
  }, [readingMode]);

  // Dark mode body class
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
    return () => {
      document.body.classList.remove("dark");
    };
  }, [isDarkMode]);

  const toggleFooter = () =>
    setIsFooterVisible((prev) => !prev);

  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

  // Chỉ dùng cho paginated
  const changePage = (direction: "next" | "prev") => {
    if (!chapterData || readingMode !== "paginated") return;

    setCurrentPage((prev) => {
      if (direction === "next") {
        return Math.min(prev + 1, chapterData.images.length - 1);
      }
      if (direction === "prev") {
        return Math.max(prev - 1, 0);
      }
      return prev;
    });
  };

  const handleUnlockChapter = async () => {
    if (!chapterData) return;

    try {
      const token = localStorage.getItem("token");
      setUnlockLoading(true);

      const res = await axios.post<ApiOk<UnlockResponse>>(
        `${import.meta.env.VITE_API_URL}/chapters/${chapterData.id}/unlock`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success === true) {
        setChapterData((prev) =>
          prev ? { ...prev, isLocked: false } : prev
        );
        toast.success("Mở khóa chương thành công!");
      } else {
        toast.error("Có lỗi xảy ra khi mở khóa chương");
      }
    } catch (error: any) {
      console.error("Lỗi khi mở khóa chương:", error);

      const status = error.response?.status;
      const msg = error.response?.data?.msg;

      if (status === 401) {
        toast.error("Bạn cần đăng nhập để mở khóa chương");
        navigate(
          `/auth/login?redirect=${encodeURIComponent(
            window.location.pathname
          )}`
        );
      } else if (status === 400) {
        if (msg === "Bạn đã mở khóa chương này rồi") {
          setChapterData((prev) =>
            prev ? { ...prev, isLocked: false } : prev
          );
          toast.info("Bạn đã mở khóa chương này rồi");
        } else if (msg === "Không đủ vàng để mở khóa chương") {
          toast.error("Số dư không đủ để mở khóa chương");
        } else if (msg === "User hoặc Chapter không tồn tại") {
          toast.error("Chương không tồn tại");
        } else {
          toast.error(msg || "Có lỗi xảy ra khi mở khóa chương");
        }
      } else if (status === 404) {
        toast.error("Chương không tồn tại");
      } else {
        toast.error("Có lỗi xảy ra khi mở khóa chương");
      }
    } finally {
      setUnlockLoading(false);
    }
  };

  // ===== RENDER =====

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-900 dark:text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3">Đang tải...</span>
      </div>
    );
  }

  if (!chapterData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-900 dark:text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            Không tìm thấy chương
          </h2>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <audio
        ref={audioRef}
        src="/audio/mock-chapter-audio.mp3"
        style={{ display: "none" }}
      />
      <div className="bg-muted text-foreground min-h-screen flex flex-col">
        <main
          onClick={toggleFooter}
          className="flex-1 relative"
        >
          {chapterData.isLocked ? (
            // ===== UI CHƯƠNG BỊ KHÓA =====
            <div
              className={`flex items-center justify-center min-h-[100vh] ${
                isDarkMode ? "bg-gray-900" : "bg-gray-100"
              }`}
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center transform transition-all duration-300 hover:scale-105">
                <div className="mb-6">
                  <svg
                    className="w-16 h-16 mx-auto text-yellow-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 11c0-1.1-.9-2-2-2s-2 .9-2 2v3h4v-3zm0 0c0-1.1.9-2 2-2s2 .9 2 2v3h-4v-3zm-7 5h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2z"
                    ></path>
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Chương này đã bị khóa
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
                  Vui lòng mua chương hoặc đăng nhập để tiếp tục khám
                  phá nội dung.
                </p>
                {!isLoggedIn ? (
                  <button
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-colors duration-300"
                    onClick={() =>
                      navigate(
                        `/auth/login?redirect=${encodeURIComponent(
                          window.location.pathname
                        )}`
                      )
                    }
                  >
                    Đăng nhập để mở khóa
                  </button>
                ) : (
                  <button
                    className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-600 hover:to-teal-700 transition-colors duration-300 disabled:opacity-50"
                    onClick={handleUnlockChapter}
                    disabled={unlockLoading}
                  >
                    {unlockLoading ? (
                      <>
                        <span className="animate-spin inline-block mr-2">
                          ⟳
                        </span>
                        Đang xử lý...
                      </>
                    ) : (
                      <span>
                        Mua chương ngay với {chapterData.cost} đồng vàng
                      </span>
                    )}
                  </button>
                )}
                <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                  Có vấn đề?{" "}
                  <a
                    href="/support"
                    className="underline hover:text-blue-500"
                  >
                    Liên hệ hỗ trợ
                  </a>
                </p>
              </div>
            </div>
          ) : (
            // ===== UI ĐỌC CHƯƠNG =====
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
              scrollToImageIndex={
                scrollToImageIndex ?? activeImageIndex
              }
              isAudioModeOn={isAudioModeOn}
              audioRef={audioRef}
            />
          )}
        </main>

        {isFooterVisible && (
          <ChapterControlFooter
            chapterData={chapterData}
            onSettingsClick={() => setIsSettingsOpen(true)}
            onReportClick={() => setIsReportOpen(true)}
            onCommentsClick={() => setIsCommentsOpen(true)}
            onScrollTopClick={scrollToTop}
          />
        )}

        <SettingsSheet
          isOpen={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          readingMode={readingMode}
          setReadingMode={setReadingMode}
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
