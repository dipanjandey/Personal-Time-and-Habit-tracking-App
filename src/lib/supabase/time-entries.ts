import { supabase } from './client'
import type { TimeEntry } from '@/types/time-tracking'
import type { Database } from '@/types/database.types'

type TimeEntryRow = Database['public']['Tables']['time_entries']['Row']
type TimeEntryInsert = Database['public']['Tables']['time_entries']['Insert']
type TimeEntryUpdate = Database['public']['Tables']['time_entries']['Update']

// Convert database row to app TimeEntry type
function rowToTimeEntry(row: TimeEntryRow): TimeEntry {
  return {
    id: row.id,
    userId: row.user_id,
    startTime: row.start_time,
    endTime: row.end_time,
    workArea: row.work_area,
    workType: row.work_type,
    pomodoros: row.pomodoros,
    comments: row.comments,
    date: row.date,
    duration: row.duration,
  }
}

// Convert app TimeEntry to database insert type
function timeEntryToInsert(entry: Omit<TimeEntry, 'id'>, userId: string): TimeEntryInsert {
  return {
    user_id: userId,
    start_time: entry.startTime,
    end_time: entry.endTime,
    work_area: entry.workArea,
    work_type: entry.workType,
    pomodoros: entry.pomodoros,
    comments: entry.comments,
    date: entry.date,
    duration: entry.duration,
  }
}

// Convert app TimeEntry updates to database update type
function timeEntryToUpdate(updates: Partial<TimeEntry>): TimeEntryUpdate {
  const dbUpdates: TimeEntryUpdate = {}
  
  if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime
  if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime
  if (updates.workArea !== undefined) dbUpdates.work_area = updates.workArea
  if (updates.workType !== undefined) dbUpdates.work_type = updates.workType
  if (updates.pomodoros !== undefined) dbUpdates.pomodoros = updates.pomodoros
  if (updates.comments !== undefined) dbUpdates.comments = updates.comments
  if (updates.date !== undefined) dbUpdates.date = updates.date
  if (updates.duration !== undefined) dbUpdates.duration = updates.duration
  
  return dbUpdates
}

/**
 * Fetch all time entries for the current user
 */
export async function fetchTimeEntries(): Promise<TimeEntry[]> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching time entries:', error)
    throw error
  }
  
  return data.map(rowToTimeEntry)
}

/**
 * Create a new time entry
 */
export async function createTimeEntry(entry: Omit<TimeEntry, 'id'>): Promise<TimeEntry> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  const insertData = timeEntryToInsert(entry, user.id)
  
  const { data, error } = await supabase
    .from('time_entries')
    .insert(insertData)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating time entry:', error)
    throw error
  }
  
  return rowToTimeEntry(data)
}

/**
 * Update an existing time entry
 */
export async function updateTimeEntry(id: string, updates: Partial<TimeEntry>): Promise<TimeEntry> {
  const dbUpdates = timeEntryToUpdate(updates)
  
  const { data, error } = await supabase
    .from('time_entries')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating time entry:', error)
    throw error
  }
  
  return rowToTimeEntry(data)
}

/**
 * Delete a time entry
 */
export async function deleteTimeEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting time entry:', error)
    throw error
  }
}

/**
 * Bulk create multiple time entries
 */
export async function bulkCreateTimeEntries(entries: Omit<TimeEntry, 'id'>[]): Promise<TimeEntry[]> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  const insertData = entries.map((entry) => timeEntryToInsert(entry, user.id))
  
  const { data, error } = await supabase
    .from('time_entries')
    .insert(insertData)
    .select()
  
  if (error) {
    console.error('Error bulk creating time entries:', error)
    throw error
  }
  
  return data.map(rowToTimeEntry)
}

/**
 * Subscribe to real-time changes for time entries
 */
export function subscribeToTimeEntries(
  userId: string,
  callback: (entries: TimeEntry[]) => void
) {
  const channel = supabase
    .channel('time_entries_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'time_entries',
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        // Refetch all entries when any change occurs
        try {
          const entries = await fetchTimeEntries()
          callback(entries)
        } catch (error) {
          console.error('Error refetching time entries:', error)
        }
      }
    )
    .subscribe()
  
  return () => {
    supabase.removeChannel(channel)
  }
}