'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { updateNote, deleteNote, fetchNotes } from '@/lib/store/slices/notesSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, Trash2, Sparkles } from 'lucide-react'
import { DocumentUpload } from '@/components/DocumentUpload'
import { NoteChat } from '@/components/NoteChat'

export default function NoteDetailPage() {
  const params = useParams()
  const noteId = params.id as string
  const router = useRouter()
  const dispatch = useAppDispatch()
  const notes = useAppSelector((state) => state.notes.notes)
  const note = notes.find((n) => n.id === noteId)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!notes.length) {
      dispatch(fetchNotes())
    }
  }, [dispatch, notes.length])

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
      setTags(note.tags?.join(', ') || '')
    }
  }, [note])

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return

    setSaving(true)
    try {
      await dispatch(
        updateNote({
          id: noteId,
          updates: {
            title,
            content,
            tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          },
        })
      ).unwrap()
      
      // Trigger AI enrichment in the background
      fetch('/api/enrich-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          noteId: noteId, 
          content: content 
        })
      }).catch(err => console.error('AI enrichment failed:', err))
      
    } catch (error) {
      console.error('Failed to update note:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        await dispatch(deleteNote(noteId)).unwrap()
        router.push('/dashboard')
      } catch (error) {
        console.error('Failed to delete note:', error)
      }
    }
  }

  if (!note) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
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
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !title.trim() || !content.trim()}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass rounded-2xl p-6 space-y-4 mb-4">
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

        {note.summary && (
          <div className="glass rounded-2xl p-4 mb-4 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-primary">AI Summary</h3>
            </div>
            <p className="text-sm text-muted-foreground">{note.summary}</p>
          </div>
        )}

        {note.key_topics && note.key_topics.length > 0 && (
          <div className="glass rounded-2xl p-4 mb-4">
            <h3 className="font-semibold mb-3">Key Topics</h3>
            <div className="flex flex-wrap gap-2">
              {note.key_topics.map((topic, idx) => (
                <span 
                  key={idx} 
                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm border border-primary/20"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        <DocumentUpload noteId={noteId} />

        <NoteChat 
          noteId={noteId}
          noteTitle={note.title}
          noteContent={note.content}
        />
      </main>
    </div>
  )
}
