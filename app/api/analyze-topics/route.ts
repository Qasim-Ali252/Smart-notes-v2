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

    if (!notes || notes.length === 0) {
      return NextResponse.json({ clusters: [] })
    }

    // Create a summary of all notes for clustering
    const noteSummaries = notes.map(note => ({
      id: note.id,
      text: `${note.title}. ${note.summary || note.content.substring(0, 200)}. Topics: ${note.key_topics?.join(', ') || 'none'}`
    }))

    const allNotesText = noteSummaries.map(n => n.text).join('\n\n')

    // Ask Gemini to identify topic clusters
    const prompt = `You are analyzing a collection of notes to identify main topic clusters.

Analyze the notes and group them into 3-7 meaningful topic clusters.

For each cluster, provide:
1. A clear, concise name (2-3 words)
2. A brief description
3. The note IDs that belong to this cluster
4. A color theme (choose from: lavender, mint, peach, sky, rose)

Notes to analyze:
${allNotesText}

Note IDs: ${noteSummaries.map(n => n.id).join(', ')}

Respond ONLY with valid JSON in this exact format:
{
  "clusters": [
    {
      "name": "Topic Name",
      "description": "Brief description",
      "noteIds": ["id1", "id2"],
      "color": "lavender",
      "count": 2
    }
  ]
}`

    let result
    try {
      const GEMINI_API_KEY = process.env.GEMINI_API_KEY
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
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
              maxOutputTokens: 1200,
            }
          })
        }
      )

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`)
      }

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { clusters: [] }
    } catch (error) {
      console.log('AI clustering failed, using simple fallback:', error)
      // Simple fallback: group by existing tags
      const tagGroups = new Map<string, any[]>()
      notes.forEach(note => {
        const tag = note.tags?.[0] || 'general'
        if (!tagGroups.has(tag)) {
          tagGroups.set(tag, [])
        }
        tagGroups.get(tag)!.push(note)
      })
      
      const colors = ['lavender', 'mint', 'peach', 'sky', 'rose']
      result = {
        clusters: Array.from(tagGroups.entries()).slice(0, 7).map(([tag, notes], i) => ({
          name: tag.charAt(0).toUpperCase() + tag.slice(1),
          description: `Notes tagged with ${tag}`,
          noteIds: notes.map(n => n.id),
          color: colors[i % colors.length],
          count: notes.length
        }))
      }
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
