import fs from 'node:fs/promises'
import path from 'node:path'
import {
  fileURLToPath,
} from 'node:url'

import {
  buildRaidCandidates,
} from '../src/engine/raid/candidates.js'

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

function countBy(values) {
  const counts =
    new Map()

  for (const value of values) {
    counts.set(
      value,
      (
        counts.get(value) ??
        0
      ) + 1
    )
  }

  return [
    ...counts.entries(),
  ].sort(
    (a, b) =>
      b[1] - a[1]
  )
}

async function main() {
  console.log(
    'Testing PokeIQ Raid Candidate Builder...'
  )

  const [
    pokemon,
    combat,
  ] = await Promise.all([
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

  const {
    candidates,
    rejected,
    collapsed,
  } =
    buildRaidCandidates({
      pokemon,

      cpMultiplier:
        level40Cpm,
    })

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'CANDIDATE SUMMARY'
  )
  console.log(
    '================================'
  )

  console.log(
    `Reference records: ${pokemon.length}`
  )

  console.log(
    `Rejected unusable records: ${rejected.length}`
  )

  console.log(
    `Combat-equivalent records collapsed: ${collapsed.length}`
  )

  console.log(
    `Final raid candidates: ${candidates.length}`
  )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'REJECTIONS'
  )
  console.log(
    '================================'
  )

  for (const entry of rejected) {
    console.log(
      `${entry.id} [${entry.form}] → ${entry.reasons.join(', ')}`
    )
  }

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'COLLAPSED COMBAT EQUIVALENTS'
  )
  console.log(
    '================================'
  )

  console.log('')

  for (
    const entry
    of collapsed.slice(
      0,
      60
    )
  ) {
    console.log(
      `${entry.id} [${entry.form}]` +
      ` → ` +
      `${entry.representativeId} [${entry.representativeForm}]`
    )
  }

  if (
    collapsed.length > 60
  ) {
    console.log('')
    console.log(
      `...and ${collapsed.length - 60} more`
    )
  }

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'KNOWN SPECIES'
  )
  console.log(
    '================================'
  )

  const knownSpecies = [
    'PIKACHU',
    'EEVEE',
    'GIRATINA',
    'DARMANITAN',
    'RAYQUAZA',
    'DEOXYS',
    'NECROZMA',
  ]

  for (
    const id
    of knownSpecies
  ) {
    const matches =
      candidates.filter(
        (candidate) =>
          candidate
            .pokemon
            .id === id
      )

    console.log('')
    console.log(
      `${id}: ${matches.length} combat candidate(s)`
    )

    for (
      const match
      of matches
    ) {
      console.log(
        `  ${match.id}`
      )
    }
  }

  const speciesCounts =
    countBy(
      candidates.map(
        (candidate) =>
          candidate
            .pokemon
            .id
      )
    )

  const multiFormSpecies =
    speciesCounts.filter(
      ([, count]) =>
        count > 1
    )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'REMAINING MULTI-FORM SPECIES'
  )
  console.log(
    '================================'
  )

  console.log(
    `Species with multiple combat candidates: ${multiFormSpecies.length}`
  )

  console.log('')

  for (
    const [
      id,
      count,
    ]
    of multiFormSpecies.slice(
      0,
      50
    )
  ) {
    console.log(
      `${id}: ${count}`
    )
  }
}

main().catch(
  (error) => {
    console.error('')
    console.error(
      'Raid candidate builder failed:'
    )

    console.error(error)

    process.exitCode = 1
  }
)