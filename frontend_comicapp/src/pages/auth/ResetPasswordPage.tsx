import React, { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "react-toastify";
import axios from "axios";

type ApiOk = { success: true; data: string; meta?: unknown };
type ApiErr = { success: false; error: { message: string; code: string; status: number } };

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  // Ưu tiên: /auth/reset-password/:token → ?token=... → state.token
  const tokenFromParam = params.token;
  const tokenFromQuery = new URLSearchParams(location.search).get("token") || undefined;
  const tokenFromState = (location.state as any)?.token as string | undefined;
  const token = tokenFromParam || tokenFromQuery || tokenFromState || "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Thiếu hoặc token không hợp lệ. Vui lòng mở lại liên kết đặt mật khẩu từ email.");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Mật khẩu không khớp!");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post<ApiOk | ApiErr>(
        `${import.meta.env.VITE_API_URL}/auth/reset-password`,
        { token, newPassword: formData.password },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.data.success) {
        const msg = (res.data as ApiOk).data || "Đặt lại mật khẩu thành công";
        toast.success(msg);
        navigate("/auth/login", { replace: true });
      } else {
        const err = res.data as ApiErr;
        toast.error(err.error?.message || "Đặt lại mật khẩu thất bại");
      }
    } catch (error: any) {
      const serverMsg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        "Lỗi máy chủ";
      toast.error(serverMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 flex justify-center px-4 pt-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-montserrat font-bold mb-2">Đặt lại mật khẩu</h1>
          <p className="text-muted-foreground">Nhập mật khẩu mới cho tài khoản của bạn</p>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-6">
              {/* Mật khẩu mới */}
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu mới</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu mới"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10"
                    required
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>

              {/* Nhập lại mật khẩu */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Nhập lại mật khẩu mới</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu mới"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10 pr-10"
                    required
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">Mật khẩu phải có ít nhất 6 ký tự.</div>
            </CardContent>

            <CardFooter className="mt-4 pt-4 border-t border-border/50">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                {isLoading ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
}
