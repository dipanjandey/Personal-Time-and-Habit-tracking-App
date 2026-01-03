import { Card, CardContent } from '@/components/ui/card'

interface MiniStatCardProps {
  label: string
  value: string | number
}

export function MiniStatCard({ label, value }: MiniStatCardProps) {
  return (
    <Card className="border-2">
      <CardContent className="p-4 text-center">
        <div className="text-xs text-muted-foreground mb-1">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}