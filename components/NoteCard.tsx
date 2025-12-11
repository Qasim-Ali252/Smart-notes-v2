'use client'
import { Star, MoreVertical, Clock, Sparkles, Pin, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/lib/store/hooks";
import { updateNote, deleteNote } from "@/lib/store/slices/notesSlice";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NoteCardProps {
  id: string;
  title: string;
  snippet: string;
  tags?: string[];
  aiSummary?: string;
  lastEdited: string;
  isPinned?: boolean;
  isFavorite?: boolean;
  readTime?: string;
}

export const NoteCard = ({
  id,
  title,
  snippet,
  tags = [],
  aiSummary,
  lastEdited,
  isPinned: initialPinned = false,
  isFavorite: initialFavorite = false,
  readTime,
}: NoteCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(initialPinned);
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();

  const tagColors = ['lavender', 'mint', 'peach', 'sky', 'rose'];

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavoriteState = !isFavorite;
    const previousState = isFavorite;
    setIsFavorite(newFavoriteState);
    
    // Update tags to include/remove 'favorite'
    const updatedTags = newFavoriteState 
      ? [...tags.filter(t => t !== 'favorite'), 'favorite']
      : tags.filter(t => t !== 'favorite');
    
    try {
      // The database trigger will now preserve updated_at for tags-only changes
      await dispatch(updateNote({
        id,
        updates: { tags: updatedTags }
      })).unwrap();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      setIsFavorite(previousState); // Revert on error
    }
  };

  const handleTogglePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newPinnedState = !isPinned;
    const previousState = isPinned;
    setIsPinned(newPinnedState);
    
    // Update tags to include/remove 'pinned'
    const updatedTags = newPinnedState 
      ? [...tags.filter(t => t !== 'pinned'), 'pinned']
      : tags.filter(t => t !== 'pinned');
    
    try {
      // The database trigger will now preserve updated_at for tags-only changes
      await dispatch(updateNote({
        id,
        updates: { tags: updatedTags }
      })).unwrap();
    } catch (error) {
      console.error('Failed to toggle pin:', error);
      setIsPinned(previousState); // Revert on error
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        await dispatch(deleteNote(id)).unwrap();
      } catch (error) {
        console.error('Failed to delete note:', error);
      }
    }
  };

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/notes/new?duplicate=${id}`);
  };

  const handleToggleSummary = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSummaryExpanded(!isSummaryExpanded);
  };

  // Check if summary is long enough to need truncation (about 2 lines worth)
  const shouldTruncateSummary = aiSummary && aiSummary.length > 120;

  return (
    <div
      className="group relative glass rounded-2xl p-4 cursor-pointer note-card-hover"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => router.push(`/notes/${id}`)}
    >
      <div
        className={cn(
          "absolute top-3 right-3 flex items-center gap-1 transition-opacity duration-200 z-10 bg-background/80 backdrop-blur-sm rounded-lg p-1",
          isHovered ? "opacity-100" : "opacity-0"
        )}
      >
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 hover:bg-background/80"
          onClick={handleToggleFavorite}
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Star className={cn("h-3.5 w-3.5", isFavorite && "fill-yellow-500 text-yellow-500")} />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 hover:bg-background/80"
          onClick={handleTogglePin}
          title={isPinned ? "Unpin note" : "Pin note"}
        >
          <Pin className={cn("h-3.5 w-3.5", isPinned && "fill-primary text-primary rotate-45")} />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 hover:bg-background/80"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={handleDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {aiSummary && (
        <div className="mb-3">
          <div 
            className={cn(
              "flex items-start gap-1.5 px-2.5 py-2 rounded-lg bg-primary/10 border border-primary/20 transition-all duration-200",
              shouldTruncateSummary && "cursor-pointer hover:bg-primary/15"
            )}
            onClick={shouldTruncateSummary ? handleToggleSummary : undefined}
          >
            <Sparkles className="h-3 w-3 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div 
                className={cn(
                  "text-xs font-medium text-primary",
                  !isSummaryExpanded && shouldTruncateSummary && "line-clamp-2"
                )}
              >
                {aiSummary}
              </div>
              {shouldTruncateSummary && (
                <button
                  className="text-xs text-primary/70 hover:text-primary mt-1 font-medium transition-colors"
                  onClick={handleToggleSummary}
                >
                  {isSummaryExpanded ? '↑ Show less' : '↓ Show more'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 mb-2">
        {isPinned && (
          <Pin className="h-4 w-4 text-primary shrink-0 mt-0.5 rotate-45" />
        )}
        <h3 className="font-semibold text-base line-clamp-1 flex-1 pr-2">
          {title}
        </h3>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
        {snippet}
      </p>

      {tags.length > 0 && (
        <div className="h-[58px] mb-3 overflow-hidden">
          <div className="flex flex-wrap gap-1.5 h-full">
            {tags.map((tag, idx) => {
              const color = tagColors[idx % tagColors.length];
              return (
                <span
                  key={idx}
                  className={cn(
                    "tag-chip h-fit",
                    `bg-tag-${color}`,
                    `text-tag-${color}-fg`
                  )}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{lastEdited}</span>
        </div>
        {readTime && (
          <>
            <span>•</span>
            <span>{readTime} read</span>
          </>
        )}
      </div>
    </div>
  );
};
