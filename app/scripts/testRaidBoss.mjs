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
  calculateRaidBossAttack,
  calculateRaidBossDefense,
  RAID_BOSS_ATTACK_IV,
  RAID_BOSS_DEFENSE_IV,
} from '../src/engine/Raid/boss.js'

// --------------------------------------------------
// Test state
// --------------------------------------------------

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
    'Testing PokeIQ Raid Boss Model...'
  )

  const [
    pokemon,
    raidProfiles,
  ] = await Promise.all([
    readJson(
      'pokemon.json'
    ),

    readJson(
      'raid-profiles.json'
    ),
  ])

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
      'Rayquaza not found.'
    )
  }

  const megaRayquaza =
    resolveTemporaryEvolution(
      rayquaza,
      'TEMP_EVOLUTION_MEGA'
    )

  const megaProfile =
    raidProfiles.MEGA

  if (!megaProfile) {
    throw new Error(
      'Mega raid profile not found.'
    )
  }

  const boss =
    createRaidBoss({
      pokemon:
        megaRayquaza,

      raidProfile:
        megaProfile,
    })

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
    `Base Attack: ${boss.stats.attack}`
  )

  console.log(
    `Base Defense: ${boss.stats.defense}`
  )

  console.log(
    `Base Stamina: ${boss.stats.stamina}`
  )

  console.log(
    `Raid HP: ${boss.raidBoss.hp}`
  )

  console.log(
    `Raid CPM: ${boss.raidBoss.cpMultiplier}`
  )

  console.log(
    `Timer: ${boss.raidBoss.timerSeconds}s`
  )

  console.log(
    `Effective Attack: ${boss.raidBoss.effectiveAttack}`
  )

  console.log(
    `Effective Defense: ${boss.raidBoss.effectiveDefense}`
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
    'Raid Boss Attack IV',
    RAID_BOSS_ATTACK_IV,
    15
  )

  expectEqual(
    'Raid Boss Defense IV',
    RAID_BOSS_DEFENSE_IV,
    15
  )

  expectEqual(
    'Mega profile HP',
    megaProfile.bossHp,
    9000
  )

  expectEqual(
    'Mega profile CPM',
    megaProfile.cpMultiplier,
    0.79
  )

  expectEqual(
    'Mega profile timer',
    megaProfile.timerSeconds,
    300
  )

  expectEqual(
    'Boss HP is 9000',
    boss.raidBoss.hp,
    9000
  )

  expectEqual(
    'Boss max HP is 9000',
    boss.raidBoss.maxHp,
    9000
  )

  expectEqual(
    'Boss timer is 300 seconds',
    boss.raidBoss.timerSeconds,
    300
  )

  expectEqual(
    'Mega Rayquaza base Attack remains 377',
    boss.stats.attack,
    377
  )

  expectEqual(
    'Mega Rayquaza base Defense remains 210',
    boss.stats.defense,
    210
  )

  expectClose(
    'Mega Rayquaza effective Attack',
    boss.raidBoss.effectiveAttack,
    (377 + 15) * 0.79
  )

  expectClose(
    'Mega Rayquaza effective Defense',
    boss.raidBoss.effectiveDefense,
    (210 + 15) * 0.79
  )

  expectClose(
    'Direct Attack helper agrees',
    calculateRaidBossAttack({
      baseAttack: 377,
      cpMultiplier: 0.79,
    }),
    boss.raidBoss.effectiveAttack
  )

  expectClose(
    'Direct Defense helper agrees',
    calculateRaidBossDefense({
      baseDefense: 210,
      cpMultiplier: 0.79,
    }),
    boss.raidBoss.effectiveDefense
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
      'Raid Boss Model V1 validation successful.'
    )
  } else {
    process.exitCode = 1
  }
}

main().catch(
  (error) => {
    console.error('')
    console.error(
      'Raid Boss Model test failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)