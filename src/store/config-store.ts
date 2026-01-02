import { create } from 'zustand'
import type { WorkArea, WorkType } from '@/lib/supabase/config'
import {
  fetchWorkAreas,
  createWorkArea,
  updateWorkArea,
  deleteWorkArea,
  reorderWorkAreas,
  fetchWorkTypes,
  createWorkType,
  updateWorkType,
  deleteWorkType,
  reorderWorkTypes,
  seedDefaultWorkAreas,
  seedDefaultWorkTypes,
} from '@/lib/supabase/config'

interface ConfigStore {
  workAreas: WorkArea[]
  workTypes: WorkType[]
  isLoading: boolean
  error: string | null
  
  // Work Area Actions
  loadWorkAreas: () => Promise<void>
  addWorkArea: (name: string) => Promise<void>
  editWorkArea: (id: string, name: string) => Promise<void>
  removeWorkArea: (id: string) => Promise<void>
  reorderWorkAreasList: (items: WorkArea[]) => Promise<void>
  
  // Work Type Actions
  loadWorkTypes: () => Promise<void>
  addWorkType: (name: string) => Promise<void>
  editWorkType: (id: string, name: string) => Promise<void>
  removeWorkType: (id: string) => Promise<void>
  reorderWorkTypesList: (items: WorkType[]) => Promise<void>
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
  workAreas: [],
  workTypes: [],
  isLoading: false,
  error: null,
  
  loadWorkAreas: async () => {
    try {
      set({ isLoading: true, error: null })
      const workAreas = await fetchWorkAreas()
      
      // If no work areas exist, seed default ones
      if (workAreas.length === 0) {
        await seedDefaultWorkAreas()
        const seededAreas = await fetchWorkAreas()
        set({ workAreas: seededAreas, isLoading: false })
      } else {
        set({ workAreas, isLoading: false })
      }
    } catch (error) {
      console.error('Failed to load work areas:', error)
      set({ error: 'Failed to load work areas', isLoading: false })
    }
  },
  
  addWorkArea: async (name: string) => {
    try {
      set({ error: null })
      const newArea = await createWorkArea(name)
      set((state) => ({
        workAreas: [...state.workAreas, newArea],
      }))
    } catch (error) {
      console.error('Failed to add work area:', error)
      set({ error: 'Failed to add work area' })
      throw error
    }
  },
  
  editWorkArea: async (id: string, name: string) => {
    try {
      set({ error: null })
      const updated = await updateWorkArea(id, name)
      set((state) => ({
        workAreas: state.workAreas.map((area) =>
          area.id === id ? updated : area
        ),
      }))
    } catch (error) {
      console.error('Failed to update work area:', error)
      set({ error: 'Failed to update work area' })
      throw error
    }
  },
  
  removeWorkArea: async (id: string) => {
    try {
      set({ error: null })
      await deleteWorkArea(id)
      set((state) => ({
        workAreas: state.workAreas.filter((area) => area.id !== id),
      }))
    } catch (error) {
      console.error('Failed to delete work area:', error)
      set({ error: 'Failed to delete work area' })
      throw error
    }
  },
  
  reorderWorkAreasList: async (items: WorkArea[]) => {
    const reorderedItems = items.map((item, index) => ({
      ...item,
      orderIndex: index,
    }))
    
    // Optimistically update UI
    set({ workAreas: reorderedItems })
    
    try {
      await reorderWorkAreas(
        reorderedItems.map((item) => ({
          id: item.id,
          orderIndex: item.orderIndex,
        }))
      )
    } catch (error) {
      console.error('Failed to reorder work areas:', error)
      // Reload from server on error
      get().loadWorkAreas()
    }
  },
  
  loadWorkTypes: async () => {
    try {
      set({ isLoading: true, error: null })
      const workTypes = await fetchWorkTypes()
      
      // If no work types exist, seed default ones
      if (workTypes.length === 0) {
        await seedDefaultWorkTypes()
        const seededTypes = await fetchWorkTypes()
        set({ workTypes: seededTypes, isLoading: false })
      } else {
        set({ workTypes, isLoading: false })
      }
    } catch (error) {
      console.error('Failed to load work types:', error)
      set({ error: 'Failed to load work types', isLoading: false })
    }
  },
  
  addWorkType: async (name: string) => {
    try {
      set({ error: null })
      const newType = await createWorkType(name)
      set((state) => ({
        workTypes: [...state.workTypes, newType],
      }))
    } catch (error) {
      console.error('Failed to add work type:', error)
      set({ error: 'Failed to add work type' })
      throw error
    }
  },
  
  editWorkType: async (id: string, name: string) => {
    try {
      set({ error: null })
      const updated = await updateWorkType(id, name)
      set((state) => ({
        workTypes: state.workTypes.map((type) =>
          type.id === id ? updated : type
        ),
      }))
    } catch (error) {
      console.error('Failed to update work type:', error)
      set({ error: 'Failed to update work type' })
      throw error
    }
  },
  
  removeWorkType: async (id: string) => {
    try {
      set({ error: null })
      await deleteWorkType(id)
      set((state) => ({
        workTypes: state.workTypes.filter((type) => type.id !== id),
      }))
    } catch (error) {
      console.error('Failed to delete work type:', error)
      set({ error: 'Failed to delete work type' })
      throw error
    }
  },
  
  reorderWorkTypesList: async (items: WorkType[]) => {
    const reorderedItems = items.map((item, index) => ({
      ...item,
      orderIndex: index,
    }))
    
    // Optimistically update UI
    set({ workTypes: reorderedItems })
    
    try {
      await reorderWorkTypes(
        reorderedItems.map((item) => ({
          id: item.id,
          orderIndex: item.orderIndex,
        }))
      )
    } catch (error) {
      console.error('Failed to reorder work types:', error)
      // Reload from server on error
      get().loadWorkTypes()
    }
  },
}))