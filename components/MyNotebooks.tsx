'use client'
import { Folder, Plus, BookOpen } from "lucide-react";
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

  // Load custom notebooks from localStorage
  useEffect(() => {
    const savedNotebooks = localStorage.getItem('customNotebooks');
    
    if (savedNotebooks) {
      setCustomNotebooks(JSON.parse(savedNotebooks));
    }
  }, []);

  const defaultNotebooks = [
    { id: "personal", label: "Personal", count: tagCounts['personal'] || 0, color: "lavender" },
    { id: "work", label: "Work", count: tagCounts['work'] || 0, color: "mint" },
    { id: "ideas", label: "Ideas", count: tagCounts['ideas'] || 0, color: "peach" },
  ];

  // Merge default and custom notebooks
  const notebooks = [
    ...defaultNotebooks,
    ...customNotebooks.map(nb => ({
      ...nb,
      count: tagCounts[nb.id.toLowerCase()] || 0
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

  const handleNotebookClick = (notebook: typeof notebooks[0]) => {
    router.push(`/dashboard?tag=${notebook.id}`);
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
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            My Notebooks
          </h2>
          <p className="text-sm text-muted-foreground">
            Organize your notes by topic
          </p>
        </div>
        
        <Button
          onClick={() => setShowNotebookDialog(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create
        </Button>
      </div>

      {notebooks.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-muted-foreground">
            Create your first notebook to organize your notes!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notebooks.map((notebook) => (
            <div
              key={notebook.id}
              className={cn(
                'glass rounded-2xl p-4 border-2 transition-all hover:shadow-lg cursor-pointer',
                colorClasses[notebook.color as keyof typeof colorClasses] || colorClasses.lavender
              )}
              onClick={() => handleNotebookClick(notebook)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Folder className="h-5 w-5" />
                  <h3 className="font-semibold">{notebook.label}</h3>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-background/50">
                  {notebook.count} notes
                </span>
              </div>

              <p className="text-sm opacity-90">
                Click to view all notes in this notebook
              </p>
            </div>
          ))}
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