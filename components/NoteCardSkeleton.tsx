export function NoteCardSkeleton() {
  return (
    <div className="glass rounded-lg p-4 space-y-3 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="h-5 bg-muted rounded w-3/4"></div>
        <div className="h-4 w-4 bg-muted rounded"></div>
      </div>
      
      {/* Content */}
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-5/6"></div>
        <div className="h-4 bg-muted rounded w-4/6"></div>
      </div>
      
      {/* Tags */}
      <div className="flex gap-2">
        <div className="h-5 bg-muted rounded-full w-16"></div>
        <div className="h-5 bg-muted rounded-full w-20"></div>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <div className="h-3 bg-muted rounded w-20"></div>
        <div className="h-3 bg-muted rounded w-16"></div>
      </div>
    </div>
  )
}

export function NoteGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <NoteCardSkeleton key={index} />
      ))}
    </div>
  )
}