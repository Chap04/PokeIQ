const GAME_MASTER_URL =
  'https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json'

// --------------------------------------------------
// Search targets
// --------------------------------------------------

const SEARCH_TERMS = [
  'KYUREM',
  'KYUREM_WHITE',
  'KYUREM_BLACK',
  'GLACIATE',
  'ICE_BURN',
  'FREEZE_SHOCK',
  'FUSION_FLARE',
  'FUSION_BOLT',
]

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function unwrapTemplate(
  template
) {
  return (
    template?.data ??
    template
  )
}

function stringify(
  value
) {
  try {
    return JSON.stringify(
      value
    )
  } catch {
    return ''
  }
}

function findMatchingTerms(
  value
) {
  const text =
    stringify(
      value
    ).toUpperCase()

  return SEARCH_TERMS.filter(
    (term) =>
      text.includes(
        term
      )
  )
}

function printDivider() {
  console.log(
    '================================'
  )
}

function printTemplate({
  templateId,
  data,
  matches,
}) {
  console.log('')
  console.log(
    '--------------------------------'
  )

  console.log(
    `Template: ${templateId ?? 'UNKNOWN'}`
  )

  console.log(
    `Matches: ${matches.join(', ')}`
  )

  console.log('')

  console.dir(
    data,
    {
      depth:
        null,

      maxArrayLength:
        null,
    }
  )
}

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  console.log(
    'Inspecting Kyurem fusion mechanics...'
  )

  console.log('')
  console.log(
    'Downloading Pokémon GO Game Master...'
  )

  const response =
    await fetch(
      GAME_MASTER_URL
    )

  if (!response.ok) {
    throw new Error(
      `Game Master request failed: ${response.status}`
    )
  }

  const raw =
    await response.json()

  const templates =
    Array.isArray(raw)
      ? raw
      : raw.itemTemplates ??
        raw.templates ??
        []

  console.log(
    `Loaded ${templates.length} templates.`
  )

  // ------------------------------------------------
  // Find every potentially relevant template
  // ------------------------------------------------

  const matches = []

  for (
    const template
    of templates
  ) {
    const data =
      unwrapTemplate(
        template
      )

    const templateId =
      data?.templateId ??
      template?.templateId ??
      null

    const matchedTerms =
      findMatchingTerms({
        templateId,
        data,
      })

    if (
      matchedTerms.length ===
      0
    ) {
      continue
    }

    matches.push({
      templateId,
      data,
      matches:
        matchedTerms,
    })
  }

  console.log('')
  printDivider()
  console.log(
    'MATCH SUMMARY'
  )
  printDivider()

  console.log(
    `Relevant templates: ${matches.length}`
  )

  // ------------------------------------------------
  // Categorize matches
  // ------------------------------------------------

  const pokemonTemplates =
    matches.filter(
      (entry) =>
        Boolean(
          entry.data
            ?.pokemonSettings
        )
    )

  const moveTemplates =
    matches.filter(
      (entry) =>
        Boolean(
          entry.data
            ?.moveSettings
        )
    )

  const otherTemplates =
    matches.filter(
      (entry) =>
        !entry.data
          ?.pokemonSettings &&
        !entry.data
          ?.moveSettings
    )

  console.log(
    `Pokémon templates: ${pokemonTemplates.length}`
  )

  console.log(
    `Move templates: ${moveTemplates.length}`
  )

  console.log(
    `Other mechanic templates: ${otherTemplates.length}`
  )

  // ------------------------------------------------
  // Pokémon records
  // ------------------------------------------------

  console.log('')
  printDivider()
  console.log(
    'KYUREM POKÉMON SETTINGS'
  )
  printDivider()

  for (
    const entry
    of pokemonTemplates
  ) {
    printTemplate(
      entry
    )
  }

  // ------------------------------------------------
  // Moves
  // ------------------------------------------------

  console.log('')
  printDivider()
  console.log(
    'KYUREM-RELATED MOVE SETTINGS'
  )
  printDivider()

  for (
    const entry
    of moveTemplates
  ) {
    printTemplate(
      entry
    )
  }

  // ------------------------------------------------
  // Other mechanics
  // ------------------------------------------------

  console.log('')
  printDivider()
  console.log(
    'OTHER FUSION / FORM MECHANICS'
  )
  printDivider()

  if (
    otherTemplates.length ===
    0
  ) {
    console.log('')
    console.log(
      'No additional matching templates.'
    )
  }

  for (
    const entry
    of otherTemplates
  ) {
    printTemplate(
      entry
    )
  }

  // ------------------------------------------------
  // Focused field search
  // ------------------------------------------------

  console.log('')
  printDivider()
  console.log(
    'FIELD-NAME INSPECTION'
  )
  printDivider()

  const fieldNames =
    new Map()

  function inspectKeys(
    value,
    path = ''
  ) {
    if (
      !value ||
      typeof value !==
        'object'
    ) {
      return
    }

    if (
      Array.isArray(
        value
      )
    ) {
      for (
        let index = 0;
        index < value.length;
        index += 1
      ) {
        inspectKeys(
          value[index],
          `${path}[${index}]`
        )
      }

      return
    }

    for (
      const [
        key,
        child,
      ]
      of Object.entries(
        value
      )
    ) {
      const childPath =
        path
          ? `${path}.${key}`
          : key

      const upperKey =
        key.toUpperCase()

      if (
        upperKey.includes(
          'FUSION'
        ) ||
        upperKey.includes(
          'FORM'
        ) ||
        upperKey.includes(
          'MOVE'
        ) ||
        upperKey.includes(
          'TRANSFORM'
        )
      ) {
        if (
          !fieldNames.has(
            childPath
          )
        ) {
          fieldNames.set(
            childPath,
            child
          )
        }
      }

      inspectKeys(
        child,
        childPath
      )
    }
  }

  for (
    const entry
    of matches
  ) {
    inspectKeys(
      entry.data
    )
  }

  for (
    const [
      field,
      value,
    ]
    of fieldNames
  ) {
    console.log('')
    console.log(
      field
    )

    console.dir(
      value,
      {
        depth:
          5,

        maxArrayLength:
          20,
      }
    )
  }

  console.log('')
  printDivider()
  console.log(
    'INSPECTION COMPLETE'
  )
  printDivider()

  console.log(
    'No PokeIQ files were modified.'
  )
}

main().catch(
  (error) => {
    console.error('')
    console.error(
      'Kyurem fusion inspection failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)