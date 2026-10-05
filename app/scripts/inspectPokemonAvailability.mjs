const GAME_MASTER_URL =
  'https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json'

// --------------------------------------------------
// Targets
// --------------------------------------------------

const TARGETS = [
  {
    id: 'NECROZMA',
    form: 'NECROZMA_ULTRA',
  },

  {
    id: 'DARMANITAN',
    form: 'DARMANITAN_GALARIAN_ZEN',
  },

  {
    id: 'ARCEUS',
    form: null,
  },

  {
    id: 'SILVALLY',
    form: null,
  },

  {
    id: 'ETERNATUS',
    form: null,
  },

  {
    id: 'RAYQUAZA',
    form: null,
  },
]

// --------------------------------------------------
// Search terms
// --------------------------------------------------

const KEY_TERMS = [
  'release',
  'available',
  'availability',
  'enabled',
  'disabled',
  'encounter',
  'capture',
  'obtain',
  'deploy',
  'spawn',
  'wild',
  'raid',
  'quest',
  'research',
]

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function getTemplates(raw) {
  if (Array.isArray(raw)) {
    return raw
  }

  return (
    raw.itemTemplates ??
    raw.templates ??
    raw.template ??
    raw.item_templates ??
    []
  )
}

function unwrapTemplate(
  template
) {
  return (
    template?.data ??
    template
  )
}

function getTemplateId(
  template
) {
  const data =
    unwrapTemplate(
      template
    )

  return (
    data?.templateId ??
    template?.templateId ??
    null
  )
}

function getPokemonSettings(
  template
) {
  const data =
    unwrapTemplate(
      template
    )

  return (
    data?.pokemonSettings ??
    data?.pokemon_settings ??
    null
  )
}

function targetMatches(
  pokemonSettings,
  target
) {
  if (!pokemonSettings) {
    return false
  }

  const pokemonId =
    pokemonSettings.pokemonId ??
    pokemonSettings.pokemon_id ??
    null

  const form =
    pokemonSettings.form ??
    null

  if (
    pokemonId !==
    target.id
  ) {
    return false
  }

  if (
    target.form === null
  ) {
    return true
  }

  return (
    form ===
    target.form
  )
}

function containsSearchTerm(
  key
) {
  const lowerKey =
    key.toLowerCase()

  return KEY_TERMS.some(
    (term) =>
      lowerKey.includes(
        term.toLowerCase()
      )
  )
}

function findMatchingFields(
  value,
  path = [],
  results = []
) {
  if (
    value === null ||
    value === undefined
  ) {
    return results
  }

  if (
    typeof value !==
    'object'
  ) {
    return results
  }

  if (Array.isArray(value)) {
    value.forEach(
      (child, index) => {
        findMatchingFields(
          child,
          [
            ...path,
            String(index),
          ],
          results
        )
      }
    )

    return results
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
    const currentPath = [
      ...path,
      key,
    ]

    if (
      containsSearchTerm(
        key
      )
    ) {
      results.push({
        path:
          currentPath.join('.'),

        value:
          child,
      })
    }

    if (
      child &&
      typeof child ===
        'object'
    ) {
      findMatchingFields(
        child,
        currentPath,
        results
      )
    }
  }

  return results
}

function printTargetHeader(
  target
) {
  console.log('')
  console.log(
    '================================'
  )

  console.log(
    target.form
      ? `${target.id} [${target.form}]`
      : `${target.id} [ALL FORMS]`
  )

  console.log(
    '================================'
  )
}

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  console.log(
    'Inspecting Pokémon GO Game Master for Pokémon availability fields...'
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
      `Game Master download failed: ${response.status}`
    )
  }

  const raw =
    await response.json()

  const templates =
    getTemplates(
      raw
    )

  console.log(
    `Loaded ${templates.length} templates.`
  )

  for (
    const target
    of TARGETS
  ) {
    printTargetHeader(
      target
    )

    const matches =
      templates.filter(
        (template) =>
          targetMatches(
            getPokemonSettings(
              template
            ),
            target
          )
      )

    console.log(
      `Matching Pokémon template(s): ${matches.length}`
    )

    if (
      matches.length ===
      0
    ) {
      console.log(
        'No matching templates found.'
      )

      continue
    }

    for (
      const template
      of matches
    ) {
      const data =
        unwrapTemplate(
          template
        )

      const pokemonSettings =
        getPokemonSettings(
          template
        )

      console.log('')
      console.log(
        '--------------------------------'
      )

      console.log(
        getTemplateId(
          template
        ) ??
        '(no template ID)'
      )

      console.log(
        '--------------------------------'
      )

      console.log(
        `Pokemon ID: ${
          pokemonSettings
            ?.pokemonId ??
          pokemonSettings
            ?.pokemon_id ??
          'UNKNOWN'
        }`
      )

      console.log(
        `Form: ${
          pokemonSettings
            ?.form ??
          'NONE'
        }`
      )

      const matchingFields =
        findMatchingFields(
          data
        )

      if (
        matchingFields.length ===
        0
      ) {
        console.log(
          'No availability-like fields found.'
        )

        continue
      }

      console.log(
        `Availability-like fields: ${matchingFields.length}`
      )

      for (
        const field
        of matchingFields
      ) {
        console.log(
          `${field.path}:`
        )

        console.dir(
          field.value,
          {
            depth: 3,
            maxArrayLength: 20,
          }
        )
      }
    }
  }
}

main().catch(
  (error) => {
    console.error('')
    console.error(
      'Pokémon availability inspection failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)