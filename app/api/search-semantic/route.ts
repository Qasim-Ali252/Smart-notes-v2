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

    // Generate embedding for the search query
    const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' })
    const queryEmbeddingResult = await embeddingModel.embedContent(query)
    const queryEmbedding = queryEmbeddingResult.embedding.values

    // Search notes using vector similarity
    const { data: notes, error: notesError } = await supabase.rpc('match_notes', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: 10,
      p_user_id: user.id
    })

    if (notesError) {
      console.error('Notes search error:', notesError)
      // Fallback to fetching all notes and calculating similarity client-side
      const { data: allNotes } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .not('embedding', 'is', null)
      
      const notesWithScores = (allNotes || []).map(note => ({
        ...note,
        type: 'note' as const,
        relevance_score: cosineSimilarity(queryEmbedding, note.embedding)
      }))
      .filter(note => note.relevance_score > 0.5)
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, 10)
      
      var noteResults = notesWithScores
    } else {
      var noteResults = (notes || []).map((note: any) => ({
        ...note,
        type: 'note' as const,
        relevance_score: note.similarity
      }))
    }

    // Search documents using vector similarity
    const { data: documents, error: docsError } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: 10,
      p_user_id: user.id
    })

    if (docsError) {
      console.error('Documents search error:', docsError)
      // Fallback to fetching all documents and calculating similarity client-side
      const { data: allDocs } = await supabase
        .from('documents')
        .select('*, notes!inner(title)')
        .eq('user_id', user.id)
        .not('embedding', 'is', null)
      
      const docsWithScores = (allDocs || []).map(doc => ({
        type: 'document' as const,
        id: doc.id,
        title: doc.file_name,
        content: doc.summary || doc.extracted_text?.substring(0, 200) || '',
        summary: doc.summary,
        key_insights: doc.key_insights,
        topic_labels: doc.topic_labels,
        note_id: doc.note_id,
        note_title: doc.notes?.title,
        file_path: doc.file_path,
        file_size: doc.file_size,
        created_at: doc.created_at,
        relevance_score: cosineSimilarity(queryEmbedding, doc.embedding)
      }))
      .filter(doc => doc.relevance_score > 0.5)
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, 10)
      
      var documentResults = docsWithScores
    } else {
      var documentResults = (documents || []).map((doc: any) => ({
        type: 'document' as const,
        id: doc.id,
        title: doc.file_name,
        content: doc.summary || doc.extracted_text?.substring(0, 200) || '',
        summary: doc.summary,
        key_insights: doc.key_insights,
        topic_labels: doc.topic_labels,
        note_id: doc.note_id,
        note_title: doc.note_title,
        file_path: doc.file_path,
        file_size: doc.file_size,
        created_at: doc.created_at,
        relevance_score: doc.similarity
      }))
    }

    // Combine and sort by relevance
    const allResults = [...noteResults, ...documentResults]
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, 20)

    return NextResponse.json({ 
      results: allResults,
      query,
      counts: {
        notes: noteResults.length,
        documents: documentResults.length,
        total: allResults.length
      }
    })
  } catch (error: any) {
    console.error('Error in semantic search:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0)
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0))
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}
