import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface ComicDescriptionProps {
  description: string
}

export default function ComicDescription({ description }: ComicDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const maxLength = 300

  const shouldTruncate = description.length > maxLength
  const displayText = isExpanded || !shouldTruncate ? description : description.slice(0, maxLength) + "..."

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
      <h2 className="text-xl font-montserrat font-bold mb-4">Nội dung truyện</h2>

      <div className="space-y-4">
        <div className="text-muted-foreground leading-relaxed whitespace-pre-line text-pretty">{displayText}</div>

        {shouldTruncate && (
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2 text-primary hover:text-primary/80 p-0 h-auto"
          >
            <span>{isExpanded ? "Thu gọn" : "Xem thêm"}</span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </Card>
  )
}