import { NavLink, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Home, Heart, TrendingUp, BookOpen, Clock, History, Grid3X3, Search, Users, } from "lucide-react"

const navItems = [
  { href: "/", label: "Trang chủ", icon: Home },
  { href: "/following", label: "Theo dõi", icon: Heart },
  { href: "/history", label: "Lịch sử", icon: History },
  { href: "/search", label: "Tìm truyện", icon: Search },
  { href: "/community", label: "Cộng đồng", icon: Users }
]

export default function Navbar() {
  const location = useLocation()

  return (
    <nav className="border-b bg-card/30 backdrop-blur-sm">
      <div className="container px-4">
        <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href

            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-shrink-0 items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
