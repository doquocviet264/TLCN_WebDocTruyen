import { useState } from "react"
import { Send, Heart, Reply, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Comment {
  id: string
  user: {
    name: string
    avatar: string
    initials: string
  }
  content: string
  time: string
  likes: number
  isLiked: boolean
  replies?: Comment[]
}

interface CommentSectionProps {
  comicId: string
}

const mockComments: Comment[] = [
  {
    id: "1",
    user: {
      name: "Minh Anh",
      avatar: "/diverse-user-avatars.png",
      initials: "MA",
    },
    content:
      "Truyện này quá hay! Jin-Woo ngày càng mạnh mẽ, không thể chờ đợi chương tiếp theo. Tác giả vẽ rất đẹp và cốt truyện hấp dẫn.",
    time: "2 giờ trước",
    likes: 24,
    isLiked: false,
    replies: [
      {
        id: "1-1",
        user: {
          name: "Hoàng Nam",
          avatar: "/diverse-user-avatar-set-2.png",
          initials: "HN",
        },
        content: "Đồng ý! Phần này Jin-Woo thực sự bá đạo rồi.",
        time: "1 giờ trước",
        likes: 5,
        isLiked: true,
      },
    ],
  },
  {
    id: "2",
    user: {
      name: "Thu Hà",
      avatar: "/diverse-user-avatars-3.png",
      initials: "TH",
    },
    content:
      "Mình đã đọc từ chương đầu và phải nói rằng đây là một trong những webtoon hay nhất mình từng đọc. Cảm ơn tác giả!",
    time: "5 giờ trước",
    likes: 18,
    isLiked: true,
  },
  {
    id: "3",
    user: {
      name: "Văn Đức",
      avatar: "/placeholder.svg",
      initials: "VD",
    },
    content: "Chương này hơi ngắn nhưng nội dung rất chất lượng. Hy vọng chương sau sẽ dài hơn.",
    time: "1 ngày trước",
    likes: 12,
    isLiked: false,
  },
]

export function CommentSection({ comicId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(mockComments)
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")

  const handleSubmitComment = () => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: Date.now().toString(),
      user: {
        name: "Bạn",
        avatar: "/placeholder.svg",
        initials: "B",
      },
      content: newComment,
      time: "Vừa xong",
      likes: 0,
      isLiked: false,
    }

    setComments([comment, ...comments])
    setNewComment("")
  }

  const handleSubmitReply = (parentId: string) => {
    if (!replyContent.trim()) return

    const reply: Comment = {
      id: `${parentId}-${Date.now()}`,
      user: {
        name: "Bạn",
        avatar: "/placeholder.svg",
        initials: "B",
      },
      content: replyContent,
      time: "Vừa xong",
      likes: 0,
      isLiked: false,
    }

    setComments(
      comments.map((comment) => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), reply],
          }
        }
        return comment
      }),
    )

    setReplyContent("")
    setReplyingTo(null)
  }

  const handleLikeComment = (commentId: string, isReply = false, parentId?: string) => {
    setComments(
      comments.map((comment) => {
        if (isReply && comment.id === parentId) {
          return {
            ...comment,
            replies: comment.replies?.map((reply) => {
              if (reply.id === commentId) {
                return {
                  ...reply,
                  isLiked: !reply.isLiked,
                  likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1,
                }
              }
              return reply
            }),
          }
        } else if (comment.id === commentId) {
          return {
            ...comment,
            isLiked: !comment.isLiked,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
          }
        }
        return comment
      }),
    )
  }

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
      <h2 className="text-xl font-montserrat font-bold mb-6">Bình luận ({comments.length})</h2>

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
          <div key={comment.id} className="space-y-4">
            {/* Main Comment */}
            <div className="flex space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={comment.user.avatar || "/placeholder.svg"} alt={comment.user.name} />
                <AvatarFallback>{comment.user.initials}</AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{comment.user.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">{comment.time}</span>
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
                    onClick={() => handleLikeComment(comment.id)}
                    className={`flex items-center space-x-1 h-8 px-2 ${
                      comment.isLiked ? "text-red-500" : "text-muted-foreground"
                    }`}
                  >
                    <Heart className={`h-3 w-3 ${comment.isLiked ? "fill-current" : ""}`} />
                    <span>{comment.likes}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className="flex items-center space-x-1 h-8 px-2 text-muted-foreground"
                  >
                    <Reply className="h-3 w-3" />
                    <span>Trả lời</span>
                  </Button>
                </div>

                {/* Reply Input */}
                {replyingTo === comment.id && (
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
                          setReplyingTo(null)
                          setReplyContent("")
                        }}
                      >
                        Hủy
                      </Button>
                      <Button size="sm" onClick={() => handleSubmitReply(comment.id)} disabled={!replyContent.trim()}>
                        Trả lời
                      </Button>
                    </div>
                  </div>
                )}

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-4 space-y-3 border-l-2 border-border pl-4">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={reply.user.avatar || "/placeholder.svg"} alt={reply.user.name} />
                          <AvatarFallback className="text-xs">{reply.user.initials}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-2">
                          <div className="bg-muted/20 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{reply.user.name}</span>
                              <span className="text-xs text-muted-foreground">{reply.time}</span>
                            </div>
                            <p className="text-sm leading-relaxed">{reply.content}</p>
                          </div>

                          <div className="flex items-center space-x-4 text-sm">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLikeComment(reply.id, true, comment.id)}
                              className={`flex items-center space-x-1 h-6 px-2 ${
                                reply.isLiked ? "text-red-500" : "text-muted-foreground"
                              }`}
                            >
                              <Heart className={`h-3 w-3 ${reply.isLiked ? "fill-current" : ""}`} />
                              <span>{reply.likes}</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
export default CommentSection;