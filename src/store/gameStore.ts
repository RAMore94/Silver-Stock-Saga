import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameState, Screen, WeekActivity } from '../types'
import { STARTING_PLAYERS, STARTING_TEAM } from '../data/players'
import { INITIAL_TOURNAMENTS } from '../data/tournaments'

interface GameStore extends GameState {
  setScreen: (screen: Screen) => void
  setPlayerActivity: (playerId: string, activity: WeekActivity) => void
  advanceWeek: () => void
  resetGame: () => void
}

function initialState(): GameState {
  return {
    team: STARTING_TEAM,
    players: STARTING_PLAYERS,
    tournaments: INITIAL_TOURNAMENTS,
    pastResults: [],
    screen: 'dashboard',
  }
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState(),

      setScreen: (screen) => set({ screen }),

      setPlayerActivity: (playerId, activity) =>
        set((state) => ({
          players: state.players.map((p) =>
            p.id === playerId ? { ...p, weekActivity: activity } : p
          ),
        })),

      advanceWeek: () => {
        const state = get()
        const nextWeek = state.team.week + 1

        // Apply weekly activity effects to each player
        const updatedPlayers = state.players.map((player) => {
          let { form, fatigue, stats } = player

          switch (player.weekActivity) {
            case 'train': {
              // Training improves weakest stat slightly, costs fatigue
              const weakStat = (
                Object.entries(stats) as [keyof typeof stats, number][]
              ).sort(([, a], [, b]) => a - b)[0][0]
              fatigue = Math.min(100, fatigue + 15)
              form = Math.max(0, form - 5)
              stats = {
                ...stats,
                [weakStat]: Math.min(99, stats[weakStat] + 2),
              }
              break
            }
            case 'rest':
              fatigue = Math.max(0, fatigue - 25)
              form = Math.min(100, form + 8)
              break
            case 'local':
              fatigue = Math.min(100, fatigue + 8)
              form = Math.min(100, form + 3)
              break
            case 'prep':
              fatigue = Math.min(100, fatigue + 5)
              form = Math.min(100, form + 5)
              break
          }

          return { ...player, form, fatigue, stats, weekActivity: 'train' as WeekActivity }
        })

        // Deduct weekly salaries
        const totalSalary = updatedPlayers.reduce((sum, p) => sum + p.salary, 0)
        const newBalance = state.team.balance - totalSalary

        set({
          players: updatedPlayers,
          team: { ...state.team, week: nextWeek, balance: newBalance },
        })
      },

      resetGame: () => set(initialState()),
    }),
    {
      name: 'silver-stock-saga-save',
    }
  )
)
