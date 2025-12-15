import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Search, 
  Hash, 
  Lightbulb, 
  ImageIcon, 
  MessageCircle, 
  Filter, 
  X 
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Props {
  allGenres: string[];
  selectedGenres: string[];
  onGenresChange: (genres: string[]) => void;
}

export function CommunitySidebar({ allGenres, selectedGenres, onGenresChange }: Props) {
  const [genreSearch, setGenreSearch] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredGenres = useMemo(() => {
    const query = genreSearch.trim().toLowerCase();
    if (!query) return allGenres;
    return allGenres.filter((g) => g.toLowerCase().includes(query));
  }, [allGenres, genreSearch]);

  // Logic hiển thị: Nếu đang search thì hiện hết, không thì chỉ hiện 15 cái đầu
  const displayGenres = (genreSearch || isExpanded) ? filteredGenres : filteredGenres.slice(0, 15);
  const hiddenCount = filteredGenres.length - 15;

  const toggleGenre = (g: string) => {
    onGenresChange(
      selectedGenres.includes(g)
        ? selectedGenres.filter((x) => x !== g)
        : [...selectedGenres, g]
    );
  };

  return (
    <div className="sticky top-24 space-y-6 animate-in slide-in-from-right-4 duration-700">
      
      {/* --- BOX 1: BỘ LỌC CHỦ ĐỀ --- */}
      <div className="bg-card/60 backdrop-blur-md border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-secondary/20 flex items-center gap-2">
           <Filter className="w-4 h-4 text-primary" />
           <h3 className="font-bold text-sm uppercase tracking-wide">Chủ đề thảo luận</h3>
        </div>

        <div className="p-4 space-y-4">
           {/* Search Input */}
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={genreSearch}
                onChange={(e) => setGenreSearch(e.target.value)}
                placeholder="Tìm thể loại..."
                className="pl-9 bg-background/50 h-9 text-sm rounded-lg focus-visible:ring-primary/30"
              />
           </div>

           {/* Tags Cloud */}
           <div className="flex flex-wrap gap-2">
              {displayGenres.length > 0 ? (
                displayGenres.map((g) => {
                  const active = selectedGenres.includes(g);
                  return (
                    <Badge
                      key={g}
                      variant={active ? "default" : "outline"}
                      onClick={() => toggleGenre(g)}
                      className={cn(
                        "cursor-pointer px-2.5 py-1 text-xs font-normal transition-all hover:border-primary/50 select-none",
                        active 
                          ? "bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 scale-105" 
                          : "bg-background hover:bg-secondary text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {active && <Hash className="w-3 h-3 mr-1 opacity-70" />}
                      {g}
                    </Badge>
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground w-full text-center py-2">Không tìm thấy chủ đề nào.</p>
              )}
           </div>

           {/* Expand / Collapse Button */}
           {!genreSearch && hiddenCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full h-8 text-xs text-muted-foreground hover:text-primary"
              >
                {isExpanded ? "Thu gọn" : `Xem thêm ${hiddenCount} chủ đề khác`}
              </Button>
           )}

           {selectedGenres.length > 0 && (
             <>
               <Separator className="bg-border/50" />
               <Button
                 variant="destructive"
                 size="sm"
                 onClick={() => onGenresChange([])}
                 className="w-full h-8 text-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 shadow-none"
               >
                 <X className="w-3 h-3 mr-1" /> Xoá bộ lọc ({selectedGenres.length})
               </Button>
             </>
           )}
        </div>
      </div>

      {/* --- BOX 2: MẸO HAY --- */}
      <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/5 backdrop-blur-md border border-yellow-500/20 rounded-2xl shadow-sm p-5 relative overflow-hidden">
        {/* Decor Icon */}
        <Lightbulb className="absolute -right-4 -top-4 w-24 h-24 text-yellow-500/10 rotate-12 pointer-events-none" />
        
        <h3 className="font-bold text-sm uppercase tracking-wide text-yellow-600 dark:text-yellow-400 mb-3 flex items-center gap-2">
           <Lightbulb className="w-4 h-4" /> Mẹo đăng bài
        </h3>
        
        <ul className="space-y-3">
           <li className="flex gap-3 items-start text-sm text-foreground/80">
              <div className="mt-0.5 min-w-[20px] h-5 rounded-full bg-background flex items-center justify-center border border-yellow-500/30">
                 <Search className="w-3 h-3 text-yellow-600" />
              </div>
              <span className="text-xs leading-relaxed">
                Dùng tab <b>"Tìm truyện tương tự"</b> nếu bạn muốn cộng đồng gợi ý các bộ truyện hay.
              </span>
           </li>
           <li className="flex gap-3 items-start text-sm text-foreground/80">
              <div className="mt-0.5 min-w-[20px] h-5 rounded-full bg-background flex items-center justify-center border border-yellow-500/30">
                 <MessageCircle className="w-3 h-3 text-yellow-600" />
              </div>
              <span className="text-xs leading-relaxed">
                Viết ngắn gọn, súc tích. Tiêu đề hấp dẫn sẽ thu hút nhiều bình luận hơn.
              </span>
           </li>
           <li className="flex gap-3 items-start text-sm text-foreground/80">
              <div className="mt-0.5 min-w-[20px] h-5 rounded-full bg-background flex items-center justify-center border border-yellow-500/30">
                 <ImageIcon className="w-3 h-3 text-yellow-600" />
              </div>
              <span className="text-xs leading-relaxed">
                Thêm ảnh minh họa (tối đa 5) để bài viết sinh động hơn.
              </span>
           </li>
        </ul>
      </div>

    </div>
  );
}