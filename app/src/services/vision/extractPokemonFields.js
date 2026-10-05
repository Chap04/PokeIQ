import { findPokemonSpecies } from './findPokemonSpecies'

function extractCp(rawText) {
  const cpMatch = rawText.match(
    /\bCP\s*([0-9OZIl]{1,5})\b/i
  )

  if (!cpMatch) {
    return {
      value: null,
      rawValue: null,
      confidence: 0,
    }
  }

  const correctedValue = cpMatch[1]
    .replace(/[Oo]/g, '0')
    .replace(/[Zz]/g, '2')
    .replace(/[Il]/g, '1')

  const numericCp = Number(correctedValue)

  return {
    value: Number.isFinite(numericCp)
      ? numericCp
      : null,

    rawValue: cpMatch[1],

    confidence: Number.isFinite(numericCp)
      ? 95
      : 0,
  }
}

function extractIvs(rawText) {
  const ivMatch = rawText.match(
    /\b([0-9Il]{1,2})\s*[\/\s]\s*([0-9Il]{1,2})\s*[\/\s]\s*([0-9Il]{1,2})\b/
  )

  if (!ivMatch) {
    return {
      value: {
        attack: null,
        defense: null,
        stamina: null,
      },

      rawValue: null,
      confidence: 0,
    }
  }

  const values = ivMatch
    .slice(1, 4)
    .map((value) =>
      Number(
        value.replace(/[Il]/g, '1')
      )
    )

  const validValues = values.every(
    (value) =>
      Number.isInteger(value) &&
      value >= 0 &&
      value <= 15
  )

  return {
    value: validValues
      ? {
          attack: values[0],
          defense: values[1],
          stamina: values[2],
        }
      : {
          attack: null,
          defense: null,
          stamina: null,
        },

    rawValue: ivMatch
      .slice(1, 4)
      .join(' / '),

    confidence: validValues
      ? 92
      : 0,
  }
}

function extractSpecies(rawText) {
  const lines = rawText
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const excludedPatterns = [
    /^CP\b/i,
    /^shadow$/i,
    /^shiny$/i,
    /^purified$/i,
    /^lucky$/i,
    /^\d+\s*[\/\s]\s*\d+\s*[\/\s]\s*\d+$/,
  ]

  const candidateLines = lines.filter(
    (line) =>
      !excludedPatterns.some(
        (pattern) =>
          pattern.test(line)
      )
  )

  let bestSpeciesMatch = null

  candidateLines.forEach((line) => {
    const result =
      findPokemonSpecies(line)

    if (
      result.species &&
      (
        !bestSpeciesMatch ||
        result.confidence >
          bestSpeciesMatch.confidence
      )
    ) {
      bestSpeciesMatch = result
    }
  })

  return (
    bestSpeciesMatch ?? {
      species: null,
      confidence: 0,
      originalText: null,
    }
  )
}

function extractTraits(rawText) {
  return {
    shiny:
      /\bshiny\b/i.test(rawText),

    shadow:
      /\bshadow\b/i.test(rawText),

    purified:
      /\bpurified\b/i.test(rawText),

    lucky:
      /\blucky\b/i.test(rawText),
  }
}

export function extractPokemonFields(
  rawText
) {
  return {
    cp: extractCp(rawText),
    ivs: extractIvs(rawText),
    species: extractSpecies(rawText),
    traits: extractTraits(rawText),
  }
}