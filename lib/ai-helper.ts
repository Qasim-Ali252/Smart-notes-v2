// AI Helper - Works without external APIs
// Simple text processing for MVP

export async function generateText(prompt: string, maxTokens: number = 500): Promise<string> {
  // Simple rule-based text generation for MVP
  return "This is a summary of your note. AI enrichment is currently in development mode."
}

export async function generateEmbedding(text: string): Promise<number[]> {
  // Simple hash-based embedding for MVP
  // This creates a consistent vector for the same text
  const embedding = new Array(384).fill(0)
  
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i)
    embedding[i % 384] += charCode / 1000
  }
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
  return embedding.map(val => val / magnitude)
}

export async function chatCompletion(
  systemPrompt: string,
  userMessage: string,
  chatHistory: Array<{ role: string; content: string }> = []
): Promise<string> {
  // Simple keyword-based responses
  const lowerMessage = userMessage.toLowerCase()
  
  if (lowerMessage.includes('summarize') || lowerMessage.includes('summary')) {
    return "Here's a summary: This note contains important information that you've saved. The main points are highlighted in the content above."
  }
  
  if (lowerMessage.includes('action') || lowerMessage.includes('todo')) {
    return "Action items:\n1. Review the note content\n2. Identify key tasks\n3. Set priorities\n4. Take action"
  }
  
  if (lowerMessage.includes('improve')) {
    return "Suggestions to improve this note:\n- Add more specific details\n- Include examples\n- Organize into sections\n- Add relevant tags"
  }
  
  return "I can help you with:\n- Summarizing the note\n- Creating action items\n- Suggesting improvements\n- Explaining concepts\n\nWhat would you like to know?"
}

export async function generateJSON(prompt: string): Promise<any> {
  // Extract key information from the prompt
  const text = prompt.toLowerCase()
  
  // Simple keyword extraction for tags
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']
  const words = text.split(/\s+/)
    .filter(w => w.length > 3 && !commonWords.includes(w))
    .slice(0, 5)
  
  return {
    summary: "This note has been saved to your knowledge base. AI enrichment is in development mode.",
    tags: words.slice(0, 3).map(w => w.replace(/[^a-z0-9]/g, '')),
    key_topics: words.slice(0, 3),
  }
}
