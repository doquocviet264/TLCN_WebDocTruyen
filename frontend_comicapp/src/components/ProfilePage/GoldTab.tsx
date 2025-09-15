import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CircleDollarSign, CalendarCheck, Target, ListChecks, CheckCircle } from "lucide-react"
import { Transaction, Quest } from "./types"

interface ProfileGoldTabProps {
  goldCoins: number
  dailyCheckin: { day: number; checked: boolean }[]
  quests: Quest[]
  transactionHistory: Transaction[]
}
const UiProgress = ({ value }: { value: number }) => (
  <div className="w-full bg-secondary rounded-full h-2.5">
    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${value}%` }}></div>
  </div>
);
export function ProfileGoldTab({ 
  goldCoins, 
  dailyCheckin, 
  quests, 
  transactionHistory 
}: ProfileGoldTabProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleDollarSign className="h-5 w-5 text-yellow-400"/>
            Số dư Đồng vàng
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-3xl font-bold text-yellow-400">{goldCoins.toLocaleString()}</p>
          <Button>Nạp thêm</Button>
        </CardContent>
      </Card>
      
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5"/>
            Điểm danh hàng ngày
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-7 gap-2 text-center">
          {dailyCheckin.map(item => (
            <div key={item.day} className={`p-2 rounded-lg border ${item.checked ? 'bg-primary/20 border-primary' : 'bg-background/50 border-border/50'}`}>
              <p className="text-sm">Ngày {item.day}</p>
              {item.checked ? (
                <CheckCircle className="h-6 w-6 mx-auto mt-1 text-primary"/>
              ) : (
                <div className="h-6 w-6 mx-auto mt-1" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5"/>Nhiệm vụ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quests.map(quest => (
              <div key={quest.id}>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium">{quest.title}</p>
                  <p className="text-sm text-yellow-400">+{quest.reward} <CircleDollarSign className="inline h-4 w-4"/></p>
                </div>
                <div className="flex items-center gap-4">
                  <UiProgress value={(quest.progress / quest.target) * 100}/>
                  <Button size="sm" disabled={quest.progress < quest.target}>
                    {quest.progress >= quest.target ? "Nhận" : `${quest.progress}/${quest.target}`}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5"/>Lịch sử giao dịch</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 max-h-60 overflow-y-auto">
              {transactionHistory.map(tx => (
                <li key={tx.id} className="flex justify-between items-center text-sm">
                  <div>
                    <p>{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                  <p className={`font-semibold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}