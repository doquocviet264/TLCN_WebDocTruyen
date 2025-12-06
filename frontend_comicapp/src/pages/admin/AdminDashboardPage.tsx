// src/pages/admin/AdminDashboardPage.tsx
import { useEffect, useState, useMemo, useContext } from "react";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  BookOpen,
  Eye,
  Coins,
  AlertTriangle,
  Calendar,
  BarChart2,
  Activity,
} from "lucide-react";

// ====== Types khớp với BE mới ======
type DateRange = { from: string; to: string };

interface OverviewResponse {
  range: DateRange;
  overview: {
    users: {
      total: number;
      newInRange: number;
    };
    comics: {
      total: number;
      newInRange: number;
    };
    views: {
      totalAllTime: number; // chỉ còn totalAllTime
    };
    wallet: {
      totalGoldInSystem: number;
      goldTopupAllTime: number;
      goldSpentOnChaptersAllTime: number;
    };
    reports: {
      totalInRange: number;
      pending: number;
      resolved: number;
    };
    community: {
      totalPosts: number;
      totalComments: number;
    };
  };
}

interface UserChartResponse {
  range: DateRange;
  data: { date: string; count: number }[];
}

// ViewChart giờ là số truyện mới & chapter mới theo ngày
interface ViewChartItem {
  date: string;
  comics: number;
  chapters: number;
}
interface ViewChartResponse {
  range: DateRange;
  data: ViewChartItem[];
}

interface TopComicItem {
  comicId: number;
  title: string;
  slug?: string;
  coverUrl?: string;
  views: number;
}
interface TopComicsResponse {
  range: DateRange;
  data: TopComicItem[];
}

interface TopUserItem {
  userId: number;
  username?: string;
  email?: string;
  avatar?: string | null;
  totalTopup: number;
}
interface TopUsersResponse {
  range: DateRange | null;
  data: TopUserItem[];
}

interface ReportStatsResponse {
  range: DateRange;
  byType: { type: string; count: number }[];
  byStatus: { isResolved: boolean; count: number }[];
}

interface CommunityStatsResponse {
  range: DateRange;
  posts: { date: string; count: number }[];
  comments: { date: string; count: number }[];
}

// ====== Utils ======
type RangePreset = "7d" | "30d" | "90d" | "custom";

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

const numberFmt = new Intl.NumberFormat("vi-VN");

// màu cho pie chart (cần set màu)
const PIE_COLORS = ["#0ea5e9", "#22c55e", "#f97316", "#eab308", "#8b5cf6"];
const token = localStorage.getItem("token")
const AdminDashboardPage: React.FC = () => {

  const [preset, setPreset] = useState<RangePreset>("7d");
  const [from, setFrom] = useState<string | undefined>();
  const [to, setTo] = useState<string | undefined>();

  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [userChart, setUserChart] = useState<UserChartResponse | null>(null);
  const [viewChart, setViewChart] = useState<ViewChartResponse | null>(null);
  const [topComics, setTopComics] = useState<TopComicsResponse | null>(null);
  const [topUsers, setTopUsers] = useState<TopUsersResponse | null>(null);
  const [reportStats, setReportStats] = useState<ReportStatsResponse | null>(
    null
  );
  const [communityStats, setCommunityStats] =
    useState<CommunityStatsResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tính from/to gửi lên BE dựa trên preset
  const queryParams = useMemo(() => {
    if (preset === "custom" && from && to) {
      return { from, to };
    }

    const end = new Date();
    const start = new Date();

    if (preset === "7d") start.setDate(end.getDate() - 6);
    if (preset === "30d") start.setDate(end.getDate() - 29);
    if (preset === "90d") start.setDate(end.getDate() - 89);

    const toStr = end.toISOString().slice(0, 10);
    const fromStr = start.toISOString().slice(0, 10);

    return { from: fromStr, to: toStr };
  }, [preset, from, to]);

  useEffect(() => {
    const fetchAll = async () => {
      if (!token) return; // chưa có token thì không gọi
      try {
        setLoading(true);
        setError(null);

        const params = queryParams;
        const authHeaders = {
          Authorization: `Bearer ${token}`,
        };

        const [
          overviewRes,
          userChartRes,
          viewChartRes,
          topComicsRes,
          topUsersRes,
          reportStatsRes,
          communityStatsRes,
        ] = await Promise.all([
          axios.get<{ data: OverviewResponse }>(
            "http://localhost:3000/api/admin/dashboard/overview",
            {
              params,
              headers: authHeaders,
            }
          ),
          axios.get<{ data: UserChartResponse }>(
            "http://localhost:3000/api/admin/dashboard/users",
            {
              params,
              headers: authHeaders,
            }
          ),
          axios.get<{ data: ViewChartResponse }>(
            "http://localhost:3000/api/admin/dashboard/views",
            {
              params,
              headers: authHeaders,
            }
          ),
          axios.get<{ data: TopComicsResponse }>(
            "http://localhost:3000/api/admin/dashboard/top-comics",
            {
              params: { ...params, limit: 5 },
              headers: authHeaders,
            }
          ),
          axios.get<{ data: TopUsersResponse }>(
            "http://localhost:3000/api/admin/dashboard/top-users",
            {
              params: { limit: 5 }, // BE không dùng from/to nữa
              headers: authHeaders,
            }
          ),
          axios.get<{ data: ReportStatsResponse }>(
            "http://localhost:3000/api/admin/dashboard/reports",
            {
              params,
              headers: authHeaders,
            }
          ),
          axios.get<{ data: CommunityStatsResponse }>(
            "http://localhost:3000/api/admin/dashboard/community",
            {
              params,
              headers: authHeaders,
            }
          ),
        ]);
        console.log("overviewRes", overviewRes);
        setOverview(overviewRes.data.data);
        setUserChart(userChartRes.data.data);
        setViewChart(viewChartRes.data.data);
        setTopComics(topComicsRes.data.data);
        setTopUsers(topUsersRes.data.data);
        setReportStats(reportStatsRes.data.data);
        setCommunityStats(communityStatsRes.data.data);
      } catch (err: any) {
        console.error(err);
        setError(
          err?.response?.data?.message ||
            "Không tải được dữ liệu dashboard. Vui lòng thử lại."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [queryParams, token]); // <--- thêm token vào dependency

  const currentRangeLabel = useMemo(() => {
    const { from, to } = queryParams;
    if (!from || !to) return "";
    const f = new Date(from).toLocaleDateString("vi-VN");
    const t = new Date(to).toLocaleDateString("vi-VN");
    return `${f} - ${t}`;
  }, [queryParams]);

  const handlePresetChange = (p: RangePreset) => {
    setPreset(p);
    if (p !== "custom") {
      setFrom(undefined);
      setTo(undefined);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Header + Filter */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Dashboard quản trị
          </h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi tổng quan hoạt động hệ thống, người dùng, truyện và cộng
            đồng.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm">
            <Calendar className="mr-2 h-4 w-4" />
            <span className="whitespace-nowrap">
              {currentRangeLabel || "Đang tải..."}
            </span>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={preset === "7d" ? "default" : "outline"}
              onClick={() => handlePresetChange("7d")}
            >
              7 ngày
            </Button>
            <Button
              size="sm"
              variant={preset === "30d" ? "default" : "outline"}
              onClick={() => handlePresetChange("30d")}
            >
              30 ngày
            </Button>
            <Button
              size="sm"
              variant={preset === "90d" ? "default" : "outline"}
              onClick={() => handlePresetChange("90d")}
            >
              90 ngày
            </Button>
            <Button
              size="sm"
              variant={preset === "custom" ? "default" : "outline"}
              onClick={() => handlePresetChange("custom")}
            >
              Tùy chỉnh
            </Button>
          </div>
          {preset === "custom" && (
            <div className="flex gap-2">
              <input
                type="date"
                className="h-9 rounded-md border bg-background px-2 text-sm"
                value={from || ""}
                onChange={(e) => setFrom(e.target.value || undefined)}
              />
              <input
                type="date"
                className="h-9 rounded-md border bg-background px-2 text-sm"
                value={to || ""}
                onChange={(e) => setTo(e.target.value || undefined)}
              />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Hàng 1: KPI */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Tổng user */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng người dùng
            </CardTitle>
            <Users className="h-4 w-4 opacity-60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview ? numberFmt.format(overview.overview.users.total) : "--"}
            </div>
            <p className="text-xs text-muted-foreground">
              Mới trong khoảng thời gian:{" "}
              <span className="font-medium">
                {overview
                  ? numberFmt.format(overview.overview.users.newInRange)
                  : "--"}
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Tổng truyện */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng truyện tranh
            </CardTitle>
            <BookOpen className="h-4 w-4 opacity-60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview
                ? numberFmt.format(overview.overview.comics.total)
                : "--"}
            </div>
            <p className="text-xs text-muted-foreground">
              Truyện mới trong khoảng:{" "}
              <span className="font-medium">
                {overview
                  ? numberFmt.format(overview.overview.comics.newInRange)
                  : "--"}
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Lượt đọc all-time */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Lượt đọc (tổng cộng)
            </CardTitle>
            <Eye className="h-4 w-4 opacity-60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview
                ? numberFmt.format(overview.overview.views.totalAllTime)
                : "--"}
            </div>
            <p className="text-xs text-muted-foreground">
              Dựa trên trường <code>Chapter.views</code>.
            </p>
          </CardContent>
        </Card>

        {/* Vàng & giao dịch */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Vàng & giao dịch
            </CardTitle>
            <Coins className="h-4 w-4 opacity-60" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold">
              {overview
                ? numberFmt.format(
                    overview.overview.wallet.goldTopupAllTime || 0
                  )
                : "--"}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                gold đã nạp (all time)
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Vàng đang lưu hành:{" "}
              <span className="font-medium">
                {overview
                  ? numberFmt.format(
                      overview.overview.wallet.totalGoldInSystem || 0
                    )
                  : "--"}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Vàng dùng để mở khóa chapter (all time):{" "}
              <span className="font-medium">
                {overview
                  ? numberFmt.format(
                      overview.overview.wallet
                        .goldSpentOnChaptersAllTime || 0
                    )
                  : "--"}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hàng 2: Chart người dùng + Chart truyện/chapter mới */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* User mới theo ngày */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Người dùng mới theo ngày
              </CardTitle>
              <CardDescription>
                Dựa trên ngày tạo tài khoản trong khoảng thời gian chọn.
              </CardDescription>
            </div>
            <Activity className="h-4 w-4 opacity-60" />
          </CardHeader>
          <CardContent className="h-64">
            {userChart && userChart.data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userChart.data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateLabel}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip
                    formatter={(value: any) =>
                      numberFmt.format(Number(value || 0))
                    }
                    labelFormatter={formatDateLabel}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="User mới"
                    stroke="currentColor"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Không có dữ liệu trong khoảng thời gian này.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Truyện & chapter mới theo ngày */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Truyện & chương mới theo ngày
              </CardTitle>
              <CardDescription>
                Thống kê số truyện được tạo và số chapter được thêm trong khoảng
                thời gian chọn.
              </CardDescription>
            </div>
            <BarChart2 className="h-4 w-4 opacity-60" />
          </CardHeader>
          <CardContent className="h-64">
            {viewChart && viewChart.data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={viewChart.data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateLabel}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip
                    formatter={(value: any) =>
                      numberFmt.format(Number(value || 0))
                    }
                    labelFormatter={formatDateLabel}
                  />
                  <Legend />
                  <Bar dataKey="comics" name="Truyện mới" fill="#0ea5e9" />
                    <Bar dataKey="chapters" name="Chương mới" fill="#22c55e" />

                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Không có dữ liệu trong khoảng thời gian này.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hàng 3: Top comics + Top users (nạp nhiều vàng nhất) */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top truyện */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Top truyện nổi bật
            </CardTitle>
            <CardDescription>
              Theo số lượt đọc (dựa trên ReadingHistory) trong khoảng thời gian
              đã chọn.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topComics && topComics.data.length > 0 ? (
              <div className="space-y-2">
                {topComics.data.map((comic, index) => (
                  <div
                    key={comic.comicId}
                    className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium line-clamp-1">
                          {comic.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ID: {comic.comicId}
                          {comic.slug ? ` • /${comic.slug}` : ""}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {numberFmt.format(comic.views)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        lượt đọc
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Chưa có dữ liệu top truyện.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top user nạp vàng nhiều nhất */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Top người dùng nạp vàng nhiều nhất
            </CardTitle>
            <CardDescription>
              Dựa trên tổng số vàng nạp (Transaction type = credit, status =
              success).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topUsers && topUsers.data.length > 0 ? (
              <div className="space-y-2">
                {topUsers.data.map((user, index) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium line-clamp-1">
                          {user.username || `User #${user.userId}`}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {user.email}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="font-semibold">
                        {numberFmt.format(user.totalTopup)} gold
                      </div>
                      <div className="text-muted-foreground">
                        Tổng vàng đã nạp
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Chưa có dữ liệu top user.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hàng 4: Reports + Community */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Thống kê báo cáo
            </CardTitle>
            <CardDescription>
              Phân bố loại nội dung bị báo cáo & trạng thái xử lý.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {/* Pie theo loại report */}
            <div className="h-52">
              {reportStats && reportStats.byType.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      formatter={(value: any) =>
                        numberFmt.format(Number(value || 0))
                      }
                    />
                    <Pie
                      data={reportStats.byType}
                      dataKey="count"
                      nameKey="type"
                      outerRadius={80}
                    >
                      {reportStats.byType.map((entry, index) => (
                        <Cell
                          key={`cell-${entry.type}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Không có báo cáo trong khoảng thời gian này.
                </div>
              )}
            </div>
            {/* Thống kê trạng thái */}
            <div className="space-y-2 text-sm">
              {overview && (
                <div className="text-xs text-muted-foreground">
                  Tổng báo cáo trong khoảng thời gian:{" "}
                  <span className="font-semibold">
                    {numberFmt.format(overview.overview.reports.totalInRange)}
                  </span>
                </div>
              )}
              {reportStats && (
                <div className="space-y-1">
                  {reportStats.byStatus.map((s) => (
                    <div
                      key={s.isResolved ? "resolved" : "pending"}
                      className="flex items-center justify-between rounded-md border px-2 py-1 text-xs"
                    >
                      <span className="text-muted-foreground">
                        {s.isResolved ? "Đã xử lý" : "Đang chờ xử lý"}
                      </span>
                      <span className="font-semibold">
                        {numberFmt.format(s.count)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Hoạt động cộng đồng
            </CardTitle>
            <CardDescription>
              Bài viết & bình luận theo ngày trong khoảng thời gian đã chọn.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {communityStats &&
            (communityStats.posts.length > 0 ||
              communityStats.comments.length > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mergeCommunityChartData(communityStats)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateLabel}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip
                    formatter={(value: any) =>
                      numberFmt.format(Number(value || 0))
                    }
                    labelFormatter={formatDateLabel}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="posts"
                    name="Bài viết"
                    stroke={PIE_COLORS[0]}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="comments"
                    name="Bình luận"
                    stroke={PIE_COLORS[2]}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Chưa có hoạt động cộng đồng trong khoảng thời gian này.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {loading && (
        <div className="text-xs text-muted-foreground">
          Đang tải dữ liệu dashboard...
        </div>
      )}
    </div>
  );
};

// Gom data posts + comments theo date để vẽ chung 1 chart
function mergeCommunityChartData(data: CommunityStatsResponse) {
  const map = new Map<
    string,
    { date: string; posts: number; comments: number }
  >();

  data.posts.forEach((p) => {
    map.set(p.date, {
      date: p.date,
      posts: p.count,
      comments: 0,
    });
  });

  data.comments.forEach((c) => {
    const existing = map.get(c.date);
    if (existing) {
      existing.comments = c.count;
    } else {
      map.set(c.date, {
        date: c.date,
        posts: 0,
        comments: c.count,
      });
    }
  });

  return Array.from(map.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

export default AdminDashboardPage;
