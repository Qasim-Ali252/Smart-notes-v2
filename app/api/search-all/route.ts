import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const searchTerm = query.toLowerCase()

    // Search in notes
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%,summary.ilike.%${query}%`)
      .order('updated_at', { ascending: false })
      .limit(20)

    if (notesError) throw notesError

    // Search in documents
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*, notes!inner(title)')
      .eq('user_id', user.id)
      .or(`file_name.ilike.%${query}%,summary.ilike.%${query}%,extracted_text.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(20)

    if (docsError) throw docsError

    // Filter documents by topic_labels if they exist
    const documentsWithTopicMatch = documents.filter(doc => {
      if (!doc.topic_labels) return true
      return doc.topic_labels.some((label: string) => 
        label.toLowerCase().includes(searchTerm)
      )
    })

    // Combine and score results
    const noteResults = notes.map(note => ({
      type: 'note' as const,
      id: note.id,
      title: note.title,
      content: note.content,
      summary: note.summary,
      tags: note.tags,
      updated_at: note.updated_at,
      score: calculateNoteScore(note, searchTerm)
    }))

    const documentResults = documentsWithTopicMatch.map(doc => ({
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
      score: calculateDocumentScore(doc, searchTerm)
    }))

    // Combine and sort by score
    const allResults = [...noteResults, ...documentResults]
      .sort((a, b) => b.score - a.score)
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
    console.error('Error searching:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function calculateNoteScore(note: any, searchTerm: string): number {
  let score = 0
  const term = searchTerm.toLowerCase()
  
  // Title match (highest weight)
  if (note.title?.toLowerCase().includes(term)) score += 10
  
  // Summary match
  if (note.summary?.toLowerCase().includes(term)) score += 5
  
  // Content match
  if (note.content?.toLowerCase().includes(term)) score += 3
  
  // Tags match
  if (note.tags?.some((tag: string) => tag.toLowerCase().includes(term))) score += 7
  
  // Key topics match
  if (note.key_topics?.some((topic: string) => topic.toLowerCase().includes(term))) score += 6
  
  return score
}

function calculateDocumentScore(doc: any, searchTerm: string): number {
  let score = 0
  const term = searchTerm.toLowerCase()
  
  // File name match (highest weight)
  if (doc.file_name?.toLowerCase().includes(term)) score += 10
  
  // Summary match
  if (doc.summary?.toLowerCase().includes(term)) score += 8
  
  // Topic labels match
  if (doc.topic_labels?.some((label: string) => label.toLowerCase().includes(term))) score += 7
  
  // Key insights match
  if (doc.key_insights?.some((insight: string) => insight.toLowerCase().includes(term))) score += 6
  
  // Extracted text match
  if (doc.extracted_text?.toLowerCase().includes(term)) score += 4
  
  return score
}
