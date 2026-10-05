import { pokemonSpecies } from '../../data/pokemonSpecies'

function calculateDistance(textA, textB) {
  const rows = textA.length + 1
  const columns = textB.length + 1

  const matrix = Array.from({ length: rows }, () =>
    Array(columns).fill(0)
  )

  for (let row = 0; row < rows; row += 1) {
    matrix[row][0] = row
  }

  for (let column = 0; column < columns; column += 1) {
    matrix[0][column] = column
  }

  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const cost =
        textA[row - 1] === textB[column - 1] ? 0 : 1

      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost
      )
    }
  }

  return matrix[textA.length][textB.length]
}

function scoreCandidate(rawName, speciesName) {
  const normalizedRawName = rawName.toLowerCase()
  const normalizedSpeciesName = speciesName.toLowerCase()

  const distance = calculateDistance(
    normalizedRawName,
    normalizedSpeciesName
  )

  const longestLength = Math.max(
    normalizedRawName.length,
    normalizedSpeciesName.length
  )

  if (longestLength === 0) {
    return 0
  }

  return Math.round(
    (1 - distance / longestLength) * 100
  )
}

export function findPokemonSpecies(candidateText) {
  const cleanedCandidate = candidateText
    .replace(/[^a-zA-ZÀ-ÿ.' -]/g, '')
    .trim()

  if (!cleanedCandidate) {
    return {
      species: null,
      confidence: 0,
      originalText: candidateText,
    }
  }

  const rankedSpecies = pokemonSpecies
    .map((species) => ({
      species,
      confidence: scoreCandidate(
        cleanedCandidate,
        species.name
      ),
    }))
    .sort(
      (candidateA, candidateB) =>
        candidateB.confidence - candidateA.confidence
    )

  const bestMatch = rankedSpecies[0]

  if (!bestMatch || bestMatch.confidence < 60) {
    return {
      species: null,
      confidence: bestMatch?.confidence ?? 0,
      originalText: candidateText,
    }
  }

  return {
    species: bestMatch.species,
    confidence: bestMatch.confidence,
    originalText: candidateText,
  }
}