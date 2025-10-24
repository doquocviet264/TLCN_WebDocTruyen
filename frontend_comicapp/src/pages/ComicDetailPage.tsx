import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import ComicHeader  from "../components/Comic/ComicHeader"
import ComicDescription from "../components/Comic/ComicDescription"
import ChapterList from "../components/Comic/ChapterList"
import CommentSection from "../components/Comic/CommentSection"
import RatingWidget from "../components/Comic/RatingWidget"
import RelatedComics from "../components/Comic/RelatedComics"
import { toast } from "react-toastify";

interface Chapter {
  id:number;
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
  liker: number;
  isFollowing: boolean;
  isFavorite: boolean;
  description: string;
  chapters: Chapter[];
}
interface RelatedComic {
  id: string;
  slug: string;
  title: string;
  image: string;
  rating: string;
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
  useEffect(() => {
    if (!slug) return;

    const fetchComicData = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get<ApiOk<Comic>>(`${import.meta.env.VITE_API_URL}/comics/${slug}`, { headers });
        setComic(response.data.data);
        // Gọi API truyện liên quan
        const relatedRes = await axios.get<ApiOk<RelatedComic[]>>(`${import.meta.env.VITE_API_URL}/comics/${slug}/related`, { headers });
        setRelatedComics(relatedRes.data.data);
      } catch (err: unknown) {
        setError("Không thể tải dữ liệu truyện.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchComicData();
  }, [slug]);

  const handleFollowToggle = async () => {
    if (!comic) return;
    
    const token = getAuthToken();
    if (!token) {
        toast.error("Vui lòng đăng nhập để theo dõi!");
        return;
    }

    // Optimistic UI Update
    const originalComicState = { ...comic };
    setComic(prev => {
        if (!prev) return null;
        const newFollowerCount = prev.isFollowing ? prev.followers - 1 : prev.followers + 1;
        return { ...prev, isFollowing: !prev.isFollowing, followers: newFollowerCount };
    });

    try {
        await axios.post(`${import.meta.env.VITE_API_URL}/comics/${slug}/follow`, {}, {
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch (err) {
        setComic(originalComicState);
        toast.error("Đã có lỗi xảy ra, vui lòng thử lại.");
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
    setComic(prev => {
        if (!prev) return null;
        const newLikerCount = prev.isFavorite ? prev.liker - 1 : prev.liker + 1;
        return { ...prev, isFavorite: !prev.isFavorite, liker: newLikerCount };
    });

    try {
        await axios.post(`${import.meta.env.VITE_API_URL}/comics/${slug}/like`, {}, {
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch (err) {
        setComic(originalComicState);
        toast.error("Đã có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  if (loading) return <div className="container py-6 text-center">Đang tải trang truyện...</div>;
  if (error) return <div className="container py-6 text-center text-red-500">{error}</div>;
  if (!comic) return <div className="container py-6 text-center">Không tìm thấy truyện.</div>;
  const formatNumber = (num: unknown) => {
    const parsed = typeof num === "number" ? num : Number(num);
    if (isNaN(parsed)) return "N/A";
    return Number.isInteger(parsed) ? parsed.toString() : parsed.toFixed(2).replace(/\.?0+$/, '');
  };
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-8">
          <div className="lg:col-span-7 space-y-8">
            <ComicHeader comic={comic} firstChapter={comic.chapters[comic.chapters.length - 1].number} lastChapter={comic.chapters[0].number} onFollowToggle={handleFollowToggle} onFavoriteToggle={handleFavoriteToggle}/>
            <ComicDescription description={comic.description} />
            <ChapterList chapters={comic.chapters} comicSlug={comic.slug} comicId={comic.id}/>
            <CommentSection comicId={comic.id.toString()} comicSlug={comic.slug}/>
          </div>
          <div className="lg:col-span-4 space-y-8">
            <RatingWidget comicId={comic.id}  /> 
            <RelatedComics relatedComics={relatedComics} />
          </div>
        </div>
      </main>
    </div>
  )
}
