import fs from 'node:fs/promises'
import path from 'node:path'
import {
  fileURLToPath,
} from 'node:url'

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

async function main() {
  console.log(
    'Inspecting normalized Kyurem reference data...'
  )

  const [
    pokemon,
    moves,
  ] = await Promise.all([
    readJson(
      'pokemon.json'
    ),

    readJson(
      'moves-pve.json'
    ),
  ])

  const kyuremRecords =
    pokemon.filter(
      (entry) =>
        entry.id ===
        'KYUREM'
    )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'KYUREM RECORDS'
  )
  console.log(
    '================================'
  )

  console.log(
    `Count: ${kyuremRecords.length}`
  )

  for (
    const entry
    of kyuremRecords
  ) {
    console.log('')
    console.log(
      '--------------------------------'
    )

    console.log(
      `${entry.id} [${entry.form}]`
    )

    console.log('')
    console.log(
      'Moves:'
    )

    console.dir(
      entry.moves,
      {
        depth:
          null,
      }
    )

    console.log('')
    console.log(
      'Form Changes:'
    )

    console.dir(
      entry.formChanges,
      {
        depth:
          null,
      }
    )
  }

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'SPECIAL MOVE RECORDS'
  )
  console.log(
    '================================'
  )

  const targetMoveIds = [
    'GLACIATE',
    'ICE_BURN',
    'FREEZE_SHOCK',
  ]

  for (
    const moveId
    of targetMoveIds
  ) {
    const move =
      moves.find(
        (entry) =>
          entry.id ===
          moveId
      )

    console.log('')
    console.log(
      moveId
    )

    console.dir(
      move ?? null,
      {
        depth:
          null,
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
}

main().catch(
  (error) => {
    console.error('')
    console.error(
      'Kyurem reference inspection failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)