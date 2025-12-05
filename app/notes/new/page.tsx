'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch } from '@/lib/store/hooks'
import { createNote } from '@/lib/store/slices/notesSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DocumentUpload } from '@/components/DocumentUpload'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Save, Paperclip } from 'lucide-react'

export default function NewNotePage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const [noteId, setNoteId] = useState<string | null>(null)
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
      
      setNoteId(result.id)
      
      // Show AI enrichment is happening
      console.log('✨ AI is analyzing your note...')
      
      // Trigger AI enrichment (this happens automatically in the background)
      fetch('/api/enrich-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          noteId: result.id, 
          content: content 
        })
      })
      .then(res => res.json())
      .then(data => {
        console.log('✅ AI enrichment complete:', {
          summary: data.summary,
          tags: data.tags,
          topics: data.key_topics
        })
      })
      .catch(err => console.error('❌ AI enrichment failed:', err))
    } catch (error) {
      console.error('Failed to create note:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleFinish = () => {
    router.push('/dashboard')
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
            className="min-h-[400px] border-none focus-visible:ring-0 bg-transparent px-0 resize-none"
          />
        </div>

        {noteId && (
          <div className="glass rounded-2xl p-6 space-y-4 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Paperclip className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Attach Supporting Documents</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Upload PDFs, articles, screenshots, or research papers. AI will extract key insights and link them to your note.
            </p>
            <DocumentUpload noteId={noteId} />
            <Separator className="my-4" />
            <div className="flex justify-end">
              <Button onClick={handleFinish} className="gap-2">
                Finish & View Dashboard
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
