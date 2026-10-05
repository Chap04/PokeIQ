import fs from 'node:fs/promises'
import path from 'node:path'

import {
  fileURLToPath,
} from 'node:url'

import {
  compareRaidPossibleStateToCurrent,
  compareRaidPossibleStatesToCurrent,
  RAID_STATE_COMPARISON_STATUS,
} from '../src/utils/raidStateComparison.js'

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
    console.log(
      `PASS - ${name}`
    )
  } else {
    failed += 1
    console.log(
      `FAIL - ${name}`
    )

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
    console.log(
      `PASS - ${name}`
    )
  } else {
    failed += 1
    console.log(
      `FAIL - ${name}`
    )

    console.log(
      '   Expected: true'
    )

    console.log(
      `   Actual:   ${value}`
    )
  }
}

function expectClose(
  name,
  actual,
  expected,
  tolerance = 0.000001
) {
  const difference =
    Math.abs(
      actual -
      expected
    )

  if (
    Number.isFinite(
      actual
    ) &&
    difference <=
      tolerance
  ) {
    passed += 1
    console.log(
      `PASS - ${name}`
    )
  } else {
    failed += 1
    console.log(
      `FAIL - ${name}`
    )

    console.log(
      `   Expected: ${expected}`
    )

    console.log(
      `   Actual:   ${actual}`
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
    'RAID STATE COMPARISON VALIDATION'
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

  // ------------------------------------------------
  // Candidate
  // ------------------------------------------------

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
      attack:
        15,

      defense:
        15,

      stamina:
        15,
    },

    stats:
      null,

    traits: {
      shadow:
        false,

      purified:
        false,

      lucky:
        false,

      shiny:
        false,
    },

    moves: {
      fast:
        'AIR_SLASH_FAST',

      charged: [
        'ANCIENT_POWER',
      ],

      chargedSlots: {
        slot1:
          'ANCIENT_POWER',

        slot2:
          null,
      },
    },

    loadouts: [
      {
        fastMoveId:
          'AIR_SLASH_FAST',

        chargedMoveId:
          'ANCIENT_POWER',
      },
    ],
  }

  // ------------------------------------------------
  // Defender
  // ------------------------------------------------

  const defender = {
    ...rayquaza,

    ivs: {
      attack:
        15,

      defense:
        15,

      stamina:
        15,
    },

    raidBoss: {
      cpMultiplier:
        0.79,
    },
  }

  // ------------------------------------------------
  // Current state
  // ------------------------------------------------

  const currentState = {
    type:
      'CURRENT',

    current:
      true,

    reachable:
      true,

    pokemonIdentity:
      'RAYQUAZA__NORMAL',

    moves: {
      fastMoveId:
        'AIR_SLASH_FAST',

      chargedMove1Id:
        'ANCIENT_POWER',

      chargedMove2Id:
        null,
    },

    loadouts: [
      {
        fastMoveId:
          'AIR_SLASH_FAST',

        chargedMoveId:
          'ANCIENT_POWER',
      },
    ],

    action: {
      type:
        'NONE',
    },

    preservation: {
      destroysProtectedMove:
        false,
    },
  }

  // ------------------------------------------------
  // Possible state: Dragon Tail + Outrage
  // ------------------------------------------------

  const strongerState = {
    type:
      'MOVESET_CHANGE',

    current:
      false,

    reachable:
      true,

    pokemonIdentity:
      'RAYQUAZA__NORMAL',

    moves: {
      fastMoveId:
        'DRAGON_TAIL_FAST',

      chargedMove1Id:
        'OUTRAGE',

      chargedMove2Id:
        null,
    },

    loadouts: [
      {
        fastMoveId:
          'DRAGON_TAIL_FAST',

        chargedMoveId:
          'OUTRAGE',
      },
    ],

    action: {
      type:
        'FAST_AND_CHARGED_TM',
    },

    changes: {
      fastMoveChanged:
        true,

      chargedMove1Changed:
        true,
    },

    preservation: {
      replacesExistingMove:
        true,

      destroysProtectedMove:
        false,
    },
  }

  // ------------------------------------------------
  // Possible state: intentionally weaker
  // ------------------------------------------------

  const weakerState = {
    type:
      'CHARGED_MOVE_CHANGE',

    current:
      false,

    reachable:
      true,

    pokemonIdentity:
      'RAYQUAZA__NORMAL',

    moves: {
      fastMoveId:
        'AIR_SLASH_FAST',

      chargedMove1Id:
        'AERIAL_ACE',

      chargedMove2Id:
        null,
    },

    loadouts: [
      {
        fastMoveId:
          'AIR_SLASH_FAST',

        chargedMoveId:
          'AERIAL_ACE',
      },
    ],

    action: {
      type:
        'CHARGED_TM',
    },

    preservation: {
      destroysProtectedMove:
        false,
    },
  }

  // ------------------------------------------------
  // Possible state: unreachable / protected
  // ------------------------------------------------

  const protectedState = {
    ...strongerState,

    type:
      'SPECIAL_MOVE_CHANGE',

    reachable:
      false,

    action: {
      type:
        'SPECIAL_ACQUISITION',
    },

    preservation: {
      replacesExistingMove:
        true,

      destroysProtectedMove:
        true,
    },
  }

  // ------------------------------------------------
  // Test 1
  // Successful comparison
  // ------------------------------------------------

  const comparison =
    compareRaidPossibleStateToCurrent({
      candidate,

      currentState,

      possibleState:
        strongerState,

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Valid current vs possible comparison succeeds',
    comparison.status,
    RAID_STATE_COMPARISON_STATUS
      .SUCCESS
  )

  // ------------------------------------------------
  // Test 2
  // Current DPS exists
  // ------------------------------------------------

  expectTrue(
    'Current Cycle DPS is finite',
    Number.isFinite(
      comparison
        ?.performanceChange
        ?.currentCycleDps
    )
  )

  // ------------------------------------------------
  // Test 3
  // Possible DPS exists
  // ------------------------------------------------

  expectTrue(
    'Possible Cycle DPS is finite',
    Number.isFinite(
      comparison
        ?.performanceChange
        ?.possibleCycleDps
    )
  )

  // ------------------------------------------------
  // Test 4
  // Absolute gain calculation
  // ------------------------------------------------

  const expectedAbsoluteGain =
    comparison
      .performanceChange
      .possibleCycleDps -
    comparison
      .performanceChange
      .currentCycleDps

  expectClose(
    'Absolute gain is calculated correctly',
    comparison
      .performanceChange
      .absoluteGain,
    expectedAbsoluteGain
  )

  // ------------------------------------------------
  // Test 5
  // Percent gain calculation
  // ------------------------------------------------

  const expectedPercentGain =
    (
      expectedAbsoluteGain /
      comparison
        .performanceChange
        .currentCycleDps
    ) * 100

  expectClose(
    'Percent gain is calculated correctly',
    comparison
      .performanceChange
      .percentGain,
    expectedPercentGain
  )

  // ------------------------------------------------
  // Test 6
  // Multiplier calculation
  // ------------------------------------------------

  const expectedMultiplier =
    comparison
      .performanceChange
      .possibleCycleDps /
    comparison
      .performanceChange
      .currentCycleDps

  expectClose(
    'Performance multiplier is calculated correctly',
    comparison
      .performanceChange
      .performanceMultiplier,
    expectedMultiplier
  )

  // ------------------------------------------------
  // Test 7
  // Stronger state improves performance
  // ------------------------------------------------

  expectEqual(
    'Stronger state is marked as an improvement',
    comparison
      .performanceChange
      .improvesPerformance,
    true
  )

  // ------------------------------------------------
  // Test 8
  // Exact possible loadout survives comparison
  // ------------------------------------------------

  expectEqual(
    'Possible best Fast Move is preserved',
    comparison
      ?.possibleBestLoadout
      ?.fastMoveId,
    'DRAGON_TAIL_FAST'
  )

  expectEqual(
    'Possible best Charged Move is preserved',
    comparison
      ?.possibleBestLoadout
      ?.chargedMoveId,
    'OUTRAGE'
  )

  // ------------------------------------------------
  // Test 9
  // Reachability metadata
  // ------------------------------------------------

  expectEqual(
    'Reachability metadata is preserved',
    comparison.reachable,
    true
  )

  // ------------------------------------------------
  // Test 10
  // Action metadata
  // ------------------------------------------------

  expectEqual(
    'Action metadata is preserved',
    comparison
      ?.action
      ?.type,
    'FAST_AND_CHARGED_TM'
  )

  // ------------------------------------------------
  // Test 11
  // Preservation metadata
  // ------------------------------------------------

  expectEqual(
    'Protected-move destruction flag is preserved',
    comparison
      .destroysProtectedMove,
    false
  )

  // ------------------------------------------------
  // Test 12
  // Weaker state
  // ------------------------------------------------

  const weakerComparison =
    compareRaidPossibleStateToCurrent({
      candidate,

      currentState,

      possibleState:
        weakerState,

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Weaker state comparison succeeds',
    weakerComparison.status,
    RAID_STATE_COMPARISON_STATUS
      .SUCCESS
  )

  expectEqual(
    'Weaker state is marked as reducing performance',
    weakerComparison
      .performanceChange
      .reducesPerformance,
    true
  )

  // ------------------------------------------------
  // Test 13
  // Unreachable state still compares
  // ------------------------------------------------

  const protectedComparison =
    compareRaidPossibleStateToCurrent({
      candidate,

      currentState,

      possibleState:
        protectedState,

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Unreachable state can still be compared',
    protectedComparison.status,
    RAID_STATE_COMPARISON_STATUS
      .SUCCESS
  )

  expectEqual(
    'Unreachable state remains unreachable',
    protectedComparison.reachable,
    false
  )

  expectEqual(
    'Protected move destruction survives comparison',
    protectedComparison
      .destroysProtectedMove,
    true
  )

  // ------------------------------------------------
  // Test 14
  // Invalid candidate
  // ------------------------------------------------

  const invalidCandidate =
    compareRaidPossibleStateToCurrent({
      candidate: {
        ...candidate,

        status:
          'INCOMPLETE',
      },

      currentState,

      possibleState:
        strongerState,

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Invalid candidate is rejected',
    invalidCandidate.status,
    RAID_STATE_COMPARISON_STATUS
      .INVALID_CANDIDATE
  )

  // ------------------------------------------------
  // Test 15
  // Invalid current state
  // ------------------------------------------------

  const invalidCurrent =
    compareRaidPossibleStateToCurrent({
      candidate,

      currentState: {
        ...currentState,

        current:
          false,
      },

      possibleState:
        strongerState,

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Non-current baseline is rejected',
    invalidCurrent.status,
    RAID_STATE_COMPARISON_STATUS
      .INVALID_CURRENT_STATE
  )

  // ------------------------------------------------
  // Test 16
  // Invalid possible state
  // ------------------------------------------------

  const invalidPossible =
    compareRaidPossibleStateToCurrent({
      candidate,

      currentState,

      possibleState: {
        ...strongerState,

        current:
          true,
      },

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Current state cannot be used as possible state',
    invalidPossible.status,
    RAID_STATE_COMPARISON_STATUS
      .INVALID_POSSIBLE_STATE
  )

  // ------------------------------------------------
  // Test 17
  // Wrong possible Pokémon
  // ------------------------------------------------

  const wrongPokemon =
    compareRaidPossibleStateToCurrent({
      candidate,

      currentState,

      possibleState: {
        ...strongerState,

        pokemonIdentity:
          'MEWTWO__NORMAL',
      },

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Possible state from another Pokémon is rejected',
    wrongPokemon.status,
    RAID_STATE_COMPARISON_STATUS
      .INVALID_POSSIBLE_STATE
  )

  // ------------------------------------------------
  // Test 18
  // Possible evaluation failure
  // ------------------------------------------------

  const missingMoveState = {
    ...strongerState,

    moves: {
      fastMoveId:
        'DRAGON_TAIL_FAST',

      chargedMove1Id:
        'MISSING_MOVE',

      chargedMove2Id:
        null,
    },

    loadouts: [
      {
        fastMoveId:
          'DRAGON_TAIL_FAST',

        chargedMoveId:
          'MISSING_MOVE',
      },
    ],
  }

  const failedPossible =
    compareRaidPossibleStateToCurrent({
      candidate,

      currentState,

      possibleState:
        missingMoveState,

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Failed possible-state evaluation is surfaced',
    failedPossible.status,
    RAID_STATE_COMPARISON_STATUS
      .POSSIBLE_EVALUATION_FAILED
  )

  // ------------------------------------------------
  // Test 19
  // Bulk comparison
  // ------------------------------------------------

  const bulk =
    compareRaidPossibleStatesToCurrent({
      candidate,

      currentState,

      possibleStates: [
        strongerState,
        weakerState,
        protectedState,
      ],

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Bulk comparison succeeds',
    bulk.status,
    RAID_STATE_COMPARISON_STATUS
      .SUCCESS
  )

  expectEqual(
    'Bulk comparison returns every possible state',
    bulk
      .comparisons
      .length,
    3
  )

  expectEqual(
    'All valid bulk comparisons succeed',
    bulk
      .successfulComparisons
      .length,
    3
  )

  // ------------------------------------------------
  // Test 20
  // Bulk comparison includes gains
  // ------------------------------------------------

  expectTrue(
    'Bulk successful comparisons contain performance changes',
    bulk
      .successfulComparisons
      .every(
        (entry) =>
          Number.isFinite(
            entry
              ?.performanceChange
              ?.absoluteGain
          )
      )
  )

  // ------------------------------------------------
  // Test 21
  // Bulk invalid states
  // ------------------------------------------------

  const invalidBulk =
    compareRaidPossibleStatesToCurrent({
      candidate,

      currentState,

      possibleStates:
        null,

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Bulk comparison rejects non-array states',
    invalidBulk.status,
    RAID_STATE_COMPARISON_STATUS
      .INVALID_POSSIBLE_STATE
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

  if (
    failed ===
    0
  ) {
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
      'Raid state comparison test failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)