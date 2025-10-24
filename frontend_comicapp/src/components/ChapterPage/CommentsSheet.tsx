import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Comment {
  commentId: number;
  content: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  User: { username: string; avatar?: string; initials?: string };
  replies?: Comment[];
}
// Giả định PostCommentResponse trả về một Comment
interface PostCommentResponse extends Comment {}
interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
type ApiOk<T> = { success: true; data: T; meta?: unknown };
const getAuthToken = () => localStorage.getItem("token");


function CommentItem({ comment }: { comment: Comment }) {
  return (
    <Card className="p-3 bg-background/50">
      <div className="flex items-start space-x-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={comment.User.avatar || "/placeholder.svg"} alt={comment.User.username} />
          <AvatarFallback>{comment.User.initials || comment.User.username.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">{comment.User.username}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(comment.createdAt).toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-foreground/90 mt-1">{comment.content}</p>
        </div>
      </div>
    </Card>
  );
}

interface CommentSectionProps {
  comicId?: number;  
  chapterId?: number; 
  comicSlug?: string; 
}

function CommentSection({ comicId, chapterId, comicSlug }: CommentSectionProps) { // <-- SỬA: Nhận comicSlug
  const [commentInput, setCommentInput] = useState('');
  const [currentTab, setCurrentTab] = useState(chapterId ? 'chapter' : 'all');
  const scrollListRef = useRef<HTMLDivElement>(null); 

  // State cho bình luận chương
  const [chapterComments, setChapterComments] = useState<Comment[]>([]);
  const [chapterPage, setChapterPage] = useState(1);
  const [hasMoreChapter, setHasMoreChapter] = useState(true);
  const [loadingChapter, setLoadingChapter] = useState(false);

  // State cho tất cả bình luận
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [allPage, setAllPage] = useState(1);
  const [hasMoreAll, setHasMoreAll] = useState(true);
  const [loadingAll, setLoadingAll] = useState(false);

  // Effect để RESET page khi ID thay đổi
  useEffect(() => {
    setChapterPage(1);
    setChapterComments([]); 
    setHasMoreChapter(true);
  }, [chapterId]);

  useEffect(() => {
    setAllPage(1);
    setAllComments([]);
    setHasMoreAll(true);
  }, [comicSlug]);

  // Fetch bình luận CHƯƠNG
  useEffect(() => {
    if (!chapterId || !hasMoreChapter) {
      if(!chapterId) setChapterComments([]);
      return;
    };

    const fetchChapterComments = async () => {
      setLoadingChapter(true);
      try {
        const token = getAuthToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const response = await axios.get<ApiOk<Comment[]>>(
          `${import.meta.env.VITE_API_URL}/comments/chapter/${chapterId}`,
          { 
            headers,
            params: { page: chapterPage, limit: 10 }
          }
        );

        const meta = response.data.meta as PaginationMeta;
        const newData = response.data.data || [];

        setChapterComments(prev => (chapterPage === 1 ? newData : [...prev, ...newData]));
        setHasMoreChapter(meta.page < meta.totalPages);

      } catch (error) {
        console.error("Failed to fetch chapter comments:", error);
      } finally {
        setLoadingChapter(false);
      }
    };
    
    fetchChapterComments();
  }, [chapterId, chapterPage]);

  // Fetch TẤT CẢ bình luận (của truyện)
  useEffect(() => {
    if (!comicSlug || !hasMoreAll) { 
      if(!comicSlug) setAllComments([]); 
      return;
    };

    const fetchAllComments = async () => {
      setLoadingAll(true);
      try {
        const token = getAuthToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const response = await axios.get<ApiOk<Comment[]>>(
          `${import.meta.env.VITE_API_URL}/comments/comic/${comicSlug}`, 
          { 
            headers,
            params: { page: allPage, limit: 10 }
          }
        );

        const meta = response.data.meta as PaginationMeta;
        const newData = response.data.data || [];
        
        setAllComments(prev => (allPage === 1 ? newData : [...prev, ...newData]));
        setHasMoreAll(meta.page < meta.totalPages);

      } catch (error) {
        console.error("Failed to fetch all comments:", error);
      } finally {
        setLoadingAll(false);
      }
    };

    fetchAllComments();
  }, [comicSlug, allPage]); 


  const handleSubmitComment = async () => {
    if (!commentInput.trim() || !comicId) return; 
    const token = getAuthToken();
    if (!token) {
      toast.error("Vui lòng đăng nhập!");
      return;
    }

    const payload: { content: string; comicId: number; chapterId?: number } = {
      content: commentInput,
      comicId: comicId, 
    };
    if (currentTab === 'chapter' && chapterId) {
      payload.chapterId = chapterId;
    }

    try {
      const response = await axios.post<ApiOk<PostCommentResponse>>(
        `${import.meta.env.VITE_API_URL}/comments`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.data) {
        const createdComment: Comment = {
          ...response.data.data,
          likes: 0,
          isLiked: false, 
        };
        
        if (currentTab === 'chapter') {
          setChapterComments([createdComment, ...chapterComments]);
          setAllComments([createdComment, ...allComments]);
        } else {
          setAllComments([createdComment, ...allComments]);
        }
      }
      setCommentInput("");
      toast.success("Bình luận đã được gửi.");
    } catch (error) {
      console.error("Failed to post comment:", error);
      toast.error("Gửi bình luận thất bại.");
    }
  };

  // --- LOGIC SCROLL ---
  const handleScroll = () => {
    const listEl = scrollListRef.current;
    if (!listEl) return;

    const { scrollTop, scrollHeight, clientHeight } = listEl;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      if (currentTab === 'chapter') {
        if (!loadingChapter && hasMoreChapter) {
          setChapterPage(prevPage => prevPage + 1);
        }
      } else {
        if (!loadingAll && hasMoreAll) {
          setAllPage(prevPage => prevPage + 1);
        }
      }
    }
  };

  
  return (
    <div className="flex flex-col h-full">
      <div className="flex w-full items-start p-4 border-b flex-shrink-0">
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="Viết bình luận của bạn..."
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            className="bg-background"
          />
          <Button
            size="sm"
            className="float-right"
            disabled={!commentInput.trim()}
            onClick={handleSubmitComment}
          >
            Gửi <Send className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>


      <div 
        className="flex-1 overflow-y-auto"
        ref={scrollListRef}
        onScroll={handleScroll}
      >
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full p-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chapter" disabled={!chapterId}>Bình luận chương</TabsTrigger>
            <TabsTrigger value="all">Tất cả bình luận</TabsTrigger>
          </TabsList>

          {/* Tab Bình luận chương */}
          <TabsContent value="chapter">
            <div className="space-y-4 mt-4">
              {!loadingChapter && chapterComments.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">Chưa có bình luận nào cho chương này.</p>
              )}
              {chapterComments.map((comment) => (
                <CommentItem key={comment.commentId} comment={comment} />
              ))}
              {loadingChapter && chapterPage > 1 && (
                 <p className="text-center text-sm text-muted-foreground py-4">Đang tải thêm...</p>
              )}
            </div>
          </TabsContent>

          {/* Tab Tất cả bình luận */}
          <TabsContent value="all">
            <div className="space-y-4 mt-4">
              {!loadingAll && allComments.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">Chưa có bình luận nào.</p>
              )}
              {allComments.map((comment) => (
                <CommentItem key={comment.commentId} comment={comment} />
              ))}
              {loadingAll && allPage > 1 && (
                 <p className="text-center text-sm text-muted-foreground py-4">Đang tải thêm...</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface CommentsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  comicId?: number;
  chapterId?: number;
  comicSlug?: string;
}

export function CommentsSheet({ isOpen, onOpenChange, comicId, chapterId, comicSlug }: CommentsSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] p-0 bg-muted text-foreground flex flex-col max-h-screen">
        <SheetHeader className="p-6 border-b flex-shrink-0">
          <SheetTitle>Bình luận</SheetTitle>
        </SheetHeader>
        <div className="flex-1 min-h-0">
          {isOpen && (
            <CommentSection 
              comicId={comicId} 
              chapterId={chapterId} 
              comicSlug={comicSlug} 
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}