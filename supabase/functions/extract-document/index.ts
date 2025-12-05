// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { filePath, noteId } = await req.json()

    if (!filePath || !noteId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify user owns this note
    const { data: note, error: noteError } = await supabaseClient
      .from('notes')
      .select('id')
      .eq('id', noteId)
      .eq('user_id', user.id)
      .single()

    if (noteError || !note) {
      return new Response(JSON.stringify({ error: 'Note not found or access denied' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('documents')
      .download(filePath)

    if (downloadError) throw downloadError

    // Get file extension
    const fileExt = filePath.split('.').pop()?.toLowerCase()
    const fileName = filePath.split('/').pop() || 'document'

    let text = ''

    // Supported text file types
    const textFileTypes = ['txt', 'md', 'json', 'csv', 'html', 'xml', 'js', 'ts', 'jsx', 'tsx', 'css']

    if (textFileTypes.includes(fileExt || '')) {
      text = await fileData.text()
      console.log(`📝 Read text file: ${text.length} characters`)
    } else if (fileExt === 'pdf') {
      // PDF extraction - basic approach for text-based PDFs
      try {
        console.log('📄 Attempting PDF text extraction...')
        
        const arrayBuffer = await fileData.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        const decoder = new TextDecoder('latin1')
        const rawText = decoder.decode(uint8Array)
        
        // Extract text from PDF streams
        const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g
        const textObjects: string[] = []
        let match
        
        while ((match = streamRegex.exec(rawText)) !== null) {
          const streamContent = match[1]
          // Look for text showing operators: Tj, TJ, '
          const textMatches = streamContent.match(/\(([^)]*)\)/g)
          if (textMatches) {
            textMatches.forEach(tm => {
              const cleanText = tm
                .slice(1, -1)
                .replace(/\\n/g, '\n')
                .replace(/\\r/g, '')
                .replace(/\\t/g, ' ')
                .replace(/\\/g, '')
              if (cleanText.trim().length > 0) {
                textObjects.push(cleanText)
              }
            })
          }
        }
        
        text = textObjects.join(' ').replace(/\s+/g, ' ').trim()
        
        // Filter out PDF metadata/garbage
        if (text.length > 0) {
          const words = text.split(' ')
          const cleanWords = words.filter(word => {
            // Keep words that are mostly alphanumeric
            const alphanumeric = word.replace(/[^a-zA-Z0-9]/g, '')
            return alphanumeric.length >= word.length * 0.5 && word.length > 1
          })
          text = cleanWords.join(' ')
        }
        
        if (text && text.length > 100) {
          console.log(`✅ Extracted ${text.length} characters from PDF`)
        } else {
          throw new Error('Could not extract meaningful text from PDF')
        }
      } catch (error) {
        console.error('⚠️ PDF extraction failed:', error.message)
        
        // Fallback: Store PDF without extraction
        const result = {
          summary: `PDF file "${fileName}" uploaded. Text extraction failed - this may be a scanned/image-based PDF. The file is stored and available for download.`,
          key_insights: [
            'PDF stored successfully',
            'Text extraction not available for this PDF',
            'Download to view full content',
          ],
          topics: ['pdf', 'document'],
          topic_labels: ['pdf', 'stored'],
        }

        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        await supabaseAdmin
          .from('documents')
          .update({
            summary: result.summary || 'File stored',
            key_insights: result.key_insights || [],
            topic_labels: result.topic_labels || [],
            topics: result.topics || [],
          })
          .eq('file_path', filePath)
          .eq('user_id', user.id)

        return new Response(JSON.stringify({ success: true, ...result, pdf_extraction_failed: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } else {
      // Unsupported file type
      const result = {
        summary: `${fileExt?.toUpperCase()} file "${fileName}" uploaded. This file type is not supported for text extraction. The file is stored and available for download.`,
        key_insights: [
          `File type: ${fileExt?.toUpperCase()}`,
          'Stored securely',
          'Available for download',
        ],
        topics: [fileExt || 'document'],
        topic_labels: [fileExt || 'document', 'stored'],
      }

      await supabaseClient
        .from('documents')
        .update({
          summary: result.summary || 'File stored',
          key_insights: result.key_insights || [],
          topic_labels: result.topic_labels || [],
          topics: result.topics || [],
        })
        .eq('file_path', filePath)

      return new Response(JSON.stringify({ success: true, ...result, unsupported_type: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if we have text to analyze
    if (!text || text.trim().length < 10) {
      throw new Error('No text could be extracted from the file')
    }

    console.log(`📊 Text extracted: ${text.length} characters`)

    // Limit text for API
    const maxLength = 15000
    const textToAnalyze = text.length > maxLength ? text.substring(0, maxLength) + '...[truncated]' : text

    // Call Gemini API directly using REST
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

    const prompt = `Extract key information from this document and provide:
1. A concise summary (max 150 words)
2. Key insights (3-5 bullet points)
3. Main topics (3-5 keywords)
4. Topic labels for categorization (3-5 labels like "research", "technical", "business", etc.)

Document content:
${textToAnalyze}

Respond ONLY with valid JSON in this exact format:
{ "summary": "...", "key_insights": ["insight1", "insight2"], "topics": ["topic1", "topic2"], "topic_labels": ["label1", "label2"] }`

    let result = null

    // Try AI extraction
    if (GEMINI_API_KEY) {
      try {
        console.log('🤖 Calling Gemini AI...')

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: prompt }],
                },
              ],
            }),
          }
        )

        const aiData = await response.json()
        const aiText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || ''

        console.log('✅ Got response from Gemini')

        const jsonMatch = aiText.match(/\{[\s\S]*\}/)
        result = jsonMatch ? JSON.parse(jsonMatch[0]) : null

        if (result) {
          console.log('✅ AI extraction successful')
        }
      } catch (error) {
        console.error('⚠️ AI extraction failed:', error.message)
      }
    }

    // Fallback: Smart extraction
    if (!result || !result.summary) {
      const words = text.split(/\s+/).filter((w) => w.length > 0)
      const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)

      const summary = sentences.slice(0, 3).join('. ').substring(0, 200) + (text.length > 200 ? '...' : '')

      const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were'])
      const meaningfulWords = words
        .filter((w) => w.length > 4 && !commonWords.has(w.toLowerCase()))
        .map((w) => w.toLowerCase())

      const uniqueTopics = [...new Set(meaningfulWords)].slice(0, 5)

      result = {
        summary: summary || 'Document uploaded successfully',
        key_insights: ['Document contains ' + words.length + ' words', 'Extracted from uploaded file', 'Ready for reference'],
        topics: uniqueTopics.length > 0 ? uniqueTopics : ['document'],
        topic_labels: uniqueTopics.length > 0 ? uniqueTopics.slice(0, 3) : ['general'],
      }

      console.log('✅ Using fallback extraction')
    }

    // Update document record using service role to bypass RLS
    console.log('📝 Updating document with extracted data')

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Ensure no null values
    const updateData = {
      extracted_text: text.substring(0, 10000) || '',
      summary: result.summary || 'No summary available',
      key_insights: result.key_insights || [],
      topic_labels: result.topic_labels || result.topics || [],
      topics: result.topics || [],
    }

    console.log('📝 Update data:', updateData)

    const { data: updatedDoc, error: updateError } = await supabaseAdmin
      .from('documents')
      .update(updateData)
      .eq('file_path', filePath)
      .eq('user_id', user.id)
      .select()

    if (updateError) {
      console.error('❌ Database update error:', updateError)
      throw updateError
    }

    console.log('✅ Document updated in database:', updatedDoc)

    // Update note with document topics using admin client
    const { data: noteData } = await supabaseAdmin.from('notes').select('key_topics').eq('id', noteId).single()

    if (noteData) {
      const existingTopics = noteData.key_topics || []
      const newTopics = result.topic_labels || result.topics || []
      const mergedTopics = [...new Set([...existingTopics, ...newTopics])]

      await supabaseAdmin.from('notes').update({ key_topics: mergedTopics }).eq('id', noteId).eq('user_id', user.id)
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error extracting document:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
