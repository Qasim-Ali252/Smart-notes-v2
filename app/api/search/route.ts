import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all user's notes
    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) throw error

    // Generate embedding for the search query using Gemini
    const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' })
    const queryEmbeddingResult = await embeddingModel.embedContent(query)
    const queryEmbedding = queryEmbeddingResult.embedding.values

    // Calculate similarity scores for each note
    const notesWithScores = await Promise.all(
      notes.map(async (note) => {
        // Create a searchable text from note
        const noteText = `${note.title} ${note.content} ${note.tags?.join(' ') || ''} ${note.summary || ''}`
        
        // Generate embedding for the note using Gemini
        const noteEmbeddingResult = await embeddingModel.embedContent(noteText.substring(0, 8000))
        const noteEmbedding = noteEmbeddingResult.embedding.values

        // Calculate cosine similarity
        const similarity = cosineSimilarity(queryEmbedding, noteEmbedding)

        return {
          ...note,
          relevance_score: similarity
        }
      })
    )

    // Sort by relevance and filter out low scores
    const relevantNotes = notesWithScores
      .filter(note => note.relevance_score > 0.5)
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, 10)

    return NextResponse.json({ 
      results: relevantNotes,
      query,
      count: relevantNotes.length
    })
  } catch (error: any) {
    console.error('Error searching notes:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0)
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0))
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}
