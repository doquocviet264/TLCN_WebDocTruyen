import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Clock } from "lucide-react"; // Import thêm icon để giao diện sinh động hơn

interface User {
  username: string;
  avatar?: string;
}

interface Comic {
  title: string;
  slug: string;
}

interface Chapter {
  title: string;
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  User: User;
  Comic: Comic;
  Chapter?: Chapter;
}

interface RecentCommentsResponse {
  success: boolean;
  data: Comment[];
  meta: any;
}

// Skeleton tinh chỉnh lại cho khớp layout mới
const CommentSkeleton = () => (
  <div className="py-4 first:pt-0 border-b border-border/40 last:border-0">
    <Skeleton className="h-5 w-2/3 mb-2" />
    <Skeleton className="h-4 w-full mb-3" />
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-3 w-16" />
    </div>
  </div>
);

export default function RecentComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentComments = async () => {
      try {
        setLoading(true);
        const response = await axios.get<RecentCommentsResponse>(
          `${import.meta.env.VITE_API_URL}/comments/recent`
        );
        setComments(response.data.data);
      } catch (error) {
        console.error("Failed to fetch recent comments:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecentComments();
  }, []);

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} năm trước`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} tháng trước`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} ngày trước`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} giờ trước`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} phút trước`;
    return `Vừa xong`;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <Card className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-border/40 shadow-lg">
      <CardHeader className="pb-3 border-b border-border/40">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="w-6 h-6" /> {/* Icon điểm nhấn */}
          <span>Bình luận gần đây</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="flex flex-col">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <CommentSkeleton key={i} />)
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="group py-4 first:pt-0 border-b border-dashed border-border/50 last:border-0 last:pb-0 relative"
              >
                {/* 1. Tên Truyện + Chapter (Màu Cam/Vàng như ảnh) */}
                <div className="mb-2">
                  <Link
                    to={`/truyen-tranh/${comment.Comic.slug}`}
                    className="block font-bold text-base transition-colors line-clamp-1"
                  >
                    {comment.Comic.title}
                    {comment.Chapter && (
                      <span className="text-muted-foreground font-normal ml-1">
                        - {comment.Chapter.title}
                      </span>
                    )}
                  </Link>
                </div>

                {/* 2. Nội dung bình luận (Màu sáng, dễ đọc) */}
                <p className="text-sm text-foreground/90 leading-relaxed line-clamp-2 mb-3 pl-1 border-l-2 border-transparent transition-all duration-300">
                  {comment.content}
                </p>

                {/* 3. Footer: User bên trái, Thời gian bên phải */}
                <div className="flex items-center justify-between mt-auto">
                  {/* User Info */}
                  <div className="flex items-center space-x-2.5">
                    <Avatar className="h-8 w-8 border border-border/50">
                      <AvatarImage
                        src={comment.User.avatar || "/placeholder.svg"}
                        alt={comment.User.username}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-xs font-semibold bg-muted text-muted-foreground">
                        {getInitials(comment.User.username)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-semibold text-foreground/80 transition-colors">
                      {comment.User.username}
                    </span>
                  </div>

                  {/* Time Info */}
                  <div className="flex items-center text-xs text-muted-foreground italic">
                    <Clock className="w-3 h-3 mr-1" />
                    {timeAgo(comment.createdAt)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}