import { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Bell, Send, Clock } from "lucide-react"
import { toast } from "react-toastify"

interface Notification {
  notificationId: number
  title: string
  message: string
  category: string
  isRead: boolean
  createdAt: string
}

// 🧩 Mock data mẫu
const mockNotifications: Notification[] = [
  {
    notificationId: 1,
    title: "Cập nhật chương mới!",
    message: "Truyện 'Thế Giới Phép Thuật' đã ra chương 46, đọc ngay nhé!",
    category: "comic_update",
    isRead: false,
    createdAt: "2025-10-05T10:30:00",
  },
  {
    notificationId: 2,
    title: "Khuyến mãi nạp xu 20%",
    message: "Nạp xu hôm nay nhận thêm 20% giá trị. Thời gian: 5–10/10/2025.",
    category: "promotion",
    isRead: true,
    createdAt: "2025-10-04T09:10:00",
  },
  {
    notificationId: 3,
    title: "Tác giả bạn theo dõi đã đăng truyện mới",
    message: "Tác giả 'Nguyễn Văn A' vừa phát hành truyện 'Anh Hùng Không Muốn Cứu Thế Giới'.",
    category: "follow",
    isRead: false,
    createdAt: "2025-10-03T14:55:00",
  },
  {
    notificationId: 4,
    title: "Cập nhật hệ thống",
    message: "Hệ thống sẽ bảo trì lúc 00:00 ngày 10/10 để nâng cấp hiệu năng.",
    category: "system",
    isRead: true,
    createdAt: "2025-10-02T23:00:00",
  },
]

export default function ManageNotification() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [category, setCategory] = useState("system")
  const [loading, setLoading] = useState(false)

  const handleCreate = () => {
    if (!title || !message) {
      toast.warn("Vui lòng nhập đủ tiêu đề và nội dung")
      return
    }

    const newNotification: Notification = {
      notificationId: notifications.length + 1,
      title,
      message,
      category,
      isRead: false,
      createdAt: new Date().toISOString(),
    }

    setNotifications([newNotification, ...notifications])
    setTitle("")
    setMessage("")
    setCategory("system")
    toast.success("Đã tạo thông báo mới!")
  }

  const formatDate = (date: string) => new Date(date).toLocaleString("vi-VN")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quản lý Thông báo</h1>
        <p className="text-muted-foreground">Tạo và xem các thông báo gửi đến người dùng</p>
      </div>

      {/* Form tạo thông báo */}
      <Card>
        <CardHeader>
          <CardTitle>Tạo Thông báo mới</CardTitle>
          <CardDescription>Gửi thông báo đến người dùng hoặc toàn hệ thống</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Tiêu đề thông báo"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="Nội dung chi tiết..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[100px]"
          />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn loại thông báo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">Hệ thống</SelectItem>
              <SelectItem value="comic_update">Cập nhật truyện</SelectItem>
              <SelectItem value="follow">Theo dõi</SelectItem>
              <SelectItem value="comment">Bình luận</SelectItem>
              <SelectItem value="promotion">Khuyến mãi</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleCreate} disabled={loading} className="flex items-center gap-2">
            <Send className="h-4 w-4" /> {loading ? "Đang gửi..." : "Gửi thông báo"}
          </Button>
        </CardContent>
      </Card>

      {/* Danh sách thông báo */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách thông báo ({notifications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <TableRow key={n.notificationId}>
                      <TableCell className="font-medium">{n.title}</TableCell>
                      <TableCell className="truncate max-w-[350px]">{n.message}</TableCell>
                      <TableCell className="capitalize">{n.category}</TableCell>
                      <TableCell>
                        {n.isRead ? (
                          <span className="text-green-600 font-medium">Đã đọc</span>
                        ) : (
                          <span className="text-yellow-600 font-medium">Chưa đọc</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {formatDate(n.createdAt)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      Không có thông báo nào.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
