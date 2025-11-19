// src/components/groups/GroupSidePanel.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  UserPlus,
  Crown,
  Trash2,
  DoorOpen,
} from "lucide-react";

interface GroupStats {
  totalComics: number;
  totalViews: number;
  totalMembers: number;
}

interface GroupInfoFormProps {
  name: string;
  description: string;
  avatarUrl: string;
  stats: GroupStats;
  canManage: boolean;
  saving: boolean;
  onChangeName: (v: string) => void;
  onChangeDescription: (v: string) => void;
  onChangeAvatarUrl: (v: string) => void;
  onSave: () => void;
}

interface MemberAndLeaderActionsProps {
  canManage: boolean;
  addingMember: boolean;
  changingLeader: boolean;
  newMemberUserId: string;
  newLeaderUserId: string;
  onChangeNewMemberUserId: (v: string) => void;
  onChangeNewLeaderUserId: (v: string) => void;
  onAddMember: () => void;
  onChangeLeader: () => void;
}

interface DangerZoneProps {
  isOwner: boolean;
  leaving: boolean;
  deleting: boolean;
  onLeave: () => void;
  onDelete: () => void;
}

interface GroupSidePanelProps {
  info: GroupInfoFormProps;
  memberLeaderActions: MemberAndLeaderActionsProps;
  dangerZone: DangerZoneProps;
}

export const GroupSidePanel: React.FC<GroupSidePanelProps> = ({
  info,
  memberLeaderActions,
  dangerZone,
}) => {
  const {
    name,
    description,
    avatarUrl,
    stats,
    canManage,
    saving,
    onChangeName,
    onChangeDescription,
    onChangeAvatarUrl,
    onSave,
  } = info;

  const {
    canManage: canManageMembers,
    addingMember,
    changingLeader,
    newMemberUserId,
    newLeaderUserId,
    onChangeNewMemberUserId,
    onChangeNewLeaderUserId,
    onAddMember,
    onChangeLeader,
  } = memberLeaderActions;

  const {
    isOwner,
    leaving,
    deleting,
    onLeave,
    onDelete,
  } = dangerZone;

  return (
    <div className="space-y-4">
      {/* Info nhóm */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Thông tin nhóm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="block text-sm font-medium">
            Tên nhóm
            <Input
              className="mt-1"
              value={name}
              onChange={(e) => onChangeName(e.target.value)}
              disabled={!canManage}
            />
          </label>
          <label className="block text-sm font-medium">
            Avatar URL
            <Input
              className="mt-1"
              value={avatarUrl}
              onChange={(e) => onChangeAvatarUrl(e.target.value)}
              disabled={!canManage}
            />
          </label>
          <label className="block text-sm font-medium">
            Mô tả
            <Textarea
              className="mt-1 min-h-[80px]"
              value={description}
              onChange={(e) => onChangeDescription(e.target.value)}
              disabled={!canManage}
            />
          </label>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>
              Truyện: <strong>{stats.totalComics.toLocaleString()}</strong>
            </span>
            <span>•</span>
            <span>
              View: <strong>{stats.totalViews.toLocaleString()}</strong>
            </span>
            <span>•</span>
            <span>
              Thành viên: <strong>{stats.totalMembers}</strong>
            </span>
          </div>
          {canManage && (
            <div className="flex justify-end">
              <Button size="sm" onClick={onSave} disabled={saving}>
                <Save className="mr-1 h-4 w-4" />
                Lưu thay đổi
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Thêm member + đổi leader */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Thành viên & Leader</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs text-muted-foreground">
          {/* Thêm member */}
          <div className="space-y-1">
            <p className="font-medium text-foreground flex items-center gap-1">
              <UserPlus className="h-4 w-4" />
              Thêm thành viên
            </p>
            <p>
              Nhập <strong>userId</strong> và gửi tới{" "}
              <code>/api/groups/:groupId/members</code>.
            </p>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="userId..."
                value={newMemberUserId}
                onChange={(e) => onChangeNewMemberUserId(e.target.value)}
                disabled={!canManageMembers}
              />
              <Button
                onClick={onAddMember}
                disabled={!canManageMembers || addingMember}
              >
                Thêm
              </Button>
            </div>
          </div>

          {/* Đổi leader */}
          <div className="pt-3 border-t space-y-1">
            <p className="font-medium text-foreground flex items-center gap-1">
              <Crown className="h-4 w-4" />
              Chuyển leader
            </p>
            <p>
              Có thể chọn từ danh sách hoặc nhập <strong>userId</strong> rồi
              gọi <code>/api/groups/:groupId/leader</code>.
            </p>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="userId leader mới..."
                value={newLeaderUserId}
                onChange={(e) => onChangeNewLeaderUserId(e.target.value)}
                disabled={!canManageMembers}
              />
              <Button
                variant="outline"
                onClick={onChangeLeader}
                disabled={!canManageMembers || changingLeader}
              >
                Cập nhật
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-destructive flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Khu vực nguy hiểm
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs text-muted-foreground">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-medium text-foreground">Rời nhóm dịch</p>
              <p>
                Gọi <code>POST /api/groups/:groupId/leave</code>.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onLeave}
              disabled={leaving}
            >
              <DoorOpen className="mr-1 h-4 w-4" />
              Rời nhóm
            </Button>
          </div>

          {isOwner && (
            <div className="flex items-center justify-between gap-2 border-t pt-3">
              <div>
                <p className="font-medium text-destructive">Xóa nhóm dịch</p>
                <p>
                  Chỉ owner. Gọi <code>DELETE /api/groups/:groupId</code>.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={onDelete}
                disabled={deleting}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Xóa nhóm
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
