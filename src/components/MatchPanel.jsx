import React, { useEffect, useMemo, useState } from 'react'
import {
  PENALTY_TIME_SECONDS,
  areAllRunsComplete,
  findTeam,
  formatTotal,
  getAutomaticWinnerId,
  getTeamTotal,
  isMatchComplete,
  isMatchReady,
} from '../domain/tournament'
import { Icon } from './Icons'

function TeamIdentity({ label, team, total, winner }) {
  return (
    <div className={winner ? 'versus-team winner' : 'versus-team'}>
      <span className="versus-label">Pareja {label}</span>
      <strong>{team?.name ?? 'Por definir'}</strong>
      {(team?.header || team?.heeler) ? (
        <small>{[team.header, team.heeler].filter(Boolean).join(' · ')}</small>
      ) : null}
      <span className="versus-total-label">Total</span>
      <span className="versus-total">{formatTotal(total)}</span>
    </div>
  )
}

function RunEntry({ label, side, index, run, disabled, onChange }) {
  const togglePenalty = () => onChange({
    noTime: !run.noTime,
    time: !run.noTime ? String(PENALTY_TIME_SECONDS) : '',
  })

  return (
    <div className={`run-entry side-${side} run-${index + 1}${run.noTime ? ' is-no-time' : ''}`}>
      <span className="side-letter">{side.toUpperCase()}</span>
      <label htmlFor={`run-${side}-${index}`}>{label}</label>
      <div className="time-control">
        <input
          aria-label={`Pareja ${side.toUpperCase()}, ${label}`}
          disabled={disabled || run.noTime}
          id={`run-${side}-${index}`}
          inputMode="decimal"
          min="0"
          onChange={(event) => onChange({ time: event.target.value.replace(',', '.'), noTime: false })}
          placeholder="0.00"
          type="text"
          value={run.noTime ? String(PENALTY_TIME_SECONDS) : run.time}
        />
        <span>seg</span>
      </div>
      <button
        aria-pressed={run.noTime}
        className="nt-button"
        disabled={disabled}
        onClick={togglePenalty}
        type="button"
      >
        +60
      </button>
    </div>
  )
}

export function MatchPanel({
  tournament,
  match,
  round,
  onRunChange,
  onSave,
  onClear,
  onPrevious,
  onNext,
}) {
  const [manualWinnerId, setManualWinnerId] = useState(null)

  useEffect(() => {
    setManualWinnerId(null)
  }, [match.id])

  const teamA = findTeam(tournament, match.teamAId)
  const teamB = findTeam(tournament, match.teamBId)
  const totalA = getTeamTotal(match.score.a)
  const totalB = getTeamTotal(match.score.b)
  const allRunsComplete = areAllRunsComplete(match)
  const automaticWinnerId = getAutomaticWinnerId(match)
  const candidateWinnerId = match.score.winnerId ?? automaticWinnerId ?? manualWinnerId
  const winner = findTeam(tournament, candidateWinnerId)
  const complete = isMatchComplete(match)
  const ready = isMatchReady(match)
  const needsDecision = allRunsComplete && !automaticWinnerId
  const runEntries = useMemo(
    () => Array.from({ length: 3 }, (_, index) => [
      { side: 'a', run: match.score.a[index], index },
      { side: 'b', run: match.score.b[index], index },
    ]).flat(),
    [match.score.a, match.score.b],
  )

  const handleSave = () => {
    onSave(match.id, manualWinnerId)
  }

  return (
    <aside className="match-panel" aria-label="Mesa de captura" data-testid="match-panel">
      <header className="match-panel-header">
        <div>
          <span className="match-kicker">{round.name} · Match {match.matchIndex + 1} de {round.matches.length}</span>
          <h1>Match {String(match.matchIndex + 1).padStart(2, '0')}</h1>
        </div>
        <div className="match-navigation">
          <button aria-label="Match anterior" onClick={onPrevious} type="button"><Icon name="chevronLeft" /></button>
          <button aria-label="Siguiente match" onClick={onNext} type="button"><Icon name="chevronRight" /></button>
        </div>
      </header>

      <div className="match-state-line">
        <span className={`state-dot ${complete ? 'complete' : ready ? 'active' : ''}`} />
        {complete ? 'Resultado guardado' : ready ? 'Captura en progreso' : 'Esperando ganadores previos'}
      </div>

      <div className="versus-bar">
        <TeamIdentity label="A" team={teamA} total={totalA} winner={candidateWinnerId === match.teamAId} />
        <span className="versus-badge">VS</span>
        <TeamIdentity label="B" team={teamB} total={totalB} winner={candidateWinnerId === match.teamBId} />
      </div>

      {ready ? (
        <>
          <div className="runs-heading">
            <span>Orden de lazos</span>
            <small>Captura el tiempo o marca +60 segundos</small>
          </div>
          <div className="runs-grid">
            {runEntries.map(({ side, run, index }) => (
              <RunEntry
                disabled={false}
                index={index}
                key={`${side}-${index}`}
                label={`Lazo ${index + 1}`}
                onChange={(patch) => onRunChange(match.id, side, index, patch)}
                run={run}
                side={side}
              />
            ))}
          </div>

          {needsDecision ? (
            <div className="manual-winner" role="group" aria-label="Desempate manual">
              <strong>El resultado requiere decisión manual</strong>
              <span>Elige quién avanza:</span>
              <div>
                <button
                  className={manualWinnerId === match.teamAId ? 'selected' : ''}
                  onClick={() => setManualWinnerId(match.teamAId)}
                  type="button"
                >{teamA.name}</button>
                <button
                  className={manualWinnerId === match.teamBId ? 'selected' : ''}
                  onClick={() => setManualWinnerId(match.teamBId)}
                  type="button"
                >{teamB.name}</button>
              </div>
            </div>
          ) : null}

          <div className={winner ? 'winner-callout visible' : 'winner-callout'} aria-live="polite">
            <Icon name="trophy" size={30} />
            <span>{winner ? `Avanza ${winner.name}` : 'Completa los seis lazos'}</span>
          </div>

          <div className="match-actions">
            <button
              className="primary-button"
              data-testid="save-result"
              disabled={!allRunsComplete || (!automaticWinnerId && !manualWinnerId)}
              onClick={handleSave}
              type="button"
            >
              <Icon name="save" />
              {complete ? 'Actualizar resultado' : 'Guardar resultado'}
            </button>
            <button className="danger-button" disabled={!allRunsComplete && !complete} onClick={() => onClear(match.id)} type="button">
              <Icon name="rotate" />
              Limpiar captura
            </button>
          </div>
          <p className="capture-note">Se requieren los 6 lazos para guardar el resultado.</p>
        </>
      ) : (
        <div className="waiting-state">
          <Icon name="bracket" size={34} />
          <strong>Este match aún no tiene participantes</strong>
          <span>Se activará automáticamente cuando terminen los enfrentamientos anteriores.</span>
        </div>
      )}
    </aside>
  )
}
