import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserProfile } from "./types"
import { useState } from "react"
import { toast } from "react-toastify"

interface ChangeAvatarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (user: UserProfile) => void
}

export function ChangeAvatarDialog({ open, onOpenChange, onUpdate }: ChangeAvatarDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setSelectedFile(file)
    
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    
    setIsLoading(true)
    
    try {
      const formData = new FormData()
      formData.append('avatar', selectedFile)
      
      const response = await fetch('http://localhost:3000/api/user/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })
      
      if (response.ok) {
        const result = await response.json()
        onUpdate(result.user)
        onOpenChange(false)
        toast.success("Avatar đã được cập nhật")
      } else {
        throw new Error('Upload thất bại')
      }
    } catch (error) {
      toast.error("Không thể tải lên avatar") 
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thay đổi avatar</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col items-center">
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-32 h-32 rounded-full object-cover mb-4"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mb-4">
                <span className="text-muted-foreground">Chưa có ảnh</span>
              </div>
            )}
            
            <Label htmlFor="avatar-upload" className="cursor-pointer">
              <Button asChild variant="outline">
                <span>Chọn ảnh</span>
              </Button>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </Label>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || isLoading}
            >
              {isLoading ? "Đang tải lên..." : "Cập nhật"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
