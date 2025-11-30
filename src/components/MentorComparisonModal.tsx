import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Mentor {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
}

interface MentorComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentor1: Mentor | null;
  mentor2: Mentor | null;
}

export const MentorComparisonModal = ({ open, onOpenChange, mentor1, mentor2 }: MentorComparisonModalProps) => {
  if (!mentor1 || !mentor2) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Your Selected Mentors</DialogTitle>
          <DialogDescription>
            Compare your two chosen mentors and their unique abilities
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {/* Mentor 1 */}
          <div className="space-y-4 animate-fade-in">
            <div className="relative">
              <Badge className="absolute top-2 right-2 z-10" variant="default">
                Mentor 1
              </Badge>
              <Avatar className="w-full h-64 rounded-lg">
                <AvatarImage src={mentor1.image_url} alt={mentor1.name} className="object-cover" />
                <AvatarFallback className="text-4xl">{mentor1.name[0]}</AvatarFallback>
              </Avatar>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-xl font-bold">{mentor1.name}</h3>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Description</h4>
                <p className="text-sm">{mentor1.description || "A legendary mentor with incredible abilities."}</p>
              </div>
            </div>
          </div>

          {/* Mentor 2 */}
          <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="relative">
              <Badge className="absolute top-2 right-2 z-10" variant="default">
                Mentor 2
              </Badge>
              <Avatar className="w-full h-64 rounded-lg">
                <AvatarImage src={mentor2.image_url} alt={mentor2.name} className="object-cover" />
                <AvatarFallback className="text-4xl">{mentor2.name[0]}</AvatarFallback>
              </Avatar>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-xl font-bold">{mentor2.name}</h3>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Description</h4>
                <p className="text-sm">{mentor2.description || "A legendary mentor with incredible abilities."}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-center text-muted-foreground">
            These mentors will guide your journey and influence your available techniques
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
