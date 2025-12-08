import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DISCIPLINE_DETAILS: Record<string, { description: string; color: string; traits: string[] }> = {
  "Shadow": {
    description: "The less you see me the better. Well...The quicker you disappear.",
    color: "#432A76",
    traits: ["Surprise attacks", "Lethal", "Burst damage"]
  },
  "All-Seeing": {
    description: "Everything is tactical. Your demise is not. It’s just another day for me.",
    color: "#808080",
    traits: ["Planification", "Resourceful", "Diverse arsenal"]
  },
  "Titan": {
    description: "To think that your attacks can even graze me...The delusion. Stop thinking.",
    color: "#00FF00",
    traits: ["Armor gain", "Extra health", "Melee"]
  },
  "Emperor": {
    description: "I own this, in its entirety. Play nice and I might allow you a casket.",
    color: "#0000FF",
    traits: ["AOE", "GLOBAL", "Domination"]
  },
  "Finisher": {
    description: "I would never be on the defensive against your kind. Begone, puny one.",
    color: "#FF0000",
    traits: ["Heavy offensive", "High damage", "Attack buffs"]
  },
  "Lightbringer": {
    description: "Killing me ? Ah…In your dreams. I’m already healed up from your next attack, fool.",
    color: "#FFA500",
    traits: ["Healing", "Diverse buffs", "Second chances"]
  }
};

export const DisciplineInfo = ({ discipline }: { discipline: string }) => {
  const info = DISCIPLINE_DETAILS[discipline];
  
  if (!info) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <span>Discipline:</span>
          <span style={{ color: info.color }}>{discipline}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{info.description}</p>
        <div className="flex flex-wrap gap-2">
          {info.traits.map((trait) => (
            <Badge key={trait} variant="outline" style={{ borderColor: info.color }}>
              {trait}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};