import { useState, useEffect } from "react"
import axios from "axios"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Pencil, PlusCircle, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "react-toastify"

interface Genre {
  genreId: number
  name: string
}
interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiGenreResponse {
  success: true;
  data: Genre[];            
  meta: Meta; 
}

export default function GenreManagement() {
  const [genres, setGenres] = useState<Genre[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null)
  const [genreName, setGenreName] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)

  // 🧩 Lấy danh sách thể loại từ BE
  const fetchGenres = async (page = 1, search = "") => {
    try {
      setLoading(true)
      const res = await axios.get<ApiGenreResponse>(
        `${import.meta.env.VITE_API_URL}/admin/genres?page=${page}&search=${search}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      )
      setGenres(res.data.data)
      setCurrentPage(res.data.meta.page)
      setTotalPages(res.data.meta.totalPages)
      setTotalItems(res.data.meta.total)

    } catch (err) {
      console.error("Lỗi khi tải thể loại:", err)
      toast.error("Không thể tải danh sách thể loại")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGenres()
  }, [])

  // 🆕 Thêm hoặc cập nhật thể loại
  const handleSaveGenre = async () => {
    if (!genreName.trim()) {
      toast.error("Tên thể loại không được để trống")
      return
    }

    try {
      if (editingGenre) {
        // PUT cập nhật
        await axios.put(
          `${import.meta.env.VITE_API_URL}/admin/genres/${editingGenre.genreId}`,
          { name: genreName },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        )
        toast.success("Cập nhật thể loại thành công")
      } else {
        // POST thêm mới
        await axios.post(
          `${import.meta.env.VITE_API_URL}/admin/genres`,
          { name: genreName },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        )
        toast.success("Thêm thể loại thành công")
      }

      setDialogOpen(false)
      setGenreName("")
      setEditingGenre(null)
      fetchGenres(currentPage, searchTerm)
    } catch (err: any) {
      const msg =
        err.response?.data?.message || "Lỗi khi lưu thể loại"
      toast.error(msg)
    }
  }

  const handleEdit = (genre: Genre) => {
    setEditingGenre(genre)
    setGenreName(genre.name)
    setDialogOpen(true)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    fetchGenres(newPage, searchTerm)
  }

  const handleSearch = () => {
    fetchGenres(1, searchTerm)
  }

  if (loading) return <p className="p-4 text-center">Đang tải dữ liệu...</p>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý Thể loại</h1>
          <p className="text-muted-foreground">
            Thêm hoặc chỉnh sửa các thể loại truyện
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingGenre(null)
                setGenreName("")
              }}
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Thêm thể loại
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingGenre ? "Chỉnh sửa thể loại" : "Thêm thể loại mới"}
              </DialogTitle>
              <DialogDescription>
                Nhập tên thể loại và lưu lại.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              <Input
                placeholder="Nhập tên thể loại..."
                value={genreName}
                onChange={(e) => setGenreName(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSaveGenre}>
                {editingGenre ? "Cập nhật" : "Thêm mới"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bộ lọc */}
      <Card>
        <CardHeader>
          <CardTitle>Tìm kiếm Thể loại</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Nhập tên thể loại..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="secondary" onClick={handleSearch}>
              Tìm kiếm
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danh sách thể loại */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Thể loại ({totalItems})</CardTitle>
          <CardDescription>Không thể xóa thể loại</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Tên thể loại</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {genres.length > 0 ? (
                  genres.map((genre) => (
                    <TableRow key={genre.genreId}>
                      <TableCell>{genre.genreId}</TableCell>
                      <TableCell>{genre.name}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="icon"
                          title="Chỉnh sửa"
                          onClick={() => handleEdit(genre)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center py-4 text-muted-foreground"
                    >
                      Không có thể loại nào.
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
                      <span
                        key={`ellipsis-${page}`}
                        className="px-2 text-muted-foreground"
                      >
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
