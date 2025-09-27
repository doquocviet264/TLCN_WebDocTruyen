import { useState, useEffect } from "react";
import { Send, Heart, Reply, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "react-toastify";
import axios from "axios";

interface Comment {
  commentId: number;
  content: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  User: { username: string; avatar?: string; initials?: string };
  replies?: Comment[];
}

interface CommentSectionProps {
  comicId: string;
  comicSlug: string;
}

interface FetchCommentsResponse {
  totalItems: number;
  comments: Comment[];
  totalPages: number;
  currentPage: number;
}

interface PostCommentResponse {
  commentId: number;
  content: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  User: { username: string; avatar?: string; initials?: string };
  replies?: Comment[];
}

const getAuthToken = () => localStorage.getItem("token");

export default function CommentSection({ comicId, comicSlug }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [showReplies, setShowReplies] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      try {
        const token = getAuthToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get<FetchCommentsResponse>(
          `${import.meta.env.VITE_API_URL}/comments/comic/${comicSlug}?page=${page}`,
          { headers }
        );
        setComments(response.data.comments); // Chỉ set comments cho trang hiện tại
        setTotalPages(response.data.totalPages);
        setTotalItems(response.data.totalItems);
      } catch (error) {
        console.error("Failed to fetch comments:", error);
      } finally {
        setLoading(false);
      }
    };
    if (comicSlug) fetchComments();
  }, [comicSlug, page]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    const token = getAuthToken();
    if (!token) {
      toast.error("Vui lòng đăng nhập!");
      return;
    }

    try {
      const response = await axios.post<PostCommentResponse>(
        `${import.meta.env.VITE_API_URL}/comments`,
        { content: newComment, comicId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data) {
        const createdComment: Comment = { ...response.data, likes: 0, isLiked: false };
        setComments([createdComment, ...comments]);
        setTotalItems((prev) => prev + 1); // Cập nhật tổng số khi thêm comment mới
      }
      setNewComment("");
      toast.success("Bình luận đã được gửi.");
    } catch (error) {
      console.error("Failed to post comment:", error);
      toast.error("Gửi bình luận thất bại.");
    }
  };

  const handleLikeComment = async (commentId: number, isReply = false, parentId?: number) => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Vui lòng đăng nhập!");
      return;
    }

    setComments((comments) =>
      comments.map((c) => {
        if (c.commentId === commentId) {
          return { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 };
        }
        if (isReply && c.replies) {
          return {
            ...c,
            replies: c.replies.map((r) => (r.commentId === commentId ? { ...r, isLiked: !r.isLiked, likes: r.isLiked ? r.likes - 1 : r.likes + 1 } : r)),
          };
        }
        return c;
      })
    );

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/comments/${commentId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      setComments((comments) =>
        comments.map((c) => {
          if (c.commentId === commentId) {
            return { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes + 1 : c.likes - 1 };
          }
          if (isReply && c.replies) {
            return {
              ...c,
              replies: c.replies.map((r) => (r.commentId === commentId ? { ...r, isLiked: !r.isLiked, likes: r.isLiked ? r.likes + 1 : r.likes - 1 } : r)),
            };
          }
          return c;
        })
      );
      console.error("Failed to like comment:", error);
      toast.error("Thích bình luận thất bại.");
    }
  };

  const handleSubmitReply = async (parentId: number) => {
    if (!replyContent.trim()) return;
    const token = getAuthToken();
    if (!token) {
      toast.error("Vui lòng đăng nhập!");
      return;
    }

    try {
      const response = await axios.post<PostCommentResponse>(
        `${import.meta.env.VITE_API_URL}/comments`,
        { content: replyContent, comicId, parentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComments((comments) =>
        comments.map((c) =>
          c.commentId === parentId
            ? {
                ...c,
                replies: [
                  ...(c.replies || []),
                  { ...response.data, likes: 0, isLiked: false },
                ],
              }
            : c
        )
      );

      setReplyingTo(null);
      setReplyContent("");
      toast.success("Trả lời đã được gửi.");
    } catch (error) {
      console.error("Failed to post reply:", error);
      toast.error("Gửi trả lời thất bại.");
    }
  };

  const toggleReplies = (commentId: number) => {
    setShowReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
      <h2 className="text-xl font-montserrat font-bold mb-6">
        Bình luận ({totalItems})
      </h2>

      {/* Comment Input */}
      <div className="space-y-4 mb-8">
        <Textarea
          placeholder="Viết bình luận của bạn..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[100px] resize-none"
        />
        <div className="flex justify-end">
          <Button onClick={handleSubmitComment} disabled={!newComment.trim()} className="flex items-center space-x-2">
            <Send className="h-4 w-4" />
            <span>Gửi bình luận</span>
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.commentId} className="space-y-4">
            {/* Main Comment */}
            <div className="flex space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={comment.User.avatar || "/placeholder.svg"} alt={comment.User.username} />
                <AvatarFallback>{comment.User.initials || comment.User.username[0]}</AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{comment.User.username}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Báo cáo</DropdownMenuItem>
                          <DropdownMenuItem>Chặn người dùng</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-pretty">{comment.content}</p>
                </div>

                <div className="flex items-center space-x-4 text-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLikeComment(comment.commentId)}
                    className={`flex items-center space-x-1 h-8 px-2 ${comment.isLiked ? "text-red-500" : "text-muted-foreground"}`}
                  >
                    <Heart className={`h-3 w-3 ${comment.isLiked ? "fill-current" : ""}`} />
                    <span>{comment.likes}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(replyingTo === comment.commentId ? null : comment.commentId)}
                    className="flex items-center space-x-1 h-8 px-2 text-muted-foreground"
                  >
                    <Reply className="h-3 w-3" />
                    <span>Trả lời</span>
                  </Button>
                </div>

                {/* Reply Input */}
                {replyingTo === comment.commentId && (
                  <div className="space-y-2 mt-4">
                    <Textarea
                      placeholder="Viết câu trả lời..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent("");
                        }}
                      >
                        Hủy
                      </Button>
                      <Button size="sm" onClick={() => handleSubmitReply(comment.commentId)} disabled={!replyContent.trim()}>
                        Trả lời
                      </Button>
                    </div>
                  </div>
                )}

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-4 space-y-3 border-l-2 border-border pl-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleReplies(comment.commentId)}
                      className="flex items-center space-x-1 text-muted-foreground"
                    >
                      <span>{showReplies[comment.commentId] ? "Ẩn trả lời" : `Xem ${comment.replies.length} trả lời`}</span>
                      {showReplies[comment.commentId] ? <Reply className="h-3 w-3 rotate-180" /> : <Reply className="h-3 w-3" />}
                    </Button>
                    {showReplies[comment.commentId] && (
                      comment.replies.map((reply) => (
                        <div key={reply.commentId} className="flex space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={reply.User.avatar || "/placeholder.svg"} alt={reply.User.username} />
                            <AvatarFallback className="text-xs">{reply.User.initials || reply.User.username[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="bg-muted/20 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{reply.User.username}</span>
                                <span className="text-xs text-muted-foreground">{new Date(reply.createdAt).toLocaleString()}</span>
                              </div>
                              <p className="text-sm leading-relaxed">{reply.content}</p>
                            </div>
                            <div className="flex items-center space-x-4 text-sm">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLikeComment(reply.commentId, true, comment.commentId)}
                                className={`flex items-center space-x-1 h-6 px-2 ${reply.isLiked ? "text-red-500" : "text-muted-foreground"}`}
                              >
                                <Heart className={`h-3 w-3 ${reply.isLiked ? "fill-current" : ""}`} />
                                <span>{reply.likes}</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {/* Phân trang */}
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <Button
              key={pageNum}
              variant={page === pageNum ? "default" : "outline"}
              onClick={() => handlePageChange(pageNum)}
              disabled={loading}
            >
              {pageNum}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}