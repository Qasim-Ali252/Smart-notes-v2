import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all user's notes
    const { data: notes, error } = await supabase
      .from('notes')
      .select('id, title, content, tags, key_topics, summary')
      .eq('user_id', user.id)

    if (error) throw error

    console.log(`Found ${notes?.length || 0} notes for user ${user.id}`)

    if (!notes || notes.length === 0) {
      console.log('No notes found, returning empty clusters')
      return NextResponse.json({ clusters: [] })
    }

    // Log note details for debugging
    console.log('Notes summary:', notes.map(n => ({
      id: n.id,
      title: n.title,
      contentLength: n.content?.length || 0,
      hasTopics: !!n.key_topics?.length,
      hasSummary: !!n.summary
    })))

    // Create a summary of all notes for clustering
    const noteSummaries = notes.map(note => ({
      id: note.id,
      text: `${note.title}. ${note.summary || note.content.substring(0, 200)}. Topics: ${note.key_topics?.join(', ') || 'none'}`
    }))

    const allNotesText = noteSummaries.map(n => n.text).join('\n\n')

    // Ask Gemini to identify topic clusters
    const prompt = `Analyze these notes and create 3-6 topic clusters. Group similar notes together.

Notes (ID: Title - Summary):
${noteSummaries.map(n => `${n.id}: ${n.text.substring(0, 150)}...`).join('\n')}

Return ONLY valid JSON:
{
  "clusters": [
    {
      "name": "Short Name",
      "description": "Brief description (max 50 chars)",
      "noteIds": ["id1", "id2"],
      "color": "lavender",
      "count": 2
    }
  ]
}

Colors: lavender, mint, peach, sky, rose. Keep descriptions under 50 characters.`

    let result
    try {
      const GEMINI_API_KEY = process.env.GEMINI_API_KEY
      console.log('Using Gemini API key:', GEMINI_API_KEY ? 'Present' : 'Missing')
      
      console.log('Sending request to Gemini API...')
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
              maxOutputTokens: 2000,
            }
          })
        }
      )

      console.log('Gemini API response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Gemini API error response:', errorText)
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Gemini API response:', JSON.stringify(data, null, 2))
      
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      console.log('Generated text:', text)
      
      // Check if response was truncated
      const finishReason = data.candidates?.[0]?.finishReason
      if (finishReason === 'MAX_TOKENS') {
        console.warn('Response was truncated due to token limit')
      }
      
      // Extract JSON more robustly
      let jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        // Try to find partial JSON and complete it
        const partialMatch = text.match(/\{[\s\S]*/)
        if (partialMatch) {
          console.log('Attempting to fix incomplete JSON...')
          // This is a fallback - we'll use the simple clustering instead
          throw new Error('Incomplete JSON response from AI')
        }
      }
      
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { clusters: [] }
      console.log('Parsed result:', result)
    } catch (error) {
      console.error('AI clustering failed, using simple fallback:', error)
      // Smart fallback: group by topics and content similarity
      const topicGroups = new Map<string, any[]>()
      
      notes.forEach(note => {
        // Use key_topics if available, otherwise extract from title
        const topics = note.key_topics || []
        const mainTopic = topics[0] || 
          (note.title.toLowerCase().includes('lecture') ? 'lectures' :
           note.title.toLowerCase().includes('habit') ? 'habits' :
           note.title.toLowerCase().includes('tech') ? 'technology' :
           note.title.toLowerCase().includes('code') ? 'coding' : 'general')
        
        if (!topicGroups.has(mainTopic)) {
          topicGroups.set(mainTopic, [])
        }
        topicGroups.get(mainTopic)!.push(note)
      })
      
      const colors = ['lavender', 'mint', 'peach', 'sky', 'rose']
      result = {
        clusters: Array.from(topicGroups.entries())
          .filter(([_, notes]) => notes.length >= 2) // Only clusters with 2+ notes
          .slice(0, 6)
          .map(([topic, clusterNotes], i) => ({
            name: topic.charAt(0).toUpperCase() + topic.slice(1),
            description: `${clusterNotes.length} notes about ${topic}`,
            noteIds: clusterNotes.map(n => n.id),
            color: colors[i % colors.length],
            count: clusterNotes.length
          }))
      }
      console.log('Using fallback clustering:', result)
    }

    // Enrich clusters with actual note data
    const enrichedClusters = result.clusters.map((cluster: any) => {
      const clusterNotes = notes.filter(note => 
        cluster.noteIds?.includes(note.id)
      )
      
      return {
        ...cluster,
        count: clusterNotes.length,
        notes: clusterNotes.map(n => ({
          id: n.id,
          title: n.title,
          summary: n.summary
        }))
      }
    })

    return NextResponse.json({ 
      clusters: enrichedClusters,
      totalNotes: notes.length,
      analyzedAt: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error analyzing topics:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
