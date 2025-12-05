'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Download, Trash2, Sparkles, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { log } from 'console'

interface Document {
  id: string
  file_name: string
  file_path: string
  file_size: number
  summary: string | null
  key_insights: string[] | null
  topic_labels: string[] | null
  topics: string[] | null
  created_at: string
}

interface LinkedDocumentsProps {
  noteId: string
  refreshTrigger?: number
}

export const LinkedDocuments = ({ noteId, refreshTrigger }: LinkedDocumentsProps) => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadDocuments = useCallback(async () => {
    try {
      const { data, error} = await supabase
        .from('documents')
        .select('*')
        .eq('note_id', noteId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }, [noteId, supabase])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments, refreshTrigger])

  // Poll for AI extraction updates on documents that are processing
  useEffect(() => {
    const hasProcessingDocs = documents.some(doc => !doc.summary)
    if (!hasProcessingDocs) return

    const pollInterval = setInterval(() => {
      loadDocuments()
    }, 3000) // Check every 3 seconds

    return () => clearInterval(pollInterval)
  }, [documents, loadDocuments])

  const handleDownload = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.file_path)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.file_name
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading document:', error)
    }
  }

  const handleDelete = async (doc: Document) => {
    if (!confirm('Delete this document?')) return

    try {
      await supabase.storage
        .from('documents')
        .remove([doc.file_path])

      await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id)

      setDocuments(documents.filter(d => d.id !== doc.id))
    } catch (error) {
      console.error('Error deleting document:', error)
    }
  }

  if (loading) return null
  if (documents.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
        <p className="text-xs text-muted-foreground mt-1">Upload files above to see them here</p>
      </div>
    )
  }


  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Uploaded Documents</h3>
        <Badge variant="secondary" className="rounded-full">
          {documents.length}
        </Badge>
      </div>

      <div className="space-y-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="bg-muted/30 rounded-2xl p-6 space-y-4 border border-border/50 hover:border-primary/30 transition-all hover:shadow-lg"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <h4 className="font-semibold text-lg truncate">
                    {doc.file_name}
                  </h4>
                  <div className="flex items-center gap-3 flex-wrap">
                    {doc.summary ? (
                      <Badge variant="default" className="gap-1.5 rounded-full bg-primary/20 text-primary hover:bg-primary/30 border-0 px-3 py-1">
                        <Sparkles className="h-3.5 w-3.5" />
                        AI Analyzed
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="rounded-full px-3 py-1">
                        Processing...
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {doc.file_size ? (doc.file_size / 1024).toFixed(1) + ' KB' : 'Unknown'} • {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl hover:bg-background/80"
                  onClick={() => handleDownload(doc)}
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(doc)}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
             
            {/* AI Summary */}
            {doc.summary && (
              <div className="bg-primary/5 rounded-xl p-5 border border-primary/10">
                <p className="text-sm leading-relaxed text-foreground/90">
                  {doc.summary}
                </p>
              </div>
            )}

            {/* Key Insights */}
            {doc.key_insights && doc.key_insights.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold">Key Insights</p>
                <ul className="space-y-2.5">
                  {doc.key_insights.map((insight, idx) => (
                    <li key={idx} className="text-sm text-foreground/80 flex items-start gap-3">
                      <span className="text-primary mt-0.5 text-lg leading-none">•</span>
                      <span className="flex-1 leading-relaxed">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Topic Labels */}
            {doc.topic_labels && doc.topic_labels.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Topic Labels</p>
                <div className="flex flex-wrap gap-2">
                  {doc.topic_labels.map((label, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline" 
                      className="rounded-full gap-1.5 bg-background/60 hover:bg-background border-border/50 px-3 py-1"
                    >
                      <Tag className="h-3 w-3" />
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Topics */}
            {doc.topics && doc.topics.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Topics</p>
                <div className="flex flex-wrap gap-2">
                  {doc.topics.map((topic, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="rounded-full px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20"
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
