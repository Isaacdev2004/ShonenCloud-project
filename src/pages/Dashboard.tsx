import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import BlogPost from "@/components/BlogPost";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { resolveProfileImage } from "@/lib/profileImageResolver";
import storeButton from "@/assets/buttons/store-button.png";
import profileButton from "@/assets/buttons/profile-button.png";
import logoutButton from "@/assets/buttons/logout-button.png";
import learnButton from "@/assets/buttons/learn-button.png";
import chatButton from "@/assets/buttons/chat-button.png";
import arenaButton from "@/assets/buttons/arena-button.png";
import uploadsButton from "@/assets/buttons/uploads-button.png";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkInAvailable, setCheckInAvailable] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    checkAuth();
    fetchPosts();
    fetchOnlineCount();

    // Real-time subscription for blog posts
    const postsChannel = supabase
      .channel('blog_posts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blog_posts'
        },
        () => fetchPosts()
      )
      .subscribe();

    // Real-time subscription for likes
    const likesChannel = supabase
      .channel('post_likes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_likes'
        },
        () => fetchPosts()
      )
      .subscribe();

    // Real-time subscription for comments
    const commentsChannel = supabase
      .channel('post_comments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_comments'
        },
        () => fetchPosts()
      )
      .subscribe();

    // Real-time subscription for online count
    const profilesChannel = supabase
      .channel('profiles_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        () => fetchOnlineCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/login");
      return;
    }

    setUser(session.user);
    await fetchProfile(session.user.id);
    await checkAdminStatus(session.user.id);
    await updateLastSignIn(session.user.id);
    setLoading(false);
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      toast.error("Failed to load profile");
    } else {
      setProfile(data);
      checkCheckInStatus(data.last_check_in);
    }
  };

  const checkCheckInStatus = (lastCheckIn: string | null) => {
    if (!lastCheckIn) {
      setCheckInAvailable(true);
      return;
    }

    const lastCheckInTime = new Date(lastCheckIn).getTime();
    const now = new Date().getTime();
    const twelveHours = 12 * 60 * 60 * 1000;

    setCheckInAvailable(now - lastCheckInTime >= twelveHours);
  };

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .single();
    setIsAdmin(!!data);
  };

  const updateLastSignIn = async (userId: string) => {
    await supabase
      .from("profiles")
      .update({ last_sign_in: new Date().toISOString() })
      .eq("id", userId);
  };

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });
    setPosts(data || []);
  };

  const fetchOnlineCount = async () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .gte("last_sign_in", fiveMinutesAgo);
    setOnlineCount(data?.length || 0);
  };

  const handleCheckIn = async () => {
    if (!checkInAvailable) {
      toast.error("You can only collect this every 12 hours, come back in a few!");
      return;
    }

    const newXp = (profile?.xp_points || 0) + 5;
    const newLevel = Math.floor(newXp / 200) + 1;

    const { error } = await supabase
      .from("profiles")
      .update({
        last_check_in: new Date().toISOString(),
        xp_points: newXp,
        level: newLevel,
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to check in");
    } else {
      toast.success("Daily check-in complete! +5 XP");
      fetchProfile(user.id);
      setCheckInAvailable(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
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

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img src={logo} alt="ShonenCloud" className="h-12 cursor-pointer" onClick={() => navigate("/")} />
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
              onClick={handleLogout} 
              className="transition-transform hover:scale-105 cursor-pointer"
            >
              <img src={logoutButton} alt="Logout" className="h-12" />
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">News & Updates</h2>
              <div className="space-y-4">
                {posts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No posts yet. Check back soon!</p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <BlogPost
                      key={post.id}
                      post={post}
                      currentUserId={user?.id}
                      isAdmin={isAdmin}
                      onUpdate={fetchPosts}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-2">Online Members</h3>
                <p className="text-2xl font-bold text-primary">{onlineCount}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={resolveProfileImage(profile?.profile_picture_url)} alt={profile?.username} />
                    <AvatarFallback className="text-2xl">{profile?.username?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-lg">{profile?.username}</h3>
                    <p className="text-sm text-muted-foreground">{profile?.discipline}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span>Level:</span>
                    <span className="font-bold text-lg">{profile?.level}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>XP:</span>
                    <span className="font-bold">{profile?.xp_points}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tokens:</span>
                    <span className="font-bold text-primary">{profile?.tokens}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Missions:</span>
                    <span className="font-bold">{profile?.missions_executed}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Button onClick={handleCheckIn} className="w-full" disabled={!checkInAvailable}>
                  {checkInAvailable ? "Check In (+5 XP)" : "Come back in 12h"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-4">Quick Links</h3>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate("/announcements")}
                  >
                    Announcements
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate("/missions")}
                  >
                    Missions Hub
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.open('/arena', '_blank')}
                  >
                    Arena
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate("/techniques")}
                  >
                    Uploademy
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate("/store")}
                  >
                    The Yards
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
