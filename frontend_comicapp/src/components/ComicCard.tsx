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
  onDelete,
}) => {
  const handleDeleteClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onDelete?.();
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