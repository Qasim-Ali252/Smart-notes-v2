'use client'
import { Bell, Plus, LogOut, User as UserIcon, Settings, X, ExternalLink, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { WelcomeDialog } from "./WelcomeDialog";
import { ThemeToggle } from "./theme-toggle";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

export const Navbar = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  // Debug welcomeOpen state changes
  useEffect(() => {
    console.log('welcomeOpen state changed to:', welcomeOpen);
  }, [welcomeOpen]);

  useEffect(() => {
    const supabase = createClient();
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // Auto-open welcome dialog for new users (no authentication)
      if (!user) {
        setWelcomeOpen(true);
      }
    };
    
    getUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      console.log('Auth state change:', event, 'User:', !!session?.user);
      setUser(session?.user ?? null);
      
      // Only reload once after successful sign-in
      if (event === 'SIGNED_IN' && session?.user) {
        setWelcomeOpen(false); // Close welcome dialog when user signs in
        try {
          const hasReloaded = typeof window !== 'undefined' ? localStorage.getItem('hasReloadedAfterSignIn') : null;
          if (!hasReloaded && typeof window !== 'undefined') {
            localStorage.setItem('hasReloadedAfterSignIn', 'true');
            setTimeout(() => {
              window.location.reload();
            }, 500);
          }
        } catch (error) {
          console.log('localStorage not available, skipping reload');
        }
      }
      
      // Clear the reload flag when user signs out
      if (event === 'SIGNED_OUT') {
        console.log('SIGNED_OUT event detected');
        try {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('hasReloadedAfterSignIn');
          }
        } catch (error) {
          console.log('localStorage not available');
        }
        // Don't reset welcomeOpen here - let handleSignOut manage it
      }
      
      // Auto-open welcome dialog for unauthenticated users
      if (!session?.user && event !== 'SIGNED_OUT') {
        setWelcomeOpen(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleSignOut = async () => {
    console.log('Signing out...');
    
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    
    // Set welcome dialog to open AFTER signing out
    setTimeout(() => {
      setWelcomeOpen(true);
      console.log('Welcome dialog set to open');
    }, 200);
    
    // Don't navigate away - stay on current page
    // router.push('/'); 
  };

  const handleWelcomeSignIn = () => {
    setWelcomeOpen(false);
    setSignInOpen(true);
  };

  const initials = user?.email?.substring(0, 2).toUpperCase() || 'U';

  const handleNotificationAction = (notification: any) => {
    if (notification.action) {
      router.push(notification.action.href);
    }
    markAsRead(notification.id);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return '🎉';
      case 'reminder':
        return '⏰';
      case 'suggestion':
        return '💡';
      default:
        return '📝';
    }
  };

  return (
    <nav className="sticky top-0 z-50 h-16 glass-strong border-b border-border/50">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:scale-105 transition-transform cursor-pointer" 
            style={{
              background: 'linear-gradient(135deg, oklch(55% 0.18 280), oklch(60% 0.20 280))'
            }}
          >
            <span className="text-white font-bold text-sm">S</span>
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="font-semibold text-lg hidden sm:inline hover:text-primary transition-colors cursor-pointer"
          >
            Smart Notes
          </button>
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {notifications.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="h-6 px-2 text-xs"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Clear all
                      </Button>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notifications</p>
                      <p className="text-xs">You're all caught up!</p>
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            "p-3 border-b border-border/50 hover:bg-muted/50 transition-colors",
                            notification.priority === 'high' && "border-l-4 border-l-destructive",
                            notification.priority === 'medium' && "border-l-4 border-l-primary",
                            notification.priority === 'low' && "border-l-4 border-l-muted-foreground"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-lg shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-medium text-sm leading-tight">
                                  {notification.title}
                                </h4>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 shrink-0"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                {notification.message}
                              </p>
                              {notification.action && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-2 h-7 text-xs gap-1"
                                  onClick={() => handleNotificationAction(notification)}
                                >
                                  {notification.action.label}
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">
                        {user?.user_metadata?.display_name || 'My Account'}
                      </p>
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
                  <DropdownMenuItem onClick={() => router.push('/settings')}>
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
      <WelcomeDialog 
        open={welcomeOpen} 
        onOpenChange={setWelcomeOpen}
        onSignInClick={handleWelcomeSignIn}
      />
    </nav>
  );
};
