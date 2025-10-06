import { Edit, Eye, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ComicHeaderProps {
  cover: string;
  title: string;
}

export default function ComicHeader({ cover, title }: ComicHeaderProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden mb-4">
          <img src={cover} alt={title} className="object-cover w-full h-full" />
        </div>
        <div className="space-y-3">
          <Button className="w-full gap-2">
            <Edit className="h-4 w-4" /> Chỉnh sửa thông tin
          </Button>
          <Button variant="outline" className="w-full gap-2">
            <Eye className="h-4 w-4" /> Xem trang công khai
          </Button>
          <Button variant="destructive" className="w-full gap-2">
            <Trash2 className="h-4 w-4" /> Xóa truyện
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}