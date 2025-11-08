import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, X } from "lucide-react";

type ComicLite = { id: number; title: string; image: string; lastChapter?: number | string };

type ApiOk<T> = { success: true; data: T; meta?: unknown };
type SearchData = {
  comics: ComicLite[];
  totalComics: number;
  totalPages: number;
  currentPage: number;
};

interface Props {
  placeholder?: string;
  value?: ComicLite | null;                // truyện đã chọn (nếu có)
  onSelect: (c: ComicLite) => void;        // chọn một truyện
  onClear?: () => void;                    // clear đã chọn
}

export default function ComicSearchBox({ placeholder = "Tìm truyện…", value, onSelect, onClear }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ComicLite[]>([]);
  const debounceRef = useRef<number | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const performSearch = async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: q.trim(), page: "1", limit: "8" });
      const res = await fetch(`${import.meta.env.VITE_API_URL}/comics/search?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json?.success) {
        const payload: SearchData = json.data;
        setResults(payload.comics || []);
        setOpen(true);
      } else {
        setResults([]);
        setOpen(false);
      }
    } catch {
      setResults([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const onChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => performSearch(val), 300);
  };

  // click ra ngoài để đóng dropdown
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // nếu đã chọn value thì hiển thị title trong input (đọc-only)
  const hasSelected = !!value;

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          className="pl-10 pr-10"
          value={hasSelected ? value!.title : query}
          readOnly={hasSelected}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => query && setOpen(true)}
        />
        {(hasSelected || query) && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setQuery("");
              setResults([]);
              setOpen(false);
              onClear?.();
            }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <Card className="absolute z-50 mt-2 w-full border shadow-lg">
          <div className="max-h-80 overflow-auto">
            {loading ? (
              <div className="p-3 text-sm text-muted-foreground">Đang tìm…</div>
            ) : results.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">Không có kết quả</div>
            ) : (
              results.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onSelect(c);
                    setOpen(false);
                    setQuery("");
                    setResults([]);
                  }}
                  className="flex w-full items-center gap-3 p-2 hover:bg-accent text-left"
                >
                  <img
                    src={c.image || "/placeholder.svg"}
                    alt={c.title}
                    className="h-12 w-9 rounded object-cover border"
                  />
                  <div className="flex-1">
                    <div className="font-medium line-clamp-1">{c.title}</div>
                    {c.lastChapter != null && (
                      <div className="text-xs text-muted-foreground">Chương mới nhất: {c.lastChapter}</div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
          {!!query && (
            <div className="border-t p-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => window.location.assign(`/search?q=${encodeURIComponent(query)}`)}
              >
                Xem tất cả kết quả cho “{query}”
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}