import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Trash2 } from "lucide-react";
import ChapterDialog, { ChapterDTO } from "@/components/admin/dialogs/ChapterFormDialog";

interface ComicChaptersProps {
  comicId: number;
  chapters: ChapterDTO[];
  refreshList: () => void;
  onDelete?: (id: number) => void;
}

export default function ComicChapters({ comicId, chapters, refreshList, onDelete }: ComicChaptersProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Danh sách chương</CardTitle>
          <CardDescription>Quản lý toàn bộ các chương của truyện</CardDescription>
        </div>
        <ChapterDialog mode="add" comicId={comicId} onSave={() => refreshList()} />
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
                    <TableCell><Badge variant="outline">Ch. {ch.number}</Badge></TableCell>
                    <TableCell className="font-medium">{ch.title}</TableCell>
                    <TableCell>{ch.publishDate}</TableCell>
                    <TableCell>{ch.updatedAt}</TableCell>
                    <TableCell>
                      {ch.isLocked ? `₫${ch.cost}` : <span className="text-green-600 font-medium">Miễn phí</span>}
                    </TableCell>
                    <TableCell>{ch.views}</TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button variant="outline" size="icon" title="Xem chương">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <ChapterDialog mode="edit" comicId={comicId} chapter={ch} onSave={() => refreshList()} />
                      <Button variant="destructive" size="icon" title="Xóa" onClick={() => onDelete?.(ch.id!)}>
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
  );
}
