export interface Database {
  public: {
    Tables: {
      habits: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          frequency: 'daily' | 'weekly' | 'custom'
          color: string
          icon: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          frequency: 'daily' | 'weekly' | 'custom'
          color?: string
          icon?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          frequency?: 'daily' | 'weekly' | 'custom'
          color?: string
          icon?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      habit_entries: {
        Row: {
          id: string
          habit_id: string
          user_id: string
          completed: boolean
          date: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          habit_id: string
          user_id: string
          completed?: boolean
          date: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          habit_id?: string
          user_id?: string
          completed?: boolean
          date?: string
          notes?: string | null
          created_at?: string
        }
      }
      time_entries: {
        Row: {
          id: string
          user_id: string
          start_time: string
          end_time: string
          work_area: string
          work_type: string
          pomodoros: number
          comments: string
          date: string
          duration: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          start_time: string
          end_time: string
          work_area: string
          work_type: string
          pomodoros?: number
          comments?: string
          date: string
          duration: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          start_time?: string
          end_time?: string
          work_area?: string
          work_type?: string
          pomodoros?: number
          comments?: string
          date?: string
          duration?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}