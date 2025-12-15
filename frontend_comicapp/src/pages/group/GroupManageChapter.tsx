import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ComicMainInfo from "@/components/admin/comics/ComicMainInfo";
import ComicChapters from "@/components/admin/comics/ComicChapters";
import ComicHeader from "@/components/admin/comics/ComicHeader";

interface ChapterImage {
  id?: number;               // id ảnh có thể undefined khi mới tạo
  url: string;
  pageNumber: number;
}

interface Chapter {
  id: number;
  number: number;
  title: string;
  views: number;
  cost: number;
  isLocked?: boolean;
  publishDate?: string;
  updatedAt?: string;
  images: ChapterImage[];
}

interface Comic {
  id: number;
  slug: string;
  title: string;
  author: string;
  image: string;
  lastUpdate?: string;
  status: string;
  description: string;
  genres: string[];
  rating: number;
  followers: number;
  chapters: Chapter[];
  aliases: string[];
  createdAt: string;
  updatedAt: string;
}

type ApiOk<T> = { success: true; data: T; meta?: unknown };

export default function ComicDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [comic, setComic] = useState<Comic | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchComic = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get<ApiOk<Comic>>(
        `${import.meta.env.VITE_API_URL}/admin/comics/${id}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setComic(res.data.data)
    } catch (error) {
      console.error("Lỗi khi lấy comic detail:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchComic();
  }, [id]);

  if (loading) return <p className="p-4">Đang tải dữ liệu...</p>;
  if (!comic) return <p className="p-4">Không tìm thấy truyện</p>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
      </Button>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <ComicHeader cover={comic.image} title={comic.title} />
        <div className="space-y-6">
          <ComicMainInfo
            title={comic.title}
            author={comic.author}
            createdAt={comic.createdAt}
            updatedAt={comic.updatedAt}
            status={comic.status}
            description={comic.description}
            genres={comic.genres}
            rating={comic.rating}
            chapters={comic.chapters?.length ?? 0}
            aliases={comic.aliases}
            statusColors={{
              "In Progress": "bg-green-100 text-green-800",
              "Completed": "bg-blue-100 text-blue-800",
              "On Hold": "bg-yellow-100 text-yellow-800",
            }}
            statusLabels={{
              "In Progress": "Đang tiến hành",
              "Completed": "Hoàn thành",
              "On Hold": "Tạm ngưng",
            }}
          />
        </div>
      </div>

      <ComicChapters
        comicId={comic.id}
        chapters={comic.chapters}
        refreshList={fetchComic}
        onDelete={(chapterId) =>
          axios
            .delete(`${import.meta.env.VITE_API_URL}/admin/chapters/${chapterId}`, {
              headers: (() => {
                const token = localStorage.getItem("token");
                return token ? { Authorization: `Bearer ${token}` } : {};
              })(),
            })
            .then(() => fetchComic())
            .catch((err) => console.error("Lỗi khi xóa chương:", err))
        }
      />
    </div>
  );
}
