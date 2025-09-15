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
  CircleDollarSign,
  ListChecks,
  CalendarCheck,
  Target,
  CheckCircle,
  TrendingUp,
  Gift
} from "lucide-react"
import { Progress } from "@/components/ui/progress" // Giả sử bạn có component này

interface UserProfile {
  name: string
  email: string
  gender: string
  birthday: string
  avatar: string
  joinDate: string
  levelName: string
  experience: {
    current: number
    max: number
  }
  totalRead: number
  favorites: number
  comments: number
  goldCoins: number
}

interface Comic {
  id: number
  title: string
  cover: string
  status: string
  progress: string
  lastRead: string
}

interface Transaction {
    id: number;
    description: string;
    amount: number;
    date: string;
}

interface Quest {
    id: number;
    title: string;
    reward: number;
    progress: number;
    target: number;
}

// Giả lập các components UI chưa có
const UiProgress = ({ value }: { value: number }) => (
  <div className="w-full bg-secondary rounded-full h-2.5">
    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${value}%` }}></div>
  </div>
);


export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"info" | "activity" | "gold" | "settings">("info")

  // Mock user data updated
  const user: UserProfile = {
    name: "Nguyễn Văn A",
    email: "nguyenvana@email.com",
    gender: "Nam",
    birthday: "01/01/1995",
    avatar: "/diverse-user-avatars.png",
    joinDate: "15/03/2023",
    levelName: "Độc giả VIP",
    experience: {
        current: 750,
        max: 1000
    },
    totalRead: 156,
    favorites: 23,
    comments: 89,
    goldCoins: 1250,
  }

  const readingList: Comic[] = [
    {
      id: 1,
      title: "One Piece",
      cover: "https://placehold.co/128x160/232323/FFF?text=OP",
      status: "Đang đọc",
      progress: "Chương 1095/1095",
      lastRead: "2 giờ trước",
    },
    {
      id: 2,
      title: "Naruto",
      cover: "https://placehold.co/128x160/232323/FFF?text=NT",
      status: "Hoàn thành",
      progress: "Chương 700/700",
      lastRead: "1 tuần trước",
    },
    {
      id: 3,
      title: "Attack on Titan",
      cover: "https://placehold.co/128x160/232323/FFF?text=AOT",
      status: "Yêu thích",
      progress: "Chương 139/139",
      lastRead: "3 ngày trước",
    },
  ]

  const transactionHistory: Transaction[] = [
    { id: 1, description: "Điểm danh hàng ngày", amount: 10, date: "2023-10-27" },
    { id: 2, description: "Mở khóa chương VIP", amount: -50, date: "2023-10-26" },
    { id: 3, description: "Hoàn thành nhiệm vụ đọc 5 chương", amount: 100, date: "2023-10-26" },
    { id: 4, description: "Nạp đồng vàng", amount: 1000, date: "2023-10-25" },
  ];

  const dailyCheckin = Array.from({ length: 7 }, (_, i) => ({
      day: i + 1,
      checked: i < 4, // Giả sử đã điểm danh 4 ngày
  }));

  const quests: Quest[] = [
    { id: 1, title: "Đọc 5 chương truyện bất kỳ", reward: 100, progress: 3, target: 5 },
    { id: 2, title: "Bình luận 3 lần", reward: 50, progress: 3, target: 3 },
    { id: 3, title: "Đăng nhập 7 ngày liên tiếp", reward: 200, progress: 4, target: 7 },
  ];

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
                    <Avatar className="h-24 w-24 border-2 border-primary">
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
                  <div className="text-center w-full">
                    <h2 className="text-xl font-bold">{user.name}</h2>
                      <div className="w-full mt-2">
                         <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>{user.levelName}</span>
                            <span>{user.experience.current} / {user.experience.max} EXP</span>
                         </div>
                         <UiProgress value={(user.experience.current / user.experience.max) * 100} />
                      </div>
                  </div>
                </div>

                {/* Navigation Tabs for Mobile */}
                <div className="mt-6 lg:hidden">
                  <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as typeof activeTab)}>
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="info">Thông tin</TabsTrigger>
                      <TabsTrigger value="activity">Hoạt động</TabsTrigger>
                        <TabsTrigger value="gold">Đồng vàng</TabsTrigger>
                      <TabsTrigger value="settings">Cài đặt</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden lg:block mt-6 space-y-2">
                  <Button variant={activeTab === "info" ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActiveTab("info")}>
                    <User className="mr-2 h-4 w-4" /> Thông tin cá nhân
                  </Button>
                  <Button variant={activeTab === "activity" ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActiveTab("activity")}>
                    <BookOpen className="mr-2 h-4 w-4" /> Hoạt động đọc truyện
                  </Button>
                    <Button variant={activeTab === "gold" ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActiveTab("gold")}>
                    <CircleDollarSign className="mr-2 h-4 w-4" /> Đồng vàng
                  </Button>
                  <Button variant={activeTab === "settings" ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActiveTab("settings")}>
                    <Settings className="mr-2 h-4 w-4" /> Cài đặt
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
                    <CardTitle className="flex items-center gap-2"> <User className="h-5 w-5" /> Thông tin cá nhân </CardTitle>
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
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Giới tính</p>
                          <p className="font-medium">{user.gender}</p>
                        </div>
                      </div>
                        <div className="flex items-center gap-3">
                        <Gift className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Sinh nhật</p>
                          <p className="font-medium">{user.birthday}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Ngày đăng ký</p>
                          <p className="font-medium">{user.joinDate}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-4">
                      <Button size="sm" className="gap-2"> <Edit3 className="h-4 w-4" /> Chỉnh sửa thông tin </Button>
                      <Button size="sm" variant="outline" className="gap-2 bg-transparent"> <Camera className="h-4 w-4" /> Thay avatar </Button>
                      <Button size="sm" variant="outline" className="gap-2 bg-transparent"> <Lock className="h-4 w-4" /> Đổi mật khẩu </Button>
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

            {/* Gold Coins Tab */}
            {activeTab === "gold" && (
              <div className="space-y-6">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CircleDollarSign className="h-5 w-5 text-yellow-400"/>
                        Số dư Đồng vàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <p className="text-3xl font-bold text-yellow-400">{user.goldCoins.toLocaleString()}</p>
                    <Button>Nạp thêm</Button>
                  </CardContent>
                </Card>
                
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarCheck className="h-5 w-5"/>
                            Điểm danh hàng ngày
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-7 gap-2 text-center">
                        {dailyCheckin.map(item => (
                            <div key={item.day} className={`p-2 rounded-lg border ${item.checked ? 'bg-primary/20 border-primary' : 'bg-background/50 border-border/50'}`}>
                                <p className="text-sm">Ngày {item.day}</p>
                                {item.checked ? (
                                    <CheckCircle className="h-6 w-6 mx-auto mt-1 text-primary"/>
                                ) : (
                                    <div className="h-6 w-6 mx-auto mt-1" />
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5"/>Nhiệm vụ</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {quests.map(quest => (
                                <div key={quest.id}>
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-sm font-medium">{quest.title}</p>
                                        <p className="text-sm text-yellow-400">+{quest.reward} <CircleDollarSign className="inline h-4 w-4"/></p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <UiProgress value={(quest.progress / quest.target) * 100}/>
                                        <Button size="sm" disabled={quest.progress < quest.target}>
                                            {quest.progress >= quest.target ? "Nhận" : `${quest.progress}/${quest.target}`}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5"/>Lịch sử giao dịch</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3 max-h-60 overflow-y-auto">
                            {transactionHistory.map(tx => (
                                <li key={tx.id} className="flex justify-between items-center text-sm">
                                <div>
                                    <p>{tx.description}</p>
                                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                                </div>
                                <p className={`font-semibold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                                </p>
                                </li>
                            ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

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

