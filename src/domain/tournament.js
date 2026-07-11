export const STORAGE_KEY = 'lazada-mundialista:v1'
export const PENALTY_TIME_SECONDS = 60
export const ROUND_DEFINITIONS = [
  { name: 'Ronda de 32', shortName: 'R32', count: 16 },
  { name: 'Octavos', shortName: 'OCT', count: 8 },
  { name: 'Cuartos', shortName: 'C4', count: 4 },
  { name: 'Semifinal', shortName: 'SF', count: 2 },
  { name: 'Final', shortName: 'F', count: 1 },
]

const emptyRun = () => ({ time: '', noTime: false })
const emptyScore = () => ({
  a: [emptyRun(), emptyRun(), emptyRun()],
  b: [emptyRun(), emptyRun(), emptyRun()],
  winnerId: null,
  completedAt: null,
})

const createTeam = (index) => ({
  id: `team-${index + 1}`,
  name: `Pareja ${String(index + 1).padStart(2, '0')}`,
  header: '',
  heeler: '',
})

export function createTournament() {
  const teams = Array.from({ length: 32 }, (_, index) => createTeam(index))
  const rounds = ROUND_DEFINITIONS.map((round, roundIndex) => ({
    ...round,
    matches: Array.from({ length: round.count }, (_, matchIndex) => ({
      id: `r${roundIndex}-m${matchIndex}`,
      roundIndex,
      matchIndex,
      teamAId: roundIndex === 0 ? teams[matchIndex * 2].id : null,
      teamBId: roundIndex === 0 ? teams[matchIndex * 2 + 1].id : null,
      score: emptyScore(),
    })),
  }))

  return {
    schemaVersion: 1,
    event: {
      name: 'Lazada Mundialista',
      venue: '',
      date: '',
    },
    teams,
    rounds,
    updatedAt: new Date().toISOString(),
  }
}

export function isRunComplete(run) {
  if (run?.noTime) return true
  const time = Number(run?.time)
  return Number.isFinite(time) && time > 0
}

export function getTeamTotal(runs) {
  if (!runs.every(isRunComplete)) return null
  return runs.reduce(
    (total, run) => total + (run.noTime ? PENALTY_TIME_SECONDS : Number(run.time)),
    0,
  )
}

export function formatTotal(total) {
  if (total === null) return '—'
  return total.toFixed(2)
}

export function getAutomaticWinnerId(match) {
  const totalA = getTeamTotal(match.score.a)
  const totalB = getTeamTotal(match.score.b)
  if (totalA === null || totalB === null || totalA === totalB) return null
  return totalA < totalB ? match.teamAId : match.teamBId
}

export function isMatchComplete(match) {
  return Boolean(match.score.winnerId && match.score.completedAt)
}

export function isMatchReady(match) {
  return Boolean(match.teamAId && match.teamBId)
}

export function areAllRunsComplete(match) {
  return [...match.score.a, ...match.score.b].every(isRunComplete)
}

export function resetMatch(match) {
  return { ...match, score: emptyScore() }
}

export function recalculateBracket(tournament) {
  const next = structuredClone(tournament)

  for (let roundIndex = 1; roundIndex < next.rounds.length; roundIndex += 1) {
    const previousMatches = next.rounds[roundIndex - 1].matches
    next.rounds[roundIndex].matches = next.rounds[roundIndex].matches.map((match, index) => {
      const expectedA = previousMatches[index * 2]?.score.winnerId ?? null
      const expectedB = previousMatches[index * 2 + 1]?.score.winnerId ?? null
      const participantChanged = match.teamAId !== expectedA || match.teamBId !== expectedB
      const updated = { ...match, teamAId: expectedA, teamBId: expectedB }
      return participantChanged ? resetMatch(updated) : updated
    })
  }

  next.updatedAt = new Date().toISOString()
  return next
}

export function findTeam(tournament, teamId) {
  return tournament.teams.find((team) => team.id === teamId) ?? null
}

export function findMatch(tournament, matchId) {
  for (const round of tournament.rounds) {
    const match = round.matches.find((candidate) => candidate.id === matchId)
    if (match) return match
  }
  return null
}

function normalizeRun(run) {
  return {
    time: typeof run?.time === 'string' || typeof run?.time === 'number' ? String(run.time) : '',
    noTime: Boolean(run?.noTime),
  }
}

export function normalizeImportedTournament(value) {
  if (!value || value.schemaVersion !== 1) {
    throw new Error('El archivo no corresponde a una Lazada Mundialista compatible.')
  }
  if (!Array.isArray(value.teams) || value.teams.length !== 32) {
    throw new Error('El archivo debe contener exactamente 32 parejas.')
  }
  if (!Array.isArray(value.rounds) || value.rounds.length !== ROUND_DEFINITIONS.length) {
    throw new Error('La estructura de rondas del archivo no es válida.')
  }

  const normalized = createTournament()
  normalized.event = {
    ...normalized.event,
    ...(value.event ?? {}),
  }
  normalized.teams = normalized.teams.map((fallback, index) => ({
    ...fallback,
    ...value.teams[index],
    id: fallback.id,
  }))
  normalized.rounds = normalized.rounds.map((round, roundIndex) => ({
    ...round,
    matches: round.matches.map((fallback, matchIndex) => {
      const source = value.rounds[roundIndex]?.matches?.[matchIndex] ?? fallback
      return {
        ...fallback,
        teamAId: source.teamAId ?? null,
        teamBId: source.teamBId ?? null,
        score: {
          a: Array.from({ length: 3 }, (_, index) => normalizeRun(source.score?.a?.[index])),
          b: Array.from({ length: 3 }, (_, index) => normalizeRun(source.score?.b?.[index])),
          winnerId: source.score?.winnerId ?? null,
          completedAt: source.score?.completedAt ?? null,
        },
      }
    }),
  }))
  normalized.updatedAt = value.updatedAt ?? new Date().toISOString()
  return recalculateBracket(normalized)
}

export function getTournamentProgress(tournament) {
  const total = tournament.rounds.reduce((sum, round) => sum + round.matches.length, 0)
  const completed = tournament.rounds.reduce(
    (sum, round) => sum + round.matches.filter(isMatchComplete).length,
    0,
  )
  return { total, completed, percent: Math.round((completed / total) * 100) }
}
