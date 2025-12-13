import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { createClient } from '@/lib/supabase/client'

export interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  summary?: string
  key_topics?: string[]
  created_at: string
  updated_at: string
  user_id: string
}

interface NotesState {
  notes: Note[]
  currentNote: Note | null
  loading: boolean
  error: string | null
  pagination: {
    currentPage: number
    pageSize: number
    totalCount: number
    hasMore: boolean
  }
}

const initialState: NotesState = {
  notes: [],
  currentNote: null,
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    pageSize: 12, // Load 12 notes per page
    totalCount: 0,
    hasMore: true
  }
}

export const fetchNotes = createAsyncThunk<
  { notes: Note[]; totalCount: number; page: number; pageSize: number },
  { page?: number; pageSize?: number; reset?: boolean } | void
>(
  'notes/fetchNotes', 
  async (params, { rejectWithValue }) => {
    try {
      const supabase = createClient()
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { notes: [], totalCount: 0, page: 1, pageSize: 12 }
      }
      
      const page = params?.page || 1
      const pageSize = params?.pageSize || 12
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      
      // Get total count first
      const { count } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      
      // Fetch paginated notes
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .range(from, to)
      
      if (error) {
        console.error('Supabase error in fetchNotes:', error.message || error)
        return rejectWithValue(error.message || 'Failed to fetch notes')
      }
      
      return {
        notes: data || [],
        totalCount: count || 0,
        page,
        pageSize
      }
    } catch (error: any) {
      console.error('Error in fetchNotes:', error.message || error)
      return rejectWithValue(error.message || 'Unknown error occurred')
    }
  }
)

export const loadMoreNotes = createAsyncThunk(
  'notes/loadMoreNotes',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { notes: NotesState }
      const { pagination, notes } = state.notes
      
      // Check if we already have all notes
      if (!pagination.hasMore || notes.length >= pagination.totalCount) {
        return rejectWithValue('No more notes to load')
      }
      
      const supabase = createClient()
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return rejectWithValue('User not authenticated')
      }
      
      const nextPage = pagination.currentPage + 1
      const from = (nextPage - 1) * pagination.pageSize
      const to = from + pagination.pageSize - 1
      
      // Fetch next page of notes
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .range(from, to)
      
      if (error) {
        console.error('Supabase error in loadMoreNotes:', error.message || error)
        return rejectWithValue(error.message || 'Failed to fetch notes')
      }
      
      return {
        notes: data || [],
        totalCount: pagination.totalCount,
        page: nextPage,
        pageSize: pagination.pageSize
      }
    } catch (error: any) {
      console.error('Error in loadMoreNotes:', error.message || error)
      return rejectWithValue(error.message || 'Unknown error occurred')
    }
  }
)

export const createNote = createAsyncThunk(
  'notes/createNote',
  async (note: { title: string; content: string; tags: string[] }) => {
    const supabase = createClient()
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('You must be logged in to create a note')
    }
    
    // Add user_id to the note
    const noteWithUser = {
      ...note,
      user_id: user.id
    }
    
    const { data, error } = await supabase
      .from('notes')
      .insert([noteWithUser])
      .select()
      .single()
    
    if (error) {
      console.error('Create note error:', error)
      throw new Error(error.message || 'Failed to create note')
    }
    
    return data as Note
  }
)

export const updateNote = createAsyncThunk(
  'notes/updateNote',
  async ({ id, updates }: { id: string; updates: Partial<Note> }) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Note
  }
)

export const deleteNote = createAsyncThunk('notes/deleteNote', async (id: string) => {
  const supabase = createClient()
  const { error } = await supabase.from('notes').delete().eq('id', id)
  
  if (error) throw error
  return id
})

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    setCurrentNote: (state, action: PayloadAction<Note | null>) => {
      state.currentNote = action.payload
    },
    resetPagination: (state) => {
      state.notes = []
      state.loading = false
      state.error = null
      state.pagination = {
        currentPage: 1,
        pageSize: 12,
        totalCount: 0,
        hasMore: true
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotes.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.loading = false
        state.error = null
        
        // Safety check for payload
        if (!action.payload) {
          console.error('fetchNotes payload is undefined')
          state.notes = []
          state.pagination = {
            currentPage: 1,
            pageSize: 12,
            totalCount: 0,
            hasMore: false
          }
          return
        }
        
        const { notes, totalCount, page, pageSize } = action.payload
        
        if (page === 1) {
          // Reset notes for first page
          state.notes = notes || []
        } else {
          // Append notes for subsequent pages
          state.notes = [...state.notes, ...(notes || [])]
        }
        
        state.pagination = {
          currentPage: page || 1,
          pageSize: pageSize || 12,
          totalCount: totalCount || 0,
          hasMore: (state.notes.length + (notes?.length || 0)) < (totalCount || 0)
        }
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) || action.error.message || 'Failed to fetch notes'
        // Ensure we have a valid state even on error
        state.notes = []
        state.pagination = {
          currentPage: 1,
          pageSize: 12,
          totalCount: 0,
          hasMore: false
        }
      })
      .addCase(loadMoreNotes.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loadMoreNotes.fulfilled, (state, action) => {
        state.loading = false
        state.error = null
        
        // Safety check for payload
        if (!action.payload) {
          console.error('loadMoreNotes payload is undefined')
          return
        }
        
        const { notes, totalCount, page, pageSize } = action.payload
        
        // Append new notes
        const newNotes = notes || []
        state.notes = [...state.notes, ...newNotes]
        
        state.pagination = {
          currentPage: page || state.pagination.currentPage,
          pageSize: pageSize || state.pagination.pageSize,
          totalCount: totalCount || state.pagination.totalCount,
          hasMore: state.notes.length < (totalCount || state.pagination.totalCount)
        }
      })
      .addCase(loadMoreNotes.rejected, (state, action) => {
        state.loading = false
        
        // Check if it's just "no more notes" vs actual error
        const errorMessage = action.payload as string || action.error.message || 'Failed to load more notes'
        
        if (errorMessage === 'No more notes to load') {
          // Not really an error, just no more data
          state.pagination.hasMore = false
        } else {
          // Actual error occurred
          state.error = errorMessage
          state.pagination.hasMore = false
        }
      })
      .addCase(createNote.fulfilled, (state, action) => {
        state.notes.unshift(action.payload)
      })
      .addCase(updateNote.fulfilled, (state, action) => {
        const index = state.notes.findIndex((n) => n.id === action.payload.id)
        if (index !== -1) {
          state.notes[index] = action.payload
        }
        if (state.currentNote?.id === action.payload.id) {
          state.currentNote = action.payload
        }
      })
      .addCase(deleteNote.fulfilled, (state, action) => {
        state.notes = state.notes.filter((n) => n.id !== action.payload)
        if (state.currentNote?.id === action.payload) {
          state.currentNote = null
        }
      })
  },
})

export const { setCurrentNote, resetPagination } = notesSlice.actions
export default notesSlice.reducer
