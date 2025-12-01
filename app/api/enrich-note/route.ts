import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { noteId, content } = await request.json()

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Use Gemini for note enrichment
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      }
    })
    
    const prompt = `Analyze this note and provide a JSON response with summary, tags, and key_topics.

Note: ${content}

Respond ONLY with valid JSON in this exact format:
{"summary": "brief summary here", "tags": ["tag1", "tag2", "tag3"], "key_topics": ["topic1", "topic2", "topic3"]}`

    let result
    try {
      const response = await model.generateContent(prompt)
      const text = response.response.text()
      
      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    } catch (error) {
      console.log('AI enrichment failed, using fallback:', error)
      result = null
    }
    
    // Fallback: Simple extraction
    if (!result || !result.summary) {
      const words = content.split(/\s+/)
      const summary = words.slice(0, 20).join(' ') + (words.length > 20 ? '...' : '')
      
      const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'])
      const tags = words
        .filter((w: string) => w.length > 4 && !commonWords.has(w.toLowerCase()))
        .slice(0, 5)
        .map((w: string) => w.toLowerCase())
      
      result = {
        summary,
        tags: tags.length > 0 ? tags : ['note'],
        key_topics: tags.slice(0, 3).length > 0 ? tags.slice(0, 3) : ['general']
      }
    }

    // Generate embedding using Gemini (with error handling)
    let embedding = null
    try {
      const searchableText = `${content}\n${result.tags?.join(' ') || ''}\n${result.summary || ''}`
      const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' })
      const embeddingResult = await embeddingModel.embedContent(searchableText.substring(0, 8000))
      embedding = embeddingResult.embedding.values
    } catch (embError) {
      console.log('Embedding generation failed, skipping:', embError)
      // Continue without embedding
    }

    const supabase = await createClient()
    
    const updateData: any = {
      summary: result.summary,
      tags: result.tags,
      key_topics: result.key_topics,
    }
    
    if (embedding) {
      updateData.embedding = embedding
    }
    
    const { data, error } = await supabase
      .from('notes')
      .update(updateData)
      .eq('id', noteId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error enriching note:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
