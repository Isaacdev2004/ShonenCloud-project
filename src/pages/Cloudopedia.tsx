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
          <h1 className="text-3xl font-bold text-foreground mb-6">New Arena: Rules and Overview</h1>

          <div className="text-sm text-foreground space-y-5 leading-relaxed">
            <p>
              Keep in mind: This is the alpha version of the Arena. Yes, it auto-updates and you do not need to refresh the page to see new values, but it is recommended to refresh the page once or twice every 2-3 actions.
            </p>

            <div>
              <h2 className="text-base font-bold mb-2">Entry and Exit</h2>
              <p>
                The Arena is always ongoing, but it is on a 40 minute open and 20 minute closed cycle. Entering will allow you to choose which zone to land in. Exiting the Arena will completely remove you from any zone.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-2">Stats</h2>
              <p><strong>HP:</strong> Once it reaches 0, you are K.O but you have 2 minutes to use a Revival technique. If you do not you will be kicked out of the Arena for 30 minutes, which means you have been killed. Every level gives you +15 HP.</p>
              <p><strong>ATK:</strong> The damage you deal with the button "Attack". Every level gives you +2 ATK.</p>
              <p><strong>Armor:</strong> The secondary defense you have. It goes away as you take damage.</p>
              <p><strong>Energy:</strong> Resources needed to use techniques. Certain techniques and Moving Around can also give you Energy.</p>
              <p><strong>Aura:</strong> The primary defense you have. It goes away as you take damage and always lasts 2 minutes.</p>
              <p><strong>M:</strong> Stands for Mastery. Your M is extremely important. Every time you attack, you gain .25 M, to a maximum of 5. Your M defines the duration of your statuses on yourself and on targets. 1 M=1 Minute, 2 M=2 minutes etc...</p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-2">Actions</h2>
              <p><strong>Attack:</strong> Deals your "ATK" value to your target.</p>
              <p><strong>Move Around:</strong> Has many random results. Good luck on what you find.</p>
              <p><strong>Observe:</strong> Allow you to target and attack anyone from any zone. 5 minutes cooldown. Lasts 3 minutes but cannot be used if you have less than 1 M.</p>
              <p><strong>Change Zone:</strong> You change zone. It has a 5 minute cooldown.</p>
              <p><strong>Use technique:</strong> You can use any technique learned in Uploads. Keep in mind, you MUST have a target to use a technique even if the technique only affects you. It is a way to prevent players from avoiding fights and empowering themselves indefinitely.</p>
              <p><strong>Teleport:</strong> Teleport to any target. Keep in mind, it costs 3 M.</p>
              <p><strong>Target Zone:</strong> It costs 2 M and you only deal half of your ATK value to everyone. This action only costs 1.50 M for Emperors.</p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-2">Tags</h2>
              <p>
                Techniques have many tags such as Defensive, Offensive, Power, Physical, Melee etc. For now, 3 tags have specific effects:
              </p>
              <p><strong>Global:</strong> A technique with this tag targets everyone in the zone it is used in.</p>
              <p><strong>Combo:</strong> Must have 1.5 or more Mastery to use any technique with this tag.</p>
              <p><strong>Setup:</strong> A technique with this tag deals 1.5x more damage to the Aura value of targets.</p>
              <p>
                Certain statuses prevent the use of techniques with certain tags, for example, when Launched Up, the affected player cannot use any technique with the Defensive tag. When Bleeding, the affected player cannot use any technique with the Revival tag etc... More on statuses later.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-2">Status</h2>
              <p><strong>Stunned:</strong> Cannot do anything.</p>
              <p><strong>Hidden:</strong> Cannot be attacked and affected only by AOE or Setup techniques. Has 60% chance to gain +3 ATK.</p>
              <p><strong>Shielded:</strong> Protected from any damage, except if the attacker is Reaping.</p>
              <p><strong>Weakened:</strong> Cannot gain Armor or Energy, and loses 4 ATK points.</p>
              <p><strong>Lethal:</strong> Attacks deal HP damage, ignoring Armor and Aura.</p>
              <p><strong>Grounded:</strong> Cannot use any action button.</p>
              <p><strong>Reaping:</strong> Attacks ignore Armor, Aura and even Shielded. Only Stasis blocks Reaping opponents.</p>
              <p><strong>Unwell:</strong> Cannot be healed and cannot use Movement techniques.</p>
              <p><strong>Focused:</strong> Can attack enemies with Airborne or Underground statuses.</p>
              <p><strong>Airborne/Underground:</strong> Can only be attacked by a Focused opponent or hit by a Global or AOE technique.</p>
              <p><strong>Silenced:</strong> Cannot use any technique.</p>
              <p><strong>Stasis:</strong> Ultimate form of defense but cannot attack and cannot heal.</p>
              <p><strong>K.O:</strong> Can only use a Revival technique to avoid death.</p>
              <p><strong>Element-affected:</strong> Receive 1.5x more damage from Elemental techniques.</p>
              <p><strong>Launched Up:</strong> Lose .50 M and cannot use any Defensive techniques.</p>
              <p><strong>Shrouded:</strong> Cannot use AOE or Ranged techniques.</p>
              <p><strong>Analyzed:</strong> Receive 1.5x more damage from Physical techniques.</p>
              <p><strong>Blessed:</strong> Healing on the self is 1.5x more effective.</p>
              <p><strong>Bleeding:</strong> Cannot use Buff or Revival techniques.</p>
              <p><strong>Chaos-affected:</strong> Cannot use Combo or Setup techniques and cannot Teleport.</p>
            </div>

            <div>
              <h2 className="text-base font-bold mb-2">M-Key (found when Moving Around)</h2>
              <p>Each Discipline has a different M-Key usage:</p>
              <p><strong>Shadow:</strong> Applies the status HIDDEN for the amount of Mastery accumulated as minutes.</p>
              <p><strong>Titan:</strong> Gain 10 Armor per x1 Mastery accumulated.</p>
              <p><strong>Finisher:</strong> Deal 10 damage per x1 Mastery accumulated to whoever is the current target.</p>
              <p><strong>Emperor:</strong> Deal 15 damage per x1 Mastery accumulated to everyone in the same zone.</p>
              <p><strong>Lightbringer:</strong> Heal 10 HP per x1 Mastery accumulated.</p>
              <p><strong>All-Seeing:</strong> Apply the status FOCUSED and LETHAL for the amount of Mastery accumulated as minutes.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cloudopedia;
