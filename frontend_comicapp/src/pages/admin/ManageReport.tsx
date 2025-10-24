import { useState, useEffect } from "react";
import axios from "axios";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, MoreHorizontal, Check, X, AlertTriangle, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-toastify";

interface Report {
  reportId: number;
  title: string;
  description: string;
  type: "comment" | "chapter";
  userId: number;
  targetId: number;
  isResolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
  user: {
    username: string;
    email: string;
    avatar?: string;
  };
  target?: {
    content?: string; // comment
    createdAt?: string;
    User?: {
      username?: string;
    };
    title?: string; // chapter
    chapterNumber?: number;
    Comic?: { title: string };
  };
}
interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
interface ApiReportsResponse {
  success: true;
  data: Report[];            
  meta: Meta; 
}

export default function ReportManagement() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);

  const fetchReports = async (page = 1) => {
    try {
      setLoading(true);
      const res = await axios.get<ApiReportsResponse>(
        `${import.meta.env.VITE_API_URL}/admin/reports?page=${page}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setReports(res.data.data || []);
      setTotalPages(res.data.meta.totalPages);
      setCurrentPage(res.data.meta.page);
      setTotalReports(res.data.meta.total);
    } catch (err) {
      console.error("Lỗi khi lấy báo cáo:", err);
      toast.error("Không thể tải danh sách báo cáo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleResolve = async (id: number) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/admin/reports/${id}/resolve`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      toast.success("Đã đánh dấu báo cáo là đã giải quyết");
      fetchReports();
    } catch {
      toast.error("Không thể cập nhật báo cáo");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/admin/reports/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("Đã xóa báo cáo");
      fetchReports();
    } catch {
      toast.error("Không thể xóa báo cáo");
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.user?.username?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "resolved" ? report.isResolved : !report.isResolved);

    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string | null) =>
    dateString ? new Date(dateString).toLocaleString("vi-VN") : "Chưa giải quyết";

  if (loading) return <p className="p-4">Đang tải dữ liệu...</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý Báo cáo</h1>
          <p className="text-muted-foreground">Theo dõi và xử lý các báo cáo người dùng</p>
        </div>
        <Badge variant="secondary" className="gap-2">
          <AlertTriangle className="h-4 w-4" />
          {reports.filter((r) => !r.isResolved).length} báo cáo chưa xử lý
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc và Tìm kiếm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Tìm kiếm báo cáo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="resolved">Đã giải quyết</SelectItem>
                <SelectItem value="pending">Chưa giải quyết</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Báo cáo ({totalReports})</CardTitle>
          <CardDescription>Quản lý và xử lý các báo cáo từ người dùng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người báo cáo</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Đối tượng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((r) => (
                  <TableRow key={r.reportId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={r.user?.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{r.user?.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{r.user?.username}</p>
                          <p className="text-xs text-muted-foreground">{r.user?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{r.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.type === "comment" ? "Bình luận" : "Chương"}</Badge>
                    </TableCell>
                    <TableCell>
                      {r.type === "comment" && r.target ? (
                        <div className="max-w-[300px]">
                          <p className="text-sm italic text-muted-foreground">Bình luận:</p>
                          <p className="text-sm truncate">"{r.target.content}"</p>
                          <p className="text-xs text-muted-foreground">
                            Bởi {r.target.User?.username || "Ẩn danh"} •{" "}
                            {r.target?.createdAt? new Date(r.target.createdAt).toLocaleString("vi-VN"): "Không rõ thời gian"}
                          </p>
                        </div>
                      ) : r.type === "chapter" && r.target ? (
                        <div>
                          <p className="text-sm italic text-muted-foreground">Chương: {r.target.title}</p>
                          <p className="text-sm font-medium">
                            {r.target.Comic?.title}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Không có dữ liệu</p>
                      )}
                    </TableCell>


                    <TableCell>
                      <Badge className={r.isResolved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                        {r.isResolved ? "Đã giải quyết" : "Chưa xử lý"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {formatDate(r.createdAt)}
                      </div>
                      {r.resolvedAt && (
                        <p className="text-xs text-muted-foreground">Giải quyết: {formatDate(r.resolvedAt)}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                        {/* Nếu báo cáo chưa được xử lý thì hiển thị nút giải quyết */}
                        {!r.isResolved && (
                        <Button
                            variant="outline"
                            size="icon"
                            title="Đánh dấu đã giải quyết"
                            onClick={() => handleResolve(r.reportId)}
                        >
                            <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        )}

                        {/* Nút xóa báo cáo */}
                        <Button
                        variant="destructive"
                        size="icon"
                        title="Xóa báo cáo"
                        onClick={() => handleDelete(r.reportId)}
                        >
                        <X className="h-4 w-4" />
                        </Button>
                    </div>
                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
