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
}

const initialState: NotesState = {
  notes: [],
  currentNote: null,
  loading: false,
  error: null,
}

export const fetchNotes = createAsyncThunk('notes/fetchNotes', async () => {
  const supabase = createClient()
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return [] // Return empty array if not logged in
  }
  
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', user.id) // Only fetch current user's notes
    .order('updated_at', { ascending: false })
  
  if (error) throw error
  return data as Note[]
})

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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotes.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.loading = false
        state.notes = action.payload
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch notes'
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

export const { setCurrentNote } = notesSlice.actions
export default notesSlice.reducer
