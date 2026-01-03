import { MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface RecentTaskItemProps {
  taskName: string
  projectName: string
  duration: string
  onMoreClick?: () => void
}

export function RecentTaskItem({
  taskName,
  projectName,
  duration,
  onMoreClick,
}: RecentTaskItemProps) {
  return (
    <Card className="p-4 mb-3 border-2 hover:bg-muted/50 transition-colors cursor-pointer">
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <div className="font-bold mb-1">{taskName}</div>
          <div className="text-xs text-muted-foreground">{projectName}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="font-bold mr-2">{duration}</div>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-2"
            onClick={onMoreClick}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}