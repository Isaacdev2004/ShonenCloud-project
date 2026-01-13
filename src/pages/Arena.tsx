import { useState, useEffect, useRef } from "react";
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
import { ZONE_IMAGE_LIST, ZONE_IMAGE_NAMES } from "@/constants/zoneImages";
import arenaBanner from "@/assets/Banner final (1).png";
// New Arena System Imports
import * as statusSystem from "@/lib/arena/statusSystem";
import * as masterySystem from "@/lib/arena/masterySystem";
import * as statsSystem from "@/lib/arena/statsSystem";
import * as timerSystem from "@/lib/arena/timerSystem";
import { getRandomMoveAroundResult, MOVE_AROUND_RESULTS } from "@/lib/arena/moveAroundResults";
import { toast as sonnerToast } from "sonner";

const zoneSignatureImages = [
  { src: "https://i.ibb.co/tTkk6Mwy/Baschool-DONE.jpg", alt: "Baschool" },
  { src: "https://i.ibb.co/PsBSSZ0s/Chunin-DONE.jpg", alt: "Chunin" },
  { src: "https://i.ibb.co/vxzKKTpy/Hueco-DONE.jpg", alt: "Hueco" },
  { src: "https://i.ibb.co/kgsBHd6h/Musutafu-DONE.jpg", alt: "Musutafu" },
  { src: "https://i.ibb.co/wNrT6g4X/Namek-DONE2.jpg", alt: "Namek" },
  { src: "https://i.ibb.co/9mk6mgfh/Scrap-DONE2.jpg", alt: "Scrap" },
  { src: "https://i.ibb.co/TD7tdTSX/Shibuya-DONE.jpg", alt: "Shibuya" },
  { src: "https://i.ibb.co/7JkkMy05/Testing-DONE.jpg", alt: "Testing" },
];


interface Profile {
  id: string;
  username: string;
  profile_picture_url: string;
  health: number;
  armor: number;
  energy: number;
  discipline: string;
  level: number;
  // New Arena System Stats
  max_hp?: number;
  current_hp?: number;
  max_atk?: number;
  current_atk?: number;
  aura?: number;
  aura_expires_at?: string | null;
  mastery?: number;
  current_target_id?: string | null;
  current_target_zone_id?: string | null;
  is_targeting_zone?: boolean;
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

// New Arena System Interfaces
interface ArenaSession {
  id: string;
  session_number: number;
  opened_at: string;
  closed_at: string;
  battle_started_at: string | null;
  battle_timer_ends_at: string | null;
  is_open: boolean;
}

interface PlayerStatus {
  id: string;
  user_id: string;
  status: statusSystem.StatusType;
  expires_at: string;
  applied_by_mastery: number;
}

interface BattleFeedEntry {
  id: string;
  user_id: string;
  action_type: string;
  technique_id: string | null;
  technique_name: string | null;
  technique_image_url: string | null;
  technique_description: string | null;
  description: string;
  zone_id: string | null;
  created_at: string;
  profiles?: {
    username: string;
    profile_picture_url: string;
  };
}

interface VanishingToast {
  id: string;
  username: string;
  profilePicture: string;
  techniqueName: string | null;
  techniqueImage: string | null;
  description: string;
  timestamp: number;
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
  const [showZoneCodex, setShowZoneCodex] = useState(false);
  
  // New Arena System State
  const [hasJoined, setHasJoined] = useState(false);
  const [currentSession, setCurrentSession] = useState<ArenaSession | null>(null);
  const [battleTimer, setBattleTimer] = useState(0);
  const [arenaOpenTimer, setArenaOpenTimer] = useState(0);
  const [playerStatuses, setPlayerStatuses] = useState<PlayerStatus[]>([]);
  const [actionCooldowns, setActionCooldowns] = useState<Record<string, string>>({});
  const [techniqueCooldowns, setTechniqueCooldowns] = useState<Record<string, string>>({});
  const [cooldownsLoaded, setCooldownsLoaded] = useState(false);
  const [battleFeed, setBattleFeed] = useState<BattleFeedEntry[]>([]);
  const [vanishingToasts, setVanishingToasts] = useState<VanishingToast[]>([]);
  const [selectedZoneTarget, setSelectedZoneTarget] = useState<string | null>(null);
  const [showPlayerPopup, setShowPlayerPopup] = useState<string | null>(null);
  const [lastActionTime, setLastActionTime] = useState<Date | null>(null);
  const [lastTechniqueTime, setLastTechniqueTime] = useState<Date | null>(null);
  const [showZoneSelectDialog, setShowZoneSelectDialog] = useState(false);
  
  // Stats state (using new system)
  const [currentHP, setCurrentHP] = useState(100);
  const [maxHP, setMaxHP] = useState(100);
  const [currentATK, setCurrentATK] = useState(20);
  const [maxATK, setMaxATK] = useState(20);
  const [aura, setAura] = useState(0);
  const [mastery, setMastery] = useState(0);
  const [fullTechniqueData, setFullTechniqueData] = useState<Record<string, any>>({});
  
  // Refs for intervals
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const statusCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
      // New Arena System initializations
      fetchCurrentSession();
      fetchBattleFeed();
      fetchPlayerStatuses(user.id);
      fetchCooldowns(user.id);
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
      // Legacy stats (for backward compatibility)
      setHealth(data.health || data.current_hp || 100);
      setArmor(data.armor || 0);
      setEnergy(data.energy || 0);
      
      // New Arena System Stats
      setCurrentHP(data.current_hp ?? data.max_hp ?? 100);
      setMaxHP(data.max_hp ?? statsSystem.calculateMaxHP(data.level || 1));
      
      // Check and apply temporary ATK boosts from red_orb_effects
      const { data: redOrbData } = await supabase
        .from("red_orb_effects")
        .select("atk_boost, expires_at")
        .eq("user_id", id)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
      
      let baseATK = data.current_atk ?? data.max_atk ?? 20;
      if (redOrbData && redOrbData.atk_boost) {
        baseATK = (data.max_atk ?? statsSystem.calculateMaxATK(data.level || 1)) + redOrbData.atk_boost;
      } else {
        // Remove expired ATK boost - reset to max_atk
        baseATK = data.max_atk ?? statsSystem.calculateMaxATK(data.level || 1);
        if (data.current_atk && data.current_atk > baseATK) {
          // Update database to remove expired boost
          await supabase
            .from("profiles")
            .update({ current_atk: baseATK })
            .eq("id", id);
        }
      }
      setCurrentATK(baseATK);
      setMaxATK(data.max_atk ?? statsSystem.calculateMaxATK(data.level || 1));
      
      // Check if Aura has expired
      let auraValue = data.aura || 0;
      if (data.aura_expires_at && statsSystem.isAuraExpired(data.aura_expires_at)) {
        // Aura expired, reset to 0
        auraValue = 0;
        await supabase
          .from("profiles")
          .update({ 
            aura: 0,
            aura_expires_at: null
          })
          .eq("id", id);
      }
      setAura(auraValue);
      setMastery(Number(data.mastery) || 0);
      
      // Set current target
      if (data.current_target_id) {
        setCurrentTarget(data.current_target_id);
      }
      if (data.is_targeting_zone && data.current_target_zone_id) {
        setSelectedZoneTarget(data.current_target_zone_id);
      }

      // Check if player has a position, if not create one
      const { data: posData } = await supabase
        .from("player_positions")
        .select("zone_id")
        .eq("user_id", id)
        .maybeSingle();

      if (posData) {
        setCurrentZone(posData.zone_id);
      }
      // Removed auto-joining first zone - users must manually click a zone to join
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
        .select("id, username, profile_picture_url, health, armor, energy, discipline, current_hp, max_hp, current_atk, max_atk, aura")
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

  // Refresh player positions when popup opens to ensure fresh stats
  useEffect(() => {
    if (showPlayerPopup) {
      fetchPlayerPositions();
    }
  }, [showPlayerPopup]);

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
    // Get zone name from image mapping instead of database
    // Use the same index logic as the zone display to ensure consistency
    const zoneIndex = zones.findIndex((z) => z.id === zoneId);
    const zoneNameFromImage = zoneIndex !== -1 ? ZONE_IMAGE_NAMES[zoneIndex % ZONE_IMAGE_NAMES.length] : zones.find((z) => z.id === zoneId)?.name;
    toast({
      title: "Zone Changed",
      description: `Moved to ${zoneNameFromImage}`,
    });
  };

  const handleRemoveFromArena = async (targetUserId: string, username: string) => {
    if (!isAdmin) return;
    
    // Prevent admin from removing themselves
    if (targetUserId === userId) {
      toast({
        title: "Error",
        description: "You cannot remove yourself from Arena",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("player_positions")
      .delete()
      .eq("user_id", targetUserId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove player from Arena",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `${username} has been removed from Arena zones`,
    });

    // Refresh player positions
    fetchPlayerPositions();
  };

  const getPlayersInZone = (zoneId: string) => {
    return playerPositions.filter((p) => p.zone_id === zoneId);
  };

  const handleDeleteArenaPost = async (postId: string) => {
    if (!isAdmin) {
      toast({
        title: "Error",
        description: "You don't have permission to delete posts",
        variant: "destructive",
      });
      return;
    }

    // Confirm deletion
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    // Try to delete from battle_feed first (newer system)
    const { data: battleFeedData, error: battleFeedError } = await supabase
      .from("battle_feed")
      .delete()
      .eq("id", postId)
      .select();

    if (battleFeedError) {
      console.error("Battle feed delete error:", battleFeedError);
      // If not found in battle_feed, try arena_posts
      const { data: arenaPostData, error: arenaPostError } = await supabase
        .from("arena_posts")
        .delete()
        .eq("id", postId)
        .select();

      if (arenaPostError) {
        console.error("Arena post delete error:", arenaPostError);
        const errorMsg = arenaPostError.message || arenaPostError.code || "Unknown error";
        toast({
          title: "Error",
          description: `Failed to delete post: ${errorMsg}. Error details: ${JSON.stringify(arenaPostError)}`,
          variant: "destructive",
        });
        return;
      } else if (arenaPostData && arenaPostData.length > 0) {
        // Successfully deleted from arena_posts
        toast({
          title: "Success",
          description: "Post deleted successfully",
        });
        fetchArenaPosts();
        return;
      } else {
        // No rows deleted from either table
        toast({
          title: "Error",
          description: "Post not found or already deleted",
          variant: "destructive",
        });
        return;
      }
    } else if (battleFeedData && battleFeedData.length > 0) {
      // Successfully deleted from battle_feed
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
      // Refresh both feeds
      fetchBattleFeed();
      fetchArenaPosts();
      return;
    } else {
      // No rows deleted - might be RLS policy issue
      const errorMsg = battleFeedError?.message || "Post not found or RLS policy blocking deletion";
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    }
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

    // Then get techniques with ALL new fields
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
          mentor_id,
          damage,
          armor_damage,
          armor_given,
          aura_damage,
          given_aura,
          heal,
          tags,
          energy_cost,
          energy_given,
          cooldown_minutes,
          opponent_status,
          self_status,
          no_hit_m,
          specific_status_hit,
          mastery_given,
          mastery_taken,
          no_hit_e,
          no_use_e,
          no_use_m,
          atk_boost,
          atk_debuff
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
      
      // Pre-load full technique data
      const techDataMap: Record<string, any> = {};
      for (const tech of filteredTechniques) {
        techDataMap[tech.id] = tech;
      }
      setFullTechniqueData(techDataMap);
    }
  };
  
  // Fetch full technique data when selected
  useEffect(() => {
    if (selectedTechnique && !fullTechniqueData[selectedTechnique]) {
      supabase
        .from("techniques")
        .select("*")
        .eq("id", selectedTechnique)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setFullTechniqueData(prev => ({ ...prev, [selectedTechnique]: data }));
          }
        });
    }
  }, [selectedTechnique]);

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
        toast({
          title: "Error",
          description: "Failed to remove target",
          variant: "destructive",
        });
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
      // Refresh target state
      await fetchCurrentTarget(userId);
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
      toast({
        title: "Error",
        description: "Failed to set target",
        variant: "destructive",
      });
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
    
    // Refresh target state to ensure UI updates
    await fetchCurrentTarget(userId);
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

  const zoneSignatureImages = [
    { src: "https://i.ibb.co/tTkk6Mwy/Baschool-DONE.jpg", alt: "Baschool" },
    { src: "https://i.ibb.co/PsBSSZ0s/Chunin-DONE.jpg", alt: "Chunin" },
    { src: "https://i.ibb.co/vxzKKTpy/Hueco-DONE.jpg", alt: "Hueco" },
    { src: "https://i.ibb.co/kgsBHd6h/Musutafu-DONE.jpg", alt: "Musutafu" },
    { src: "https://i.ibb.co/wNrT6g4X/Namek-DONE2.jpg", alt: "Namek" },
    { src: "https://i.ibb.co/9mk6mgfh/Scrap-DONE2.jpg", alt: "Scrap" },
    { src: "https://i.ibb.co/TD7tdTSX/Shibuya-DONE.jpg", alt: "Shibuya" },
    { src: "https://i.ibb.co/7JkkMy05/Testing-DONE.jpg", alt: "Testing" },
  ];

  const getStatusOptions = () => {
    return [
      { value: "Dropping in", label: "Dropping in", description: "Now joining the fight" },
      { value: "In an active fight", label: "In an active fight", description: "Fighting an opponent" },
      { value: "Observing zones", label: "Observing zones", description: "Allows targeting of anyone anywhere" },
      { value: "Setup in play", label: "Setup in play", description: "No Off and Def usable" },
      { value: "Setup complete", label: "Setup complete", description: "Can now use Off and Def again" },
      { value: "Completing a zone signature", label: "Completing a zone signature", description: "Must stay inactive for the # of turns" },
      { value: "Stunned", label: "Stunned", description: "Cannot do anything" },
      { value: "Hidden", label: "Hidden", description: "Only affected if revealed or by AOE" },
      { value: "Evasion mode", label: "Evasion mode", description: "8 turns cooldown, costs half Energy" },
      { value: "Exploring", label: "Exploring", description: "Exploring the surrounding area within zone" },
    ];
  };

  const fetchArenaPosts = async () => {
    // Use new battle_feed table, but also keep arena_posts for backward compatibility
    const [battleFeedData, arenaPostsData] = await Promise.all([
      supabase
        .from("battle_feed")
        .select(`id, user_id, zone_id, technique_name, description, created_at, action_type`)
        .order("created_at", { ascending: false })
        .limit(25),
      supabase
      .from("arena_posts")
        .select(`id, user_id, zone_id, technique_name, description, created_at`)
      .order("created_at", { ascending: false })
        .limit(25),
    ]);

    const allPosts: any[] = [];
    
    if (battleFeedData.data) {
      allPosts.push(...battleFeedData.data.map((post: any) => ({
        ...post,
        technique_name: post.technique_name || post.action_type,
      })));
    }
    
    if (arenaPostsData.data) {
      allPosts.push(...arenaPostsData.data);
    }

    if (allPosts.length === 0) {
      setArenaPosts([]);
      return;
    }

    // Filter posts to only show those created within the last 5 minutes (auto-delete after 5 minutes)
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const recentPosts = allPosts.filter((post: any) => {
      const postDate = new Date(post.created_at);
      return postDate >= fiveMinutesAgo;
    });

    // Sort by created_at and limit
    recentPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const limitedPosts = recentPosts.slice(0, 50);

    const userIds = Array.from(new Set(limitedPosts.map((post) => post.user_id)));

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

    const postsWithProfiles = limitedPosts.map((post: any) => ({
      ...post,
      profiles: profileMap.get(post.user_id) || {
        username: "Unknown",
        profile_picture_url: "",
        discipline: "",
      },
    }));

    setArenaPosts(postsWithProfiles as any);
  };
  
  // Inactivity and K.O System Checks
  useEffect(() => {
    if (!userId || !hasJoined) return;
    
    const checkInactivity = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("last_action_at, last_attack_at, max_hp, current_hp")
        .eq("id", userId)
        .single();
      
      if (!profile) return;
      
      const now = new Date();
      const lastAction = profile.last_action_at ? new Date(profile.last_action_at) : null;
      const lastAttack = profile.last_attack_at ? new Date(profile.last_attack_at) : null;
      
      // Check for statuses that prevent inactivity damage
      const activeStatuses = playerStatuses.map(s => s.status);
      const isStunned = activeStatuses.includes("Stunned");
      
      // 1 minute no action = 20% max HP damage per minute (unless Stunned)
      if (lastAction && !isStunned) {
        const minutesSinceAction = (now.getTime() - lastAction.getTime()) / 60000;
        if (minutesSinceAction >= 1) {
          const damage = Math.floor((profile.max_hp || 100) * 0.2);
          const newHP = Math.max(0, (profile.current_hp || profile.max_hp || 100) - damage);
          
          await supabase
            .from("profiles")
            .update({ current_hp: newHP })
            .eq("id", userId);
          
          setCurrentHP(newHP);
          
          if (newHP === 0) {
            await applyKOStatus(userId);
          }
        }
      }
      
      // 4 minutes no Attack = 15% max HP damage per minute
      if (lastAttack && !isStunned) {
        const minutesSinceAttack = (now.getTime() - lastAttack.getTime()) / 60000;
        if (minutesSinceAttack >= 4) {
          const damage = Math.floor((profile.max_hp || 100) * 0.15);
          const newHP = Math.max(0, (profile.current_hp || profile.max_hp || 100) - damage);
          
          await supabase
            .from("profiles")
            .update({ current_hp: newHP })
            .eq("id", userId);
          
          setCurrentHP(newHP);
          
          if (newHP === 0) {
            await applyKOStatus(userId);
          }
        }
      }
    };
    
    inactivityCheckIntervalRef.current = setInterval(checkInactivity, 60000); // Check every minute
    
    return () => {
      if (inactivityCheckIntervalRef.current) {
        clearInterval(inactivityCheckIntervalRef.current);
      }
    };
  }, [userId, hasJoined, playerStatuses]);
  
  // Aura expiration check
  useEffect(() => {
    if (!currentProfile?.aura_expires_at) return;
    
    const checkAura = () => {
      if (statsSystem.isAuraExpired(currentProfile.aura_expires_at)) {
        setAura(0);
        supabase
          .from("profiles")
          .update({ aura: 0, aura_expires_at: null })
          .eq("id", userId);
      }
    };
    
    const interval = setInterval(checkAura, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [currentProfile?.aura_expires_at, userId]);
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

  // ========== NEW ARENA SYSTEM FUNCTIONS ==========
  
  // Join System
  const fetchCurrentSession = async () => {
    // First, try to get an open session
    const { data: openSession, error: openError } = await supabase
      .from("arena_sessions")
      .select("*")
      .eq("is_open", true)
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (openError) {
      console.error("Error fetching open session:", openError);
    }
    
    if (openSession) {
      setCurrentSession(openSession);
      // Check if user has joined
      if (userId) {
        const { data: participant } = await supabase
          .from("arena_participants")
          .select("id")
          .eq("user_id", userId)
          .eq("session_id", openSession.id)
          .maybeSingle();
        setHasJoined(!!participant);
      }
      return;
    }
    
    // No open session, get the most recent session (open or closed) to maintain session continuity
    const { data: lastSession, error: lastError } = await supabase
      .from("arena_sessions")
      .select("*")
      .order("closed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (lastError) {
      console.error("Error fetching last session:", lastError);
    }
    
    if (lastSession) {
      // Use the existing session ID to maintain continuity
      const nextOpen = timerSystem.calculateNextArenaOpenTime(new Date(lastSession.closed_at));
      const nextClose = timerSystem.calculateArenaCloseTime(nextOpen);
      const isCurrentlyOpen = timerSystem.isArenaOpen(nextOpen.toISOString(), nextClose.toISOString());
      
      setCurrentSession({
        id: lastSession.id, // Keep the existing session ID!
        session_number: lastSession.session_number,
        opened_at: nextOpen.toISOString(),
        closed_at: nextClose.toISOString(),
        battle_started_at: null,
        battle_timer_ends_at: null,
        is_open: isCurrentlyOpen,
      });
      
      // Check if user has joined (using the existing session ID)
      if (userId) {
        const { data: participant } = await supabase
          .from("arena_participants")
          .select("id")
          .eq("user_id", userId)
          .eq("session_id", lastSession.id)
          .maybeSingle();
        setHasJoined(!!participant);
      }
    } else {
        // No sessions exist - calculate the next open time from now
        const now = new Date();
        const totalCycleMinutes = timerSystem.ARENA_OPEN_DURATION_MINUTES + timerSystem.ARENA_CLOSE_DURATION_MINUTES; // 60 minutes (40 open + 20 closed)
        
        // Start from the beginning of the current hour
        let nextOpenTime = new Date(now);
        nextOpenTime.setMinutes(0, 0, 0);
        nextOpenTime.setSeconds(0, 0);
        
        // Find the next open time that's in the future
        // Arena cycles: open for 40 min, close for 20 min (total 60 min per cycle)
        while (nextOpenTime <= now) {
          // Check if we're in an open window
          const potentialCloseTime = timerSystem.calculateArenaCloseTime(nextOpenTime);
          if (now >= nextOpenTime && now < potentialCloseTime) {
            // We're in an open window, use this time
            break;
          }
          // Move to next cycle
          nextOpenTime.setMinutes(nextOpenTime.getMinutes() + totalCycleMinutes);
        }
        
        const nextCloseTime = timerSystem.calculateArenaCloseTime(nextOpenTime);
        const isCurrentlyOpen = timerSystem.isArenaOpen(nextOpenTime.toISOString(), nextCloseTime.toISOString());
        
        // Check if we should create a new session
        const { data: allSessions } = await supabase
          .from("arena_sessions")
          .select("id")
          .limit(1);
        
        if (!allSessions || allSessions.length === 0) {
          // Create initial session
          const { data: newSession, error: createError } = await supabase
            .from("arena_sessions")
            .insert({
              session_number: 1,
              opened_at: nextOpenTime.toISOString(),
              closed_at: nextCloseTime.toISOString(),
              is_open: isCurrentlyOpen,
            })
            .select()
            .single();
          
          if (!createError && newSession) {
            setCurrentSession(newSession);
          } else {
            // Fallback: show a session
            setCurrentSession({
              id: "",
              session_number: 0,
              opened_at: nextOpenTime.toISOString(),
              closed_at: nextCloseTime.toISOString(),
              battle_started_at: null,
              battle_timer_ends_at: null,
              is_open: isCurrentlyOpen,
            });
          }
        } else {
          // Sessions exist but none are open - show next open time
          setCurrentSession({
            id: "",
            session_number: 0,
            opened_at: nextOpenTime.toISOString(),
            closed_at: nextCloseTime.toISOString(),
            battle_started_at: null,
            battle_timer_ends_at: null,
            is_open: isCurrentlyOpen,
          });
        }
      }
    }
  };
  
  const handleJoinArena = async () => {
    if (!userId || !currentSession) return;
    
    if (!timerSystem.isArenaOpen(currentSession.opened_at, currentSession.closed_at)) {
      toast({
        title: "Arena Closed",
        description: "The Arena is currently closed. Please wait for the next open time.",
        variant: "destructive",
      });
      return;
    }

    // If session has no ID, create a new session first
    let sessionId = currentSession.id;
    if (!sessionId || sessionId === "") {
      const { data: lastSession } = await supabase
        .from("arena_sessions")
        .select("session_number")
        .order("session_number", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const nextSessionNumber = (lastSession?.session_number || 0) + 1;
      const openedAt = new Date(currentSession.opened_at);
      const closedAt = new Date(currentSession.closed_at);
      
      const { data: newSession, error: createError } = await supabase
        .from("arena_sessions")
        .insert({
          session_number: nextSessionNumber,
          opened_at: openedAt.toISOString(),
          closed_at: closedAt.toISOString(),
          is_open: true,
        })
        .select()
        .single();
      
      if (createError || !newSession) {
      toast({
        title: "Error",
          description: "Failed to create Arena session",
        variant: "destructive",
      });
      return;
    }

      sessionId = newSession.id;
      setCurrentSession(newSession);
    }

    const { error } = await supabase
      .from("arena_participants")
      .insert({
        user_id: userId,
        session_id: sessionId,
      });
    
    if (error) {
      // Check if already joined
      if (error.code === '23505') { // Unique constraint violation
        setHasJoined(true);
        toast({
          title: "Already Joined",
          description: "You are already in the Arena!",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to join Arena: " + error.message,
        variant: "destructive",
      });
      return;
    }

    setHasJoined(true);
    toast({
      title: "Joined Arena",
      description: "You have successfully joined the Arena!",
    });
  };
  
  // Timer Management
  useEffect(() => {
    if (!currentSession) return;
    
    const updateTimers = async () => {
      // Validate session state against actual time
      const actualIsOpen = timerSystem.isArenaOpen(currentSession.opened_at, currentSession.closed_at);
      
      // If state doesn't match actual time, correct it
      if (currentSession.id && currentSession.id !== "" && currentSession.is_open !== actualIsOpen) {
        if (actualIsOpen && !currentSession.is_open) {
          // Should be open but marked as closed - open it
          const openedAt = new Date();
          const closedAt = timerSystem.calculateArenaCloseTime(openedAt);
          await supabase
            .from("arena_sessions")
            .update({
              is_open: true,
              opened_at: openedAt.toISOString(),
              closed_at: closedAt.toISOString()
            })
            .eq("id", currentSession.id);
          await fetchCurrentSession();
          return;
        } else if (!actualIsOpen && currentSession.is_open) {
          // Should be closed but marked as open - close it
          const closedAt = new Date();
          await supabase
            .from("arena_sessions")
            .update({
              is_open: false,
              closed_at: closedAt.toISOString()
            })
            .eq("id", currentSession.id);
          await fetchCurrentSession();
          return;
        }
      }
      
      if (currentSession.is_open && actualIsOpen) {
        const timeUntilClose = timerSystem.getTimeUntilArenaCloses(currentSession.closed_at);
        setArenaOpenTimer(timeUntilClose);
        
        // Check if arena should close
        if (timeUntilClose <= 0 && currentSession.id) {
          // Arena should close now
          const closedAt = new Date();
          const { error } = await supabase
            .from("arena_sessions")
            .update({
              is_open: false,
              closed_at: closedAt.toISOString()
            })
            .eq("id", currentSession.id);
          
          if (!error) {
            // Refresh session
            await fetchCurrentSession();
          }
        }
        
        if (currentSession.battle_timer_ends_at) {
          const battleTime = timerSystem.getRemainingBattleTimer(currentSession.battle_timer_ends_at);
          setBattleTimer(battleTime);
        }
      } else {
        // When closed, calculate next open time
        let nextOpenTime: Date | null = null;
        const now = new Date();
        
        // First, check if opened_at is set and in the future (this is the scheduled open time)
        if (currentSession.opened_at) {
          const scheduledOpen = new Date(currentSession.opened_at);
          if (scheduledOpen > now) {
            // Use the scheduled open time
            nextOpenTime = scheduledOpen;
          }
        }
        
        // If no scheduled time or it's in the past, calculate from closed_at
        if (!nextOpenTime && currentSession.closed_at) {
          // Start from the closed_at time
          let baseTime = new Date(currentSession.closed_at);
          nextOpenTime = timerSystem.calculateNextArenaOpenTime(baseTime);
          
          // If the calculated next open time is still in the past, keep adding full cycles until we get a future time
          const totalCycleMinutes = timerSystem.ARENA_OPEN_DURATION_MINUTES + timerSystem.ARENA_CLOSE_DURATION_MINUTES; // 60 minutes
          while (nextOpenTime <= now) {
            // Add a full cycle (60 minutes) to get to the next open window
            baseTime.setMinutes(baseTime.getMinutes() + totalCycleMinutes);
            nextOpenTime = timerSystem.calculateNextArenaOpenTime(baseTime);
          }
        } else if (!nextOpenTime && currentSession.opened_at) {
          // Fallback: if no closed_at, use opened_at + close duration + open duration
          const lastOpen = new Date(currentSession.opened_at);
          let nextOpen = new Date(lastOpen);
          const totalCycleMinutes = timerSystem.ARENA_OPEN_DURATION_MINUTES + timerSystem.ARENA_CLOSE_DURATION_MINUTES; // 60 minutes
          // Add close duration to get to next open time
          nextOpen.setMinutes(nextOpen.getMinutes() + timerSystem.ARENA_CLOSE_DURATION_MINUTES);
          
          // If still in the past, keep adding cycles
          while (nextOpen <= now) {
            nextOpen.setMinutes(nextOpen.getMinutes() + totalCycleMinutes);
          }
          nextOpenTime = nextOpen;
        }
        
        if (nextOpenTime) {
          const timeUntilOpen = timerSystem.getTimeUntilArenaOpens(nextOpenTime.toISOString());
          setArenaOpenTimer(timeUntilOpen);
          
          // Check if arena should open now
          if (timeUntilOpen <= 0) {
            // Arena should open now
            const openedAt = new Date();
            const closedAt = timerSystem.calculateArenaCloseTime(openedAt);
            
            // Get next session number
            const { data: lastSession } = await supabase
              .from("arena_sessions")
              .select("session_number")
              .order("session_number", { ascending: false })
              .limit(1)
              .maybeSingle();
            
            const nextSessionNumber = (lastSession?.session_number || 0) + 1;
            
            // Update existing session or create new one
            if (currentSession.id && currentSession.id !== "") {
              const { error } = await supabase
                .from("arena_sessions")
                .update({
                  is_open: true,
                  opened_at: openedAt.toISOString(),
                  closed_at: closedAt.toISOString(),
                  session_number: nextSessionNumber
                })
                .eq("id", currentSession.id);
              
              if (error) {
                console.error("Error updating session to open:", error);
                // If update fails, try creating a new session instead
                const { data: newSession, error: createError } = await supabase
                  .from("arena_sessions")
                  .insert({
                    session_number: nextSessionNumber,
                    opened_at: openedAt.toISOString(),
                    closed_at: closedAt.toISOString(),
                    is_open: true
                  })
                  .select()
                  .single();
                
                if (!createError && newSession) {
                  setCurrentSession(newSession);
                } else {
                  console.error("Error creating new session:", createError);
                  await fetchCurrentSession();
                }
              } else {
                await fetchCurrentSession();
              }
            } else {
              // Create new session
              const { data: newSession, error } = await supabase
                .from("arena_sessions")
                .insert({
                  session_number: nextSessionNumber,
                  opened_at: openedAt.toISOString(),
                  closed_at: closedAt.toISOString(),
                  is_open: true
                })
                .select()
                .single();
              
              if (!error && newSession) {
                setCurrentSession(newSession);
              } else {
                await fetchCurrentSession();
              }
            }
          }
        }
      }
    };
    
    updateTimers();
    timerIntervalRef.current = setInterval(updateTimers, 1000);
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [currentSession]);
  
  // Status Management
  const fetchPlayerStatuses = async (userId: string) => {
    const { data, error } = await supabase
      .from("player_statuses")
      .select("*")
      .eq("user_id", userId)
      .gt("expires_at", new Date().toISOString());
    
    if (error) {
      console.error("Error fetching player statuses:", error);
      return;
    }
    
    if (data) {
      setPlayerStatuses(data as PlayerStatus[]);
    }
  };
  
  // Clean expired statuses
  useEffect(() => {
    const checkStatuses = () => {
      setPlayerStatuses(prev => 
        prev.filter(s => new Date(s.expires_at) > new Date())
      );
    };
    
    statusCheckIntervalRef.current = setInterval(checkStatuses, 10000); // Check every 10 seconds
    
    return () => {
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
      }
    };
  }, []);
  
  // Cooldown Management
  const fetchCooldowns = async (userId: string) => {
    try {
      const [actionData, techniqueData] = await Promise.all([
        supabase
          .from("action_cooldowns")
          .select("*")
          .eq("user_id", userId)
          .gt("expires_at", new Date().toISOString()),
        supabase
          .from("technique_cooldowns")
          .select("*")
          .eq("user_id", userId)
          .gt("expires_at", new Date().toISOString()),
      ]);
      
      // Always initialize state, even if empty
      if (actionData.data && actionData.data.length > 0) {
        const cooldowns: Record<string, string> = {};
        actionData.data.forEach(cd => {
          cooldowns[cd.action_type] = cd.expires_at;
        });
        setActionCooldowns(cooldowns);
      } else {
        // Initialize empty if no cooldowns
        setActionCooldowns({});
      }
      
      if (techniqueData.data && techniqueData.data.length > 0) {
        const cooldowns: Record<string, string> = {};
        techniqueData.data.forEach(cd => {
          cooldowns[cd.technique_id] = cd.expires_at;
        });
        setTechniqueCooldowns(cooldowns);
      } else {
        // Initialize empty if no cooldowns
        setTechniqueCooldowns({});
      }
      
      // Mark cooldowns as loaded ONLY after successful fetch
      setCooldownsLoaded(true);
    } catch (error) {
      console.error("Error fetching cooldowns:", error);
      // Don't set cooldownsLoaded to true on error - this prevents actions until cooldowns are properly loaded
    }
  };
  
  // Refresh cooldowns periodically to keep them in sync
  useEffect(() => {
    if (!userId) {
      // Reset cooldowns loaded state when userId is not available
      setCooldownsLoaded(false);
      return;
    }
    
    // Reset cooldowns loaded state when userId changes (e.g., on page refresh)
    setCooldownsLoaded(false);
    
    // Fetch cooldowns immediately
    fetchCooldowns(userId);
    
    // Then refresh every 5 seconds to catch any updates
    const interval = setInterval(() => {
      fetchCooldowns(userId);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [userId]);
  
  // Auto-refresh arena posts every minute to filter out posts older than 5 minutes
  useEffect(() => {
    // Initial fetch is already done in the main useEffect
    // This just refreshes to filter out old posts
    const interval = setInterval(() => {
      fetchArenaPosts();
    }, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, []);
  
  // Battle Feed
  const fetchBattleFeed = async () => {
    const { data, error } = await supabase
      .from("battle_feed")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    
    if (error) {
      console.error("Error fetching battle feed:", error);
      return;
    }
    
    if (data) {
      // Fetch profiles separately since user_id references auth.users, not profiles
      const userIds = Array.from(new Set(data.map((entry: any) => entry.user_id)));
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, profile_picture_url")
        .in("id", userIds);
      
      // Map profiles to entries
      const profileMap = (profilesData || []).reduce((acc: any, profile: any) => {
        acc[profile.id] = profile;
        return acc;
      }, {});
      
      const entriesWithProfiles = data.map((entry: any) => ({
        ...entry,
        profiles: profileMap[entry.user_id] || { username: "Unknown", profile_picture_url: "" }
      }));
      
      setBattleFeed(entriesWithProfiles as any);
    }
  };
  
  // Real-time battle feed subscription
  useEffect(() => {
    if (!userId) return;
    
    const channel = supabase
      .channel("battle_feed_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "battle_feed",
        },
        async (payload) => {
          const newEntry = payload.new as BattleFeedEntry;
          
          // Fetch profile for the entry
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, profile_picture_url")
            .eq("id", newEntry.user_id)
            .single();
          
          if (profile) {
            newEntry.profiles = profile;
          }
          
          // Add to battle feed
          setBattleFeed(prev => [newEntry, ...prev.slice(0, 49)]);
          
          // If it's not from current user, show vanishing toast
          if (newEntry.user_id !== userId) {
            const toast: VanishingToast = {
              id: newEntry.id,
              username: profile?.username || "Unknown",
              profilePicture: profile?.profile_picture_url || "",
              techniqueName: newEntry.technique_name,
              techniqueImage: newEntry.technique_image_url || null,
              description: newEntry.description,
              timestamp: Date.now(),
            };
            
            setVanishingToasts(prev => [...prev, toast]);
            
            // Remove toast after 5 seconds
            setTimeout(() => {
              setVanishingToasts(prev => prev.filter(t => t.id !== toast.id));
            }, 5000);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
  
  // Initialize new system on mount
  useEffect(() => {
    if (userId) {
      fetchCurrentSession();
      fetchPlayerStatuses(userId);
      fetchCooldowns(userId);
      fetchBattleFeed();
    }
  }, [userId]);
  
  // Action Handlers
  const handleAttack = async () => {
    if (!userId || !currentProfile || !hasJoined) {
      toast({
        title: "Error",
        description: "You must join the Arena first",
        variant: "destructive",
      });
      return;
    }

    // Block action until cooldowns are loaded
    if (!cooldownsLoaded) {
      toast({
        title: "Loading",
        description: "Please wait while cooldowns are being loaded...",
        variant: "destructive",
      });
      return;
    }

    // Check cooldown in state first
    if (actionCooldowns["attack"] && !timerSystem.isCooldownExpired(actionCooldowns["attack"])) {
      const remaining = timerSystem.getRemainingCooldown(actionCooldowns["attack"]);
      toast({
        title: "On Cooldown",
        description: `Attack is on cooldown. ${timerSystem.formatTime(remaining)} remaining.`,
        variant: "destructive",
      });
      return;
    }

    // Double-check cooldown in database (prevents refresh exploit)
    const { data: cooldownData } = await supabase
      .from("action_cooldowns")
      .select("expires_at")
      .eq("user_id", userId)
      .eq("action_type", "attack")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cooldownData && !timerSystem.isCooldownExpired(cooldownData.expires_at)) {
      const remaining = timerSystem.getRemainingCooldown(cooldownData.expires_at);
      // Update state with database value
      setActionCooldowns(prev => ({ ...prev, attack: cooldownData.expires_at }));
      toast({
        title: "On Cooldown",
        description: `Attack is on cooldown. ${timerSystem.formatTime(remaining)} remaining.`,
        variant: "destructive",
      });
      return;
    }
    
    // Check if can use actions (not stunned, grounded, K.O)
    const activeStatuses = playerStatuses.map(s => s.status);
    if (statusSystem.statusBlocksActions(activeStatuses)) {
      toast({
        title: "Cannot Attack",
        description: "You are stunned or cannot perform actions.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if has target
    if (!currentTarget && !selectedZoneTarget) {
      toast({
        title: "No Target",
        description: "Please select a target first",
        variant: "destructive",
      });
      return;
    }
    
    // Check action limit (1 action + 1 technique per minute)
    if (lastActionTime && new Date().getTime() - lastActionTime.getTime() < 60000) {
      toast({
        title: "Action Limit",
        description: "You can only use 1 action per minute",
        variant: "destructive",
      });
      return;
    }
    
    // Calculate damage
    let damage = currentATK;
    
    // If targeting zone and is Emperor, damage is halved
    if (selectedZoneTarget && currentProfile.discipline === "Emperor") {
      damage = Math.floor(damage / 2);
    }
    
    // Apply damage to target(s)
    if (selectedZoneTarget) {
      // Zone targeting - affect all players in zone
      const playersInZone = getPlayersInZone(selectedZoneTarget);
      for (const player of playersInZone) {
        await applyDamageToPlayer(player.user_id, damage, "attack");
      }
    } else if (currentTarget) {
      // Single target
      await applyDamageToPlayer(currentTarget, damage, "attack");
    }
    
    // Increase Mastery by 0.25
    const newMastery = masterySystem.capMastery(mastery + 0.25);
    setMastery(newMastery);
    await supabase
      .from("profiles")
      .update({ mastery: newMastery })
      .eq("id", userId);
    
    // Set cooldown
    const cooldownExpires = timerSystem.calculateCooldownExpiration(1);
    await supabase
      .from("action_cooldowns")
      .upsert({
      user_id: userId,
        action_type: "attack",
        expires_at: cooldownExpires.toISOString(),
      });
    
    setActionCooldowns(prev => ({ ...prev, attack: cooldownExpires.toISOString() }));
    const now = new Date();
    setLastActionTime(now);
    
    // Update last_action_at and last_attack_at
    await supabase
      .from("profiles")
      .update({ 
        last_action_at: now.toISOString(),
        last_attack_at: now.toISOString(),
      })
      .eq("id", userId);
    
    // Add to battle feed
    await supabase.from("battle_feed").insert({
      user_id: userId,
      action_type: "attack",
      description: `Attacked ${selectedZoneTarget ? "zone" : "target"} for ${damage} damage`,
      zone_id: currentZone,
    });
    
    toast({
      title: "Attack Executed",
      description: `Dealt ${damage} damage`,
    });
  };
  
  const applyDamageToPlayer = async (targetUserId: string, damage: number, source: string) => {
    try {
      // Fetch target's current stats
      const { data: target, error: fetchError } = await supabase
        .from("profiles")
        .select("current_hp, max_hp, armor, aura")
        .eq("id", targetUserId)
        .single();
      
      if (fetchError) {
        console.error("Error fetching target stats:", fetchError);
        toast({
          title: "Error",
          description: "Failed to fetch target stats",
          variant: "destructive",
        });
        return;
      }
      
      if (!target) {
        console.error("Target not found");
        return;
      }
      
      const result = statsSystem.applyDamage(
        damage,
        target.current_hp || target.max_hp || 100,
        target.armor || 0,
        target.aura || 0
      );
      
      // Update target stats
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          current_hp: result.newHP,
          armor: result.newArmor,
          aura: result.newAura,
        })
        .eq("id", targetUserId);
      
      if (updateError) {
        console.error("Error updating target stats:", updateError);
        toast({
          title: "Error",
          description: `Failed to apply damage: ${updateError.message}`,
          variant: "destructive",
        });
        return;
      }
      
      // Check for K.O
      if (result.newHP === 0) {
        await applyKOStatus(targetUserId);
      }
    } catch (error) {
      console.error("Error in applyDamageToPlayer:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while applying damage",
        variant: "destructive",
      });
    }
  };
  
  const applyKOStatus = async (userId: string) => {
    const duration = statusSystem.calculateStatusDuration(2, "K.O");
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + duration);
    
    await supabase.from("player_statuses").insert({
        user_id: userId,
      status: "K.O",
      applied_by_mastery: 2,
      expires_at: expiresAt.toISOString(),
    });
    
    // Set timer for removal if no Revival used
    setTimeout(async () => {
      const { data: statuses } = await supabase
        .from("player_statuses")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "K.O")
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
      
      if (statuses) {
        // Still K.O, remove from Arena
        await supabase.from("player_positions").delete().eq("user_id", userId);
      }
    }, 60000); // 1 minute
  };
  
  const handleMoveAround = async () => {
    if (!userId || !hasJoined) {
      toast({
        title: "Error",
        description: "You must join the Arena first",
        variant: "destructive",
      });
      return;
    }
    
    // Check action limit
    if (lastActionTime && new Date().getTime() - lastActionTime.getTime() < 60000) {
      toast({
        title: "Action Limit",
        description: "You can only use 1 action per minute",
        variant: "destructive",
      });
      return;
    }
    
    // Get random result
    const result = getRandomMoveAroundResult();
    
    // Apply effect
    let description = result.description;
    
    if (result.effect.type === "energy") {
      const newEnergy = (energy || 0) + (result.effect.value || 0);
      setEnergy(newEnergy);
      await supabase.from("profiles").update({ energy: newEnergy }).eq("id", userId);
      description += ` (+${result.effect.value} Energy)`;
    } else if (result.effect.type === "aura") {
      const auraAmount = Math.floor((maxHP * (result.effect.percentage || 0)) / 100);
      const expiresAt = statsSystem.calculateAuraExpiration();
      setAura(aura);
      await supabase
        .from("profiles")
        .update({
          aura: auraAmount,
          aura_expires_at: expiresAt.toISOString(),
        })
        .eq("id", userId);
      description += ` (+${auraAmount} Aura for 2 minutes)`;
    } else if (result.effect.type === "armor") {
      const newArmor = (armor || 0) + (result.effect.value || 0);
      setArmor(newArmor);
      await supabase.from("profiles").update({ armor: newArmor }).eq("id", userId);
      description += ` (+${result.effect.value} Armor)`;
    } else if (result.effect.type === "mastery") {
      const newMastery = masterySystem.capMastery(mastery + (result.effect.value || 0));
      setMastery(newMastery);
      await supabase.from("profiles").update({ mastery: newMastery }).eq("id", userId);
      description += ` (${result.effect.value! > 0 ? '+' : ''}${result.effect.value} Mastery)`;
    } else if (result.effect.type === "atk_boost") {
      const boost = Math.floor((currentATK * (result.effect.percentage || 0)) / 100);
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + (result.effect.duration || 5));
      
      await supabase.from("red_orb_effects").upsert({
      user_id: userId,
        atk_boost: boost,
        expires_at: expiresAt.toISOString(),
      });
      
      const newATK = currentATK + boost;
      setCurrentATK(newATK);
      await supabase.from("profiles").update({ current_atk: newATK }).eq("id", userId);
      description += ` (+${boost} ATK for ${result.effect.duration} minutes)`;
    } else if (result.effect.type === "mastery_use") {
      // Use Mastery based on discipline
      const effect = masterySystem.getMasteryEffect(currentProfile?.discipline as any, mastery);
      if (effect) {
        // Apply mastery effect
        description += ` (Used ${Math.floor(mastery)} Mastery: ${currentProfile?.discipline} effect)`;
      }
    }
    
    // Add to battle feed (only visible to others)
    await supabase.from("battle_feed").insert({
      user_id: userId,
      action_type: "move_around",
      description: description,
        zone_id: currentZone,
    });
    
    const now = new Date();
    setLastActionTime(now);
    
    // Update last_action_at
    await supabase
      .from("profiles")
      .update({ last_action_at: now.toISOString() })
      .eq("id", userId);
    
    toast({
      title: "Move Around",
        description: description,
      });
  };

  const handleObserve = async () => {
    if (!userId || !hasJoined) {
      toast({
        title: "Error",
        description: "You must join the Arena first",
        variant: "destructive",
      });
      return;
    }

    // Block action until cooldowns are loaded
    if (!cooldownsLoaded) {
      toast({
        title: "Loading",
        description: "Please wait while cooldowns are being loaded...",
        variant: "destructive",
      });
      return;
    }
    
    // Check Mastery requirement
    if (mastery < 1) {
      toast({
        title: "Insufficient Mastery",
        description: "You need at least 1 Mastery to use Observe",
        variant: "destructive",
      });
      return;
    }
    
    // Check cooldown in state first
    if (actionCooldowns["observe"] && !timerSystem.isCooldownExpired(actionCooldowns["observe"])) {
      const remaining = timerSystem.getRemainingCooldown(actionCooldowns["observe"]);
      toast({
        title: "On Cooldown",
        description: `Observe is on cooldown. ${timerSystem.formatTime(remaining)} remaining.`,
        variant: "destructive",
      });
      return;
    }

    // Double-check cooldown in database (prevents refresh exploit)
    const { data: cooldownData } = await supabase
      .from("action_cooldowns")
      .select("expires_at")
      .eq("user_id", userId)
      .eq("action_type", "observe")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cooldownData && !timerSystem.isCooldownExpired(cooldownData.expires_at)) {
      const remaining = timerSystem.getRemainingCooldown(cooldownData.expires_at);
      // Update state with database value
      setActionCooldowns(prev => ({ ...prev, observe: cooldownData.expires_at }));
      toast({
        title: "On Cooldown",
        description: `Observe is on cooldown. ${timerSystem.formatTime(remaining)} remaining.`,
        variant: "destructive",
      });
      return;
    }
    
    // Check action limit
    if (lastActionTime && new Date().getTime() - lastActionTime.getTime() < 60000) {
      toast({
        title: "Action Limit",
        description: "You can only use 1 action per minute",
        variant: "destructive",
      });
      return;
    }
    
    // Apply Observe status (3 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 3);
    
    await supabase.from("observe_status").upsert({
        user_id: userId,
      expires_at: expiresAt.toISOString(),
    });
    
    // Set cooldown (5 minutes)
    const cooldownExpires = timerSystem.calculateCooldownExpiration(5);
    await supabase
      .from("action_cooldowns")
      .upsert({
        user_id: userId,
        action_type: "observe",
        expires_at: cooldownExpires.toISOString(),
      });
    
    setActionCooldowns(prev => ({ ...prev, observe: cooldownExpires.toISOString() }));
    const now = new Date();
    setLastActionTime(now);
    
    // Update last_action_at
    await supabase
      .from("profiles")
      .update({ last_action_at: now.toISOString() })
      .eq("id", userId);

    // Add to battle feed
    await supabase.from("battle_feed").insert({
      user_id: userId,
      action_type: "observe",
      description: "Started observing zones (can target anyone anywhere for 3 minutes)",
        zone_id: currentZone,
    });
    
    toast({
      title: "Observing Zones",
      description: "You can now target anyone anywhere for 3 minutes",
    });
  };
  
  const handleChangeZoneNew = async (zoneId: string) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to change zones",
        variant: "destructive",
      });
      return;
    }
    
    // Ensure zones are loaded
    if (zones.length === 0) {
    toast({
        title: "Loading",
        description: "Zones are still loading. Please wait...",
        variant: "default",
      });
      await fetchZones();
      return;
    }
    
    // Allow zone changes even if not joined, but show a warning
    if (!hasJoined) {
      toast({
        title: "Not Joined",
        description: "You haven't joined the Arena yet. You can still change zones, but you won't be able to use actions until you join.",
        variant: "default",
      });
    }

    // Block action until cooldowns are loaded
    if (!cooldownsLoaded) {
      toast({
        title: "Loading",
        description: "Please wait while cooldowns are being loaded...",
        variant: "destructive",
      });
      return;
    }
    
    // Check cooldown in state first
    if (actionCooldowns["change_zone"] && !timerSystem.isCooldownExpired(actionCooldowns["change_zone"])) {
      const remaining = timerSystem.getRemainingCooldown(actionCooldowns["change_zone"]);
      toast({
        title: "On Cooldown",
        description: `Change Zone is on cooldown. ${timerSystem.formatTime(remaining)} remaining.`,
        variant: "destructive",
      });
      return;
    }

    // Double-check cooldown in database (prevents refresh exploit)
    const { data: cooldownData } = await supabase
      .from("action_cooldowns")
      .select("expires_at")
      .eq("user_id", userId)
      .eq("action_type", "change_zone")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cooldownData && !timerSystem.isCooldownExpired(cooldownData.expires_at)) {
      const remaining = timerSystem.getRemainingCooldown(cooldownData.expires_at);
      // Update state with database value
      setActionCooldowns(prev => ({ ...prev, change_zone: cooldownData.expires_at }));
      toast({
        title: "On Cooldown",
        description: `Change Zone is on cooldown. ${timerSystem.formatTime(remaining)} remaining.`,
        variant: "destructive",
      });
      return;
    }
    
    // Check action limit
    if (lastActionTime && new Date().getTime() - lastActionTime.getTime() < 60000) {
      toast({
        title: "Action Limit",
        description: "You can only use 1 action per minute",
        variant: "destructive",
      });
      return;
    }
    
    // Validate zone exists
    const zoneExists = zones.find((z) => z.id === zoneId);
    if (!zoneExists) {
      toast({
        title: "Error",
        description: "Invalid zone selected. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    // Change zone - update first, insert if no record exists
    const { data: updateData, error: updateError } = await supabase
      .from("player_positions")
      .update({
        zone_id: zoneId,
        last_moved_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()
      .maybeSingle();

    // If update didn't affect any rows (no existing record), insert new record
    if (!updateError && !updateData) {
      const { error: insertError } = await supabase
        .from("player_positions")
        .insert({
          user_id: userId,
          zone_id: zoneId,
          last_moved_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("Zone change insert error:", insertError);
        // If insert fails with conflict, try update one more time (race condition)
        if (insertError.code === "23505" || insertError.message?.includes("duplicate") || insertError.message?.includes("409")) {
          const { error: retryError } = await supabase
            .from("player_positions")
            .update({
              zone_id: zoneId,
              last_moved_at: new Date().toISOString(),
            })
            .eq("user_id", userId);
          
          if (retryError) {
            toast({
              title: "Error",
              description: `Failed to change zone: ${retryError.message || "Unknown error"}`,
              variant: "destructive",
            });
            return;
          }
        } else {
          toast({
            title: "Error",
            description: `Failed to change zone: ${insertError.message || "Unknown error"}`,
            variant: "destructive",
          });
          return;
        }
      }
    } else if (updateError) {
      console.error("Zone change update error:", updateError);
      toast({
        title: "Error",
        description: `Failed to change zone: ${updateError.message || "Unknown error"}`,
        variant: "destructive",
      });
      return;
    }

    setCurrentZone(zoneId);
    
    // Set cooldown (5 minutes)
    const cooldownExpires = timerSystem.calculateCooldownExpiration(5);
    await supabase
      .from("action_cooldowns")
      .upsert({
        user_id: userId,
        action_type: "change_zone",
        expires_at: cooldownExpires.toISOString(),
      });
    
    setActionCooldowns(prev => ({ ...prev, change_zone: cooldownExpires.toISOString() }));
    const now = new Date();
    setLastActionTime(now);
    
    // Update last_action_at
    await supabase
      .from("profiles")
      .update({ last_action_at: now.toISOString() })
      .eq("id", userId);

    // Get zone name
    const zoneIndex = zones.findIndex((z) => z.id === zoneId);
    const zoneNameFromImage = zoneIndex !== -1 ? ZONE_IMAGE_NAMES[zoneIndex % ZONE_IMAGE_NAMES.length] : zones.find((z) => z.id === zoneId)?.name;
    
    // Add to battle feed
    await supabase.from("battle_feed").insert({
      user_id: userId,
      action_type: "change_zone",
      description: `Changed zone to ${zoneNameFromImage}`,
      zone_id: zoneId,
    });
    
    toast({
      title: "Zone Changed",
      description: `Moved to ${zoneNameFromImage}`,
    });
  };

  // ========== COMPREHENSIVE TECHNIQUE USAGE SYSTEM ==========
  
  const handleUseTechnique = async () => {
    if (!userId || !hasJoined) {
      toast({
        title: "Error",
        description: "You must join the Arena first",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedTechnique) {
    toast({
        title: "Error",
        description: "Please select a technique",
        variant: "destructive",
      });
      return;
    }
    
    // Check action limit (1 action + 1 technique per minute)
    if (lastTechniqueTime && new Date().getTime() - lastTechniqueTime.getTime() < 60000) {
      toast({
        title: "Action Limit",
        description: "You can only use 1 technique per minute",
        variant: "destructive",
      });
      return;
    }
    
    // Get technique data (use cached or fetch)
    let techniqueData = fullTechniqueData[selectedTechnique];
    if (!techniqueData) {
      const { data, error: techError } = await supabase
        .from("techniques")
        .select("*")
        .eq("id", selectedTechnique)
        .single();
      
      if (techError || !data) {
        toast({
          title: "Error",
          description: "Technique not found",
          variant: "destructive",
        });
        return;
      }
      techniqueData = data;
      setFullTechniqueData(prev => ({ ...prev, [selectedTechnique]: data }));
    }
    
    // Check if user can use technique (status checks)
    const activeStatuses = playerStatuses.map(s => s.status);
    if (statusSystem.statusBlocksTechniques(activeStatuses)) {
      toast({
        title: "Cannot Use Technique",
        description: "You are stunned, silenced, or K.O'd",
        variant: "destructive",
      });
      return;
    }
    
    // Handle tags - can be array or comma-separated string
    let tags: string[] = [];
    if (Array.isArray(techniqueData.tags)) {
      tags = techniqueData.tags;
    } else if (typeof techniqueData.tags === 'string') {
      tags = techniqueData.tags.split(",").map(t => t.trim());
    } else if (techniqueData.type_info) {
      tags = techniqueData.type_info.split(",").map(t => t.trim());
    }
    
    // Check battle timer phase (SETUP/COMBO only in first 30s)
    if (currentSession?.battle_timer_ends_at && timerSystem.isInSetupPhase(currentSession.battle_timer_ends_at)) {
      const hasSetupOrCombo = tags.includes("Setup") || tags.includes("Combo");
      if (!hasSetupOrCombo) {
        toast({
          title: "Setup Phase",
          description: "Only SETUP and COMBO techniques can be used in the first 30 seconds",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Check energy cost
    const energyCost = techniqueData.energy_cost || 0;
    if (energy > 0 && energy < energyCost) {
      toast({
        title: "Not enough Energy",
        description: `This technique requires ${energyCost} Energy`,
        variant: "destructive",
      });
      return;
    }
    
    // Check mastery requirements
    if (techniqueData.no_use_m && mastery < techniqueData.no_use_m) {
      toast({
        title: "Insufficient Mastery",
        description: `This technique requires ${techniqueData.no_use_m} Mastery`,
        variant: "destructive",
      });
      return;
    }
    
    // Check combo requirement (1.5+ Mastery)
    if (tags.includes("Combo") && mastery < 1.5) {
      toast({
        title: "Insufficient Mastery",
        description: "Combo techniques require at least 1.5 Mastery",
        variant: "destructive",
      });
      return;
    }
    
    // Check cooldown
    if (techniqueCooldowns[selectedTechnique] && !timerSystem.isCooldownExpired(techniqueCooldowns[selectedTechnique])) {
      const remaining = timerSystem.getRemainingCooldown(techniqueCooldowns[selectedTechnique]);
      toast({
        title: "Technique on Cooldown",
        description: `${timerSystem.formatTime(remaining)} remaining`,
        variant: "destructive",
      });
      return;
    }
    
    // Check if technique blocks specific tags
    if (statusSystem.statusBlocksTechniqueTag(activeStatuses, "Movement") && tags.includes("Movement")) {
      toast({
        title: "Cannot Use",
        description: "You cannot use Movement techniques while Unwell",
        variant: "destructive",
      });
      return;
    }
    
    // Determine target(s)
    let targets: string[] = [];
    if (selectedZoneTarget && (tags.includes("Global") || currentProfile?.discipline === "Emperor")) {
      // Zone targeting - get all players in zone
      const playersInZone = getPlayersInZone(selectedZoneTarget);
      targets = playersInZone.map(p => p.user_id);
    } else if (currentTarget) {
      // Single target
      targets = [currentTarget];
    } else if (tags.includes("Global")) {
      // Global technique - all players in current zone
      const playersInZone = getPlayersInZone(currentZone);
      targets = playersInZone.map(p => p.user_id);
    } else {
      toast({
        title: "No Target",
        description: "Please select a target first",
        variant: "destructive",
      });
      return;
    }
    
    // Apply technique effects to each target
    for (const targetId of targets) {
      if (targetId === userId) continue; // Skip self unless self-targeting
      
      // Fetch target's current stats and statuses
      const { data: targetProfile } = await supabase
        .from("profiles")
        .select("current_hp, max_hp, armor, aura, current_atk, max_atk, energy, mastery")
        .eq("id", targetId)
        .single();
      
      const { data: targetStatuses } = await supabase
        .from("player_statuses")
        .select("status")
        .eq("user_id", targetId)
        .gt("expires_at", new Date().toISOString());
      
      const targetActiveStatuses = (targetStatuses || []).map(s => s.status);
      
      // Check if target can be hit
      if (targetActiveStatuses.includes("Hidden") && !tags.includes("Aoe") && !tags.includes("Setup")) {
        continue; // Skip hidden targets unless AOE/SETUP
      }
      
      if (targetActiveStatuses.includes("Airborne") || targetActiveStatuses.includes("Underground")) {
        if (!statusSystem.canHitAirborneUnderground(activeStatuses) && !tags.includes("Aoe") && !tags.includes("Global")) {
          continue; // Skip airborne/underground unless FOCUSED or AOE/GLOBAL
        }
      }
      
      // Check No Hit conditions
      if (techniqueData.no_hit_m && (targetProfile?.mastery || 0) >= techniqueData.no_hit_m) {
        continue; // Skip if target has required Mastery
      }
      
      if (techniqueData.no_hit_e && (targetProfile?.energy || 0) >= techniqueData.no_hit_e) {
        continue; // Skip if target has required Energy
      }
      
      if (techniqueData.specific_status_hit && !targetActiveStatuses.includes(techniqueData.specific_status_hit)) {
        continue; // Skip if target doesn't have required status
      }
      
      // Calculate damage with multipliers
      let damage = techniqueData.damage || 0;
      let armorDamage = techniqueData.armor_damage || 0;
      let auraDamage = techniqueData.aura_damage || 0;
      
      // Apply damage multipliers
      const damageMultiplier = statusSystem.getDamageMultiplier(targetActiveStatuses, tags);
      damage = Math.floor(damage * damageMultiplier);
      
      // Setup tag: 1.5x damage to Aura
      if (tags.includes("Setup") && targetProfile?.aura) {
        damage = Math.floor(damage * 1.5);
      }
      
      // Apply damage
      if (damage > 0) {
        // Check if damage is ignored
        if (!statusSystem.statusIgnoresDamage(targetActiveStatuses) || tags.includes("Aoe") || tags.includes("Global")) {
          const result = statsSystem.applyDamage(
            damage,
            targetProfile?.current_hp || targetProfile?.max_hp || 100,
            targetProfile?.armor || 0,
            targetProfile?.aura || 0
          );
          
          await supabase
            .from("profiles")
            .update({
              current_hp: result.newHP,
              armor: result.newArmor,
              aura: result.newAura,
            })
            .eq("id", targetId);
          
          // Check for K.O
          if (result.newHP === 0) {
            await applyKOStatus(targetId);
          }
        }
      }
      
      // Apply armor damage
      if (armorDamage > 0) {
        const newArmor = statsSystem.applyArmorDamage(armorDamage, targetProfile?.armor || 0);
        await supabase
          .from("profiles")
          .update({ armor: newArmor })
          .eq("id", targetId);
      }
      
      // Apply aura damage
      if (auraDamage > 0) {
        const newAura = statsSystem.applyAuraDamage(auraDamage, targetProfile?.aura || 0);
        await supabase
          .from("profiles")
          .update({ aura: newAura })
          .eq("id", targetId);
      }
      
      // Apply ATK debuff
      if (techniqueData.atk_debuff) {
        const newATK = Math.max(0, (targetProfile?.current_atk || targetProfile?.max_atk || 20) - techniqueData.atk_debuff);
        await supabase
          .from("profiles")
          .update({ current_atk: newATK })
          .eq("id", targetId);
      }
      
      // Apply Mastery taken
      if (techniqueData.mastery_taken) {
        const newMastery = Math.max(0, (targetProfile?.mastery || 0) - techniqueData.mastery_taken);
        await supabase
          .from("profiles")
          .update({ mastery: newMastery })
          .eq("id", targetId);
      }
      
      // Apply opponent status
      if (techniqueData.opponent_status) {
        const statusDuration = statusSystem.calculateStatusDuration(mastery, techniqueData.opponent_status as statusSystem.StatusType);
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + statusDuration);
        
        await supabase.from("player_statuses").insert({
          user_id: targetId,
          status: techniqueData.opponent_status,
          applied_by_user_id: userId,
          applied_by_mastery: mastery,
          expires_at: expiresAt.toISOString(),
        });
      }
    }
    
    // Apply self effects
    // Heal
    if (techniqueData.heal) {
      const healMultiplier = statusSystem.getHealMultiplier(activeStatuses);
      const healAmount = Math.floor(techniqueData.heal * healMultiplier);
      if (healAmount > 0) {
        const newHP = statsSystem.applyHeal(healAmount, currentHP, maxHP);
        setCurrentHP(newHP);
        await supabase
          .from("profiles")
          .update({ current_hp: newHP })
          .eq("id", userId);
      }
    }
    
    // Armor given
    if (techniqueData.armor_given) {
      const newArmor = (armor || 0) + techniqueData.armor_given;
      setArmor(newArmor);
      await supabase
        .from("profiles")
        .update({ armor: newArmor })
        .eq("id", userId);
    }
    
    // Given Aura (always lasts 2 minutes)
    if (techniqueData.given_aura) {
      const expiresAt = statsSystem.calculateAuraExpiration();
      setAura((aura || 0) + techniqueData.given_aura);
      await supabase
        .from("profiles")
        .update({
          aura: (aura || 0) + techniqueData.given_aura,
          aura_expires_at: expiresAt.toISOString(),
        })
        .eq("id", userId);
    }
    
    // Energy given
    if (techniqueData.energy_given) {
      const newEnergy = (energy || 0) + techniqueData.energy_given;
      setEnergy(newEnergy);
      await supabase
        .from("profiles")
        .update({ energy: newEnergy })
        .eq("id", userId);
    }
    
    // ATK boost
    if (techniqueData.atk_boost) {
      const newATK = currentATK + techniqueData.atk_boost;
      setCurrentATK(newATK);
      await supabase
        .from("profiles")
        .update({ current_atk: newATK })
        .eq("id", userId);
    }
    
    // Mastery given
    if (techniqueData.mastery_given) {
      const newMastery = masterySystem.capMastery(mastery + techniqueData.mastery_given);
      setMastery(newMastery);
      await supabase
        .from("profiles")
        .update({ mastery: newMastery })
        .eq("id", userId);
    }
    
    // Apply self status
    if (techniqueData.self_status) {
      const statusDuration = statusSystem.calculateStatusDuration(mastery, techniqueData.self_status as statusSystem.StatusType);
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + statusDuration);
      
      await supabase.from("player_statuses").insert({
        user_id: userId,
        status: techniqueData.self_status,
        applied_by_user_id: userId,
        applied_by_mastery: mastery,
        expires_at: expiresAt.toISOString(),
      });
      
      // Refresh statuses
      await fetchPlayerStatuses(userId);
    }
    
    // Deduct energy cost
    if (energyCost > 0) {
      const newEnergy = Math.max(0, (energy || 0) - energyCost);
      setEnergy(newEnergy);
      await supabase
        .from("profiles")
        .update({ energy: newEnergy })
        .eq("id", userId);
    }
    
    // Set cooldown
    if (techniqueData.cooldown_minutes > 0) {
      const cooldownExpires = timerSystem.calculateCooldownExpiration(techniqueData.cooldown_minutes);
      await supabase
        .from("technique_cooldowns")
        .upsert({
          user_id: userId,
          technique_id: selectedTechnique,
          expires_at: cooldownExpires.toISOString(),
        });
      
      setTechniqueCooldowns(prev => ({
        ...prev,
        [selectedTechnique]: cooldownExpires.toISOString(),
      }));
    }
    
    // Update timestamps
    const now = new Date();
    setLastTechniqueTime(now);
    await supabase
      .from("profiles")
      .update({ last_technique_at: now.toISOString() })
      .eq("id", userId);
    
    // Add to battle feed
    await supabase.from("battle_feed").insert({
      user_id: userId,
      action_type: "technique",
      technique_id: selectedTechnique,
      technique_name: techniqueData.name,
      technique_image_url: techniqueData.image_url,
      technique_description: techniqueData.description,
      description: `Used ${techniqueData.name}`,
      zone_id: currentZone,
    });
    
    // Show success
    toast({
      title: "Technique Used",
      description: `${techniqueData.name} executed successfully`,
    });
    
    // Close dialog and reset
    setShowActionDialog(false);
    setSelectedTechnique(null);
    setSelectedStatus("");
    setIncludeDiceRoll(false);
    setSelectedAction(null);
    
    // Refresh data
    fetchProfile(userId);
    fetchPlayerPositions();
    fetchPlayerStatuses(userId);
    fetchCooldowns(userId);
  };

  // ========== END COMPREHENSIVE TECHNIQUE USAGE SYSTEM ==========

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Vanishing Toasts */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {vanishingToasts.map((toast) => (
            <div
              key={toast.id}
              className="bg-card border-2 border-border rounded-lg p-3 shadow-lg animate-in slide-in-from-right fade-in max-w-sm"
            >
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={resolveProfileImage(toast.profilePicture)} alt={toast.username} />
                  <AvatarFallback>{toast.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{toast.username}</p>
                  {toast.techniqueName && (
                    <div className="flex items-center gap-2 mt-1">
                      {toast.techniqueImage && (
                        <img src={toast.techniqueImage} alt={toast.techniqueName} className="w-6 h-6 rounded" />
                      )}
                      <p className="text-xs text-muted-foreground truncate">{toast.techniqueName}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
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
                Protocols
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
                      src={resolveProfileImage(currentProfile?.profile_picture_url, currentProfile?.username)}
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
              {/* New Arena System Stats Display - Compact Format */}
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">HP:</span>
                  <span className="text-foreground">{currentHP}/{maxHP}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">ATK:</span>
                  <span className="text-foreground">{currentATK}/{maxATK}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Armor:</span>
                  <span className="text-foreground">{armor || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Energy:</span>
                  <span className="text-foreground">{energy || 0}</span>
              </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Aura:</span>
                  <span className="text-foreground">{aura || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">M:</span>
                  <span className="text-foreground">{mastery.toFixed(2)}</span>
                </div>
              </div>
              
              {/* Active Statuses */}
              {playerStatuses.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Active Statuses:</p>
                  <div className="flex flex-wrap gap-1">
                    {playerStatuses.map((status) => (
                      <Badge key={status.id} variant="secondary" className="text-xs">
                        {status.status}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Current Target Display */}
              {(currentTarget || selectedZoneTarget) && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Current target:</p>
                      <p className="text-sm font-bold text-primary">
                        {selectedZoneTarget 
                          ? ZONE_IMAGE_NAMES[zones.findIndex(z => z.id === selectedZoneTarget) % ZONE_IMAGE_NAMES.length]
                          : playerPositions.find(p => p.user_id === currentTarget)?.profiles.username || "Unknown"
                        }
                      </p>
                    </div>
                    {hasJoined && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          setCurrentTarget(null);
                          setSelectedZoneTarget(null);
                          await supabase
                            .from("profiles")
                            .update({ 
                              current_target_id: null,
                              current_target_zone_id: null,
                              is_targeting_zone: false
                            })
                            .eq("id", userId);
                          toast({
                            title: "Target Cleared",
                            description: "You are no longer targeting anyone",
                          });
                        }}
                      >
                        Untarget
              </Button>
                    )}
                  </div>
                </div>
              )}
              
              {/* Arena Status & Timers - Always Visible */}
              {currentSession && (
                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  {/* Arena Open/Close Timer */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Arena Status:</p>
                    {timerSystem.isArenaOpen(currentSession.opened_at, currentSession.closed_at) ? (
                      <p className="text-sm font-bold text-green-500">
                        Open - Closes in {timerSystem.formatTime(timerSystem.getTimeUntilArenaCloses(currentSession.closed_at))}
                      </p>
                    ) : (
                      <p className="text-sm font-bold text-orange-500">
                        Closed - Opens in {timerSystem.formatTime(arenaOpenTimer)}
                      </p>
                    )}
                  </div>
                  
                  {/* Battle Timer Display */}
                  {currentSession.battle_timer_ends_at && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Battle Timer:</p>
                      <p className={`text-lg font-bold ${timerSystem.isInSetupPhase(currentSession.battle_timer_ends_at) ? 'text-orange-500' : 'text-green-500'}`}>
                        {timerSystem.formatTime(battleTimer)}
                      </p>
                      {timerSystem.isInSetupPhase(currentSession.battle_timer_ends_at) && (
                        <p className="text-xs text-muted-foreground mt-1">Setup Phase (SETUP/COMBO only)</p>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Join Button - Always Visible When Session Exists */}
              {!hasJoined && currentSession && (
              <Button 
                  onClick={handleJoinArena}
                className="w-full mt-4"
                  variant={timerSystem.isArenaOpen(currentSession.opened_at, currentSession.closed_at) ? "default" : "outline"}
                  disabled={!timerSystem.isArenaOpen(currentSession.opened_at, currentSession.closed_at)}
                >
                  {timerSystem.isArenaOpen(currentSession.opened_at, currentSession.closed_at) 
                    ? "Join Arena" 
                    : `Arena opens in ${timerSystem.formatTime(arenaOpenTimer)}`
                  }
              </Button>
              )}
              
              {/* Action Buttons - Always visible, disabled when not joined or arena closed */}
              <div className="mt-4 space-y-2">
                <Button 
                  onClick={handleAttack}
                  className="w-full"
                  variant="destructive"
                  disabled={
                    !hasJoined ||
                    !currentSession ||
                    !timerSystem.isArenaOpen(currentSession.opened_at, currentSession.closed_at) ||
                    !timerSystem.isCooldownExpired(actionCooldowns["attack"]) ||
                    (lastActionTime && new Date().getTime() - lastActionTime.getTime() < 60000) ||
                    statusSystem.statusBlocksActions(playerStatuses.map(s => s.status))
                  }
                >
                  Attack
                  {actionCooldowns["attack"] && !timerSystem.isCooldownExpired(actionCooldowns["attack"]) && (
                    <span className="ml-2 text-xs">
                      ({timerSystem.formatTime(timerSystem.getRemainingCooldown(actionCooldowns["attack"]))})
                    </span>
                  )}
                </Button>
                <Button 
                  onClick={handleMoveAround}
                  className="w-full"
                  variant="outline"
                  disabled={
                    !hasJoined ||
                    !currentSession ||
                    !timerSystem.isArenaOpen(currentSession.opened_at, currentSession.closed_at) ||
                    (lastActionTime && new Date().getTime() - lastActionTime.getTime() < 60000) ||
                    statusSystem.statusBlocksActions(playerStatuses.map(s => s.status))
                  }
                >
                  Move Around
                </Button>
                <Button 
                  onClick={handleObserve}
                  className="w-full"
                  variant="outline"
                  disabled={
                    !hasJoined ||
                    !currentSession ||
                    !timerSystem.isArenaOpen(currentSession.opened_at, currentSession.closed_at) ||
                    mastery < 1 ||
                    !timerSystem.isCooldownExpired(actionCooldowns["observe"]) ||
                    (lastActionTime && new Date().getTime() - lastActionTime.getTime() < 60000) ||
                    statusSystem.statusBlocksActions(playerStatuses.map(s => s.status))
                  }
                >
                  Observe
                  {actionCooldowns["observe"] && !timerSystem.isCooldownExpired(actionCooldowns["observe"]) && (
                    <span className="ml-2 text-xs">
                      ({timerSystem.formatTime(timerSystem.getRemainingCooldown(actionCooldowns["observe"]))})
                    </span>
                  )}
                </Button>
                <Button 
                  onClick={() => setShowZoneSelectDialog(true)}
                  className="w-full"
                  variant="outline"
                  disabled={
                    !timerSystem.isCooldownExpired(actionCooldowns["change_zone"]) ||
                    (lastActionTime && new Date().getTime() - lastActionTime.getTime() < 60000) ||
                    statusSystem.statusBlocksActions(playerStatuses.map(s => s.status))
                  }
                >
                  Change Zone
                  {actionCooldowns["change_zone"] && !timerSystem.isCooldownExpired(actionCooldowns["change_zone"]) && (
                    <span className="ml-2 text-xs">
                      ({timerSystem.formatTime(timerSystem.getRemainingCooldown(actionCooldowns["change_zone"]))})
                    </span>
                  )}
                </Button>
              </div>
              
              {/* Legacy Take Action Button (for techniques) */}
              {hasJoined && (
              <Button 
                onClick={() => setShowActionDialog(true)}
                  className="w-full mt-2"
                variant="default"
              >
                  Use Technique
              </Button>
              )}
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
                  const zoneNameFromImage = ZONE_IMAGE_NAMES[index % ZONE_IMAGE_NAMES.length];
                  return (
                    <div key={zone.id}>
                      <div className="flex items-center gap-2 mb-2">
                      <div
                          className={`relative cursor-pointer transition-all duration-300 hover:scale-105 flex-1 ${
                          isCurrentZone ? 'ring-4 ring-primary animate-pulse' : ''
                        }`}
                          onClick={() => handleChangeZoneNew(zone.id)}
                          title={zoneNameFromImage}
                      >
                        <img 
                          src={zoneImage} 
                            alt={zoneNameFromImage}
                          className="w-[360px] h-[48px] rounded-lg border-2 border-border object-cover"
                        />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs font-semibold px-2 py-1 rounded-b-lg text-center">
                            {zoneNameFromImage}
                          </div>
                        </div>
                        {/* Zone Targeting Button */}
                        {hasJoined && (
                          <Button
                            size="sm"
                            variant={selectedZoneTarget === zone.id ? "default" : "outline"}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (selectedZoneTarget === zone.id) {
                                setSelectedZoneTarget(null);
                                supabase
                                  .from("profiles")
                                  .update({ is_targeting_zone: false, current_target_zone_id: null })
                                  .eq("id", userId);
                              } else {
                                setSelectedZoneTarget(zone.id);
                                setCurrentTarget(null);
                                supabase
                                  .from("profiles")
                                  .update({ 
                                    is_targeting_zone: true, 
                                    current_target_zone_id: zone.id,
                                    current_target_id: null
                                  })
                                  .eq("id", userId);
                                toast({
                                  title: "Zone Targeted",
                                  description: `Targeting ${zoneNameFromImage}`,
                                });
                              }
                            }}
                          >
                            Target Zone
                          </Button>
                        )}
                      </div>
                      {playersInZone.length > 0 && (
                        <div className="flex flex-wrap gap-2 pl-4">
                           {playersInZone.map((player) => (
                            <div key={player.user_id} className="relative">
                              <Avatar 
                                className={`w-10 h-10 border-2 cursor-pointer hover:border-primary transition-colors ${
                                      currentTarget === player.user_id ? 'border-destructive ring-2 ring-destructive' : 'border-border'
                                }`}
                                onClick={() => setShowPlayerPopup(showPlayerPopup === player.user_id ? null : player.user_id)}
                              >
                                      <AvatarImage
                                  src={resolveProfileImage(player.profiles.profile_picture_url, player.profiles.username)}
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
                              
                              {/* Player Popup Dialog */}
                              {showPlayerPopup === player.user_id && (
                                <Dialog open={showPlayerPopup === player.user_id} onOpenChange={(open) => !open && setShowPlayerPopup(null)}>
                                  <DialogContent className="max-w-md">
                                    <DialogHeader>
                                      <DialogTitle className="flex items-center gap-2">
                                        <Avatar className="w-12 h-12">
                                          <AvatarImage
                                            src={resolveProfileImage(player.profiles.profile_picture_url, player.profiles.username)}
                                            alt={player.profiles.username}
                                          />
                                          <AvatarFallback>
                                            {player.profiles.username.substring(0, 2).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-bold">{player.profiles.username}</p>
                                          <p className="text-sm text-muted-foreground">{player.profiles.discipline}</p>
                                          </div>
                                      </DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      {/* Stats - Compact Format */}
                                      <div className="space-y-1 text-sm">
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium">HP:</span>
                                          <span>{(player.profiles as any).current_hp || player.profiles.health}/{(player.profiles as any).max_hp || player.profiles.health}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium">ATK:</span>
                                          <span>{(player.profiles as any).current_atk || 20}/{(player.profiles as any).max_atk || 20}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium">Armor:</span>
                                          <span>{player.profiles.armor}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium">Energy:</span>
                                          <span>{player.profiles.energy}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium">Aura:</span>
                                          <span>{(player.profiles as any).aura || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium">M:</span>
                                          <span>{((player.profiles as any).mastery || 0).toFixed(2)}</span>
                                        </div>
                                      </div>
                                      
                                      {/* Action Buttons - Always visible for other players */}
                                      {player.user_id !== userId && (
                                        <div className="space-y-2 pt-4 border-t">
                                          <Button
                                            size="sm"
                                            variant={currentTarget === player.user_id ? "default" : "outline"}
                                            className="w-full"
                                            onClick={async () => {
                                              // If untargeting, always allow (no zone check needed)
                                              const isUntargeting = currentTarget === player.user_id;
                                              
                                              // Only check zone when targeting (not untargeting)
                                              if (!isUntargeting) {
                                                // Check if in same zone or observing
                                                const { data: observeStatus } = await supabase
                                                  .from("observe_status")
                                                  .select("expires_at")
                                                  .eq("user_id", userId)
                                                  .gt("expires_at", new Date().toISOString())
                                                  .maybeSingle();
                                                
                                                if (player.zone_id !== currentZone && !observeStatus) {
                                                  toast({
                                                    title: "Error",
                                                    description: "You are not in the same zone",
                                                    variant: "destructive",
                                                  });
                                                  return;
                                                }
                                              }
                                              
                                              await handleTargetPlayer(player.user_id);
                                              setShowPlayerPopup(null);
                                            }}
                                          >
                                            {currentTarget === player.user_id ? "Untarget" : "Target"}
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full"
                                            disabled={mastery < 1}
                                            onClick={async () => {
                                              if (mastery < 1) {
                                                toast({
                                                  title: "Insufficient Mastery",
                                                  description: "You need at least 1 Mastery to view Battle Feed",
                                                  variant: "destructive",
                                                });
                                                return;
                                              }
                                              // Show battle feed for this player
                                              const { data: feed } = await supabase
                                                .from("battle_feed")
                                                .select("*")
                                                .eq("user_id", player.user_id)
                                                .order("created_at", { ascending: false })
                                                .limit(20);
                                              
                                              // Open dialog with battle feed
                                              // (You can create a separate dialog for this)
                                              toast({
                                                title: "Battle Feed",
                                                description: `Viewing ${player.profiles.username}'s battle feed (${feed?.length || 0} entries)`,
                                              });
                                            }}
                                          >
                                            Battle Feed
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full"
                                            disabled={mastery < 3}
                                            onClick={async () => {
                                              if (mastery < 3) {
                                                toast({
                                                  title: "Insufficient Mastery",
                                                  description: "Teleport costs 3 Mastery",
                                                  variant: "destructive",
                                                });
                                                return;
                                              }
                                              
                                              // Deduct Mastery and teleport
                                              const newMastery = mastery - 3;
                                              setMastery(newMastery);
                                              const { error: masteryError } = await supabase
                                                .from("profiles")
                                                .update({ mastery: newMastery })
                                                .eq("id", userId);
                                              
                                              if (masteryError) {
                                                toast({
                                                  title: "Error",
                                                  description: "Failed to deduct Mastery",
                                                  variant: "destructive",
                                                });
                                                return;
                                              }
                                              
                                              // Teleport to target's zone
                                              await handleChangeZoneNew(player.zone_id);
                                              
                                              // Refresh player positions to update UI
                                              await fetchPlayerPositions();
                                              
                                              // Update current zone state
                                              setCurrentZone(player.zone_id);
                                              
                                              setShowPlayerPopup(null);
                                              
                                              toast({
                                                title: "Teleported",
                                                description: `Teleported to ${player.profiles.username}'s zone`,
                                              });
                                            }}
                                          >
                                            Teleport to
                                          </Button>
                                      </div>
                                    )}
                                      
                                      {isAdmin && player.user_id !== userId && (
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          className="w-full mt-2"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveFromArena(player.user_id, player.profiles.username);
                                            setShowPlayerPopup(null);
                                          }}
                                        >
                                          Remove from Arena
                                        </Button>
                                    )}
                                  </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
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
                <div className="flex items-center gap-4 flex-wrap">
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
                  <Button
                    onClick={() => setShowZoneCodex(true)}
                    variant="outline"
                    className="text-lg"
                  >
                    Zone Signatures &amp; Codex
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

      {/* Zone Signatures & Codex Dialog */}
      <Dialog open={showZoneCodex} onOpenChange={setShowZoneCodex}>
        <DialogContent className="max-w-6xl w-[90vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Zone Signatures and Codex Titles</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-foreground">
            <p>Use the horizontal scrollbar to see the other images.</p>
            <div className="bg-[#333] overflow-x-auto whitespace-nowrap p-3 rounded-lg border border-border">
              {zoneSignatureImages.map((img) => (
                <img
                  key={img.src}
                  src={img.src}
                  alt={img.alt}
                  className="inline-block mr-2 h-[218px] w-[400px] object-cover rounded-md border border-border"
                />
              ))}
            </div>
            <p>
              Remember, you must stay inactive for the amount of time mentioned to complete a zone signature. And below are the titles that can be purchased in The Yards. They last 48 hours and will automatically disappear from your profile.
            </p>
            <p>
              <a
                href="https://ibb.co/6R8nMb13"
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src="https://i.ibb.co/XZD2Qp3h/Codex-1st-wave.png"
                  alt="Codex 1st wave"
                  className="max-w-full h-auto rounded-md border border-border"
                />
              </a>
            </p>
          </div>
        </DialogContent>
      </Dialog>

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

                  {/* Selected Technique Details - Enhanced with all new fields */}
                  {selectedTechnique && (
                    <div className="mt-4 rounded-md border border-border bg-muted/40 p-3 text-sm text-foreground space-y-2">
                      {(() => {
                        const technique = userTechniques.find((t: any) => t.id === selectedTechnique);
                        if (!technique) return null;
                        
                        // Use full technique data if available
                        const tech = fullTechniqueData[selectedTechnique] || technique;
                        // Handle tags - can be array or comma-separated string
                        let tags: string[] = [];
                        if (Array.isArray(tech.tags)) {
                          tags = tech.tags;
                        } else if (typeof tech.tags === 'string') {
                          tags = tech.tags.split(",").map(t => t.trim());
                        } else if (tech.type_info) {
                          tags = tech.type_info.split(",").map(t => t.trim());
                        }
                        const isOnCooldown = techniqueCooldowns[selectedTechnique] && !timerSystem.isCooldownExpired(techniqueCooldowns[selectedTechnique]);
                        const canUse = !isOnCooldown && 
                                      (tech.energy_cost || 0) <= (energy || 0) &&
                                      (!tech.no_use_m || mastery >= tech.no_use_m) &&
                                      (!tags.includes("Combo") || mastery >= 1.5);
                        
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <p className="font-semibold">{tech.name}</p>
                              {tech.image_url && (
                                <img src={tech.image_url} alt={tech.name} className="w-12 h-12 rounded border border-border" />
                              )}
                            </div>
                            <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                              {tech.description}
                            </p>
                            
                            {/* New Fields Display */}
                            <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                              {tech.damage > 0 && (
                                <p><span className="font-semibold">Damage:</span> {tech.damage}</p>
                              )}
                              {tech.armor_damage > 0 && (
                                <p><span className="font-semibold">Armor Damage:</span> {tech.armor_damage}</p>
                              )}
                              {tech.aura_damage > 0 && (
                                <p><span className="font-semibold">Aura Damage:</span> {tech.aura_damage}</p>
                              )}
                              {tech.heal > 0 && (
                                <p><span className="font-semibold">Heal:</span> {tech.heal}</p>
                              )}
                              {tech.armor_given > 0 && (
                                <p><span className="font-semibold">Armor Given:</span> {tech.armor_given}</p>
                              )}
                              {tech.given_aura > 0 && (
                                <p><span className="font-semibold">Aura Given:</span> {tech.given_aura} (2min)</p>
                              )}
                              {tech.energy_cost > 0 && (
                                <p className={tech.energy_cost > (energy || 0) ? "text-destructive" : ""}>
                                  <span className="font-semibold">Energy Cost:</span> {tech.energy_cost}
                                </p>
                              )}
                              {tech.energy_given > 0 && (
                                <p><span className="font-semibold">Energy Given:</span> {tech.energy_given}</p>
                              )}
                              {tech.cooldown_minutes > 0 && (
                                <p>
                                  <span className="font-semibold">Cooldown:</span> {tech.cooldown_minutes}min
                                  {isOnCooldown && (
                                    <span className="text-destructive ml-1">
                                      ({timerSystem.formatTime(timerSystem.getRemainingCooldown(techniqueCooldowns[selectedTechnique]))})
                                    </span>
                                  )}
                                </p>
                              )}
                              {tech.atk_boost > 0 && (
                                <p><span className="font-semibold">ATK Boost:</span> +{tech.atk_boost}</p>
                              )}
                              {tech.atk_debuff > 0 && (
                                <p><span className="font-semibold">ATK Debuff:</span> -{tech.atk_debuff}</p>
                              )}
                              {tech.mastery_given > 0 && (
                                <p><span className="font-semibold">Mastery Given:</span> +{tech.mastery_given}</p>
                              )}
                              {tech.mastery_taken > 0 && (
                                <p><span className="font-semibold">Mastery Taken:</span> -{tech.mastery_taken}</p>
                              )}
                              {tech.no_use_m && (
                                <p className={mastery < tech.no_use_m ? "text-destructive" : ""}>
                                  <span className="font-semibold">Requires M:</span> {tech.no_use_m}
                                </p>
                              )}
                              {tech.opponent_status && (
                                <p><span className="font-semibold">Applies Status:</span> {tech.opponent_status}</p>
                              )}
                              {tech.self_status && (
                                <p><span className="font-semibold">Self Status:</span> {tech.self_status}</p>
                              )}
                            </div>
                            
                            {/* Tags */}
                            <div className="mt-2">
                              <p className="text-xs font-semibold mb-1">Tags:</p>
                              <div className="flex flex-wrap gap-1">
                                {tags.map((tag: string) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            {/* Requirements Check */}
                            {!canUse && (
                              <div className="mt-2 p-2 bg-destructive/10 border border-destructive rounded text-xs">
                                <p className="font-semibold text-destructive">Cannot Use:</p>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                  {isOnCooldown && (
                                    <li>Technique is on cooldown</li>
                                  )}
                                  {tech.energy_cost > (energy || 0) && (
                                    <li>Not enough Energy (need {tech.energy_cost}, have {energy || 0})</li>
                                  )}
                                  {tech.no_use_m && mastery < tech.no_use_m && (
                                    <li>Insufficient Mastery (need {tech.no_use_m}, have {mastery.toFixed(2)})</li>
                                  )}
                                  {tags.includes("Combo") && mastery < 1.5 && (
                                    <li>Combo requires 1.5+ Mastery</li>
                                  )}
                                </ul>
                              </div>
                            )}
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
            <Button 
              onClick={handleUseTechnique} 
              className="w-full"
              disabled={
                !selectedTechnique ||
                (techniqueCooldowns[selectedTechnique || ""] && !timerSystem.isCooldownExpired(techniqueCooldowns[selectedTechnique || ""])) ||
                (lastTechniqueTime && new Date().getTime() - lastTechniqueTime.getTime() < 60000) ||
                statusSystem.statusBlocksTechniques(playerStatuses.map(s => s.status))
              }
            >
              Use Technique
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Zone Select Dialog for Change Zone Action */}
      <Dialog open={showZoneSelectDialog} onOpenChange={setShowZoneSelectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Zone</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {zones.map((zone, index) => {
              const zoneImage = ZONE_IMAGE_LIST[index % ZONE_IMAGE_LIST.length];
              const zoneNameFromImage = ZONE_IMAGE_NAMES[index % ZONE_IMAGE_NAMES.length];
              const isCurrentZone = currentZone === zone.id;
              return (
                <Button
                  key={zone.id}
                  variant={isCurrentZone ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => {
                    handleChangeZoneNew(zone.id);
                    setShowZoneSelectDialog(false);
                  }}
                  disabled={isCurrentZone}
                >
                  <img 
                    src={zoneImage} 
                    alt={zoneNameFromImage}
                    className="w-12 h-8 rounded mr-2 object-cover"
                  />
                  <span>{zoneNameFromImage}</span>
                  {isCurrentZone && <span className="ml-auto text-xs">(Current)</span>}
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Arena;
