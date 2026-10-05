import assert from 'node:assert/strict'

import {
  buildRaidPossibleStates,
  RAID_MOVE_PRESERVATION,
  RAID_POSSIBLE_STATE_ACTION,
  RAID_POSSIBLE_STATE_STATUS,
  RAID_POSSIBLE_STATE_TYPE,
} from '../src/utils/raidPossibleStates.js'

// --------------------------------------------------
// Fixtures
// --------------------------------------------------

const reference = {
  id: 'TESTMON',
  form: 'NORMAL',

  moves: {
    fast: {
      normal: [
        'FAST_A',
        'FAST_B',
      ],

      elite: [
        'FAST_ELITE',
      ],

      special: [
        'FAST_SPECIAL',
      ],
    },

    charged: {
      normal: [
        'CHARGED_A',
        'CHARGED_B',
      ],

      elite: [
        'CHARGED_ELITE',
      ],

      special: [
        'CHARGED_SPECIAL',
      ],
    },
  },
}

const singleNormalCandidate = {
  status: 'READY',

  pokemonIdentity:
    'TESTMON__NORMAL',

  reference,

  moves: {
    fast:
      'FAST_A',

    charged: [
      'CHARGED_A',
    ],

    chargedSlots: {
      slot1:
        'CHARGED_A',

      slot2:
        null,
    },
  },

  loadouts: [
    {
      fastMoveId:
        'FAST_A',

      chargedMoveId:
        'CHARGED_A',
    },
  ],
}

const dualNormalCandidate = {
  ...singleNormalCandidate,

  moves: {
    fast:
      'FAST_A',

    charged: [
      'CHARGED_A',
      'CHARGED_B',
    ],

    chargedSlots: {
      slot1:
        'CHARGED_A',

      slot2:
        'CHARGED_B',
    },
  },

  loadouts: [
    {
      fastMoveId:
        'FAST_A',

      chargedMoveId:
        'CHARGED_A',
    },

    {
      fastMoveId:
        'FAST_A',

      chargedMoveId:
        'CHARGED_B',
    },
  ],
}

const eliteFastCandidate = {
  ...singleNormalCandidate,

  moves: {
    fast:
      'FAST_ELITE',

    charged: [
      'CHARGED_A',
    ],

    chargedSlots: {
      slot1:
        'CHARGED_A',

      slot2:
        null,
    },
  },
}

const specialFastCandidate = {
  ...singleNormalCandidate,

  moves: {
    fast:
      'FAST_SPECIAL',

    charged: [
      'CHARGED_A',
    ],

    chargedSlots: {
      slot1:
        'CHARGED_A',

      slot2:
        null,
    },
  },
}

const eliteChargedCandidate = {
  ...singleNormalCandidate,

  moves: {
    fast:
      'FAST_A',

    charged: [
      'CHARGED_ELITE',
    ],

    chargedSlots: {
      slot1:
        'CHARGED_ELITE',

      slot2:
        null,
    },
  },
}

const specialChargedCandidate = {
  ...singleNormalCandidate,

  moves: {
    fast:
      'FAST_A',

    charged: [
      'CHARGED_SPECIAL',
    ],

    chargedSlots: {
      slot1:
        'CHARGED_SPECIAL',

      slot2:
        null,
    },
  },
}

const mixedDualCandidate = {
  ...singleNormalCandidate,

  moves: {
    fast:
      'FAST_A',

    charged: [
      'CHARGED_ELITE',
      'CHARGED_A',
    ],

    chargedSlots: {
      slot1:
        'CHARGED_ELITE',

      slot2:
        'CHARGED_A',
    },
  },
}

// --------------------------------------------------
// Test helpers
// --------------------------------------------------

let passed = 0
let failed = 0

function runTest(
  name,
  fn
) {
  try {
    fn()

    console.log(
      `PASS - ${name}`
    )

    passed += 1
  } catch (error) {
    console.error(
      `FAIL - ${name}`
    )

    console.error(
      error
    )

    failed += 1
  }
}

function findState(
  states,
  predicate
) {
  return states.find(
    predicate
  )
}

// --------------------------------------------------
// Basic generation
// --------------------------------------------------

runTest(
  'Ready candidate succeeds',
  () => {
    const result =
      buildRaidPossibleStates(
        singleNormalCandidate
      )

    assert.equal(
      result.status,
      RAID_POSSIBLE_STATE_STATUS
        .READY
    )
  }
)

runTest(
  'Invalid candidate is rejected',
  () => {
    const result =
      buildRaidPossibleStates({
        ...singleNormalCandidate,

        status:
          'COMBAT_STATE_NOT_READY',
      })

    assert.equal(
      result.status,
      RAID_POSSIBLE_STATE_STATUS
        .INVALID_CANDIDATE
    )

    assert.deepEqual(
      result.states,
      []
    )
  }
)

// --------------------------------------------------
// Current state
// --------------------------------------------------

runTest(
  'Current state preserves full moveset',
  () => {
    const result =
      buildRaidPossibleStates(
        singleNormalCandidate
      )

    assert.equal(
      result.currentState.type,
      RAID_POSSIBLE_STATE_TYPE
        .CURRENT
    )

    assert.equal(
      result.currentState.current,
      true
    )

    assert.deepEqual(
      result.currentState.moves,
      {
        fastMoveId:
          'FAST_A',

        chargedMove1Id:
          'CHARGED_A',

        chargedMove2Id:
          null,
      }
    )
  }
)

runTest(
  'Current state is non-destructive',
  () => {
    const result =
      buildRaidPossibleStates(
        singleNormalCandidate
      )

    assert.equal(
      result.currentState
        .preservation
        .replacesExistingMove,
      false
    )

    assert.equal(
      result.currentState
        .preservation
        .destroysProtectedMove,
      false
    )
  }
)

runTest(
  'Dual-move current state preserves both Charged Move slots',
  () => {
    const result =
      buildRaidPossibleStates(
        dualNormalCandidate
      )

    assert.equal(
      result.currentState
        .moves
        .chargedMove1Id,
      'CHARGED_A'
    )

    assert.equal(
      result.currentState
        .moves
        .chargedMove2Id,
      'CHARGED_B'
    )

    assert.equal(
      result.currentState
        .loadouts
        .length,
      2
    )
  }
)

// --------------------------------------------------
// Fast Move states
// --------------------------------------------------

runTest(
  'Normal Fast Move becomes Fast TM state',
  () => {
    const result =
      buildRaidPossibleStates(
        singleNormalCandidate
      )

    const state =
      findState(
        result.fastMoveStates,
        (entry) =>
          entry.moves
            .fastMoveId ===
          'FAST_B'
      )

    assert.ok(
      state
    )

    assert.equal(
      state.action.type,
      RAID_POSSIBLE_STATE_ACTION
        .FAST_TM
    )

    assert.equal(
      state.reachable,
      true
    )
  }
)

runTest(
  'Elite Fast Move becomes Elite Fast TM state',
  () => {
    const result =
      buildRaidPossibleStates(
        singleNormalCandidate
      )

    const state =
      findState(
        result.fastMoveStates,
        (entry) =>
          entry.moves
            .fastMoveId ===
          'FAST_ELITE'
      )

    assert.ok(
      state
    )

    assert.equal(
      state.action.type,
      RAID_POSSIBLE_STATE_ACTION
        .ELITE_FAST_TM
    )
  }
)

runTest(
  'Special Fast Move remains unreachable',
  () => {
    const result =
      buildRaidPossibleStates(
        singleNormalCandidate
      )

    const state =
      findState(
        result.fastMoveStates,
        (entry) =>
          entry.moves
            .fastMoveId ===
          'FAST_SPECIAL'
      )

    assert.ok(
      state
    )

    assert.equal(
      state.action.type,
      RAID_POSSIBLE_STATE_ACTION
        .SPECIAL_ACQUISITION
    )

    assert.equal(
      state.reachable,
      false
    )
  }
)

// --------------------------------------------------
// Fast Move preservation
// --------------------------------------------------

runTest(
  'Replacing a normal Fast Move is not protected destruction',
  () => {
    const result =
      buildRaidPossibleStates(
        singleNormalCandidate
      )

    const state =
      findState(
        result.fastMoveStates,
        (entry) =>
          entry.moves
            .fastMoveId ===
          'FAST_B'
      )

    assert.ok(
      state
    )

    assert.equal(
      state.preservation
        .replacesExistingMove,
      true
    )

    assert.equal(
      state.preservation
        .replacedMove
        .availability,
      'NORMAL'
    )

    assert.equal(
      state.preservation
        .replacedMove
        .preservation,
      RAID_MOVE_PRESERVATION
        .STANDARD
    )

    assert.equal(
      state.preservation
        .destroysProtectedMove,
      false
    )
  }
)

runTest(
  'Replacing an Elite Fast Move destroys protected move',
  () => {
    const result =
      buildRaidPossibleStates(
        eliteFastCandidate
      )

    const state =
      findState(
        result.fastMoveStates,
        (entry) =>
          entry.moves
            .fastMoveId ===
          'FAST_A'
      )

    assert.ok(
      state
    )

    assert.equal(
      state.preservation
        .replacedMove
        .availability,
      'ELITE'
    )

    assert.equal(
      state.preservation
        .replacedMove
        .preservation,
      RAID_MOVE_PRESERVATION
        .PROTECTED
    )

    assert.equal(
      state.preservation
        .destroysProtectedMove,
      true
    )
  }
)

runTest(
  'Replacing a Special Fast Move destroys protected move',
  () => {
    const result =
      buildRaidPossibleStates(
        specialFastCandidate
      )

    const state =
      findState(
        result.fastMoveStates,
        (entry) =>
          entry.moves
            .fastMoveId ===
          'FAST_A'
      )

    assert.ok(
      state
    )

    assert.equal(
      state.preservation
        .replacedMove
        .availability,
      'SPECIAL'
    )

    assert.equal(
      state.preservation
        .destroysProtectedMove,
      true
    )
  }
)

// --------------------------------------------------
// Charged Move replacement states
// --------------------------------------------------

runTest(
  'Normal Charged Move replacement becomes Charged TM state',
  () => {
    const result =
      buildRaidPossibleStates(
        singleNormalCandidate
      )

    const state =
      findState(
        result.chargedMoveStates,
        (entry) =>
          entry.moves
            .chargedMove1Id ===
          'CHARGED_B'
      )

    assert.ok(
      state
    )

    assert.equal(
      state.type,
      RAID_POSSIBLE_STATE_TYPE
        .CHARGED_MOVE_CHANGE
    )

    assert.equal(
      state.action.type,
      RAID_POSSIBLE_STATE_ACTION
        .CHARGED_TM
    )
  }
)

runTest(
  'Elite Charged Move replacement becomes Elite Charged TM state',
  () => {
    const result =
      buildRaidPossibleStates(
        singleNormalCandidate
      )

    const state =
      findState(
        result.chargedMoveStates,
        (entry) =>
          entry.moves
            .chargedMove1Id ===
          'CHARGED_ELITE'
      )

    assert.ok(
      state
    )

    assert.equal(
      state.action.type,
      RAID_POSSIBLE_STATE_ACTION
        .ELITE_CHARGED_TM
    )
  }
)

runTest(
  'Special Charged Move replacement remains unreachable',
  () => {
    const result =
      buildRaidPossibleStates(
        singleNormalCandidate
      )

    const state =
      findState(
        result.chargedMoveStates,
        (entry) =>
          entry.moves
            .chargedMove1Id ===
          'CHARGED_SPECIAL'
      )

    assert.ok(
      state
    )

    assert.equal(
      state.action.type,
      RAID_POSSIBLE_STATE_ACTION
        .SPECIAL_ACQUISITION
    )

    assert.equal(
      state.reachable,
      false
    )
  }
)

// --------------------------------------------------
// Charged Move preservation
// --------------------------------------------------

runTest(
  'Replacing a normal Charged Move is not protected destruction',
  () => {
    const result =
      buildRaidPossibleStates(
        singleNormalCandidate
      )

    const state =
      findState(
        result.chargedMoveStates,
        (entry) =>
          entry.moves
            .chargedMove1Id ===
          'CHARGED_B'
      )

    assert.ok(
      state
    )

    assert.equal(
      state.preservation
        .replacedMove
        .availability,
      'NORMAL'
    )

    assert.equal(
      state.preservation
        .destroysProtectedMove,
      false
    )
  }
)

runTest(
  'Replacing an Elite Charged Move destroys protected move',
  () => {
    const result =
      buildRaidPossibleStates(
        eliteChargedCandidate
      )

    const state =
      findState(
        result.chargedMoveStates,
        (entry) =>
          entry.moves
            .chargedMove1Id ===
          'CHARGED_A'
      )

    assert.ok(
      state
    )

    assert.equal(
      state.preservation
        .replacedMove
        .moveId,
      'CHARGED_ELITE'
    )

    assert.equal(
      state.preservation
        .replacedMove
        .availability,
      'ELITE'
    )

    assert.equal(
      state.preservation
        .replacedMove
        .protected,
      true
    )

    assert.equal(
      state.preservation
        .destroysProtectedMove,
      true
    )
  }
)

runTest(
  'Replacing a Special Charged Move destroys protected move',
  () => {
    const result =
      buildRaidPossibleStates(
        specialChargedCandidate
      )

    const state =
      findState(
        result.chargedMoveStates,
        (entry) =>
          entry.moves
            .chargedMove1Id ===
          'CHARGED_A'
      )

    assert.ok(
      state
    )

    assert.equal(
      state.preservation
        .replacedMove
        .availability,
      'SPECIAL'
    )

    assert.equal(
      state.preservation
        .destroysProtectedMove,
      true
    )
  }
)

// --------------------------------------------------
// Dual Charged Move slot preservation
// --------------------------------------------------

runTest(
  'Replacing slot 1 preserves slot 2',
  () => {
    const result =
      buildRaidPossibleStates(
        dualNormalCandidate
      )

    const state =
      findState(
        result.chargedMoveStates,
        (entry) =>
          entry.changes
            ?.chargedMove
            ?.slot ===
            'slot1' &&
          entry.moves
            .chargedMove1Id ===
            'CHARGED_ELITE'
      )

    assert.ok(
      state
    )

    assert.equal(
      state.moves
        .chargedMove2Id,
      'CHARGED_B'
    )
  }
)

runTest(
  'Replacing slot 2 preserves slot 1',
  () => {
    const result =
      buildRaidPossibleStates(
        dualNormalCandidate
      )

    const state =
      findState(
        result.chargedMoveStates,
        (entry) =>
          entry.changes
            ?.chargedMove
            ?.slot ===
            'slot2' &&
          entry.moves
            .chargedMove2Id ===
            'CHARGED_ELITE'
      )

    assert.ok(
      state
    )

    assert.equal(
      state.moves
        .chargedMove1Id,
      'CHARGED_A'
    )
  }
)

runTest(
  'Charged Move replacement cannot duplicate occupied move',
  () => {
    const result =
      buildRaidPossibleStates(
        dualNormalCandidate
      )

    const duplicateState =
      findState(
        result.chargedMoveStates,
        (entry) =>
          (
            entry.moves
              .chargedMove1Id ===
              'CHARGED_B' &&
            entry.moves
              .chargedMove2Id ===
              'CHARGED_B'
          ) ||
          (
            entry.moves
              .chargedMove1Id ===
              'CHARGED_A' &&
            entry.moves
              .chargedMove2Id ===
              'CHARGED_A'
          )
      )

    assert.equal(
      duplicateState,
      undefined
    )
  }
)

// --------------------------------------------------
// Mixed-value dual Charged Moves
// --------------------------------------------------

runTest(
  'Protected owned moves are exposed at result level',
  () => {
    const result =
      buildRaidPossibleStates(
        mixedDualCandidate
      )

    assert.equal(
      result
        .protectedOwnedMoves
        .length,
      1
    )

    assert.equal(
      result
        .protectedOwnedMoves[0]
        .moveId,
      'CHARGED_ELITE'
    )

    assert.equal(
      result
        .protectedOwnedMoves[0]
        .slot,
      'slot1'
    )
  }
)

runTest(
  'Replacing protected slot is marked destructive',
  () => {
    const result =
      buildRaidPossibleStates(
        mixedDualCandidate
      )

    const state =
      findState(
        result.chargedMoveStates,
        (entry) =>
          entry.changes
            ?.chargedMove
            ?.slot ===
            'slot1' &&
          entry.moves
            .chargedMove1Id ===
            'CHARGED_B'
      )

    assert.ok(
      state
    )

    assert.equal(
      state.preservation
        .destroysProtectedMove,
      true
    )
  }
)

runTest(
  'Replacing ordinary slot preserves protected slot',
  () => {
    const result =
      buildRaidPossibleStates(
        mixedDualCandidate
      )

    const state =
      findState(
        result.chargedMoveStates,
        (entry) =>
          entry.changes
            ?.chargedMove
            ?.slot ===
            'slot2' &&
          entry.moves
            .chargedMove2Id ===
            'CHARGED_B'
      )

    assert.ok(
      state
    )

    assert.equal(
      state.moves
        .chargedMove1Id,
      'CHARGED_ELITE'
    )

    assert.equal(
      state.preservation
        .destroysProtectedMove,
      false
    )

    assert.equal(
      state.preservation
        .protectedOwnedMoves
        .length,
      1
    )

    assert.equal(
      state.preservation
        .protectedOwnedMoves[0]
        .moveId,
      'CHARGED_ELITE'
    )
  }
)

// --------------------------------------------------
// Second Charged Move states
// --------------------------------------------------

runTest(
  'One-move Pokémon generates second Charged Move states',
  () => {
    const result =
      buildRaidPossibleStates(
        singleNormalCandidate
      )

    assert.ok(
      result
        .secondChargedMoveStates
        .length >
      0
    )
  }
)

runTest(
  'Second Charged Move unlock is non-destructive',
  () => {
    const result =
      buildRaidPossibleStates(
        eliteChargedCandidate
      )

    const state =
      findState(
        result
          .secondChargedMoveStates,
        (entry) =>
          entry.moves
            .chargedMove2Id ===
          'CHARGED_A'
      )

    assert.ok(
      state
    )

    assert.equal(
      state.moves
        .chargedMove1Id,
      'CHARGED_ELITE'
    )

    assert.equal(
      state.preservation
        .replacesExistingMove,
      false
    )

    assert.equal(
      state.preservation
        .destroysProtectedMove,
      false
    )
  }
)

runTest(
  'Second Charged Move uses unlock action',
  () => {
    const result =
      buildRaidPossibleStates(
        singleNormalCandidate
      )

    const state =
      findState(
        result
          .secondChargedMoveStates,
        (entry) =>
          entry.moves
            .chargedMove2Id ===
          'CHARGED_B'
      )

    assert.ok(
      state
    )

    assert.equal(
      state.action.type,
      RAID_POSSIBLE_STATE_ACTION
        .UNLOCK_SECOND_CHARGED_MOVE
    )
  }
)

runTest(
  'Elite second Charged Move retains Elite requirement',
  () => {
    const result =
      buildRaidPossibleStates(
        singleNormalCandidate
      )

    const state =
      findState(
        result
          .secondChargedMoveStates,
        (entry) =>
          entry.moves
            .chargedMove2Id ===
          'CHARGED_ELITE'
      )

    assert.ok(
      state
    )

    assert.equal(
      state.action
        .additionalMoveAction,
      RAID_POSSIBLE_STATE_ACTION
        .ELITE_CHARGED_TM
    )
  }
)

runTest(
  'Special second Charged Move remains unreachable',
  () => {
    const result =
      buildRaidPossibleStates(
        singleNormalCandidate
      )

    const state =
      findState(
        result
          .secondChargedMoveStates,
        (entry) =>
          entry.moves
            .chargedMove2Id ===
          'CHARGED_SPECIAL'
      )

    assert.ok(
      state
    )

    assert.equal(
      state.action
        .additionalMoveAction,
      RAID_POSSIBLE_STATE_ACTION
        .SPECIAL_ACQUISITION
    )

    assert.equal(
      state.reachable,
      false
    )
  }
)

runTest(
  'Two-move Pokémon does not generate second Charged Move unlock states',
  () => {
    const result =
      buildRaidPossibleStates(
        dualNormalCandidate
      )

    assert.equal(
      result
        .secondChargedMoveStates
        .length,
      0
    )
  }
)

// --------------------------------------------------
// Sanity checks
// --------------------------------------------------

runTest(
  'Current Fast Move is not generated as Fast Move change',
  () => {
    const result =
      buildRaidPossibleStates(
        singleNormalCandidate
      )

    const duplicate =
      findState(
        result.fastMoveStates,
        (entry) =>
          entry.moves
            .fastMoveId ===
          'FAST_A'
      )

    assert.equal(
      duplicate,
      undefined
    )
  }
)

runTest(
  'Possible states are separate from current state',
  () => {
    const result =
      buildRaidPossibleStates(
        singleNormalCandidate
      )

    assert.ok(
      result
        .possibleStates
        .every(
          (state) =>
            state.current ===
            false
        )
    )

    assert.equal(
      result.states.length,
      result.possibleStates.length +
        1
    )
  }
)

// --------------------------------------------------
// Summary
// --------------------------------------------------

console.log()
console.log(
  '================================'
)
console.log(
  'RAID POSSIBLE STATE V3 VALIDATION'
)
console.log(
  '================================'
)
console.log()
console.log(
  `${passed}/${passed + failed} tests passed`
)

if (
  failed >
  0
) {
  process.exitCode = 1
}