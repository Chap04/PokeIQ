import fs from 'node:fs/promises'
import path from 'node:path'
import {
  fileURLToPath,
} from 'node:url'

import {
  resolveRaidCandidatePokemon,
  deduplicateCombatCandidates,
} from '../src/engine/raid/candidates.js'

// --------------------------------------------------
// Paths
// --------------------------------------------------

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

// --------------------------------------------------
// Helpers
// --------------------------------------------------

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

function countTemporaryEvolutions(
  records
) {
  let valid = 0
  let nullId = 0

  for (
    const pokemon
    of records
  ) {
    for (
      const temporaryEvolution
      of pokemon
        .temporaryEvolutions ??
      []
    ) {
      if (
        temporaryEvolution?.id
      ) {
        valid += 1
      } else {
        nullId += 1
      }
    }
  }

  return {
    valid,
    nullId,
    total:
      valid +
      nullId,
  }
}

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  console.log(
    'Inspecting temporary-evolution source data...'
  )

  const pokemon =
    await readJson(
      'pokemon.json'
    )

  // ------------------------------------------------
  // Raw reference count
  // ------------------------------------------------

  const rawCounts =
    countTemporaryEvolutions(
      pokemon
    )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'RAW REFERENCE DATA'
  )
  console.log(
    '================================'
  )

  console.log(
    `Valid temporary evolutions: ${rawCounts.valid}`
  )

  console.log(
    `Null-ID temporary records: ${rawCounts.nullId}`
  )

  console.log(
    `Total temporary records: ${rawCounts.total}`
  )

  // ------------------------------------------------
  // Resolve permanent mechanics
  // ------------------------------------------------

  const resolved =
    pokemon.map(
      (entry) =>
        resolveRaidCandidatePokemon({
          pokemon:
            entry,

          allPokemon:
            pokemon,
        })
    )

  const eligible =
    resolved.filter(
      (entry) =>
        Number.isFinite(
          entry?.stats?.attack
        ) &&
        Number.isFinite(
          entry?.stats?.defense
        ) &&
        Number.isFinite(
          entry?.stats?.stamina
        ) &&
        Array.isArray(
          entry?.types
        ) &&
        entry.types.length >
          0
    )

  const {
    kept,
    collapsed,
  } =
    deduplicateCombatCandidates(
      eligible
    )

  const keptCounts =
    countTemporaryEvolutions(
      kept
    )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'AFTER COMBAT COLLAPSING'
  )
  console.log(
    '================================'
  )

  console.log(
    `Kept permanent records: ${kept.length}`
  )

  console.log(
    `Collapsed permanent records: ${collapsed.length}`
  )

  console.log(
    `Valid temporary evolutions remaining: ${keptCounts.valid}`
  )

  console.log(
    `Null-ID temporary records remaining: ${keptCounts.nullId}`
  )

  console.log('')
  console.log(
    `Valid temporary evolutions lost during collapsing: ${
      rawCounts.valid -
      keptCounts.valid
    }`
  )

  // ------------------------------------------------
  // Mewtwo
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'MEWTWO REFERENCE RECORDS'
  )
  console.log(
    '================================'
  )

  const mewtwoRecords =
    pokemon.filter(
      (entry) =>
        entry.id ===
        'MEWTWO'
    )

  console.log(
    `Mewtwo records: ${mewtwoRecords.length}`
  )

  for (
    const entry
    of mewtwoRecords
  ) {
    console.log('')
    console.log(
      `${entry.id} [${entry.form}]`
    )

    console.log(
      `Template: ${entry.templateId}`
    )

    console.log(
      'Temporary Evolutions:'
    )

    console.dir(
      entry.temporaryEvolutions,
      {
        depth:
          null,
      }
    )
  }

  // ------------------------------------------------
  // Temporary data lost through collapsing
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'COLLAPSED RECORDS WITH TEMP DATA'
  )
  console.log(
    '================================'
  )

  let lostCount = 0

  for (
    const collapsedEntry
    of collapsed
  ) {
    const original =
      resolved.find(
        (entry) =>
          entry.id ===
            collapsedEntry.id &&
          entry.form ===
            collapsedEntry.form
      )

    const temporaryEvolutions =
      original
        ?.temporaryEvolutions ??
      []

    const validTemporary =
      temporaryEvolutions.filter(
        (entry) =>
          Boolean(
            entry?.id
          )
      )

    if (
      !validTemporary.length
    ) {
      continue
    }

    lostCount +=
      validTemporary.length

    console.log('')
    console.log(
      `${collapsedEntry.id} [${collapsedEntry.form}]`
    )

    console.log(
      `  Representative: ${collapsedEntry.representativeId} [${collapsedEntry.representativeForm}]`
    )

    for (
      const temp
      of validTemporary
    ) {
      console.log(
        `  Temporary: ${temp.id}`
      )
    }
  }

  if (
    lostCount === 0
  ) {
    console.log('')
    console.log(
      'None'
    )
  }

  console.log('')
  console.log(
    `Valid temporary evolutions attached to collapsed records: ${lostCount}`
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
      'Temporary-evolution source inspection failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)