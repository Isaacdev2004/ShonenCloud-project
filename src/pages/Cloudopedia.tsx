import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Cloudopedia = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/arena")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Arena
        </Button>

        <div className="border-2 border-border rounded-lg p-8 bg-card">
          <h1 className="text-4xl font-bold text-foreground mb-6">Cloudopedia</h1>
          
          <div className="prose prose-invert max-w-none space-y-4">
            <p className="text-foreground">
              Welcome to the Cloudopedia - your comprehensive guide to the Arena system.
            </p>
            
            <h2 className="text-2xl font-bold text-foreground mt-6">About the Arena</h2>
            <p className="text-muted-foreground">
              The Arena is a dynamic environment where players can explore different zones,
              manage their stats, and interact with other players in real-time.
            </p>

            <h2 className="text-2xl font-bold text-foreground mt-6">Understanding Zones</h2>
            <p className="text-muted-foreground">
              There are 8 distinct zones in the Arena, each with its own characteristics:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Training Ground - Perfect for beginners to practice</li>
              <li>Battle Arena - Engage in combat scenarios</li>
              <li>Meditation Chamber - Restore your energy</li>
              <li>Resource Valley - Gather materials and resources</li>
              <li>Shadow Realm - Advanced area with hidden challenges</li>
              <li>Crystal Cavern - Rich in energy crystals</li>
              <li>Fire Peak - High-intensity training area</li>
              <li>Wind Temple - Master agility and speed</li>
            </ul>

            <h2 className="text-2xl font-bold text-foreground mt-6">Player Stats</h2>
            <p className="text-muted-foreground">
              Each player has three core stats that they can manage:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>Health:</strong> Your vitality and survivability</li>
              <li><strong>Armor:</strong> Your defensive capabilities</li>
              <li><strong>Energy:</strong> Your action points and stamina</li>
            </ul>

            <h2 className="text-2xl font-bold text-foreground mt-6">Getting Started</h2>
            <p className="text-muted-foreground">
              To begin your journey in the Arena:
            </p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2">
              <li>Update your stats according to your strategy</li>
              <li>Choose a zone that fits your current objectives</li>
              <li>Observe other players in your zone</li>
              <li>Plan your next moves wisely</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cloudopedia;
