import { Card } from "@/components/ui/card"

const readingHistory = [
  {
    id: 1,
    title: "One Piece",
    image: "/one-piece-manga-cover.png",
    lastChapter: 1095,
  },
  {
    id: 2,
    title: "Naruto",
    image: "/generic-ninja-manga-cover.png",
    lastChapter: 700,
  },
  {
    id: 3,
    title: "Jujutsu Kaisen",
    image: "/jjk-manga-cover.png",
    lastChapter: 236,
  },
  {
    id: 4,
    title: "Attack on Titan",
    image: "/aot-manga-cover.png",
    lastChapter: 139,
  },
  // Thêm truyện để test cuộn ngang
  {
    id: 5,
    title: "My Hero Academia",
    image: "/mha-manga-cover.png",
    lastChapter: 420,
  },
];

export function ReadingHistory() {
  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
      <h3 className="font-semibold mb-4">Lịch sử đọc truyện</h3>

      {readingHistory.length > 0 ? (
        // 👇 Container đã được đổi sang FLEXBOX 👇
        <div className="flex space-x-3 overflow-x-auto pb-2">
          {readingHistory.slice(0, 5).map((comic) => (
            // 👇 Item con được thêm class để giữ kích thước 👇
            <div key={comic.id} className="group cursor-pointer flex-shrink-0 w-28">
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2">
                <img
                  src={comic.image || "/placeholder.svg"}
                  alt={comic.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-1 left-1 right-1 p-1 text-white text-xs">
                  <div className="font-medium truncate">{comic.title}</div>
                  <div className="text-xs opacity-80">Ch. {comic.lastChapter}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Không có lịch sử đọc truyện</p>
        </div>
      )}
    </Card>
  )
}

export default ReadingHistory;