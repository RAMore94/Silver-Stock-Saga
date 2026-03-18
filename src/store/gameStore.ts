import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameState, Screen, WeekActivity, TournamentReport } from '../types'
import { STARTING_PLAYERS, STARTING_TEAM } from '../data/players'
import { INITIAL_TOURNAMENTS } from '../data/tournaments'
import { simulateTournament } from '../engine/tournamentSimulator'

interface GameStore extends GameState {
  setScreen: (screen: Screen) => void
  setPlayerActivity: (playerId: string, activity: WeekActivity) => void
  registerForTournament: (tournamentId: string, playerId: string) => void
  unregisterFromTournament: (tournamentId: string, playerId: string) => void
  dismissReport: () => void
  advanceWeek: () => void
  resetGame: () => void
}

function initialState(): GameState {
  return {
    team: STARTING_TEAM,
    players: STARTING_PLAYERS,
    tournaments: INITIAL_TOURNAMENTS,
    pastResults: [],
    pendingReport: null,
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

      registerForTournament: (tournamentId, playerId) =>
        set((state) => ({
          tournaments: state.tournaments.map((t) =>
            t.id === tournamentId && !t.registeredPlayers.includes(playerId)
              ? { ...t, registeredPlayers: [...t.registeredPlayers, playerId] }
              : t
          ),
          // Deduct entry fee immediately on registration
          team: {
            ...state.team,
            balance:
              state.team.balance -
              (state.tournaments.find((t) => t.id === tournamentId)?.entryFee ?? 0),
          },
        })),

      unregisterFromTournament: (tournamentId, playerId) =>
        set((state) => {
          const tournament = state.tournaments.find((t) => t.id === tournamentId)
          if (!tournament?.registeredPlayers.includes(playerId)) return state
          return {
            tournaments: state.tournaments.map((t) =>
              t.id === tournamentId
                ? { ...t, registeredPlayers: t.registeredPlayers.filter((id) => id !== playerId) }
                : t
            ),
            // Refund entry fee on unregister
            team: { ...state.team, balance: state.team.balance + (tournament?.entryFee ?? 0) },
          }
        }),

      dismissReport: () => set({ pendingReport: null }),

      advanceWeek: () => {
        const state = get()
        const nextWeek = state.team.week + 1

        // Apply weekly activity effects to each player
        let updatedPlayers = state.players.map((player) => {
          let { form, fatigue, stats } = player

          switch (player.weekActivity) {
            case 'train': {
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

        // Find tournaments happening this week with registered players
        const thisWeekTournaments = state.tournaments.filter(
          (t) => t.week === nextWeek && t.registeredPlayers.length > 0
        )

        let latestReport: TournamentReport | null = null
        let prizeEarned = 0
        const newPastResults = [...state.pastResults]

        for (const tournament of thisWeekTournaments) {
          const { report, fatigueCosts } = simulateTournament(tournament, updatedPlayers)
          latestReport = report

          // Apply tournament results to players
          updatedPlayers = updatedPlayers.map((player) => {
            const result = report.playerResults.find((r) => r.playerId === player.id)
            if (!result) return player

            const addedFatigue = fatigueCosts[player.id] ?? 0
            return {
              ...player,
              fatigue: Math.min(100, player.fatigue + addedFatigue),
              wins: player.wins + result.setsWon,
              losses: player.losses + result.setsLost,
              reputation: Math.min(100, player.reputation + result.repGained),
            }
          })

          // Accumulate prize money
          prizeEarned += report.playerResults.reduce((sum, r) => sum + r.prizeEarned, 0)

          // Store results on tournament for history
          newPastResults.push(
            ...report.playerResults.map((r) => ({
              playerId: r.playerId,
              placement: r.placement,
              prizeEarned: r.prizeEarned,
              setsWon: r.setsWon,
              setsLost: r.setsLost,
            }))
          )
        }

        // Deduct weekly salaries, add prize money
        const totalSalary = updatedPlayers.reduce((sum, p) => sum + p.salary, 0)
        const newBalance = state.team.balance - totalSalary + prizeEarned

        set({
          players: updatedPlayers,
          pastResults: newPastResults,
          pendingReport: latestReport,
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
