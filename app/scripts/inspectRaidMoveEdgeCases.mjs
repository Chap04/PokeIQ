const GAME_MASTER_URL =
  'https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json'

// --------------------------------------------------
// Targets
// --------------------------------------------------

const TARGET_MOVE_NAMES = new Set([
  'STRUGGLE',
  'SPLASH_FAST',
  'YAWN_FAST',
  'TRANSFORM_FAST',
])

const TARGET_MOVE_IDS = new Set([
  '406',
  '407',
  '482',
])

const TARGET_POKEMON = new Set([
  'APPLIN',
  'AZURILL',
  'DITTO',
  'ETERNATUS',
  'MORPEKO',
  'SLAKING',
])

const TARGET_FORMS = new Set([
  'MORPEKO_HANGRY',
])

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function unwrapTemplate(template) {
  return template?.data ?? template
}

function divider() {
  console.log(
    '================================'
  )
}

function subDivider() {
  console.log(
    '--------------------------------'
  )
}

function stringValue(value) {
  if (value == null) {
    return null
  }

  return String(value)
}

function getMoveIdentifiers(
  settings
) {
  return {
    movementId:
      stringValue(
        settings.movementId
      ),

    uniqueId:
      stringValue(
        settings.uniqueId
      ),
  }
}

function moveMatchesTarget(
  settings
) {
  const {
    movementId,
    uniqueId,
  } = getMoveIdentifiers(
    settings
  )

  return (
    TARGET_MOVE_NAMES.has(
      movementId
    ) ||
    TARGET_MOVE_NAMES.has(
      uniqueId
    ) ||
    TARGET_MOVE_IDS.has(
      movementId
    ) ||
    TARGET_MOVE_IDS.has(
      uniqueId
    )
  )
}

function pokemonMatchesTarget(
  settings
) {
  const pokemonId =
    settings.pokemonId ?? null

  const form =
    settings.form ?? null

  return (
    TARGET_POKEMON.has(
      pokemonId
    ) ||
    TARGET_FORMS.has(
      form
    )
  )
}

function printMoveSummary({
  templateId,
  settings,
}) {
  const {
    movementId,
    uniqueId,
  } = getMoveIdentifiers(
    settings
  )

  console.log(
    `Template: ${templateId}`
  )

  console.log(
    `movementId: ${movementId}`
  )

  console.log(
    `uniqueId: ${uniqueId}`
  )

  console.log(
    `type: ${
      settings.pokemonType ??
      null
    }`
  )

  console.log(
    `power: ${
      settings.power ??
      null
    }`
  )

  console.log(
    `energyDelta: ${
      settings.energyDelta ??
      null
    }`
  )

  console.log(
    `durationMs: ${
      settings.durationMs ??
      null
    }`
  )

  console.log(
    `damageWindowStartMs: ${
      settings
        .damageWindowStartMs ??
      null
    }`
  )

  console.log(
    `damageWindowEndMs: ${
      settings
        .damageWindowEndMs ??
      null
    }`
  )

  console.log('')
  console.log('Raw moveSettings:')

  console.dir(
    settings,
    {
      depth: null,
    }
  )
}

function printPokemonSummary({
  templateId,
  settings,
}) {
  console.log(
    `Template: ${templateId}`
  )

  console.log(
    `Pokémon: ${
      settings.pokemonId ??
      null
    }`
  )

  console.log(
    `Form: ${
      settings.form ??
      'NORMAL'
    }`
  )

  console.log('')
  console.log(
    'Fast move fields:'
  )

  console.dir(
    {
      quickMoves:
        settings.quickMoves ??
        [],

      eliteQuickMove:
        settings.eliteQuickMove ??
        [],

      nonTmQuickMoves:
        settings
          .nonTmQuickMoves ??
        [],

      nonTmQuickMove:
        settings
          .nonTmQuickMove ??
        [],
    },
    {
      depth: null,
    }
  )

  console.log('')
  console.log(
    'Charged move fields:'
  )

  console.dir(
    {
      cinematicMoves:
        settings.cinematicMoves ??
        [],

      eliteCinematicMove:
        settings
          .eliteCinematicMove ??
        [],

      nonTmCinematicMoves:
        settings
          .nonTmCinematicMoves ??
        [],

      nonTmCinematicMove:
        settings
          .nonTmCinematicMove ??
        [],
    },
    {
      depth: null,
    }
  )

  console.log('')
  console.log(
    'Raw pokemonSettings:'
  )

  console.dir(
    settings,
    {
      depth: null,
    }
  )
}

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  console.log(
    'Inspecting raid move edge cases...'
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

  const moveRecords = []
  const pokemonRecords = []

  for (const template of templates) {
    const data =
      unwrapTemplate(
        template
      )

    const templateId =
      data?.templateId ??
      template?.templateId ??
      null

    if (
      data?.moveSettings &&
      moveMatchesTarget(
        data.moveSettings
      )
    ) {
      moveRecords.push({
        templateId,
        settings:
          data.moveSettings,
      })
    }

    if (
      data?.pokemonSettings &&
      pokemonMatchesTarget(
        data.pokemonSettings
      )
    ) {
      pokemonRecords.push({
        templateId,
        settings:
          data.pokemonSettings,
      })
    }
  }

  console.log('')
  divider()
  console.log(
    'TARGET MOVE RECORDS'
  )
  divider()

  console.log(
    `Matches: ${moveRecords.length}`
  )

  for (
    let index = 0;
    index < moveRecords.length;
    index += 1
  ) {
    console.log('')

    subDivider()

    printMoveSummary(
      moveRecords[index]
    )
  }

  console.log('')
  divider()
  console.log(
    'TARGET POKÉMON RECORDS'
  )
  divider()

  console.log(
    `Matches: ${pokemonRecords.length}`
  )

  for (
    let index = 0;
    index < pokemonRecords.length;
    index += 1
  ) {
    console.log('')

    subDivider()

    printPokemonSummary(
      pokemonRecords[index]
    )
  }

  console.log('')
  divider()
  console.log(
    'IDENTIFIER CROSS-CHECK'
  )
  divider()

  const allMoveSettings = []

  for (const template of templates) {
    const data =
      unwrapTemplate(
        template
      )

    if (!data?.moveSettings) {
      continue
    }

    allMoveSettings.push({
      templateId:
        data.templateId ??
        template?.templateId ??
        null,

      settings:
        data.moveSettings,
    })
  }

  for (
    const targetId
    of TARGET_MOVE_IDS
  ) {
    const matches =
      allMoveSettings.filter(
        ({ settings }) => {
          const {
            movementId,
            uniqueId,
          } =
            getMoveIdentifiers(
              settings
            )

          return (
            movementId ===
              targetId ||
            uniqueId ===
              targetId
          )
        }
      )

    console.log('')
    console.log(
      `ID ${targetId}: ${matches.length} moveSettings match(es)`
    )

    for (
      const match
      of matches
    ) {
      console.log(
        `  ${match.templateId}`
      )

      console.log(
        `    movementId=${
          match.settings
            .movementId ??
          null
        }`
      )

      console.log(
        `    uniqueId=${
          match.settings
            .uniqueId ??
          null
        }`
      )
    }
  }

  console.log('')
  divider()
  console.log(
    'INSPECTION COMPLETE'
  )
  divider()

  console.log(
    'No PokeIQ files were modified.'
  )
}

main().catch((error) => {
  console.error('')

  console.error(
    'Raid move edge-case inspection failed:'
  )

  console.error(error)

  process.exitCode = 1
})