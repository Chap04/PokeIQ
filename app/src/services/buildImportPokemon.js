import { pokemonSpecies } from '../data/pokemonSpecies'

import {
  getAllPokemonReferences,
  getPokemonDisplayName,
  getPokemonIdentity,
} from '../utils/pokemonReference'

function createImportId() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }

  return `import-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

function normalizeText(value) {
  if (typeof value !== 'string') {
    return ''
  }

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[♀]/g, ' female ')
    .replace(/[♂]/g, ' male ')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase()
}

function toFiniteNumber(value) {
  if (
    typeof value === 'number' &&
    Number.isFinite(value)
  ) {
    return value
  }

  if (typeof value !== 'string') {
    return null
  }

  const normalizedValue = value
    .replace(',', '.')
    .replace(/[^\d.-]/g, '')

  if (!normalizedValue) {
    return null
  }

  const number = Number(normalizedValue)

  return Number.isFinite(number)
    ? number
    : null
}

function toInteger(value) {
  const number = toFiniteNumber(value)

  if (number === null) {
    return null
  }

  const integer = Math.round(number)

  return Number.isInteger(integer)
    ? integer
    : null
}

function normalizeBoolean(value) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value === 1
  }

  if (typeof value !== 'string') {
    return false
  }

  const normalizedValue = value
    .trim()
    .toLowerCase()

  return [
    'true',
    'yes',
    '1',
    'shiny',
    'shadow',
    'purified',
    'favorite',
    'favourite',
    'lucky',
  ].includes(normalizedValue)
}

function clampIv(value) {
  const integer = toInteger(value)

  if (
    integer === null ||
    integer < 0 ||
    integer > 15
  ) {
    return null
  }

  return integer
}

function clampConfidence(value) {
  const number = toFiniteNumber(value)

  if (number === null) {
    return 0
  }

  return Math.max(
    0,
    Math.min(100, Math.round(number))
  )
}

function getEditDistance(
  leftValue,
  rightValue
) {
  const left = normalizeText(leftValue)
  const right = normalizeText(rightValue)

  if (left === right) {
    return 0
  }

  if (left.length === 0) {
    return right.length
  }

  if (right.length === 0) {
    return left.length
  }

  const previousRow = Array.from(
    { length: right.length + 1 },
    (_, index) => index
  )

  for (
    let leftIndex = 1;
    leftIndex <= left.length;
    leftIndex += 1
  ) {
    const currentRow = [leftIndex]

    for (
      let rightIndex = 1;
      rightIndex <= right.length;
      rightIndex += 1
    ) {
      const substitutionCost =
        left[leftIndex - 1] ===
        right[rightIndex - 1]
          ? 0
          : 1

      currentRow[rightIndex] = Math.min(
        currentRow[rightIndex - 1] + 1,
        previousRow[rightIndex] + 1,
        previousRow[rightIndex - 1] +
          substitutionCost
      )
    }

    for (
      let index = 0;
      index < currentRow.length;
      index += 1
    ) {
      previousRow[index] =
        currentRow[index]
    }
  }

  return previousRow[right.length]
}

function getNameSimilarity(
  detectedName,
  speciesName
) {
  const normalizedDetectedName =
    normalizeText(detectedName)

  const normalizedSpeciesName =
    normalizeText(speciesName)

  if (
    !normalizedDetectedName ||
    !normalizedSpeciesName
  ) {
    return 0
  }

  if (
    normalizedDetectedName ===
    normalizedSpeciesName
  ) {
    return 100
  }

  const longestLength = Math.max(
    normalizedDetectedName.length,
    normalizedSpeciesName.length
  )

  const distance = getEditDistance(
    normalizedDetectedName,
    normalizedSpeciesName
  )

  return Math.max(
    0,
    Math.round(
      (1 - distance / longestLength) * 100
    )
  )
}

function findSpeciesByName(name) {
  const normalizedName =
    normalizeText(name)

  if (!normalizedName) {
    return {
      species: null,
      confidence: 0,
      matchType: 'missing',
    }
  }

  const exactMatch =
    pokemonSpecies.find(
      (species) =>
        normalizeText(species.name) ===
          normalizedName ||
        normalizeText(species.apiName) ===
          normalizedName
    )

  if (exactMatch) {
    return {
      species: exactMatch,
      confidence: 100,
      matchType: 'exact',
    }
  }

  const rankedMatches =
    pokemonSpecies
      .map((species) => ({
        species,

        similarity: Math.max(
          getNameSimilarity(
            normalizedName,
            species.name
          ),

          getNameSimilarity(
            normalizedName,
            species.apiName
          )
        ),
      }))
      .sort(
        (matchA, matchB) =>
          matchB.similarity -
          matchA.similarity
      )

  const bestMatch = rankedMatches[0]

  if (
    !bestMatch ||
    bestMatch.similarity < 72
  ) {
    return {
      species: null,

      confidence:
        bestMatch?.similarity ?? 0,

      matchType: 'unmatched',
    }
  }

  return {
    species: bestMatch.species,
    confidence: bestMatch.similarity,
    matchType: 'fuzzy',
  }
}

/*
 * The Vision parser has already performed species
 * identification before buildImportPokemon runs.
 *
 * Prefer that result instead of attempting to identify
 * the Pokémon from OCR text a second time.
 */
function getVisionSpeciesMatch(analysis) {
  const extractedSpecies =
    analysis?.diagnostics
      ?.extractedFields
      ?.species

  if (extractedSpecies?.species) {
    return {
      species: extractedSpecies.species,

      confidence: clampConfidence(
        extractedSpecies.confidence
      ),

      matchType:
        extractedSpecies.confidence >= 100
          ? 'exact'
          : 'vision',

      originalText:
        extractedSpecies.originalText ??
        null,

      source: 'vision-parser',
    }
  }

  /*
   * Safety fallback.
   *
   * Older analysis objects may not contain
   * diagnostics.extractedFields, so keep the
   * name-based matcher available for them.
   */
  const detectedName =
    getDetectedName(analysis)

  const fallbackMatch =
    findSpeciesByName(detectedName)

  return {
    ...fallbackMatch,
    originalText: detectedName,
    source: 'name-fallback',
  }
}

function getRegionItem(
  analysis,
  regionId
) {
  return (
    analysis?.regionOcr?.items?.find(
      (item) => item.id === regionId
    ) ?? null
  )
}

function getRegionValue(
  analysis,
  regionId
) {
  const regionItem =
    getRegionItem(
      analysis,
      regionId
    )

  if (
    !regionItem ||
    regionItem.accepted === false
  ) {
    return null
  }

  return (
    regionItem.normalizedValue ??
    null
  )
}

function getRegionConfidence(
  analysis,
  regionId
) {
  const regionItem =
    getRegionItem(
      analysis,
      regionId
    )

  if (!regionItem) {
    return 0
  }

  return clampConfidence(
    regionItem.finalConfidence ??
      regionItem.confidence ??
      0
  )
}

function getParsedValue(
  parsedPokemon,
  keys
) {
  for (const key of keys) {
    const value =
      parsedPokemon?.[key]

    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      return value
    }
  }

  return null
}

function getDetectedName(analysis) {
  const parsedName =
    getParsedValue(
      analysis?.parsedPokemon,
      [
        'name',
        'pokemonName',
        'species',
      ]
    )

  if (
    typeof parsedName === 'string' &&
    parsedName.trim() &&
    normalizeText(parsedName) !==
      'unknown pokemon'
  ) {
    return parsedName.trim()
  }

  const regionName =
    getRegionValue(
      analysis,
      'displayed-name'
    )

  if (
    typeof regionName === 'string' &&
    regionName.trim()
  ) {
    return regionName.trim()
  }

  return (
    getParsedValue(
      analysis?.parsedPokemon,
      ['displayedName']
    ) ?? ''
  )
}

function getDetectedCp(analysis) {
  const regionCp =
    getRegionValue(
      analysis,
      'cp'
    )

  const regionNumber =
    toInteger(regionCp)

  if (regionNumber !== null) {
    return regionNumber
  }

  return toInteger(
    getParsedValue(
      analysis?.parsedPokemon,
      [
        'cp',
        'combatPower',
      ]
    )
  )
}

function getDetectedHp(analysis) {
  const regionHp =
    getRegionValue(
      analysis,
      'hp'
    )

  if (
    regionHp &&
    typeof regionHp === 'object'
  ) {
    return {
      current: toInteger(
        regionHp.current
      ),

      maximum: toInteger(
        regionHp.maximum
      ),
    }
  }

  const parsedHp =
    getParsedValue(
      analysis?.parsedPokemon,
      ['hp', 'health']
    )

  if (
    parsedHp &&
    typeof parsedHp === 'object'
  ) {
    return {
      current: toInteger(
        parsedHp.current ??
          parsedHp.currentHp
      ),

      maximum: toInteger(
        parsedHp.maximum ??
          parsedHp.max ??
          parsedHp.maxHp
      ),
    }
  }

  const maximumHp =
    toInteger(
      getParsedValue(
        analysis?.parsedPokemon,
        [
          'maxHp',
          'maximumHp',
        ]
      )
    )

  if (maximumHp !== null) {
    return {
      current: maximumHp,
      maximum: maximumHp,
    }
  }

  return {
    current: null,
    maximum: null,
  }
}

function getDetectedIvs(analysis) {
  const parsedIvs =
    analysis?.parsedPokemon?.ivs ??
    {}

  return {
    attack: clampIv(
      parsedIvs.attack ??
        parsedIvs.atk
    ),

    defense: clampIv(
      parsedIvs.defense ??
        parsedIvs.def ??
        parsedIvs.defence
    ),

    stamina: clampIv(
      parsedIvs.stamina ??
        parsedIvs.hp ??
        parsedIvs.health
    ),
  }
}

function calculateIvPercentage(ivs) {
  const values = [
    ivs.attack,
    ivs.defense,
    ivs.stamina,
  ]

  if (
    values.some(
      (value) => value === null
    )
  ) {
    return null
  }

  const total =
    values.reduce(
      (sum, value) =>
        sum + value,
      0
    )

  return Math.round(
    (total / 45) * 100
  )
}

function getDetectedWeight(analysis) {
  return (
    toFiniteNumber(
      getRegionValue(
        analysis,
        'weight'
      )
    ) ??
    toFiniteNumber(
      getParsedValue(
        analysis?.parsedPokemon,
        [
          'weight',
          'weightKg',
        ]
      )
    )
  )
}

function getDetectedHeight(analysis) {
  return (
    toFiniteNumber(
      getRegionValue(
        analysis,
        'height'
      )
    ) ??
    toFiniteNumber(
      getParsedValue(
        analysis?.parsedPokemon,
        [
          'height',
          'heightM',
        ]
      )
    )
  )
}

function getStatusValue(
  parsedPokemon,
  keys
) {
  for (const key of keys) {
    if (
      Object.hasOwn(
        parsedPokemon ?? {},
        key
      )
    ) {
      return normalizeBoolean(
        parsedPokemon[key]
      )
    }
  }

  return false
}

function getFieldConfidence({
  analysis,
  speciesMatch,
  cp,
  ivs,
}) {
  const ivValues = [
    ivs.attack,
    ivs.defense,
    ivs.stamina,
  ]

  const completeIvCount =
    ivValues.filter(
      (value) => value !== null
    ).length

  return {
    species: clampConfidence(
      speciesMatch.confidence
    ),

    name: getRegionConfidence(
      analysis,
      'displayed-name'
    ),

    cp:
      cp === null
        ? 0
        : getRegionConfidence(
            analysis,
            'cp'
          ),

    hp: getRegionConfidence(
      analysis,
      'hp'
    ),

    weight: getRegionConfidence(
      analysis,
      'weight'
    ),

    height: getRegionConfidence(
      analysis,
      'height'
    ),

    ivs:
      completeIvCount === 3
        ? 100
        : completeIvCount > 0
          ? 60
          : 0,

    overall: clampConfidence(
      analysis?.confidence?.overall ??
        analysis?.confidence?.score ??
        analysis?.confidence ??
        0
    ),
  }
}

function buildIssues({
  detectedName,
  speciesMatch,
  cp,
  ivs,
  hp,
}) {
  const issues = []

  if (!detectedName) {
    issues.push(
      'Pokémon name could not be read'
    )
  }

  if (!speciesMatch.species) {
    issues.push(
      'Pokémon species could not be identified'
    )
  }

  if (
    speciesMatch.matchType ===
    'fuzzy'
  ) {
    issues.push(
      `Species was interpreted as ${speciesMatch.species.name}`
    )
  }

  if (
    cp === null ||
    cp < 0
  ) {
    issues.push(
      'CP could not be read'
    )
  }

  const ivValues = [
    ivs.attack,
    ivs.defense,
    ivs.stamina,
  ]

  const detectedIvCount =
    ivValues.filter(
      (value) => value !== null
    ).length

  if (
    detectedIvCount > 0 &&
    detectedIvCount < 3
  ) {
    issues.push(
      'Only part of the appraisal IVs could be read'
    )
  }

  if (hp.maximum === null) {
    issues.push(
      'HP could not be read'
    )
  }

  return issues
}

function getReferenceSpeciesId(
  species
) {
  /*
   * Prefer apiName because pokemonSpecies
   * uses PokéAPI-style identifiers.
   */
  if (species?.apiName) {
    return species.apiName
      .replace(/-/g, '_')
      .toUpperCase()
  }

  /*
   * Fallback for species objects that already
   * contain a string identifier.
   */
  if (
    typeof species?.id === 'string'
  ) {
    return species.id
      .replace(/-/g, '_')
      .toUpperCase()
  }

  /*
   * Final fallback from the species name.
   */
  if (species?.name) {
    return normalizeText(species.name)
      .replace(/\s+/g, '_')
      .toUpperCase()
  }

  return null
}

function findReferencePokemon(
  species,
  parsedPokemon
) {
  const speciesId =
    getReferenceSpeciesId(species)

  if (!speciesId) {
    return null
  }

  const references =
    getAllPokemonReferences()
      .filter(
        (reference) =>
          reference.id === speciesId
      )

  if (
    references.length === 0
  ) {
    return null
  }

  const detectedForm =
    getParsedValue(
      parsedPokemon,
      ['form', 'formName']
    )

  if (detectedForm) {
    const normalizedDetectedForm =
      normalizeText(detectedForm)

    const exactFormMatch =
      references.find(
        (reference) => {
          const displayName =
            getPokemonDisplayName(
              reference
            )

          return (
            normalizeText(
              reference.form
            ) ===
              normalizedDetectedForm ||

            normalizeText(
              displayName
            ) ===
              normalizeText(
                `${detectedForm} ${species.name}`
              ) ||

            normalizeText(
              displayName
            ) ===
              normalizedDetectedForm
          )
        }
      )

    if (exactFormMatch) {
      return exactFormMatch
    }
  }

  const normalReference =
    references.find(
      (reference) =>
        reference.form === 'NORMAL'
    )

  if (normalReference) {
    return normalReference
  }

  if (references.length === 1) {
    return references[0]
  }

  return null
}

export function buildImportPokemon(
  analysis,
  {
    team =
      analysis?.regions?.team ??
      null,

    screenshotType =
      'pokemon-details-appraisal',
  } = {}
) {
  if (
    !analysis ||
    typeof analysis !== 'object'
  ) {
    throw new Error(
      'A screenshot analysis result is required.'
    )
  }

  const parsedPokemon =
    analysis.parsedPokemon ?? {}

  const detectedName =
    getDetectedName(analysis)

  /*
   * IMPORTANT:
   *
   * Species identification has already happened
   * inside extractPokemonFields().
   *
   * We now consume that result directly.
   */
  const speciesMatch =
    getVisionSpeciesMatch(analysis)

  const species =
    speciesMatch.species

  const cp =
    getDetectedCp(analysis)

  const hp =
    getDetectedHp(analysis)

  const ivs =
    getDetectedIvs(analysis)

  const weight =
    getDetectedWeight(analysis)

  const height =
    getDetectedHeight(analysis)

  const ivPercentage =
    calculateIvPercentage(ivs)

  const referencePokemon =
    findReferencePokemon(
      species,
      parsedPokemon
    )

  const fieldConfidence =
    getFieldConfidence({
      analysis,
      speciesMatch,
      cp,
      ivs,
    })

  const issues =
    buildIssues({
      detectedName,
      speciesMatch,
      cp,
      ivs,
      hp,
    })

  const pokemon = {
    importId: createImportId(),

    pokemonId:
      referencePokemon?.id ??
      getReferenceSpeciesId(
        species
      ),

    pokemonForm:
      referencePokemon?.form ??
      null,

    pokemonIdentity:
      referencePokemon
        ? getPokemonIdentity(
            referencePokemon
          )
        : null,

    name:
      referencePokemon
        ? getPokemonDisplayName(
            referencePokemon
          )
        : species?.name ??
          detectedName ??
          '',

    apiName:
      species?.apiName ?? null,

    detectedName,

    cp,

    hp:
      hp.maximum ?? null,

    currentHp:
      hp.current ?? null,

    maxHp:
      hp.maximum ?? null,

    attackIv: ivs.attack,
    defenseIv: ivs.defense,
    staminaIv: ivs.stamina,

    ivs: {
      attack: ivs.attack,
      defense: ivs.defense,
      stamina: ivs.stamina,
    },

    ivPercentage,

    weight,
    height,

    shiny:
      getStatusValue(
        parsedPokemon,
        [
          'shiny',
          'isShiny',
        ]
      ),

    shadow:
      getStatusValue(
        parsedPokemon,
        [
          'shadow',
          'isShadow',
        ]
      ),

    purified:
      getStatusValue(
        parsedPokemon,
        [
          'purified',
          'isPurified',
        ]
      ),

    lucky:
      getStatusValue(
        parsedPokemon,
        [
          'lucky',
          'isLucky',
        ]
      ),

    favorite:
      getStatusValue(
        parsedPokemon,
        [
          'favorite',
          'favourite',
          'isFavorite',
          'isFavourite',
        ]
      ),

    mega:
      getStatusValue(
        parsedPokemon,
        [
          'mega',
          'isMega',
        ]
      ),

    gigantamax:
      getStatusValue(
        parsedPokemon,
        [
          'gigantamax',
          'gmax',
          'isGigantamax',
        ]
      ),

    form:
      getParsedValue(
        parsedPokemon,
        [
          'form',
          'formName',
        ]
      ) ?? null,

    gender:
      getParsedValue(
        parsedPokemon,
        [
          'gender',
          'sex',
        ]
      ) ?? null,

    nickname:
      getParsedValue(
        parsedPokemon,
        ['nickname']
      ) ?? '',

    level:
      toFiniteNumber(
        getParsedValue(
          parsedPokemon,
          [
            'level',
            'pokemonLevel',
          ]
        )
      ),

    fastMoveId:
      getParsedValue(
        parsedPokemon,
        [
          'fastMoveId',
          'fastMove',
          'quickMove',
        ]
      ) ?? null,

    chargedMove1Id:
      getParsedValue(
        parsedPokemon,
        [
          'chargedMove1Id',
          'chargedMove1',
          'chargedMove',
        ]
      ) ?? null,

    chargedMove2Id:
      getParsedValue(
        parsedPokemon,
        [
          'chargedMove2Id',
          'chargedMove2',
        ]
      ) ?? null,

    candy:
      toInteger(
        getRegionValue(
          analysis,
          'candy-count'
        )
      ),

    candyXl:
      toInteger(
        getRegionValue(
          analysis,
          'candy-xl-count'
        )
      ),

    confidence:
      fieldConfidence.overall,

    fieldConfidence,

    issues,

    needsReview:
      issues.length > 0 ||
      !species ||
      !referencePokemon,

    source: {
      type: 'screenshot-ocr',

      fileName:
        analysis.source?.name ??
        null,

      fileType:
        analysis.source?.type ??
        null,

      fileSize:
        analysis.source?.size ??
        null,

      team,

      leader:
        analysis.regions?.leader ??
        null,

      layout:
        analysis.regions?.layout ??
        null,

      screenshotType,

      analyzedAt:
        new Date().toISOString(),
    },

    vision: {
      speciesMatchType:
        speciesMatch.matchType,

      speciesMatchSource:
        speciesMatch.source,

      speciesMatchConfidence:
        speciesMatch.confidence,

      speciesOriginalText:
        speciesMatch.originalText ??
        null,

      pipelineConfidence:
        analysis.confidence ?? null,

      timing:
        analysis.timing ?? null,
    },
  }

  return pokemon
}

export function buildImportPokemonList(
  analyses = [],
  options = {}
) {
  if (!Array.isArray(analyses)) {
    throw new Error(
      'Screenshot analyses must be provided as an array.'
    )
  }

  return analyses.map(
    (analysis) =>
      buildImportPokemon(
        analysis,
        options
      )
  )
}