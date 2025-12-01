import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { filePath, noteId } = await request.json()

    if (!filePath || !noteId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(filePath)

    if (downloadError) throw downloadError

    // Convert to text
    const text = await fileData.text()

    // Use Gemini to extract insights
    const prompt = `Extract key information from this document and provide:
1. A concise summary (max 150 words)
2. Key insights (3-5 bullet points)
3. Main topics (3-5 keywords)

Document content:
${text.substring(0, 4000)}

Respond ONLY with valid JSON in this exact format:
{ "summary": "...", "key_insights": ["insight1", "insight2"], "topics": ["topic1", "topic2"] }`

    let result
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        }
      })
      const response = await model.generateContent(prompt)
      const aiText = response.response.text()
      
      const jsonMatch = aiText.match(/\{[\s\S]*\}/)
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    } catch (error) {
      console.log('AI extraction failed, using fallback:', error)
      result = null
    }

    // Fallback: Simple extraction
    if (!result || !result.summary) {
      const words = text.split(/\s+/)
      result = {
        summary: words.slice(0, 30).join(' ') + '...',
        key_insights: ['Document uploaded successfully'],
        topics: ['document']
      }
    }

    // Update document record with extracted data
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        extracted_text: text.substring(0, 10000),
        summary: result.summary,
        key_insights: result.key_insights,
      })
      .eq('file_path', filePath)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    console.error('Error extracting document:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
