import { useState, useEffect } from 'react';
import axios from 'axios';
import { ComicCard } from '../components/ComicCard'; // Đảm bảo đường dẫn này đúng
import { Button } from '@/components/ui/button'; // Đảm bảo đường dẫn này đúng
import { useNavigate } from 'react-router-dom';
// Interface cho dữ liệu truyện tranh đang theo dõi
interface FollowedComic {
  id: number;
  title: string;
  slug: string;
  image: string;
  lastChapter: string; // Ví dụ: "150"
  chapterTitle: string; // Ví dụ: "Chương 150: Trận chiến cuối cùng"
}

// Dữ liệu giả để hiển thị giao diện
const mockFollowedComics: FollowedComic[] = [
  {
    id: 1,
    title: 'Võ Luyện Đỉnh Phong',
    slug: 'vo-luyen-dinh-phong',
    image: 'https://i.truyenvua.com/ebook/190x247/vo-luyen-dinh-phong_1681723856.jpg?gt=1',
    lastChapter: '6145',
    chapterTitle: 'Chương 6145'
  },
  {
    id: 2,
    title: 'Đấu La Đại Lục',
    slug: 'dau-la-dai-luc',
    image: 'https://i.truyenvua.com/ebook/190x247/dau-la-dai-luc_1583331952.jpg?gt=1',
    lastChapter: '336',
    chapterTitle: 'Chương 336'
  },
  {
    id: 3,
    title: 'Toàn Chức Pháp Sư',
    slug: 'toan-chuc-phap-su',
    image: 'https://i.truyenvua.com/ebook/190x247/toan-chuc-phap-su_1583332194.jpg?gt=1',
    lastChapter: '1134',
    chapterTitle: 'Chương 1134'
  },
  {
    id: 4,
    title: 'One Piece',
    slug: 'one-piece',
    image: 'https://i.truyenvua.com/ebook/190x247/dao-hai-tac_1583331885.jpg?gt=1',
    lastChapter: '1125',
    chapterTitle: 'Chương 1125'
  },
  {
    id: 5,
    title: 'Ta Là Tà Đế',
    slug: 'ta-la-ta-de',
    image: 'https://i.truyenvua.com/ebook/190x247/ta-la-ta-de_1659632828.jpg?gt=1',
    lastChapter: '450',
    chapterTitle: 'Chương 450'
  }
];

export default function FollowPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [followedComics, setFollowedComics] = useState<FollowedComic[]>([]);
  const [loading, setLoading] = useState(true); // Bắt đầu với trạng thái loading
  const [error, setError] = useState('');
const navigate = useNavigate();
  // 1. Kiểm tra trạng thái đăng nhập khi component được mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  // 2. Fetch dữ liệu khi trạng thái đăng nhập thay đổi
  useEffect(() => {
    // Chỉ fetch khi người dùng đã được xác định là đã đăng nhập
    if (isLoggedIn) {
      fetchFollowedComics();
    } else {
      // Nếu không đăng nhập, dừng loading để hiển thị thông báo
      setLoading(false);
    }
  }, [isLoggedIn]); // Chạy lại khi isLoggedIn thay đổi

  // Hàm lấy danh sách truyện theo dõi
  const fetchFollowedComics = async () => {
    setLoading(true);
    setError('');

    try {

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Người dùng chưa đăng nhập");
      }
      
      const response = await axios.get<FollowedComic[]>(`${import.meta.env.VITE_API_URL}/comics/followed`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFollowedComics(response.data);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách theo dõi:', err);
      setError('Không thể tải danh sách truyện đang theo dõi.');
    } finally {
      setLoading(false);
    }
  };
  
  // Hàm xử lý khi người dùng bỏ theo dõi (ví dụ)
  const handleUnfollow = async (comicId: number, slug: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Người dùng chưa đăng nhập");
      }
      await axios.post(
        `${import.meta.env.VITE_API_URL}/comics/${slug}/follow`,
        {}, // body rỗng
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Nếu xoá follow thành công thì cập nhật UI
      setFollowedComics(prev => prev.filter(c => c.id !== comicId));
    } catch (error) {
      console.error("Lỗi khi bỏ theo dõi:", error);
    }
  };

  // Hàm chuyển hướng đến trang đăng nhập
  const handleLoginRedirect = () => {
    navigate(
        `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`
    );
    };

  
  // --- RENDER ---
  
  // Trạng thái Loading ban đầu
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  // Nếu không đăng nhập, hiển thị yêu cầu
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen p-4 sm:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-center bg-card p-8 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Bạn chưa đăng nhập</h2>
            <p className="mb-4">
              Vui lòng đăng nhập để xem danh sách truyện bạn đang theo dõi.
            </p>
            <Button onClick={handleLoginRedirect}>
              Đi đến trang đăng nhập
            </Button>
          </div>
      </div>
    );
  }

  // Nếu đã đăng nhập, hiển thị nội dung
  return (
    <div className="min-h-screen p-4 sm:p-8">
      <h1 className="text-2xl font-bold mb-6">Truyện đang theo dõi</h1>
      
      {error ? (
        <div className="flex justify-center items-center h-64 text-red-500">
          <p>{error}</p>
        </div>
      ) : followedComics.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <p>Bạn chưa theo dõi truyện nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {followedComics.map((comic) => (
            <ComicCard
              key={`followed-${comic.id}`}
              imageUrl={comic.image}
              title={comic.title}
              href={`/truyen-tranh/${comic.slug}`}
              // Hiển thị chương mới nhất thay vì "Đọc tiếp"
              continueReadingText={comic.chapterTitle}
              continueReadingUrl={`/truyen-tranh/${comic.slug}/chuong/${comic.lastChapter}`}
              // Thêm prop onDelete để xử lý việc bỏ theo dõi
              onDelete={() => handleUnfollow(comic.id, comic.slug)} 
            />
          ))}
        </div>
      )}
    </div>
  );
}