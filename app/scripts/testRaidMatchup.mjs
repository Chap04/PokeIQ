import fs from 'node:fs/promises'
import path from 'node:path'

import {
  fileURLToPath,
} from 'node:url'

import {
  evaluateOwnedRaidMatchup,
  RAID_MATCHUP_STATUS,
} from '../src/utils/raidMatchup.js'

// --------------------------------------------------
// Test helpers
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

function expectDifferent(
  name,
  first,
  second
) {
  if (first !== second) {
    passed += 1
    console.log(`✅ ${name}`)
  } else {
    failed += 1
    console.log(`❌ ${name}`)
    console.log(
      `   Expected different values, both were: ${first}`
    )
  }
}

// --------------------------------------------------
// Reference data
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
  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'RAID MATCHUP VALIDATION'
  )
  console.log(
    '================================'
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

  const attackerCpm =
    combat
      .cpMultipliers
      .allLevels['40']

  // ----------------------------------------------
  // Exact owned attacker fixture
  // ----------------------------------------------

  const candidate = {
    status:
      'READY',

    pokemonIdentity:
      'RAYQUAZA__NORMAL',

    reference:
      rayquaza,

    level:
      40,

    cpm:
      attackerCpm,

    ivs: {
      attack: 15,
      defense: 15,
      stamina: 15,
    },

    stats:
      null,

    traits: {
      shadow: false,
      purified: false,
      lucky: false,
      shiny: false,
    },

    moves: {
      fast:
        'DRAGON_TAIL_FAST',

      charged: [
        'OUTRAGE',
        'BREAKING_SWIPE',
      ],
    },

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
  }

  // ----------------------------------------------
  // Raid defender fixture
  // ----------------------------------------------

  const defender = {
    ...rayquaza,

    ivs: {
      attack: 15,
      defense: 15,
      stamina: 15,
    },

    raidBoss: {
      cpMultiplier:
        0.79,
    },
  }

  // ----------------------------------------------
  // Test 1
  // Valid candidate + defender
  // ----------------------------------------------

  const outrageResult =
    evaluateOwnedRaidMatchup({
      candidate,

      loadout:
        candidate.loadouts[0],

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Valid attacker + defender succeeds',
    outrageResult.status,
    RAID_MATCHUP_STATUS.SUCCESS
  )

  expectTrue(
    'Successful result contains Cycle DPS',
    Number.isFinite(
      outrageResult
        ?.performance
        ?.cycleDps
    )
  )

  // ----------------------------------------------
  // Test 2
  // Exact selected loadout is preserved
  // ----------------------------------------------

  expectEqual(
    'Exact Fast Move is preserved',
    outrageResult
      ?.loadout
      ?.fastMoveId,
    'DRAGON_TAIL_FAST'
  )

  expectEqual(
    'Exact Charged Move is preserved',
    outrageResult
      ?.loadout
      ?.chargedMoveId,
    'OUTRAGE'
  )

  // ----------------------------------------------
  // Test 3
  // Second current Charged Move is evaluated
  // independently
  // ----------------------------------------------

  const breakingSwipeResult =
    evaluateOwnedRaidMatchup({
      candidate,

      loadout:
        candidate.loadouts[1],

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Second Charged Move loadout succeeds',
    breakingSwipeResult.status,
    RAID_MATCHUP_STATUS.SUCCESS
  )

  expectEqual(
    'Second Charged Move remains separate',
    breakingSwipeResult
      ?.loadout
      ?.chargedMoveId,
    'BREAKING_SWIPE'
  )

  if (
    outrageResult.status ===
      RAID_MATCHUP_STATUS.SUCCESS &&
    breakingSwipeResult.status ===
      RAID_MATCHUP_STATUS.SUCCESS
  ) {
    expectDifferent(
      'Two Charged Move loadouts are independently evaluated',
      outrageResult.performance.cycleDps,
      breakingSwipeResult.performance.cycleDps
    )
  }

  // ----------------------------------------------
  // Test 4
  // Invalid candidate
  // ----------------------------------------------

  const invalidCandidateResult =
    evaluateOwnedRaidMatchup({
      candidate: {
        ...candidate,
        status:
          'INCOMPLETE',
      },

      loadout:
        candidate.loadouts[0],

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Invalid candidate is rejected',
    invalidCandidateResult.status,
    RAID_MATCHUP_STATUS.INVALID_CANDIDATE
  )

  // ----------------------------------------------
  // Test 5
  // Invalid loadout
  // ----------------------------------------------

  const invalidLoadoutResult =
    evaluateOwnedRaidMatchup({
      candidate,

      loadout: {
        fastMoveId:
          'DRAGON_TAIL_FAST',

        chargedMoveId:
          'HYPER_BEAM',
      },

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Loadout not owned by candidate is rejected',
    invalidLoadoutResult.status,
    RAID_MATCHUP_STATUS.INVALID_LOADOUT
  )

  // ----------------------------------------------
  // Test 6
  // Missing defender
  // ----------------------------------------------

  const missingDefenderResult =
    evaluateOwnedRaidMatchup({
      candidate,

      loadout:
        candidate.loadouts[0],

      defender:
        null,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Missing defender is rejected',
    missingDefenderResult.status,
    RAID_MATCHUP_STATUS.INVALID_DEFENDER
  )

  // ----------------------------------------------
  // Test 7
  // Invalid defender
  // ----------------------------------------------

  const invalidDefenderResult =
    evaluateOwnedRaidMatchup({
      candidate,

      loadout:
        candidate.loadouts[0],

      defender: {
        ...rayquaza,
      },

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Defender without Raid CPM is rejected',
    invalidDefenderResult.status,
    RAID_MATCHUP_STATUS.INVALID_DEFENDER
  )

  // ----------------------------------------------
  // Test 8
  // Shadow Attack modifier reaches combat engine
  // ----------------------------------------------

  const shadowCandidate = {
    ...candidate,

    traits: {
      ...candidate.traits,
      shadow: true,
    },
  }

  const shadowResult =
    evaluateOwnedRaidMatchup({
      candidate:
        shadowCandidate,

      loadout:
        shadowCandidate.loadouts[0],

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Shadow attacker succeeds',
    shadowResult.status,
    RAID_MATCHUP_STATUS.SUCCESS
  )

  expectTrue(
    'Shadow Fast Move damage is increased',
    shadowResult
      ?.performance
      ?.fastMove
      ?.damage >
    outrageResult
      ?.performance
      ?.fastMove
      ?.damage
  )

  expectTrue(
    'Shadow Charged Move damage is increased',
    shadowResult
      ?.performance
      ?.chargedMove
      ?.damage >
    outrageResult
      ?.performance
      ?.chargedMove
      ?.damage
  )

  expectTrue(
    'Shadow Cycle DPS is increased',
    shadowResult
      ?.performance
      ?.cycleDps >
    outrageResult
      ?.performance
      ?.cycleDps
  )

  // ----------------------------------------------
  // Results
  // ----------------------------------------------

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
      'Raid matchup test failed:'
    )

    console.error(error)

    process.exitCode = 1
  }
)