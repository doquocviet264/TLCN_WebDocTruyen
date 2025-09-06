import { Star, MessageCircle, Heart, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import poster from "./poster.png";

const newlyUpdatedComics = [
  {
    id: 1,
    title: "Solo Leveling",
    author: "Chugong",
    image: poster,
    rating: 9.2,
    comments: 1234,
    hearts: 5678,
    chapters: [
      { number: 180, time: "2 giờ trước" },
      { number: 179, time: "1 ngày trước" },
      { number: 178, time: "3 ngày trước" },
    ],
  },
  {
    id: 2,
    title: "Tower of God",
    author: "SIU",
    image: poster,
    rating: 8.8,
    comments: 987,
    hearts: 4321,
    chapters: [
      { number: 590, time: "5 giờ trước" },
      { number: 589, time: "1 tuần trước" },
      { number: 588, time: "2 tuần trước" },
    ],
  },
  {
    id: 3,
    title: "The God of High School",
    author: "Yongje Park",
    image: poster,
    rating: 8.5,
    comments: 756,
    hearts: 3210,
    chapters: [
      { number: 520, time: "1 ngày trước" },
      { number: 519, time: "1 tuần trước" },
      { number: 518, time: "2 tuần trước" },
    ],
  },
  {
    id: 4,
    title: "Noblesse",
    author: "Jeho Son",
    image: poster,
    rating: 9.0,
    comments: 654,
    hearts: 2987,
    chapters: [
      { number: 544, time: "3 giờ trước" },
      { number: 543, time: "2 ngày trước" },
      { number: 542, time: "5 ngày trước" },
    ],
  },
];

export function NewlyUpdated() {
  return (
    <section className="space-y-6 px-4 sm:px-6 lg:px-8">
      <h2 className="text-2xl sm:text-3xl font-montserrat font-bold text-foreground">
        Truyện mới cập nhật
      </h2>

      <div className="flex flex-wrap justify-start gap-4 max-w-[1280px] mx-auto">
        {newlyUpdatedComics.map((comic) => (
          <Card
            key={comic.id}
            className="overflow-hidden bg-card/90 backdrop-blur-sm border-border/40 hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col flex-grow basis-[calc(50%-1rem)] md:basis-[calc(33.33%-1rem)] lg:basis-[calc(25%-1rem)]"
            style={{ maxWidth: 'calc(0.667 * 340px)', minWidth: '140px' }}
          >
            <div className="relative w-full" style={{ paddingTop: '150%' }}>
              <img
                src={comic.image || "/placeholder.svg"}
                alt={comic.title}
                className="absolute top-0 left-0 w-full h-full object-cover rounded-t-lg transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-lg" />
            </div>

            <div className="p-3 flex flex-col flex-1 space-y-2">
              <div>
                <h3 className="font-semibold text-sm sm:text-base group-hover:text-primary transition-colors line-clamp-1">
                  {comic.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Tác giả: {comic.author}
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span>{comic.rating}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-blue-500">
                    <MessageCircle className="h-4 w-4" />
                    <span>{comic.comments}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-red-500">
                    <Heart className="h-4 w-4 fill-current" />
                    <span>{comic.hearts}</span>
                  </div>
                </div>
              </div>

              {/* Latest Chapters */}
              <div className="space-y-1">
                {comic.chapters.slice(0, 2).map((chapter) => (
                  <div
                    key={chapter.number}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-muted-foreground hover:text-primary cursor-pointer transition-colors truncate max-w-[90px]">
                      Chương {chapter.number}
                    </span>
                    <div className="flex items-center space-x-1 text-muted-foreground flex-shrink-0">
                      <Clock className="h-3 w-3" />
                      <span>{chapter.time}</span>
                    </div>
                  </div>
                ))}
                {comic.chapters[2] && (
                  <div className="hidden sm:flex items-center justify-between text-xs">
                    <span className="text-muted-foreground hover:text-primary cursor-pointer transition-colors truncate max-w-[90px]">
                      Chương {comic.chapters[2].number}
                    </span>
                    <div className="flex items-center space-x-1 text-muted-foreground flex-shrink-0">
                      <Clock className="h-3 w-3" />
                      <span>{comic.chapters[2].time}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default NewlyUpdated;