import { Facebook, Twitter, Instagram, Mail } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t bg-card/30 backdrop-blur-sm mt-auto">
      <div className="container px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Logo and Description */}
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">C</span>
              </div>
              <span className="font-montserrat font-black text-xl">Comic App</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Nền tảng đọc truyện tranh hiện đại với trải nghiệm tuyệt vời
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4 text-center md:text-left">
            <h3 className="font-semibold">Liên kết</h3>
            <div className="space-y-2 text-sm">
              <Link to="/about" className="block text-muted-foreground hover:text-primary transition-colors">
                Về chúng tôi
              </Link>
              <Link to="/contact" className="block text-muted-foreground hover:text-primary transition-colors">
                Liên hệ
              </Link>
              <Link to="/privacy" className="block text-muted-foreground hover:text-primary transition-colors">
                Chính sách bảo mật
              </Link>
              <Link to="/terms" className="block text-muted-foreground hover:text-primary transition-colors">
                Điều khoản sử dụng
              </Link>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-4 text-center md:text-left">
            <h3 className="font-semibold">Mạng xã hội</h3>
            <div className="flex justify-center md:justify-start space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="mailto:example@mail.com" className="text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Comic App. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
}