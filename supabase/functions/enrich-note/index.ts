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

    const { noteId, content } = await req.json()

    if (!content) {
      return new Response(JSON.stringify({ error: 'Content is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

    const prompt = `Analyze this note and return ONLY a JSON object with summary, tags, and key_topics.

Note: ${content.substring(0, 2000)}

Return ONLY valid JSON in this exact format (no other text):
{"summary": "brief summary", "tags": ["tag1", "tag2", "tag3"], "key_topics": ["topic1", "topic2", "topic3"]}`

    let result

    try {
      console.log('🤖 Starting AI enrichment...')
      console.log('Content length:', content.length)
      console.log('API Key available:', !!GEMINI_API_KEY)
      
      if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured')
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 800,
              responseMimeType: "application/json",
            },
          }),
        }
      )

      console.log('API Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', errorText)
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('Raw API response:', JSON.stringify(data, null, 2))
      
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      console.log('Extracted text:', text)

      // Try multiple JSON extraction methods
      let jsonMatch = text.match(/\{[\s\S]*\}/)
      
      if (!jsonMatch) {
        // Try to find JSON between code blocks
        jsonMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/)
        if (jsonMatch) jsonMatch[0] = jsonMatch[1]
      }
      
      if (!jsonMatch) {
        // Try to find any JSON-like structure
        jsonMatch = text.match(/\{[^}]*"summary"[^}]*\}/s)
      }

      if (jsonMatch) {
        console.log('Found JSON:', jsonMatch[0])
        try {
          result = JSON.parse(jsonMatch[0])
          console.log('Parsed result:', result)
        } catch (parseError) {
          console.error('JSON parse error:', parseError)
          throw new Error('Invalid JSON format')
        }
      } else {
        console.error('No JSON found in AI response:', text)
        throw new Error('No JSON found in response')
      }
    } catch (error) {
      console.error('❌ AI enrichment failed:', error)

      const words = content.split(/\s+/).slice(0, 50).join(' ')
      result = {
        summary: words.length > 100 ? words.substring(0, 100) + '...' : words,
        tags: ['note'],
        key_topics: ['general'],
      }
      console.log('Using fallback result:', result)
    }

    if (noteId) {
      console.log('📝 Updating note in database...')
      console.log('Note ID:', noteId)
      console.log('User ID:', user.id)
      
      // Get existing note to preserve user-added tags (like notebook tags)
      const { data: existingNote, error: fetchError } = await supabaseClient
        .from('notes')
        .select('tags')
        .eq('id', noteId)
        .eq('user_id', user.id)
        .single()

      if (fetchError) {
        console.error('Error fetching existing note:', fetchError)
      } else {
        console.log('Existing note tags:', existingNote?.tags)
      }

      // Merge existing tags with AI-generated tags (remove duplicates)
      const existingTags = existingNote?.tags || []
      const aiTags = result.tags || []
      const mergedTags = [...new Set([...existingTags, ...aiTags])]
      
      console.log('Merged tags:', mergedTags)
      console.log('Summary to save:', result.summary?.substring(0, 100) + '...')
      console.log('Key topics to save:', result.key_topics)

      const { data: updateData, error: updateError } = await supabaseClient
        .from('notes')
        .update({
          summary: result.summary,
          tags: mergedTags,
          key_topics: result.key_topics,
        })
        .eq('id', noteId)
        .eq('user_id', user.id)
        .select()

      if (updateError) {
        console.error('❌ Database update failed:', updateError)
        throw updateError
      } else {
        console.log('✅ Database updated successfully:', updateData)
      }
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error enriching note:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
