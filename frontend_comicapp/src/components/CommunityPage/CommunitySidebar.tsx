import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Props {
  allGenres: string[];
  selectedGenres: string[];
  onGenresChange: (genres: string[]) => void;
}

export function CommunitySidebar({ allGenres, selectedGenres, onGenresChange }: Props) {
  const [genreSearch, setGenreSearch] = useState("");

  const filteredGenres = useMemo(() => {
    const query = genreSearch.trim().toLowerCase();
    if (!query) return allGenres;
    return allGenres.filter((g) => g.toLowerCase().includes(query));
  }, [allGenres, genreSearch]);

  const toggleGenre = (g: string) => {
    onGenresChange(
      selectedGenres.includes(g)
        ? selectedGenres.filter((x) => x !== g)
        : [...selectedGenres, g]
    );
  };

  return (
    <div className="sticky top-20 space-y-4"> {/* top-20 để né header sticky */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Thể loại phổ biến</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={genreSearch}
            onChange={(e) => setGenreSearch(e.target.value)}
            placeholder="Tìm thể loại..."
            className="mb-4"
          />
          <div className="flex flex-wrap gap-2">
            {filteredGenres.map((g) => {
              const active = selectedGenres.includes(g);
              return (
                <Button
                  key={g}
                  variant={active ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => toggleGenre(g)}
                >
                  {g}
                </Button>
              );
            })}
          </div>
          {selectedGenres.length > 0 && (
            <Button
              variant="outline"
              onClick={() => onGenresChange([])}
              className="mt-4 w-full "
            >
              Xoá bộ lọc thể loại
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mẹo</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside text-sm ">
            <li>Dùng tab "Tìm truyện tương tự" để hỏi đề xuất theo thể loại.</li>
            <li>Giữ nội dung ngắn gọn, tập trung ý chính.</li>
            <li>Tối đa 5 ảnh/bài để tối ưu trải nghiệm.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
