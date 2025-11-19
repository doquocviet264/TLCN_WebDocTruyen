import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

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
import {
  availableAvatarUrls, // vẫn dùng mock danh sách avatar gợi ý
} from "@/mocks/groupManagement";

interface GroupDetails {
  groupId: number;
  name: string;
  description: string;
  avatarUrl: string | null;
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [group, setGroup] = useState<GroupDetails | null>(null);

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
          `/api/groups/${groupId}`
        );

        if (cancelled) return;

        if (!res.data.success || !res.data.data) {
          throw new Error(res.data.error?.message || "Không thể tải nhóm");
        }

        const g = res.data.data;
        setGroup(g);
        setName(g.name || "");
        setDescription(g.description || "");
        setSelectedAvatarUrl(
          g.avatarUrl || availableAvatarUrls[0] || ""
        );
      } catch (err: any) {
        console.error(err);
        toast.error(
          err?.response?.data?.error?.message ||
            "Không thể tải thông tin nhóm"
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

  // ===== helper: file -> base64 (nếu bạn muốn gửi dạng data URL) =====
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Đọc file thất bại"));
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  };

  // ===== chọn avatar từ danh sách mẫu =====
  const handleAvatarSelect = (url: string) => {
    setSelectedAvatarUrl(url);
    setLocalFile(null); // clear file nếu user chọn URL có sẵn
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ===== chọn file local để làm avatar =====
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setLocalFile(file);
      setSelectedAvatarUrl(URL.createObjectURL(file)); // preview
    } else {
      setLocalFile(null);
      // revert về avatar cũ hoặc avatar default
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

      let avatarPayload: string | null = null;

      if (localFile) {
        // gửi dạng base64 (backend có thể upload Cloudinary từ đây)
        avatarPayload = await fileToBase64(localFile);
      } else {
        avatarPayload = selectedAvatarUrl || null;
      }

      const payload = {
        name: name.trim(),
        description: description.trim(),
        avatarUrl: avatarPayload,
      };

      const res = await axios.patch<ApiEnvelope>(
        `/api/groups/${groupId}`,
        payload
      );

      if (!res.data.success) {
        throw new Error(res.data.error?.message || "Cập nhật nhóm thất bại");
      }

      toast.success("Cập nhật thông tin nhóm thành công");

      // cập nhật state local để đồng bộ
      setGroup((prev) =>
        prev
          ? {
              ...prev,
              name: payload.name,
              description: payload.description,
              avatarUrl: payload.avatarUrl,
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

  // ===== rời nhóm (POST /api/groups/:groupId/leave) =====
  const handleLeaveGroup = async () => {
    if (!groupId) return;
    if (
      !window.confirm(
        "Bạn chắc chắn muốn rời nhóm? Bạn sẽ mất quyền truy cập vào nhóm này."
      )
    ) {
      return;
    }

    try {
      setLeaving(true);
      const res = await axios.post<ApiEnvelope>(
        `/api/groups/${groupId}/leave`
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

  // ===== xóa nhóm (DELETE /api/groups/:groupId) – optional =====
  const handleDeleteGroup = async () => {
    if (!groupId) return;
    if (
      !window.confirm(
        "Bạn chắc chắn muốn xóa nhóm này? Hành động này không thể hoàn tác."
      )
    ) {
      return;
    }

    try {
      setDeleting(true);
      const res = await axios.delete<ApiEnvelope>(`/api/groups/${groupId}`);

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
      <div className="text-sm text-muted-foreground">
        Đang tải thông tin nhóm...
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-sm text-destructive">
        Không tìm thấy nhóm hoặc bạn không có quyền.
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* CARD: Thông tin nhóm */}
      <Card>
        <CardHeader>
          <CardTitle>Group Information</CardTitle>
          <CardDescription>
            Update your group&apos;s name, description, and avatar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Group name..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your group..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="avatar-upload">Avatar</Label>
              {/* Avatars preset */}
              <div className="flex flex-wrap gap-2">
                {availableAvatarUrls.map((url) => (
                  <img
                    key={url}
                    src={url}
                    alt="Avatar option"
                    className={`h-16 w-16 cursor-pointer rounded-md object-cover border-2 ${
                      selectedAvatarUrl === url && !localFile
                        ? "border-primary"
                        : "border-transparent"
                    }`}
                    onClick={() => handleAvatarSelect(url)}
                  />
                ))}
              </div>
              {/* Upload file */}
              <div className="flex items-center gap-2 mt-2">
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
                  className="cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Choose File
                </Label>
                {localFile && (
                  <span className="text-sm text-muted-foreground">
                    {localFile.name}
                  </span>
                )}
              </div>
              {/* Preview */}
              {selectedAvatarUrl && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Preview:
                  </p>
                  <img
                    src={selectedAvatarUrl}
                    alt="Avatar preview"
                    className="h-20 w-20 rounded-md object-cover border"
                  />
                </div>
              )}
            </div>
          </form>
        </CardContent>
        <CardFooter className="border-t px-6 py-4 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </CardFooter>
      </Card>

      {/* CARD: Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>
            These actions are irreversible. Please be certain.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between rounded-lg border border-destructive p-4">
            <div>
              <h3 className="font-semibold">Leave Group</h3>
              <p className="text-sm text-muted-foreground">
                You will lose access to all group content and features.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleLeaveGroup}
              disabled={leaving}
            >
              {leaving ? "Leaving..." : "Leave Group"}
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-destructive p-4">
            <div>
              <h3 className="font-semibold">Delete Group</h3>
              <p className="text-sm text-muted-foreground">
                This will permanently delete the group and all of its data.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleDeleteGroup}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Group"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
