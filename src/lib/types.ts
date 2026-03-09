export type AgeGroup = 'young' | 'older'

export type Category = 100 | 200 | 300 | 400 | 500 | 600

export type CalculationInput = {
  horseName: string
  ageGroup: AgeGroup
  category: Category
  horseCount: number
  finishPosition: number
}

export type CalculationResult = {
  basePurse: number
  positionPercent: number
  positionPayout: number
  trainerAmount: number
  groomAmount: number
  jockeyAmount: number
  profitAmount: number
}

export type SessionRace = {
  id: string
  input: CalculationInput
  result: CalculationResult
}

export type SessionTotals = {
  raceCount: number
  totalPositionPayout: number
  totalTrainerAmount: number
  totalGroomAmount: number
  totalJockeyAmount: number
  totalProfitAmount: number
}

export type CalculationRecord = {
  id: string
  kind: 'single'
  createdAt: string
  input: CalculationInput
  result: CalculationResult
}

export type SessionRecord = {
  id: string
  kind: 'session'
  createdAt: string
  races: SessionRace[]
  totals: SessionTotals
}

export type HistoryRecord = CalculationRecord | SessionRecord
