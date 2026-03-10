import { describe, expect, it } from 'vitest'
import { aggregateSessionTotals, calculateRacePayout, getBasePurse, getPositionPercent } from './calculator'
import type { SessionRace } from './types'

describe('purse lookups', () => {
  it('returns the expected purse for young horses', () => {
    expect(getBasePurse({ ageGroup: 'young', category: 400 })).toBe(131902)
  })

  it('returns the expected purse for older horses', () => {
    expect(getBasePurse({ ageGroup: 'older', category: 600 })).toBe(157058)
  })

  it('returns the custom purse for clasico races', () => {
    expect(getBasePurse({ ageGroup: 'young', category: 'clasico', customPurse: 250000 })).toBe(250000)
  })
})

describe('position share lookups', () => {
  it('uses the 3 horse table', () => {
    expect(getPositionPercent(3, 3)).toBe(0.111)
  })

  it('uses the 4 horse table', () => {
    expect(getPositionPercent(4, 2)).toBe(0.2083)
  })

  it('uses the 5+ table', () => {
    expect(getPositionPercent(7, 4)).toBe(0.06)
  })

  it('returns zero for a non-paying position', () => {
    expect(getPositionPercent(5, 7)).toBe(0)
  })
})

describe('race calculations', () => {
  it('calculates a first-place payout for a young horse', () => {
    expect(
      calculateRacePayout({
        horseName: 'Relampago',
        ageGroup: 'young',
        category: 100,
        horseCount: 5,
        finishPosition: 1,
      }),
    ).toEqual({
      basePurse: 85000,
      positionPercent: 0.6,
      positionPayout: 51000,
      trainerAmount: 7650,
      groomAmount: 5100,
      jockeyAmount: 5100,
      profitAmount: 33150,
    })
  })

  it('calculates a four-horse second-place payout for an older horse', () => {
    expect(
      calculateRacePayout({
        horseName: 'Canela',
        ageGroup: 'older',
        category: 400,
        horseCount: 4,
        finishPosition: 2,
      }),
    ).toEqual({
      basePurse: 125247,
      positionPercent: 0.2083,
      positionPayout: 26089,
      trainerAmount: 3913,
      groomAmount: 2609,
      jockeyAmount: 2609,
      profitAmount: 16958,
    })
  })

  it('calculates a three-horse third-place payout for an older horse', () => {
    expect(
      calculateRacePayout({
        horseName: 'Estrella',
        ageGroup: 'older',
        category: 600,
        horseCount: 3,
        finishPosition: 3,
      }),
    ).toEqual({
      basePurse: 157058,
      positionPercent: 0.111,
      positionPayout: 17433,
      trainerAmount: 2615,
      groomAmount: 1743,
      jockeyAmount: 1743,
      profitAmount: 11332,
    })
  })

  it('returns zero payouts when the finish position does not pay', () => {
    expect(
      calculateRacePayout({
        horseName: 'Sombra',
        ageGroup: 'older',
        category: 300,
        horseCount: 5,
        finishPosition: 8,
      }),
    ).toEqual({
      basePurse: 110207,
      positionPercent: 0,
      positionPayout: 0,
      trainerAmount: 0,
      groomAmount: 0,
      jockeyAmount: 0,
      profitAmount: 0,
    })
  })

  it('calculates payouts for clasico using the custom purse', () => {
    expect(
      calculateRacePayout({
        horseName: 'Clasico Azul',
        ageGroup: 'older',
        category: 'clasico',
        customPurse: 300000,
        horseCount: 5,
        finishPosition: 2,
      }),
    ).toEqual({
      basePurse: 300000,
      positionPercent: 0.2,
      positionPayout: 60000,
      trainerAmount: 9000,
      groomAmount: 6000,
      jockeyAmount: 6000,
      profitAmount: 39000,
    })
  })
})

describe('session totals', () => {
  it('aggregates multiple races', () => {
    const races: SessionRace[] = [
      {
        id: '1',
        input: {
          horseName: 'Uno',
          ageGroup: 'young',
          category: 100,
          horseCount: 5,
          finishPosition: 1,
        },
        result: calculateRacePayout({
          horseName: 'Uno',
          ageGroup: 'young',
          category: 100,
          horseCount: 5,
          finishPosition: 1,
        }),
      },
      {
        id: '2',
        input: {
          horseName: 'Dos',
          ageGroup: 'older',
          category: 500,
          horseCount: 4,
          finishPosition: 4,
        },
        result: calculateRacePayout({
          horseName: 'Dos',
          ageGroup: 'older',
          category: 500,
          horseCount: 4,
          finishPosition: 4,
        }),
      },
    ]

    expect(aggregateSessionTotals(races)).toEqual({
      raceCount: 2,
      totalPositionPayout: 59818,
      totalTrainerAmount: 8973,
      totalGroomAmount: 5982,
      totalJockeyAmount: 5982,
      totalProfitAmount: 38881,
    })
  })

  it('returns zero totals for an empty session', () => {
    expect(aggregateSessionTotals([])).toEqual({
      raceCount: 0,
      totalPositionPayout: 0,
      totalTrainerAmount: 0,
      totalGroomAmount: 0,
      totalJockeyAmount: 0,
      totalProfitAmount: 0,
    })
  })
})
