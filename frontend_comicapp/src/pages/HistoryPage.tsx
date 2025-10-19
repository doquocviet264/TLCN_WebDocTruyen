import { useState, useEffect } from 'react';
import axios from 'axios';
import { ComicCard } from '../components/ComicCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {useNavigate } from 'react-router-dom';
// Interface cho dữ liệu từ API tài khoản
interface AccountComic {
  id: number;
  title: string;
  slug: string;
  image: string;
  lastChapter: string;
  chapterTitle: string;
  lastReadAt: string;
}
interface ComicHistory {
  lastReadChapterId: number;
  lastReadChapterNumber: number;
  lastReadAt: string;
}
interface Comic {
  title: string;
  slug: string;
  image: string;
}
// Interface cho dữ liệu từ thiết bị (kết hợp thông tin từ API và localStorage)
interface DeviceComicWithHistory {
  slug: string;
  title: string;
  image: string;
  id: number;
  chapterNumber: number;
  lastReadAt: string;
}

// Interface cho item trong localStorage
interface ReadingHistoryItem {
  comicId: number;
  chapterId: number;
  chapterNumber: number;
  lastReadAt: string;
}

const DETAILED_HISTORY_KEY = 'detailed_reading_history';

export default function MyReadingHistory() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accountComics, setAccountComics] = useState<AccountComic[]>([]);
  const [deviceComics, setDeviceComics] = useState<DeviceComicWithHistory[]>([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState({
    account: false,
    device: false
  });
  const [error, setError] = useState({
    account: '',
    device: ''
  });

  // Kiểm tra đăng nhập
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  // Lấy dữ liệu từ tài khoản
  const fetchAccountHistory = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(prev => ({ ...prev, account: true }));
    setError(prev => ({ ...prev, account: '' }));

    try {
      const response = await axios.get<AccountComic[]>(`${import.meta.env.VITE_API_URL}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccountComics(response.data);
    } catch (err) {
      console.error('Lỗi khi lấy lịch sử từ tài khoản:', err);
      setError(prev => ({ ...prev, account: 'Không thể tải lịch sử từ tài khoản' }));
    } finally {
      setLoading(prev => ({ ...prev, account: false }));
    }
  };

  // Lấy dữ liệu từ thiết bị
  const fetchDeviceHistory = async () => {
      setLoading(prev => ({ ...prev, device: true }));
      setError(prev => ({ ...prev, device: '' }));

      try {
          const localHistoryJson = localStorage.getItem(DETAILED_HISTORY_KEY);
          if (!localHistoryJson) {
              setDeviceComics([]);
              return;
          }

          const historyObject: { [comicId: string]: ComicHistory } = JSON.parse(localHistoryJson);

          // 1. Chuẩn bị dữ liệu từ localStorage
          const sortedHistory = Object.entries(historyObject)
              .map(([comicId, comicData]) => ({
                  id: Number(comicId),
                  lastReadAt: comicData.lastReadAt,
                  chapterNumber: comicData.lastReadChapterNumber,
              }))
              .sort((a, b) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime());

          // 2. Gọi API để lấy thông tin chi tiết MỘT CÁCH SONG SONG (hiệu quả hơn vòng lặp)
          const historyWithDetails = await Promise.all(
              sortedHistory.map(async (historyItem) => {
                  try {
                      const response = await axios.get<Comic>(
                          `${import.meta.env.VITE_API_URL}/comics/id/${historyItem.id}`
                      );
                      
                      // 3. Kết hợp dữ liệu từ localStorage và API
                      return {
                          id: historyItem.id,
                          title: response.data.title,
                          slug: response.data.slug,
                          image: response.data.image,
                          chapterNumber: historyItem.chapterNumber,
                          lastReadAt: historyItem.lastReadAt,
                      } as DeviceComicWithHistory;

                  } catch (err) {
                      console.error(`Lỗi khi lấy thông tin truyện ID: ${historyItem.id}`, err);
                      return null; // Trả về null nếu API cho truyện này bị lỗi
                  }
              })
          );
          
          const validComics = historyWithDetails.filter((comic): comic is DeviceComicWithHistory => comic !== null);

          setDeviceComics(validComics);

      } catch (err) {
          console.error('Lỗi khi xử lý lịch sử từ thiết bị:', err);
          setError(prev => ({ ...prev, device: 'Không thể tải lịch sử từ thiết bị' }));
          setDeviceComics([]);
      } finally {
          setLoading(prev => ({ ...prev, device: false }));
      }
  };
  // Tự động load dữ liệu khi tab thay đổi
  useEffect(() => {
    fetchDeviceHistory();
  }, []);

  const handleTabChange = (value: string) => {
    if (value === 'account' && isLoggedIn) {
      fetchAccountHistory();
    }
  };

  const handleDelete = async (comicId: number, type: 'account' | 'device') => {
    if (type === 'account') {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/history/${comicId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAccountComics(prev => prev.filter(c => c.id !== comicId));
      } catch (err) {
        console.error('Lỗi xoá lịch sử account:', err);
      }
    } else if (type === 'device') {
      try {
        const historyJson = localStorage.getItem(DETAILED_HISTORY_KEY);
        if (!historyJson) return;

        const history: ReadingHistoryItem[] = JSON.parse(historyJson);
        const updatedHistory = history.filter(item => item.comicId !== comicId);

        localStorage.setItem(DETAILED_HISTORY_KEY, JSON.stringify(updatedHistory));
        setDeviceComics(prev => prev.filter(c => c.id !== comicId));
      } catch (err) {
        console.error('Lỗi xoá lịch sử device:', err);
      }
    }
  };

  const formatNumber = (num: unknown) => {
    const parsed = typeof num === "number" ? num : Number(num);
    if (isNaN(parsed)||parsed === 0) return "mới";
    return Number.isInteger(parsed) ? parsed.toString() : parsed.toFixed(2).replace(/\.?0+$/, "");
  };
  const handleLoginRedirect = () => {
    // Chuyển hướng đến trang đăng nhập
    navigate(
        `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`
    );
  };

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <Tabs defaultValue="device" onValueChange={handleTabChange} className="w-full">
        {/* Phần chọn Tab */}
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="device">Từ thiết bị</TabsTrigger>
          <TabsTrigger value="account">Từ tài khoản</TabsTrigger>
        </TabsList>

        {/* Nội dung Tab "Từ thiết bị" */}
        <TabsContent value="device">
          {loading.device ? (
            <div className="flex justify-center items-center h-64">
              <p>Đang tải lịch sử từ thiết bị...</p>
            </div>
          ) : error.device ? (
            <div className="flex justify-center items-center h-64 text-red-500">
              <p>{error.device}</p>
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
                  continueReadingText={`Chương ${comic.chapterNumber}`}
                  continueReadingUrl={`/truyen-tranh/${comic.slug}/chapter/${comic.chapterNumber}`}
                  onDelete={() => handleDelete(comic.id, 'device')}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Nội dung Tab "Từ tài khoản" */}
        <TabsContent value="account">
          {!isLoggedIn ? (
            <div className="flex flex-col items-center justify-center text-center h-64 rounded-lg mt-6">
              <p className="">
                Vui lòng đăng nhập để xem và đồng bộ lịch sử đọc truyện của bạn.
              </p>
              <Button className="mt-4" onClick={handleLoginRedirect}>
                Đi đến trang đăng nhập
              </Button>
            </div>
          ) : loading.account ? (
            <div className="flex justify-center items-center h-64">
              <p>Đang tải lịch sử từ tài khoản...</p>
            </div>
          ) : error.account ? (
            <div className="flex justify-center items-center h-64 text-red-500">
              <p>{error.account}</p>
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
                  continueReadingText={`${comic.chapterTitle || `Chương ${comic.lastChapter}`}`}
                  continueReadingUrl={`/truyen-tranh/${comic.slug}/chapter/${formatNumber(comic.lastChapter)}`}
                  onDelete={() => handleDelete(comic.id, 'account')}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}