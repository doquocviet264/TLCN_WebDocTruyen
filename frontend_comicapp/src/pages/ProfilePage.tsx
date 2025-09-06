import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  User,
  Edit3,
  Calendar,
  Mail,
  BookOpen,
  Heart,
  MessageCircle,
  Settings,
  LogOut,
  Trash2,
  Bell,
  Lock,
  Camera,
} from "lucide-react"

interface UserProfile {
  name: string
  email: string
  avatar: string
  joinDate: string
  level: string
  totalRead: number
  favorites: number
  comments: number
}

interface Comic {
  id: number
  title: string
  cover: string
  status: string
  progress: string
  lastRead: string
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"info" | "activity" | "settings">("info")

  // Mock user data
  const user: UserProfile = {
    name: "Nguyễn Văn A",
    email: "nguyenvana@email.com",
    avatar: "/diverse-user-avatars.png",
    joinDate: "15/03/2023",
    level: "Độc giả VIP",
    totalRead: 156,
    favorites: 23,
    comments: 89,
  }

  const readingList: Comic[] = [
    {
      id: 1,
      title: "One Piece",
      cover: "/one-piece-manga-cover.png",
      status: "Đang đọc",
      progress: "Chương 1095/1095",
      lastRead: "2 giờ trước",
    },
    {
      id: 2,
      title: "Naruto",
      cover: "/generic-ninja-manga-cover.png",
      status: "Hoàn thành",
      progress: "Chương 700/700",
      lastRead: "1 tuần trước",
    },
    {
      id: 3,
      title: "Attack on Titan",
      cover: "/attack-on-titan-manga-cover.png",
      status: "Yêu thích",
      progress: "Chương 139/139",
      lastRead: "3 ngày trước",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                      <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-bold">{user.name}</h2>
                    <Badge variant="secondary" className="mt-1">
                      {user.level}
                    </Badge>
                  </div>
                </div>

                {/* Navigation Tabs for Mobile */}
                <div className="mt-6 lg:hidden">
                  <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as typeof activeTab)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="info">Thông tin</TabsTrigger>
                      <TabsTrigger value="activity">Hoạt động</TabsTrigger>
                      <TabsTrigger value="settings">Cài đặt</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden lg:block mt-6 space-y-2">
                  <Button
                    variant={activeTab === "info" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("info")}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Thông tin cá nhân
                  </Button>
                  <Button
                    variant={activeTab === "activity" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("activity")}
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Hoạt động đọc truyện
                  </Button>
                  <Button
                    variant={activeTab === "settings" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("settings")}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Cài đặt
                  </Button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Info */}
            {activeTab === "info" && (
              <div className="space-y-6">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Thông tin cá nhân
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Tên người dùng</p>
                          <p className="font-medium">{user.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Ngày đăng ký</p>
                          <p className="font-medium">{user.joinDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Cấp độ</p>
                          <Badge variant="secondary">{user.level}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-4">
                      <Button size="sm" className="gap-2">
                        <Edit3 className="h-4 w-4" />
                        Chỉnh sửa thông tin
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                        <Camera className="h-4 w-4" />
                        Thay avatar
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                        <Lock className="h-4 w-4" />
                        Đổi mật khẩu
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardContent className="p-6 text-center">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{user.totalRead}</p>
                      <p className="text-sm text-muted-foreground">Truyện đã đọc</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardContent className="p-6 text-center">
                      <Heart className="h-8 w-8 mx-auto mb-2 text-red-500" />
                      <p className="text-2xl font-bold">{user.favorites}</p>
                      <p className="text-sm text-muted-foreground">Yêu thích</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardContent className="p-6 text-center">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                      <p className="text-2xl font-bold">{user.comments}</p>
                      <p className="text-sm text-muted-foreground">Bình luận</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Activity */}
            {activeTab === "activity" && (
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
            )}

            {/* Settings */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Cài đặt tài khoản
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                      <Lock className="h-4 w-4" />
                      Đổi mật khẩu
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                      <Bell className="h-4 w-4" />
                      Cài đặt thông báo
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </Button>
                    <Button variant="destructive" className="w-full justify-start gap-2">
                      <Trash2 className="h-4 w-4" />
                      Xóa tài khoản
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle>Cài đặt thông báo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Thông báo chương mới</p>
                        <p className="text-sm text-muted-foreground">Nhận thông báo khi có chương mới</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Bật
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Thông báo email</p>
                        <p className="text-sm text-muted-foreground">Nhận thông báo qua email</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Tắt
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
