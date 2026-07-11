import React, { useEffect, useMemo, useState } from 'react'
import { findTeam, formatTotal, getTeamTotal, isMatchComplete } from '../domain/tournament'
import { Icon } from './Icons'

function getTeamLabel(team, showMembers) {
  if (!team) return 'Por definir'
  const members = [team.header, team.heeler].filter(Boolean).join(' - ')
  return showMembers && members ? `${team.name} (${members})` : team.name
}

function TeamLine({ label, team, total, winner, showMembers }) {
  const teamLabel = getTeamLabel(team, showMembers)

  return (
    <div className={winner ? 'bracket-team winner' : 'bracket-team'}>
      <span className="team-seed">{label}</span>
      <span className="team-name" title={teamLabel}>{teamLabel}</span>
      <span className="team-total">{formatTotal(total)}</span>
    </div>
  )
}

function MatchCard({ match, tournament, selected, onSelect, showMembers }) {
  const teamA = findTeam(tournament, match.teamAId)
  const teamB = findTeam(tournament, match.teamBId)
  const complete = isMatchComplete(match)

  return (
    <button
      className={`bracket-match${selected ? ' selected' : ''}${complete ? ' complete' : ''}`}
      data-testid={`bracket-${match.id}`}
      onClick={() => onSelect(match.id, { source: 'match' })}
      type="button"
    >
      <span className="match-number">{String(match.matchIndex + 1).padStart(2, '0')}</span>
      <span className="match-teams">
        <TeamLine
          label="A"
          showMembers={showMembers}
          team={teamA}
          total={getTeamTotal(match.score.a)}
          winner={match.score.winnerId === match.teamAId}
        />
        <TeamLine
          label="B"
          showMembers={showMembers}
          team={teamB}
          total={getTeamTotal(match.score.b)}
          winner={match.score.winnerId === match.teamBId}
        />
      </span>
    </button>
  )
}

export function BracketView({ tournament, selectedMatchId, onSelectMatch, publicMode = false }) {
  const selectedMatch = useMemo(
    () => tournament.rounds.flatMap((round) => round.matches).find((match) => match.id === selectedMatchId),
    [selectedMatchId, tournament.rounds],
  )
  const [activeRound, setActiveRound] = useState(selectedMatch?.roundIndex ?? 0)
  const [mobileExpanded, setMobileExpanded] = useState(false)

  useEffect(() => {
    if (selectedMatch && selectedMatch.roundIndex !== activeRound) {
      setActiveRound(selectedMatch.roundIndex)
    }
  }, [activeRound, selectedMatch])

  const chooseRound = (roundIndex) => {
    setActiveRound(roundIndex)
    const firstReady = tournament.rounds[roundIndex].matches.find((match) => match.teamAId || match.teamBId)
    if (firstReady) onSelectMatch(firstReady.id, { source: 'round' })
  }

  const chooseMobileMatch = (event) => {
    onSelectMatch(event.target.value, { source: 'selector' })
    const match = tournament.rounds.flatMap((round) => round.matches).find((item) => item.id === event.target.value)
    if (match) setActiveRound(match.roundIndex)
  }

  const paneClassName = [
    'bracket-pane',
    publicMode ? 'public-bracket' : '',
    mobileExpanded || publicMode ? 'mobile-expanded' : '',
  ].filter(Boolean).join(' ')

  return (
    <section className={paneClassName} aria-label="Llave del torneo">
      <div className="round-tabs" role="tablist" aria-label="Rondas">
        {tournament.rounds.map((round, index) => (
          <button
            aria-selected={activeRound === index}
            className={activeRound === index ? 'round-tab active' : 'round-tab'}
            key={round.name}
            onClick={() => chooseRound(index)}
            role="tab"
            type="button"
          >
            {round.name}
          </button>
        ))}
      </div>

      <div className="mobile-match-selector">
        <label htmlFor="mobile-match">{tournament.rounds[activeRound].name}</label>
        <select id="mobile-match" onChange={chooseMobileMatch} value={selectedMatchId}>
          {tournament.rounds[activeRound].matches.map((match) => (
            <option key={match.id} value={match.id}>
              Match {match.matchIndex + 1} de {tournament.rounds[activeRound].matches.length}
            </option>
          ))}
        </select>
        {!publicMode ? (
          <button className="mobile-bracket-toggle" onClick={() => setMobileExpanded((value) => !value)} type="button">
            {mobileExpanded ? 'Ocultar llave' : 'Ver llave completa'}
            <Icon name="chevronRight" size={18} />
          </button>
        ) : null}
      </div>

      <div className="bracket-canvas">
        {tournament.rounds.map((round, roundIndex) => (
          <div
            className={`match-column round-${roundIndex}${activeRound === roundIndex ? ' mobile-active' : ''}`}
            key={round.name}
          >
            <header className="round-heading">
              <strong>{round.name}</strong>
              <span>{round.matches.length} {round.matches.length === 1 ? 'match' : 'matches'}</span>
            </header>
            <div className="match-stack">
              {round.matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onSelect={onSelectMatch}
                  selected={selectedMatchId === match.id}
                  showMembers={publicMode}
                  tournament={tournament}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bracket-legend" aria-label="Leyenda">
        <span><i className="legend-star">★</i> Avanzó</span>
        <span><i className="legend-box selected-box" /> Seleccionado</span>
        <span><i className="legend-box complete-box" /> Completado</span>
        <span><i className="legend-box pending-box" /> Pendiente</span>
      </div>
    </section>
  )
}
