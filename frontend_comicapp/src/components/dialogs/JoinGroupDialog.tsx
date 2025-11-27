import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AuthContext } from '@/context/AuthContext';
import { toast } from 'react-toastify';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface JoinGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  onSuccess?: () => void;
}

const JoinGroupDialog: React.FC<JoinGroupDialogProps> = ({ open, onOpenChange, groupId, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token || !authContext.isLoggedIn) {
      toast.error('Bạn cần đăng nhập để thực hiện chức năng này.');
      return;
    }

    if (!groupId) {
      toast.error('Không tìm thấy ID của nhóm.');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Đang gửi đơn xin gia nhập...');

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/applications/join-group`,
        { reason, groupId: parseInt(groupId, 10) },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.update(toastId, { render: "Đơn xin gia nhập đã được gửi thành công!", type: "success", isLoading: false, autoClose: 5000 });
      onOpenChange(false); // Close dialog on success
      setReason(''); // Clear form
      navigate(`/groups/${groupId}`);
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.error?.message || 'Có lỗi xảy ra, vui lòng thử lại.';
      toast.update(toastId, { render: errorMessage, type: "error", isLoading: false, autoClose: 5000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Xin gia nhập Nhóm dịch</DialogTitle>
          <DialogDescription>
            Gửi lời nhắn đến trưởng nhóm và chờ được xét duyệt. Chỉ các dịch giả mới có thể xin gia nhập nhóm.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="reason">Lời nhắn</Label>
            <Textarea
              id="reason"
              placeholder="Gửi lời chào hoặc lý do bạn muốn tham gia nhóm..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={1000}
              className="min-h-[120px]"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JoinGroupDialog;
