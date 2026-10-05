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

function printPokemon(
  entry
) {
  console.log('')
  console.log(
    '--------------------------------'
  )

  console.log(
    `${entry.id} [${entry.form}]`
  )

  console.log(
    '--------------------------------'
  )

  console.log(
    'Template:',
    entry.templateId
  )

  console.log(
    'Types:',
    entry.types
  )

  console.log(
    'Stats:',
    entry.stats
  )

  console.log(
    'Fast Moves:'
  )

  console.log(
    '  Normal:',
    entry.moves.fast.normal
  )

  console.log(
    '  Elite:',
    entry.moves.fast.elite
  )

  console.log(
    '  Special:',
    entry.moves.fast.special
  )

  console.log(
    'Charged Moves:'
  )

  console.log(
    '  Normal:',
    entry.moves.charged.normal
  )

  console.log(
    '  Elite:',
    entry.moves.charged.elite
  )

  console.log(
    '  Special:',
    entry.moves.charged.special
  )

  console.log(
    'Temporary Evolutions:',
    entry.temporaryEvolutions
  )
}

async function main() {
  console.log(
    'Inspecting remaining raid candidate forms...'
  )

  const pokemon =
    await readJson(
      'pokemon.json'
    )

  const speciesToInspect = [
    'PIKACHU',
    'CHARIZARD',
    'CORSOLA',
    'AEGISLASH',
    'GIRATINA',
    'DARMANITAN',
    'NECROZMA',
    'ZACIAN',
    'ZAMAZENTA',
  ]

  for (
    const speciesId
    of speciesToInspect
  ) {
    const matches =
      pokemon.filter(
        (entry) =>
          entry.id ===
          speciesId
      )

    console.log('')
    console.log('')
    console.log(
      '================================'
    )

    console.log(
      `${speciesId} — ${matches.length} REFERENCE RECORD(S)`
    )

    console.log(
      '================================'
    )

    for (
      const entry
      of matches
    ) {
      printPokemon(
        entry
      )
    }
  }
}

main().catch(
  (error) => {
    console.error('')
    console.error(
      'Candidate form inspection failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)