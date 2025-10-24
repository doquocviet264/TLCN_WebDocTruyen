import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Trash2, Eye, Star } from "lucide-react";
import { toast } from "react-toastify";
import ComicFormDialog, { Comic } from "@/components/admin/dialogs/ComicFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const statusColors: Record<string, string> = {
  "In Progress": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "Completed": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "On Hold": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
};

const statusLabels: Record<string, string> = {
  "In Progress": "Đang tiến hành",
  "Completed": "Hoàn thành",
  "On Hold": "Tạm ngưng",
};

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type ApiComicsResponse = {
  success: true;
  data: Comic[];
  meta: Meta;
};

const API_URL = import.meta.env.VITE_API_URL;
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token") || ""}` });

export default function ManageComics() {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComics, setTotalComics] = useState(1);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Comic | null>(null);

  const navigate = useNavigate();

  const fetchComics = async (page = 1) => {
    try {
      setLoading(true);
      const res = await axios.get<ApiComicsResponse>(
        `${API_URL}/admin/comics`,
        { params: { page }, headers: { ...authHeader() } }
      );
      setComics(res.data.data);
      setTotalPages(res.data.meta.totalPages);
      setCurrentPage(res.data.meta.page);
      setTotalComics(res.data.meta.total);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách comic:", err);
      toast.error("Không tải được danh sách truyện");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComics(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`${API_URL}/admin/comics/${deleteTarget.id}`, {
        headers: { ...authHeader() },
      });
      // Cập nhật list local
      setComics(prev => prev.filter(c => c.id !== deleteTarget.id));
      setTotalComics(prev => Math.max(0, prev - 1));
      toast.success(`Đã xoá: ${deleteTarget.title}`);
    } catch (err) {
      console.error("Xoá truyện lỗi:", err);
      toast.error("Xoá truyện thất bại");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const filteredComics = comics.filter((comic) => {
    const matchesSearch =
      comic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comic.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || comic.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <p className="p-4">Đang tải dữ liệu...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý truyện</h1>
          <p className="text-muted-foreground">Quản lý tất cả truyện tranh</p>
        </div>
        <ComicFormDialog
          mode="add"
          onSave={(newComic) => setComics((prev) => [newComic, ...prev])}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc và Tìm kiếm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Tìm kiếm theo tên truyện hoặc tác giả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="In Progress">Đang tiến hành</SelectItem>
                <SelectItem value="Completed">Hoàn thành</SelectItem>
                <SelectItem value="On Hold">Tạm ngưng</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Comics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách truyện ({totalComics})</CardTitle>
          <CardDescription>Quản lý thông tin và trạng thái của tất cả truyện</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Ảnh bìa</TableHead>
                  <TableHead>Tên truyện</TableHead>
                  <TableHead>Tác giả</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thể loại</TableHead>
                  <TableHead>Lượt theo dõi</TableHead>
                  <TableHead>Lượt xem</TableHead>
                  <TableHead>Đánh giá</TableHead>
                  <TableHead className="text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComics.map((comic) => (
                  <TableRow key={comic.id}>
                    <TableCell>
                      <img
                        src={comic.image || "/placeholder.svg"}
                        alt={comic.title}
                        className="w-12 h-16 rounded-md object-cover"
                      />
                    </TableCell>
                    <TableCell className="font-medium max-w-[550px] truncate" title={comic.title}>{comic.title}</TableCell>
                    <TableCell className="font-medium max-w-[150px] truncate" title={comic.author}>{comic.author}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[comic.status]}>
                        {statusLabels[comic.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {comic.genres.map((g) => (
                          <Badge key={g} variant="secondary">
                            {g}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{comic.followers?.toLocaleString() || 0}</TableCell>
                    <TableCell>{comic.views?.toLocaleString() || 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 mr-1" />
                        <span>{comic.rating || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          title="Xem chi tiết"
                          onClick={() => navigate(`/admin/comics/${comic.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <ComicFormDialog
                          mode="edit"
                          comic={comic}
                          onSave={(updated) =>
                            setComics((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
                          }
                        />

                        {/* Nút mở confirm */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="icon"
                              title="Xóa"
                              onClick={() => setDeleteTarget(comic)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xóa truyện?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn chắc chắn muốn xóa <b>{deleteTarget?.title}</b>? Hành động này sẽ xóa toàn bộ chương,
                                ảnh, bình luận và dữ liệu liên quan. Không thể hoàn tác.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel
                                onClick={() => setDeleteTarget(null)}
                                disabled={deleting}
                              >
                                Hủy
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleConfirmDelete}
                                disabled={deleting}
                              >
                                {deleting ? "Đang xóa..." : "Xác nhận xóa"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                {"<"}
              </Button>

              {Array.from({ length: totalPages })
                .map((_, i) => i + 1)
                .filter(
                  (page) =>
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 2 && page <= currentPage + 2)
                )
                .map((page, i, arr) => {
                  const prev = arr[i - 1];
                  if (prev && page - prev > 1) {
                    return (
                      <span key={`ellipsis-${page}`} className="px-2">
                        ...
                      </span>
                    );
                  }
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  );
                })}

              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                {">"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
