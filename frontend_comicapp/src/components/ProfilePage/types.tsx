export interface UserProfile {
  name: string
  email: string
  gender: string
  birthday: string
  avatar: string
  joinDate: string
  levelName: string
  experience: {
    current: number
    max: number
  }
  totalRead: number
  favorites: number
  comments: number
  goldCoins: number
}

// Kiểu dữ liệu cho phản hồi từ API khi cập nhật thành công
export interface UpdateProfileResponse {
  message: string;
  user: {
    userId: number;
    username: string;
    email: string;
    gender: string | null;
    birthday: string | null;
    avatar: string | null;
    joinDate: string; // Tên trường này khác với API
    updatedAt: string; 
  };
}

export interface Comic {
  id: number
  title: string
  cover: string
  status: string
  lastReadChapter: number
  lastChapterNumber: number
  lastRead: string
}
export interface DailyCheckinItem {
  day: number;
  checked: boolean;
  isToday?: boolean;
}
export interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
}

export interface Quest {
  id: number;
  title: string;
  reward: number;
  progress: number;
  target: number;
  claimed?: boolean;
  category?: string; // Thêm category nếu cần
}