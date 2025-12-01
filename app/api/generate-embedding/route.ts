import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { noteId } = await request.json()

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get the note
    const { data: note, error: fetchError } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .single()

    if (fetchError) throw fetchError

    // Create searchable text
    const searchableText = `${note.title}\n${note.content}\n${note.tags?.join(' ') || ''}\n${note.summary || ''}`

    // Generate embedding using Gemini
    const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' })
    const embeddingResult = await embeddingModel.embedContent(searchableText.substring(0, 8000))
    const embedding = embeddingResult.embedding.values

    // Store embedding in database
    const { error: updateError } = await supabase
      .from('notes')
      .update({ embedding })
      .eq('id', noteId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, noteId })
  } catch (error: any) {
    console.error('Error generating embedding:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
