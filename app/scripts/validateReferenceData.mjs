import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const REFERENCE_DIR = path.resolve(
  __dirname,
  '../src/data/reference'
)

const TEST_SPECIES = [
  'RAYQUAZA',
  'LUCARIO',
  'MEWTWO',
  'CHARIZARD',
  'GIRATINA',
  'DARMANITAN',
  'MAMOSWINE',
  'NECROZMA',
  'ZACIAN',
  'EEVEE',
]

// --------------------------------------------------
// Helpers
// --------------------------------------------------

async function readJson(filename) {
  const filePath = path.join(
    REFERENCE_DIR,
    filename
  )

  const contents = await fs.readFile(
    filePath,
    'utf8'
  )

  return JSON.parse(contents)
}

function countMoves(moveGroup) {
  return (
    moveGroup.normal.length +
    moveGroup.elite.length +
    moveGroup.special.length
  )
}

function printMoveGroup(label, group) {
  console.log(`    ${label}:`)

  console.log(
    `      Normal: ${
      group.normal.length
        ? group.normal.join(', ')
        : 'None'
    }`
  )

  console.log(
    `      Elite: ${
      group.elite.length
        ? group.elite.join(', ')
        : 'None'
    }`
  )

  console.log(
    `      Special: ${
      group.special.length
        ? group.special.join(', ')
        : 'None'
    }`
  )
}

function printPokemon(record) {
  console.log('')
  console.log(`  Form: ${record.form}`)

  console.log(
    `    Template: ${record.templateId}`
  )

  console.log(
    `    Types: ${
      record.types.length
        ? record.types.join(' / ')
        : 'UNKNOWN'
    }`
  )

  console.log(
    `    Stats: ATK ${record.stats.attack} | DEF ${record.stats.defense} | STA ${record.stats.stamina}`
  )

  printMoveGroup(
    'Fast Moves',
    record.moves.fast
  )

  printMoveGroup(
    'Charged Moves',
    record.moves.charged
  )

  if (
    record.temporaryEvolutions.length
  ) {
    console.log(
      '    Temporary Evolutions:'
    )

    for (
      const evolution
      of record.temporaryEvolutions
    ) {
      console.log(
        `      ${evolution.id}`
      )

      console.log(
        `        Stats: ATK ${evolution.stats.attack} | DEF ${evolution.stats.defense} | STA ${evolution.stats.stamina}`
      )

      console.log(
        `        Types: ${
          evolution.types.length
            ? evolution.types.join(' / ')
            : 'Inherited'
        }`
      )

      console.log(
        `        Required Move: ${
          evolution.requirements.move ??
          'None'
        }`
      )

      console.log(
        `        Initial Energy: ${
          evolution.requirements
            .initialEnergy ??
          'Unknown'
        }`
      )

      console.log(
        `        Subsequent Energy: ${
          evolution.requirements
            .subsequentEnergy ??
          'Unknown'
        }`
      )
    }
  }

  if (record.specialMoveItem) {
    console.log(
      `    Special Move Item: ${record.specialMoveItem.item} ×${record.specialMoveItem.count}`
    )
  }
}

// --------------------------------------------------
// Validation
// --------------------------------------------------

async function main() {
  console.log(
    'Validating PokeIQ Reference Data...'
  )

  const [pokemon, moves, metadata] =
    await Promise.all([
      readJson('pokemon.json'),
      readJson('moves-pve.json'),
      readJson('metadata.json'),
    ])

  console.log('')
  console.log('==============================')
  console.log('REFERENCE DATA SUMMARY')
  console.log('==============================')

  console.log(
    `Pokémon/form records: ${pokemon.length}`
  )

  console.log(
    `PvE move records: ${moves.length}`
  )

  console.log(
    `Source timestamp: ${metadata.sourceTimestamp}`
  )

  console.log(
    `Generated at: ${metadata.generatedAt}`
  )

  // ----------------------------------------------
  // General integrity checks
  // ----------------------------------------------

  const missingTypes =
    pokemon.filter(
      (record) =>
        record.types.length === 0
    )

  const missingStats =
    pokemon.filter(
      (record) =>
        record.stats.attack == null ||
        record.stats.defense == null ||
        record.stats.stamina == null
    )

  const noMoves =
    pokemon.filter(
      (record) =>
        countMoves(
          record.moves.fast
        ) === 0 &&
        countMoves(
          record.moves.charged
        ) === 0
    )

  const duplicateKeys = []

  const seen = new Set()

  for (const record of pokemon) {
    const key =
      `${record.id}:${record.form}`

    if (seen.has(key)) {
      duplicateKeys.push(key)
    }

    seen.add(key)
  }

  console.log('')
  console.log('==============================')
  console.log('INTEGRITY CHECKS')
  console.log('==============================')

  console.log(
    `Missing types: ${missingTypes.length}`
  )

  console.log(
    `Missing base stats: ${missingStats.length}`
  )

  console.log(
    `No moves: ${noMoves.length}`
  )
  if (noMoves.length) {
  console.log('')
  console.log(
    'Pokémon/forms with no moves:'
  )

  for (const record of noMoves) {
    console.log(
      `  ${record.id} — ${record.form} — ${record.templateId}`
    )
  }
}

  console.log(
    `Duplicate species/form keys: ${duplicateKeys.length}`
  )

  // ----------------------------------------------
  // Species stress tests
  // ----------------------------------------------

  console.log('')
  console.log('==============================')
  console.log('SPECIES STRESS TESTS')
  console.log('==============================')

  for (const species of TEST_SPECIES) {
    const records =
      pokemon.filter(
        (record) =>
          record.id === species
      )

    console.log('')
    console.log(
      '################################'
    )

    console.log(species)

    console.log(
      '################################'
    )

    if (!records.length) {
      console.log(
        '  ❌ No records found.'
      )

      continue
    }

    console.log(
      `  Records found: ${records.length}`
    )

    for (const record of records) {
      printPokemon(record)
    }
  }

  // ----------------------------------------------
  // Move-link validation
  // ----------------------------------------------

  const moveIds = new Set(
    moves.map((move) => move.id)
  )

  const referencedMoves =
    new Set()

  for (const record of pokemon) {
    const groups = [
      record.moves.fast.normal,
      record.moves.fast.elite,
      record.moves.fast.special,
      record.moves.charged.normal,
      record.moves.charged.elite,
      record.moves.charged.special,
    ]

    for (const group of groups) {
      for (const move of group) {
        referencedMoves.add(
          String(move)
        )
      }
    }
  }

  const missingMoveData = [
    ...referencedMoves,
  ].filter(
    (move) => !moveIds.has(move)
  )

  console.log('')
  console.log('==============================')
  console.log('MOVE LINK CHECK')
  console.log('==============================')

  console.log(
    `Unique referenced moves: ${referencedMoves.size}`
  )

  console.log(
    `Referenced moves missing PvE data: ${missingMoveData.length}`
  )

  if (missingMoveData.length) {
    console.log('')
    console.log(
      'Missing move IDs:'
    )

    console.log(
      missingMoveData.join(', ')
    )
  }

  console.log('')
  console.log(
    'Validation complete.'
  )
}

main().catch((error) => {
  console.error('')
  console.error(
    'Reference data validation failed:'
  )

  console.error(error)

  process.exitCode = 1
})