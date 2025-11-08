import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Hàm 'cn' này được tạo tự động khi cài shadcn/ui
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(iso: string) {
  const now = new Date();
  const then = new Date(iso);
  const diff = (now.getTime() - then.getTime()) / 1000; // sec
  if (diff < 60) return `${Math.floor(diff)}s trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h trước`;
  return `${Math.floor(diff / 86400)}d trước`;
}

export function clampText(text: string, max = 280) {
  return text.length > max ? text.slice(0, max) + "…" : text;
}