'use client'
import { useEffect, useState, useMemo, Suspense } from 'react'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { fetchNotes } from '@/lib/store/slices/notesSlice'
import { Navbar } from '@/components/Navbar'

import { NoteCard } from '@/components/NoteCard'
import { SlidersHorizontal, FolderPlus, Home, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TopicClusters } from '@/components/TopicClusters'
import { DashboardStats } from '@/components/DashboardStats'
import { MyNotebooks } from '@/components/MyNotebooks'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSearchParams, useRouter } from 'next/navigation'

function DashboardContent() {
  const dispatch = useAppDispatch()
  const { notes, loading } = useAppSelector((state) => state.notes)
  const searchParams = useSearchParams()
  const router = useRouter()
  const [filterOpen, setFilterOpen] = useState(false)

  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [showEnrichedOnly, setShowEnrichedOnly] = useState(false)
  const [currentView, setCurrentView] = useState<string>('all')

  // Get all unique tags and topics
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    notes.forEach(note => note.tags?.forEach(tag => tags.add(tag)))
    return Array.from(tags).sort()
  }, [notes])

  const allTopics = useMemo(() => {
    const topics = new Set<string>()
    notes.forEach(note => note.key_topics?.forEach(topic => topics.add(topic)))
    return Array.from(topics).sort()
  }, [notes])

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    const filtered = notes.filter(note => {
      // Tag filter (case-insensitive)
      if (selectedTags.length > 0) {
        const hasTag = note.tags?.some(tag => 
          selectedTags.some(selectedTag => 
            tag.toLowerCase() === selectedTag.toLowerCase()
          )
        )
        if (!hasTag) return false
      }

      // Topic filter
      if (selectedTopics.length > 0) {
        const hasTopic = note.key_topics?.some(topic => selectedTopics.includes(topic))
        if (!hasTopic) return false
      }

      // Date filter
      if (dateFilter !== 'all') {
        const noteDate = new Date(note.updated_at)
        const now = new Date()
        const diffMs = now.getTime() - noteDate.getTime()
        const diffDays = Math.floor(diffMs / 86400000)

        if (dateFilter === 'today' && diffDays >= 1) return false
        if (dateFilter === 'week' && diffDays > 7) return false
        if (dateFilter === 'month' && diffDays > 30) return false
      }

      // Enriched filter
      if (showEnrichedOnly && !note.summary) return false

      return true
    })
    
    // Sort: pinned notes first, then by updated_at
    return filtered.sort((a, b) => {
      const aIsPinned = a.tags?.includes('pinned') || false
      const bIsPinned = b.tags?.includes('pinned') || false
      
      if (aIsPinned && !bIsPinned) return -1
      if (!aIsPinned && bIsPinned) return 1
      
      // If both pinned or both not pinned, sort by updated_at
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
  }, [notes, selectedTags, selectedTopics, dateFilter, showEnrichedOnly])

  // Calculate stats
  const enrichedNotes = notes.filter(n => n.summary).length
  const favouriteNotes = notes.filter(n => n.tags?.includes('favorite')).length
  const oneDayAgo = new Date()
  oneDayAgo.setDate(oneDayAgo.getDate() - 1)
  const recentNotes = notes.filter(n => new Date(n.updated_at) > oneDayAgo).length

  const activeFiltersCount = selectedTags.length + selectedTopics.length + 
    (dateFilter !== 'all' ? 1 : 0) + (showEnrichedOnly ? 1 : 0)

  const clearFilters = () => {
    setSelectedTags([])
    setSelectedTopics([])
    setDateFilter('all')
    setShowEnrichedOnly(false)
  }

  useEffect(() => {
    // Only fetch notes if user might be logged in
    dispatch(fetchNotes()).catch(() => {
      // Silently fail if not authenticated - user can still browse
    })
  }, [dispatch])

  // Get current notebook/tag from URL
  const currentNotebook = searchParams.get('tag')

  // Handle URL parameters for filtering
  useEffect(() => {
    const filter = searchParams.get('filter')
    const tag = searchParams.get('tag')

    console.log('Dashboard filter params:', { filter, tag })

    if (filter === 'favorites') {
      setCurrentView('favorites')
      setSelectedTags(['favorite'])
    } else if (filter === 'recent') {
      setCurrentView('recent')
      setDateFilter('today')
    } else if (tag) {
      setCurrentView('tag')
      setSelectedTags([tag])
      console.log('Filtering by tag:', tag)
    } else {
      setCurrentView('all')
      // Clear filters when going to "All Notes"
      setSelectedTags([])
      setSelectedTopics([])
      setDateFilter('all')
      setShowEnrichedOnly(false)
    }
  }, [searchParams])

  const handleCreateNoteInNotebook = () => {
    if (currentNotebook) {
      router.push(`/notes/new?notebook=${currentNotebook}`)
    } else {
      router.push('/notes/new')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      <Navbar />
      
      <main className="flex-1 overflow-auto">
          <div className="container max-w-7xl mx-auto p-6">
            {/* Stats Section */}
            {notes.length > 0 && (
              <DashboardStats 
                totalNotes={notes.length}
                notesThisWeek={recentNotes}
                enrichedNotes={enrichedNotes}
                favouriteNotes={favouriteNotes}
              />
            )}

            {/* Topic Clusters Section */}
            {notes.length >= 3 && (
              <div className="mb-8">
                <TopicClusters />
              </div>
            )}

            {/* My Notebooks Section */}
            {notes.length > 0 && (
              <div className="mb-8">
                <MyNotebooks />
              </div>
            )}

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <Home className="h-4 w-4" />
                All Notes
              </Button>
              
              {(currentView === 'favorites' || currentView === 'recent' || currentView === 'tag') && (
                <>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {currentView === 'favorites' ? 'Favorites' : 
                     currentView === 'recent' ? 'Recent Notes' : 
                     currentView === 'tag' ? `${selectedTags[0]?.charAt(0).toUpperCase()}${selectedTags[0]?.slice(1)}` :
                     'Current View'}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-1">
                  {currentView === 'favorites' ? 'Favorites' : 
                   currentView === 'recent' ? 'Recent Notes' : 
                   currentView === 'tag' ? `${selectedTags[0]?.charAt(0).toUpperCase()}${selectedTags[0]?.slice(1)} Notes` :
                   'All Notes'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {filteredNotes.length} of {notes.length} notes
                  {activeFiltersCount > 0 && ` • ${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} active`}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Show back button when viewing filtered views */}
                {(currentView === 'favorites' || currentView === 'recent' || currentNotebook) && (
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/dashboard')}
                    className="gap-2"
                  >
                    <Home className="h-4 w-4" />
                    <span className="hidden sm:inline">Back to All Notes</span>
                    <span className="sm:hidden">Back</span>
                  </Button>
                )}
                
                {/* Show "Create Note" button when viewing a notebook */}
                {currentNotebook && (
                  <Button 
                    onClick={handleCreateNoteInNotebook}
                    className="gap-2"
                  >
                    <FolderPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Create Note in {currentNotebook.charAt(0).toUpperCase() + currentNotebook.slice(1)}</span>
                    <span className="sm:hidden">New Note</span>
                  </Button>
                )}
                <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 relative">
                      <SlidersHorizontal className="h-4 w-4" />
                      <span className="hidden sm:inline">Filters</span>
                      {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[80vh]" aria-describedby="filter-description">
                    <DialogHeader>
                      <DialogTitle>Filter Notes</DialogTitle>
                      <DialogDescription id="filter-description">
                        Filter your notes by tags, topics, date, and more
                      </DialogDescription>
                    </DialogHeader>
                    
                    <ScrollArea className="h-[60vh] pr-4">
                      <div className="space-y-6">
                      {/* Active Filters */}
                      {activeFiltersCount > 0 && (
                        <div className="flex items-center justify-between pb-4 border-b">
                          <span className="text-sm font-medium">{activeFiltersCount} active filter{activeFiltersCount > 1 ? 's' : ''}</span>
                          <Button variant="ghost" size="sm" onClick={clearFilters}>
                            Clear all
                          </Button>
                        </div>
                      )}

                      {/* Date Filter */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">Date Range</Label>
                        <div className="space-y-2">
                          {[
                            { value: 'all', label: 'All time' },
                            { value: 'today', label: 'Today' },
                            { value: 'week', label: 'Past week' },
                            { value: 'month', label: 'Past month' }
                          ].map(option => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={`date-${option.value}`}
                                checked={dateFilter === option.value}
                                onCheckedChange={() => setDateFilter(option.value)}
                              />
                              <Label htmlFor={`date-${option.value}`} className="cursor-pointer">
                                {option.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* AI Enrichment Filter */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">AI Status</Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="enriched"
                            checked={showEnrichedOnly}
                            onCheckedChange={(checked) => setShowEnrichedOnly(checked as boolean)}
                          />
                          <Label htmlFor="enriched" className="cursor-pointer">
                            Show only AI-enriched notes
                          </Label>
                        </div>
                      </div>

                      {/* Tags Filter */}
                      {allTags.length > 0 && (
                        <div className="space-y-3">
                          <Label className="text-base font-semibold">Tags</Label>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {allTags.map(tag => (
                              <div key={tag} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`tag-${tag}`}
                                  checked={selectedTags.includes(tag)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedTags([...selectedTags, tag])
                                    } else {
                                      setSelectedTags(selectedTags.filter(t => t !== tag))
                                    }
                                  }}
                                />
                                <Label htmlFor={`tag-${tag}`} className="cursor-pointer">
                                  {tag}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Topics Filter */}
                      {allTopics.length > 0 && (
                        <div className="space-y-3">
                          <Label className="text-base font-semibold">Topics</Label>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {allTopics.map(topic => (
                              <div key={topic} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`topic-${topic}`}
                                  checked={selectedTopics.includes(topic)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedTopics([...selectedTopics, topic])
                                    } else {
                                      setSelectedTopics(selectedTopics.filter(t => t !== topic))
                                    }
                                  }}
                                />
                                <Label htmlFor={`topic-${topic}`} className="cursor-pointer">
                                  {topic}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : notes.length === 0 ? (
              <div className="text-center py-12 glass rounded-lg">
                <p className="text-muted-foreground">No notes yet. Create your first note!</p>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-12 glass rounded-lg">
                <p className="text-muted-foreground mb-4">No notes match your filters</p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNotes.map((note, index) => (
                  <div
                    key={note.id}
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    <NoteCard
                      id={note.id}
                      title={note.title}
                      snippet={note.content}
                      tags={note.tags}
                      aiSummary={note.summary}
                      lastEdited={formatDate(note.updated_at)}
                      isPinned={note.tags?.includes('pinned')}
                      isFavorite={note.tags?.includes('favorite')}
                      readTime="3 min"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
