import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Star, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import ComicSearchBox from "./ComicSearchBox";

type PostType = "REVIEW" | "FIND_SIMILAR";
type RatingKey =
  | "ratingStoryLine"
  | "ratingCharacters"
  | "ratingArt"
  | "ratingEmotion"
  | "ratingCreativity";


type ComicLite = {
  id: number;
  title: string;
  image: string;
  lastChapter?: number | string;
};
type ApiOk<T> = { success: true; data: T; meta?: unknown };
type Genre = { genreId: number; name: string };

const RATING_LABEL: Record<RatingKey, string> = {
  ratingStoryLine: "Cốt truyện",
  ratingCharacters: "Nhân vật",
  ratingArt: "Hình ảnh",
  ratingEmotion: "Cảm xúc",
  ratingCreativity: "Sáng tạo",
};

interface Props {
  onPostCreated: () => void;
}

export function CommunityComposer({ onPostCreated }: Props) {
  const [tab, setTab] = useState<PostType>("REVIEW");
  const [title, setTitle] = useState("");
  const [selectedComic, setSelectedComic] = useState<ComicLite | null>(null);
  const [comicId, setComicId] = useState<number | undefined>(undefined);

  const [ratings, setRatings] = useState<Record<RatingKey, number>>({
    ratingStoryLine: 0,
    ratingCharacters: 0,
    ratingArt: 0,
    ratingEmotion: 0,
    ratingCreativity: 0,
  });

  const [genresMaster, setGenresMaster] = useState<Genre[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);
  const [genresError, setGenresError] = useState<string | null>(null);

  const [simGenres, setSimGenres] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const genreNameToId = useMemo<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    for (const g of genresMaster) {
      if (g?.name) m[g.name] = g.genreId;
    }
    return m;
  }, [genresMaster]);

  useEffect(() => {
    (async () => {
      try {
        setGenresLoading(true);
        setGenresError(null);
        const res = await axios.get<ApiOk<Genre[]>>(`${import.meta.env.VITE_API_URL}/genres`);
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setGenresMaster(list);
      } catch (error: any) {
        const msg =
          error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          "Lỗi khi lấy thể loại";
        toast.error(msg);
        setGenresError(msg);
        setGenresMaster([]);
      } finally {
        setGenresLoading(false);
      }
    })();
  }, []);

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : [];
    const next = [...files, ...list].slice(0, 5);
    setFiles(next);
  };
  const removeFile = (idx: number) =>
    setFiles((arr) => arr.filter((_, i) => i !== idx));

  const reviewValid =
    ratings.ratingStoryLine >= 1 &&
    ratings.ratingCharacters >= 1 &&
    ratings.ratingArt >= 1 &&
    ratings.ratingEmotion >= 1 &&
    ratings.ratingCreativity >= 1 &&
    !!comicId;

  const canSubmit = useMemo(() => {
    if (content.trim().length < 10) return false;
    if (files.length > 5) return false;
    return tab === "REVIEW" ? reviewValid : true;
  }, [content, files.length, tab, reviewValid]);

  const resetForm = () => {
    setTitle("");
    setSelectedComic(null);
    setComicId(undefined);
    setRatings({
      ratingStoryLine: 0,
      ratingCharacters: 0,
      ratingArt: 0,
      ratingEmotion: 0,
      ratingCreativity: 0,
    });
    setSimGenres([]);
    setContent("");
    setFiles([]);
  };

  const submitPost = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const isReview = tab === "REVIEW";
      const type = isReview ? "review" : "find_similar";
      const token = localStorage.getItem("token");

      if (isReview && (!comicId || comicId <= 0)) {
        toast.error("Vui lòng chọn truyện trước khi đăng bài!");
        setSubmitting(false);
        return;
      }

      const fd = new FormData();
      fd.append("type", type);
      if (title.trim()) fd.append("title", title.trim());
      fd.append("content", content.trim());

      if (isReview) {
        fd.append("comicId", String(comicId));
        const norm = (n: number) =>
          String(Math.max(1, Math.min(5, Math.round(n))));
        fd.append("ratingStoryLine", norm(ratings.ratingStoryLine));
        fd.append("ratingCharacters", norm(ratings.ratingCharacters));
        fd.append("ratingArt", norm(ratings.ratingArt));
        fd.append("ratingEmotion", norm(ratings.ratingEmotion));
        fd.append("ratingCreativity", norm(ratings.ratingCreativity));
      } else {
        const ids = simGenres
          .map((name) => genreNameToId[name])
          .filter((id): id is number => Number.isInteger(id) && id > 0);
        ids.forEach((id) => fd.append("genreIds[]", String(id)));
      }

      files.forEach((f) => fd.append("images", f, f.name));

      await axios.post(`${import.meta.env.VITE_API_URL}/community/posts`, fd, {
        headers: { Authorization: `Bearer ${token}` },
      });

      resetForm();
      onPostCreated();
      toast.success("Đăng bài thành công!");
    } catch (e: any) {
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        toast.error("Bạn cần đăng nhập để đăng bài.");
      } else {
        const msg: string =
          e?.response?.data?.error?.message ||
          e?.message ||
          "Đăng bài thất bại. Vui lòng thử lại.";
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const setOneRating = (key: RatingKey, value: number) =>
    setRatings((prev) => ({ ...prev, [key]: value }));

  const toggleGenre = (g: string) =>
    setSimGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );

  return (
    <Card className="shadow-xl overflow-hidden">
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as PostType)}
        className="w-full"
      >
        <CardContent className="p-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="REVIEW">Đánh giá truyện</TabsTrigger>
            <TabsTrigger value="FIND_SIMILAR">Tìm truyện tương tự</TabsTrigger>
          </TabsList>

          <div className="pt-4 space-y-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tiêu đề (tuỳ chọn)"
            />

            {/* REVIEW */}
            <TabsContent value="REVIEW" className="m-0 space-y-3">
              <ComicSearchBox
                value={selectedComic}
                onSelect={(c) => {
                  setSelectedComic(c);
                  setComicId(c.id);
                }}
                onClear={() => {
                  setSelectedComic(null);
                  setComicId(undefined);
                }}
                placeholder="Tìm & chọn truyện (bắt buộc)"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(Object.keys(RATING_LABEL) as RatingKey[]).map((key) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-sm min-w-24">
                      {RATING_LABEL[key]}:
                    </span>
                    {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
                      <Button
                        key={n}
                        variant="ghost"
                        size="icon"
                        onClick={() => setOneRating(key, n)}
                        aria-label={`${RATING_LABEL[key]} ${n}`}
                      >
                        <Star
                          className={cn(
                            "h-5 w-5",
                            (ratings[key] ?? 0) >= n
                              ? "text-yellow-400 fill-current"
                              : "text-neutral-600"
                          )}
                        />
                      </Button>
                    ))}
                    {ratings[key] > 0 && (
                      <span className="text-sm">{ratings[key]}/5</span>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="FIND_SIMILAR" className="m-0 space-y-3">
              <div className="p-3 rounded-xl border">
                <div className="text-sm mb-2">
                  Chọn thể loại bạn thích (tuỳ chọn)
                </div>

                {genresLoading && (
                  <div className="text-sm opacity-70">Đang tải thể loại…</div>
                )}
                {genresError && (
                  <div className="text-sm text-red-500">{genresError}</div>
                )}

                <div className="flex flex-wrap gap-2 mt-1">
                  {genresMaster.map((g) => {
                    const active = simGenres.includes(g.name);
                    return (
                      <Button
                        key={g.genreId}
                        variant={active ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleGenre(g.name)}
                        disabled={genresLoading}
                      >
                        {g.name}
                      </Button>
                    );
                  })}
                </div>

                {simGenres.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setSimGenres([])}
                    className="mt-3"
                  >
                    Xoá bộ lọc thể loại
                  </Button>
                )}
              </div>
            </TabsContent>

            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                tab === "REVIEW"
                  ? "Viết cảm nhận (≥ 10 ký tự)…"
                  : "Mô tả truyện bạn muốn tìm (ví dụ: giống Solo Leveling, main mạnh dần, art đẹp)…"
              }
              className="w-full min-h-28"
            />

            {/* Upload ảnh */}
            <div className="flex flex-col gap-2">
              <label>
                <Button variant="outline" className="cursor-pointer" asChild>
                  <div>
                    <Upload className="h-4 w-4 mr-2" />
                    <span>Thêm ảnh (tối đa 5)</span>
                  </div>
                </Button>
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={onFiles}
                />
              </label>
              {files.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {files.map((f, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={URL.createObjectURL(f)}
                        className="h-24 w-full object-cover rounded-lg border"
                        alt={f.name}
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removeFile(i)}
                        className="absolute top-1 right-1 hidden group-hover:flex h-7 w-7 rounded-full"
                        aria-label="Xoá ảnh"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="text-xs">
                Nội dung tối thiểu 10 ký tự. Ảnh ≤ 5 tấm.
              </div>
              <Button onClick={submitPost} disabled={!canSubmit || submitting}>
                {submitting ? "Đang đăng…" : "Đăng bài"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Tabs>
    </Card>
  );
}
