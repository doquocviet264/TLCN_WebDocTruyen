import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { AuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, UserPlus } from "lucide-react";
import { JoinRequests } from "@/components/groups/JoinRequests";

interface GroupMember {
  userId: number;
  username: string;
  avatar: string | null;
  role: string; // 'leader' or 'member'
  joinedAt: string;
}

interface GroupDetails {
  groupId: number;
  name: string;
  description: string;
  avatarUrl: string | null;
  ownerId: number;
  members: GroupMember[];
}

interface EligibleUser {
  userId: number;
  username: string;
  avatar: string | null;
  role: string; // 'translator'
}

interface ApiEnvelope<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    status?: number;
  };
}

export default function GroupMembersPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<GroupDetails | null>(null);

  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUserToAdd, setSelectedUserToAdd] =
    useState<EligibleUser | null>(null);

  // ===== Fetch Group Details and Members =====
  useEffect(() => {
    if (!groupId) return;

    let cancelled = false;

    async function fetchGroupDetails() {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await axios.get<ApiEnvelope<GroupDetails>>(
          `${import.meta.env.VITE_API_URL}/groups/${groupId}`,
          { headers }
        );

        if (cancelled) return;

        if (!res.data.success || !res.data.data) {
          throw new Error(res.data.error?.message || "Không thể tải nhóm");
        }

        const g = res.data.data;

        const safeGroup: GroupDetails = {
          ...g,
          members: Array.isArray(g.members) ? g.members : [],
        };

        setGroup(safeGroup);
      } catch (err: any) {
        console.error(err);
        toast.error(
          err?.response?.data?.error?.message || "Không thể tải thông tin nhóm"
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchGroupDetails();
    return () => {
      cancelled = true;
    };
  }, [groupId, user?.userId]);

  // ===== Search Eligible Users (UI + logic mới, dùng canManage) =====
  useEffect(() => {
    if (!isAddMemberDialogOpen || !groupId || !group) {
      setEligibleUsers([]);
      setSelectedUserToAdd(null);
      return;
    }

    const members = Array.isArray(group.members) ? group.members : [];
    const isOwner = group.ownerId === user?.userId;
    const isLeaderRole = members.some(
      (m) => m.userId === user?.userId && m.role === "leader"
    );
    const canManage = isOwner || isLeaderRole;

    if (!canManage) {
      setEligibleUsers([]);
      setSelectedUserToAdd(null);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      const q = searchQuery.trim();
      if (q.length === 0) {
        setEligibleUsers([]);
        setSelectedUserToAdd(null);
        return;
      }

      try {
        setSearchingUsers(true);
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await axios.get<ApiEnvelope<EligibleUser[]>>(
          `${import.meta.env.VITE_API_URL}/groups/${groupId}/eligible-members?q=${encodeURIComponent(
            q
          )}`,
          { headers }
        );

        console.log("eligible-members response:", res.data);

        if (!res.data.success || !res.data.data) {
          throw new Error(res.data.error?.message || "Không thể tìm kiếm user");
        }

        const list = res.data.data;
        setEligibleUsers(Array.isArray(list) ? list : []);
      } catch (err: any) {
        console.error(err);
        toast.error(
          err?.response?.data?.error?.message || "Lỗi khi tìm kiếm user"
        );
        setEligibleUsers([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [
    searchQuery,
    isAddMemberDialogOpen,
    groupId,
    group,
    user?.userId,
  ]);

  // ===== Add Member Handler =====
  const handleAddMember = async () => {
    if (!groupId || !selectedUserToAdd) return;

    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.post<ApiEnvelope>(
        `${import.meta.env.VITE_API_URL}/groups/${groupId}/members`,
        { userId: selectedUserToAdd.userId },
        { headers }
      );

      if (!res.data.success) {
        throw new Error(res.data.error?.message || "Thêm thành viên thất bại");
      }

      toast.success("Thêm thành viên thành công!");
      setIsAddMemberDialogOpen(false);
      setSelectedUserToAdd(null);
      setSearchQuery("");
      setEligibleUsers([]);

      setGroup((prevGroup) => {
        if (!prevGroup) return null;
        const safeMembers = Array.isArray(prevGroup.members)
          ? prevGroup.members
          : [];
        const newMember: GroupMember = {
          userId: selectedUserToAdd.userId,
          username: selectedUserToAdd.username,
          avatar: selectedUserToAdd.avatar,
          role: "member",
          joinedAt: new Date().toISOString(),
        };
        return {
          ...prevGroup,
          members: [...safeMembers, newMember],
        };
      });
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.error?.message || "Lỗi khi thêm thành viên"
      );
    }
  };

  // ===== Kick Member Handler (Owner hoặc Leader, nhưng Leader không kick Leader/Owner) =====
  const handleKickMember = async (memberId: number) => {
    if (!groupId || !group) return;

    const members = Array.isArray(group.members) ? group.members : [];
    const isOwner = group.ownerId === user?.userId;
    const isLeaderRole = members.some(
      (m) => m.userId === user?.userId && m.role === "leader"
    );
    const canManage = isOwner || isLeaderRole;

    if (!canManage) {
      toast.error("Bạn không có quyền quản lý thành viên.");
      return;
    }

    if (memberId === user?.userId) {
      toast.error("Không thể kick chính mình.");
      return;
    }

    const targetMember = members.find((m) => m.userId === memberId);
    if (!targetMember) {
      toast.error("Không tìm thấy thành viên này.");
      return;
    }

    // Leader không được kick Leader khác hoặc Owner
    if (!isOwner) {
      if (targetMember.userId === group.ownerId) {
        toast.error("Nhóm trưởng không thể đá chủ nhóm.");
        return;
      }
    }

    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.delete<ApiEnvelope>(
        `${import.meta.env.VITE_API_URL}/groups/${groupId}/members/${memberId}`,
        { headers }
      );

      if (!res.data.success) {
        throw new Error(res.data.error?.message || "Đá thành viên thất bại");
      }

      toast.success("Đã đá thành viên khỏi nhóm.");

      setGroup((prevGroup) => {
        if (!prevGroup) return null;
        const safeMembers = Array.isArray(prevGroup.members)
          ? prevGroup.members
          : [];
        return {
          ...prevGroup,
          members: safeMembers.filter((member) => member.userId !== memberId),
        };
      });
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.error?.message || "Lỗi khi đá thành viên"
      );
    }
  };

  // ===== Set Leader Handler=====
  const handleSetLeader = async (
    newLeaderId: number,
    currentLeaderId: number
  ) => {
    if (!groupId || !group) return;

    const members = Array.isArray(group.members) ? group.members : [];

    if (newLeaderId === currentLeaderId) {
      toast.error("Không thể chuyển nhóm trưởng cho chính người đó.");
      return;
    }

    const target = members.find((m) => m.userId === newLeaderId);
    if (!target) {
      toast.error("Không tìm thấy thành viên này.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.post<ApiEnvelope>(
        `${import.meta.env.VITE_API_URL}/groups/${groupId}/leader`,
        { newLeaderId },
        { headers }
      );

      if (!res.data.success) {
        throw new Error(
          res.data.error?.message || "Chuyển quyền nhóm trưởng thất bại"
        );
      }

      toast.success("Đã chuyển quyền nhóm trưởng thành công!");

      setGroup((prevGroup) => {
        if (!prevGroup) return null;
        const safeMembers = Array.isArray(prevGroup.members)
          ? prevGroup.members
          : [];

        const updatedMembers = safeMembers.map((member) => {
          if (member.userId === newLeaderId) {
            return { ...member, role: "leader" };
          }
          if (member.userId === currentLeaderId) {
            return { ...member, role: "member" };
          }
          return member;
        });

        return {
          ...prevGroup,
          members: updatedMembers,
        };
      });
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.error?.message || "Lỗi khi chuyển quyền leader"
      );
    }
  };

  if (loading || !group) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
        Đang tải thông tin thành viên...
      </div>
    );
  }

  const members = Array.isArray(group.members) ? group.members : [];
  const isOwner = group.ownerId === user?.userId;
  const isLeaderRole = members.some(
    (m) => m.userId === user?.userId && m.role === "leader"
  );
  const canManage = isOwner || isLeaderRole;

  const leaderMembers = members.filter((m) => m.role === "leader");
  const normalMembers = members.filter((m) => m.role !== "leader");
  const totalMembers = members.length;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      {canManage && groupId && <JoinRequests groupId={groupId} />}
      <Card className="border border-border/70 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={
                  group.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    group.name
                  )}&background=random`
                }
              />
              <AvatarFallback>
                {group.name?.charAt(0)?.toUpperCase() || "G"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <CardTitle className="text-xl">
                Thành viên nhóm &nbsp;
                <span className="text-base font-normal text-muted-foreground">
                  ({totalMembers})
                </span>
              </CardTitle>
              <CardDescription>
                Quản lý các thành viên trong nhóm dịch{" "}
                <span className="font-medium text-foreground">
                  “{group.name}”
                </span>
                .
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {/* ✅ Hiển thị role hiện tại */}
            {isOwner ? (
              <Badge className="text-xs bg-purple-600 text-white">
                Bạn là <span className="ml-1 font-semibold">Chủ nhóm dịch</span>
              </Badge>
            ) : isLeaderRole ? (
              <Badge variant="outline" className="text-xs">
                Bạn là <span className="ml-1 font-semibold">Trưởng nhóm</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                Bạn là <span className="ml-1 font-semibold">Thành viên</span>
              </Badge>
            )}

            {/* ✅ Owner hoặc Leader mới thấy nút Thêm thành viên */}
            {canManage && (
              <Dialog
                open={isAddMemberDialogOpen}
                onOpenChange={setIsAddMemberDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Thêm thành viên
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[540px]">
                  <DialogHeader>
                    <DialogTitle>Thêm thành viên mới</DialogTitle>
                    <DialogDescription>
                      Tìm kiếm và chọn một người dùng có quyền dịch giả để thêm vào nhóm.
                    </DialogDescription>
                  </DialogHeader>

                  {/* Ô tìm kiếm */}
                  <div className="space-y-2 py-2">
                    <Label
                      htmlFor="username"
                      className="text-sm font-medium text-foreground"
                    >
                      Tìm theo username
                    </Label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="username"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Nhập username dịch giả để tìm kiếm..."
                        className="pl-9"
                        autoComplete="off"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Chỉ hiển thị những tài khoản đã được cấp quyền{" "}
                      <span className="font-medium">dịch giả</span> và chưa
                      nằm trong nhóm.
                    </p>
                  </div>

                  {/* Kết quả tìm kiếm */}
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-medium uppercase tracking-wide">
                        Kết quả tìm kiếm
                      </span>
                      <span>
                        {eligibleUsers.length} người dùng
                        {searchingUsers && " • đang tải..."}
                      </span>
                    </div>

                    <div className="rounded-lg border bg-muted/40">
                      {searchingUsers ? (
                        <div className="flex h-[220px] items-center justify-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Đang tìm kiếm user...</span>
                        </div>
                      ) : (
                        <ScrollArea className="h-[240px] w-full rounded-lg">
                          {eligibleUsers.length > 0 ? (
                            <div className="space-y-1.5 p-2">
                              {eligibleUsers.map((user) => {
                                const isSelected =
                                  selectedUserToAdd?.userId === user.userId;
                                const base =
                                  "flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm shadow-sm transition";
                                const stateClass = isSelected
                                  ? "border-primary bg-primary/5"
                                  : "border-transparent bg-background hover:border-primary/40 hover:bg-accent";
                                return (
                                  <div
                                    key={user.userId}
                                    className={`${base} ${stateClass}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage
                                          src={
                                            user.avatar ||
                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                              user.username
                                            )}&background=random`
                                          }
                                        />
                                        <AvatarFallback>
                                          {user.username.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex flex-col">
                                        <span className="font-medium">
                                          {user.username}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          Vai trò: Dịch giả
                                        </span>
                                      </div>
                                    </div>
                                    <Button
                                      variant={isSelected ? "secondary" : "outline"}
                                      size="sm"
                                      onClick={() => setSelectedUserToAdd(user)}
                                    >
                                      {isSelected ? "Đã chọn" : "Chọn"}
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="flex h-[220px] items-center justify-center px-4 text-center text-sm text-muted-foreground">
                              {searchQuery.trim().length > 0
                                ? "Không tìm thấy user dịch giả nào phù hợp với từ khóa hiện tại."
                                : "Nhập username để bắt đầu tìm kiếm thành viên mới cho nhóm."}
                            </div>
                          )}
                        </ScrollArea>
                      )}
                    </div>
                  </div>

                  {/* User đã chọn */}
                  {selectedUserToAdd && (
                    <div className="mt-3 flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm">
                      <span className="text-muted-foreground">Đã chọn:</span>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage
                            src={
                              selectedUserToAdd.avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                selectedUserToAdd.username
                              )}&background=random`
                            }
                          />
                          <AvatarFallback>
                            {selectedUserToAdd.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {selectedUserToAdd.username}
                        </span>
                      </div>
                    </div>
                  )}

                  <DialogFooter className="mt-3">
                    <Button
                      onClick={handleAddMember}
                      disabled={!selectedUserToAdd}
                    >
                      Xác nhận thêm
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {members.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nhóm chưa có thành viên nào.
            </p>
          ) : (
            <div className="space-y-4">
              {leaderMembers.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase text-muted-foreground">
                      Leader
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {leaderMembers.length} người
                    </span>
                  </div>
                  <div className="space-y-2">
                    {leaderMembers.map((member) => (
                      <div
                        key={member.userId}
                        className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={
                                member.avatar ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  member.username
                                )}&background=random`
                              }
                            />
                            <AvatarFallback>
                              {member.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5">
                            <p className="text-sm font-semibold">
                              {member.username}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                Leader
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Tham gia:{" "}
                                {new Date(
                                  member.joinedAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              )}

              {leaderMembers.length > 0 && normalMembers.length > 0 && (
                <Separator className="my-2" />
              )}

              {normalMembers.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase text-muted-foreground">
                      Thành viên
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {normalMembers.length} người
                    </span>
                  </div>
                  <div className="space-y-2">
                    {normalMembers.map((member) => (
                      <div
                        key={member.userId}
                        className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 shadow-sm transition hover:bg-accent/40"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={
                                member.avatar ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  member.username
                                )}&background=random`
                              }
                            />
                            <AvatarFallback>
                              {member.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5">
                            <p className="text-sm font-semibold">
                              {member.username}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              Tham gia:{" "}
                              {new Date(member.joinedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Nút hành động cho Member thường */}
                        <div className="flex gap-2">
                          {/*owner và leader được chuyển Leader */}
                          {canManage && member.userId !== user?.userId && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Cấp quyền nhóm trưởng
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Chuyển quyền nhóm trưởng cho {member.username}?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bạn sắp chuyển quyền nhóm trưởng của nhóm dịch này cho{" "}
                                    <span className="font-semibold text-foreground">
                                      {member.username}
                                    </span>
                                    . Bạn sẽ giữ vai trò Chủ sở hữu và có thể tiếp tục
                                    quản lý nhóm. Thao tác này ảnh hưởng tới một số quyền hạn hiện tại, hãy xác nhận trước khi tiếp tục.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Huỷ</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      leaderMembers[0] &&
                                      handleSetLeader(
                                        member.userId,
                                        leaderMembers[0].userId
                                      )
                                    }
                                  >
                                    Xác nhận chuyển
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}

                          {/* ✅ Kick: Owner kick được tất, Leader chỉ kick member thường */}
                          {canManage && member.userId !== user?.userId && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  Kick
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Kick thành viên khỏi nhóm?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bạn sắp xoá thành viên{" "}
                                    <span className="font-semibold text-foreground">
                                      {member.username}
                                    </span>{" "}
                                    khỏi nhóm dịch. Thao tác này không thể hoàn tác.
                                    Bạn có chắc chắn muốn tiếp tục?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Huỷ</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => handleKickMember(member.userId)}
                                  >
                                    Xác nhận kick
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
