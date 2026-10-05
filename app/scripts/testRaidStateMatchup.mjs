import fs from 'node:fs/promises'
import path from 'node:path'

import {
  fileURLToPath,
} from 'node:url'

import {
  evaluateRaidPossibleStateMatchup,
  evaluateRaidPossibleStatesMatchup,
  RAID_STATE_MATCHUP_STATUS,
} from '../src/utils/raidStateMatchup.js'

import {
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
    'RAID STATE MATCHUP VALIDATION'
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
  // Exact owned candidate
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
        'DRAGON_TAIL_FAST',

      charged: [
        'OUTRAGE',
        'BREAKING_SWIPE',
      ],

      chargedSlots: {
        slot1:
          'OUTRAGE',

        slot2:
          'BREAKING_SWIPE',
      },
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

  // ------------------------------------------------
  // Raid defender
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
  // Possible states
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
        'DRAGON_TAIL_FAST',

      chargedMove1Id:
        'OUTRAGE',

      chargedMove2Id:
        'BREAKING_SWIPE',
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

    action: {
      type:
        'NONE',
    },

    preservation: {
      destroysProtectedMove:
        false,
    },
  }

  const singleChargedState = {
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
        'NONE',
    },

    preservation: {
      destroysProtectedMove:
        false,
    },
  }

  const unreachableState = {
    ...singleChargedState,

    type:
      'CHARGED_MOVE_CHANGE',

    current:
      false,

    reachable:
      false,

    action: {
      type:
        'SPECIAL_ACQUISITION',
    },
  }

  const protectedState = {
    ...singleChargedState,

    type:
      'CHARGED_MOVE_CHANGE',

    current:
      false,

    preservation: {
      replacesExistingMove:
        true,

      destroysProtectedMove:
        true,
    },
  }

  // ------------------------------------------------
  // 1. Valid state
  // ------------------------------------------------

  const validResult =
    evaluateRaidPossibleStateMatchup({
      candidate,

      state:
        currentState,

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Valid state evaluates successfully',
    validResult.status,
    RAID_STATE_MATCHUP_STATUS
      .SUCCESS
  )

  // ------------------------------------------------
  // 2. Invalid candidate
  // ------------------------------------------------

  const invalidCandidateResult =
    evaluateRaidPossibleStateMatchup({
      candidate: {
        ...candidate,

        status:
          'INCOMPLETE',
      },

      state:
        currentState,

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Invalid candidate is rejected',
    invalidCandidateResult.status,
    RAID_STATE_MATCHUP_STATUS
      .INVALID_CANDIDATE
  )

  // ------------------------------------------------
  // 3. Invalid state
  // ------------------------------------------------

  const invalidStateResult =
    evaluateRaidPossibleStateMatchup({
      candidate,

      state: {
        type:
          'BROKEN',
      },

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Invalid state is rejected',
    invalidStateResult.status,
    RAID_STATE_MATCHUP_STATUS
      .INVALID_STATE
  )

  // ------------------------------------------------
  // 4. Wrong Pokémon identity
  // ------------------------------------------------

  const wrongIdentityResult =
    evaluateRaidPossibleStateMatchup({
      candidate,

      state: {
        ...currentState,

        pokemonIdentity:
          'MEWTWO__NORMAL',
      },

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'State from another Pokémon is rejected',
    wrongIdentityResult.status,
    RAID_STATE_MATCHUP_STATUS
      .INVALID_STATE
  )

  // ------------------------------------------------
  // 5. Exact Fast Move
  // ------------------------------------------------

  expectEqual(
    'Current state preserves exact Fast Move',
    validResult
      ?.bestLoadout
      ?.fastMoveId,
    'DRAGON_TAIL_FAST'
  )

  // ------------------------------------------------
  // 6. Current flag
  // ------------------------------------------------

  expectEqual(
    'Current flag is preserved',
    validResult.current,
    true
  )

  // ------------------------------------------------
  // 7. Both loadouts evaluated
  // ------------------------------------------------

  expectEqual(
    'Dual Charged Move state evaluates both loadouts',
    validResult
      ?.evaluations
      ?.length,
    2
  )

  // ------------------------------------------------
  // 8. Both loadouts succeed
  // ------------------------------------------------

  expectEqual(
    'Both Charged Move loadouts succeed',
    validResult
      ?.successfulEvaluations
      ?.length,
    2
  )

  // ------------------------------------------------
  // 9. Best loadout is owned by state
  // ------------------------------------------------

  expectTrue(
    'Best loadout uses one of the state Charged Moves',
    [
      'OUTRAGE',
      'BREAKING_SWIPE',
    ].includes(
      validResult
        ?.bestLoadout
        ?.chargedMoveId
    )
  )

  // ------------------------------------------------
  // 10. Best Cycle DPS
  // ------------------------------------------------

  const successfulCycleDps =
    validResult
      .successfulEvaluations
      .map(
        (entry) =>
          entry
            .performance
            .cycleDps
      )

  const maximumCycleDps =
    Math.max(
      ...successfulCycleDps
    )

  expectEqual(
    'Best performance uses highest Cycle DPS',
    validResult
      .bestPerformance
      .cycleDps,
    maximumCycleDps
  )

  // ------------------------------------------------
  // 11. Single loadout
  // ------------------------------------------------

  const singleResult =
    evaluateRaidPossibleStateMatchup({
      candidate,

      state:
        singleChargedState,

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Single-loadout state succeeds',
    singleResult.status,
    RAID_STATE_MATCHUP_STATUS
      .SUCCESS
  )

  expectEqual(
    'Single-loadout state evaluates once',
    singleResult
      ?.evaluations
      ?.length,
    1
  )

  // ------------------------------------------------
  // 12. Candidate remains unchanged
  // ------------------------------------------------

  evaluateRaidPossibleStateMatchup({
    candidate,

    state:
      singleChargedState,

    defender,

    moves,

    combatData:
      combat,
  })

  expectEqual(
    'Possible-state evaluation does not mutate candidate Fast Move',
    candidate.moves.fast,
    'DRAGON_TAIL_FAST'
  )

  expectEqual(
    'Possible-state evaluation does not mutate candidate loadouts',
    candidate
      .loadouts
      .length,
    2
  )

  // ------------------------------------------------
  // 13. Unreachable state
  // ------------------------------------------------

  const unreachableResult =
    evaluateRaidPossibleStateMatchup({
      candidate,

      state:
        unreachableState,

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Unreachable state can still be evaluated',
    unreachableResult.status,
    RAID_STATE_MATCHUP_STATUS
      .SUCCESS
  )

  expectEqual(
    'Unreachable flag is preserved',
    unreachableResult.reachable,
    false
  )

  // ------------------------------------------------
  // 14. Action metadata
  // ------------------------------------------------

  expectEqual(
    'Action metadata is preserved',
    unreachableResult
      ?.action
      ?.type,
    'SPECIAL_ACQUISITION'
  )

  // ------------------------------------------------
  // 15. Preservation metadata
  // ------------------------------------------------

  const protectedResult =
    evaluateRaidPossibleStateMatchup({
      candidate,

      state:
        protectedState,

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Preservation metadata is preserved',
    protectedResult
      ?.preservation
      ?.destroysProtectedMove,
    true
  )

  // ------------------------------------------------
  // 16. Missing move
  // ------------------------------------------------

  const missingMoveState = {
    ...singleChargedState,

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

  const missingMoveResult =
    evaluateRaidPossibleStateMatchup({
      candidate,

      state:
        missingMoveState,

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Missing move produces no successful loadouts',
    missingMoveResult.status,
    RAID_STATE_MATCHUP_STATUS
      .NO_SUCCESSFUL_LOADOUTS
  )

  expectEqual(
    'Missing move reason reaches wrapper',
    missingMoveResult
      ?.evaluations?.[0]
      ?.status,
    RAID_MATCHUP_STATUS
      .MOVE_NOT_FOUND
  )

  // ------------------------------------------------
  // 17. Multiple states
  // ------------------------------------------------

  const multipleResult =
    evaluateRaidPossibleStatesMatchup({
      candidate,

      states: [
        currentState,
        singleChargedState,
        unreachableState,
      ],

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Multiple states evaluate successfully',
    multipleResult.status,
    RAID_STATE_MATCHUP_STATUS
      .SUCCESS
  )

  expectEqual(
    'Multiple-state evaluation returns all states',
    multipleResult
      .evaluations
      .length,
    3
  )

  expectEqual(
    'All valid multiple states succeed',
    multipleResult
      .successfulEvaluations
      .length,
    3
  )

  // ------------------------------------------------
  // 18. Invalid bulk candidate
  // ------------------------------------------------

  const invalidBulkCandidate =
    evaluateRaidPossibleStatesMatchup({
      candidate: {
        ...candidate,

        status:
          'INCOMPLETE',
      },

      states: [
        currentState,
      ],

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Multiple-state evaluation rejects invalid candidate',
    invalidBulkCandidate.status,
    RAID_STATE_MATCHUP_STATUS
      .INVALID_CANDIDATE
  )

  // ------------------------------------------------
  // 19. Invalid bulk state collection
  // ------------------------------------------------

  const invalidBulkStates =
    evaluateRaidPossibleStatesMatchup({
      candidate,

      states:
        null,

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Multiple-state evaluation rejects non-array states',
    invalidBulkStates.status,
    RAID_STATE_MATCHUP_STATUS
      .INVALID_STATE
  )

  // ------------------------------------------------
  // 20. Shadow behavior
  // ------------------------------------------------

  const shadowCandidate = {
    ...candidate,

    traits: {
      ...candidate.traits,

      shadow:
        true,
    },
  }

  const normalSingleResult =
    evaluateRaidPossibleStateMatchup({
      candidate,

      state:
        singleChargedState,

      defender,

      moves,

      combatData:
        combat,
    })

  const shadowResult =
    evaluateRaidPossibleStateMatchup({
      candidate:
        shadowCandidate,

      state:
        singleChargedState,

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Shadow state evaluation succeeds',
    shadowResult.status,
    RAID_STATE_MATCHUP_STATUS
      .SUCCESS
  )

  expectTrue(
    'Shadow state has higher Cycle DPS',
    shadowResult
      ?.bestPerformance
      ?.cycleDps >
    normalSingleResult
      ?.bestPerformance
      ?.cycleDps
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
      'Raid state matchup test failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)