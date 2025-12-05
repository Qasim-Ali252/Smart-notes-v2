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

    const embeddingResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: {
            parts: [{ text: query }],
          },
        }),
      }
    )

    const embeddingData = await embeddingResponse.json()
    const queryEmbedding = embeddingData.embedding?.values

    if (!queryEmbedding) {
      throw new Error('Failed to generate query embedding')
    }

    console.log('✅ Generated query embedding:', queryEmbedding.length, 'dimensions')

    // Search notes using vector similarity
    let noteResults = []
    let docResults = []

    try {
      const { data: notes, error: notesError } = await supabaseClient.rpc('search_notes_semantic', {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: 10,
        user_id_param: user.id,
      })

      if (!notesError && notes) {
        noteResults = notes
      }
    } catch (error) {
      console.error('Note search failed:', error)
    }

    try {
      const { data: docs, error: docsError } = await supabaseClient.rpc('search_documents_semantic', {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: 10,
        user_id_param: user.id,
      })

      if (!docsError && docs) {
        docResults = docs
      }
    } catch (error) {
      console.error('Document search failed:', error)
    }

    // Fallback to text search if vector search fails
    if (noteResults.length === 0 && docResults.length === 0) {
      console.log('⚠️ Vector search returned no results, trying text search')

      const { data: textNotes } = await supabaseClient
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .limit(10)

      const { data: textDocs } = await supabaseClient
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .or(`file_name.ilike.%${query}%,summary.ilike.%${query}%`)
        .limit(10)

      noteResults = textNotes || []
      docResults = textDocs || []
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
