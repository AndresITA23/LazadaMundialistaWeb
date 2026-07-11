import React from 'react'

import { findTeam } from '../domain/tournament'
import { Icon } from './Icons'

function TeamEditor({ team, side, onUpdate }) {
  return (
    <div className="team-editor">
      <span className={`editor-side side-${side.toLowerCase()}`}>{side}</span>
      <label>
        <span>Nombre de la pareja</span>
        <input
          aria-label={`Pareja ${side}: nombre del equipo`}
          onChange={(event) => onUpdate(team.id, 'name', event.target.value)}
          placeholder="Ej. Cabo Verde"
          type="text"
          value={team.name}
        />
      </label>
      <label>
        <span>Cabecero</span>
        <input
          aria-label={`Pareja ${side}: cabecero`}
          onChange={(event) => onUpdate(team.id, 'header', event.target.value)}
          placeholder="Nombre"
          type="text"
          value={team.header}
        />
      </label>
      <label>
        <span>Pialador</span>
        <input
          aria-label={`Pareja ${side}: pialador`}
          onChange={(event) => onUpdate(team.id, 'heeler', event.target.value)}
          placeholder="Nombre"
          type="text"
          value={team.heeler}
        />
      </label>
    </div>
  )
}

export function PairsSetup({
  tournament,
  onEventChange,
  onTeamUpdate,
  onSwap,
  onShuffle,
  onReset,
}) {
  const handleShuffle = () => {
    if (window.confirm('¿Mezclar los 16 enfrentamientos? Los resultados capturados se borrarán.')) onShuffle()
  }

  const handleReset = () => {
    if (window.confirm('¿Reiniciar todo el evento? Esta acción borra parejas, tiempos y resultados locales.')) onReset()
  }

  return (
    <main className="pairs-page">
      <section className="event-settings">
        <div>
          <span className="section-number">01</span>
          <div>
            <h1>Datos del evento</h1>
            <p>Estos datos aparecen en la cabecera y viajan dentro del respaldo JSON.</p>
          </div>
        </div>
        <div className="event-fields">
          <label>
            <span>Nombre del evento</span>
            <input onChange={(event) => onEventChange('name', event.target.value)} value={tournament.event.name} />
          </label>
          <label>
            <span>Fecha</span>
            <input onChange={(event) => onEventChange('date', event.target.value)} type="date" value={tournament.event.date} />
          </label>
          <label>
            <span>Lugar</span>
            <input onChange={(event) => onEventChange('venue', event.target.value)} placeholder="Arena o ciudad" value={tournament.event.venue} />
          </label>
        </div>
      </section>

      <section className="matchup-settings">
        <header className="setup-section-header">
          <div>
            <span className="section-number">02</span>
            <div>
              <h2>Parejas y enfrentamientos</h2>
              <p>Las dos parejas de cada bloque se enfrentan en la primera ronda.</p>
            </div>
          </div>
          <button className="secondary-button light" onClick={handleShuffle} type="button">
            <Icon name="shuffle" /> Mezclar cruces
          </button>
        </header>

        <div className="matchup-list">
          {tournament.rounds[0].matches.map((match) => {
            const teamA = findTeam(tournament, match.teamAId)
            const teamB = findTeam(tournament, match.teamBId)
            return (
              <article className="matchup-editor" key={match.id}>
                <header>
                  <span>Match {String(match.matchIndex + 1).padStart(2, '0')}</span>
                  <button aria-label={`Intercambiar parejas del match ${match.matchIndex + 1}`} onClick={() => onSwap(match.id)} type="button">
                    <Icon name="swap" size={17} /> Intercambiar A/B
                  </button>
                </header>
                <TeamEditor onUpdate={onTeamUpdate} side="A" team={teamA} />
                <div className="editor-versus">VS</div>
                <TeamEditor onUpdate={onTeamUpdate} side="B" team={teamB} />
              </article>
            )
          })}
        </div>
      </section>

      <section className="danger-zone">
        <div>
          <strong>Reiniciar evento</strong>
          <span>Devuelve las 32 parejas y toda la llave a su estado inicial.</span>
        </div>
        <button className="danger-button" onClick={handleReset} type="button">
          <Icon name="rotate" /> Reiniciar todo
        </button>
      </section>
    </main>
  )
}
