import axios from "axios";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CircleDollarSign, CalendarCheck, Target, ListChecks, CheckCircle } from "lucide-react";
import { toast } from "react-toastify"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface DailyCheckinItem {
  day: number;
  checked: boolean;
  isToday?: boolean;
}
interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
}

interface Quest {
  id: number;
  title: string;
  reward: number;
  progress: number;
  target: number;
  claimed?: boolean;
  category?: string; // Thêm category nếu cần
}
interface ProfileGoldTabProps {
  goldCoins: number;
  dailyCheckin?: DailyCheckinItem[];
  quests?: Quest[];
  transactionHistory?: Transaction[];
  onCheckin?: (updatedCheckin: DailyCheckinItem[], newGold: number) => void;
  onClaimQuest?: (questId: number) => void;
  loadingQuests?: boolean;
}

interface CheckinResponse {
  message: string;
  newBalance: number;
  dailyCheckin: DailyCheckinItem[];
}
interface MoMoResponse {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  responseTime: number;
  message: string;
  resultCode: number;
  payUrl: string;
  shortLink: string;
}
type ApiOk<T> = { success: true; data: T; meta?: unknown };
type ApiErr = { success: false; error: { message: string; code: string; status: number } };
export function ProfileGoldTab({
  goldCoins,
  dailyCheckin,
  quests,
  transactionHistory,
  onCheckin,
  onClaimQuest,
  loadingQuests = false,
}: ProfileGoldTabProps) {
  const [coins, setCoins] = useState<number>(goldCoins ?? 0);
  const [checkinList, setCheckinList] = useState<DailyCheckinItem[]>(dailyCheckin || []);
  const [claimingQuest, setClaimingQuest] = useState<number | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const handleTopup = async (amount: number) => {
  if (selectedAmount === 0) return;
  setLoading(true);
  try {
    const response = await axios.post<MoMoResponse>(`http://localhost:3000/payment`, {
      amount: selectedAmount
    });

    const data = response.data;

    if (data.resultCode === 0 && data.payUrl) {
      window.open(data.payUrl, "_blank"); // mở tab mới
      toast.success(`Đang mở cổng thanh toán MoMo cho ${selectedAmount.toLocaleString()} đ`);
      setOpenDialog(false);
      setSelectedAmount(0);
    } else {
      toast.error(`Lỗi: ${data.message}`);
    }
  } catch (err) {
    console.error(err);
    toast.error("Nạp tiền thất bại, thử lại sau.");
  } finally {
    setLoading(false);
  }
};



  const topupOptions = [10000, 20000, 50000, 100000, 200000, 500000];

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
      toast.success(data.message || "Điểm danh thành công!")

      setCoins(data.newBalance);
      setCheckinList(data.dailyCheckin);

      if (onCheckin) onCheckin(data.dailyCheckin, data.newBalance);
    } catch (err: any) {
      const message = "Điểm danh thất bại! Vui lòng thử lại.";
      toast.error(message)
    }
  };

  const handleClaimQuest = async (quest: Quest) => {
    if (!onClaimQuest) return;
    
    try {
      setClaimingQuest(quest.id);
      await onClaimQuest(quest.id);
      toast.success(`Nhận thưởng thành công: +${quest.reward} đồng vàng!`);
    } catch (error) {
      toast.error("Nhận thưởng thất bại!");
    } finally {
      setClaimingQuest(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Số dư Đồng vàng */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleDollarSign className="h-5 w-5 text-yellow-400" />
            Số dư Đồng vàng
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-3xl font-bold text-yellow-400">{coins.toLocaleString()}</p>
          <Button onClick={() => setOpenDialog(true)}>Nạp thêm</Button>
        </CardContent>
      </Card>

      {/* Dialog nạp thêm */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogContent className="sm:max-w-[400px] p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg">
        <DialogHeader className="text-center">
          <DialogTitle className="text-lg font-bold text-gray-800">
            Chọn số tiền muốn nạp
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-6">
          {topupOptions.map(amount => (
            <button
              key={amount}
              onClick={() => setSelectedAmount(amount)}
              className={`flex items-center justify-center p-4 rounded-xl font-medium border transition-all
                ${selectedAmount === amount ? " " : "bg-white text-gray-700 border-gray-200 hover:bg-blue-100"}
              `}
            >
              {amount.toLocaleString()} đ
            </button>
          ))}
        </div>

        <DialogFooter className="mt-6">
          <Button
            className="w-full "
            disabled={selectedAmount === 0}
            onClick={() => handleTopup(selectedAmount)}
          >
            Nạp {selectedAmount ? selectedAmount.toLocaleString() : ""} đ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>


      {/* Điểm danh hàng ngày */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Điểm danh hàng ngày
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-7 gap-2 text-center">
          {checkinList?.length > 0 ? (
            checkinList.map((item) => {
              const isClickable = item.isToday && !item.checked;
              return (
                <div
                  key={item.day}
                  className={`p-2 rounded-lg border ${
                    item.checked ? "bg-primary/20 border-primary" : "bg-background/50 border-border/50"
                  } ${isClickable ? "cursor-pointer hover:border-primary/70 transition-colors" : ""}`}
                  onClick={isClickable ? handleCheckin : undefined}
                >
                  <p className="text-sm">Ngày {item.day}</p>
                  <div className="h-8 flex items-center justify-center">
                    {item.checked ? (
                      <CheckCircle className="h-6 w-6 text-primary" />
                    ) : isClickable ? (
                      <Button variant="link" size="sm" className="p-0 text-primary font-bold">
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

      {/* Nhiệm vụ và Lịch sử giao dịch */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nhiệm vụ */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Nhiệm vụ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingQuests ? (
              <p className="text-sm text-muted-foreground text-center">Đang tải nhiệm vụ...</p>
            ) : quests?.length ? (
              quests.map((quest) => (
                <div key={quest.id}>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium">{quest.title}</p>
                    <p className="text-sm text-yellow-400">
                      +{quest.reward} <CircleDollarSign className="inline h-4 w-4" />
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Progress value={(quest.progress / quest.target) * 100} className="h-2 flex-1" />
                    <Button 
                      size="sm" 
                      disabled={quest.progress < quest.target || quest.claimed || claimingQuest === quest.id}
                      onClick={() => handleClaimQuest(quest)}
                    >
                      {claimingQuest === quest.id ? "Đang nhận..." : 
                       quest.claimed ? "Đã nhận" :
                       quest.progress >= quest.target ? "Nhận" : 
                       `${quest.progress}/${quest.target}`}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center">Chưa có nhiệm vụ.</p>
            )}
          </CardContent>
        </Card>

        {/* Lịch sử giao dịch */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Lịch sử giao dịch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 max-h-60 overflow-y-auto">
              {transactionHistory?.length ? (
                transactionHistory.map((tx) => (
                  <li key={tx.id} className="flex justify-between items-center text-sm">
                    <div>
                      <p>{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{tx.date}</p>
                    </div>
                    <p className={`font-semibold ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount}
                    </p>
                  </li>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center">Chưa có giao dịch.</p>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}