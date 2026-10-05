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
  compareRaidPowerUpCheckpointPreference,
  RAID_INVESTMENT_OPPORTUNITY_STATUS,
  RAID_INVESTMENT_RANK_GROUP,
} from '../src/utils/raidInvestmentOpportunity.js'

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
// Synthetic fixtures
// --------------------------------------------------

function buildSyntheticPowerUp({
  recommended,
  rankGroup =
    RAID_INVESTMENT_RANK_GROUP
      .ACTIONABLE_PROMISING,
  targetLevel = 40,
}) {
  return {
    possibleState: {
      type:
        RAID_POSSIBLE_STATE_TYPE
          .POWER_UP,

      action: {
        type:
          'POWER_UP',

        targetLevel,
      },
    },

    rankGroup,

    powerUpContext: {
      targetLevel,

      isRecommendedCheckpoint:
        recommended,
    },
  }
}

function buildSyntheticMoveOpportunity({
  rankGroup =
    RAID_INVESTMENT_RANK_GROUP
      .ACTIONABLE_PROMISING,
}) {
  return {
    possibleState: {
      type:
        RAID_POSSIBLE_STATE_TYPE
          .CHARGED_MOVE_CHANGE,

      action: {
        type:
          'CHARGED_TM',
      },
    },

    rankGroup,

    powerUpContext:
      null,
  }
}

const recommendedPowerUp =
  buildSyntheticPowerUp({
    recommended:
      true,

    targetLevel:
      50,
  })

const intermediatePowerUp =
  buildSyntheticPowerUp({
    recommended:
      false,

    targetLevel:
      40,
  })

// --------------------------------------------------
// Recommended vs intermediate
// --------------------------------------------------

test(
  'Recommended checkpoint beats intermediate checkpoint',
  () => {
    assert.equal(
      compareRaidPowerUpCheckpointPreference(
        recommendedPowerUp,
        intermediatePowerUp
      ),
      -1
    )
  }
)

test(
  'Intermediate checkpoint loses to recommended checkpoint',
  () => {
    assert.equal(
      compareRaidPowerUpCheckpointPreference(
        intermediatePowerUp,
        recommendedPowerUp
      ),
      1
    )
  }
)

test(
  'Two recommended checkpoints have no special preference',
  () => {
    const first =
      buildSyntheticPowerUp({
        recommended:
          true,

        targetLevel:
          40,
      })

    const second =
      buildSyntheticPowerUp({
        recommended:
          true,

        targetLevel:
          50,
      })

    assert.equal(
      compareRaidPowerUpCheckpointPreference(
        first,
        second
      ),
      0
    )
  }
)

test(
  'Two intermediate checkpoints have no special preference',
  () => {
    const first =
      buildSyntheticPowerUp({
        recommended:
          false,

        targetLevel:
          35,
      })

    const second =
      buildSyntheticPowerUp({
        recommended:
          false,

        targetLevel:
          40,
      })

    assert.equal(
      compareRaidPowerUpCheckpointPreference(
        first,
        second
      ),
      0
    )
  }
)

// --------------------------------------------------
// Cross-action behaviour
//
// Recommended power-ups compete normally.
//
// Intermediate power-ups receive the checkpoint
// penalty.
// --------------------------------------------------

test(
  'Recommended power-up competes normally with move change',
  () => {
    const moveOpportunity =
      buildSyntheticMoveOpportunity({})

    assert.equal(
      compareRaidPowerUpCheckpointPreference(
        recommendedPowerUp,
        moveOpportunity
      ),
      0
    )
  }
)

test(
  'Move change competes normally with recommended power-up',
  () => {
    const moveOpportunity =
      buildSyntheticMoveOpportunity({})

    assert.equal(
      compareRaidPowerUpCheckpointPreference(
        moveOpportunity,
        recommendedPowerUp
      ),
      0
    )
  }
)

test(
  'Intermediate power-up is deprioritized behind move change',
  () => {
    const moveOpportunity =
      buildSyntheticMoveOpportunity({})

    assert.equal(
      compareRaidPowerUpCheckpointPreference(
        intermediatePowerUp,
        moveOpportunity
      ),
      1
    )
  }
)

test(
  'Move change is preferred over intermediate power-up',
  () => {
    const moveOpportunity =
      buildSyntheticMoveOpportunity({})

    assert.equal(
      compareRaidPowerUpCheckpointPreference(
        moveOpportunity,
        intermediatePowerUp
      ),
      -1
    )
  }
)

// --------------------------------------------------
// Rank-group protection
// --------------------------------------------------

test(
  'Recommended checkpoint cannot override different rank group',
  () => {
    const promising =
      buildSyntheticPowerUp({
        recommended:
          false,

        rankGroup:
          RAID_INVESTMENT_RANK_GROUP
            .ACTIONABLE_PROMISING,

        targetLevel:
          40,
      })

    const contextual =
      buildSyntheticPowerUp({
        recommended:
          true,

        rankGroup:
          RAID_INVESTMENT_RANK_GROUP
            .ACTIONABLE_CONTEXT_DEPENDENT,

        targetLevel:
          50,
      })

    assert.equal(
      compareRaidPowerUpCheckpointPreference(
        contextual,
        promising
      ),
      0
    )
  }
)

test(
  'Policy ignores unavailable power-ups',
  () => {
    const recommended =
      buildSyntheticPowerUp({
        recommended:
          true,

        rankGroup:
          RAID_INVESTMENT_RANK_GROUP
            .UNAVAILABLE,

        targetLevel:
          50,
      })

    const intermediate =
      buildSyntheticPowerUp({
        recommended:
          false,

        rankGroup:
          RAID_INVESTMENT_RANK_GROUP
            .UNAVAILABLE,

        targetLevel:
          40,
      })

    assert.equal(
      compareRaidPowerUpCheckpointPreference(
        recommended,
        intermediate
      ),
      0
    )
  }
)

test(
  'Policy ignores low-value non-actionable power-ups',
  () => {
    const recommended =
      buildSyntheticPowerUp({
        recommended:
          true,

        rankGroup:
          RAID_INVESTMENT_RANK_GROUP
            .LOW_VALUE,

        targetLevel:
          50,
      })

    const intermediate =
      buildSyntheticPowerUp({
        recommended:
          false,

        rankGroup:
          RAID_INVESTMENT_RANK_GROUP
            .LOW_VALUE,

        targetLevel:
          40,
      })

    assert.equal(
      compareRaidPowerUpCheckpointPreference(
        recommended,
        intermediate
      ),
      0
    )
  }
)

// --------------------------------------------------
// Missing context behaviour
//
// A power-up with missing context is treated as an
// intermediate / non-recommended checkpoint.
//
// This is conservative: we do not promote a power-up
// unless the stopping-point system positively marks it
// as recommended.
// --------------------------------------------------

test(
  'Recommended checkpoint beats power-up with missing context',
  () => {
    const missingContext = {
      possibleState: {
        type:
          RAID_POSSIBLE_STATE_TYPE
            .POWER_UP,
      },

      rankGroup:
        RAID_INVESTMENT_RANK_GROUP
          .ACTIONABLE_PROMISING,

      powerUpContext:
        null,
    }

    assert.equal(
      compareRaidPowerUpCheckpointPreference(
        recommendedPowerUp,
        missingContext
      ),
      -1
    )
  }
)

test(
  'Power-up with missing context loses to recommended checkpoint',
  () => {
    const missingContext = {
      possibleState: {
        type:
          RAID_POSSIBLE_STATE_TYPE
            .POWER_UP,
      },

      rankGroup:
        RAID_INVESTMENT_RANK_GROUP
          .ACTIONABLE_PROMISING,

      powerUpContext:
        null,
    }

    assert.equal(
      compareRaidPowerUpCheckpointPreference(
        missingContext,
        recommendedPowerUp
      ),
      1
    )
  }
)

test(
  'Two missing power-up contexts produce no preference',
  () => {
    const first = {
      possibleState: {
        type:
          RAID_POSSIBLE_STATE_TYPE
            .POWER_UP,
      },

      rankGroup:
        RAID_INVESTMENT_RANK_GROUP
          .ACTIONABLE_PROMISING,

      powerUpContext:
        null,
    }

    const second = {
      possibleState: {
        type:
          RAID_POSSIBLE_STATE_TYPE
            .POWER_UP,
      },

      rankGroup:
        RAID_INVESTMENT_RANK_GROUP
          .ACTIONABLE_PROMISING,

      powerUpContext:
        null,
    }

    assert.equal(
      compareRaidPowerUpCheckpointPreference(
        first,
        second
      ),
      0
    )
  }
)

// --------------------------------------------------
// Real Togetic fixture
// --------------------------------------------------

const ownedTogetic = {
  id:
    'POWER_UP_RANKING_POLICY_TOGETIC',

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
  rankRaidInvestmentOpportunities({
    candidate,

    currentState:
      states.currentState,

    possibleStates:
      states.possibleStates,

    matchups:
      buildRaidBenchmarks(),

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
// Real pipeline
// --------------------------------------------------

test(
  'Real opportunity ranking succeeds',
  () => {
    assert.equal(
      result.status,
      RAID_INVESTMENT_OPPORTUNITY_STATUS
        .SUCCESS
    )
  }
)

test(
  'Real ranking builds power-up context',
  () => {
    assert.equal(
      result.hasPowerUpContext,
      true
    )
  }
)

test(
  'Real ranking includes three power-up opportunities',
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
  'Real Level 35 opportunity exists',
  () => {
    assert.ok(
      level35
    )
  }
)

test(
  'Real Level 40 opportunity exists',
  () => {
    assert.ok(
      level40
    )
  }
)

test(
  'Real Level 50 opportunity exists',
  () => {
    assert.ok(
      level50
    )
  }
)

test(
  'Real Level 35 is not recommended',
  () => {
    assert.equal(
      level35
        .powerUpContext
        ?.isRecommendedCheckpoint,
      false
    )
  }
)

test(
  'Real Level 40 is not recommended',
  () => {
    assert.equal(
      level40
        .powerUpContext
        ?.isRecommendedCheckpoint,
      false
    )
  }
)

test(
  'Real Level 50 is recommended',
  () => {
    assert.equal(
      level50
        .powerUpContext
        ?.isRecommendedCheckpoint,
      true
    )
  }
)

test(
  'Recommended power-up list contains Level 50',
  () => {
    assert.equal(
      result
        .recommendedPowerUpOpportunities
        .some(
          (opportunity) =>
            opportunity
              .possibleState
              ?.combat
              ?.level ===
            50
        ),
      true
    )
  }
)

// --------------------------------------------------
// Real ranking policy
//
// L40 and L50 are both ACTIONABLE_PROMISING in the
// current Togetic fixture.
//
// L40 is an intermediate checkpoint.
// L50 is recommended.
//
// Therefore L50 should rank ahead of L40.
// --------------------------------------------------

test(
  'Level 40 and Level 50 share actionable promising group',
  () => {
    assert.equal(
      level40.rankGroup,
      RAID_INVESTMENT_RANK_GROUP
        .ACTIONABLE_PROMISING
    )

    assert.equal(
      level50.rankGroup,
      RAID_INVESTMENT_RANK_GROUP
        .ACTIONABLE_PROMISING
    )
  }
)

test(
  'Recommended Level 50 ranks ahead of intermediate Level 40',
  () => {
    assert.ok(
      level50.rank <
      level40.rank
    )
  }
)

// --------------------------------------------------
// L35 remains protected by actionability ordering.
//
// It belongs to ACTIONABLE_CONTEXT_DEPENDENT, so the
// checkpoint rule cannot promote it over stronger
// ACTIONABLE_PROMISING opportunities.
// --------------------------------------------------

test(
  'Level 35 remains context dependent',
  () => {
    assert.equal(
      level35.rankGroup,
      RAID_INVESTMENT_RANK_GROUP
        .ACTIONABLE_CONTEXT_DEPENDENT
    )
  }
)

test(
  'Actionability keeps Level 35 below Level 50',
  () => {
    assert.ok(
      level50.rank <
      level35.rank
    )
  }
)

// --------------------------------------------------
// Ranking integrity
// --------------------------------------------------

test(
  'Ranked opportunity count matches opportunity count',
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
  'Every opportunity receives a unique sequential rank',
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
  'Top opportunity exists',
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
  'POWER-UP RANKING POLICY'
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

        rankGroup:
          opportunity
            .rankGroup,

        value:
          opportunity
            .valueClassification,

        recommended:
          opportunity
            .powerUpContext
            ?.isRecommendedCheckpoint,

        role:
          opportunity
            .powerUpContext
            ?.checkpointRole,

        marginalGain:
          opportunity
            .powerUpContext
            ?.incrementalPerformance
            ?.medianPercentGain,
      })
    )
)

console.log('')
console.log(
  'TOP FIVE OPPORTUNITIES'
)

console.table(
  result
    .rankedOpportunities
    .slice(
      0,
      5
    )
    .map(
      (opportunity) => ({
        rank:
          opportunity.rank,

        type:
          opportunity
            .possibleStateType,

        targetLevel:
          opportunity
            .possibleState
            ?.combat
            ?.level ??
          null,

        rankGroup:
          opportunity.rankGroup,

        value:
          opportunity
            .valueClassification,

        powerUpRecommended:
          opportunity
            .powerUpContext
            ?.isRecommendedCheckpoint ??
          null,
      })
    )
)

console.log('')
console.log(
  '================================'
)
console.log(
  'RAID POWER-UP RANKING POLICY VALIDATION'
)
console.log(
  '================================'
)
console.log('')

console.log(
  `${passed}/${passed + failed} tests passed`
)

if (
  failed >
  0
) {
  process.exitCode =
    1
}