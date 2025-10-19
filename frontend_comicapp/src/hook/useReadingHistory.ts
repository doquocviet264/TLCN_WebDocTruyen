// import { useEffect } from 'react';
// import axios from 'axios';

// interface ReadingHistoryParams {
//   comicId?: number;
//   chapterId?: number;
//   chapterNumber?: number;
// }

// interface ReadingHistoryItem {
//   comicId: number;
//   chapterId: number;
//   chapterNumber: number;
//   lastReadAt: string;
// }

// const HISTORY_KEY = 'reading_history';
// const MAX_HISTORY_ITEMS = 20;

// export function useReadingHistory({ comicId, chapterId, chapterNumber }: ReadingHistoryParams) {
//   useEffect(() => {
//     if (!comicId || !chapterId|| !chapterNumber) return;

//     const timer = setTimeout(() => {
//       console.log('Updating reading history...');

//       try {
//         const historyJson = localStorage.getItem(HISTORY_KEY);
//         let history: ReadingHistoryItem[] = historyJson ? JSON.parse(historyJson) : [];

//         // Xóa item cũ nếu đã tồn tại
//         history = history.filter((item: ReadingHistoryItem) => item.comicId !== comicId || item.chapterId !== chapterId);

//         // Thêm item mới vào đầu danh sách
//         const newItem: ReadingHistoryItem = {
//           comicId,
//           chapterId,
//           chapterNumber,
//           lastReadAt: new Date().toISOString(),
//         };
//         history.unshift(newItem);

//         // Giới hạn số lượng
//         if (history.length > MAX_HISTORY_ITEMS) {
//           history = history.slice(0, MAX_HISTORY_ITEMS);
//         }

//         localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
//       } catch (error) {
//         console.error("Lỗi khi cập nhật lịch sử đọc trên localStorage:", error);
//       }

//       // Gọi API nếu đã đăng nhập
//       const token = localStorage.getItem("token");
//       if (token) {
//         axios.post(
//           `${import.meta.env.VITE_API_URL}/history/update`,
//           { comicId, chapterId },
//           { headers: { Authorization: `Bearer ${token}` } }
//         ).catch(err => {
//           console.error("Lỗi khi đồng bộ lịch sử đọc với server:", err);
//         });
//       }
//     }, 10000);

//     return () => clearTimeout(timer);
//   }, [comicId, chapterId]);
// }
import { useEffect } from 'react';
import axios from 'axios';

interface ReadingHistoryParams {
  comicId?: number;
  chapterId?: number;
  chapterNumber?: number;
}

// Định nghĩa các kiểu dữ liệu mới
interface ChapterHistory {
  chapterNumber: number;
  readAt: string;
}

interface ComicHistory {
  lastReadChapterId: number;
  lastReadChapterNumber: number;
  lastReadAt: string;
  chapters: { [chapterId: number]: ChapterHistory }; // Dùng object để truy cập chapter nhanh hơn
}

// Đặt một key mới để không bị xung đột với key cũ
const DETAILED_HISTORY_KEY = 'detailed_reading_history';
const MAX_COMICS_IN_HISTORY = 50; // Giới hạn số lượng truyện để tránh localStorage quá đầy

export function useDetailedReadingHistory({ comicId, chapterId, chapterNumber }: ReadingHistoryParams) {
  useEffect(() => {
    if (!comicId || !chapterId || !chapterNumber) return;

    const timer = setTimeout(() => {
      console.log('Updating detailed reading history...');
      try {
        const historyJson = localStorage.getItem(DETAILED_HISTORY_KEY);
        let history: { [comicId: number]: ComicHistory } = historyJson ? JSON.parse(historyJson) : {};

        // Lấy lịch sử của truyện hiện tại, hoặc tạo mới nếu chưa có
        let comicHistory = history[comicId] || {
          lastReadChapterId: 0,
          lastReadChapterNumber: 0,
          lastReadAt: '',
          chapters: {}
        };

        // Cập nhật thông tin đọc chapter mới nhất và thời gian
        comicHistory.lastReadChapterId = chapterId;
        comicHistory.lastReadChapterNumber = chapterNumber;
        comicHistory.lastReadAt = new Date().toISOString();
        
        // Thêm chapter hiện tại vào danh sách các chapter đã đọc của truyện
        comicHistory.chapters[chapterId] = {
          chapterNumber,
          readAt: new Date().toISOString()
        };

        // Gán lại lịch sử của truyện vào object tổng
        history[comicId] = comicHistory;
        
        // **QUAN TRỌNG: Giới hạn dung lượng localStorage**
        // Nếu số lượng truyện vượt quá giới hạn, xóa đi truyện được đọc xa nhất
        const comicIds = Object.keys(history);
        if (comicIds.length > MAX_COMICS_IN_HISTORY) {
          // Sắp xếp các truyện theo thời gian đọc gần nhất (cũ nhất ở cuối)
          const sortedComics = comicIds.sort((a, b) => 
            new Date(history[Number(b)].lastReadAt).getTime() - new Date(history[Number(a)].lastReadAt).getTime()
          );

          // Lấy ra các truyện cũ nhất để xóa
          const comicsToDelete = sortedComics.slice(MAX_COMICS_IN_HISTORY);
          comicsToDelete.forEach(id => delete history[Number(id)]);
        }

        localStorage.setItem(DETAILED_HISTORY_KEY, JSON.stringify(history));

        // Logic đồng bộ server không đổi
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

      } catch (error) {
        console.error("Lỗi khi cập nhật lịch sử đọc chi tiết:", error);
      }
    }, 3000); // Giảm thời gian chờ xuống 3s

    return () => clearTimeout(timer);
  }, [comicId, chapterId, chapterNumber]);
}