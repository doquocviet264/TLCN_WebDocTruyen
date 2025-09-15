import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Heart, MessageCircle } from "lucide-react"
import { Comic } from "./types"

interface ProfileActivityTabProps {
  readingList: Comic[]
}

export function ProfileActivityTab({ readingList }: ProfileActivityTabProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Danh sách truyện đã đọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {readingList.map((comic) => (
              <div
                key={comic.id}
                className="flex items-center gap-4 p-4 rounded-lg bg-background/50 border border-border/50"
              >
                <img
                  src={comic.cover || "/placeholder.svg"}
                  alt={comic.title}
                  className="w-16 h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{comic.title}</h3>
                  <p className="text-sm text-muted-foreground">{comic.progress}</p>
                  <p className="text-xs text-muted-foreground">Đọc lần cuối: {comic.lastRead}</p>
                </div>
                <Badge
                  variant={
                    comic.status === "Đang đọc"
                      ? "default"
                      : comic.status === "Hoàn thành"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {comic.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Truyện yêu thích
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {readingList.slice(0, 4).map((comic) => (
              <div key={comic.id} className="text-center">
                <img
                  src={comic.cover || "/placeholder.svg"}
                  alt={comic.title}
                  className="w-full h-32 object-cover rounded mb-2"
                />
                <p className="text-sm font-medium truncate">{comic.title}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Lịch sử bình luận
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-background/50 border border-border/50">
              <p className="text-sm">"Truyện hay quá! Chờ chương tiếp theo..."</p>
              <p className="text-xs text-muted-foreground mt-2">One Piece - Chương 1095 • 2 giờ trước</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50 border border-border/50">
              <p className="text-sm">"Kết thúc tuyệt vời cho một series tuyệt vời!"</p>
              <p className="text-xs text-muted-foreground mt-2">
                Attack on Titan - Chương 139 • 3 ngày trước
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}