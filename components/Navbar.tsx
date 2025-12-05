'use client'
import { Bell, Plus, LogOut, User as UserIcon, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { SearchBar } from "./SearchBar";
import { SignInDialog } from "./SignInDialog";
import { ThemeToggle } from "./theme-toggle";

export const Navbar = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        router.refresh(); // Refresh the page data when user signs in
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSignInOpen(true); // Open the OTP dialog instead of redirecting
    router.push('/'); // Go to home page
  };

  const initials = user?.email?.substring(0, 2).toUpperCase() || 'U';

  return (
    <nav className="sticky top-0 z-50 h-16 glass-strong border-b border-border/50">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, oklch(55% 0.18 280), oklch(60% 0.20 280))'
          }}>
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-semibold text-lg hidden sm:inline">
            Smart Notes
          </span>
        </div>

        <SearchBar />

        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          <Button 
            size="sm" 
            onClick={() => {
              if (user) {
                router.push('/notes/new')
              } else {
                setSignInOpen(true)
              }
            }}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground spring-bounce hidden sm:flex"
          >
            <Plus className="h-4 w-4" />
            New Note
          </Button>
          
          {user ? (
            <>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">My Account</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSignInOpen(true)}
              className="gap-2"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>

      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </nav>
  );
};
