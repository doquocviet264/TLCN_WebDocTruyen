import { Link } from "react-router-dom";
import { Bell, CircleUser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GroupHeaderProps {
  isCollapsed: boolean;
}

export default function GroupHeader({ isCollapsed }: GroupHeaderProps) {
  return (
    <header
      className={`fixed top-0 right-0 bg-background border-b transition-all duration-300 z-40 ${
        isCollapsed ? "left-16" : "left-64"
      }`}
    >
      <div className="flex h-16 items-center justify-end gap-4 px-6">

        {/* Bell Notification */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge
                className="absolute -top-1 -right-1 px-1 py-0 text-xs"
                variant="destructive"
              >
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-64">

            <DropdownMenuLabel>Thông báo</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem>
              Nhóm ABC vừa đăng chapter mới
            </DropdownMenuItem>
            <DropdownMenuItem>
              Lời mời tham gia nhóm dịch
            </DropdownMenuItem>
            <DropdownMenuItem>
              Thành viên đã gửi yêu cầu hỗ trợ
            </DropdownMenuItem>

          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <CircleUser className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">Trang cá nhân</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Cài đặt</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Đăng xuất</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  );
}
