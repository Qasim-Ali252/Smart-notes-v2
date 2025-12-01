'use client'
import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { fetchNotes } from '@/lib/store/slices/notesSlice'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { NoteCard } from '@/components/NoteCard'
import { SlidersHorizontal, LayoutGrid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { TopicClusters } from '@/components/TopicClusters'
import { DashboardStats } from '@/components/DashboardStats'

export default function DashboardPage() {
  const dispatch = useAppDispatch()
  const { notes, loading } = useAppSelector((state) => state.notes)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Calculate stats
  const enrichedNotes = notes.filter(n => n.summary).length
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const notesThisWeek = notes.filter(n => new Date(n.created_at) > oneWeekAgo).length

  useEffect(() => {
    // Only fetch notes if user might be logged in
    dispatch(fetchNotes()).catch(() => {
      // Silently fail if not authenticated - user can still browse
    })
  }, [dispatch])

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
      
      <div className="flex-1 flex w-full">
        <Sidebar className="hidden lg:flex" />
        
        <main className="flex-1 overflow-auto">
          <div className="container max-w-7xl mx-auto p-6">
            {/* Stats Section */}
            {notes.length > 0 && (
              <DashboardStats 
                totalNotes={notes.length}
                notesThisWeek={notesThisWeek}
                enrichedNotes={enrichedNotes}
              />
            )}

            {/* Topic Clusters Section */}
            {notes.length >= 3 && (
              <div className="mb-8">
                <TopicClusters />
              </div>
            )}

            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-1">All Notes</h1>
                <p className="text-sm text-muted-foreground">
                  {notes.length} notes • Last updated {notes.length > 0 ? formatDate(notes[0].updated_at) : 'never'}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">Filters</span>
                </Button>
                
                <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : notes.length === 0 ? (
              <div className="text-center py-12 glass rounded-lg">
                <p className="text-muted-foreground">No notes yet. Create your first note!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notes.map((note, index) => (
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
                      readTime="3 min"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
