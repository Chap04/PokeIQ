const GAME_MASTER_URL =
  'https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json'

// --------------------------------------------------
// Helpers
// --------------------------------------------------

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

function containsShadowKey(
  value
) {
  if (
    !value ||
    typeof value !==
      'object'
  ) {
    return false
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
    if (
      /shadow|purif/i.test(
        key
      )
    ) {
      return true
    }

    if (
      child &&
      typeof child ===
        'object' &&
      containsShadowKey(
        child
      )
    ) {
      return true
    }
  }

  return false
}

function collectShadowFields(
  value,
  prefix = ''
) {
  if (
    !value ||
    typeof value !==
      'object'
  ) {
    return []
  }

  const results = []

  for (
    const [
      key,
      child,
    ]
    of Object.entries(
      value
    )
  ) {
    const path =
      prefix
        ? `${prefix}.${key}`
        : key

    if (
      /shadow|purif/i.test(
        key
      )
    ) {
      results.push({
        path,
        value:
          child,
      })
    }

    if (
      child &&
      typeof child ===
        'object'
    ) {
      results.push(
        ...collectShadowFields(
          child,
          path
        )
      )
    }
  }

  return results
}

function templateMatchesPokemon(
  template,
  pokemonId
) {
  const templateId =
    String(
      template?.templateId ??
      ''
    )

  const pokemonSettings =
    template?.data
      ?.pokemonSettings

  return (
    templateId.includes(
      `POKEMON_${pokemonId}`
    ) ||
    pokemonSettings
      ?.pokemonId ===
      pokemonId
  )
}

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  console.log(
    'Inspecting raw Game Master for Shadow data...'
  )

  console.log('')
  console.log(
    'Downloading Game Master...'
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

  const result =
    await response.json()

  const templates =
    Array.isArray(
      result
    )
      ? result
      : objectValues(
          result
        )

  console.log(
    `Loaded ${templates.length} templates.`
  )

  // ------------------------------------------------
  // Global Shadow field search
  // ------------------------------------------------

  const shadowTemplates =
    templates.filter(
      (template) =>
        containsShadowKey(
          template
        )
    )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'GLOBAL SHADOW SEARCH'
  )
  console.log(
    '================================'
  )

  console.log(
    `Templates containing Shadow/Purified-related keys: ${shadowTemplates.length}`
  )

  const fieldCounts =
    new Map()

  for (
    const template
    of shadowTemplates
  ) {
    for (
      const field
      of collectShadowFields(
        template
      )
    ) {
      fieldCounts.set(
        field.path,
        (
          fieldCounts.get(
            field.path
          ) ??
          0
        ) +
          1
      )
    }
  }

  console.log('')
  console.log(
    'Most common Shadow/Purified field paths:'
  )

  const sortedFields =
    [
      ...fieldCounts.entries(),
    ]
      .sort(
        (a, b) =>
          b[1] -
          a[1]
      )
      .slice(
        0,
        50
      )

  if (
    sortedFields.length ===
    0
  ) {
    console.log(
      'None'
    )
  } else {
    for (
      const [
        path,
        count,
      ]
      of sortedFields
    ) {
      console.log(
        `${path}: ${count}`
      )
    }
  }

  // ------------------------------------------------
  // Known species inspection
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'KNOWN SHADOW SPECIES'
  )
  console.log(
    '================================'
  )

  const knownIds = [
    'SWINUB',
    'PILOSWINE',
    'MAMOSWINE',
    'MEWTWO',
    'TYRANITAR',
    'SALAMENCE',
    'GARDEVOIR',
    'GARCHOMP',
    'RAIKOU',
    'ENTEI',
    'MOLTRES',
  ]

  for (
    const pokemonId
    of knownIds
  ) {
    const matches =
      templates.filter(
        (template) =>
          templateMatchesPokemon(
            template,
            pokemonId
          )
      )

    console.log('')
    console.log(
      '--------------------------------'
    )
    console.log(
      pokemonId
    )
    console.log(
      '--------------------------------'
    )

    console.log(
      `Matching templates: ${matches.length}`
    )

    let relevantCount = 0

    for (
      const template
      of matches
    ) {
      const fields =
        collectShadowFields(
          template
        )

      if (
        fields.length ===
        0
      ) {
        continue
      }

      relevantCount += 1

      console.log('')
      console.log(
        `Template: ${template.templateId}`
      )

      for (
        const field
        of fields
      ) {
        console.log(
          `  ${field.path}:`
        )

        console.dir(
          field.value,
          {
            depth:
              null,
          }
        )
      }
    }

    if (
      relevantCount ===
      0
    ) {
      console.log(
        'No Shadow/Purified fields found in matching templates.'
      )
    }
  }

  // ------------------------------------------------
  // Sample full Shadow templates
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'SAMPLE SHADOW-RELATED TEMPLATES'
  )
  console.log(
    '================================'
  )

  for (
    const template
    of shadowTemplates.slice(
      0,
      20
    )
  ) {
    console.log('')
    console.log(
      '--------------------------------'
    )

    console.log(
      template.templateId ??
      'NO_TEMPLATE_ID'
    )

    console.dir(
      template,
      {
        depth:
          4,

        maxArrayLength:
          20,
      }
    )
  }

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'INSPECTION COMPLETE'
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
      'Shadow Game Master inspection failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)