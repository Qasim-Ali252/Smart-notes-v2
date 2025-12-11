import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { query } = await req.json()

    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('🔍 Semantic search query:', query)

    // Generate embedding for search query
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    console.log('🤖 Generating embedding for query...')

    const embeddingResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: {
            parts: [{ text: query }],
          },
        }),
      }
    )

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text()
      console.error('Gemini API error:', errorText)
      throw new Error(`Gemini API error: ${embeddingResponse.status} - ${errorText}`)
    }

    const embeddingData = await embeddingResponse.json()
    console.log('Raw embedding response:', JSON.stringify(embeddingData, null, 2))
    
    const rawEmbedding = embeddingData.embedding?.values
    
    if (!rawEmbedding || !Array.isArray(rawEmbedding)) {
      console.error('Invalid embedding response:', embeddingData)
      throw new Error('Failed to generate query embedding - invalid response format')
    }

    // Ensure all values are proper numbers (fix issue #3)
    const queryEmbedding = rawEmbedding.map(Number)
    
    if (queryEmbedding.some(isNaN)) {
      throw new Error('Invalid embedding values - contains NaN')
    }

    console.log('✅ Generated query embedding:', queryEmbedding.length, 'dimensions')
    console.log('Query embedding sample (first 5 values):', queryEmbedding.slice(0, 5))
    console.log('Query embedding has negative values:', queryEmbedding.some(v => v < 0))

    // Search notes using vector similarity
    let noteResults = []
    let docResults = []

    console.log('🔍 Searching notes with embedding...')
    
    // First, let's check what embeddings exist in the database
    const { data: embeddingCheck } = await supabaseClient
      .from('notes')
      .select('id, title, embedding')
      .eq('user_id', user.id)
      .not('embedding', 'is', null)
      .limit(5)
    
    console.log('Sample embeddings in database:')
    embeddingCheck?.forEach(note => {
      const embStr = note.embedding?.toString() || 'null'
      console.log(`- ${note.title}: ${embStr.substring(0, 50)}... (starts with ${embStr.charAt(1)})`)
    })
    
    try {
      const { data: notes, error: notesError } = await supabaseClient.rpc('match_notes', {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: 10,
        p_user_id: user.id,
      })

      if (notesError) {
        console.error('Notes RPC error:', notesError)
      } else if (notes) {
        noteResults = notes.map((note: any) => ({
          ...note,
          type: 'note' as const,
          relevance_score: note.similarity
        }))
        console.log(`✅ Found ${noteResults.length} matching notes`)
        if (noteResults.length > 0) {
          console.log('Top result similarity:', noteResults[0].relevance_score)
        }
      }
    } catch (error) {
      console.error('Note search failed:', error)
    }

    console.log('🔍 Searching documents with embedding...')
    try {
      const { data: docs, error: docsError } = await supabaseClient.rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: 10,
        p_user_id: user.id,
      })

      if (docsError) {
        console.error('Documents RPC error:', docsError)
      } else if (docs) {
        docResults = docs.map((doc: any) => ({
          ...doc,
          type: 'document' as const,
          relevance_score: doc.similarity,
          title: doc.file_name,
          content: doc.summary || doc.extracted_text?.substring(0, 200) || ''
        }))
        console.log(`✅ Found ${docResults.length} matching documents`)
      }
    } catch (error) {
      console.error('Document search failed:', error)
    }

    // Fallback to text search if vector search fails
    if (noteResults.length === 0 && docResults.length === 0) {
      console.log('⚠️ Vector search returned no results, trying text search fallback')

      try {
        const { data: textNotes } = await supabaseClient
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
          .limit(10)

        if (textNotes) {
          noteResults = textNotes.map((note: any) => ({
            ...note,
            type: 'note' as const,
            relevance_score: 0.3 // Lower score for text matches
          }))
          console.log(`📝 Text search found ${noteResults.length} notes`)
        }
      } catch (error) {
        console.error('Text search for notes failed:', error)
      }

      try {
        const { data: textDocs } = await supabaseClient
          .from('documents')
          .select('*')
          .eq('user_id', user.id)
          .or(`file_name.ilike.%${query}%,summary.ilike.%${query}%`)
          .limit(10)

        if (textDocs) {
          docResults = textDocs.map((doc: any) => ({
            ...doc,
            type: 'document' as const,
            relevance_score: 0.3, // Lower score for text matches
            title: doc.file_name,
            content: doc.summary || doc.extracted_text?.substring(0, 200) || ''
          }))
          console.log(`📎 Text search found ${docResults.length} documents`)
        }
      } catch (error) {
        console.error('Text search for documents failed:', error)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notes: noteResults,
        documents: docResults,
        total: noteResults.length + docResults.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in semantic search:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
