import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "react-toastify";
import axios from "axios";

type ForgotSuccess = {
  success: true;
  data: string;
  meta: any;
};

type ForgotError = {
  success: false;
  error: { message: string; code: string; status: number };
};

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await axios.post<ForgotSuccess | ForgotError>(
        `${import.meta.env.VITE_API_URL}/auth/forgot-password`,
        { email },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.data.success) {
        toast.success(`Tự động quay lại trang đăng nhập sau 5 giây...`);

        //Tự động chuyển hướng sau 5 giây
        setTimeout(() => {
          navigate("/auth/login", { replace: true });
        }, 5000);
      } else {
        const err = res.data as ForgotError;
        toast.error(err.error?.message || "Gửi liên kết thất bại");
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
          <h1 className="text-3xl font-montserrat font-bold mb-2">Quên mật khẩu</h1>
          <p className="text-muted-foreground">Nhập email để nhận liên kết đặt lại mật khẩu</p>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Nhập email của bạn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Chúng tôi sẽ gửi liên kết đặt lại mật khẩu đến email này.
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                {isLoading ? "Đang gửi..." : "Gửi liên kết"}
              </Button>

              <Link
                to="/auth/login"
                className="flex items-center justify-center space-x-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Quay lại đăng nhập</span>
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
}
