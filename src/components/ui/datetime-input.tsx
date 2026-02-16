'use client'

import * as React from 'react'
import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { getTodayDate } from '@/lib/time-utils'

interface DateTimeInputProps {
  date: string // ISO date string (YYYY-MM-DD)
  time: string // 24-hour time string (HH:MM)
  onDateChange: (date: string) => void
  onTimeChange: (time: string) => void
  className?: string
  id?: string
  required?: boolean
  placeholder?: string
  autoOpenPopover?: boolean
  onPopoverOpenChange?: (open: boolean, currentDate?: string, currentTime?: string) => void
  onEnterKey?: (date?: string, time?: string) => void
  onEscapeKey?: () => void
}

export function DateTimeInput({
  date,
  time,
  onDateChange,
  onTimeChange,
  className,
  id,
  required,
  placeholder = 'MM/DD HH:MM AM/PM',
  autoOpenPopover = false,
  onPopoverOpenChange,
  onEnterKey,
  onEscapeKey,
}: DateTimeInputProps) {
  const [open, setOpen] = React.useState(autoOpenPopover)
  const [inputValue, setInputValue] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Parse the time value from 24-hour format to 12-hour format
  const parseTime = (timeString: string) => {
    if (!timeString) return { hours: '', minutes: '', period: 'AM' }
    const [hours, minutes] = timeString.split(':')
    const hourNum = parseInt(hours, 10)
    const period = hourNum >= 12 ? 'PM' : 'AM'
    const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum
    return {
      hours: hour12.toString().padStart(2, '0'),
      minutes: minutes || '00',
      period,
    }
  }

  // Format to 24-hour format for storage
  const formatTo24Hour = (hours: string, minutes: string, period: string) => {
    let hour = parseInt(hours, 10)
    if (isNaN(hour)) return ''
    if (period === 'PM' && hour !== 12) hour += 12
    if (period === 'AM' && hour === 12) hour = 0
    return `${hour.toString().padStart(2, '0')}:${minutes}`
  }

  // Format date to display format (MM/DD)
  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr + 'T00:00:00')
    return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`
  }

  // Auto-open popover when autoOpenPopover prop changes to true
  React.useEffect(() => {
    if (autoOpenPopover) {
      setOpen(true)
    }
  }, [autoOpenPopover])

  // Handle popover state changes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    
    // When closing, send current values to parent
    if (!newOpen && selectedDate) {
      // Use local date, not UTC
      const year = selectedDate.getFullYear()
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
      const day = String(selectedDate.getDate()).padStart(2, '0')
      const isoDate = `${year}-${month}-${day}`
      const time24 = formatTo24Hour(selectedHours, selectedMinutes, selectedPeriod)
      onPopoverOpenChange?.(newOpen, isoDate, time24)
    } else {
      onPopoverOpenChange?.(newOpen)
    }
  }

  const { hours, minutes, period } = parseTime(time)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    date ? new Date(date + 'T00:00:00') : undefined
  )
  const [selectedHours, setSelectedHours] = React.useState(hours)
  const [selectedMinutes, setSelectedMinutes] = React.useState(minutes)
  const [selectedPeriod, setSelectedPeriod] = React.useState(period)

  // Update display value when props change
  React.useEffect(() => {
    const displayDate = formatDateForDisplay(date || getTodayDate())
    const parsed = parseTime(time)
    setSelectedHours(parsed.hours)
    setSelectedMinutes(parsed.minutes)
    setSelectedPeriod(parsed.period)

    if (date || time) {
      const timeStr = time ? `${parsed.hours}:${parsed.minutes} ${parsed.period}` : ''
      setInputValue(timeStr ? `${displayDate} ${timeStr}` : displayDate)
    } else {
      setInputValue('')
    }

    if (date) {
      setSelectedDate(new Date(date + 'T00:00:00'))
    }
  }, [date, time])

  // Parse user input like "12/25 5:30 PM" or "1225 530pm" or "12/25 17:30"
  const parseUserInput = (input: string): { date: string; time: string } | null => {
    if (!input) return null

    // Remove extra spaces and convert to uppercase
    const cleaned = input.trim().replace(/\s+/g, ' ').toUpperCase()

    // Patterns to match different input formats
    const patterns = [
      // MM/DD HH:MM AM/PM
      /^(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/,
      // MM/DD HHMM AM/PM
      /^(\d{1,2})\/(\d{1,2})\s+(\d{1,2})(\d{2})\s*(AM|PM)$/,
      // MM/DD HH:MM (24h)
      /^(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})$/,
      // MMDD HHMM (compact)
      /^(\d{2})(\d{2})\s+(\d{1,2})(\d{2})$/,
      // MM/DD only (use current time)
      /^(\d{1,2})\/(\d{1,2})$/,
    ]

    for (let i = 0; i < patterns.length; i++) {
      const match = cleaned.match(patterns[i])
      if (match) {
        let month: number, day: number, hour: number, minute: number, period: string | undefined

        if (i === 0) {
          // MM/DD HH:MM AM/PM
          ;[, month, day, hour, minute, period] = match.map((v, idx) => 
            idx > 0 && idx < 5 ? parseInt(v, 10) : v
          ) as any
        } else if (i === 1) {
          // MM/DD HHMM AM/PM
          ;[, month, day, hour, minute, period] = match.map((v, idx) => 
            idx > 0 && idx < 5 ? parseInt(v, 10) : v
          ) as any
        } else if (i === 2) {
          // MM/DD HH:MM (24h)
          ;[, month, day, hour, minute] = match.map(v => parseInt(v, 10)) as any
        } else if (i === 3) {
          // MMDD HHMM
          ;[, month, day, hour, minute] = match.map(v => parseInt(v, 10)) as any
        } else if (i === 4) {
          // MM/DD only - use current time
          ;[, month, day] = match.map(v => parseInt(v, 10)) as any
          const currentTime = parseTime(time)
          hour = parseInt(currentTime.hours, 10)
          minute = parseInt(currentTime.minutes, 10)
          period = currentTime.period
          if (period === 'PM' && hour !== 12) hour += 12
          if (period === 'AM' && hour === 12) hour = 0
        }

        // Validate month and day
        if (month! < 1 || month! > 12 || day! < 1 || day! > 31) return null

        // Convert to 24-hour format if period is provided
        if (period) {
          if (hour! < 1 || hour! > 12) return null
          if (period === 'PM' && hour! !== 12) hour = hour! + 12
          if (period === 'AM' && hour! === 12) hour = 0
        } else {
          if (hour! > 23) return null
        }

        // Validate minute
        if (minute! > 59) return null

        // Get current year
        const now = new Date()
        const year = now.getFullYear()

        // Format date as YYYY-MM-DD
        const dateStr = `${year}-${month!.toString().padStart(2, '0')}-${day!.toString().padStart(2, '0')}`
        const timeStr = `${hour!.toString().padStart(2, '0')}:${minute!.toString().padStart(2, '0')}`

        return { date: dateStr, time: timeStr }
      }
    }

    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleInputBlur = () => {
    const parsed = parseUserInput(inputValue)
    if (parsed) {
      // Valid input - update both date and time
      onDateChange(parsed.date)
      onTimeChange(parsed.time)
    } else {
      // Invalid input - reset to previous valid value
      const displayDate = formatDateForDisplay(date || getTodayDate())
      const parsedTime = parseTime(time)
      const timeStr = time ? `${parsedTime.hours}:${parsedTime.minutes} ${parsedTime.period}` : ''
      setInputValue(timeStr ? `${displayDate} ${timeStr}` : displayDate)
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      const parsed = parseUserInput(inputValue)
      if (parsed) {
        onDateChange(parsed.date)
        onTimeChange(parsed.time)
        // Call the callback with parsed values so parent can use them immediately
        if (onEnterKey) {
          onEnterKey(parsed.date, parsed.time)
        } else {
          inputRef.current?.blur()
        }
      } else {
        // Invalid input - just call onEnterKey without values
        if (onEnterKey) {
          onEnterKey()
        } else {
          inputRef.current?.blur()
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      // Reset to previous valid value
      const displayDate = formatDateForDisplay(date || getTodayDate())
      const parsedTime = parseTime(time)
      const timeStr = time ? `${parsedTime.hours}:${parsedTime.minutes} ${parsedTime.period}` : ''
      setInputValue(timeStr ? `${displayDate} ${timeStr}` : displayDate)
      
      // Call the callback if provided (for table edit mode)
      if (onEscapeKey) {
        onEscapeKey()
      } else {
        inputRef.current?.blur()
      }
    }
  }

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setSelectedDate(newDate)
      // Use local date, not UTC
      const year = newDate.getFullYear()
      const month = String(newDate.getMonth() + 1).padStart(2, '0')
      const day = String(newDate.getDate()).padStart(2, '0')
      const isoDate = `${year}-${month}-${day}`
      onDateChange(isoDate)
    }
  }

  const handleTimeChange = (h: string, m: string, p: string) => {
    if (h && m && p) {
      const time24 = formatTo24Hour(h, m, p)
      onTimeChange(time24)
    }
  }

  const handleHourChange = (h: string) => {
    setSelectedHours(h)
    handleTimeChange(h, selectedMinutes, selectedPeriod)
  }

  const handleMinuteChange = (m: string) => {
    setSelectedMinutes(m)
    handleTimeChange(selectedHours, m, selectedPeriod)
  }

  const handlePeriodChange = (p: string) => {
    setSelectedPeriod(p)
    handleTimeChange(selectedHours, selectedMinutes, p)
  }

  // Generate hour options (1-12)
  const hourOptions = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 1
    return hour.toString().padStart(2, '0')
  })

  // Generate minute options (0-59)
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))

  return (
    <div className={cn('relative', className)}>
      <Input
        ref={inputRef}
        id={id}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
        placeholder={placeholder}
        className="pr-10 bg-background text-foreground h-8 md:h-9 text-xs md:text-sm"
        required={required}
      />
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
          >
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-4" 
          align="start"
          onInteractOutside={(e) => {
            // Prevent closing when interacting with Select dropdowns or calendar elements
            const target = e.target as HTMLElement
            
            // Check if interaction is with Select dropdown components
            const isSelectContent = target.closest('[role="listbox"]') || 
                                   target.closest('[data-radix-select-content]') ||
                                   target.closest('[data-radix-select-viewport]') ||
                                   target.closest('[role="option"]')
            
            // Check if interaction is with calendar components (buttons, grid cells, etc.)
            const isCalendarElement = target.closest('[role="grid"]') ||
                                     target.closest('[role="gridcell"]') ||
                                     target.closest('.rdp') || // react-day-picker class
                                     target.closest('button[name="day"]') ||
                                     target.closest('button[name="previous-month"]') ||
                                     target.closest('button[name="next-month"]')
            
            // Check if the target is the input field itself (part of this component)
            const isInputField = target === inputRef.current || target.closest('input') === inputRef.current
            
            if (isSelectContent || isCalendarElement || isInputField) {
              e.preventDefault()
            }
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium mb-2 block">Date</label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
              />
            </div>
            <div className="border-t pt-4">
              <label className="text-xs font-medium mb-2 block">Time</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Hour</label>
                  <Select value={selectedHours} onValueChange={handleHourChange}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="HH" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {hourOptions.map((hour) => (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Minute</label>
                  <Select value={selectedMinutes} onValueChange={handleMinuteChange}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="MM" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {minuteOptions.map((minute) => (
                        <SelectItem key={minute} value={minute}>
                          {minute}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Period</label>
                  <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="AM" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}