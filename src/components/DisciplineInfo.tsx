import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DISCIPLINE_DETAILS: Record<string, { description: string; color: string; traits: string[] }> = {
  "Shadow": {
    description: "Masters of stealth and darkness, Shadow disciples manipulate shadows to their advantage.",
    color: "#432A76",
    traits: ["Stealth", "Assassination", "Shadow Manipulation"]
  },
  "All-Seeing": {
    description: "Possessors of incredible perception, they see through illusions and predict movements.",
    color: "#808080",
    traits: ["Enhanced Vision", "Prediction", "Analysis"]
  },
  "Titan": {
    description: "Giants of raw strength and endurance, Titans dominate through sheer physical power.",
    color: "#00FF00",
    traits: ["Super Strength", "Durability", "Size Manipulation"]
  },
  "Emperor": {
    description: "Born leaders with commanding presence, they inspire and control those around them.",
    color: "#0000FF",
    traits: ["Leadership", "Charisma", "Command"]
  },
  "Finisher": {
    description: "Specialists in decisive strikes, they end battles with overwhelming finishing moves.",
    color: "#FF0000",
    traits: ["Critical Strikes", "Execution", "Power Burst"]
  },
  "Lightbringer": {
    description: "Wielders of radiant energy, they heal allies and smite enemies with holy light.",
    color: "#FFA500",
    traits: ["Healing", "Light Manipulation", "Purification"]
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