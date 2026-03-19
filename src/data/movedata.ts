/**
 * Per-character move data for SSBM simulation.
 *
 * For each character we list their key competitive moves covering:
 *   - neutral_tool   : safe move thrown out to fish for openings or control space
 *   - combo_starter  : initiates a damage sequence on hit
 *   - kill_move      : primary stock-ending options
 *   - edgeguard      : used to finish opponents recovering to the stage
 *   - oos_option     : out-of-shield punish (when shield > attack exchange wins)
 *   - grab_convert   : follow-up after a successful grab
 *
 * Damage values are clean-hit percentages from competitive SSBM frame data.
 * killPercent is center-stage approximate kill threshold; 999 = does not kill
 * at any realistic percent.
 *
 * Derived simulation values per character:
 *   avgDamagePerHit  - average across neutral + combo moves (weights attack exchange value)
 *   bestKillPercent  - lowest killPercent among kill_moves (how early they threaten stock)
 *   comboConvert     - 0–1, how reliably they extend into combos after landing a hit
 *
 * These three values are what the neutral phase engine (neutral.ts) uses.
 * The full keyMoves array is available for UI display (move charts screen, etc.)
 */

import type { Character } from '../types'

export type MoveCategory =
  | 'neutral_tool'
  | 'combo_starter'
  | 'kill_move'
  | 'edgeguard'
  | 'oos_option'
  | 'grab_convert'

export interface Move {
  name: string
  damage: number         // clean hit damage (%)
  killPercent: number    // opponent % at which this kills center stage; 999 = no kill
  category: MoveCategory
  notes?: string
}

export interface CharacterMoveProfile {
  character: Character
  keyMoves: Move[]
  // Derived — used directly in simulation engine
  avgDamagePerHit: number   // average damage when attack exchange wins
  bestKillPercent: number   // lowest killPercent among kill_move entries
  comboConvert: number      // 0–1, reliability of extending hits into combos
}

export const MOVE_DATA: CharacterMoveProfile[] = [
  {
    character: 'Fox',
    avgDamagePerHit: 9,
    bestKillPercent: 95,
    comboConvert: 0.82,
    keyMoves: [
      { name: 'SHFFL Nair',      damage: 9,  killPercent: 999, category: 'neutral_tool',  notes: '3 hits total; primary approach and combo starter' },
      { name: 'Shine (OOS)',      damage: 5,  killPercent: 999, category: 'oos_option',    notes: 'Frame 2 OOS, links into up-smash or more shine' },
      { name: 'Up-Smash',        damage: 18, killPercent: 105, category: 'kill_move',     notes: 'Frame 5, strong vertical kill; early in combos off shine' },
      { name: 'Forward Smash',   damage: 21, killPercent: 95,  category: 'kill_move',     notes: 'Fastest fsmash in game, kills horizontally' },
      { name: 'Back-Air',        damage: 13, killPercent: 135, category: 'edgeguard',     notes: 'Wall of pain tool and off-stage kill threat' },
      { name: 'Up-Air',          damage: 5,  killPercent: 999, category: 'combo_starter', notes: 'Combo extender in juggle strings; chains to itself' },
      { name: 'Down-Throw',      damage: 6,  killPercent: 999, category: 'grab_convert',  notes: 'Tech chase setup at low %, up-throw for juggle at mid' },
    ],
  },
  {
    character: 'Falco',
    avgDamagePerHit: 11,
    bestKillPercent: 92,
    comboConvert: 0.86,
    keyMoves: [
      { name: 'Laser',           damage: 3,  killPercent: 999, category: 'neutral_tool',  notes: 'Forces approach, stuns briefly; key pressure tool' },
      { name: 'SHFFL Nair',      damage: 10, killPercent: 999, category: 'combo_starter', notes: 'Main close-range combo starter' },
      { name: 'SHFFL Dair',      damage: 18, killPercent: 999, category: 'combo_starter', notes: 'Pillar combo setup; spiked hit ledge-guards' },
      { name: 'Shine',           damage: 5,  killPercent: 999, category: 'oos_option',    notes: 'Combo extender; links into dair or bair' },
      { name: 'Back-Air',        damage: 15, killPercent: 120, category: 'kill_move',     notes: 'Primary kill move; also edgeguard tool' },
      { name: 'Forward Smash',   damage: 20, killPercent: 92,  category: 'kill_move',     notes: 'Strong horizontal kill at mid-high %' },
      { name: 'Down-Throw',      damage: 6,  killPercent: 999, category: 'grab_convert',  notes: 'Chaingrab spacies at low %; pivot regrab' },
    ],
  },
  {
    character: 'Marth',
    avgDamagePerHit: 10,
    bestKillPercent: 82,
    comboConvert: 0.60,
    keyMoves: [
      { name: 'SHFFL Fair (tip)', damage: 12, killPercent: 125, category: 'neutral_tool',  notes: 'Wall of pain; tipper version kills near ledge' },
      { name: 'Down-Tilt',       damage: 9,  killPercent: 999, category: 'combo_starter', notes: 'Low-to-the-ground poke; launches into up-air or fair string' },
      { name: 'Up-Air',          damage: 11, killPercent: 130, category: 'combo_starter', notes: 'Combo extender; kills at very high % near top blast' },
      { name: 'Fsmash (tip)',     damage: 21, killPercent: 82,  category: 'kill_move',     notes: 'Strongest single hit in his kit; ledge-threatens well below 100%' },
      { name: 'Fair (tip)',       damage: 12, killPercent: 100, category: 'edgeguard',     notes: 'Tipper off-stage = early kill; sweetspot covers ledge snap' },
      { name: 'Back-Air',        damage: 13, killPercent: 130, category: 'edgeguard',     notes: 'Wall of pain extension; kills horizontally at high %' },
      { name: 'Down-Throw',      damage: 8,  killPercent: 999, category: 'grab_convert',  notes: 'Tech chase at all percents; leads to Ken Combo' },
    ],
  },
  {
    character: 'Sheik',
    avgDamagePerHit: 8,
    bestKillPercent: 112,
    comboConvert: 0.76,
    keyMoves: [
      { name: 'Needle (thrown)',  damage: 5,  killPercent: 999, category: 'neutral_tool',  notes: 'Multi-hit projectile; cancels into shield or approach' },
      { name: 'Up-Tilt',         damage: 7,  killPercent: 999, category: 'combo_starter', notes: 'Combo linchpin at low-mid %; strings into itself and fair' },
      { name: 'SHFFL Fair',      damage: 13, killPercent: 999, category: 'combo_starter', notes: '2 hits; links into grab or up-tilt' },
      { name: 'Back-Air',        damage: 12, killPercent: 130, category: 'kill_move',     notes: 'Primary edgeguard tool; kills at high % center' },
      { name: 'Forward Smash',   damage: 15, killPercent: 112, category: 'kill_move',     notes: 'Reliable kill move once grab game establishes percent' },
      { name: 'Up-Smash',        damage: 14, killPercent: 110, category: 'oos_option',    notes: 'Strong OOS; multihit, kills vertically' },
      { name: 'Down-Throw',      damage: 5,  killPercent: 999, category: 'grab_convert',  notes: 'Chaingrabs spacies on FD; leads to tech chase/juggle on others' },
    ],
  },
  {
    character: 'Jigglypuff',
    avgDamagePerHit: 12,
    bestKillPercent: 0,  // Rest kills at any percent on clean hit
    comboConvert: 0.53,
    keyMoves: [
      { name: 'Back-Air',        damage: 14, killPercent: 100, category: 'neutral_tool',  notes: 'Wall of pain; long-lasting hitbox; primary spacing tool' },
      { name: 'Forward-Air',     damage: 12, killPercent: 120, category: 'neutral_tool',  notes: 'Wall of pain extension; kills at high % near ledge' },
      { name: 'Up-Air',          damage: 11, killPercent: 140, category: 'combo_starter', notes: 'Juggle tool; platforms extend combo window' },
      { name: 'Rest',            damage: 35, killPercent: 0,   category: 'kill_move',     notes: 'Kills at any %; punishes airdodge, shield, and whiffed moves near Puff' },
      { name: 'Pound',           damage: 12, killPercent: 140, category: 'kill_move',     notes: 'Horizontal kill; also used as edgeguard off-stage' },
      { name: 'Back-Air (edge)', damage: 14, killPercent: 70,  category: 'edgeguard',     notes: 'At ledge removes stage; kills much earlier off-stage than center' },
      { name: 'Up-Throw',        damage: 8,  killPercent: 999, category: 'grab_convert',  notes: 'Positions opponent above for up-air/bair follow-up' },
    ],
  },
  {
    character: 'Peach',
    avgDamagePerHit: 11,
    bestKillPercent: 98,
    comboConvert: 0.62,
    keyMoves: [
      { name: 'Float Nair',      damage: 11, killPercent: 999, category: 'neutral_tool',  notes: 'Float-cancelled; applies pressure and starts combos at low %' },
      { name: 'Float Fair',      damage: 13, killPercent: 120, category: 'combo_starter', notes: 'Multi-hit float cancel; leads into grab or more aerials' },
      { name: 'Turnip',          damage: 9,  killPercent: 999, category: 'neutral_tool',  notes: 'Average turnip; beam sword/Mr. Saturn variants can spike or combo' },
      { name: 'Back-Air',        damage: 16, killPercent: 105, category: 'kill_move',     notes: 'Sweetspot bair is one of the strongest in the game; kills early' },
      { name: 'Down-Smash',      damage: 14, killPercent: 115, category: 'oos_option',    notes: 'Very fast OOS; hits both sides; semi-spike hit on back' },
      { name: 'Up-Smash',        damage: 15, killPercent: 98,  category: 'kill_move',     notes: 'Strong vertical kill; difficult to land but devastating' },
      { name: 'Down-Throw',      damage: 10, killPercent: 999, category: 'grab_convert',  notes: 'Consistent float fair follow-up at low-mid %; leads to combos' },
    ],
  },
  {
    character: 'Captain Falcon',
    avgDamagePerHit: 13,
    bestKillPercent: 88,
    comboConvert: 0.72,
    keyMoves: [
      { name: 'SHFFL Nair',      damage: 9,  killPercent: 999, category: 'neutral_tool',  notes: 'Multi-hit; starts combos and covers landing options' },
      { name: 'Stomp (Dair)',     damage: 18, killPercent: 999, category: 'combo_starter', notes: 'Into Knee at mid % = combo kill; spike hitbox off-stage' },
      { name: 'Raptor Boost',     damage: 12, killPercent: 999, category: 'combo_starter', notes: 'Combo starter on grounded opponents; unsafe on shield' },
      { name: 'Knee (Fair)',      damage: 18, killPercent: 95,  category: 'kill_move',     notes: 'Sweetspot knee; one of the most iconic kill moves in SSBM' },
      { name: 'Up-Smash',        damage: 22, killPercent: 88,  category: 'kill_move',     notes: 'Early kill option; can punish out of combos' },
      { name: 'Back-Air',        damage: 16, killPercent: 120, category: 'edgeguard',     notes: 'Strong off-stage; long-lasting hitbox' },
      { name: 'Down-Throw',      damage: 8,  killPercent: 999, category: 'grab_convert',  notes: 'Tech chase into stomp or knee at mid %' },
    ],
  },
  {
    character: 'Ice Climbers',
    avgDamagePerHit: 13,
    bestKillPercent: 0,  // Handoff near ledge = near-guaranteed kill regardless of %
    comboConvert: 0.92,
    keyMoves: [
      { name: 'Blizzard',        damage: 8,  killPercent: 999, category: 'neutral_tool',  notes: 'Desynced blizzard creates grab opportunity on freeze' },
      { name: 'SHFFL Nair',      damage: 11, killPercent: 999, category: 'combo_starter', notes: 'Sets up grab follow-up or desynced follow-on' },
      { name: 'Handoff (grab)',   damage: 0,  killPercent: 0,   category: 'grab_convert',  notes: 'Chain grab into near-0-death; opponent gets directional mixup escape near ledge' },
      { name: 'Desynced Fsmash', damage: 28, killPercent: 75,  category: 'kill_move',     notes: '2 smashes at once; kills extremely early when both connect' },
      { name: 'Desynced Up-Smash', damage: 20, killPercent: 85, category: 'kill_move',   notes: 'ICs iconic kill confirm; desynced version covers vertically' },
      { name: 'Back-Air',        damage: 15, killPercent: 125, category: 'edgeguard',     notes: 'Desynced bairs cover ledge snap and recovery angle' },
      { name: 'Up-Throw',        damage: 7,  killPercent: 999, category: 'grab_convert',  notes: 'Sets up for juggle and pummels if synced' },
    ],
  },
  {
    character: 'Pikachu',
    avgDamagePerHit: 10,
    bestKillPercent: 100,
    comboConvert: 0.65,
    keyMoves: [
      { name: 'SHFFL Nair',      damage: 9,  killPercent: 999, category: 'neutral_tool',  notes: 'Quick multi-hit aerial; combos into jab or grab' },
      { name: 'Up-Tilt',         damage: 8,  killPercent: 999, category: 'combo_starter', notes: 'Links into itself and up-air; core combo piece' },
      { name: 'Up-Air',          damage: 10, killPercent: 130, category: 'combo_starter', notes: 'Juggle tool; kills at high % near ceiling' },
      { name: 'Thunder',         damage: 14, killPercent: 110, category: 'kill_move',     notes: 'Thunderbolt hits opponent into the cloud; kills at mid-high %' },
      { name: 'Up-Smash',        damage: 15, killPercent: 100, category: 'kill_move',     notes: 'Quick up-smash; primary vertical kill confirm' },
      { name: 'Forward Smash',   damage: 17, killPercent: 108, category: 'kill_move',     notes: 'Charged version kills at lower %' },
      { name: 'Down-Throw',      damage: 7,  killPercent: 999, category: 'grab_convert',  notes: 'Tumble animation leads to up-smash or re-grab' },
    ],
  },
  {
    character: 'Samus',
    avgDamagePerHit: 12,
    bestKillPercent: 88,
    comboConvert: 0.48,
    keyMoves: [
      { name: 'Charge Shot (full)', damage: 26, killPercent: 88, category: 'neutral_tool', notes: 'Highest single-hit projectile damage; forces reactions' },
      { name: 'Missile',          damage: 8,  killPercent: 999, category: 'neutral_tool',  notes: 'Homing and super variants; control space and approach paths' },
      { name: 'SHFFL Nair',       damage: 10, killPercent: 999, category: 'combo_starter', notes: 'Multi-hit; best combo starter at close range' },
      { name: 'Back-Air',         damage: 16, killPercent: 105, category: 'kill_move',     notes: 'Long-lasting; kills and edgeguards reliably' },
      { name: 'Forward Smash',    damage: 22, killPercent: 92,  category: 'kill_move',     notes: 'Tipper variant; powerful but telegraphed' },
      { name: 'Down-Smash',       damage: 18, killPercent: 110, category: 'oos_option',    notes: 'Semi-spike sends at awkward angle for off-stage edgeguard' },
      { name: 'Down-Throw',       damage: 9,  killPercent: 999, category: 'grab_convert',  notes: 'Percent accumulation; leads to aerial or tech chase' },
    ],
  },
  {
    character: 'Luigi',
    avgDamagePerHit: 11,
    bestKillPercent: 83,
    comboConvert: 0.70,
    keyMoves: [
      { name: 'SHFFL Nair',      damage: 13, killPercent: 999, category: 'neutral_tool',  notes: 'Low friction on landing enables extended pressure strings' },
      { name: 'Grab → Pummel',   damage: 3,  killPercent: 999, category: 'grab_convert',  notes: 'Accumulates percent quickly; down-throw leads to tech chases' },
      { name: 'Back-Air',        damage: 15, killPercent: 120, category: 'kill_move',     notes: 'Strong bair; kills at mid-high % and edgeguards well' },
      { name: 'Forward Smash',   damage: 22, killPercent: 83,  category: 'kill_move',     notes: 'Strongest fsmash in game by damage; kills very early' },
      { name: 'Super Jump Punch', damage: 1,  killPercent: 999, category: 'oos_option',    notes: 'Near-instantaneous OOS; leads to 60%+ ladder combo near wall' },
      { name: 'Down-Throw',      damage: 10, killPercent: 999, category: 'grab_convert',  notes: 'Tech chase sets; or up-air juggle combo' },
      { name: 'Wavedash Grab',   damage: 0,  killPercent: 999, category: 'combo_starter', notes: 'Luigi wavedash is among longest; extends grab range substantially' },
    ],
  },
  {
    character: 'Young Link',
    avgDamagePerHit: 9,
    bestKillPercent: 108,
    comboConvert: 0.56,
    keyMoves: [
      { name: 'Arrow',           damage: 6,  killPercent: 999, category: 'neutral_tool',  notes: 'Controls space; charged version accumulates damage' },
      { name: 'SHFFL Nair',      damage: 9,  killPercent: 999, category: 'neutral_tool',  notes: 'Multi-hit; approach and combo starter' },
      { name: 'SHFFL Fair',      damage: 11, killPercent: 130, category: 'combo_starter', notes: 'Can link into grab or another aerial; edgeguard tool' },
      { name: 'Back-Air',        damage: 13, killPercent: 118, category: 'kill_move',     notes: 'Primary kill move; kills at mid-high %' },
      { name: 'Forward Smash',   damage: 15, killPercent: 108, category: 'kill_move',     notes: '3 hit, but typically 1-2 connect; kills reliably' },
      { name: 'Bomb',            damage: 5,  killPercent: 999, category: 'neutral_tool',  notes: 'Unique edgeguard and combo tool; bomb into bair strings' },
      { name: 'Down-Throw',      damage: 7,  killPercent: 999, category: 'grab_convert',  notes: 'Leads to up-air or up-smash at low-mid %' },
    ],
  },
  {
    character: 'Dr. Mario',
    avgDamagePerHit: 11,
    bestKillPercent: 88,
    comboConvert: 0.65,
    keyMoves: [
      { name: 'SHFFL Nair',      damage: 11, killPercent: 999, category: 'neutral_tool',  notes: 'High damage multi-hit; superior to Mario nair' },
      { name: 'Megavitamin',     damage: 6,  killPercent: 999, category: 'neutral_tool',  notes: 'Faster fall than Mario fireball; combo setup at close range' },
      { name: 'SHFFL Fair',      damage: 14, killPercent: 999, category: 'combo_starter', notes: 'Cape-style; leads into up-smash or bair' },
      { name: 'Back-Air',        damage: 15, killPercent: 112, category: 'kill_move',     notes: 'Superior to Mario bair; kills earlier and more damage' },
      { name: 'Forward Smash',   damage: 20, killPercent: 88,  category: 'kill_move',     notes: 'Strong fsmash; kills earlier than most mid-tiers' },
      { name: 'Up-Smash',        damage: 15, killPercent: 100, category: 'oos_option',    notes: 'Solid OOS punish; hits on multiple angles' },
      { name: 'Down-Throw',      damage: 8,  killPercent: 999, category: 'grab_convert',  notes: 'Tech chase into up-smash or bair string' },
    ],
  },
  {
    character: 'Ganondorf',
    avgDamagePerHit: 17,
    bestKillPercent: 78,
    comboConvert: 0.40,
    keyMoves: [
      { name: 'SHFFL Nair',      damage: 14, killPercent: 140, category: 'neutral_tool',  notes: 'Long-lasting hitbox; kills at high % but hard to land' },
      { name: 'Forward-Air',     damage: 18, killPercent: 85,  category: 'kill_move',     notes: '"Death punch"; one of the strongest aerials in the game' },
      { name: 'Back-Air',        damage: 19, killPercent: 78,  category: 'kill_move',     notes: 'Primary kill move; massive knockback especially near ledge' },
      { name: 'Up-Smash',        damage: 26, killPercent: 80,  category: 'kill_move',     notes: 'Enormous damage; kills very early vertically' },
      { name: 'Down-Air (Stomp)',damage: 19, killPercent: 999, category: 'combo_starter', notes: 'Sends opponent downward; Ganondorf Stomp → tech chase' },
      { name: 'Warlock Punch',   damage: 35, killPercent: 40,  category: 'kill_move',     notes: 'Kills at absurdly low % but frames 43 startup; gimmick punish' },
      { name: 'Down-Throw',      damage: 12, killPercent: 999, category: 'grab_convert',  notes: 'Leads to tech chase; high grab damage accumulates fast' },
    ],
  },
  {
    character: 'Donkey Kong',
    avgDamagePerHit: 13,
    bestKillPercent: 80,
    comboConvert: 0.42,
    keyMoves: [
      { name: 'Back-Air',        damage: 15, killPercent: 115, category: 'neutral_tool',  notes: 'Great reach; primary spacing and edgeguard tool; long-lasting' },
      { name: 'Up-Tilt',         damage: 10, killPercent: 999, category: 'combo_starter', notes: 'Surprisingly effective; juggles and leads to up-air at low-mid %' },
      { name: 'Forward-Air',     damage: 15, killPercent: 115, category: 'combo_starter', notes: 'Windbox + hit; can kill near ledge' },
      { name: 'Giant Punch (full)', damage: 27, killPercent: 80, category: 'kill_move',   notes: 'Stored charge; one of highest raw damage single hits; kills early near ledge' },
      { name: 'Forward Smash',   damage: 22, killPercent: 90,  category: 'kill_move',     notes: 'Enormous hitbox; kills early but heavily telegraphed' },
      { name: 'Down-Air',        damage: 16, killPercent: 999, category: 'combo_starter', notes: 'Fast startup for his size; leads to follow-ups at low %' },
      { name: 'Headbutt (Dspec)',damage: 20, killPercent: 999, category: 'combo_starter', notes: 'Buries opponent; almost free follow-up if grounded' },
      { name: 'Cargo Throw',     damage: 0,  killPercent: 0,   category: 'grab_convert',  notes: 'Carry opponent to ledge; near-guaranteed kill setup at any %' },
    ],
  },
]

/**
 * Look up a character's move profile. Falls back to a neutral placeholder
 * if data is missing (shouldn't happen with complete table above).
 */
export function getMoveProfile(character: Character): CharacterMoveProfile {
  const profile = MOVE_DATA.find((m) => m.character === character)
  if (profile) return profile
  return {
    character,
    keyMoves: [],
    avgDamagePerHit: 10,
    bestKillPercent: 110,
    comboConvert: 0.55,
  }
}

/**
 * Returns the character-specific attack exchange value for the neutral engine.
 * Combines average damage output and combo conversion rate relative to a
 * baseline of 10% avg / 0.60 convert = 1.0 value.
 * The kill power term (200 / bestKillPercent) rewards characters who kill earlier.
 * Clamped to [0.5, 2.2] to prevent extreme outliers from dominating.
 */
export function characterAttackValue(character: Character): number {
  const p = getMoveProfile(character)
  const damageFactor = p.avgDamagePerHit / 10
  const comboFactor = p.comboConvert / 0.60
  // Kill power: characters who kill earlier get a bonus; cap bestKillPercent floor at 30
  // to handle edge cases like Rest (0%) and Cargo Throw (0%)
  const killPower = 130 / Math.max(30, p.bestKillPercent)
  const raw = damageFactor * comboFactor * killPower
  return Math.max(0.5, Math.min(2.2, raw))
}
