import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
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
interface ChangeAvatarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (user: UserProfile) => void;
}

type ApiOk<T> = { success: true; data: T; meta?: unknown };
type ApiErr = { success: false; error: { message: string; code: string; status: number } };

export function ChangeAvatarDialog({ open, onOpenChange, onUpdate }: ChangeAvatarDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    if (selectedFile.size > 2 * 1024 * 1024) {
      toast.error("Kích thước ảnh không được vượt quá 2MB");
      return;
    }
    if (!selectedFile.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh hợp lệ");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", selectedFile);

      const token = localStorage.getItem("token");
      const url = `${import.meta.env.VITE_API_URL}/user/avatar`;

      const res = await axios.post<ApiOk<{ message: string; user: any }> | ApiErr>(url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          // KHÔNG set Content-Type; axios tự thêm boundary cho multipart/form-data
        },
      });

      if (res.data.success) {
        const { user: apiUser, message } = (res.data as ApiOk<{ message: string; user: any }>).data;

        const mapped: UserProfile = {
          name: apiUser.username,
          email: apiUser.email,
          gender: apiUser.gender,
          birthday: apiUser.birthday,
          avatar: apiUser.avatar,
          joinDate: apiUser.joinDate,
          totalRead: apiUser.totalRead ?? 0,
          favorites: apiUser.favorites ?? 0,
          comments: apiUser.comments ?? 0,
          levelName: "Độc giả VIP",
          experience: { current: 750, max: 1000 },
          goldCoins: apiUser.goldCoins ?? 0,
        };

        onUpdate(mapped);
        onOpenChange(false);
        toast.success(message || "Avatar đã được cập nhật");
      } else {
        const err = res.data as ApiErr;
        toast.error(err.error?.message || "Upload thất bại");
      }
    } catch (error: any) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        localStorage.removeItem("token");
        navigate(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      } else {
        const msg =
          error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          "Không thể tải lên avatar";
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
          <DialogTitle>Thay đổi avatar</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col items-center">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-32 h-32 rounded-full object-cover mb-4"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mb-4">
                <span className="text-muted-foreground">Chưa có ảnh</span>
              </div>
            )}

            <Label htmlFor="avatar-upload" className="cursor-pointer">
              <Button asChild variant="outline">
                <span>Chọn ảnh</span>
              </Button>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || isLoading}>
              {isLoading ? "Đang tải lên..." : "Cập nhật"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
