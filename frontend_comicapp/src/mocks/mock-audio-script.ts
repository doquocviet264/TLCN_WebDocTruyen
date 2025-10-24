// Định nghĩa kiểu dữ liệu cho một "cue" trong kịch bản
export interface AudioCue {
  timestamp: number; // Thời điểm bắt đầu (tính bằng giây)
  imageIndex: number; // Index của ảnh cần cuộn tới
}

// Mảng các cue, được sắp xếp theo thời gian
export const audioCues: AudioCue[] = [
  { timestamp: 0,    imageIndex: 0 }, // Bắt đầu, cuộn đến ảnh đầu tiên
  { timestamp: 5.5,  imageIndex: 1 }, // Tại 5.5 giây, cuộn đến ảnh thứ hai
  { timestamp: 10.2, imageIndex: 2 }, // Tại 10.2 giây, cuộn đến ảnh thứ ba
  { timestamp: 15.0, imageIndex: 3 }, // v.v...
  { timestamp: 21.8, imageIndex: 4 },
  { timestamp: 28.0, imageIndex: 5 },
  { timestamp: 32.0, imageIndex: 6 },
  { timestamp: 40.0, imageIndex: 7 },
];