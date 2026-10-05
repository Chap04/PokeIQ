import fs from 'node:fs/promises'
import path from 'node:path'
import {
  fileURLToPath,
} from 'node:url'

import {
  MOVE_AVAILABILITY,
  evaluatePokemonRaidLoadouts,
  generateRaidMovesets,
  getPokemonRaidMovePool,
  optimizePokemonRaidMovesets,
} from '../src/engine/Raid/optimizer.js'

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

function expectTrue(
  name,
  value
) {
  if (value === true) {
    passed += 1
    console.log(`✅ ${name}`)
  } else {
    failed += 1
    console.log(`❌ ${name}`)
    console.log('   Expected: true')
    console.log(`   Actual:   ${value}`)
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
// Pokémon helpers
// --------------------------------------------------

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

function findPokemonReference({
  pokemon,
  id,
  form = 'NORMAL',
}) {
  return (
    pokemon.find(
      (entry) =>
        entry.id ===
          id &&
        entry.form ===
          form
    ) ??
    null
  )
}

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  console.log(
    'Testing PokeIQ Raid Moveset Optimizer...'
  )

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

  // ------------------------------------------------
  // Test subjects
  // ------------------------------------------------

  const rayquazaReference =
    findPokemonReference({
      pokemon,
      id:
        'RAYQUAZA',
      form:
        'NORMAL',
    })

  if (!rayquazaReference) {
    throw new Error(
      'Rayquaza reference data not found.'
    )
  }

  const rayquaza =
    withIvs(
      rayquazaReference
    )

  const dialgaReference =
    findPokemonReference({
      pokemon,
      id:
        'DIALGA',
      form:
        'NORMAL',
    })

  if (!dialgaReference) {
    throw new Error(
      'Dialga reference data not found.'
    )
  }

  const dialga =
    withIvs(
      dialgaReference
    )

  const zeraoraReference =
    findPokemonReference({
      pokemon,
      id:
        'ZERAORA',
      form:
        'NORMAL',
    })

  if (!zeraoraReference) {
    throw new Error(
      'Zeraora reference data not found.'
    )
  }

  const zeraora =
    withIvs(
      zeraoraReference
    )

  const dittoReference =
    findPokemonReference({
      pokemon,
      id:
        'DITTO',
      form:
        'NORMAL',
    })

  if (!dittoReference) {
    throw new Error(
      'Ditto reference data not found.'
    )
  }

  const ditto =
    withIvs(
      dittoReference
    )

  const cpm =
    combat
      .cpMultipliers
      .allLevels['40']

  // ------------------------------------------------
  // Move pool
  // ------------------------------------------------

  const movePool =
    getPokemonRaidMovePool(
      rayquaza
    )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'RAYQUAZA MOVE POOL'
  )
  console.log(
    '================================'
  )

  console.log('')
  console.log(
    'Fast Moves:'
  )

  for (
    const move
    of movePool.fast
  ) {
    console.log(
      `- ${move.id} [${move.availability}]`
    )
  }

  console.log('')
  console.log(
    'Charged Moves:'
  )

  for (
    const move
    of movePool.charged
  ) {
    console.log(
      `- ${move.id} [${move.availability}]`
    )
  }

  // ------------------------------------------------
  // Generate combinations
  // ------------------------------------------------

  const combinations =
    generateRaidMovesets(
      rayquaza
    )

  console.log('')
  console.log(
    `Generated Movesets: ${combinations.length}`
  )

  // ------------------------------------------------
  // Optimize
  // ------------------------------------------------

  const rankings =
    optimizePokemonRaidMovesets({
      pokemon:
        rayquaza,

      defender:
        rayquaza,

      moves,

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
    'RAYQUAZA VS RAYQUAZA'
  )
  console.log(
    '================================'
  )

  console.log('')

  for (
    const result
    of rankings
  ) {
    console.log(
      `${String(
        result.rank
      ).padStart(2)}. ` +
      `${result.fastMoveId.padEnd(20)} + ` +
      `${result.chargedMoveId.padEnd(18)} | ` +
      `${result.cycleDps
        .toFixed(6)
        .padStart(10)} DPS | ` +
      `${result.availability}`
    )
  }

  // ------------------------------------------------
  // Known result
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'KNOWN RESULT CHECK'
  )
  console.log(
    '================================'
  )

  const dragonTailOutrage =
    rankings.find(
      (result) =>
        result.fastMoveId ===
          'DRAGON_TAIL_FAST' &&
        result.chargedMoveId ===
          'OUTRAGE'
    )

  if (!dragonTailOutrage) {
    throw new Error(
      'Dragon Tail + Outrage was not generated.'
    )
  }

  console.log(
    `Dragon Tail + Outrage Rank: ${dragonTailOutrage.rank}`
  )

  console.log(
    `Dragon Tail + Outrage DPS: ${dragonTailOutrage.cycleDps.toFixed(6)}`
  )

  console.log(
    'Expected DPS: 30.097561'
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

  // ------------------------------------------------
  // Move pool tests
  // ------------------------------------------------

  expectEqual(
    'Rayquaza has 2 Fast Moves',
    movePool.fast.length,
    2
  )

  expectEqual(
    'Rayquaza has 6 Charged Moves',
    movePool.charged.length,
    6
  )

  expectTrue(
    'Air Slash is NORMAL',
    movePool.fast.some(
      (move) =>
        move.id ===
          'AIR_SLASH_FAST' &&
        move.availability ===
          'NORMAL'
    )
  )

  expectTrue(
    'Dragon Tail is NORMAL',
    movePool.fast.some(
      (move) =>
        move.id ===
          'DRAGON_TAIL_FAST' &&
        move.availability ===
          'NORMAL'
    )
  )

  expectTrue(
    'Outrage is NORMAL',
    movePool.charged.some(
      (move) =>
        move.id ===
          'OUTRAGE' &&
        move.availability ===
          'NORMAL'
    )
  )

  expectTrue(
    'Breaking Swipe is ELITE',
    movePool.charged.some(
      (move) =>
        move.id ===
          'BREAKING_SWIPE' &&
        move.availability ===
          'ELITE'
    )
  )

  expectTrue(
    'Hurricane is ELITE',
    movePool.charged.some(
      (move) =>
        move.id ===
          'HURRICANE' &&
        move.availability ===
          'ELITE'
    )
  )

  expectTrue(
    'Dragon Ascent is SPECIAL',
    movePool.charged.some(
      (move) =>
        move.id ===
          'DRAGON_ASCENT' &&
        move.availability ===
          'SPECIAL'
    )
  )

  // ------------------------------------------------
  // Combination generation tests
  // ------------------------------------------------

  expectEqual(
    'Generates 12 legal movesets',
    combinations.length,
    12
  )

  expectEqual(
    'Optimizer returns 12 rankings',
    rankings.length,
    12
  )

  const uniqueCombinations =
    new Set(
      rankings.map(
        (result) =>
          `${result.fastMoveId}|${result.chargedMoveId}`
      )
    )

  expectEqual(
    'All generated movesets are unique',
    uniqueCombinations.size,
    12
  )

  // ------------------------------------------------
  // Known performance tests
  // ------------------------------------------------

  expectClose(
    'Dragon Tail + Outrage Cycle DPS',
    dragonTailOutrage.cycleDps,
    30.097560975609756
  )

  expectEqual(
    'Dragon Tail + Outrage is NORMAL',
    dragonTailOutrage.availability,
    'NORMAL'
  )

  // ------------------------------------------------
  // Ranking tests
  // ------------------------------------------------

  const best =
    rankings[0]

  expectEqual(
    'Best Fast Move is Dragon Tail',
    best.fastMoveId,
    'DRAGON_TAIL_FAST'
  )

  expectEqual(
    'Best Charged Move is Breaking Swipe',
    best.chargedMoveId,
    'BREAKING_SWIPE'
  )

  expectEqual(
    'Best moveset is ELITE',
    best.availability,
    'ELITE'
  )

  expectClose(
    'Best moveset Cycle DPS',
    best.cycleDps,
    31.365853658536587
  )

  const bestNormal =
    rankings.find(
      (result) =>
        result.availability ===
        'NORMAL'
    )

  expectTrue(
    'A normal moveset exists',
    Boolean(bestNormal)
  )

  if (!bestNormal) {
    throw new Error(
      'No normal Rayquaza moveset was generated.'
    )
  }

  expectEqual(
    'Best normal Fast Move is Dragon Tail',
    bestNormal.fastMoveId,
    'DRAGON_TAIL_FAST'
  )

  expectEqual(
    'Best normal Charged Move is Outrage',
    bestNormal.chargedMoveId,
    'OUTRAGE'
  )

  // ------------------------------------------------
  // Sort validation
  // ------------------------------------------------

  const correctlySorted =
    rankings.every(
      (result, index) =>
        index === 0 ||
        rankings[index - 1]
          .cycleDps >=
          result.cycleDps
    )

  expectTrue(
    'Rankings are sorted by descending Cycle DPS',
    correctlySorted
  )

  const ranksSequential =
    rankings.every(
      (result, index) =>
        result.rank ===
        index + 1
    )

  expectTrue(
    'Ranks are sequential',
    ranksSequential
  )

  // ------------------------------------------------
  // Exact owned-loadout tests
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'EXACT OWNED LOADOUT TESTS'
  )
  console.log(
    '================================'
  )

  const exactRayquaza =
    evaluatePokemonRaidLoadouts({
      pokemon:
        rayquaza,

      loadouts: [
        {
          fastMoveId:
            'DRAGON_TAIL_FAST',

          chargedMoveId:
            'OUTRAGE',
        },
      ],

      defender:
        rayquaza,

      moves,

      attackerCpMultiplier:
        cpm,

      defenderCpMultiplier:
        cpm,

      combatData:
        combat,
    })

  expectEqual(
    'Exact normal loadout returns one ranking',
    exactRayquaza.length,
    1
  )

  expectEqual(
    'Exact normal loadout preserves Fast Move',
    exactRayquaza[0]?.fastMoveId,
    'DRAGON_TAIL_FAST'
  )

  expectEqual(
    'Exact normal loadout preserves Charged Move',
    exactRayquaza[0]?.chargedMoveId,
    'OUTRAGE'
  )

  expectEqual(
    'Exact normal loadout preserves NORMAL availability',
    exactRayquaza[0]?.availability,
    MOVE_AVAILABILITY.NORMAL
  )

  expectClose(
    'Exact normal loadout matches theoretical DPS',
    exactRayquaza[0]?.cycleDps,
    dragonTailOutrage.cycleDps
  )

  // ------------------------------------------------
  // Explicit owned move absent from species pool
  // ------------------------------------------------

  const frustrationInDialgaPool =
    getPokemonRaidMovePool(
      dialga
    )
      .charged
      .some(
        (move) =>
          move.id ===
          'FRUSTRATION'
      )

  expectEqual(
    'Frustration is absent from ordinary Dialga move pool',
    frustrationInDialgaPool,
    false
  )

  const exactShadowDialga =
    evaluatePokemonRaidLoadouts({
      pokemon:
        dialga,

      loadouts: [
        {
          fastMoveId:
            'DRAGON_BREATH_FAST',

          chargedMoveId:
            'FRUSTRATION',
        },
      ],

      defender:
        rayquaza,

      moves,

      attackerCpMultiplier:
        cpm,

      defenderCpMultiplier:
        cpm,

      combatData:
        combat,
    })

  expectEqual(
    'Exact out-of-pool owned loadout evaluates',
    exactShadowDialga.length,
    1
  )

  expectEqual(
    'Out-of-pool Fast Move is preserved',
    exactShadowDialga[0]?.fastMoveId,
    'DRAGON_BREATH_FAST'
  )

  expectEqual(
    'Out-of-pool Charged Move is preserved',
    exactShadowDialga[0]?.chargedMoveId,
    'FRUSTRATION'
  )

  expectEqual(
    'Out-of-pool owned move is marked OWNED',
    exactShadowDialga[0]?.availability,
    MOVE_AVAILABILITY.OWNED
  )

  expectTrue(
    'Out-of-pool owned loadout produces finite DPS',
    Number.isFinite(
      exactShadowDialga[0]?.cycleDps
    )
  )

  // ------------------------------------------------
  // Numeric move ID
  // ------------------------------------------------

  const exactNumericMove =
    evaluatePokemonRaidLoadouts({
      pokemon:
        zeraora,

      loadouts: [
        {
          fastMoveId:
            'VOLT_SWITCH_FAST',

          chargedMoveId:
            497,
        },
      ],

      defender:
        rayquaza,

      moves,

      attackerCpMultiplier:
        cpm,

      defenderCpMultiplier:
        cpm,

      combatData:
        combat,
    })

  expectEqual(
    'Numeric Charged Move ID evaluates',
    exactNumericMove.length,
    1
  )

  expectEqual(
    'Numeric Charged Move ID normalizes to string',
    exactNumericMove[0]?.chargedMoveId,
    '497'
  )

  expectTrue(
    'Numeric move loadout produces finite DPS',
    Number.isFinite(
      exactNumericMove[0]?.cycleDps
    )
  )

  // ------------------------------------------------
  // Two owned Charged Moves
  // ------------------------------------------------

  const exactTwoChargedMoves =
    evaluatePokemonRaidLoadouts({
      pokemon:
        rayquaza,

      loadouts: [
        {
          fastMoveId:
            'DRAGON_TAIL_FAST',

          chargedMoveId:
            'OUTRAGE',
        },

        {
          fastMoveId:
            'DRAGON_TAIL_FAST',

          chargedMoveId:
            'BREAKING_SWIPE',
        },
      ],

      defender:
        rayquaza,

      moves,

      attackerCpMultiplier:
        cpm,

      defenderCpMultiplier:
        cpm,

      combatData:
        combat,
    })

  expectEqual(
    'Two owned Charged Moves produce two rankings',
    exactTwoChargedMoves.length,
    2
  )

  expectTrue(
    'Two owned loadouts preserve both Charged Moves',
    (
      exactTwoChargedMoves.some(
        (result) =>
          result.chargedMoveId ===
          'OUTRAGE'
      ) &&
      exactTwoChargedMoves.some(
        (result) =>
          result.chargedMoveId ===
          'BREAKING_SWIPE'
      )
    )
  )

  expectEqual(
    'Exact owned rankings are sorted by DPS',
    exactTwoChargedMoves[0]
      ?.chargedMoveId,
    'BREAKING_SWIPE'
  )

  // ------------------------------------------------
  // Duplicate exact loadouts
  // ------------------------------------------------

  const duplicateExactLoadouts =
    evaluatePokemonRaidLoadouts({
      pokemon:
        rayquaza,

      loadouts: [
        {
          fastMoveId:
            'DRAGON_TAIL_FAST',

          chargedMoveId:
            'OUTRAGE',
        },

        {
          fastMoveId:
            'DRAGON_TAIL_FAST',

          chargedMoveId:
            'OUTRAGE',
        },
      ],

      defender:
        rayquaza,

      moves,

      attackerCpMultiplier:
        cpm,

      defenderCpMultiplier:
        cpm,

      combatData:
        combat,
    })

  expectEqual(
    'Duplicate exact loadouts are deduplicated',
    duplicateExactLoadouts.length,
    1
  )

  // ------------------------------------------------
  // Unsupported dynamic mechanic
  // ------------------------------------------------

  const exactDitto =
    evaluatePokemonRaidLoadouts({
      pokemon:
        ditto,

      loadouts: [
        {
          fastMoveId:
            'TRANSFORM_FAST',

          chargedMoveId:
            'STRUGGLE',
        },
      ],

      defender:
        rayquaza,

      moves,

      attackerCpMultiplier:
        cpm,

      defenderCpMultiplier:
        cpm,

      combatData:
        combat,
    })

  expectEqual(
    'Unsupported dynamic exact loadout remains unevaluated',
    exactDitto.length,
    0
  )

  // ------------------------------------------------
  // Theoretical optimizer remains unchanged
  // ------------------------------------------------

  const theoreticalAfterExactTests =
    optimizePokemonRaidMovesets({
      pokemon:
        rayquaza,

      defender:
        rayquaza,

      moves,

      attackerCpMultiplier:
        cpm,

      defenderCpMultiplier:
        cpm,

      combatData:
        combat,
    })

  expectEqual(
    'Theoretical optimizer still returns 12 rankings',
    theoreticalAfterExactTests.length,
    12
  )

  expectEqual(
    'Theoretical optimizer best Fast Move unchanged',
    theoreticalAfterExactTests[0]
      ?.fastMoveId,
    'DRAGON_TAIL_FAST'
  )

  expectEqual(
    'Theoretical optimizer best Charged Move unchanged',
    theoreticalAfterExactTests[0]
      ?.chargedMoveId,
    'BREAKING_SWIPE'
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
      'Moveset Optimizer exact-state validation successful.'
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
      'Raid optimizer test failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)