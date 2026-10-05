const GAME_MASTER_URL =
  'https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json'

const TARGETS =
  new Set([
    'ANORITH',
    'BELDUM',
    'METANG',
    'EEVEE',
    'PORYGON',
    'PILOSWINE',
    'INKAY',
    'FARFETCHD',
    'URSARING',
  ])

function unwrapTemplate(template) {
  return (
    template?.data ??
    template
  )
}

async function main() {
  console.log(
    'Inspecting evolution branches...'
  )

  console.log('')

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

  for (
    const template
    of templates
  ) {
    const data =
      unwrapTemplate(
        template
      )

    const settings =
      data?.pokemonSettings

    if (!settings) {
      continue
    }

    if (
      !TARGETS.has(
        settings.pokemonId
      )
    ) {
      continue
    }

    const branches =
      settings.evolutionBranch ??
      []

    if (
      !Array.isArray(
        branches
      ) ||
      branches.length === 0
    ) {
      continue
    }

    console.log(
      '================================'
    )

    console.log(
      `${settings.pokemonId}` +
      ` [${settings.form ?? 'NORMAL'}]`
    )

    console.log(
      '================================'
    )

    console.dir(
      branches,
      {
        depth:
          null,

        colors:
          true,
      }
    )

    console.log('')
  }
}

main().catch(
  (error) => {
    console.error('')

    console.error(
      'Evolution inspection failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)