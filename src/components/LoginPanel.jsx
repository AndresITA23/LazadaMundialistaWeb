import React, { useState } from 'react'
import { Icon } from './Icons'

export function LoginPanel({ authError, loading, onSignIn }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    onSignIn(email.trim(), password)
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <span className="login-kicker">Mesa de captura</span>
        <h1>Entrar como capturista</h1>
        <p>
          Esta pantalla solo es para la persona que va a registrar tiempos y avanzar parejas.
          El público puede ver la llave en vivo desde la página principal.
        </p>

        <label>
          <span>Correo</span>
          <input
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="captura@tuevento.com"
            required
            type="email"
            value={email}
          />
        </label>

        <label>
          <span>Contraseña</span>
          <input
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            required
            type="password"
            value={password}
          />
        </label>

        {authError ? <div className="login-error">{authError}</div> : null}

        <button className="primary-button" disabled={loading} type="submit">
          <Icon name="save" />
          {loading ? 'Entrando…' : 'Entrar a captura'}
        </button>
      </form>
    </main>
  )
}
