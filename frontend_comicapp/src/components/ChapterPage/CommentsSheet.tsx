import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card } from '@/components/ui/card';

interface CommentsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  comicId?: string;
  chapterId?: string;
}

export function CommentsSheet({ isOpen, onOpenChange, comicId, chapterId }: CommentsSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] p-0 bg-muted text-foreground">
        <SheetHeader className="p-6 border-b">
          <SheetTitle>Bình luận</SheetTitle>
        </SheetHeader>
        <div className="p-6 h-full overflow-y-auto">
            {/* Đây là nơi bạn sẽ đặt component CommentSection đã có của mình */}
            <p>Component CommentSection sẽ được hiển thị ở đây.</p>
            {/* <CommentSection comicId={comicId} chapterId={chapterId} /> */}
        </div>
      </SheetContent>
    </Sheet>
  );
}