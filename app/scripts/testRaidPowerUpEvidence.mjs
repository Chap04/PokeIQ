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
  buildRaidInvestmentEvidence,
  RAID_INVESTMENT_EVIDENCE_STATUS,
} from '../src/utils/raidInvestmentEvidence.js'

import {
  buildRaidBenchmarks,
} from '../src/utils/raidBenchmarks.js'

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
// Fixture
// --------------------------------------------------

const ownedTogetic = {
  id:
    'POWER_UP_EVIDENCE_TOGETIC',

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

const matchups =
  buildRaidBenchmarks()

function buildEvidence(
  possibleState
) {
  return buildRaidInvestmentEvidence({
    candidate,

    currentState,

    possibleState,

    matchups,

    moves,

    combatData,
  })
}

const level35Evidence =
  buildEvidence(
    level35State
  )

const level40Evidence =
  buildEvidence(
    level40State
  )

const level50Evidence =
  buildEvidence(
    level50State
  )

// --------------------------------------------------
// Benchmark validation
// --------------------------------------------------

test(
  'Stable benchmark contains 18 matchups',
  () => {
    assert.equal(
      matchups.length,
      18
    )
  }
)

test(
  'Every benchmark has an ID',
  () => {
    assert.equal(
      matchups.every(
        (matchup) =>
          Boolean(
            matchup.id
          )
      ),
      true
    )
  }
)

test(
  'Every benchmark has a label',
  () => {
    assert.equal(
      matchups.every(
        (matchup) =>
          Boolean(
            matchup.label
          )
      ),
      true
    )
  }
)

test(
  'Every benchmark has one defender type',
  () => {
    assert.equal(
      matchups.every(
        (matchup) =>
          Array.isArray(
            matchup
              .defender
              .types
          ) &&
          matchup
            .defender
            .types
            .length ===
            1
      ),
      true
    )
  }
)

test(
  'Benchmark types are unique',
  () => {
    const types =
      matchups.map(
        (matchup) =>
          matchup
            .defender
            .types[0]
      )

    assert.equal(
      new Set(
        types
      ).size,
      18
    )
  }
)

// --------------------------------------------------
// State validation
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
  'Three power-up states exist',
  () => {
    assert.equal(
      powerUpStates.length,
      3
    )
  }
)

test(
  'All generated power-up states use POWER_UP type',
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

// --------------------------------------------------
// Evidence status
// --------------------------------------------------

test(
  'Level 35 evidence succeeds',
  () => {
    assert.equal(
      level35Evidence.status,
      RAID_INVESTMENT_EVIDENCE_STATUS
        .SUCCESS
    )
  }
)

test(
  'Level 40 evidence succeeds',
  () => {
    assert.equal(
      level40Evidence.status,
      RAID_INVESTMENT_EVIDENCE_STATUS
        .SUCCESS
    )
  }
)

test(
  'Level 50 evidence succeeds',
  () => {
    assert.equal(
      level50Evidence.status,
      RAID_INVESTMENT_EVIDENCE_STATUS
        .SUCCESS
    )
  }
)

// --------------------------------------------------
// Coverage
// --------------------------------------------------

function testFullCoverage(
  label,
  evidence
) {
  test(
    `${label} evaluates all 18 benchmark matchups`,
    () => {
      assert.equal(
        evidence.matchupCount,
        18
      )

      assert.equal(
        evidence.successfulMatchupCount,
        18
      )

      assert.equal(
        evidence.failedMatchupCount,
        0
      )
    }
  )
}

testFullCoverage(
  'Level 35',
  level35Evidence
)

testFullCoverage(
  'Level 40',
  level40Evidence
)

testFullCoverage(
  'Level 50',
  level50Evidence
)

// --------------------------------------------------
// Improvement behavior
// --------------------------------------------------

function testImprovesAll(
  label,
  evidence
) {
  test(
    `${label} improves all benchmark matchups`,
    () => {
      assert.equal(
        evidence.improvedMatchupCount,
        18
      )

      assert.equal(
        evidence.reducedMatchupCount,
        0
      )

      assert.equal(
        evidence.unchangedMatchupCount,
        0
      )

      assert.equal(
        evidence.improvementRate,
        1
      )
    }
  )
}

testImprovesAll(
  'Level 35',
  level35Evidence
)

testImprovesAll(
  'Level 40',
  level40Evidence
)

testImprovesAll(
  'Level 50',
  level50Evidence
)

// --------------------------------------------------
// Aggregate gains
// --------------------------------------------------

function assertPositiveGains(
  evidence
) {
  assert.ok(
    evidence.averagePercentGain >
      0
  )

  assert.ok(
    evidence.medianPercentGain >
      0
  )

  assert.ok(
    evidence.minimumPercentGain >
      0
  )

  assert.ok(
    evidence.maximumPercentGain >
      0
  )

  assert.ok(
    evidence.averagePerformanceMultiplier >
      1
  )
}

test(
  'Level 35 has positive aggregate gains',
  () => {
    assertPositiveGains(
      level35Evidence
    )
  }
)

test(
  'Level 40 has positive aggregate gains',
  () => {
    assertPositiveGains(
      level40Evidence
    )
  }
)

test(
  'Level 50 has positive aggregate gains',
  () => {
    assertPositiveGains(
      level50Evidence
    )
  }
)

// --------------------------------------------------
// Progression
// --------------------------------------------------

test(
  'Median gain increases from Level 35 to Level 40',
  () => {
    assert.ok(
      level40Evidence
        .medianPercentGain >
      level35Evidence
        .medianPercentGain
    )
  }
)

test(
  'Median gain increases from Level 40 to Level 50',
  () => {
    assert.ok(
      level50Evidence
        .medianPercentGain >
      level40Evidence
        .medianPercentGain
    )
  }
)

test(
  'Average gain increases from Level 35 to Level 40',
  () => {
    assert.ok(
      level40Evidence
        .averagePercentGain >
      level35Evidence
        .averagePercentGain
    )
  }
)

test(
  'Average gain increases from Level 40 to Level 50',
  () => {
    assert.ok(
      level50Evidence
        .averagePercentGain >
      level40Evidence
        .averagePercentGain
    )
  }
)

test(
  'Minimum gain increases from Level 35 to Level 40',
  () => {
    assert.ok(
      level40Evidence
        .minimumPercentGain >
      level35Evidence
        .minimumPercentGain
    )
  }
)

test(
  'Minimum gain increases from Level 40 to Level 50',
  () => {
    assert.ok(
      level50Evidence
        .minimumPercentGain >
      level40Evidence
        .minimumPercentGain
    )
  }
)

// --------------------------------------------------
// Metadata preservation
// --------------------------------------------------

test(
  'Level 40 evidence preserves POWER_UP action',
  () => {
    assert.equal(
      level40Evidence
        .action
        .type,
      'POWER_UP'
    )
  }
)

test(
  'Level 40 evidence preserves level change',
  () => {
    assert.deepEqual(
      level40Evidence
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
  'Power-up evidence does not destroy protected moves',
  () => {
    assert.equal(
      level35Evidence
        .destroysProtectedMove,
      false
    )

    assert.equal(
      level40Evidence
        .destroysProtectedMove,
      false
    )

    assert.equal(
      level50Evidence
        .destroysProtectedMove,
      false
    )
  }
)

// --------------------------------------------------
// Useful diagnostic output
// --------------------------------------------------

console.log('')
console.log(
  'POWER-UP EVIDENCE'
)

console.table(
  [
    {
      targetLevel: 35,
      medianGain:
        level35Evidence
          .medianPercentGain,
      averageGain:
        level35Evidence
          .averagePercentGain,
      minimumGain:
        level35Evidence
          .minimumPercentGain,
      maximumGain:
        level35Evidence
          .maximumPercentGain,
      improvementRate:
        level35Evidence
          .improvementRate,
    },

    {
      targetLevel: 40,
      medianGain:
        level40Evidence
          .medianPercentGain,
      averageGain:
        level40Evidence
          .averagePercentGain,
      minimumGain:
        level40Evidence
          .minimumPercentGain,
      maximumGain:
        level40Evidence
          .maximumPercentGain,
      improvementRate:
        level40Evidence
          .improvementRate,
    },

    {
      targetLevel: 50,
      medianGain:
        level50Evidence
          .medianPercentGain,
      averageGain:
        level50Evidence
          .averagePercentGain,
      minimumGain:
        level50Evidence
          .minimumPercentGain,
      maximumGain:
        level50Evidence
          .maximumPercentGain,
      improvementRate:
        level50Evidence
          .improvementRate,
    },
  ]
)

// --------------------------------------------------
// Summary
// --------------------------------------------------

console.log('')
console.log(
  '================================'
)
console.log(
  'RAID POWER-UP EVIDENCE VALIDATION'
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