import { useEffect, useState } from "react";
import axios from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Camera, BookOpen, Settings, CircleDollarSign } from "lucide-react";

import { ProfileInfoTab } from "../components/ProfilePage/InfoTab";
import { ProfileActivityTab } from "../components/ProfilePage/ActivityTab";
import { ProfileGoldTab } from "../components/ProfilePage/GoldTab";
import { ProfileSettingsTab } from "../components/ProfilePage/SettingsTab";
import { UserProfile, Comic, Transaction, Quest } from "../components/ProfilePage/types";

// Type dữ liệu API
interface ApiUserResponse {
  userId: number;
  username: string;
  email: string;
  gender: string;
  birthday: string;
  avatar: string | null;
  joinDate: string;
  updatedAt: string;
  totalRead: number;
  favorites: number;
  comments: number;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"info" | "activity" | "gold" | "settings">("info");
  const [user, setUser] = useState<UserProfile | null>(null);

  const mockDefaults: Pick<UserProfile, "levelName" | "experience" | "goldCoins"> = {
    levelName: "Độc giả VIP",
    experience: { current: 750, max: 1000 },
    goldCoins: 1250,
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Dùng generic <ApiUserResponse> để TypeScript biết type res.data
    axios.get<ApiUserResponse>("http://localhost:3000/api/user/profile", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      const apiUser = res.data;

      const mergedUser: UserProfile = {
        name: apiUser.username ?? "Người dùng",
        email: apiUser.email ?? "unknown@email.com",
        gender: apiUser.gender,
        birthday: apiUser.birthday ?? "1970-01-01",
        avatar: apiUser.avatar || "/diverse-user-avatars.png",
        joinDate: apiUser.joinDate,
        totalRead: apiUser.totalRead ?? 0,
        favorites: apiUser.favorites ?? 0,
        comments: apiUser.comments ?? 0,
        ...mockDefaults, // các thuộc tính mock luôn có
      };

      setUser(mergedUser);
    })
    .catch(err => console.error("Lỗi lấy profile:", err));
  }, []);

  if (!user) return <div className="flex items-center justify-center h-screen">Đang tải...</div>;

  const readingList: Comic[] = [
    { id: 1, title: "One Piece", cover: "https://placehold.co/128x160/232323/FFF?text=OP", status: "Đang đọc", progress: "Chương 1095/1095", lastRead: "2 giờ trước" },
    { id: 2, title: "Naruto", cover: "https://placehold.co/128x160/232323/FFF?text=NT", status: "Hoàn thành", progress: "Chương 700/700", lastRead: "1 tuần trước" },
    { id: 3, title: "Attack on Titan", cover: "https://placehold.co/128x160/232323/FFF?text=AOT", status: "Yêu thích", progress: "Chương 139/139", lastRead: "3 ngày trước" },
  ];

  const transactionHistory: Transaction[] = [
    { id: 1, description: "Điểm danh hàng ngày", amount: 10, date: "2023-10-27" },
    { id: 2, description: "Mở khóa chương VIP", amount: -50, date: "2023-10-26" },
    { id: 3, description: "Hoàn thành nhiệm vụ đọc 5 chương", amount: 100, date: "2023-10-26" },
    { id: 4, description: "Nạp đồng vàng", amount: 1000, date: "2023-10-25" },
  ];

  const dailyCheckin = Array.from({ length: 7 }, (_, i) => ({ day: i + 1, checked: i < 4 }));

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
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Button size="sm" variant="secondary" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0">
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
                      <div className="w-full bg-secondary rounded-full h-2.5">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: `${(user.experience.current / user.experience.max) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Tabs */}
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

                {/* Desktop Nav */}
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
            {activeTab === "info" && <ProfileInfoTab user={user} />}
            {activeTab === "activity" && <ProfileActivityTab readingList={readingList} />}
            {activeTab === "gold" && (
              <ProfileGoldTab 
                goldCoins={user.goldCoins}
                dailyCheckin={dailyCheckin}
                quests={quests}
                transactionHistory={transactionHistory}
              />
            )}
            {activeTab === "settings" && <ProfileSettingsTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
