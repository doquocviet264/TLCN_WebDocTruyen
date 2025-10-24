import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ApiOk<T> = { success: true; data: T; meta?: unknown };
type ApiErr = { success: false; error: { message: string; code: string; status: number } };

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Toggle hiển thị mật khẩu
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client validations
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Mật khẩu mới không khớp");
      return;
    }
    if (formData.newPassword.length < 8) {
      toast.error("Mật khẩu mới phải có ít nhất 8 ký tự");
      return;
    }
    if (formData.newPassword === formData.currentPassword) {
      toast.error("Mật khẩu mới không được trùng mật khẩu hiện tại");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const url = `${import.meta.env.VITE_API_URL}/user/password`;

      const res = await axios.put<ApiOk<{ message: string }> | ApiErr>(
        url,
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        const msg = (res.data as ApiOk<{ message: string }>).data?.message || "Mật khẩu đã được thay đổi";
        toast.success(`${msg}. Bạn sẽ phải đăng nhập lại.`);

        // Reset form + đóng dialog
        setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        onOpenChange(false);

        // Xóa token & chuyển hướng về login kèm redirect hiện tại
        localStorage.removeItem("token");
        const redirect = encodeURIComponent(window.location.pathname);
        navigate(`/auth/login?redirect=${redirect}`);
      } else {
        const err = res.data as ApiErr;
        toast.error(err.error?.message || "Đổi mật khẩu thất bại.");
      }
    } catch (error: any) {
      // Bắt lỗi giống FollowPage
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        localStorage.removeItem("token");
        const redirect = encodeURIComponent(window.location.pathname);
        navigate(`/auth/login?redirect=${redirect}`);
      } else {
        const msg =
          error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          "Đổi mật khẩu thất bại.";
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đổi mật khẩu</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrent ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) =>
                  setFormData((s) => ({ ...s, currentPassword: e.target.value }))
                }
                required
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                aria-label={showCurrent ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                onClick={() => setShowCurrent((v) => !v)}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">Mật khẩu mới</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNew ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData((s) => ({ ...s, newPassword: e.target.value }))
                }
                required
                minLength={8}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                aria-label={showNew ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                onClick={() => setShowNew((v) => !v)}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm new password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData((s) => ({ ...s, confirmPassword: e.target.value }))
                }
                required
                minLength={8}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                onClick={() => setShowConfirm((v) => !v)}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Đang xử lý..." : "Đổi mật khẩu"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
