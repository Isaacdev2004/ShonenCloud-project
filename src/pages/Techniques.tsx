import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Coins, BookOpen, Lock, CheckCircle } from "lucide-react";
import logo from "@/assets/logo.png";
import { NavLink } from "@/components/NavLink";

interface Technique {
  id: string;
  name: string;
  description: string;
  cep: string;
  type_info: string;
  image_url: string | null;
  level_requirement: number;
  price: number;
  mentor_id: string;
  mentor?: {
    name: string;
    image_url: string;
  };
}

interface UserTechnique {
  technique_id: string;
}

interface UserMentor {
  mentor_id: string;
}

const Techniques = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [learnedTechniques, setLearnedTechniques] = useState<string[]>([]);
  const [userMentors, setUserMentors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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
    await Promise.all([
      fetchProfile(session.user.id),
      fetchTechniques(),
      fetchLearnedTechniques(session.user.id),
      fetchUserMentors(session.user.id)
    ]);
    setLoading(false);
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("tokens, level")
      .eq("id", userId)
      .single();
    
    if (data) setProfile(data);
  };

  const fetchTechniques = async () => {
    const { data } = await supabase
      .from("techniques")
      .select(`
        *,
        mentor:mentors(name, image_url)
      `)
      .order("level_requirement", { ascending: true });
    
    if (data) setTechniques(data as Technique[]);
  };

  const fetchLearnedTechniques = async (userId: string) => {
    const { data } = await supabase
      .from("user_techniques")
      .select("technique_id")
      .eq("user_id", userId);
    
    if (data) setLearnedTechniques(data.map((t: UserTechnique) => t.technique_id));
  };

  const fetchUserMentors = async (userId: string) => {
    const { data } = await supabase
      .from("user_mentors")
      .select("mentor_id")
      .eq("user_id", userId);
    
    if (data) setUserMentors(data.map((m: UserMentor) => m.mentor_id));
  };

  const handleLearnTechnique = async (technique: Technique) => {
    if (!user || !profile) return;

    // Check mentor requirement
    if (!userMentors.includes(technique.mentor_id)) {
      toast.error(`You need ${technique.mentor?.name || "this mentor"} to learn this technique!`);
      return;
    }

    // Check level requirement
    if (profile.level < technique.level_requirement) {
      toast.error(`Level ${technique.level_requirement} required!`);
      return;
    }

    // Check token balance
    if (profile.tokens < technique.price) {
      toast.error("Insufficient tokens!");
      return;
    }

    // Deduct tokens
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ tokens: profile.tokens - technique.price })
      .eq("id", user.id);

    if (updateError) {
      toast.error("Failed to deduct tokens");
      return;
    }

    // Add technique to user
    const { error: insertError } = await supabase
      .from("user_techniques")
      .insert({ user_id: user.id, technique_id: technique.id });

    if (insertError) {
      toast.error("Failed to learn technique");
      return;
    }

    toast.success(`Learned ${technique.name}!`);
    setProfile({ ...profile, tokens: profile.tokens - technique.price });
    setLearnedTechniques([...learnedTechniques, technique.id]);
  };

  const isLearned = (techniqueId: string) => learnedTechniques.includes(techniqueId);
  const canLearn = (technique: Technique) => 
    !isLearned(technique.id) && 
    userMentors.includes(technique.mentor_id) &&
    profile?.level >= technique.level_requirement &&
    profile?.tokens >= technique.price;

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <img src={logo} alt="Logo" className="h-8" />
            <nav className="hidden md:flex gap-6">
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/profile">Profile</NavLink>
              <NavLink to="/arena">Arena</NavLink>
              <NavLink to="/techniques">Techniques</NavLink>
              <NavLink to="/store">Store</NavLink>
              <NavLink to="/chat">Chat</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="gap-2">
              <Coins className="h-4 w-4" />
              {profile?.tokens || 0}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Technique Library</h1>
          <p className="text-muted-foreground">Master powerful techniques from your mentors</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {techniques
            .filter((technique) => userMentors.includes(technique.mentor_id))
            .map((technique) => {
              const learned = isLearned(technique.id);
              const canLearnTech = canLearn(technique);

              return (
                <Card key={technique.id} className={learned ? "border-primary" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {technique.name}
                          {learned && <CheckCircle className="h-5 w-5 text-primary" />}
                        </CardTitle>
                        <CardDescription className="mt-2">{technique.description}</CardDescription>
                      </div>
                      {technique.image_url && (
                        <img src={technique.image_url} alt={technique.name} className="h-16 w-16 rounded object-cover" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4" />
                      <span className="font-medium">Mentor:</span>
                      <span className="text-primary">
                        {technique.mentor?.name}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline">{technique.cep}</Badge>
                      <Badge variant="outline">{technique.type_info}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Lock className="h-4 w-4" />
                        Level {technique.level_requirement}
                      </span>
                      <span className="flex items-center gap-1 font-bold">
                        <Coins className="h-4 w-4" />
                        {technique.price}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    {learned ? (
                      <Button disabled className="w-full">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Learned
                      </Button>
                    ) : (
                      <Button 
                        className="w-full" 
                        onClick={() => handleLearnTechnique(technique)}
                        disabled={!canLearnTech}
                      >
                        {profile?.level < technique.level_requirement ? "Level Too Low" :
                         profile?.tokens < technique.price ? "Insufficient Tokens" :
                         "Learn Technique"}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
        </div>

        {techniques.filter((t) => userMentors.includes(t.mentor_id)).length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No techniques available from your mentors yet</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Techniques;