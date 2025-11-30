import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
