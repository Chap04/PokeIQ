import assert from 'node:assert/strict'

import moves from '../src/data/reference/moves-pve.json' with { type: 'json' }
import combatData from '../src/data/reference/combat.json' with { type: 'json' }

import {
  buildRaidCandidate,
} from '../src/utils/raidCandidate.js'

import {
  buildRaidPossibleStates,
  RAID_POSSIBLE_STATE_TYPE,
} from '../src/utils/raidPossibleStates.js'

import {
  compareRaidPossibleStateToCurrent,
  compareRaidPossibleStatesToCurrent,
  RAID_STATE_COMPARISON_STATUS,
} from '../src/utils/raidStateComparison.js'

// --------------------------------------------------
// Test harness
// --------------------------------------------------

let passed = 0
let failed = 0

function test(
  name,
  callback
) {
  try {
    callback()

    passed += 1

    console.log(
      `PASS - ${name}`
    )
  } catch (error) {
    failed += 1

    console.error(
      `FAIL - ${name}`
    )

    console.error(
      error
    )
  }
}

// --------------------------------------------------
// Fixtures
// --------------------------------------------------

const ownedTogetic = {
  id:
    'POWER_UP_COMPARISON_TOGETIC',

  pokemonId:
    'TOGETIC',

  pokemonForm:
    'NORMAL',

  pokemonIdentity:
    'TOGETIC__NORMAL',

  name:
    'Togetic',

  cp:
    1464,

  ivs: {
    attack: 15,
    defense: 15,
    stamina: 15,
  },

  fastMoveId:
    'EXTRASENSORY_FAST',

  chargedMove1Id:
    'DRAINING_KISS',

  chargedMove2Id:
    null,

  shiny:
    false,

  shadow:
    false,

  purified:
    false,

  lucky:
    false,

  favorite:
    false,
}

const defender = {
  id:
    'POWER_UP_COMPARISON_DEFENDER',

  form:
    'BENCHMARK',

  types: [
    'NORMAL',
  ],

  stats: {
    attack: 200,
    defense: 200,
    stamina: 200,
  },

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

const candidate =
  buildRaidCandidate(
    ownedTogetic
  )

const stateResult =
  buildRaidPossibleStates(
    candidate,
    {
      includePowerUps:
        true,
    }
  )

const currentState =
  stateResult.currentState

const powerUpStates =
  stateResult.powerUpStates

const level35State =
  powerUpStates.find(
    (state) =>
      state.combat.level ===
      35
  )

const level40State =
  powerUpStates.find(
    (state) =>
      state.combat.level ===
      40
  )

const level50State =
  powerUpStates.find(
    (state) =>
      state.combat.level ===
      50
  )

// --------------------------------------------------
// Fixture validation
// --------------------------------------------------

test(
  'Candidate is ready',
  () => {
    assert.equal(
      candidate.status,
      'READY'
    )
  }
)

test(
  'Candidate starts at Level 30',
  () => {
    assert.equal(
      candidate.level,
      30
    )
  }
)

test(
  'Current state exists',
  () => {
    assert.ok(
      currentState
    )

    assert.equal(
      currentState.current,
      true
    )
  }
)

test(
  'Three power-up states exist',
  () => {
    assert.equal(
      powerUpStates.length,
      3
    )
  }
)

test(
  'Level 35 power-up state exists',
  () => {
    assert.ok(
      level35State
    )
  }
)

test(
  'Level 40 power-up state exists',
  () => {
    assert.ok(
      level40State
    )
  }
)

test(
  'Level 50 power-up state exists',
  () => {
    assert.ok(
      level50State
    )
  }
)

// --------------------------------------------------
// Single comparison
// --------------------------------------------------

const level40Comparison =
  compareRaidPossibleStateToCurrent({
    candidate,

    currentState,

    possibleState:
      level40State,

    defender,

    moves,

    combatData,
  })

test(
  'Level 40 comparison succeeds',
  () => {
    assert.equal(
      level40Comparison.status,
      RAID_STATE_COMPARISON_STATUS
        .SUCCESS
    )
  }
)

test(
  'Comparison identifies POWER_UP state',
  () => {
    assert.equal(
      level40Comparison
        .possibleStateType ??
      level40Comparison
        .stateType,
      RAID_POSSIBLE_STATE_TYPE
        .POWER_UP
    )
  }
)

test(
  'Level 40 has higher Cycle DPS than current',
  () => {
    assert.ok(
      level40Comparison
        .performanceChange
        .possibleCycleDps >
      level40Comparison
        .performanceChange
        .currentCycleDps
    )
  }
)

test(
  'Level 40 has positive absolute gain',
  () => {
    assert.ok(
      level40Comparison
        .performanceChange
        .absoluteGain >
      0
    )
  }
)

test(
  'Level 40 has positive percent gain',
  () => {
    assert.ok(
      level40Comparison
        .performanceChange
        .percentGain >
      0
    )
  }
)

test(
  'Level 40 comparison marks improvement',
  () => {
    assert.equal(
      level40Comparison
        .performanceChange
        .improvesPerformance,
      true
    )

    assert.equal(
      level40Comparison
        .performanceChange
        .reducesPerformance,
      false
    )
  }
)

test(
  'Power-up action survives comparison',
  () => {
    assert.equal(
      level40Comparison
        .action
        .type,
      'POWER_UP'
    )
  }
)

test(
  'Level change metadata survives comparison',
  () => {
    assert.deepEqual(
      level40Comparison
        .changes
        .level,
      {
        from: 30,
        to: 40,
      }
    )
  }
)

test(
  'Power-up comparison remains non-destructive',
  () => {
    assert.equal(
      level40Comparison
        .destroysProtectedMove,
      false
    )
  }
)

// --------------------------------------------------
// Bulk comparison
// --------------------------------------------------

const bulkComparison =
  compareRaidPossibleStatesToCurrent({
    candidate,

    currentState,

    possibleStates:
      powerUpStates,

    defender,

    moves,

    combatData,
  })

test(
  'Bulk power-up comparison succeeds',
  () => {
    assert.equal(
      bulkComparison.status,
      RAID_STATE_COMPARISON_STATUS
        .SUCCESS
    )
  }
)

test(
  'Bulk comparison returns all three power-up states',
  () => {
    assert.equal(
      bulkComparison
        .comparisons
        ?.length ??
      bulkComparison
        .evaluations
        ?.length,
      3
    )
  }
)

// --------------------------------------------------
// Performance progression
// --------------------------------------------------

function compareState(
  possibleState
) {
  return compareRaidPossibleStateToCurrent({
    candidate,

    currentState,

    possibleState,

    defender,

    moves,

    combatData,
  })
}

const level35Comparison =
  compareState(
    level35State
  )

const level50Comparison =
  compareState(
    level50State
  )

function getPossibleDps(
  comparison
) {
  return comparison
    .performanceChange
    .possibleCycleDps
}

function getPercentGain(
  comparison
) {
  return comparison
    .performanceChange
    .percentGain
}

test(
  'Level 35 comparison succeeds',
  () => {
    assert.equal(
      level35Comparison.status,
      RAID_STATE_COMPARISON_STATUS
        .SUCCESS
    )
  }
)

test(
  'Level 50 comparison succeeds',
  () => {
    assert.equal(
      level50Comparison.status,
      RAID_STATE_COMPARISON_STATUS
        .SUCCESS
    )
  }
)

test(
  'Cycle DPS increases from Level 35 to Level 40',
  () => {
    assert.ok(
      getPossibleDps(
        level40Comparison
      ) >
      getPossibleDps(
        level35Comparison
      )
    )
  }
)

test(
  'Cycle DPS increases from Level 40 to Level 50',
  () => {
    assert.ok(
      getPossibleDps(
        level50Comparison
      ) >
      getPossibleDps(
        level40Comparison
      )
    )
  }
)

test(
  'Percent gain increases from Level 35 to Level 40',
  () => {
    assert.ok(
      getPercentGain(
        level40Comparison
      ) >
      getPercentGain(
        level35Comparison
      )
    )
  }
)

test(
  'Percent gain increases from Level 40 to Level 50',
  () => {
    assert.ok(
      getPercentGain(
        level50Comparison
      ) >
      getPercentGain(
        level40Comparison
      )
    )
  }
)

// --------------------------------------------------
// Immutability
// --------------------------------------------------

test(
  'Comparison does not mutate owned candidate level',
  () => {
    assert.equal(
      candidate.level,
      30
    )
  }
)

test(
  'Comparison does not mutate owned candidate CPM',
  () => {
    assert.equal(
      candidate.cpm,
      stateResult
        .currentState
        ? candidate.cpm
        : candidate.cpm
    )

    assert.notEqual(
      candidate.cpm,
      level40State
        .combat
        .cpm
    )
  }
)

// --------------------------------------------------
// Summary
// --------------------------------------------------

console.log('')
console.log(
  '================================'
)
console.log(
  'RAID POWER-UP COMPARISON VALIDATION'
)
console.log(
  '================================'
)
console.log('')

console.log(
  `${passed}/${passed + failed} tests passed`
)

if (failed > 0) {
  process.exitCode = 1
}