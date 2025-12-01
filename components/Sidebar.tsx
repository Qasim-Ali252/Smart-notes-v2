'use client'
import { Home, Star, Clock, Folder, Tag, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SidebarProps {
  className?: string;
}

export const Sidebar = ({ className }: SidebarProps) => {
  const [activeView, setActiveView] = useState("all");

  const views = [
    { id: "all", icon: Home, label: "All Notes", count: 0 },
    { id: "favorites", icon: Star, label: "Favorites", count: 0 },
    { id: "recent", icon: Clock, label: "Recent", count: 0 },
  ];

  const notebooks = [
    { id: "personal", label: "Personal", count: 0, color: "lavender" },
    { id: "work", label: "Work", count: 0, color: "mint" },
    { id: "ideas", label: "Ideas", count: 0, color: "peach" },
  ];

  const tags = [
    { id: "marketing", label: "Marketing", count: 0, color: "sky" },
    { id: "design", label: "Design", count: 0, color: "rose" },
    { id: "meetings", label: "Meetings", count: 0, color: "lavender" },
  ];

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
                  "w-full justify-start gap-3 hover:bg-sidebar-accent",
                  activeView === view.id && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
                onClick={() => setActiveView(view.id)}
              >
                <view.icon className="h-4 w-4" />
                <span className="flex-1 text-left text-sm">{view.label}</span>
                <span className="text-xs text-muted-foreground">{view.count}</span>
              </Button>
            ))}
          </div>

          <Separator className="bg-border/50" />

          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 mb-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Notebooks
              </h4>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {notebooks.map((notebook) => (
              <Button
                key={notebook.id}
                variant="ghost"
                className="w-full justify-start gap-3 hover:bg-sidebar-accent"
              >
                <Folder className="h-4 w-4" />
                <span className="flex-1 text-left text-sm">{notebook.label}</span>
                <span className="text-xs text-muted-foreground">{notebook.count}</span>
              </Button>
            ))}
          </div>

          <Separator className="bg-border/50" />

          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 mb-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tags
              </h4>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {tags.map((tag) => (
              <Button
                key={tag.id}
                variant="ghost"
                className="w-full justify-start gap-3 hover:bg-sidebar-accent"
              >
                <Tag className="h-3.5 w-3.5" />
                <span className="flex-1 text-left text-sm">{tag.label}</span>
                <span className="text-xs text-muted-foreground">{tag.count}</span>
              </Button>
            ))}
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
};
