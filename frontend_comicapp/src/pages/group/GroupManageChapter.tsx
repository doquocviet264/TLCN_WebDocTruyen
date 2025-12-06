import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Lock, Unlock, Eye, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import ChapterDialog, {
  ChapterDTO,
} from "@/components/groups/dialog/ChapterFormDialog";

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type ApiOk<T> = {
  success: true;
  data: T;
  meta: PaginationMeta;
};

export default function ComicDetail() {
  const { comicId } = useParams<{ comicId: string }>();
  const navigate = useNavigate();

  const numericComicId = comicId ? Number(comicId) : 0;

  const [chapters, setChapters] = useState<ChapterDTO[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const limit = 30;

  const fetchChapters = async (pageParam: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await axios.get<ApiOk<any[]>>(
        `${import.meta.env.VITE_API_URL}/translator/comics/${comicId}/chapters`,
        {
          params: { page: pageParam, limit },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      // Chuẩn hóa dữ liệu BE -> ChapterDTO
      const normalized: ChapterDTO[] = res.data.data.map((ch: any) => ({
        id: ch.id,
        number: Number(ch.number),
        title: ch.title,
        cost: ch.cost,
        isLocked: ch.isLocked,
        views: ch.views,
        updatedAt: ch.updatedAt,
        publishDate: ch.publishDate,
        images: (ch.images || []).map((img: any) => ({
          id: img.imageId,
          url: img.imageUrl,
          pageNumber: img.pageNumber,
        })),
      }));

      setChapters(normalized);
      setMeta(res.data.meta);
    } catch (err) {
      console.error("Lỗi khi lấy chapters:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (comicId) fetchChapters(page);
  }, [comicId, page]);

  // Sau khi thêm/sửa chapter xong -> reload list
  const handleChapterSaved = () => {
    fetchChapters(page);
  };

  const handleDelete = async (chapterId: number) => {
    if (!confirm("Bạn có chắc muốn xóa chapter này?")) return;

    try {
      const token = localStorage.getItem("token");

      await axios.delete(
        `${import.meta.env.VITE_API_URL}/translator/chapters/${chapterId}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      fetchChapters(page);
    } catch (error) {
      console.error("Lỗi khi xóa chapter:", error);
      alert("Xóa chapter thất bại!");
    }
  };

  if (loading) return <p className="p-4">Đang tải dữ liệu...</p>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </Button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Danh sách Chapter</h1>

        {numericComicId > 0 && (
          <ChapterDialog
            mode="add"
            comicId={numericComicId}
            onSave={handleChapterSaved}
          />
        )}
      </div>

      {/* TABLE */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Chương</TableHead>
              <TableHead>Tiêu đề</TableHead>
              <TableHead className="w-[120px]">Lượt xem</TableHead>
              <TableHead className="w-[100px]">Giá</TableHead>
              <TableHead className="w-[120px]">Trạng thái</TableHead>
              <TableHead className="w-[150px]">Cập nhật</TableHead>
              <TableHead className="w-[180px] text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {chapters.map((ch) => (
              <TableRow key={ch.id}>
                <TableCell><Badge variant="outline">Ch. {ch.number}</Badge></TableCell>

                <TableCell>{ch.title}</TableCell>

                <TableCell>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {ch.views ?? 0}
                  </div>
                </TableCell>

                <TableCell>
                  {ch.cost === 0
                    ? "Miễn phí"
                    : `${ch.cost.toLocaleString("vi-VN")} xu`}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1">
                    {ch.isLocked ? (
                      <>
                        <Lock className="w-4 h-4" /> Khóa
                      </>
                    ) : (
                      <>
                        <Unlock className="w-4 h-4" /> Mở
                      </>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  {ch.updatedAt
                    ? new Date(ch.updatedAt).toLocaleDateString()
                    : "-"}
                </TableCell>

                {/* ACTION BUTTONS */}
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <ChapterDialog
                      mode="edit"
                      comicId={numericComicId}
                      chapter={ch}
                      onSave={handleChapterSaved}
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      title="Xóa"
                      onClick={() => handleDelete(ch.id!)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* PAGINATION */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Trang trước
          </Button>

          <span className="text-sm text-muted-foreground">
            Trang {meta.page}/{meta.totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Trang sau
          </Button>
        </div>
      )}
    </div>
  );
}
