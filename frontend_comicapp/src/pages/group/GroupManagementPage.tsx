import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

import {
  Activity,
  ArrowUpRight,
  BookCopy,
  Eye,
  Coins,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  gold: number;
}

interface DashboardSeriesPoint {
  date: string;
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

interface TopComicItem {
  comicId: number;
  title: string;
  coverImage: string | null;
  totalViews: string | number;
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
  topComics: TopComicItem[];
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
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
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

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}`;
  };

  const sinceLabel = useMemo(() => {
    if (!dashboard?.activitySummary?.since) return "";
    return new Date(dashboard.activitySummary.since).toLocaleDateString(
      "vi-VN",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  }, [dashboard?.activitySummary?.since]);

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

  const { stats, analytics, activitySummary, recentActivities, topComics } =
    dashboard;

  const series = (analytics?.series || []).map((p) => ({
    ...p,
    dayLabel: formatDate(p.date),
  }));

  const safeTopComics = (topComics || []).map((c) => ({
    ...c,
    totalViewsNum:
      typeof c.totalViews === "string"
        ? Number(c.totalViews)
        : c.totalViews ?? 0,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng số truyện
            </CardTitle>
            <BookCopy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalComics}</div>
            <p className="text-xs text-muted-foreground">
              Tổng số truyện của nhóm
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng số chương
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChapters}</div>
            <p className="text-xs text-muted-foreground">
              Tổng số chương đã đăng
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng lượt xem</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Number(stats.totalViews || 0).toLocaleString("vi-VN")}
            </div>
            <p className="text-xs text-muted-foreground">
              Tổng lượt xem mọi chương của nhóm
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thành viên</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              Số thành viên trong nhóm
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vàng hiện có</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Number(stats.gold || 0).toLocaleString("vi-VN")}
            </div>
            <p className="text-xs text-muted-foreground">
              Tổng số vàng hiện có của nhóm
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chương mới</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.updatedChaptersLastRange}
            </div>
            <p className="text-xs text-muted-foreground">
              Trong {analytics.range || "30 ngày"} qua
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-1">
            <CardTitle>Thống kê chương mới</CardTitle>
            <CardDescription>
              Biểu đồ số chương mới trong {analytics.range || "30 ngày"}.
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
                data={series}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="colorChapters"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="currentColor"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="currentColor"
                      stopOpacity={0}
                    />
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
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12 }}
                  formatter={(value: any) => [value, "Chương mới"]}
                  labelFormatter={(label: string | number) => `Ngày ${label}`}
                />

                <Area
                  type="monotone"
                  dataKey="newChapters"
                  name="newChapters"
                  stroke="currentColor"
                  fillOpacity={0.35}
                  fill="url(#colorChapters)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Top truyện</CardTitle>
              <CardDescription>
                Top truyện theo lượt xem trong nhóm
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {safeTopComics.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Chưa có dữ liệu top truyện.
              </p>
            ) : (
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[70%]">Truyện</TableHead>
                    <TableHead className="w-[30%] text-right">
                      Lượt xem
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {safeTopComics.slice(0, 5).map((c) => {
                    const views = Number(c.totalViewsNum || 0);
                    return (
                      <TableRow key={c.comicId} className="hover:bg-muted/40">
                        <TableCell className="py-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={c.coverImage || ""}
                              alt={c.title}
                              className="h-10 w-10 rounded-md object-cover shrink-0"
                              loading="lazy"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-sm leading-snug">
                                {c.title}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-2 text-right font-medium tabular-nums">
                          {views.toLocaleString("vi-VN")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Các hoạt động gần đây</CardTitle>
            <CardDescription className="text-xs">
              Từ {sinceLabel}: {activitySummary.newComments} bình luận,{" "}
              {activitySummary.newRatings} đánh giá,{" "}
              {activitySummary.newFollows} theo dõi, {activitySummary.newLikes}{" "}
              lượt thích.
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
                const timeLabel = new Date(activity.createdAt).toLocaleString(
                  "vi-VN",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  }
                );

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

                    <div className="grid gap-1 min-w-0">
                      <p className="leading-none truncate">
                        <span className="font-medium">{activity.userName}</span>{" "}
                        <span className="text-muted-foreground">
                          {activity.action}{" "}
                          <span className="font-medium">
                            {activity.comicTitle}
                          </span>
                        </span>
                        <Badge variant="secondary" className="ml-2">
                          {activity.type}
                        </Badge>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {timeLabel}
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
