import { useState, useEffect } from "react";
import axios from "axios";
import { ComicCard } from "../components/ComicCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

type ApiOk<T> = { success: true; data: T; meta?: unknown };
type ApiErr = { success: false; error: { message: string; code: string; status: number } };

interface ComicHistory {
  lastReadChapterNumber: number;
  lastReadAt: string;
}
interface SubComic {
  title: string;
  slug: string;
  image: string;
}
interface Comic {
  id: number;
  title: string;
  slug: string;
  image: string;
  lastChapter: number;
  chapterTitle?: string;
  lastReadAt: string;
}

const DETAILED_HISTORY_KEY = "detailed_reading_history";

export default function MyReadingHistory() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accountComics, setAccountComics] = useState<Comic[]>([]);
  const [deviceComics, setDeviceComics] = useState<Comic[]>([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState({ account: false, device: false });

  // Kiểm tra đăng nhập
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  // Fetch thiết bị khi mount
  useEffect(() => {
    fetchDeviceHistory();
  }, []);

  // Chuyển tab → nếu vào "account" và đã login thì fetch
  const handleTabChange = (value: string) => {
    if (value === "account" && isLoggedIn) {
      fetchAccountHistory();
    }
  };

  // Fetch từ tài khoản (envelope chuẩn)
  const fetchAccountHistory = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoggedIn(false);
      return;
    }

    setLoading((p) => ({ ...p, account: true }));

    try {
      const res = await axios.get<ApiOk<Comic[]> | ApiErr>(
        `${import.meta.env.VITE_API_URL}/history`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setAccountComics((res.data as ApiOk<Comic[]>).data || []);
      } else {
        const err = res.data as ApiErr;
        toast.error(err.error?.message || "Không thể tải lịch sử từ tài khoản.");
      }
    } catch (error: any) {
      if (error?.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        handleLoginRedirect();
        setIsLoggedIn(false);
      } else {
        const msg =
          error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          "Không thể tải lịch sử từ tài khoản.";
        toast.error(msg);
      }
    } finally {
      setLoading((p) => ({ ...p, account: false }));
    }
  };

  // Fetch từ thiết bị (localStorage + gọi chi tiết song song)
  const fetchDeviceHistory = async () => {
    setLoading((p) => ({ ...p, device: true }));
    try {
      const raw = localStorage.getItem(DETAILED_HISTORY_KEY);

      if (!raw) {
        setDeviceComics([]);
        return;
      }

      // Lưu ý: khóa hiện tại là OBJECT { [comicId]: ComicHistory }
      const historyObj: Record<string, ComicHistory> = JSON.parse(raw);

      const sorted = Object.entries(historyObj)
        .map(([comicId, h]) => ({
          id: Number(comicId),
          lastChapter: h.lastReadChapterNumber,
          lastReadAt: h.lastReadAt,
        }))
        .sort(
          (a, b) =>
            new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime()
        );

      // Gọi chi tiết song song
      const details = await Promise.all(
        sorted.map(async (item) => {
          try {
            const res = await axios.get<ApiOk<SubComic> | ApiErr>(
              `${import.meta.env.VITE_API_URL}/comics/id/${item.id}`
            );
            if (!res.data.success) return null;

            const d = (res.data as ApiOk<SubComic>).data;
            return {
              id: item.id,
              title: d.title,
              slug: d.slug,
              image: d.image,
              lastChapter: item.lastChapter,
              lastReadAt: item.lastReadAt,
            } as Comic;
          } catch {
            return null;
          }
        })
      );

      setDeviceComics(details.filter((x): x is Comic => x !== null));
    } catch (error) {
      const msg =
        (error as any)?.message || "Không thể tải lịch sử từ thiết bị.";
      toast.error(msg);
      setDeviceComics([]);
    } finally {
      setLoading((p) => ({ ...p, device: false }));
    }
  };

  // Xoá lịch sử
  const handleDelete = async (comicId: number, type: "account" | "device") => {
    if (type === "account") {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Bạn chưa đăng nhập.");
        return;
      }

      // Optimistic update
      const prev = accountComics;
      setAccountComics((p) => p.filter((c) => c.id !== comicId));

      try {
        const res = await axios.delete<ApiOk<string> | ApiErr>(
          `${import.meta.env.VITE_API_URL}/history/${comicId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          toast.success("Đã xoá lịch sử đọc.");
        } else {
          setAccountComics(prev); // rollback
          const err = res.data as ApiErr;
          toast.error(err.error?.message || "Xoá lịch sử thất bại.");
        }
      } catch (error: any) {
        setAccountComics(prev); // rollback
        const msg =
          error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          "Xoá lịch sử thất bại.";
        toast.error(msg);
      }
    } else {
      // DEVICE: lưu theo OBJECT => xoá key rồi ghi lại
      try {
        const raw = localStorage.getItem(DETAILED_HISTORY_KEY);
        if (!raw) return;

        const obj: Record<string, ComicHistory> = JSON.parse(raw);
        delete obj[String(comicId)];
        localStorage.setItem(DETAILED_HISTORY_KEY, JSON.stringify(obj));

        setDeviceComics((p) => p.filter((c) => c.id !== comicId));
        toast.success("Đã xoá lịch sử trên thiết bị.");
      } catch (error: any) {
        const msg =
          error?.message || "Xoá lịch sử trên thiết bị thất bại.";
        toast.error(msg);
      }
    }
  };
  


  const formatNumber = (num: unknown) => {
    const parsed = typeof num === "number" ? num : Number(num);
    if (isNaN(parsed) || parsed === 0) return "mới";
    return Number.isInteger(parsed)
      ? parsed.toString()
      : parsed.toFixed(2).replace(/\.?0+$/, "");
  };

  const handleLoginRedirect = () => {
    navigate(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
  };

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <Tabs defaultValue="device" onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="device">Từ thiết bị</TabsTrigger>
          <TabsTrigger value="account">Từ tài khoản</TabsTrigger>
        </TabsList>

        {/* Thiết bị */}
        <TabsContent value="device">
          {loading.device ? (
            <div className="flex justify-center items-center h-64">
              <p>Đang tải lịch sử từ thiết bị...</p>
            </div>
          ) : deviceComics.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <p>Chưa có lịch sử đọc trên thiết bị này</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 mt-6">
              {deviceComics.map((comic, index) => (
                <ComicCard
                  key={`device-${comic.slug}-${index}`}
                  imageUrl={comic.image}
                  title={comic.title}
                  href={`/truyen-tranh/${comic.slug}`}
                  continueReadingText={`Chương ${formatNumber(comic.lastChapter)}`}
                  continueReadingUrl={`/truyen-tranh/${comic.slug}/chapter/${formatNumber(comic.lastChapter)}`}
                  lastReadAt={comic.lastReadAt}
                  onDelete={() => handleDelete(comic.id, "device")}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tài khoản */}
        <TabsContent value="account">
          {!isLoggedIn ? (
            <div className="flex flex-col items-center justify-center text-center h-64 rounded-lg mt-6">
              <p>Vui lòng đăng nhập để xem và đồng bộ lịch sử đọc truyện của bạn.</p>
              <Button className="mt-4" onClick={handleLoginRedirect}>
                Đi đến trang đăng nhập
              </Button>
            </div>
          ) : loading.account ? (
            <div className="flex justify-center items-center h-64">
              <p>Đang tải lịch sử từ tài khoản...</p>
            </div>
          ) : accountComics.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <p>Chưa có lịch sử đọc từ tài khoản</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 mt-6">
              {accountComics.map((comic) => (
                <ComicCard
                  key={`account-${comic.id}`}
                  imageUrl={comic.image}
                  title={comic.title}
                  href={`/truyen-tranh/${comic.slug}`}
                  continueReadingText={comic.chapterTitle || `Chương ${formatNumber(comic.lastChapter)}`}
                  continueReadingUrl={`/truyen-tranh/${comic.slug}/chapter/${formatNumber(comic.lastChapter)}`}
                  lastReadAt={comic.lastReadAt}
                  onDelete={() => handleDelete(comic.id, "account")}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
