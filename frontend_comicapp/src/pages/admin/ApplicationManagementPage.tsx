import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Applicant {
  userId: number;
  username: string;
  avatar: string;
}

interface Application {
  applicationId: number;
  userId: number;
  type: 'BECOME_TRANSLATOR';
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  createdAt: string;
  applicant: Applicant;
}

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiResponse {
  data: {
    rows: Application[];
    count: number;
    meta: Meta;
  };
}

const statusLabels: Record<string, string> = {
  pending: 'Đang chờ',
  approved: 'Đã chấp thuận',
  rejected: 'Đã từ chối',
};

const ApplicationManagementPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalApplications, setTotalApplications] = useState(0);

  const fetchApplications = useCallback(async (page = 1, status = "pending") => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<ApiResponse>(
        `${import.meta.env.VITE_API_URL}/applications/admin/translators`,
        {
          params: { page, status, limit: 10 },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setApplications(response.data.data.rows);
      setTotalPages(response.data.data.meta.totalPages);
      setCurrentPage(response.data.data.meta.page);
      setTotalApplications(response.data.data.meta.total);
    } catch (error) {
      toast.error('Không thể tải danh sách đơn.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications(currentPage, statusFilter);
  }, [currentPage, statusFilter, fetchApplications]);
  
  const handleReview = async (applicationId: number, status: 'approved' | 'rejected') => {
    const toastId = toast.loading(`Đang xử lý đơn...`);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/applications/admin/translators/${applicationId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.update(toastId, { render: 'Thao tác thành công!', type: 'success', isLoading: false, autoClose: 3000 });
      fetchApplications(currentPage, statusFilter);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Có lỗi xảy ra.';
      toast.update(toastId, { render: errorMessage, type: 'error', isLoading: false, autoClose: 5000 });
    }
  };

  const getStatusBadge = (status: 'pending' | 'approved' | 'rejected') => {
    switch (status) {
      case 'approved':
        return <Badge variant="default">Đã chấp thuận</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Đã từ chối</Badge>;
      case 'pending':
      default:
        return <Badge variant="secondary">Đang chờ</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Đơn xin làm Dịch giả</h1>
          <p className="text-muted-foreground">Duyệt và quản lý các đơn xin cấp quyền dịch giả.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Đang chờ</SelectItem>
              <SelectItem value="approved">Đã chấp thuận</SelectItem>
              <SelectItem value="rejected">Đã từ chối</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách đơn ({totalApplications})</CardTitle>
          <CardDescription>Các đơn xin trở thành dịch giả từ người dùng.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Lý do</TableHead>
                  <TableHead>Ngày gửi</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Đang tải...</TableCell>
                  </TableRow>
                ) : applications.length > 0 ? (
                  applications.map((app) => (
                    <TableRow key={app.applicationId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={app.applicant.avatar} alt={app.applicant.username} />
                            <AvatarFallback>{app.applicant.username.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{app.applicant.username}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md truncate" title={app.reason}>{app.reason}</TableCell>
                      <TableCell>{new Date(app.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell className="text-right">
                        {app.status === 'pending' && (
                          <div className="space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleReview(app.applicationId, 'approved')}>Chấp thuận</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleReview(app.applicationId, 'rejected')}>Từ chối</Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Không có đơn nào phù hợp.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>{"<"}</Button>
              {[...Array(totalPages)].map((_, i) => (
                <Button key={i} variant={currentPage === i + 1 ? 'default' : 'outline'} onClick={() => setCurrentPage(i + 1)}>{i + 1}</Button>
              ))}
              <Button variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>{">"}</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplicationManagementPage;
