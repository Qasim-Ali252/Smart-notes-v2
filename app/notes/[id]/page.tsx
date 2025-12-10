'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { updateNote, deleteNote, fetchNotes } from '@/lib/store/slices/notesSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft, Save, Trash2, Sparkles, FileText, MessageSquare, 
  Maximize2, Minimize2, CheckCircle2, Clock, Type,
  Lightbulb, ListTodo, BookOpen, RefreshCw, Target, FileEdit
} from 'lucide-react'
import { DocumentUpload } from '@/components/DocumentUpload'
import { LinkedDocuments } from '@/components/LinkedDocuments'
import { NoteChat } from '@/components/NoteChat'
import { enrichNote } from '@/lib/edge-functions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

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
  const [documentsRefresh, setDocumentsRefresh] = useState(0)
  const [activeTab, setActiveTab] = useState('insights')
  const [focusMode, setFocusMode] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [wordCount, setWordCount] = useState(0)

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

  // Update word count
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(w => w.length > 0)
    setWordCount(words.length)
  }, [content])

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
      
      setLastSaved(new Date())
      
      // Trigger AI enrichment in the background
      enrichNote(noteId, content).catch(err => 
        console.error('AI enrichment failed:', err)
      )
      
    } catch (error) {
      console.error('Failed to update note:', error)
    } finally {
      setSaving(false)
    }
  }

  const formatLastSaved = () => {
    if (!lastSaved) return 'Not saved'
    const now = new Date()
    const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000)
    if (diff < 60) return 'Saved just now'
    if (diff < 3600) return `Saved ${Math.floor(diff / 60)}m ago`
    return `Saved ${Math.floor(diff / 3600)}h ago`
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 h-14 glass-strong border-b border-border/50">
        <div className="h-full px-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            
            {/* Auto-save status */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {saving ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span>{formatLastSaved()}</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Word count */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground px-3 py-1.5 rounded-lg bg-muted/50">
              <Type className="h-3 w-3" />
              <span>{wordCount} words</span>
            </div>

            {/* Focus mode toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFocusMode(!focusMode)}
              className="gap-1 sm:gap-2"
            >
              {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              <span className="hidden lg:inline">{focusMode ? 'Exit Focus' : 'Focus'}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="gap-1 sm:gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden lg:inline">Delete</span>
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={saving || !title.trim() || !content.trim()}
              className="gap-1 sm:gap-2"
              size="sm"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Save</span>
            </Button>
          </div>
        </div>
      </nav>



      {/* Main Content Area - Single Scroll Layout */}
      <main className={cn(
        "flex-1 overflow-y-auto",
        focusMode ? "px-2 sm:px-4 py-4 sm:py-6" : "p-2 sm:p-4"
      )}>
        <div className="space-y-4 max-w-[1800px] mx-auto">
          {/* Top Section - 2 Columns on Desktop, Stacked on Mobile */}
          <div className={cn(
            "flex flex-col gap-4",
            focusMode ? "max-w-4xl mx-auto" : "lg:grid lg:grid-cols-2"
          )}>
            {/* Left Panel - Note Editor */}
            <div className="glass-subtle rounded-2xl p-4   sm:p-6 space-y-4">
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
                className="min-h-[400px] sm:min-h-[500px] lg:min-h-[600px] border-none focus-visible:ring-0 bg-transparent px-0 resize-none"
              />
            </div>

            {/* Right Panel - AI Assistant Chat */}
            {!focusMode && (
              <div className="glass-subtle rounded-2xl">
                <NoteChat 
                  noteId={noteId}
                  noteTitle={note.title}
                  noteContent={note.content}
                />
              </div>
            )}
          </div>

          {/* Bottom Panel - AI Insights & Documents */}
          {!focusMode && (
            <div className="glass-subtle rounded-2xl p-4">
              <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2">
                <div className="space-y-4">
                  {note.summary && (
                    <div className="glass rounded-2xl p-4 border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-primary">AI Summary</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{note.summary}</p>
                    </div>
                  )}

                  {note.key_topics && note.key_topics.length > 0 && (
                    <div className="glass rounded-2xl p-4">
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

                  <DocumentUpload 
                    noteId={noteId} 
                    onUploadComplete={() => setDocumentsRefresh(prev => prev + 1)}
                  />
                </div>

                <div className="space-y-4">
                  <LinkedDocuments 
                    noteId={noteId} 
                    refreshTrigger={documentsRefresh}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
