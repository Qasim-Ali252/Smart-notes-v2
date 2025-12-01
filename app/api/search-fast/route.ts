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

    // Generate embedding for the search query using Gemini
    let queryEmbedding
    try {
      const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' })
      const embeddingResult = await embeddingModel.embedContent(query)
      queryEmbedding = embeddingResult.embedding.values
    } catch (embError) {
      console.log('Embedding failed, using text search fallback')
      // Fallback to simple text search
      const { data: notes, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%,tags.cs.{${query}}`)
        .limit(10)
      
      if (error) throw error
      
      return NextResponse.json({ 
        results: notes,
        query,
        count: notes.length,
        fallback: true
      })
    }

    // Fetch all notes with embeddings
    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .not('embedding', 'is', null)

    if (error) throw error

    // Calculate similarities
    const notesWithScores = notes.map(note => {
      const similarity = cosineSimilarity(queryEmbedding, note.embedding)
      return { ...note, similarity }
    })

    // Filter and sort
    const relevantNotes = notesWithScores
      .filter(note => note.similarity > 0.5)
      .sort((a, b) => b.similarity - a.similarity)
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
