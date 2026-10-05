import fs from 'node:fs/promises'
import path from 'node:path'
import {
  fileURLToPath,
} from 'node:url'

import {
  resolveTemporaryEvolution,
} from '../src/engine/pokemon/transform.js'

import {
  createRaidBoss,
} from '../src/engine/raid/boss.js'

import {
  optimizePokemonRaidMovesets,
} from '../src/engine/raid/optimizer.js'

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
    console.log(
      '   Expected: true'
    )
    console.log(
      `   Actual:   ${value}`
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

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  console.log(
    'Testing PokeIQ External Validation V1...'
  )

  const [
    pokemon,
    moves,
    combat,
    raidProfiles,
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

    readJson(
      'raid-profiles.json'
    ),
  ])

  // ------------------------------------------------
  // Resolve Mega Rayquaza attacker
  // ------------------------------------------------

  const baseRayquaza =
    pokemon.find(
      (entry) =>
        entry.id ===
          'RAYQUAZA' &&
        entry.form ===
          'NORMAL'
    )

  if (!baseRayquaza) {
    throw new Error(
      'Base Rayquaza not found.'
    )
  }

  const megaRayquazaReference =
    resolveTemporaryEvolution(
      baseRayquaza,
      'TEMP_EVOLUTION_MEGA'
    )

  const megaRayquazaAttacker =
    withIvs(
      megaRayquazaReference
    )

  const attackerCpm =
    combat
      .cpMultipliers
      .allLevels['40']

  if (
    !Number.isFinite(
      attackerCpm
    )
  ) {
    throw new Error(
      'Level 40 attacker CPM not found.'
    )
  }

  // ------------------------------------------------
  // Create actual Mega raid boss
  // ------------------------------------------------

  const megaRaidProfile =
    raidProfiles.MEGA

  if (!megaRaidProfile) {
    throw new Error(
      'Mega raid profile not found.'
    )
  }

  const megaRayquazaBoss =
    createRaidBoss({
      pokemon:
        megaRayquazaReference,

      raidProfile:
        megaRaidProfile,
    })

  const defenderCpm =
    megaRayquazaBoss
      .raidBoss
      .cpMultiplier

  // ------------------------------------------------
  // Boss setup output
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'MEGA RAYQUAZA RAID BOSS'
  )
  console.log(
    '================================'
  )

  console.log(
    `Raid HP: ${megaRayquazaBoss.raidBoss.hp}`
  )

  console.log(
    `Raid CPM: ${megaRayquazaBoss.raidBoss.cpMultiplier}`
  )

  console.log(
    `Timer: ${megaRayquazaBoss.raidBoss.timerSeconds}s`
  )

  console.log(
    `Effective Attack: ${megaRayquazaBoss.raidBoss.effectiveAttack}`
  )

  console.log(
    `Effective Defense: ${megaRayquazaBoss.raidBoss.effectiveDefense}`
  )

  // ------------------------------------------------
  // Optimize attacker movesets against actual boss
  // ------------------------------------------------

  const rankings =
    optimizePokemonRaidMovesets({
      pokemon:
        megaRayquazaAttacker,

      defender:
        megaRayquazaBoss,

      moves,

      attackerCpMultiplier:
        attackerCpm,

      defenderCpMultiplier:
        defenderCpm,

      combatData:
        combat,
    })

  // ------------------------------------------------
  // Display ranking
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'MEGA RAYQUAZA VS MEGA RAID BOSS'
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
  // Important combinations
  // ------------------------------------------------

  const best =
    rankings[0]

  const dragonTailBreakingSwipe =
    rankings.find(
      (result) =>
        result.fastMoveId ===
          'DRAGON_TAIL_FAST' &&
        result.chargedMoveId ===
          'BREAKING_SWIPE'
    )

  const dragonTailOutrage =
    rankings.find(
      (result) =>
        result.fastMoveId ===
          'DRAGON_TAIL_FAST' &&
        result.chargedMoveId ===
          'OUTRAGE'
    )

  const dragonTailDragonAscent =
    rankings.find(
      (result) =>
        result.fastMoveId ===
          'DRAGON_TAIL_FAST' &&
        result.chargedMoveId ===
          'DRAGON_ASCENT'
    )

  if (
    !dragonTailBreakingSwipe ||
    !dragonTailOutrage ||
    !dragonTailDragonAscent
  ) {
    throw new Error(
      'Required Mega Rayquaza movesets were not generated.'
    )
  }

  // ------------------------------------------------
  // Raid boss validation
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'RAID BOSS VALIDATION'
  )
  console.log(
    '================================'
  )

  expectEqual(
    'Boss profile is MEGA',
    megaRayquazaBoss
      .raidBoss
      .profileId,
    'MEGA'
  )

  expectEqual(
    'Boss HP is 9000',
    megaRayquazaBoss
      .raidBoss
      .hp,
    9000
  )

  expectEqual(
    'Boss timer is 300 seconds',
    megaRayquazaBoss
      .raidBoss
      .timerSeconds,
    300
  )

  expectEqual(
    'Boss CPM is 0.79',
    megaRayquazaBoss
      .raidBoss
      .cpMultiplier,
    0.79
  )

  expectClose(
    'Boss effective Attack',
    megaRayquazaBoss
      .raidBoss
      .effectiveAttack,
    309.68
  )

  expectClose(
    'Boss effective Defense',
    megaRayquazaBoss
      .raidBoss
      .effectiveDefense,
    177.75
  )

  // ------------------------------------------------
  // External validation
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'EXTERNAL VALIDATION'
  )
  console.log(
    '================================'
  )

  expectEqual(
    'Mega Rayquaza attacker Attack is 377',
    megaRayquazaAttacker
      .stats
      .attack,
    377
  )

  expectEqual(
    'Mega Rayquaza attacker Defense is 210',
    megaRayquazaAttacker
      .stats
      .defense,
    210
  )

  expectEqual(
    'Mega Rayquaza attacker Stamina is 227',
    megaRayquazaAttacker
      .stats
      .stamina,
    227
  )

  expectEqual(
    'Mega Rayquaza primary type is Dragon',
    megaRayquazaAttacker
      .types[0],
    'DRAGON'
  )

  expectEqual(
    'Mega Rayquaza secondary type is Flying',
    megaRayquazaAttacker
      .types[1],
    'FLYING'
  )

  expectEqual(
    'Optimizer returns all 12 Rayquaza movesets',
    rankings.length,
    12
  )

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
    'Best moveset is Elite',
    best.availability,
    'ELITE'
  )

  expectTrue(
    'Dragon Tail + Breaking Swipe exists',
    Boolean(
      dragonTailBreakingSwipe
    )
  )

  expectTrue(
    'Dragon Tail + Outrage exists',
    Boolean(
      dragonTailOutrage
    )
  )

  expectTrue(
    'Dragon Tail + Dragon Ascent exists',
    Boolean(
      dragonTailDragonAscent
    )
  )

  expectTrue(
    'Breaking Swipe beats Outrage in this matchup',
    dragonTailBreakingSwipe
      .cycleDps >
      dragonTailOutrage
        .cycleDps
  )

  expectTrue(
    'Outrage beats Dragon Ascent in this matchup',
    dragonTailOutrage
      .cycleDps >
      dragonTailDragonAscent
        .cycleDps
  )

  expectEqual(
    'Breaking Swipe is Elite',
    dragonTailBreakingSwipe
      .availability,
    'ELITE'
  )

  expectEqual(
    'Outrage is Normal',
    dragonTailOutrage
      .availability,
    'NORMAL'
  )

  expectEqual(
    'Dragon Ascent is Special',
    dragonTailDragonAscent
      .availability,
    'SPECIAL'
  )

  // ------------------------------------------------
  // Summary
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'VALIDATION SUMMARY'
  )
  console.log(
    '================================'
  )

  console.log(
    `Boss HP: ${megaRayquazaBoss.raidBoss.hp}`
  )

  console.log(
    `Boss CPM: ${megaRayquazaBoss.raidBoss.cpMultiplier}`
  )

  console.log(
    `Best Overall: ${best.fastMoveId} + ${best.chargedMoveId}`
  )

  console.log(
    `Best DPS: ${best.cycleDps.toFixed(6)}`
  )

  console.log(
    `Breaking Swipe DPS: ${dragonTailBreakingSwipe.cycleDps.toFixed(6)}`
  )

  console.log(
    `Outrage DPS: ${dragonTailOutrage.cycleDps.toFixed(6)}`
  )

  console.log(
    `Dragon Ascent DPS: ${dragonTailDragonAscent.cycleDps.toFixed(6)}`
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
      'External Validation V1 with Raid Boss Model successful.'
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
      'External validation failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)