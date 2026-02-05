import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Target, Clock, LucideIcon } from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  calendar: Calendar,
  target: Target,
  clock: Clock,
}

interface InsightCardProps {
  title: string
  value: string
  icon: 'calendar' | 'target' | 'clock'
}

export function InsightCard({ title, value, icon }: InsightCardProps) {
  const Icon = iconMap[icon]
  
  return (
    <Card className="bg-muted/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 shrink-0 rounded-full bg-background flex items-center justify-center border">
            <Icon className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-sm font-medium text-muted-foreground whitespace-normal">{title}</p>
            <p className="text-sm font-semibold mt-1 whitespace-normal">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
