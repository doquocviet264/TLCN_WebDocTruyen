import { useState, useContext, useRef, useEffect, FormEvent } from "react";
import { Search, Sun, Moon, User, LogIn, UserPlus, Menu, X } from "lucide-react";
import Navbar from './Navbar';
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input"; 
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext";
import SearchResults from "./SearchResults";

export default function Header() {
  const { isLoggedIn, logout } = useContext(AuthContext);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const debounceRef = useRef<number | null>(null);


  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark", !darkMode);
  };

  // Hàm tìm kiếm thực tế
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        q: query.trim(),
        page: '1',
        limit: '10'
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/comics/search?${queryParams}`);
      const data = await response.json();
      
      setSearchResults(data.comics || []);
      setShowResults(true);
    } catch (error) {
      console.error('Lỗi tìm kiếm:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý tìm kiếm với debounce
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    // Clear timeout cũ nếu có
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set timeout mới - debounce 300ms
    debounceRef.current = window.setTimeout(() => {
      performSearch(value);
    }, 300);

  };

  // Xử lý khi submit form (enter) - chuyển sang trang search
  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    // Clear debounce nếu có
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Chuyển hướng sang trang search với query
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setShowResults(false);
  };

  // Xem tất cả kết quả
  const handleViewAllResults = () => {
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    setShowResults(false);
    setSearchQuery("");
  };

  // Đóng kết quả tìm kiếm khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Cleanup debounce khi component unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

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
        <div className="hidden md:flex flex-1 max-w-md mx-8 relative" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Tìm kiếm truyện tranh..." 
              className="pl-10 pr-10 bg-card/50 backdrop-blur-sm border-border/50"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchQuery && setShowResults(true)}
            />
            {searchQuery && (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setShowResults(false);
                  if (debounceRef.current) {
                    clearTimeout(debounceRef.current);
                  }
                }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>

          {/* Kết quả tìm kiếm */}
          {showResults && (
            <SearchResults 
              results={searchResults}
              isLoading={isLoading}
              searchQuery={searchQuery}
              onViewAll={handleViewAllResults}
              onClose={() => setShowResults(false)}
            />
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 md:hidden" 
            onClick={() => setShowMobileSearch(!showMobileSearch)}
          >
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
                <DropdownMenuItem asChild>
                  <Link to="/profile">Tài khoản</Link>
                </DropdownMenuItem>
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

      {/* Mobile Search */}
      {showMobileSearch && (
        <div className="border-t bg-background/95 backdrop-blur md:hidden" ref={searchRef}>
          <div className="container px-4 py-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Tìm kiếm truyện tranh..." 
                className="pl-10 pr-10 bg-card/50 backdrop-blur-sm border-border/50" 
                autoFocus
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => searchQuery && setShowResults(true)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setShowResults(false);
                    if (debounceRef.current) {
                      clearTimeout(debounceRef.current);
                    }
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </form>

            {/* Kết quả tìm kiếm mobile */}
            {showResults && (
              <div className="absolute left-0 right-0 top-full mt-2 z-50">
                <SearchResults 
                  results={searchResults}
                  isLoading={isLoading}
                  searchQuery={searchQuery}
                  onViewAll={handleViewAllResults}
                  onClose={() => setShowResults(false)}
                  isMobile={true}
                />
              </div>
            )}
          </div>
        </div>
      )}
      <Navbar />
    </header>
  );
}