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
    
    // Get ALL documents for this user
    const { data: allDocs, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)

    if (fetchError) {
      console.error('Fetch error:', fetchError)
      throw fetchError
    }

    console.log(`📎 Found ${allDocs?.length || 0} total documents`)

    const results = {
      total_documents: allDocs?.length || 0,
      documents_with_embeddings: 0,
      documents_without_embeddings: 0,
      processed: 0,
      failed: 0,
      errors: [] as string[],
      details: [] as any[]
    }

    // Check each document
    for (const doc of allDocs || []) {
      const hasEmbedding = doc.embedding !== null
      
      if (hasEmbedding) {
        results.documents_with_embeddings++
        results.details.push({
          file_name: doc.file_name,
          status: 'already_has_embedding',
          embedding_dimensions: doc.embedding?.length || 0
        })
        continue
      }

      results.documents_without_embeddings++

      try {
        // Create searchable text
        const searchableText = `${doc.file_name}\n${doc.summary || ''}\n${doc.key_insights?.join('\n') || ''}\n${doc.topic_labels?.join(' ') || ''}\n${doc.extracted_text?.substring(0, 5000) || ''}`
        
        console.log(`Processing: ${doc.file_name}`)
        console.log(`Text length: ${searchableText.length}`)

        if (searchableText.trim().length < 10) {
          results.failed++
          results.errors.push(`${doc.file_name}: Not enough text content to embed`)
          results.details.push({
            file_name: doc.file_name,
            status: 'failed',
            reason: 'no_text_content'
          })
          continue
        }

        // Generate embedding
        const embeddingResult = await embeddingModel.embedContent(searchableText.substring(0, 8000))
        const embedding = embeddingResult.embedding.values

        console.log(`Generated embedding: ${embedding.length} dimensions`)

        // Update with explicit column specification
        const { data: updateData, error: updateError } = await supabase
          .from('documents')
          .update({ embedding: embedding })
          .eq('id', doc.id)
          .eq('user_id', user.id)
          .select()

        if (updateError) {
          console.error(`Update error for ${doc.file_name}:`, updateError)
          results.failed++
          results.errors.push(`${doc.file_name}: ${updateError.message}`)
          results.details.push({
            file_name: doc.file_name,
            status: 'failed',
            reason: updateError.message
          })
        } else {
          console.log(`✅ Updated: ${doc.file_name}`)
          results.processed++
          results.details.push({
            file_name: doc.file_name,
            status: 'success',
            embedding_dimensions: embedding.length,
            update_result: updateData
          })
        }

        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error: any) {
        console.error(`Error processing ${doc.file_name}:`, error)
        results.failed++
        results.errors.push(`${doc.file_name}: ${error.message}`)
        results.details.push({
          file_name: doc.file_name,
          status: 'failed',
          reason: error.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      message: `Processed ${results.processed} documents, ${results.failed} failed`
    })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ 
      error: error.message,
      details: error
    }, { status: 500 })
  }
}
