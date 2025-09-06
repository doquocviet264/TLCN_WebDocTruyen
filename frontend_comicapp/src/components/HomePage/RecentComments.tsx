import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const recentComments = [
  {
    id: 1,
    chapter: "Chương 1095",
    comicTitle: "One Piece",
    content: "Chương này quá hay! Luffy đã mạnh hơn rất nhiều.",
    user: {
      name: "Minh Anh",
      avatar: "/diverse-user-avatars.png",
      initials: "MA",
    },
    time: "5 phút trước",
  },
  {
    id: 2,
    chapter: "Chương 180",
    comicTitle: "Solo Leveling",
    content: "Jin Woo ngày càng bá đạo, không thể chờ đợi chương tiếp theo!",
    user: {
      name: "Hoàng Nam",
      avatar: "/diverse-user-avatar-set-2.png",
      initials: "HN",
    },
    time: "15 phút trước",
  },
  {
    id: 3,
    chapter: "Chương 590",
    comicTitle: "Tower of God",
    content: "Baam đã trở nên mạnh mẽ hơn rất nhiều so với trước.",
    user: {
      name: "Thu Hà",
      avatar: "/diverse-user-avatars-3.png",
      initials: "TH",
    },
    time: "1 giờ trước",
  },
]

export function RecentComments() {
  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
      <h3 className="font-semibold mb-4">Bình luận gần đây</h3>

      <div className="space-y-4">
        {recentComments.map((comment) => (
          <div key={comment.id} className="space-y-2">
            <div className="text-sm">
              <span className="font-medium text-primary cursor-pointer hover:underline">{comment.chapter}</span>
              <span className="text-muted-foreground"> - </span>
              <span className="font-medium cursor-pointer hover:text-primary transition-colors">
                {comment.comicTitle}
              </span>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">{comment.content}</p>

            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={comment.user.avatar || "/placeholder.svg"} alt={comment.user.name} />
                <AvatarFallback className="text-xs">{comment.user.initials}</AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium">{comment.user.name}</span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">{comment.time}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
export default RecentComments;