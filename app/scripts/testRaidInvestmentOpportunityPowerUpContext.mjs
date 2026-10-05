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
  buildRaidBenchmarks,
} from '../src/utils/raidBenchmarks.js'

import {
  rankRaidInvestmentOpportunities,
  RAID_INVESTMENT_OPPORTUNITY_STATUS,
} from '../src/utils/raidInvestmentOpportunity.js'

import {
  RAID_POWER_UP_OPPORTUNITY_CONTEXT_STATUS,
} from '../src/utils/raidPowerUpOpportunityContext.js'

import {
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
    'OPPORTUNITY_POWER_UP_CONTEXT_TOGETIC',

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

const statesWithPowerUps =
  buildRaidPossibleStates(
    candidate,
    {
      includePowerUps:
        true,
    }
  )

const statesWithoutPowerUps =
  buildRaidPossibleStates(
    candidate
  )

const matchups =
  buildRaidBenchmarks()

const result =
  rankRaidInvestmentOpportunities({
    candidate,

    currentState:
      statesWithPowerUps
        .currentState,

    possibleStates:
      statesWithPowerUps
        .possibleStates,

    matchups,

    moves,

    combatData,
  })

const resultWithoutPowerUps =
  rankRaidInvestmentOpportunities({
    candidate,

    currentState:
      statesWithoutPowerUps
        .currentState,

    possibleStates:
      statesWithoutPowerUps
        .possibleStates,

    matchups,

    moves,

    combatData,
  })

const level35 =
  result
    .powerUpOpportunities
    .find(
      (opportunity) =>
        opportunity
          .possibleState
          ?.combat
          ?.level ===
        35
    )

const level40 =
  result
    .powerUpOpportunities
    .find(
      (opportunity) =>
        opportunity
          .possibleState
          ?.combat
          ?.level ===
        40
    )

const level50 =
  result
    .powerUpOpportunities
    .find(
      (opportunity) =>
        opportunity
          .possibleState
          ?.combat
          ?.level ===
        50
    )

// --------------------------------------------------
// Pipeline
// --------------------------------------------------

test(
  'Opportunity ranking succeeds',
  () => {
    assert.equal(
      result.status,
      RAID_INVESTMENT_OPPORTUNITY_STATUS
        .SUCCESS
    )
  }
)

test(
  'Power-up context is available',
  () => {
    assert.equal(
      result.hasPowerUpContext,
      true
    )
  }
)

test(
  'Power-up context result succeeds',
  () => {
    assert.equal(
      result
        .powerUpContextResult
        ?.status,
      RAID_POWER_UP_OPPORTUNITY_CONTEXT_STATUS
        .SUCCESS
    )
  }
)

test(
  'Power-up context preserves Pokémon identity',
  () => {
    assert.equal(
      result
        .powerUpContextResult
        ?.pokemonIdentity,
      'TOGETIC__NORMAL'
    )
  }
)

// --------------------------------------------------
// Power-up opportunities
// --------------------------------------------------

test(
  'Three power-up opportunities exist',
  () => {
    assert.equal(
      result
        .powerUpOpportunities
        .length,
      3
    )
  }
)

test(
  'Level 35 power-up opportunity exists',
  () => {
    assert.ok(
      level35
    )
  }
)

test(
  'Level 40 power-up opportunity exists',
  () => {
    assert.ok(
      level40
    )
  }
)

test(
  'Level 50 power-up opportunity exists',
  () => {
    assert.ok(
      level50
    )
  }
)

test(
  'All power-up opportunities preserve POWER_UP type',
  () => {
    result
      .powerUpOpportunities
      .forEach(
        (opportunity) => {
          assert.equal(
            opportunity
              .possibleStateType,
            RAID_POSSIBLE_STATE_TYPE
              .POWER_UP
          )
        }
      )
  }
)

// --------------------------------------------------
// Attached context
// --------------------------------------------------

test(
  'Level 35 has attached power-up context',
  () => {
    assert.ok(
      level35
        .powerUpContext
    )
  }
)

test(
  'Level 40 has attached power-up context',
  () => {
    assert.ok(
      level40
        .powerUpContext
    )
  }
)

test(
  'Level 50 has attached power-up context',
  () => {
    assert.ok(
      level50
        .powerUpContext
    )
  }
)

test(
  'Level 35 context targets Level 35',
  () => {
    assert.equal(
      level35
        .powerUpContext
        .targetLevel,
      35
    )
  }
)

test(
  'Level 40 context targets Level 40',
  () => {
    assert.equal(
      level40
        .powerUpContext
        .targetLevel,
      40
    )
  }
)

test(
  'Level 50 context targets Level 50',
  () => {
    assert.equal(
      level50
        .powerUpContext
        .targetLevel,
      50
    )
  }
)

// --------------------------------------------------
// Marginal classifications
// --------------------------------------------------

test(
  'Level 35 marginal gain is limited',
  () => {
    assert.equal(
      level35
        .powerUpContext
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
        .powerUpContext
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
        .powerUpContext
        .marginalGainClassification,
      RAID_POWER_UP_MARGINAL_GAIN
        .STRONG
    )
  }
)

// --------------------------------------------------
// Checkpoint roles
// --------------------------------------------------

test(
  'Level 35 is ordinary limited',
  () => {
    assert.equal(
      level35
        .powerUpContext
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
        .powerUpContext
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
        .powerUpContext
        .checkpointRole,
      RAID_POWER_UP_CHECKPOINT_ROLE
        .PREMIUM_OPPORTUNITY
    )
  }
)

// --------------------------------------------------
// Recommended checkpoints
// --------------------------------------------------

test(
  'Level 35 is not recommended checkpoint',
  () => {
    assert.equal(
      level35
        .powerUpContext
        .isRecommendedCheckpoint,
      false
    )
  }
)

test(
  'Level 40 is not recommended checkpoint',
  () => {
    assert.equal(
      level40
        .powerUpContext
        .isRecommendedCheckpoint,
      false
    )
  }
)

test(
  'Level 50 is recommended checkpoint',
  () => {
    assert.equal(
      level50
        .powerUpContext
        .isRecommendedCheckpoint,
      true
    )
  }
)

test(
  'One recommended power-up opportunity exists',
  () => {
    assert.equal(
      result
        .recommendedPowerUpOpportunities
        .length,
      1
    )
  }
)

test(
  'Recommended power-up opportunity is Level 50',
  () => {
    assert.equal(
      result
        .recommendedPowerUpOpportunities[0]
        ?.possibleState
        ?.combat
        ?.level,
      50
    )
  }
)

test(
  'No ordinary stopping-point opportunity exists',
  () => {
    assert.equal(
      result
        .ordinaryStoppingPointOpportunity,
      null
    )
  }
)

test(
  'Premium power-up opportunity is Level 50',
  () => {
    assert.equal(
      result
        .premiumPowerUpOpportunity
        ?.possibleState
        ?.combat
        ?.level,
      50
    )
  }
)

// --------------------------------------------------
// Incremental performance
// --------------------------------------------------

test(
  'Level 35 incremental median gain is preserved',
  () => {
    assert.ok(
      Math.abs(
        level35
          .powerUpContext
          .incrementalPerformance
          .medianPercentGain -
        2.370689655172409
      ) <
      0.000001
    )
  }
)

test(
  'Level 40 incremental median gain is preserved',
  () => {
    assert.ok(
      Math.abs(
        level40
          .powerUpContext
          .incrementalPerformance
          .medianPercentGain -
        2.31578947368422
      ) <
      0.000001
    )
  }
)

test(
  'Level 50 incremental median gain is preserved',
  () => {
    assert.ok(
      Math.abs(
        level50
          .powerUpContext
          .incrementalPerformance
          .medianPercentGain -
        14.814814814814795
      ) <
      0.000001
    )
  }
)

// --------------------------------------------------
// Incremental cost
// --------------------------------------------------

test(
  'Level 35 incremental cost preserves Stardust',
  () => {
    assert.equal(
      level35
        .powerUpContext
        .incrementalCost
        .stardust,
      62000
    )
  }
)

test(
  'Level 35 incremental cost preserves Candy',
  () => {
    assert.equal(
      level35
        .powerUpContext
        .incrementalCost
        .candy,
      64
    )
  }
)

test(
  'Level 40 incremental cost preserves Stardust',
  () => {
    assert.equal(
      level40
        .powerUpContext
        .incrementalCost
        .stardust,
      88000
    )
  }
)

test(
  'Level 40 incremental cost preserves Candy',
  () => {
    assert.equal(
      level40
        .powerUpContext
        .incrementalCost
        .candy,
      118
    )
  }
)

test(
  'Level 50 incremental cost preserves Stardust',
  () => {
    assert.equal(
      level50
        .powerUpContext
        .incrementalCost
        .stardust,
      250000
    )
  }
)

test(
  'Level 50 incremental cost preserves Candy XL',
  () => {
    assert.equal(
      level50
        .powerUpContext
        .incrementalCost
        .candyXL,
      296
    )
  }
)

// --------------------------------------------------
// Non-power-up opportunities
// --------------------------------------------------

test(
  'Non-power-up opportunities have null power-up context',
  () => {
    const nonPowerUps =
      result
        .opportunities
        .filter(
          (opportunity) =>
            opportunity
              .possibleStateType !==
            RAID_POSSIBLE_STATE_TYPE
              .POWER_UP
        )

    assert.ok(
      nonPowerUps.length >
      0
    )

    nonPowerUps.forEach(
      (opportunity) => {
        assert.equal(
          opportunity
            .powerUpContext,
          null
        )
      }
    )
  }
)

// --------------------------------------------------
// Power-ups disabled
// --------------------------------------------------

test(
  'Normal possible states still exclude power-ups',
  () => {
    assert.equal(
      statesWithoutPowerUps
        .possibleStates
        .some(
          (state) =>
            state.type ===
            RAID_POSSIBLE_STATE_TYPE
              .POWER_UP
        ),
      false
    )
  }
)

test(
  'Opportunity ranking succeeds without power-ups',
  () => {
    assert.equal(
      resultWithoutPowerUps
        .status,
      RAID_INVESTMENT_OPPORTUNITY_STATUS
        .SUCCESS
    )
  }
)

test(
  'No power-up context is built when power-ups are absent',
  () => {
    assert.equal(
      resultWithoutPowerUps
        .hasPowerUpContext,
      false
    )
  }
)

test(
  'Power-up context result is null when power-ups are absent',
  () => {
    assert.equal(
      resultWithoutPowerUps
        .powerUpContextResult,
      null
    )
  }
)

test(
  'Power-up opportunity list is empty when disabled',
  () => {
    assert.equal(
      resultWithoutPowerUps
        .powerUpOpportunities
        .length,
      0
    )
  }
)

test(
  'Recommended power-up opportunity list is empty when disabled',
  () => {
    assert.equal(
      resultWithoutPowerUps
        .recommendedPowerUpOpportunities
        .length,
      0
    )
  }
)

test(
  'Ordinary stopping point is null when power-ups are disabled',
  () => {
    assert.equal(
      resultWithoutPowerUps
        .ordinaryStoppingPointOpportunity,
      null
    )
  }
)

test(
  'Premium opportunity is null when power-ups are disabled',
  () => {
    assert.equal(
      resultWithoutPowerUps
        .premiumPowerUpOpportunity,
      null
    )
  }
)

// --------------------------------------------------
// Ranking remains functional
// --------------------------------------------------

test(
  'Ranked opportunities preserve opportunity count',
  () => {
    assert.equal(
      result
        .rankedOpportunities
        .length,
      result
        .opportunities
        .length
    )
  }
)

test(
  'Every ranked opportunity receives a rank',
  () => {
    result
      .rankedOpportunities
      .forEach(
        (
          opportunity,
          index
        ) => {
          assert.equal(
            opportunity.rank,
            index + 1
          )
        }
      )
  }
)

test(
  'Top opportunity still exists',
  () => {
    assert.ok(
      result.topOpportunity
    )
  }
)

// --------------------------------------------------
// Diagnostics
// --------------------------------------------------

console.log('')
console.log(
  'POWER-UP CONTEXT INSIDE OPPORTUNITY RANKING'
)

console.table(
  result
    .powerUpOpportunities
    .map(
      (opportunity) => ({
        rank:
          opportunity.rank,

        target:
          opportunity
            .possibleState
            ?.combat
            ?.level,

        marginal:
          opportunity
            .powerUpContext
            ?.marginalGainClassification,

        role:
          opportunity
            .powerUpContext
            ?.checkpointRole,

        recommended:
          opportunity
            .powerUpContext
            ?.isRecommendedCheckpoint,

        medianGain:
          opportunity
            .powerUpContext
            ?.incrementalPerformance
            ?.medianPercentGain,

        stardust:
          opportunity
            .powerUpContext
            ?.incrementalCost
            ?.stardust,

        candy:
          opportunity
            .powerUpContext
            ?.incrementalCost
            ?.candy,

        candyXL:
          opportunity
            .powerUpContext
            ?.incrementalCost
            ?.candyXL,
      })
    )
)

console.log('')
console.log(
  '================================'
)
console.log(
  'RAID INVESTMENT OPPORTUNITY POWER-UP CONTEXT'
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