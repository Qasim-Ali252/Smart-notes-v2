'use client'
import { Star, MoreVertical, Clock, Sparkles, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
  isPinned = false,
  isFavorite = false,
  readTime,
}: NoteCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  const tagColors = ['lavender', 'mint', 'peach', 'sky', 'rose'];

  return (
    <div
      className="group relative glass rounded-2xl p-4 cursor-pointer note-card-hover"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => router.push(`/notes/${id}`)}
    >
      <div
        className={cn(
          "absolute top-3 right-3 flex items-center gap-1 transition-opacity duration-200",
          isHovered ? "opacity-100" : "opacity-0"
        )}
      >
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 hover:bg-background/80"
          onClick={(e) => e.stopPropagation()}
        >
          <Star className={cn("h-3.5 w-3.5", isFavorite && "fill-accent text-accent")} />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 hover:bg-background/80"
          onClick={(e) => e.stopPropagation()}
        >
          <Pin className={cn("h-3.5 w-3.5", isPinned && "fill-primary text-primary")} />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 hover:bg-background/80"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </Button>
      </div>

      {aiSummary && (
        <div className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20">
          <Sparkles className="h-3 w-3 text-primary" />
          <span className="text-xs font-medium text-primary">{aiSummary}</span>
        </div>
      )}

      <h3 className="font-semibold text-base mb-2 line-clamp-1 pr-20">
        {title}
      </h3>

      <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
        {snippet}
      </p>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.map((tag, idx) => {
            const color = tagColors[idx % tagColors.length];
            return (
              <span
                key={idx}
                className={cn(
                  "tag-chip",
                  `bg-tag-${color}`,
                  `text-tag-${color}-fg`
                )}
              >
                {tag}
              </span>
            );
          })}
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
