'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TimeInput } from '@/components/ui/time-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTimeTrackingStore } from '@/store/time-tracking-store'
import { calculateDuration, getCurrentTime, getTodayDate } from '@/lib/time-utils'

const workAreas = [
  'Product - testing & usage',
  'Product - spec, design & research',
  'Product - project management',
  'GTM - demos & reachouts',
  'GTM - research & planning',
  'GTM - marketing',
  'GTM - product marketing',
  'GTM - others',
  'Coding',
  'Work Planning',
  'Finance, ops & investors',
  'Cofounder/ office time',
  'Ineffective',
  'across areas',
]

const workTypes = [
  'Self work - w Pomodoro',
  'Self work',
  'Meetings - Internal',
  'Meetings - External',
  'Email, chat & call',
  'Multiple work types',
  'Others',
]

export function QuickEntryBar() {
  const [startTime, setStartTime] = useState(getCurrentTime())
  const [endTime, setEndTime] = useState('')
  const [workArea, setWorkArea] = useState('')
  const [workType, setWorkType] = useState('')
  const [pomodoros, setPomodoros] = useState(0)
  const [comments, setComments] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const { addEntry } = useTimeTrackingStore()
  
  // Auto-expand textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [comments])
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!startTime || !endTime || !workArea || !workType) {
      return
    }
    
    const duration = calculateDuration(startTime, endTime)
    
    addEntry({
      startTime,
      endTime,
      workArea,
      workType,
      pomodoros,
      comments,
      date: getTodayDate(),
      duration,
      userId: 'current-user', // Will be replaced with actual user ID
    })
    
    // Reset form
    setStartTime(getCurrentTime())
    setEndTime('')
    setPomodoros(0)
    setComments('')
  }
  
  return (
    <div className="bg-gradient-to-br from-primary/90 to-purple-600 rounded-lg p-3 md:p-5 text-primary-foreground mb-4 md:mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 flex items-center justify-center text-sm">⚡</div>
        <h3 className="text-base md:text-lg font-semibold">Quick Entry</h3>
        <span className="text-xs md:text-sm opacity-90">(Fast track your time)</span>
      </div>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4">
        <div className="space-y-1">
          <Label htmlFor="start-time" className="text-[10px] md:text-xs font-bold uppercase text-primary-foreground/90">
            Start
          </Label>
          <TimeInput
            id="start-time"
            value={startTime}
            onChange={setStartTime}
            required
          />
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="end-time" className="text-[10px] md:text-xs font-bold uppercase text-primary-foreground/90">
            End
          </Label>
          <TimeInput
            id="end-time"
            value={endTime}
            onChange={setEndTime}
            required
          />
        </div>
        
        <div className="space-y-1 col-span-2 sm:col-span-2 lg:col-span-2">
          <Label htmlFor="work-area" className="text-[10px] md:text-xs font-bold uppercase text-primary-foreground/90">
            Area
          </Label>
          <Select value={workArea} onValueChange={setWorkArea} required>
            <SelectTrigger id="work-area" className="bg-background text-foreground h-8 md:h-9 text-xs md:text-sm">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {workAreas.map((area) => (
                <SelectItem key={area} value={area}>
                  {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-1 col-span-2 sm:col-span-2 lg:col-span-2">
          <Label htmlFor="work-type" className="text-[10px] md:text-xs font-bold uppercase text-primary-foreground/90">
            Type
          </Label>
          <Select value={workType} onValueChange={setWorkType} required>
            <SelectTrigger id="work-type" className="bg-background text-foreground h-8 md:h-9 text-xs md:text-sm">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {workTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        
        <div className="space-y-1 col-span-2 sm:col-span-4 lg:col-span-6">
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
        
        <div className="flex items-end col-span-2 sm:col-span-4 lg:col-span-1">
          <Button type="submit" size="default" className="w-full h-8 md:h-9 text-xs md:text-sm font-semibold">
            ➕ Add Entry
          </Button>
        </div>
      </form>
    </div>
  )
}