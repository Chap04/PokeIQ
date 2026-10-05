import assert from 'node:assert/strict'

import moves from '../src/data/reference/moves-pve.json' with { type: 'json' }
import combatData from '../src/data/reference/combat.json' with { type: 'json' }

import {
  buildRaidCandidate,
} from '../src/utils/raidCandidate.js'

import {
  buildRaidPossibleStates,
  RAID_POSSIBLE_STATE_STATUS,
  RAID_POSSIBLE_STATE_TYPE,
  RAID_POSSIBLE_STATE_ACTION,
} from '../src/utils/raidPossibleStates.js'

import {
  evaluateRaidPossibleStateMatchup,
  RAID_STATE_MATCHUP_STATUS,
} from '../src/utils/raidStateMatchup.js'

import {
  getCpmForLevel,
} from '../src/utils/pokemonLevel.js'

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
    'POWER_UP_TEST_TOGETIC',

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

const candidate =
  buildRaidCandidate(
    ownedTogetic
  )

const benchmarkDefender = {
  id:
    'POWER_UP_TEST_DEFENDER',

  form:
    'NORMAL',

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

// --------------------------------------------------
// Candidate
// --------------------------------------------------

test(
  'Fixture candidate is ready',
  () => {
    assert.equal(
      candidate.status,
      'READY'
    )
  }
)

test(
  'Fixture candidate is Level 30',
  () => {
    assert.equal(
      candidate.level,
      30
    )
  }
)

// --------------------------------------------------
// Default behavior remains unchanged
// --------------------------------------------------

const defaultStates =
  buildRaidPossibleStates(
    candidate
  )

test(
  'Default possible-state generation is ready',
  () => {
    assert.equal(
      defaultStates.status,
      RAID_POSSIBLE_STATE_STATUS
        .READY
    )
  }
)

test(
  'Power-up states are generated even when disabled',
  () => {
    assert.equal(
      defaultStates
        .powerUpStates
        .length,
      3
    )
  }
)

test(
  'Power-up states are not included by default',
  () => {
    const included =
      defaultStates
        .possibleStates
        .some(
          (state) =>
            state.type ===
            RAID_POSSIBLE_STATE_TYPE
              .POWER_UP
        )

    assert.equal(
      included,
      false
    )
  }
)

test(
  'Default result reports power-ups disabled',
  () => {
    assert.equal(
      defaultStates
        .powerUpsIncluded,
      false
    )
  }
)

// --------------------------------------------------
// Opt-in generation
// --------------------------------------------------

const enabledStates =
  buildRaidPossibleStates(
    candidate,
    {
      includePowerUps:
        true,
    }
  )

const powerUpStates =
  enabledStates
    .powerUpStates

test(
  'Power-up states are included when enabled',
  () => {
    assert.equal(
      enabledStates
        .powerUpsIncluded,
      true
    )

    assert.equal(
      enabledStates
        .possibleStates
        .filter(
          (state) =>
            state.type ===
            RAID_POSSIBLE_STATE_TYPE
              .POWER_UP
        )
        .length,
      3
    )
  }
)

test(
  'Level 30 generates 35, 40, and 50 targets',
  () => {
    assert.deepEqual(
      powerUpStates.map(
        (state) =>
          state.combat.level
      ),
      [
        35,
        40,
        50,
      ]
    )
  }
)

test(
  'Power-up states use POWER_UP state type',
  () => {
    assert.equal(
      powerUpStates.every(
        (state) =>
          state.type ===
          RAID_POSSIBLE_STATE_TYPE
            .POWER_UP
      ),
      true
    )
  }
)

test(
  'Power-up states use POWER_UP action type',
  () => {
    assert.equal(
      powerUpStates.every(
        (state) =>
          state.action.type ===
          RAID_POSSIBLE_STATE_ACTION
            .POWER_UP
      ),
      true
    )
  }
)

test(
  'Power-up states are reachable',
  () => {
    assert.equal(
      powerUpStates.every(
        (state) =>
          state.reachable ===
          true
      ),
      true
    )
  }
)

test(
  'Level 35 state has correct CPM',
  () => {
    const state =
      powerUpStates.find(
        (entry) =>
          entry.combat.level ===
          35
      )

    assert.equal(
      state.combat.cpm,
      getCpmForLevel(
        35
      )
    )
  }
)

test(
  'Level 40 state has correct CPM',
  () => {
    const state =
      powerUpStates.find(
        (entry) =>
          entry.combat.level ===
          40
      )

    assert.equal(
      state.combat.cpm,
      getCpmForLevel(
        40
      )
    )
  }
)

test(
  'Level 50 state has correct CPM',
  () => {
    const state =
      powerUpStates.find(
        (entry) =>
          entry.combat.level ===
          50
      )

    assert.equal(
      state.combat.cpm,
      getCpmForLevel(
        50
      )
    )
  }
)

// --------------------------------------------------
// Move preservation
// --------------------------------------------------

test(
  'Power-up states preserve Fast Move',
  () => {
    assert.equal(
      powerUpStates.every(
        (state) =>
          state.moves
            .fastMoveId ===
          'EXTRASENSORY_FAST'
      ),
      true
    )
  }
)

test(
  'Power-up states preserve Charged Move',
  () => {
    assert.equal(
      powerUpStates.every(
        (state) =>
          state.moves
            .chargedMove1Id ===
          'DRAINING_KISS'
      ),
      true
    )
  }
)

test(
  'Power-up states do not add a second Charged Move',
  () => {
    assert.equal(
      powerUpStates.every(
        (state) =>
          state.moves
            .chargedMove2Id ===
          null
      ),
      true
    )
  }
)

test(
  'Power-up states are non-destructive',
  () => {
    assert.equal(
      powerUpStates.every(
        (state) =>
          state.preservation
            .replacesExistingMove ===
          false
      ),
      true
    )

    assert.equal(
      powerUpStates.every(
        (state) =>
          state.preservation
            .destroysProtectedMove ===
          false
      ),
      true
    )
  }
)

// --------------------------------------------------
// Change metadata
// --------------------------------------------------

test(
  'Level 35 state records 30 to 35 change',
  () => {
    const state =
      powerUpStates.find(
        (entry) =>
          entry.combat.level ===
          35
      )

    assert.deepEqual(
      state.changes.level,
      {
        from: 30,
        to: 35,
      }
    )
  }
)

test(
  'Level 50 action records source and target levels',
  () => {
    const state =
      powerUpStates.find(
        (entry) =>
          entry.combat.level ===
          50
      )

    assert.equal(
      state.action.fromLevel,
      30
    )

    assert.equal(
      state.action.targetLevel,
      50
    )
  }
)

// --------------------------------------------------
// State matchup
// --------------------------------------------------

const level40State =
  powerUpStates.find(
    (state) =>
      state.combat.level ===
      40
  )

const currentEvaluation =
  evaluateRaidPossibleStateMatchup({
    candidate,

    state:
      enabledStates
        .currentState,

    defender:
      benchmarkDefender,

    moves,

    combatData,
  })

const level40Evaluation =
  evaluateRaidPossibleStateMatchup({
    candidate,

    state:
      level40State,

    defender:
      benchmarkDefender,

    moves,

    combatData,
  })

test(
  'Current-state matchup succeeds',
  () => {
    assert.equal(
      currentEvaluation.status,
      RAID_STATE_MATCHUP_STATUS
        .SUCCESS
    )
  }
)

test(
  'Power-up-state matchup succeeds',
  () => {
    assert.equal(
      level40Evaluation.status,
      RAID_STATE_MATCHUP_STATUS
        .SUCCESS
    )
  }
)

test(
  'Power-up evaluation uses target level',
  () => {
    assert.equal(
      level40Evaluation
        .bestEvaluation
        .level,
      40
    )
  }
)

test(
  'Power-up evaluation uses target CPM',
  () => {
    assert.equal(
      level40Evaluation
        .bestEvaluation
        .cpm,
      getCpmForLevel(
        40
      )
    )
  }
)

test(
  'Power-up state exposes combat metadata',
  () => {
    assert.deepEqual(
      level40Evaluation
        .combat,
      {
        level: 40,
        cpm:
          getCpmForLevel(
            40
          ),
      }
    )
  }
)

test(
  'Level 40 has higher Cycle DPS than current Level 30',
  () => {
    assert.ok(
      level40Evaluation
        .bestPerformance
        .cycleDps >
      currentEvaluation
        .bestPerformance
        .cycleDps
    )
  }
)

// --------------------------------------------------
// Higher-level filtering
// --------------------------------------------------

function cloneCandidateAtLevel(
  level
) {
  return {
    ...candidate,

    level,

    cpm:
      getCpmForLevel(
        level
      ),
  }
}

test(
  'Level 37 only generates 40 and 50',
  () => {
    const result =
      buildRaidPossibleStates(
        cloneCandidateAtLevel(
          37
        ),
        {
          includePowerUps:
            true,
        }
      )

    assert.deepEqual(
      result
        .powerUpStates
        .map(
          (state) =>
            state.combat.level
        ),
      [
        40,
        50,
      ]
    )
  }
)

test(
  'Level 40 only generates 50',
  () => {
    const result =
      buildRaidPossibleStates(
        cloneCandidateAtLevel(
          40
        ),
        {
          includePowerUps:
            true,
        }
      )

    assert.deepEqual(
      result
        .powerUpStates
        .map(
          (state) =>
            state.combat.level
        ),
      [
        50,
      ]
    )
  }
)

test(
  'Level 50 generates no power-up states',
  () => {
    const result =
      buildRaidPossibleStates(
        cloneCandidateAtLevel(
          50
        ),
        {
          includePowerUps:
            true,
        }
      )

    assert.equal(
      result
        .powerUpStates
        .length,
      0
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
  'RAID POWER-UP STATE VALIDATION'
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