import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserProfile } from "./types"
import { useState } from "react"
import { toast } from "react-toastify"

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserProfile
  onUpdate: (user: UserProfile) => void
}

export function EditProfileDialog({ open, onOpenChange, user, onUpdate }: EditProfileDialogProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    gender: user.gender || '',
    birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const response = await fetch('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          username: formData.name,
          gender: formData.gender,
          birthday: formData.birthday
        })
      })
      
      if (response.ok) {
        const updatedUser = await response.json()
        onUpdate(updatedUser.user)
        onOpenChange(false)
        toast.success("Cập nhật thông tin cá nhân thành công 🎉")
      } else {
        const error = await response.json()
        toast.error(error.message || "Cập nhật thất bại")
      }
    } catch (error) {
      toast.error("Không thể cập nhật thông tin")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa thông tin cá nhân</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên người dùng</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Giới tính</Label>
            <Select 
              value={formData.gender} 
              onValueChange={(value) => setFormData({...formData, gender: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn giới tính" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Nam</SelectItem>
                <SelectItem value="female">Nữ</SelectItem>
                <SelectItem value="other">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthday">Sinh nhật</Label>
            <Input
              id="birthday"
              type="date"
              value={formData.birthday}
              onChange={(e) => setFormData({...formData, birthday: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
