import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { differenceInMinutes } from "date-fns";
import missionAnimation from "@/assets/mission-animation.gif";
import dataMissionAnimation from "@/assets/mission-data-animation.gif";

const MissionsHub = () => {
  const navigate = useNavigate();
  const [cooldownRemaining, setCooldownRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkCooldown();
  }, []);

  const checkCooldown = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("last_mission_time")
      .eq("id", user.id)
      .single();

    if (profile?.last_mission_time) {
      const minutesSince = differenceInMinutes(new Date(), new Date(profile.last_mission_time));
      const remaining = 45 - minutesSince;
      
      if (remaining > 0) {
        setCooldownRemaining(remaining);
      } else {
        setCooldownRemaining(null);
      }
    } else {
      setCooldownRemaining(null);
    }
    setLoading(false);
  };

  const startMission = (type: 'data' | 'world') => {
    if (cooldownRemaining && cooldownRemaining > 0) return;
    navigate(`/mission/${type}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground">Loading...</p>
      </div>
    );
  }

  if (cooldownRemaining && cooldownRemaining > 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Mission Cooldown</h1>
          <p className="text-xl text-muted-foreground">
            You can only do one mission every 45 minutes.
          </p>
          <p className="text-2xl font-bold text-primary">
            {cooldownRemaining} minutes remaining
          </p>
          <p className="text-muted-foreground">
            Chill in the chat in the meantime!
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-8 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-foreground mb-12">Choose Your Mission</h1>
      
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Data Mission */}
        <button
          onClick={() => startMission('data')}
          className="group relative overflow-hidden rounded-lg transition-transform hover:scale-105"
        >
          <img
            src={dataMissionAnimation}
            alt="Data Mission"
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
            <div className="text-left">
              <h2 className="text-2xl font-bold text-white mb-2">Data Mission</h2>
              <p className="text-sm text-gray-200">
                15 seconds • 1 question • 10-15 XP + 1 token
              </p>
            </div>
          </div>
        </button>

        {/* World Mission */}
        <button
          onClick={() => startMission('world')}
          className="group relative overflow-hidden rounded-lg transition-transform hover:scale-105"
        >
          <img
            src={missionAnimation}
            alt="World Mission"
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
            <div className="text-left">
              <h2 className="text-2xl font-bold text-white mb-2">World Mission</h2>
              <p className="text-sm text-gray-200">
                No timer • 3 questions • 15-22 XP + 2 tokens
              </p>
            </div>
          </div>
        </button>
      </div>

      <button
        onClick={() => navigate("/dashboard")}
        className="mt-12 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity"
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default MissionsHub;
