import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface UserProfile {
  name: string
  email: string
  gender: string
  birthday: string
  avatar: string
  joinDate: string
  levelName: string
  experience: {
    current: number
    max: number
  }
  totalRead: number
  favorites: number
  comments: number
  goldCoins: number
}
interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile;
  onUpdate: (user: UserProfile) => void;
}

type ApiOk<T> = { success: true; data: T; meta?: unknown };
type ApiErr = { success: false; error: { message: string; code: string; status: number } };

export function EditProfileDialog({ open, onOpenChange, user, onUpdate }: EditProfileDialogProps) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user.name,
    gender: user.gender || "",
    birthday: user.birthday ? new Date(user.birthday).toISOString().split("T")[0] : ""
  });
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Sync lại form khi mở dialog hoặc props user thay đổi
  useEffect(() => {
    if (open) {
      setFormData({
        name: user.name,
        gender: user.gender || "",
        birthday: user.birthday ? new Date(user.birthday).toISOString().split("T")[0] : ""
      });
    }
  }, [open, user]);

  const handleLoginRedirect = () => {
    navigate(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const url = `${import.meta.env.VITE_API_URL}/user/profile`;

      // gọi axios với kiểu union ApiOk | ApiErr để xử lý như FollowPage
      const res = await axios.put<ApiOk<{ user: any }> | ApiErr>(
        url,
        {
          username: formData.name,  // ✅ backend cần 'username'
          gender: formData.gender,
          birthday: formData.birthday
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.data.success) {
        // ✅ Map API → UserProfile
        const apiUser = (res.data as ApiOk<{ user: any }>).data.user;
        const mapped: UserProfile = {
          name: apiUser.username,
          email: apiUser.email,
          gender: apiUser.gender,
          birthday: apiUser.birthday,
          avatar: apiUser.avatar,
          joinDate: apiUser.joinDate,
          totalRead: apiUser.totalRead ?? user.totalRead ?? 0,
          favorites: apiUser.favorites ?? user.favorites ?? 0,
          comments: apiUser.comments ?? user.comments ?? 0,
          levelName: user.levelName ?? "Độc giả VIP",
          experience: user.experience ?? { current: 750, max: 1000 },
          goldCoins: apiUser.goldCoins ?? user.goldCoins ?? 0
        };

        onUpdate(mapped);      // ✅ bubble lên parent → InfoTab re-render
        onOpenChange(false);
        toast.success("Cập nhật thông tin cá nhân thành công 🎉");
      } else {
        const err = res.data as ApiErr;
        toast.error(err.error?.message || "Cập nhật thất bại");
      }
    } catch (error: any) {
      // ✅ Bắt lỗi giống FollowPage
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        localStorage.removeItem("token");
        handleLoginRedirect();
      } else {
        const msg =
          error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          "Không thể cập nhật thông tin";
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
          <DialogTitle>Chỉnh sửa thông tin cá nhân</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên người dùng</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((s) => ({ ...s, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Giới tính</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => setFormData((s) => ({ ...s, gender: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn giới tính" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Nam</SelectItem>
                <SelectItem value="female">Nữ</SelectItem>
                <SelectItem value="other">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthday">Sinh nhật</Label>
            <Input
              id="birthday"
              type="date"
              value={formData.birthday}
              onChange={(e) => setFormData((s) => ({ ...s, birthday: e.target.value }))}
            />
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
              {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
