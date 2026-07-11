import React, { useRef } from 'react'
import { Icon } from './Icons'

export function AppHeader({
  eventName,
  activeTab,
  captureMode = false,
  onSignOut,
  onTabChange,
  saveStatus,
  sessionEmail,
  onExport,
  onImport,
}) {
  const fileInputRef = useRef(null)
  const statusIsOk = ['Guardado', 'Guardado local', 'Guardado en vivo', 'En vivo'].includes(saveStatus)

  const handleFile = async (event) => {
    const [file] = event.target.files
    event.target.value = ''
    if (!file) return
    try {
      onImport(JSON.parse(await file.text()))
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'No se pudo importar el archivo.')
    }
  }

  return (
    <header className="app-header">
      <div className="brand-lockup">
        <img src="src\assets\logoWhiteBack.png" alt="Logo" className="brand-mark" />
        <span className="brand-name">{eventName || 'Lazada Mundialista'}</span>
      </div>

      <nav className="main-nav" aria-label="Secciones principales">
        <button
          className={activeTab === 'bracket' ? 'nav-button active' : 'nav-button'}
          onClick={() => onTabChange('bracket')}
          type="button"
        >
          <Icon name="bracket" />
          {captureMode ? 'Llave' : 'Llaves en vivo'}
        </button>
        {captureMode ? (
          <button
            className={activeTab === 'pairs' ? 'nav-button active' : 'nav-button'}
            onClick={() => onTabChange('pairs')}
            type="button"
          >
            <Icon name="users" />
            Parejas
          </button>
        ) : null}
      </nav>

      <div className="header-actions">
        {captureMode ? (
          <>
            <input
              accept="application/json,.json"
              className="sr-only"
              onChange={handleFile}
              ref={fileInputRef}
              type="file"
            />
            <button className="secondary-button import-button" onClick={() => fileInputRef.current?.click()} type="button">
              <Icon name="upload" />
              <span>Importar JSON</span>
            </button>
            <button className="secondary-button" onClick={onExport} type="button">
              <Icon name="download" />
              <span>Exportar</span>
            </button>
            {sessionEmail ? (
              <button className="secondary-button sign-out-button" onClick={onSignOut} type="button">
                <span>Salir</span>
              </button>
            ) : null}
          </>
        ) : null}
        <div className="save-status" role="status">
          <span className={statusIsOk ? 'status-check saved' : 'status-check'}>
            <Icon name="check" size={15} />
          </span>
          <span>{saveStatus}</span>
        </div>
      </div>
    </header>
  )
}
