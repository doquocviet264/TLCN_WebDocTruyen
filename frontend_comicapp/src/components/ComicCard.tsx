import type { FC, MouseEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ComicCardProps {
  imageUrl: string;
  title: string;
  href: string;
  continueReadingText?: string;
  continueReadingUrl?: string;
  lastChapter?: string;
  lastChapterUrl?: string;
  lastReadAt?: string;
  onDelete?: () => void;
}

export const ComicCard: FC<ComicCardProps> = ({
  imageUrl,
  title,
  href,
  continueReadingText,
  lastChapter,
  continueReadingUrl,
  lastChapterUrl,
  lastReadAt,
  onDelete,
}) => {
  const handleDeleteClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onDelete?.();
  };
  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} năm trước`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} tháng trước`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} ngày trước`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} giờ trước`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} phút trước`;
    return `Vừa xong`;
  };

  return (
    <div className="w-full flex flex-col font-sans">
      <div className="group relative overflow-hidden rounded-lg shadow-lg">
        {onDelete && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full bg-black/60 text-white shadow-md transition-colors hover:bg-red-500"
            onClick={handleDeleteClick}
            aria-label={`Xóa truyện ${title}`}
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        <a href={href} aria-label={`Xem chi tiết truyện ${title}`}>
          <img
            src={imageUrl}
            alt={`Bìa truyện ${title}`}
            width={180}
            height={270}
            className="aspect-[2/3] w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

          {lastReadAt && (
            <div className="pointer-events-none absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="absolute bottom-0 left-0 right-0 p-2 text-white text-xs">
                <div className="font-semibold text-[13px] leading-snug line-clamp-2">{title}</div>
                <div className="mt-1 opacity-90">Đọc lần cuối: {timeAgo(lastReadAt)}</div>
              </div>
            </div>
          )}
        </a>
      </div>

      <div className="mt-3 flex flex-grow flex-col">
        <a href={href}>
          <h3
            title={title}
            className="text-base font-semibold line-clamp-2 leading-tight hover:text-primary"
          >
            {title}
          </h3>
        </a>
        <a 
          href={continueReadingUrl? continueReadingUrl: lastChapterUrl} 
          className="mt-2 text-sm text-muted-foreground hover:text-primary"
        >
          {continueReadingText
            ? `Đọc tiếp ${continueReadingText} ›`
            : `Chương ${lastChapter}`}
        </a>
      </div>
      
    </div>
  );
};