import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, Star, BookOpen, Tag } from "lucide-react";

interface ComicMainInfoProps {
  title: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  description: string;
  genres: string[];
  aliases: string[];
  rating: number;
  chapters: number;
  statusColors: Record<string, string>;
  statusLabels: Record<string, string>;
}

export default function ComicMainInfo({
  title,
  author,
  createdAt,
  updatedAt,
  status,
  description,
  genres,
  aliases,
  rating,
  chapters,
  statusColors,
  statusLabels,
}: ComicMainInfoProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-3xl">{title}</CardTitle>
            <CardDescription className="flex flex-col gap-2 text-lg">
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" /> {author}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Ngày tạo:{" "}
                {new Date(createdAt).toLocaleDateString("vi-VN")}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Cập nhật:{" "}
                {new Date(updatedAt).toLocaleDateString("vi-VN")}
              </span>
            </CardDescription>
          </div>
          <Badge className={`${statusColors[status]} text-lg`}>
            {statusLabels[status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Mô tả */}
        <div>
          <h3 className="font-semibold mb-2">Mô tả</h3>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        {/* Tên khác */}
        {aliases.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Tag className="h-4 w-4" /> Tên khác
            </h3>
            <div className="flex flex-wrap gap-2">
              {aliases.map((alias) => (
                <Badge key={alias} variant="outline">
                  {alias}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Genres */}
        <div>
          <h3 className="font-semibold mb-2">Thể loại</h3>
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => (
              <Badge key={g} variant="secondary">
                {g}
              </Badge>
            ))}
          </div>
        </div>

        {/* Thông tin thêm */}
        <div className="grid grid-cols-2 gap-4 text-lg mt-4">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span>Đánh giá trung bình: {rating}</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-500" />
            <span>Tổng số chương: {chapters}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
