import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "react-toastify";

export default function VerifyOTPPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || ""; // Lấy email từ state
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast.error("Vui lòng nhập đầy đủ mã OTP");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.msg || "OTP không hợp lệ");
      } else {
        toast.success(data.msg || "Xác thực tài khoản thành công");
        navigate("/auth/login");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi máy chủ");
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.msg || "Gửi OTP thất bại");
      } else {
        toast.success(data.msg || "OTP mới đã được gửi đến email của bạn");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi máy chủ");
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
                    ref={(el) => { inputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]"
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
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResendOTP}
                  className="text-primary hover:underline"
                >
                  Gửi lại mã OTP
                </Button>
              </div>
            </CardContent>

            <CardFooter>
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
