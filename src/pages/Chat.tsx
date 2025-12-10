import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Send, Trash2 } from "lucide-react";

interface Profile {
  username: string;
  profile_picture_url: string;
}
import logo from "@/assets/logo.png";
import storeButton from "@/assets/buttons/store-button.png";
import profileButton from "@/assets/buttons/profile-button.png";
import logoutButton from "@/assets/buttons/logout-button.png";
import uploadsButton from "@/assets/buttons/uploads-button.png";
import arenaButton from "@/assets/buttons/arena-button.png";
import chatButton from "@/assets/buttons/chat-button.png";
import mynmsButton from "@/assets/buttons/mynms-button.png";
import { resolveProfileImage } from "@/lib/profileImageResolver";

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles: {
    username: string;
    profile_picture_url: string;
    discipline: string;
  };
}

interface UserBan {
  user_id: string;
}

const DISCIPLINE_COLORS: Record<string, string> = {
  'Shadow': '#432A76',
  'All-Seeing': '#808080',
  'Titan': '#00FF00',
  'Emperor': '#0000FF',
  'Finisher': '#FF0000',
  'Lightbringer': '#FFA500',
};


export default function Chat() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const channel = subscribeToMessages();
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

    // Check if user is banned
    const { data: banData } = await supabase
      .from("user_bans")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    
    setIsBanned(!!banData);

    // Check admin status
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    
    setIsAdmin(!!roleData);
    
    await fetchMessages();
  };

  const fetchMessages = async () => {
    // Fetch raw messages first (no joins)
    const { data: msgs, error: msgErr } = await supabase
      .from("global_chat_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(100);

    if (msgErr) {
      console.error("Error fetching messages:", msgErr);
      toast.error("Failed to load messages");
      setLoading(false);
      return;
    }

    const userIds = Array.from(new Set((msgs || []).map((m: any) => m.user_id)));

    // Fetch needed profile fields separately since no FK exists
    let profileMap: Record<string, { username: string; profile_picture_url: string; discipline: string } > = {};
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, profile_picture_url, discipline")
        .in("id", userIds);
      if (profilesData) {
        profileMap = profilesData.reduce((acc: any, p: any) => {
          acc[p.id] = {
            username: p.username,
            profile_picture_url: p.profile_picture_url,
            discipline: p.discipline,
          };
          return acc;
        }, {} as Record<string, any>);
      }
    }

const merged = (msgs || []).map((m: any) => {
  const profile = profileMap[m.user_id] || { username: "Unknown", profile_picture_url: "", discipline: "All-Seeing" };
  const actualImageUrl = resolveProfileImage(profile.profile_picture_url);
  return {
    ...m,
    profiles: {
      ...profile,
      profile_picture_url: actualImageUrl,
    },
  };
});

    setMessages(merged);
    setLoading(false);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("global_chat")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "global_chat_messages"
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, profile_picture_url, discipline")
            .eq("id", payload.new.user_id)
            .maybeSingle();

if (profile) {
  const actualImageUrl = resolveProfileImage(profile.profile_picture_url as string);
  setMessages((prev) => [
    ...prev,
    { ...payload.new, profiles: { ...profile, profile_picture_url: actualImageUrl } } as any
  ]);
}
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "global_chat_messages"
        },
        (payload) => {
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
        }
      )
      .subscribe();

    return channel;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isBanned) return;

    const { error } = await supabase
      .from("global_chat_messages")
      .insert({
        user_id: user.id,
        message: newMessage.trim()
      });

    if (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } else {
      setNewMessage("");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from("global_chat_messages")
      .delete()
      .eq("id", messageId);

    if (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    } else {
      toast.success("Message deleted");
    }
  };

  const handleUsernameClick = (userId: string) => {
    navigate(`/profile?user=${userId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading chat...</div>
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
                <AvatarImage src={resolveProfileImage(profile?.profile_picture_url, profile?.username)} alt={profile?.username} />
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

      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Global Chat</h1>

        {isBanned && (
          <Card className="p-4 mb-4 bg-destructive/10 border-destructive">
            <p className="text-destructive font-semibold">
              You have been banned from chat
            </p>
          </Card>
        )}

        <Card className="flex flex-col h-[calc(100vh-160px)]">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="flex gap-3 items-start group">
                  <Avatar className="h-20 w-20 cursor-pointer flex-shrink-0" onClick={() => handleUsernameClick(msg.user_id)}>
                    <AvatarImage src={msg.profiles.profile_picture_url} alt={`${msg.profiles.username} avatar`} onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }} />
                    <AvatarFallback className="text-xl">{msg.profiles.username[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-2 h-2 rounded-full`}
                          style={{ backgroundColor: DISCIPLINE_COLORS[msg.profiles.discipline] || '#808080' }}
                        />
                        <span
                          className="font-semibold cursor-pointer hover:underline"
                          onClick={() => handleUsernameClick(msg.user_id)}
                        >
                          {msg.profiles.username}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{msg.message}</p>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteMessage(msg.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          <form onSubmit={handleSendMessage} className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isBanned ? "You are banned" : "Type a message..."}
                disabled={isBanned}
                maxLength={500}
              />
              <Button type="submit" disabled={isBanned || !newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
