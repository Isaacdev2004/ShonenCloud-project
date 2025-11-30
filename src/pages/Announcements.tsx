import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Trash2, Megaphone } from "lucide-react";
import { resolveProfileImage } from "@/lib/profileImageResolver";
import logo from "@/assets/logo.png";
import storeButton from "@/assets/buttons/store-button.png";
import profileButton from "@/assets/buttons/profile-button.png";
import logoutButton from "@/assets/buttons/logout-button.png";
import uploadsButton from "@/assets/buttons/uploads-button.png";
import arenaButton from "@/assets/buttons/arena-button.png";
import chatButton from "@/assets/buttons/chat-button.png";
import mynmsButton from "@/assets/buttons/mynms-button.png";
import { RichTextEditor } from "@/components/RichTextEditor";

interface Profile {
  username: string;
  profile_picture_url: string;
}

interface Announcement {
  id: string;
  admin_id: string;
  title: string;
  message: string;
  created_at: string;
}

export default function Announcements() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAnnouncements();
      const channel = subscribeToAnnouncements();
      return () => {
        if (channel) {
          supabase.removeChannel(channel);
        }
      };
    }
  }, [user]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }
    setUser(user);

    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("username, profile_picture_url")
      .eq("id", user.id)
      .single();
    
    if (profileData) {
      setProfile(profileData);
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();
    
    setIsAdmin(!!roleData);
    setLoading(false);
  };

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from("admin_announcements")
      .select("*")
      .neq("title", "CloudO Message")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching announcements:", error);
      toast.error("Failed to load announcements");
    } else {
      setAnnouncements(data || []);
    }
  };

  const subscribeToAnnouncements = () => {
    const channel = supabase
      .channel("admin_announcements")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "admin_announcements"
        },
        (payload) => {
          const newAnnouncement = payload.new as Announcement;
          if (newAnnouncement.title !== "CloudO Message") {
            setAnnouncements((prev) => [newAnnouncement, ...prev]);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "admin_announcements"
        },
        (payload) => {
          setAnnouncements((prev) => prev.filter((a) => a.id !== payload.old.id));
        }
      )
      .subscribe();

    return channel;
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTitle.trim() || !newMessage.trim()) {
      toast.error("Please fill in both title and message");
      return;
    }

    const { error } = await supabase.from("admin_announcements").insert({
      admin_id: user.id,
      title: newTitle.trim(),
      message: newMessage.trim(),
    });

    if (error) {
      console.error("Error creating announcement:", error);
      toast.error("Failed to create announcement");
    } else {
      toast.success("Announcement created!");
      setNewTitle("");
      setNewMessage("");
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    const { error } = await supabase
      .from("admin_announcements")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting announcement:", error);
      toast.error("Failed to delete announcement");
    } else {
      toast.success("Announcement deleted");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <img src={logo} alt="ShonenCloud" className="w-24 h-24 mx-auto animate-pulse" />
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img src={logo} alt="ShonenCloud" className="h-12 cursor-pointer" onClick={() => navigate("/dashboard")} />
          <div className="flex gap-2 items-center flex-wrap">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={resolveProfileImage(profile?.profile_picture_url)} alt={profile?.username} />
                <AvatarFallback>{profile?.username?.[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm">Welcome, {profile?.username}</span>
            </div>
            {isAdmin && (
              <>
                <Button onClick={() => navigate("/admin")} variant="outline" size="sm">
                  Admin Panel
                </Button>
                <Button onClick={() => navigate("/create-post")} variant="outline" size="sm">
                  Create Post
                </Button>
              </>
            )}
            <button 
              onClick={() => navigate("/profile")} 
              className="transition-transform hover:scale-105 cursor-pointer"
            >
              <img src={profileButton} alt="Profile" className="h-12" />
            </button>
            <button 
              onClick={() => window.open('/arena', '_blank')} 
              className="transition-transform hover:scale-105 cursor-pointer"
            >
              <img src={arenaButton} alt="Arena" className="h-12" />
            </button>
            <button 
              onClick={() => navigate("/chat")} 
              className="transition-transform hover:scale-105 cursor-pointer"
            >
              <img src={chatButton} alt="Chat" className="h-12" />
            </button>
            <button 
              onClick={() => navigate("/techniques")} 
              className="transition-transform hover:scale-105 cursor-pointer"
            >
              <img src={uploadsButton} alt="Uploads" className="h-12" />
            </button>
            <button 
              onClick={() => navigate("/store")} 
              className="transition-transform hover:scale-105 cursor-pointer"
            >
              <img src={storeButton} alt="The Yards" className="h-12" />
            </button>
            <button
              onClick={() => navigate("/inbox")}
              className="transition-transform hover:scale-105 cursor-pointer"
            >
              <img src={mynmsButton} alt="My NM's" className="h-12" />
            </button>
            <button 
              onClick={handleLogout} 
              className="transition-transform hover:scale-105 cursor-pointer"
            >
              <img src={logoutButton} alt="Logout" className="h-12" />
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {isAdmin && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Create New Announcement</h2>
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <Input
                placeholder="Announcement Title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                maxLength={100}
              />
              <RichTextEditor
                content={newMessage}
                onChange={setNewMessage}
                placeholder="Announcement Message"
              />
              <Button type="submit" className="w-full">
                <Megaphone className="mr-2 h-4 w-4" />
                Post Announcement
              </Button>
            </form>
          </Card>
        )}

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">All Announcements</h2>
          {announcements.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No announcements yet</p>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4 pr-4">
                {announcements.map((announcement) => (
                  <Card key={announcement.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Megaphone className="w-5 h-5 text-primary" />
                          <h3 className="text-lg font-bold">{announcement.title}</h3>
                        </div>
                        <div 
                          className="prose prose-sm max-w-none mb-3"
                          dangerouslySetInnerHTML={{ __html: announcement.message }}
                        />
                        <p className="text-xs text-muted-foreground">
                          {new Date(announcement.created_at).toLocaleString()}
                        </p>
                      </div>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
}
