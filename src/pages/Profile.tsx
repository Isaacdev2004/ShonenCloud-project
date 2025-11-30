import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import homeButton from "@/assets/buttons/home-button.png";
import messageButton from "@/assets/buttons/message-button.png";
import { PROFILE_PICTURES, MENTOR_IMAGES } from "@/constants/images";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import { resolveProfileImage, mapMentorToProfileId, getProfilePictureForMentor, getProfileIdFromUrl } from "@/lib/profileImageResolver";
import { DisciplineInfo } from "@/components/DisciplineInfo";

const DISCIPLINES = [
  { value: "Shadow", color: "#432A76" },
  { value: "All-Seeing", color: "#808080" },
  { value: "Titan", color: "#00FF00" },
  { value: "Emperor", color: "#0000FF" },
  { value: "Finisher", color: "#FF0000" },
  { value: "Lightbringer", color: "#FFA500" },
];

const Profile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewingUserId = searchParams.get("user");
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userMentors, setUserMentors] = useState<any[]>([]);
  const [activeTitle, setActiveTitle] = useState<any>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    discipline: "",
    profilePicture: "",
  });
  const [selectedMentorSlot, setSelectedMentorSlot] = useState<number | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/login");
      return;
    }

    setUser(session.user);
    
    const profileId = viewingUserId || session.user.id;
    setIsOwnProfile(profileId === session.user.id);
    
    await fetchProfile(profileId);
    await fetchActiveTitle(profileId);
    setLoading(false);
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
.maybeSingle();

    if (error) {
      toast.error("Failed to load profile");
    } else {
      setProfile(data);
      // Ensure profile picture URL has proper format
      let profilePictureValue = data.profile_picture_url || "";
      // If it's just an ID without prefix, add the profile: prefix
      if (profilePictureValue && !profilePictureValue.startsWith('profile:') && !profilePictureValue.startsWith('http') && !profilePictureValue.startsWith('/')) {
        profilePictureValue = `profile:${profilePictureValue}`;
      }
      setFormData({
        username: data.username,
        email: data.email,
        discipline: data.discipline,
        profilePicture: profilePictureValue,
      });
    }

    // Fetch user mentors with mentor details
    const { data: mentorData, error: mentorError } = await supabase
      .from("user_mentors")
      .select(`
        slot,
        mentor_id,
        mentors (
          id,
          name,
          image_url
        )
      `)
      .eq("user_id", userId)
      .order("slot");

    if (!mentorError && mentorData) {
      // Use image_url directly from database
      setUserMentors(mentorData);
      if (selectedMentorSlot === null && mentorData.length > 0) {
        setSelectedMentorSlot(mentorData[0].slot);
      }
    }
  };

  const fetchActiveTitle = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_titles")
      .select("*")
      .eq("user_id", userId)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setActiveTitle(data);
    }
  };


  const getAvailableProfilePictures = async () => {
    if (!user) return [];
    
    const availablePics: typeof PROFILE_PICTURES = [];
    
    // Get current mentor IDs for filtering purchased pictures
    const currentMentorIds = userMentors.map(um => um.mentor_id);
    
    // Add profile pictures from current mentors
    userMentors.forEach((um) => {
      const mentor = (um.mentors as any) as { name?: string; image_url?: string };
      const pic = getProfilePictureForMentor(mentor);
      if (pic && !availablePics.find(p => p.id === pic.id)) {
        availablePics.push(pic);
      }
    });

    // Add purchased profile pictures from store (only if they still have that mentor)
    const { data: purchases } = await supabase
      .from("user_purchases")
      .select(`
        store_items (
          id,
          name,
          type,
          image_url,
          mentor_id
        )
      `)
      .eq("user_id", user.id);

    if (purchases) {
      purchases.forEach((purchase: any) => {
        const item = purchase.store_items;
        if (item?.type === 'profile_picture' && item.image_url) {
          // Only add if the user still has this mentor
          if (item.mentor_id && currentMentorIds.includes(item.mentor_id)) {
            const purchasedPic = {
              id: `store-${item.id}`,
              name: item.name,
              url: item.image_url
            };
            if (!availablePics.find(p => p.id === purchasedPic.id)) {
              availablePics.push(purchasedPic);
            }
          }
        }
      });
    }

    return availablePics.length > 0 ? availablePics : [];
  };
  // Auto-load available profile pictures without overriding the saved one
  const [availablePics, setAvailablePics] = useState<typeof PROFILE_PICTURES>([]);
  
  useEffect(() => {
    if (!isOwnProfile) return;
    getAvailableProfilePictures().then((pics) => {
      setAvailablePics(pics);

      // If the user has no mentor-based profile pictures available, don't override
      // whatever is already saved in their profile. This avoids forcing Yuji
      // (the default avatar) on the owner while others see the correct picture.
      if (!pics || pics.length === 0) {
        return;
      }

      const allowedValues = new Set(
        pics.map((pic) => (pic.id.startsWith("store-") ? pic.url : `profile:${pic.id}`))
      );

      // Only auto-switch if there ARE allowed pics and the current value
      // is no longer one of them (e.g. user lost a mentor-tied avatar).
      if (formData.profilePicture && !allowedValues.has(formData.profilePicture)) {
        const firstAllowed = allowedValues.values().next().value as string | undefined;
        if (firstAllowed) {
          setFormData((prev) => ({
            ...prev,
            profilePicture: firstAllowed,
          }));
          toast.info(
            "You lost access to your previous profile picture because you no longer have that mentor."
          );
        }
      }
    });
  }, [selectedMentorSlot, userMentors, user, isOwnProfile, formData.profilePicture]);
  const handleSave = async () => {
    if (!formData.username.match(/^[a-zA-Z]+$/)) {
      toast.error("Username can only contain letters");
      return;
    }

    setSaving(true);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        username: formData.username,
        email: formData.email,
        discipline: formData.discipline as any,
        profile_picture_url: getProfileIdFromUrl(formData.profilePicture) || formData.profilePicture,
      })
      .eq("id", user.id);

    if (profileError) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated successfully!");
      fetchProfile(user.id);
    }

    setSaving(false);
  };

  const handleChangeDiscipline = async (newDiscipline: string) => {
    if (profile.discipline === newDiscipline) return;

    if (profile.tokens < 25) {
      toast.error("You don't have enough tokens");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        discipline: newDiscipline as any,
        tokens: profile.tokens - 25,
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to change discipline");
    } else {
      toast.success("Discipline changed! -25 tokens");
      setFormData({ ...formData, discipline: newDiscipline });
      fetchProfile(user.id);
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

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img src={logo} alt="ShonenCloud" className="h-12 cursor-pointer" onClick={() => navigate("/dashboard")} />
          <div className="flex gap-2">
            {!isOwnProfile && (
              <button 
                onClick={() => navigate(`/inbox?recipient=${profile?.id}`)}
                className="transition-transform hover:scale-105 cursor-pointer"
              >
                <img src={messageButton} alt="Send Message" className="h-12" />
              </button>
            )}
            <button onClick={() => navigate("/dashboard")} className="transition-transform hover:scale-105 cursor-pointer">
              <img src={homeButton} alt="Home" className="h-12" />
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex gap-6">
          <Card className="flex-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{isOwnProfile ? "Edit Profile" : `${profile?.username}'s Profile`}</CardTitle>
                {activeTitle && (
                  <Badge variant="default" className="text-lg px-4 py-2">
                    {activeTitle.title}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {userMentors.length > 0 && (
              <div>
                <Label>{isOwnProfile ? "Your Mentors" : "Mentors"}</Label>
                <div className="flex gap-4 mt-2">
                  {userMentors.map((um) => (
                    <div key={um.slot} className="flex flex-col items-center">
                      <div className="w-32 aspect-[3/4]">
                        <img 
                          src={(um.mentors as any)?.image_url} 
                          alt={(um.mentors as any)?.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <p className="text-sm font-medium mt-2">{(um.mentors as any)?.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isOwnProfile && (
              <div>
                <Label>Profile Picture</Label>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={resolveProfileImage(formData.profilePicture)} alt="Current Profile" />
                    <AvatarFallback>{formData.username[0]}</AvatarFallback>
                  </Avatar>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Choose from available profile pictures:</p>
                <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                  {availablePics.map((pic) => {
                    // For purchased items (store-*), use the URL directly; for defaults use profile:id
                    const pictureValue = pic.id.startsWith('store-') ? pic.url : `profile:${pic.id}`;
                    const isSelected = pic.id.startsWith('store-') 
                      ? formData.profilePicture === pic.url
                      : formData.profilePicture === `profile:${pic.id}`;
                    
                    return (
                      <button
                        key={pic.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, profilePicture: pictureValue });
                        }}
                        className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                          isSelected
                            ? "border-primary shadow-lg scale-105"
                            : "border-transparent hover:border-primary/50"
                        }`}
                      >
                        <Avatar className="w-full h-full">
                          <AvatarImage src={resolveProfileImage(pictureValue)} alt={pic.name} className="object-cover" />
                          <AvatarFallback>{pic.name[0]}</AvatarFallback>
                        </Avatar>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {!isOwnProfile && (
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={resolveProfileImage(profile?.profile_picture_url)} alt={profile?.username} />
                  <AvatarFallback>{profile?.username?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{profile?.username}</h3>
                  <p className="text-muted-foreground">{profile?.email}</p>
                </div>
              </div>
            )}

            <DisciplineInfo discipline={profile?.discipline} />

            <div>
              <Label>Missions Executed</Label>
              <p className="text-2xl font-bold mt-2">{profile?.missions_executed || 0}</p>
            </div>

            {isOwnProfile && (
              <>
                <div>
                  <Label htmlFor="username">Username (letters only)</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="YourName"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Current Discipline: {profile?.discipline}</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Change discipline for 25 tokens
                  </p>
                  <Select value={formData.discipline} onValueChange={handleChangeDiscipline}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DISCIPLINES.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="pt-4">
              <h3 className="font-bold mb-2">{isOwnProfile ? 'Your' : 'User'} Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Level:</span>
                  <span className="font-bold">{profile?.level}</span>
                </div>
                <div className="flex justify-between">
                  <span>XP Points:</span>
                  <span className="font-bold">{profile?.xp_points}</span>
                </div>
                {isOwnProfile && (
                  <>
                    <div className="flex justify-between">
                      <span>Tokens:</span>
                      <span className="font-bold text-primary">{profile?.tokens}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Missions Executed:</span>
                      <span className="font-bold">{profile?.missions_executed}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {isOwnProfile && (
              <>
                <Button 
                  onClick={() => navigate("/mentor-change")} 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Change Mentor
                </Button>
                <Button onClick={handleSave} className="w-full" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            )}
            </CardContent>
          </Card>

          {profile?.admin_note && (
            <Card className="w-80 h-fit sticky top-4">
              <CardHeader>
                <CardTitle className="text-destructive">Admin Note</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{profile.admin_note}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
