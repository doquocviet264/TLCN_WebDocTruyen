import { Edit, Eye, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ComicHeaderProps {
  cover: string;
  title: string;
}

export default function ComicHeader({ cover, title }: ComicHeaderProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden mb-4">
          <img src={cover} alt={title} className="object-cover w-full h-full" />
        </div>
      </CardContent>
    </Card>
  );
}