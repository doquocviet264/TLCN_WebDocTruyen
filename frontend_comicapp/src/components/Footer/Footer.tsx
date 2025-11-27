import iconWeb from "@/assets/images/icon_web.png";
import { Facebook, Twitter, Instagram, Mail } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t bg-card/30 backdrop-blur-sm mt-auto">
      <div className="container px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img src={iconWeb} alt="TruyệnVerse Logo" className="h-8 w-8" />
              <span className="font-montserrat font-black text-xl">TruyệnVerse</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Nền tảng đọc truyện tranh hiện đại với trải nghiệm tuyệt vời.
            </p>
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Sản phẩm</h3>
            <div className="space-y-2 text-sm">
              <Link to="/comics" className="block text-muted-foreground hover:text-primary transition-colors">
                Truyện tranh
              </Link>
              <Link to="/genres" className="block text-muted-foreground hover:text-primary transition-colors">
                Thể loại
              </Link>
              <Link to="/ranking" className="block text-muted-foreground hover:text-primary transition-colors">
                Bảng xếp hạng
              </Link>
              <Link to="/new" className="block text-muted-foreground hover:text-primary transition-colors">
                Mới cập nhật
              </Link>
            </div>
          </div>

          {/* Support Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Hỗ trợ</h3>
            <div className="space-y-2 text-sm">
              <Link to="/faq" className="block text-muted-foreground hover:text-primary transition-colors">
                Câu hỏi thường gặp
              </Link>
              <Link to="/contact" className="block text-muted-foreground hover:text-primary transition-colors">
                Liên hệ
              </Link>
              <Link to="/terms" className="block text-muted-foreground hover:text-primary transition-colors">
                Điều khoản sử dụng
              </Link>
              <Link to="/privacy" className="block text-muted-foreground hover:text-primary transition-colors">
                Chính sách bảo mật
              </Link>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="font-semibold">Mạng xã hội</h3>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="mailto:contact@comicapp.com" className="text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 TruyệnVerse. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
}
