'use client'
import { Button } from '@/components/ui/button'
import { Loader2, ChevronDown } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { loadMoreNotes } from '@/lib/store/slices/notesSlice'
import { useState, useEffect } from 'react'

export function NotePagination() {
  const dispatch = useAppDispatch()
  const { pagination, loading } = useAppSelector((state) => state.notes)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [lastScrollTrigger, setLastScrollTrigger] = useState(0)



  const handleLoadMore = async () => {
    if (loading || !pagination.hasMore || isLoadingMore) {
      return
    }
    
    setIsLoadingMore(true)
    try {
      await dispatch(loadMoreNotes()).unwrap()
    } catch (error) {
      // Only log actual errors, not "no more notes" messages
      if (error !== 'No more notes to load') {
        console.error('Failed to load more notes:', error)
      }
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Auto-load more when scrolling near bottom
  useEffect(() => {
    const handleScroll = () => {
      if (isLoadingMore || !pagination.hasMore || loading) return
      
      const now = Date.now()
      // Prevent triggering too frequently (minimum 2 seconds between triggers)
      if (now - lastScrollTrigger < 2000) return
      
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      
      // Load more when user is 300px from bottom
      if (scrollTop + windowHeight >= documentHeight - 300) {
        setLastScrollTrigger(now)
        handleLoadMore()
      }
    }

    // Throttle scroll events for better performance
    let ticking = false
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    // Only add scroll listener if there are more notes to load
    if (pagination.hasMore && !isLoadingMore && !loading) {
      window.addEventListener('scroll', throttledScroll, { passive: true })
    }
    
    return () => window.removeEventListener('scroll', throttledScroll)
  }, [isLoadingMore, pagination.hasMore, loading, lastScrollTrigger])

  if (!pagination.hasMore && pagination.totalCount > 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          You've reached the end! Showing all {pagination.totalCount} notes.
        </p>
      </div>
    )
  }

  if (!pagination.hasMore) {
    return null
  }

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">
          Showing {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} notes
        </p>
        <div className="w-full bg-muted rounded-full h-2 max-w-xs mx-auto">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${Math.min((pagination.currentPage * pagination.pageSize / pagination.totalCount) * 100, 100)}%` 
            }}
          />
        </div>
      </div>
      
      <Button
        onClick={handleLoadMore}
        disabled={isLoadingMore || loading}
        variant="outline"
        className="gap-2"
      >
        {isLoadingMore ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading more notes...
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4" />
            Load more notes
          </>
        )}
      </Button>
      
      <p className="text-xs text-muted-foreground">
        Or scroll down to auto-load more
      </p>
    </div>
  )
}