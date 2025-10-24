import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Edit, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";

export interface ChapterImageDTO {
  id?: number;
  url: string;
  pageNumber: number;
}

export interface ChapterDTO {
  id?: number;
  number: number;
  title: string;
  cost: number;
  isLocked?: boolean;
  images: ChapterImageDTO[];
  updatedAt?: string;
  publishDate?: string;
  views?: number;
}

interface ChapterDialogProps {
  mode: "add" | "edit";
  comicId: number;
  chapter?: ChapterDTO;
  onSave: (chapter: ChapterDTO) => void;
}

type ApiOk<T> = { success: true; data: T; meta?: unknown };

export default function ChapterDialog({ mode, comicId, chapter, onSave }: ChapterDialogProps) {
  const isEdit = mode === "edit";

  const [open, setOpen] = useState(false);
  const [data, setData] = useState<ChapterDTO>(
    chapter || { number: 1, title: "", cost: 0, isLocked: false, images: [] }
  );
  const [saving, setSaving] = useState(false);

  const getToken = () => localStorage.getItem("token");

  // Reset form khi đóng dialog (Add)
  useEffect(() => {
    if (!open && !isEdit) {
      setData({ number: 1, title: "", cost: 0, isLocked: false, images: [] });
    }
  }, [open, isEdit]);

  // Đồng bộ state khi Edit + mở dialog
  useEffect(() => {
    if (open && isEdit && chapter) {
      setData({
      ...chapter,
      number: parseFloat(String(chapter.number)) || 0,
      cost: Number(chapter.cost) || 0,          
    });
    }
  }, [open, isEdit, chapter]);

  // === Upload ảnh ===
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.target;
    const files = inputEl.files;
    if (!files) return;

    const nextImages: ChapterImageDTO[] = [...data.images];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onloadend = () => {
        nextImages.push({ url: String(reader.result), pageNumber: nextImages.length + 1 });
        setData((prev) => ({ ...prev, images: [...nextImages] }));
      };
      reader.readAsDataURL(file);
    }
    inputEl.value = "";
  };

  // === Xóa ảnh ===
  const removeImage = (pageNumber: number) => {
    const filtered = data.images.filter((img) => img.pageNumber !== pageNumber);
    const reindexed = filtered.map((img, idx) => ({ ...img, pageNumber: idx + 1 }));
    setData({ ...data, images: reindexed });
  };

  // === Di chuyển ảnh (↑ ↓) ===
  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= data.images.length) return;
    const next = [...data.images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const reindexed = next.map((img, idx) => ({ ...img, pageNumber: idx + 1 }));
    setData({ ...data, images: reindexed });
  };

  // Validate cơ bản
  const validate = () => {
    if (!Number.isFinite(data.number) || data.number < 0) return "Số chương phải >= 0!";
    if (data.isLocked && (!Number.isFinite(data.cost) || data.cost < 0)) return "Giá không hợp lệ!";
    if (data.images.length === 0) return "Vui lòng thêm ít nhất 1 ảnh!";
    return null;
  };

  // === Lưu chương ===
  const handleSave = async () => {
    const err = validate();
    if (err) return toast.error(err);

    try {
      setSaving(true);

      const payload = {
        title: data.title,
        chapterNumber: data.number, 
        cost: data.isLocked ? Number(data.cost) : 0,
        isLocked: !!data.isLocked,
        images: data.images.map((img, idx) => ({
          id: img.id,        
          imageUrl: img.url,
          pageNumber: idx + 1,
        })),
      };

      const API_BASE = import.meta.env.VITE_API_URL || "";
      const url = isEdit
        ? `${API_BASE}/admin/chapters/${data.id}`
        : `${API_BASE}/admin/comics/${comicId}/chapters`;
      const method = isEdit ? "PUT" : "POST";

      const token = getToken();
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || `HTTP ${res.status}`);
      }

      // API mới: { success, data }
      const result: ApiOk<ChapterDTO> | any = await res.json();
      const saved: ChapterDTO = result?.data ?? result?.chapter ?? { ...data };
      onSave(saved);

      toast.success(isEdit ? "Cập nhật chương thành công!" : "Thêm chương thành công!");
      setOpen(false); // đóng dialog sau khi thành công
    } catch (e: any) {
      toast.error(e?.message || "Có lỗi xảy ra khi lưu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="outline" size="icon" title="Sửa" onClick={() => setOpen(true)}>
            <Edit className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="gap-2" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Thêm chương
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" style={{ maxWidth: '56rem' }}>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Chỉnh sửa chương" : "Thêm chương mới"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Thay đổi số chương, tiêu đề, giá và hình ảnh."
              : "Điền thông tin để thêm chương mới."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Số chương */}
          <div>
            <Label>Số chương</Label>
            <Input
              type="number"
              step="0.1"
              value={data.number}
              onChange={(e) => setData({ ...data, number: parseFloat(e.target.value) || 0 })}
            />
          </div>

          {/* Tiêu đề */}
          <div>
            <Label>Tiêu đề</Label>
            <Input value={data.title} onChange={(e) => setData({ ...data, title: e.target.value })} />
          </div>

          {/* Khóa chương */}
          <div className="flex items-center gap-2">
            <Switch
              checked={!!data.isLocked}
              onCheckedChange={(val) => setData({ ...data, isLocked: val, cost: val ? data.cost : 0 })}
            />
            <Label>Khóa chương (phải mua)</Label>
          </div>

          {/* Giá */}
          <div>
            <Label>Giá</Label>
            <Input
              type="number"
              value={data.cost}
              disabled={!data.isLocked}
              onChange={(e) => setData({ ...data, cost: Number(e.target.value) })}
            />
          </div>

          {/* Ảnh chương */}
          <div>
            <Label>Ảnh chương</Label>
            <Input type="file" multiple accept="image/*" onChange={handleImageUpload} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              {data.images.map((img, idx) => (
                <div key={`${img.id ?? "new"}-${idx}`} className="relative border rounded p-1">
                  <img src={img.url} alt="" className="w-full h-40 object-cover rounded" />
                  <div className="absolute left-1 top-1 text-xs bg-black/60 text-white px-1 rounded">
                    {img.pageNumber}
                  </div>
                  <div className="absolute right-1 top-1 flex gap-1">
                    <button
                      onClick={() => moveImage(idx, idx - 1)}
                      className="bg-white text-xs px-2 py-0.5 rounded border"
                      title="Lên"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveImage(idx, idx + 1)}
                      className="bg-white text-xs px-2 py-0.5 rounded border"
                      title="Xuống"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => removeImage(img.pageNumber)}
                      className="bg-red-500 text-white text-xs px-2 py-0.5 rounded"
                      title="Xóa ảnh"
                    >
                      X
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo chương"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
