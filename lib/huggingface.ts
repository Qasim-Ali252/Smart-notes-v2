// Hugging Face Inference API Helper
// Using the new API endpoints

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY
const API_BASE = 'https://api-inference.huggingface.co'

interface HFResponse {
  generated_text?: string
  [key: string]: any
}

export async function generateText(prompt: string, maxTokens: number = 500): Promise<string> {
  // Use a simpler, more reliable model
  const response = await fetch(
    `${API_BASE}/models/facebook/bart-large-cnn`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: maxTokens,
          min_length: 50,
        },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Hugging Face API error: ${error}`)
  }

  const data: HFResponse[] = await response.json()
  return data[0]?.summary_text || data[0]?.generated_text || ''
}

export async function generateEmbedding(text: string): Promise<number[]> {
  // Use feature extraction endpoint
  const response = await fetch(
    `${API_BASE}/models/sentence-transformers/all-MiniLM-L6-v2`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text.substring(0, 512), // Limit input length
        options: {
          wait_for_model: true,
        },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Hugging Face API error: ${error}`)
  }

  const data: any = await response.json()
  
  // Handle different response formats
  if (Array.isArray(data)) {
    if (Array.isArray(data[0])) {
      return data[0] as number[]
    }
    return data as number[]
  }
  
  throw new Error('Unexpected embedding response format')
}

export async function chatCompletion(
  systemPrompt: string,
  userMessage: string,
  chatHistory: Array<{ role: string; content: string }> = []
): Promise<string> {
  // For Q&A, use a question-answering model
  const context = `${systemPrompt}\n\nQuestion: ${userMessage}\nAnswer:`
  
  const response = await fetch(
    `${API_BASE}/models/deepset/roberta-base-squad2`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          question: userMessage,
          context: systemPrompt,
        },
        options: {
          wait_for_model: true,
        },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Hugging Face API error: ${error}`)
  }

  const data: any = await response.json()
  return data.answer || 'I cannot answer that based on the note content.'
}

export async function generateJSON(prompt: string): Promise<any> {
  // For structured output, use text generation and parse
  const text = await generateText(prompt, 800)
  
  // Try to extract JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0])
    } catch {
      // Fallback: create structured response
      return {
        summary: text.substring(0, 200),
        tags: ['general', 'note'],
        key_topics: ['content'],
      }
    }
  }
  
  // Fallback response
  return {
    summary: text.substring(0, 200) || 'Summary not available',
    tags: ['general', 'note'],
    key_topics: ['content'],
  }
}
