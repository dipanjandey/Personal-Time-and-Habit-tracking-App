'use client'

import * as React from 'react'
import { Check, ChevronDown, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { TimeInput } from '@/components/ui/time-input'
import { cn } from '@/lib/utils'

interface CompleteTaskButtonProps {
  onComplete: (endTime?: string) => void
  className?: string
}

// Get current time in HH:mm format
function getCurrentTime(): string {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

// Get time offset from current time
function getTimeOffset(minutesAgo: number): string {
  const now = new Date()
  now.setMinutes(now.getMinutes() - minutesAgo)
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

// Format time for display
function formatTimeDisplay(time24: string): string {
  const [hours, minutes] = time24.split(':')
  const hourNum = parseInt(hours, 10)
  const period = hourNum >= 12 ? 'PM' : 'AM'
  const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum
  return `${hour12}:${minutes} ${period}`
}

export function CompleteTaskButton({ onComplete, className }: CompleteTaskButtonProps) {
  const [showTimePicker, setShowTimePicker] = React.useState(false)
  const [customEndTime, setCustomEndTime] = React.useState('')
  const [dropdownOpen, setDropdownOpen] = React.useState(false)

  // Handle complete now (default action)
  const handleCompleteNow = (e: React.MouseEvent) => {
    e.stopPropagation()
    onComplete()
  }

  // Handle complete at specific time
  const handleCompleteAtTime = (time: string) => {
    onComplete(time)
    setShowTimePicker(false)
    setDropdownOpen(false)
    setCustomEndTime('')
  }

  // Handle custom time picker
  const handleOpenTimePicker = () => {
    setCustomEndTime(getCurrentTime())
    setShowTimePicker(true)
  }

  const handleConfirmCustomTime = () => {
    if (customEndTime) {
      handleCompleteAtTime(customEndTime)
    }
  }

  // Quick presets
  const presets = [
    { label: '5 min ago', minutes: 5 },
    { label: '15 min ago', minutes: 15 },
    { label: '30 min ago', minutes: 30 },
  ]

  return (
    <div className={cn('flex', className)} onClick={(e) => e.stopPropagation()}>
      {/* Main Complete Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleCompleteNow}
        className="rounded-r-none border-r-0 gap-1.5"
      >
        <Check className="w-4 h-4" />
        Complete
      </Button>

      {/* Dropdown Trigger */}
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="rounded-l-none px-2"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {/* Quick Presets */}
          {presets.map((preset) => (
            <DropdownMenuItem
              key={preset.minutes}
              onClick={() => handleCompleteAtTime(getTimeOffset(preset.minutes))}
            >
              <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
              End {preset.label} ({formatTimeDisplay(getTimeOffset(preset.minutes))})
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          {/* Custom Time Picker */}
          {!showTimePicker ? (
            <DropdownMenuItem onClick={handleOpenTimePicker}>
              <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
              End at specific time...
            </DropdownMenuItem>
          ) : (
            <div className="p-2" onClick={(e) => e.stopPropagation()}>
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Select end time
              </div>
              <div className="flex gap-2">
                <TimeInput
                  value={customEndTime}
                  onChange={setCustomEndTime}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleConfirmCustomTime}
                  disabled={!customEndTime}
                >
                  Set
                </Button>
              </div>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
