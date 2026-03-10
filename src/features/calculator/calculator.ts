import type {
  AgeGroup,
  CalculationInput,
  CalculationResult,
  Category,
  SessionRace,
  SessionTotals,
} from './types'

type FixedCategory = Exclude<Category, 'clasico'>
type PayoutMap = Record<FixedCategory, number>

const PURSE_TABLES: Record<AgeGroup, PayoutMap> = {
  young: {
    100: 85000,
    200: 95000,
    300: 110207,
    400: 131902,
    500: 148540,
    600: 165310,
  },
  older: {
    100: 85000,
    200: 95000,
    300: 110207,
    400: 125247,
    500: 141086,
    600: 157058,
  },
}

const POSITION_TABLES: Record<3 | 4 | 5, Record<number, number>> = {
  3: {
    1: 0.6667,
    2: 0.2223,
    3: 0.111,
  },
  4: {
    1: 0.625,
    2: 0.2083,
    3: 0.1042,
    4: 0.0625,
  },
  5: {
    1: 0.6,
    2: 0.2,
    3: 0.1,
    4: 0.06,
    5: 0.04,
  },
}

export const AGE_GROUP_OPTIONS: Array<{ value: AgeGroup; label: string }> = [
  { value: 'young', label: '3 anos o menos' },
  { value: 'older', label: '4 anos o mas' },
]

export const CATEGORY_OPTIONS: Array<{ value: Category; label: string }> = [
  { value: 100, label: '100' },
  { value: 200, label: '200' },
  { value: 300, label: '300' },
  { value: 400, label: '400' },
  { value: 500, label: '500' },
  { value: 600, label: 'No Reclamable' },
  { value: 'clasico', label: 'Clasico' },
]
export const HORSE_COUNT_OPTIONS = [
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5 o mas' },
] as const

export function getFinishPositionOptions(horseCount: number): number[] {
  const normalizedHorseCount = horseCount >= 5 ? 5 : Math.max(3, horseCount)
  return Array.from({ length: normalizedHorseCount }, (_, index) => index + 1)
}

export function formatCategoryLabel(category: Category): string {
  if (category === 'clasico') {
    return 'Clasico'
  }

  return category === 600 ? 'No Reclamable' : String(category)
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

export function getBasePurse(input: Pick<CalculationInput, 'ageGroup' | 'category' | 'customPurse'>): number {
  if (input.category === 'clasico') {
    if (typeof input.customPurse !== 'number' || input.customPurse <= 0) {
      throw new Error('Clasico races require a custom purse amount.')
    }

    return roundCurrency(input.customPurse)
  }

  return PURSE_TABLES[input.ageGroup][input.category]
}

export function getPositionPercent(horseCount: number, finishPosition: number): number {
  if (horseCount < 3) {
    throw new Error('Horse count must be 3 or greater.')
  }

  const normalizedHorseCount = horseCount >= 5 ? 5 : (horseCount as 3 | 4)
  const table = POSITION_TABLES[normalizedHorseCount]
  return table[finishPosition] ?? 0
}

export function formatPositionPercent(percent: number): string {
  return `${(percent * 100).toFixed(2)}%`
}

export function calculateRacePayout(input: CalculationInput): CalculationResult {
  const basePurse = getBasePurse(input)
  const positionPercent = getPositionPercent(input.horseCount, input.finishPosition)
  const positionPayout = roundCurrency(basePurse * positionPercent)
  const trainerAmount = roundCurrency(positionPayout * 0.15)
  const groomAmount = roundCurrency(positionPayout * 0.1)
  const jockeyAmount = roundCurrency(positionPayout * 0.1)
  const profitAmount = roundCurrency(positionPayout * 0.65)

  return {
    basePurse,
    positionPercent,
    positionPayout,
    trainerAmount,
    groomAmount,
    jockeyAmount,
    profitAmount,
  }
}

export function aggregateSessionTotals(races: SessionRace[]): SessionTotals {
  return races.reduce<SessionTotals>(
    (totals, race) => ({
      raceCount: totals.raceCount + 1,
      totalPositionPayout: roundCurrency(totals.totalPositionPayout + race.result.positionPayout),
      totalTrainerAmount: roundCurrency(totals.totalTrainerAmount + race.result.trainerAmount),
      totalGroomAmount: roundCurrency(totals.totalGroomAmount + race.result.groomAmount),
      totalJockeyAmount: roundCurrency(totals.totalJockeyAmount + race.result.jockeyAmount),
      totalProfitAmount: roundCurrency(totals.totalProfitAmount + race.result.profitAmount),
    }),
    {
      raceCount: 0,
      totalPositionPayout: 0,
      totalTrainerAmount: 0,
      totalGroomAmount: 0,
      totalJockeyAmount: 0,
      totalProfitAmount: 0,
    },
  )
}
