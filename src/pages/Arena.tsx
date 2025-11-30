import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { resolveProfileImage } from "@/lib/profileImageResolver";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ZONE_IMAGE_LIST } from "@/constants/zoneImages";
import arenaBanner from "@/assets/arena-banner.png";

interface Profile {
  id: string;
  username: string;
  profile_picture_url: string;
  health: number;
  armor: number;
  energy: number;
  discipline: string;
}

interface UserTitle {
  title: string;
  expires_at: string;
  image_url: string | null;
}

interface PlayerPosition {
  user_id: string;
  zone_id: string;
  profiles: Profile;
}

interface Zone {
  id: string;
  name: string;
}

interface ArenaPost {
  id: string;
  user_id: string;
  zone_id: string;
  technique_name: string;
  description: string;
  created_at: string;
  profiles: {
    username: string;
    profile_picture_url: string;
    discipline: string;
  };
}

const Arena = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string>("");
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [health, setHealth] = useState(100);
  const [armor, setArmor] = useState(0);
  const [energy, setEnergy] = useState(10);
  const [currentZone, setCurrentZone] = useState<string>("");
  const [playerPositions, setPlayerPositions] = useState<PlayerPosition[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [arenaMessage, setArenaMessage] = useState<string | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [userTechniques, setUserTechniques] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [includeDiceRoll, setIncludeDiceRoll] = useState(false);
  const [selectedTechnique, setSelectedTechnique] = useState<string | null>(null);
  const [arenaPosts, setArenaPosts] = useState<ArenaPost[]>([]);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [playerTitles, setPlayerTitles] = useState<Record<string, UserTitle>>({});
  const [userActiveTitles, setUserActiveTitles] = useState<Array<{ title: string; image_url: string | null }>>([]);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTarget, setCurrentTarget] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      
      // Check if user is banned
      const { data: banData } = await supabase
        .from("user_bans")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (banData) {
        toast({
          title: "Access Denied",
          description: "You have been banned from the Arena",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setUserId(user.id);
      fetchZones();
      fetchProfile(user.id);
      fetchPlayerPositions();
      fetchArenaMessage();
      fetchUserTechniques(user.id);
      fetchArenaPosts();
      checkAdminStatus(user.id);
      fetchPlayerTitles();
      fetchUserActiveTitles(user.id);
      fetchNotifications(user.id);
      fetchCurrentTarget(user.id);
    };
    fetchUser();
  }, [navigate]);

  // Real-time subscription for notifications
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newNotification = payload.new;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          toast({
            title: "New Notification",
            description: newNotification.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchZones = async () => {
    const { data, error } = await supabase
      .from("arena_zones")
      .select("id, name")
      .order("name");

    if (error) {
      console.error("Error fetching zones:", error);
      return;
    }

    if (data) {
      setZones(data);
    }
  };

  const fetchProfile = async (id: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return;
    }

    if (data) {
      setCurrentProfile(data);
      setHealth(data.health);
      setArmor(data.armor);
      setEnergy(data.energy);

      // Check if player has a position, if not create one
      const { data: posData } = await supabase
        .from("player_positions")
        .select("zone_id")
        .eq("user_id", id)
        .maybeSingle();

      if (posData) {
        setCurrentZone(posData.zone_id);
      } else {
        // Create initial position with first zone
        const { data: zonesData } = await supabase
          .from("arena_zones")
          .select("id")
          .order("name")
          .limit(1)
          .single();

        if (zonesData) {
          await supabase.from("player_positions").insert({
            user_id: id,
            zone_id: zonesData.id,
          });
          setCurrentZone(zonesData.id);
        }
      }
    }
  };

  const fetchPlayerPositions = async () => {
    const { data: positions, error: posError } = await supabase
      .from("player_positions")
      .select("user_id, zone_id");

    if (posError) {
      console.error("Error fetching player positions:", posError);
      return;
    }

    if (positions && positions.length > 0) {
      const userIds = positions.map(p => p.user_id);
      const { data: profiles, error: profError } = await supabase
        .from("profiles")
        .select("id, username, profile_picture_url, health, armor, energy, discipline")
        .in("id", userIds);

      if (profError) {
        console.error("Error fetching profiles:", profError);
        return;
      }

      const combined = positions.map(pos => ({
        user_id: pos.user_id,
        zone_id: pos.zone_id,
        profiles: profiles?.find(p => p.id === pos.user_id)!
      }));

      setPlayerPositions(combined);
    }
  };

  useEffect(() => {
    const positionsChannel = supabase
      .channel("player_positions_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "player_positions",
        },
        () => {
          fetchPlayerPositions();
        }
      )
      .subscribe();

    const profilesChannel = supabase
      .channel("profiles_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        () => {
          fetchPlayerPositions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(positionsChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, []);

  const handleUpdateStats = async () => {
    if (!userId) return;

    const { error } = await supabase
      .from("profiles")
      .update({ health, armor, energy })
      .eq("id", userId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update stats",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Stats updated successfully",
    });

    fetchProfile(userId);
    fetchPlayerPositions();
  };

  const handleZoneChange = async (zoneId: string) => {
    if (!userId) return;

    const { error } = await supabase
      .from("player_positions")
      .update({ zone_id: zoneId, last_moved_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to change zone",
        variant: "destructive",
      });
      return;
    }

    setCurrentZone(zoneId);
    toast({
      title: "Zone Changed",
      description: `Moved to ${zones.find((z) => z.id === zoneId)?.name}`,
    });
  };

  const getPlayersInZone = (zoneId: string) => {
    return playerPositions.filter((p) => p.zone_id === zoneId);
  };

  const fetchArenaMessage = async () => {
    const { data, error } = await supabase
      .from("arena_admin_messages")
      .select("message")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching arena message:", error);
      return;
    }

    if (data) {
      setArenaMessage(data.message);
    }
  };

  const fetchUserTechniques = async (userId: string) => {
    // First, get user's current mentors
    const { data: userMentorsData, error: mentorsError } = await supabase
      .from("user_mentors")
      .select("mentor_id")
      .eq("user_id", userId);

    if (mentorsError) {
      console.error("Error fetching user mentors:", mentorsError);
      return;
    }

    const currentMentorIds = userMentorsData?.map(um => um.mentor_id) || [];

    // Then get techniques, including mentor_id
    const { data, error } = await supabase
      .from("user_techniques")
      .select(`
        technique_id,
        techniques (
          id,
          name,
          description,
          cep,
          type_info,
          image_url,
          mentor_id
        )
      `)
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching user techniques:", error);
      return;
    }

    if (data) {
      // Filter to only include techniques from current mentors
      const filteredTechniques = data
        .map(item => item.techniques)
        .filter(Boolean)
        .filter(tech => currentMentorIds.includes(tech.mentor_id));
      
      setUserTechniques(filteredTechniques);
    }
  };

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  const fetchNotifications = async (userId: string) => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching notifications:", error);
      return;
    }

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  const fetchCurrentTarget = async (userId: string) => {
    const { data, error } = await supabase
      .from("player_targets")
      .select("target_user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching current target:", error);
      return;
    }

    if (data) {
      setCurrentTarget(data.target_user_id);
    }
  };

  const handleTargetPlayer = async (targetUserId: string) => {
    if (!userId || !currentProfile) return;

    // Don't target yourself
    if (targetUserId === userId) {
      toast({
        title: "Cannot target yourself",
        variant: "destructive",
      });
      return;
    }

    const oldTarget = currentTarget;

    // If clicking the same target, untarget
    if (currentTarget === targetUserId) {
      const { error } = await supabase
        .from("player_targets")
        .delete()
        .eq("user_id", userId);

      if (error) {
        console.error("Error removing target:", error);
        return;
      }

      setCurrentTarget(null);
      
      // Send untarget notification
      await supabase.from("notifications").insert({
        user_id: targetUserId,
        message: `${currentProfile.username} is no longer targeting you`,
        type: "target"
      });

      toast({
        title: "Target removed",
      });
      return;
    }

    // Set new target
    const { error } = await supabase
      .from("player_targets")
      .upsert({
        user_id: userId,
        target_user_id: targetUserId
      });

    if (error) {
      console.error("Error setting target:", error);
      return;
    }

    setCurrentTarget(targetUserId);

    // Send notification to old target if exists
    if (oldTarget) {
      await supabase.from("notifications").insert({
        user_id: oldTarget,
        message: `${currentProfile.username} is no longer targeting you`,
        type: "target"
      });
    }

    // Send notification to new target
    await supabase.from("notifications").insert({
      user_id: targetUserId,
      message: `${currentProfile.username} is now targeting you`,
      type: "target"
    });

    toast({
      title: "Target locked",
      description: "Notification sent to target",
    });
  };

  const markAllAsRead = async () => {
    if (!userId) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("Error marking notifications as read:", error);
      return;
    }

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const fetchPlayerTitles = async () => {
    const { data, error } = await supabase
      .from("user_titles")
      .select("user_id, title, expires_at")
      .gt("expires_at", new Date().toISOString());

    if (!error && data && data.length > 0) {
      // Fetch store items to get image URLs
      const { data: storeData, error: storeError } = await supabase
        .from("store_items")
        .select("name, image_url")
        .eq("type", "title")
        .in("name", data.map(t => t.title));

      const titlesMap: Record<string, UserTitle> = {};
      data.forEach((title: any) => {
        const storeItem = storeData?.find(s => s.name === title.title);
        titlesMap[title.user_id] = {
          title: title.title,
          expires_at: title.expires_at,
          image_url: storeItem?.image_url || null,
        };
      });
      setPlayerTitles(titlesMap);
    }
  };

  const fetchUserActiveTitles = async (userId: string) => {
    const { data: titlesData, error: titlesError } = await supabase
      .from("user_titles")
      .select("title")
      .eq("user_id", userId)
      .gt("expires_at", new Date().toISOString());

    if (titlesError || !titlesData || titlesData.length === 0) {
      setUserActiveTitles([]);
      return;
    }

    // Fetch store items to get image URLs
    const { data: storeData, error: storeError } = await supabase
      .from("store_items")
      .select("name, image_url")
      .eq("type", "title")
      .in("name", titlesData.map(t => t.title));

    if (!storeError && storeData) {
      const titlesWithImages = titlesData.map(t => {
        const storeItem = storeData.find(s => s.name === t.title);
        return {
          title: t.title,
          image_url: storeItem?.image_url || null
        };
      });
      setUserActiveTitles(titlesWithImages);
    }
  };

  const handleDeleteArenaPost = async (postId: string) => {
    const { error } = await supabase
      .from("arena_posts")
      .delete()
      .eq("id", postId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Post deleted",
      });
    }
  };

  const getStatusOptions = () => {
    const discipline = currentProfile?.discipline || "";
    const evasionDescription = ["Shadow", "Emperor", "Finisher"].includes(discipline)
      ? "Fully untargettable for 2 turns"
      : "Absorb all attacks and convert to extra health next turn";

    return [
      { value: "Observing zones", label: "Observing zones", description: "Watching the battlefield" },
      { value: "Training", label: "Training", description: "Improving techniques" },
      { value: "Resting", label: "Resting", description: "Recovering energy" },
      { value: "Searching for opponents", label: "Searching for opponents", description: "Looking for a fight" },
      { value: "Preparing techniques", label: "Preparing techniques", description: "Getting ready to attack" },
      { value: "On guard", label: "On guard", description: "Defensive stance" },
      { value: "Meditating", label: "Meditating", description: "Focusing energy" },
      { value: "Ready to battle", label: "Ready to battle", description: "Fully prepared" },
      { value: "Evasion Mode", label: "Evasion Mode", description: evasionDescription },
    ];
  };

  const fetchArenaPosts = async () => {
    const { data, error } = await supabase
      .from("arena_posts")
      .select(
        `id, user_id, zone_id, technique_name, description, created_at`
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching arena posts:", error);
      return;
    }

    if (!data || data.length === 0) {
      setArenaPosts([]);
      return;
    }

    const userIds = Array.from(new Set(data.map((post) => post.user_id)));

    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username, profile_picture_url, discipline")
      .in("id", userIds);

    if (profilesError) {
      console.error("Error fetching profiles for arena posts:", profilesError);
      return;
    }

    const profileMap = new Map(
      (profilesData || []).map((p) => [p.id, p])
    );

    const postsWithProfiles = data.map((post: any) => ({
      ...post,
      profiles: profileMap.get(post.user_id) || {
        username: "Unknown",
        profile_picture_url: "",
        discipline: "",
      },
    }));

    setArenaPosts(postsWithProfiles as any);
  };
  useEffect(() => {
    const postsChannel = supabase
      .channel("arena_posts_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "arena_posts",
        },
        () => {
          fetchArenaPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
    };
  }, []);

  const handleTakeAction = async () => {
    console.log("handleTakeAction called", { userId, currentZone, selectedStatus });

    if (!userId) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    if (!currentZone) {
      toast({
        title: "Error",
        description: "No zone selected. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedStatus) {
      toast({
        title: "Error",
        description: "Please select a status",
        variant: "destructive",
      });
      return;
    }

    let diceResult = null;
    if (includeDiceRoll) {
      diceResult = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
    }

    let techniqueName = "Action";
    let description = "";
    let techniqueData = null;

    // Get technique data if selected
    if (selectedTechnique) {
      techniqueData = userTechniques.find(t => t.id === selectedTechnique);
      techniqueName = techniqueData?.name || "Technique";
      
      // Add full technique info
      if (techniqueData) {
        description = `**${techniqueData.name}**\n`;
        if (techniqueData.image_url) {
          description += `![${techniqueData.name}](${techniqueData.image_url})\n`;
        }
        description += `${techniqueData.description}\n`;
        description += `**CEP:** ${techniqueData.cep} **Tags:** ${techniqueData.type_info}\n`;
      }
    }

    // Handle selected action
    if (selectedAction === "change-zone") {
      techniqueName = techniqueData ? `${techniqueData.name} + Zone Change` : "Zone Change";
      description += description ? "\n**Action:** I'm changing zones." : "**Action:** I'm changing zones.";
    } else if (selectedAction === "gather-energy") {
      techniqueName = techniqueData ? `${techniqueData.name} + Gather Energy` : "Gather Energy";
      description += description ? "\n**Action:** I gathered full energy." : "**Action:** I gathered full energy.";
    } else if (selectedAction === "move-around") {
      const moveMessages = [
        "Moving to a better position.",
        "Circling around the arena.",
        "Repositioning for advantage.",
        "Taking a tactical position.",
        "Moving with purpose.",
        "Shifting stance.",
      ];
      const moveMessage = moveMessages[Math.floor(Math.random() * moveMessages.length)];
      techniqueName = techniqueData ? `${techniqueData.name} + Move Around` : "Move Around";
      description += description ? `\n**Action:** ${moveMessage}` : `**Action:** ${moveMessage}`;
    }

    // Add status to description
    description += `\n**Status:** ${selectedStatus}`;

    // Add dice roll if selected
    if (includeDiceRoll) {
      description += `\n**Dice Roll:** ${diceResult}`;
    }

    console.log("Attempting to insert arena post", {
      user_id: userId,
      zone_id: currentZone,
      technique_name: techniqueName,
      description: description,
    });

    const { error } = await supabase
      .from("arena_posts")
      .insert({
        user_id: userId,
        zone_id: currentZone,
        technique_name: techniqueName,
        description: description,
      });

    if (error) {
      console.error("Error posting action:", error);
      toast({
        title: "Error",
        description: `Failed to post action: ${error.message}`,
        variant: "destructive",
      });
      return;
    }

    console.log("Arena post successful, updating profile status");

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ arena_status: selectedStatus })
      .eq("id", userId);

    if (profileError) {
      console.error("Error updating profile status:", profileError);
    }

    toast({
      title: "Success",
      description: "Action posted successfully!",
    });

    setShowActionDialog(false);
    setSelectedTechnique(null);
    setSelectedStatus("");
    setIncludeDiceRoll(false);
    setSelectedAction(null);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center mb-8">
          <img src={arenaBanner} alt="Arena" className="h-24 object-contain" />
        </div>

        {/* Admin Message Section */}
        {arenaMessage && (
          <Card className="mb-6 border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Admin Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: arenaMessage }}
              />
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Section 1: Player Stats */}
          <div className="lg:col-span-1">
            <div className="border-2 border-border rounded-lg p-6 bg-card">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="w-16 h-16 border-2 border-primary">
                  <AvatarImage
                    src={resolveProfileImage(currentProfile?.profile_picture_url || "")}
                    alt="Your profile"
                  />
                  <AvatarFallback>
                    {currentProfile?.username?.substring(0, 2).toUpperCase() || "??"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground mb-4">Your Stats</h2>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <label className="w-20 text-sm font-medium text-foreground">Health</label>
                  <Input
                    type="number"
                    value={health}
                    onChange={(e) => setHealth(Number(e.target.value))}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-20 text-sm font-medium text-foreground">Armor</label>
                  <Input
                    type="number"
                    value={armor}
                    onChange={(e) => setArmor(Number(e.target.value))}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-20 text-sm font-medium text-foreground">Energy</label>
                  <Input
                    type="number"
                    value={energy}
                    onChange={(e) => setEnergy(Number(e.target.value))}
                    className="flex-1"
                  />
                </div>
              </div>
              <Button onClick={handleUpdateStats} className="w-full mt-4">
                Update
              </Button>
              
              {/* Take Action Button */}
              <Button 
                onClick={() => setShowActionDialog(true)}
                className="w-full mt-4"
                variant="default"
              >
                Take Action
              </Button>
            </div>

            {/* Section 2: Zones with Players */}
            <div className="border-2 border-border rounded-lg p-6 bg-card mt-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full border-2 border-border flex items-center justify-center text-2xl font-bold">
                  2
                </div>
                <h2 className="text-xl font-bold text-foreground">Zones ({zones.length} in total)</h2>
              </div>
              <div className="space-y-4">
                {zones.map((zone, index) => {
                  const playersInZone = getPlayersInZone(zone.id);
                  const isCurrentZone = currentZone === zone.id;
                  const zoneImage = ZONE_IMAGE_LIST[index % ZONE_IMAGE_LIST.length];
                  return (
                    <div key={zone.id}>
                      <div
                        className={`relative cursor-pointer transition-all duration-300 hover:scale-105 mb-2 ${
                          isCurrentZone ? 'ring-4 ring-primary animate-pulse' : ''
                        }`}
                        onClick={() => handleZoneChange(zone.id)}
                      >
                        <img 
                          src={zoneImage} 
                          alt={zone.name}
                          className="w-[360px] h-[48px] rounded-lg border-2 border-border object-cover"
                        />
                      </div>
                      {playersInZone.length > 0 && (
                        <div className="flex flex-wrap gap-2 pl-4">
                           {playersInZone.map((player) => (
                            <TooltipProvider key={player.user_id}>
                              <Tooltip>
                                <TooltipTrigger>
                                  <div 
                                    onClick={() => handleTargetPlayer(player.user_id)}
                                    className="relative"
                                  >
                                    <Avatar className={`w-10 h-10 border-2 cursor-pointer hover:border-primary transition-colors ${
                                      currentTarget === player.user_id ? 'border-destructive ring-2 ring-destructive' : 'border-border'
                                    }`}>
                                      <AvatarImage
                                        src={resolveProfileImage(player.profiles.profile_picture_url)}
                                        alt={player.profiles.username}
                                      />
                                      <AvatarFallback>
                                        {player.profiles.username.substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    {currentTarget === player.user_id && (
                                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L11 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c-.25.78-.08 1.632.428 2.192A3.989 3.989 0 007 16a3.989 3.989 0 002.417-1.019 1.988 1.988 0 00.428-2.192L9.5 10.274A1 1 0 009 10H6a1 1 0 00-.5.274z" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="bg-card border-border">
                                  <div className="space-y-1">
                                    <p className="font-bold text-foreground">
                                      {player.profiles.username}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Discipline: {player.profiles.discipline}
                                    </p>
                                    {playerTitles[player.user_id] && (
                                      <div className="flex items-center gap-2 mt-1">
                                        <p className="text-xs text-muted-foreground">Codex:</p>
                                        {playerTitles[player.user_id].image_url ? (
                                          <div className="w-8 h-8 border border-primary rounded overflow-hidden">
                                            <img 
                                              src={playerTitles[player.user_id].image_url} 
                                              alt={playerTitles[player.user_id].title}
                                              className="w-full h-full object-cover"
                                            />
                                          </div>
                                        ) : (
                                          <Badge variant="secondary" className="text-xs">
                                            {playerTitles[player.user_id].title}
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                      Health: {player.profiles.health}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Armor: {player.profiles.armor}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Energy: {player.profiles.energy}
                                    </p>
                                    {currentTarget === player.user_id && (
                                      <p className="text-xs font-bold text-destructive mt-2">
                                        🎯 TARGETED
                                      </p>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 3: Cloudopedia */}
            <div className="border-2 border-border rounded-lg p-6 bg-card">
              <div className="flex items-center gap-4 justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full border-2 border-border flex items-center justify-center text-2xl font-bold">
                    3
                  </div>
                  <Button
                    onClick={() => window.open('/cloudopedia', '_blank')}
                    variant="outline"
                    className="text-lg"
                  >
                    Cloudopedia
                  </Button>
                </div>
                
                {/* Notification Bell */}
                <div className="relative">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      if (!showNotifications && unreadCount > 0) {
                        markAllAsRead();
                      }
                    }}
                    className="relative"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                  
                  {/* Notification Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto bg-card border-2 border-border rounded-lg shadow-lg z-50">
                      <div className="p-4 border-b border-border">
                        <h3 className="font-bold text-foreground">Notifications</h3>
                      </div>
                      <div className="divide-y divide-border">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-sm text-muted-foreground text-center">
                            No notifications
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div 
                              key={notif.id} 
                              className={`p-4 ${!notif.is_read ? 'bg-primary/5' : ''}`}
                            >
                              <p className="text-sm text-foreground">{notif.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(notif.created_at).toLocaleString()}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 4: Battle Feed (made bigger) */}
            <div className="border-2 border-border rounded-lg p-6 bg-card">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full border-2 border-border flex items-center justify-center text-2xl font-bold">
                  4
                </div>
                <h2 className="text-xl font-bold text-foreground">Battle Feed</h2>
              </div>
              <div className="space-y-4 max-h-[900px] overflow-y-auto">
                {arenaPosts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No actions yet</p>
                ) : (
                  arenaPosts.map((post) => (
                    <Card key={post.id} className="bg-card/50">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10 border-2 border-border">
                            <AvatarImage
                              src={resolveProfileImage(post.profiles.profile_picture_url)}
                              alt={post.profiles.username}
                            />
                            <AvatarFallback>
                              {post.profiles.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm">{post.profiles.username}</p>
                              <Badge variant="outline" className="text-xs">
                                {post.technique_name}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(post.created_at).toLocaleString()}
                              </span>
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteArenaPost(post.id)}
                                  className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                            <div className="text-sm text-foreground">
                              {(() => {
                                const lines = post.description.split('\n');
                                const isExpanded = expandedPosts.has(post.id);
                                const shouldTruncate = lines.length > 4;
                                const displayLines = shouldTruncate && !isExpanded ? lines.slice(0, 4) : lines;

                                return (
                                  <>
                                    {displayLines.map((line, idx) => {
                                      // Handle images
                                      const imgMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
                                      if (imgMatch) {
                                        return (
                                          <div key={idx} className="my-2">
                                            <img 
                                              src={imgMatch[2]} 
                                              alt={imgMatch[1]} 
                                              className="w-[45px] h-[45px] object-cover rounded border-2 border-primary"
                                            />
                                          </div>
                                        );
                                      }
                                      
                                      // Handle bold text
                                      if (line.includes('**')) {
                                        const parts = line.split('**');
                                        return (
                                          <p key={idx} className="mb-1">
                                            {parts.map((part, partIdx) => 
                                              partIdx % 2 === 1 ? <strong key={partIdx}>{part}</strong> : part
                                            )}
                                          </p>
                                        );
                                      }
                                      
                                      // Regular text
                                      return <p key={idx} className="mb-1">{line}</p>;
                                    })}
                                    {shouldTruncate && (
                                      <button
                                        onClick={() => {
                                          setExpandedPosts(prev => {
                                            const newSet = new Set(prev);
                                            if (isExpanded) {
                                              newSet.delete(post.id);
                                            } else {
                                              newSet.add(post.id);
                                            }
                                            return newSet;
                                          });
                                        }}
                                        className="text-primary hover:underline text-xs font-medium mt-1"
                                      >
                                        {isExpanded ? 'Read less' : 'Read more'}
                                      </button>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Take Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Take Action</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Codex Section */}
            {userActiveTitles.length > 0 && (
              <div>
                <Label className="text-base font-semibold mb-3 block">Active Codex</Label>
                <div className="grid grid-cols-8 gap-2">
                  {userActiveTitles.map((title, index) => (
                    <TooltipProvider key={index}>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="w-[45px] h-[45px] border-2 border-primary rounded overflow-hidden">
                            {title.image_url ? (
                              <img 
                                src={title.image_url} 
                                alt={title.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center text-xs">
                                {title.title.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-bold">{title.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            )}

            {/* Techniques Section */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Your Techniques</Label>
              {userTechniques.length === 0 ? (
                <p className="text-sm text-muted-foreground">No techniques learned yet</p>
              ) : (
                <>
                  <div className="grid grid-cols-8 gap-2">
                    {userTechniques.map((technique: any) => (
                      <div 
                        key={technique.id}
                        onClick={() => setSelectedTechnique(selectedTechnique === technique.id ? null : technique.id)}
                        className={`w-[45px] h-[45px] border-2 rounded overflow-hidden transition-colors cursor-pointer ${
                          selectedTechnique === technique.id ? "border-primary" : "border-border"
                        }`}
                      >
                        {technique.image_url ? (
                          <img 
                            src={technique.image_url} 
                            alt={technique.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center text-xs">
                            {technique.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Selected Technique Details - show full description with CEP and Tags */}
                  {selectedTechnique && (
                    <div className="mt-4 rounded-md border border-border bg-muted/40 p-3 text-sm text-foreground space-y-2">
                      {(() => {
                        const technique = userTechniques.find((t: any) => t.id === selectedTechnique);
                        if (!technique) return null;
                        return (
                          <>
                            <p className="font-semibold">{technique.name}</p>
                            <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                              {technique.description}
                            </p>
                            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                              <p><span className="font-semibold">CEP:</span> {technique.cep}</p>
                              <p><span className="font-semibold">Tags:</span> {technique.type_info}</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Status Selection */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your status" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {getStatusOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dice Roll */}
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="dice-roll" 
                checked={includeDiceRoll}
                onCheckedChange={(checked) => setIncludeDiceRoll(checked as boolean)}
              />
              <Label htmlFor="dice-roll" className="cursor-pointer">
                Include dice roll (2-12) - Result will be shown after posting
              </Label>
            </div>

            {/* Action Buttons */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Actions (Optional)</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  onClick={() => setSelectedAction(selectedAction === "change-zone" ? null : "change-zone")}
                  variant={selectedAction === "change-zone" ? "default" : "outline"}
                >
                  Change Zone
                </Button>
                <Button 
                  onClick={() => setSelectedAction(selectedAction === "gather-energy" ? null : "gather-energy")}
                  variant={selectedAction === "gather-energy" ? "default" : "outline"}
                >
                  Gather Energy
                </Button>
                <Button 
                  onClick={() => setSelectedAction(selectedAction === "move-around" ? null : "move-around")}
                  variant={selectedAction === "move-around" ? "default" : "outline"}
                >
                  Move Around
                </Button>
              </div>
            </div>

            {/* Submit Button */}
            <Button onClick={handleTakeAction} className="w-full">
              Post Action
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Arena;
