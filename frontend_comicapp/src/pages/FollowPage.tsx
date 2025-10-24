import { useState, useEffect } from "react";
import axios from "axios";
import { ComicCard } from "../components/ComicCard";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

interface Comic {
  id: number;
  title: string;
  slug: string;
  image: string;
  lastChapter: string;
  chapterTitle: string;
}

type ApiOk<T> = { success: true; data: T; meta?: unknown };
type ApiErr = { success: false; error: { message: string; code: string; status: number } };

export default function FollowPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [followedComics, setFollowedComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  //Kiểm tra đăng nhập khi mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  //Fetch khi đã biết trạng thái đăng nhập
  useEffect(() => {
    if (isLoggedIn) {
      fetchFollowedComics();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const fetchFollowedComics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      const res = await axios.get<ApiOk<Comic[]> | ApiErr>(
        `${import.meta.env.VITE_API_URL}/comics/followed`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setFollowedComics((res.data as ApiOk<Comic[]>).data || []);
      } else {
        const err = res.data as ApiErr;
        toast.error(err.error?.message || "Không thể tải danh sách theo dõi.");
      }
    } catch (error: any) {
      // 401 → Hết hạn/không hợp lệ → điều hướng login kèm redirect
      if (error?.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        handleLoginRedirect();
        setIsLoggedIn(false);
      } else {
        const msg =
          error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          "Không thể tải danh sách theo dõi.";
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (comicId: number, slug: string) => {
    const prev = followedComics;
    setFollowedComics((list) => list.filter((c) => c.id !== comicId));

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Người dùng chưa đăng nhập");
      }

      const res = await axios.post<ApiOk<string> | ApiErr>(
        `${import.meta.env.VITE_API_URL}/comics/${slug}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        // OK: đã cập nhật UI ở trên
        toast.success("Đã bỏ theo dõi.");
      } else {
        // Rollback nếu backend báo lỗi
        setFollowedComics(prev);
        const err = res.data as ApiErr;
        toast.error(err.error?.message || "Bỏ theo dõi thất bại.");
      }
    } catch (error: any) {
      setFollowedComics(prev);
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        "Bỏ theo dõi thất bại.";
      toast.error(msg);
    }
  };

  const handleLoginRedirect = () => {
    navigate(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen p-4 sm:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-center bg-card p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Bạn chưa đăng nhập</h2>
          <p className="mb-4">Vui lòng đăng nhập để xem danh sách truyện bạn đang theo dõi.</p>
          <Button onClick={handleLoginRedirect}>Đi đến trang đăng nhập</Button>
        </div>
      </div>
    );
  }
  const formatNumber = (num: unknown) => {
    const parsed = typeof num === "number" ? num : Number(num);
    if (isNaN(parsed)||parsed === 0) return "mới";
    return Number.isInteger(parsed) ? parsed.toString() : parsed.toFixed(2).replace(/\.?0+$/, "");
  };

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <h1 className="text-2xl font-bold mb-6">Truyện đang theo dõi</h1>

      {followedComics.length === 0 ? (
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
              continueReadingText={`Chương ${formatNumber(comic.lastChapter)}`}
              continueReadingUrl={`/truyen-tranh/${comic.slug}/chapter/${formatNumber(comic.lastChapter)}`}
              onDelete={() => handleUnfollow(comic.id, comic.slug)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
