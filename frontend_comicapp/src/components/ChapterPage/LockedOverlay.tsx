import { Lock, LogIn, Key } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LockedOverlayProps {
  isLoggedIn: boolean;
  cost: number;
  onLogin: () => void;
  onUnlock: () => void;
  unlockLoading: boolean;
  isDarkMode: boolean;
}

export function LockedOverlay({ isLoggedIn, cost, onLogin, onUnlock, unlockLoading, isDarkMode }: LockedOverlayProps) {
  return (
    <div className={`flex items-center justify-center min-h-[80vh] w-full px-4 ${isDarkMode ? 'bg-background' : 'bg-gray-50'}`}>
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-card border border-border shadow-2xl p-8 text-center">
        
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-yellow-500/20 blur-[60px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-6 p-4 rounded-full bg-yellow-500/10 ring-1 ring-yellow-500/30 shadow-inner">
            <Lock className="w-10 h-10 text-yellow-500" />
          </div>
          
          <h2 className="text-2xl font-bold text-foreground mb-2">Chương Khóa</h2>
          <p className="text-muted-foreground mb-8 text-sm leading-relaxed max-w-xs mx-auto">
            Chương này chứa nội dung cao cấp. Vui lòng mở khóa để tiếp tục ủng hộ nhóm dịch.
          </p>

          {!isLoggedIn ? (
            <Button onClick={onLogin} className="w-full h-12 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <LogIn className="w-4 h-4 mr-2" /> Đăng nhập để mở khóa
            </Button>
          ) : (
            <div className="w-full space-y-4">
              <Button 
                onClick={onUnlock} 
                disabled={unlockLoading}
                className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white shadow-lg shadow-yellow-500/20 border-0"
              >
                {unlockLoading ? (
                   "Đang xử lý..." 
                ) : (
                   <span className="flex items-center gap-2"><Key className="w-4 h-4" /> Mở khóa ({cost} vàng)</span>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                Số dư sẽ được trừ trực tiếp vào tài khoản của bạn.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}