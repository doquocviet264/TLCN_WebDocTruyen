import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Send, Clock } from "lucide-react"
import { toast } from "react-toastify"

type NotificationCategory = "promotion" | "system"

interface Notification {
  notificationId: number
  title: string
  message?: string
  category: NotificationCategory
  audienceType: "global" | "direct"
  createdAt: string
}

interface Meta {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: Meta
}

const getToken = () => localStorage.getItem("token") // đổi nếu bạn lưu token khác

export default function ManageNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [category, setCategory] = useState<NotificationCategory>("system")
  const [loading, setLoading] = useState(false)
  const [loadingList, setLoadingList] = useState(false)
  const [page, setPage] = useState(1)
  const limit = 20

  const fetchList = async (pageNum = 1) => {
    try {
      setLoadingList(true)
      const res = await axios.get<ApiResponse<Notification[]>>(`${import.meta.env.VITE_API_URL}/admin/notifications`, {
        params: { limit, page: pageNum },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken() || ""}`,
        },
      })
      if (!res.data.success) throw new Error("API trả về success=false")
      setNotifications(res.data.data || [])
      setMeta(res.data.meta || null)
    } catch (err) {
      console.error(err)
      toast.error("Không tải được danh sách thông báo")
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    fetchList(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.warn("Vui lòng nhập tiêu đề")
      return
    }
    setLoading(true)
    try {
      const payload = {
        category,
        title: title.trim(),
        ...(message.trim() ? { message: message.trim() } : {}),
      }
      const { data: res } = await axios.post<ApiResponse<Notification>>(`${import.meta.env.VITE_API_URL}/admin/notifications`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken() || ""}`,
        },
      })
      if (!res?.success) throw new Error("Tạo thông báo thất bại")
      const created: Notification = res.data
      setNotifications((prev) => [created, ...prev])
      setTitle("")
      setMessage("")
      setCategory("system")
      toast.success("Đã tạo thông báo mới!")
    } catch (err) {
      console.error(err)
      toast.error("Tạo thông báo thất bại")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => new Date(date).toLocaleString("vi-VN")
  const renderCategory = (c: NotificationCategory) => (c === "promotion" ? "Khuyến mãi" : "Hệ thống")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quản lý Thông báo</h1>
        <p className="text-muted-foreground">Tạo và xem các thông báo gửi đến người dùng</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tạo Thông báo mới</CardTitle>
          <CardDescription>Chỉ hỗ trợ 2 loại: Khuyến mãi & Hệ thống</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Tiêu đề thông báo" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea
            placeholder="Nội dung chi tiết (tuỳ chọn)..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[100px]"
          />
          <Select value={category} onValueChange={(v) => setCategory(v as NotificationCategory)}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn loại thông báo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">Hệ thống</SelectItem>
              <SelectItem value="promotion">Khuyến mãi</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button onClick={handleCreate} disabled={loading} className="flex items-center gap-2">
              <Send className="h-4 w-4" /> {loading ? "Đang gửi..." : "Gửi thông báo"}
            </Button>
            <Button variant="outline" onClick={() => fetchList(page)} disabled={loadingList}>
              Làm mới danh sách
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách thông báo {meta ? `(${meta.total})` : `(${notifications.length})`}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingList ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : notifications.length > 0 ? (
                  notifications.map((n) => (
                    <TableRow key={n.notificationId}>
                      <TableCell className="font-medium">{n.title}</TableCell>
                      <TableCell className="truncate max-w-[420px]">{n.message || "-"}</TableCell>
                      <TableCell>{renderCategory(n.category)}</TableCell>
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
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      Không có thông báo nào.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Trang {meta.page}/{meta.totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loadingList}
                >
                  Trang trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => (meta ? Math.min(meta.totalPages, p + 1) : p + 1))}
                  disabled={!!meta && (page >= meta.totalPages || loadingList)}
                >
                  Trang sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
