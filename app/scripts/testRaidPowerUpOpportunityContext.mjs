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
  RAID_POWER_UP_MARGINAL_GAIN,
  RAID_POWER_UP_CHECKPOINT_ROLE,
} from '../src/utils/raidPowerUpStoppingPoint.js'

import {
  buildRaidPowerUpOpportunityContext,
  findRaidPowerUpOpportunityContext,
  RAID_POWER_UP_OPPORTUNITY_CONTEXT_STATUS,
} from '../src/utils/raidPowerUpOpportunityContext.js'

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
    'POWER_UP_CONTEXT_TOGETIC',

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

const result =
  buildRaidPowerUpOpportunityContext({
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

const level35 =
  result.contexts.find(
    (context) =>
      context.targetLevel ===
      35
  )

const level40 =
  result.contexts.find(
    (context) =>
      context.targetLevel ===
      40
  )

const level50 =
  result.contexts.find(
    (context) =>
      context.targetLevel ===
      50
  )

// --------------------------------------------------
// Pipeline
// --------------------------------------------------

test(
  'Opportunity context succeeds',
  () => {
    assert.equal(
      result.status,
      RAID_POWER_UP_OPPORTUNITY_CONTEXT_STATUS
        .SUCCESS
    )
  }
)

test(
  'Three power-up contexts are created',
  () => {
    assert.equal(
      result.contexts.length,
      3
    )
  }
)

test(
  'Context preserves Pokémon identity',
  () => {
    assert.equal(
      result.pokemonIdentity,
      'TOGETIC__NORMAL'
    )
  }
)

test(
  'Context preserves current level',
  () => {
    assert.equal(
      result.currentLevel,
      30
    )
  }
)

// --------------------------------------------------
// Level mapping
// --------------------------------------------------

test(
  'Level 35 context exists',
  () => {
    assert.ok(
      level35
    )
  }
)

test(
  'Level 40 context exists',
  () => {
    assert.ok(
      level40
    )
  }
)

test(
  'Level 50 context exists',
  () => {
    assert.ok(
      level50
    )
  }
)

test(
  'All contexts map to power-up states',
  () => {
    result.contexts.forEach(
      (context) => {
        assert.equal(
          context
            .possibleStateType,
          RAID_POSSIBLE_STATE_TYPE
            .POWER_UP
        )
      }
    )
  }
)

// --------------------------------------------------
// Marginal classifications
// --------------------------------------------------

test(
  'Level 35 is limited',
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
  'Level 40 is limited',
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
  'Level 50 is strong',
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
// Recommendation context
// --------------------------------------------------

test(
  'Level 35 is not a recommended checkpoint',
  () => {
    assert.equal(
      level35
        .isRecommendedCheckpoint,
      false
    )
  }
)

test(
  'Level 40 is not a recommended checkpoint',
  () => {
    assert.equal(
      level40
        .isRecommendedCheckpoint,
      false
    )
  }
)

test(
  'Level 50 is a recommended checkpoint',
  () => {
    assert.equal(
      level50
        .isRecommendedCheckpoint,
      true
    )
  }
)

test(
  'There is no ordinary stopping point context',
  () => {
    assert.equal(
      result
        .ordinaryStoppingPointContext,
      null
    )
  }
)

test(
  'Result reports no ordinary stopping point',
  () => {
    assert.equal(
      result
        .hasOrdinaryStoppingPoint,
      false
    )
  }
)

test(
  'Result reports a premium opportunity',
  () => {
    assert.equal(
      result
        .hasPremiumOpportunity,
      true
    )
  }
)

test(
  'Premium opportunity context targets Level 50',
  () => {
    assert.equal(
      result
        .premiumOpportunityContext
        ?.targetLevel,
      50
    )
  }
)

// --------------------------------------------------
// Incremental performance
// --------------------------------------------------

test(
  'Level 35 incremental gain is preserved',
  () => {
    assert.ok(
      Math.abs(
        level35
          .incrementalPerformance
          .medianPercentGain -
        2.370689655172409
      ) <
      0.000001
    )
  }
)

test(
  'Level 40 incremental gain is preserved',
  () => {
    assert.ok(
      Math.abs(
        level40
          .incrementalPerformance
          .medianPercentGain -
        2.31578947368422
      ) <
      0.000001
    )
  }
)

test(
  'Level 50 incremental gain is preserved',
  () => {
    assert.ok(
      Math.abs(
        level50
          .incrementalPerformance
          .medianPercentGain -
        14.814814814814795
      ) <
      0.000001
    )
  }
)

// --------------------------------------------------
// Incremental costs
// --------------------------------------------------

test(
  'Level 35 incremental Stardust is preserved',
  () => {
    assert.equal(
      level35
        .incrementalCost
        .stardust,
      62000
    )
  }
)

test(
  'Level 35 incremental Candy is preserved',
  () => {
    assert.equal(
      level35
        .incrementalCost
        .candy,
      64
    )
  }
)

test(
  'Level 40 incremental Stardust is preserved',
  () => {
    assert.equal(
      level40
        .incrementalCost
        .stardust,
      88000
    )
  }
)

test(
  'Level 40 incremental Candy is preserved',
  () => {
    assert.equal(
      level40
        .incrementalCost
        .candy,
      118
    )
  }
)

test(
  'Level 50 incremental Stardust is preserved',
  () => {
    assert.equal(
      level50
        .incrementalCost
        .stardust,
      250000
    )
  }
)

test(
  'Level 50 incremental Candy XL is preserved',
  () => {
    assert.equal(
      level50
        .incrementalCost
        .candyXL,
      296
    )
  }
)

// --------------------------------------------------
// Lookup helper
// --------------------------------------------------

test(
  'Lookup finds Level 35 context',
  () => {
    const state =
      states.powerUpStates.find(
        (entry) =>
          entry.combat.level ===
          35
      )

    const context =
      findRaidPowerUpOpportunityContext({
        contextResult:
          result,

        possibleState:
          state,
      })

    assert.equal(
      context?.targetLevel,
      35
    )
  }
)

test(
  'Lookup finds Level 40 context',
  () => {
    const state =
      states.powerUpStates.find(
        (entry) =>
          entry.combat.level ===
          40
      )

    const context =
      findRaidPowerUpOpportunityContext({
        contextResult:
          result,

        possibleState:
          state,
      })

    assert.equal(
      context?.targetLevel,
      40
    )
  }
)

test(
  'Lookup finds Level 50 context',
  () => {
    const state =
      states.powerUpStates.find(
        (entry) =>
          entry.combat.level ===
          50
      )

    const context =
      findRaidPowerUpOpportunityContext({
        contextResult:
          result,

        possibleState:
          state,
      })

    assert.equal(
      context?.targetLevel,
      50
    )
  }
)

test(
  'Lookup rejects non-power-up state',
  () => {
    const context =
      findRaidPowerUpOpportunityContext({
        contextResult:
          result,

        possibleState:
          states
            .chargedMoveStates[0],
      })

    assert.equal(
      context,
      null
    )
  }
)

// --------------------------------------------------
// Original states remain untouched
// --------------------------------------------------

test(
  'Original Level 35 state still starts at Level 30',
  () => {
    assert.equal(
      states
        .powerUpStates
        .find(
          (state) =>
            state.combat.level ===
            35
        )
        .action
        .fromLevel,
      30
    )
  }
)

test(
  'Original Level 40 state still starts at Level 30',
  () => {
    assert.equal(
      states
        .powerUpStates
        .find(
          (state) =>
            state.combat.level ===
            40
        )
        .action
        .fromLevel,
      30
    )
  }
)

test(
  'Original Level 50 state still starts at Level 30',
  () => {
    assert.equal(
      states
        .powerUpStates
        .find(
          (state) =>
            state.combat.level ===
            50
        )
        .action
        .fromLevel,
      30
    )
  }
)

// --------------------------------------------------
// Diagnostics
// --------------------------------------------------

console.log('')
console.log(
  'POWER-UP OPPORTUNITY CONTEXT'
)

console.table(
  result.contexts.map(
    (context) => ({
      target:
        context.targetLevel,

      marginal:
        context
          .marginalGainClassification,

      role:
        context
          .checkpointRole,

      recommended:
        context
          .isRecommendedCheckpoint,

      medianGain:
        context
          .incrementalPerformance
          ?.medianPercentGain,

      stardust:
        context
          .incrementalCost
          ?.stardust,

      candy:
        context
          .incrementalCost
          ?.candy,

      candyXL:
        context
          .incrementalCost
          ?.candyXL,
    })
  )
)

console.log('')
console.log(
  '================================'
)
console.log(
  'RAID POWER-UP OPPORTUNITY CONTEXT VALIDATION'
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