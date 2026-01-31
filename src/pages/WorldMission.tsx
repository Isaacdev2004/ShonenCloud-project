import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import successImage1 from "@/assets/mission/success1.png";
import successImage2 from "@/assets/mission/success2.png";
import failedImage1 from "@/assets/mission/failed1.png";
import failedImage2 from "@/assets/mission/failed2.png";

interface Question {
  question: string;
  options: string[];
  correct_answer: string;
  image_url: string | null;
}

const WorldMission = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [isComplete, setIsComplete] = useState(false);
  const [result, setResult] = useState<'success' | 'failed' | null>(null);
  const [xpGained, setXpGained] = useState(0);

  useEffect(() => {
    loadRandomMission();
  }, []);

  const loadRandomMission = async () => {
    // Get a random world mission
    const { data: missions } = await supabase
      .from("missions")
      .select("id, question, options, correct_answer, image_url")
      .eq("type", "world")
      .eq("is_active", true);

    if (missions && missions.length > 0) {
      const randomMission = missions[Math.floor(Math.random() * missions.length)];
      
      // Get the associated questions
      const { data: missionQuestions } = await supabase
        .from("world_mission_questions")
        .select("*")
        .eq("mission_id", randomMission.id)
        .order("question_order");

      if (missionQuestions && missionQuestions.length === 3) {
        // Use only the 3 sub-questions
        const allQuestions: Question[] = missionQuestions.map(q => ({
          question: q.question,
          options: q.options as string[],
          correct_answer: q.correct_answer,
          image_url: q.image_url,
        }));
        setQuestions(allQuestions);
      } else {
        toast.error("Invalid mission structure");
        navigate("/missions");
      }
    } else {
      toast.error("No missions available");
      navigate("/missions");
    }
  };

  const handleSubmit = async () => {
    if (!selectedAnswer || questions.length === 0) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;

    if (!isCorrect) {
      // Failed - no XP
      setIsComplete(true);
      setResult('failed');
      setXpGained(0);
      await updateProfile(0, 0, false);
      return;
    }

    // Correct answer
    if (currentQuestionIndex < questions.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer("");
    } else {
      // All questions completed successfully
      const xp = Math.floor(Math.random() * 8) + 15; // 15-22
      setIsComplete(true);
      setResult('success');
      setXpGained(xp);
      await updateProfile(xp, 2, true);
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
      const newLevel = Math.floor(newXP / 200) + 1;

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

  if (questions.length === 0) {
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
          {result === 'success' ? `+${xpGained} XP + 2 Tokens` : 'No XP gained'}
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

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Progress */}
        <div className="text-center">
          <p className="text-lg text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>

        {/* Mission Image */}
        {currentQuestion.image_url && (
          <img
            src={currentQuestion.image_url}
            alt="Mission"
            className="w-full max-h-64 object-contain rounded-lg"
          />
        )}

        {/* Question */}
        <h2 className="text-2xl font-bold text-foreground text-center">
          {currentQuestion.question}
        </h2>

        {/* Options */}
        <div className="space-y-4">
          {currentQuestion.options.map((option, index) => (
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

export default WorldMission;
