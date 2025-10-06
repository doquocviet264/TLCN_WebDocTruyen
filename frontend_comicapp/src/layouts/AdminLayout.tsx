import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <AdminHeader isCollapsed={isCollapsed} />
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
