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
import { toast } from 'react-toastify';
import axios from "axios";

interface ReportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  chapterId: number;
  comicTitle: string;
  chapterNumber: number;
}
const reportTypeLabels: Record<string, string> = {
  image_error: "Ảnh lỗi, không hiển thị",
  wrong_chapter: "Sai nội dung/tên chương",
  order_error: "Thứ tự trang ảnh bị sai",
  other: "Khác",
};
export function ReportDialog({ isOpen, onOpenChange, comicTitle, chapterNumber, chapterId }: ReportDialogProps) {
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

  const token = localStorage.getItem("token");
  if (!token) {
    toast.error("Bạn cần đăng nhập để gửi báo cáo.");
    return;
  }

  try {
    setIsSubmitting(true);

    // Tạo title/description/type/targetId/category giống mẫu
    const title = `Báo cáo chương ${
      chapterNumber ?? "?"
    } - ${comicTitle ?? "unknown"}-${reportTypeLabels[reportType]}`; ;

    // Ưu tiên chapterId nếu có, nếu không dùng chapterNumber làm targetId


    await axios.post(
      `${import.meta.env.VITE_API_URL}/reports`,
      {
        title,
        description: reportDetails?.trim() || "(Không có mô tả bổ sung)",
        type: "chapter", 
        targetId: chapterId,                          
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    toast.success("Cảm ơn bạn đã gửi báo cáo!");
    handleClose();
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Gửi báo cáo thất bại, vui lòng thử lại.";
    toast.error(msg);
  } finally {
    setIsSubmitting(false);
  }
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