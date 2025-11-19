import { Link, useLocation, useParams } from "react-router-dom";
import {
  Home,
  Users,
  Settings,
  PanelLeft,
  BookCopy,
  MessageSquare,
} from "lucide-react";

import { Button } from "@/components/ui/button";

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

  const navLinks = [
    { to: `/groups/${groupId}/manage`, text: "Dashboard", icon: Home },
    { to: `/groups/${groupId}/manage/comics`, text: "Comics", icon: BookCopy },
    { to: `/groups/${groupId}/manage/members`, text: "Members", icon: Users },
    { to: `/groups/${groupId}/manage/chat`, text: "Chat", icon: MessageSquare },
    {
      to: `/groups/${groupId}/manage/settings`,
      text: "Settings",
      icon: Settings,
    },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-background transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header + toggle */}
      <div className="flex h-16 items-center justify-between px-4">
        <Link to="#" className="flex items-center gap-2 font-semibold">
          {!isCollapsed && <span>Group Name</span>}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <PanelLeft className="h-6 w-6" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2 px-4">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
              location.pathname === link.to
                ? "bg-muted text-primary"
                : "text-muted-foreground"
            }`}
          >
            <link.icon className="h-4 w-4" />
            {!isCollapsed && <span>{link.text}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
