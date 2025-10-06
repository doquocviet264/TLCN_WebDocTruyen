import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Heart, MessageCircle } from "lucide-react"
import { Comic } from "./types"
import { useEffect, useState } from "react"

interface ProfileActivityTabProps {
  readingList: Comic[]
}

interface ActivityData {
  readingList: Comic[]
  favoriteComics: Comic[]
  commentHistory: Comment[]
}

interface Comment {
  id: string
  content: string
  comicTitle: string
  context: string
  timestamp: string
}

export function ProfileActivityTab({ readingList }: ProfileActivityTabProps) {
  const [activityData, setActivityData] = useState<ActivityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserActivity = async () => {
      try {
        setLoading(true)
        const response = await fetch("http://localhost:3000/api/user/activity", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem('token')}`
          },
        })

        if (!response.ok) {
          throw new Error(`Lỗi khi lấy dữ liệu hoạt động: ${response.status}`)
        }

        const data = await response.json()
        setActivityData(data)
      } catch (err) {
        console.error("Lỗi khi fetch dữ liệu hoạt động:", err)
        setError(err instanceof Error ? err.message : "Lỗi không xác định")
      } finally {
        setLoading(false)
      }
    }

    fetchUserActivity()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-6">
            <div className="text-center">Đang tải dữ liệu hoạt động...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              Lỗi: {error}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!activityData) {
    return (
      <div className="space-y-6">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-6">
            <div className="text-center">Không có dữ liệu hoạt động</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)
    
    if (diffInSeconds < 60) return "Vừa xong"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`
    return `${Math.floor(diffInSeconds / 86400)} ngày trước`
  }

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
            {activityData.readingList.length > 0 ? (
              activityData.readingList.map((comic) => (
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
                    <div className="text-sm text-muted-foreground">
                      <span>Đang đọc: {comic.lastReadChapter}</span>
                      <span className="mx-2">|</span>
                      <span>Mới nhất: {comic.lastChapterNumber}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Đọc lần cuối: {formatTimeAgo(comic.lastRead)}
                    </p>
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
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Chưa có truyện nào trong danh sách đọc
              </div>
            )}
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
          {activityData.favoriteComics.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {activityData.favoriteComics.map((comic) => (
                <div key={comic.id} className="text-center">
                  <img
                    src={comic.cover || "/placeholder.svg"}
                    alt={comic.title}
                    className="w-full h-auto object-contain rounded mb-2 bg-gray-100"
                  />
                  <p className="text-sm font-medium truncate">{comic.title}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Chưa có truyện yêu thích
            </div>
          )}
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
            {activityData.commentHistory.length > 0 ? (
              activityData.commentHistory.map((comment) => (
                <div key={comment.id} className="p-4 rounded-lg bg-background/50 border border-border/50">
                  <p className="text-sm">"{comment.content}"</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {comment.context} • {formatTimeAgo(comment.timestamp)}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Chưa có bình luận nào
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}