import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";

export default function UserLayout() {
  const location = useLocation();
  // Ẩn header/footer khi đọc chapter
  const hideLayout = /^\/truyen-tranh\/[^/]+\/chapter\/\d+$/.test(location.pathname);

  return (
    <div className="min-h-screen flex flex-col">
      {!hideLayout && <Header />}

      <main className={hideLayout ? "" : "flex-1 container px-4 py-6"}>
        <Outlet /> {/* Các trang con user */}
      </main>

      {!hideLayout && <Footer />}
    </div>
  );
}
