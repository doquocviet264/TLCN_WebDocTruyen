import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MessageCircle, Settings, ShieldAlert, ArrowUp, List, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectGroup, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMemo } from 'react';

interface Chapter {
  id: number;
  name: string;
}

interface ChapterControlFooterProps {
  onSettingsClick: () => void;
  onReportClick: () => void;
  onCommentsClick: () => void;
  onScrollTopClick: () => void;
  chapterData: {
    prevChapterSlug: string | null;
    nextChapterSlug: string | null;
    chapterNumber: number;
    allChapters: Chapter[];
  };
}

// Hàm lấy số chapter từ tên
const getChapterNumberFromName = (name: string) => {
  const match = name.match(/^Chương (\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : null; // Trả về số luôn
};


export function ChapterControlFooter({
  onSettingsClick,
  onReportClick,
  onCommentsClick,
  onScrollTopClick,
  chapterData,
}: ChapterControlFooterProps) {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  return (
    <footer className="sticky bottom-0 z-50 bg-background/80 backdrop-blur-sm border-t p-1">
      <div className="container mx-auto flex items-center justify-between gap-2 h-15 px-4">
        {/* Left Controls */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="px-3" asChild>
            <Link to="/"><Home className="h-12 w-12" /></Link>
          </Button>
          <Button variant="ghost" size="icon" className="px-3" asChild>
            <Link to={`/truyen-tranh/${slug}`}><List className="h-12 w-12" /></Link>
          </Button>
          <Button variant="ghost" size="icon" className="px-3" onClick={onSettingsClick}>
            <Settings className="h-12 w-12" />
          </Button>
          <Button variant="ghost" size="icon" className="px-3" onClick={onCommentsClick}>
            <MessageCircle className="h-12 w-12" />
          </Button>
        </div>

        {/* Chapter Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            className={`px-3 ${!chapterData.prevChapterSlug ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!chapterData.prevChapterSlug}
            asChild={!!chapterData.prevChapterSlug} // Chỉ sử dụng asChild nếu có prevChapterSlug
          >
            {chapterData.prevChapterSlug ? (
              <Link to={chapterData.prevChapterSlug}>
                <ChevronLeft />
              </Link>
            ) : (
              <ChevronLeft />
            )}
          </Button>

          <Select
            onValueChange={(value) => {
              const selected = chapterData.allChapters.find((ch) => String(ch.id) === value);
              if (selected) {
                const chapterNumber = getChapterNumberFromName(selected.name);
                if (chapterNumber !== null && chapterNumber !== undefined && slug) {
                  navigate(`/truyen-tranh/${slug}/chapter/${chapterNumber}`);
                }
              }
            }}
          >
            <SelectTrigger className="w-48 h-12 text-base">
              <SelectValue placeholder={`Chương ${chapterData.chapterNumber}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {chapterData.allChapters.map((chap) => (
                  <SelectItem key={chap.id} value={String(chap.id)}>
                    {chap.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button
            variant="secondary"
            size="icon"
            className={`px-3 ${!chapterData.nextChapterSlug ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!chapterData.nextChapterSlug}
            asChild={!!chapterData.nextChapterSlug} // Chỉ sử dụng asChild nếu có nextChapterSlug
          >
            {chapterData.nextChapterSlug ? (
              <Link to={chapterData.nextChapterSlug}>
                <ChevronRight />
              </Link>
            ) : (
              <ChevronRight />
            )}
          </Button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="px-3 text-destructive hover:text-destructive"
            onClick={onReportClick}
          >
            <ShieldAlert className="h-12 w-12" />
          </Button>
          <Button variant="ghost" size="icon" className="px-3" onClick={onScrollTopClick}>
            <ArrowUp className="h-12 w-12" />
          </Button>
        </div>
      </div>
    </footer>
  );
}