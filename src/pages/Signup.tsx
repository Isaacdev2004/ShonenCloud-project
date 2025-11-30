import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import cloudO from "@/assets/cloudo.png";
import { PROFILE_PICTURES, MENTOR_IMAGES } from "@/constants/images";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Eye } from "lucide-react";
import { MentorComparisonModal } from "@/components/MentorComparisonModal";
import { resolveProfileImage, mapMentorToProfileId, getProfilePictureForMentor } from "@/lib/profileImageResolver";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const DISCIPLINES = [
  { value: "Shadow", description: "Masters of stealth and hidden techniques", color: "hsl(var(--shadow))" },
  { value: "All-Seeing", description: "Possess incredible perception and foresight", color: "hsl(var(--all-seeing))" },
  { value: "Titan", description: "Unmatched strength and defensive power", color: "hsl(var(--titan))" },
  { value: "Emperor", description: "Strategic minds with commanding presence", color: "hsl(var(--emperor))" },
  { value: "Finisher", description: "Deadly precision and finishing moves", color: "hsl(var(--finisher))" },
  { value: "Lightbringer", description: "Radiant energy and healing abilities", color: "hsl(var(--lightbringer))" },
];

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mentors, setMentors] = useState<any[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [showCloudO, setShowCloudO] = useState(false);
  const [adminMessage, setAdminMessage] = useState<{ title: string; message: string } | null>(null);
  const [isGuest, setIsGuest] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    discipline: "",
    mentor1: "",
    mentor2: "",
    profilePicture: "",
  });

  useEffect(() => {
    checkAuth();
    fetchMentors();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const guestStatus = !user;
    setIsGuest(guestStatus);
    if (guestStatus) {
      fetchAdminMessage();
    }
  };

  const fetchAdminMessage = async () => {
    const { data, error } = await supabase
      .from("admin_announcements")
      .select("*")
      .eq("title", "CloudO Message")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error("Failed to fetch admin message:", error);
    } else if (data) {
      setAdminMessage(data);
    }
  };

  const fetchMentors = async () => {
    const { data, error } = await supabase
      .from("mentors")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(20);
    if (error) {
      toast.error("Failed to load mentors");
    } else {
      // Use image_url directly from database, limited to first 20
      setMentors(data || []);
    }
  };


  const getAvailableProfilePictures = () => {
    if (!formData.mentor1 && !formData.mentor2) return [];

    const selectedMentors = mentors.filter(
      (m) => m.id === formData.mentor1 || m.id === formData.mentor2
    );

    const pics = selectedMentors
      .map((m) => getProfilePictureForMentor(m))
      .filter((p): p is typeof PROFILE_PICTURES[number] => Boolean(p));

    // Ensure unique list of pictures
    const unique = Array.from(new Map(pics.map((p) => [p.id, p])).values());
    return unique;
  };

  // Keep profile picture in sync with selected mentors to avoid stale/incorrect images
  useEffect(() => {
    const available = getAvailableProfilePictures();
    if (
      available.length > 0 &&
      !available.find((p) => `profile:${p.id}` === formData.profilePicture)
    ) {
      setFormData((prev) => ({ ...prev, profilePicture: `profile:${available[0].id}` }));
    }
    if (available.length === 0 && formData.profilePicture) {
      setFormData((prev) => ({ ...prev, profilePicture: "" }));
    }
  }, [formData.mentor1, formData.mentor2, mentors]);
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.match(/^[a-zA-Z]+$/)) {
      toast.error("Username can only contain letters");
      return;
    }

    if (!formData.discipline || !formData.mentor1 || !formData.mentor2) {
      toast.error("Please complete all fields");
      return;
    }

    if (formData.mentor1 === formData.mentor2) {
      toast.error("Please select two different mentors");
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const available = getAvailableProfilePictures();
        const profilePic = formData.profilePicture || `profile:${available[0]?.id}` || `profile:${PROFILE_PICTURES[0].id}`;

        const { error: profileError } = await supabase.from("profiles").upsert({
          id: authData.user.id,
          username: formData.username,
          email: formData.email,
          discipline: formData.discipline as any,
          profile_picture_url: profilePic,
        });

        if (profileError) throw profileError;

        const { error: mentorError } = await supabase.from("user_mentors").insert([
          { user_id: authData.user.id, mentor_id: formData.mentor1, slot: 1 },
          { user_id: authData.user.id, mentor_id: formData.mentor2, slot: 2 },
        ]);

        if (mentorError) throw mentorError;

        toast.success("Account created successfully!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Floating CloudO - Only for guests */}
      {isGuest && (
        <>
          <button
            onClick={() => setShowCloudO(true)}
            className="fixed bottom-8 right-8 z-50 hover:scale-125 transition-all duration-300 animate-float group"
            title="Click me!"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-glow" />
              <img 
                src={cloudO} 
                alt="CloudO" 
                className="w-24 h-24 relative z-10 drop-shadow-2xl animate-pulse-scale group-hover:animate-none" 
              />
            </div>
          </button>

          {/* CloudO Dialog */}
          <Dialog open={showCloudO} onOpenChange={setShowCloudO}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Message from CloudO</DialogTitle>
              </DialogHeader>
              <p className="text-foreground whitespace-pre-wrap mt-4">
                {adminMessage?.message || "No message available."}
              </p>
            </DialogContent>
          </Dialog>
        </>
      )}

      <Card className="w-full max-w-2xl border-primary/20">
        <CardHeader className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <img src={logo} alt="ShonenCloud" className="w-24 h-24 mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold">Join ShonenCloud</CardTitle>
          <CardDescription>How will you shape your clouds?</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Label htmlFor="username">Username (letters only)</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="YourName"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="discipline">Discipline</Label>
              <Select value={formData.discipline} onValueChange={(value) => setFormData({ ...formData, discipline: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your path" />
                </SelectTrigger>
                <SelectContent>
                  {DISCIPLINES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      <div className="flex flex-col">
                        <span className="font-bold">{d.value}</span>
                        <span className="text-xs text-muted-foreground">{d.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* CloudO Image - Centered */}
            {isGuest && (
              <div className="flex justify-center py-4">
                <button
                  type="button"
                  onClick={() => setShowCloudO(true)}
                  className="hover:scale-110 transition-transform duration-300"
                >
                  <img 
                    src={cloudO} 
                    alt="CloudO" 
                    className="w-20 h-20 drop-shadow-lg" 
                  />
                </button>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <Label>Select Your Mentors</Label>
                  <p className="text-xs text-muted-foreground">Choose 2 different mentors</p>
                </div>
                {formData.mentor1 && formData.mentor2 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowComparison(true)}
                    className="gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Compare
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto p-4 border rounded-lg">
                {mentors.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      if (!formData.mentor1) {
                        setFormData({ ...formData, mentor1: m.id });
                      } else if (!formData.mentor2 && formData.mentor1 !== m.id) {
                        setFormData({ ...formData, mentor2: m.id });
                      } else if (formData.mentor1 === m.id) {
                        setFormData({ ...formData, mentor1: "", mentor2: formData.mentor2 });
                      } else if (formData.mentor2 === m.id) {
                        setFormData({ ...formData, mentor2: "" });
                      }
                    }}
                    className={`group relative rounded-lg overflow-hidden border-2 transition-all duration-300 ease-out active:scale-95 ${
                      formData.mentor1 === m.id || formData.mentor2 === m.id
                        ? "border-primary shadow-lg shadow-primary/20 scale-105 animate-in"
                        : "border-transparent hover:border-primary/50 hover:scale-[1.02]"
                    }`}
                  >
                    <div className="w-full aspect-[3/4]">
                      <img src={m.image_url} alt={m.name} className="w-full h-full object-cover" />
                    </div>
                    
                    {/* Hover overlay with description */}
                    <div className="absolute inset-0 bg-background/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-3 text-center">
                      <p className="text-sm font-bold mb-2">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.description}</p>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-2 text-center group-hover:opacity-0 transition-opacity duration-300">
                      <p className="text-xs font-semibold">{m.name}</p>
                    </div>
                    {formData.mentor1 === m.id && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-sm px-2 py-1 rounded-full font-bold z-10 animate-in fade-in scale-in duration-200">1</div>
                    )}
                    {formData.mentor2 === m.id && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-sm px-2 py-1 rounded-full font-bold z-10 animate-in fade-in scale-in duration-200">2</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Profile Picture</Label>
              <p className="text-xs text-muted-foreground mb-2">
                {!formData.mentor1 || !formData.mentor2 
                  ? "Select your 2 mentors first to choose a profile picture" 
                  : "Choose a profile picture from your selected mentors"}
              </p>
              <div className="grid grid-cols-5 gap-2 mt-2 max-h-64 overflow-y-auto p-2 border rounded-lg">
                {getAvailableProfilePictures().map((pic) => (
                  <button
                    key={pic.id}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, profilePicture: `profile:${pic.id}` });
                    }}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all duration-300 ease-out active:scale-95 ${
                      formData.profilePicture === `profile:${pic.id}`
                        ? "border-primary shadow-lg shadow-primary/20 scale-110 animate-in"
                        : "border-transparent hover:border-primary/50 hover:scale-105"
                    }`}
                  >
                    <Avatar className="w-full h-full">
                      <AvatarImage src={resolveProfileImage(`profile:${pic.id}`)} alt={pic.name} className="object-cover" />
                      <AvatarFallback>{pic.name[0]}</AvatarFallback>
                    </Avatar>
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </Button>

            <div className="text-center text-sm">
              Already have an account?{" "}
              <a href="/login" className="text-primary hover:underline">
                Login
              </a>
            </div>
          </form>
        </CardContent>
      </Card>

      <MentorComparisonModal
        open={showComparison}
        onOpenChange={setShowComparison}
        mentor1={mentors.find(m => m.id === formData.mentor1) || null}
        mentor2={mentors.find(m => m.id === formData.mentor2) || null}
      />
    </div>
  );
};

export default Signup;
