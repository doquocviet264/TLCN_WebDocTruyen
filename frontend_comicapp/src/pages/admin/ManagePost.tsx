import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Trash2, Clock, ThumbsUp, MessageSquare, Flag, ChevronLeft, ChevronRight, BookOpen, Tag } from "lucide-react"
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

type PostType = "review" | "find_similar"

interface PostRow {
  postId: number
  type: PostType
  title: string
  content: string
  createdAt: string

  likesCount: number
  commentsCount: number
  reportsCount: number

  author: {
    userId: number
    username: string
    email?: string
    avatar?: string | null
  }

  comic?: {
    comicId: number
    title: string
    slug: string
  } | null

  images?: { postimageId: number; imageUrl: string; imageNumber: number }[]
}

interface Meta {
  page: number
  limit: number
  total: number
  pages: number
  sort?: string
  reportFilter?: string
}

interface ApiPostResponse {
  success: true
  data: PostRow[]
  meta: Meta
}

export default function PostModeration() {
  const [posts, setPosts] = useState<PostRow[]>([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | PostType>("all")
  const [reportFilter, setReportFilter] = useState<"all" | "reported" | "clean">("all")
  const [sortOption, setSortOption] = useState<"latest" | "oldest">("latest")

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString("vi-VN")

  const fetchPosts = async (page = 1) => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", "20")

      if (searchTerm.trim()) params.set("q", searchTerm.trim())
      if (typeFilter !== "all") params.set("type", typeFilter)
      if (reportFilter !== "all") params.set("reportFilter", reportFilter)

      // sort map
      params.set("sort", sortOption === "latest" ? "new" : "old")

      const res = await axios.get<ApiPostResponse>(
        `${import.meta.env.VITE_API_URL}/admin/posts?${params.toString()}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      )

      setPosts(res.data.data)
      setCurrentPage(res.data.meta.page)
      setTotalPages(res.data.meta.pages)
    } catch (err) {
      console.error(err)
      toast.error("Không thể tải danh sách bài đăng.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Khi đổi filter/search => load lại page 1
  useEffect(() => {
    const t = setTimeout(() => fetchPosts(1), 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, typeFilter, reportFilter, sortOption])

  const handleDelete = async (postId: number) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/admin/posts/${postId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      toast.success("Đã xóa bài đăng")
      fetchPosts(currentPage)
    } catch {
      toast.error("Không thể xóa bài đăng")
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    fetchPosts(newPage)
  }

  const stats = useMemo(() => {
    const reported = posts.filter((p) => (p.reportsCount ?? 0) > 0).length
    return { total: posts.length, reported }
  }, [posts])

  if (loading) return <p className="p-4 text-center">Đang tải dữ liệu...</p>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Quản lý Bài đăng</h1>
        <p className="text-muted-foreground">
          Duyệt, lọc theo loại bài, lọc theo báo cáo và xóa bài đăng cộng đồng
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc và Tìm kiếm</CardTitle>
          <CardDescription>
            Tổng: {stats.total} bài • Bị báo cáo: {stats.reported} bài
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Tìm theo tiêu đề, nội dung, tác giả, truyện..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type filter */}
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
              <SelectTrigger className="w-full md:w-[190px]">
                <SelectValue placeholder="Loại bài" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="review">Đánh giá</SelectItem>
                <SelectItem value="find_similar">Tìm truyện</SelectItem>
              </SelectContent>
            </Select>

            {/* Report filter */}
            <Select value={reportFilter} onValueChange={(v) => setReportFilter(v as any)}>
              <SelectTrigger className="w-full md:w-[210px]">
                <SelectValue placeholder="Lọc theo báo cáo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="reported">Bị báo cáo</SelectItem>
                <SelectItem value="clean">Không bị báo cáo</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortOption} onValueChange={(v) => setSortOption(v as any)}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Mới nhất</SelectItem>
                <SelectItem value="oldest">Cũ nhất</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Bài đăng ({posts.length})</CardTitle>
          <CardDescription>Kiểm duyệt bài viết cộng đồng tại đây</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tác giả</TableHead>
                  <TableHead>Tiêu đề / Nội dung</TableHead>
                  <TableHead>Loại / Truyện</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Tương tác</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {posts.length > 0 ? (
                  posts.map((p) => (
                    <TableRow key={p.postId}>
                      {/* Author */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={p.author.avatar || "/placeholder.svg"} alt={p.author.username} />
                            <AvatarFallback>{p.author.username?.charAt(0)?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{p.author.username}</p>
                            {p.author.email && <p className="text-xs text-muted-foreground">{p.author.email}</p>}
                          </div>
                        </div>
                      </TableCell>

                      {/* Title/content */}
                      <TableCell className="min-w-[380px]">
                        <div className="space-y-1">
                          <p className="font-medium text-sm line-clamp-1" title={p.title}>
                            {p.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2" title={p.content}>
                            {p.content}
                          </p>

                          {!!p.images?.length && (
                            <div className="text-xs text-muted-foreground">
                              Ảnh: {p.images.length}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Type / Comic */}
                      <TableCell className="min-w-[220px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <span className={p.type === "review" ? "font-medium" : ""}>
                              {p.type === "review" ? "Review" : "Find similar"}
                            </span>
                          </div>

                          {p.comic ? (
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium line-clamp-1" title={p.comic.title}>
                                {p.comic.title}
                              </span>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">Không gắn truyện</p>
                          )}
                        </div>
                      </TableCell>

                      {/* Time */}
                      <TableCell className="min-w-[190px]">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{formatDate(p.createdAt)}</span>
                        </div>
                      </TableCell>

                      {/* Interactions */}
                      <TableCell className="min-w-[200px]">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-blue-500">
                            <ThumbsUp className="h-4 w-4" /> <span>{p.likesCount ?? 0}</span>
                          </div>
                          <div className="flex items-center gap-1 text-emerald-500">
                            <MessageSquare className="h-4 w-4" /> <span>{p.commentsCount ?? 0}</span>
                          </div>
                          {(p.reportsCount ?? 0) > 0 && (
                            <div className="flex items-center gap-1 text-red-500">
                              <Flag className="h-4 w-4" /> <span>{p.reportsCount}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="flex items-center gap-1">
                              <Trash2 className="h-4 w-4" /> Xóa
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xóa bài đăng?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Hành động này không thể hoàn tác. Bài đăng và dữ liệu liên quan sẽ bị xóa khỏi hệ thống.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(p.postId)}>Xóa</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                      Không có bài đăng nào.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {Array.from({ length: totalPages })
                .map((_, i) => i + 1)
                .filter((page) => page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2))
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

              <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
