/**
 * PokeIQ Pokémon Engine
 * ---------------------
 * Shadow Availability Source
 *
 * Shared parser and mapping helpers for Bulbapedia's
 * "List of Shadow Pokémon in Pokémon GO".
 *
 * This module is intentionally source-focused.
 *
 * It:
 * - parses released Shadow records
 * - normalizes Shadow source codes
 * - maps Shadow records to PokeIQ permanent candidates
 * - identifies collectible/event aliases
 * - isolates Apex Shadow Pokémon
 * - detects future or malformed release dates
 *
 * It does NOT:
 * - generate raid candidates
 * - apply Shadow combat modifiers
 * - decide final player usability
 * - mutate pokemon-availability.json
 */

// --------------------------------------------------
// Source
// --------------------------------------------------

export const SHADOW_SOURCE_URL =
  'https://bulbapedia.bulbagarden.net/w/api.php' +
  '?action=parse' +
  '&page=List_of_Shadow_Pok%C3%A9mon_in_Pok%C3%A9mon_GO' +
  '&prop=wikitext' +
  '&format=json' +
  '&origin=*'

// --------------------------------------------------
// General text helpers
// --------------------------------------------------

export function stripComments(
  text
) {
  return String(
    text ??
    ''
  ).replace(
    /<!--[\s\S]*?-->/g,
    ''
  )
}

/**
 * Bulbapedia sometimes wraps dates in:
 *
 * {{tt|June 26, 2020|extra explanation}}
 *
 * For availability purposes, only the visible first
 * argument matters.
 */
export function flattenTooltipTemplates(
  text
) {
  return String(
    text ??
    ''
  ).replace(
    /\{\{tt\|([^|{}]+)\|[^{}]*\}\}/gi,
    '$1'
  )
}

export function normalizeShadowName(
  value
) {
  return flattenTooltipTemplates(
    String(
      value ??
      ''
    )
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

export function normalizeShadowToken(
  value
) {
  return String(
    value ??
    ''
  )
    .trim()
    .toUpperCase()
    .replace(
      /♀/g,
      '_FEMALE'
    )
    .replace(
      /♂/g,
      '_MALE'
    )
    .replace(
      /[^A-Z0-9]+/g,
      '_'
    )
    .replace(
      /^_+|_+$/g,
      ''
    )
}

// --------------------------------------------------
// Date parsing
// --------------------------------------------------

export function parseShadowReleaseDate(
  value
) {
  const normalized =
    normalizeShadowName(
      value
    )

  const match =
    normalized.match(
      /\b([A-Z][a-z]+)\s+(\d{1,2}),\s+(\d{4})\b/
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

// --------------------------------------------------
// Template parsing
// --------------------------------------------------

export function parseShadowTemplateArguments(
  raw
) {
  const parts =
    raw.split('|')

  const positional = []
  const named = {}

  for (
    const part
    of parts
  ) {
    const equalsIndex =
      part.indexOf('=')

    if (
      equalsIndex >
      0
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
      part.trim()
    )
  }

  return {
    positional,
    named,
  }
}

/**
 * Parses all active:
 *
 * {{lop/shadow/GO|...}}
 *
 * rows from the Bulbapedia source.
 *
 * Commented-out rows are removed before matching.
 */
export function parseShadowTemplates(
  wikitext
) {
  const cleanText =
    flattenTooltipTemplates(
      stripComments(
        wikitext
      )
    )

  const results = []

  const regex =
    /\{\{lop\/shadow\/GO\|([\s\S]*?)\}\}/g

  let match

  while (
    (
      match =
        regex.exec(
          cleanText
        )
    ) !== null
  ) {
    const {
      positional,
      named,
    } =
      parseShadowTemplateArguments(
        match[1]
      )

    const code =
      positional[0] ??
      null

    const name =
      positional[1] ??
      null

    /**
     * Standard source structure:
     *
     * 0 = code
     * 1 = name
     * 2 = stamina
     * 3 = attack
     * 4 = defense
     * 5 = purification cost
     * 6 = release date
     */
    const releaseDateRaw =
      positional[6] ??
      null

    if (
      !code ||
      !name
    ) {
      continue
    }

    results.push({
      code:
        code.trim(),

      name:
        normalizeShadowName(
          name
        ),

      normalizedName:
        normalizeShadowToken(
          name
        ),

      releaseDateRaw:
        normalizeShadowName(
          releaseDateRaw
        ),

      releaseDate:
        parseShadowReleaseDate(
          releaseDateRaw
        ),

      candy:
        named.candy ??
        null,

      catchSource:
        named.catch ??
        null,

      shiny:
        named.shiny ===
        'yes',
    })
  }

  return results
}

// --------------------------------------------------
// Shadow code interpretation
// --------------------------------------------------

export function splitShadowCode(
  code
) {
  const match =
    String(
      code
    ).match(
      /^(\d{4})(.*)$/
    )

  if (!match) {
    return null
  }

  return {
    dex:
      match[1],

    suffix:
      match[2] ??
      '',
  }
}

export const SHADOW_ENTRY_KIND = {
  BASE:
    'BASE',

  ALOLAN:
    'ALOLAN',

  GALARIAN:
    'GALARIAN',

  HISUIAN:
    'HISUIAN',

  PALDEAN:
    'PALDEAN',

  SPECIAL_FORM:
    'SPECIAL_FORM',

  APEX:
    'APEX',

  UNKNOWN:
    'UNKNOWN',
}

export function classifyShadowEntry(
  entry
) {
  const parsed =
    splitShadowCode(
      entry.code
    )

  if (!parsed) {
    return {
      kind:
        SHADOW_ENTRY_KIND
          .UNKNOWN,

      dex:
        null,

      suffix:
        null,
    }
  }

  const {
    dex,
    suffix,
  } =
    parsed

  if (
    suffix ===
    ''
  ) {
    return {
      kind:
        SHADOW_ENTRY_KIND
          .BASE,

      dex,
      suffix,
    }
  }

  if (
    suffix ===
    'A'
  ) {
    /**
     * Lugia and Ho-Oh use "A" for Apex.
     *
     * Other A suffixes represent Alolan forms.
     */
    if (
      dex ===
        '0249' ||
      dex ===
        '0250'
    ) {
      return {
        kind:
          SHADOW_ENTRY_KIND
            .APEX,

        dex,
        suffix,
      }
    }

    return {
      kind:
        SHADOW_ENTRY_KIND
          .ALOLAN,

      dex,
      suffix,
    }
  }

  if (
    suffix ===
    'G'
  ) {
    return {
      kind:
        SHADOW_ENTRY_KIND
          .GALARIAN,

      dex,
      suffix,
    }
  }

  if (
    suffix ===
    'H'
  ) {
    return {
      kind:
        SHADOW_ENTRY_KIND
          .HISUIAN,

      dex,
      suffix,
    }
  }

  if (
    suffix ===
    'P'
  ) {
    return {
      kind:
        SHADOW_ENTRY_KIND
          .PALDEAN,

      dex,
      suffix,
    }
  }

  return {
    kind:
      SHADOW_ENTRY_KIND
        .SPECIAL_FORM,

    dex,
    suffix,
  }
}

// --------------------------------------------------
// Reference indexing
// --------------------------------------------------

export function buildShadowDexLookup(
  pokemon
) {
  if (
    !Array.isArray(
      pokemon
    )
  ) {
    throw new Error(
      'pokemon must be an array.'
    )
  }

  const lookup =
    new Map()

  for (
    const entry
    of pokemon
  ) {
    const match =
      String(
        entry.templateId ??
        ''
      ).match(
        /^V(\d{4})_POKEMON_/
      )

    if (!match) {
      continue
    }

    const dex =
      match[1]

    if (
      !lookup.has(
        dex
      )
    ) {
      lookup.set(
        dex,
        []
      )
    }

    lookup
      .get(
        dex
      )
      .push(
        entry
      )
  }

  return lookup
}

// --------------------------------------------------
// Regional matching
// --------------------------------------------------

export function shadowCandidateMatchesRegionalKind({
  pokemon,
  kind,
}) {
  if (!pokemon) {
    return false
  }

  const form =
    pokemon.form ??
    'NORMAL'

  if (
    kind ===
    SHADOW_ENTRY_KIND.BASE
  ) {
    return (
      form ===
      'NORMAL'
    )
  }

  if (
    kind ===
    SHADOW_ENTRY_KIND.ALOLAN
  ) {
    return (
      form.includes(
        'ALOLA'
      ) ||
      form.includes(
        'ALOLAN'
      )
    )
  }

  if (
    kind ===
    SHADOW_ENTRY_KIND.GALARIAN
  ) {
    return (
      form.includes(
        'GALAR'
      ) ||
      form.includes(
        'GALARIAN'
      )
    )
  }

  if (
    kind ===
    SHADOW_ENTRY_KIND.HISUIAN
  ) {
    return (
      form.includes(
        'HISUI'
      ) ||
      form.includes(
        'HISUIAN'
      )
    )
  }

  if (
    kind ===
    SHADOW_ENTRY_KIND.PALDEAN
  ) {
    return (
      form.includes(
        'PALDEA'
      ) ||
      form.includes(
        'PALDEAN'
      )
    )
  }

  return false
}

// --------------------------------------------------
// Candidate selection
// --------------------------------------------------

export function chooseShadowCandidate({
  entries,
  shadowEntry,
  classification,
}) {
  if (
    !Array.isArray(
      entries
    )
  ) {
    throw new Error(
      'entries must be an array.'
    )
  }

  if (!shadowEntry) {
    throw new Error(
      'shadowEntry is required.'
    )
  }

  if (!classification) {
    throw new Error(
      'classification is required.'
    )
  }

  if (
    classification.kind ===
    SHADOW_ENTRY_KIND.APEX
  ) {
    return null
  }

  const regionalMatches =
    entries.filter(
      (entry) =>
        shadowCandidateMatchesRegionalKind({
          pokemon:
            entry,

          kind:
            classification.kind,
        })
    )

  if (
    regionalMatches.length ===
    1
  ) {
    return regionalMatches[0]
  }

  if (
    regionalMatches.length >
    1
  ) {
    const exactName =
      regionalMatches.find(
        (entry) =>
          normalizeShadowToken(
            entry.id
          ) ===
          shadowEntry
            .normalizedName
      )

    return (
      exactName ??
      regionalMatches[0]
    )
  }

  /**
   * SPECIAL_FORM is deliberately handled by the
   * catalogue builder as a collectible alias.
   */
  return null
}

// --------------------------------------------------
// Base Shadow index
// --------------------------------------------------

export function buildBaseShadowDexSet(
  shadowEntries
) {
  if (
    !Array.isArray(
      shadowEntries
    )
  ) {
    throw new Error(
      'shadowEntries must be an array.'
    )
  }

  const result =
    new Set()

  for (
    const entry
    of shadowEntries
  ) {
    const classification =
      classifyShadowEntry(
        entry
      )

    if (
      classification.kind !==
      SHADOW_ENTRY_KIND.BASE
    ) {
      continue
    }

    if (
      !entry.releaseDate
    ) {
      continue
    }

    result.add(
      classification.dex
    )
  }

  return result
}

// --------------------------------------------------
// Candidate IDs
// --------------------------------------------------

export function buildPermanentShadowBaseId(
  pokemon
) {
  if (!pokemon?.id) {
    throw new Error(
      'pokemon.id is required.'
    )
  }

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

export function buildShadowCandidateId(
  pokemon
) {
  return (
    `${buildPermanentShadowBaseId(
      pokemon
    )}` +
    '__SHADOW'
  )
}

// --------------------------------------------------
// Catalogue mapping
// --------------------------------------------------

/**
 * Maps parsed Shadow records onto PokeIQ's permanent
 * combat candidate universe.
 *
 * This function intentionally separates:
 *
 * - direct mappings
 * - collectible/event aliases
 * - Apex Shadows
 * - future releases
 * - invalid/missing dates
 * - unresolved records
 */
export function mapShadowAvailabilityCatalogue({
  shadowEntries,
  pokemon,
  permanentCandidates,
  now =
    new Date(),
}) {
  if (
    !Array.isArray(
      shadowEntries
    )
  ) {
    throw new Error(
      'shadowEntries must be an array.'
    )
  }

  if (
    !Array.isArray(
      pokemon
    )
  ) {
    throw new Error(
      'pokemon must be an array.'
    )
  }

  if (
    !Array.isArray(
      permanentCandidates
    )
  ) {
    throw new Error(
      'permanentCandidates must be an array.'
    )
  }

  if (
    !(now instanceof Date) ||
    Number.isNaN(
      now.getTime()
    )
  ) {
    throw new Error(
      'now must be a valid Date.'
    )
  }

  const permanentCandidateIds =
    new Set(
      permanentCandidates.map(
        (candidate) =>
          candidate.id
      )
    )

  const baseShadowDexSet =
    buildBaseShadowDexSet(
      shadowEntries
    )

  const dexLookup =
    buildShadowDexLookup(
      pokemon
    )

  const mapped = []

  const collectibleAliases = []

  const unmapped = []

  const apex = []

  const future = []

  const invalidDates = []

  for (
    const shadowEntry
    of shadowEntries
  ) {
    const classification =
      classifyShadowEntry(
        shadowEntry
      )

    // ----------------------------------------------
    // Apex
    // ----------------------------------------------

    if (
      classification.kind ===
      SHADOW_ENTRY_KIND.APEX
    ) {
      apex.push({
        shadowEntry,
        classification,
      })

      continue
    }

    // ----------------------------------------------
    // Invalid / missing release date
    // ----------------------------------------------

    if (
      !shadowEntry.releaseDate
    ) {
      invalidDates.push({
        shadowEntry,
        classification,
      })

      continue
    }

    // ----------------------------------------------
    // Future release
    // ----------------------------------------------

    if (
      shadowEntry.releaseDate >
      now
    ) {
      future.push({
        shadowEntry,
        classification,
      })

      continue
    }

    const referenceEntries =
      dexLookup.get(
        classification.dex
      ) ??
      []

    // ----------------------------------------------
    // Normal / regional forms
    // ----------------------------------------------

    const candidatePokemon =
      chooseShadowCandidate({
        entries:
          referenceEntries,

        shadowEntry,

        classification,
      })

    if (
      candidatePokemon
    ) {
      const candidateId =
        buildPermanentShadowBaseId(
          candidatePokemon
        )

      mapped.push({
        shadowEntry,

        classification,

        candidatePokemon,

        candidateId,

        shadowCandidateId:
          `${candidateId}__SHADOW`,

        existsInPermanentUniverse:
          permanentCandidateIds.has(
            candidateId
          ),

        mappingType:
          'DIRECT',
      })

      continue
    }

    // ----------------------------------------------
    // Collectible-only event form aliases
    // ----------------------------------------------

    if (
      classification.kind ===
        SHADOW_ENTRY_KIND
          .SPECIAL_FORM &&
      baseShadowDexSet.has(
        classification.dex
      )
    ) {
      const basePokemon =
        referenceEntries.find(
          (entry) =>
            (
              entry.form ??
              'NORMAL'
            ) ===
            'NORMAL'
        )

      if (
        basePokemon
      ) {
        const candidateId =
          buildPermanentShadowBaseId(
            basePokemon
          )

        collectibleAliases.push({
          shadowEntry,

          classification,

          candidatePokemon:
            basePokemon,

          candidateId,

          shadowCandidateId:
            `${candidateId}__SHADOW`,

          existsInPermanentUniverse:
            permanentCandidateIds.has(
              candidateId
            ),

          mappingType:
            'COLLECTIBLE_ALIAS',
        })

        continue
      }
    }

    // ----------------------------------------------
    // Unmapped
    // ----------------------------------------------

    unmapped.push({
      shadowEntry,

      classification,

      referenceEntries,
    })
  }

  const mappedIntoPermanentUniverse =
    mapped.filter(
      (entry) =>
        entry.existsInPermanentUniverse
    )

  const aliasesIntoPermanentUniverse =
    collectibleAliases.filter(
      (entry) =>
        entry.existsInPermanentUniverse
    )

  const uniqueShadowCandidateIds =
    new Set([
      ...mappedIntoPermanentUniverse.map(
        (entry) =>
          entry.shadowCandidateId
      ),

      ...aliasesIntoPermanentUniverse.map(
        (entry) =>
          entry.shadowCandidateId
      ),
    ])

  return {
    shadowEntries,

    mapped,

    collectibleAliases,

    unmapped,

    apex,

    future,

    invalidDates,

    mappedIntoPermanentUniverse,

    aliasesIntoPermanentUniverse,

    uniqueShadowCandidateIds,

    counts: {
      parsed:
        shadowEntries.length,

      directMapped:
        mapped.length,

      collectibleAliases:
        collectibleAliases.length,

      unmapped:
        unmapped.length,

      apex:
        apex.length,

      future:
        future.length,

      invalidDates:
        invalidDates.length,

      directCombatCandidates:
        mappedIntoPermanentUniverse.length,

      collectibleAliasCombatCandidates:
        aliasesIntoPermanentUniverse.length,

      uniqueReleasedShadowCombatCandidates:
        uniqueShadowCandidateIds.size,
    },
  }
}

// --------------------------------------------------
// Download helper
// --------------------------------------------------

export async function downloadShadowAvailabilitySource() {
  const response =
    await fetch(
      SHADOW_SOURCE_URL,
      {
        headers: {
          'User-Agent':
            'PokeIQ-development/1.0',
        },
      }
    )

  if (
    !response.ok
  ) {
    throw new Error(
      `Bulbapedia Shadow request failed: ${response.status}`
    )
  }

  const result =
    await response.json()

  const wikitext =
    result
      ?.parse
      ?.wikitext
      ?.['*']

  if (
    typeof wikitext !==
    'string'
  ) {
    throw new Error(
      'Bulbapedia Shadow wikitext not found.'
    )
  }

  return {
    url:
      SHADOW_SOURCE_URL,

    wikitext,

    entries:
      parseShadowTemplates(
        wikitext
      ),
  }
}

// --------------------------------------------------
// High-level helper
// --------------------------------------------------

/**
 * Convenience helper used by scripts that want the
 * complete current Shadow availability catalogue.
 */
export async function buildShadowAvailabilitySource({
  pokemon,
  permanentCandidates,
  now =
    new Date(),
}) {
  const source =
    await downloadShadowAvailabilitySource()

  const catalogue =
    mapShadowAvailabilityCatalogue({
      shadowEntries:
        source.entries,

      pokemon,

      permanentCandidates,

      now,
    })

  return {
    ...catalogue,

    sourceUrl:
      source.url,
  }
}