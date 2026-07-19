import { describe, it, expect } from 'vitest'
import { extractHashtags, extractPhrases, buildSuggestions } from '@/lib/utils/textSuggestions'

describe('extractHashtags', () => {
  it('extracts hashtag tokens without the # prefix', () => {
    expect(extractHashtags('Try our #SnapChews today! #tiktokshop')).toEqual([
      'SnapChews',
      'tiktokshop',
    ])
  })

  it('ignores purely numeric hashtags', () => {
    expect(extractHashtags('Day #30 of the challenge #snapchews')).toEqual(['snapchews'])
  })

  it('returns an empty array for null/undefined/no hashtags', () => {
    expect(extractHashtags(null)).toEqual([])
    expect(extractHashtags(undefined)).toEqual([])
    expect(extractHashtags('no hashtags here')).toEqual([])
  })
})

describe('extractPhrases', () => {
  it('generates 2-4 word n-grams from the description', () => {
    const phrases = extractPhrases('snap chews changed my life')
    expect(phrases).toContain('snap chews')
    expect(phrases).toContain('snap chews changed')
    expect(phrases).toContain('snap chews changed my')
  })

  it('drops n-grams made entirely of stopwords', () => {
    const phrases = extractPhrases('this is the for you')
    expect(phrases).not.toContain('this is')
    expect(phrases).not.toContain('for you')
  })

  it('drops boilerplate phrases', () => {
    const phrases = extractPhrases('link in bio for the snap chews deal')
    expect(phrases.some((p) => p.includes('link in bio'))).toBe(false)
  })

  it('strips hashtags and URLs before tokenizing', () => {
    const phrases = extractPhrases('check https://example.com #snapchews out now')
    expect(phrases.every((p) => !p.includes('http') && !p.includes('#'))).toBe(true)
  })

  it('returns an empty array for null/undefined', () => {
    expect(extractPhrases(null)).toEqual([])
    expect(extractPhrases(undefined)).toEqual([])
  })
})

describe('buildSuggestions', () => {
  it('excludes phrases/hashtags appearing in only 1 video', () => {
    const suggestions = buildSuggestions([
      { description: 'try the snap chews today', hashtags: null },
      { description: 'a totally unrelated caption here', hashtags: null },
    ])
    expect(suggestions.find((s) => s.phrase.toLowerCase() === 'snap chews')).toBeUndefined()
  })

  it('includes phrases appearing in 2+ distinct videos with correct count', () => {
    const suggestions = buildSuggestions([
      { description: 'try the snap chews today', hashtags: null },
      { description: 'snap chews are the best', hashtags: null },
      { description: 'nothing related in this one', hashtags: null },
    ])
    const match = suggestions.find((s) => s.phrase.toLowerCase() === 'snap chews')
    expect(match).toBeDefined()
    expect(match?.count).toBe(2)
    expect(match?.source).toBe('phrase')
  })

  it('counts a phrase repeated multiple times in one caption as a single video occurrence', () => {
    const suggestions = buildSuggestions([
      { description: 'snap chews snap chews snap chews', hashtags: null },
      { description: 'i love snap chews so much', hashtags: null },
    ])
    const match = suggestions.find((s) => s.phrase.toLowerCase() === 'snap chews')
    expect(match?.count).toBe(2)
  })

  it('merges a hashtag and its plain-text phrase equivalent into one suggestion', () => {
    const suggestions = buildSuggestions([
      { description: 'obsessed with #SnapChews right now', hashtags: null },
      { description: 'snap chews changed my routine', hashtags: null },
    ])
    const matches = suggestions.filter((s) => s.phrase.toLowerCase() === 'snap chews')
    expect(matches.length).toBe(1)
    expect(matches[0].count).toBe(2)
    expect(matches[0].source).toBe('hashtag')
  })

  it('ranks hashtag-heavy entries above equal-count phrase-only entries', () => {
    const suggestions = buildSuggestions([
      { description: 'love #prostatechews so much', hashtags: null },
      { description: 'another day with #prostatechews', hashtags: null },
      { description: 'the big boy bundle is great', hashtags: null },
      { description: 'the big boy bundle again', hashtags: null },
    ])
    const hashtagIdx = suggestions.findIndex((s) => s.phrase.toLowerCase() === 'prostatechews')
    const phraseIdx = suggestions.findIndex((s) => s.phrase.toLowerCase() === 'big boy bundle')
    expect(hashtagIdx).toBeGreaterThanOrEqual(0)
    expect(phraseIdx).toBeGreaterThanOrEqual(0)
    expect(hashtagIdx).toBeLessThan(phraseIdx)
  })

  it('returns an empty array for an empty input list', () => {
    expect(buildSuggestions([])).toEqual([])
  })
})
