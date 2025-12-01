'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch } from '@/lib/store/hooks'
import { createNote } from '@/lib/store/slices/notesSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save } from 'lucide-react'

export default function NewNotePage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const dispatch = useAppDispatch()

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return

    setSaving(true)
    try {
      const result = await dispatch(
        createNote({
          title,
          content,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        })
      ).unwrap()
      
      // Trigger AI enrichment in the background
      fetch('/api/enrich-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          noteId: result.id, 
          content: content 
        })
      }).catch(err => console.error('AI enrichment failed:', err))
      
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to create note:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 h-16 glass-strong border-b border-border/50">
        <div className="h-full px-4 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={saving || !title.trim() || !content.trim()}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Note'}
          </Button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass rounded-2xl p-6 space-y-4">
          <Input
            type="text"
            placeholder="Note Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-bold border-none focus-visible:ring-0 bg-transparent px-0"
          />
          
          <Input
            type="text"
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="text-sm text-muted-foreground border-none focus-visible:ring-0 bg-transparent px-0"
          />
          
          <Textarea
            placeholder="Start writing..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[500px] border-none focus-visible:ring-0 bg-transparent px-0 resize-none"
          />
        </div>
      </main>
    </div>
  )
}
