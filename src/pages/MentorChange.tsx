import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Coins, AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";
import logo from "@/assets/logo.png";
import { NavLink } from "@/components/NavLink";

interface Mentor {
  id: string;
  name: string;
  description: string;
  image_url: string;
}

interface ChangeRequest {
  id: string;
  current_mentor_id: string | null;
  requested_mentor_id: string;
  slot: number;
  status: string;
  admin_note: string | null;
  token_cost: number;
  created_at: string;
  current_mentor?: Mentor;
  requested_mentor?: Mentor;
}

const MentorChange = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [userMentors, setUserMentors] = useState<any[]>([]);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number>(1);
  const [selectedMentor, setSelectedMentor] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState<number>(45);

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
      fetchMentors(),
      fetchUserMentors(session.user.id),
      fetchRequests(session.user.id),
      fetchCurrentPrice()
    ]);
    setLoading(false);
  };

  const fetchCurrentPrice = async () => {
    const { data } = await supabase
      .from("global_settings")
      .select("value")
      .eq("key", "mentor_change_price")
      .single();
    
    if (data) setCurrentPrice(data.value);
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("tokens, level")
      .eq("id", userId)
      .single();
    
    if (data) setProfile(data);
  };

  const fetchMentors = async () => {
    const { data } = await supabase
      .from("mentors")
      .select("*")
      .order("name");
    
    if (data) setMentors(data);
  };

  const fetchUserMentors = async (userId: string) => {
    const { data } = await supabase
      .from("user_mentors")
      .select(`
        *,
        mentor:mentors(*)
      `)
      .eq("user_id", userId)
      .order("slot");
    
    if (data) setUserMentors(data);
  };

  const fetchRequests = async (userId: string) => {
    const { data } = await supabase
      .from("mentor_change_requests")
      .select(`
        *,
        current_mentor:mentors!mentor_change_requests_current_mentor_id_fkey(*),
        requested_mentor:mentors!mentor_change_requests_requested_mentor_id_fkey(*)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    
    if (data) setRequests(data as ChangeRequest[]);
  };

  const handleRequestChange = async () => {
    if (!user || !selectedMentor) return;

    if (profile.tokens < currentPrice) {
      toast.error(`Insufficient tokens! You need ${currentPrice} tokens.`);
      return;
    }

    const currentMentor = userMentors.find(m => m.slot === selectedSlot);

    // Call database function to handle the request atomically
    const { data, error } = await supabase.rpc("request_mentor_change", {
      p_user_id: user.id,
      p_current_mentor_id: currentMentor?.mentor_id || null,
      p_requested_mentor_id: selectedMentor,
      p_slot: selectedSlot
    });

    if (error) {
      console.error("RPC error:", error);
      toast.error(`Failed to create request: ${error.message || "Unknown error"}`);
      return;
    }

    if (!data) {
      toast.error("No response from server");
      return;
    }

    const result = data as { success: boolean; error?: string; tokens_spent?: number };

    if (!result.success) {
      console.error("Function returned error:", result.error);
      toast.error(result.error || "Failed to create request");
      return;
    }

    toast.success(`Mentor change request submitted! ${result.tokens_spent} tokens spent. Next request will cost ${currentPrice + 5} tokens.`);
    
    // Refresh data
    await Promise.all([
      fetchProfile(user.id),
      fetchRequests(user.id),
      fetchCurrentPrice()
    ]);
    
    setShowDialog(false);
    setSelectedMentor("");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "rejected": return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive"
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

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
          <h1 className="text-4xl font-bold mb-2">Mentor Change Request</h1>
          <p className="text-muted-foreground">Request to change your mentors ({currentPrice} tokens per request, increases by 5 each time)</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Current Mentors</h2>
            <div className="space-y-4">
              {userMentors.map((userMentor) => (
                <Card key={userMentor.id}>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <img 
                        src={userMentor.mentor.image_url} 
                        alt={userMentor.mentor.name}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                      <div>
                        <CardTitle>Slot {userMentor.slot}</CardTitle>
                        <CardDescription>{userMentor.mentor.name}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        setSelectedSlot(userMentor.slot);
                        setShowDialog(true);
                      }}
                    >
                      Request Change
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">Request History</h2>
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Slot {request.slot} Change</CardTitle>
                      {getStatusIcon(request.status)}
                    </div>
                    <CardDescription>
                      {new Date(request.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">From:</span> {request.current_mentor?.name || "Empty"}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">To:</span> {request.requested_mentor?.name}
                    </div>
                    <div className="flex items-center justify-between">
                      {getStatusBadge(request.status)}
                      <span className="text-sm text-muted-foreground">
                        {request.token_cost} tokens
                      </span>
                    </div>
                    {request.admin_note && (
                      <div className="text-sm p-2 bg-muted rounded">
                        <span className="font-medium">Admin note:</span> {request.admin_note}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {requests.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No requests yet
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Mentor Change</DialogTitle>
              <DialogDescription>
                Select a new mentor for slot {selectedSlot}. This will cost {currentPrice} tokens and requires admin approval.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">New Mentor</label>
                <Select value={selectedMentor} onValueChange={setSelectedMentor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a mentor" />
                  </SelectTrigger>
                  <SelectContent>
                    {mentors.map((mentor) => (
                      <SelectItem key={mentor.id} value={mentor.id}>
                        {mentor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
                <span>Admin approval required. Tokens will be deducted immediately.</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleRequestChange} disabled={!selectedMentor}>
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default MentorChange;