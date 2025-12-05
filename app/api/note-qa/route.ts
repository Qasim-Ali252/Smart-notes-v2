import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Simple in-memory rate limiter
const requestTimestamps: number[] = []
const MAX_REQUESTS_PER_MINUTE = 10 // Conservative limit (Gemini allows 15)
const RETRY_DELAY = 2000 // 2 seconds between retries

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function callGeminiWithRetry(prompt: string, retries = 3): Promise<string> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Rate limiting check
      const now = Date.now()
      const oneMinuteAgo = now - 60000
      
      // Remove old timestamps
      while (requestTimestamps.length > 0 && requestTimestamps[0] < oneMinuteAgo) {
        requestTimestamps.shift()
      }
      
      // If we're at the limit, wait
      if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
        const oldestRequest = requestTimestamps[0]
        const waitTime = 60000 - (now - oldestRequest) + 1000 // Wait until oldest request is 1 minute old + 1 second buffer
        console.log(`Rate limit reached, waiting ${waitTime}ms`)
        await sleep(waitTime)
      }
      
      // Add current request timestamp
      requestTimestamps.push(Date.now())
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000,
            }
          })
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        
        // If rate limited, wait and retry
        if (response.status === 429) {
          console.log(`Rate limited (attempt ${attempt + 1}/${retries}), waiting ${RETRY_DELAY}ms`)
          await sleep(RETRY_DELAY * (attempt + 1)) // Exponential backoff
          continue
        }
        
        throw new Error(`Gemini API error: ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text
      
      if (!answer) {
        throw new Error('No answer from Gemini')
      }
      
      return answer
      
    } catch (error: any) {
      console.error(`Attempt ${attempt + 1} failed:`, error.message)
      
      if (attempt === retries - 1) {
        throw error
      }
      
      await sleep(RETRY_DELAY * (attempt + 1))
    }
  }
  
  throw new Error('Max retries exceeded')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { noteId, noteContent, question, chatHistory } = body

    console.log('Note Q&A request:', { noteId, hasContent: !!noteContent, question })

    if (!noteId || !noteContent || !question) {
      console.error('Missing required fields')
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Verify user has access to this note
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('User not authenticated')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: note, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .eq('user_id', user.id)
      .single()

    if (error || !note) {
      console.error('Note not found:', error)
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    // Build context from note
    const noteContext = `
Note Title: ${note.title}

Note Content:
${noteContent}

${note.summary ? `AI Summary: ${note.summary}` : ''}
${note.key_topics?.length ? `Key Topics: ${note.key_topics.join(', ')}` : ''}
${note.tags?.length ? `Tags: ${note.tags.join(', ')}` : ''}
    `.trim()

    // Build prompt with chat history
    let conversationHistory = ''
    if (chatHistory && Array.isArray(chatHistory)) {
      conversationHistory = chatHistory.slice(-5).map((msg: any) => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n')
    }

    const fullPrompt = `You are an AI assistant helping the user understand and work with their note.

Here is the note content:
${noteContext}

Your role:
- Answer questions about the note content
- Provide summaries and explanations
- Suggest improvements or action items
- Help rewrite or clarify content
- Generate ideas based on the note

Important:
- Base your answers ONLY on the note content provided
- Be concise and helpful
- If asked to create something (action items, summary, etc.), format it clearly
- If the note doesn't contain information to answer the question, say so politely

${conversationHistory ? `Previous conversation:\n${conversationHistory}\n` : ''}

User question: ${question}

Your answer:`

    // Get AI response using Gemini REST API with rate limiting
    console.log('Calling Gemini API with rate limiting')
    
    const answer = await callGeminiWithRetry(fullPrompt)
    
    console.log('AI response received, length:', answer.length)

    return NextResponse.json({ 
      answer,
      noteId,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error in note Q&A:', {
      message: error.message,
      stack: error.stack
    })
    
    // Provide user-friendly error messages
    let errorMessage = 'An error occurred'
    let statusCode = 500
    
    if (error.message.includes('Rate limit') || error.message.includes('429')) {
      errorMessage = 'Too many requests. Please wait a moment and try again.'
      statusCode = 429
    } else if (error.message.includes('API key')) {
      errorMessage = 'API configuration error. Please check your settings.'
      statusCode = 500
    } else if (error.message.includes('Max retries')) {
      errorMessage = 'Service temporarily unavailable. Please try again in a minute.'
      statusCode = 503
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: error.message
    }, { status: statusCode })
  }
}
