import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Moon, Sun, Smartphone, Monitor, BookOpen, Scroll, Volume2, PlayCircle, Settings } from 'lucide-react';

interface SettingsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  readingMode: string;
  setReadingMode: (value: "long-strip" | "paginated") => void;
  imageWidth: string;
  setImageWidth: (value: string) => void;
  isAutoPlayOn: boolean;
  setIsAutoPlayOn: (value: boolean) => void;
  autoScrollSpeed: number;
  setAutoScrollSpeed: (speed: number) => void;
  autoPageInterval: number;
  setAutoPageInterval: (interval: number) => void;
  isAudioModeOn: boolean;
  setIsAudioModeOn: (value: boolean) => void;
}

export function SettingsSheet({
  isOpen, onOpenChange,
  isDarkMode, setIsDarkMode,
  readingMode, setReadingMode,
  imageWidth, setImageWidth,
  isAutoPlayOn, setIsAutoPlayOn,
  autoScrollSpeed, setAutoScrollSpeed,
  autoPageInterval, setAutoPageInterval,
  isAudioModeOn, setIsAudioModeOn,
}: SettingsSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-background/95 backdrop-blur-xl border-l border-border">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2 text-xl font-bold">
            <Settings className="w-5 h-5 text-primary" /> Cài đặt đọc truyện
          </SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6">
          {/* --- Hiển thị --- */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Giao diện</h4>
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-3">
                {isDarkMode ? <Moon className="w-5 h-5 text-purple-400" /> : <Sun className="w-5 h-5 text-orange-400" />}
                <Label htmlFor="dark-mode" className="font-medium cursor-pointer">Chế độ tối</Label>
              </div>
              <Switch id="dark-mode" checked={isDarkMode} onCheckedChange={setIsDarkMode} />
            </div>
          </div>

          <Separator className="bg-border/50" />
          
          {/* --- Cách đọc --- */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trải nghiệm đọc</h4>
            
            {/* Chế độ đọc */}
            <div className="grid grid-cols-2 gap-3">
               <button 
                 onClick={() => setReadingMode("long-strip")}
                 className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${readingMode === 'long-strip' ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border hover:bg-secondary/50'}`}
               >
                  <Scroll className="w-6 h-6 mb-2" />
                  <span className="text-xs font-medium">Dải cuộn</span>
               </button>
               <button 
                 onClick={() => setReadingMode("paginated")}
                 className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${readingMode === 'paginated' ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border hover:bg-secondary/50'}`}
               >
                  <BookOpen className="w-6 h-6 mb-2" />
                  <span className="text-xs font-medium">Từng trang</span>
               </button>
            </div>

            {/* Chiều rộng ảnh */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Monitor className="w-4 h-4" /> Kích thước ảnh
              </Label>
              <Select value={imageWidth} onValueChange={setImageWidth}>
                <SelectTrigger className="w-full bg-secondary/30 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="max-w-2xl">📱 Vừa (Điện thoại)</SelectItem>
                  <SelectItem value="max-w-4xl">💻 Lớn (Tablet/PC)</SelectItem>
                  <SelectItem value="w-full">🖥️ Toàn màn hình</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* --- Audio & Auto --- */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tự động hóa</h4>
            
            {/* Audio Mode */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isAudioModeOn ? 'bg-green-500/20 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                   <Volume2 className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                   <Label htmlFor="audio-mode" className="font-medium cursor-pointer">Audio Review</Label>
                   <span className="text-xs text-muted-foreground">Nghe và tự cuộn</span>
                </div>
              </div>
              <Switch id="audio-mode" checked={isAudioModeOn} onCheckedChange={setIsAudioModeOn} />
            </div>

            {/* Auto Play */}
            <div className="space-y-3 p-3 rounded-xl bg-secondary/30 border border-border/50">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isAutoPlayOn ? 'bg-blue-500/20 text-blue-600' : 'bg-muted text-muted-foreground'}`}>
                       <PlayCircle className="w-4 h-4" />
                    </div>
                    <Label htmlFor="autoplay-mode" className="font-medium cursor-pointer">Tự động chạy</Label>
                  </div>
                  <Switch id="autoplay-mode" checked={isAutoPlayOn} onCheckedChange={setIsAutoPlayOn} />
               </div>

               {/* Sliders Control */}
               {isAutoPlayOn && (
                 <div className="pt-2 pl-2 border-t border-border/30 animate-in slide-in-from-top-2">
                    {readingMode === 'long-strip' ? (
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs text-muted-foreground">
                           <span>Tốc độ cuộn</span>
                           <span>{autoScrollSpeed}/10</span>
                        </div>
                        <Slider value={[autoScrollSpeed]} onValueChange={(val) => setAutoScrollSpeed(val[0])} min={1} max={10} step={1} className="cursor-pointer" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs text-muted-foreground">
                           <span>Chuyển trang sau</span>
                           <span>{autoPageInterval}s</span>
                        </div>
                        <Slider value={[autoPageInterval]} onValueChange={(val) => setAutoPageInterval(val[0])} min={2} max={15} step={1} className="cursor-pointer" />
                      </div>
                    )}
                 </div>
               )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
