import type { Character } from '../types'

export interface CharacterMeta {
  name: Character
  tier: 'S' | 'A' | 'B' | 'C'
  // Stat affinity modifiers (added to effective stat during sim, -10 to +10)
  affinities: {
    execution: number
    neutral: number
    mental: number
    adaptability: number
  }
  color: string // tailwind color class for UI accents
}

export const CHARACTERS: CharacterMeta[] = [
  {
    name: 'Fox',
    tier: 'S',
    affinities: { execution: 10, neutral: 5, mental: -5, adaptability: 0 },
    color: '#c9a84c',
  },
  {
    name: 'Falco',
    tier: 'S',
    affinities: { execution: 8, neutral: 3, mental: -3, adaptability: 2 },
    color: '#7aafd4',
  },
  {
    name: 'Marth',
    tier: 'S',
    affinities: { execution: 2, neutral: 10, mental: 5, adaptability: 3 },
    color: '#7aaa7a',
  },
  {
    name: 'Sheik',
    tier: 'S',
    affinities: { execution: 5, neutral: 8, mental: 5, adaptability: 2 },
    color: '#8a6a8a',
  },
  {
    name: 'Jigglypuff',
    tier: 'S',
    affinities: { execution: -2, neutral: 5, mental: 10, adaptability: 8 },
    color: '#d4a0b0',
  },
  {
    name: 'Peach',
    tier: 'A',
    affinities: { execution: 3, neutral: 6, mental: 8, adaptability: 5 },
    color: '#e8a0a0',
  },
  {
    name: 'Captain Falcon',
    tier: 'A',
    affinities: { execution: 6, neutral: 4, mental: 2, adaptability: 4 },
    color: '#c97050',
  },
  {
    name: 'Ice Climbers',
    tier: 'A',
    affinities: { execution: 12, neutral: 2, mental: -2, adaptability: -3 },
    color: '#90c0d0',
  },
  {
    name: 'Pikachu',
    tier: 'B',
    affinities: { execution: 4, neutral: 3, mental: 3, adaptability: 6 },
    color: '#d4c840',
  },
  {
    name: 'Samus',
    tier: 'B',
    affinities: { execution: 0, neutral: 5, mental: 6, adaptability: 4 },
    color: '#b09040',
  },
  {
    name: 'Luigi',
    tier: 'B',
    affinities: { execution: 5, neutral: 2, mental: 4, adaptability: 7 },
    color: '#60a060',
  },
  {
    name: 'Young Link',
    tier: 'B',
    affinities: { execution: 3, neutral: 4, mental: 2, adaptability: 5 },
    color: '#7aaa7a',
  },
  {
    name: 'Dr. Mario',
    tier: 'C',
    affinities: { execution: 2, neutral: 3, mental: 4, adaptability: 3 },
    color: '#b0b0d0',
  },
  {
    name: 'Ganondorf',
    tier: 'C',
    affinities: { execution: -5, neutral: 3, mental: 8, adaptability: 2 },
    color: '#805080',
  },
]

export function getCharacterMeta(name: Character): CharacterMeta {
  return CHARACTERS.find((c) => c.name === name)!
}
