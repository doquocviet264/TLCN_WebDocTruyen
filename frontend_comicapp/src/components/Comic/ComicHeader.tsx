import { 
  Heart, Star, User, Clock, BookOpen, Play, Users, 
  Sparkles, ChevronRight, Zap 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import axios from "axios";
import { cn } from "@/lib/utils";

// --- INTERFACES & LOGIC GIỮ NGUYÊN ---
interface ComicHeaderProps {
  comic: {
    id: number;
    slug: string;
    title: string;
    author: string;
    image: string;
    lastUpdate: string;
    status: string;
    genres: string[];
    rating: number;
    reviewCount: number;
    followers: number;
    likers: number;
    isFollowing: boolean;
    isFavorite: boolean;
    altName: string[];
    groupName?: string | null;
  };
  firstChapter: number;
  lastChapter: number;
  onFollowToggle: () => void;
  onFavoriteToggle: () => void;
}

interface ComicHistoryItem {
  id: number;
  title: string;
  slug: string;
  image: string;
  lastChapter: string;
  chapterTitle: string;
  lastReadAt: string;
}
type ApiOk<T> = { success: true; data: T; meta?: unknown };

interface ComicHistoryLS {
  lastReadChapterId: number;
  lastReadChapterNumber: number;
  lastReadAt: string;
  chapters: { [chapterId: number]: { chapterNumber: number; readAt: string } };
}

const DETAILED_HISTORY_KEY = "detailed_reading_history";

export default function ComicHeader({
  comic,
  firstChapter,
  lastChapter,
  onFollowToggle,
  onFavoriteToggle,
}: ComicHeaderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [continueChapter, setContinueChapter] = useState<number | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const formatNumber = (num: unknown) => {
    const parsed = typeof num === "number" ? num : Number(num);
    if (isNaN(parsed)) return "N/A";
    return Number.isInteger(parsed) ? parsed.toString() : parsed.toFixed(2).replace(/\.?0+$/, '');
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);

    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        if (token) {
          try {
            const res = await axios.get<ApiOk<ComicHistoryItem | null>>(
              `${import.meta.env.VITE_API_URL}/history/${comic.id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const item = res.data?.data;
            if (item) {
              setContinueChapter(Number(formatNumber(item.lastChapter)));
              return;
            }
          } catch (e) {
            console.warn("History fetch failed, fallback local.", e);
          }
        }
        const ls = localStorage.getItem(DETAILED_HISTORY_KEY);
        if (ls) {
          const obj: Record<string, ComicHistoryLS> = JSON.parse(ls);
          const entry = obj[String(comic.id)];
          if (entry && Number.isFinite(entry.lastReadChapterNumber)) {
            setContinueChapter(Number(entry.lastReadChapterNumber));
            return;
          }
        }
        setContinueChapter(null);
      } catch (err) {
        setContinueChapter(null);
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, [comic.id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
    }).format(date);
  };

  const displayRating = (comic.rating).toFixed(1);
  const fullStars = Math.floor(comic.rating);
  const hasRating = comic.rating > 0 && comic.reviewCount > 0;

  // --- UI START ---
  return (
    // ✨ THAY ĐỔI 1: Dùng bg-card thay vì bg-[#0f0f13]
    <div className="relative w-full overflow-hidden rounded-[24px] shadow-sm bg-card border border-border group/container">
      
      {/* 1. BACKGROUND LAYERS */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        {/* Ảnh nền: Giảm opacity ở Light mode để đỡ bị 'dơ' nền */}
        <img
          src={comic.image}
          alt="background"
          className="h-full w-full object-cover blur-[50px] opacity-30 dark:opacity-40 scale-125 saturate-150 transition-opacity"
        />
        
        {/* ✨ THAY ĐỔI 2: Gradient dùng 'from-background' để hòa tan vào nền trang web */}
        {/* Gradient dưới lên */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        {/* Gradient trái qua */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        
        {/* Texture noise nhẹ (giữ nguyên vì nó đẹp) */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
      </div>

      {/* 2. MAIN CONTENT */}
      <div className="relative z-10 p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-10">
          
          {/* --- CỘT TRÁI: POSTER --- */}
          <div className="flex-shrink-0 mx-auto md:mx-0">
            {/* Thêm ring-border để poster tách biệt rõ hơn ở Light mode */}
            <div className="relative group/poster w-[180px] sm:w-[220px] aspect-[2/3] rounded-xl overflow-hidden shadow-2xl ring-1 ring-border/50 bg-muted transition-transform duration-500 hover:scale-[1.02]">
              <img
                src={comic.image || "/placeholder.svg"}
                alt={comic.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 translate-x-[-200%] group-hover/poster:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
              
              <div className="absolute top-2 left-2">
                 <Badge 
                    className={cn(
                        "uppercase text-[10px] font-extrabold tracking-widest shadow-lg border-0 backdrop-blur-md",
                        comic.status === "Hoàn thành" 
                          ? "bg-green-500/90 text-white" 
                          : "bg-blue-600/90 text-white"
                    )}
                 >
                    {comic.status}
                 </Badge>
              </div>
            </div>
          </div>

          {/* --- CỘT PHẢI: INFO & HUD --- */}
          <div className="flex-1 flex flex-col justify-between space-y-6">
            
            {/* 📍 KHỐI 1: HEADER INFO */}
            <div className="space-y-3 text-center md:text-left">
              {/* ✨ THAY ĐỔI 3: text-white -> text-foreground (Tự động đen/trắng) */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight tracking-tight drop-shadow-sm">
                {comic.title}
              </h1>
              
              <div className="flex flex-col md:items-start gap-2">
                 {comic.altName && comic.altName.length > 0 && (
                  // text-white/50 -> text-muted-foreground
                  <p className="text-sm text-muted-foreground italic font-medium line-clamp-1">
                     {comic.altName.join(" • ")}
                  </p>
                 )}

                 <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
                    {comic.genres.map((genre) => (
                      <Badge 
                        key={genre} 
                        variant="secondary" // Dùng variant secondary của theme
                        className="bg-secondary/50 border-border text-xs font-normal text-secondary-foreground/80 px-2.5 py-0.5 hover:bg-primary/10 hover:text-primary hover:border-primary/40 hover:scale-105 transition-all duration-300 cursor-default"
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
              </div>
            </div>

            {/* 📍 KHỐI 2: META STATS */}
            {/* Thêm border-y nhẹ để phân tách khu vực này gọn gàng hơn */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 border-y border-border/40 py-4">
               <div className="flex flex-col items-center md:items-start space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
                    <User className="w-3 h-3"/> Tác giả
                  </span>
                  <span className="text-sm font-semibold text-foreground truncate max-w-full">{comic.author}</span>
               </div>
               
               <div className="flex flex-col items-center md:items-start space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
                    <Users className="w-3 h-3"/> Nhóm dịch
                  </span>
                  <span className="text-sm font-semibold text-foreground truncate max-w-full">{comic.groupName || "N/A"}</span>
               </div>

               <div className="flex flex-col items-center md:items-start space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3"/> Cập nhật
                  </span>
                  <span className="text-sm font-semibold text-foreground">{formatDate(comic.lastUpdate)}</span>
               </div>

               <div className="flex flex-col items-center md:items-start space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
                    <Star className="w-3 h-3"/> Đánh giá
                  </span>
                  {hasRating ? (
                    <div className="flex items-center gap-1.5">
                        {/* Dùng màu từ theme variable --comic-rating-color */}
                       <span className="font-bold text-sm" style={{ color: 'var(--comic-rating-color)' }}>{displayRating}</span>
                       <div className="flex text-[10px] space-x-0.5">
                          {[...Array(5)].map((_, i) => (
                             <Star 
                                key={i} 
                                className="w-3 h-3"
                                style={{ 
                                    fill: i < fullStars ? 'var(--comic-rating-color)' : 'transparent',
                                    color: i < fullStars ? 'var(--comic-rating-color)' : 'currentColor',
                                    opacity: i < fullStars ? 1 : 0.2 // Làm mờ sao rỗng thay vì đổi màu cứng
                                }}
                              />
                          ))}
                       </div>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">Chưa có đánh giá</span>
                  )}
               </div>
            </div>

            {/* 📍 KHỐI 3: ACTION HUD */}
            {/* ✨ THAY ĐỔI 4: bg-white/5 -> bg-secondary/30 để hợp với cả light/dark */}
            <div className="rounded-2xl bg-secondary/30 border border-border/50 p-4 backdrop-blur-sm flex flex-col gap-4 mt-2">
               
               <div className="flex flex-col sm:flex-row gap-3">
                  {!loadingHistory && continueChapter != null ? (
                    <Button 
                      className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md shadow-primary/20 transition-all hover:scale-[1.02] group"
                      asChild
                    >
                      <a href={`/truyen-tranh/${comic.slug}/chapter/${Math.floor(continueChapter)}`}>
                        <Zap className="mr-2 h-4 w-4 fill-current group-hover:animate-pulse" />
                        Đọc tiếp (Chương {Math.floor(continueChapter)})
                      </a>
                    </Button>
                  ) : (
                    <Button 
                      className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md shadow-primary/20 transition-all hover:scale-[1.02]"
                      asChild
                    >
                      <a href={`/truyen-tranh/${comic.slug}/chapter/${formatNumber(firstChapter)}`}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Bắt đầu đọc
                      </a>
                    </Button>
                  )}

                  <Button 
                    variant="outline" 
                    // Nút outline: border theo theme, text theo foreground
                    className="sm:w-auto h-12 bg-background/50 border-border text-foreground hover:bg-background hover:text-primary transition-colors"
                    asChild
                  >
                     <a href={`/truyen-tranh/${comic.slug}/chapter/${formatNumber(lastChapter)}`}>
                        Chương mới nhất <ChevronRight className="ml-1 h-4 w-4 opacity-50" />
                     </a>
                  </Button>
               </div>

               <div className="w-full h-px bg-border/50" />

               <div className="flex items-center justify-between sm:justify-start sm:gap-6">
                  <button 
                    onClick={onFollowToggle}
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80",
                      // Logic màu: Nếu active thì dùng màu Primary, không thì màu Muted
                      comic.isFollowing ? "text-primary" : "text-muted-foreground hover:text-primary"
                    )}
                  >
                     <Heart className={cn("w-5 h-5", comic.isFollowing && "fill-current")} />
                     <span>{comic.isFollowing ? "Đang theo dõi" : "Theo dõi"}</span>
                     <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                       {comic.followers.toLocaleString()}
                     </span>
                  </button>

                  <button 
                    onClick={onFavoriteToggle}
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80",
                      // Logic màu: Dùng biến --comic-heart-color
                    )}
                    style={{ color: comic.isFavorite ? 'var(--comic-heart-color)' : '' }}
                  >
                     <Star className={cn("w-5 h-5", comic.isFavorite && "fill-current")} />
                     <span className={!comic.isFavorite ? "text-muted-foreground hover:text-[var(--comic-heart-color)]" : ""}>
                        {comic.isFavorite ? "Đã thích" : "Yêu thích"}
                     </span>
                  </button>

                  <button className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all ml-auto sm:ml-0">
                     <Sparkles className="w-4 h-4" />
                  </button>
               </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}