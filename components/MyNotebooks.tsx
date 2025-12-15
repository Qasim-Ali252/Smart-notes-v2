'use client'
import { Folder, Plus, BookOpen, Trash2, MoreVertical, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CustomNotebook {
  id: string;
  label: string;
  count: number;
  color: string;
}

export const MyNotebooks = () => {
  const router = useRouter();
  const [showNotebookDialog, setShowNotebookDialog] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState("");
  const [customNotebooks, setCustomNotebooks] = useState<CustomNotebook[]>([]);
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAllNotebooks, setShowAllNotebooks] = useState(false);
  const supabase = createClient();

  // Fetch tag counts for notebooks
  useEffect(() => {
    const fetchTagCounts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all notes to count tags
      const { data: notes } = await supabase
        .from('notes')
        .select('tags')
        .eq('user_id', user.id);

      // Count tags
      const tagCountMap: Record<string, number> = {};
      notes?.forEach((note: any) => {
        note.tags?.forEach((tag: string) => {
          tagCountMap[tag.toLowerCase()] = (tagCountMap[tag.toLowerCase()] || 0) + 1;
        });
      });
      setTagCounts(tagCountMap);
    };

    fetchTagCounts();

    // Subscribe to changes
    const channel = supabase
      .channel('notes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => {
        fetchTagCounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Load custom notebooks and preferences from localStorage
  useEffect(() => {
    const savedNotebooks = localStorage.getItem('customNotebooks');
    const savedCollapsed = localStorage.getItem('notebooksCollapsed');
    const savedShowAll = localStorage.getItem('notebooksShowAll');
    
    if (savedNotebooks) {
      setCustomNotebooks(JSON.parse(savedNotebooks));
    }
    if (savedCollapsed) {
      setIsCollapsed(JSON.parse(savedCollapsed));
    }
    if (savedShowAll) {
      setShowAllNotebooks(JSON.parse(savedShowAll));
    }
  }, []);

  // Save preferences when they change
  useEffect(() => {
    localStorage.setItem('notebooksCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    localStorage.setItem('notebooksShowAll', JSON.stringify(showAllNotebooks));
  }, [showAllNotebooks]);

  // Only use custom notebooks - no defaults
  const notebooks = customNotebooks.map(nb => ({
    ...nb,
    count: tagCounts[nb.id.toLowerCase()] || 0
  }));

  // Display logic for many notebooks
  const DISPLAY_LIMIT = 6;
  const hasMany = notebooks.length > DISPLAY_LIMIT;
  const displayedNotebooks = showAllNotebooks ? notebooks : notebooks.slice(0, DISPLAY_LIMIT);
  const hiddenCount = notebooks.length - DISPLAY_LIMIT;

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

  const handleNotebookClick = (notebook: typeof notebooks[0]) => {
    router.push(`/dashboard?tag=${notebook.id}`);
  };

  const handleDeleteNotebook = (notebookId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent notebook click
    const updated = customNotebooks.filter(nb => nb.id !== notebookId);
    setCustomNotebooks(updated);
    localStorage.setItem('customNotebooks', JSON.stringify(updated));
  };

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
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">My Notebooks</h2>
              {notebooks.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="h-6 w-6 p-0 ml-1"
                >
                  {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {notebooks.length === 0 
                ? "Organize your notes by topic" 
                : `${notebooks.length} notebook${notebooks.length === 1 ? '' : 's'}`
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {hasMany && !isCollapsed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllNotebooks(!showAllNotebooks)}
              className="gap-2"
            >
              {showAllNotebooks ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Show Less
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Show All ({hiddenCount} more)
                </>
              )}
            </Button>
          )}
          <Button
            onClick={() => setShowNotebookDialog(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </div>
      </div>

      {notebooks.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center space-y-3">
          <div className="flex items-center justify-center w-12 h-12 mx-auto rounded-full bg-muted/50">
            <BookOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium mb-2">No notebooks yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first notebook to organize your notes by topic or project
            </p>
            <Button
              onClick={() => setShowNotebookDialog(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Your First Notebook
            </Button>
          </div>
        </div>
      ) : !isCollapsed ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedNotebooks.map((notebook) => (
            <div
              key={notebook.id}
              className={cn(
                'glass rounded-2xl p-4 border-2 transition-all hover:shadow-lg cursor-pointer group',
                colorClasses[notebook.color as keyof typeof colorClasses] || colorClasses.lavender
              )}
              onClick={() => handleNotebookClick(notebook)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Folder className="h-5 w-5" />
                  <h3 className="font-semibold">{notebook.label}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-background/50">
                    {notebook.count} notes
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => handleDeleteNotebook(notebook.id, e)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Notebook
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <p className="text-sm opacity-90">
                Click to view all notes in this notebook
              </p>
            </div>
          ))}
          </div>
          
          {/* Show more/less controls at bottom */}
          {hasMany && (
            <div className="flex justify-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllNotebooks(!showAllNotebooks)}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                {showAllNotebooks ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show {hiddenCount} More Notebooks
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-sm text-muted-foreground">
            {notebooks.length} notebook{notebooks.length === 1 ? '' : 's'} hidden
          </p>
        </div>
      )}

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
    </div>
  )
}