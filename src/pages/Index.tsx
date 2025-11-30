import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import cloudO from "@/assets/cloudo.png";
import { Zap, Target, Users, Trophy, Sword, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [showCloudO, setShowCloudO] = useState(false);
  const [adminMessage, setAdminMessage] = useState<{ title: string; message: string } | null>(null);
  const [isGuest, setIsGuest] = useState(true);

  useEffect(() => {
    checkAuth();
    
    // Listen for auth state changes to keep isGuest status up to date
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const guestStatus = !session?.user;
      setIsGuest(guestStatus);
      if (guestStatus) {
        fetchAdminMessage();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const guestStatus = !session?.user;
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

  const features = [
    { icon: Zap, title: "XP System", description: "Level up through missions and daily check-ins" },
    { icon: Target, title: "Missions", description: "Choose-your-own-adventure style quests" },
    { icon: Users, title: "Mentors", description: "Learn powerful techniques from legendary mentors" },
    { icon: Trophy, title: "Arena", description: "Battle and showcase your abilities" },
    { icon: Sword, title: "Disciplines", description: "Master unique combat styles" },
    { icon: Shield, title: "BlackYard Store", description: "Unlock exclusive items and abilities" },
  ];

  const stats = [
    { value: "6", label: "Disciplines" },
    { value: "∞", label: "Missions" },
    { value: "Live", label: "Arena Battles" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
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

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.15),transparent_70%)]" />
        <div className="text-center space-y-8 max-w-4xl relative z-10">
          <div className="relative inline-block">
            <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full animate-pulse" />
            <img src={logo} alt="ShonenCloud" className="w-56 h-56 mx-auto relative z-10 drop-shadow-2xl" />
          </div>
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent animate-fade-in">
            ShonenCloud
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            How Will You Shape Your Clouds?
          </p>
          <p className="text-base md:text-lg text-muted-foreground/80 max-w-xl mx-auto">
            Embark on an epic journey. Level up, complete missions, master techniques, and prove your worth in the Arena.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button onClick={() => navigate("/signup")} size="lg" className="px-10 text-lg h-14 shadow-lg hover:shadow-xl transition-all">
              Start Your Journey
            </Button>
            <Button onClick={() => navigate("/login")} variant="outline" size="lg" className="px-10 text-lg h-14">
              Login
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 border-y border-border bg-card/50">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center space-y-2">
                <div className="text-5xl md:text-6xl font-bold text-primary">{stat.value}</div>
                <div className="text-muted-foreground text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">Shape Your Path</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Explore a world of possibilities with powerful features designed to enhance your journey
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all hover:scale-105 hover:border-primary/50">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold">Ready to Begin?</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Join the community and start your journey today. Choose your discipline, complete missions, and become a legend.
          </p>
          <Button onClick={() => navigate("/signup")} size="lg" className="px-12 text-lg h-14 shadow-lg hover:shadow-xl transition-all">
            Create Your Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto text-center text-muted-foreground text-sm">
          © 2025 ShonenCloud. Shape Your Clouds.
        </div>
      </footer>
    </div>
  );
};

export default Index;
