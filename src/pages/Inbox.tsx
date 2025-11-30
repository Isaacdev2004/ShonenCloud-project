import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Send, Trash2 } from "lucide-react";
import { resolveProfileImage } from "@/lib/profileImageResolver";

interface PrivateMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_profile?: {
    username: string;
    profile_picture_url: string;
  };
  receiver_profile?: {
    username: string;
    profile_picture_url: string;
  };
}

export default function Inbox() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const recipientId = searchParams.get("recipient");

  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Map<string, PrivateMessage[]>>(new Map());
  const [selectedUserId, setSelectedUserId] = useState<string | null>(recipientId);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }
    setUser(user);
    fetchMessages(user.id);
    subscribeToMessages(user.id);
  };

  const fetchMessages = async (userId: string) => {
    const { data, error } = await supabase
      .from("private_messages")
      .select("*")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
      setLoading(false);
      return;
    }

    // Fetch profiles separately
    const userIds = new Set<string>();
    data?.forEach(msg => {
      userIds.add(msg.sender_id);
      userIds.add(msg.receiver_id);
    });

    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, username, profile_picture_url")
      .in("id", Array.from(userIds));

    const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

    const messagesWithProfiles = data?.map(msg => ({
      ...msg,
      sender_profile: profilesMap.get(msg.sender_id),
      receiver_profile: profilesMap.get(msg.receiver_id)
    })) as PrivateMessage[];

    organizeConversations(messagesWithProfiles || [], userId);
    setLoading(false);
  };

  const organizeConversations = (messages: PrivateMessage[], currentUserId: string) => {
    const convMap = new Map<string, PrivateMessage[]>();
    
    messages.forEach((msg) => {
      const otherUserId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
      if (!convMap.has(otherUserId)) {
        convMap.set(otherUserId, []);
      }
      convMap.get(otherUserId)!.push(msg);
    });

    setConversations(convMap);
  };

  const subscribeToMessages = (userId: string) => {
    const channel = supabase
      .channel("private_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "private_messages",
          filter: `receiver_id=eq.${userId}`
        },
        async (payload) => {
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("username, profile_picture_url")
            .eq("id", payload.new.sender_id)
            .single();

          if (senderProfile) {
            const newMsg = { ...payload.new, sender_profile: senderProfile } as any;
            setConversations((prev) => {
              const newMap = new Map(prev);
              const msgs = newMap.get(payload.new.sender_id) || [];
              newMap.set(payload.new.sender_id, [...msgs, newMsg]);
              return newMap;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId) return;

    const { error } = await supabase
      .from("private_messages")
      .insert({
        sender_id: user.id,
        receiver_id: selectedUserId,
        message: newMessage.trim()
      });

    if (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } else {
      setNewMessage("");
      fetchMessages(user.id);
    }
  };

  const handleDeleteConversation = async (userId: string) => {
    const { error } = await supabase
      .from("private_messages")
      .delete()
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`);

    if (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation");
    } else {
      setConversations((prev) => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });
      if (selectedUserId === userId) {
        setSelectedUserId(null);
      }
      toast.success("Conversation deleted");
    }
  };

  const markAsRead = async (messageIds: string[]) => {
    await supabase
      .from("private_messages")
      .update({ is_read: true })
      .in("id", messageIds);
  };

  const getUnreadCount = (userId: string) => {
    const msgs = conversations.get(userId) || [];
    return msgs.filter(m => m.receiver_id === user?.id && !m.is_read).length;
  };

  const selectedConversation = selectedUserId ? conversations.get(selectedUserId) || [] : [];
  const otherUserProfile = selectedConversation[0]?.sender_id === user?.id
    ? selectedConversation[0]?.receiver_profile
    : selectedConversation[0]?.sender_profile;

  useEffect(() => {
    if (selectedUserId && user) {
      const unreadMessages = selectedConversation
        .filter(m => m.receiver_id === user.id && !m.is_read)
        .map(m => m.id);
      if (unreadMessages.length > 0) {
        markAsRead(unreadMessages);
      }
    }
  }, [selectedUserId, selectedConversation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading inbox...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Private Messages</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <h2 className="font-semibold mb-4">Conversations</h2>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-2">
                {Array.from(conversations.entries()).map(([userId, messages]) => {
                  const lastMsg = messages[messages.length - 1];
                  const profile = lastMsg.sender_id === user?.id
                    ? lastMsg.receiver_profile
                    : lastMsg.sender_profile;
                  const unreadCount = getUnreadCount(userId);

                  return (
                    <div
                      key={userId}
                      className={`p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                        selectedUserId === userId ? 'bg-accent' : ''
                      }`}
                      onClick={() => setSelectedUserId(userId)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar 
                          className="h-20 w-20 cursor-pointer flex-shrink-0"
                          onClick={() => navigate(`/profile?user=${userId}`)}
                        >
                          <AvatarImage src={resolveProfileImage(profile?.profile_picture_url)} />
                          <AvatarFallback className="text-xl">{profile?.username?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p 
                              className="font-semibold truncate cursor-pointer hover:underline"
                              onClick={() => navigate(`/profile?user=${userId}`)}
                            >
                              {profile?.username}
                            </p>
                            {unreadCount > 0 && (
                              <Badge variant="destructive" className="ml-2">
                                {unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {lastMsg.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </Card>

          <Card className="md:col-span-2 flex flex-col h-[calc(100vh-160px)]">
            {selectedUserId ? (
              <>
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar 
                      className="h-20 w-20 cursor-pointer flex-shrink-0"
                      onClick={() => navigate(`/profile?user=${selectedUserId}`)}
                    >
                      <AvatarImage src={resolveProfileImage(otherUserProfile?.profile_picture_url)} />
                      <AvatarFallback className="text-xl">{otherUserProfile?.username?.[0]}</AvatarFallback>
                    </Avatar>
                    <h3 
                      className="font-semibold cursor-pointer hover:underline"
                      onClick={() => navigate(`/profile?user=${selectedUserId}`)}
                    >
                      {otherUserProfile?.username}
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteConversation(selectedUserId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {selectedConversation.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            msg.sender_id === user?.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <form onSubmit={handleSendMessage} className="p-4 border-t">
                  <div className="flex gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="min-h-[60px]"
                      maxLength={1000}
                    />
                    <Button type="submit" disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a conversation to view messages
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
