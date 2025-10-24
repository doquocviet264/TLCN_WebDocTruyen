import { useState, useEffect } from "react";
import axios from "axios";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Check, Edit, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "react-toastify";

export interface Comic {
  id: number;
  title: string;
  author: string;
  status: "In Progress" | "Completed" | "On Hold";
  description: string;
  image: string;
  lastUpdate: string;
  genres: string[];
  followers: number;
  views: number;
  rating: number;
  aliases: string[];
}

export const STATUS_LABELS: Record<string, string> = {
  "In Progress": "Đang tiến hành",
  "Completed": "Hoàn thành",
  "On Hold": "Tạm ngưng",
};

interface ComicFormDialogProps {
  mode: "add" | "edit";
  comic?: Comic;
  onSave: (comic: Comic) => void;
}
interface Genre {
  id: number;
  name: string;
}
type ApiOk<T> = { success: true; data: T; meta?: unknown };
export default function ComicFormDialog({ mode, comic, onSave }: ComicFormDialogProps) {
  const [form, setForm] = useState<Comic>(
    comic || {
      id: 0, title: "", author: "", status: "In Progress",
      description: "", image: "", lastUpdate: "", genres: [],
      followers: 0, views: 0, rating: 0, aliases: []
    }
  );
  const [newAlias, setNewAlias] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Lấy genres từ BE
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await axios.get<ApiOk<Genre[]>>(
          `${import.meta.env.VITE_API_URL}/genres`
        );

        if (res.data?.success && Array.isArray(res.data.data)) {
          // Lấy danh sách tên thể loại
          const list = res.data.data.map((g) => g.name).filter(Boolean);
          setGenres(list);
        } else {
          setGenres([]);
        }
      } catch (error: any) {
        const msg =
          error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          "Lỗi khi lấy thể loại";
        toast.error(msg);
        setGenres([]);
      }
    };

    fetchGenres();
  }, []);

  // Upload ảnh base64
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setForm({ ...form, image: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const addAlias = () => {
    if (newAlias.trim() && !form.aliases.includes(newAlias.trim())) {
      setForm({ ...form, aliases: [...form.aliases, newAlias.trim()] });
      setNewAlias("");
    }
  };
  const removeAlias = (alias: string) =>
    setForm({ ...form, aliases: form.aliases.filter((a) => a !== alias) });
  const toggleGenre = (genre: string) =>
    setForm({
      ...form,
      genres: form.genres.includes(genre)
        ? form.genres.filter((g) => g !== genre)
        : [...form.genres, genre],
    });

  const normalizeComic = (beComic: any): Comic => ({
    id: beComic.comicId,
    title: beComic.title,
    author: beComic.author,
    status: beComic.status,
    description: beComic.description,
    image: beComic.coverImage,
    lastUpdate: beComic.updatedAt,
    genres: beComic.Genres ? beComic.Genres.map((g: any) => g.name) : [],
    aliases: beComic.AlternateNames ? beComic.AlternateNames.map((a: any) => a.name) : [],
    followers: beComic.followers || 0,
    views: beComic.views || 0,
    rating: beComic.rating || 0,
  });

  const handleSave = async () => {
    if (form.image.trim() === "") {
        toast.error("Vui lòng tải lên ảnh bìa!");
        return;
    }
    if (form.title.trim() === "") {
        toast.error("Vui lòng nhập tên truyện!");
        return;
    }
    if (form.genres.length === 0) {
        toast.error("Vui lòng chọn ít nhất một thể loại!");
        return;
    }
    if (form.description.trim() === "") {
        toast.error("Vui lòng nhập mô tả truyện!");
        return;
    }
    setLoading(true);
    try {
      const url = mode === "add"
        ? `${import.meta.env.VITE_API_URL}/admin/comics`
        : `${import.meta.env.VITE_API_URL}/admin/comics/${form.id}`;

      const method = mode === "add" ? axios.post : axios.put;
      const res = await method<ApiOk<Comic>>(url, {
        title: form.title,
        author: form.author,
        status: form.status,
        description: form.description,
        image: form.image,
        genres: form.genres,   // string[]
        aliases: form.aliases, // string[]
      }, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

      toast.success(mode === "add" ? "Thêm truyện thành công!" : "Cập nhật truyện thành công!");
      const saved = res.data.data;
      onSave(saved);
      setForm({
      id: 0,
      title: "",
      author: "",
      status: "In Progress",
      description: "",
      image: "",
      lastUpdate: "",
      genres: [],
      followers: 0,
      views: 0,
      rating: 0,
      aliases: [],
    });
    setNewAlias("");
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(mode === "add" ? "Thêm truyện thất bại!" : "Cập nhật truyện thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => setOpen(o)}>

      <DialogTrigger asChild>
        {mode === "add" ? (
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Thêm truyện
          </Button>
        ) : (
          <Button variant="outline" size="icon" title="Sửa">
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[100vh] overflow-y-auto" style={{ maxWidth: '56rem' }}>
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Thêm truyện Mới" : "Chỉnh sửa truyện"}</DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Điền thông tin truyện mới để đăng tải"
              : "Thay đổi ảnh bìa, tên, tác giả, thể loại, trạng thái, mô tả và tên phụ."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload ảnh */}
          <div>
            <label className="block text-sm font-medium mb-1">Ảnh bìa</label>
            {form.image && (
              <img src={form.image} alt="Preview" className="w-32 h-44 rounded-md object-cover mb-2 border" />
            )}
            <Input type="file" accept="image/*" onChange={handleUpload} />
          </div>

          {/* Tên Comic */}
          <div>
            <label className="block text-sm font-medium mb-1">Tên truyện</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          {/* Tác giả */}
          <div>
            <label className="block text-sm font-medium mb-1">Tác giả</label>
            <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
          </div>


          {/* Alias */}
          <div>
            <label className="block text-sm font-medium mb-1">Tên khác</label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Nhập tên khác..."
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAlias())}
              />
              <Button type="button" onClick={addAlias} size="sm" className="gap-1">
                <Plus className="h-4 w-4" /> Thêm
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.aliases.map((alias) => (
                <Badge key={alias} variant="secondary" className="flex items-center gap-1">
                  {alias}
                  <button
                    type="button"
                    onClick={() => removeAlias(alias)}
                    className="ml-1 text-red-500 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Trạng thái */}
          <div>
            <label className="block text-sm font-medium mb-1">Trạng thái</label>
            <Select
              value={form.status}
              onValueChange={(value) => setForm({ ...form, status: value as Comic["status"] })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Thể loại */}
          <div>
            <label className="block text-sm font-medium mb-1">Thể loại</label>
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => {
                const selected = form.genres.includes(genre);
                return (
                  <Button
                    key={genre}
                    type="button"
                    size="sm"
                    variant={selected ? "default" : "outline"}
                    onClick={() => toggleGenre(genre)}
                    className="gap-1"
                  >
                    {selected && <Check className="h-3 w-3" />}
                    {genre}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-medium mb-1">Mô tả</label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Huỷ
            </Button>

            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Đang lưu..." : mode === "add" ? "Lưu truyện mới" : "Lưu thay đổi"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
