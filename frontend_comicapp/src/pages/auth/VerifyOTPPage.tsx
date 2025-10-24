import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "react-toastify";
import axios from "axios";

type ApiOk = { success: true; data: string; meta?: unknown };
type ApiErr = { success: false; error: { message: string; code: string; status: number } };

export default function VerifyOTPPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    // chỉ nhận 1 ký tự số
    const v = value.replace(/\D/g, "").slice(0, 1);
    const next = [...otp];
    next[index] = v;
    setOtp(next);
    if (v && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (!email) {
      toast.error("Thiếu email để xác thực OTP");
      return;
    }
    if (otpCode.length !== 6) {
      toast.error("Vui lòng nhập đầy đủ mã OTP");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post<ApiOk | ApiErr>(
        `${import.meta.env.VITE_API_URL}/auth/verify-otp`,
        { email, otp: otpCode },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.data.success) {
        const msg = (res.data as ApiOk).data || "Xác thực tài khoản thành công";
        toast.success(msg);
        navigate("/auth/login", { replace: true });
      } else {
        const err = res.data as ApiErr;
        toast.error(err.error?.message || "OTP không hợp lệ");
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        "Lỗi máy chủ";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email) {
      toast.error("Không có email để gửi OTP");
      return;
    }
    try {
      const res = await axios.post<ApiOk | ApiErr>(
        `${import.meta.env.VITE_API_URL}/auth/resend-otp`,
        { email },
        { headers: { "Content-Type": "application/json" } }
      );
      if (res.data.success) {
        const msg = (res.data as ApiOk).data || "OTP mới đã được gửi đến email của bạn";
        toast.success(msg);
      } else {
        const err = res.data as ApiErr;
        toast.error(err.error?.message || "Gửi OTP thất bại");
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        "Lỗi máy chủ";
      toast.error(msg);
    }
  };

  return (
    <main className="flex-1 flex justify-center px-4 pt-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-montserrat font-bold mb-2">Xác nhận OTP</h1>
          <p className="text-muted-foreground">
            Chúng tôi đã gửi mã xác nhận đến email của bạn {email && `(${email})`}
          </p>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 pt-6">
              <div className="flex justify-center space-x-2">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg font-semibold bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                ))}
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Không nhận được mã?</p>
                <Button type="button" variant="ghost" onClick={handleResendOTP} className="text-primary hover:underline">
                  Gửi lại mã OTP
                </Button>
              </div>
            </CardContent>

            <CardFooter className="mt-4 pt-4 border-t border-border/50">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                {isLoading ? "Đang xác nhận..." : "Xác nhận"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
}
