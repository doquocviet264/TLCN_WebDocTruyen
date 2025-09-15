import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, Lock, Bell, LogOut, Trash2 } from "lucide-react"

export function ProfileSettingsTab() {
  return (
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
  )
}