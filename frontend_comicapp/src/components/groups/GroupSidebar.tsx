import { Link, useLocation, useParams } from "react-router-dom";
import { useContext } from "react";
import {
  Home,
  Users,
  Settings,
  PanelLeft,
  BookCopy,
  MessageSquare,
  LogOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AuthContext } from "@/context/AuthContext";

interface GroupSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

export default function GroupSidebar({
  isCollapsed,
  setIsCollapsed,
}: GroupSidebarProps) {
  const { groupId } = useParams<{ groupId: string }>();
  const location = useLocation();
  const { logout } = useContext(AuthContext);

  const navLinks = [
    { to: `/groups/${groupId}/manage`, text: "Dashboard", icon: Home },
    { to: `/groups/${groupId}/manage/comics`, text: "Quản lý truyện", icon: BookCopy },
    { to: `/groups/${groupId}/manage/members`, text: "Thành viên", icon: Users },
    { to: `/groups/${groupId}/manage/chat`, text: "Nhắn tin", icon: MessageSquare },
    { to: `/groups/${groupId}/manage/settings`, text: "Cài đặt", icon: Settings },
  ];

  const isActive = (to: string) => location.pathname === to;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-background transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex h-16 items-center justify-between px-4">
        <Link to="#" className="flex items-center gap-2 font-semibold">
          {!isCollapsed && <span>Quản lý nhóm</span>}
        </Link>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <PanelLeft className="h-6 w-6 shrink-0" />
        </Button>
      </div>

      <nav className="flex flex-col gap-2 px-2 flex-1">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`flex items-center rounded-lg transition-all hover:text-primary ${
              isActive(link.to)
                ? "bg-muted text-primary"
                : "text-muted-foreground"
            } ${
              isCollapsed
                ? "h-10 w-10 justify-center mx-auto"
                : "px-3 py-2 gap-3 justify-start"
            }`}
          >
            <link.icon
              className={`shrink-0 transition-all ${
                isCollapsed ? "h-6 w-6" : "h-5 w-5"
              }`}
            />
            {!isCollapsed && <span>{link.text}</span>}
          </Link>
        ))}
      </nav>

      <div className="px-2 pb-4">
        <Button
          variant="ghost"
          onClick={logout}
          className={`transition-all text-red-500 hover:text-red-600 hover:bg-red-500/10 ${
            isCollapsed
              ? "h-10 w-10 justify-center mx-auto flex"
              : "w-full justify-start gap-3"
          }`}
        >
          <LogOut
            className={`shrink-0 transition-all ${
              isCollapsed ? "h-6 w-6" : "h-5 w-5"
            }`}
          />
          {!isCollapsed && <span>Đăng xuất</span>}
        </Button>
      </div>
    </aside>
  );
}
