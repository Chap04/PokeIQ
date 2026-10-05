import {
  pokemonSpecies,
} from '../../data/pokemonSpecies'

function normalizeText(
  value
) {
  if (
    typeof value !==
    'string'
  ) {
    return ''
  }

  return value
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(
      /[♀]/g,
      ' female '
    )
    .replace(
      /[♂]/g,
      ' male '
    )
    .replace(
      /[^a-zA-Z0-9]+/g,
      ' '
    )
    .trim()
    .toLowerCase()
}

function getEditDistance(
  leftValue,
  rightValue
) {
  const left =
    normalizeText(
      leftValue
    )

  const right =
    normalizeText(
      rightValue
    )

  if (
    left === right
  ) {
    return 0
  }

  if (
    left.length === 0
  ) {
    return right.length
  }

  if (
    right.length === 0
  ) {
    return left.length
  }

  const previousRow =
    Array.from(
      {
        length:
          right.length + 1,
      },
      (
        _,
        index
      ) => index
    )

  for (
    let leftIndex = 1;
    leftIndex <=
    left.length;
    leftIndex += 1
  ) {
    const currentRow = [
      leftIndex,
    ]

    for (
      let rightIndex = 1;
      rightIndex <=
      right.length;
      rightIndex += 1
    ) {
      const substitutionCost =
        left[
          leftIndex - 1
        ] ===
        right[
          rightIndex - 1
        ]
          ? 0
          : 1

      currentRow[
        rightIndex
      ] =
        Math.min(
          currentRow[
            rightIndex - 1
          ] + 1,

          previousRow[
            rightIndex
          ] + 1,

          previousRow[
            rightIndex - 1
          ] +
            substitutionCost
        )
    }

    for (
      let index = 0;
      index <
      currentRow.length;
      index += 1
    ) {
      previousRow[index] =
        currentRow[index]
    }
  }

  return previousRow[
    right.length
  ]
}

function getSimilarity(
  leftValue,
  rightValue
) {
  const left =
    normalizeText(
      leftValue
    )

  const right =
    normalizeText(
      rightValue
    )

  if (
    !left ||
    !right
  ) {
    return 0
  }

  if (
    left === right
  ) {
    return 100
  }

  const longestLength =
    Math.max(
      left.length,
      right.length
    )

  const distance =
    getEditDistance(
      left,
      right
    )

  return Math.max(
    0,
    Math.round(
      (
        1 -
        distance /
          longestLength
      ) *
        100
    )
  )
}

function getSpeciesNames(
  species
) {
  return [
    species?.name,
    species?.apiName,
  ]
    .filter(Boolean)
    .map(
      (name) => ({
        original:
          name,

        normalized:
          normalizeText(
            name
          ),
      })
    )
    .filter(
      (entry) =>
        Boolean(
          entry.normalized
        )
    )
}

function findContainedSpecies(
  normalizedText
) {
  const matches = []

  for (
    const species
    of pokemonSpecies
  ) {
    for (
      const nameEntry
      of getSpeciesNames(
        species
      )
    ) {
      const speciesName =
        nameEntry.normalized

      const paddedText =
        ` ${normalizedText} `

      const paddedSpecies =
        ` ${speciesName} `

      if (
        paddedText.includes(
          paddedSpecies
        )
      ) {
        matches.push({
          species,

          matchedText:
            nameEntry.original,

          normalizedName:
            speciesName,

          length:
            speciesName.length,
        })
      }
    }
  }

  if (
    matches.length === 0
  ) {
    return null
  }

  /*
    Prefer the longest canonical name.

    This prevents a shorter Pokémon name from
    winning when its name is contained inside
    a longer valid species name.
  */
  matches.sort(
    (
      matchA,
      matchB
    ) =>
      matchB.length -
      matchA.length
  )

  return matches[0]
}

function buildTextCandidates(
  normalizedText
) {
  const words =
    normalizedText
      .split(/\s+/)
      .filter(Boolean)

  const candidates =
    new Set()

  for (
    const word
    of words
  ) {
    candidates.add(
      word
    )
  }

  /*
    Include neighboring word groups for
    multi-word canonical names.
  */
  for (
    let startIndex = 0;
    startIndex <
    words.length;
    startIndex += 1
  ) {
    for (
      let length = 2;
      length <= 4;
      length += 1
    ) {
      const endIndex =
        startIndex +
        length

      if (
        endIndex >
        words.length
      ) {
        break
      }

      candidates.add(
        words
          .slice(
            startIndex,
            endIndex
          )
          .join(' ')
      )
    }
  }

  return Array.from(
    candidates
  )
}

function findFuzzySpecies(
  normalizedText
) {
  const textCandidates =
    buildTextCandidates(
      normalizedText
    )

  let bestMatch = null

  for (
    const species
    of pokemonSpecies
  ) {
    for (
      const nameEntry
      of getSpeciesNames(
        species
      )
    ) {
      for (
        const candidate
        of textCandidates
      ) {
        const similarity =
          getSimilarity(
            candidate,
            nameEntry.normalized
          )

        if (
          !bestMatch ||
          similarity >
            bestMatch.confidence
        ) {
          bestMatch = {
            species,

            confidence:
              similarity,

            candidate,

            matchedText:
              nameEntry.original,
          }
        }
      }
    }
  }

  return bestMatch
}

export function resolveStorageSpecies(
  rawText
) {
  const normalizedText =
    normalizeText(
      rawText
    )

  if (
    !normalizedText
  ) {
    return {
      species:
        null,

      confidence:
        0,

      matchType:
        'missing',

      originalText:
        rawText ?? '',

      matchedText:
        null,
    }
  }

  const containedMatch =
    findContainedSpecies(
      normalizedText
    )

  if (
    containedMatch
  ) {
    return {
      species:
        containedMatch.species,

      confidence:
        100,

      matchType:
        'contained',

      originalText:
        rawText,

      matchedText:
        containedMatch.matchedText,
    }
  }

  const fuzzyMatch =
    findFuzzySpecies(
      normalizedText
    )

  if (
    !fuzzyMatch ||
    fuzzyMatch.confidence <
      72
  ) {
    return {
      species:
        null,

      confidence:
        fuzzyMatch
          ?.confidence ??
          0,

      matchType:
        'unmatched',

      originalText:
        rawText,

      matchedText:
        fuzzyMatch
          ?.matchedText ??
          null,
    }
  }

  return {
    species:
      fuzzyMatch.species,

    confidence:
      fuzzyMatch.confidence,

    matchType:
      'fuzzy',

    originalText:
      rawText,

    matchedText:
      fuzzyMatch.matchedText,

    candidate:
      fuzzyMatch.candidate,
  }
}

export default resolveStorageSpecies