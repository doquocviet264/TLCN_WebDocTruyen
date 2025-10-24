import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Mail, Calendar, Camera, Lock, Edit3, Gift, BookOpen, Heart, MessageCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { EditProfileDialog } from "./EditProfileDialog"
import { ChangePasswordDialog } from "./ChangePasswordDialog"
import { ChangeAvatarDialog } from "./ChangeAvatarDialog"
import { toast } from "react-toastify"

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
interface ProfileInfoTabProps {
  user: UserProfile
  onUserChange: (u: UserProfile) => void;
}

export function ProfileInfoTab({ user, onUserChange }: ProfileInfoTabProps){
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)

  // Format ngày tháng
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  // Hàm cập nhật thông tin người dùng
  const handleUpdateUser = (updated: UserProfile) => {
    onUserChange(updated);
    toast.success("Thông tin đã được cập nhật")
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"> 
            <User className="h-5 w-5" /> Thông tin cá nhân 
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
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Giới tính</p>
                <p className="font-medium">
                    {user.gender === 'male' ? 'Nam' : 
                    user.gender === 'female' ? 'Nữ' : 
                    user.gender === 'other' ? 'Khác' : 
                    'Chưa cập nhật'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Gift className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Sinh nhật</p>
                <p className="font-medium">{user.birthday ? formatDate(user.birthday) : 'Chưa cập nhật'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Ngày đăng ký</p>
                <p className="font-medium">{formatDate(user.joinDate)}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-4">
            <Button 
              size="sm" 
              className="gap-2" 
              onClick={() => setIsEditDialogOpen(true)}
            > 
              <Edit3 className="h-4 w-4" /> Chỉnh sửa thông tin 
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-2 bg-transparent"
              onClick={() => setIsAvatarDialogOpen(true)}
            > 
              <Camera className="h-4 w-4" /> Thay avatar 
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-2 bg-transparent"
              onClick={() => setIsPasswordDialogOpen(true)}
            > 
              <Lock className="h-4 w-4" /> Đổi mật khẩu 
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

      {/* Dialogs */}
      <EditProfileDialog 
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={user}
        onUpdate={handleUpdateUser}
      />
      
      <ChangePasswordDialog 
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      />
      
      <ChangeAvatarDialog 
        open={isAvatarDialogOpen}
        onOpenChange={setIsAvatarDialogOpen}
        onUpdate={handleUpdateUser}
      />
    </div>
  )
}