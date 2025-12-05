import { createClient } from '@/lib/supabase/client'

/**
 * Call a Supabase Edge Function with automatic authentication
 */
export async function callEdgeFunction<T = any>(
  functionName: string,
  body?: any
): Promise<{ data: T | null; error: string | null }> {
  try {
    const supabase = createClient()
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return { data: null, error: 'Not authenticated' }
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${functionName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: body ? JSON.stringify(body) : undefined
      }
    )

    if (!response.ok) {
      const error = await response.json()
      return { data: null, error: error.error || 'Request failed' }
    }

    const data = await response.json()
    return { data, error: null }
  } catch (error: any) {
    console.error(`Edge function ${functionName} error:`, error)
    return { data: null, error: error.message || 'Unknown error' }
  }
}

/**
 * Specific helper functions for each Edge Function
 */

export async function extractDocument(filePath: string, noteId: string) {
  return callEdgeFunction('extract-document', { filePath, noteId })
}

export async function enrichNote(noteId: string, content: string) {
  return callEdgeFunction('enrich-note', { noteId, content })
}

export async function generateEmbedding(documentId: string) {
  return callEdgeFunction('generate-embedding', { documentId })
}

export async function searchSemantic(query: string) {
  return callEdgeFunction('search-semantic', { query })
}
