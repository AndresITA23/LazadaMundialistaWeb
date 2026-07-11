import React, { useMemo } from 'react'
import {
  PENALTY_TIME_SECONDS,
  areAllRunsComplete,
  findTeam,
  formatTotal,
  getAutomaticWinnerId,
  getTeamTotal,
  isMatchComplete,
  isMatchReady,
  isRunComplete,
} from '../domain/tournament'
import { Icon } from './Icons'

function teamMembers(team) {
  return [team?.header, team?.heeler].filter(Boolean).join(' - ')
}

function runValue(run) {
  if (!isRunComplete(run)) return '—'
  if (run.noTime) return `+${PENALTY_TIME_SECONDS}`
  const time = Number(run.time)
  return Number.isFinite(time) ? time.toFixed(2) : '—'
}

function PublicTeamCard({ label, team, total, winner }) {
  const members = teamMembers(team)

  return (
    <article className={winner ? 'public-team-card winner' : 'public-team-card'}>
      <span className="public-side-label">Pareja {label}</span>
      <strong>{team?.name ?? 'Por definir'}</strong>
      <small>{members || 'Participantes por definir'}</small>
      <div>
        <span>Total</span>
        <b>{formatTotal(total)}</b>
      </div>
    </article>
  )
}

function RunScore({ label, run }) {
  return (
    <div className={`public-run-score ${run?.noTime ? 'penalty' : ''}`}>
      <small>{label}</small>
      <strong>{runValue(run)}</strong>
    </div>
  )
}

function RunRow({ index, runA, runB }) {
  return (
    <div className="public-run-row">
      <span className="public-run-label">Lazo {index + 1}</span>
      <RunScore label="A" run={runA} />
      <RunScore label="B" run={runB} />
    </div>
  )
}

export function PublicMatchDetails({
  tournament,
  match,
  round,
  onClose,
  onPrevious,
  onNext,
}) {
  const teamA = findTeam(tournament, match.teamAId)
  const teamB = findTeam(tournament, match.teamBId)
  const totalA = getTeamTotal(match.score.a)
  const totalB = getTeamTotal(match.score.b)
  const ready = isMatchReady(match)
  const complete = isMatchComplete(match)
  const allRunsComplete = areAllRunsComplete(match)
  const automaticWinnerId = getAutomaticWinnerId(match)
  const visibleWinnerId = match.score.winnerId ?? automaticWinnerId
  const winner = findTeam(tournament, match.score.winnerId)
  const projectedWinner = findTeam(tournament, !winner && allRunsComplete ? automaticWinnerId : null)

  const runRows = useMemo(
    () => Array.from({ length: 3 }, (_, index) => ({
      index,
      runA: match.score.a[index],
      runB: match.score.b[index],
    })),
    [match.score.a, match.score.b],
  )

  const statusText = complete
    ? 'Resultado oficial'
    : ready
      ? 'En captura'
      : 'Esperando participantes'

  return (
    <aside className="public-match-detail" aria-label="Detalle público del match">
      <div className="public-sheet-handle" aria-hidden="true" />
      <header className="public-detail-header">
        <div>
          <span>{round.name} · Match {match.matchIndex + 1}</span>
          <h1>Carta del match</h1>
        </div>
        <div className="public-detail-nav">
          <button aria-label="Match anterior" onClick={onPrevious} type="button"><Icon name="chevronLeft" /></button>
          <button aria-label="Siguiente match" onClick={onNext} type="button"><Icon name="chevronRight" /></button>
          <button aria-label="Cerrar detalle" className="public-close-button" onClick={onClose} type="button">
            <Icon name="close" />
          </button>
        </div>
      </header>

      <div className="public-live-pill">
        <span className={`state-dot ${complete ? 'complete' : ready ? 'active' : ''}`} />
        {statusText}
      </div>

      <div className="public-score-cards">
        <PublicTeamCard
          label="A"
          team={teamA}
          total={totalA}
          winner={visibleWinnerId === match.teamAId}
        />
        <PublicTeamCard
          label="B"
          team={teamB}
          total={totalB}
          winner={visibleWinnerId === match.teamBId}
        />
      </div>

      {ready ? (
        <>
          <section className="public-runs-table" aria-label="Tiempos por lazo">
            <header className="public-runs-title">
              <span>Tiempos</span>
              <small>A vs B</small>
            </header>
            {runRows.map(({ index, runA, runB }) => (
              <RunRow index={index} key={index} runA={runA} runB={runB} />
            ))}
          </section>

          <div className={winner || projectedWinner ? 'public-winner-card visible' : 'public-winner-card'}>
            <Icon name="trophy" size={26} />
            <div>
              <span>{winner ? 'Avanza' : projectedWinner ? 'Posible ganador' : 'Pendiente'}</span>
              <strong>{winner?.name ?? projectedWinner?.name ?? 'Completa los lazos'}</strong>
            </div>
          </div>
        </>
      ) : (
        <div className="public-empty-detail">
          <Icon name="bracket" size={30} />
          <strong>Este match todavía no está listo</strong>
          <span>Cuando avancen las parejas, aquí aparecerán sus tiempos.</span>
        </div>
      )}
    </aside>
  )
}
