import { useCallback, useEffect, useRef, useState } from 'react'
import {
  STORAGE_KEY,
  areAllRunsComplete,
  createTournament,
  findMatch,
  getAutomaticWinnerId,
  normalizeImportedTournament,
  recalculateBracket,
  resetMatch,
} from '../domain/tournament'
import { TOURNAMENT_EVENT_ID, isSupabaseConfigured, supabase } from '../lib/supabase'

function safeTournament(value) {
  try {
    if (!value || Object.keys(value).length === 0) return createTournament()
    return normalizeImportedTournament(value)
  } catch {
    return createTournament()
  }
}

function loadInitialTournament() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? safeTournament(JSON.parse(saved)) : createTournament()
  } catch {
    return createTournament()
  }
}

export function useTournament({ canWrite = false } = {}) {
  const [tournament, setTournament] = useState(loadInitialTournament)
  const [saveStatus, setSaveStatus] = useState(
    isSupabaseConfigured ? 'Conectando…' : 'Guardado local',
  )
  const [remoteError, setRemoteError] = useState('')
  const pendingRemoteSave = useRef(null)
  const remoteRevision = useRef(null)

  const commitTournament = useCallback((updater) => {
    setTournament((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater
      if (next !== current) pendingRemoteSave.current = next
      return next
    })
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tournament))
    }, 200)
    return () => window.clearTimeout(timeout)
  }, [tournament])

  useEffect(() => {
    if (!supabase) return undefined

    let mounted = true

    const loadRemoteEvent = async () => {
      setSaveStatus('Conectando…')
      const { data, error } = await supabase
        .from('tournament_events')
        .select('state, revision')
        .eq('id', TOURNAMENT_EVENT_ID)
        .single()

      if (!mounted) return

      if (error) {
        setRemoteError(error.message)
        setSaveStatus('Error de conexión')
        return
      }

      remoteRevision.current = data.revision ?? null
      pendingRemoteSave.current = null
      setTournament(safeTournament(data.state))
      setRemoteError('')
      setSaveStatus('En vivo')
    }

    loadRemoteEvent()

    const channel = supabase
      .channel(`tournament-events:${TOURNAMENT_EVENT_ID}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tournament_events',
          filter: `id=eq.${TOURNAMENT_EVENT_ID}`,
        },
        (payload) => {
          const incomingRevision = payload.new?.revision ?? null
          if (incomingRevision !== null && incomingRevision === remoteRevision.current) return

          remoteRevision.current = incomingRevision
          pendingRemoteSave.current = null
          setTournament(safeTournament(payload.new?.state))
          setRemoteError('')
          setSaveStatus('En vivo')
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setSaveStatus('En vivo')
      })

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    if (!supabase || !canWrite || !pendingRemoteSave.current) return undefined

    const snapshot = pendingRemoteSave.current
    const timeout = window.setTimeout(async () => {
      setSaveStatus('Guardando en vivo…')
      const { data, error } = await supabase
        .from('tournament_events')
        .update({ state: snapshot })
        .eq('id', TOURNAMENT_EVENT_ID)
        .select('revision')
        .single()

      if (error) {
        setRemoteError(error.message)
        setSaveStatus('Error al guardar')
        return
      }

      if (pendingRemoteSave.current === snapshot) pendingRemoteSave.current = null
      remoteRevision.current = data?.revision ?? remoteRevision.current
      setRemoteError('')
      setSaveStatus('Guardado en vivo')
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [canWrite, tournament])

  const updateEvent = useCallback((field, value) => {
    commitTournament((current) => ({
      ...current,
      event: { ...current.event, [field]: value },
      updatedAt: new Date().toISOString(),
    }))
  }, [commitTournament])

  const updateTeam = useCallback((teamId, field, value) => {
    commitTournament((current) => ({
      ...current,
      teams: current.teams.map((team) =>
        team.id === teamId ? { ...team, [field]: value } : team,
      ),
      updatedAt: new Date().toISOString(),
    }))
  }, [commitTournament])

  const updateRun = useCallback((matchId, side, runIndex, patch) => {
    commitTournament((current) => {
      const next = structuredClone(current)
      const match = findMatch(next, matchId)
      if (!match) return current
      match.score[side][runIndex] = { ...match.score[side][runIndex], ...patch }
      match.score.winnerId = null
      match.score.completedAt = null
      return recalculateBracket(next)
    })
  }, [commitTournament])

  const saveResult = useCallback((matchId, manualWinnerId = null) => {
    let savedWinnerId = null
    commitTournament((current) => {
      const next = structuredClone(current)
      const match = findMatch(next, matchId)
      if (!match || !areAllRunsComplete(match)) return current
      const winnerId = getAutomaticWinnerId(match) ?? manualWinnerId
      if (!winnerId || ![match.teamAId, match.teamBId].includes(winnerId)) return current
      match.score.winnerId = winnerId
      match.score.completedAt = new Date().toISOString()
      savedWinnerId = winnerId
      return recalculateBracket(next)
    })
    return savedWinnerId
  }, [commitTournament])

  const clearMatch = useCallback((matchId) => {
    commitTournament((current) => {
      const next = structuredClone(current)
      const match = findMatch(next, matchId)
      if (!match) return current
      const cleared = resetMatch(match)
      Object.assign(match, cleared)
      return recalculateBracket(next)
    })
  }, [commitTournament])

  const swapFirstRoundTeams = useCallback((matchId) => {
    commitTournament((current) => {
      const next = structuredClone(current)
      const match = next.rounds[0].matches.find((candidate) => candidate.id === matchId)
      if (!match) return current
      const teamAId = match.teamAId
      match.teamAId = match.teamBId
      match.teamBId = teamAId
      Object.assign(match, resetMatch(match))
      return recalculateBracket(next)
    })
  }, [commitTournament])

  const shuffleMatchups = useCallback(() => {
    commitTournament((current) => {
      const next = structuredClone(current)
      const ids = next.teams.map((team) => team.id)
      for (let index = ids.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1))
        ;[ids[index], ids[randomIndex]] = [ids[randomIndex], ids[index]]
      }
      next.rounds.forEach((round) => {
        round.matches = round.matches.map(resetMatch)
      })
      next.rounds[0].matches.forEach((match, index) => {
        match.teamAId = ids[index * 2]
        match.teamBId = ids[index * 2 + 1]
      })
      return recalculateBracket(next)
    })
  }, [commitTournament])

  const importTournament = useCallback((value) => {
    commitTournament(normalizeImportedTournament(value))
  }, [commitTournament])

  const resetTournament = useCallback(() => {
    commitTournament(createTournament())
  }, [commitTournament])

  return {
    isOnline: isSupabaseConfigured,
    remoteError,
    saveStatus,
    tournament,
    clearMatch,
    importTournament,
    resetTournament,
    saveResult,
    shuffleMatchups,
    swapFirstRoundTeams,
    updateEvent,
    updateRun,
    updateTeam,
  }
}
