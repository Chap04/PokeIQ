import fs from 'node:fs/promises'
import path from 'node:path'
import {
  fileURLToPath,
} from 'node:url'

import {
  calculateMovesetPerformance,
} from '../src/engine/Raid/performance.js'

import {
  simulateMoveset,
} from '../src/engine/raid/moveset.js'


let passed = 0
let failed = 0

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
    console.log(`   Expected: ${expected}`)
    console.log(`   Actual:   ${actual}`)
  }
}

function expectClose(
  name,
  actual,
  expected,
  tolerance = 0.000001
) {
  if (
    Math.abs(actual - expected) <=
    tolerance
  ) {
    passed += 1
    console.log(`✅ ${name}`)
  } else {
    failed += 1
    console.log(`❌ ${name}`)
    console.log(`   Expected: ${expected}`)
    console.log(`   Actual:   ${actual}`)
  }
}

function expectLessThan(
  name,
  actual,
  maximum
) {
  if (actual < maximum) {
    passed += 1
    console.log(`✅ ${name}`)
  } else {
    failed += 1
    console.log(`❌ ${name}`)
    console.log(`   Expected: < ${maximum}`)
    console.log(`   Actual:   ${actual}`)
  }
}



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
    'Testing PokeIQ Raid Performance Engine...'
  )

  const [
    pokemon,
    moves,
    combat,
  ] = await Promise.all([
    readJson('pokemon.json'),
    readJson('moves-pve.json'),
    readJson('combat.json'),
  ])

  const rayquaza =
    pokemon.find(
      (entry) =>
        entry.id === 'RAYQUAZA' &&
        entry.form === 'NORMAL'
    )

  const dragonTail =
    moves.find(
      (move) =>
        move.id ===
        'DRAGON_TAIL_FAST'
    )

  const outrage =
    moves.find(
      (move) =>
        move.id ===
        'OUTRAGE'
    )

  if (
    !rayquaza ||
    !dragonTail ||
    !outrage
  ) {
    throw new Error(
      'Required Rayquaza reference data not found.'
    )
  }

  const cpm =
    combat
      .cpMultipliers
      .allLevels['40']

  const attacker = {
    ...rayquaza,

    ivs: {
      attack: 15,
      defense: 15,
      stamina: 15,
    },
  }

  const defender = {
    ...rayquaza,

    ivs: {
      attack: 15,
      defense: 15,
      stamina: 15,
    },
  }

  const result =
    calculateMovesetPerformance({
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
    })

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'RAYQUAZA — DRAGON TAIL + OUTRAGE'
  )
  console.log(
    '================================'
  )

  console.log('')
  console.log('Fast Move:')
  console.log(result.fastMove)

  console.log('')
  console.log('Charged Move:')
  console.log(result.chargedMove)

  console.log('')
  console.log(
    `Cycle DPS: ${result.cycleDps.toFixed(6)}`
  )
  const longSimulation =
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

    // 1 hour gives the discrete simulator
    // plenty of time to converge toward the
    // analytical Cycle DPS.
    durationMs:
      60 * 60 * 1000,
  })

console.log('')
console.log(
  '================================'
)
console.log(
  'LONG-RUN CONVERGENCE'
)
console.log(
  '================================'
)

console.log(
  `Simulation Time: ${longSimulation.elapsedSeconds}s`
)

console.log(
  `Fast Moves: ${longSimulation.fastMovesUsed}`
)

console.log(
  `Charged Moves: ${longSimulation.chargedMovesUsed}`
)

console.log(
  `Ending Energy: ${longSimulation.endingEnergy}`
)

console.log(
  `Total Damage: ${longSimulation.totalDamage}`
)

console.log(
  `Analytical Cycle DPS: ${result.cycleDps.toFixed(6)}`
)

console.log(
  `Discrete Active DPS: ${longSimulation.activeDps.toFixed(6)}`
)

console.log(
  `Discrete Window DPS: ${longSimulation.windowDps.toFixed(6)}`
)

const difference =
  Math.abs(
    result.cycleDps -
    longSimulation.windowDps
  )

const percentDifference =
  (
    difference /
    result.cycleDps
  ) * 100

console.log(
  `Difference: ${difference.toFixed(6)}`
)

console.log(
  `Percent Difference: ${percentDifference.toFixed(4)}%`
)

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
  'Dragon Tail damage',
  result.fastMove.damage,
  22
)

expectEqual(
  'Dragon Tail duration',
  result.fastMove.durationSeconds,
  1
)

expectEqual(
  'Dragon Tail energy gain',
  result.fastMove.energyGain,
  8
)

expectEqual(
  'Dragon Tail DPS',
  result.fastMove.dps,
  22
)

expectEqual(
  'Dragon Tail EPS',
  result.fastMove.eps,
  8
)

expectEqual(
  'Outrage damage',
  result.chargedMove.damage,
  171
)

expectEqual(
  'Outrage duration',
  result.chargedMove.durationSeconds,
  4
)

expectEqual(
  'Outrage energy cost',
  result.chargedMove.energyCost,
  50
)

expectClose(
  'Outrage DPS',
  result.chargedMove.dps,
  42.75
)

expectClose(
  'Outrage energy rate',
  result.chargedMove.eps,
  12.5
)

expectClose(
  'Analytical Cycle DPS',
  result.cycleDps,
  30.097560975609756
)

expectEqual(
  'Long simulation Fast Move count',
  longSimulation.fastMovesUsed,
  2196
)

expectEqual(
  'Long simulation Charged Move count',
  longSimulation.chargedMovesUsed,
  351
)

expectEqual(
  'Long simulation ending energy',
  longSimulation.endingEnergy,
  18
)

expectEqual(
  'Long simulation total damage',
  longSimulation.totalDamage,
  108333
)

expectClose(
  'Long simulation DPS',
  longSimulation.windowDps,
  30.0925
)

expectLessThan(
  'Analytical/discrete difference below 0.1%',
  percentDifference,
  0.1
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

console.log(`Passed: ${passed}`)
console.log(`Failed: ${failed}`)
console.log(
  `Total: ${passed + failed}`
)

console.log('')

if (failed === 0) {
  console.log(
    `🎉 ${passed}/${passed} tests passed.`
  )

  console.log(
    'Sustained DPS V1 validation successful.'
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
      'Raid performance test failed:'
    )

    console.error(error)

    process.exitCode = 1
  }
)