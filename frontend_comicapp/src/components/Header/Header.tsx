import { useState, useContext, useRef, useEffect, FormEvent } from "react";
import { type Socket } from "socket.io-client";
import { io } from "socket.io-client";
import { Search, Sun, Moon, User, LogIn, UserPlus, Menu, X, Bell } from "lucide-react";
import Navbar from './Navbar';
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input"; 
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext";
import SearchResults from "./SearchResults";
import { toast } from "react-toastify";

interface Notification {
  notificationId: number;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}
interface ApiNotificationResponse {
  success: boolean;
  data: {
    isRead: boolean;
    Notification: {
      notificationId: number;
      title: string;
      message: string;
      createdAt: string;
    };
  }[];
}

interface SearchData {
  comics: Array<{ id: number; slug: string; title: string; image: string; lastChapter: number | string }>;
  totalComics: number;
  totalPages: number;
  currentPage: number;
}

export default function Header() {
  const { isLoggedIn, logout } = useContext(AuthContext);

  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const navigate = useNavigate();
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);
  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark", !darkMode);
  };

  // --------- TIME AGO ---------
  const timeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diff = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diff < 60) return `${diff} giây trước`;
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
    if (diff < 31536000) return `${Math.floor(diff / 2592000)} tháng trước`;
    return `${Math.floor(diff / 31536000)} năm trước`;
  };

  // --------- FETCH NOTIFICATIONS (lần đầu) ---------
  useEffect(() => {
    if (!isLoggedIn) {
      // nếu logout thì clear + ngắt socket
      setNotifications([]);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/notifications`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          signal: ctrl.signal,
        });
        const json:ApiNotificationResponse = await res.json();
        // API envelope: { success: true, data: [...] }
        if (res.ok && json?.success) {
          const flatData = json.data.map((item) => ({
              ...item.Notification,
              isRead: item.isRead,
            }));
          setNotifications(flatData);
        } else {
          setNotifications([]);
        }
      } catch (err) {
        if ((err as any).name !== 'AbortError') {
          console.error('Lỗi khi lấy thông báo:', err);
        }
      }
    })();

    return () => ctrl.abort();
  }, [isLoggedIn]);

  // SOCKET: realtime notification:new 
  useEffect(() => {
    if (!isLoggedIn) return;

    // nếu đã có socket, tránh connect lại
    if (socketRef.current?.connected) return;

    const token = localStorage.getItem('token');
    const s = io("http://localhost:3000", {
      autoConnect: false,
      transports: ["websocket"],
      auth: { token }, // server có thể đọc từ socket.handshake.auth.token
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    s.on("connect", () => {
      // console.log("socket connected", s.id);
    });

    s.on("connect_error", (err) => {
      console.error("socket connect_error:", err?.message || err);
    });

    // Lắng nghe sự kiện push từ server khi có thông báo mới
    s.on("notification:new", (n: Notification) => {
      setNotifications(prev => [n, ...prev]);
      // optional toast
      toast.info(`${n.title}: ${n.message}`, { autoClose: 3000 });
    });

    s.connect();
    socketRef.current = s;

    return () => {
      s.off("notification:new");
      s.disconnect();
      socketRef.current = null;
    };
  }, [isLoggedIn]);

  // MARK AS READ / READ ALL 
  const markAsRead = async (id: number) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const json = await res.json();
      if (res.ok && json?.success) {
        setNotifications(prev =>
          prev.map(n => (n.notificationId === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error('Lỗi đánh dấu thông báo đã đọc:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const json = await res.json();
      if (res.ok && json?.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error('Lỗi đánh dấu tất cả thông báo đã đọc:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  //SEARCH (fetch + debounce)
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: query.trim(),
        page: '1',
        limit: '10',
      });

      const res = await fetch(`${import.meta.env.VITE_API_URL}/comics/search?${params.toString()}`);
      const json = await res.json();
      // API envelope: { success: true, data: { comics, ... } }
      if (res.ok && json?.success) {
        const payload = json.data as SearchData;
        setSearchResults(payload?.comics || []);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Lỗi tìm kiếm:', error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setShowResults(false);
  };

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup debounce khi unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
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
                  if (debounceRef.current) clearTimeout(debounceRef.current);
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

          {/* Notification Bell */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between p-2 border-b">
                <h3 className="font-semibold">Thông báo</h3>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={markAllAsRead}
                    className="text-xs h-auto p-1"
                  >
                    Đánh dấu đã đọc
                  </Button>
                )}
              </div>
              
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Không có thông báo
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem 
                    key={notification.notificationId}
                    className={`p-3 border-b last:border-b-0 cursor-pointer ${!notification.isRead ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
                    onClick={() => markAsRead(notification.notificationId)}
                  >
                    <div className="flex flex-col space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-sm">{notification.title}</span>
                        {!notification.isRead && (
                          <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1"></span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{notification.message}</p>
                      <span className="text-xs text-muted-foreground">{timeAgo(notification.createdAt)}</span>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 relative">
            {darkMode ? <Moon className="h-4 w-4" />   : <Sun className="h-4 w-4" />}
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
                    if (debounceRef.current) clearTimeout(debounceRef.current);
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
