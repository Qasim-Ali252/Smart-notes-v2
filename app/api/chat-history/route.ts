import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const noteId = searchParams.get('noteId')

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Verify user authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch chat history for the note
    const { data: chatHistory, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('note_id', noteId)
      .eq('user_id', user.id)
      .order('timestamp', { ascending: true })

    if (error) {
      console.error('Error fetching chat history:', error)
      return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 })
    }

    return NextResponse.json({ chatHistory: chatHistory || [] })
  } catch (error: any) {
    console.error('Error in chat history GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { noteId, messages } = body

    if (!noteId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Note ID and messages array are required' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Verify user authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to this note
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('id')
      .eq('id', noteId)
      .eq('user_id', user.id)
      .single()

    if (noteError || !note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    // Prepare messages for insertion
    const chatEntries = messages.map((message: any) => ({
      note_id: noteId,
      user_id: user.id,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp || new Date().toISOString()
    }))

    // Insert chat history
    const { data, error } = await supabase
      .from('chat_history')
      .insert(chatEntries)
      .select()

    if (error) {
      console.error('Error saving chat history:', error)
      return NextResponse.json({ error: 'Failed to save chat history' }, { status: 500 })
    }

    return NextResponse.json({ success: true, saved: data?.length || 0 })
  } catch (error: any) {
    console.error('Error in chat history POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const noteId = searchParams.get('noteId')

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Verify user authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete chat history for the note
    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('note_id', noteId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting chat history:', error)
      return NextResponse.json({ error: 'Failed to delete chat history' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in chat history DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}