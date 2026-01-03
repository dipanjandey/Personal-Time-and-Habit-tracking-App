import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QuickStartTaskProps {
  taskName: string
  projectName: string
  onClick?: () => void
}

export function QuickStartTask({
  taskName,
  projectName,
  onClick,
}: QuickStartTaskProps) {
  return (
    <Button
      variant="outline"
      className="w-full mb-4 text-left justify-start h-auto py-3 px-4 border-2"
      onClick={onClick}
    >
      <div className="flex items-start gap-3 w-full">
        <Play className="w-4 h-4 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <div className="font-bold">{taskName}</div>
          <div className="text-xs text-muted-foreground">{projectName}</div>
        </div>
      </div>
    </Button>
  )
}