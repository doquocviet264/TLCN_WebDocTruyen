import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'react-toastify';

interface Applicant {
  userId: number;
  username: string;
  avatar: string;
}

interface JoinRequest {
  applicationId: number;
  userId: number;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  createdAt: string;
  applicant: Applicant;
}

interface ApiResponse {
  data: {
    rows: JoinRequest[];
    count: number;
  };
}

interface JoinRequestsProps {
  groupId: string;
}

export const JoinRequests: React.FC<JoinRequestsProps> = ({ groupId }) => {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<ApiResponse>(
        `${import.meta.env.VITE_API_URL}/applications/groups/${groupId}/applications?status=pending`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests(response.data.data.rows);
    } catch (error) {
      toast.error('Không thể tải danh sách đơn xin gia nhập.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleReview = async (applicationId: number, status: 'approved' | 'rejected') => {
    const toastId = toast.loading(`Đang ${status === 'approved' ? 'chấp thuận' : 'từ chối'} đơn...`);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/applications/groups/${groupId}/applications/${applicationId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.update(toastId, { render: 'Thao tác thành công!', type: 'success', isLoading: false, autoClose: 3000 });
      fetchRequests(); // Refresh list
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Có lỗi xảy ra.';
      toast.update(toastId, { render: errorMessage, type: 'error', isLoading: false, autoClose: 5000 });
    }
  };
  
  if (loading) return <p>Đang tải danh sách yêu cầu...</p>;
  if (requests.length === 0) return null; // Don't render anything if there are no pending requests

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Yêu cầu gia nhập đang chờ</CardTitle>
        <CardDescription>Duyệt các đơn xin tham gia nhóm của bạn.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.map((req) => (
          <div key={req.applicationId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-4">
              <Avatar>
                <AvatarImage src={req.applicant.avatar} alt={req.applicant.username} />
                <AvatarFallback>{req.applicant.username.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{req.applicant.username}</p>
                <p className="text-sm text-muted-foreground mt-1 italic">"{req.reason || 'Không có lời nhắn.'}"</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleReview(req.applicationId, 'approved')}>Chấp thuận</Button>
              <Button size="sm" variant="destructive" onClick={() => handleReview(req.applicationId, 'rejected')}>Từ chối</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
