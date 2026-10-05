import fs from 'node:fs/promises'
import path from 'node:path'
import {
  fileURLToPath,
} from 'node:url'

import {
  getTemporaryEvolution,
  hasTemporaryEvolution,
  resolveTemporaryEvolution,
} from '../src/engine/pokemon/transform.js'

// --------------------------------------------------
// Test state
// --------------------------------------------------

let passed = 0
let failed = 0

// --------------------------------------------------
// Test helpers
// --------------------------------------------------

function expectEqual(
  name,
  actual,
  expected
) {
  if (actual === expected) {
    passed += 1
    console.log(`✅ ${name}`)
  } else {
    failed += 1
    console.log(`❌ ${name}`)
    console.log(
      `   Expected: ${expected}`
    )
    console.log(
      `   Actual:   ${actual}`
    )
  }
}

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
// File helpers
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

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  console.log(
    'Testing PokeIQ Pokémon Transformation Engine...'
  )

  const pokemon =
    await readJson(
      'pokemon.json'
    )

  const rayquaza =
    pokemon.find(
      (entry) =>
        entry.id ===
          'RAYQUAZA' &&
        entry.form ===
          'NORMAL'
    )

  if (!rayquaza) {
    throw new Error(
      'Rayquaza reference data not found.'
    )
  }

  const temporaryEvolutionId =
    'TEMP_EVOLUTION_MEGA'

  // ------------------------------------------------
  // Base Rayquaza
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'BASE RAYQUAZA'
  )
  console.log(
    '================================'
  )

  console.log({
    id:
      rayquaza.id,

    form:
      rayquaza.form,

    types:
      rayquaza.types,

    stats:
      rayquaza.stats,

    moves:
      rayquaza.moves,
  })

  // ------------------------------------------------
  // Temporary evolution lookup
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'TEMPORARY EVOLUTION LOOKUP'
  )
  console.log(
    '================================'
  )

  const exists =
    hasTemporaryEvolution(
      rayquaza,
      temporaryEvolutionId
    )

  console.log(
    `Mega evolution exists: ${exists}`
  )

  const megaData =
    getTemporaryEvolution(
      rayquaza,
      temporaryEvolutionId
    )

  console.log(
    megaData
  )

  if (!megaData) {
    throw new Error(
      'Mega Rayquaza temporary evolution data not found.'
    )
  }

  // ------------------------------------------------
  // Resolve Mega Rayquaza
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'RESOLVED MEGA RAYQUAZA'
  )
  console.log(
    '================================'
  )

  const megaRayquaza =
    resolveTemporaryEvolution(
      rayquaza,
      temporaryEvolutionId
    )

  console.log({
    id:
      megaRayquaza.id,

    form:
      megaRayquaza.form,

    types:
      megaRayquaza.types,

    stats:
      megaRayquaza.stats,

    moves:
      megaRayquaza.moves,

    temporaryEvolution:
      megaRayquaza.temporaryEvolution,
  })

  // ------------------------------------------------
  // Validation output
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'VALIDATION'
  )
  console.log(
    '================================'
  )

  console.log(
    `Attack: ${megaRayquaza.stats.attack}`
  )

  console.log(
    `Defense: ${megaRayquaza.stats.defense}`
  )

  console.log(
    `Stamina: ${megaRayquaza.stats.stamina}`
  )

  console.log(
    `Types: ${megaRayquaza.types.join(' / ')}`
  )

  console.log(
    `Required Move: ${
      megaRayquaza
        .temporaryEvolution
        .requirements
        ?.move ?? 'NONE'
    }`
  )

  console.log(
    `Initial Energy: ${
      megaRayquaza
        .temporaryEvolution
        .requirements
        ?.initialEnergy ?? 'NONE'
    }`
  )

  console.log(
    `Subsequent Energy: ${
      megaRayquaza
        .temporaryEvolution
        .requirements
        ?.subsequentEnergy ?? 'NONE'
    }`
  )

  // ------------------------------------------------
  // Regression tests
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'REGRESSION TESTS'
  )
  console.log(
    '================================'
  )

  expectEqual(
    'Mega Rayquaza exists',
    exists,
    true
  )

  expectEqual(
    'Mega Rayquaza Attack',
    megaRayquaza.stats.attack,
    377
  )

  expectEqual(
    'Mega Rayquaza Defense',
    megaRayquaza.stats.defense,
    210
  )

  expectEqual(
    'Mega Rayquaza Stamina',
    megaRayquaza.stats.stamina,
    227
  )

  expectEqual(
    'Mega Rayquaza primary type',
    megaRayquaza.types[0],
    'DRAGON'
  )

  expectEqual(
    'Mega Rayquaza secondary type',
    megaRayquaza.types[1],
    'FLYING'
  )

  expectEqual(
    'Mega Rayquaza required move',
    megaRayquaza
      .temporaryEvolution
      .requirements
      ?.move,
    'DRAGON_ASCENT'
  )

  expectEqual(
    'Mega Rayquaza initial energy',
    megaRayquaza
      .temporaryEvolution
      .requirements
      ?.initialEnergy,
    400
  )

  expectEqual(
    'Mega Rayquaza subsequent energy',
    megaRayquaza
      .temporaryEvolution
      .requirements
      ?.subsequentEnergy,
    80
  )

  expectEqual(
    'Fast move pool preserved',
    megaRayquaza.moves.fast.normal.length,
    rayquaza.moves.fast.normal.length
  )

  const megaChargedMoveCount =
    megaRayquaza.moves.charged.normal.length +
    megaRayquaza.moves.charged.elite.length +
    megaRayquaza.moves.charged.special.length

  const baseChargedMoveCount =
    rayquaza.moves.charged.normal.length +
    rayquaza.moves.charged.elite.length +
    rayquaza.moves.charged.special.length

  expectEqual(
    'Charged move pool preserved',
    megaChargedMoveCount,
    baseChargedMoveCount
  )

  // ------------------------------------------------
  // Results
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'TEST RESULTS'
  )
  console.log(
    '================================'
  )

  console.log(
    `Passed: ${passed}`
  )

  console.log(
    `Failed: ${failed}`
  )

  console.log(
    `Total: ${passed + failed}`
  )

  console.log('')

  if (failed === 0) {
    console.log(
      `🎉 ${passed}/${passed} tests passed.`
    )

    console.log(
      'Temporary Evolution Resolution V1 validation successful.'
    )
  } else {
    console.log(
      `❌ ${failed} test(s) failed.`
    )

    process.exitCode = 1
  }
}

// --------------------------------------------------
// Run
// --------------------------------------------------

main().catch(
  (error) => {
    console.error('')
    console.error(
      'Pokémon transformation test failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)