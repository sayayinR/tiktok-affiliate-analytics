import { describe, it, expect } from 'vitest'
import {
  formatCount,
  formatCurrency,
  formatPercent,
  calcEngagementRate,
  truncate,
  safeJsonParse,
  cn,
} from '@/lib/utils'

describe('formatCount', () => {
  it('formats numbers under 1000 as-is', () => {
    expect(formatCount(999)).toBe('999')
    expect(formatCount(0)).toBe('0')
  })

  it('formats thousands with K suffix', () => {
    expect(formatCount(1000)).toBe('1.0K')
    expect(formatCount(3057)).toBe('3.1K')
    expect(formatCount(12450)).toBe('12.4K')
  })

  it('formats millions with M suffix', () => {
    expect(formatCount(1_000_000)).toBe('1.0M')
    expect(formatCount(2_500_000)).toBe('2.5M')
  })
})

describe('formatCurrency', () => {
  it('formats as USD currency', () => {
    expect(formatCurrency(1840)).toBe('$1,840')
    expect(formatCurrency(0)).toBe('$0')
    expect(formatCurrency(1000000)).toBe('$1,000,000')
  })
})

describe('formatPercent', () => {
  it('adds + sign for positive values', () => {
    expect(formatPercent(18.4)).toBe('+18.4%')
    expect(formatPercent(0)).toBe('+0.0%')
  })

  it('shows negative sign for negative values', () => {
    expect(formatPercent(-5.2)).toBe('-5.2%')
  })

  it('respects decimal places', () => {
    expect(formatPercent(18.4321, 2)).toBe('+18.43%')
  })
})

describe('calcEngagementRate', () => {
  it('calculates correct engagement rate', () => {
    // (412 + 50 + 30) / 3057 * 100 ≈ 16.1%
    const rate = calcEngagementRate(412, 50, 30, 3057)
    expect(rate).toBeCloseTo(16.1, 0)
  })

  it('returns 0 when views is 0 to avoid division by zero', () => {
    expect(calcEngagementRate(100, 10, 5, 0)).toBe(0)
  })
})

describe('truncate', () => {
  it('returns string unchanged if under maxLength', () => {
    expect(truncate('short', 10)).toBe('short')
    expect(truncate('exact len', 9)).toBe('exact len')
  })

  it('truncates and appends ellipsis', () => {
    expect(truncate('This is a long description', 10)).toBe('This is a ...')
  })
})

describe('safeJsonParse', () => {
  it('parses valid JSON', () => {
    expect(safeJsonParse('{"key":"value"}', {})).toEqual({ key: 'value' })
    expect(safeJsonParse('[1,2,3]', [])).toEqual([1, 2, 3])
  })

  it('returns fallback on invalid JSON', () => {
    expect(safeJsonParse('not json', { fallback: true })).toEqual({ fallback: true })
    expect(safeJsonParse('', [])).toEqual([])
  })
})

describe('cn (className merge)', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'excluded', 'included')).toBe('base included')
  })

  it('resolves Tailwind conflicts', () => {
    // tailwind-merge removes earlier conflicting class
    expect(cn('p-4', 'p-6')).toBe('p-6')
  })
})
