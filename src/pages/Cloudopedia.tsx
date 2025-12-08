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
          
          <div className="text-[11px] text-foreground space-y-3 leading-relaxed">
            <div>
              <h2 className="text-base font-bold text-foreground mb-2">Starting off-MUST READ:</h2>
              <p>
                Fights can only be joined every 30 minutes,with a 5 minute window. Example: At 9:00 you can join, all the way to 9:05. If you miss it, you cannot join until 9:30 to 9:35. Then 10 to 10:05, 10:30 to 10:35 etc… Please, RESPECT this, as it allows other players already in fight to prepare themselves for newcomers. It's only fair to them.
              </p>
              <p className="mt-2">
                Put your cursor on any profile pictures in any zones to see your opponent&apos;s current stats.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-foreground mb-2">How to start:</h2>
              <p>
                You click on any zone you want to go to. Your first post should have the status: <strong>DROPPING IN !</strong> plus the action Moving Around. NO TECHNIQUES usable on your first turn.
              </p>
            </div>

            <div>
              <p>
                The target system is a toggle. You need to unselect your target by clicking on them. Then target a new player.
              </p>
            </div>

            <div>
              <p>
                DO NOT CHANGE ZONES without posting the Change Zone action. And remember, Changing zone has 8 turn cooldown and costs no Energy regardless if it fails or succeeds. If used in active combat, it's called Fleeing !
              </p>
            </div>

            <div>
              <p>
                CEP stands for: Cooldown, Energy, Priority ! A technique with the CEP 146 means: 1 turn cooldown, 4 Energy cost and 6 Priority.
              </p>
            </div>

            <div>
              <p>
                UPDATE your stats accordingly. Don't be unfair to your opponents. Respect the system in place.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-foreground mb-2">Actions:</h2>
              <p>
                <strong>Move Around:</strong> Cost 2 Energy, no cooldown, must be out of combat unless a technique says otherwise.
              </p>
              <p>
                <strong>Change Zone:</strong> Cost 0 Energy, 8 cooldown, considered FLEEING if used in combat. If successful, the user is no longer in active combat with anyone and must be found again.
              </p>
              <p>
                <strong>Gather Energy:</strong> Cost 0 Energy, gives full Energy, no cooldown, cannot use OFFENSIVE and DEFENSIVE techniques with it.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-foreground mb-2">Status:</h2>
              <p>
                <strong>Evasion:</strong> Cost half energy, rounded up. 8 cooldown, no technique usable, none.
              </p>
              <p>
                <strong>Observing zones:</strong> Can target anyone anywhere, and lasts 2 turns. Doesn't affect HIDDEN or players in Evasion. Must use it even if a technique says it can traverse zones. Some techniques give Total Observation. It's basically Observing zones, but granted by a technique.
              </p>
              <p>
                <strong>Zone signatures:</strong> When one is being completed, the player cannot be found by any means. Even if found, it's ignored. Stay inactive for the amount of turns when being done. Just post your status: "Completing a zone signature" each inactive turn.
              </p>
              <p>
                <strong>Setup:</strong> When used, user is unable to use any Offensive and Defensive techniques. All debuffs (except Stun and Silence, they cancel a Setup) are ignored. Even negative changes like energy loss, or priority loss are ignored by the player while they have a Setup in play.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-foreground mb-2">Buffs/Debuffs:</h2>
              <p>
                <strong>Effects:</strong> Stunned (nothing can be done), Hidden (cannot be located or attacked unless revealed, but affected by AOE), Shielded (ignore damage), Weakened (cannot generate Energy or Armor), Lethal (All techniques ignore Armor), Grounded (no actions allowed) Reaping (ignore Shielded and Armor) Unwell (Cannot be healed or use Movement) Focused (Can hit airborne, underground, and fleeing targets) Airborne/Underground (Vulnerable only to FOCUSED, AOE and GLOBAL) Silenced (Cannot use any techniques), Immune (ignore every enemy technique, debuff and damage) Bleed (Cannot Observe zones, ignore Armor and Shielded)
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-foreground mb-2">Special explanations:</h2>
              <p>
                <strong>Armor ?:</strong> Permanent but goes away when taken equal or more damage than armor value. 10 Armor ? 10 damage taken = armor is now 0.
              </p>
              <p>
                <strong>Clash ?</strong> Compare Energy after both techniques are used. Higher energy wins. If equal, compare Priority. Can only Clash if same distance, melee clashes with melee, never ranged. Vice Versa.
              </p>
              <p>
                <strong>Setup ?</strong> Can only be defended against by a Movement with equal or superior priority. Of if the user gets stunned or silenced while it's still in play.
              </p>
              <p>
                <strong>Can be used while moving around ?:</strong> Every result of Moving around is taken into account, except Zone signatures and Stray Portals. They are ignored.
              </p>
              <p>
                <strong>Stray Portal:</strong> Instant but random teleportation to any zone. Roll the dice the following turn. 2 through 9 in the order of the zones. The user loses 10 HP, bypasses even Immune. No Offensive or Defensive technique can be used on the turn taking a Stray Portal.
              </p>
              <p>
                <strong>Zone Hugging:</strong> Only 2 turns alone are allowed in an empty zone. Move to a zone with at least 1 player on the third turn or you get eliminated.
              </p>
              <p>
                <strong>AOE vs GLOBAL:</strong> AOE techniques can hit a HIDDEN, AIRBORNE/UNDERGROUND target that you are in active combat with, while GLOBAL hits everyone in the zone that's not HIDDEN without needing to be in active combat with them, including Fleeing targets. When you hit anyone in any zone with a GLOBAL technique, you are now in active combat with them, they can attack you without having to Move Around and find you.
              </p>
              <p>
                <strong>Cloud Catalyzer ?</strong> Every technique you use has +5 Priority. Lasts 6 turns.
              </p>
              <p>
                <strong>Movement technique ?</strong> It's also a dodge. Some Movement techniques specify what they can dodge.
              </p>
              <p>
                <strong>"Without actively using it":</strong> The technique will fire on its own when it's stated. Allowing a combo with it. Don't repost the technique, but keep it mind that it's taking effect.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-foreground mb-2">Attacking and defending:</h2>
              <p>
                <strong>Can't be blocked/dodged ?</strong> Technique can only be blocked or dodged if the defending technique has double or more priority. It can also be blocked if the defender has Shielded, Immune or enough Armor.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-foreground mb-2">IMPORTANT !!!</h2>
              <p>
                An OFFENSIVE technique with double the priority of a DEFENSIVE technique will always win. Same for the other way around, a DEFENSIVE technique with double priority will always block the OFFENSIVE. Double Priority ALWAYS wins ! No matter the tags/type. Only SETUP techniques don’t follow that rule.
              </p>
              <p className="mt-2">
                A DEFENSIVE technique typically describes the exact type of technique it blocks. If a DEFENSIVE technique has less Priority than an OFFENSIVE one, it still blocks it. But if the attacking player has more Energy after using their attack or if the defender is debuffed, the DEFENSIVE technique loses.
              </p>
              <p className="mt-2 font-semibold">For example:</p>
              <p>
                Great Shield (4 Priority): Block any PHYSICAL MELEE.
              </p>
              <p>
                Normally, Great Shield will block any PHYSICAL MELEE attack with 4-7 Priority.
              </p>
              <p>
                Great Shield will win against any PHYSICAL MELEE with 4-7 Priority BUT loses if the attacker has more Energy after both techniques are used or if the user of Great Shield has any debuff active.
              </p>
              <p className="mt-2">
                A DEFENSIVE technique that states the exact amount of Priority that it blocks will lose against any OFFENSIVE that has that amount of Priority or more, Energy value doesn’t matter. For example:
              </p>
              <p>
                Great Wall: Block any POWER MELEE with 5 or less Priority.
              </p>
              <p>
                Great Wall will lose against any POWER MELEE that has 6+ Priority.
              </p>
              <p>
                Great Wall will win against any POWER MELEE that has 5 or less Priority.
              </p>
              <p className="mt-2">
                If 2 techniques say the exact opposite thing or there’s any conflict, the player with the most Energy after using their technique will win.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cloudopedia;
