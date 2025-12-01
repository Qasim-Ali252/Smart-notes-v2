import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

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

    // Get AI response using Gemini
    console.log('Calling Gemini API')
    
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    })
    const result = await model.generateContent(fullPrompt)
    const answer = result.response.text()

    if (!answer) {
      console.error('No answer from Gemini')
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

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
    
    return NextResponse.json({ 
      error: error.message || 'An error occurred' 
    }, { status: 500 })
  }
}
