import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import ComicHeader from "../components/Comic/ComicHeader";
import ComicDescription from "../components/Comic/ComicDescription";
import ChapterList from "../components/Comic/ChapterList";
import CommentSection from "../components/Comic/CommentSection";
import RatingWidget from "../components/Comic/RatingWidget";
import RelatedComics from "../components/Comic/RelatedComics";
import { toast } from "react-toastify";
import { Loader2, ArrowUp } from "lucide-react"; // Thêm icon ArrowUp cho nút cuộn
import { Button } from "@/components/ui/button"; // Thêm Button
import { cn } from "@/lib/utils";

// --- Interfaces giữ nguyên ---
interface Chapter {
  id: number;
  number: number;
  title: string;
  views: number;
  isLocked: boolean;
  time: string;
}

interface Comic {
  id: number;
  slug: string;
  title: string;
  author: string;
  image: string;
  lastUpdate: string;
  status: string;
  genres: string[];
  rating: number;
  reviewCount: number;
  followers: number;
  likers: number;
  isFollowing: boolean;
  isFavorite: boolean;
  description: string;
  chapters: Chapter[];
  altName: string[];
  groupName?: string | null;
}
interface RelatedComic {
  id: string;
  slug: string;
  title: string;
  image: string;
  rating: number | string;
  views: number;
  lastChapter: number;
  latestChapterTime: string;
}
type ApiOk<T> = { success: true; data: T; meta?: unknown };

const getAuthToken = () => localStorage.getItem("token");

export default function ComicDetailPage() {
  const { slug } = useParams();
  const [comic, setComic] = useState<Comic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedComics, setRelatedComics] = useState<RelatedComic[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false); // State cho nút Scroll Top

  useEffect(() => {
    if (!slug) return;

    const fetchComicData = async () => {
      try {
        setLoading(true);
        window.scrollTo(0, 0);

        const token = getAuthToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get<ApiOk<Comic>>(
          `${import.meta.env.VITE_API_URL}/comics/${slug}`,
          { headers }
        );
        setComic(response.data.data);

        const relatedRes = await axios.get<ApiOk<RelatedComic[]>>(
          `${import.meta.env.VITE_API_URL}/comics/${slug}/related`,
          { headers }
        );
        setRelatedComics(relatedRes.data.data);
      } catch (err: unknown) {
        setError("Không thể tải dữ liệu truyện.");
        console.error(err);
      } finally {
        // Thêm timeout nhỏ giả lập độ trễ để thấy loading animation mượt hơn (tuỳ chọn)
        setTimeout(() => setLoading(false), 300);
      }
    };

    fetchComicData();
  }, [slug]);

  // Logic nút Scroll to Top
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFollowToggle = async () => {
    if (!comic) return;
    const token = getAuthToken();
    if (!token) {
      toast.error("Vui lòng đăng nhập để theo dõi!");
      return;
    }

    const originalComicState = { ...comic };
    setComic((prev) => {
      if (!prev) return null;
      const newFollowerCount = prev.isFollowing
        ? prev.followers - 1
        : prev.followers + 1;
      return {
        ...prev,
        isFollowing: !prev.isFollowing,
        followers: newFollowerCount,
      };
    });

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/comics/${slug}/follow`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (err) {
      setComic(originalComicState);
      toast.error("Lỗi kết nối.");
    }
  };

  const handleFavoriteToggle = async () => {
    if (!comic) return;
    const token = getAuthToken();
    if (!token) {
      toast.error("Vui lòng đăng nhập để thích truyện!");
      return;
    }

    const originalComicState = { ...comic };
    setComic((prev) => {
      if (!prev) return null;
      const newLikerCount = prev.isFavorite ? prev.likers - 1 : prev.likers + 1;
      return { ...prev, isFavorite: !prev.isFavorite, likers: newLikerCount };
    });

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/comics/${slug}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (err) {
      setComic(originalComicState);
      toast.error("Lỗi kết nối.");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 animate-pulse">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm font-medium">
          Đang triệu hồi truyện...
        </p>
      </div>
    );

  if (error)
    return (
      <div className="container py-20 text-center animate-in fade-in zoom-in duration-500">
        <h2 className="text-2xl font-bold text-destructive mb-2">
          Đã có lỗi xảy ra
        </h2>
        <p className="text-muted-foreground">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Thử lại
        </Button>
      </div>
    );

  if (!comic)
    return (
      <div className="container py-20 text-center">Không tìm thấy truyện.</div>
    );

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300 overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* ✨ Animation: Pulse nhẹ cho background */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-primary/10 blur-[120px] rounded-full opacity-50 animate-pulse"
          style={{ animationDuration: "4s" }}
        />
      </div>

      <main className="relative z-10 container mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          {/* CỘT TRÁI: Main Content */}
          {/* ✨ Animation: Trượt từ dưới lên (Slide Up) + Fade In */}
          <div className="lg:col-span-8 space-y-8 min-w-0 animate-in slide-in-from-bottom-10 fade-in duration-700 ease-out fill-mode-backwards">
            <ComicHeader
              comic={comic}
              firstChapter={
                comic.chapters[comic.chapters.length - 1]?.number || 0
              }
              lastChapter={comic.chapters[0]?.number || 0}
              onFollowToggle={handleFollowToggle}
              onFavoriteToggle={handleFavoriteToggle}
            />

            {/* Delay nhẹ cho Description để tạo cảm giác lớp lang */}
            <div className="animate-in slide-in-from-bottom-4 fade-in duration-700 delay-100 fill-mode-backwards">
              <ComicDescription description={comic.description} />
            </div>

            <div className="animate-in slide-in-from-bottom-4 fade-in duration-700 delay-200 fill-mode-backwards">
              <ChapterList
                chapters={comic.chapters}
                comicSlug={comic.slug}
                comicId={comic.id}
              />
            </div>

            <div className="animate-in slide-in-from-bottom-4 fade-in duration-700 delay-300 fill-mode-backwards">
              <CommentSection
                comicId={comic.id.toString()}
                comicSlug={comic.slug}
              />
            </div>
          </div>

          {/* CỘT PHẢI: Sidebar */}
          {/* ✨ Animation: Xuất hiện chậm hơn cột trái (Delay 300ms) để mắt người dùng tập trung nội dung chính trước */}
          <aside className="lg:col-span-4 space-y-8 lg:sticky lg:top-6 transition-all duration-300 animate-in slide-in-from-right-8 fade-in duration-1000 delay-300 ease-out fill-mode-backwards">
            <RatingWidget comicId={comic.id} />

            <RelatedComics relatedComics={relatedComics} />
          </aside>
        </div>
      </main>

      {/* ✨ Scroll To Top Button */}
      <Button
        size="icon"
        className={cn(
          "fixed bottom-8 right-8 z-50 rounded-full shadow-2xl bg-primary/80 hover:bg-primary backdrop-blur-sm transition-all duration-500",
          showScrollTop
            ? "translate-y-0 opacity-100 rotate-0"
            : "translate-y-20 opacity-0 rotate-45 pointer-events-none"
        )}
        onClick={scrollToTop}
      >
        <ArrowUp className="w-5 h-5" />
      </Button>
    </div>
  );
}
