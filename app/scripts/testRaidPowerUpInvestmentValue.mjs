import assert from 'node:assert/strict'

import moves from '../src/data/reference/moves-pve.json' with { type: 'json' }
import combatData from '../src/data/reference/combat.json' with { type: 'json' }

import {
  buildRaidCandidate,
} from '../src/utils/raidCandidate.js'

import {
  buildRaidPossibleStates,
} from '../src/utils/raidPossibleStates.js'

import {
  buildRaidInvestmentEvidence,
} from '../src/utils/raidInvestmentEvidence.js'

import {
  assessRaidInvestmentEvidence,
} from '../src/utils/raidInvestmentAssessment.js'

import {
  buildRaidInvestmentValue,
  RAID_INVESTMENT_VALUE_STATUS,
  RAID_INVESTMENT_VALUE,
  RAID_INVESTMENT_RESOURCE_BURDEN,
} from '../src/utils/raidInvestmentValue.js'

import {
  RAID_INVESTMENT_COST_CERTAINTY,
} from '../src/utils/raidInvestmentCost.js'

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
    'POWER_UP_VALUE_TOGETIC',

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

const matchups =
  buildRaidBenchmarks()

function getPowerUpState(
  level
) {
  return stateResult
    .powerUpStates
    .find(
      (state) =>
        state.combat.level ===
        level
    )
}

function buildValue(
  targetLevel
) {
  const possibleState =
    getPowerUpState(
      targetLevel
    )

  const evidence =
    buildRaidInvestmentEvidence({
      candidate,

      currentState,

      possibleState,

      matchups,

      moves,

      combatData,
    })

  const assessment =
    assessRaidInvestmentEvidence(
      evidence
    )

  const value =
    buildRaidInvestmentValue({
      assessment,

      possibleState,

      candidate,
    })

  return {
    possibleState,
    evidence,
    assessment,
    value,
  }
}

const level35 =
  buildValue(
    35
  )

const level40 =
  buildValue(
    40
  )

const level50 =
  buildValue(
    50
  )

// --------------------------------------------------
// Pipeline
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
  'Candidate begins at Level 30',
  () => {
    assert.equal(
      candidate.level,
      30
    )
  }
)

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
  'Level 35 value succeeds',
  () => {
    assert.equal(
      level35.value.status,
      RAID_INVESTMENT_VALUE_STATUS
        .SUCCESS
    )
  }
)

test(
  'Level 40 value succeeds',
  () => {
    assert.equal(
      level40.value.status,
      RAID_INVESTMENT_VALUE_STATUS
        .SUCCESS
    )
  }
)

test(
  'Level 50 value succeeds',
  () => {
    assert.equal(
      level50.value.status,
      RAID_INVESTMENT_VALUE_STATUS
        .SUCCESS
    )
  }
)

// --------------------------------------------------
// Cost certainty
// --------------------------------------------------

test(
  'Level 35 has exact resource cost',
  () => {
    assert.equal(
      level35
        .value
        .cost
        .certainty,
      RAID_INVESTMENT_COST_CERTAINTY
        .EXACT
    )
  }
)

test(
  'Level 40 has exact resource cost',
  () => {
    assert.equal(
      level40
        .value
        .cost
        .certainty,
      RAID_INVESTMENT_COST_CERTAINTY
        .EXACT
    )
  }
)

test(
  'Level 50 has exact resource cost',
  () => {
    assert.equal(
      level50
        .value
        .cost
        .certainty,
      RAID_INVESTMENT_COST_CERTAINTY
        .EXACT
    )
  }
)

// --------------------------------------------------
// Ordinary vs premium
// --------------------------------------------------

test(
  'Level 35 is an ordinary resource burden',
  () => {
    assert.equal(
      level35
        .value
        .resourceBurden,
      RAID_INVESTMENT_RESOURCE_BURDEN
        .ORDINARY
    )
  }
)

test(
  'Level 40 is an ordinary resource burden',
  () => {
    assert.equal(
      level40
        .value
        .resourceBurden,
      RAID_INVESTMENT_RESOURCE_BURDEN
        .ORDINARY
    )
  }
)

test(
  'Level 50 is a premium resource burden',
  () => {
    assert.equal(
      level50
        .value
        .resourceBurden,
      RAID_INVESTMENT_RESOURCE_BURDEN
        .PREMIUM
    )
  }
)

// --------------------------------------------------
// Value classification
// --------------------------------------------------

test(
  'Level 35 does not become premium',
  () => {
    assert.notEqual(
      level35
        .value
        .value,
      RAID_INVESTMENT_VALUE
        .PREMIUM_RESOURCE
    )
  }
)

test(
  'Level 40 does not become premium',
  () => {
    assert.notEqual(
      level40
        .value
        .value,
      RAID_INVESTMENT_VALUE
        .PREMIUM_RESOURCE
    )
  }
)

test(
  'Level 50 is classified as premium resource',
  () => {
    assert.equal(
      level50
        .value
        .value,
      RAID_INVESTMENT_VALUE
        .PREMIUM_RESOURCE
    )
  }
)

// --------------------------------------------------
// Reason codes
// --------------------------------------------------

test(
  'Level 35 identifies power-up resources',
  () => {
    assert.ok(
      level35
        .value
        .reasonCodes
        .includes(
          'POWER_UP_RESOURCES_REQUIRED'
        )
    )
  }
)

test(
  'Level 40 identifies power-up resources',
  () => {
    assert.ok(
      level40
        .value
        .reasonCodes
        .includes(
          'POWER_UP_RESOURCES_REQUIRED'
        )
    )
  }
)

test(
  'Level 50 identifies power-up resources',
  () => {
    assert.ok(
      level50
        .value
        .reasonCodes
        .includes(
          'POWER_UP_RESOURCES_REQUIRED'
        )
    )
  }
)

test(
  'Level 35 does not require Candy XL',
  () => {
    assert.equal(
      level35
        .value
        .reasonCodes
        .includes(
          'CANDY_XL_REQUIRED'
        ),
      false
    )
  }
)

test(
  'Level 40 does not require Candy XL',
  () => {
    assert.equal(
      level40
        .value
        .reasonCodes
        .includes(
          'CANDY_XL_REQUIRED'
        ),
      false
    )
  }
)

test(
  'Level 50 identifies Candy XL requirement',
  () => {
    assert.ok(
      level50
        .value
        .reasonCodes
        .includes(
          'CANDY_XL_REQUIRED'
        )
    )
  }
)

test(
  'Level 50 identifies premium resource requirement',
  () => {
    assert.ok(
      level50
        .value
        .reasonCodes
        .includes(
          'REQUIRES_PREMIUM_RESOURCE'
        )
    )
  }
)

// --------------------------------------------------
// Cost propagation
// --------------------------------------------------

test(
  'Level 35 cost contains no Candy XL',
  () => {
    assert.equal(
      level35
        .value
        .cost
        .summary
        .candyXL,
      0
    )
  }
)

test(
  'Level 40 cost contains no Candy XL',
  () => {
    assert.equal(
      level40
        .value
        .cost
        .summary
        .candyXL,
      0
    )
  }
)

test(
  'Level 50 cost contains 296 Candy XL',
  () => {
    assert.equal(
      level50
        .value
        .cost
        .summary
        .candyXL,
      296
    )
  }
)

// --------------------------------------------------
// Performance remains separate from cost
// --------------------------------------------------

test(
  'Level 50 preserves its performance classification',
  () => {
    assert.equal(
      level50
        .value
        .performance,
      level50
        .assessment
        .performance
    )
  }
)

test(
  'Premium classification does not erase performance evidence',
  () => {
    assert.ok(
      level50
        .value
        .performanceEvidence
    )
  }
)

// --------------------------------------------------
// Candidate modifier propagation
// --------------------------------------------------

test(
  'Lucky candidate discount reaches value layer',
  () => {
    const luckyCandidate = {
      ...candidate,

      traits: {
        ...candidate.traits,
        lucky: true,
      },
    }

    const possibleState =
      getPowerUpState(
        40
      )

    const evidence =
      buildRaidInvestmentEvidence({
        candidate:
          luckyCandidate,

        currentState,

        possibleState,

        matchups,

        moves,

        combatData,
      })

    const assessment =
      assessRaidInvestmentEvidence(
        evidence
      )

    const luckyValue =
      buildRaidInvestmentValue({
        assessment,

        possibleState,

        candidate:
          luckyCandidate,
      })

    assert.equal(
      luckyValue
        .cost
        .summary
        .stardust,
      level40
        .value
        .cost
        .summary
        .stardust /
        2
    )
  }
)

// --------------------------------------------------
// Diagnostics
// --------------------------------------------------

console.log('')
console.log(
  'POWER-UP INVESTMENT VALUE'
)

console.table(
  [
    {
      targetLevel: 35,

      medianGain:
        level35
          .evidence
          .medianPercentGain,

      stardust:
        level35
          .value
          .cost
          .summary
          .stardust,

      candy:
        level35
          .value
          .cost
          .summary
          .candy,

      candyXL:
        level35
          .value
          .cost
          .summary
          .candyXL,

      burden:
        level35
          .value
          .resourceBurden,

      value:
        level35
          .value
          .value,
    },

    {
      targetLevel: 40,

      medianGain:
        level40
          .evidence
          .medianPercentGain,

      stardust:
        level40
          .value
          .cost
          .summary
          .stardust,

      candy:
        level40
          .value
          .cost
          .summary
          .candy,

      candyXL:
        level40
          .value
          .cost
          .summary
          .candyXL,

      burden:
        level40
          .value
          .resourceBurden,

      value:
        level40
          .value
          .value,
    },

    {
      targetLevel: 50,

      medianGain:
        level50
          .evidence
          .medianPercentGain,

      stardust:
        level50
          .value
          .cost
          .summary
          .stardust,

      candy:
        level50
          .value
          .cost
          .summary
          .candy,

      candyXL:
        level50
          .value
          .cost
          .summary
          .candyXL,

      burden:
        level50
          .value
          .resourceBurden,

      value:
        level50
          .value
          .value,
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
  'RAID POWER-UP INVESTMENT VALUE VALIDATION'
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