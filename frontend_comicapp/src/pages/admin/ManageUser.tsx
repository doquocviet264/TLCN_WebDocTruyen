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
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MoreHorizontal, Lock, Unlock, Shield } from "lucide-react";
import { toast } from "react-toastify";

interface User {
  userId: number;
  username: string;
  email: string;
  avatar?: string;
  role: "user" | "admin";
  status: "active" | "suspended" | "deleted";
  isVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
  Wallet?: { balance: number };
}
interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
interface ApiUsersResponse {
  success: true;
  data: User[];            
  meta: Meta; 
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  deleted: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

const statusLabels: Record<string, string> = {
  active: "Hoạt động",
  suspended: "Đã khóa",
  deleted: "Đã xóa",
};

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // 📡 Gọi API danh sách người dùng
  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const res = await axios.get<ApiUsersResponse>(
        `${import.meta.env.VITE_API_URL}/admin/users?page=${page}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setUsers(res.data.data || []);
      setTotalUsers(res.data.meta.total);
      setTotalPages(res.data.meta.totalPages);
      setCurrentPage(res.data.meta.page);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách người dùng:", err);
      toast.error("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  // Khóa / mở khóa tài khoản
  const handleToggleStatus = async (userId: number, status: string) => {
    try {
      const action = status === "active" ? "suspend" : "activate";
      const res = await axios.patch<{ message: string }>(
        `${import.meta.env.VITE_API_URL}/admin/users/${userId}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      toast.success(res.data.message);
      fetchUsers(currentPage);
    } catch (err) {
      toast.error("Không thể cập nhật trạng thái người dùng");
    }
  };

  // Cấp quyền admin
  const handlePromote = async (userId: number) => {
    try {
      const res = await axios.patch<{ message: string }>(
        `${import.meta.env.VITE_API_URL}/admin/users/${userId}/promote`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      toast.success(res.data.message);
      fetchUsers(currentPage);
    } catch (err) {
      toast.error("Không thể cấp quyền admin");
    }
  };

  // Định dạng ngày
  const formatDate = (dateString: string | null) =>
    dateString ? new Date(dateString).toLocaleString("vi-VN") : "Chưa đăng nhập";

  // 🧠 FE lọc dữ liệu (tự xử lý)
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <p className="p-4">Đang tải dữ liệu...</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý người dùng</h1>
          <p className="text-muted-foreground">Quản lý tài khoản và quyền hệ thống</p>
        </div>
      </div>

      {/* Bộ lọc */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc và Tìm kiếm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc email..."
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
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="suspended">Đã khóa</SelectItem>
                <SelectItem value="deleted">Đã xóa</SelectItem>
            </SelectContent>
            </Select>

          </div>
        </CardContent>
      </Card>

      {/* Bảng người dùng */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách người dùng ({totalUsers})</CardTitle>
          <CardDescription>Quản lý thông tin và quyền của người dùng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Xác thực</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Lần đăng nhập cuối</TableHead>
                  <TableHead>Số dư</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{user.username}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[user.status]}>
                        {statusLabels[user.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          user.isVerified
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {user.isVerified ? "Đã xác thực" : "Chưa xác thực"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role === "admin" ? "Admin" : "User"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.lastLogin)}</TableCell>
                    <TableCell>{user.Wallet?.balance ?? 0}</TableCell>
                    <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                        {/* Cấp quyền admin */}
                        {user.role === "user" && (
                        <Button
                            variant="outline"
                            size="icon"
                            title="Cấp quyền admin"
                            onClick={() => handlePromote(user.userId)}
                        >
                            <Shield className="h-4 w-4 text-blue-600" />
                        </Button>
                        )}

                        {/* Khóa / Mở khóa tài khoản */}
                        {user.status === "active" ? (
                        <Button
                            variant="destructive"
                            size="icon"
                            title="Khóa tài khoản"
                            onClick={() => handleToggleStatus(user.userId, user.status)}
                        >
                            <Lock className="h-4 w-4" />
                        </Button>
                        ) : (
                        <Button
                            variant="outline"
                            size="icon"
                            title="Mở khóa tài khoản"
                            onClick={() => handleToggleStatus(user.userId, user.status)}
                        >
                            <Unlock className="h-4 w-4 text-green-600" />
                        </Button>
                        )}
                    </div>
                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Phân trang */}
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
                    return <span key={`ellipsis-${page}`}>...</span>;
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
