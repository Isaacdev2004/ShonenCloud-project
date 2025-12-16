import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import AdminPanel from "./pages/AdminPanel";
import CreatePost from "./pages/CreatePost";
import Arena from "./pages/Arena";
import Chat from "./pages/Chat";
import Inbox from "./pages/Inbox";
import Store from "./pages/Store";
import Announcements from "./pages/Announcements";
import Techniques from "./pages/Techniques";
import MentorChange from "./pages/MentorChange";
import MissionsHub from "./pages/MissionsHub";
import DataMission from "./pages/DataMission";
import WorldMission from "./pages/WorldMission";
import Cloudopedia from "./pages/Cloudopedia";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to handle auth state changes and errors
const AuthHandler = () => {
  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        // Clear any invalid tokens from storage
        try {
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.includes('supabase.auth.token')) {
              localStorage.removeItem(key);
            }
          });
        } catch (err) {
          // Ignore storage errors
        }
      }
    });

    // Suppress console errors for invalid refresh tokens
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const errorString = args.join(' ');
      // Suppress Supabase refresh token errors
      if (errorString.includes('Invalid Refresh Token') || 
          errorString.includes('Refresh Token Not Found') ||
          errorString.includes('AuthApiError')) {
        // Silently handle - we'll redirect user if needed
        return;
      }
      // Log other errors normally
      originalError.apply(console, args);
    };

    // Periodically check for invalid sessions and redirect if needed
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error && (error.message?.includes('Invalid Refresh Token') || 
                      error.message?.includes('Refresh Token Not Found'))) {
          // Clear invalid session
          await supabase.auth.signOut();
          // Only redirect if not already on login/signup/index page
          const currentPath = window.location.pathname;
          if (!['/login', '/signup', '/'].includes(currentPath)) {
            window.location.href = '/login';
          }
        }
      } catch (err) {
        // Silently handle errors
      }
    };

    // Check session on mount and every 5 minutes
    checkSession();
    const interval = setInterval(checkSession, 300000); // 5 minutes

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
      console.error = originalError; // Restore original console.error
    };
  }, []);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthHandler />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/arena" element={<Arena />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/store" element={<Store />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/techniques" element={<Techniques />} />
          <Route path="/mentor-change" element={<MentorChange />} />
          <Route path="/missions" element={<MissionsHub />} />
          <Route path="/mission/data" element={<DataMission />} />
          <Route path="/mission/world" element={<WorldMission />} />
          <Route path="/cloudopedia" element={<Cloudopedia />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
