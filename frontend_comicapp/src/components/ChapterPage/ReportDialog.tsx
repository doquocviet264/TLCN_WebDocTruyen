import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
// Giả sử bạn dùng react-toastify để hiển thị thông báo
import { toast } from 'react-toastify';

interface ReportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  // Tùy chọn: truyền thông tin chương để gửi kèm báo cáo
  chapterInfo?: {
    comicSlug: string;
    chapterNumber: number;
  }
}

export function ReportDialog({ isOpen, onOpenChange, chapterInfo }: ReportDialogProps) {
  const [reportType, setReportType] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    // Reset state khi đóng dialog
    setReportType('');
    setReportDetails('');
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!reportType) {
      toast.error("Vui lòng chọn loại lỗi bạn gặp phải.");
      return;
    }

    setIsSubmitting(true);
    
    // Giả lập cuộc gọi API
    console.log("Submitting report:", {
      ...chapterInfo,
      type: reportType,
      details: reportDetails,
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Ở đây bạn sẽ gọi API backend của mình để gửi báo cáo
    // await axios.post('/api/reports', { ... });

    setIsSubmitting(false);
    handleClose();
    toast.success("Cảm ơn bạn đã gửi báo cáo!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-muted text-foreground">
        <DialogHeader>
          <DialogTitle>Báo cáo lỗi chương truyện</DialogTitle>
          <DialogDescription>
            Sự đóng góp của bạn giúp chúng tôi cải thiện chất lượng truyện. Vui lòng chọn loại lỗi và mô tả chi tiết.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="report-type" className="text-right text-sm font-medium">
              Loại lỗi
            </label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger id="report-type" className="col-span-3">
                <SelectValue placeholder="Chọn loại lỗi..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image_error">Ảnh lỗi, không hiển thị</SelectItem>
                <SelectItem value="wrong_chapter">Sai nội dung/tên chương</SelectItem>
                <SelectItem value="order_error">Thứ tự trang ảnh bị sai</SelectItem>
                <SelectItem value="other">Lỗi khác (ghi rõ bên dưới)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="report-details" className="text-right text-sm font-medium">
              Chi tiết
            </label>
            <Textarea
              id="report-details"
              placeholder="Mô tả thêm về lỗi bạn gặp phải..."
              className="col-span-3 min-h-[100px]"
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Hủy
            </Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Đang gửi..." : "Gửi báo cáo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}