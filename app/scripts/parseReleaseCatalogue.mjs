const RELEASE_SOURCE_URL =
  'https://bulbapedia.bulbagarden.net/w/api.php' +
  '?action=parse' +
  '&page=List_of_Pok%C3%A9mon_by_availability_in_Pok%C3%A9mon_GO' +
  '&prop=wikitext' +
  '&format=json' +
  '&origin=*'

// --------------------------------------------------
// Helpers
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

// --------------------------------------------------
// Template parsing
// --------------------------------------------------

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
            equalsIndex + 1
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
    /\{\{(MSP\/GO|MSP)\|([^{}]+)\}\}/g

  let match

  while (
    (
      match =
        regex.exec(text)
    ) !== null
  ) {
    const template =
      match[1]

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
      positional.length > 1
        ? positional[
            positional.length - 1
          ]
        : null

    if (
      !code ||
      !name
    ) {
      continue
    }

    results.push({
      template,

      code:
        code.trim(),

      name:
        normalizeName(
          name
        ),

      parameters:
        named,

      goTemplate:
        template ===
        'MSP/GO',
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
    const parameterKey =
      JSON.stringify(
        entry.parameters
      )

    const key =
      `${entry.code}|${entry.name}|${parameterKey}`

    if (
      seen.has(key)
    ) {
      continue
    }

    seen.add(key)

    result.push(
      entry
    )
  }

  return result
}

// --------------------------------------------------
// Released / unreleased splitting
// --------------------------------------------------

function splitReleasedAndUnreleased(
  section
) {
  const markerRegex =
    /The following .*? have yet to be released:/i

  const match =
    markerRegex.exec(
      section
    )

  if (!match) {
    return {
      releasedText:
        section,

      unreleasedText:
        '',
    }
  }

  return {
    releasedText:
      section.slice(
        0,
        match.index
      ),

    unreleasedText:
      section.slice(
        match.index +
        match[0].length
      ),
  }
}

// --------------------------------------------------
// Display helpers
// --------------------------------------------------

function formatParameters(
  parameters
) {
  const entries =
    Object.entries(
      parameters
    )

  if (
    entries.length ===
    0
  ) {
    return ''
  }

  return (
    ' {' +
    entries
      .map(
        ([key, value]) =>
          `${key}=${value}`
      )
      .join(', ') +
    '}'
  )
}

function printSample(
  title,
  entries,
  limit = 20
) {
  console.log('')
  console.log(
    '================================'
  )
  console.log(title)
  console.log(
    '================================'
  )

  console.log(
    `Count: ${entries.length}`
  )

  console.log('')

  for (
    const entry
    of entries.slice(
      0,
      limit
    )
  ) {
    console.log(
      `${entry.code.padEnd(10)} ` +
      `${entry.name.padEnd(24)} ` +
      `[${entry.template}]` +
      formatParameters(
        entry.parameters
      )
    )
  }

  if (
    entries.length >
    limit
  ) {
    console.log(
      `...and ${entries.length - limit} more`
    )
  }
}

function containsCode(
  entries,
  code
) {
  return entries.some(
    (entry) =>
      entry.code === code
  )
}

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  console.log(
    'Parsing Pokémon GO release catalogue...'
  )

  console.log('')
  console.log(
    'Downloading Bulbapedia release data...'
  )

  const response =
    await fetch(
      RELEASE_SOURCE_URL,
      {
        headers: {
          'User-Agent':
            'PokeIQ-development/1.0',
        },
      }
    )

  if (!response.ok) {
    throw new Error(
      `Release source request failed: ${response.status}`
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
      'No wikitext returned by release source.'
    )
  }

  console.log(
    `Downloaded ${wikitext.length} characters.`
  )

  // ------------------------------------------------
  // Released history
  // ------------------------------------------------

  const releaseHistory =
    getSection(
      wikitext,
      'List of Pokémon by date'
    )

  if (!releaseHistory) {
    throw new Error(
      'Could not find release-history section.'
    )
  }

  const releasedHistory =
    uniqueEntries(
      extractPokemonTemplates(
        releaseHistory
      )
    )

  // ------------------------------------------------
  // Explicit unreleased Pokémon
  // ------------------------------------------------

  const unreleasedSection =
    getSection(
      wikitext,
      'Unreleased Pokémon'
    )

  if (!unreleasedSection) {
    throw new Error(
      'Could not find unreleased Pokémon section.'
    )
  }

  const unreleasedPokemon =
    uniqueEntries(
      extractPokemonTemplates(
        unreleasedSection
      )
    )

  // ------------------------------------------------
  // Mega / Primal
  // ------------------------------------------------

  const megaSection =
    getSection(
      wikitext,
      'Mega Evolution and Primal Reversion'
    )

  if (!megaSection) {
    throw new Error(
      'Could not find Mega Evolution section.'
    )
  }

  const megaParts =
    splitReleasedAndUnreleased(
      megaSection
    )

  const releasedMegas =
    uniqueEntries(
      extractPokemonTemplates(
        megaParts.releasedText
      )
    )

  const unreleasedMegas =
    uniqueEntries(
      extractPokemonTemplates(
        megaParts.unreleasedText
      )
    )

  // ------------------------------------------------
  // Fusions
  // ------------------------------------------------

  const fusionSection =
    getSection(
      wikitext,
      'Fusions'
    )

  if (!fusionSection) {
    throw new Error(
      'Could not find Fusions section.'
    )
  }

  const fusionParts =
    splitReleasedAndUnreleased(
      fusionSection
    )

  const releasedFusions =
    uniqueEntries(
      extractPokemonTemplates(
        fusionParts.releasedText
      )
    )

  const unreleasedFusions =
    uniqueEntries(
      extractPokemonTemplates(
        fusionParts.unreleasedText
      )
    )

  // ------------------------------------------------
  // Gigantamax
  // ------------------------------------------------

  const gigantamaxSection =
    getSection(
      wikitext,
      'Gigantamax'
    )

  if (!gigantamaxSection) {
    throw new Error(
      'Could not find Gigantamax section.'
    )
  }

  const gigantamaxParts =
    splitReleasedAndUnreleased(
      gigantamaxSection
    )

  const releasedGigantamax =
    uniqueEntries(
      extractPokemonTemplates(
        gigantamaxParts.releasedText
      )
    )

  const unreleasedGigantamax =
    uniqueEntries(
      extractPokemonTemplates(
        gigantamaxParts.unreleasedText
      )
    )

  // ------------------------------------------------
  // Summary
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'RELEASE CATALOGUE SUMMARY'
  )
  console.log(
    '================================'
  )

  console.log(
    `Released history entries: ${releasedHistory.length}`
  )

  console.log(
    `Explicit unreleased Pokémon: ${unreleasedPokemon.length}`
  )

  console.log(
    `Released Mega/Primal entries: ${releasedMegas.length}`
  )

  console.log(
    `Unreleased Mega/Primal entries: ${unreleasedMegas.length}`
  )

  console.log(
    `Released Fusion entries: ${releasedFusions.length}`
  )

  console.log(
    `Unreleased Fusion entries: ${unreleasedFusions.length}`
  )

  console.log(
    `Released Gigantamax entries: ${releasedGigantamax.length}`
  )

  console.log(
    `Unreleased Gigantamax entries: ${unreleasedGigantamax.length}`
  )

  // ------------------------------------------------
  // Samples
  // ------------------------------------------------

  printSample(
    'UNRELEASED POKÉMON',
    unreleasedPokemon,
    40
  )

  printSample(
    'RELEASED MEGA / PRIMAL',
    releasedMegas,
    20
  )

  printSample(
    'UNRELEASED MEGA / PRIMAL',
    unreleasedMegas,
    20
  )

  printSample(
    'RELEASED FUSIONS',
    releasedFusions,
    20
  )

  printSample(
    'UNRELEASED FUSIONS',
    unreleasedFusions,
    20
  )

  printSample(
    'RELEASED GIGANTAMAX',
    releasedGigantamax,
    20
  )

  printSample(
    'UNRELEASED GIGANTAMAX',
    unreleasedGigantamax,
    20
  )

  // ------------------------------------------------
  // Known checks
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'KNOWN RELEASE CHECKS'
  )
  console.log(
    '================================'
  )

  const checks = [
    {
      code:
        '0384',

      label:
        'Rayquaza',
    },

    {
      code:
        '0150A',

      label:
        'Armored Mewtwo',
    },

    {
      code:
        '0800DW',

      label:
        'Dawn Wings Necrozma',
    },

    {
      code:
        '0800DM',

      label:
        'Dusk Mane Necrozma',
    },

    {
      code:
        '0646W',

      label:
        'White Kyurem',
    },

    {
      code:
        '0646B',

      label:
        'Black Kyurem',
    },

    {
      code:
        '0890',

      label:
        'Eternatus',
    },

    {
      code:
        '0493',

      label:
        'Arceus',
    },

    {
      code:
        '0773',

      label:
        'Silvally',
    },

    {
      code:
        '0555Z',

      label:
        'Darmanitan Zen',
    },

    {
      code:
        '0555GZ',

      label:
        'Galarian Darmanitan Zen',
    },

    {
      code:
        '0648P',

      label:
        'Pirouette Meloetta',
    },
  ]

  const releasedCollections = [
    releasedHistory,
    releasedMegas,
    releasedFusions,
    releasedGigantamax,
  ]

  const unreleasedCollections = [
    unreleasedPokemon,
    unreleasedMegas,
    unreleasedFusions,
    unreleasedGigantamax,
  ]

  for (
    const check
    of checks
  ) {
    const released =
      releasedCollections.some(
        (entries) =>
          containsCode(
            entries,
            check.code
          )
      )

    const unreleased =
      unreleasedCollections.some(
        (entries) =>
          containsCode(
            entries,
            check.code
          )
      )

    let state =
      'UNKNOWN'

    if (
      released &&
      !unreleased
    ) {
      state =
        'RELEASED'
    }

    if (
      unreleased &&
      !released
    ) {
      state =
        'UNRELEASED'
    }

    if (
      released &&
      unreleased
    ) {
      state =
        'BOTH'
    }

    console.log(
      `${check.code.padEnd(10)} ` +
      `${state.padEnd(12)} ` +
      check.label
    )
  }

  // ------------------------------------------------
  // Calyrex parameter validation
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'CALYREX FUSION PARSING'
  )
  console.log(
    '================================'
  )

  const calyrexEntries =
    unreleasedFusions.filter(
      (entry) =>
        entry.code ===
        '0898'
    )

  if (
    calyrexEntries.length ===
    0
  ) {
    console.log(
      'No unreleased Calyrex fusion entries found.'
    )
  }

  for (
    const entry
    of calyrexEntries
  ) {
    console.log(
      `${entry.code} ` +
      `${entry.name} ` +
      `form=${entry.parameters.form ?? 'NONE'}`
    )
  }

  // ------------------------------------------------
  // Sanity checks
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'SANITY CHECKS'
  )
  console.log(
    '================================'
  )

  const unreleasedGoTemplates =
    unreleasedPokemon.filter(
      (entry) =>
        entry.goTemplate
    )

  const unreleasedPlainTemplates =
    unreleasedPokemon.filter(
      (entry) =>
        !entry.goTemplate
    )

  console.log(
    `Unreleased using MSP/GO: ${unreleasedGoTemplates.length}`
  )

  console.log(
    `Unreleased using MSP: ${unreleasedPlainTemplates.length}`
  )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'PARSE COMPLETE'
  )
  console.log(
    '================================'
  )

  console.log(
    'No PokeIQ files were modified.'
  )
}

main().catch(
  (error) => {
    console.error('')
    console.error(
      'Release catalogue parser failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)