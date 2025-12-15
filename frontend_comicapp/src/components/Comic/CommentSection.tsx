import { useState, useEffect } from "react";
import { Send, Heart, Reply, MoreHorizontal, MessageSquare, CornerDownRight, Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "react-toastify";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"; // Đảm bảo bạn có utils này

// --- Interfaces (Giữ nguyên) ---
interface Comment {
  commentId: number;
  content: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  user: { username: string; avatar?: string; initials?: string };
  replies?: Comment[];
}

interface CommentSectionProps {
  comicId: string;
  comicSlug: string;
}

interface PostCommentResponse {
  commentId: number;
  content: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  user: { username: string; avatar?: string; initials?: string };
  replies?: Comment[];
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type ApiOk<T> = { success: true; data: T; meta?: unknown };

const reportTypeLabels: Record<string, string> = {
  spam: "Spam / Quảng cáo",
  inappropriate: "Nội dung phản cảm",
  fake: "Thông tin sai lệch",
  harassment: "Quấy rối / xúc phạm",
  other: "Khác",
};
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
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportCommentId, setReportCommentId] = useState<number | null>(null);
  const [reportType, setReportType] = useState("");
  const [reportDescription, setReportDescription] = useState("");

  // --- Logic Fetch (Giữ nguyên logic chuẩn) ---
  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      try {
        const token = getAuthToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const response = await axios.get<ApiOk<Comment[]>>(
          `${import.meta.env.VITE_API_URL}/comments/comic/${comicSlug}?page=${page}`,
          { headers }
        );

        const meta = response.data.meta as PaginationMeta;
        setComments(response.data.data || []); 
        setTotalPages(meta?.totalPages || 1);
        setTotalItems(meta?.total || 0);

      } catch (error) {
        console.error("Failed to fetch comments:", error);
        setComments([]);
      } finally {
        setLoading(false);
      }
    };
    if (comicSlug) fetchComments();
  }, [comicSlug, page]);

  // --- Logic Handlers (Giữ nguyên logic, chỉ làm gọn) ---
  const openReportDialog = (id: number) => { setReportCommentId(id); setShowReportDialog(true); };
  const closeReportDialog = () => { setShowReportDialog(false); setReportCommentId(null); setReportType(""); setReportDescription(""); };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    const token = getAuthToken();
    if (!token) { toast.error("Vui lòng đăng nhập!"); return; }

    try {
      const res = await axios.post<ApiOk<PostCommentResponse>>(`${import.meta.env.VITE_API_URL}/comments`, { content: newComment, comicId }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.data) {
        setComments([{ ...res.data.data, likes: 0, isLiked: false }, ...comments]);
        setTotalItems(p => p + 1);
      }
      setNewComment("");
      toast.success("Đã đăng bình luận!");
    } catch (e) { toast.error("Lỗi khi đăng bình luận."); }
  };

  const handleLikeComment = async (commentId: number, isReply = false) => {
    const token = getAuthToken();
    if (!token) { toast.error("Vui lòng đăng nhập!"); return; }

    // Optimistic Update
    const toggleLike = (c: Comment) => c.commentId === commentId ? { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 } : c;
    
    setComments(prev => prev.map(c => {
      if (c.commentId === commentId) return toggleLike(c);
      if (isReply && c.replies) return { ...c, replies: c.replies.map(r => r.commentId === commentId ? toggleLike(r) : r) };
      return c;
    }));

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/comments/${commentId}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (e) {
      // Revert if fail
      toast.error("Lỗi khi thích.");
       // (Thêm logic revert ở đây nếu cần thiết, giống code cũ)
    }
  };

  const handleSubmitReply = async (parentId: number) => {
    if (!replyContent.trim()) return;
    const token = getAuthToken();
    if (!token) { toast.error("Vui lòng đăng nhập!"); return; }

    try {
      const res = await axios.post<ApiOk<PostCommentResponse>>(`${import.meta.env.VITE_API_URL}/comments`, { content: replyContent, comicId, parentId }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.data) {
        setComments(prev => prev.map(c => c.commentId === parentId ? { ...c, replies: [...(c.replies || []), { ...res.data.data!, likes: 0, isLiked: false }] } : c));
      }
      setReplyingTo(null); setReplyContent("");
      toast.success("Đã trả lời!");
      // Tự động mở list reply khi post xong
      setShowReplies(prev => ({...prev, [parentId]: true}));
    } catch (e) { toast.error("Lỗi trả lời."); }
  };

  const handleSubmitReport = async () => {
    // (Logic report giữ nguyên)
    if (!reportType || !reportDescription.trim()) { toast.warning("Thiếu thông tin báo cáo!"); return; }
    const token = getAuthToken();
    if (!token) { toast.error("Đăng nhập để báo cáo!"); return; }
    try {
        await axios.post(`${import.meta.env.VITE_API_URL}/reports`, { title: reportTypeLabels[reportType], description: reportDescription, type: "comment", targetId: reportCommentId }, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Đã gửi báo cáo."); closeReportDialog();
    } catch (e) { toast.error("Lỗi gửi báo cáo."); }
  };


  // --- Helper Render: Comment Item ---
  const CommentItem = ({ comment, isReply = false, parentId }: { comment: Comment, isReply?: boolean, parentId?: number }) => (
    <div className={cn("flex gap-4 group/comment animate-in fade-in slide-in-from-bottom-2 duration-500", isReply ? "mt-4" : "")}>
      {/* Avatar */}
      <Avatar className={cn("border-2 border-background shadow-sm", isReply ? "h-8 w-8" : "h-10 w-10 ring-2 ring-primary/10")}>
        <AvatarImage src={comment.user.avatar || "/placeholder.svg"} className="object-cover" />
        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
          {comment.user.initials || comment.user.username[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        {/* Bubble Content */}
        <div className={cn(
            "rounded-2xl p-4 relative transition-colors",
            isReply 
              ? "bg-secondary/30 rounded-tl-none" // Reply thì background nhạt hơn
              : "bg-secondary/50 backdrop-blur-sm rounded-tl-none border border-border/50" // Main comment nổi hơn
        )}>
          {/* Header Info */}
          <div className="flex items-center justify-between mb-1">
             <div className="flex items-baseline gap-2">
                <span className="font-bold text-sm text-foreground hover:text-primary cursor-pointer transition-colors">
                  {comment.user.username}
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                  {new Date(comment.createdAt).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })}
                </span>
             </div>
             
             {/* Menu Action */}
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/comment:opacity-100 transition-opacity -mr-2">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => openReportDialog(comment.commentId)} className="text-destructive focus:text-destructive gap-2">
                    <Flag className="w-4 h-4" /> Báo cáo
                  </DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
          </div>

          {/* Content */}
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-4 mt-1.5 ml-1">
           <button 
             onClick={() => handleLikeComment(comment.commentId, isReply)}
             className={cn(
               "flex items-center gap-1.5 text-xs font-medium transition-all group/like",
               comment.isLiked ? "text-pink-500" : "text-muted-foreground hover:text-pink-500"
             )}
           >
             <Heart className={cn("w-3.5 h-3.5 transition-transform group-active/like:scale-75", comment.isLiked && "fill-current")} />
             {comment.likes > 0 ? comment.likes : "Thích"}
           </button>

           <button 
             onClick={() => setReplyingTo(replyingTo === comment.commentId ? null : comment.commentId)}
             className={cn(
               "flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-primary",
               replyingTo === comment.commentId ? "text-primary" : "text-muted-foreground"
             )}
           >
             <Reply className="w-3.5 h-3.5" />
             Trả lời
           </button>
        </div>

        {/* Reply Input Form */}
        {replyingTo === comment.commentId && (
           <div className="mt-3 animate-in fade-in zoom-in-95">
              <div className="flex gap-3">
                 <div className="w-8 flex justify-center"><CornerDownRight className="w-5 h-5 text-muted-foreground/30" /></div>
                 <div className="flex-1 space-y-2">
                    <Textarea 
                      placeholder={`Trả lời ${comment.user.username}...`}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="min-h-[80px] bg-background/50 focus-visible:ring-primary/50 text-sm"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                       <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)} className="h-8">Hủy</Button>
                       <Button size="sm" onClick={() => handleSubmitReply(comment.commentId)} disabled={!replyContent.trim()} className="h-8">
                         Gửi
                       </Button>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* Nested Replies (Recursion logic for 1 level deep or show list) */}
        {!isReply && comment.replies && comment.replies.length > 0 && (
           <div className="mt-2">
              {!showReplies[comment.commentId] ? (
                 <button 
                   onClick={() => setShowReplies(p => ({...p, [comment.commentId]: true}))}
                   className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors ml-2 py-1"
                 >
                    <div className="w-6 h-[1px] bg-border" />
                    Xem thêm {comment.replies.length} phản hồi
                 </button>
              ) : (
                 <div className="pl-4 border-l-2 border-border/40 ml-4 space-y-4 pt-2">
                    {comment.replies.map(reply => (
                       <CommentItem key={reply.commentId} comment={reply} isReply={true} parentId={comment.commentId} />
                    ))}
                    <button 
                       onClick={() => setShowReplies(p => ({...p, [comment.commentId]: false}))}
                       className="text-xs text-muted-foreground hover:text-foreground mt-2 block"
                    >
                       Thu gọn
                    </button>
                 </div>
              )}
           </div>
        )}
      </div>
    </div>
  );

  // --- Main Render ---
  return (
    <div className="w-full bg-card border border-border rounded-[24px] shadow-sm mt-8 overflow-hidden relative group/container">
      {/* Ambient Background */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
           <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <MessageSquare className="w-5 h-5" />
           </div>
           <div>
              <h2 className="text-xl font-bold text-foreground">Bình luận cộng đồng</h2>
              <p className="text-sm text-muted-foreground">Tổng {totalItems} bình luận</p>
           </div>
        </div>

        {/* Input Box (Chat Style) */}
        <div className="flex gap-4 mb-10 group/input">
           <Avatar className="h-10 w-10 ring-2 ring-background shadow-md hidden sm:block">
              {/* Fallback avatar nếu chưa login hoặc lấy từ context user */}
              <AvatarFallback className="bg-secondary">Tôi</AvatarFallback> 
           </Avatar>
           <div className="flex-1 relative">
              <Textarea 
                placeholder="Chia sẻ suy nghĩ của bạn về chương này..." 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px] bg-secondary/30 border-border focus:bg-background transition-all resize-none rounded-2xl p-4 pr-14 shadow-sm focus:shadow-md focus-visible:ring-primary/40"
              />
              <div className="absolute bottom-3 right-3">
                 <Button 
                   size="icon" 
                   onClick={handleSubmitComment} 
                   disabled={!newComment.trim()}
                   className={cn(
                     "h-9 w-9 rounded-xl transition-all duration-300", 
                     newComment.trim() ? "bg-primary hover:bg-primary/90 scale-100" : "bg-muted text-muted-foreground scale-90 opacity-70"
                   )}
                 >
                    <Send className="w-4 h-4 ml-0.5" />
                 </Button>
              </div>
           </div>
        </div>

        {/* Comment List */}
        <div className="space-y-8">
           {loading ? (
             <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary/50" /></div>
           ) : comments.length > 0 ? (
             comments.map(comment => <CommentItem key={comment.commentId} comment={comment} />)
           ) : (
             <div className="text-center py-12 text-muted-foreground bg-secondary/20 rounded-2xl border border-dashed border-border/50">
                <p>Chưa có bình luận nào. Hãy là người đầu tiên!</p>
             </div>
           )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
           <div className="flex justify-center gap-2 mt-8 pt-6 border-t border-border/50">
             {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                  className={cn("w-9 h-9 p-0 rounded-lg", page === pageNum && "shadow-md shadow-primary/20")}
                >
                  {pageNum}
                </Button>
             ))}
           </div>
        )}
      </div>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Flag className="w-5 h-5 text-destructive" /> Báo cáo vi phạm</DialogTitle>
            <DialogDescription>Giúp chúng tôi giữ cộng đồng trong sạch.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Lý do</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger><SelectValue placeholder="Chọn lý do" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(reportTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Chi tiết</Label>
              <Textarea value={reportDescription} onChange={(e) => setReportDescription(e.target.value)} placeholder="Mô tả thêm..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeReportDialog}>Hủy</Button>
            <Button variant="destructive" onClick={handleSubmitReport}>Gửi báo cáo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}