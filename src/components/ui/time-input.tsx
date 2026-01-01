'use client'

import * as React from 'react'
import { Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface TimeInputProps {
  value: string
  onChange: (value: string) => void
  className?: string
  id?: string
  required?: boolean
}

export function TimeInput({ value, onChange, className, id, required }: TimeInputProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)
  
  // Parse the time value from 24-hour format
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
  
  // Parse user input like "5:30 PM" or "530pm" or "17:30"
  const parseUserInput = (input: string): string | null => {
    if (!input) return null
    
    // Remove all spaces
    const cleaned = input.replace(/\s/g, '').toUpperCase()
    
    // Try to match various formats
    // Format: HH:MM AM/PM or HHMM AM/PM or HH:MM (24h) or HHMM (24h)
    const patterns = [
      /^(\d{1,2}):(\d{2})(AM|PM)$/,  // 5:30PM
      /^(\d{1,2})(\d{2})(AM|PM)$/,   // 530PM
      /^(\d{1,2}):(\d{2})$/,         // 17:30 (24h)
      /^(\d{3,4})$/,                  // 1730 (24h)
    ]
    
    for (const pattern of patterns) {
      const match = cleaned.match(pattern)
      if (match) {
        let hours = match[1]
        let minutes = match[2]
        const period = match[3]
        
        // Handle 3-4 digit format (e.g., 530 -> 5:30, 1730 -> 17:30)
        if (!minutes && hours.length >= 3) {
          minutes = hours.slice(-2)
          hours = hours.slice(0, -2)
        }
        
        let hour = parseInt(hours, 10)
        const minute = parseInt(minutes, 10)
        
        if (isNaN(hour) || isNaN(minute) || minute > 59) return null
        
        // If period is provided, validate 12-hour format
        if (period) {
          if (hour < 1 || hour > 12) return null
          if (period === 'PM' && hour !== 12) hour += 12
          if (period === 'AM' && hour === 12) hour = 0
        } else {
          // 24-hour format
          if (hour > 23) return null
        }
        
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      }
    }
    
    return null
  }
  
  const { hours, minutes, period } = parseTime(value)
  const [selectedHours, setSelectedHours] = React.useState(hours)
  const [selectedMinutes, setSelectedMinutes] = React.useState(minutes)
  const [selectedPeriod, setSelectedPeriod] = React.useState(period)
  
  // Update display value when value prop changes
  React.useEffect(() => {
    const parsed = parseTime(value)
    setSelectedHours(parsed.hours)
    setSelectedMinutes(parsed.minutes)
    setSelectedPeriod(parsed.period)
    
    if (value) {
      setInputValue(`${parsed.hours}:${parsed.minutes} ${parsed.period}`)
    } else {
      setInputValue('')
    }
  }, [value])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }
  
  const handleInputBlur = () => {
    const parsed = parseUserInput(inputValue)
    if (parsed) {
      onChange(parsed)
    } else if (value) {
      // Reset to previous valid value
      const parsed = parseTime(value)
      setInputValue(`${parsed.hours}:${parsed.minutes} ${parsed.period}`)
    } else {
      setInputValue('')
    }
  }
  
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const parsed = parseUserInput(inputValue)
      if (parsed) {
        onChange(parsed)
        inputRef.current?.blur()
      }
    }
  }
  
  const handleTimeChange = (h: string, m: string, p: string) => {
    if (h && m && p) {
      const time24 = formatTo24Hour(h, m, p)
      onChange(time24)
      setOpen(false)
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
        placeholder="HH:MM AM/PM"
        className="pr-10 bg-background text-foreground h-8 md:h-9 text-xs md:text-sm"
        required={required}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
          >
            <Clock className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs font-medium mb-1 block">Hour</label>
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
              <label className="text-xs font-medium mb-1 block">Minute</label>
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
              <label className="text-xs font-medium mb-1 block">Period</label>
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
        </PopoverContent>
      </Popover>
    </div>
  )
}