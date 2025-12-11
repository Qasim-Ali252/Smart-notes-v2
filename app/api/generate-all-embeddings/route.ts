import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' })
    
    const results = {
      notes_processed: 0,
      notes_failed: 0,
      documents_processed: 0,
      documents_failed: 0,
      errors: [] as string[]
    }

    // Get ALL notes to force regenerate embeddings
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)

    if (notesError) throw notesError

    console.log(`📝 Found ${notes?.length || 0} notes without embeddings`)

    // Generate embeddings for notes
    for (const note of notes || []) {
      try {
        const searchableText = `${note.title}\n${note.content}\n${note.tags?.join(' ') || ''}\n${note.summary || ''}\n${note.key_topics?.join(' ') || ''}`
        
        const embeddingResult = await embeddingModel.embedContent(searchableText.substring(0, 8000))
        const embedding = embeddingResult.embedding.values

        const { error: updateError } = await supabase
          .from('notes')
          .update({ embedding })
          .eq('id', note.id)

        if (updateError) {
          results.notes_failed++
          results.errors.push(`Note ${note.title}: ${updateError.message}`)
        } else {
          results.notes_processed++
          console.log(`✅ Generated embedding for note: ${note.title}`)
        }

        // Rate limit: wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error: any) {
        results.notes_failed++
        results.errors.push(`Note ${note.title}: ${error.message}`)
      }
    }

    // Get ALL documents to force regenerate embeddings
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)

    if (docsError) throw docsError

    console.log(`📎 Found ${documents?.length || 0} documents without embeddings`)

    // Generate embeddings for documents
    for (const doc of documents || []) {
      try {
        const searchableText = `${doc.file_name}\n${doc.summary || ''}\n${doc.key_insights?.join('\n') || ''}\n${doc.topic_labels?.join(' ') || ''}\n${doc.extracted_text?.substring(0, 5000) || ''}`
        
        const embeddingResult = await embeddingModel.embedContent(searchableText.substring(0, 8000))
        const embedding = embeddingResult.embedding.values

        const { error: updateError } = await supabase
          .from('documents')
          .update({ embedding })
          .eq('id', doc.id)

        if (updateError) {
          results.documents_failed++
          results.errors.push(`Document ${doc.file_name}: ${updateError.message}`)
        } else {
          results.documents_processed++
          console.log(`✅ Generated embedding for document: ${doc.file_name}`)
        }

        // Rate limit: wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error: any) {
        results.documents_failed++
        results.errors.push(`Document ${doc.file_name}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      message: `Generated ${results.notes_processed} note embeddings and ${results.documents_processed} document embeddings`
    })
  } catch (error: any) {
    console.error('Error generating embeddings:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
