import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import horseLogo from '../HorseLogo.jpeg'
import {
  AGE_GROUP_OPTIONS,
  CATEGORY_OPTIONS,
  aggregateSessionTotals,
  calculateRacePayout,
  formatCategoryLabel,
  formatPositionPercent,
} from './lib/calculator'
import { formatCurrency, formatDateTime, formatHorseCountLabel, formatPositionLabel } from './lib/format'
import { loadHistoryRecords, saveHistoryRecords } from './lib/storage'
import type {
  AgeGroup,
  CalculationInput,
  CalculationRecord,
  CalculationResult,
  HistoryRecord,
  SessionRecord,
  SessionRace,
} from './lib/types'

type FormState = {
  horseName: string
  ageGroup: AgeGroup
  category: CalculationInput['category']
  horseCount: string
  finishPosition: string
}

const DEFAULT_FORM: FormState = {
  horseName: '',
  ageGroup: 'young',
  category: 100,
  horseCount: '5',
  finishPosition: '1',
}

function App() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [currentResult, setCurrentResult] = useState<CalculationResult | null>(null)
  const [currentInput, setCurrentInput] = useState<CalculationInput | null>(null)
  const [sessionRaces, setSessionRaces] = useState<SessionRace[]>([])
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([])
  const [selectedHistoryRecordId, setSelectedHistoryRecordId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const sessionTotals = aggregateSessionTotals(sessionRaces)
  const selectedHistoryRecord =
    historyRecords.find(
      (record): record is CalculationRecord =>
        record.kind === 'single' && record.id === selectedHistoryRecordId,
    ) ?? null

  useEffect(() => {
    setHistoryRecords(loadHistoryRecords())
  }, [])

  useEffect(() => {
    saveHistoryRecords(historyRecords)
  }, [historyRecords])

  const handleCalculate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const horseCount = Number.parseInt(form.horseCount, 10)
    const finishPosition = Number.parseInt(form.finishPosition, 10)

    if (!form.horseName.trim()) {
      setErrorMessage('Escribe el nombre del caballo.')
      return
    }

    if (!Number.isInteger(horseCount) || horseCount < 3) {
      setErrorMessage('La carrera debe tener 3 caballos o mas.')
      return
    }

    if (!Number.isInteger(finishPosition) || finishPosition < 1) {
      setErrorMessage('La posicion final debe ser 1 o mayor.')
      return
    }

    const input: CalculationInput = {
      horseName: form.horseName.trim(),
      ageGroup: form.ageGroup,
      category: form.category,
      horseCount,
      finishPosition,
    }

    const result = calculateRacePayout(input)
    const singleRecord: CalculationRecord = {
      id: crypto.randomUUID(),
      kind: 'single',
      createdAt: new Date().toISOString(),
      input,
      result,
    }

    setCurrentInput(input)
    setCurrentResult(result)
    setHistoryRecords((existing) => [singleRecord, ...existing])
    setErrorMessage('')
  }

  const handleAddToSession = () => {
    if (!currentInput || !currentResult) {
      return
    }

    setSessionRaces((existing) => [
      ...existing,
      {
        id: crypto.randomUUID(),
        input: currentInput,
        result: currentResult,
      },
    ])
  }

  const handleRemoveSessionRace = (raceId: string) => {
    setSessionRaces((existing) => existing.filter((race) => race.id !== raceId))
  }

  const handleClearSession = () => {
    setSessionRaces([])
  }

  const handleSaveSession = () => {
    if (sessionRaces.length === 0) {
      return
    }

    const sessionRecord: SessionRecord = {
      id: crypto.randomUUID(),
      kind: 'session',
      createdAt: new Date().toISOString(),
      races: sessionRaces,
      totals: sessionTotals,
    }

    setHistoryRecords((existing) => [sessionRecord, ...existing])
  }

  const handleDeleteHistoryRecord = (recordId: string) => {
    if (selectedHistoryRecordId === recordId) {
      setSelectedHistoryRecordId(null)
    }
    setHistoryRecords((existing) => existing.filter((record) => record.id !== recordId))
  }

  const handleClearHistory = () => {
    setHistoryRecords([])
    setSelectedHistoryRecordId(null)
  }

  const handleSelectHistoryRecord = (record: HistoryRecord) => {
    if (record.kind !== 'single') {
      return
    }

    setSelectedHistoryRecordId(record.id)
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__brand">
          <img className="brand-mark" src={horseLogo} alt="Caballo corriendo en pista" />
          <div>
            <p className="eyebrow">DECOO STABLE</p>
            <h1>Tabla De Pago</h1>
            <p className="hero__copy">
              Calcula el pago por carrera, acumula varias carreras en una sesion y mira cuanto se
              distribuye a entrenador, groom, jockey y ganancia.
            </p>
          </div>
        </div>
        <div className="hero__stats">
          <div className="hero__stat">
            <span>Historial</span>
            <strong>{historyRecords.length}</strong>
          </div>
          <div className="hero__stat">
            <span>Sesion actual</span>
            <strong>{sessionTotals.raceCount}</strong>
          </div>
        </div>
      </header>

      <main className="layout">
        <section className="panel panel--form">
          <div className="panel__header">
            <p className="panel__eyebrow">Nueva carrera</p>
            <h2>Datos del calculo</h2>
          </div>

          <form className="calc-form" onSubmit={handleCalculate}>
            <label>
              Nombre del caballo
              <input
                type="text"
                value={form.horseName}
                onChange={(event) => setForm((current) => ({ ...current, horseName: event.target.value }))}
                placeholder="Ej. Relampago Rojo"
              />
            </label>

            <label>
              Edad del caballo
              <select
                value={form.ageGroup}
                onChange={(event) =>
                  setForm((current) => ({ ...current, ageGroup: event.target.value as AgeGroup }))
                }
              >
                {AGE_GROUP_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Categoria
              <select
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    category: Number.parseInt(event.target.value, 10) as CalculationInput['category'],
                  }))
                }
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {formatCategoryLabel(option)}
                  </option>
                ))}
              </select>
            </label>

            <div className="calc-form__row">
              <label>
                Cantidad de caballos
                <input
                  type="number"
                  min="3"
                  step="1"
                  value={form.horseCount}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, horseCount: event.target.value }))
                  }
                />
              </label>

              <label>
                Posicion final
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.finishPosition}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, finishPosition: event.target.value }))
                  }
                />
              </label>
            </div>

            {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

            <div className="form-actions">
              <button type="submit" className="button button--primary">
                Calcular pago
              </button>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => {
                  setForm(DEFAULT_FORM)
                  setCurrentInput(null)
                  setCurrentResult(null)
                  setErrorMessage('')
                }}
              >
                Limpiar
              </button>
            </div>
          </form>
        </section>

        <section className="panel panel--results">
          <div className="panel__header">
            <p className="panel__eyebrow">Resultado actual</p>
            <h2>Distribucion del pago</h2>
          </div>

          {currentInput && currentResult ? (
            <div className="result-card">
              <div className="result-card__summary">
                <div>
                  <span>Caballo</span>
                  <strong>{currentInput.horseName}</strong>
                </div>
                <div>
                  <span>Bolsa base</span>
                  <strong>{formatCurrency(currentResult.basePurse)}</strong>
                </div>
                <div>
                  <span>% por posicion</span>
                  <strong>{formatPositionPercent(currentResult.positionPercent)}</strong>
                </div>
                <div>
                  <span>Premio por posicion</span>
                  <strong>{formatCurrency(currentResult.positionPayout)}</strong>
                </div>
              </div>

              <dl className="money-grid">
                <div>
                  <dt>Entrenador</dt>
                  <dd>{formatCurrency(currentResult.trainerAmount)}</dd>
                </div>
                <div>
                  <dt>Groom</dt>
                  <dd>{formatCurrency(currentResult.groomAmount)}</dd>
                </div>
                <div>
                  <dt>Jockey</dt>
                  <dd>{formatCurrency(currentResult.jockeyAmount)}</dd>
                </div>
                <div className="money-grid__profit">
                  <dt>Ganancia</dt>
                  <dd>{formatCurrency(currentResult.profitAmount)}</dd>
                </div>
              </dl>

              <div className="result-meta">
                <span>{AGE_GROUP_OPTIONS.find((option) => option.value === currentInput.ageGroup)?.label}</span>
                <span>Categoria {formatCategoryLabel(currentInput.category)}</span>
                <span>{formatHorseCountLabel(currentInput.horseCount)}</span>
                <span>{formatPositionLabel(currentInput.finishPosition)}</span>
              </div>

              <button type="button" className="button button--primary" onClick={handleAddToSession}>
                Agregar a la sesion
              </button>
            </div>
          ) : (
            <div className="empty-state">
              <p>Completa los datos de la carrera para ver el pago distribuido.</p>
            </div>
          )}
        </section>

        <section className="panel panel--session">
          <div className="panel__header">
            <p className="panel__eyebrow">Acumulador</p>
            <h2>Sesion actual</h2>
          </div>

          <div className="session-summary">
            <div>
              <span>Carreras agregadas</span>
              <strong>{sessionTotals.raceCount}</strong>
            </div>
            <div>
              <span>Total distribuido</span>
              <strong>{formatCurrency(sessionTotals.totalPositionPayout)}</strong>
            </div>
            <div>
              <span>Total ganancia</span>
              <strong>{formatCurrency(sessionTotals.totalProfitAmount)}</strong>
            </div>
          </div>

          <dl className="money-grid money-grid--session">
            <div>
              <dt>Entrenador</dt>
              <dd>{formatCurrency(sessionTotals.totalTrainerAmount)}</dd>
            </div>
            <div>
              <dt>Groom</dt>
              <dd>{formatCurrency(sessionTotals.totalGroomAmount)}</dd>
            </div>
            <div>
              <dt>Jockey</dt>
              <dd>{formatCurrency(sessionTotals.totalJockeyAmount)}</dd>
            </div>
            <div className="money-grid__profit">
              <dt>Ganancia</dt>
              <dd>{formatCurrency(sessionTotals.totalProfitAmount)}</dd>
            </div>
          </dl>

          {sessionRaces.length > 0 ? (
            <>
              <ul className="session-list">
                {sessionRaces.map((race) => (
                  <li key={race.id} className="session-list__item">
                    <div>
                      <strong>{race.input.horseName}</strong>
                      <p>
                        Categoria {formatCategoryLabel(race.input.category)} |{' '}
                        {formatHorseCountLabel(race.input.horseCount)} |{' '}
                        {formatPositionLabel(race.input.finishPosition)}
                      </p>
                    </div>
                    <div className="session-list__right">
                      <strong>{formatCurrency(race.result.positionPayout)}</strong>
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => handleRemoveSessionRace(race.id)}
                      >
                        Quitar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="form-actions">
                <button type="button" className="button button--primary" onClick={handleSaveSession}>
                  Guardar sesion
                </button>
                <button type="button" className="button button--ghost" onClick={handleClearSession}>
                  Vaciar sesion
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state empty-state--compact">
              <p>Agrega carreras para ver el acumulado de la sesion.</p>
            </div>
          )}
        </section>

        <section className="panel panel--history">
          <div className="panel__header">
            <p className="panel__eyebrow">Navegacion rapida</p>
            <h2>Historial reciente</h2>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="button button--ghost"
              onClick={handleClearHistory}
              disabled={historyRecords.length === 0}
            >
              Borrar historial
            </button>
          </div>

          {selectedHistoryRecord ? (
            <div className="history-preview">
              <div className="history-preview__header">
                <div>
                  <p className="history-list__type">Carrera seleccionada</p>
                  <strong>{selectedHistoryRecord.input.horseName}</strong>
                  <p className="history-list__meta">{formatDateTime(selectedHistoryRecord.createdAt)}</p>
                </div>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setSelectedHistoryRecordId(null)}
                >
                  Cerrar
                </button>
              </div>
              <p className="history-list__details">
                {formatPositionLabel(selectedHistoryRecord.input.finishPosition)} |{' '}
                {formatHorseCountLabel(selectedHistoryRecord.input.horseCount)} |{' '}
                {formatCurrency(selectedHistoryRecord.result.positionPayout)}
              </p>
              <dl className="history-list__distribution">
                <div>
                  <dt>Entrenador</dt>
                  <dd>{formatCurrency(selectedHistoryRecord.result.trainerAmount)}</dd>
                </div>
                <div>
                  <dt>Groom</dt>
                  <dd>{formatCurrency(selectedHistoryRecord.result.groomAmount)}</dd>
                </div>
                <div>
                  <dt>Jockey</dt>
                  <dd>{formatCurrency(selectedHistoryRecord.result.jockeyAmount)}</dd>
                </div>
                <div>
                  <dt>Ganancia</dt>
                  <dd>{formatCurrency(selectedHistoryRecord.result.profitAmount)}</dd>
                </div>
              </dl>
            </div>
          ) : null}

          {historyRecords.length > 0 ? (
            <ul className="history-list">
              {historyRecords.map((record) => (
                <li key={record.id} className="history-list__item">
                  <div className="history-list__content">
                    <button
                      type="button"
                      className={`history-list__summary${
                        record.kind === 'single' ? ' history-list__summary--clickable' : ''
                      }`}
                      onClick={() => handleSelectHistoryRecord(record)}
                    >
                      <div>
                        <p className="history-list__type">
                          {record.kind === 'single' ? 'Carrera individual' : 'Sesion guardada'}
                        </p>
                        <strong>
                          {record.kind === 'single'
                            ? record.input.horseName
                            : `${record.totals.raceCount} carreras guardadas`}
                        </strong>
                        <p className="history-list__meta">{formatDateTime(record.createdAt)}</p>
                        {record.kind === 'single' ? (
                          <p className="history-list__details">
                            {formatPositionLabel(record.input.finishPosition)} |{' '}
                            {formatHorseCountLabel(record.input.horseCount)} |{' '}
                            {formatCurrency(record.result.positionPayout)}
                          </p>
                        ) : (
                          <p className="history-list__details">
                            Total distribuido {formatCurrency(record.totals.totalPositionPayout)}
                          </p>
                        )}
                      </div>
                      {record.kind === 'single' ? (
                        <span className="history-list__toggle">
                          {selectedHistoryRecordId === record.id ? 'Seleccionada' : 'Ver pagos'}
                        </span>
                      ) : null}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => handleDeleteHistoryRecord(record.id)}
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state empty-state--compact">
              <p>Todavia no hay calculos guardados en este navegador.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App

