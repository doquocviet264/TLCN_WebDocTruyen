import { useState } from "react"
import { Clock, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Link } from "react-router-dom"

interface Chapter {
  number: number
  title: string
  time: string
  isNew: boolean
}

interface ChapterListProps {
  chapters: Chapter[]
  comicId: string
}

export function ChapterList({ chapters, comicId }: ChapterListProps) {
  const [showAll, setShowAll] = useState(false)
  const initialDisplayCount = 10

  const displayedChapters = showAll ? chapters : chapters.slice(0, initialDisplayCount)
  const hasMoreChapters = chapters.length > initialDisplayCount

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-montserrat font-bold">Danh sách chương</h2>
        <span className="text-sm text-muted-foreground">{chapters.length} chương</span>
      </div>

      <div className="space-y-2">
        {displayedChapters.map((chapter) => (
          <Link
            key={chapter.number}
            to={`/comic/${comicId}/chapter/${chapter.number}`}
            className="block"
          >
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm group-hover:text-primary transition-colors">
                    Chương {chapter.number}
                  </span>
                  {chapter.isNew && (
                    <Badge variant="destructive" className="text-xs px-2 py-0">
                      Mới
                    </Badge>
                  )}
                </div>
                <span className="text-sm text-muted-foreground truncate">{chapter.title}</span>
              </div>

              <div className="flex items-center space-x-4 text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Eye className="h-3 w-3" />
                  <span className="text-xs">1.2k</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs whitespace-nowrap">{chapter.time}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {hasMoreChapters && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={() => setShowAll(!showAll)}
            className="flex items-center space-x-2"
          >
            <span>{showAll ? "Thu gọn" : "Xem thêm"}</span>
            <span className="text-xs text-muted-foreground">
              {showAll ? "" : `(${chapters.length - initialDisplayCount} chương)`}
            </span>
          </Button>
        </div>
      )}
    </Card>
  )
}
export default ChapterList;