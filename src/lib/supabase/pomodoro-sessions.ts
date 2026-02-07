import { supabase } from './client'
import type { PomodoroSession } from '@/types/time-tracking'
import type { Database } from '@/types/database.types'

type PomodoroSessionRow = Database['public']['Tables']['pomodoro_sessions']['Row']
type PomodoroSessionInsert = Database['public']['Tables']['pomodoro_sessions']['Insert']

// Convert database row to app PomodoroSession type
function rowToPomodoroSession(row: PomodoroSessionRow): PomodoroSession {
  return {
    id: row.id,
    timeEntryId: row.time_entry_id,
    userId: row.user_id,
    startTime: row.start_time,
    endTime: row.end_time,
    duration: row.duration,
    comments: row.comments,
    isFullPomodoro: row.is_full_pomodoro,
    createdAt: row.created_at,
  }
}

// Convert app PomodoroSession to database insert type
function pomodoroSessionToInsert(
  session: Omit<PomodoroSession, 'id' | 'createdAt'>,
  userId: string
): PomodoroSessionInsert {
  return {
    time_entry_id: session.timeEntryId,
    user_id: userId,
    start_time: session.startTime,
    end_time: session.endTime,
    duration: session.duration,
    comments: session.comments,
    is_full_pomodoro: session.isFullPomodoro,
  }
}

/**
 * Fetch all pomodoro sessions for a specific time entry
 */
export async function fetchPomodoroSessionsForEntry(
  timeEntryId: string
): Promise<PomodoroSession[]> {
  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .select('*')
    .eq('time_entry_id', timeEntryId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching pomodoro sessions:', error)
    throw error
  }

  return data.map(rowToPomodoroSession)
}

/**
 * Fetch pomodoro sessions for multiple time entries (batch)
 */
export async function fetchPomodoroSessionsForEntries(
  timeEntryIds: string[]
): Promise<Map<string, PomodoroSession[]>> {
  if (timeEntryIds.length === 0) {
    return new Map()
  }

  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .select('*')
    .in('time_entry_id', timeEntryIds)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching pomodoro sessions:', error)
    throw error
  }

  // Group sessions by time entry id
  const sessionsMap = new Map<string, PomodoroSession[]>()
  for (const row of data) {
    const session = rowToPomodoroSession(row)
    if (session.timeEntryId) {
      const existing = sessionsMap.get(session.timeEntryId) || []
      existing.push(session)
      sessionsMap.set(session.timeEntryId, existing)
    }
  }

  return sessionsMap
}

/**
 * Create a new pomodoro session
 */
export async function createPomodoroSession(
  session: Omit<PomodoroSession, 'id' | 'createdAt' | 'userId'>
): Promise<PomodoroSession> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const insertData = pomodoroSessionToInsert(
    { ...session, userId: user.id },
    user.id
  )

  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('Error creating pomodoro session:', error)
    throw error
  }

  return rowToPomodoroSession(data)
}

/**
 * Delete a pomodoro session
 */
export async function deletePomodoroSession(id: string): Promise<void> {
  const { error } = await supabase
    .from('pomodoro_sessions')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting pomodoro session:', error)
    throw error
  }
}

/**
 * Fetch all independent pomodoro sessions (not linked to any time entry)
 */
export async function fetchIndependentPomodoroSessions(): Promise<PomodoroSession[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .select('*')
    .eq('user_id', user.id)
    .is('time_entry_id', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching independent pomodoro sessions:', error)
    throw error
  }

  return data.map(rowToPomodoroSession)
}
