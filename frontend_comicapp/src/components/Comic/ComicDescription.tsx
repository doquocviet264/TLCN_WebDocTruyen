import { useState } from "react";
import { ChevronDown, ChevronUp, ScrollText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ComicDescriptionProps {
  description: string;
}

export default function ComicDescription({ description }: ComicDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const maxLength = 400; 
  const shouldTruncate = description.length > maxLength;

  return (
    // ✨ 1. Container: Dùng bg-card và border-border để ăn theo theme
    <div className="relative w-full rounded-[24px] bg-card border border-border shadow-sm overflow-hidden group mt-6">
      
      {/* Background Decor: Giữ nguyên nhưng giảm độ đậm để không át text ở Light Mode */}
      <div className="absolute top-0 right-0 p-20 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 p-6 md:p-8">
        {/* Header của block */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <ScrollText className="w-5 h-5 text-primary" />
          </div>
          {/* ✨ 2. Title: Dùng text-foreground */}
          <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight drop-shadow-sm">
            Sơ lược cốt truyện
          </h2>
        </div>

        {/* Nội dung văn bản */}
        <div 
          className={cn(
            "relative text-base leading-relaxed text-justify font-normal transition-all duration-500 ease-in-out",
            !isExpanded && shouldTruncate ? "max-h-[160px] overflow-hidden" : "h-auto"
          )}
        >
          {/* ✨ 3. Text Body: Dùng text-muted-foreground hoặc foreground/90 để dễ đọc */}
          <div className="whitespace-pre-line text-muted-foreground/90 dark:text-foreground/80">
            {description || "Đang cập nhật nội dung..."}
          </div>

          {/* ✨ 4. Gradient Fade: QUAN TRỌNG - Phải dùng from-card để hòa vào nền */}
          {!isExpanded && shouldTruncate && (
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card via-card/90 to-transparent flex items-end justify-center pt-10" />
          )}
        </div>

        {/* Nút Toggle */}
        {shouldTruncate && (
          <div className={cn("flex justify-center mt-4", !isExpanded && "absolute bottom-4 left-0 right-0 z-20")}>
            <Button
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                // ✨ 5. Button Style: Dùng bg-secondary/50 thay vì bg-white/5
                "group relative flex items-center space-x-2 rounded-full border border-border bg-secondary/50 px-6 py-5 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all duration-300 backdrop-blur-md text-foreground/80",
                !isExpanded && "shadow-lg animate-in fade-in slide-in-from-bottom-2"
              )}
            >
              <span className="font-medium text-sm">
                {isExpanded ? "Thu gọn nội dung" : "Đọc toàn bộ cốt truyện"}
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 transition-transform group-hover:-translate-y-1" />
              ) : (
                <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-1" />
              )}
              
              {!isExpanded && <Sparkles className="ml-1 w-3 h-3 text-yellow-500 animate-pulse" />}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}