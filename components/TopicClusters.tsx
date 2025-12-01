'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, FolderOpen, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface Cluster {
  name: string
  description: string
  color: string
  count: number
  noteIds: string[]
  notes: Array<{
    id: string
    title: string
    summary?: string
  }>
}

export const TopicClusters = () => {
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [loading, setLoading] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)
  const router = useRouter()

  const analyzeClusters = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/analyze-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) throw new Error('Failed to analyze topics')

      const data = await response.json()
      setClusters(data.clusters || [])
      setAnalyzed(true)
    } catch (error) {
      console.error('Error analyzing topics:', error)
      alert('Failed to analyze topics. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const colorClasses = {
    lavender: 'bg-tag-lavender text-tag-lavender-fg border-tag-lavender-fg/20',
    mint: 'bg-tag-mint text-tag-mint-fg border-tag-mint-fg/20',
    peach: 'bg-tag-peach text-tag-peach-fg border-tag-peach-fg/20',
    sky: 'bg-tag-sky text-tag-sky-fg border-tag-sky-fg/20',
    rose: 'bg-tag-rose text-tag-rose-fg border-tag-rose-fg/20'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Topic Clusters
          </h2>
          <p className="text-sm text-muted-foreground">
            AI-organized groups of related notes
          </p>
        </div>
        
        {!analyzed && (
          <Button
            onClick={analyzeClusters}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analyze Topics
              </>
            )}
          </Button>
        )}
      </div>

      {analyzed && clusters.length === 0 && (
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-muted-foreground">
            Create more notes to see topic clusters!
          </p>
        </div>
      )}

      {clusters.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clusters.map((cluster, idx) => (
            <div
              key={idx}
              className={cn(
                'glass rounded-2xl p-4 border-2 transition-all hover:shadow-lg cursor-pointer',
                colorClasses[cluster.color as keyof typeof colorClasses] || colorClasses.lavender
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  <h3 className="font-semibold">{cluster.name}</h3>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-background/50">
                  {cluster.count} notes
                </span>
              </div>

              <p className="text-sm opacity-90 mb-4">
                {cluster.description}
              </p>

              <div className="space-y-2">
                {cluster.notes.slice(0, 3).map((note) => (
                  <button
                    key={note.id}
                    onClick={() => router.push(`/notes/${note.id}`)}
                    className="w-full text-left p-2 rounded-lg bg-background/30 hover:bg-background/50 transition-colors flex items-center justify-between group"
                  >
                    <span className="text-sm font-medium truncate">
                      {note.title}
                    </span>
                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
                
                {cluster.count > 3 && (
                  <p className="text-xs text-center opacity-70 pt-1">
                    +{cluster.count - 3} more notes
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {analyzed && clusters.length > 0 && (
        <div className="flex justify-center">
          <Button
            onClick={analyzeClusters}
            variant="outline"
            size="sm"
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Re-analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Re-analyze Topics
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
