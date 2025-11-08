import { useEffect } from 'react';
import axios from 'axios';

interface ReadingHistoryParams {
  comicId?: number;
  chapterId?: number;
  chapterNumber?: number;
  pageNumber?: number; // 0-based
}

interface ChapterHistory {
  chapterNumber: number;
  lastPageNumber: number;
  readAt: string;
}

interface ComicHistory {
  lastReadChapterId: number;
  lastReadChapterNumber: number;
  lastReadPageNumber: number;
  lastReadAt: string;
  chapters: { [chapterId: number]: ChapterHistory };
}

const DETAILED_HISTORY_KEY = 'detailed_reading_history';
const MAX_COMICS_IN_HISTORY = 50;

export function useDetailedReadingHistory({
  comicId,
  chapterId,
  chapterNumber,
  pageNumber,
}: ReadingHistoryParams) {
  useEffect(() => {
    if (!comicId || !chapterId || !chapterNumber) return;

    // Ép pageNumber về số hợp lệ
    const safePage =
      typeof pageNumber === 'number' && pageNumber >= 0 ? pageNumber : 0;

    const timer = window.setTimeout(() => {
      try {
        const historyJson = localStorage.getItem(DETAILED_HISTORY_KEY);
        let history: { [comicId: number]: ComicHistory } = historyJson
          ? JSON.parse(historyJson)
          : {};

        let comicHistory: ComicHistory = history[comicId] || {
          lastReadChapterId: 0,
          lastReadChapterNumber: 0,
          lastReadPageNumber: 0,
          lastReadAt: '',
          chapters: {},
        };

        const now = new Date().toISOString();

        // Tổng
        comicHistory.lastReadChapterId = chapterId;
        comicHistory.lastReadChapterNumber = chapterNumber;
        comicHistory.lastReadPageNumber = safePage;
        comicHistory.lastReadAt = now;

        // Theo chapter
        comicHistory.chapters[chapterId] = {
          chapterNumber,
          lastPageNumber: safePage,
          readAt: now,
        };

        history[comicId] = comicHistory;

        // Giới hạn số comic
        const comicIds = Object.keys(history);
        if (comicIds.length > MAX_COMICS_IN_HISTORY) {
          const sorted = comicIds.sort(
            (a, b) =>
              new Date(history[+b].lastReadAt).getTime() -
              new Date(history[+a].lastReadAt).getTime()
          );
          const toDelete = sorted.slice(MAX_COMICS_IN_HISTORY);
          toDelete.forEach((id) => delete history[+id]);
        }

        localStorage.setItem(DETAILED_HISTORY_KEY, JSON.stringify(history));

        // Sync DB
        const token = localStorage.getItem('token');
        if (token) {
          axios
            .post(
              `${import.meta.env.VITE_API_URL}/history/update`,
              {
                comicId,
                chapterId,
                pageNumber: safePage,
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            )
            .then(() => {
              console.log('SYNC HISTORY →', {
                comicId,
                chapterId,
                chapterNumber,
                pageNumber: safePage,
              });
            })
            .catch((err) => {
              console.error('Lỗi khi đồng bộ lịch sử đọc với server:', err);
            });
        }
      } catch (error) {
        console.error('Lỗi khi cập nhật lịch sử đọc chi tiết:', error);
      }
    }, 3000); // Debounce 3s

    return () => {
      window.clearTimeout(timer);
    };
  }, [comicId, chapterId, chapterNumber, pageNumber]);
}
