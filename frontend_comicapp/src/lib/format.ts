// src/lib/format.ts

// format số chương, view, v.v.
export function formatNumberShort(num: unknown, { zeroLabel = "mới" } = {}) {
  const parsed = typeof num === "number" ? num : Number(num);
  if (isNaN(parsed) || parsed === 0) return zeroLabel;
  return Number.isInteger(parsed)
    ? parsed.toString()
    : parsed.toFixed(2).replace(/\.?0+$/, "");
}

// timeAgo tiếng Việt
export function timeAgoVi(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return `${Math.floor(interval)} năm trước`;
  interval = seconds / 2592000;
  if (interval > 1) return `${Math.floor(interval)} tháng trước`;
  interval = seconds / 86400;
  if (interval > 1) return `${Math.floor(interval)} ngày trước`;
  interval = seconds / 3600;
  if (interval > 1) return `${Math.floor(interval)} giờ trước`;
  interval = seconds / 60;
  if (interval > 1) return `${Math.floor(interval)} phút trước`;
  return "Vừa xong";
}

export function timeAgoViShort(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);
  const diff = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diff < 60) return `${diff}s trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} tháng trước`;
  return `${Math.floor(diff / 31536000)} năm trước`;
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}
