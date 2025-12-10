'use client'
import { Home, Star, Clock, Folder, Tag, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SidebarProps {
  className?: string;
}

interface CustomNotebook {
  id: string;
  label: string;
  count: number;
  color: string;
}

interface CustomTag {
  id: string;
  label: string;
  count: number;
  color: string;
}

export const Sidebar = ({ className }: SidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [activeView, setActiveView] = useState("all");
  const [showNotebookDialog, setShowNotebookDialog] = useState(false);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [customNotebooks, setCustomNotebooks] = useState<CustomNotebook[]>([]);
  const [customTags, setCustomTags] = useState<CustomTag[]>([]);

  // Update active view based on URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const filter = params.get('filter')
      const tag = params.get('tag')
      
      if (filter) {
        setActiveView(filter)
      } else if (tag) {
        setActiveView(`tag-${tag}`)
      } else {
        setActiveView('all')
      }
    }
  }, [pathname]);
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

      // Get recent notes (last 24 hours) - using updated_at for "recent activity"
      const oneDayAgo = new Date();
      oneDayAgo.setTime(oneDayAgo.getTime() - (24 * 60 * 60 * 1000)); // Subtract 24 hours in milliseconds
      
      console.log('Checking recent notes since:', oneDayAgo.toISOString());
      
      const { data: recentNotesData, count: recentCount } = await supabase
        .from('notes')
        .select('id, updated_at', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('updated_at', oneDayAgo.toISOString());
      
      console.log('Recent notes found:', recentCount, recentNotesData);

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

  // Load custom notebooks and tags from localStorage
  useEffect(() => {
    const savedNotebooks = localStorage.getItem('customNotebooks');
    const savedTags = localStorage.getItem('customTags');
    
    if (savedNotebooks) {
      setCustomNotebooks(JSON.parse(savedNotebooks));
    }
    if (savedTags) {
      setCustomTags(JSON.parse(savedTags));
    }
  }, []);

  const defaultNotebooks = [
    { id: "personal", label: "Personal", count: tagCounts['personal'] || 0, color: "lavender" },
    { id: "work", label: "Work", count: tagCounts['work'] || 0, color: "mint" },
    { id: "ideas", label: "Ideas", count: tagCounts['ideas'] || 0, color: "peach" },
  ];

  const defaultTags = [
    { id: "marketing", label: "Marketing", count: tagCounts['marketing'] || 0, color: "sky" },
    { id: "design", label: "Design", count: tagCounts['design'] || 0, color: "rose" },
    { id: "meetings", label: "Meetings", count: tagCounts['meetings'] || 0, color: "lavender" },
  ];

  // Merge default and custom notebooks/tags
  const notebooks = [
    ...defaultNotebooks,
    ...customNotebooks.map(nb => ({
      ...nb,
      count: tagCounts[nb.id.toLowerCase()] || 0
    }))
  ];

  const tags = [
    ...defaultTags,
    ...customTags.map(tag => ({
      ...tag,
      count: tagCounts[tag.id.toLowerCase()] || 0
    }))
  ];

  const colors = ['lavender', 'mint', 'peach', 'sky', 'rose'];

  const handleCreateNotebook = () => {
    if (!newNotebookName.trim()) return;
    
    const newNotebook: CustomNotebook = {
      id: newNotebookName.toLowerCase().replace(/\s+/g, '-'),
      label: newNotebookName,
      count: 0,
      color: colors[customNotebooks.length % colors.length]
    };
    
    const updated = [...customNotebooks, newNotebook];
    setCustomNotebooks(updated);
    localStorage.setItem('customNotebooks', JSON.stringify(updated));
    
    setNewNotebookName("");
    setShowNotebookDialog(false);
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    
    const newTag: CustomTag = {
      id: newTagName.toLowerCase().replace(/\s+/g, '-'),
      label: newTagName,
      count: 0,
      color: colors[customTags.length % colors.length]
    };
    
    const updated = [...customTags, newTag];
    setCustomTags(updated);
    localStorage.setItem('customTags', JSON.stringify(updated));
    
    setNewTagName("");
    setShowTagDialog(false);
  };

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
    <aside className={cn("w-64 h-[calc(100vh-4rem)] m-4 glass rounded-2xl border border-border/50 overflow-hidden", className)}>
      <ScrollArea className="h-full">
        <div className="px-4 py-6 space-y-6">

          <div className="space-y-1">
            <h4 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Views
            </h4>
            {views.map((view) => (
              <Button
                key={view.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 hover:bg-primary/10 transition-colors rounded-xl h-10",
                  activeView === view.id && "bg-primary/10 text-primary"
                )}
                onClick={() => handleViewClick(view)}
              >
                <view.icon className="h-4 w-4" />
                <span className="flex-1 text-left text-sm font-medium">{view.label}</span>
                <span className={cn(
                  "text-xs px-2.5 py-1 rounded-full font-medium",
                  view.count > 0 ? "bg-primary/20 text-primary" : "text-muted-foreground"
                )}>
                  {view.count}
                </span>
              </Button>
            ))}
          </div>

          <Separator className="bg-border/50" />

          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 mb-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Notebooks
              </h4>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 hover:bg-primary/10 rounded-lg"
                onClick={() => setShowNotebookDialog(true)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            {notebooks.map((notebook) => (
              <Button
                key={notebook.id}
                variant="ghost"
                className="w-full justify-start gap-3 hover:bg-primary/10 transition-colors rounded-xl h-10"
                onClick={() => handleNotebookClick(notebook)}
              >
                <Folder className={cn(
                  "h-4 w-4",
                  notebook.color === "lavender" && "text-purple-500",
                  notebook.color === "mint" && "text-green-500",
                  notebook.color === "peach" && "text-orange-500"
                )} />
                <span className="flex-1 text-left text-sm font-medium">{notebook.label}</span>
                <span className={cn(
                  "text-xs px-2.5 py-1 rounded-full font-medium",
                  notebook.count > 0 ? "bg-primary/20 text-primary" : "text-muted-foreground"
                )}>
                  {notebook.count}
                </span>
              </Button>
            ))}
          </div>

          <Separator className="bg-border/50" />

          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 mb-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tags
              </h4>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 hover:bg-primary/10 rounded-lg"
                onClick={() => setShowTagDialog(true)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            {tags.map((tag) => (
              <Button
                key={tag.id}
                variant="ghost"
                className="w-full justify-start gap-3 hover:bg-primary/10 transition-colors rounded-xl h-10"
                onClick={() => handleTagClick(tag)}
              >
                <Tag className={cn(
                  "h-3.5 w-3.5",
                  tag.color === "sky" && "text-blue-500",
                  tag.color === "rose" && "text-pink-500",
                  tag.color === "lavender" && "text-purple-500"
                )} />
                <span className="flex-1 text-left text-sm font-medium">{tag.label}</span>
                <span className={cn(
                  "text-xs px-2.5 py-1 rounded-full font-medium",
                  tag.count > 0 ? "bg-primary/20 text-primary" : "text-muted-foreground"
                )}>
                  {tag.count}
                </span>
              </Button>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Create Notebook Dialog */}
      <Dialog open={showNotebookDialog} onOpenChange={setShowNotebookDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Notebook</DialogTitle>
            <DialogDescription>
              Add a new notebook to organize your notes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notebook-name">Notebook Name</Label>
              <Input
                id="notebook-name"
                placeholder="e.g., Projects, Research, Personal"
                value={newNotebookName}
                onChange={(e) => setNewNotebookName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateNotebook();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotebookDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateNotebook} disabled={!newNotebookName.trim()}>
              Create Notebook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Tag Dialog */}
      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
            <DialogDescription>
              Add a new tag to categorize your notes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Tag Name</Label>
              <Input
                id="tag-name"
                placeholder="e.g., urgent, review, archived"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateTag();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTagDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTag} disabled={!newTagName.trim()}>
              Create Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
};
