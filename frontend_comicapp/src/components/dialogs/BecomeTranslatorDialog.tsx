import React, { useState, useContext } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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

interface BecomeTranslatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const BecomeTranslatorDialog: React.FC<BecomeTranslatorDialogProps> = ({ open, onOpenChange, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const authContext = useContext(AuthContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token || !authContext.isLoggedIn) {
      toast.error('Bạn cần đăng nhập để thực hiện chức năng này.');
      return;
    }

    if (reason.length < 10 || reason.length > 1000) {
      toast.error('Lý do phải có độ dài từ 10 đến 1000 ký tự.');
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/applications/become-translator`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Đơn đăng ký của bạn đã được gửi thành công!");
      onOpenChange(false); // Close dialog on success
      setReason(''); // Clear form
      onSuccess?.();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Có lỗi xảy ra, vui lòng thử lại.';
      toast.warning(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Đăng ký làm Dịch giả</DialogTitle>
          <DialogDescription>
            Gửi đơn đăng ký để trở thành một phần của đội ngũ dịch giả và đóng góp cho cộng đồng.
            Đơn của bạn sẽ được quản trị viên xem xét.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="reason">Lý do của bạn</Label>
            <Textarea
              id="reason"
              placeholder="Hãy cho chúng tôi biết tại sao bạn muốn trở thành dịch giả..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              minLength={10}
              maxLength={1000}
              className="min-h-[120px]"
            />
            <p className="text-sm text-muted-foreground">
              Mô tả kinh nghiệm, niềm đam mê của bạn, hoặc bất cứ điều gì bạn muốn chia sẻ.
            </p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi đơn đăng ký'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BecomeTranslatorDialog;
