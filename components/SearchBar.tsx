'use client'
import { useState } from 'react'
import { Search, Loader2, X, File, FileText, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { NoteCard } from '@/components/NoteCard'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface SearchResult {
  type: 'note' | 'document'
  id: string
  title: string
  content: string
  tags?: string[]
  summary?: string
  updated_at?: string
  created_at?: string
  relevance_score?: number
  score?: number
  // Document-specific fields
  key_insights?: string[]
  topic_labels?: string[]
  note_id?: string
  note_title?: string
  file_path?: string
  file_size?: number
}

interface SearchCounts {
  notes: number
  documents: number
  total: number
}

export const SearchBar = () => {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [counts, setCounts] = useState<SearchCounts>({ notes: 0, documents: 0, total: 0 })
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      // Use semantic search with vector embeddings
      const response = await fetch('/api/search-semantic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      })

      if (!response.ok) throw new Error('Search failed')

      const data = await response.json()
      setResults(data.results || [])
      setCounts(data.counts || { notes: 0, documents: 0, total: 0 })
      setOpen(true)
    } catch (error) {
      console.error('Search error:', error)
      alert('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <>
      <div className="relative flex-1 max-w-2xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Ask anything... 'Show me notes about marketing' or 'Find my budget documents'"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-10 pr-10 bg-background/60 border-border/50 focus-visible:ring-primary"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {query && !loading && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Search Results for "{query}"
            </DialogTitle>
          </DialogHeader>
          
          {results.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No results found. Try a different search term.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Found {counts.total} result{counts.total !== 1 ? 's' : ''}</span>
                {counts.notes > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <FileText className="h-3 w-3" />
                    {counts.notes} Note{counts.notes !== 1 ? 's' : ''}
                  </Badge>
                )}
                {counts.documents > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <File className="h-3 w-3" />
                    {counts.documents} Document{counts.documents !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              
              <div className="space-y-3">
                {results.map((result) => (
                  result.type === 'note' ? (
                    <NoteCard
                      key={result.id}
                      id={result.id}
                      title={result.title}
                      snippet={result.content}
                      tags={result.tags || []}
                      aiSummary={result.summary}
                      lastEdited={formatDate(result.updated_at || '')}
                      readTime="3 min"
                    />
                  ) : (
                    <div
                      key={result.id}
                      onClick={() => {
                        if (result.note_id) {
                          router.push(`/notes/${result.note_id}`)
                          setOpen(false)
                        }
                      }}
                      className="glass rounded-lg p-4 space-y-2 cursor-pointer hover:border-primary/50 transition-colors border border-border/50"
                    >
                      <div className="flex items-start gap-3">
                        <File className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium truncate">{result.title}</p>
                            <Badge variant="outline" className="gap-1 text-xs shrink-0">
                              <Sparkles className="h-3 w-3" />
                              Document
                            </Badge>
                          </div>
                          {result.note_title && (
                            <p className="text-xs text-muted-foreground mb-2">
                              In note: {result.note_title}
                            </p>
                          )}
                          {result.summary && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {result.summary}
                            </p>
                          )}
                          {result.topic_labels && result.topic_labels.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {result.topic_labels.slice(0, 3).map((label, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {label}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {result.file_size ? (result.file_size / 1024).toFixed(1) + ' KB' : ''} • {formatDate(result.created_at || '')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
