import fs from 'node:fs/promises'
import path from 'node:path'
import {
  fileURLToPath,
} from 'node:url'

import {
  simulateMoveset,
} from '../src/engine/raid/moveset.js'

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
// Reference helpers
// --------------------------------------------------

function findPokemon(
  pokemon,
  id,
  form = 'NORMAL'
) {
  const result =
    pokemon.find(
      (entry) =>
        entry.id === id &&
        entry.form === form
    )

  if (!result) {
    throw new Error(
      `Pokémon not found: ${id} (${form})`
    )
  }

  return result
}

function findMove(
  moves,
  id
) {
  const result =
    moves.find(
      (move) =>
        move.id === id
    )

  if (!result) {
    throw new Error(
      `Move not found: ${id}`
    )
  }

  return result
}

function withIvs(
  pokemon,
  attack = 15,
  defense = 15,
  stamina = 15
) {
  return {
    ...pokemon,

    ivs: {
      attack,
      defense,
      stamina,
    },
  }
}

// --------------------------------------------------
// Test helpers
// --------------------------------------------------

let passed = 0
let failed = 0

function pass(name) {
  passed += 1
  console.log(`✅ ${name}`)
}

function fail(
  name,
  expected,
  actual
) {
  failed += 1

  console.log(`❌ ${name}`)
  console.log(
    `   Expected: ${expected}`
  )
  console.log(
    `   Actual:   ${actual}`
  )
}

function expectEqual(
  name,
  actual,
  expected
) {
  if (actual === expected) {
    pass(name)
  } else {
    fail(
      name,
      expected,
      actual
    )
  }
}

function expectClose(
  name,
  actual,
  expected,
  tolerance = 0.000001
) {
  if (
    Math.abs(
      actual - expected
    ) <= tolerance
  ) {
    pass(name)
  } else {
    fail(
      name,
      expected,
      actual
    )
  }
}

function expectTrue(
  name,
  value
) {
  if (value === true) {
    pass(name)
  } else {
    fail(
      name,
      true,
      value
    )
  }
}

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  console.log(
    'Testing PokeIQ Moveset Cycle Engine...'
  )

  console.log('')

  const [
    pokemon,
    moves,
    combat,
  ] = await Promise.all([
    readJson(
      'pokemon.json'
    ),

    readJson(
      'moves-pve.json'
    ),

    readJson(
      'combat.json'
    ),
  ])

  const rayquaza =
    findPokemon(
      pokemon,
      'RAYQUAZA'
    )

  const dragonTail =
    findMove(
      moves,
      'DRAGON_TAIL_FAST'
    )

  const outrage =
    findMove(
      moves,
      'OUTRAGE'
    )

  const level = 40

  const cpm =
    combat
      .cpMultipliers
      .allLevels[
        String(level)
      ]

  const attacker =
    withIvs(
      rayquaza
    )

  const defender =
    withIvs(
      rayquaza
    )

  const result =
    simulateMoveset({
      attacker,
      defender,

      fastMove:
        dragonTail,

      chargedMove:
        outrage,

      attackerCpMultiplier:
        cpm,

      defenderCpMultiplier:
        cpm,

      combatData:
        combat,

      durationMs:
        30000,
    })

  console.log(
    '================================'
  )
  console.log(
    'MOVE COUNTS'
  )
  console.log(
    '================================'
  )

  expectEqual(
    'Fast Moves used',
    result.fastMovesUsed,
    19
  )

  expectEqual(
    'Charged Moves used',
    result.chargedMovesUsed,
    2
  )

  expectEqual(
    'Total Moves used',
    result.totalMovesUsed,
    21
  )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'FIRST CHARGED MOVE'
  )
  console.log(
    '================================'
  )

  const firstChargedIndex =
    result.actions.findIndex(
      (action) =>
        action.type ===
        'CHARGED'
    )

  const firstCharged =
    result.actions[
      firstChargedIndex
    ]

  expectEqual(
    'Seven Fast Moves before first Charged Move',
    firstChargedIndex,
    7
  )

  expectEqual(
    'First Charged Move is Outrage',
    firstCharged.moveId,
    'OUTRAGE'
  )

  expectEqual(
    'First Outrage starts at 7 seconds',
    firstCharged.startTimeMs,
    7000
  )

  expectEqual(
    'First Outrage ends at 11 seconds',
    firstCharged.endTimeMs,
    11000
  )

  expectEqual(
    'First Outrage begins with 56 energy',
    firstCharged.energyBefore,
    56
  )

  expectEqual(
    'First Outrage leaves 6 energy',
    firstCharged.energyAfter,
    6
  )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'ENERGY ACCOUNTING'
  )
  console.log(
    '================================'
  )

  expectEqual(
    'Ending energy',
    result.endingEnergy,
    52
  )

  const expectedEndingEnergy =
    (
      result.fastMovesUsed *
      dragonTail.energyDelta
    ) +
    (
      result.chargedMovesUsed *
      outrage.energyDelta
    )

  expectEqual(
    'Energy accounting reconciles',
    result.endingEnergy,
    expectedEndingEnergy
  )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'DAMAGE ACCOUNTING'
  )
  console.log(
    '================================'
  )

  expectEqual(
    'Total damage',
    result.totalDamage,
    760
  )

  const fastActions =
    result.actions.filter(
      (action) =>
        action.type ===
        'FAST'
    )

  const chargedActions =
    result.actions.filter(
      (action) =>
        action.type ===
        'CHARGED'
    )

  expectTrue(
    'All Dragon Tails deal 22 damage',
    fastActions.every(
      (action) =>
        action.damage === 22
    )
  )

  expectTrue(
    'All Outrages deal 171 damage',
    chargedActions.every(
      (action) =>
        action.damage === 171
    )
  )

  const summedDamage =
    result.actions.reduce(
      (total, action) =>
        total +
        action.damage,
      0
    )

  expectEqual(
    'Action damage reconciles with total',
    summedDamage,
    result.totalDamage
  )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'TIMING'
  )
  console.log(
    '================================'
  )

  expectEqual(
    'Requested window',
    result.requestedDurationMs,
    30000
  )

  expectEqual(
    'Completed-action time',
    result.elapsedMs,
    27000
  )

  expectEqual(
    'Unused window time',
    result.remainingMs,
    3000
  )

  const allMovesInsideWindow =
    result.actions.every(
      (action) =>
        action.endTimeMs <=
        result.requestedDurationMs
    )

  expectTrue(
    'No move extends beyond simulation window',
    allMovesInsideWindow
  )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'DPS OUTPUTS'
  )
  console.log(
    '================================'
  )

  expectClose(
    'Active DPS',
    result.activeDps,
    760 / 27
  )

  expectClose(
    'Window DPS',
    result.windowDps,
    760 / 30
  )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'SIMULATION SUMMARY'
  )
  console.log(
    '================================'
  )

  console.log(
    `Fast Moves: ${result.fastMovesUsed}`
  )

  console.log(
    `Charged Moves: ${result.chargedMovesUsed}`
  )

  console.log(
    `Ending Energy: ${result.endingEnergy}`
  )

  console.log(
    `Total Damage: ${result.totalDamage}`
  )

  console.log(
    `Active DPS: ${result.activeDps.toFixed(4)}`
  )

  console.log(
    `Window DPS: ${result.windowDps.toFixed(4)}`
  )

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
      'Moveset Cycle V1 validation successful.'
    )
  } else {
    console.log(
      `❌ ${failed} test(s) failed.`
    )

    process.exitCode = 1
  }
}

main().catch(
  (error) => {
    console.error('')
    console.error(
      'Moveset Cycle test failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)