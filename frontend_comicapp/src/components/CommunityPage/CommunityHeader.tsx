import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  q: string;
  setQ: (q: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function CommunityHeader({ q, setQ, onClearFilters, hasActiveFilters }: Props) {
  return (
    <header className="">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
        <span className="text-xl font-semibold">Cộng đồng</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 " />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm bài, truyện, từ khoá…"
              className="w-64 pl-9 "
            />
          </div>
          {hasActiveFilters && (
            <Button variant="outline" onClick={onClearFilters}>
              <X className="h-4 w-4 mr-2" />
              Xóa bộ lọc
            </Button>
          )}
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Lọc
          </Button>
        </div>
      </div>
    </header>
  );
}
