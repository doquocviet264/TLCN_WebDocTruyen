import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import InfiniteScroll from "react-infinite-scroll-component";

interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  type?: string;
}

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: Transaction[];
  fetchNextPage: () => void;
  hasMore: boolean;
  onFilterChange: (filter: string) => void;
}

export function TransactionModal({
  open,
  onOpenChange,
  transactions,
  fetchNextPage,
  hasMore,
  onFilterChange,
}: TransactionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Lịch sử giao dịch</DialogTitle>
        </DialogHeader>
        <div className="flex items-center space-x-4">
          <Select onValueChange={onFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Lọc theo loại" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="credit">Nhận vàng</SelectItem>
              <SelectItem value="debit">Trừ vàng</SelectItem>
              <SelectItem value="topup">Nạp vàng</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div id="scrollableDiv" className="flex-grow overflow-auto">
          <InfiniteScroll
            dataLength={transactions.length}
            next={fetchNextPage}
            hasMore={hasMore}
            loader={<h4>Đang tải...</h4>}
            scrollableTarget="scrollableDiv"
          >
            <ul className="space-y-3">
              {transactions.map((tx) => (
                <li
                  key={tx.id}
                  className="flex justify-between items-center text-sm"
                >
                  <div>
                    <p>{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                  <p
                    className={`font-semibold ${
                      tx.amount > 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {tx.amount > 0 ? "+" : ""}
                    {tx.amount}
                  </p>
                </li>
              ))}
            </ul>
          </InfiniteScroll>
        </div>
      </DialogContent>
    </Dialog>
  );
}
