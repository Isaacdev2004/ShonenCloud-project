import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import successImage1 from "@/assets/mission/success1.png";
import successImage2 from "@/assets/mission/success2.png";
import failedImage1 from "@/assets/mission/failed1.png";
import failedImage2 from "@/assets/mission/failed2.png";

interface Mission {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  image_url: string | null;
}

const DataMission = () => {
  const navigate = useNavigate();
  const [mission, setMission] = useState<Mission | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState(15);
  const [isComplete, setIsComplete] = useState(false);
  const [result, setResult] = useState<'success' | 'failed' | null>(null);
  const [xpGained, setXpGained] = useState(0);

  useEffect(() => {
    loadRandomMission();
  }, []);

  useEffect(() => {
    if (timeRemaining > 0 && !isComplete) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && !isComplete) {
      handleTimeout();
    }
  }, [timeRemaining, isComplete]);

  const loadRandomMission = async () => {
    const { data: missions } = await supabase
      .from("missions")
      .select("*")
      .eq("type", "data")
      .eq("is_active", true);

    if (missions && missions.length > 0) {
      const randomMission = missions[Math.floor(Math.random() * missions.length)];
      setMission({
        ...randomMission,
        options: randomMission.options as string[],
      });
    } else {
      toast.error("No missions available");
      navigate("/missions");
    }
  };

  const handleTimeout = async () => {
    setIsComplete(true);
    setResult('failed');
    setXpGained(5);
    await updateProfile(5, 0, false);
  };

  const handleSubmit = async () => {
    if (!selectedAnswer || !mission) return;

    setIsComplete(true);
    const isCorrect = selectedAnswer === mission.correct_answer;

    if (isCorrect) {
      const xp = Math.floor(Math.random() * 6) + 10; // 10-15
      setResult('success');
      setXpGained(xp);
      await updateProfile(xp, 1, true);
    } else {
      setResult('failed');
      setXpGained(5);
      await updateProfile(5, 0, false);
    }
  };

  const updateProfile = async (xp: number, tokens: number, incrementMissions: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("xp_points, tokens, missions_executed, level")
      .eq("id", user.id)
      .single();

    if (profile) {
      const newXP = profile.xp_points + xp;
      const newLevel = Math.floor(newXP / 100) + 1;

      await supabase
        .from("profiles")
        .update({
          xp_points: newXP,
          tokens: profile.tokens + tokens,
          missions_executed: incrementMissions ? profile.missions_executed + 1 : profile.missions_executed,
          level: newLevel,
          last_mission_time: new Date().toISOString(),
        })
        .eq("id", user.id);
    }
  };

  const getResultImage = () => {
    if (result === 'success') {
      return Math.random() > 0.5 ? successImage1 : successImage2;
    } else {
      return Math.random() > 0.5 ? failedImage1 : failedImage2;
    }
  };

  if (!mission) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground">Loading mission...</p>
      </div>
    );
  }

  if (isComplete && result) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <img
          src={getResultImage()}
          alt={result === 'success' ? 'Success' : 'Failed'}
          className="w-64 h-64 object-contain mb-8"
        />
        <h1 className="text-4xl font-bold text-foreground mb-4">
          {result === 'success' ? 'Mission Success!' : 'Mission Failed'}
        </h1>
        <p className="text-2xl text-muted-foreground mb-8">
          +{xpGained} XP {result === 'success' && '+ 1 Token'}
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Timer */}
        <div className="text-center">
          <div className={`text-6xl font-bold ${timeRemaining <= 5 ? 'text-red-500' : 'text-primary'}`}>
            {timeRemaining}s
          </div>
        </div>

        {/* Mission Image */}
        {mission.image_url && (
          <img
            src={mission.image_url}
            alt="Mission"
            className="w-full max-h-64 object-contain rounded-lg"
          />
        )}

        {/* Question */}
        <h2 className="text-2xl font-bold text-foreground text-center">
          {mission.question}
        </h2>

        {/* Options */}
        <div className="space-y-4">
          {mission.options.map((option, index) => (
            <button
              key={index}
              onClick={() => setSelectedAnswer(option)}
              className={`w-full p-4 rounded-lg text-left transition-colors ${
                selectedAnswer === option
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!selectedAnswer}
          className="w-full py-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Answer
        </button>
      </div>
    </div>
  );
};

export default DataMission;
