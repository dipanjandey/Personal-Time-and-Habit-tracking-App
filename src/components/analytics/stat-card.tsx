import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  description?: string
  trend?: number // percentage change (positive or negative)
  trendLabel?: string // e.g., "vs last week"
}

export function StatCard({ title, value, icon: Icon, description, trend, trendLabel = 'vs last period' }: StatCardProps) {
  const hasTrend = trend !== undefined && trend !== null
  const isPositive = (trend ?? 0) >= 0
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-2">{value}</h3>
            {hasTrend && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${isPositive ? 'text-success' : 'text-danger'}`}>
                {isPositive ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>
                  {isPositive ? '+' : ''}{trend?.toFixed(1)}% {trendLabel}
                </span>
              </div>
            )}
            {description && !hasTrend && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
