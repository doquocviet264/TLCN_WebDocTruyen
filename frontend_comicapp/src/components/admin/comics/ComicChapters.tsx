import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Trash2 } from "lucide-react";
import ChapterDialog, { ChapterDTO } from "@/components/admin/dialogs/ChapterFormDialog";

// Dialog shadcn
import {
  Dialog,
  DialogContent,
  DialogHeader as DialogHeaderUI,
  DialogTitle as DialogTitleUI,
} from "@/components/ui/dialog";

// Review editor
import ReviewEditor from "@/components/admin/comics/ReviewEditor";

interface ComicChaptersProps {
  comicId: number;
  chapters: ChapterDTO[];
  refreshList: () => void;
  onDelete?: (id: number) => void;
}

export default function ComicChapters({
  comicId,
  chapters,
  refreshList,
  onDelete,
}: ComicChaptersProps) {
  const [openReview, setOpenReview] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<ChapterDTO | null>(null);

  const handleOpenReview = (chapter: ChapterDTO) => {
    setSelectedChapter(chapter);
    setOpenReview(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Danh sách chương</CardTitle>
            <CardDescription>Quản lý toàn bộ các chương của truyện</CardDescription>
          </div>
          <ChapterDialog mode="add" comicId={comicId} onSave={refreshList} />
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chương</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Ngày đăng</TableHead>
                  <TableHead>Cập nhật</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Lượt xem</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chapters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Chưa có chương nào
                    </TableCell>
                  </TableRow>
                ) : (
                  chapters.map((ch) => (
                    <TableRow key={ch.id}>
                      <TableCell>
                        <Badge>Ch. {ch.number}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{ch.title}</TableCell>
                      <TableCell>{ch.publishDate}</TableCell>
                      <TableCell>{ch.updatedAt}</TableCell>
                      <TableCell>
                        {ch.isLocked ? (
                          `₫${ch.cost}`
                        ) : (
                          <span className="font-medium">Miễn phí</span>
                        )}
                      </TableCell>
                      <TableCell>{ch.views}</TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                        {/* Nút mở Review Editor */}
                        <Button
                          variant="outline"
                          size="icon"
                          title="Review giọng đọc cho chương này"
                          onClick={() => handleOpenReview(ch)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <ChapterDialog
                          mode="edit"
                          comicId={comicId}
                          chapter={ch}
                          onSave={refreshList}
                        />

                        <Button
                          variant="destructive"
                          size="icon"
                          title="Xóa"
                          onClick={() => onDelete?.(ch.id!)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog chứa ReviewEditor */}
      <Dialog
        open={openReview}
        onOpenChange={(open) => {
          setOpenReview(open);
          if (!open) setSelectedChapter(null);
        }}
      >
        <DialogContent className="w-screen max-w-screen h-[95vh] p-0"style={{ maxWidth: '56rem' }}>
          <DialogHeaderUI className="px-6 pt-4 pb-2 border-b">
            <DialogTitleUI>
              Review truyện –{" "}
              {selectedChapter ? `Chương ${selectedChapter.number}: ${selectedChapter.title}` : ""}
            </DialogTitleUI>
          </DialogHeaderUI>

          {selectedChapter && (
            <div className="max-h-[80vh] overflow-y-auto">
              <ReviewEditor comicId={comicId} chapter={selectedChapter} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
