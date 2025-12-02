import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, Eye, Users, ChevronsLeft, ChevronsRight, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import CreateGroupDialog from "@/components/groups/dialog/CreateGroupDialog"; // Import CreateGroupDialog

// ==== Types khớp với API GET /api/groups ====

interface GroupStats {
  totalComics: number;
  totalViews: number;
  totalMembers: number;
}

interface GroupSummary {
  groupId: number;
  name: string;
  description: string;
  avatarUrl?: string | null;
  ownerId: number;
  createdAt: string;
  stats: GroupStats;
}

interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

interface ListGroupsResponse {
  success: boolean;
  data: GroupSummary[];
  meta?: PaginationMeta;
  error?: {
    message: string;
    code?: string;
    status?: number;
  };
}

// ==== Components nhỏ trong file ====

const GroupCard: React.FC<{
  group: GroupSummary;
  onClick?: () => void;
}> = ({ group, onClick }) => {
  const initials = group.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg hover:border-primary/50",
        "bg-card/90 backdrop-blur-sm"
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center gap-4 pb-3">
        <Avatar className="h-14 w-14 ring-2 ring-primary/30">
          {group.avatarUrl && (
            <AvatarImage src={group.avatarUrl} alt={group.name} />
          )}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold line-clamp-1">
              {group.name}
            </h3>
            <span className="rounded-full border px-2 py-0.5 text-xs uppercase tracking-wide text-muted-foreground">
              {group.stats.totalComics} truyện
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {group.description}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>{group.stats.totalComics.toLocaleString()} truyện</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{group.stats.totalViews.toLocaleString()} lượt xem</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{group.stats.totalMembers} thành viên</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ==== Page chính ====

const GroupsListPage: React.FC = () => {
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [items, setItems] = useState<GroupSummary[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState(false); // State for dialog visibility
  const [refreshTrigger, setRefreshTrigger] = useState(0); // State to trigger re-fetch of groups

  // Để tránh call API liên tục khi gõ, dùng debouncedQ đơn giản
  const [debouncedQ, setDebouncedQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let cancelled = false;
    async function fetchGroups() {
      try {
        setLoading(true);
        setError(null);

        const res = await axios.get<ListGroupsResponse>(`${import.meta.env.VITE_API_URL}/groups`, {
          params: {
            q: debouncedQ || undefined,
            page,
            limit,
          },
        });

        if (cancelled) return;

        if (!res.data.success) {
          setError(res.data.error?.message || "Lỗi khi tải danh sách nhóm");
          setItems([]);
          setMeta(null);
          return;
        }

        setItems(res.data.data || []);
        setMeta(
          res.data.meta || {
            page,
            limit,
            totalItems: res.data.data.length,
            totalPages: 1,
          }
        );
      } catch (err: any) {
        if (cancelled) return;
        console.error(err);
        setError(
          err?.response?.data?.error?.message || "Không thể tải danh sách nhóm"
        );
        setItems([]);
        setMeta(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchGroups();
    return () => {
      cancelled = true;
    };
  }, [debouncedQ, page, limit, refreshTrigger]); // Add refreshTrigger to dependencies

  const totalItems = meta?.totalItems ?? items.length;
  const totalPages = meta?.totalPages ?? 1;

  const summaryText = useMemo(() => {
    if (!totalItems) return "Không có nhóm nào.";
    if (!meta) return `Tổng số nhóm: ${totalItems}`;
    const from = (meta.page - 1) * meta.limit + 1;
    const to = Math.min(meta.page * meta.limit, totalItems);
    return `Hiển thị ${from}-${to} / ${totalItems} nhóm`;
  }, [meta, totalItems]);

  const canPrev = (meta?.page ?? 1) > 1;
  const canNext = (meta?.page ?? 1) < totalPages;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Nhóm dịch</h1>
          <p className="text-sm text-muted-foreground">
            Khám phá các nhóm dịch đang hoạt động trên hệ thống.
          </p>
        </div>
        <div className="mt-2 flex items-center gap-3 md:mt-0 md:ml-auto w-full md:w-auto">
          <Button onClick={() => setIsCreateGroupDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Tạo nhóm mới
          </Button>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên nhóm, mô tả..."
              className="pl-9"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1); // reset về trang 1 khi đổi search
              }}
            />
          </div>
        </div>
      </div>

      {/* Stats / summary */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span>
          Tổng số nhóm:{" "}
          <span className="font-semibold">{totalItems}</span>
        </span>
        <span>•</span>
        <span>{summaryText}</span>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* List */}
      {loading && !items.length ? (
        <div className="mt-8 text-center text-muted-foreground text-sm">
          Đang tải danh sách nhóm...
        </div>
      ) : !items.length ? (
        <div className="mt-8 text-center text-muted-foreground text-sm">
          Không tìm thấy nhóm nào phù hợp.
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((group) => (
              <GroupCard
                key={group.groupId}
                group={group}
                onClick={() => navigate(`/groups/${group.groupId}`)}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              Trang {meta?.page ?? 1} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={!canPrev || loading}
                onClick={() => canPrev && setPage((p) => p - 1)}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={!canNext || loading}
                onClick={() => canNext && setPage((p) => p + 1)}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      <CreateGroupDialog
        isOpen={isCreateGroupDialogOpen}
        onClose={() => setIsCreateGroupDialogOpen(false)}
        onGroupCreated={() => {
          setIsCreateGroupDialogOpen(false);
          setRefreshTrigger((prev) => prev + 1); // Trigger a refresh
          setPage(1); // Go back to the first page to see the new group
        }}
      />
    </div>
  );
};

export default GroupsListPage;
