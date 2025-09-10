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

// Định nghĩa kiểu dữ liệu cho toàn bộ comic detail
interface Chapter {
  number: number;
  title: string;
  time: string;
}

interface Comic {
  id: string;
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
  isFollowing: boolean;
  description: string;
  chapters: Chapter[];
}
interface RelatedComic {
  id: string;
  slug: string;
  title: string;
  image: string;
  rating: number;
  views: number;
  latestChapterNumber: number;
  latestChapterTime: string;
}
const sampleRelatedComics: RelatedComic[] = [
  {
    id: "1",
    slug: "one-piece",
    title: "One Piece",
    image: "https://example.com/onepiece.jpg",
    rating: 4.8,
    views: 1200000,
    latestChapterNumber: 1090,
    latestChapterTime: "2025-09-01T10:00:00Z",
  },
  {
    id: "2",
    slug: "naruto",
    title: "Naruto",
    image: "https://example.com/naruto.jpg",
    rating: 4.7,
    views: 950000,
    latestChapterNumber: 700,
    latestChapterTime: "2025-08-25T14:30:00Z",
  },
  {
    id: "3",
    slug: "attack-on-titan",
    title: "Attack on Titan",
    image: "https://example.com/aot.jpg",
    rating: 4.9,
    views: 850000,
    latestChapterNumber: 139,
    latestChapterTime: "2025-08-20T08:00:00Z",
  },
  {
    id: "4",
    slug: "demon-slayer",
    title: "Demon Slayer",
    image: "https://example.com/demonslayer.jpg",
    rating: 4.6,
    views: 780000,
    latestChapterNumber: 205,
    latestChapterTime: "2025-08-18T12:00:00Z",
  },
];
const getAuthToken = () => localStorage.getItem("token");
export default function ComicDetailPage() {
  const { slug } = useParams();
  const [comic, setComic] = useState<Comic | null>(null);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!slug) return;

    const fetchComicData = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get<Comic>(`${import.meta.env.VITE_API_URL}/comics/${slug}`, { headers });
        setComic(response.data);
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
        // Hoàn tác nếu API lỗi
        setComic(originalComicState);
        toast.error("Đã có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  if (loading) return <div className="container py-6 text-center">Đang tải trang truyện...</div>;
  if (error) return <div className="container py-6 text-center text-red-500">{error}</div>;
  if (!comic) return <div className="container py-6 text-center">Không tìm thấy truyện.</div>;

  return (
    // <div className="min-h-screen flex flex-col">

    //   <main className="flex-1 container px-4 py-6">
    //     <div className="space-y-8">
    //       <ComicHeader comic={comic} onFollowToggle={handleFollowToggle} />
    //       <ComicDescription description={comic.description} />
    //       <ChapterList chapters={comic.chapters} comicSlug={comic.slug} />
    //       <CommentSection comicId={comic.id.toString()} comicSlug={comic.slug}/>
    //     </div>
    //   </main>

    // </div>
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-8">
          {/* Cột chính bên trái */}
          <div className="lg:col-span-7 space-y-8">
            <ComicHeader comic={comic} onFollowToggle={handleFollowToggle} />
            <ComicDescription description={comic.description} />
            <ChapterList chapters={comic.chapters} comicSlug={comic.slug} />
            <CommentSection comicId={comic.id.toString()} comicSlug={comic.slug}/>
          </div>

          {/* Sidebar bên phải */}
          <div className="lg:col-span-4 space-y-8">
            <RatingWidget comicId={comic.id}  /> 
            <RelatedComics relatedComics={sampleRelatedComics} /> {/* Danh sách truyện liên quan */}
          </div>
        </div>
      </main>
    </div>
  )
}
