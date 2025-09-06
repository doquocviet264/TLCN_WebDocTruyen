import { useState, useContext } from "react";
import { Search, Sun, Moon, User, LogIn, UserPlus, Menu } from "lucide-react";
import Navbar from './Navbar';
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input"; 
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext";

export function Header() {
  const { isLoggedIn, logout } = useContext(AuthContext);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark", !darkMode);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">C</span>
          </div>
          <span className="font-montserrat font-black text-xl text-foreground hidden sm:block">Comic App</span>
        </Link>

        {/* Search Desktop */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Tìm kiếm truyện tranh..." className="pl-10 bg-card/50 backdrop-blur-sm border-border/50" />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden" onClick={() => setShowMobileSearch(!showMobileSearch)}>
            <Search className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 relative">
            {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>Tài khoản</DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>Đăng xuất</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <div className="hidden sm:flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth/login">
                    <LogIn className="h-4 w-4 mr-1" /> Đăng nhập
                  </Link>
                </Button>
                <Button size="sm" asChild className="bg-primary hover:bg-primary/90">
                  <Link to="/auth/register">
                    <UserPlus className="h-4 w-4 mr-1" /> Đăng ký
                  </Link>
                </Button>
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 sm:hidden">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex flex-col space-y-4 mt-8">
                    <Button asChild className="w-full justify-start">
                      <Link to="/auth/login">
                        <LogIn className="h-4 w-4 mr-2" /> Đăng nhập
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full justify-start">
                      <Link to="/auth/register">
                        <UserPlus className="h-4 w-4 mr-2" /> Đăng ký
                      </Link>
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
      </div>

      {showMobileSearch && (
        <div className="border-t bg-background/95 backdrop-blur md:hidden">
          <div className="container px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Tìm kiếm truyện tranh..." className="pl-10 bg-card/50 backdrop-blur-sm border-border/50" autoFocus />
            </div>
          </div>
        </div>
      )}
      <Navbar />
    </header>
  );
}

export default Header;
