import { useState } from "react"
import {
  Search,
  Filter,
  Grid,
  List,
  Star,
  Heart,
  MessageCircle,
  TrendingUp,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

const genres = [
  "Hành động",
  "Hài hước",
  "Romance",
  "Kinh dị",
  "Phiêu lưu",
  "Học đường",
  "Siêu nhiên",
  "Thể thao",
  "Slice of Life",
  "Drama",
]

const statuses = ["Đang cập nhật", "Hoàn thành", "Tạm ngưng"]

const mockComics = [
  {
    id: 1,
    title: "Solo Leveling",
    author: "Chugong",
    image: "/solo-leveling-manga-cover.png",
    rating: 9.2,
    comments: 1234,
    hearts: 5678,
    chapters: 180,
    status: "Đang cập nhật",
    genres: ["Hành động", "Phiêu lưu"],
    description: "Sung Jin-Woo là thợ săn yếu nhất thế giới...",
  },
  {
    id: 2,
    title: "Tower of God",
    author: "SIU",
    image: "/tower-of-god-manga-cover.png",
    rating: 8.8,
    comments: 987,
    hearts: 4321,
    chapters: 590,
    status: "Đang cập nhật",
    genres: ["Hành động", "Siêu nhiên"],
    description: "Bam theo Rachel vào tòa tháp bí ẩn...",
  },
]

const trendingComics = [
  { id: 1, title: "Solo Leveling", views: "2.5M", trend: "+15%" },
  { id: 2, title: "Tower of God", views: "1.8M", trend: "+8%" },
  { id: 3, title: "The God of High School", views: "1.2M", trend: "+12%" },
]

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [sortBy, setSortBy] = useState("newest")

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-montserrat font-bold">Tìm kiếm truyện</h1>

        {/* Search Bar */}
        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            placeholder="Tìm theo tên truyện, tác giả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-lg bg-card/60 backdrop-blur-sm border-border"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Bộ lọc</span>
            </Button>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="oldest">Cũ nhất</SelectItem>
                <SelectItem value="rating">Đánh giá cao</SelectItem>
                <SelectItem value="popular">Phổ biến</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn tình trạng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-64 space-y-6">
            <Card className="p-4 bg-card/60 backdrop-blur-sm border-border">
              <h3 className="font-semibold mb-3">Thể loại</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {genres.map((genre) => (
                  <div key={genre} className="flex items-center space-x-2">
                    <Checkbox
                      id={genre}
                      checked={selectedGenres.includes(genre)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedGenres([...selectedGenres, genre])
                        } else {
                          setSelectedGenres(
                            selectedGenres.filter((g) => g !== genre),
                          )
                        }
                      }}
                    />
                    <label
                      htmlFor={genre}
                      className="text-sm cursor-pointer"
                    >
                      {genre}
                    </label>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Trending Section */}
          <Card className="p-4 bg-card/60 backdrop-blur-sm border-border">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Truyện thịnh hành</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {trendingComics.map((comic) => (
                <div
                  key={comic.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <span className="font-medium text-sm">{comic.title}</span>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>{comic.views}</span>
                    <span className="text-green-500">{comic.trend}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Search Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                Kết quả tìm kiếm ({mockComics.length} truyện)
              </h3>
            </div>

            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {mockComics.map((comic) => (
                  <Card
                    key={comic.id}
                    className="overflow-hidden bg-card/60 backdrop-blur-sm border-border hover:shadow-lg transition-all duration-300 cursor-pointer group hover:scale-105"
                  >
                    <div className="flex flex-col">
                      <div className="relative aspect-[3/4] w-full">
                        <img
                          src={comic.image || "/placeholder.svg"}
                          alt={comic.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-white text-xs font-medium">
                            {comic.rating}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 space-y-2">
                        <h4 className="font-semibold text-sm line-clamp-2">
                          {comic.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {comic.author}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {comic.genres.slice(0, 2).map((genre) => (
                            <Badge
                              key={genre}
                              variant="secondary"
                              className="text-xs"
                            >
                              {genre}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {mockComics.map((comic) => (
                  <Card
                    key={comic.id}
                    className="p-4 bg-card/60 backdrop-blur-sm border-border hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="flex space-x-4">
                      <div className="w-20 h-28 flex-shrink-0">
                        <img
                          src={comic.image || "/placeholder.svg"}
                          alt={comic.title}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-lg">
                              {comic.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Tác giả: {comic.author}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">
                              {comic.rating}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {comic.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {comic.genres.map((genre) => (
                              <Badge
                                key={genre}
                                variant="secondary"
                                className="text-xs"
                              >
                                {genre}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="h-4 w-4" />
                              <span>{comic.comments}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Heart className="h-4 w-4" />
                              <span>{comic.hearts}</span>
                            </div>
                            <span>{comic.chapters} chương</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Load More */}
          <div className="text-center">
            <Button variant="outline" className="px-8 bg-transparent">
              Xem thêm
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
