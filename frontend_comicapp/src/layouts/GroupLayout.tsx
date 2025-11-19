import { useState } from "react";
import { Outlet } from "react-router-dom";
import GroupSidebar from "@/components/groups/GroupSidebar";
import GroupHeader from "@/components/groups/GroupHeader";

export default function GroupLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <GroupSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <GroupHeader isCollapsed={isCollapsed} />
      <main
        className={`transition-all duration-300 mt-16 p-6 ${
          isCollapsed ? "ml-16" : "ml-64"
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}
