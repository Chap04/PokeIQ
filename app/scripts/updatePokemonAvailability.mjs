import fs from 'node:fs/promises'
import path from 'node:path'
import {
  fileURLToPath,
} from 'node:url'

import {
  buildRaidCandidates,
  inspectRaidCandidate,
  resolveRaidCandidatePokemon,
} from '../src/engine/Raid/candidates.js'

import {
  buildShadowAvailabilitySource,
} from '../src/engine/pokemon/shadowAvailabilitySource.js'

// --------------------------------------------------
// Sources
// --------------------------------------------------

const POKEMON_GO_API_URL =
  'https://pokemon-go-api.github.io/pokemon-go-api/api/pokedex.json'

const RELEASE_SOURCE_URL =
  'https://bulbapedia.bulbagarden.net/w/api.php' +
  '?action=parse' +
  '&page=List_of_Pok%C3%A9mon_by_availability_in_Pok%C3%A9mon_GO' +
  '&prop=wikitext' +
  '&format=json' +
  '&origin=*'

// --------------------------------------------------
// Paths
// --------------------------------------------------

const __filename =
  fileURLToPath(
    import.meta.url
  )

const __dirname =
  path.dirname(
    __filename
  )

const REFERENCE_DIR =
  path.resolve(
    __dirname,
    '../src/data/reference'
  )

const AVAILABILITY_FILE =
  path.join(
    REFERENCE_DIR,
    'pokemon-availability.json'
  )

// --------------------------------------------------
// Explicit permanent-form rules
// --------------------------------------------------

const EXPLICIT_UNRELEASED_FORMS =
  new Set([
    'DARMANITAN__DARMANITAN_ZEN',

    'DARMANITAN__DARMANITAN_GALARIAN_ZEN',

    'MELOETTA__MELOETTA_PIROUETTE',

    'VIVILLON__VIVILLON_FANCY',

    'VIVILLON__VIVILLON_POKEBALL',

    'SLIGGOO__SLIGGOO_HISUIAN',

    'GOODRA__GOODRA_HISUIAN',

    'CALYREX__CALYREX_ICE_RIDER',

    'CALYREX__CALYREX_SHADOW_RIDER',

    'NECROZMA__NECROZMA_ULTRA',

    'ETERNATUS__ETERNATUS_ETERNAMAX',

    'PIKACHU__PIKACHU_COSTUME_2020',

    'PIKACHU__PIKACHU_VS_2019',
  ])

const EXPLICIT_RELEASED_FORMS =
  new Set([
    'MEWTWO__MEWTWO_A',

    'LYCANROC',

    'LYCANROC__LYCANROC_MIDDAY',

    'LYCANROC__LYCANROC_DUSK',

    'LYCANROC__LYCANROC_MIDNIGHT',

    'TOXTRICITY',

    'TOXTRICITY__TOXTRICITY_AMPED',

    'TOXTRICITY__TOXTRICITY_LOW_KEY',

    'PIKACHU__PIKACHU_JEJU',

    'PIKACHU__PIKACHU_DOCTOR',

    'PIKACHU__PIKACHU_FLYING_01',

    'PIKACHU__PIKACHU_HORIZONS',

    'PIKACHU__PIKACHU_POP_STAR',

    'PIKACHU__PIKACHU_ROCK_STAR',
  ])

// --------------------------------------------------
// File helpers
// --------------------------------------------------

async function readJson(
  filename
) {
  const contents =
    await fs.readFile(
      path.join(
        REFERENCE_DIR,
        filename
      ),
      'utf8'
    )

  return JSON.parse(
    contents
  )
}

// --------------------------------------------------
// General helpers
// --------------------------------------------------

function normalizeToken(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null
  }

  return String(
    value
  )
    .trim()
    .toUpperCase()
    .replace(
      /[^A-Z0-9]+/g,
      '_'
    )
    .replace(
      /^_+|_+$/g,
      ''
    )
}

function objectValues(
  value
) {
  if (!value) {
    return []
  }

  if (
    Array.isArray(
      value
    )
  ) {
    return value
  }

  if (
    typeof value ===
    'object'
  ) {
    return Object.values(
      value
    )
  }

  return []
}

function buildCandidateId(
  pokemon
) {
  if (
    !pokemon.form ||
    pokemon.form ===
      'NORMAL'
  ) {
    return pokemon.id
  }

  return (
    `${pokemon.id}` +
    `__${pokemon.form}`
  )
}

function padDexNumber(
  value
) {
  if (
    !Number.isFinite(
      Number(value)
    )
  ) {
    return null
  }

  return String(
    Number(value)
  ).padStart(
    4,
    '0'
  )
}

function splitOnce(
  text,
  marker
) {
  const index =
    text.indexOf(
      marker
    )

  if (
    index === -1
  ) {
    return {
      before:
        text,

      after:
        '',
    }
  }

  return {
    before:
      text.slice(
        0,
        index
      ),

    after:
      text.slice(
        index +
        marker.length
      ),
  }
}

// --------------------------------------------------
// pokemon-go-api flattening
// --------------------------------------------------

function normalizeExternalTemporaryEvolutionId(
  transformationId
) {
  const normalized =
    normalizeToken(
      transformationId
    )

  if (!normalized) {
    return null
  }

  if (
    normalized.endsWith(
      '_MEGA_X'
    )
  ) {
    return (
      'TEMP_EVOLUTION_MEGA_X'
    )
  }

  if (
    normalized.endsWith(
      '_MEGA_Y'
    )
  ) {
    return (
      'TEMP_EVOLUTION_MEGA_Y'
    )
  }

  if (
    normalized.endsWith(
      '_MEGA_Z'
    )
  ) {
    return (
      'TEMP_EVOLUTION_MEGA_Z'
    )
  }

  if (
    normalized.endsWith(
      '_MEGA'
    )
  ) {
    return (
      'TEMP_EVOLUTION_MEGA'
    )
  }

  if (
    normalized.endsWith(
      '_PRIMAL'
    )
  ) {
    return (
      'TEMP_EVOLUTION_PRIMAL'
    )
  }

  return null
}

function flattenExternalPokemon(
  externalPokemon
) {
  const flattened = []

  for (
    const species
    of externalPokemon
  ) {
    const speciesId =
      normalizeToken(
        species.id
      )

    if (!speciesId) {
      continue
    }

    flattened.push({
      speciesId,

      formId:
        normalizeToken(
          species.formId
        ) ??
        speciesId,

      sourceType:
        'BASE',

      data:
        species,
    })

    for (
      const form
      of objectValues(
        species.regionForms
      )
    ) {
      const formId =
        normalizeToken(
          form?.formId
        )

      if (!formId) {
        continue
      }

      flattened.push({
        speciesId,

        formId,

        sourceType:
          'FORM',

        data:
          form,
      })
    }

    for (
      const transformation
      of objectValues(
        species.megaEvolutions
      )
    ) {
      const temporaryEvolutionId =
        normalizeExternalTemporaryEvolutionId(
          transformation?.id
        )

      if (
        !temporaryEvolutionId
      ) {
        continue
      }

      flattened.push({
        speciesId,

        formId:
          temporaryEvolutionId,

        sourceType:
          'TEMPORARY_EVOLUTION',

        data:
          transformation,
      })
    }
  }

  return flattened
}

function buildExternalKey(
  entry
) {
  if (
    entry.sourceType ===
    'BASE'
  ) {
    return entry.speciesId
  }

  return (
    `${entry.speciesId}` +
    `__${entry.formId}`
  )
}

// --------------------------------------------------
// Bulbapedia helpers
// --------------------------------------------------

function escapeRegex(
  value
) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  )
}

function getSection(
  wikitext,
  heading
) {
  const headingPattern =
    new RegExp(
      `^===?${escapeRegex(heading)}===?\\s*$`,
      'mi'
    )

  const match =
    headingPattern.exec(
      wikitext
    )

  if (!match) {
    return null
  }

  const start =
    match.index +
    match[0].length

  const remaining =
    wikitext.slice(
      start
    )

  const nextHeading =
    remaining.search(
      /^={2,3}[^=\n].*?={2,3}\s*$/m
    )

  if (
    nextHeading === -1
  ) {
    return remaining
  }

  return remaining.slice(
    0,
    nextHeading
  )
}

function normalizeName(
  value
) {
  return String(
    value ??
    ''
  )
    .replace(
      /<!--.*?-->/gs,
      ''
    )
    .replace(
      /&nbsp;/gi,
      ' '
    )
    .replace(
      /\[\[([^|\]]+)\|([^\]]+)\]\]/g,
      '$2'
    )
    .replace(
      /\[\[([^\]]+)\]\]/g,
      '$1'
    )
    .replace(
      /''+/g,
      ''
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim()
}

function parseTemplateArguments(
  raw
) {
  const parts =
    raw
      .split('|')
      .map(
        (part) =>
          part.trim()
      )

  const positional = []
  const named = {}

  for (
    const part
    of parts
  ) {
    const equalsIndex =
      part.indexOf('=')

    if (
      equalsIndex > 0
    ) {
      const key =
        part
          .slice(
            0,
            equalsIndex
          )
          .trim()

      const value =
        part
          .slice(
            equalsIndex +
            1
          )
          .trim()

      named[key] =
        value

      continue
    }

    positional.push(
      part
    )
  }

  return {
    positional,
    named,
  }
}

function extractPokemonTemplates(
  text
) {
  const results = []

  const regex =
    /\{\{(MSP\/GO|MSP\/HOME|MSP)\|([^{}]+)\}\}/g

  let match

  while (
    (
      match =
        regex.exec(
          text
        )
    ) !== null
  ) {
    const {
      positional,
      named,
    } =
      parseTemplateArguments(
        match[2]
      )

    const code =
      positional[0] ??
      null

    const name =
      positional.length >
        1
        ? positional[
            positional.length -
            1
          ]
        : null

    if (!code) {
      continue
    }

    results.push({
      template:
        match[1],

      code:
        code.trim(),

      name:
        normalizeName(
          name
        ),

      parameters:
        named,
    })
  }

  return results
}

function uniqueEntries(
  entries
) {
  const seen =
    new Set()

  const result = []

  for (
    const entry
    of entries
  ) {
    const key =
      `${entry.code}|` +
      `${entry.name}|` +
      `${JSON.stringify(
        entry.parameters
      )}`

    if (
      seen.has(
        key
      )
    ) {
      continue
    }

    seen.add(
      key
    )

    result.push(
      entry
    )
  }

  return result
}

// --------------------------------------------------
// Permanent release catalogue
// --------------------------------------------------

function splitUnreleasedPokemonSection(
  section
) {
  const marker =
    'the following forms have yet to be made available:'

  const lowerSection =
    section.toLowerCase()

  const markerIndex =
    lowerSection.indexOf(
      marker.toLowerCase()
    )

  if (
    markerIndex === -1
  ) {
    return {
      speciesText:
        section,

      formsText:
        '',
    }
  }

  return {
    speciesText:
      section.slice(
        0,
        markerIndex
      ),

    formsText:
      section.slice(
        markerIndex +
        marker.length
      ),
  }
}

function buildReleaseCatalogue(
  wikitext
) {
  const releasedSection =
    getSection(
      wikitext,
      'List of Pokémon by date'
    )

  const unreleasedSection =
    getSection(
      wikitext,
      'Unreleased Pokémon'
    )

  if (
    !releasedSection ||
    !unreleasedSection
  ) {
    throw new Error(
      'Required Bulbapedia release sections were not found.'
    )
  }

  const releasedEntries =
    uniqueEntries(
      extractPokemonTemplates(
        releasedSection
      )
    )

  const {
    speciesText:
      unreleasedSpeciesText,

    formsText:
      unreleasedFormsText,
  } =
    splitUnreleasedPokemonSection(
      unreleasedSection
    )

  const unreleasedSpeciesEntries =
    uniqueEntries(
      extractPokemonTemplates(
        unreleasedSpeciesText
      )
    )

  const unreleasedFormEntries =
    uniqueEntries(
      extractPokemonTemplates(
        unreleasedFormsText
      )
    )

  const releasedSpecies =
    new Set()

  const unreleasedSpecies =
    new Set()

  for (
    const entry
    of releasedEntries
  ) {
    if (
      /^\d{4}$/.test(
        entry.code
      )
    ) {
      releasedSpecies.add(
        entry.code
      )
    }
  }

  for (
    const entry
    of unreleasedSpeciesEntries
  ) {
    if (
      /^\d{4}$/.test(
        entry.code
      )
    ) {
      unreleasedSpecies.add(
        entry.code
      )
    }
  }

  return {
    releasedEntries,

    unreleasedSpeciesEntries,

    unreleasedFormEntries,

    releasedSpecies,

    unreleasedSpecies,
  }
}

// --------------------------------------------------
// Temporary evolution catalogue
// --------------------------------------------------

function parseTemporaryTemplateCode(
  code
) {
  const normalized =
    String(
      code ??
      ''
    )
      .trim()
      .toUpperCase()

  const match =
    normalized.match(
      /^(\d{4})(M[A-Z]*|P)$/
    )

  if (!match) {
    return null
  }

  const dexCode =
    match[1]

  const suffix =
    match[2]

  if (
    suffix ===
    'P'
  ) {
    return {
      dexCode,

      temporaryEvolutionId:
        'TEMP_EVOLUTION_PRIMAL',
    }
  }

  if (
    !suffix.startsWith(
      'M'
    )
  ) {
    return null
  }

  const megaVariant =
    suffix.slice(
      1
    )

  return {
    dexCode,

    temporaryEvolutionId:
      megaVariant
        ? (
            'TEMP_EVOLUTION_MEGA_' +
            megaVariant
          )
        : 'TEMP_EVOLUTION_MEGA',
  }
}

function buildTemporaryReleaseKey({
  dexCode,
  temporaryEvolutionId,
}) {
  return (
    `${dexCode}|` +
    `${temporaryEvolutionId}`
  )
}

function parseBulbapediaDate(
  value
) {
  const normalized =
    String(
      value ??
      ''
    )
      .replace(
        /<!--.*?-->/gs,
        ''
      )
      .replace(
        /<br\s*\/?>/gi,
        ' '
      )
      .trim()

  const match =
    normalized.match(
      /\b([A-Z][a-z]{2})\s+(\d{1,2}),\s+(\d{4})\b/
    )

  if (!match) {
    return null
  }

  const parsed =
    new Date(
      `${match[1]} ${match[2]}, ${match[3]} 00:00:00 UTC`
    )

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return null
  }

  return parsed
}

function splitWikiTableRows(
  text
) {
  return text
    .split(
      /\n\|-\s*/g
    )
    .map(
      (row) =>
        row.trim()
    )
    .filter(
      Boolean
    )
}

function extractFirstTableCell(
  row
) {
  const lines =
    row.split(
      '\n'
    )

  for (
    const rawLine
    of lines
  ) {
    const line =
      rawLine.trim()

    if (
      !line.startsWith(
        '|'
      ) ||
      line.startsWith(
        '|}'
      ) ||
      line.startsWith(
        '|-'
      )
    ) {
      continue
    }

    return line
      .replace(
        /^\|+/,
        ''
      )
      .trim()
  }

  return null
}

function buildTemporaryEvolutionReleaseCatalogue({
  wikitext,
  now,
}) {
  const section =
    getSection(
      wikitext,
      'Mega Evolution and Primal Reversion'
    )

  if (!section) {
    throw new Error(
      'Mega Evolution and Primal Reversion section was not found.'
    )
  }

  const unreleasedMarker =
    'The following Mega Evolutions have yet to be released:'

  const {
    before:
      availableText,

    after:
      unreleasedText,
  } =
    splitOnce(
      section,
      unreleasedMarker
    )

  if (
    !unreleasedText
  ) {
    throw new Error(
      'Mega/Primal unreleased subsection was not found.'
    )
  }

  const released =
    new Map()

  const upcoming =
    new Map()

  const unreleased =
    new Map()

  const ignoredAvailableRows = []

  for (
    const row
    of splitWikiTableRows(
      availableText
    )
  ) {
    const templates =
      extractPokemonTemplates(
        row
      )

    const temporaryEntries =
      templates
        .map(
          (entry) => ({
            entry,

            parsed:
              parseTemporaryTemplateCode(
                entry.code
              ),
          })
        )
        .filter(
          (entry) =>
            Boolean(
              entry.parsed
            )
        )

    if (
      !temporaryEntries.length
    ) {
      continue
    }

    const firstCell =
      extractFirstTableCell(
        row
      )

    const releaseDate =
      parseBulbapediaDate(
        firstCell
      )

    if (!releaseDate) {
      ignoredAvailableRows.push({
        firstCell,

        codes:
          temporaryEntries.map(
            ({
              entry,
            }) =>
              entry.code
          ),
      })

      continue
    }

    const releasedAlready =
      releaseDate.getTime() <=
      now.getTime()

    for (
      const {
        entry,
        parsed,
      }
      of temporaryEntries
    ) {
      const key =
        buildTemporaryReleaseKey(
          parsed
        )

      const record = {
        ...parsed,

        code:
          entry.code,

        name:
          entry.name,

        releaseDate:
          releaseDate.toISOString(),
      }

      if (
        releasedAlready
      ) {
        released.set(
          key,
          record
        )
      } else {
        upcoming.set(
          key,
          record
        )
      }
    }
  }

  const unreleasedEntries =
    uniqueEntries(
      extractPokemonTemplates(
        unreleasedText
      )
    )

  for (
    const entry
    of unreleasedEntries
  ) {
    const parsed =
      parseTemporaryTemplateCode(
        entry.code
      )

    if (!parsed) {
      continue
    }

    const key =
      buildTemporaryReleaseKey(
        parsed
      )

    unreleased.set(
      key,
      {
        ...parsed,

        code:
          entry.code,

        name:
          entry.name,
      }
    )
  }

  return {
    released,

    upcoming,

    unreleased,

    ignoredAvailableRows,
  }
}

// --------------------------------------------------
// Permanent availability
// --------------------------------------------------

function resolvePermanentCandidateAvailability({
  candidate,
  externalMatch,
  releaseCatalogue,
}) {
  const pokemon =
    candidate.pokemon

  const candidateId =
    buildCandidateId(
      pokemon
    )

  if (
    EXPLICIT_RELEASED_FORMS.has(
      candidateId
    )
  ) {
    return {
      released:
        true,

      playerUsable:
        true,

      reason:
        'EXPLICIT_RELEASED_FORM',

      confidence:
        'EXPLICIT',
    }
  }

  if (
    EXPLICIT_UNRELEASED_FORMS.has(
      candidateId
    )
  ) {
    return {
      released:
        false,

      playerUsable:
        false,

      reason:
        'EXPLICIT_UNRELEASED_FORM',

      confidence:
        'EXPLICIT',
    }
  }

  if (!externalMatch) {
    return {
      released:
        false,

      playerUsable:
        false,

      reason:
        'NO_EXTERNAL_FORM_MATCH',

      confidence:
        'UNKNOWN',
    }
  }

  const dexCode =
    padDexNumber(
      externalMatch
        ?.data
        ?.dexNr
    )

  if (!dexCode) {
    return {
      released:
        false,

      playerUsable:
        false,

      reason:
        'MISSING_DEX_NUMBER',

      confidence:
        'UNKNOWN',
    }
  }

  const speciesReleased =
    releaseCatalogue
      .releasedSpecies
      .has(
        dexCode
      )

  const speciesUnreleased =
    releaseCatalogue
      .unreleasedSpecies
      .has(
        dexCode
      )

  if (
    externalMatch.sourceType ===
    'BASE'
  ) {
    if (
      speciesReleased
    ) {
      return {
        released:
          true,

        playerUsable:
          true,

        reason:
          'SPECIES_RELEASED',

        confidence:
          'EXPLICIT',
      }
    }

    if (
      speciesUnreleased
    ) {
      return {
        released:
          false,

        playerUsable:
          false,

        reason:
          'SPECIES_UNRELEASED',

        confidence:
          'EXPLICIT',
      }
    }

    return {
      released:
        false,

      playerUsable:
        false,

      reason:
        'RELEASE_STATUS_UNKNOWN',

      confidence:
        'UNKNOWN',
    }
  }

  if (
    externalMatch.sourceType ===
    'FORM'
  ) {
    if (
      speciesUnreleased
    ) {
      return {
        released:
          false,

        playerUsable:
          false,

        reason:
          'SPECIES_UNRELEASED',

        confidence:
          'EXPLICIT',
      }
    }

    if (
      speciesReleased
    ) {
      return {
        released:
          true,

        playerUsable:
          true,

        reason:
          'RELEASED_SPECIES_WITH_EXTERNAL_FORM',

        confidence:
          'INFERRED',
      }
    }

    return {
      released:
        false,

      playerUsable:
        false,

      reason:
        'FORM_RELEASE_STATUS_UNKNOWN',

      confidence:
        'UNKNOWN',
    }
  }

  return {
    released:
      false,

    playerUsable:
      false,

    reason:
      'UNSUPPORTED_SOURCE_TYPE',

    confidence:
      'UNKNOWN',
  }
}

// --------------------------------------------------
// Temporary availability
// --------------------------------------------------

function getTemporaryEvolutionMetadata(
  candidate
) {
  return (
    candidate
      ?.pokemon
      ?.raidCandidateMetadata
      ?.temporaryEvolution ??
    null
  )
}

function getBaseExternalMatch({
  candidate,
  externalLookup,
}) {
  const pokemonId =
    candidate
      ?.pokemon
      ?.id

  if (!pokemonId) {
    return null
  }

  return (
    externalLookup.get(
      pokemonId
    ) ??
    null
  )
}

function resolveTemporaryCandidateAvailability({
  candidate,
  externalLookup,
  temporaryReleaseCatalogue,
}) {
  const metadata =
    getTemporaryEvolutionMetadata(
      candidate
    )

  if (!metadata?.id) {
    return {
      released:
        false,

      playerUsable:
        false,

      reason:
        'MISSING_TEMPORARY_EVOLUTION_ID',

      confidence:
        'UNKNOWN',
    }
  }

  const baseExternalMatch =
    getBaseExternalMatch({
      candidate,

      externalLookup,
    })

  if (
    !baseExternalMatch
  ) {
    return {
      released:
        false,

      playerUsable:
        false,

      reason:
        'NO_EXTERNAL_SPECIES_MATCH',

      confidence:
        'UNKNOWN',
    }
  }

  const dexCode =
    padDexNumber(
      baseExternalMatch
        ?.data
        ?.dexNr
    )

  if (!dexCode) {
    return {
      released:
        false,

      playerUsable:
        false,

      reason:
        'MISSING_DEX_NUMBER',

      confidence:
        'UNKNOWN',
    }
  }

  const key =
    buildTemporaryReleaseKey({
      dexCode,

      temporaryEvolutionId:
        metadata.id,
    })

  const releasedEntry =
    temporaryReleaseCatalogue
      .released
      .get(
        key
      )

  if (
    releasedEntry
  ) {
    return {
      released:
        true,

      playerUsable:
        true,

      reason:
        'TEMPORARY_EVOLUTION_RELEASED',

      confidence:
        'EXPLICIT',

      releaseCode:
        releasedEntry.code,

      releaseDate:
        releasedEntry.releaseDate,
    }
  }

  const upcomingEntry =
    temporaryReleaseCatalogue
      .upcoming
      .get(
        key
      )

  if (
    upcomingEntry
  ) {
    return {
      released:
        false,

      playerUsable:
        false,

      reason:
        'TEMPORARY_EVOLUTION_UPCOMING',

      confidence:
        'EXPLICIT',

      releaseCode:
        upcomingEntry.code,

      releaseDate:
        upcomingEntry.releaseDate,
    }
  }

  const unreleasedEntry =
    temporaryReleaseCatalogue
      .unreleased
      .get(
        key
      )

  if (
    unreleasedEntry
  ) {
    return {
      released:
        false,

      playerUsable:
        false,

      reason:
        'TEMPORARY_EVOLUTION_UNRELEASED',

      confidence:
        'EXPLICIT',

      releaseCode:
        unreleasedEntry.code,

      releaseDate:
        null,
    }
  }

  return {
    released:
      false,

    playerUsable:
      false,

    reason:
      'TEMPORARY_RELEASE_STATUS_UNKNOWN',

    confidence:
      'UNKNOWN',

    releaseCode:
      null,

    releaseDate:
      null,
  }
}

// --------------------------------------------------
// Summary helpers
// --------------------------------------------------

function createSummary() {
  return {
    usable:
      0,

    unavailable:
      0,

    explicit:
      0,

    inferred:
      0,

    unknown:
      0,

    unmatched:
      0,
  }
}

function updateSummary(
  summary,
  availability
) {
  if (
    availability.playerUsable
  ) {
    summary.usable += 1
  } else {
    summary.unavailable += 1
  }

  if (
    availability.confidence ===
    'EXPLICIT'
  ) {
    summary.explicit += 1
  } else if (
    availability.confidence ===
    'INFERRED'
  ) {
    summary.inferred += 1
  } else {
    summary.unknown += 1
  }

  if (
    availability.reason ===
      'NO_EXTERNAL_FORM_MATCH' ||
    availability.reason ===
      'NO_EXTERNAL_SPECIES_MATCH'
  ) {
    summary.unmatched += 1
  }
}

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  console.log(
    'Updating PokeIQ Pokémon availability data...'
  )

  const generationTime =
    new Date()

  // ------------------------------------------------
  // Load reference data
  // ------------------------------------------------

  const [
    pokemon,
    combat,
  ] =
    await Promise.all([
      readJson(
        'pokemon.json'
      ),

      readJson(
        'combat.json'
      ),
    ])

  const level40Cpm =
    combat
      .cpMultipliers
      .allLevels['40']

  if (
    !Number.isFinite(
      level40Cpm
    )
  ) {
    throw new Error(
      'Level 40 CPM not found.'
    )
  }

  const candidateResult =
    buildRaidCandidates({
      pokemon,

      cpMultiplier:
        level40Cpm,
    })

  const {
    candidates,

    permanentCandidates =
      [],

    temporaryEvolutionCandidates =
      [],

    rejected,

    collapsed,
  } =
    candidateResult

  const permanentRejected =
    rejected.filter(
      (entry) =>
        entry.candidateType !==
        'TEMPORARY_EVOLUTION'
    )

  const temporaryRejected =
    rejected.filter(
      (entry) =>
        entry.candidateType ===
        'TEMPORARY_EVOLUTION'
    )

  console.log('')
  console.log(
    `Raw reference records: ${pokemon.length}`
  )

  console.log(
    `Permanent raid candidates: ${permanentCandidates.length}`
  )

  console.log(
    `Temporary evolution candidates: ${temporaryEvolutionCandidates.length}`
  )

  console.log(
    `Total raid candidates: ${candidates.length}`
  )

  // ------------------------------------------------
  // pokemon-go-api
  // ------------------------------------------------

  console.log('')
  console.log(
    'Downloading pokemon-go-api Pokédex...'
  )

  const externalResponse =
    await fetch(
      POKEMON_GO_API_URL
    )

  if (
    !externalResponse.ok
  ) {
    throw new Error(
      `pokemon-go-api request failed: ${externalResponse.status}`
    )
  }

  const externalPokemon =
    await externalResponse.json()

  if (
    !Array.isArray(
      externalPokemon
    )
  ) {
    throw new Error(
      'pokemon-go-api Pokédex response is not an array.'
    )
  }

  const flattenedExternal =
    flattenExternalPokemon(
      externalPokemon
    )

  const externalLookup =
    new Map()

  for (
    const entry
    of flattenedExternal
  ) {
    externalLookup.set(
      buildExternalKey(
        entry
      ),
      entry
    )
  }

  console.log(
    `External flattened records: ${flattenedExternal.length}`
  )

  // ------------------------------------------------
  // Main Bulbapedia availability source
  // ------------------------------------------------

  console.log('')
  console.log(
    'Downloading Bulbapedia release catalogue...'
  )

  const releaseResponse =
    await fetch(
      RELEASE_SOURCE_URL,
      {
        headers: {
          'User-Agent':
            'PokeIQ-development/1.0',
        },
      }
    )

  if (
    !releaseResponse.ok
  ) {
    throw new Error(
      `Bulbapedia request failed: ${releaseResponse.status}`
    )
  }

  const releaseResult =
    await releaseResponse.json()

  const wikitext =
    releaseResult
      ?.parse
      ?.wikitext
      ?.['*']

  if (
    typeof wikitext !==
    'string'
  ) {
    throw new Error(
      'Bulbapedia wikitext not found.'
    )
  }

  const releaseCatalogue =
    buildReleaseCatalogue(
      wikitext
    )

  const temporaryReleaseCatalogue =
    buildTemporaryEvolutionReleaseCatalogue({
      wikitext,

      now:
        generationTime,
    })

  console.log(
    `Released species codes: ${releaseCatalogue.releasedSpecies.size}`
  )

  console.log(
    `Unreleased species codes: ${releaseCatalogue.unreleasedSpecies.size}`
  )

  console.log(
    `Unreleased form entries: ${releaseCatalogue.unreleasedFormEntries.length}`
  )

  console.log(
    `Released Mega/Primal entries: ${temporaryReleaseCatalogue.released.size}`
  )

  console.log(
    `Upcoming Mega/Primal entries: ${temporaryReleaseCatalogue.upcoming.size}`
  )

  console.log(
    `Unreleased Mega entries: ${temporaryReleaseCatalogue.unreleased.size}`
  )

  console.log(
    `Unparsed dated Mega/Primal rows: ${temporaryReleaseCatalogue.ignoredAvailableRows.length}`
  )

  // ------------------------------------------------
  // Shadow availability source
  // ------------------------------------------------

  console.log('')
  console.log(
    'Downloading Bulbapedia Shadow catalogue...'
  )

  const shadowCatalogue =
    await buildShadowAvailabilitySource({
      pokemon,

      permanentCandidates,

      now:
        generationTime,
    })

  console.log(
    `Parsed Shadow entries: ${shadowCatalogue.counts.parsed}`
  )

  console.log(
    `Direct Shadow mappings: ${shadowCatalogue.counts.directMapped}`
  )

  console.log(
    `Collectible Shadow aliases: ${shadowCatalogue.counts.collectibleAliases}`
  )

  console.log(
    `Unique released Shadow combat candidates: ${shadowCatalogue.counts.uniqueReleasedShadowCombatCandidates}`
  )

  console.log(
    `Unmapped Shadow entries: ${shadowCatalogue.counts.unmapped}`
  )

  console.log(
    `Future Shadow entries: ${shadowCatalogue.counts.future}`
  )

  console.log(
    `Invalid Shadow release dates: ${shadowCatalogue.counts.invalidDates}`
  )

  console.log(
    `Apex Shadow entries isolated: ${shadowCatalogue.counts.apex}`
  )

  if (
    shadowCatalogue.counts.unmapped !==
      0 ||
    shadowCatalogue.counts.invalidDates !==
      0
  ) {
    throw new Error(
      'Shadow availability catalogue contains unresolved released entries.'
    )
  }

  // ------------------------------------------------
  // Permanent availability
  // ------------------------------------------------

  const overrides = {}

  const permanentSummary =
    createSummary()

  const permanentUnknownEntries =
    []

  /**
   * Raid candidate generation intentionally collapses
   * combat-equivalent permanent forms.
   *
   * Availability must preserve collectible/reference
   * identity outside that combat-deduplication layer.
   *
   * Start with every permanent raid representative,
   * then supplement that universe with eligible raw
   * reference identities that have:
   *
   * - a matching external form, or
   * - an explicit released/unreleased rule.
   *
   * This prevents combat deduplication from hiding real
   * forms such as Keldeo Ordinary / Resolute while still
   * avoiding unsupported internal aliases becoming
   * unresolved availability records.
   */

  const permanentCandidateLookup =
    new Map(
      permanentCandidates.map(
        (candidate) => [
          buildCandidateId(
            candidate.pokemon
          ),
          candidate,
        ]
      )
    )

  const availabilityCandidateLookup =
    new Map(
      permanentCandidateLookup
    )

  for (
    const rawPokemon
    of pokemon
  ) {
    const resolvedPokemon =
      resolveRaidCandidatePokemon({
        pokemon:
          rawPokemon,

        allPokemon:
          pokemon,
      })

    const inspection =
      inspectRaidCandidate(
        resolvedPokemon
      )

    if (
      !inspection.eligible
    ) {
      continue
    }

    const candidateId =
      buildCandidateId(
        resolvedPokemon
      )

    if (
      availabilityCandidateLookup.has(
        candidateId
      )
    ) {
      continue
    }

    const externalMatch =
      externalLookup.get(
        candidateId
      )

    const explicitlyReleased =
      EXPLICIT_RELEASED_FORMS.has(
        candidateId
      )

    const explicitlyUnreleased =
      EXPLICIT_UNRELEASED_FORMS.has(
        candidateId
      )

    if (
      !externalMatch &&
      !explicitlyReleased &&
      !explicitlyUnreleased
    ) {
      continue
    }

    availabilityCandidateLookup.set(
      candidateId,
      {
        id:
          candidateId,

        pokemon:
          resolvedPokemon,
      }
    )
  }

  const availabilityCandidates =
    [
      ...availabilityCandidateLookup.values(),
    ]

  console.log(
    `Permanent availability identities: ${availabilityCandidates.length}`
  )

  for (
    const candidate
    of availabilityCandidates
  ) {
    const candidateId =
      buildCandidateId(
        candidate.pokemon
      )

    let externalMatch =
      externalLookup.get(
        candidateId
      )

    if (
      !externalMatch &&
      candidate
        .pokemon
        .form ===
        'NORMAL'
    ) {
      externalMatch =
        externalLookup.get(
          candidate
            .pokemon
            .id
        )
    }

    const availability =
      resolvePermanentCandidateAvailability({
        candidate,

        externalMatch,

        releaseCatalogue,
      })

    overrides[
      candidateId
    ] = {
      released:
        availability.released,

      playerUsable:
        availability.playerUsable,

      reason:
        availability.reason,

      confidence:
        availability.confidence,
    }

    updateSummary(
      permanentSummary,
      availability
    )

    if (
      availability.confidence ===
      'UNKNOWN'
    ) {
      permanentUnknownEntries.push({
        id:
          candidateId,

        ...availability,
      })
    }
  }

  // ------------------------------------------------
  // Temporary-evolution availability
  // ------------------------------------------------

  const temporaryEvolutionOverrides =
    {}

  const temporarySummary =
    createSummary()

  const temporaryUnknownEntries =
    []

  for (
    const candidate
    of temporaryEvolutionCandidates
  ) {
    const candidateId =
      candidate.id

    const availability =
      resolveTemporaryCandidateAvailability({
        candidate,

        externalLookup,

        temporaryReleaseCatalogue,
      })

    temporaryEvolutionOverrides[
      candidateId
    ] = {
      released:
        availability.released,

      playerUsable:
        availability.playerUsable,

      reason:
        availability.reason,

      confidence:
        availability.confidence,

      releaseCode:
        availability
          .releaseCode ??
        null,

      releaseDate:
        availability
          .releaseDate ??
        null,
    }

    updateSummary(
      temporarySummary,
      availability
    )

    if (
      availability.confidence ===
      'UNKNOWN'
    ) {
      temporaryUnknownEntries.push({
        id:
          candidateId,

        ...availability,
      })
    }
  }

  // ------------------------------------------------
  // Shadow availability
  // ------------------------------------------------

  const shadowOverrides = {}

  const shadowSummary =
    createSummary()

  /**
   * Direct mappings are authoritative combat-state
   * mappings.
   *
   * Collectible aliases can resolve to an existing
   * Shadow combat state, but they do not create a new
   * candidate.
   */
  for (
    const mapping
    of shadowCatalogue
      .mappedIntoPermanentUniverse
  ) {
    const shadowId =
      mapping.shadowCandidateId

    const releaseDate =
      mapping
        .shadowEntry
        .releaseDate
        .toISOString()

    shadowOverrides[
      shadowId
    ] = {
      released:
        true,

      playerUsable:
        true,

      reason:
        'SHADOW_RELEASED',

      confidence:
        'EXPLICIT',

      baseCandidateId:
        mapping.candidateId,

      sourceCode:
        mapping
          .shadowEntry
          .code,

      releaseDate,
    }

    updateSummary(
      shadowSummary,
      {
        released:
          true,

        playerUsable:
          true,

        reason:
          'SHADOW_RELEASED',

        confidence:
          'EXPLICIT',
      }
    )
  }

  /**
   * Collectible aliases only supplement evidence for
   * an already-existing Shadow combat candidate.
   *
   * They never create duplicate shadowOverrides.
   */
  for (
    const alias
    of shadowCatalogue
      .aliasesIntoPermanentUniverse
  ) {
    const shadowId =
      alias.shadowCandidateId

    if (
      shadowOverrides[
        shadowId
      ]
    ) {
      continue
    }

    shadowOverrides[
      shadowId
    ] = {
      released:
        true,

      playerUsable:
        true,

      reason:
        'SHADOW_RELEASED_VIA_COLLECTIBLE_ALIAS',

      confidence:
        'EXPLICIT',

      baseCandidateId:
        alias.candidateId,

      sourceCode:
        alias
          .shadowEntry
          .code,

      releaseDate:
        alias
          .shadowEntry
          .releaseDate
          .toISOString(),
    }

    updateSummary(
      shadowSummary,
      {
        released:
          true,

        playerUsable:
          true,

        reason:
          'SHADOW_RELEASED_VIA_COLLECTIBLE_ALIAS',

        confidence:
          'EXPLICIT',
      }
    )
  }

  // ------------------------------------------------
  // Build output
  // ------------------------------------------------

  const output = {
    version:
      1,

    generatedAt:
      generationTime
        .toISOString(),

    defaultPlayerUsable:
      false,

    sources: {
      pokemonGoApi:
        POKEMON_GO_API_URL,

      releaseCatalogue:
        'Bulbapedia: List of Pokémon by availability in Pokémon GO',

      shadowCatalogue:
        shadowCatalogue
          .sourceUrl,
    },

    generation: {
      rawReferenceRecords:
        pokemon.length,

      raidCandidates:
        permanentCandidates.length,

      rejectedRecords:
        permanentRejected.length,

      collapsedCombatEquivalentRecords:
        collapsed.length,

      releasedSpeciesCodes:
        releaseCatalogue
          .releasedSpecies
          .size,

      unreleasedSpeciesCodes:
        releaseCatalogue
          .unreleasedSpecies
          .size,

      unreleasedFormEntries:
        releaseCatalogue
          .unreleasedFormEntries
          .length,

      temporaryEvolutionCandidates:
        temporaryEvolutionCandidates.length,

      temporaryEvolutionRejectedRecords:
        temporaryRejected.length,

      totalRaidCandidates:
        candidates.length,

      releasedTemporaryEvolutionEntries:
        temporaryReleaseCatalogue
          .released
          .size,

      upcomingTemporaryEvolutionEntries:
        temporaryReleaseCatalogue
          .upcoming
          .size,

      unreleasedTemporaryEvolutionEntries:
        temporaryReleaseCatalogue
          .unreleased
          .size,

      parsedShadowEntries:
        shadowCatalogue
          .counts
          .parsed,

      directShadowMappings:
        shadowCatalogue
          .counts
          .directMapped,

      collectibleShadowAliases:
        shadowCatalogue
          .counts
          .collectibleAliases,

      uniqueReleasedShadowCombatCandidates:
        Object.keys(
          shadowOverrides
        ).length,

      apexShadowEntries:
        shadowCatalogue
          .counts
          .apex,

      futureShadowEntries:
        shadowCatalogue
          .counts
          .future,

      unmappedShadowEntries:
        shadowCatalogue
          .counts
          .unmapped,

      invalidShadowReleaseDates:
        shadowCatalogue
          .counts
          .invalidDates,
    },

    overrides,

    temporaryEvolutionOverrides,

    shadowOverrides,
  }

  await fs.writeFile(
    AVAILABILITY_FILE,
    JSON.stringify(
      output,
      null,
      2
    ) + '\n',
    'utf8'
  )

  // ------------------------------------------------
  // Permanent summary
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'PERMANENT AVAILABILITY SUMMARY'
  )
  console.log(
    '================================'
  )

  console.log(
    `Player-usable candidates: ${permanentSummary.usable}`
  )

  console.log(
    `Unavailable candidates: ${permanentSummary.unavailable}`
  )

  console.log(
    `Explicit decisions: ${permanentSummary.explicit}`
  )

  console.log(
    `Inferred form decisions: ${permanentSummary.inferred}`
  )

  console.log(
    `Unknown decisions: ${permanentSummary.unknown}`
  )

  console.log(
    `Unmatched external forms: ${permanentSummary.unmatched}`
  )

  // ------------------------------------------------
  // Temporary summary
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'TEMPORARY EVOLUTION SUMMARY'
  )
  console.log(
    '================================'
  )

  console.log(
    `Temporary candidates: ${temporaryEvolutionCandidates.length}`
  )

  console.log(
    `Player usable: ${temporarySummary.usable}`
  )

  console.log(
    `Unavailable: ${temporarySummary.unavailable}`
  )

  console.log(
    `Explicit decisions: ${temporarySummary.explicit}`
  )

  console.log(
    `Unknown decisions: ${temporarySummary.unknown}`
  )

  console.log(
    `Unmatched species: ${temporarySummary.unmatched}`
  )

  // ------------------------------------------------
  // Shadow summary
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'SHADOW AVAILABILITY SUMMARY'
  )
  console.log(
    '================================'
  )

  console.log(
    `Unique Shadow combat candidates: ${Object.keys(shadowOverrides).length}`
  )

  console.log(
    `Player usable: ${shadowSummary.usable}`
  )

  console.log(
    `Explicit decisions: ${shadowSummary.explicit}`
  )

  console.log(
    `Apex entries deferred: ${shadowCatalogue.apex.length}`
  )

  console.log(
    `Collectible aliases collapsed: ${shadowCatalogue.collectibleAliases.length}`
  )

  console.log(
    `Unmapped released entries: ${shadowCatalogue.unmapped.length}`
  )

  console.log(
    `Invalid release dates: ${shadowCatalogue.invalidDates.length}`
  )

  // ------------------------------------------------
  // Permanent spot checks
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'PERMANENT SPOT CHECKS'
  )
  console.log(
    '================================'
  )

  const permanentSpotChecks = [
    'RAYQUAZA',

    'BAXCALIBUR',

    'MEWTWO__MEWTWO_A',

    'GIRATINA__GIRATINA_ORIGIN',

    'DARMANITAN__DARMANITAN_GALARIAN_STANDARD',

    'DARMANITAN__DARMANITAN_GALARIAN_ZEN',

    'NECROZMA',

    'NECROZMA__NECROZMA_DAWN_WINGS',

    'NECROZMA__NECROZMA_DUSK_MANE',

    'NECROZMA__NECROZMA_ULTRA',

    'ETERNATUS',

    'ETERNATUS__ETERNATUS_ETERNAMAX',

    'CALYREX__CALYREX_SHADOW_RIDER',

    'ARCEUS',

    'SILVALLY',

    'LYCANROC',

    'LYCANROC__LYCANROC_DUSK',

    'LYCANROC__LYCANROC_MIDNIGHT',

    'TOXTRICITY',
  ]

  for (
    const id
    of permanentSpotChecks
  ) {
    const result =
      overrides[id]

    if (!result) {
      console.log(
        `⚠️ ${id}: NOT PRESENT`
      )

      continue
    }

    console.log(
      `${result.playerUsable ? '✅' : '❌'} ` +
      `${id} | ` +
      `released=${result.released} | ` +
      `usable=${result.playerUsable} | ` +
      `${result.reason} | ` +
      `${result.confidence}`
    )
  }

  // ------------------------------------------------
  // Temporary spot checks
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'TEMPORARY EVOLUTION SPOT CHECKS'
  )
  console.log(
    '================================'
  )

  const temporarySpotChecks = [
    'RAYQUAZA__TEMP_EVOLUTION_MEGA',

    'GROUDON__TEMP_EVOLUTION_PRIMAL',

    'KYOGRE__TEMP_EVOLUTION_PRIMAL',

    'CHARIZARD__TEMP_EVOLUTION_MEGA_X',

    'CHARIZARD__TEMP_EVOLUTION_MEGA_Y',

    'GENGAR__TEMP_EVOLUTION_MEGA',

    'GARDEVOIR__TEMP_EVOLUTION_MEGA',

    'LUCARIO__TEMP_EVOLUTION_MEGA',

    'TYRANITAR__TEMP_EVOLUTION_MEGA',

    'DIANCIE__TEMP_EVOLUTION_MEGA',
  ]

  for (
    const id
    of temporarySpotChecks
  ) {
    const result =
      temporaryEvolutionOverrides[
        id
      ]

    if (!result) {
      console.log(
        `⚠️ ${id}: NOT PRESENT IN CURRENT CANDIDATE UNIVERSE`
      )

      continue
    }

    console.log(
      `${result.playerUsable ? '✅' : '❌'} ` +
      `${id} | ` +
      `released=${result.released} | ` +
      `usable=${result.playerUsable} | ` +
      `${result.reason} | ` +
      `${result.confidence}` +
      (
        result.releaseDate
          ? ` | release=${result.releaseDate.slice(0, 10)}`
          : ''
      )
    )
  }

  // ------------------------------------------------
  // Shadow spot checks
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'SHADOW SPOT CHECKS'
  )
  console.log(
    '================================'
  )

  const shadowSpotChecks = [
    'MAMOSWINE__SHADOW',

    'MEWTWO__SHADOW',

    'TYRANITAR__SHADOW',

    'SALAMENCE__SHADOW',

    'GARDEVOIR__SHADOW',

    'GARCHOMP__SHADOW',

    'DRAGONITE__SHADOW',

    'MOLTRES__SHADOW',

    'RAIKOU__SHADOW',
  ]

  for (
    const id
    of shadowSpotChecks
  ) {
    const result =
      shadowOverrides[
        id
      ]

    if (!result) {
      console.log(
        `❌ ${id}: NOT PRESENT`
      )

      continue
    }

    console.log(
      `✅ ${id} | ` +
      `released=${result.released} | ` +
      `usable=${result.playerUsable} | ` +
      `${result.reason} | ` +
      `${result.confidence} | ` +
      `base=${result.baseCandidateId} | ` +
      `release=${result.releaseDate.slice(0, 10)}`
    )
  }

  // ------------------------------------------------
  // Apex Shadow report
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'APEX SHADOWS — DEFERRED'
  )
  console.log(
    '================================'
  )

  for (
    const entry
    of shadowCatalogue.apex
  ) {
    console.log(
      `${entry.shadowEntry.code} | ` +
      `${entry.shadowEntry.name} | ` +
      `${entry.shadowEntry.releaseDateRaw}`
    )
  }

  // ------------------------------------------------
  // Source-only Mewtwo Mega check
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'MEWTWO MEGA SOURCE CHECK'
  )
  console.log(
    '================================'
  )

  for (
    const temporaryEvolutionId
    of [
      'TEMP_EVOLUTION_MEGA_X',
      'TEMP_EVOLUTION_MEGA_Y',
    ]
  ) {
    const key =
      buildTemporaryReleaseKey({
        dexCode:
          '0150',

        temporaryEvolutionId,
      })

    const released =
      temporaryReleaseCatalogue
        .released
        .get(
          key
        )

    if (released) {
      console.log(
        `✅ MEWTWO ${temporaryEvolutionId} | ` +
        `source says RELEASED | ` +
        `${released.releaseDate.slice(0, 10)} | ` +
        `PokeIQ candidate=${
          Boolean(
            temporaryEvolutionOverrides[
              `MEWTWO__${temporaryEvolutionId}`
            ]
          )
        }`
      )
    } else {
      console.log(
        `⚠️ MEWTWO ${temporaryEvolutionId} | release status not found`
      )
    }
  }

  // ------------------------------------------------
  // Unknown permanent decisions
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'UNKNOWN PERMANENT DECISIONS'
  )
  console.log(
    '================================'
  )

  if (
    permanentUnknownEntries.length ===
    0
  ) {
    console.log(
      'None'
    )
  } else {
    for (
      const entry
      of permanentUnknownEntries
    ) {
      console.log(
        `${entry.id} → ${entry.reason}`
      )
    }
  }

  // ------------------------------------------------
  // Unknown temporary decisions
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'UNKNOWN TEMPORARY DECISIONS'
  )
  console.log(
    '================================'
  )

  if (
    temporaryUnknownEntries.length ===
    0
  ) {
    console.log(
      'None'
    )
  } else {
    for (
      const entry
      of temporaryUnknownEntries
    ) {
      console.log(
        `${entry.id} → ${entry.reason}`
      )
    }
  }

  // ------------------------------------------------
  // Malformed temporary records
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'MALFORMED TEMPORARY RECORDS'
  )
  console.log(
    '================================'
  )

  if (
    temporaryRejected.length ===
    0
  ) {
    console.log(
      'None'
    )
  } else {
    for (
      const entry
      of temporaryRejected
    ) {
      console.log(
        `${entry.id} [${entry.form}] | ` +
        `${entry.temporaryEvolutionId ?? 'NULL'} → ` +
        `${entry.reasons.join(', ')}`
      )
    }
  }

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'UPDATE COMPLETE'
  )
  console.log(
    '================================'
  )

  console.log(
    `Availability file written to: ${AVAILABILITY_FILE}`
  )
}

main().catch(
  (error) => {
    console.error('')

    console.error(
      'Pokémon availability update failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)