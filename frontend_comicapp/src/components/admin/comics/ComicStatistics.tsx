import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface Stat {
  label: string;
  value: string;
  trend: string;
  icon: any;
}

interface ComicStatisticsProps {
  stats: Stat[];
}

export default function ComicStatistics({ stats }: ComicStatisticsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> {stat.trend}
              </span>
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
