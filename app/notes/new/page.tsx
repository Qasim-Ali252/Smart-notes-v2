'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAppDispatch } from '@/lib/store/hooks'
import { createNote } from '@/lib/store/slices/notesSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DocumentUpload } from '@/components/DocumentUpload'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Save, Paperclip, Folder } from 'lucide-react'
import { enrichNote } from '@/lib/edge-functions'
import { Badge } from '@/components/ui/badge'

function NewNoteContent() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const [noteId, setNoteId] = useState<string | null>(null)
  const [aiEnrichment, setAiEnrichment] = useState<{
    summary?: string
    tags?: string[]
    key_topics?: string[]
  } | null>(null)
  const [enrichmentLoading, setEnrichmentLoading] = useState(false)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const searchParams = useSearchParams()
  const notebook = searchParams.get('notebook')
  const initializedRef = useRef(false)

  // Auto-add notebook tag when creating from a notebook (only once on mount)
  useEffect(() => {
    if (notebook && !initializedRef.current) {
      setTags(notebook)
      initializedRef.current = true
    }
  }, [notebook])

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return

    setSaving(true)
    try {
      const noteTags = tags.split(',').map((t) => t.trim()).filter(Boolean)
      console.log('Saving note with tags:', noteTags)
      console.log('Notebook from URL:', notebook)
      
      const result = await dispatch(
        createNote({
          title,
          content,
          tags: noteTags,
        })
      ).unwrap()
      
      setNoteId(result.id)
      
      // Trigger AI enrichment in the background
      console.log('✨ AI is analyzing your note...')
      console.log('Note ID:', result.id)
      console.log('Content length:', content.length)
      
      setEnrichmentLoading(true)
      
      enrichNote(result.id, content)
        .then(({ data, error }) => {
          if (error) {
            console.error('❌ AI enrichment failed:', error)
            console.error('Full error details:', error)
          } else {
            console.log('✅ AI enrichment complete:', data)
            // Update UI with AI-generated data
            setAiEnrichment({
              summary: data.summary,
              tags: data.tags,
              key_topics: data.key_topics
            })
          }
        })
        .catch(err => {
          console.error('❌ AI enrichment failed with exception:', err)
          console.error('Error details:', err.message, err.stack)
        })
        .finally(() => {
          setEnrichmentLoading(false)
        })
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
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(notebook ? `/dashboard?tag=${notebook}` : '/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            {notebook && (
              <Badge variant="secondary" className="gap-1.5">
                <Folder className="h-3 w-3" />
                {notebook.charAt(0).toUpperCase() + notebook.slice(1)}
              </Badge>
            )}
          </div>
          
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
          <>
            {/* AI Enrichment Results */}
            <div className="glass rounded-2xl p-6 space-y-4 mt-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  {enrichmentLoading ? (
                    <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="text-primary text-sm">✨</span>
                  )}
                </div>
                <h3 className="text-lg font-semibold">AI Analysis</h3>
                {enrichmentLoading && <span className="text-sm text-muted-foreground">Analyzing...</span>}
              </div>

              {aiEnrichment ? (
                <div className="space-y-4">
                  {aiEnrichment.summary && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Summary</h4>
                      <p className="text-sm bg-muted/50 rounded-lg p-3">{aiEnrichment.summary}</p>
                    </div>
                  )}
                  
                  {aiEnrichment.tags && aiEnrichment.tags.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Generated Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {aiEnrichment.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {aiEnrichment.key_topics && aiEnrichment.key_topics.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Key Topics</h4>
                      <div className="flex flex-wrap gap-2">
                        {aiEnrichment.key_topics.map((topic, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : !enrichmentLoading ? (
                <p className="text-sm text-muted-foreground">AI analysis will appear here after saving your note.</p>
              ) : null}
            </div>

            {/* Document Upload Section */}
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
          </>
        )}
      </main>
    </div>
  )
}

export default function NewNotePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <NewNoteContent />
    </Suspense>
  )
}
