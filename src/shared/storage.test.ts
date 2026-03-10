import { describe, expect, it } from 'vitest'
import { buildHorseNameList, normalizeHorseName } from './storage'

describe('horse name storage helpers', () => {
  it('normalizes extra whitespace', () => {
    expect(normalizeHorseName('  Relampago   Rojo  ')).toBe('Relampago Rojo')
  })

  it('removes empty values, deduplicates names, and sorts them', () => {
    expect(
      buildHorseNameList([
        'Zafiro',
        '  relampago rojo ',
        '',
        'Relampago   Rojo',
        'Canela',
      ]),
    ).toEqual(['Canela', 'relampago rojo', 'Zafiro'])
  })
})
