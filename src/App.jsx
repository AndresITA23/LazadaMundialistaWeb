import React, { useMemo, useState } from 'react'
import { AppHeader } from './components/AppHeader'
import { BracketView } from './components/BracketView'
import { LoginPanel } from './components/LoginPanel'
import { MatchPanel } from './components/MatchPanel'
import { PairsSetup } from './components/PairsSetup'
import { PublicMatchDetails } from './components/PublicMatchDetails'
import { StatusBar } from './components/StatusBar'
import { findMatch } from './domain/tournament'
import { useSupabaseSession } from './hooks/useSupabaseSession'
import { useTournament } from './hooks/useTournament'
import { isSupabaseConfigured } from './lib/supabase'

function getAppMode() {
  const path = window.location.pathname.replace(/\/$/, '')
  const hash = window.location.hash.replace(/^#/, '').replace(/\/$/, '')
  return path === '/captura' || hash === '/captura' ? 'capture' : 'public'
}

export default function App() {
  const appMode = getAppMode()
  const captureMode = appMode === 'capture'
  const { authError, loading: authLoading, session, signIn, signOut } = useSupabaseSession()
  const canWrite = captureMode && (!isSupabaseConfigured || Boolean(session))
  const {
    isOnline,
    remoteError,
    tournament,
    saveStatus,
    updateEvent,
    updateTeam,
    updateRun,
    saveResult,
    clearMatch,
    swapFirstRoundTeams,
    shuffleMatchups,
    importTournament,
    resetTournament,
  } = useTournament({ canWrite })
  const [activeTab, setActiveTab] = useState('bracket')
  const [selectedMatchId, setSelectedMatchId] = useState('r0-m0')
  const [publicDetailOpen, setPublicDetailOpen] = useState(false)
  const [notice, setNotice] = useState('')

  const selectedMatch = useMemo(
    () => findMatch(tournament, selectedMatchId) ?? tournament.rounds[0].matches[0],
    [selectedMatchId, tournament],
  )
  const selectedRound = tournament.rounds[selectedMatch.roundIndex]
  const showStatusBar = !captureMode || (activeTab === 'bracket' && (!isOnline || Boolean(session)))

  const showNotice = (message) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2200)
  }

  const navigateMatch = (direction) => {
    const matches = selectedRound.matches
    const nextIndex = (selectedMatch.matchIndex + direction + matches.length) % matches.length
    setSelectedMatchId(matches[nextIndex].id)
  }

  const handlePublicMatchSelect = (matchId, options = {}) => {
    setSelectedMatchId(matchId)
    setPublicDetailOpen(options.source === 'match')
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(tournament, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const slug = (tournament.event.name || 'lazada-mundialista')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    link.href = url
    link.download = `${slug || 'lazada-mundialista'}.json`
    link.click()
    URL.revokeObjectURL(url)
    showNotice('Respaldo JSON exportado')
  }

  const handleImport = (value) => {
    importTournament(value)
    setSelectedMatchId('r0-m0')
    setActiveTab('bracket')
    showNotice('Evento importado correctamente')
  }

  const handleSave = (matchId, manualWinnerId) => {
    saveResult(matchId, manualWinnerId)
    showNotice('Resultado guardado y llave actualizada')
  }

  return (
    <div className="app-shell">
      <AppHeader
        activeTab={activeTab}
        captureMode={captureMode}
        eventName={tournament.event.name}
        onExport={handleExport}
        onImport={handleImport}
        onSignOut={signOut}
        onTabChange={setActiveTab}
        saveStatus={saveStatus}
        sessionEmail={session?.user?.email}
      />

      {remoteError ? (
        <div className="remote-error" role="alert">
          Supabase: {remoteError}
        </div>
      ) : null}

      {captureMode && isOnline && !session ? (
        <LoginPanel authError={authError} loading={authLoading} onSignIn={signIn} />
      ) : !captureMode ? (
        <main className={publicDetailOpen ? 'public-workspace detail-open' : 'public-workspace'}>
          <BracketView
            onSelectMatch={handlePublicMatchSelect}
            publicMode
            selectedMatchId={selectedMatch.id}
            tournament={tournament}
          />
          {publicDetailOpen ? (
            <>
              <button
                aria-label="Cerrar detalle del match"
                className="public-detail-backdrop"
                onClick={() => setPublicDetailOpen(false)}
                type="button"
              />
              <PublicMatchDetails
                match={selectedMatch}
                onClose={() => setPublicDetailOpen(false)}
                onNext={() => navigateMatch(1)}
                onPrevious={() => navigateMatch(-1)}
                round={selectedRound}
                tournament={tournament}
              />
            </>
          ) : null}
        </main>
      ) : activeTab === 'bracket' ? (
        <main className="tournament-workspace">
          <BracketView
            onSelectMatch={setSelectedMatchId}
            selectedMatchId={selectedMatch.id}
            tournament={tournament}
          />
          <MatchPanel
            match={selectedMatch}
            onClear={clearMatch}
            onNext={() => navigateMatch(1)}
            onPrevious={() => navigateMatch(-1)}
            onRunChange={updateRun}
            onSave={handleSave}
            round={selectedRound}
            tournament={tournament}
          />
        </main>
      ) : (
        <PairsSetup
          onEventChange={updateEvent}
          onReset={resetTournament}
          onShuffle={shuffleMatchups}
          onSwap={swapFirstRoundTeams}
          onTeamUpdate={updateTeam}
          tournament={tournament}
        />
      )}

      {showStatusBar ? <StatusBar tournament={tournament} /> : null}
      <div className={notice ? 'toast visible' : 'toast'} role="status">{notice}</div>
    </div>
  )
}
