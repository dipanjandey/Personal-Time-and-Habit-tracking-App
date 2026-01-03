'use client'

import { useState, useRef, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupInput, InputGroupButton } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Combobox } from '@/components/ui/combobox'
import { useTimeTrackingStore } from '@/store/time-tracking-store'
import { useConfigStore } from '@/store/config-store'
import { calculateDuration, getCurrentTime, getTodayDate } from '@/lib/time-utils'

// Helper functions for date/time formatting and validation
const formatDateTimeForEdit = (date: string, time: string): string => {
  if (!date || !time) return ''
  
  const d = new Date(date + 'T00:00:00')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  const year = d.getFullYear()
  
  const [hours, minutes] = time.split(':')
  const hourNum = parseInt(hours, 10)
  const period = hourNum >= 12 ? 'pm' : 'am'
  const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum
  
  return `${month}/${day}/${year} ${hour12}:${minutes} ${period}`
}

const getCurrentDateTime = (): string => {
  const now = new Date()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const year = now.getFullYear()
  
  const hours = now.getHours()
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const period = hours >= 12 ? 'pm' : 'am'
  const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  
  return `${month}/${day}/${year} ${hour12}:${minutes} ${period}`
}

const parseEditFormatToStorage = (editValue: string): { 
  success: boolean
  date?: string
  time?: string
  error?: string 
} => {
  // Expected format: mm/dd/yyyy hh:mm am/pm
  const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s+(am|pm)$/i
  const match = editValue.trim().match(regex)
  
  if (!match) {
    return { 
      success: false, 
      error: 'Invalid format. Use: mm/dd/yyyy hh:mm am/pm (e.g., 01/03/2026 10:30 am)' 
    }
  }
  
  const [, monthStr, dayStr, yearStr, hourStr, minuteStr, period] = match
  const month = parseInt(monthStr, 10)
  const day = parseInt(dayStr, 10)
  const year = parseInt(yearStr, 10)
  let hour = parseInt(hourStr, 10)
  const minute = parseInt(minuteStr, 10)
  
  // Validate ranges
  if (month < 1 || month > 12) {
    return { success: false, error: 'Invalid month (1-12)' }
  }
  if (day < 1 || day > 31) {
    return { success: false, error: 'Invalid day (1-31)' }
  }
  if (hour < 1 || hour > 12) {
    return { success: false, error: 'Invalid hour (1-12)' }
  }
  if (minute < 0 || minute > 59) {
    return { success: false, error: 'Invalid minute (0-59)' }
  }
  
  // Convert to 24-hour format
  if (period.toLowerCase() === 'pm' && hour !== 12) {
    hour += 12
  } else if (period.toLowerCase() === 'am' && hour === 12) {
    hour = 0
  }
  
  // Format as YYYY-MM-DD and HH:mm
  const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
  const timeStr = `${hour.toString().padStart(2, '0')}:${minuteStr}`
  
  return { success: true, date: dateStr, time: timeStr }
}

export function QuickEntryBar() {
  const [startDateTime, setStartDateTime] = useState(() => formatDateTimeForEdit(getTodayDate(), getCurrentTime()))
  const [endDateTime, setEndDateTime] = useState('')
  const [startError, setStartError] = useState('')
  const [endError, setEndError] = useState('')
  const [workArea, setWorkArea] = useState('')
  const [workType, setWorkType] = useState('')
  const [pomodoros, setPomodoros] = useState(0)
  const [comments, setComments] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const startInputRef = useRef<HTMLInputElement>(null)
  const endInputRef = useRef<HTMLInputElement>(null)
  const startCursorRef = useRef<number | null>(null)
  const endCursorRef = useRef<number | null>(null)

  const { addEntry } = useTimeTrackingStore()
  const { workAreas, workTypes, loadWorkAreas, loadWorkTypes } = useConfigStore()

  // Load work areas and types on mount
  useEffect(() => {
    loadWorkAreas()
    loadWorkTypes()
  }, [loadWorkAreas, loadWorkTypes])

  // Restore cursor position for start input
  useEffect(() => {
    if (startInputRef.current && startCursorRef.current !== null) {
      startInputRef.current.setSelectionRange(startCursorRef.current, startCursorRef.current)
    }
  }, [startDateTime])

  // Restore cursor position for end input
  useEffect(() => {
    if (endInputRef.current && endCursorRef.current !== null) {
      endInputRef.current.setSelectionRange(endCursorRef.current, endCursorRef.current)
    }
  }, [endDateTime])

  // Auto-expand textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [comments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!startDateTime || !workArea || !workType || isSubmitting) {
      return
    }

    // Validate start time
    const startParsed = parseEditFormatToStorage(startDateTime)
    if (!startParsed.success) {
      setStartError(startParsed.error || 'Invalid format')
      return
    }

    // Validate end time if provided
    let endParsed = null
    if (endDateTime && endDateTime.trim()) {
      endParsed = parseEditFormatToStorage(endDateTime)
      if (!endParsed.success) {
        setEndError(endParsed.error || 'Invalid format')
        return
      }
    }

    setIsSubmitting(true)
    
    // Calculate duration if end time provided
    let duration = 0
    let endTimeValue = ''
    
    if (endParsed) {
      const startDateTimeObj = new Date(`${startParsed.date}T${startParsed.time}:00`)
      const endDateTimeObj = new Date(`${endParsed.date}T${endParsed.time}:00`)
      duration = Math.floor((endDateTimeObj.getTime() - startDateTimeObj.getTime()) / (1000 * 60))
      endTimeValue = `${endParsed.date} ${endParsed.time}`
    }

    try {
      await addEntry({
        startTime: `${startParsed.date} ${startParsed.time}`,
        endTime: endTimeValue,
        workArea,
        workType,
        pomodoros,
        comments,
        date: startParsed.date,
        duration,
        userId: '', // User ID is set server-side by createTimeEntry
      })

      // Reset form on success
      setStartDateTime(formatDateTimeForEdit(getTodayDate(), getCurrentTime()))
      setEndDateTime('')
      setStartError('')
      setEndError('')
      setPomodoros(0)
      setComments('')
    } catch (error) {
      console.error('Failed to add entry:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-primary/90 to-purple-600 rounded-lg p-3 md:p-5 text-primary-foreground mb-4 md:mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 flex items-center justify-center text-sm">⚡</div>
        <h3 className="text-base md:text-lg font-semibold">Quick Entry</h3>
        <span className="text-xs md:text-sm opacity-90">(Fast track your time)</span>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-3 md:gap-4">
        <div className="space-y-1 col-span-2 sm:col-span-2 lg:col-span-2">
          <Label htmlFor="start-time" className="text-[10px] md:text-xs font-bold uppercase text-primary-foreground/90">
            Start
          </Label>
          <InputGroup>
            <InputGroupInput
              ref={startInputRef}
              id="start-time"
              value={startDateTime}
              onChange={(e) => {
                const target = e.target as HTMLInputElement
                startCursorRef.current = target.selectionStart
                setStartDateTime(e.target.value)
                setStartError('') // Clear error on change
              }}
              placeholder="mm/dd/yyyy hh:mm am/pm"
              className={`bg-background text-foreground h-8 md:h-9 text-xs md:text-sm ${
                startError ? 'border-red-500 focus-visible:ring-red-500' : ''
              }`}
              required
            />
            <InputGroupButton
              type="button"
              onClick={() => {
                setStartDateTime(getCurrentDateTime())
                setStartError('')
              }}
              className="h-8 md:h-9"
            >
              <Clock className="w-3.5 h-3.5" />
            </InputGroupButton>
          </InputGroup>
          {startError && (
            <p className="text-xs text-red-200 mt-1">{startError}</p>
          )}
        </div>

        <div className="space-y-1 col-span-2 sm:col-span-2 lg:col-span-2">
          <Label htmlFor="end-time" className="text-[10px] md:text-xs font-bold uppercase text-primary-foreground/90">
            End
          </Label>
          <InputGroup>
            <InputGroupInput
              ref={endInputRef}
              id="end-time"
              value={endDateTime}
              onChange={(e) => {
                const target = e.target as HTMLInputElement
                endCursorRef.current = target.selectionStart
                setEndDateTime(e.target.value)
                setEndError('') // Clear error on change
              }}
              placeholder="mm/dd/yyyy hh:mm am/pm"
              className={`bg-background text-foreground h-8 md:h-9 text-xs md:text-sm ${
                endError ? 'border-red-500 focus-visible:ring-red-500' : ''
              }`}
            />
            <InputGroupButton
              type="button"
              onClick={() => {
                setEndDateTime(getCurrentDateTime())
                setEndError('')
              }}
              className="h-8 md:h-9"
            >
              <Clock className="w-3.5 h-3.5" />
            </InputGroupButton>
          </InputGroup>
          {endError && (
            <p className="text-xs text-red-200 mt-1">{endError}</p>
          )}
        </div>

        <div className="space-y-1 col-span-2 sm:col-span-2">
          <Label htmlFor="work-area" className="text-[10px] md:text-xs font-bold uppercase text-primary-foreground/90">
            Area
          </Label>
          <Combobox
            id="work-area"
            value={workArea}
            onValueChange={setWorkArea}
            options={workAreas.map((area) => ({ value: area.name, label: area.name }))}
            placeholder="Select area..."
            emptyText="No area found."
            required
          />
        </div>

        <div className="space-y-1 col-span-2 sm:col-span-2">
          <Label htmlFor="work-type" className="text-[10px] md:text-xs font-bold uppercase text-primary-foreground/90">
            Type
          </Label>
          <Combobox
            id="work-type"
            value={workType}
            onValueChange={setWorkType}
            options={workTypes.map((type) => ({ value: type.name, label: type.name }))}
            placeholder="Select type..."
            emptyText="No type found."
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="pomodoros" className="text-[10px] md:text-xs font-bold uppercase text-primary-foreground/90">
            # pomodoros
          </Label>
          <Input
            id="pomodoros"
            type="number"
            min="0"
            value={pomodoros}
            onChange={(e) => setPomodoros(Number(e.target.value))}
            className="bg-background text-foreground h-8 md:h-9 text-xs md:text-sm"
          />
        </div>

        <div className="space-y-1 col-span-2 sm:col-span-4 lg:col-span-4">
          <Label htmlFor="comments" className="text-[10px] md:text-xs font-bold uppercase text-primary-foreground/90">
            Comments
          </Label>
          <Textarea
            ref={textareaRef}
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="What did you work on?"
            className="bg-background text-foreground text-xs md:text-sm resize-none overflow-hidden min-h-[32px] md:min-h-[36px]"
            rows={1}
          />
        </div>

        <div className="flex items-end col-span-2 sm:col-span-4 lg:col-span-2">
          <Button
            type="submit"
            size="default"
            className="w-full h-8 md:h-9 text-xs md:text-sm font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? '⏳ Adding...' : '➕ Add Entry'}
          </Button>
        </div>
      </form>
    </div>
  )
}