import React from 'react'

import { getTournamentProgress } from '../domain/tournament'
import { Icon } from './Icons'

export function StatusBar({ tournament }) {
  const progress = getTournamentProgress(tournament)
  const currentRound = tournament.rounds.find((round) => round.matches.some((match) => match.teamAId && match.teamBId && !match.score.completedAt))

  return (
    <footer className="status-bar">
      <div className="progress-block">
        <Icon name="bracket" size={25} />
        <div>
          <span>Progreso del torneo</span>
          <div className="progress-track"><i style={{ width: `${progress.percent}%` }} /></div>
        </div>
        <strong>{progress.percent}%</strong>
      </div>
      <div className="status-stat">
        <span>Completados</span>
        <strong>{progress.completed}</strong>
      </div>
      <div className="status-stat">
        <span>Ronda activa</span>
        <strong>{currentRound?.shortName ?? 'FIN'}</strong>
      </div>
      <div className="status-stat">
        <span>Parejas</span>
        <strong>32</strong>
      </div>
      <div className="last-save">
        <span>Última actualización</span>
        <strong>{new Date(tournament.updatedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</strong>
      </div>
    </footer>
  )
}
