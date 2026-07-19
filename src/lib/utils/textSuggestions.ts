// Text extraction utilities for "smart product name suggestions".
// Derives candidate product names from the current user's tiktok_videos
// descriptions (inline #hashtags + frequent 2-4 word phrases).

// A pragmatic, non-exhaustive stopword list — enough to kill filler n-grams,
// not a full corpus. Extend as noisy suggestions are observed in practice.
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'for', 'with', 'this', 'that',
  'these', 'those', 'you', 'your', 'yours', 'our', 'ours', 'my', 'mine',
  'i', 'im', "i'm", 'me', 'we', 'us', 'it', 'its', 'is', 'are', 'was',
  'were', 'be', 'been', 'being', 'to', 'of', 'in', 'on', 'at', 'by',
  'from', 'as', 'so', 'if', 'not', 'no', 'do', 'did', 'does', 'have',
  'has', 'had', 'just', 'get', 'got', 'all', 'can', 'will', 'up', 'out',
  'about', 'like', 'more', 'than', 'when', 'what', 'how', 'why', 'here',
  'there', 'now', 'today', 'them', 'they', 'he', 'she', 'his', 'her',
])

// Common creator/TikTok boilerplate — excluded even though not pure stopwords.
// Heuristic, not exhaustive; extend as new boilerplate phrases are observed.
const BOILERPLATE_BLOCKLIST = [
  'link in bio', 'in my bio', 'for you page', 'check out', 'check this out',
  'tap the link', 'click the link', 'shop now', 'shop my', 'follow for more',
  'follow me for more', 'comment below', 'let me know', 'as seen on',
]

function splitCamelCase(token: string): string {
  // "SnapChews" -> "Snap Chews"; leaves already-lowercase/plain tokens alone.
  return token.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
}

function titleCaseWords(s: string): string {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

export function extractHashtags(description: string | null | undefined): string[] {
  if (!description) return []
  const matches = Array.from(description.matchAll(/#(\w+)/g))
  const tags: string[] = []
  matches.forEach((m) => {
    const raw = m[1]
    if (raw && !/^\d+$/.test(raw)) tags.push(raw)
  })
  return tags
}

function tokenizeWords(description: string): string[] {
  const withoutTags = description.replace(/#\w+/g, ' ')
  const withoutUrls = withoutTags.replace(/https?:\/\/\S+/g, ' ')
  return withoutUrls
    .toLowerCase()
    .split(/[^a-z0-9']+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !/^\d+$/.test(w))
}

export function extractPhrases(description: string | null | undefined): string[] {
  if (!description) return []
  const words = tokenizeWords(description)
  const phrases: string[] = []
  for (const n of [2, 3, 4]) {
    for (let i = 0; i + n <= words.length; i++) {
      const slice = words.slice(i, i + n)
      if (slice.every((w) => STOPWORDS.has(w))) continue
      const phrase = slice.join(' ')
      if (BOILERPLATE_BLOCKLIST.some((b) => phrase.includes(b))) continue
      phrases.push(phrase)
    }
  }
  return phrases
}

export interface Suggestion {
  phrase: string
  count: number
  source: 'hashtag' | 'phrase'
}

interface SuggestionVideoInput {
  description: string | null
  hashtags: string[] | null
}

const HASHTAG_WEIGHT = 1.5 // tunable: hashtags are a more deliberate signal than incidental phrasing
const MIN_DISTINCT_VIDEOS = 2 // must appear in 2+ distinct videos to qualify
const MAX_SUGGESTIONS = 50

interface Entry {
  displayPhrase: string
  hashtagVideoIdx: Set<number>
  phraseVideoIdx: Set<number>
}

export function buildSuggestions(videos: SuggestionVideoInput[]): Suggestion[] {
  const entries = new Map<string, Entry>()

  videos.forEach((video, videoIdx) => {
    const description = video.description || ''

    // Hashtag signal: primarily regex-extracted from description (the real,
    // populated field). Defensively also read the hashtags column in case a
    // future sync upgrade populates it — treated as secondary, likely-empty.
    const rawTags = Array.from(
      new Set<string>([...extractHashtags(description), ...(video.hashtags || [])])
    )
    rawTags.forEach((raw) => {
      const spaced = splitCamelCase(raw)
      const key = spaced.toLowerCase().trim()
      if (!key || STOPWORDS.has(key)) return
      const entry =
        entries.get(key) ??
        { displayPhrase: titleCaseWords(spaced), hashtagVideoIdx: new Set<number>(), phraseVideoIdx: new Set<number>() }
      entry.hashtagVideoIdx.add(videoIdx)
      entries.set(key, entry)
    })

    // Phrase signal — dedupe within a single description so a phrase
    // repeated 3x in one caption still only counts once for that video.
    const phrasesInThisVideo = Array.from(new Set(extractPhrases(description)))
    phrasesInThisVideo.forEach((phrase) => {
      const entry =
        entries.get(phrase) ??
        { displayPhrase: titleCaseWords(phrase), hashtagVideoIdx: new Set<number>(), phraseVideoIdx: new Set<number>() }
      entry.phraseVideoIdx.add(videoIdx)
      entries.set(phrase, entry)
    })
  })

  const scored: (Suggestion & { weight: number })[] = []
  Array.from(entries.values()).forEach((entry) => {
    const distinctVideoCount = new Set([
      ...Array.from(entry.hashtagVideoIdx),
      ...Array.from(entry.phraseVideoIdx),
    ]).size
    if (distinctVideoCount < MIN_DISTINCT_VIDEOS) return

    // Videos where the phrase appeared as an n-gram but NOT already counted
    // via hashtag in that same video (avoid double-weighting one video).
    const phraseOnlyCount = Array.from(entry.phraseVideoIdx).filter(
      (i) => !entry.hashtagVideoIdx.has(i)
    ).length
    const weight = entry.hashtagVideoIdx.size * HASHTAG_WEIGHT + phraseOnlyCount

    scored.push({
      phrase: entry.displayPhrase,
      count: distinctVideoCount,
      source: entry.hashtagVideoIdx.size > 0 ? 'hashtag' : 'phrase',
      weight,
    })
  })

  scored.sort((a, b) => b.weight - a.weight || b.count - a.count)
  return scored.slice(0, MAX_SUGGESTIONS).map(({ weight, ...rest }) => rest)
}
