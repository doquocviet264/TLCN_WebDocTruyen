import { useState, useEffect, useCallback, useContext } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"; 
import axios from "axios";
import { AuthContext } from "@/context/AuthContext"; 

const ratings = [
  { value: 1, label: "Tệ", icon: "😡" },
  { value: 2, label: "Hơi tệ", icon: "😥" },
  { value: 3, label: "Bình thường", icon: "😐" },
  { value: 4, label: "Hay", icon: "😊" },
  { value: 5, label: "Tuyệt vời", icon: "🤩" },
];

interface UserRating {
  rating: number | null;
}

interface RatingWidgetProps {
  comicId: number;
  onRatingUpdate?: (rating: number) => void;
}
type ApiOk<T> = { success: true; data: T; meta?: unknown };

export default function RatingWidget({ comicId, onRatingUpdate }: RatingWidgetProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const { isLoggedIn } = useContext(AuthContext);

  // Hàm lấy đánh giá từ server
  const fetchUserRating = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get<ApiOk<UserRating>>(
        `${import.meta.env.VITE_API_URL}/ratings/${comicId}/user`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSelectedRating(response.data.data.rating);
    } catch (error) {
      console.error("Lỗi khi lấy đánh giá:", error);
    }
  }, [comicId]);

  // Gọi fetchUserRating khi component mount hoặc isLoggedIn thay đổi
  useEffect(() => {
    if (isLoggedIn) fetchUserRating();
  }, [isLoggedIn, fetchUserRating]);

  // Chọn rating
  const handleRatingSelect = useCallback(
    (value: number) => {
      if (!isLoggedIn) {
        toast.error("Vui lòng đăng nhập để gửi đánh giá!");
        return;
      }
      setSelectedRating(value);
      setIsConfirmOpen(true);
    },
    [isLoggedIn]
  );

  // Xác nhận gửi rating
  const handleConfirm = useCallback(async () => {
    if (selectedRating === null) return;

    setIsSubmitting(true);
    setIsConfirmOpen(false);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Vui lòng đăng nhập để gửi đánh giá!");
        setIsSubmitting(false);
        return;
      }

      await axios.post(
        `${import.meta.env.VITE_API_URL}/ratings`,
        { comicId, rating: selectedRating },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Cảm ơn bạn đã đánh giá");
      onRatingUpdate?.(selectedRating);
      fetchUserRating();
    } catch (error) {
      toast.error("Không thể gửi đánh giá. Vui lòng thử lại sau!");
      setSelectedRating(null);
    } finally {
      setIsSubmitting(false);
    }
  }, [comicId, selectedRating, onRatingUpdate, fetchUserRating]);

  // Hủy dialog
  const handleCancel = useCallback(() => {
    setIsConfirmOpen(false);
    fetchUserRating(); // load lại đánh giá từ server
  }, [fetchUserRating]);

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 text-center relative overflow-hidden">
      <div className="relative z-10">
        <p className="text-xl font-montserrat font-bold mb-4">
          Cho chúng mình biết cảm nhận của bạn về truyện này nhé!
        </p>
        <div className="flex justify-center gap-3 md:gap-4 flex-wrap">
          {ratings.map((rating) => (
            <div
              key={rating.value}
              className="flex flex-col items-center group cursor-pointer"
              onClick={() => !isSubmitting && handleRatingSelect(rating.value)}
            >
              <Button
                variant="ghost"
                className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-4xl md:text-5xl 
                            transition-all duration-200 border-2 
                            ${
                              selectedRating === rating.value
                                ? "border-primary scale-110 shadow-lg"
                                : selectedRating
                                ? "opacity-50"
                                : "border-transparent group-hover:border-muted-foreground/30 group-hover:scale-105"
                            } 
                            ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
                disabled={isSubmitting}
                aria-label={`Chọn đánh giá ${rating.label} (${rating.value} sao)`}
                aria-checked={selectedRating === rating.value}
                role="radio"
              >
                {rating.icon}
              </Button>
              <span
                className={`mt-2 text-sm font-medium transition-colors duration-200 
                          ${
                            selectedRating === rating.value
                              ? "text-primary"
                              : selectedRating
                              ? "opacity-50"
                              : "text-muted-foreground group-hover:text-foreground"
                          }`}
              >
                {rating.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận đánh giá</DialogTitle>
          </DialogHeader>
          <p>
            Bạn muốn đánh giá truyện này{" "}
            <strong>
              {ratings.find((r) => r.value === selectedRating)?.label} (
              {selectedRating} sao)
            </strong>
            ?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button onClick={handleConfirm} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                "Xác nhận"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

