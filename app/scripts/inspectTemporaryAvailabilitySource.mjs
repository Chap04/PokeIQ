const POKEMON_GO_API_URL =
  'https://pokemon-go-api.github.io/pokemon-go-api/api/pokedex.json'

function objectValues(
  value
) {
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return value
  }

  if (
    typeof value === 'object'
  ) {
    return Object.values(
      value
    )
  }

  return []
}

async function main() {
  console.log(
    'Inspecting temporary-evolution availability source...'
  )

  const response =
    await fetch(
      POKEMON_GO_API_URL
    )

  if (!response.ok) {
    throw new Error(
      `pokemon-go-api request failed: ${response.status}`
    )
  }

  const pokemon =
    await response.json()

  const inspectIds =
    new Set([
      'RAYQUAZA',
      'CHARIZARD',
      'GROUDON',
      'KYOGRE',
      'GENGAR',
      'AGGRON',
      'MEWTWO',
    ])

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'TEMPORARY EVOLUTION RECORDS'
  )
  console.log(
    '================================'
  )

  let totalTemporary = 0
  let inspectedTemporary = 0

  for (
    const species
    of pokemon
  ) {
    const transformations =
      objectValues(
        species.megaEvolutions
      )

    totalTemporary +=
      transformations.length

    if (
      !inspectIds.has(
        species.id
      )
    ) {
      continue
    }

    console.log('')
    console.log(
      '--------------------------------'
    )

    console.log(
      `${species.id}`
    )

    console.log(
      '--------------------------------'
    )

    console.log(
      'Species-level data:'
    )

    console.dir(
      species,
      {
        depth: 2,
        maxArrayLength: 20,
      }
    )

    console.log('')
    console.log(
      'megaEvolutions:'
    )

    console.dir(
      species.megaEvolutions,
      {
        depth: null,
        maxArrayLength: null,
      }
    )

    inspectedTemporary +=
      transformations.length
  }

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'SUMMARY'
  )
  console.log(
    '================================'
  )

  console.log(
    `Total temporary records: ${totalTemporary}`
  )

  console.log(
    `Inspected temporary records: ${inspectedTemporary}`
  )

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
      'Temporary availability inspection failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)