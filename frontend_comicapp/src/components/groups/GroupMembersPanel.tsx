// src/components/groups/GroupMembersPanel.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, UserCog, UserMinus } from "lucide-react";

export type GroupRole = "leader" | "member";

export interface GroupMember {
  userId: number;
  username: string;
  avatarUrl?: string | null;
  role: GroupRole;
  joinedAt: string;
  totalComics?: number | null;
}

interface GroupMembersPanelProps {
  members: GroupMember[];
  currentUserId?: number;
  canManage: boolean;
  isChangingLeader: boolean;
  kickingUserId: number | null;
  onKick: (userId: number) => void;
  onChangeLeader: (userId: number) => void;
}

const GroupMembersPanel: React.FC<GroupMembersPanelProps> = ({
  members,
  currentUserId,
  canManage,
  isChangingLeader,
  kickingUserId,
  onKick,
  onChangeLeader,
}) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <UserCog className="h-4 w-4" />
          Thành viên nhóm
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nhóm chưa có thành viên nào.
          </p>
        ) : (
          members.map((m) => {
            const isLeader = m.role === "leader";
            const isSelf = currentUserId === m.userId;
            const initials = m.username
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {m.username}
                    </span>
                    {isLeader && (
                      <Badge
                        className="flex items-center gap-1 px-1.5 py-0 h-5 text-[10px]"
                        variant="default"
                      >
                        <Crown className="h-3 w-3" />
                        Leader
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    <span>ID: {m.userId}</span>
                    {typeof m.totalComics === "number" && m.totalComics >= 0 && (
                      <>
                        <span>•</span>
                        <span>{m.totalComics} truyện</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Hành động quản lý */}
                {canManage && !isLeader && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      title="Chuyển leader cho thành viên này"
                      onClick={() => onChangeLeader(m.userId)}
                      disabled={isChangingLeader}
                    >
                      <Crown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      title="Xóa khỏi nhóm"
                      onClick={() => onKick(m.userId)}
                      disabled={kickingUserId === m.userId}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {canManage && isLeader && isSelf && (
                  <span className="text-[10px] text-muted-foreground">
                    (Bạn là leader)
                  </span>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default GroupMembersPanel;
