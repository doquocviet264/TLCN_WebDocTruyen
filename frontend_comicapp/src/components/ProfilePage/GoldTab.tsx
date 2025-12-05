import axios from "axios";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CircleDollarSign,
  CalendarCheck,
  Target,
  ListChecks,
  CheckCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import { TransactionModal } from "./TransactionModal";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  type?: string; // thêm
}

interface DailyCheckinItem {
  day: number;
  checked: boolean;
  isToday?: boolean;
}


interface Quest {
  id: number;
  title: string;
  reward: number;
  progress: number;
  target: number;
  claimed?: boolean;
  category?: string;
}

interface ProfileGoldTabProps {
  goldCoins: number;
  dailyCheckin?: DailyCheckinItem[];
  quests?: Quest[];
  transactionHistory?: Transaction[];
  onCheckin?: (updatedCheckin: DailyCheckinItem[], newGold: number) => void;
  onClaimQuest?: (questId: number) => void;
  loadingQuests?: boolean;
  dayStreak?: number;
  longestStreak?: number;
}

interface CheckinResponse {
  message: string;
  newBalance: number;
  dailyCheckin: DailyCheckinItem[];
  dayStreak: number;
  longestStreak: number;
}

interface MoMoTopupData {
  message: string;
  orderId: string;
  payUrl: string;
  deeplink?: string | null;
}

type ApiOk<T> = { success: true; data: T; meta?: unknown };

type PaymentMethod = "momo" | "vnpay";

const GOLD_PER_1000_VND = 10;
const calcGoldFromVnd = (amount: number) =>
  Math.floor((amount / 1000) * GOLD_PER_1000_VND);

const AMOUNT_TO_PACKAGE: Record<number, string> = {
  10000: "TOPUP_10K",
  20000: "TOPUP_20K",
  50000: "TOPUP_50K",
  100000: "TOPUP_100K",
  200000: "TOPUP_200K",
  500000: "TOPUP_500K",
};

export function ProfileGoldTab({
  goldCoins,
  dailyCheckin,
  quests,
  transactionHistory,
  onCheckin,
  onClaimQuest,
  loadingQuests = false,
  dayStreak = 0,
  longestStreak = 0,
}: ProfileGoldTabProps) {
  const [coins, setCoins] = useState<number>(goldCoins ?? 0);
  const [checkinList, setCheckinList] = useState<DailyCheckinItem[]>(
    dailyCheckin || []
  );
  const [currentDayStreak, setCurrentDayStreak] =
    useState<number>(dayStreak);
  const [currentLongestStreak, setCurrentLongestStreak] =
    useState<number>(longestStreak);

  const [claimingQuest, setClaimingQuest] = useState<number | null>(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsOpen, setTransactionsOpen] = useState(false);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true);
  const [txOffset, setTxOffset] = useState(0);
  const [txFilter, setTxFilter] = useState<"all" | "credit" | "debit" | "topup">(
    "all"
  );
  const TX_LIMIT = 20;
  const topupOptions = [10000, 20000, 50000, 100000, 200000, 500000];

  const CYCLE_LENGTH = 7;
  const cycleIndex =
    currentDayStreak <= 0
      ? 0
      : ((currentDayStreak - 1) % CYCLE_LENGTH) + 1;
  const cycleProgress = (cycleIndex / CYCLE_LENGTH) * 100;

  const handleTopup = async () => {
    if (!selectedAmount) {
      toast.error("Vui lòng chọn số tiền muốn nạp");
      return;
    }
    if (!paymentMethod) {
      toast.error("Vui lòng chọn phương thức thanh toán");
      return;
    }

    if (paymentMethod === "vnpay") {
      toast.info("VNPay hiện chưa hỗ trợ, vui lòng chọn MoMo.");
      return;
    }

    const packageCode = AMOUNT_TO_PACKAGE[selectedAmount];
    if (!packageCode) {
      toast.error("Gói nạp không hợp lệ, vui lòng chọn lại.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để nạp vàng.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post<ApiOk<MoMoTopupData>>(
        `${import.meta.env.VITE_API_URL}/payments/momo/topup`,
        { packageCode },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = response.data.data;

      if (!data || !data.payUrl) {
        toast.error("Không nhận được đường dẫn thanh toán từ server.");
        return;
      }

      toast.success(
        data.message ||
          `Đang mở MoMo cho đơn ${selectedAmount.toLocaleString()} đ`
      );

      window.open(data.payUrl, "_blank");

      setOpenDialog(false);
      setSelectedAmount(0);
      setPaymentMethod(null);
    } catch (err: any) {
      console.error(err);
      toast.error("Nạp tiền thất bại, vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Vui lòng đăng nhập để điểm danh.");
        return;
      }

      const response = await axios.post<ApiOk<CheckinResponse>>(
        `${import.meta.env.VITE_API_URL}/user/checkin`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = response.data.data;
      toast.success(data.message || "Điểm danh thành công!");

      setCoins(data.newBalance);
      setCheckinList(data.dailyCheckin);
      setCurrentDayStreak(data.dayStreak);
      setCurrentLongestStreak(data.longestStreak);

      if (onCheckin) onCheckin(data.dailyCheckin, data.newBalance);
    } catch (err: any) {
      toast.error("Điểm danh thất bại! Vui lòng thử lại.");
    }
  };

  const handleClaimQuest = async (quest: Quest) => {
    if (!onClaimQuest) return;

    try {
      setClaimingQuest(quest.id);
      await onClaimQuest(quest.id);
      toast.success(
        `Nhận thưởng thành công: +${quest.reward} đồng vàng!`
      );
    } catch (error) {
      toast.error("Nhận thưởng thất bại!");
    } finally {
      setClaimingQuest(null);
    }
  };
    const fetchTransactions = async (opts?: { reset?: boolean; filter?: string }) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để xem lịch sử giao dịch.");
      return;
    }

    const reset = opts?.reset ?? false;
    const filter = (opts?.filter as "all" | "credit" | "debit" | "topup") ?? txFilter;
    const offset = reset ? 0 : txOffset;

    try {
      const params = new URLSearchParams();
      params.set("limit", TX_LIMIT.toString());
      params.set("offset", offset.toString());
      if (filter !== "all") {
        params.set("type", filter);
      }

      const res = await axios.get<ApiOk<Transaction[]>>(
        `${import.meta.env.VITE_API_URL}/user/transactions?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = res.data.data || [];
      const meta = (res.data.meta || {}) as {
        limit: number;
        offset: number;
        total: number;
      };

      setTransactions((prev) => (reset ? data : [...prev, ...data]));

      const nextOffset = (meta.offset ?? offset) + (meta.limit ?? TX_LIMIT);
      setTxOffset(nextOffset);
      setHasMoreTransactions(nextOffset < (meta.total ?? data.length));
      setTxFilter(filter);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải lịch sử giao dịch.");
    }
  };

  const handleOpenAllTransactions = () => {
    // reset state & mở modal
    setTransactions([]);
    setTxOffset(0);
    setHasMoreTransactions(true);
    setTxFilter("all");
    setTransactionsOpen(true);
    // load trang đầu
    void fetchTransactions({ reset: true, filter: "all" });
  };

  const handleFilterChange = (filter: string) => {
    const value = filter as "all" | "credit" | "debit" | "topup";
    setTransactions([]);
    setTxOffset(0);
    setHasMoreTransactions(true);
    setTxFilter(value);
    void fetchTransactions({ reset: true, filter: value });
  };

  const handleFetchNextPage = () => {
    if (!hasMoreTransactions) return;
    void fetchTransactions();
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleDollarSign className="h-5 w-5 text-yellow-400" />
            Số dư Đồng vàng
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-3xl font-bold text-yellow-400">
            {coins.toLocaleString()}
          </p>
          <Button onClick={() => setOpenDialog(true)}>Nạp thêm</Button>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[420px] p-6 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-lg">
          <DialogHeader className="text-center space-y-1">
            <DialogTitle className="text-lg font-bold text-gray-800 dark:text-gray-100">
              Chọn gói nạp
            </DialogTitle>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Chọn số tiền muốn nạp, sau đó chọn phương thức thanh toán.
            </p>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {topupOptions.map((amount) => {
              const isActive = selectedAmount === amount;
              return (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setSelectedAmount(amount)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-sm font-medium transition-all
                    ${
                      isActive
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-blue-50 dark:bg-slate-800 dark:text-gray-100 dark:border-slate-700"
                    }`}
                >
                  <span>{amount.toLocaleString()} đ</span>
                  <span className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                    ≈ {calcGoldFromVnd(amount).toLocaleString()} vàng
                  </span>
                </button>
              );
            })}
          </div>

          {selectedAmount > 0 && (
            <div className="mt-4 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/40 px-3 py-2 text-xs flex items-center justify-between gap-2">
              <span className="text-gray-700 dark:text-gray-100">
                Bạn sẽ nhận khoảng
              </span>
              <span className="font-semibold text-yellow-600 dark:text-yellow-300">
                +{calcGoldFromVnd(selectedAmount).toLocaleString()} vàng
              </span>
            </div>
          )}

          <div className="mt-5 space-y-2">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Chọn phương thức thanh toán
            </p>

            <RadioGroup
              className="grid grid-cols-2 gap-3"
              value={paymentMethod ?? undefined}
              onValueChange={(val) =>
                setPaymentMethod(val as PaymentMethod)
              }
            >
              <label
                htmlFor="momo"
                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer text-sm transition-all
                  ${
                    paymentMethod === "momo"
                      ? "border-pink-500 bg-pink-50 dark:bg-pink-500/10 dark:text-pink-200"
                      : "border-gray-200 bg-white hover:bg-pink-50/60 dark:bg-slate-800 dark:border-slate-700"
                  }`}
              >
                <RadioGroupItem id="momo" value="momo" />
                <span>MoMo</span>
              </label>

              <label
                htmlFor="vnpay"
                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer text-sm transition-all
                  ${
                    paymentMethod === "vnpay"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-200"
                      : "border-gray-200 bg-white hover:bg-blue-50/60 dark:bg-slate-800 dark:border-slate-700"
                  }`}
              >
                <RadioGroupItem id="vnpay" value="vnpay" />
                <span>VNPay (sắp ra mắt)</span>
              </label>
            </RadioGroup>
          </div>

          <DialogFooter className="mt-6">
            <Button
              className="w-full"
              disabled={!selectedAmount || !paymentMethod || loading}
              onClick={handleTopup}
            >
              {loading
                ? "Đang tạo đơn..."
                : selectedAmount
                ? `Thanh toán ${selectedAmount.toLocaleString()} đ`
                : "Thanh toán"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Điểm danh hàng ngày
          </CardTitle>
        </CardHeader>

        <div className="px-4 pb-2 -mt-2 space-y-1">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Chuỗi điểm danh:
            <span className="font-semibold text-primary">
              {currentDayStreak}
            </span>
            ngày
          </p>
          <p className="text-xs text-muted-foreground">
            Chuỗi dài nhất:
            <span className="font-semibold text-primary ml-1">
              {currentLongestStreak}
            </span>
            ngày
          </p>
          <Progress value={cycleProgress} className="h-2 mt-2" />
        </div>

        <CardContent className="grid grid-cols-7 gap-2 text-center">
          {checkinList?.length > 0 ? (
            checkinList.map((item) => {
              const isClickable = item.isToday && !item.checked;
              return (
                <div
                  key={item.day}
                  className={`p-2 rounded-lg border ${
                    item.checked
                      ? "bg-primary/20 border-primary"
                      : "bg-background/50 border-border/50"
                  } ${
                    isClickable
                      ? "cursor-pointer hover:border-primary/70 transition-colors"
                      : ""
                  }`}
                  onClick={isClickable ? handleCheckin : undefined}
                >
                  <p className="text-sm">Ngày {item.day}</p>
                  <div className="h-8 flex items-center justify-center">
                    {item.checked ? (
                      <CheckCircle className="h-6 w-6 text-primary" />
                    ) : isClickable ? (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 text-primary font-bold"
                      >
                        Nhận
                      </Button>
                    ) : (
                      <div />
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="col-span-7 text-center text-sm text-muted-foreground">
              Chưa có dữ liệu điểm danh.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Nhiệm vụ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingQuests ? (
              <p className="text-sm text-muted-foreground text-center">
                Đang tải nhiệm vụ...
              </p>
            ) : quests?.length ? (
              quests.map((quest) => (
                <div key={quest.id}>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium">{quest.title}</p>
                    <p className="text-sm text-yellow-400">
                      +{quest.reward}{" "}
                      <CircleDollarSign className="inline h-4 w-4" />
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Progress
                      value={(quest.progress / quest.target) * 100}
                      className="h-2 flex-1"
                    />
                    <Button
                      size="sm"
                      disabled={
                        quest.progress < quest.target ||
                        quest.claimed ||
                        claimingQuest === quest.id
                      }
                      onClick={() => handleClaimQuest(quest)}
                    >
                      {claimingQuest === quest.id
                        ? "Đang nhận..."
                        : quest.claimed
                        ? "Đã nhận"
                        : quest.progress >= quest.target
                        ? "Nhận"
                        : `${quest.progress}/${quest.target}`}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                Chưa có nhiệm vụ.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Lịch sử giao dịch
            </CardTitle>
            {transactionHistory && transactionHistory.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenAllTransactions}
              >
                Xem tất cả
              </Button>
            )}
          </CardHeader>

          <CardContent>
            <ul className="space-y-3 max-h-60 overflow-y-auto">
              {transactionHistory?.length ? (
                transactionHistory.map((tx) => (
                  <li
                    key={tx.id}
                    className="flex justify-between items-center text-sm"
                  >
                    <div>
                      <p>{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.date}
                      </p>
                    </div>
                    <p
                      className={`font-semibold ${
                        tx.amount > 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {tx.amount > 0 ? "+" : ""}
                      {tx.amount}
                    </p>
                  </li>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  Chưa có giao dịch.
                </p>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
      <TransactionModal
        open={transactionsOpen}
        onOpenChange={setTransactionsOpen}
        transactions={transactions}
        fetchNextPage={handleFetchNextPage}
        hasMore={hasMoreTransactions}
        onFilterChange={handleFilterChange}
      />

    </div>
  );
}
