import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import horseLogo from '../assets/HorseLogo.jpeg'
import {
  AGE_GROUP_OPTIONS,
  CATEGORY_OPTIONS,
  HORSE_COUNT_OPTIONS,
  aggregateSessionTotals,
  calculateRacePayout,
  formatCategoryLabel,
  formatPositionPercent,
  getFinishPositionOptions,
} from '../features/calculator/calculator'
import {
  formatCurrency,
  formatDateTime,
  formatHorseCountLabel,
  formatPositionLabel,
} from '../shared/format'
import {
  buildHorseNameList,
  loadHistoryRecords,
  loadHorseNames,
  normalizeHorseName,
  saveHistoryRecords,
  saveHorseNames,
} from '../shared/storage'
import type {
  AgeGroup,
  CalculationInput,
  CalculationRecord,
  CalculationResult,
  HistoryRecord,
  SessionRecord,
  SessionRace,
} from '../features/calculator/types'

type FormState = {
  horseName: string
  ageGroup: AgeGroup
  category: CalculationInput['category']
  customPurse: string
  horseCount: string
  finishPosition: string
}

type HistoryTab = 'single' | 'session'

const DEFAULT_FORM: FormState = {
  horseName: '',
  ageGroup: 'young',
  category: 100,
  customPurse: '',
  horseCount: '5',
  finishPosition: '1',
}

function App() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [horseNames, setHorseNames] = useState<string[]>([])
  const [managedHorseName, setManagedHorseName] = useState('')
  const [newHorseName, setNewHorseName] = useState('')
  const [currentResult, setCurrentResult] = useState<CalculationResult | null>(null)
  const [currentInput, setCurrentInput] = useState<CalculationInput | null>(null)
  const [sessionRaces, setSessionRaces] = useState<SessionRace[]>([])
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([])
  const [selectedHistoryRecordId, setSelectedHistoryRecordId] = useState<string | null>(null)
  const [historyTab, setHistoryTab] = useState<HistoryTab>('single')
  const [errorMessage, setErrorMessage] = useState('')
  const [horseErrorMessage, setHorseErrorMessage] = useState('')
  const [confirmingClearHistory, setConfirmingClearHistory] = useState(false)
  const sessionTotals = aggregateSessionTotals(sessionRaces)
  const finishPositionOptions = getFinishPositionOptions(Number.parseInt(form.horseCount, 10))
  const selectedHistoryRecord =
    historyRecords.find(
      (record): record is CalculationRecord =>
        record.kind === 'single' && record.id === selectedHistoryRecordId,
    ) ?? null
  const selectedSessionHistoryRecord =
    historyRecords.find(
      (record): record is SessionRecord =>
        record.kind === 'session' && record.id === selectedHistoryRecordId,
    ) ?? null
  const visibleHistoryRecords = historyRecords.filter((record) => record.kind === historyTab)

  useEffect(() => {
    setHistoryRecords(loadHistoryRecords())
    setHorseNames(loadHorseNames())
  }, [])

  useEffect(() => {
    saveHistoryRecords(historyRecords)
  }, [historyRecords])

  useEffect(() => {
    saveHorseNames(horseNames)
  }, [horseNames])

  useEffect(() => {
    if (historyRecords.length === 0 && confirmingClearHistory) {
      setConfirmingClearHistory(false)
    }
  }, [confirmingClearHistory, historyRecords.length])

  useEffect(() => {
    if (horseNames.length === 0) {
      if (form.horseName) {
        setForm((current) => ({ ...current, horseName: '' }))
      }

      if (managedHorseName) {
        setManagedHorseName('')
      }

      return
    }

    if (!horseNames.includes(form.horseName)) {
      setForm((current) => ({ ...current, horseName: horseNames[0] }))
    }

    if (!horseNames.includes(managedHorseName)) {
      setManagedHorseName(horseNames[0])
    }
  }, [form.horseName, horseNames, managedHorseName])

  const handleAddHorseName = () => {
    const normalizedHorseName = normalizeHorseName(newHorseName)

    if (!normalizedHorseName) {
      setHorseErrorMessage('Escribe un nombre valido para guardar el caballo.')
      return
    }

    const alreadyExists = horseNames.some(
      (horseName) => horseName.toLocaleLowerCase('es-DO') === normalizedHorseName.toLocaleLowerCase('es-DO'),
    )

    if (alreadyExists) {
      setHorseErrorMessage('Ese caballo ya esta guardado.')
      return
    }

    setHorseNames((current) => buildHorseNameList([...current, normalizedHorseName]))
    setForm((current) => ({ ...current, horseName: normalizedHorseName }))
    setManagedHorseName(normalizedHorseName)
    setNewHorseName('')
    setHorseErrorMessage('')
    setErrorMessage('')
  }

  const handleDeleteHorseName = () => {
    if (!managedHorseName) {
      return
    }

    const horseNameToDelete = managedHorseName
    const nextHorseNames = horseNames.filter((horseName) => horseName !== horseNameToDelete)

    setHorseNames(nextHorseNames)
    setManagedHorseName(nextHorseNames[0] ?? '')
    setHorseErrorMessage('')

    if (form.horseName === horseNameToDelete) {
      setForm((current) => ({
        ...current,
        horseName: nextHorseNames[0] ?? '',
      }))
    }
  }

  const handleCalculate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const horseCount = Number.parseInt(form.horseCount, 10)
    const finishPosition = Number.parseInt(form.finishPosition, 10)
    const customPurse = Number.parseFloat(form.customPurse)

    if (!form.horseName.trim()) {
      setErrorMessage('Selecciona un caballo guardado.')
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

    if (form.category === 'clasico' && (!Number.isFinite(customPurse) || customPurse <= 0)) {
      setErrorMessage('Para Clasico debes escribir una bolsa valida.')
      return
    }

    const input: CalculationInput = {
      horseName: form.horseName.trim(),
      ageGroup: form.ageGroup,
      category: form.category,
      customPurse: form.category === 'clasico' ? customPurse : undefined,
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
    setConfirmingClearHistory(false)
  }

  const handleSelectHistoryRecord = (record: HistoryRecord) => {
    setSelectedHistoryRecordId((current) => (current === record.id ? null : record.id))
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
            <div className="horse-library">
              <div className="horse-library__header">
                <div>
                  <p className="panel__eyebrow">Caballos guardados</p>
                  <h3>Gestion compacta</h3>
                </div>
                <strong>{horseNames.length}</strong>
              </div>

              <div className="horse-library__create">
                <input
                  type="text"
                  value={newHorseName}
                  onChange={(event) => {
                    setNewHorseName(event.target.value)
                    if (horseErrorMessage) {
                      setHorseErrorMessage('')
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      handleAddHorseName()
                    }
                  }}
                  placeholder="Ej. Relampago Rojo"
                />
                <button type="button" className="button button--success" onClick={handleAddHorseName}>
                  Agregar caballo
                </button>
              </div>

              {horseErrorMessage ? <p className="form-error">{horseErrorMessage}</p> : null}

              {horseNames.length > 0 ? (
                <div className="horse-library__controls">
                  <label>
                    Caballos guardados
                    <select
                      value={managedHorseName}
                      onChange={(event) => setManagedHorseName(event.target.value)}
                    >
                      {horseNames.map((horseName) => (
                        <option key={horseName} value={horseName}>
                          {horseName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={handleDeleteHorseName}
                  >
                    Quitar caballo seleccionado
                  </button>
                </div>
              ) : (
                <div className="empty-state empty-state--compact">
                  <p>Guarda tus caballos aqui para seleccionarlos mas rapido en cada carrera.</p>
                </div>
              )}
            </div>

            <label>
              Selecciona caballo
              <select
                value={form.horseName}
                onChange={(event) => setForm((current) => ({ ...current, horseName: event.target.value }))}
                disabled={horseNames.length === 0}
              >
                <option value="">
                  {horseNames.length === 0 ? 'Primero agrega un caballo' : 'Selecciona un caballo'}
                </option>
                {horseNames.map((horseName) => (
                  <option key={horseName} value={horseName}>
                    {horseName}
                  </option>
                ))}
              </select>
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
                    category:
                      event.target.value === 'clasico'
                        ? 'clasico'
                        : (Number.parseInt(event.target.value, 10) as CalculationInput['category']),
                  }))
                }
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={String(option.value)} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {form.category === 'clasico' ? (
              <label>
                Bolsa del clasico
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.customPurse}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, customPurse: event.target.value }))
                  }
                  placeholder="Ej. 250000"
                />
              </label>
            ) : null}

            <div className="calc-form__row">
              <label>
                Cantidad de caballos
                <select
                  value={form.horseCount}
                  onChange={(event) => {
                    const nextHorseCount = event.target.value
                    const nextPositionOptions = getFinishPositionOptions(Number.parseInt(nextHorseCount, 10))

                    setForm((current) => ({
                      ...current,
                      horseCount: nextHorseCount,
                      finishPosition: nextPositionOptions.includes(Number.parseInt(current.finishPosition, 10))
                        ? current.finishPosition
                        : String(nextPositionOptions[0]),
                    }))
                  }}
                >
                  {HORSE_COUNT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Posicion final
                <select
                  value={form.finishPosition}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, finishPosition: event.target.value }))
                  }
                >
                  {finishPositionOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

            <div className="form-actions">
              <button
                type="submit"
                className="button button--primary"
                disabled={horseNames.length === 0}
              >
                Calcular pago
              </button>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => {
                  setForm((current) => ({
                    ...DEFAULT_FORM,
                    horseName: horseNames.includes(current.horseName) ? current.horseName : (horseNames[0] ?? ''),
                  }))
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

          <div className="history-clear">
            {confirmingClearHistory ? (
              <>
                <p className="history-clear__warning">
                  Esto borrara todo el historial guardado en este navegador.
                </p>
                <div className="form-actions">
                  <button
                    type="button"
                    className="button button--danger"
                    onClick={handleClearHistory}
                    disabled={historyRecords.length === 0}
                  >
                    Confirmar borrado
                  </button>
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => setConfirmingClearHistory(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <div className="form-actions">
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => setConfirmingClearHistory(true)}
                  disabled={historyRecords.length === 0}
                >
                  Borrar historial
                </button>
              </div>
            )}
          </div>

          <div className="history-tabs" role="tablist" aria-label="Historial">
            <button
              type="button"
              className={`history-tabs__button${
                historyTab === 'single' ? ' history-tabs__button--active' : ''
              }`}
              onClick={() => setHistoryTab('single')}
            >
              Carreras individuales
            </button>
            <button
              type="button"
              className={`history-tabs__button${
                historyTab === 'session' ? ' history-tabs__button--active' : ''
              }`}
              onClick={() => setHistoryTab('session')}
            >
              Sesiones acumuladas
            </button>
          </div>

          {historyTab === 'single' && selectedHistoryRecord ? (
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

          {historyTab === 'session' && selectedSessionHistoryRecord ? (
            <div className="history-preview">
              <div className="history-preview__header">
                <div>
                  <p className="history-list__type">Sesion seleccionada</p>
                  <strong>{selectedSessionHistoryRecord.totals.raceCount} carreras guardadas</strong>
                  <p className="history-list__meta">
                    {formatDateTime(selectedSessionHistoryRecord.createdAt)}
                  </p>
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
                Total distribuido {formatCurrency(selectedSessionHistoryRecord.totals.totalPositionPayout)}
              </p>
              <dl className="history-list__distribution">
                <div>
                  <dt>Entrenador</dt>
                  <dd>{formatCurrency(selectedSessionHistoryRecord.totals.totalTrainerAmount)}</dd>
                </div>
                <div>
                  <dt>Groom</dt>
                  <dd>{formatCurrency(selectedSessionHistoryRecord.totals.totalGroomAmount)}</dd>
                </div>
                <div>
                  <dt>Jockey</dt>
                  <dd>{formatCurrency(selectedSessionHistoryRecord.totals.totalJockeyAmount)}</dd>
                </div>
                <div>
                  <dt>Ganancia</dt>
                  <dd>{formatCurrency(selectedSessionHistoryRecord.totals.totalProfitAmount)}</dd>
                </div>
              </dl>
              <ul className="history-preview__races">
                {selectedSessionHistoryRecord.races.map((race) => (
                  <li key={race.id}>
                    <strong>{race.input.horseName}</strong>
                    <span>
                      {' '}
                      | Categoria {formatCategoryLabel(race.input.category)} |{' '}
                      {formatHorseCountLabel(race.input.horseCount)} |{' '}
                      {formatPositionLabel(race.input.finishPosition)} |{' '}
                      {formatCurrency(race.result.positionPayout)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {visibleHistoryRecords.length > 0 ? (
            <ul className="history-list">
              {visibleHistoryRecords.map((record) => (
                <li key={record.id} className="history-list__item">
                  <div className="history-list__content">
                    <button
                      type="button"
                      className="history-list__summary history-list__summary--clickable"
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
                      <span className="history-list__toggle">
                        {selectedHistoryRecordId === record.id ? 'Seleccionada' : 'Ver pagos'}
                      </span>
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
              <p>
                {historyTab === 'single'
                  ? 'Todavia no hay carreras individuales guardadas en este navegador.'
                  : 'Todavia no hay sesiones acumuladas guardadas en este navegador.'}
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App

