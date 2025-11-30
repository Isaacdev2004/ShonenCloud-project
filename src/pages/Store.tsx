import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Coins } from "lucide-react";

interface StoreItem {
  id: string;
  name: string;
  description: string;
  type: 'title' | 'profile_picture' | 'technique';
  price: number;
  image_url: string | null;
  technique_id: string | null;
  is_available: boolean;
  level_requirement: number;
  mentor_id: string | null;
  mentors?: {
    name: string;
  } | null;
}

interface UserProfile {
  tokens: number;
  level: number;
}

interface UserMentor {
  mentor_id: string;
}

export default function Store() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userMentors, setUserMentors] = useState<UserMentor[]>([]);

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
    fetchProfile(user.id);
    fetchUserMentors(user.id);
    fetchStoreItems();
  };

  const fetchUserMentors = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_mentors")
      .select("mentor_id")
      .eq("user_id", userId);

    if (!error && data) {
      setUserMentors(data);
    }
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("tokens, level")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
    } else {
      setProfile(data);
    }
  };

  const fetchStoreItems = async () => {
    const { data, error } = await supabase
      .from("store_items")
      .select(`
        *,
        mentors (
          name
        )
      `)
      .eq("is_available", true)
      .order("price", { ascending: true });

    if (error) {
      console.error("Error fetching store items:", error);
      toast.error("Failed to load store items");
    } else {
      setItems(data as StoreItem[] || []);
    }
    setLoading(false);
  };

  const handlePurchase = async (item: StoreItem) => {
    if (!profile) return;
    
    if (profile.level < item.level_requirement) {
      toast.error(`Level ${item.level_requirement} required!`);
      return;
    }

    // Check if user has the required mentor (only if mentor_id is not null)
    if (item.mentor_id) {
      const hasMentor = userMentors.some(um => um.mentor_id === item.mentor_id);
      if (!hasMentor) {
        const { data: mentorData } = await supabase
          .from("mentors")
          .select("name")
          .eq("id", item.mentor_id)
          .single();
        toast.error(`You need ${mentorData?.name || 'this mentor'} to purchase this item!`);
        return;
      }
    }

    // Check for active title if buying a title (48-hour cooldown)
    if (item.type === 'title') {
      const { data: activeTitle } = await supabase
        .from("user_titles")
        .select("expires_at")
        .eq("user_id", user.id)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (activeTitle) {
        const expiresAt = new Date(activeTitle.expires_at);
        const hoursLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60));
        toast.error(`You already have an active title! Wait ${hoursLeft} more hours.`);
        return;
      }
    }
    
    if (profile.tokens < item.price) {
      toast.error("Insufficient tokens!");
      return;
    }

    // Start transaction
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({ tokens: profile.tokens - item.price })
      .eq("id", user.id)
      .select("tokens, level")
      .single();

    if (updateError) {
      console.error("Error updating tokens:", updateError);
      toast.error("Purchase failed");
      return;
    }

    // Record purchase
    const { error: purchaseError } = await supabase
      .from("user_purchases")
      .insert({
        user_id: user.id,
        store_item_id: item.id
      });

    if (purchaseError) {
      console.error("Error recording purchase:", purchaseError);
      // Rollback token deduction
      await supabase
        .from("profiles")
        .update({ tokens: profile.tokens })
        .eq("id", user.id);
      toast.error("Purchase failed");
      return;
    }

    // Handle title activation
    if (item.type === 'title') {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);

      await supabase
        .from("user_titles")
        .upsert({
          user_id: user.id,
          title: item.name,
          expires_at: expiresAt.toISOString()
        });
    }

    // Handle profile picture - normalize to profile:id format
    if (item.type === 'profile_picture' && item.mentor_id) {
      // Fetch mentor details to get proper profile picture mapping
      const { data: mentorData } = await supabase
        .from("mentors")
        .select("name, image_url")
        .eq("id", item.mentor_id)
        .single();
      
      if (mentorData) {
        // Use the same mapping logic as in profile
        const normalize = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const nameToProfileId: Record<string, string> = {
          nobarakugisaki: "nobara",
          katsukibakugo: "bakugo",
          izukumidoriya: "izuku",
          yujiitadori: "yuji",
          sasukeuchiha: "sasuke",
          sakuraharuno: "sakura",
          rukiakuchiki: "rukia",
          roymustang: "roy",
          narutouzumaki: "naruto",
          monkeydluffy: "luffy",
          krillin: "krillin",
          kakashihatake: "kakashi",
          ichigokurosaki: "ichigo",
          gonfreecss: "gon",
          hisokamorow: "hisoka",
          goku: "goku",
          songoku: "goku",
          edwardelric: "edward",
          cell: "cell",
          android18: "c18",
          c18: "c18",
          portgasdace: "ace",
          ace: "ace",
        };
        
        let profileId = nameToProfileId[normalize(mentorData.name || "")];
        
        // Check if image_url has mentor: prefix
        if (mentorData.image_url?.startsWith('mentor:')) {
          const key = mentorData.image_url.replace('mentor:', '');
          const aliasMap: Record<string, string> = { deku: "izuku" };
          profileId = aliasMap[normalize(key)] || normalize(key);
        }
        
        if (profileId) {
          await supabase
            .from("profiles")
            .update({ profile_picture_url: `profile:${profileId}` })
            .eq("id", user.id);
        }
      }
    }

    // Handle technique
    if (item.type === 'technique' && item.technique_id) {
      await supabase
        .from("user_techniques")
        .insert({
          user_id: user.id,
          technique_id: item.technique_id
        });
    }

    setProfile(updatedProfile);
    toast.success(`Purchased ${item.name}!`);
  };

  const filterItemsByType = (type: string) => {
    return items.filter(item => item.type === type);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading store...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">The Yards</h1>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg">
            <Coins className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg">{profile?.tokens || 0}</span>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="all">All Items</TabsTrigger>
            <TabsTrigger value="title">Codex</TabsTrigger>
            <TabsTrigger value="profile_picture">Profile Pictures</TabsTrigger>
            <TabsTrigger value="technique">Techniques</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {items.map((item) => (
                <Card key={item.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base line-clamp-1">{item.name}</CardTitle>
                      <Badge variant="secondary" className="text-xs shrink-0">{item.type.replace('_', ' ')}</Badge>
                    </div>
                    <CardDescription className="text-sm line-clamp-2">
                      {item.description}
                    </CardDescription>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.level_requirement > 1 && (
                        <Badge variant="outline" className="text-xs">Lvl {item.level_requirement}</Badge>
                      )}
                      {item.mentor_id && item.mentors && (
                        <Badge variant="secondary" className="text-xs line-clamp-1">{item.mentors.name}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  {item.image_url && (
                    <CardContent className="pb-3">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </CardContent>
                  )}
                  <CardFooter className="flex flex-col gap-2 pt-3 mt-auto">
                    <div className="flex items-center gap-2 w-full justify-center">
                      <Coins className="h-4 w-4 text-primary" />
                      <span className="font-bold">{item.price}</span>
                    </div>
                    <Button
                      onClick={() => handlePurchase(item)}
                      disabled={!profile || profile.tokens < item.price || profile.level < item.level_requirement}
                      size="sm"
                      className="w-full"
                    >
                      Purchase
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="title">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filterItemsByType('title').map((item) => (
                <Card key={item.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base line-clamp-1">{item.name}</CardTitle>
                    <CardDescription className="text-sm line-clamp-2">
                      {item.description}
                    </CardDescription>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.level_requirement > 1 && (
                        <Badge variant="outline" className="text-xs">Lvl {item.level_requirement}</Badge>
                      )}
                      {item.mentor_id && item.mentors && (
                        <Badge variant="secondary" className="text-xs line-clamp-1">{item.mentors.name}</Badge>
                      )}
                      <Badge variant="outline" className="text-xs w-fit">48h</Badge>
                    </div>
                  </CardHeader>
                  <CardFooter className="flex flex-col gap-2 pt-3 mt-auto">
                    <div className="flex items-center gap-2 w-full justify-center">
                      <Coins className="h-4 w-4 text-primary" />
                      <span className="font-bold">{item.price}</span>
                    </div>
                    <Button
                      onClick={() => handlePurchase(item)}
                      disabled={!profile || profile.tokens < item.price || profile.level < item.level_requirement}
                      size="sm"
                      className="w-full"
                    >
                      Purchase
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="profile_picture">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filterItemsByType('profile_picture').map((item) => (
                <Card key={item.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base line-clamp-1">{item.name}</CardTitle>
                    <CardDescription className="text-sm line-clamp-2">
                      {item.description}
                    </CardDescription>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.level_requirement > 1 && (
                        <Badge variant="outline" className="text-xs">Lvl {item.level_requirement}</Badge>
                      )}
                      {item.mentor_id && item.mentors && (
                        <Badge variant="secondary" className="text-xs line-clamp-1">{item.mentors.name}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  {item.image_url && (
                    <CardContent className="pb-3">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </CardContent>
                  )}
                  <CardFooter className="flex flex-col gap-2 pt-3 mt-auto">
                    <div className="flex items-center gap-2 w-full justify-center">
                      <Coins className="h-4 w-4 text-primary" />
                      <span className="font-bold">{item.price}</span>
                    </div>
                    <Button
                      onClick={() => handlePurchase(item)}
                      disabled={!profile || profile.tokens < item.price || profile.level < item.level_requirement}
                      size="sm"
                      className="w-full"
                    >
                      Purchase
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="technique">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filterItemsByType('technique').map((item) => (
                <Card key={item.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base line-clamp-1">{item.name}</CardTitle>
                    <CardDescription className="text-sm line-clamp-2">
                      {item.description}
                    </CardDescription>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.level_requirement > 1 && (
                        <Badge variant="outline" className="text-xs">Lvl {item.level_requirement}</Badge>
                      )}
                      {item.mentor_id && item.mentors && (
                        <Badge variant="secondary" className="text-xs line-clamp-1">{item.mentors.name}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  {item.image_url && (
                    <CardContent className="pb-3">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </CardContent>
                  )}
                  <CardFooter className="flex flex-col gap-2 pt-3 mt-auto">
                    <div className="flex items-center gap-2 w-full justify-center">
                      <Coins className="h-4 w-4 text-primary" />
                      <span className="font-bold">{item.price}</span>
                    </div>
                    <Button
                      onClick={() => handlePurchase(item)}
                      disabled={!profile || profile.tokens < item.price || profile.level < item.level_requirement}
                      size="sm"
                      className="w-full"
                    >
                      Purchase
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
