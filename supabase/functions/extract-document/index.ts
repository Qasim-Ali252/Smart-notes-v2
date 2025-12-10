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
      try {
        console.log('📄 Using Gemini to extract PDF content directly...')
        
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
        if (!GEMINI_API_KEY) {
          throw new Error('GEMINI_API_KEY not configured')
        }
        
        // Convert PDF to base64
        const arrayBuffer = await fileData.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        const base64Pdf = btoa(String.fromCharCode(...uint8Array))
        
        // Use Gemini's native PDF support (same model as enrich-note function)
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  {
                    inline_data: {
                      mime_type: 'application/pdf',
                      data: base64Pdf
                    }
                  },
                  {
                    text: 'Extract all text content from this PDF document. Return the complete text exactly as it appears in the document, maintaining the original structure and formatting as much as possible.'
                  }
                ]
              }],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 8000,
              }
            })
          }
        )
        
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
        }
        
        const data = await response.json()
        text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        
        if (!text || text.trim().length < 50) {
          throw new Error('Gemini returned no usable text from PDF')
        }
        
        // Clean up the extracted text
        text = text
          .replace(/\r\n/g, '\n')
          .replace(/\n{3,}/g, '\n\n')
          .replace(/[ \t]{2,}/g, ' ')
          .trim()
        
        console.log(`✅ Gemini extracted ${text.length} characters from PDF`)
        
      } catch (error: any) {
        console.error('⚠️ PDF extraction failed:', error?.message ?? error)
        
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

    const prompt = `You are an expert document analyst. Analyze the following document and extract meaningful insights.

Document content:
${textToAnalyze}

Provide a comprehensive analysis with:

1. **Summary**: Write a clear, informative summary (100-150 words) that captures the main message, purpose, and key points of the document. Focus on what the document is about and why it matters.

2. **Key Insights**: Identify 3-5 actionable or important insights from the content. These should be:
   - Specific findings, conclusions, or important facts from the document
   - NOT generic statements like "document contains X words"
   - Valuable takeaways that someone would want to remember
   - Written as complete, meaningful sentences

3. **Main Topics**: Extract 3-5 specific keywords or phrases that represent the core subjects discussed in the document.

4. **Topic Labels**: Assign 3-5 categorical labels for organizing this document (e.g., "research", "technical", "business", "healthcare", "education", "finance", etc.)

Respond ONLY with valid JSON in this exact format:
{
  "summary": "detailed summary here",
  "key_insights": ["meaningful insight 1", "meaningful insight 2", "meaningful insight 3"],
  "topics": ["topic1", "topic2", "topic3"],
  "topic_labels": ["label1", "label2", "label3"]
}`

    let result = null

    // Try AI extraction
    if (GEMINI_API_KEY) {
      try {
        console.log('🤖 Calling Gemini AI...')

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
        }

        const aiData = await response.json()
        const aiText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || ''

        console.log('✅ Got response from Gemini:', aiText.substring(0, 200))

        const jsonMatch = aiText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          console.error('❌ No JSON found in AI response:', aiText)
          throw new Error('AI did not return valid JSON')
        }
        
        result = JSON.parse(jsonMatch[0])

        if (result && result.summary && result.key_insights) {
          console.log('✅ AI extraction successful with', result.key_insights.length, 'insights')
        } else {
          console.error('❌ AI returned incomplete data:', result)
          throw new Error('AI returned incomplete data')
        }
      } catch (error: any) {
        console.error('⚠️ AI extraction failed:', error?.message ?? error)
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
