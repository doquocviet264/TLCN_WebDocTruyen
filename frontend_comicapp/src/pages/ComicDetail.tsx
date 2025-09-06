import { useParams } from "react-router-dom"
import  ComicHeader  from "../components/Comic/ComicHeader"
import ComicDescription from "../components/Comic/ComicDescription"
import ChapterList from "../components/Comic/ChapterList"
import CommentSection from "../components/Comic/CommentSection"


const comicData = {
  id: "1",
  title: "Solo Leveling",
  author: "Chugong",
  image: "/solo-leveling-manga-cover.png",
  lastUpdate: "2 giờ trước",
  status: "Đang tiến hành",
  genres: ["Hành động", "Phiêu lưu", "Siêu nhiên", "Webtoon"],
  rating: 9.2,
  reviewCount: 15420,
  followers: 234567,
  isFollowing: false,
  description: `Sung Jin-Woo là một thợ săn hạng E yếu nhất thế giới...`,
  chapters: [
    { number: 180, title: "Cuộc chiến cuối cùng", time: "2 giờ trước", isNew: true },
    { number: 179, title: "Sức mạnh thực sự", time: "1 ngày trước", isNew: true },
    { number: 178, title: "Thức tỉnh", time: "3 ngày trước", isNew: true },
    { number: 177, title: "Đối đầu", time: "1 tuần trước", isNew: false },
  ],
}

export default function ComicDetailPage() {
  const { slug } = useParams()  // lấy "ten-truyen" từ url

  // Thực tế bạn sẽ fetch API bằng slug này
  const comic = comicData // tạm mock

  return (
    <div className="min-h-screen flex flex-col">

      <main className="flex-1 container px-4 py-6">
        <div className="space-y-8">
          <ComicHeader comic={comic} />
          <ComicDescription description={comic.description} />
          <ChapterList chapters={comic.chapters} comicId={comic.id} />
          <CommentSection comicId={comic.id} />
        </div>
      </main>

    </div>
  )
}
