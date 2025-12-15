import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface MyGroupsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MyGroupItem {
  groupId: number;
  name: string;
  avatarUrl: string | null;
  role: "leader" | "member" | string;
}

interface ApiMyGroupsResponse {
  success: boolean;
  data: MyGroupItem[];
}

export default function MyGroupsDialog({ open, onOpenChange }: MyGroupsDialogProps) {
  const [groups, setGroups] = useState<MyGroupItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigate = useNavigate();

  // Fetch danh sách nhóm mỗi khi dialog mở
  useEffect(() => {
    if (!open) return;

    const ctrl = new AbortController();

    (async () => {
      setIsLoading(true);
      setErrorMsg(null);

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/groups/my`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          signal: ctrl.signal,
        });

        const json: ApiMyGroupsResponse = await res.json();

        if (res.ok && (json as any)?.success !== false) {
          // trường hợp bạn bọc { success, data }
          const data = (json as any).data ?? json;
          setGroups(data || []);
        } else {
          setGroups([]);
          setErrorMsg("Không thể tải danh sách nhóm. Vui lòng thử lại.");
        }
      } catch (err) {
        if ((err as any).name !== "AbortError") {
          console.error("Lỗi lấy danh sách nhóm của tôi:", err);
          setErrorMsg("Lỗi kết nối server. Vui lòng thử lại sau.");
        }
      } finally {
        setIsLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [open]);

  const handleGoToGroup = (groupId: number) => {
    onOpenChange(false);
    // tuỳ bạn route quản lý, sửa path nếu cần
    navigate(`/groups/${groupId}/manage`);
  };

  const renderRoleLabel = (role: string) => {
    if (role === "leader") return "Leader";
    if (role === "member") return "Thành viên";
    return role;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nhóm dịch của tôi</DialogTitle>
          <DialogDescription>
            Danh sách các nhóm dịch mà bạn đang tham gia. Chọn 1 nhóm để đi đến trang quản lý.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Đang tải danh sách nhóm...
            </div>
          ) : errorMsg ? (
            <div className="py-8 text-center text-sm text-red-500">
              {errorMsg}
            </div>
          ) : groups.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Bạn hiện chưa tham gia nhóm dịch nào.
            </div>
          ) : (
            <ScrollArea className="max-h-80 pr-2">
              <div className="space-y-2">
                {groups.map((group) => (
                  <div
                    key={group.groupId}
                    className="flex items-center justify-between rounded-lg border bg-card/60 px-3 py-2 hover:bg-accent/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={group.avatarUrl || ""} alt={group.name} />
                        <AvatarFallback>
                          {group.name
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{group.name}</span>
                        <span className="text-xs text-muted-foreground">
                          Vai trò:{" "}
                          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                            {renderRoleLabel(group.role)}
                          </Badge>
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => handleGoToGroup(group.groupId)}
                    >
                      Quản lý
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
