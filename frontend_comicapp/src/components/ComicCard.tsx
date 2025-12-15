import type { FC, MouseEvent } from 'react';
import { X, Clock, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
  continueReadingUrl,
  lastChapter,
  lastChapterUrl,
  lastReadAt,
  onDelete,
}) => {
  
  const handleDeleteClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.();
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
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

  // Xác định link chapter để hiển thị
  const chapterLink = continueReadingUrl || lastChapterUrl;
  const chapterText = continueReadingText 
    ? `Đọc tiếp Chap ${continueReadingText}` 
    : lastChapter 
      ? `Chap ${lastChapter}` 
      : null;

  return (
    <div className="group relative flex flex-col h-full transition-transform duration-300 hover:-translate-y-1">
      
      {/* --- POSTER IMAGE --- */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-muted shadow-sm group-hover:shadow-lg transition-all border border-border/50">
        
        {/* Nút Xóa (Chỉ hiện khi hover) */}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-20 h-7 w-7 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-red-500/80 hover:text-white transition-all opacity-0 group-hover:opacity-100"
            onClick={handleDeleteClick}
            aria-label="Xóa"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        <a href={href} className="block h-full w-full" aria-label={`Xem ${title}`}>
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
          
          {/* Gradient Overlay: Luôn hiện nhẹ ở dưới để text dễ đọc */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

          {/* Overlay Info (Bottom) */}
          <div className="absolute bottom-0 left-0 right-0 p-3 text-white z-10">
             {lastReadAt ? (
                <div className="flex items-center gap-1.5 text-xs font-medium text-white/90">
                   <Clock className="w-3 h-3" />
                   <span>{timeAgo(lastReadAt)}</span>
                </div>
             ) : (
                lastChapter && (
                   <Badge variant="secondary" className="bg-white/20 hover:bg-primary backdrop-blur-sm border-0 text-xs font-semibold px-2 h-5 text-white">
                      Chap {lastChapter}
                   </Badge>
                )
             )}
          </div>
        </a>
      </div>

      {/* --- CONTENT INFO --- */}
      <div className="mt-3 flex flex-col flex-1 gap-1">
        <a href={href} title={title}>
          <h3 className="text-sm font-bold leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
        </a>

        {/* Link Chapter phụ bên dưới */}
        {chapterLink && (
          <a 
            href={chapterLink} 
            className="text-xs text-muted-foreground hover:text-primary mt-auto flex items-center gap-1 transition-colors w-fit"
          >
            {continueReadingUrl ? <PlayCircle className="w-3 h-3" /> : null}
            {chapterText}
          </a>
        )}
      </div>
    </div>
  );
};