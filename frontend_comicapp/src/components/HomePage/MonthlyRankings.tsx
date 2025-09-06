import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

const rankingData = {
  top: [
    { id: 1, title: "Solo Leveling", rank: 1, trend: "up" },
    { id: 2, title: "Tower of God", rank: 2, trend: "same" },
    { id: 3, title: "One Piece", rank: 3, trend: "down" },
    { id: 4, title: "Naruto", rank: 4, trend: "up" },
    { id: 5, title: "Attack on Titan", rank: 5, trend: "same" },
  ],
  favorites: [
    { id: 1, title: "One Piece", rank: 1, trend: "same" },
    { id: 2, title: "Naruto", rank: 2, trend: "up" },
    { id: 3, title: "Solo Leveling", rank: 3, trend: "up" },
    { id: 4, title: "Demon Slayer", rank: 4, trend: "down" },
    { id: 5, title: "My Hero Academia", rank: 5, trend: "same" },
  ],
  new: [
    { id: 1, title: "Chainsaw Man", rank: 1, trend: "new" },
    { id: 2, title: "Jujutsu Kaisen", rank: 2, trend: "new" },
    { id: 3, title: "Spy x Family", rank: 3, trend: "new" },
    { id: 4, title: "Hell's Paradise", rank: 4, trend: "new" },
    { id: 5, title: "Blue Lock", rank: 5, trend: "new" },
  ],
}

export function MonthlyRankings() {
  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
      <h3 className="font-semibold mb-4">Bảng xếp hạng tháng</h3>

      <Tabs defaultValue="top" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="top" className="text-xs">Top</TabsTrigger>
          <TabsTrigger value="favorites" className="text-xs">Yêu thích</TabsTrigger>
          <TabsTrigger value="new" className="text-xs">Mới</TabsTrigger>
        </TabsList>

        {Object.entries(rankingData).map(([key, comics]) => (
          <TabsContent key={key} value={key} className="space-y-2">
            {comics.map((comic) => (
              <div
                key={comic.id}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    comic.rank <= 3
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {comic.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{comic.title}</p>
                </div>
                <Badge
                  variant={
                    comic.trend === "up"
                      ? "default"
                      : comic.trend === "down"
                      ? "destructive"
                      : comic.trend === "new"
                      ? "secondary"
                      : "outline"
                  }
                  className="text-xs"
                >
                  {comic.trend === "up"
                    ? "↑"
                    : comic.trend === "down"
                    ? "↓"
                    : comic.trend === "new"
                    ? "NEW"
                    : "→"}
                </Badge>
              </div>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  )
}
export default MonthlyRankings;