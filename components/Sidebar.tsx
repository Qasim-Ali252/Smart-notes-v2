'use client'
import { Home, Star, Clock, Folder, Tag, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";

interface SidebarProps {
  className?: string;
}

export const Sidebar = ({ className }: SidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [activeView, setActiveView] = useState("all");
  const [noteCounts, setNoteCounts] = useState({
    all: 0,
    favorites: 0,
    recent: 0,
  });
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({});
  const supabase = createClient();

  // Fetch note counts
  useEffect(() => {
    const fetchCounts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all notes count
      const { count: allCount } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get favorites count (notes with favorite tag or high importance)
      const { count: favCount } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .contains('tags', ['favorite']);

      // Get recent notes (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { count: recentCount } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString());

      setNoteCounts({
        all: allCount || 0,
        favorites: favCount || 0,
        recent: recentCount || 0,
      });

      // Get all notes to count tags
      const { data: notes } = await supabase
        .from('notes')
        .select('tags')
        .eq('user_id', user.id);

      // Count tags
      const tagCountMap: Record<string, number> = {};
      notes?.forEach(note => {
        note.tags?.forEach((tag: string) => {
          tagCountMap[tag.toLowerCase()] = (tagCountMap[tag.toLowerCase()] || 0) + 1;
        });
      });
      setTagCounts(tagCountMap);
    };

    fetchCounts();

    // Subscribe to changes
    const channel = supabase
      .channel('notes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => {
        fetchCounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const views = [
    { id: "all", icon: Home, label: "All Notes", count: noteCounts.all, path: "/dashboard" },
    { id: "favorites", icon: Star, label: "Favorites", count: noteCounts.favorites, path: "/dashboard?filter=favorites" },
    { id: "recent", icon: Clock, label: "Recent", count: noteCounts.recent, path: "/dashboard?filter=recent" },
  ];

  const notebooks = [
    { id: "personal", label: "Personal", count: tagCounts['personal'] || 0, color: "lavender" },
    { id: "work", label: "Work", count: tagCounts['work'] || 0, color: "mint" },
    { id: "ideas", label: "Ideas", count: tagCounts['ideas'] || 0, color: "peach" },
  ];

  const tags = [
    { id: "marketing", label: "Marketing", count: tagCounts['marketing'] || 0, color: "sky" },
    { id: "design", label: "Design", count: tagCounts['design'] || 0, color: "rose" },
    { id: "meetings", label: "Meetings", count: tagCounts['meetings'] || 0, color: "lavender" },
  ];

  const handleViewClick = (view: typeof views[0]) => {
    setActiveView(view.id);
    router.push(view.path);
  };

  const handleNotebookClick = (notebook: typeof notebooks[0]) => {
    router.push(`/dashboard?tag=${notebook.id}`);
  };

  const handleTagClick = (tag: typeof tags[0]) => {
    router.push(`/dashboard?tag=${tag.id}`);
  };

  return (
    <aside className={cn("w-64 glass border-r border-border/50", className)}>
      <ScrollArea className="h-full py-4">
        <div className="px-3 space-y-6">
          <Separator className="bg-border/50" />

          <div className="space-y-1">
            <h4 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Views
            </h4>
            {views.map((view) => (
              <Button
                key={view.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 hover:bg-primary/10 transition-colors",
                  activeView === view.id && "bg-primary/10 text-primary"
                )}
                onClick={() => handleViewClick(view)}
              >
                <view.icon className="h-4 w-4" />
                <span className="flex-1 text-left text-sm">{view.label}</span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  view.count > 0 ? "bg-primary/20 text-primary" : "text-muted-foreground"
                )}>
                  {view.count}
                </span>
              </Button>
            ))}
          </div>

          <Separator className="bg-border/50" />

          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 mb-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Notebooks
              </h4>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5 hover:bg-primary/10"
                onClick={() => router.push('/notes/new')}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {notebooks.map((notebook) => (
              <Button
                key={notebook.id}
                variant="ghost"
                className="w-full justify-start gap-3 hover:bg-primary/10 transition-colors"
                onClick={() => handleNotebookClick(notebook)}
              >
                <Folder className={cn(
                  "h-4 w-4",
                  notebook.color === "lavender" && "text-purple-500",
                  notebook.color === "mint" && "text-green-500",
                  notebook.color === "peach" && "text-orange-500"
                )} />
                <span className="flex-1 text-left text-sm">{notebook.label}</span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  notebook.count > 0 ? "bg-primary/20 text-primary" : "text-muted-foreground"
                )}>
                  {notebook.count}
                </span>
              </Button>
            ))}
          </div>

          <Separator className="bg-border/50" />

          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 mb-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tags
              </h4>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5 hover:bg-primary/10"
                onClick={() => router.push('/notes/new')}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {tags.map((tag) => (
              <Button
                key={tag.id}
                variant="ghost"
                className="w-full justify-start gap-3 hover:bg-primary/10 transition-colors"
                onClick={() => handleTagClick(tag)}
              >
                <Tag className={cn(
                  "h-3.5 w-3.5",
                  tag.color === "sky" && "text-blue-500",
                  tag.color === "rose" && "text-pink-500",
                  tag.color === "lavender" && "text-purple-500"
                )} />
                <span className="flex-1 text-left text-sm">{tag.label}</span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  tag.count > 0 ? "bg-primary/20 text-primary" : "text-muted-foreground"
                )}>
                  {tag.count}
                </span>
              </Button>
            ))}
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
};
