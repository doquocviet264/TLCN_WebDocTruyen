import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

import {
  Activity,
  ArrowUpRight,
  BookCopy,
  Eye,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Chart
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface DashboardStats {
  totalComics: number;
  totalChapters: number;
  totalViews: number;
  totalMembers: number;
  updatedChaptersLastRange: number;
}

interface DashboardSeriesPoint {
  date: string;
  views: number;
  newChapters: number;
}

interface ActivitySummary {
  since: string;
  newComments: number;
  newRatings: number;
  newFollows: number;
  newLikes: number;
}

interface RecentActivityItem {
  id: string;
  type: "comment" | "rating" | "follow" | "like";
  userName: string;
  comicTitle: string;
  action: string;
  createdAt: string;
}

interface GroupDashboard {
  groupId: number;
  stats: DashboardStats;
  analytics: {
    range: string;
    series: DashboardSeriesPoint[];
  };
  activitySummary: ActivitySummary;
  recentActivities: RecentActivityItem[];
  // optional: topComics nếu bạn muốn thêm sau
}

interface ApiEnvelope<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    status?: number;
  };
}

export default function GroupManagementPage() {
  const { groupId } = useParams<{ groupId: string }>();

  const [dashboard, setDashboard] = useState<GroupDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;

    let cancelled = false;

    async function fetchDashboard() {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get<ApiEnvelope<GroupDashboard>>(
          `${import.meta.env.VITE_API_URL}/groups/${groupId}/dashboard`,
          {
            params: { range: "30d" },
            headers: token
              ? { Authorization: `Bearer ${token}` }
              : undefined,
          }
        );

        if (cancelled) return;

        if (!res.data.success || !res.data.data) {
          throw new Error(res.data.error?.message || "Không thể tải dashboard");
        }

        setDashboard(res.data.data);
      } catch (err: any) {
        console.error(err);
        toast.error(
          err?.response?.data?.error?.message ||
            "Không thể tải thống kê nhóm dịch"
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDashboard();
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  if (loading && !dashboard) {
    return (
      <div className="text-sm text-muted-foreground">
        Đang tải thống kê nhóm...
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-sm text-destructive">
        Không thể tải thống kê nhóm. Vui lòng thử lại sau.
      </div>
    );
  }

  const { stats, analytics, activitySummary, recentActivities } = dashboard;

  const series = analytics.series || [];

  // Helper format ngày cho chart
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Hàng 4 card thống kê */}
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        {/* Total Comics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comics</CardTitle>
            <BookCopy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalComics}</div>
            <p className="text-xs text-muted-foreground">
              Tổng số truyện của nhóm
            </p>
          </CardContent>
        </Card>

        {/* Total Chapters */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chapters</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChapters}</div>
            <p className="text-xs text-muted-foreground">
              Tổng số chương đã đăng
            </p>
          </CardContent>
        </Card>

        {/* Total Views */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalViews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Tổng lượt xem mọi chương của nhóm
            </p>
          </CardContent>
        </Card>

        {/* Updated Chapters (range) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Updated Chapters
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.updatedChaptersLastRange}
            </div>
            <p className="text-xs text-muted-foreground">
              Chương được cập nhật trong {analytics.range || "30d"} qua
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Biểu đồ phân tích */}
      <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-1">
            <CardTitle>Performance</CardTitle>
            <CardDescription>
              Lượt xem và chương mới trong {analytics.range || "30 ngày"}.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="h-72">
          {series.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chưa có dữ liệu trong khoảng thời gian này.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={series.map((p) => ({
                  ...p,
                  dayLabel: formatDate(p.date),
                }))}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="currentColor" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorChapters" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="currentColor" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="dayLabel"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                  }}
                  formatter={(value: any, name: any) => {
                    if (name === "views") return [value, "Views"];
                    if (name === "newChapters") return [value, "New Chapters"];
                    return [value, name];
                  }}
                  labelFormatter={(label: string | number) => `Ngày ${label}`}
                />

                <Area
                  type="monotone"
                  dataKey="views"
                  name="views"
                  stroke="currentColor"
                  fillOpacity={0.4}
                  fill="url(#colorViews)"
                />
                <Area
                  type="monotone"
                  dataKey="newChapters"
                  name="newChapters"
                  stroke="currentColor"
                  fillOpacity={0.3}
                  fill="url(#colorChapters)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Hàng: Comics table + Recent activity */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-7">
        {/* Comics table (tạm thời nếu chưa có topComics từ BE thì ghi chú) */}
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Comics</CardTitle>
              <CardDescription>
                (Tuỳ bạn: có thể trả thêm topComics từ API để hiển thị.)
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link to={`/groups/${dashboard.groupId}`}>
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              TODO: BE có thể trả thêm <code>topComics</code> để hiển thị bảng này.
            </p>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription className="text-xs">
              Từ{" "}
              {new Date(activitySummary.since).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
              : {activitySummary.newComments} bình luận,{" "}
              {activitySummary.newRatings} đánh giá,{" "}
              {activitySummary.newFollows} theo dõi,{" "}
              {activitySummary.newLikes} lượt thích.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Chưa có hoạt động mới trong khoảng thời gian này.
              </p>
            ) : (
              recentActivities.map((activity) => {
                const initial = activity.userName?.[0]?.toUpperCase() || "?";
                return (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 text-sm"
                  >
                    <Avatar className="hidden h-9 w-9 sm:flex">
                      <AvatarImage
                        src={`https://via.placeholder.com/40?text=${initial}`}
                        alt={activity.userName}
                      />
                      <AvatarFallback>{initial}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-1">
                      <p className="leading-none">
                        <span className="font-medium">
                          {activity.userName}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {activity.action}{" "}
                          <span className="font-medium">
                            {activity.comicTitle}
                          </span>
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
