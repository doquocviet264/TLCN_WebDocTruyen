import { useState, useEffect, useCallback, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Star, Frown, Meh, Smile, Heart, ThumbsDown, Zap } from "lucide-react";
import { toast } from "react-toastify";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import axios from "axios";
import { AuthContext } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

// --- CẤU HÌNH RATING (Updated Label & Colors) ---
const ratings = [
  { 
    value: 1, 
    label: "Tệ", 
    icon: ThumbsDown, 
    // Màu đỏ đậm hơn, glow đỏ
    color: "text-red-500", 
    activeColor: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10", 
    border: "border-red-500/50",
    ring: "ring-red-500/30",
    shadow: "shadow-[0_0_20px_rgba(239,68,68,0.3)]", 
    hover: "hover:bg-red-500/20 hover:border-red-500"
  },
  { 
    value: 2, 
    label: "Không hay", // Đổi từ "Hơi tệ" -> "Không hay"
    icon: Frown, 
    color: "text-orange-500", 
    activeColor: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/10", 
    border: "border-orange-500/50",
    ring: "ring-orange-500/30",
    shadow: "shadow-[0_0_20px_rgba(249,115,22,0.3)]",
    hover: "hover:bg-orange-500/20 hover:border-orange-500"
  },
  { 
    value: 3, 
    label: "Bình thường", 
    icon: Meh, 
    color: "text-yellow-500", 
    activeColor: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-500/10", 
    border: "border-yellow-500/50",
    ring: "ring-yellow-500/30",
    shadow: "shadow-[0_0_20px_rgba(234,179,8,0.3)]",
    hover: "hover:bg-yellow-500/20 hover:border-yellow-500"
  },
  { 
    value: 4, 
    label: "Khá hay", // Đổi từ "Hay" -> "Khá hay"
    icon: Smile, 
    color: "text-blue-500", 
    activeColor: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10", 
    border: "border-blue-500/50",
    ring: "ring-blue-500/30",
    shadow: "shadow-[0_0_20px_rgba(59,130,246,0.3)]",
    hover: "hover:bg-blue-500/20 hover:border-blue-500"
  },
  { 
    value: 5, 
    label: "Rất tuyệt", // Đổi từ "Tuyệt vời" -> "Rất tuyệt"
    icon: Heart, 
    color: "text-pink-500", 
    activeColor: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-500/10", 
    border: "border-pink-500/50",
    ring: "ring-pink-500/30",
    shadow: "shadow-[0_0_30px_rgba(236,72,153,0.5)]", // Glow mạnh hơn cho 5 sao
    hover: "hover:bg-pink-500/20 hover:border-pink-500"
  },
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
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Animation state khi click
  const [animatingId, setAnimatingId] = useState<number | null>(null);

  const { isLoggedIn } = useContext(AuthContext);

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

  useEffect(() => {
    if (isLoggedIn) fetchUserRating();
  }, [isLoggedIn, fetchUserRating]);

  const handleRatingSelect = useCallback((value: number) => {
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để gửi đánh giá!");
      return;
    }
    
    // Trigger animation bounce
    setAnimatingId(value);
    setTimeout(() => setAnimatingId(null), 300); // Reset animation sau 300ms

    setSelectedRating(value); 
    setIsConfirmOpen(true);
  }, [isLoggedIn]);

  const handleConfirm = useCallback(async () => {
    if (selectedRating === null) return;
    setIsSubmitting(true);
    setIsConfirmOpen(false); 

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token");

      await axios.post(
        `${import.meta.env.VITE_API_URL}/ratings`,
        { comicId, rating: selectedRating },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Cảm ơn đánh giá của bạn!");
      onRatingUpdate?.(selectedRating);
      fetchUserRating();
    } catch (error) {
      toast.error("Lỗi gửi đánh giá, vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }, [comicId, selectedRating, onRatingUpdate, fetchUserRating]);

  const handleCancel = useCallback(() => {
    setIsConfirmOpen(false);
    fetchUserRating(); 
  }, [fetchUserRating]);

  return (
    <div className="w-full bg-card border border-border rounded-[24px] shadow-sm p-6 md:p-8 overflow-hidden relative group/container">
        {/* Background Decor */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-2/3 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
               <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500 animate-pulse" />
               Đánh giá bộ truyện này
            </h3>
            <p className="text-muted-foreground text-sm mb-8 max-w-md mx-auto leading-relaxed">
               Cảm nghĩ của bạn là động lực rất lớn. Hãy chọn mức đánh giá phù hợp nhất nhé!
            </p>

            {/* Rating Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4 w-full max-w-2xl mx-auto px-2">
               {ratings.map((item) => {
                 const isSelected = selectedRating === item.value;
                 const isHovered = hoveredRating === item.value;
                 const isAnimating = animatingId === item.value;
                 
                 // Logic làm mờ các item khác
                 const isDimmed = (selectedRating !== null && !isSelected && hoveredRating === null) || (hoveredRating !== null && !isHovered);

                 return (
                   <button
                     key={item.value}
                     onClick={() => !isSubmitting && handleRatingSelect(item.value)}
                     onMouseEnter={() => setHoveredRating(item.value)}
                     onMouseLeave={() => setHoveredRating(null)}
                     disabled={isSubmitting}
                     className={cn(
                       // Base styles
                       "relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 group cursor-pointer select-none",
                       "h-[100px] sm:h-[120px]", 
                       
                       // 3️⃣ HIGHLIGHT ACTIVE CHOICE: Border Gradient giả lập + Glow + Ring
                       isSelected 
                         ? cn(
                             item.bg, 
                             item.border, 
                             item.shadow, 
                             item.ring,
                             "z-10 ring-2 ring-offset-2 ring-offset-card scale-105"
                           ) 
                         : cn("bg-secondary/30 border-transparent", item.hover),

                       // Dim others
                       isDimmed && "opacity-40 scale-95 grayscale-[0.6] blur-[0.5px]",
                       
                       // 4️⃣ MICRO ANIMATION: Click bounce
                       "active:scale-95",
                       isAnimating && "animate-[bounce_0.4s_ease-in-out]" 
                     )}
                   >
                      <item.icon 
                        className={cn(
                          "w-8 h-8 sm:w-10 sm:h-10 mb-2 transition-all duration-300",
                          
                          // 1️⃣ ICON CONTRAST: Tăng scale và đổi màu đậm khi active/hover
                          isSelected || isHovered 
                            ? cn(item.activeColor, "scale-110 drop-shadow-md") 
                            : "text-muted-foreground/70",
                          
                          isSelected && item.value === 5 && "animate-pulse"
                        )} 
                        strokeWidth={isSelected || isHovered ? 2.5 : 1.5}
                      />
                      
                      {/* 2️⃣ LABEL STRONG: Font đậm hơn khi active */}
                      <span className={cn(
                        "text-xs sm:text-sm transition-colors",
                        isSelected || isHovered 
                           ? "font-bold text-foreground" 
                           : "font-medium text-muted-foreground"
                      )}>
                        {item.label}
                      </span>
                      
                      {/* Hiệu ứng hạt lấp lánh nhẹ khi active (optional) */}
                      {isSelected && (
                        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                           <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-white/20 to-transparent rounded-bl-3xl" />
                        </div>
                      )}
                   </button>
                 )
               })}
            </div>
        </div>

        {/* Dialog Xác Nhận */}
        <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
           <DialogContent className="sm:max-w-md rounded-3xl border-border bg-card shadow-2xl">
              <DialogHeader>
                 <DialogTitle className="text-center text-xl font-bold">Xác nhận đánh giá</DialogTitle>
                 <DialogDescription className="text-center text-base mt-2">
                    Bạn chọn mức 
                    <span className={cn("font-black mx-1.5 text-lg", ratings.find(r => r.value === selectedRating)?.activeColor)}>
                       {ratings.find(r => r.value === selectedRating)?.label}
                    </span> 
                    cho truyện này?
                 </DialogDescription>
              </DialogHeader>
              
              <div className="flex justify-center py-6">
                 {(() => {
                    const r = ratings.find(x => x.value === selectedRating);
                    if(!r) return null;
                    const Icon = r.icon;
                    return (
                       <div className={cn(
                           "p-8 rounded-full shadow-inner animate-[bounce_1s_infinite]", 
                           r.bg, r.color
                       )}>
                          <Icon className="w-16 h-16 drop-shadow-lg" strokeWidth={2.5} />
                       </div>
                    )
                 })()}
              </div>

              <DialogFooter className="sm:justify-center gap-3 pb-2">
                 <Button variant="ghost" onClick={handleCancel} className="rounded-xl h-12 px-6 hover:bg-muted text-muted-foreground">
                    Chọn lại
                 </Button>
                 <Button onClick={handleConfirm} disabled={isSubmitting} className="rounded-xl h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/30">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
                    Gửi ngay
                 </Button>
              </DialogFooter>
           </DialogContent>
        </Dialog>
    </div>
  );
}