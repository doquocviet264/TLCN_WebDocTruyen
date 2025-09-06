import React, { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "react-toastify";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useParams() || ""; 
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Mật khẩu không khớp!");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: formData.password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.msg || "Đặt lại mật khẩu thất bại");
      } else {
        toast.success(data.msg || "Đặt lại mật khẩu thành công");
        navigate("/auth/login");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi máy chủ");
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
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
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
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Mật khẩu phải có ít nhất 6 ký tự.
              </div>
            </CardContent>

            <CardFooter>
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
