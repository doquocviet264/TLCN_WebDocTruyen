import { useEffect } from 'react';
import axios from 'axios';

interface ReadingHistoryParams {
  comicId?: number;
  chapterId?: number;
  chapterNumber?: number;
}

interface ReadingHistoryItem {
  comicId: number;
  chapterId: number;
  chapterNumber: number;
  lastReadAt: string;
}

const HISTORY_KEY = 'reading_history';
const MAX_HISTORY_ITEMS = 20;

export function useReadingHistory({ comicId, chapterId, chapterNumber }: ReadingHistoryParams) {
  useEffect(() => {
    if (!comicId || !chapterId|| !chapterNumber) return;

    const timer = setTimeout(() => {
      console.log('Updating reading history...');

      try {
        const historyJson = localStorage.getItem(HISTORY_KEY);
        let history: ReadingHistoryItem[] = historyJson ? JSON.parse(historyJson) : [];

        // Xóa item cũ nếu đã tồn tại
        history = history.filter((item: ReadingHistoryItem) => item.comicId !== comicId || item.chapterId !== chapterId);

        // Thêm item mới vào đầu danh sách
        const newItem: ReadingHistoryItem = {
          comicId,
          chapterId,
          chapterNumber,
          lastReadAt: new Date().toISOString(),
        };
        history.unshift(newItem);

        // Giới hạn số lượng
        if (history.length > MAX_HISTORY_ITEMS) {
          history = history.slice(0, MAX_HISTORY_ITEMS);
        }

        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      } catch (error) {
        console.error("Lỗi khi cập nhật lịch sử đọc trên localStorage:", error);
      }

      // Gọi API nếu đã đăng nhập
      const token = localStorage.getItem("token");
      if (token) {
        axios.post(
          `${import.meta.env.VITE_API_URL}/history/update`,
          { comicId, chapterId },
          { headers: { Authorization: `Bearer ${token}` } }
        ).catch(err => {
          console.error("Lỗi khi đồng bộ lịch sử đọc với server:", err);
        });
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [comicId, chapterId]);
}
