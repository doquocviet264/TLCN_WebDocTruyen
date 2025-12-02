import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AuthContext } from "@/context/AuthContext";
import JoinGroupDialog from "@/components/dialogs/JoinGroupDialog";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Crown,
  Eye,
  User as UserIcon,
  Users,
} from "lucide-react";

// ==== Types khớp với API GET /api/groups/:groupId ====

type GroupRole = "leader" | "member";

interface GroupMember {
  userId: number;
  username: string;
  avatarUrl?: string | null;
  role: GroupRole;
  joinedAt: string;
  totalComics?: number | null;
}

interface GroupComic {
  comicId: number;
  title: string;
  slug: string;
  coverUrl?: string | null;
  views: number;
  lastChapterNumber: number;
  isCompleted: boolean;
}

interface GroupStats {
  totalComics: number;
  totalViews: number;
  totalMembers: number;
}

interface GroupDetails {
  groupId: number;
  name: string;
  description: string;
  avatarUrl?: string | null;
  ownerId: number;
  createdAt: string;
  stats: GroupStats;
  members: GroupMember[];
  comics: GroupComic[];
}

interface GetGroupDetailsResponse {
  success: boolean;
  data: GroupDetails;
  error?: {
    message: string;
    code?: string;
    status?: number;
  };
}

// ==== Components nhỏ trong file ====

const GroupDetailHeader: React.FC<{ group: GroupDetails }> = ({ group }) => {
  const leader = group.members.find((m) => m.role === "leader");
  const createdDate = new Date(group.createdAt);

  const initials = group.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <Avatar className="h-20 w-20 ring-2 ring-primary/40">
        {group.avatarUrl && (
          <AvatarImage src={group.avatarUrl} alt={group.name} />
        )}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{group.name}</h1>
          <Badge variant="outline" className="text-xs">
            Nhóm dịch
          </Badge>
          {leader && (
            <Badge className="text-xs">
              Leader:
              <span className="ml-1 font-semibold">{leader.username}</span>
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          {group.description}
        </p>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              Thành lập{" "}
              {createdDate.toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            <span>{group.stats.totalComics.toLocaleString()} truyện</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            <span>{group.stats.totalViews.toLocaleString()} lượt xem</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>{group.stats.totalMembers} thành viên</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const GroupMembersSection: React.FC<{ group: GroupDetails }> = ({ group }) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Thành viên</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {group.members.map((m) => {
          const joinedDate = new Date(m.joinedAt);
          const initials = m.username
            .split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

          const isLeader = m.role === "leader";

          return (
            <div
              key={m.userId}
              className="flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2"
            >
              <Avatar className="h-9 w-9">
                {m.avatarUrl && (
                  <AvatarImage src={m.avatarUrl} alt={m.username} />
                )}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">{m.username}</span>
                  {isLeader ? (
                    <Crown className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                  <span className="capitalize">
                    Vai trò: {isLeader ? "Leader" : "Member"}
                  </span>
                  <span>•</span>
                  <span>
                    Tham gia{" "}
                    {joinedDate.toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                  {typeof m.totalComics === "number" && m.totalComics >= 0 && (
                    <>
                      <span>•</span>
                      <span>Đã đăng {m.totalComics} truyện</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

const GroupComicsSection: React.FC<{ group: GroupDetails }> = ({ group }) => {
  const navigate = useNavigate();

  if (!group.comics.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Truyện của nhóm</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nhóm này chưa đăng truyện nào.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Truyện của nhóm</CardTitle>
          <span className="text-xs text-muted-foreground">
            Tổng: {group.comics.length} truyện
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          {group.comics.map((comic) => (
            <button
              key={comic.comicId}
              type="button"
              className="flex gap-3 rounded-md border bg-background/80 p-2 text-left transition hover:border-primary/40 hover:shadow-sm"
              onClick={() =>
                navigate(`/truyen-tranh/${comic.slug}`)
              }
            >
              <div className="relative h-20 w-16 overflow-hidden rounded-sm bg-muted flex-shrink-0">
                {comic.coverUrl && (
                  <img
                    src={comic.coverUrl}
                    alt={comic.title}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between gap-1">
                <div className="flex items-start gap-2">
                  <h3 className="text-sm font-semibold line-clamp-2">
                    {comic.title}
                  </h3>
                  {comic.isCompleted && (
                    <Badge variant="outline" className="text-[10px] px-1 h-5">
                      Đã hoàn
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    chương {comic.lastChapterNumber} 
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {comic.views.toLocaleString()} lượt xem
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ==== Page chính ====

const GroupDetailPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { isLoggedIn, user } = React.useContext(AuthContext);

  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJoinGroupDialog, setShowJoinGroupDialog] = useState(false);

  useEffect(() => {
    if (!groupId) return;

    let cancelled = false;

    async function fetchGroup() {
      try {
        setLoading(true);
        setError(null);

        const res = await axios.get<GetGroupDetailsResponse>(
          `${import.meta.env.VITE_API_URL}/groups/${groupId}`
        );

        if (cancelled) return;

        if (!res.data.success) {
          setError(res.data.error?.message || "Không thể tải thông tin nhóm");
          setGroup(null);
          return;
        }
        setGroup(res.data.data);
      } catch (err: any) {
        if (cancelled) return;
        console.error(err);
        setError(
          err?.response?.data?.error?.message ||
            "Không thể tải thông tin nhóm"
        );
        setGroup(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchGroup();
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  if (loading && !group && !error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-2"
          onClick={() => navigate("/groups")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Danh sách nhóm
        </Button>
        <p className="text-sm text-muted-foreground">
          Đang tải thông tin nhóm...
        </p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/groups")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Quay lại danh sách nhóm
        </Button>
        <p className="text-sm text-destructive">
          {error || "Không tìm thấy nhóm dịch."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="mb-2"
        onClick={() => navigate("/groups")}
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Danh sách nhóm
      </Button>

      <GroupDetailHeader group={group} />

      {isLoggedIn && user && group && !group.members.some(m => m.userId === user.userId) && (
        <div className="text-right">
          <Button onClick={() => setShowJoinGroupDialog(true)}>
            Gửi yêu cầu gia nhập nhóm
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
        <GroupComicsSection group={group} />
        <GroupMembersSection group={group} />
      </div>

      {group && (
        <JoinGroupDialog 
          open={showJoinGroupDialog} 
          onOpenChange={setShowJoinGroupDialog} 
          groupId={group.groupId.toString()}
          onSuccess={() => {
            // Optionally refetch group data or update UI after successful join request
            // For now, simply close dialog and navigate
          }}
        />
      )}
    </div>
  );
};

export default GroupDetailPage;
