import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-toastify';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface TargetGroup {
  groupId: number;
  name: string;
}

interface Application {
  applicationId: number;
  type: 'BECOME_TRANSLATOR' | 'JOIN_GROUP';
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  createdAt: string;
  targetGroup?: TargetGroup | null;
}

interface MyApplicationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MyApplicationsDialog: React.FC<MyApplicationsDialogProps> = ({ open, onOpenChange }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      const fetchApplications = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get<{ data: Application[] }>(
            `${import.meta.env.VITE_API_URL}/applications/mine`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setApplications(response.data.data);
        } catch (error) {
          toast.error('Không thể tải danh sách đơn đã gửi.');
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      fetchApplications();
    }
  }, [open]);

  const getStatusBadge = (status: string) => {
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
  
  const getApplicationTitle = (app: Application) => {
    if (app.type === 'BECOME_TRANSLATOR') {
      return 'Đơn đăng ký làm dịch giả';
    }
    if (app.type === 'JOIN_GROUP' && app.targetGroup) {
      return `Đơn xin gia nhập nhóm "${app.targetGroup.name}"`;
    }
    return 'Đơn xin gia nhập nhóm';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Đơn đã gửi</DialogTitle>
          <DialogDescription>
            Tất cả các đơn bạn đã gửi sẽ được hiển thị ở đây.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-72 w-full rounded-md border">
          <div className="p-4">
            {loading ? (
              <p>Đang tải...</p>
            ) : applications.length > 0 ? (
              applications.map((app, index) => (
                <React.Fragment key={app.applicationId}>
                  <div className="text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-semibold">{getApplicationTitle(app)}</h4>
                      {getStatusBadge(app.status)}
                    </div>
                    <p className="text-muted-foreground text-xs mb-2">
                      Ngày gửi: {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                    {app.reason && (
                      <p className="text-muted-foreground bg-muted p-2 rounded-md">
                        {app.reason}
                      </p>
                    )}
                  </div>
                  {index < applications.length - 1 && <Separator className="my-4" />}
                </React.Fragment>
              ))
            ) : (
              <p>Bạn chưa gửi đơn nào.</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
