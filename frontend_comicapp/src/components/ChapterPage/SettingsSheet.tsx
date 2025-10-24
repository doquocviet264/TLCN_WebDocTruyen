import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider'; // Thêm import cho Slider
import { Separator } from '@/components/ui/separator';

interface SettingsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  readingMode: string;
  setReadingMode: (value: any) => void;
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
  isOpen,
  onOpenChange,
  isDarkMode,
  setIsDarkMode,
  readingMode,
  setReadingMode,
  imageWidth,
  setImageWidth,
  isAutoPlayOn,
  setIsAutoPlayOn,
  autoScrollSpeed,
  setAutoScrollSpeed,
  autoPageInterval,
  setAutoPageInterval,
  isAudioModeOn,
  setIsAudioModeOn,
}: SettingsSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="bg-muted text-foreground">
        <SheetHeader>
          <SheetTitle>Cài đặt đọc truyện</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 py-6">
          {/* --- Phần Hiển Thị --- */}
          <div className="space-y-4">
            <h4 className="font-semibold text-muted-foreground">Hiển Thị</h4>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="dark-mode" className="flex flex-col gap-1">
                <span>Chế độ tối</span>
                <span className="font-normal text-sm text-muted-foreground">Giảm mỏi mắt trong môi trường tối.</span>
              </Label>
              <Switch id="dark-mode" checked={isDarkMode} onCheckedChange={setIsDarkMode} className="data-[state=unchecked]:bg-muted data-[state=checked]:bg-primary [&>span]:bg-primary"/>
            </div>
          </div>

          <Separator />
          
          {/* --- Phần Cách Đọc --- */}
          <div className="space-y-4">
            <h4 className="font-semibold text-muted-foreground">Cách Đọc</h4>
            <div className="space-y-2 rounded-lg border p-3">
              <Label htmlFor="reading-mode">Chế độ đọc</Label>
              <Select value={readingMode} onValueChange={setReadingMode}>
                <SelectTrigger id="reading-mode"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="long-strip">Dải dài (Cuộn)</SelectItem>
                  <SelectItem value="paginated">Phân trang</SelectItem>
                </SelectContent>
              </Select>
            </div>
              <div className="space-y-2 rounded-lg border p-3">
              <Label htmlFor="image-width">Chiều rộng hình ảnh</Label>
              <Select value={imageWidth} onValueChange={setImageWidth}>
                <SelectTrigger id="image-width"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="max-w-2xl">Vừa (Tốt nhất cho điện thoại)</SelectItem>
                  <SelectItem value="max-w-4xl">Lớn</SelectItem>
                  <SelectItem value="w-full">Toàn màn hình</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <h4 className="font-semibold text-muted-foreground">Chế độ Audio</h4>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="audio-mode" className="flex flex-col gap-1">
                <span>Bật đọc audio</span>
                <span className="font-normal text-sm text-muted-foreground">
                  Nghe và tự động cuộn theo kịch bản.
                </span>
              </Label>
              <Switch
                id="audio-mode"
                checked={isAudioModeOn}
                onCheckedChange={setIsAudioModeOn}
                className="data-[state=unchecked]:bg-muted data-[state=checked]:bg-primary [&>span]:bg-primary"
              />
            </div>
          </div>
          {/* --- [MỚI] Phần Tự Động Chạy --- */}
          <Separator />
          <div className="space-y-4">
            <h4 className="font-semibold text-muted-foreground">Tự Động Chạy</h4>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="autoplay-mode" className="flex flex-col gap-1">
                <span>Bật tự động</span>
                <span className="font-normal text-sm text-muted-foreground">Tự động cuộn hoặc chuyển trang.</span>
              </Label>
              <Switch
                id="autoplay-mode"
                checked={isAutoPlayOn}
                onCheckedChange={setIsAutoPlayOn}
                className="data-[state=unchecked]:bg-muted data-[state=checked]:bg-primary [&>span]:bg-primary"
              />
            </div>

            {isAutoPlayOn && (
              <div className="space-y-2 rounded-lg border p-3">
                {readingMode === 'long-strip' ? (
                  <div className="space-y-2">
                    <Label>Tốc độ cuộn</Label>
                    <div className="flex items-center gap-4 pt-2">
                      <span className="text-sm text-muted-foreground">Chậm</span>
                      <Slider
                        value={[autoScrollSpeed]}
                        onValueChange={(value) => setAutoScrollSpeed(value[0])}
                        min={1}
                        max={10}
                        step={1}
                      />
                      <span className="text-sm text-muted-foreground">Nhanh</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Thời gian chuyển trang: {autoPageInterval} giây</Label>
                    <div className="flex items-center gap-4 pt-2">
                      <span className="text-sm text-muted-foreground">2s</span>
                       <Slider
                        value={[autoPageInterval]}
                        onValueChange={(value) => setAutoPageInterval(value[0])}
                        min={2}
                        max={15}
                        step={1}
                      />
                      <span className="text-sm text-muted-foreground">15s</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}