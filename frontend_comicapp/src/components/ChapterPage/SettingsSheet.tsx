import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Moon, Book, TabletSmartphone, Monitor } from 'lucide-react';
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
}

export function SettingsSheet({ isOpen, onOpenChange, isDarkMode, setIsDarkMode, readingMode, setReadingMode, imageWidth, setImageWidth }: SettingsSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="bg-muted text-foreground">
        <SheetHeader>
          <SheetTitle>Cài đặt đọc truyện</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 py-6">
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
        </div>
      </SheetContent>
    </Sheet>
  );
}