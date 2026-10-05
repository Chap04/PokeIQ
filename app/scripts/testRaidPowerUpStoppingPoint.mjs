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
  buildRaidBenchmarks,
} from '../src/utils/raidBenchmarks.js'

import {
  buildRaidPowerUpEfficiency,
} from '../src/utils/raidPowerUpEfficiency.js'

import {
  buildRaidPowerUpStoppingPoint,
  RAID_POWER_UP_STOPPING_POINT_STATUS,
  RAID_POWER_UP_MARGINAL_GAIN,
  RAID_POWER_UP_CHECKPOINT_ROLE,
} from '../src/utils/raidPowerUpStoppingPoint.js'

// --------------------------------------------------
// Harness
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
    'POWER_UP_STOPPING_POINT_TOGETIC',

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

const states =
  buildRaidPossibleStates(
    candidate,
    {
      includePowerUps:
        true,
    }
  )

const efficiency =
  buildRaidPowerUpEfficiency({
    candidate,

    currentState:
      states.currentState,

    powerUpStates:
      states.powerUpStates,

    matchups:
      buildRaidBenchmarks(),

    moves,

    combatData,
  })

const result =
  buildRaidPowerUpStoppingPoint(
    efficiency
  )

const level35 =
  result.checkpoints.find(
    (checkpoint) =>
      checkpoint.targetLevel ===
      35
  )

const level40 =
  result.checkpoints.find(
    (checkpoint) =>
      checkpoint.targetLevel ===
      40
  )

const level50 =
  result.checkpoints.find(
    (checkpoint) =>
      checkpoint.targetLevel ===
      50
  )

// --------------------------------------------------
// Pipeline
// --------------------------------------------------

test(
  'Stopping-point analysis succeeds',
  () => {
    assert.equal(
      result.status,
      RAID_POWER_UP_STOPPING_POINT_STATUS
        .SUCCESS
    )
  }
)

test(
  'Three checkpoints are preserved',
  () => {
    assert.equal(
      result.checkpoints.length,
      3
    )
  }
)

// --------------------------------------------------
// Marginal classification
// --------------------------------------------------

test(
  'Level 35 marginal gain is limited',
  () => {
    assert.equal(
      level35
        .marginalGainClassification,
      RAID_POWER_UP_MARGINAL_GAIN
        .LIMITED
    )
  }
)

test(
  'Level 40 marginal gain is limited',
  () => {
    assert.equal(
      level40
        .marginalGainClassification,
      RAID_POWER_UP_MARGINAL_GAIN
        .LIMITED
    )
  }
)

test(
  'Level 50 marginal gain is strong',
  () => {
    assert.equal(
      level50
        .marginalGainClassification,
      RAID_POWER_UP_MARGINAL_GAIN
        .STRONG
    )
  }
)

// --------------------------------------------------
// Roles
// --------------------------------------------------

test(
  'Level 35 is ordinary limited',
  () => {
    assert.equal(
      level35
        .checkpointRole,
      RAID_POWER_UP_CHECKPOINT_ROLE
        .ORDINARY_LIMITED
    )
  }
)

test(
  'Level 40 is ordinary limited',
  () => {
    assert.equal(
      level40
        .checkpointRole,
      RAID_POWER_UP_CHECKPOINT_ROLE
        .ORDINARY_LIMITED
    )
  }
)

test(
  'Level 50 is premium opportunity',
  () => {
    assert.equal(
      level50
        .checkpointRole,
      RAID_POWER_UP_CHECKPOINT_ROLE
        .PREMIUM_OPPORTUNITY
    )
  }
)

// --------------------------------------------------
// Ordinary stopping point
// --------------------------------------------------

test(
  'Togetic has no meaningful ordinary stopping point',
  () => {
    assert.equal(
      result
        .ordinaryStoppingPoint,
      null
    )
  }
)

test(
  'Togetic has no meaningful ordinary upgrade',
  () => {
    assert.equal(
      result
        .hasMeaningfulOrdinaryUpgrade,
      false
    )
  }
)

// --------------------------------------------------
// Premium opportunity
// --------------------------------------------------

test(
  'Togetic has a meaningful premium upgrade',
  () => {
    assert.equal(
      result
        .hasMeaningfulPremiumUpgrade,
      true
    )
  }
)

test(
  'Premium opportunity targets Level 50',
  () => {
    assert.equal(
      result
        .premiumOpportunity
        ?.targetLevel,
      50
    )
  }
)

test(
  'Summary premium target is Level 50',
  () => {
    assert.equal(
      result
        .summary
        .premiumTargetLevel,
      50
    )
  }
)

test(
  'Premium opportunity requires Candy XL',
  () => {
    assert.equal(
      result
        .summary
        .premiumRequiresCandyXL,
      true
    )
  }
)

test(
  'No ordinary target level is selected',
  () => {
    assert.equal(
      result
        .summary
        .ordinaryTargetLevel,
      null
    )
  }
)

// --------------------------------------------------
// Performance data remains intact
// --------------------------------------------------

test(
  'Level 35 preserves marginal median gain',
  () => {
    assert.ok(
      Math.abs(
        level35
          .performance
          .medianPercentGain -
        2.370689655172409
      ) <
      0.000001
    )
  }
)

test(
  'Level 40 preserves marginal median gain',
  () => {
    assert.ok(
      Math.abs(
        level40
          .performance
          .medianPercentGain -
        2.31578947368422
      ) <
      0.000001
    )
  }
)

test(
  'Level 50 preserves marginal median gain',
  () => {
    assert.ok(
      Math.abs(
        level50
          .performance
          .medianPercentGain -
        14.814814814814795
      ) <
      0.000001
    )
  }
)

// --------------------------------------------------
// Cost data remains intact
// --------------------------------------------------

test(
  'Level 35 cost remains 62000 Stardust',
  () => {
    assert.equal(
      level35.cost.stardust,
      62000
    )
  }
)

test(
  'Level 40 cost remains 88000 Stardust',
  () => {
    assert.equal(
      level40.cost.stardust,
      88000
    )
  }
)

test(
  'Level 50 cost remains 296 Candy XL',
  () => {
    assert.equal(
      level50.cost.candyXL,
      296
    )
  }
)

// --------------------------------------------------
// Diagnostics
// --------------------------------------------------

console.log('')
console.log(
  'POWER-UP STOPPING POINT'
)

console.table(
  result.checkpoints.map(
    (checkpoint) => ({
      from:
        checkpoint.fromLevel,

      to:
        checkpoint.targetLevel,

      medianGain:
        checkpoint
          .performance
          .medianPercentGain,

      marginal:
        checkpoint
          .marginalGainClassification,

      resourceTier:
        checkpoint
          .resourceTier,

      role:
        checkpoint
          .checkpointRole,
    })
  )
)

console.log('')

console.log(
  'Ordinary stopping point:',
  result
    .ordinaryStoppingPoint
    ?.targetLevel ??
  'None'
)

console.log(
  'Premium opportunity:',
  result
    .premiumOpportunity
    ?.targetLevel ??
  'None'
)

console.log('')
console.log(
  '================================'
)
console.log(
  'RAID POWER-UP STOPPING POINT VALIDATION'
)
console.log(
  '================================'
)
console.log('')

console.log(
  `${passed}/${passed + failed} tests passed`
)

if (
  failed > 0
) {
  process.exitCode = 1
}