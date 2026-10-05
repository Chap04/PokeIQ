import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  calculateEffectiveAttack,
  calculateEffectiveDefense,
  calculateStab,
  calculateTypeEffectiveness,
  calculateDamage,
  calculatePokemonMoveDamage,
} from '../src/engine/raid/damage.js'

const __filename =
  fileURLToPath(import.meta.url)

const __dirname =
  path.dirname(__filename)

const REFERENCE_DIR =
  path.resolve(
    __dirname,
    '../src/data/reference'
  )

// --------------------------------------------------
// File helpers
// --------------------------------------------------

async function readJson(filename) {
  const contents =
    await fs.readFile(
      path.join(
        REFERENCE_DIR,
        filename
      ),
      'utf8'
    )

  return JSON.parse(contents)
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

function expectGreater(
  name,
  actual,
  comparison
) {
  if (actual > comparison) {
    pass(name)
  } else {
    fail(
      name,
      `> ${comparison}`,
      actual
    )
  }
}

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  console.log(
    'Testing PokeIQ Raid Damage Engine...'
  )

  console.log('')

  const [
    pokemon,
    moves,
    combat,
  ] = await Promise.all([
    readJson('pokemon.json'),
    readJson('moves-pve.json'),
    readJson('combat.json'),
  ])

  function getPokemon(
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

  function getMove(id) {
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

  function getCpm(level) {
    const result =
      combat.cpMultipliers
        .allLevels[
          String(level)
        ]

    if (!Number.isFinite(result)) {
      throw new Error(
        `CPM not found for Level ${level}`
      )
    }

    return result
  }

  function withIvs(
    referencePokemon,
    attack = 15,
    defense = 15,
    stamina = 15
  ) {
    return {
      ...referencePokemon,

      ivs: {
        attack,
        defense,
        stamina,
      },
    }
  }

  console.log(
    '================================'
  )

  console.log(
    'CORE STAT TESTS'
  )

  console.log(
    '================================'
  )

  // ------------------------------------------------
  // 1. Effective Attack
  // ------------------------------------------------

  const rayquaza =
    getPokemon(
      'RAYQUAZA'
    )

  const level40Cpm =
    getCpm(40)

  const effectiveAttack =
    calculateEffectiveAttack({
      baseAttack: 284,
      attackIv: 15,
      cpMultiplier:
        level40Cpm,
    })

  expectClose(
    'Effective Attack calculation',
    effectiveAttack,
    236.2997
  )

  // ------------------------------------------------
  // 2. Effective Defense
  // ------------------------------------------------

  const effectiveDefense =
    calculateEffectiveDefense({
      baseDefense: 170,
      defenseIv: 15,
      cpMultiplier:
        level40Cpm,
    })

  expectClose(
    'Effective Defense calculation',
    effectiveDefense,
    146.2055
  )

  console.log('')
  console.log(
    '================================'
  )

  console.log(
    'STAB TESTS'
  )

  console.log(
    '================================'
  )

  // ------------------------------------------------
  // 3. STAB
  // ------------------------------------------------

  const dragonStab =
    calculateStab({
      moveType: 'DRAGON',

      attackerTypes: [
        'DRAGON',
        'FLYING',
      ],

      stabMultiplier:
        combat.modifiers.stab,
    })

  expectEqual(
    'STAB applies',
    dragonStab,
    1.2
  )

  // ------------------------------------------------
  // 4. No STAB
  // ------------------------------------------------

  const rockStab =
    calculateStab({
      moveType: 'ROCK',

      attackerTypes: [
        'DRAGON',
        'FLYING',
      ],

      stabMultiplier:
        combat.modifiers.stab,
    })

  expectEqual(
    'No STAB',
    rockStab,
    1
  )

  console.log('')
  console.log(
    '================================'
  )

  console.log(
    'TYPE EFFECTIVENESS TESTS'
  )

  console.log(
    '================================'
  )

  // ------------------------------------------------
  // 5. Single weakness
  // ------------------------------------------------

  const dragonVsDragon =
    calculateTypeEffectiveness({
      moveType: 'DRAGON',

      defenderTypes: [
        'DRAGON',
      ],

      typeEffectiveness:
        combat.typeEffectiveness,
    })

  expectEqual(
    'Single weakness',
    dragonVsDragon,
    1.6
  )

  // ------------------------------------------------
  // 6. Double weakness
  // ------------------------------------------------

  const rockVsFireFlying =
    calculateTypeEffectiveness({
      moveType: 'ROCK',

      defenderTypes: [
        'FIRE',
        'FLYING',
      ],

      typeEffectiveness:
        combat.typeEffectiveness,
    })

  expectClose(
    'Double weakness',
    rockVsFireFlying,
    2.56
  )

  // ------------------------------------------------
  // 7. Resistance
  // ------------------------------------------------

  const dragonVsSteel =
    calculateTypeEffectiveness({
      moveType: 'DRAGON',

      defenderTypes: [
        'STEEL',
      ],

      typeEffectiveness:
        combat.typeEffectiveness,
    })

  expectEqual(
    'Resistance',
    dragonVsSteel,
    0.625
  )

  // ------------------------------------------------
  // 8. GO immunity-equivalent
  // ------------------------------------------------

  const dragonVsFairy =
    calculateTypeEffectiveness({
      moveType: 'DRAGON',

      defenderTypes: [
        'FAIRY',
      ],

      typeEffectiveness:
        combat.typeEffectiveness,
    })

  expectEqual(
    'GO immunity-equivalent resistance',
    dragonVsFairy,
    0.390625
  )

  console.log('')
  console.log(
    '================================'
  )

  console.log(
    'DAMAGE TESTS'
  )

  console.log(
    '================================'
  )

  const dragonTail =
    getMove(
      'DRAGON_TAIL_FAST'
    )

  const attacker =
    withIvs(rayquaza)

  const defender =
    withIvs(rayquaza)

  // ------------------------------------------------
  // 9. Full Rayquaza damage calculation
  // ------------------------------------------------

  const normalResult =
    calculatePokemonMoveDamage({
      attacker,
      defender,

      move:
        dragonTail,

      attackerCpMultiplier:
        level40Cpm,

      defenderCpMultiplier:
        level40Cpm,

      combatData:
        combat,
    })

  expectEqual(
    'Rayquaza Dragon Tail damage',
    normalResult.damage,
    22
  )

  // ------------------------------------------------
  // 10. Shadow Attack
  // ------------------------------------------------

  const shadowResult =
    calculatePokemonMoveDamage({
      attacker,
      defender,

      move:
        dragonTail,

      attackerCpMultiplier:
        level40Cpm,

      defenderCpMultiplier:
        level40Cpm,

      combatData:
        combat,

      attackerModifiers: [
        combat.modifiers
          .shadowAttack,
      ],
    })

  expectGreater(
    'Shadow Attack increases damage',
    shadowResult.damage,
    normalResult.damage
  )

  // Also verify the actual expected
  // breakpoint for this test case.

  expectEqual(
    'Shadow Dragon Tail damage',
    shadowResult.damage,
    27
  )

  // ------------------------------------------------
  // 11. Attack IV scaling
  // ------------------------------------------------

  const zeroAttackIv =
    calculateEffectiveAttack({
      baseAttack:
        rayquaza.stats.attack,

      attackIv: 0,

      cpMultiplier:
        level40Cpm,
    })

  const fifteenAttackIv =
    calculateEffectiveAttack({
      baseAttack:
        rayquaza.stats.attack,

      attackIv: 15,

      cpMultiplier:
        level40Cpm,
    })

  expectGreater(
    'Attack IV increases effective Attack',
    fifteenAttackIv,
    zeroAttackIv
  )

  // ------------------------------------------------
  // 12. Level scaling
  // ------------------------------------------------

  const level20Cpm =
    getCpm(20)

  const level20Attack =
    calculateEffectiveAttack({
      baseAttack:
        rayquaza.stats.attack,

      attackIv: 15,

      cpMultiplier:
        level20Cpm,
    })

  const level40Attack =
    calculateEffectiveAttack({
      baseAttack:
        rayquaza.stats.attack,

      attackIv: 15,

      cpMultiplier:
        level40Cpm,
    })

  expectGreater(
    'Higher level increases effective Attack',
    level40Attack,
    level20Attack
  )

  // ------------------------------------------------
  // 13. Direct damage formula
  // ------------------------------------------------

  const directDamage =
    calculateDamage({
      movePower: 14,

      attackerAttack:
        effectiveAttack,

      defenderDefense:
        effectiveDefense,

      stab: 1.2,

      effectiveness: 1.6,
    })

  expectEqual(
    'Direct damage formula',
    directDamage,
    22
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
      'Raid damage engine validation successful.'
    )
  } else {
    console.log(
      `❌ ${failed} test(s) failed.`
    )

    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error('')
  console.error(
    'Raid damage test failed:'
  )

  console.error(error)

  process.exitCode = 1
})