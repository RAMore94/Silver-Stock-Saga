import type { Sponsor } from '../types'

// Sponsor pool — unlock deals as team reputation grows.
// Up to 2 sponsors can be active at any time.
// Weekly income is applied each time the week advances.

export const SPONSORS: Sponsor[] = [
  // ── Bronze (rep 0+) ──────────────────────────────────────────────────────
  {
    id: 'sp1',
    name: 'Pixel Rush Energy',
    tier: 'bronze',
    repRequired: 0,
    weeklyIncome: 200,
    description: 'Entry-level energy drink brand looking to break into esports. Small but steady.',
    color: '#d4a832',
  },
  {
    id: 'sp2',
    name: 'Keystone Peripherals',
    tier: 'bronze',
    repRequired: 0,
    weeklyIncome: 150,
    description: 'Budget gaming peripherals maker. They supply controllers and cables.',
    color: '#8a9ab0',
  },

  // ── Silver (rep 25+) ─────────────────────────────────────────────────────
  {
    id: 'sp3',
    name: 'NovaDrive Gaming',
    tier: 'silver',
    repRequired: 25,
    weeklyIncome: 500,
    description: 'Mid-range gaming chairs and monitors. Strong regional presence.',
    color: '#6b9bd2',
  },
  {
    id: 'sp4',
    name: 'StreamForge',
    tier: 'silver',
    repRequired: 25,
    weeklyIncome: 400,
    description: 'Streaming platform eager to sponsor competitive Melee content.',
    color: '#7a5aaa',
  },

  // ── Gold (rep 45+) ───────────────────────────────────────────────────────
  {
    id: 'sp5',
    name: 'Apex Hardware',
    tier: 'gold',
    repRequired: 45,
    weeklyIncome: 1000,
    description: 'Premium gaming hardware brand. Serious investment in top-performing teams.',
    color: '#c97050',
  },
  {
    id: 'sp6',
    name: 'Valor Esports Fund',
    tier: 'gold',
    repRequired: 45,
    weeklyIncome: 900,
    description: 'Investor fund backing high-potential esports orgs. Reputation-driven.',
    color: '#5b9e8a',
  },

  // ── Platinum (rep 65+) ───────────────────────────────────────────────────
  {
    id: 'sp7',
    name: 'Titan Energy',
    tier: 'platinum',
    repRequired: 65,
    weeklyIncome: 2000,
    description: 'Major energy drink with a history of backing championship-caliber teams.',
    color: '#c04030',
  },
  {
    id: 'sp8',
    name: 'CoreLogic Systems',
    tier: 'platinum',
    repRequired: 65,
    weeklyIncome: 1800,
    description: 'PC hardware giant. Massive exposure deal for elite competitive organizations.',
    color: '#3060a0',
  },
]
