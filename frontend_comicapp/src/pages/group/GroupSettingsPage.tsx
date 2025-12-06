import React, { useState, useRef, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthContext } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
import { availableAvatarUrls } from "@/mocks/groupManagement";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ImageIcon,
  Loader2,
  Settings as SettingsIcon,
  Trash2,
  LogOut,
} from "lucide-react";

interface GroupDetails {
  groupId: number;
  name: string;
  description: string;
  avatarUrl: string | null;
  ownerId: number; // ⚠️ Thêm ownerId để check quyền
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

export default function GroupSettingsPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useContext(AuthContext); // ⚠️ Lấy currentUserId

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>("");
  const [localFile, setLocalFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===== load group details từ API =====
  useEffect(() => {
    if (!groupId) return;

    let cancelled = false;

    async function fetchGroup() {
      try {
        setLoading(true);
        const res = await axios.get<ApiEnvelope<GroupDetails>>(
          `${import.meta.env.VITE_API_URL}/groups/${groupId}`
        );

        if (cancelled) return;

        if (!res.data.success || !res.data.data) {
          throw new Error(res.data.error?.message || "Không thể tải nhóm");
        }

        const g = res.data.data;
        setGroup(g);
        setName(g.name || "");
        setDescription(g.description || "");
        setSelectedAvatarUrl(g.avatarUrl || availableAvatarUrls[0] || "");
      } catch (err: any) {
        console.error(err);
        toast.error(
          err?.response?.data?.error?.message || "Không thể tải thông tin nhóm"
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchGroup();
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  // ===== chọn avatar từ danh sách mẫu =====
  const handleAvatarSelect = (url: string) => {
    setSelectedAvatarUrl(url);
    setLocalFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ===== chọn file local để làm avatar + validate < 5MB =====
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      // ⚠️ Validate dung lượng file
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ảnh không được quá 5MB");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setLocalFile(null);
        // Giữ lại avatar cũ
        if (group) {
          setSelectedAvatarUrl(group.avatarUrl || availableAvatarUrls[0] || "");
        }
        return;
      }

      setLocalFile(file);
      setSelectedAvatarUrl(URL.createObjectURL(file)); // preview
    } else {
      setLocalFile(null);
      if (group) {
        setSelectedAvatarUrl(group.avatarUrl || availableAvatarUrls[0] || "");
      }
    }
  };

  // ===== lưu settings (PATCH /api/groups/:groupId) =====
  const handleSave = async () => {
    if (!groupId || !group) return;
    if (!name.trim()) {
      toast.error("Tên nhóm không được để trống");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("description", description.trim());

      if (localFile) {
        formData.append("avatar", localFile);
      } else if (selectedAvatarUrl) {
        formData.append("avatarUrl", selectedAvatarUrl);
      } else {
        formData.append("avatarUrl", "");
      }

      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.patch<ApiEnvelope>(
        `${import.meta.env.VITE_API_URL}/groups/${groupId}`,
        formData,
        { headers: { ...headers, "Content-Type": "multipart/form-data" } }
      );

      if (!res.data.success) {
        throw new Error(res.data.error?.message || "Cập nhật nhóm thất bại");
      }

      toast.success("Cập nhật thông tin nhóm thành công");
      setIsEditing(false);

      setGroup((prev) =>
        prev
          ? {
              ...prev,
              name: name.trim(),
              description: description.trim(),
              avatarUrl: selectedAvatarUrl,
            }
          : prev
      );
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.error?.message ||
          "Cập nhật thông tin nhóm thất bại"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (group) {
      setName(group.name);
      setDescription(group.description);
      setSelectedAvatarUrl(group.avatarUrl || availableAvatarUrls[0] || "");
      setLocalFile(null);
    }
    setIsEditing(false);
  };

  // ===== rời nhóm (POST /api/groups/:groupId/leave) =====
  const handleLeaveGroup = async () => {
    if (!groupId) return;

    try {
      setLeaving(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.post<ApiEnvelope>(
        `${import.meta.env.VITE_API_URL}/groups/${groupId}/leave`,
        {},
        { headers }
      );

      if (!res.data.success) {
        throw new Error(res.data.error?.message || "Rời nhóm thất bại");
      }

      toast.success("Rời nhóm thành công");
      navigate("/groups");
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.error?.message || "Rời nhóm thất bại"
      );
    } finally {
      setLeaving(false);
    }
  };

  // ===== xóa nhóm (DELETE /api/groups/:groupId) =====
  const handleDeleteGroup = async () => {
    if (!groupId) return;

    try {
      setDeleting(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.delete<ApiEnvelope>(
        `${import.meta.env.VITE_API_URL}/groups/${groupId}`,
        { headers }
      );

      if (!res.data.success) {
        throw new Error(res.data.error?.message || "Xóa nhóm thất bại");
      }

      toast.success("Xóa nhóm thành công");
      navigate("/groups");
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.error?.message || "Xóa nhóm thất bại"
      );
    } finally {
      setDeleting(false);
    }
  };

  // ===== render =====

  if (loading && !group) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Đang tải thông tin nhóm...
      </div>
    );
  }

  if (!group) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        Không tìm thấy nhóm hoặc bạn không có quyền truy cập.
      </div>
    );
  }

  // ⚠️ Xác định Owner để ẩn/hiện nút Rời/Xoá
  const isOwner = group.ownerId === user?.userId;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      {/* Header chung */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={
                  group.avatarUrl ||
                  selectedAvatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    group.name
                  )}&background=random`
                }
              />
              <AvatarFallback>
                {group.name?.charAt(0)?.toUpperCase() || "G"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <h1 className="flex items-center gap-2 text-lg font-semibold">
                <SettingsIcon className="h-4 w-4 text-muted-foreground" />
                Cài đặt nhóm
              </h1>
              <p className="text-sm text-muted-foreground">
                Quản lý thông tin hiển thị và các thao tác quan trọng của nhóm{" "}
                <span className="font-medium text-foreground">
                  “{group.name}”
                </span>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-[2fr,1.3fr]">
        {/* CARD: Thông tin nhóm */}
        <Card className="border border-border/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">
                Thông tin nhóm
              </CardTitle>
              <CardDescription>
                Cập nhật tên, mô tả và ảnh đại diện cho nhóm dịch.
              </CardDescription>
            </div>
            {!isEditing && (
              <Button size="sm" onClick={() => setIsEditing(true)}>
                Chỉnh sửa
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="name">Tên nhóm</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập tên nhóm..."
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả mục tiêu, quy tắc, hoặc nội dung nhóm..."
                  disabled={!isEditing}
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="avatar">Ảnh đại diện</Label>

                {/* Preview luôn hiển thị */}
                <div className="flex items-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-md border bg-muted/40">
                    {selectedAvatarUrl || group.avatarUrl ? (
                      <img
                        src={
                          selectedAvatarUrl ||
                          group.avatarUrl ||
                          availableAvatarUrls[0]
                        }
                        alt="Avatar preview"
                        className="h-16 w-16 rounded-md object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Đây là ảnh đại diện hiện tại của nhóm. Bạn có thể chọn ảnh
                    mẫu hoặc tải lên ảnh mới khi bật chế độ chỉnh sửa.
                  </p>
                </div>

                {isEditing && (
                  <>
                    {/* Avatars preset */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Chọn nhanh từ bộ avatar mẫu:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {availableAvatarUrls.map((url) => (
                          <button
                            key={url}
                            type="button"
                            onClick={() => handleAvatarSelect(url)}
                            className={`relative h-14 w-14 overflow-hidden rounded-md border transition hover:shadow-sm ${
                              selectedAvatarUrl === url && !localFile
                                ? "border-primary ring-2 ring-primary/40"
                                : "border-border"
                            }`}
                          >
                            <img
                              src={url}
                              alt="Avatar option"
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Upload file */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">
                        Hoặc tải ảnh từ máy:
                      </p>
                      <div className="flex items-center gap-3">
                        <Input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                        />
                        <Label
                          htmlFor="avatar-upload"
                          className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs font-medium shadow-sm hover:bg-accent"
                        >
                          <ImageIcon className="h-4 w-4" />
                          Chọn tệp ảnh
                        </Label>
                        {localFile && (
                          <span className="truncate text-xs text-muted-foreground">
                            {localFile.name}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Hỗ trợ các định dạng phổ biến như JPG, PNG. Ảnh không
                        được quá 5MB.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t bg-muted/40 px-6 py-3">
            {isEditing && (
              <>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  Hủy
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    "Lưu thay đổi"
                  )}
                </Button>
              </>
            )}
          </CardFooter>
        </Card>

        {/* CARD: Khu vực nguy hiểm */}
        <Card className="border-destructive/40 bg-destructive/5 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-destructive">
              Khu vực nguy hiểm
            </CardTitle>
            <CardDescription>
              Các hành động dưới đây có thể làm bạn mất quyền truy cập hoặc xoá
              vĩnh viễn nhóm. Hãy chắc chắn trước khi tiếp tục.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* ✅ CHỈ HIỂN THỊ NÚT RỜI NHÓM NẾU KHÔNG PHẢI OWNER */}
            {!isOwner && (
              <div className="flex items-start justify-between gap-4 rounded-lg border border-destructive/60 bg-background px-4 py-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <LogOut className="h-4 w-4 text-destructive" />
                    <h3 className="text-sm font-semibold">Rời khỏi nhóm</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Bạn sẽ không còn thấy nhóm này trong danh sách. Tất cả quyền
                    truy cập vào nhóm sẽ bị thu hồi.
                  </p>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={leaving}
                    >
                      Rời nhóm
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Rời khỏi nhóm này?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bạn sẽ mất quyền truy cập vào nhóm{" "}
                        <span className="font-semibold text-foreground">
                          “{group.name}”
                        </span>{" "}
                        và không thể xem nội dung nội bộ của nhóm nữa. Bạn vẫn có
                        thể xin tham gia lại nếu nhóm cho phép.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={handleLeaveGroup}
                      >
                        {leaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang rời...
                          </>
                        ) : (
                          "Xác nhận rời nhóm"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}

            {/* ✅ CHỈ HIỂN THỊ NÚT XÓA NHÓM NẾU LÀ OWNER */}
            {isOwner && (
              <div className="flex items-start justify-between gap-4 rounded-lg border border-destructive/60 bg-background px-4 py-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <h3 className="text-sm font-semibold">Xóa nhóm</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Hành động này sẽ xoá vĩnh viễn nhóm và toàn bộ dữ liệu liên
                    quan. Không thể hoàn tác. Chỉ người tạo ra nhóm mới có thể
                    thực hiện thao tác này.
                  </p>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deleting}
                    >
                      Xóa nhóm
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Xác nhận xóa vĩnh viễn nhóm?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Nhóm{" "}
                        <span className="font-semibold text-foreground">
                          “{group.name}”
                        </span>{" "}
                        sẽ bị xóa vĩnh viễn cùng với toàn bộ dữ liệu liên quan
                        (thành viên, cấu hình, nội dung liên quan trong phạm vi
                        nhóm). Hành động này không thể hoàn tác.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={handleDeleteGroup}
                      >
                        {deleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang xóa...
                          </>
                        ) : (
                          "Xác nhận xóa nhóm"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
