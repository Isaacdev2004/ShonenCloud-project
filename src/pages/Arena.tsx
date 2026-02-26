import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
import koImage from "@/assets/K O IMAGE.jpeg";
// New Arena System Imports
import * as statusSystem from "@/lib/arena/statusSystem";
import * as masterySystem from "@/lib/arena/masterySystem";
import * as statsSystem from "@/lib/arena/statsSystem";
import * as timerSystem from "@/lib/arena/timerSystem";
import { getRandomMoveAroundResult, MOVE_AROUND_RESULTS } from "@/lib/arena/moveAroundResults";
import { toast as sonnerToast } from "sonner";

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
  action_type?: string;
  target_user_id?: string | null;
  created_at: string;
  profiles: {
    username: string;
    profile_picture_url: string;
    discipline: string;
  };
  target_profile?: {
    username: string;
    profile_picture_url: string;
  } | null;
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
  target_user_id: string | null;
  created_at: string;
  profiles?: {
    username: string;
    profile_picture_url: string;
  };
  target_profile?: {
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
  const [selectedTechnique, setSelectedTechnique] = useState<string | null>(null);
  const [arenaPosts, setArenaPosts] = useState<ArenaPost[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [playerTitles, setPlayerTitles] = useState<Record<string, UserTitle>>({});
  const [userActiveTitles, setUserActiveTitles] = useState<Array<{ title: string; image_url: string | null }>>([]);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTarget, setCurrentTarget] = useState<string | null>(null);
  
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
  const [playerStatusesMap, setPlayerStatusesMap] = useState<Record<string, PlayerStatus[]>>({});
  const [vanishingToasts, setVanishingToasts] = useState<VanishingToast[]>([]);
  const [selectedZoneTarget, setSelectedZoneTarget] = useState<string | null>(null);
  const [showPlayerPopup, setShowPlayerPopup] = useState<string | null>(null);
  const [lastActionTime, setLastActionTime] = useState<Date | null>(null);
  const [lastTechniqueTime, setLastTechniqueTime] = useState<Date | null>(null);
  const [showZoneSelectDialog, setShowZoneSelectDialog] = useState(false);
  const [isJoinZoneSelection, setIsJoinZoneSelection] = useState(false);
  const [pendingJoinSessionId, setPendingJoinSessionId] = useState<string | null>(null);
  const [koLockoutExpiry, setKoLockoutExpiry] = useState<Date | null>(null);
  
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
      const maxATKValue = data.max_atk ?? statsSystem.calculateMaxATK(data.level || 1);
      
      // First, check for active boost
      const { data: redOrbData, error: redOrbError } = await supabase
        .from("red_orb_effects")
        .select("atk_boost, expires_at")
        .eq("user_id", id)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
      
      // Also check for any expired boost to determine if we should reset
      const { data: expiredOrbData } = await supabase
        .from("red_orb_effects")
        .select("expires_at")
        .eq("user_id", id)
        .lte("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      let baseATK = data.current_atk ?? maxATKValue;
      
      if (redOrbData && redOrbData.atk_boost) {
        // Active boost exists - calculate from max_atk + boost
        const calculatedATK = maxATKValue + redOrbData.atk_boost;
        baseATK = calculatedATK;
        
        // Update database to ensure current_atk matches the boost
        if (data.current_atk !== calculatedATK) {
          await supabase
            .from("profiles")
            .update({ current_atk: calculatedATK })
            .eq("id", id);
        }
      } else {
        // No active boost found in red_orb_effects
        if (data.current_atk && data.current_atk > maxATKValue) {
          // current_atk is boosted but no active red_orb_effects found
          // If there's an expired record, the boost has expired - reset to max_atk
          if (expiredOrbData) {
            // Boost expired - reset to max_atk
            baseATK = maxATKValue;
            await supabase
              .from("profiles")
              .update({ current_atk: maxATKValue })
              .eq("id", id);
          } else {
            // No expired record found - could be network error or record missing
            // Preserve the boosted value to prevent loss on refresh
            baseATK = data.current_atk;
          }
        } else {
          // Use current_atk if it exists and is valid (not boosted)
          baseATK = data.current_atk ?? maxATKValue;
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
        setSelectedZoneTarget(null);
      }
      if (data.is_targeting_zone && data.current_target_zone_id) {
        setSelectedZoneTarget(data.current_target_zone_id);
        setCurrentTarget(null);
      }
      if (!data.current_target_id) {
        setCurrentTarget(null);
      }
      if (!data.is_targeting_zone || !data.current_target_zone_id) {
        setSelectedZoneTarget(null);
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
        .select("id, username, profile_picture_url, health, armor, energy, discipline, level, current_hp, max_hp, current_atk, max_atk, aura, mastery")
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
      
      // Fetch statuses for all players
      if (userIds.length > 0) {
        const { data: allStatuses, error: statusError } = await supabase
          .from("player_statuses")
          .select("*")
          .in("user_id", userIds)
          .gt("expires_at", new Date().toISOString());
        
        if (statusError) {
          console.error("Error fetching player statuses:", statusError);
        } else if (allStatuses) {
          const statusMap: Record<string, PlayerStatus[]> = {};
          allStatuses.forEach((status: any) => {
            if (!statusMap[status.user_id]) {
              statusMap[status.user_id] = [];
            }
            statusMap[status.user_id].push(status as PlayerStatus);
          });
          setPlayerStatusesMap(statusMap);
        } else {
          // Clear statuses if no data
          setPlayerStatusesMap({});
        }
      } else {
        setPlayerStatusesMap({});
      }
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

  const handleResetPlayerStats = async (targetUserId: string, username: string, level: number | undefined) => {
    if (!isAdmin) return;
    if (!targetUserId) return;

    const targetLevel = Math.max(1, Number(level || 1));
    const baseMaxHP = statsSystem.calculateMaxHP(targetLevel);
    const baseMaxATK = statsSystem.calculateMaxATK(targetLevel);

    const confirmed = confirm(
      `Reset ${username}'s stats to base values?\n\n` +
        `Level: ${targetLevel}\n` +
        `Max HP: ${baseMaxHP}\n` +
        `Max ATK: ${baseMaxATK}\n\n` +
        `This will set current HP/ATK to max, clear Armor/Aura, and reset Energy/Mastery to 0.`
    );
    if (!confirmed) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        max_hp: baseMaxHP,
        current_hp: baseMaxHP,
        max_atk: baseMaxATK,
        current_atk: baseMaxATK,
        armor: 0,
        aura: 0,
        aura_expires_at: null,
        energy: 0,
        mastery: 0,
      })
      .eq("id", targetUserId);

    if (error) {
      console.error("Failed to reset player stats:", error);
      toast({
        title: "Error",
        description: `Failed to reset stats: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Stats Reset",
      description: `${username}'s stats were reset to base values (Level ${targetLevel}).`,
    });

    await fetchPlayerPositions();
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

    const techniqueSelectWithNewColumns = `
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
          atk_debuff,
          self_damage,
          energy_taken
        )
      `;

    const techniqueSelectBase = `
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
      `;

    // Then get techniques with all fields, with backward-compatible fallback.
    let { data, error } = await supabase
      .from("user_techniques")
      .select(techniqueSelectWithNewColumns)
      .eq("user_id", userId);

    if (error) {
      const errorMessage = (error.message || "").toLowerCase();
      const missingNewColumns =
        error.code === "PGRST204" ||
        (errorMessage.includes("schema cache") &&
          (errorMessage.includes("energy_taken") || errorMessage.includes("self_damage")));

      if (missingNewColumns) {
        const fallbackResult = await supabase
          .from("user_techniques")
          .select(techniqueSelectBase)
          .eq("user_id", userId);
        data = fallbackResult.data;
        error = fallbackResult.error;
      }
    }

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
      
      // Pre-load full technique data - merge with existing to preserve any tags already loaded
      setFullTechniqueData(prev => {
        const techDataMap: Record<string, any> = { ...prev };
        for (const tech of filteredTechniques) {
          // Preserve tags if they already exist in prev data
          const existing = prev[tech.id];
          const preservedTags = existing?.tags || tech.tags || existing?.type_info || tech.type_info;
          techDataMap[tech.id] = { ...tech, tags: preservedTags };
        }
        return techDataMap;
      });
    }
  };
  
  // Helper function to extract tags from any source - used consistently everywhere
  const extractTags = useCallback((source: any): string[] => {
    if (!source) return [];
    
    // Try tags field first
    if (source.tags) {
      if (Array.isArray(source.tags)) {
        const arrTags = source.tags.filter((t: any) => t && String(t).trim() !== '');
        if (arrTags.length > 0) return arrTags;
      } else if (typeof source.tags === 'string' && source.tags.trim() !== '') {
        const strTags = source.tags.split(",").map((t: string) => t.trim()).filter((t: string) => t !== '');
        if (strTags.length > 0) return strTags;
      }
    }
    
    // Fallback to type_info
    if (source.type_info && typeof source.type_info === 'string' && source.type_info.trim() !== '') {
      const typeTags = source.type_info.split(",").map((t: string) => t.trim()).filter((t: string) => t !== '');
      if (typeTags.length > 0) return typeTags;
    }
    
    return [];
  }, []);

  // Cache tags for selected technique to prevent disappearing
  const cachedTags = useMemo(() => {
    if (!selectedTechnique) return [];
    
    const technique = userTechniques.find((t: any) => t.id === selectedTechnique);
    if (!technique) return [];
    
    const fullTech = fullTechniqueData[selectedTechnique];
    
    // Extract tags from both sources
    const tagsFromFullTech = fullTech ? extractTags(fullTech) : [];
    const tagsFromTechnique = extractTags(technique);
    
    // Always prefer technique tags first (they're already loaded), then fullTech
    // This ensures tags persist even when fullTech is loading or updating
    const tags = tagsFromTechnique.length > 0 ? tagsFromTechnique : tagsFromFullTech;
    
    // Return tags - this will persist across re-renders
    return tags;
  }, [selectedTechnique, userTechniques, fullTechniqueData, extractTags]);

  // Fetch full technique data when selected
  useEffect(() => {
    if (selectedTechnique && !fullTechniqueData[selectedTechnique]) {
      // First check if we have the technique in userTechniques to preserve tags
      const existingTech = userTechniques.find((t: any) => t.id === selectedTechnique);
      
      supabase
        .from("techniques")
        .select("*")
        .eq("id", selectedTechnique)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            // Merge with existing technique data to preserve tags if they exist
            // Preserve tags from existingTech first, then from data, then fallback to type_info
            const preservedTags = existingTech?.tags || data.tags || existingTech?.type_info || data.type_info;
            const mergedData = existingTech 
              ? { ...existingTech, ...data, tags: preservedTags, type_info: data.type_info || existingTech.type_info }
              : { ...data, tags: preservedTags };
            
            setFullTechniqueData(prev => {
              // Don't overwrite if data already exists (race condition protection)
              if (prev[selectedTechnique]) return prev;
              return { ...prev, [selectedTechnique]: mergedData };
            });
          }
        });
    }
  }, [selectedTechnique, userTechniques]);

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
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .gt("created_at", oneHourAgo)
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

  // Auto-clean notifications older than 1 hour
  useEffect(() => {
    if (!userId) return;

    const cleanup = async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const cutoffMs = Date.now() - 60 * 60 * 1000;

      // Filter state (instant UI cleanup)
      setNotifications((prev) => {
        const next = prev.filter((n) => {
          const t = n?.created_at ? new Date(n.created_at).getTime() : 0;
          return t > cutoffMs;
        });
        setUnreadCount(next.filter((n) => !n.is_read).length);
        return next;
      });

      // Best-effort DB cleanup (RLS may block delete; ignore if so)
      try {
        await supabase
          .from("notifications")
          .delete()
          .eq("user_id", userId)
          .lt("created_at", oneHourAgo);
      } catch {
        // ignore
      }
    };

    cleanup();
    const interval = setInterval(cleanup, 60 * 1000); // every minute
    return () => clearInterval(interval);
  }, [userId]);

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

    // Check if target is in Stasis (can't be targeted)
    const targetPlayerStatuses = playerStatusesMap[targetUserId] || [];
    if (targetPlayerStatuses.some(s => s.status === "Stasis" && new Date(s.expires_at) > new Date())) {
      toast({
        title: "Cannot Target",
        description: "This player is in Stasis and cannot be targeted.",
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

    // Set new target (onConflict so upsert updates existing row when user_id already has a target)
    const { error } = await supabase
      .from("player_targets")
      .upsert(
        { user_id: userId, target_user_id: targetUserId },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("Error setting target:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to set target",
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

  const fetchArenaPosts = async () => {
    // Use new battle_feed table, but also keep arena_posts for backward compatibility
    const [battleFeedData, arenaPostsData] = await Promise.all([
      supabase
        .from("battle_feed")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(25),
      supabase
      .from("arena_posts")
        .select(`id, user_id, zone_id, technique_name, description, created_at`)
      .order("created_at", { ascending: false })
        .limit(25),
    ]);

    const allPosts: any[] = [];
    
    if (battleFeedData.error) {
      console.error("Error fetching battle feed:", battleFeedData.error);
    }
    
    if (battleFeedData.data) {
      allPosts.push(...battleFeedData.data.map((post: any) => ({
        ...post,
        technique_name: post.technique_name || post.action_type,
      })));
    }
    
    if (arenaPostsData.error) {
      console.error("Error fetching arena posts:", arenaPostsData.error);
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
    const targetUserIds = Array.from(new Set(limitedPosts.map((post) => post.target_user_id).filter(Boolean)));
    const allUserIds = Array.from(new Set([...userIds, ...targetUserIds]));

    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username, profile_picture_url, discipline")
      .in("id", allUserIds);

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
      target_profile: post.target_user_id ? (profileMap.get(post.target_user_id) || null) : null,
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
          const damage = Math.floor((profile.max_hp ?? 100) * 0.2);
          // Use ?? instead of || so that 0 HP (K.O.) is preserved, not treated as falsy
          const newHP = Math.max(0, (profile.current_hp ?? profile.max_hp ?? 100) - damage);
          
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
          const damage = Math.floor((profile.max_hp ?? 100) * 0.15);
          // Use ?? instead of || so that 0 HP (K.O.) is preserved, not treated as falsy
          const newHP = Math.max(0, (profile.current_hp ?? profile.max_hp ?? 100) - damage);
          
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

  // K.O. Lockout countdown timer - updates every second for live countdown
  useEffect(() => {
    if (!koLockoutExpiry) return;
    
    const interval = setInterval(async () => {
      if (new Date() >= koLockoutExpiry) {
        // Lockout expired - clean up
        setKoLockoutExpiry(null);
        
        // Remove K.O.Lockout status if still present
        await supabase
          .from("player_statuses")
          .delete()
          .eq("user_id", userId)
          .eq("status", "K.O.Lockout");
        
        // Reset stats to max values
        const { data: profile } = await supabase
          .from("profiles")
          .select("level")
          .eq("id", userId)
          .single();
        
        const level = profile?.level || 1;
        const maxHPVal = statsSystem.calculateMaxHP(level);
        const maxATKVal = statsSystem.calculateMaxATK(level);
        
        await supabase
          .from("profiles")
          .update({
            current_hp: maxHPVal,
            max_hp: maxHPVal,
            current_atk: maxATKVal,
            max_atk: maxATKVal,
            armor: 0,
            aura: 0,
            aura_expires_at: null,
            energy: 0,
            mastery: 0,
          })
          .eq("id", userId);
        
        // Refresh profile
        await fetchProfile(userId);
        await fetchPlayerStatuses(userId);
        
        clearInterval(interval);
      } else {
        // Force re-render for countdown update
        setKoLockoutExpiry(new Date(koLockoutExpiry.getTime()));
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [koLockoutExpiry, userId]);

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
    // Prefer server-side session sync so arena timers don't depend on an admin client
    try {
      const { data: syncedSession, error: syncError } = await (supabase as any).rpc("sync_arena_session");
      if (!syncError && syncedSession) {
        setCurrentSession(syncedSession);
        // Check if user has joined
        if (userId) {
          const { data: participant } = await supabase
            .from("arena_participants")
            .select("id")
            .eq("user_id", userId)
            .eq("session_id", syncedSession.id)
            .maybeSingle();
          const { data: position } = await supabase
            .from("player_positions")
            .select("user_id")
            .eq("user_id", userId)
            .maybeSingle();
          setHasJoined(!!participant && !!position);
        }
        return;
      }
    } catch {
      // Ignore RPC errors and fall back to legacy logic below
    }

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
        const { data: position } = await supabase
          .from("player_positions")
          .select("user_id")
          .eq("user_id", userId)
          .maybeSingle();
        setHasJoined(!!participant && !!position);
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
        const { data: position } = await supabase
          .from("player_positions")
          .select("user_id")
          .eq("user_id", userId)
          .maybeSingle();
        setHasJoined(!!participant && !!position);
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
  };
  
  const finalizeJoinArena = async (zoneId: string) => {
    if (!userId || !pendingJoinSessionId) return;

    const { error } = await supabase
      .from("arena_participants")
      .insert({
        user_id: userId,
        session_id: pendingJoinSessionId,
      });

    if (error && error.code !== "23505") {
      toast({
        title: "Error",
        description: "Failed to join Arena: " + error.message,
        variant: "destructive",
      });
      return;
    }

    setHasJoined(true);
    setCurrentZone(zoneId);
    setIsJoinZoneSelection(false);
    setPendingJoinSessionId(null);
    setShowZoneSelectDialog(false);

    // Ensure the user has/keeps a position row in the selected zone.
    const { data: existingPos } = await supabase
      .from("player_positions")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!existingPos) {
      const { error: posInsertError } = await supabase.from("player_positions").insert({
        user_id: userId,
        zone_id: zoneId,
        last_moved_at: new Date().toISOString(),
      });
      if (posInsertError) {
        console.error("Failed to create player position on join:", posInsertError);
      }
    } else {
      await supabase
        .from("player_positions")
        .update({
          zone_id: zoneId,
          last_moved_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    }

    await fetchPlayerPositions();

    toast({
      title: "Joined Arena",
      description: "You have successfully joined the Arena!",
    });

    // Send notification to all players in arena
    const { data: posRows } = await supabase
      .from("player_positions")
      .select("user_id");
    if (posRows && posRows.length > 0) {
      const uniqueUserIds = Array.from(new Set(posRows.map((p: any) => p.user_id).filter(Boolean)));
      const joinNotifications = uniqueUserIds
        .filter((uid) => uid !== userId)
        .map((uid) => ({
          user_id: uid,
          message: `${currentProfile?.username || "A member"} joined the Arena`,
          type: "arena_join",
        }));
      if (joinNotifications.length > 0) {
        await supabase.from("notifications").insert(joinNotifications);
      }
    }
  };

  const handleJoinArena = async () => {
    if (!userId || !currentSession) return;
    
    // Block joining if in K.O. Lockout
    if (koLockoutExpiry && new Date() < koLockoutExpiry) {
      toast({
        title: "K.O. Lockout",
        description: "You have been killed. You cannot rejoin the Arena yet.",
        variant: "destructive",
      });
      return;
    }
    
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

    if (zones.length === 0) {
      toast({
        title: "Error",
        description: "No zones available. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setPendingJoinSessionId(sessionId);
    setIsJoinZoneSelection(true);
    setShowZoneSelectDialog(true);
  };
  
  const handleExitArena = async () => {
    if (!userId || !hasJoined) {
      toast({
        title: "Error",
        description: "You are not in the Arena.",
        variant: "destructive",
      });
      return;
    }
    
    // Send notification to all players before removing
    const { data: posRows } = await supabase
      .from("player_positions")
      .select("user_id");
    if (posRows && posRows.length > 0) {
      const uniqueUserIds = Array.from(new Set(posRows.map((p: any) => p.user_id).filter(Boolean)));
      const exitNotifications = uniqueUserIds
        .filter(uid => uid !== userId)
        .map((uid) => ({
          user_id: uid,
          message: `${currentProfile?.username || "A member"} left the Arena`,
          type: "arena_exit",
        }));
      if (exitNotifications.length > 0) {
        await supabase.from("notifications").insert(exitNotifications);
      }
    }
    
    // Remove player from player_positions (disappear from zones)
    await supabase
      .from("player_positions")
      .delete()
      .eq("user_id", userId);
    
    // Remove from arena_participants for every session row tied to this user.
    // This avoids stale join state after refresh when session IDs roll over.
    await supabase
      .from("arena_participants")
      .delete()
      .eq("user_id", userId);
    
    // Clear target
    setCurrentTarget(null);
    setSelectedZoneTarget(null);
    setCurrentZone("");
    setHasJoined(false);
    
    await fetchPlayerPositions();
    
    toast({
      title: "Left Arena",
      description: "You have left the Arena. Click Join to re-enter.",
    });
  };
  
  // Timer Management
  useEffect(() => {
    if (!currentSession) return;
    
    // IMPORTANT:
    // Non-admin users cannot write to arena_sessions (RLS). We therefore do NOT attempt to
    // open/close/create sessions client-side here. We only compute countdowns locally.
    const updateTimers = () => {
      const isOpenNow = timerSystem.isArenaOpen(currentSession.opened_at, currentSession.closed_at);

      if (isOpenNow) {
        setArenaOpenTimer(timerSystem.getTimeUntilArenaCloses(currentSession.closed_at));
      } else {
        // Compute next open using closed_at (most reliable). Using opened_at can be in the past
        // during closed windows, which would make the countdown stick at 00:00.
        const now = new Date();
        let nextOpenTime: Date | null = null;

        if (currentSession.closed_at) {
          let baseTime = new Date(currentSession.closed_at);
          nextOpenTime = timerSystem.calculateNextArenaOpenTime(baseTime);

          const totalCycleMinutes =
            timerSystem.ARENA_OPEN_DURATION_MINUTES + timerSystem.ARENA_CLOSE_DURATION_MINUTES; // 60

          while (nextOpenTime <= now) {
            baseTime.setMinutes(baseTime.getMinutes() + totalCycleMinutes);
            nextOpenTime = timerSystem.calculateNextArenaOpenTime(baseTime);
          }
        }

        setArenaOpenTimer(
          nextOpenTime ? timerSystem.getTimeUntilArenaOpens(nextOpenTime.toISOString()) : 0
        );
      }

      if (currentSession.battle_timer_ends_at) {
        setBattleTimer(timerSystem.getRemainingBattleTimer(currentSession.battle_timer_ends_at));
      }
    };
    
    updateTimers();
    timerIntervalRef.current = setInterval(updateTimers, 1000);
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [currentSession?.opened_at, currentSession?.closed_at, currentSession?.battle_timer_ends_at]);

  // Periodically refresh the session window from the server (via sync_arena_session),
  // so timers never depend on an admin client being online.
  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(() => {
      fetchCurrentSession();
    }, 15000); // 15s
    return () => clearInterval(interval);
  }, [userId]);
  
  // Status Management
  const fetchPlayerStatuses = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("player_statuses")
        .select("*")
        .eq("user_id", userId)
        .gt("expires_at", new Date().toISOString());
      
      if (error) {
        // Only log non-network errors
        const errorMsg = error.message?.toLowerCase() || '';
        const isNetworkError = errorMsg.includes('fetch') || 
                               errorMsg.includes('network') ||
                               errorMsg.includes('failed') ||
                               errorMsg.includes('timeout');
        if (!isNetworkError) {
          console.error("Error fetching player statuses:", error);
        }
        return;
      }
      
      if (data) {
        setPlayerStatuses(data as PlayerStatus[]);
        
        // Check for K.O.Lockout status - enforce lockout on page load/refresh
        const lockout = data.find((s: any) => s.status === "K.O.Lockout" && new Date(s.expires_at) > new Date());
        if (lockout) {
          setKoLockoutExpiry(new Date(lockout.expires_at));
          // Ensure player is removed from arena during lockout
          if (hasJoined) {
            setHasJoined(false);
            setCurrentZone("");
            // Remove from player_positions if somehow still there
            supabase.from("player_positions").delete().eq("user_id", userId);
          }
        } else {
          // Check for K.O. status (2-min grace period) - also check if it should have expired
          const koStatus = data.find((s: any) => s.status === "K.O" && new Date(s.expires_at) <= new Date());
          if (koStatus) {
            // K.O. grace period expired without Revival - transition to K.O.Lockout
            // Remove expired K.O. status
            supabase.from("player_statuses").delete().eq("id", koStatus.id).then(async () => {
              const lockoutExpiresAt = new Date();
              lockoutExpiresAt.setMinutes(lockoutExpiresAt.getMinutes() + 30);
              
              await supabase.from("player_statuses").insert({
                user_id: userId,
                status: "K.O.Lockout",
                applied_by_user_id: userId,
                applied_by_mastery: 0,
                expires_at: lockoutExpiresAt.toISOString(),
              });
              
              // Remove from arena
              await supabase.from("player_positions").delete().eq("user_id", userId);
              setHasJoined(false);
              setCurrentZone("");
              setKoLockoutExpiry(lockoutExpiresAt);
              fetchPlayerPositions();
            });
          } else {
            setKoLockoutExpiry(null);
          }
        }
      } else {
        // If no data, set empty array to ensure UI updates
        setPlayerStatuses([]);
        setKoLockoutExpiry(null);
      }
    } catch (error: any) {
      // Suppress network errors
      const errorMsg = error?.message?.toLowerCase() || '';
      const isNetworkError = errorMsg.includes('fetch') || 
                             errorMsg.includes('network') ||
                             errorMsg.includes('err_name_not_resolved') ||
                             errorMsg.includes('err_network_changed');
      if (!isNetworkError) {
        console.error("Error fetching player statuses:", error);
      }
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
      
      // Check for network errors - Supabase errors might not contain network error details
      // Network errors are typically caught in the catch block, but check here too
      if (actionData.error) {
        // Only log non-network errors (network errors are expected during connectivity issues)
        // Supabase errors for network issues might not have specific messages, so we'll be lenient
        const errorMsg = actionData.error.message?.toLowerCase() || '';
        const isNetworkError = errorMsg.includes('fetch') || 
                               errorMsg.includes('network') ||
                               errorMsg.includes('failed') ||
                               errorMsg.includes('timeout') ||
                               actionData.error.code === 'PGRST116' || // PostgREST connection error
                               actionData.error.code === 'PGRST301';   // PostgREST timeout
        if (!isNetworkError) {
          console.error("Error fetching action cooldowns:", actionData.error);
        }
        // On network error, still try to initialize state if we have data
        // This prevents blocking actions when network is temporarily unavailable
        if (!actionData.data) {
          // Only return if we have no data AND it's a network error
          // This preserves existing state
          return;
        }
        // If we have data despite error, continue processing it
      }
      
      if (techniqueData.error) {
        const errorMsg = techniqueData.error.message?.toLowerCase() || '';
        const isNetworkError = errorMsg.includes('fetch') || 
                               errorMsg.includes('network') ||
                               errorMsg.includes('failed') ||
                               errorMsg.includes('timeout') ||
                               techniqueData.error.code === 'PGRST116' ||
                               techniqueData.error.code === 'PGRST301';
        if (!isNetworkError) {
          console.error("Error fetching technique cooldowns:", techniqueData.error);
        }
        // On network error, still try to initialize state if we have data
        if (!techniqueData.data) {
          // Only skip if we have no data
          // Continue processing if we have data despite error
        }
      }
      
      // Always initialize state, even if empty
      // Merge with existing state to preserve any cooldowns that might have been set locally
      if (actionData.data && actionData.data.length > 0) {
        const cooldowns: Record<string, string> = {};
        actionData.data.forEach(cd => {
          cooldowns[cd.action_type] = cd.expires_at;
        });
        // Merge with existing state to preserve any locally set cooldowns
        setActionCooldowns(prev => ({ ...prev, ...cooldowns }));
      } else {
        // Don't reset to empty - preserve existing state if no cooldowns found
        // Only initialize empty on first load (when prev is undefined)
        setActionCooldowns(prev => prev || {});
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
    } catch (error: any) {
      // Check if it's a network error - browser network errors are typically thrown as exceptions
      const errorMsg = error?.message?.toLowerCase() || '';
      const errorName = error?.name?.toLowerCase() || '';
      const isNetworkError = errorMsg.includes('fetch') || 
                             errorMsg.includes('network') ||
                             errorMsg.includes('err_name_not_resolved') ||
                             errorMsg.includes('err_network_changed') ||
                             errorMsg.includes('failed to fetch') ||
                             errorName === 'networkerror' ||
                             errorName === 'typeerror' ||
                             error?.code === 'ERR_NAME_NOT_RESOLVED' ||
                             error?.code === 'ERR_NETWORK_CHANGED';
      
      // Suppress network error logs (they're expected during connectivity issues)
      // Only log actual application errors
      if (!isNetworkError) {
        console.error("Error fetching cooldowns:", error);
      }
      // Don't set cooldownsLoaded to true on error - this prevents actions until cooldowns are properly loaded
      // But don't block if it's just a network error (preserve existing state)
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
  
  // Auto-refresh battle feed every minute and filter out entries older than 5 minutes
  useEffect(() => {
    if (!userId) return;
    
    const refreshAndFilter = async () => {
      // Fetch fresh battle feed (already filters by 5 minutes in the query)
      await fetchBattleFeed();
      
      // Additional safety filter: remove any entries older than 5 minutes from state
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      setBattleFeed(prev => prev.filter(entry => entry.created_at && new Date(entry.created_at) > fiveMinutesAgo));
    };
    
    // Cleanup function to delete old battle feed entries from database
    const cleanupOldEntries = async () => {
      try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        // Delete old entries directly from database
        await supabase
          .from("battle_feed")
          .delete()
          .lt("created_at", fiveMinutesAgo);
        
        // Also call the cleanup function as a backup
        const { data } = await supabase.functions.invoke('cleanup-old-messages');
        if (data) {
          console.log('Cleanup function called successfully');
        }
      } catch (error) {
        console.error('Error cleaning up old battle feed entries:', error);
      }
    };
    
    // Initial refresh
    refreshAndFilter();
    
    // Refresh every minute
    const refreshInterval = setInterval(refreshAndFilter, 60000);
    
    // Cleanup old entries every 5 minutes
    const cleanupInterval = setInterval(cleanupOldEntries, 5 * 60 * 1000);
    
    return () => {
      clearInterval(refreshInterval);
      clearInterval(cleanupInterval);
    };
  }, [userId]);
  
  // Helper function to extract target_user_id from description
  const extractTargetUserIdFromDescription = (description: string | null | undefined): string | null => {
    if (!description) return null;
    const match = description.match(/\[target:([^\]]+)\]/);
    return match ? match[1] : null;
  };
  
  // Battle Feed
  const fetchBattleFeed = async () => {
    // Only fetch entries from the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from("battle_feed")
      .select("*")
      .gt("created_at", fiveMinutesAgo)
      .order("created_at", { ascending: false })
      .limit(50);
    
    if (error) {
      console.error("Error fetching battle feed:", error);
      return;
    }
    
    if (data && data.length > 0) {
      // Fetch profiles separately since user_id references auth.users, not profiles
      const userIds = Array.from(new Set(data.map((entry: any) => entry.user_id).filter(Boolean)));
      // Extract target_user_id from both entry.target_user_id (if column exists) and from description
      const targetUserIdsFromColumn = data.map((entry: any) => entry.target_user_id).filter(Boolean);
      const targetUserIdsFromDescription = data.map((entry: any) => extractTargetUserIdFromDescription(entry.description)).filter(Boolean);
      const targetUserIds = Array.from(new Set([...targetUserIdsFromColumn, ...targetUserIdsFromDescription]));
      const allUserIds = Array.from(new Set([...userIds, ...targetUserIds]));
      
      let profileMap: Record<string, any> = {};
      if (allUserIds.length > 0) {
        const { data: profilesData, error: profileError } = await supabase
          .from("profiles")
          .select("id, username, profile_picture_url")
          .in("id", allUserIds);
        
        if (profileError) {
          console.error("Error fetching profiles for battle feed:", profileError);
        } else if (profilesData) {
          profileMap = (profilesData || []).reduce((acc: any, profile: any) => {
            acc[profile.id] = profile;
            return acc;
          }, {});
        }
      }
      
      // Merge with existing battle feed to preserve target_profile data
      setBattleFeed(prev => {
        const existingMap = new Map(prev.map(e => [e.id, e]));
        
        const entriesWithProfiles = data.map((entry: any) => {
          // Check if we already have this entry with target_profile
          const existing = existingMap.get(entry.id);
          if (existing && existing.target_profile) {
            // Preserve existing target_profile if it exists
            return {
              ...entry,
              profiles: profileMap[entry.user_id] || existing.profiles || { username: "Unknown", profile_picture_url: "" },
              target_profile: existing.target_profile,
              // Extract target_user_id from description if not in entry
              target_user_id: entry.target_user_id || extractTargetUserIdFromDescription(entry.description)
            };
          }
          
          // Extract target_user_id from description if column doesn't exist
          const extractedTargetUserId = entry.target_user_id || extractTargetUserIdFromDescription(entry.description);
          
          // Try to get target profile from profileMap first
          let targetProfile = extractedTargetUserId ? (profileMap[extractedTargetUserId] || null) : null;
          
          // If not in profileMap, try playerPositions
          if (!targetProfile && extractedTargetUserId) {
            const targetPlayer = playerPositions.find(p => p.user_id === extractedTargetUserId);
            if (targetPlayer && targetPlayer.profiles) {
              targetProfile = {
                username: targetPlayer.profiles.username,
                profile_picture_url: targetPlayer.profiles.profile_picture_url
              };
            }
          }
          
          return {
            ...entry,
            profiles: profileMap[entry.user_id] || { username: "Unknown", profile_picture_url: "" },
            target_profile: targetProfile,
            target_user_id: extractedTargetUserId
          };
        });
        
        return entriesWithProfiles as any;
      });
    } else {
      setBattleFeed([]);
    }
  };
  
  // Fetch missing target profiles for battle feed entries
  useEffect(() => {
    if (battleFeed.length === 0) return;
    
    const fetchMissingTargetProfiles = async () => {
      const entriesNeedingProfiles = battleFeed.filter(
        entry => (entry.action_type === "attack" || entry.action_type === "technique") && 
        (entry.target_user_id || extractTargetUserIdFromDescription(entry.description)) && 
        !entry.target_profile
      );
      
      if (entriesNeedingProfiles.length === 0) return;
      
      // Extract target_user_id from entry or description
      const targetUserIds = entriesNeedingProfiles.map(e => {
        return e.target_user_id || extractTargetUserIdFromDescription(e.description);
      }).filter(Boolean) as string[];
      
      if (targetUserIds.length === 0) return;
      
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, profile_picture_url")
        .in("id", targetUserIds);
      
      if (profilesData && profilesData.length > 0) {
        const profileMap = profilesData.reduce((acc: any, profile: any) => {
          acc[profile.id] = profile;
          return acc;
        }, {});
        
        setBattleFeed(prev => prev.map(entry => {
          if ((entry.action_type === "attack" || entry.action_type === "technique") && !entry.target_profile) {
            const targetId = entry.target_user_id || extractTargetUserIdFromDescription(entry.description);
            if (targetId) {
              const targetProfile = profileMap[targetId];
              if (targetProfile) {
                return { ...entry, target_profile: targetProfile, target_user_id: targetId };
              }
            }
          }
          return entry;
        }));
      }
    };
    
    fetchMissingTargetProfiles();
  }, [battleFeed.length]);

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
          
          // Fetch target profile for attack/technique entries (supports marker fallback)
          const extractedTargetId =
            newEntry.target_user_id || extractTargetUserIdFromDescription(newEntry.description);

          if ((newEntry.action_type === "attack" || newEntry.action_type === "technique") && extractedTargetId) {
            // Ensure the entry carries the target id in memory (even if DB column doesn't exist)
            newEntry.target_user_id = extractedTargetId;

            // Try playerPositions first (faster)
            const targetPlayer = playerPositions.find(p => p.user_id === extractedTargetId);
            if (targetPlayer && targetPlayer.profiles) {
              newEntry.target_profile = {
                username: targetPlayer.profiles.username,
                profile_picture_url: targetPlayer.profiles.profile_picture_url
              };
            } else {
              // Fallback to database
              const { data: targetProfile } = await supabase
                .from("profiles")
                .select("username, profile_picture_url")
                .eq("id", extractedTargetId)
                .single();
              
              if (targetProfile) {
                newEntry.target_profile = targetProfile;
              }
            }
          }
          
          // Only add to battle feed if entry is within 5 minutes (auto-delete old entries)
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
          if (newEntry.created_at && new Date(newEntry.created_at) > fiveMinutesAgo) {
            // Check if entry already exists (don't duplicate)
            setBattleFeed(prev => {
              const exists = prev.some(e => e.id === newEntry.id);
              if (exists) {
                // Update existing entry with new data (preserve target_profile if it exists)
                return prev.map(e => {
                  if (e.id === newEntry.id) {
                    return {
                      ...newEntry,
                      target_profile: newEntry.target_profile || e.target_profile
                    };
                  }
                  return e;
                });
              }
              return [newEntry, ...prev.slice(0, 49)];
            });
          }
          
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
            
            // Remove toast after 8 seconds
            setTimeout(() => {
              setVanishingToasts(prev => prev.filter(t => t.id !== toast.id));
            }, 8000);
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
      
      // Refresh player statuses periodically
      const statusInterval = setInterval(() => {
        fetchPlayerStatuses(userId);
      }, 5000); // Refresh every 5 seconds
      
      return () => clearInterval(statusInterval);
    }
  }, [userId]);
  
  // Refresh player statuses map for all players periodically
  useEffect(() => {
    if (playerPositions.length === 0) return;
    
    const refreshAllStatuses = () => {
      const userIds = playerPositions.map(p => p.user_id);
      if (userIds.length > 0) {
        supabase
          .from("player_statuses")
          .select("*")
          .in("user_id", userIds)
          .gt("expires_at", new Date().toISOString())
          .then(({ data: allStatuses, error: statusError }) => {
            if (!statusError && allStatuses) {
              const statusMap: Record<string, PlayerStatus[]> = {};
              allStatuses.forEach((status: any) => {
                if (!statusMap[status.user_id]) {
                  statusMap[status.user_id] = [];
                }
                statusMap[status.user_id].push(status as PlayerStatus);
              });
              setPlayerStatusesMap(statusMap);
            } else if (!statusError) {
              setPlayerStatusesMap({});
            }
          });
      }
    };
    
    // Initial fetch
    refreshAllStatuses();
    
    // Refresh every 5 seconds
    const allStatusesInterval = setInterval(refreshAllStatuses, 5000);
    
    return () => clearInterval(allStatusesInterval);
  }, [playerPositions]);
  
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

    // Enforce global 1-minute action limit across Attack/Move Around/Change Zone/Observe
    // (server-authoritative using profiles.last_action_at)
    const { data: lastActionProfile, error: lastActionError } = await supabase
      .from("profiles")
      .select("last_action_at")
      .eq("id", userId)
      .single();

    if (!lastActionError && lastActionProfile?.last_action_at) {
      const last = new Date(lastActionProfile.last_action_at);
      const diffMs = Date.now() - last.getTime();
      if (diffMs < 60000) {
        const remaining = Math.ceil((60000 - diffMs) / 1000);
        toast({
          title: "Action Limit",
          description: `You can only use 1 action per minute. ${remaining}s remaining.`,
          variant: "destructive",
        });
        return;
      }
    }

    // ALWAYS check database first to prevent refresh exploit
    // This ensures we have the latest cooldown state from the database
    const { data: cooldownData, error: cooldownError } = await supabase
      .from("action_cooldowns")
      .select("expires_at")
      .eq("user_id", userId)
      .eq("action_type", "attack")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cooldownError) {
      // Only log non-network errors (network errors are expected during connectivity issues)
      const errorMsg = cooldownError.message?.toLowerCase() || '';
      const isNetworkError = errorMsg.includes('fetch') || 
                             errorMsg.includes('network') ||
                             errorMsg.includes('failed') ||
                             errorMsg.includes('timeout') ||
                             cooldownError.code === 'PGRST116' ||
                             cooldownError.code === 'PGRST301';
      if (!isNetworkError) {
        console.error("Error checking cooldown:", cooldownError);
      }
      // On network error, fall back to state check (better than blocking user)
    }

    // If cooldown exists in database, use it (even if state says otherwise)
    if (cooldownData && !timerSystem.isCooldownExpired(cooldownData.expires_at)) {
      const remaining = timerSystem.getRemainingCooldown(cooldownData.expires_at);
      // Update state with database value to keep it in sync
      setActionCooldowns(prev => ({ ...prev, attack: cooldownData.expires_at }));
      toast({
        title: "On Cooldown",
        description: `Attack is on cooldown. ${timerSystem.formatTime(remaining)} remaining.`,
        variant: "destructive",
      });
      return;
    }

    // Also check state as a quick check (but database is authoritative)
    if (actionCooldowns["attack"] && !timerSystem.isCooldownExpired(actionCooldowns["attack"])) {
      const remaining = timerSystem.getRemainingCooldown(actionCooldowns["attack"]);
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
    
    // If targeting zone, damage is 50% of ATK (rounded)
    if (selectedZoneTarget) {
      damage = Math.round(damage / 2);
    }
    
    // Apply damage to target(s)
    if (selectedZoneTarget) {
      // Zone targeting - affect all players in zone EXCEPT the attacker
      const playersInZone = getPlayersInZone(selectedZoneTarget).filter(p => p.user_id !== userId);
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
    
    // Set cooldown - use update-then-insert pattern to avoid 409 conflicts
    const cooldownExpires = timerSystem.calculateCooldownExpiration(1);
    
    // Try update first (most common case - cooldown already exists)
    const { data: cooldownUpdateData, error: cooldownUpdateError } = await supabase
      .from("action_cooldowns")
      .update({
        expires_at: cooldownExpires.toISOString(),
      })
      .eq("user_id", userId)
      .eq("action_type", "attack")
      .select();
    
    // If update didn't affect any rows (no existing record), insert new one
    if (!cooldownUpdateData || cooldownUpdateData.length === 0) {
      const { error: cooldownInsertError } = await supabase
        .from("action_cooldowns")
        .insert({
          user_id: userId,
          action_type: "attack",
          expires_at: cooldownExpires.toISOString(),
        });
      
      if (cooldownInsertError && cooldownInsertError.code !== '23505') { // Ignore duplicate key errors (race condition)
        console.error("Error inserting attack cooldown:", cooldownInsertError);
      }
    } else if (cooldownUpdateError) {
      console.error("Error updating attack cooldown:", cooldownUpdateError);
    }
    
    setActionCooldowns(prev => ({ ...prev, attack: cooldownExpires.toISOString() }));
    
    // Refresh cooldowns from database to ensure sync
    await fetchCooldowns(userId);
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
    
    // Add to battle feed with target info
    // Always use simple description - target profile will be shown separately in UI
    let battleFeedDescription = "";
    let targetProfile = null;
    
    if (selectedZoneTarget) {
      const zoneIndex = zones.findIndex((z) => z.id === selectedZoneTarget);
      const zoneName = zoneIndex !== -1 ? ZONE_IMAGE_NAMES[zoneIndex % ZONE_IMAGE_NAMES.length] : zones.find((z) => z.id === selectedZoneTarget)?.name || "zone";
      battleFeedDescription = `Attacked ${zoneName} for ${damage} damage`;
    } else if (currentTarget) {
      // Always fetch target's profile for display in UI
      const targetPlayer = playerPositions.find(p => p.user_id === currentTarget);
      if (targetPlayer && targetPlayer.profiles) {
        targetProfile = {
          username: targetPlayer.profiles.username,
          profile_picture_url: targetPlayer.profiles.profile_picture_url
        };
      } else {
        // Fetch from database
        const { data: targetProfileData } = await supabase
          .from("profiles")
          .select("username, profile_picture_url")
          .eq("id", currentTarget)
          .single();
        
        if (targetProfileData) {
          targetProfile = {
            username: targetProfileData.username,
            profile_picture_url: targetProfileData.profile_picture_url
          };
        }
      }
      
      // Simple description - target will be shown with picture/username in UI
      // Store target_user_id in description for persistence (since column doesn't exist)
      if (currentTarget) {
        battleFeedDescription = `Attacked target for ${damage} damage [target:${currentTarget}]`;
      } else {
        battleFeedDescription = `Attacked for ${damage} damage`;
      }
    }
    
    // Get target profile first (before inserting to battle feed)
    let finalTargetProfile = targetProfile;
    if (!finalTargetProfile && currentTarget) {
      // Try to get target profile from playerPositions first
      const targetPlayer = playerPositions.find(p => p.user_id === currentTarget);
      if (targetPlayer && targetPlayer.profiles) {
        finalTargetProfile = {
          username: targetPlayer.profiles.username,
          profile_picture_url: targetPlayer.profiles.profile_picture_url
        };
      } else {
        // Fetch from database if not in playerPositions
        const { data: targetProfileData } = await supabase
          .from("profiles")
          .select("username, profile_picture_url")
          .eq("id", currentTarget)
          .single();
        if (targetProfileData) {
          finalTargetProfile = {
            username: targetProfileData.username,
            profile_picture_url: targetProfileData.profile_picture_url
          };
        }
      }
    }
    
    // Insert into battle feed
    // Try with target_user_id first, fallback without it if column doesn't exist
    let battleFeedData: any = null;
    let battleFeedError: any = null;
    
    const insertData: any = {
      user_id: userId,
      action_type: "attack",
      description: battleFeedDescription,
      // Use the targeted zone if zone targeting, otherwise attacker's current zone
      zone_id: selectedZoneTarget || currentZone,
    };
    
    // Try with target_user_id first (only if we have a target)
    if (currentTarget) {
      insertData.target_user_id = currentTarget;
      
      const { data: dataWithTarget, error: errorWithTarget } = await supabase
        .from("battle_feed")
        .insert(insertData)
        .select()
        .single();
      
      // Check if error is about missing column - check code, message, or any mention of target_user_id
      const isColumnError = errorWithTarget && (
        errorWithTarget.code === 'PGRST204' || 
        (typeof errorWithTarget.message === 'string' && (
          errorWithTarget.message.includes('target_user_id') ||
          errorWithTarget.message.includes("Could not find") ||
          errorWithTarget.message.includes("column of 'battle_feed'") ||
          errorWithTarget.message.includes("schema cache")
        ))
      );
      
      if (isColumnError) {
        console.log("target_user_id column not found, retrying without it");
        // Retry without target_user_id
        const { data: dataWithoutTarget, error: errorWithoutTarget } = await supabase
          .from("battle_feed")
          .insert({
            user_id: userId,
            action_type: "attack",
            description: battleFeedDescription,
            zone_id: currentZone,
          })
          .select()
          .single();
        
        battleFeedData = dataWithoutTarget;
        battleFeedError = errorWithoutTarget;
      } else {
        battleFeedData = dataWithTarget;
        battleFeedError = errorWithTarget;
      }
    } else {
      // No target, just insert normally
      const { data, error } = await supabase
        .from("battle_feed")
        .insert(insertData)
        .select()
        .single();
      
      battleFeedData = data;
      battleFeedError = error;
    }
    
    if (battleFeedError) {
      // Only log if it's not the expected column error (which we handled with fallback)
      const isExpectedColumnError = battleFeedError.code === 'PGRST204' || 
        (typeof battleFeedError.message === 'string' && battleFeedError.message.includes('target_user_id'));
      
      if (!isExpectedColumnError) {
        console.error("Error inserting into battle feed:", battleFeedError);
      }
    }
    
    if (battleFeedData) {
      // Get attacker's profile
      const { data: attackerProfile } = await supabase
        .from("profiles")
        .select("username, profile_picture_url")
        .eq("id", userId)
        .single();
      
      if (attackerProfile) {
        // Create entry with both attacker and target profiles
        // Even if target_user_id column doesn't exist, we still attach target_profile to the entry
        const newEntry: BattleFeedEntry = {
          ...battleFeedData,
          profiles: attackerProfile,
          target_profile: finalTargetProfile,
          // Store target_user_id in the entry even if DB column doesn't exist
          target_user_id: currentTarget || null
        };
        
        console.log("Adding attack entry to battle feed:", {
          id: newEntry.id,
          hasTargetProfile: !!newEntry.target_profile,
          targetUsername: newEntry.target_profile?.username,
          targetUserId: currentTarget
        });
        
        // Add to battle feed state immediately so it shows up right away
        setBattleFeed(prev => [newEntry, ...prev.slice(0, 49)]);
      }
    }
    
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
      
      // Check target's statuses for immunity
      const { data: targetStatuses } = await supabase
        .from("player_statuses")
        .select("status")
        .eq("user_id", targetUserId)
        .gt("expires_at", new Date().toISOString());
      
      const targetActiveStatuses = (targetStatuses || []).map((s: any) => s.status);
      
      // Stasis: target is immune to all damage
      if (statusSystem.statusIsImmune(targetActiveStatuses)) {
        return;
      }
      
      // Check attacker statuses for Lethal/Reaping
      const attackerStatuses = playerStatuses.map(s => s.status);
      const hasReaping = statusSystem.attackIgnoresEverything(attackerStatuses);
      const hasLethal = statusSystem.attackBypassesDefenses(attackerStatuses);
      
      // Shielded: no HP/Armor/Aura loss at all (Reaping bypasses Shielded)
      if (targetActiveStatuses.includes("Shielded") && !hasReaping) {
        const targetPlayer = playerPositions.find(p => p.user_id === targetUserId);
        const targetName = targetPlayer?.profiles?.username || "Target";
        toast({
          title: "No Damage Dealt",
          description: `${targetName} is Shielded!`,
        });
        return;
      }
      
      // Airborne/Underground: can only be hit by FOCUSED attacker (handled here for basic attacks)
      if ((targetActiveStatuses.includes("Airborne") || targetActiveStatuses.includes("Underground")) && !attackerStatuses.includes("Focused")) {
        const targetPlayer = playerPositions.find(p => p.user_id === targetUserId);
        const targetName = targetPlayer?.profiles?.username || "Target";
        toast({
          title: "Attack Missed",
          description: `${targetName} is ${targetActiveStatuses.includes("Airborne") ? "Airborne" : "Underground"}! You need Focused status to hit them.`,
        });
        return;
      }
      
      let result;
      if (hasReaping && !targetActiveStatuses.includes("Stasis")) {
        // Reaping: ignore Armor, Aura, AND Shielded - direct HP damage
        const currentHP = target.current_hp ?? target.max_hp ?? 100;
        const newHP = Math.max(0, currentHP - damage);
        result = { newHP, newArmor: target.armor ?? 0, newAura: target.aura ?? 0 };
      } else if (hasLethal) {
        // Lethal: bypass Armor and Aura, direct HP damage
        const currentHP = target.current_hp ?? target.max_hp ?? 100;
        const newHP = Math.max(0, currentHP - damage);
        result = { newHP, newArmor: target.armor ?? 0, newAura: target.aura ?? 0 };
      } else {
        // Normal damage: goes through Aura -> Armor -> HP
        result = statsSystem.applyDamage(
          damage,
          target.current_hp ?? target.max_hp ?? 100,
          target.armor ?? 0,
          target.aura ?? 0
        );
      }
      
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
        const msg = (updateError.message || "").toLowerCase();
        const looksLikeRls =
          msg.includes("row-level security") ||
          msg.includes("permission denied") ||
          msg.includes("violates row-level security") ||
          msg.includes("not allowed");
        toast({
          title: "Error",
          description: looksLikeRls
            ? "Attack failed: database permissions are blocking combat updates for non-admin users. Apply the Supabase migration `20260129000000_fix_arena_non_admin_access.sql`."
            : `Failed to apply damage: ${updateError.message}`,
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

  const tryApplyHiddenAtkBonus = async (targetUserId: string) => {
    if (Math.random() >= 0.6) return;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("current_atk, max_atk")
      .eq("id", targetUserId)
      .single();

    if (error || !profile) {
      console.error("Failed to load profile for Hidden bonus:", error);
      return;
    }

    const currentAtk = (profile as any).current_atk ?? (profile as any).max_atk ?? 20;
    const newAtk = currentAtk + 3;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ current_atk: newAtk })
      .eq("id", targetUserId);

    if (updateError) {
      console.error("Failed to apply Hidden ATK bonus:", updateError);
      return;
    }

    if (targetUserId === userId) {
      setCurrentATK(newAtk);
      toast({
        title: "Hidden Bonus",
        description: "+3 ATK gained from Hidden.",
      });
    }
  };
  
  const applyKOStatus = async (targetUserId: string) => {
    const nowIso = new Date().toISOString();
    const { data: activeLockout } = await supabase
      .from("player_statuses")
      .select("id")
      .eq("user_id", targetUserId)
      .eq("status", "K.O.Lockout")
      .gt("expires_at", nowIso)
      .maybeSingle();

    if (activeLockout) {
      return;
    }

    const { data: existingKO } = await supabase
      .from("player_statuses")
      .select("id")
      .eq("user_id", targetUserId)
      .eq("status", "K.O")
      .gt("expires_at", nowIso)
      .maybeSingle();

    // K.O. grace period: 2 minutes to use a Revival technique
    const gracePeriodMinutes = 2;
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + gracePeriodMinutes);
    
    if (!existingKO) {
      const { error: koInsertError } = await supabase.from("player_statuses").insert({
        user_id: targetUserId,
        status: "K.O",
        applied_by_user_id: userId || null,
        applied_by_mastery: 2,
        expires_at: expiresAt.toISOString(),
      });
      if (koInsertError) {
        console.error("Failed to apply K.O status:", koInsertError);
        return;
      }
    }
    
    // Get K.O'd player's username for notification
    const koPlayer = playerPositions.find(p => p.user_id === targetUserId);
    const koUsername = koPlayer?.profiles?.username || "A player";
    
    // Send notification to all players in arena
    const { data: posRows } = await supabase
      .from("player_positions")
      .select("user_id")
      .not("user_id", "is", null);
    
    if (posRows && posRows.length > 0) {
      const uniqueUserIds = Array.from(new Set(posRows.map((p: any) => p.user_id).filter(Boolean)));
      const notificationRows = uniqueUserIds.map((uid) => ({
        user_id: uid,
        message: `${koUsername} is K.O!`,
        type: "ko_alert",
      }));
      await supabase.from("notifications").insert(notificationRows);
    }
    
    // After 2 minutes, check if still K.O'd (no Revival used)
    setTimeout(async () => {
      // Check if K.O. status still exists (Revival would have deleted it)
      const { data: koStatus } = await supabase
        .from("player_statuses")
        .select("id")
        .eq("user_id", targetUserId)
        .eq("status", "K.O")
        .maybeSingle();
      
      if (koStatus) {
        // Still K.O'd - no Revival was used
        // Remove the K.O status and apply K.O.Lockout for 30 minutes
        await supabase.from("player_statuses").delete().eq("id", koStatus.id);
        
        const lockoutExpiresAt = new Date();
        lockoutExpiresAt.setMinutes(lockoutExpiresAt.getMinutes() + 30);
        
        await supabase.from("player_statuses").insert({
          user_id: targetUserId,
          status: "K.O.Lockout",
          applied_by_user_id: userId || null,
          applied_by_mastery: 0,
          expires_at: lockoutExpiresAt.toISOString(),
        });
        
        // Kick the player out of the Arena (remove from player_positions)
        // They disappear from zones and must click "Join Arena" again after lockout
        await supabase
          .from("player_positions")
          .delete()
          .eq("user_id", targetUserId);
        
        // Also remove from arena_participants so they need to rejoin
        await supabase
          .from("arena_participants")
          .delete()
          .eq("user_id", targetUserId);
        
        // If the kicked player is the current user, update local state
        if (targetUserId === userId) {
          setHasJoined(false);
          setCurrentZone("");
        }
        
        // Refresh player positions so everyone sees the player disappear
        fetchPlayerPositions();
        
        // After 30 minutes, reset their stats to max and allow them to play again
        setTimeout(async () => {
          // Check if K.O.Lockout is still active (wasn't manually removed)
          const { data: lockoutStatus } = await supabase
            .from("player_statuses")
            .select("id")
            .eq("user_id", targetUserId)
            .eq("status", "K.O.Lockout")
            .maybeSingle();
          
          if (lockoutStatus) {
            // Remove K.O.Lockout status
            await supabase.from("player_statuses").delete().eq("id", lockoutStatus.id);
            
            // Get user's level to calculate max stats
            const { data: profile } = await supabase
              .from("profiles")
              .select("level")
              .eq("id", targetUserId)
              .single();
            
            const level = profile?.level || 1;
            const maxHP = statsSystem.calculateMaxHP(level);
            const maxATK = statsSystem.calculateMaxATK(level);
            
            // Reset stats to max values (HP/ATK to max, Armor/Aura/Energy/M to 0)
            await supabase
              .from("profiles")
              .update({
                current_hp: maxHP,
                max_hp: maxHP,
                current_atk: maxATK,
                max_atk: maxATK,
                armor: 0,
                aura: 0,
                aura_expires_at: null,
                energy: 0,
                mastery: 0,
              })
              .eq("id", targetUserId);
          }
        }, 30 * 60 * 1000); // 30 minutes
      }
    }, gracePeriodMinutes * 60 * 1000); // 2 minutes
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

    // Block action until cooldowns are loaded
    if (!cooldownsLoaded) {
      toast({
        title: "Loading",
        description: "Please wait while cooldowns are being loaded...",
        variant: "destructive",
      });
      return;
    }
    
    // Check if status blocks actions (Stunned, K.O, Grounded, Stasis)
    const moveAroundStatuses = playerStatuses.map(s => s.status);
    if (statusSystem.statusBlocksActions(moveAroundStatuses)) {
      toast({
        title: "Cannot Move Around",
        description: "You cannot perform actions with your current status effect.",
        variant: "destructive",
      });
      return;
    }
    
    // Check action limit - ALWAYS check database first to prevent refresh exploit
    const { data: profileData } = await supabase
      .from("profiles")
      .select("last_action_at")
      .eq("id", userId)
      .single();
    
    if (profileData?.last_action_at) {
      const lastActionTime = new Date(profileData.last_action_at);
      const timeSinceLastAction = new Date().getTime() - lastActionTime.getTime();
      if (timeSinceLastAction < 60000) {
        const remaining = Math.ceil((60000 - timeSinceLastAction) / 1000);
        toast({
          title: "Action Limit",
          description: `You can only use 1 action per minute. ${remaining}s remaining.`,
          variant: "destructive",
        });
        return;
      }
    }
    
    // Note: We only check database for action limit, not local state
    // This ensures consistency across page refreshes
    
    // Get random result
    const result = getRandomMoveAroundResult();
    
    // Apply effect
    let description = result.description;
    
    if (result.effect.type === "energy") {
      const moveStatuses = playerStatuses.map(s => s.status);
      const moveGains = statusSystem.statusPreventsGain(moveStatuses);
      if (moveGains.energy) {
        description += ` (Energy gain blocked - Weakened!)`;
      } else {
        const newEnergy = (energy || 0) + (result.effect.value || 0);
        setEnergy(newEnergy);
        await supabase.from("profiles").update({ energy: newEnergy }).eq("id", userId);
        description += ` (+${result.effect.value} Energy)`;
      }
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
      const moveStatuses = playerStatuses.map(s => s.status);
      const moveGains = statusSystem.statusPreventsGain(moveStatuses);
      if (moveGains.armor) {
        description += ` (Armor gain blocked - Weakened!)`;
      } else {
        const newArmor = (armor || 0) + (result.effect.value || 0);
        setArmor(newArmor);
        await supabase.from("profiles").update({ armor: newArmor }).eq("id", userId);
        description += ` (+${result.effect.value} Armor)`;
      }
    } else if (result.effect.type === "mastery") {
      const newMastery = masterySystem.capMastery(mastery + (result.effect.value || 0));
      setMastery(newMastery);
      await supabase.from("profiles").update({ mastery: newMastery }).eq("id", userId);
      description += ` (${result.effect.value! > 0 ? '+' : ''}${result.effect.value} Mastery)`;
    } else if (result.effect.type === "atk_boost") {
      const boost = Math.floor((currentATK * (result.effect.percentage || 0)) / 100);
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + (result.effect.duration || 5));
      
      // Try update first (most common case - effect already exists)
      const { data: orbUpdateData, error: orbUpdateError } = await supabase
        .from("red_orb_effects")
        .update({
          atk_boost: boost,
          expires_at: expiresAt.toISOString(),
        })
        .eq("user_id", userId)
        .select();
      
      // If update didn't affect any rows (no existing record), insert new one
      if (!orbUpdateData || orbUpdateData.length === 0) {
        const { error: orbInsertError } = await supabase
          .from("red_orb_effects")
          .insert({
            user_id: userId,
            atk_boost: boost,
            expires_at: expiresAt.toISOString(),
          });
        
        if (orbInsertError && orbInsertError.code !== '23505') { // Ignore duplicate key errors (race condition)
          console.error("Error inserting red_orb_effect:", orbInsertError);
        }
      } else if (orbUpdateError) {
        console.error("Error updating red_orb_effect:", orbUpdateError);
      }
      
      const newATK = currentATK + boost;
      setCurrentATK(newATK);
      await supabase.from("profiles").update({ current_atk: newATK }).eq("id", userId);
      description += ` (+${boost} ATK for ${result.effect.duration} minutes)`;
    } else if (result.effect.type === "mastery_use") {
      // Use Mastery based on discipline
      const effect = masterySystem.getMasteryEffect(currentProfile?.discipline as any, mastery);
      if (effect) {
        const wholeMastery = Math.floor(mastery);
        
        if (effect.type === "status" && effect.statuses) {
          // Apply each status (e.g., All-Seeing applies FOCUSED + LETHAL)
          for (const statusName of effect.statuses) {
            const duration = effect.duration || wholeMastery;
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + duration);
            
            await supabase.from("player_statuses").insert({
              user_id: userId,
              status: statusName,
              applied_by_user_id: userId,
              applied_by_mastery: mastery,
              expires_at: expiresAt.toISOString(),
            });
          }
          description += ` (Applied ${effect.statuses.join(" + ")} for ${effect.duration}min)`;
        } else if (effect.type === "armor" && effect.target === "self") {
          const newArmor = (armor || 0) + effect.value;
          setArmor(newArmor);
          await supabase.from("profiles").update({ armor: newArmor }).eq("id", userId);
          description += ` (+${effect.value} Armor)`;
        } else if (effect.type === "heal" && effect.target === "self") {
          const newHP = statsSystem.applyHeal(effect.value, currentHP, maxHP);
          setCurrentHP(newHP);
          await supabase.from("profiles").update({ current_hp: newHP }).eq("id", userId);
          description += ` (+${effect.value} HP healed)`;
        } else if (effect.type === "damage" && effect.target === "target" && currentTarget) {
          await applyDamageToPlayer(currentTarget, effect.value, "mastery");
          description += ` (${effect.value} damage to target)`;
        } else if (effect.type === "damage" && effect.target === "zone") {
          const playersInZone = getPlayersInZone(selectedZoneTarget || currentZone).filter(p => p.user_id !== userId);
          for (const player of playersInZone) {
            await applyDamageToPlayer(player.user_id, effect.value, "mastery");
          }
          description += ` (${effect.value} damage to zone)`;
        } else if (effect.type === "hidden") {
          // Shadow: apply Hidden status
          const expiresAt = new Date();
          expiresAt.setMinutes(expiresAt.getMinutes() + (effect.duration || wholeMastery));
          await supabase.from("player_statuses").insert({
            user_id: userId,
            status: "Hidden",
            applied_by_user_id: userId,
            applied_by_mastery: mastery,
            expires_at: expiresAt.toISOString(),
          });
          await tryApplyHiddenAtkBonus(userId);
          description += ` (Hidden for ${effect.duration || wholeMastery}min)`;
        }
        
        // Consume all mastery after using M-key effect
        setMastery(0);
        await supabase.from("profiles").update({ mastery: 0 }).eq("id", userId);
        
        await fetchPlayerStatuses(userId);
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
    
    // Update last_action_at in database
    await supabase
      .from("profiles")
      .update({ last_action_at: now.toISOString() })
      .eq("id", userId);

    // Update local state too (prevents Attack bypass after Move Around)
    setLastActionTime(now);
    
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
    
    // Check if status blocks actions (Stunned, K.O, Grounded, Stasis)
    const observeStatuses = playerStatuses.map(s => s.status);
    if (statusSystem.statusBlocksActions(observeStatuses)) {
      toast({
        title: "Cannot Observe",
        description: "You cannot perform actions with your current status effect.",
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
    
    // ALWAYS check database first to prevent refresh exploit
    // This ensures we have the latest cooldown state from the database
    const { data: cooldownData, error: cooldownError } = await supabase
      .from("action_cooldowns")
      .select("expires_at")
      .eq("user_id", userId)
      .eq("action_type", "observe")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cooldownError) {
      // Only log non-network errors (network errors are expected during connectivity issues)
      const errorMsg = cooldownError.message?.toLowerCase() || '';
      const isNetworkError = errorMsg.includes('fetch') || 
                             errorMsg.includes('network') ||
                             errorMsg.includes('failed') ||
                             errorMsg.includes('timeout') ||
                             cooldownError.code === 'PGRST116' ||
                             cooldownError.code === 'PGRST301';
      if (!isNetworkError) {
        console.error("Error checking cooldown:", cooldownError);
      }
      // On network error, fall back to state check (better than blocking user)
    }

    // If cooldown exists in database, use it (even if state says otherwise)
    if (cooldownData && !timerSystem.isCooldownExpired(cooldownData.expires_at)) {
      const remaining = timerSystem.getRemainingCooldown(cooldownData.expires_at);
      // Update state with database value to keep it in sync
      setActionCooldowns(prev => ({ ...prev, observe: cooldownData.expires_at }));
      toast({
        title: "On Cooldown",
        description: `Observe is on cooldown. ${timerSystem.formatTime(remaining)} remaining.`,
        variant: "destructive",
      });
      return;
    }

    // Also check state as a quick check (but database is authoritative)
    if (actionCooldowns["observe"] && !timerSystem.isCooldownExpired(actionCooldowns["observe"])) {
      const remaining = timerSystem.getRemainingCooldown(actionCooldowns["observe"]);
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
    
    // Use update-then-insert pattern to avoid conflicts
    const { data: observeUpdateData, error: observeUpdateError } = await supabase
      .from("observe_status")
      .update({
        expires_at: expiresAt.toISOString(),
      })
      .eq("user_id", userId)
      .select();
    
    // If update didn't affect any rows (no existing record), insert new one
    if (!observeUpdateData || observeUpdateData.length === 0) {
      const { error: observeInsertError } = await supabase
        .from("observe_status")
        .insert({
          user_id: userId,
          expires_at: expiresAt.toISOString(),
        });
      
      if (observeInsertError && observeInsertError.code !== '23505') {
        console.error("Error inserting observe status:", observeInsertError);
      }
    } else if (observeUpdateError) {
      console.error("Error updating observe status:", observeUpdateError);
    }
    
    // Set cooldown (5 minutes) - use update-then-insert pattern to avoid 409 conflicts
    const cooldownExpires = timerSystem.calculateCooldownExpiration(5);
    
    // Try update first (most common case - cooldown already exists)
    const { data: cooldownUpdateData, error: cooldownUpdateError } = await supabase
      .from("action_cooldowns")
      .update({
        expires_at: cooldownExpires.toISOString(),
      })
      .eq("user_id", userId)
      .eq("action_type", "observe")
      .select();
    
    // If update didn't affect any rows (no existing record), insert new one
    if (!cooldownUpdateData || cooldownUpdateData.length === 0) {
      const { error: cooldownInsertError } = await supabase
        .from("action_cooldowns")
        .insert({
          user_id: userId,
          action_type: "observe",
          expires_at: cooldownExpires.toISOString(),
        });
      
      if (cooldownInsertError && cooldownInsertError.code !== '23505') { // Ignore duplicate key errors (race condition)
        console.error("Error inserting observe cooldown:", cooldownInsertError);
      }
    } else if (cooldownUpdateError) {
      console.error("Error updating observe cooldown:", cooldownUpdateError);
    }
    
    setActionCooldowns(prev => ({ ...prev, observe: cooldownExpires.toISOString() }));
    
    // Refresh cooldowns from database to ensure sync
    await fetchCooldowns(userId);
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
    
    // Refresh player statuses to show observe status
    await fetchPlayerStatuses(userId);
    
    toast({
      title: "Observing Zones",
      description: "You can now target one opponent anywhere",
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
    
    // Block zone change if Stunned, K.O, Grounded, Stasis, etc.
    const currentStatuses = playerStatuses.map(s => s.status);
    if (statusSystem.statusBlocksZoneChange(currentStatuses)) {
      toast({
        title: "Cannot Change Zone",
        description: "You cannot change zones while affected by a status effect.",
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
    
    // ALWAYS check database first to prevent refresh exploit
    // This ensures we have the latest cooldown state from the database
    const { data: cooldownData, error: cooldownError } = await supabase
      .from("action_cooldowns")
      .select("expires_at")
      .eq("user_id", userId)
      .eq("action_type", "change_zone")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cooldownError) {
      // Only log non-network errors (network errors are expected during connectivity issues)
      const errorMsg = cooldownError.message?.toLowerCase() || '';
      const isNetworkError = errorMsg.includes('fetch') || 
                             errorMsg.includes('network') ||
                             errorMsg.includes('failed') ||
                             errorMsg.includes('timeout') ||
                             cooldownError.code === 'PGRST116' ||
                             cooldownError.code === 'PGRST301';
      if (!isNetworkError) {
        console.error("Error checking cooldown:", cooldownError);
      }
      // On network error, fall back to state check (better than blocking user)
      // This allows the action to proceed if network is temporarily unavailable
      // Note: This is a trade-off between security and UX during network issues
    }

    // If cooldown exists in database, use it (even if state says otherwise)
    if (cooldownData && !timerSystem.isCooldownExpired(cooldownData.expires_at)) {
      const remaining = timerSystem.getRemainingCooldown(cooldownData.expires_at);
      // Update state with database value to keep it in sync
      setActionCooldowns(prev => ({ ...prev, change_zone: cooldownData.expires_at }));
      toast({
        title: "On Cooldown",
        description: `Change Zone is on cooldown. ${timerSystem.formatTime(remaining)} remaining.`,
        variant: "destructive",
      });
      return;
    }

    // Also check state as a quick check (but database is authoritative)
    if (actionCooldowns["change_zone"] && !timerSystem.isCooldownExpired(actionCooldowns["change_zone"])) {
      const remaining = timerSystem.getRemainingCooldown(actionCooldowns["change_zone"]);
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
    
    // Try update first (most common case - cooldown already exists)
    const { data: cooldownUpdateData, error: cooldownUpdateError } = await supabase
      .from("action_cooldowns")
      .update({ expires_at: cooldownExpires.toISOString() })
      .eq("user_id", userId)
      .eq("action_type", "change_zone")
      .select();
    
    // If update didn't affect any rows (no existing record), insert new one
    if (!cooldownUpdateData || cooldownUpdateData.length === 0) {
      const { error: cooldownInsertError } = await supabase
        .from("action_cooldowns")
        .insert({
          user_id: userId,
          action_type: "change_zone",
          expires_at: cooldownExpires.toISOString(),
        });
      
      if (cooldownInsertError && cooldownInsertError.code !== '23505') { // Ignore duplicate key errors (race condition)
        console.error("Error inserting change_zone cooldown:", cooldownInsertError);
      }
    } else if (cooldownUpdateError) {
      console.error("Error updating change_zone cooldown:", cooldownUpdateError);
    }
    
    // Update state immediately
    setActionCooldowns(prev => ({ ...prev, change_zone: cooldownExpires.toISOString() }));
    
    // Refresh cooldowns from database to ensure sync
    await fetchCooldowns(userId);
    
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

    // Block action until cooldowns are loaded
    if (!cooldownsLoaded) {
      toast({
        title: "Loading",
        description: "Please wait while cooldowns are being loaded...",
        variant: "destructive",
      });
      return;
    }
    
    // Check action limit (1 technique per minute) - server-authoritative
    const { data: techCooldownProfile } = await supabase
      .from("profiles")
      .select("last_technique_at")
      .eq("id", userId)
      .single();
    
    if (techCooldownProfile?.last_technique_at) {
      const lastTech = new Date(techCooldownProfile.last_technique_at);
      const diffMs = Date.now() - lastTech.getTime();
      if (diffMs < 60000) {
        const remaining = Math.ceil((60000 - diffMs) / 1000);
        toast({
          title: "Action Limit",
          description: `You can only use 1 technique per minute. Wait ${remaining}s.`,
          variant: "destructive",
        });
        return;
      }
    }
    
    // Get technique data (use cached or fetch)
    let techniqueData = fullTechniqueData[selectedTechnique];
    if (!techniqueData) {
      // First check if we have the technique in userTechniques to preserve tags
      const existingTech = userTechniques.find((t: any) => t.id === selectedTechnique);
      
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
      
      // Merge with existing technique data to preserve tags if they exist
      // Preserve tags from existingTech first, then from data, then fallback to type_info
      const preservedTags = existingTech?.tags || data.tags || existingTech?.type_info || data.type_info;
      const mergedData = existingTech 
        ? { ...existingTech, ...data, tags: preservedTags, type_info: data.type_info || existingTech.type_info }
        : { ...data, tags: preservedTags };
      
      techniqueData = mergedData;
      setFullTechniqueData(prev => {
        // Preserve existing tags if they exist
        const existing = prev[selectedTechnique];
        const finalTags = existing?.tags || preservedTags;
        return { ...prev, [selectedTechnique]: { ...mergedData, tags: finalTags } };
      });
    }
    
    // Handle tags - can be array or comma-separated string (need tags first for K.O. Revival check)
    let tags: string[] = [];
    if (Array.isArray(techniqueData.tags)) {
      tags = techniqueData.tags;
    } else if (typeof techniqueData.tags === 'string') {
      tags = techniqueData.tags.split(",").map(t => t.trim());
    } else if (techniqueData.type_info) {
      tags = techniqueData.type_info.split(",").map(t => t.trim());
    }
    
    // Check if user can use technique (status checks)
    const activeStatuses = playerStatuses.map(s => s.status);
    const isKOStatus = activeStatuses.includes("K.O");
    const isKOLockout = activeStatuses.includes("K.O.Lockout");
    const isRevivalTechnique = tags.some(t => t.toLowerCase() === "revival");
    
    // K.O.Lockout blocks ALL techniques (no Revival allowed)
    if (isKOLockout) {
      toast({
        title: "Cannot Use Technique",
        description: "You are in K.O. Lockout and cannot perform any actions.",
        variant: "destructive",
      });
      return;
    }
    
    // K.O status allows ONLY Revival techniques
    if (isKOStatus) {
      if (!isRevivalTechnique) {
        toast({
          title: "Cannot Use Technique",
          description: "You are K.O'd! Only Revival techniques can be used.",
          variant: "destructive",
        });
        return;
      }
      // Revival technique during K.O - allow it to proceed
    } else if (statusSystem.statusBlocksTechniques(activeStatuses)) {
      // Normal status blocking (Stunned, Silenced, etc.)
      toast({
        title: "Cannot Use Technique",
        description: "You are stunned or silenced.",
        variant: "destructive",
      });
      return;
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
    if (energyCost > 0 && energy < energyCost) {
      toast({
        title: "Not enough Energy",
        description: `This technique requires ${energyCost} Energy`,
        variant: "destructive",
      });
      return;
    }
    
    // Check mastery requirements (no_use_m = minimum M needed to use)
    if (techniqueData.no_use_m && mastery < techniqueData.no_use_m) {
      toast({
        title: "Insufficient Mastery",
        description: `This technique requires ${techniqueData.no_use_m} Mastery`,
        variant: "destructive",
      });
      return;
    }
    
    // Check energy requirements (no_use_e = minimum Energy needed to use)
    if (techniqueData.no_use_e && energy < techniqueData.no_use_e) {
      toast({
        title: "Insufficient Energy",
        description: `This technique requires ${techniqueData.no_use_e} Energy`,
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
    
    // ALWAYS check database first to prevent refresh exploit
    // This ensures we have the latest cooldown state from the database
    const { data: techniqueCooldownData, error: cooldownError } = await supabase
      .from("technique_cooldowns")
      .select("expires_at")
      .eq("user_id", userId)
      .eq("technique_id", selectedTechnique)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cooldownError) {
      // Only log non-network errors (network errors are expected during connectivity issues)
      const errorMsg = cooldownError.message?.toLowerCase() || '';
      const isNetworkError = errorMsg.includes('fetch') || 
                             errorMsg.includes('network') ||
                             errorMsg.includes('failed') ||
                             errorMsg.includes('timeout') ||
                             cooldownError.code === 'PGRST116' ||
                             cooldownError.code === 'PGRST301';
      if (!isNetworkError) {
        console.error("Error checking cooldown:", cooldownError);
      }
      // On network error, fall back to state check (better than blocking user)
    }

    // If cooldown exists in database, use it (even if state says otherwise)
    if (techniqueCooldownData && techniqueCooldownData.expires_at && !timerSystem.isCooldownExpired(techniqueCooldownData.expires_at)) {
      const remaining = timerSystem.getRemainingCooldown(techniqueCooldownData.expires_at);
      // Update state with database value to keep it in sync
      setTechniqueCooldowns(prev => ({
        ...prev,
        [selectedTechnique]: techniqueCooldownData.expires_at,
      }));
      toast({
        title: "Technique on Cooldown",
        description: `${timerSystem.formatTime(remaining)} remaining`,
        variant: "destructive",
      });
      return;
    }

    // Also check state as a quick check (but database is authoritative)
    if (techniqueCooldowns[selectedTechnique] && !timerSystem.isCooldownExpired(techniqueCooldowns[selectedTechnique])) {
      const remaining = timerSystem.getRemainingCooldown(techniqueCooldowns[selectedTechnique]);
      toast({
        title: "Technique on Cooldown",
        description: `${timerSystem.formatTime(remaining)} remaining`,
        variant: "destructive",
      });
      return;
    }
    
    // Check if any active status blocks a specific technique tag
    for (const tag of tags) {
      if (statusSystem.statusBlocksTechniqueTag(activeStatuses, tag)) {
        const statusReasons: string[] = [];
        if (activeStatuses.includes("Unwell") && tag.toLowerCase() === "movement") statusReasons.push("Unwell blocks Movement");
        if (activeStatuses.includes("Shrouded") && (tag.toLowerCase() === "ranged" || tag.toLowerCase() === "aoe")) statusReasons.push("Shrouded blocks Ranged/AOE");
        if (activeStatuses.includes("Launched Up") && tag.toLowerCase() === "defensive") statusReasons.push("Launched Up blocks Defensive");
        if (activeStatuses.includes("Bleeding") && (tag.toLowerCase() === "buff" || tag.toLowerCase() === "revival")) statusReasons.push("Bleeding blocks Buff/Revival");
        if (activeStatuses.includes("Chaos-affected") && (tag.toLowerCase() === "combo" || tag.toLowerCase() === "setup")) statusReasons.push("Chaos-Affected blocks Combo/Setup");
        
        toast({
          title: "Cannot Use Technique",
          description: statusReasons.length > 0 ? statusReasons[0] : `You cannot use ${tag} techniques with your current status.`,
          variant: "destructive",
        });
        return;
      }
    }
    
    // Determine target(s)
    const hasGlobalTag = tags.some(t => t.toLowerCase() === "global");
    let targets: string[] = [];
    if (selectedZoneTarget && (hasGlobalTag || currentProfile?.discipline === "Emperor")) {
      // Zone targeting with Global tag or Emperor - get all players in zone
      const playersInZone = getPlayersInZone(selectedZoneTarget);
      targets = playersInZone.map(p => p.user_id);
    } else if (currentTarget) {
      // Single target
      targets = [currentTarget];
    } else if (hasGlobalTag) {
      // Global technique without zone target - all players in current zone
      const playersInZone = getPlayersInZone(currentZone);
      targets = playersInZone.map(p => p.user_id);
    } else if (isRevivalTechnique) {
      // Revival techniques are self-targeting, no target needed
      targets = [];
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
      
      // Stasis: complete immunity - can't be targeted, techniques don't affect them
      if (statusSystem.statusIsImmune(targetActiveStatuses)) {
        if (targets.length === 1) {
          toast({
            title: "Target is in Stasis",
            description: "This target is in Stasis and cannot be affected by any technique.",
            variant: "destructive",
          });
        }
        continue;
      }
      
      // Check if target can be hit
      if (targetActiveStatuses.includes("Hidden") && !tags.some(t => t.toLowerCase() === "aoe") && !tags.some(t => t.toLowerCase() === "setup")) {
        continue; // Skip hidden targets unless AOE/SETUP
      }
      
      if (targetActiveStatuses.includes("Airborne") || targetActiveStatuses.includes("Underground")) {
        const hasAOETag = tags.some(t => t.toLowerCase() === "aoe");
        const hasGlobalTagForCheck = tags.some(t => t.toLowerCase() === "global");
        if (!statusSystem.canHitAirborneUnderground(activeStatuses) && !hasAOETag && !hasGlobalTagForCheck) {
          if (targets.length === 1) {
            const evadingStatus = targetActiveStatuses.includes("Airborne") ? "Airborne" : "Underground";
            toast({
              title: "Technique Missed",
              description: `Target is ${evadingStatus}! Only FOCUSED attackers or Global/AOE techniques can hit them.`,
              variant: "destructive",
            });
          }
          continue;
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
        // If single target, show an error
        if (targets.length === 1) {
          toast({
            title: "Cannot Hit Target",
            description: `This technique only hits targets with "${techniqueData.specific_status_hit}" status.`,
            variant: "destructive",
          });
        }
        continue;
      }
      
      // Check attacker status effects for damage bypass
      const attackerHasReaping = statusSystem.attackIgnoresEverything(activeStatuses);
      const attackerHasLethal = statusSystem.attackBypassesDefenses(activeStatuses);
      
      // Shielded: no HP/Armor/Aura loss at all (Reaping bypasses Shielded)
      const targetIsShielded = targetActiveStatuses.includes("Shielded");
      
      // Calculate damage with multipliers
      let damage = techniqueData.damage || 0;
      let armorDamage = techniqueData.armor_damage || 0;
      let auraDamage = techniqueData.aura_damage || 0;
      
      // Apply damage multipliers
      const damageMultiplier = statusSystem.getDamageMultiplier(targetActiveStatuses, tags);
      damage = Math.floor(damage * damageMultiplier);
      
      // Setup tag: 1.5x damage to Aura
      if (tags.some(t => t.toLowerCase() === "setup") && targetProfile?.aura) {
        damage = Math.floor(damage * 1.5);
      }
      
      // Shielded blocks all damage unless attacker has Reaping
      if (targetIsShielded && !attackerHasReaping) {
        damage = 0;
        armorDamage = 0;
        auraDamage = 0;
        if (targets.length === 1) {
          const shieldedPlayer = playerPositions.find(p => p.user_id === targetId);
          const shieldedName = shieldedPlayer?.profiles?.username || "Target";
          toast({
            title: "No Damage Dealt",
            description: `${shieldedName} is Shielded! No damage was dealt.`,
          });
        }
      }
      
      // Apply damage
      if (damage > 0) {
        if (attackerHasReaping || attackerHasLethal) {
          // Lethal/Reaping: bypass Armor and Aura, deal direct HP damage
          const currentHP = targetProfile?.current_hp ?? targetProfile?.max_hp ?? 100;
          const newHP = Math.max(0, currentHP - damage);
          await supabase
            .from("profiles")
            .update({ current_hp: newHP })
            .eq("id", targetId);
          
          if (newHP === 0) {
            await applyKOStatus(targetId);
          }
        } else {
          // Normal damage pipeline: Aura -> Armor -> HP
          const result = statsSystem.applyDamage(
            damage,
            targetProfile?.current_hp ?? targetProfile?.max_hp ?? 100,
            targetProfile?.armor ?? 0,
            targetProfile?.aura ?? 0
          );
          
          await supabase
            .from("profiles")
            .update({
              current_hp: result.newHP,
              armor: result.newArmor,
              aura: result.newAura,
            })
            .eq("id", targetId);
          
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
      if (techniqueData.atk_debuff && techniqueData.atk_debuff > 0) {
        const currentTargetATK = targetProfile?.current_atk ?? targetProfile?.max_atk ?? 20;
        const newATK = Math.max(0, currentTargetATK - techniqueData.atk_debuff);
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
      
      // Apply Energy taken
      if (techniqueData.energy_taken && techniqueData.energy_taken > 0) {
        const currentTargetEnergy = targetProfile?.energy || 0;
        const newTargetEnergy = Math.max(0, currentTargetEnergy - techniqueData.energy_taken);
        await supabase
          .from("profiles")
          .update({ energy: newTargetEnergy })
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
        
        // Launched Up: target loses 0.5 M
        if (techniqueData.opponent_status === "Launched Up") {
          const newTargetMastery = Math.max(0, (targetProfile?.mastery || 0) - 0.5);
          await supabase.from("profiles").update({ mastery: newTargetMastery }).eq("id", targetId);
        }
        
        // Weakened: target loses 4 ATK
        if (techniqueData.opponent_status === "Weakened") {
          const currentTargetATK = targetProfile?.current_atk ?? targetProfile?.max_atk ?? 20;
          const newATK = Math.max(0, currentTargetATK - 4);
          await supabase.from("profiles").update({ current_atk: newATK }).eq("id", targetId);
        }

        if (techniqueData.opponent_status === "Hidden") {
          await tryApplyHiddenAtkBonus(targetId);
        }
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
    
    // Armor given (blocked by Weakened)
    if (techniqueData.armor_given) {
      const gains = statusSystem.statusPreventsGain(activeStatuses);
      if (gains.armor) {
        toast({ title: "Weakened", description: "You cannot gain Armor while Weakened." });
      } else {
        const newArmor = (armor || 0) + techniqueData.armor_given;
        setArmor(newArmor);
        await supabase
          .from("profiles")
          .update({ armor: newArmor })
          .eq("id", userId);
      }
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
    
    // Energy given (blocked by Weakened)
    if (techniqueData.energy_given) {
      const gains = statusSystem.statusPreventsGain(activeStatuses);
      if (gains.energy) {
        toast({ title: "Weakened", description: "You cannot gain Energy while Weakened." });
      } else {
        const newEnergy = (energy || 0) + techniqueData.energy_given;
        setEnergy(newEnergy);
        await supabase
          .from("profiles")
          .update({ energy: newEnergy })
          .eq("id", userId);
      }
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

      if (techniqueData.self_status === "Hidden") {
        await tryApplyHiddenAtkBonus(userId);
      }
      
      // Refresh statuses
      await fetchPlayerStatuses(userId);
    }
    
    // Self damage: deal direct HP damage to self (ignores Armor/Aura)
    if (techniqueData.self_damage && techniqueData.self_damage > 0) {
      const selfDmg = techniqueData.self_damage;
      const newSelfHP = Math.max(0, currentHP - selfDmg);
      setCurrentHP(newSelfHP);
      await supabase
        .from("profiles")
        .update({ current_hp: newSelfHP })
        .eq("id", userId);
      
      if (newSelfHP === 0) {
        await applyKOStatus(userId);
      }
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
      
      // Try update first (most common case - cooldown already exists)
      const { data: cooldownUpdateData, error: cooldownUpdateError } = await supabase
        .from("technique_cooldowns")
        .update({
          expires_at: cooldownExpires.toISOString(),
        })
        .eq("user_id", userId)
        .eq("technique_id", selectedTechnique)
        .select();
      
      // If update didn't affect any rows (no existing record), insert new one
      if (!cooldownUpdateData || cooldownUpdateData.length === 0) {
        const { error: cooldownInsertError } = await supabase
          .from("technique_cooldowns")
          .insert({
            user_id: userId,
            technique_id: selectedTechnique,
            expires_at: cooldownExpires.toISOString(),
          });
        
        if (cooldownInsertError && cooldownInsertError.code !== '23505') { // Ignore duplicate key errors (race condition)
          console.error("Error inserting technique cooldown:", cooldownInsertError);
        }
      } else if (cooldownUpdateError) {
        console.error("Error updating technique cooldown:", cooldownUpdateError);
      }
      
      setTechniqueCooldowns(prev => ({
        ...prev,
        [selectedTechnique]: cooldownExpires.toISOString(),
      }));
      
      // Refresh cooldowns from database to ensure sync
      await fetchCooldowns(userId);
    }
    
    // Update timestamps
    const now = new Date();
    setLastTechniqueTime(now);
    await supabase
      .from("profiles")
      .update({ last_technique_at: now.toISOString() })
      .eq("id", userId);
    
    // If the player was K.O'd and used a Revival technique, remove K.O. status (they come back alive)
    if (isKOStatus && isRevivalTechnique) {
      // Remove the K.O status from the database
      await supabase
        .from("player_statuses")
        .delete()
        .eq("user_id", userId)
        .eq("status", "K.O");
      
      // Refresh statuses so K.O. image is removed and normal profile pic shows
      await fetchPlayerStatuses(userId);
      
      // Notify all players that this player has been revived
      const { data: posRows } = await supabase
        .from("player_positions")
        .select("user_id")
        .not("user_id", "is", null);
      
      if (posRows && posRows.length > 0) {
        const uniqueUserIds = Array.from(new Set(posRows.map((p: any) => p.user_id).filter(Boolean)));
        const reviveNotifications = uniqueUserIds.map((uid) => ({
          user_id: uid,
          message: `${currentProfile?.username || "A player"} has been revived!`,
          type: "revival",
        }));
        await supabase.from("notifications").insert(reviveNotifications);
      }
      
      toast({
        title: "Revived!",
        description: "You used a Revival technique and are back in the fight!",
      });
    }
    
    // Add to battle feed
    // Try with target_user_id first, fallback without it if the column isn't deployed on the live DB yet.
    const techniqueFeedDescription = currentTarget
      ? `Used ${techniqueData.name} [target:${currentTarget}]`
      : `Used ${techniqueData.name}`;

    let bfData: any = null;
    let bfError: any = null;

    const baseInsert: any = {
      user_id: userId,
      action_type: "technique",
      technique_id: selectedTechnique,
      technique_name: techniqueData.name,
      technique_image_url: techniqueData.image_url,
      technique_description: techniqueData.description,
      description: techniqueFeedDescription,
      zone_id: currentZone,
    };

    if (currentTarget) {
      const { data: dataWithTarget, error: errorWithTarget } = await supabase
        .from("battle_feed")
        .insert({ ...baseInsert, target_user_id: currentTarget })
        .select()
        .single();

      const isColumnError = errorWithTarget && (
        errorWithTarget.code === "PGRST204" ||
        (typeof errorWithTarget.message === "string" && errorWithTarget.message.includes("target_user_id"))
      );

      if (isColumnError) {
        const { data: dataWithoutTarget, error: errorWithoutTarget } = await supabase
          .from("battle_feed")
          .insert(baseInsert)
          .select()
          .single();
        bfData = dataWithoutTarget;
        bfError = errorWithoutTarget;
      } else {
        bfData = dataWithTarget;
        bfError = errorWithTarget;
      }
    } else {
      const { data, error } = await supabase
        .from("battle_feed")
        .insert(baseInsert)
        .select()
        .single();
      bfData = data;
      bfError = error;
    }

    if (bfError) {
      console.error("Technique battle feed insert failed:", bfError);
      toast({
        title: "Warning",
        description: "Technique executed, but failed to post to Battle Feed.",
        variant: "destructive",
      });
    } else if (bfData) {
      // Ensure it shows immediately (subscription can miss due to refresh/reconnect)
      const { data: attackerProfile } = await supabase
        .from("profiles")
        .select("username, profile_picture_url")
        .eq("id", userId)
        .single();

      let targetProfile: any = null;
      if (currentTarget) {
        const targetPlayer = playerPositions.find((p) => p.user_id === currentTarget);
        if (targetPlayer?.profiles) {
          targetProfile = {
            username: targetPlayer.profiles.username,
            profile_picture_url: targetPlayer.profiles.profile_picture_url,
          };
        }
      }

      if (attackerProfile) {
        setBattleFeed((prev) => [
          {
            ...(bfData as any),
            profiles: attackerProfile,
            target_profile: targetProfile,
            target_user_id: currentTarget || null,
          } as any,
          ...prev.slice(0, 49),
        ]);
      }
    }
    
    // Show success
    toast({
      title: "Technique Used",
      description: `${techniqueData.name} executed successfully`,
    });
    
    // Close dialog and reset
    setShowActionDialog(false);
    setSelectedTechnique(null);
    
    // Refresh data - await to ensure UI reflects changes (ATK boost/debuff, HP, etc.)
    await fetchProfile(userId);
    await fetchPlayerPositions();
    await fetchPlayerStatuses(userId);
    await fetchCooldowns(userId);
  };

  // ========== END COMPREHENSIVE TECHNIQUE USAGE SYSTEM ==========

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Vanishing Toasts */}
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
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
              
              {/* Admin Self-Reset Button */}
              {isAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => {
                    const level = currentProfile?.level || 1;
                    handleResetPlayerStats(
                      userId,
                      currentProfile?.username || "You",
                      level
                    );
                  }}
                >
                  Reset My Stats
                </Button>
              )}
              
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
              
              {/* K.O. Lockout Screen */}
              {koLockoutExpiry && new Date() < koLockoutExpiry && (
                <div className="mt-4 p-4 bg-destructive/10 border-2 border-destructive rounded-lg text-center space-y-3">
                  <img src={koImage} alt="K.O." className="w-20 h-20 mx-auto rounded-full object-cover" />
                  <p className="text-lg font-bold text-destructive">You have been killed.</p>
                  <p className="text-sm text-muted-foreground">
                    Come back in {(() => {
                      const remaining = Math.max(0, Math.floor((koLockoutExpiry.getTime() - Date.now()) / 1000));
                      const mins = Math.floor(remaining / 60);
                      const secs = remaining % 60;
                      return `${mins}m ${secs}s`;
                    })()}
                  </p>
                </div>
              )}
              
              {/* Join Button - Always Visible When Session Exists (hidden during K.O. Lockout) */}
              {!hasJoined && currentSession && !(koLockoutExpiry && new Date() < koLockoutExpiry) && (
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
              
              {/* Action Buttons - Only visible when arena is open and user has joined */}
              {hasJoined && currentSession && timerSystem.isArenaOpen(currentSession.opened_at, currentSession.closed_at) && (
              <div className="mt-4 space-y-2">
                <Button 
                  onClick={handleAttack}
                  className="w-full"
                  variant="destructive"
                  disabled={
                    !cooldownsLoaded ||
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
                    !cooldownsLoaded ||
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
                    !cooldownsLoaded ||
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
              )}
              
              {/* Legacy Take Action Button (for techniques) */}
              {hasJoined && currentSession && (
              <Button 
                onClick={() => setShowActionDialog(true)}
                  className="w-full mt-2"
                variant="default"
                disabled={
                  !timerSystem.isArenaOpen(currentSession.opened_at, currentSession.closed_at)
                }
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
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (selectedZoneTarget === zone.id) {
                                setSelectedZoneTarget(null);
                                const { error: untargetError } = await supabase
                                  .from("profiles")
                                  .update({ is_targeting_zone: false, current_target_zone_id: null })
                                  .eq("id", userId);
                                if (untargetError) {
                                  console.error("Failed to untarget zone:", untargetError);
                                  // revert local state
                                  setSelectedZoneTarget(zone.id);
                                  const msg = (untargetError.message || "").toLowerCase();
                                  const looksLikeMissingCols =
                                    untargetError.code === "PGRST204" ||
                                    msg.includes("is_targeting_zone") ||
                                    msg.includes("current_target_zone_id");
                                  toast({
                                    title: "Error",
                                    description: looksLikeMissingCols
                                      ? "Zone targeting requires the Supabase migration `20251202000000_new_arena_system.sql` (profiles.current_target_zone_id + profiles.is_targeting_zone)."
                                      : `Failed to untarget zone: ${untargetError.message || "Unknown error"}`,
                                    variant: "destructive",
                                  });
                                  return;
                                }
                              } else {
                                // Costs 2 Mastery to target a zone (1.5 for Emperor)
                                const zoneTargetCost = currentProfile?.discipline === "Emperor" ? 1.5 : 2;
                                if (mastery < zoneTargetCost) {
                                  toast({
                                    title: "Insufficient Mastery",
                                    description: `Targeting a zone costs ${zoneTargetCost} Mastery.`,
                                    variant: "destructive",
                                  });
                                  return;
                                }

                                const newMastery = mastery - zoneTargetCost;
                                setSelectedZoneTarget(zone.id);
                                setCurrentTarget(null);
                                const { error: updateError } = await supabase
                                  .from("profiles")
                                  .update({ 
                                    is_targeting_zone: true, 
                                    current_target_zone_id: zone.id,
                                    current_target_id: null,
                                    mastery: newMastery,
                                  })
                                  .eq("id", userId);

                                if (updateError) {
                                  console.error("Failed to target zone:", updateError);
                                  const msg = (updateError.message || "").toLowerCase();
                                  const looksLikeMissingCols =
                                    updateError.code === "PGRST204" ||
                                    msg.includes("is_targeting_zone") ||
                                    msg.includes("current_target_zone_id");
                                  toast({
                                    title: "Error",
                                    description: looksLikeMissingCols
                                      ? "Zone targeting requires the Supabase migration `20251202000000_new_arena_system.sql` (profiles.current_target_zone_id + profiles.is_targeting_zone)."
                                      : `Failed to target zone: ${updateError.message || "Unknown error"}`,
                                    variant: "destructive",
                                  });
                                  // revert local state
                                  setSelectedZoneTarget(null);
                                  return;
                                }

                                setMastery(newMastery);

                                // Notify everyone in arena
                                try {
                                  const { data: posRows, error: posErr } = await supabase
                                    .from("player_positions")
                                    .select("user_id");
                                  if (posErr) {
                                    console.error("Failed to fetch arena participants for notifications:", posErr);
                                  }
                                  const uniqueUserIds = Array.from(
                                    new Set((posRows || []).map((p: any) => p.user_id).filter(Boolean))
                                  );
                                  if (uniqueUserIds.length > 0 && currentProfile?.username) {
                                    const message = `${currentProfile.username} is now targeting ${zoneNameFromImage}`;
                                    const rows = uniqueUserIds.map((id) => ({
                                      user_id: id,
                                      message,
                                      type: "zone_target",
                                    }));
                                    await supabase.from("notifications").insert(rows);
                                  }
                                } catch (err) {
                                  console.error("Failed to broadcast zone target notification:", err);
                                }

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
                           {playersInZone.map((player) => {
                            // Check if player is K.O. or in K.O.Lockout
                            const playerStatusList = player.user_id === userId 
                              ? playerStatuses 
                              : (playerStatusesMap[player.user_id] || []);
                            const isKO = playerStatusList.some(
                              s => (s.status === "K.O" || s.status === "K.O.Lockout") && 
                                   s.expires_at && new Date(s.expires_at) > new Date()
                            );
                            
                            return (
                            <div key={player.user_id} className="relative">
                              <Avatar 
                                className={`w-10 h-10 border-2 cursor-pointer hover:border-primary transition-colors ${
                                      currentTarget === player.user_id ? 'border-destructive ring-2 ring-destructive' : 'border-border'
                                } ${isKO ? 'opacity-50' : ''}`}
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
                                    {/* K.O. Image Overlay */}
                                    {isKO && (
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <img 
                                          src={koImage} 
                                          alt="K.O." 
                                          className="w-10 h-10 rounded-full object-cover"
                                        />
                                      </div>
                                    )}
                                    {currentTarget === player.user_id && !isKO && (
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
                                          <span>{(player.profiles as any).current_hp ?? (player.profiles as any).max_hp ?? 100}/{(player.profiles as any).max_hp ?? 100}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium">ATK:</span>
                                          <span>{(player.profiles as any).current_atk ?? 20}/{(player.profiles as any).max_atk ?? 20}</span>
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
                                      
                                      {/* Active Statuses (visible in popup) */}
                                      {(() => {
                                        const statusesSource =
                                          player.user_id === userId
                                            ? playerStatuses
                                            : (playerStatusesMap[player.user_id] || []);

                                        const activeStatuses = (statusesSource || []).filter(
                                          (s) => s?.expires_at && !timerSystem.isCooldownExpired(s.expires_at)
                                        );

                                        return (
                                          <div className="pt-4 border-t">
                                            <p className="text-xs font-semibold text-muted-foreground mb-2">Active Statuses:</p>
                                            {activeStatuses.length === 0 ? (
                                              <p className="text-xs text-muted-foreground">None</p>
                                            ) : (
                                              <div className="flex flex-wrap gap-1">
                                                {activeStatuses.map((status) => {
                                                  const remaining = timerSystem.getRemainingCooldown(status.expires_at);
                                                  const timeLabel = remaining > 0 ? timerSystem.formatTime(remaining) : "0s";
                                                  return (
                                                    <Badge key={status.id} variant="secondary" className="text-xs">
                                                      {status.status}
                                                      <span className="ml-1 opacity-70">({timeLabel})</span>
                                                    </Badge>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })()}
                                      
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
                                                const { data: observeStatus, error: observeError } = await supabase
                                                  .from("observe_status")
                                                  .select("expires_at")
                                                  .eq("user_id", userId)
                                                  .gt("expires_at", new Date().toISOString())
                                                  .maybeSingle();
                                                
                                                // If observe status exists and hasn't expired, allow targeting
                                                const isObserving = observeStatus && observeStatus.expires_at && new Date(observeStatus.expires_at) > new Date();
                                                
                                                if (player.zone_id !== currentZone && !isObserving) {
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
                                            disabled={mastery < 3 || statusSystem.statusBlocksTeleport(playerStatuses.map(s => s.status))}
                                            onClick={async () => {
                                              // Check Chaos-affected and other teleport-blocking statuses
                                              if (statusSystem.statusBlocksTeleport(playerStatuses.map(s => s.status))) {
                                                toast({
                                                  title: "Cannot Teleport",
                                                  description: "You cannot teleport with your current status effect.",
                                                  variant: "destructive",
                                                });
                                                return;
                                              }
                                              if (mastery < 3) {
                                                toast({
                                                  title: "Insufficient Mastery",
                                                  description: "Teleport costs 3 Mastery",
                                                  variant: "destructive",
                                                });
                                                return;
                                              }
                                              
                                              // Teleport to target's zone (no cooldown, just change zone directly)
                                              // Validate zone exists
                                              const zoneExists = zones.find((z) => z.id === player.zone_id);
                                              if (!zoneExists) {
                                                toast({
                                                  title: "Error",
                                                  description: "Invalid zone. Please refresh the page.",
                                                  variant: "destructive",
                                                });
                                                return;
                                              }

                                              // Change zone - update first, insert if no record exists
                                              const { data: updateData, error: updateError } = await supabase
                                                .from("player_positions")
                                                .update({
                                                  zone_id: player.zone_id,
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
                                                    zone_id: player.zone_id,
                                                    last_moved_at: new Date().toISOString(),
                                                  });

                                                if (insertError) {
                                                  console.error("Zone change insert error:", insertError);
                                                  // If insert fails with conflict, try update one more time (race condition)
                                                  if (insertError.code === "23505" || insertError.message?.includes("duplicate") || insertError.message?.includes("409")) {
                                                    const { error: retryError } = await supabase
                                                      .from("player_positions")
                                                      .update({
                                                        zone_id: player.zone_id,
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

                                              // Zone change successful - now deduct Mastery
                                              const newMastery = mastery - 3;
                                              
                                              // Update mastery in database first
                                              const { error: masteryError } = await supabase
                                                .from("profiles")
                                                .update({ mastery: newMastery })
                                                .eq("id", userId);
                                              
                                              if (masteryError) {
                                                console.error("Failed to deduct Mastery:", masteryError);
                                                toast({
                                                  title: "Warning",
                                                  description: "Zone changed but failed to deduct Mastery. Please contact support.",
                                                  variant: "destructive",
                                                });
                                                // Don't return - zone change already succeeded, just log the error
                                              } else {
                                                // Only update local state if database update succeeded
                                                setMastery(newMastery);
                                              }

                                              setCurrentZone(player.zone_id);
                                              
                                              // Refresh player positions to update UI
                                              await fetchPlayerPositions();
                                              
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
                                          variant="outline"
                                          className="w-full mt-2"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleResetPlayerStats(
                                              player.user_id,
                                              player.profiles.username,
                                              (player.profiles as any).level
                                            );
                                            setShowPlayerPopup(null);
                                          }}
                                        >
                                          Reset stats
                                        </Button>
                                      )}
                                  </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          );
                          })}
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
                </div>
                
                {/* Exit Arena Button */}
                {hasJoined && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleExitArena}
                    className="text-sm"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Exit
                  </Button>
                )}
                
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
                {battleFeed.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No actions yet</p>
                ) : (
                  battleFeed.map((post) => {
                    const postProfiles = post.profiles || { username: "Unknown", profile_picture_url: "" };
                    // Extract target_user_id from description if needed
                    const extractedTargetId = post.target_user_id || extractTargetUserIdFromDescription(post.description);
                    const showTargetForPost = post.action_type === "attack" || post.action_type === "technique";
                    return (
                    <Card key={post.id} className="bg-card/50">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10 border-2 border-border">
                            <AvatarImage
                              src={resolveProfileImage(postProfiles.profile_picture_url)}
                              alt={postProfiles.username}
                            />
                            <AvatarFallback>
                              {postProfiles.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm">{postProfiles.username}</p>
                              {showTargetForPost && post.target_profile && (
                                <>
                                  <span className="text-xs text-muted-foreground">→</span>
                                  <Avatar className="w-6 h-6 border border-border">
                                    <AvatarImage
                                      src={resolveProfileImage(post.target_profile.profile_picture_url)}
                                      alt={post.target_profile.username}
                                    />
                                    <AvatarFallback className="text-xs">
                                      {post.target_profile.username.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <p className="font-semibold text-sm">{post.target_profile.username}</p>
                                </>
                              )}
                              {showTargetForPost && !post.target_profile && extractedTargetId && (() => {
                                // Try to get target from playerPositions as fallback
                                const targetPlayer = playerPositions.find(p => p.user_id === extractedTargetId);
                                if (targetPlayer && targetPlayer.profiles) {
                                  return (
                                    <>
                                      <span className="text-xs text-muted-foreground">→</span>
                                      <Avatar className="w-6 h-6 border border-border">
                                        <AvatarImage
                                          src={resolveProfileImage(targetPlayer.profiles.profile_picture_url)}
                                          alt={targetPlayer.profiles.username}
                                        />
                                        <AvatarFallback className="text-xs">
                                          {targetPlayer.profiles.username.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <p className="font-semibold text-sm">{targetPlayer.profiles.username}</p>
                                    </>
                                  );
                                }
                                // If we have a target_user_id but no profile yet, show "Target" instead of zone name
                                // The useEffect will fetch the profile and update it
                                return (
                                  <>
                                    <span className="text-xs text-muted-foreground">→</span>
                                    <p className="font-semibold text-sm text-muted-foreground">Target</p>
                                  </>
                                );
                              })()}
                              {post.action_type === "attack" && !post.target_profile && !extractedTargetId && post.zone_id && (
                                <>
                                  <span className="text-xs text-muted-foreground">→</span>
                                  <p className="font-semibold text-sm text-muted-foreground">
                                    {(() => {
                                      const zoneIndex = zones.findIndex(z => z.id === post.zone_id);
                                      if (zoneIndex !== -1) {
                                        return ZONE_IMAGE_NAMES[zoneIndex % ZONE_IMAGE_NAMES.length];
                                      }
                                      return "Zone";
                                    })()}
                                  </p>
                                </>
                              )}
                              {post.technique_name && (
                                <Badge variant="outline" className="text-xs">
                                  {post.technique_name}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {new Date(post.created_at).toLocaleString()}
                              </span>
                            </div>
                            <div className="text-sm text-foreground">
                              {(() => {
                                // Clean description - remove [target:xxx] marker for display
                                let description = post.description || "";
                                description = description.replace(/\[target:[^\]]+\]/g, '').trim();
                                
                                const lines = description.split('\n').filter(line => line.trim() !== '');
                                const isExpanded = expandedPosts.has(post.id);
                                const shouldTruncate = lines.length > 4;
                                const displayLines = shouldTruncate && !isExpanded ? lines.slice(0, 4) : lines;

                                return (
                                  <>
                                    {/* Technique extras: show technique image + description in the post */}
                                    {post.action_type === "technique" && (post.technique_image_url || post.technique_description) && (
                                      <div className="mb-2">
                                        {post.technique_image_url && (
                                          <div className="my-2">
                                            <img
                                              src={post.technique_image_url}
                                              alt={post.technique_name || "Technique"}
                                              className="w-[90px] h-[90px] object-cover rounded border-2 border-primary"
                                            />
                                          </div>
                                        )}
                                        {post.technique_description && (
                                          <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                            {post.technique_description}
                                          </p>
                                        )}
                                      </div>
                                    )}
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
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Use Technique Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Use Technique</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
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
                  {selectedTechnique && (() => {
                    const technique = userTechniques.find((t: any) => t.id === selectedTechnique);
                    if (!technique) return null;
                    
                    // Use full technique data if available, but merge with technique to preserve all data
                    // IMPORTANT: Preserve tags from both sources - tags might be in either location
                    const fullTech = fullTechniqueData[selectedTechnique];
                    
                    // Use cached tags to prevent disappearing - they're calculated in useMemo above
                    const tags = cachedTags;
                    
                    // Determine tags from both sources before merging (for preserving in merged object)
                    // IMPORTANT: Prioritize technique tags to prevent them from being overwritten
                    const tagsFromFullTechRaw = fullTech?.tags || fullTech?.type_info || null;
                    const tagsFromTechniqueRaw = technique?.tags || technique?.type_info || null;
                    // Always prefer technique tags first to ensure they persist
                    const preservedTags = tagsFromTechniqueRaw || tagsFromFullTechRaw;
                    
                    // Merge: technique first (base), then fullTech (overwrites), but preserve tags explicitly
                    const tech = fullTech 
                      ? { ...technique, ...fullTech, tags: preservedTags }
                      : technique;
                    const isOnCooldown = techniqueCooldowns[selectedTechnique] && !timerSystem.isCooldownExpired(techniqueCooldowns[selectedTechnique]);
                    const canUse = !isOnCooldown && 
                                  (tech.energy_cost || 0) <= (energy || 0) &&
                                  (!tech.no_use_m || mastery >= tech.no_use_m) &&
                                  (!tech.no_use_e || energy >= tech.no_use_e) &&
                                  (!tags.includes("Combo") || mastery >= 1.5);
                    
                    return (
                      <div className="mt-4 rounded-md border border-border bg-muted/40 p-3 text-sm text-foreground space-y-2">
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
                          {tech.self_damage > 0 && (
                            <p className="text-destructive"><span className="font-semibold">Self Damage:</span> {tech.self_damage}</p>
                          )}
                          {tech.energy_taken > 0 && (
                            <p><span className="font-semibold">Energy Taken:</span> -{tech.energy_taken}</p>
                          )}
                          {tech.no_use_m && (
                            <p className={mastery < tech.no_use_m ? "text-destructive" : ""}>
                              <span className="font-semibold">Requires M:</span> {tech.no_use_m}
                            </p>
                          )}
                          {tech.no_use_e && (
                            <p className={energy < tech.no_use_e ? "text-destructive" : ""}>
                              <span className="font-semibold">Requires Energy:</span> {tech.no_use_e}
                            </p>
                          )}
                          {tech.opponent_status && (
                            <p><span className="font-semibold">Applies Status:</span> {tech.opponent_status}</p>
                          )}
                          {tech.self_status && (
                            <p><span className="font-semibold">Self Status:</span> {tech.self_status}</p>
                          )}
                          {tech.specific_status_hit && (
                            <p className="text-destructive">
                              <span className="font-semibold">Specific Status Hit:</span> {tech.specific_status_hit}
                            </p>
                          )}
                        </div>
                        
                        {/* Tags - Always show if tags exist, using persistent calculation */}
                        {tags.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-semibold mb-1">Tags:</p>
                            <div className="flex flex-wrap gap-1">
                              {tags.map((tag: string, index: number) => (
                                <Badge key={`${selectedTechnique}-${tag}-${index}`} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
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
                              {tech.no_use_e && energy < tech.no_use_e && (
                                <li>Insufficient Energy (need {tech.no_use_e}, have {energy || 0})</li>
                              )}
                              {tags.includes("Combo") && mastery < 1.5 && (
                                <li>Combo requires 1.5+ Mastery</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              onClick={handleUseTechnique} 
              className="w-full"
              disabled={
                !selectedTechnique ||
                (techniqueCooldowns[selectedTechnique || ""] && !timerSystem.isCooldownExpired(techniqueCooldowns[selectedTechnique || ""])) ||
                (lastTechniqueTime && new Date().getTime() - lastTechniqueTime.getTime() < 60000) ||
                // Allow techniques when K.O. (Revival check happens in handler), block on K.O.Lockout
                playerStatuses.some(s => s.status === "K.O.Lockout") ||
                (statusSystem.statusBlocksTechniques(playerStatuses.map(s => s.status)) && !playerStatuses.some(s => s.status === "K.O"))
              }
            >
              Use Technique
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Zone Select Dialog for Change Zone Action */}
      <Dialog
        open={showZoneSelectDialog}
        onOpenChange={(open) => {
          setShowZoneSelectDialog(open);
          if (!open) {
            setIsJoinZoneSelection(false);
            setPendingJoinSessionId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isJoinZoneSelection ? "Choose Starting Zone" : "Select Zone"}</DialogTitle>
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
                    if (isJoinZoneSelection) {
                      finalizeJoinArena(zone.id);
                      return;
                    }
                    handleChangeZoneNew(zone.id);
                    setShowZoneSelectDialog(false);
                  }}
                  disabled={!isJoinZoneSelection && isCurrentZone}
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
