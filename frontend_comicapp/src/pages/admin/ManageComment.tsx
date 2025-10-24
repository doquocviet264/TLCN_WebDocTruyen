import { useState, useEffect } from "react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Trash2, Clock, ThumbsUp, Flag, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "react-toastify"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Comment {
  id: number
  content: string
  createdAt: string
  likes: number
  reports: number
  mangaTitle: string
  chapterNumber: number | null
  user: {
    name: string
    email: string
    avatar?: string | null
  }
}

interface ApiCommentResponse {
  success: true;
  data: Comment[];            
  meta: Meta; 
}
interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function CommentModeration() {
  const [comments, setComments] = useState<Comment[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOption, setSortOption] = useState("latest")
  const [reportFilter, setReportFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // 🧩 Lấy dữ liệu từ backend
  const fetchComments = async (page = 1) => {
    try {
      setLoading(true)
      const res = await axios.get<ApiCommentResponse>(
        `${import.meta.env.VITE_API_URL}/admin/comments?page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      )
      setComments(res.data.data)
      setTotalPages(res.data.meta.totalPages)
      setCurrentPage(res.data.meta.page)
    } catch (err) {
      console.error("Lỗi khi tải bình luận:", err)
      toast.error("Không thể tải bình luận.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [])

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString("vi-VN")

  // 🧠 Tìm kiếm, lọc, sắp xếp
  const filteredComments = comments
    .filter(
      (comment) =>
        (reportFilter === "reported" ? comment.reports > 0 : true) &&
        (reportFilter === "clean" ? comment.reports === 0 : true) &&
        (comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          comment.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          comment.mangaTitle.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortOption === "latest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortOption === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sortOption === "mostLiked") return b.likes - a.likes
      return 0
    })

  //  Xóa bình luận
  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/admin/comments/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      toast.success("Đã xóa bình luận thành công")
      fetchComments(currentPage)
    } catch {
      toast.error("Không thể xóa bình luận")
    }
  }

  // Điều khiển phân trang
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    fetchComments(newPage)
  }

  if (loading) return <p className="p-4 text-center">Đang tải dữ liệu...</p>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Quản lý Bình luận</h1>
        <p className="text-muted-foreground">Xem, tìm kiếm và xóa bình luận của người dùng</p>
      </div>

      {/* Bộ lọc và tìm kiếm */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc và Tìm kiếm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* Tìm kiếm */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Tìm kiếm theo nội dung, người dùng hoặc truyện..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sắp xếp */}
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Mới nhất</SelectItem>
                <SelectItem value="oldest">Cũ nhất</SelectItem>
                <SelectItem value="mostLiked">Nhiều lượt thích</SelectItem>
              </SelectContent>
            </Select>

            {/* Lọc theo report */}
            <Select value={reportFilter} onValueChange={setReportFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Lọc theo báo cáo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="reported">Bị báo cáo</SelectItem>
                <SelectItem value="clean">Không bị báo cáo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bảng bình luận */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Bình luận ({filteredComments.length})</CardTitle>
          <CardDescription>Quản lý danh sách bình luận tại đây
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead>Truyện/Chương</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Tương tác</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComments.length > 0 ? (
                  filteredComments.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={c.user.avatar || "/placeholder.svg"} alt={c.user.name} />
                            <AvatarFallback>{c.user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{c.user.name}</p>
                            <p className="text-xs text-muted-foreground">{c.user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm truncate" title={c.content}>
                          {c.content}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{c.mangaTitle}</p>
                          {c.chapterNumber && (
                            <p className="text-xs text-muted-foreground">Chương {c.chapterNumber}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{formatDate(c.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-blue-500">
                            <ThumbsUp className="h-4 w-4" /> <span>{c.likes}</span>
                          </div>
                          {c.reports > 0 && (
                            <div className="flex items-center gap-1 text-red-500">
                              <Flag className="h-4 w-4" /> <span>{c.reports}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <Trash2 className="h-4 w-4" /> Xóa
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xóa bình luận?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Hành động này không thể hoàn tác. Bình luận sẽ bị xóa vĩnh viễn khỏi hệ thống.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(c.id)}>Xóa</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                      Không có bình luận nào.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {Array.from({ length: totalPages })
                .map((_, i) => i + 1)
                .filter(
                  (page) =>
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 2 && page <= currentPage + 2)
                )
                .map((page, i, arr) => {
                  const prev = arr[i - 1]
                  if (prev && page - prev > 1) {
                    return (
                      <span key={`ellipsis-${page}`} className="px-2 text-muted-foreground">
                        ...
                      </span>
                    )
                  }
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  )
                })}

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
