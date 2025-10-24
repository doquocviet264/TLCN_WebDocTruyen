import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  username: string;
  avatar?: string;
}

interface Comic {
  title: string;
  slug: string;
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  User: User;
  Comic: Comic;
}
interface RecentCommentsResponse {
  success: boolean;
  data: Comment[];
  meta: any;
}
// Component Skeleton cho mỗi bình luận
const CommentSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-5 w-3/4" />
    <Skeleton className="h-4 w-full" />
    <div className="flex items-center space-x-2">
      <Skeleton className="h-6 w-6 rounded-full" />
      <Skeleton className="h-4 w-20" />
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
        const response = await axios.get<RecentCommentsResponse>(`${import.meta.env.VITE_API_URL}/comments/recent`);
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
      return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
      {/* Tiêu đề */}
      <h3 className="text-xl font-montserrat font-bold mb-4">Bình luận mới nhất</h3>

      <div className="space-y-5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <CommentSkeleton key={i} />)
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="space-y-2">
              {/* Link đến truyện */}
              <Link to={`/truyen-tranh/${comment.Comic.slug}`} className="text-base group">
                <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {comment.Comic.title}
                </span>
              </Link>
              
              {/* Nội dung bình luận */}
              <p className="text-base text-muted-foreground leading-relaxed line-clamp-2">
                {comment.content}
              </p>

              {/* Thông tin người dùng */}
              <div className="flex items-center space-x-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={comment.User.avatar || "/placeholder.svg"} alt={comment.User.username} />
                  <AvatarFallback className="text-sm">
                    {getInitials(comment.User.username)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{comment.User.username}</span>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">{timeAgo(comment.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>

  );
}