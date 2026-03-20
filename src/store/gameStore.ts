import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameState, Screen, WeekActivity, TournamentReport, LedgerEntry, Player } from '../types'
import { STARTING_PLAYERS, STARTING_TEAM } from '../data/players'
import { INITIAL_TOURNAMENTS } from '../data/tournaments'
import { INITIAL_FREE_AGENTS } from '../data/freeAgents'
import { SPONSORS } from '../data/sponsors'
import { simulateTournament } from '../engine/tournamentSimulator'
import { computeRankings } from '../engine/ranking'

interface GameStore extends GameState {
  setScreen: (screen: Screen) => void
  setPlayerActivity: (playerId: string, activity: WeekActivity) => void
  registerForTournament: (tournamentId: string, playerId: string) => void
  unregisterFromTournament: (tournamentId: string, playerId: string) => void
  dismissReport: () => void
  advanceWeek: () => void
  resetGame: () => void
  // Market
  signFreeAgent: (agentId: string) => void
  releasePlayer: (playerId: string) => void
  // Sponsorships
  signSponsor: (sponsorId: string) => void
  dropSponsor: (sponsorId: string) => void
}

function initialState(): GameState {
  return {
    team: STARTING_TEAM,
    players: STARTING_PLAYERS,
    freeAgents: INITIAL_FREE_AGENTS,
    activeSponsors: [],
    tournaments: INITIAL_TOURNAMENTS,
    pastResults: [],
    rankings: [],
    pendingReport: null,
    screen: 'dashboard',
    ledger: [],
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
        set((state) => {
          const tournament = state.tournaments.find((t) => t.id === tournamentId)
          if (!tournament || tournament.registeredPlayers.includes(playerId)) return state
          const player = state.players.find((p) => p.id === playerId)
          const entry: LedgerEntry = {
            week: state.team.week,
            type: 'entry_fee',
            amount: -tournament.entryFee,
            description: `Entry fee — ${player?.tag ?? playerId} @ ${tournament.name}`,
          }
          return {
            tournaments: state.tournaments.map((t) =>
              t.id === tournamentId
                ? { ...t, registeredPlayers: [...t.registeredPlayers, playerId] }
                : t
            ),
            team: { ...state.team, balance: state.team.balance - tournament.entryFee },
            ledger: [...state.ledger, entry],
          }
        }),

      unregisterFromTournament: (tournamentId, playerId) =>
        set((state) => {
          const tournament = state.tournaments.find((t) => t.id === tournamentId)
          if (!tournament?.registeredPlayers.includes(playerId)) return state
          const player = state.players.find((p) => p.id === playerId)
          const entry: LedgerEntry = {
            week: state.team.week,
            type: 'refund',
            amount: tournament.entryFee,
            description: `Refund — ${player?.tag ?? playerId} @ ${tournament.name}`,
          }
          return {
            tournaments: state.tournaments.map((t) =>
              t.id === tournamentId
                ? { ...t, registeredPlayers: t.registeredPlayers.filter((id) => id !== playerId) }
                : t
            ),
            team: { ...state.team, balance: state.team.balance + tournament.entryFee },
            ledger: [...state.ledger, entry],
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
              stats = { ...stats, [weakStat]: Math.min(99, stats[weakStat] + 2) }
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
        const newLedgerEntries: LedgerEntry[] = []

        // Track which tournaments get results written back
        let updatedTournaments = [...state.tournaments]

        for (const tournament of thisWeekTournaments) {
          const { report, fatigueCosts, tournamentResults } = simulateTournament(
            tournament,
            updatedPlayers,
            state.rankings,
          )
          latestReport = report

          // Apply tournament results to players
          updatedPlayers = updatedPlayers.map((player) => {
            const result = report.playerResults.find((r) => r.playerId === player.id)
            if (!result) return player
            return {
              ...player,
              fatigue: Math.min(100, player.fatigue + (fatigueCosts[player.id] ?? 0)),
              wins: player.wins + result.setsWon,
              losses: player.losses + result.setsLost,
              reputation: Math.min(100, player.reputation + result.repGained),
            }
          })

          // Record prize earnings in the ledger
          for (const result of report.playerResults) {
            if (result.prizeEarned > 0) {
              const player = updatedPlayers.find((p) => p.id === result.playerId)
              const ordinal =
                result.placement === 1 ? '1st' :
                result.placement === 2 ? '2nd' :
                result.placement === 3 ? '3rd' :
                `${result.placement}th`
              newLedgerEntries.push({
                week: nextWeek,
                type: 'prize',
                amount: result.prizeEarned,
                description: `Prize — ${player?.tag ?? result.playerId} placed ${ordinal} @ ${tournament.name}`,
              })
            }
          }

          prizeEarned += report.playerResults.reduce((sum, r) => sum + r.prizeEarned, 0)
          newPastResults.push(...tournamentResults)

          // Write results back onto the tournament object for ranking calculations
          updatedTournaments = updatedTournaments.map((t) =>
            t.id === tournament.id
              ? { ...t, results: [...(t.results ?? []), ...tournamentResults] }
              : t
          )
        }

        const totalSalary = updatedPlayers.reduce((sum, p) => sum + p.salary, 0)

        // Record salary deduction
        newLedgerEntries.push({
          week: nextWeek,
          type: 'salary',
          amount: -totalSalary,
          description: `Weekly salaries — ${updatedPlayers.length} players`,
        })

        // Sponsor income
        let sponsorIncome = 0
        for (const sponsorId of state.activeSponsors) {
          const sponsor = SPONSORS.find((s) => s.id === sponsorId)
          if (!sponsor) continue
          sponsorIncome += sponsor.weeklyIncome
          newLedgerEntries.push({
            week: nextWeek,
            type: 'sponsor',
            amount: sponsor.weeklyIncome,
            description: `Sponsor income — ${sponsor.name}`,
          })
        }

        const newBalance = state.team.balance - totalSalary + prizeEarned + sponsorIncome

        // Recompute rankings with updated tournament results
        const newRankings = computeRankings(
          updatedPlayers,
          updatedTournaments,
          nextWeek,
          state.rankings,
        )

        set({
          players: updatedPlayers,
          pastResults: newPastResults,
          tournaments: updatedTournaments,
          rankings: newRankings,
          pendingReport: latestReport,
          team: { ...state.team, week: nextWeek, balance: newBalance },
          ledger: [...state.ledger, ...newLedgerEntries],
        })
      },

      resetGame: () => set(initialState()),

      signFreeAgent: (agentId) =>
        set((state) => {
          if (state.players.length >= 5) return state
          const agent = state.freeAgents.find((a) => a.id === agentId)
          if (!agent) return state
          if (state.team.balance < agent.salaryAsk * 4) return state
          const newPlayer: Player = {
            id: agent.id,
            name: agent.name,
            tag: agent.tag,
            character: agent.character,
            stats: agent.stats,
            form: agent.form,
            fatigue: agent.fatigue,
            salary: agent.salaryAsk,
            weekActivity: 'train',
            wins: 0,
            losses: 0,
            reputation: agent.reputation,
          }
          return {
            players: [...state.players, newPlayer],
            freeAgents: state.freeAgents.filter((a) => a.id !== agentId),
          }
        }),

      releasePlayer: (playerId) =>
        set((state) => {
          if (state.players.length <= 1) return state
          return {
            players: state.players.filter((p) => p.id !== playerId),
          }
        }),

      signSponsor: (sponsorId) =>
        set((state) => {
          if (state.activeSponsors.length >= 2) return state
          if (state.activeSponsors.includes(sponsorId)) return state
          const sponsor = SPONSORS.find((s) => s.id === sponsorId)
          if (!sponsor || state.team.reputation < sponsor.repRequired) return state
          return { activeSponsors: [...state.activeSponsors, sponsorId] }
        }),

      dropSponsor: (sponsorId) =>
        set((state) => ({
          activeSponsors: state.activeSponsors.filter((id) => id !== sponsorId),
        })),
    }),
    {
      name: 'silver-stock-saga-save',
      version: 3,
      migrate: (persisted: unknown, fromVersion: number) => {
        const state = persisted as Partial<GameState>
        if (fromVersion < 2) {
          return { ...state, ledger: state.ledger ?? [], freeAgents: INITIAL_FREE_AGENTS, activeSponsors: [] }
        }
        if (fromVersion < 3) {
          return { ...state, freeAgents: state.freeAgents ?? INITIAL_FREE_AGENTS, activeSponsors: state.activeSponsors ?? [] }
        }
        return state
      },
    }
  )
)
