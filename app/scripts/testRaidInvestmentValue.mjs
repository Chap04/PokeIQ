import {
  buildRaidInvestmentValue,
  RAID_INVESTMENT_VALUE_STATUS,
  RAID_INVESTMENT_VALUE,
  RAID_INVESTMENT_RESOURCE_BURDEN,
} from '../src/utils/raidInvestmentValue.js'

import {
  RAID_INVESTMENT_ASSESSMENT_STATUS,
  RAID_INVESTMENT_PERFORMANCE,
  RAID_INVESTMENT_SIGNAL,
  RAID_INVESTMENT_CONFIDENCE,
  RAID_INVESTMENT_DESTINATION_CERTAINTY,
} from '../src/utils/raidInvestmentAssessment.js'

import {
  RAID_INVESTMENT_COST_CERTAINTY,
} from '../src/utils/raidInvestmentCost.js'

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
  if (
    actual ===
    expected
  ) {
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
  if (
    value === true
  ) {
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
// Fixtures
// --------------------------------------------------

function buildAssessment({
  performance =
    RAID_INVESTMENT_PERFORMANCE
      .STRONG_IMPROVEMENT,

  investmentSignal =
    RAID_INVESTMENT_SIGNAL
      .PROMISING,

  confidence =
    RAID_INVESTMENT_CONFIDENCE
      .HIGH,

  reachable =
    true,

  destroysProtectedMove =
    false,

  destinationCertainty =
    RAID_INVESTMENT_DESTINATION_CERTAINTY
      .GUARANTEED,
} = {}) {
  return {
    status:
      RAID_INVESTMENT_ASSESSMENT_STATUS
        .SUCCESS,

    pokemonIdentity:
      'RAYQUAZA__NORMAL',

    possibleStateType:
      'TEST_STATE',

    performance,

    investmentSignal,

    confidence,

    destinationCertainty,

    reasonCodes: [],

    reachable,

    destroysProtectedMove,

    action: {
      type:
        'FAST_TM',
    },

    additionalMoveAction:
      null,

    matchupCoverage: {
      total:
        3,

      successful:
        3,

      failed:
        0,

      coverageRate:
        1,
    },

    performanceEvidence: {
      improvedMatchupCount:
        3,

      reducedMatchupCount:
        0,

      unchangedMatchupCount:
        0,

      improvementRate:
        1,

      reductionRate:
        0,

      averagePercentGain:
        15,

      medianPercentGain:
        15,

      minimumPercentGain:
        12,

      maximumPercentGain:
        18,

      averagePerformanceMultiplier:
        1.15,
    },
  }
}

function buildState({
  actionType =
    'FAST_TM',

  additionalActionType =
    null,

  reachable =
    true,
} = {}) {
  return {
    type:
      'TEST_STATE',

    current:
      false,

    reachable,

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
        actionType,
    },

    additionalMoveAction:
      additionalActionType
        ? {
            type:
              additionalActionType,
          }
        : null,

    preservation: {
      destroysProtectedMove:
        false,
    },
  }
}

// --------------------------------------------------
// Main
// --------------------------------------------------

function main() {
  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'RAID INVESTMENT VALUE VALIDATION'
  )
  console.log(
    '================================'
  )
  console.log('')

  // ------------------------------------------------
  // Strong improvement + ordinary TM
  // ------------------------------------------------

  const highValue =
    buildRaidInvestmentValue({
      assessment:
        buildAssessment(),

      possibleState:
        buildState({
          actionType:
            'FAST_TM',
        }),
    })

  expectEqual(
    'Strong ordinary-resource investment succeeds',
    highValue.status,
    RAID_INVESTMENT_VALUE_STATUS
      .SUCCESS
  )

  expectEqual(
    'Strong ordinary-resource investment is high value',
    highValue.value,
    RAID_INVESTMENT_VALUE
      .HIGH_VALUE
  )

  expectEqual(
    'Normal TM is ordinary resource burden',
    highValue.resourceBurden,
    RAID_INVESTMENT_RESOURCE_BURDEN
      .ORDINARY
  )

  expectEqual(
    'Normal TM exact cost remains uncertain',
    highValue
      .cost
      .certainty,
    RAID_INVESTMENT_COST_CERTAINTY
      .UNCERTAIN
  )

  expectTrue(
    'High-value result preserves stochastic cost warning',
    highValue
      .reasonCodes
      .includes(
        'STOCHASTIC_RESOURCE_QUANTITY'
      )
  )

  expectTrue(
    'High-value result includes positive value reason',
    highValue
      .reasonCodes
      .includes(
        'STRONG_VALUE_WITHOUT_PREMIUM_COST'
      )
  )

  // ------------------------------------------------
  // Consistent improvement + ordinary resource
  // ------------------------------------------------

  const consistentValue =
    buildRaidInvestmentValue({
      assessment:
        buildAssessment({
          performance:
            RAID_INVESTMENT_PERFORMANCE
              .CONSISTENT_IMPROVEMENT,
        }),

      possibleState:
        buildState({
          actionType:
            'CHARGED_TM',
        }),
    })

  expectEqual(
    'Consistent ordinary improvement is high value',
    consistentValue.value,
    RAID_INVESTMENT_VALUE
      .HIGH_VALUE
  )

  // ------------------------------------------------
  // Situational improvement
  // ------------------------------------------------

  const situationalValue =
    buildRaidInvestmentValue({
      assessment:
        buildAssessment({
          performance:
            RAID_INVESTMENT_PERFORMANCE
              .SITUATIONAL_IMPROVEMENT,

          investmentSignal:
            RAID_INVESTMENT_SIGNAL
              .CONTEXT_DEPENDENT,
        }),

      possibleState:
        buildState({
          actionType:
            'FAST_TM',
        }),
    })

  expectEqual(
    'Situational improvement is moderate value',
    situationalValue.value,
    RAID_INVESTMENT_VALUE
      .MODERATE_VALUE
  )

  expectEqual(
    'Situational ordinary resource stays ordinary burden',
    situationalValue.resourceBurden,
    RAID_INVESTMENT_RESOURCE_BURDEN
      .ORDINARY
  )

  // ------------------------------------------------
  // Mixed improvement
  // ------------------------------------------------

  const mixedValue =
    buildRaidInvestmentValue({
      assessment:
        buildAssessment({
          performance:
            RAID_INVESTMENT_PERFORMANCE
              .MIXED,

          investmentSignal:
            RAID_INVESTMENT_SIGNAL
              .CONTEXT_DEPENDENT,
        }),

      possibleState:
        buildState({
          actionType:
            'CHARGED_TM',
        }),
    })

  expectEqual(
    'Mixed improvement is moderate value',
    mixedValue.value,
    RAID_INVESTMENT_VALUE
      .MODERATE_VALUE
  )

  // ------------------------------------------------
  // Elite TM
  // ------------------------------------------------

  const eliteValue =
    buildRaidInvestmentValue({
      assessment:
        buildAssessment(),

      possibleState:
        buildState({
          actionType:
            'ELITE_CHARGED_TM',
        }),
    })

  expectEqual(
    'Elite TM investment succeeds',
    eliteValue.status,
    RAID_INVESTMENT_VALUE_STATUS
      .SUCCESS
  )

  expectEqual(
    'Elite TM investment is premium-resource value',
    eliteValue.value,
    RAID_INVESTMENT_VALUE
      .PREMIUM_RESOURCE
  )

  expectEqual(
    'Elite TM produces premium burden',
    eliteValue.resourceBurden,
    RAID_INVESTMENT_RESOURCE_BURDEN
      .PREMIUM
  )

  expectTrue(
    'Elite TM reason is explicit',
    eliteValue
      .reasonCodes
      .includes(
        'ELITE_TM_REQUIRED'
      )
  )

  expectTrue(
    'Premium resource reason is explicit',
    eliteValue
      .reasonCodes
      .includes(
        'REQUIRES_PREMIUM_RESOURCE'
      )
  )

  // ------------------------------------------------
  // Second move unlock
  // ------------------------------------------------

  const incompleteValue =
    buildRaidInvestmentValue({
      assessment:
        buildAssessment(),

      possibleState:
        buildState({
          actionType:
            'UNLOCK_SECOND_CHARGED_MOVE',
        }),
    })

  expectEqual(
    'Second-move investment succeeds',
    incompleteValue.status,
    RAID_INVESTMENT_VALUE_STATUS
      .SUCCESS
  )

  expectEqual(
    'Incomplete second-move cost remains explicit',
    incompleteValue.value,
    RAID_INVESTMENT_VALUE
      .COST_INCOMPLETE
  )

  expectEqual(
    'Second-move resource burden is incomplete',
    incompleteValue.resourceBurden,
    RAID_INVESTMENT_RESOURCE_BURDEN
      .INCOMPLETE
  )

  expectTrue(
    'Incomplete-cost reason is explicit',
    incompleteValue
      .reasonCodes
      .includes(
        'RESOURCE_COST_INCOMPLETE'
      )
  )

  // ------------------------------------------------
  // Second move + TM
  // ------------------------------------------------

  const incompleteWithTm =
    buildRaidInvestmentValue({
      assessment:
        buildAssessment(),

      possibleState:
        buildState({
          actionType:
            'UNLOCK_SECOND_CHARGED_MOVE',

          additionalActionType:
            'CHARGED_TM',
        }),
    })

  expectEqual(
    'Second move plus TM remains cost incomplete',
    incompleteWithTm.value,
    RAID_INVESTMENT_VALUE
      .COST_INCOMPLETE
  )

  expectEqual(
    'Second move plus TM keeps incomplete burden',
    incompleteWithTm.resourceBurden,
    RAID_INVESTMENT_RESOURCE_BURDEN
      .INCOMPLETE
  )

  expectTrue(
    'Second move plus TM still records stochastic TM quantity',
    incompleteWithTm
      .reasonCodes
      .includes(
        'STOCHASTIC_RESOURCE_QUANTITY'
      )
  )

  // ------------------------------------------------
  // No meaningful improvement
  // ------------------------------------------------

  const lowValue =
    buildRaidInvestmentValue({
      assessment:
        buildAssessment({
          performance:
            RAID_INVESTMENT_PERFORMANCE
              .NO_MEANINGFUL_CHANGE,

          investmentSignal:
            RAID_INVESTMENT_SIGNAL
              .LOW_VALUE,
        }),

      possibleState:
        buildState({
          actionType:
            'FAST_TM',
        }),
    })

  expectEqual(
    'No meaningful improvement is low value',
    lowValue.value,
    RAID_INVESTMENT_VALUE
      .LOW_VALUE
  )

  expectTrue(
    'Low-value reason is explicit',
    lowValue
      .reasonCodes
      .includes(
        'LIMITED_VALUE_FOR_CHANGE'
      )
  )

  // ------------------------------------------------
  // Regression
  // ------------------------------------------------

  const negativeValue =
    buildRaidInvestmentValue({
      assessment:
        buildAssessment({
          performance:
            RAID_INVESTMENT_PERFORMANCE
              .REGRESSION,

          investmentSignal:
            RAID_INVESTMENT_SIGNAL
              .NEGATIVE,
        }),

      possibleState:
        buildState({
          actionType:
            'FAST_TM',
        }),
    })

  expectEqual(
    'Regression produces negative value',
    negativeValue.value,
    RAID_INVESTMENT_VALUE
      .NEGATIVE
  )

  expectTrue(
    'Regression reason is explicit',
    negativeValue
      .reasonCodes
      .includes(
        'PERFORMANCE_REGRESSION'
      )
  )

  // ------------------------------------------------
  // Unavailable
  // ------------------------------------------------

  const unavailableValue =
    buildRaidInvestmentValue({
      assessment:
        buildAssessment({
          investmentSignal:
            RAID_INVESTMENT_SIGNAL
              .UNAVAILABLE,

          reachable:
            false,
        }),

      possibleState:
        buildState({
          actionType:
            'SPECIAL_ACQUISITION',

          reachable:
            false,
        }),
    })

  expectEqual(
    'Unavailable state remains unavailable',
    unavailableValue.value,
    RAID_INVESTMENT_VALUE
      .UNAVAILABLE
  )

  expectEqual(
    'Unavailable result preserves reachable false',
    unavailableValue.reachable,
    false
  )

  expectTrue(
    'Unavailable reason is explicit',
    unavailableValue
      .reasonCodes
      .includes(
        'STATE_UNAVAILABLE'
      )
  )

  // ------------------------------------------------
  // Preservation risk
  // ------------------------------------------------

  const preservationValue =
    buildRaidInvestmentValue({
      assessment:
        buildAssessment({
          investmentSignal:
            RAID_INVESTMENT_SIGNAL
              .PRESERVATION_RISK,

          destroysProtectedMove:
            true,
        }),

      possibleState:
        buildState({
          actionType:
            'FAST_TM',
        }),
    })

  expectEqual(
    'Protected move risk remains preservation risk',
    preservationValue.value,
    RAID_INVESTMENT_VALUE
      .PRESERVATION_RISK
  )

  expectEqual(
    'Protected move flag survives value model',
    preservationValue
      .destroysProtectedMove,
    true
  )

  expectTrue(
    'Preservation-risk reason is explicit',
    preservationValue
      .reasonCodes
      .includes(
        'PROTECTED_MOVE_AT_RISK'
      )
  )

  // ------------------------------------------------
  // No modeled resource cost
  // ------------------------------------------------

  const noCostValue =
    buildRaidInvestmentValue({
      assessment:
        buildAssessment(),

      possibleState:
        buildState({
          actionType:
            'NONE',
        }),
    })

  expectEqual(
    'No-action strong improvement is high value',
    noCostValue.value,
    RAID_INVESTMENT_VALUE
      .HIGH_VALUE
  )

  expectEqual(
    'No action has no modeled burden',
    noCostValue.resourceBurden,
    RAID_INVESTMENT_RESOURCE_BURDEN
      .NONE
  )

  expectTrue(
    'No-cost reason is explicit',
    noCostValue
      .reasonCodes
      .includes(
        'NO_MODELED_RESOURCE_COST'
      )
  )

  // ------------------------------------------------
  // Unknown action
  // ------------------------------------------------

  const unknownCost =
    buildRaidInvestmentValue({
      assessment:
        buildAssessment(),

      possibleState:
        buildState({
          actionType:
            'NEW_FUTURE_ACTION',
        }),
    })

  expectEqual(
    'Unknown action does not get guessed value',
    unknownCost.value,
    RAID_INVESTMENT_VALUE
      .COST_INCOMPLETE
  )

  expectEqual(
    'Unknown action produces incomplete burden',
    unknownCost.resourceBurden,
    RAID_INVESTMENT_RESOURCE_BURDEN
      .INCOMPLETE
  )

  // ------------------------------------------------
  // Destination certainty
  // ------------------------------------------------

  const stochasticDestination =
    buildRaidInvestmentValue({
      assessment:
        buildAssessment({
          destinationCertainty:
            RAID_INVESTMENT_DESTINATION_CERTAINTY
              .STOCHASTIC,
        }),

      possibleState:
        buildState({
          actionType:
            'FAST_TM',
        }),
    })

  expectEqual(
    'Stochastic exact destination gets explicit value classification',
    stochasticDestination.value,
    RAID_INVESTMENT_VALUE
      .STOCHASTIC_DESTINATION
  )

  expectEqual(
    'Stochastic destination certainty survives value model',
    stochasticDestination
      .destinationCertainty,
    RAID_INVESTMENT_DESTINATION_CERTAINTY
      .STOCHASTIC
  )

  expectTrue(
    'Stochastic destination reason is explicit',
    stochasticDestination
      .reasonCodes
      .includes(
        'STOCHASTIC_DESTINATION'
      )
  )

  expectTrue(
    'Exact destination warning is explicit',
    stochasticDestination
      .reasonCodes
      .includes(
        'EXACT_DESTINATION_NOT_GUARANTEED'
      )
  )

  const guaranteedDestinationWithStochasticTmCost =
    buildRaidInvestmentValue({
      assessment:
        buildAssessment({
          destinationCertainty:
            RAID_INVESTMENT_DESTINATION_CERTAINTY
              .GUARANTEED,
        }),

      possibleState:
        buildState({
          actionType:
            'FAST_TM',
        }),
    })

  expectEqual(
    'Guaranteed destination with stochastic TM quantity remains high value',
    guaranteedDestinationWithStochasticTmCost
      .value,
    RAID_INVESTMENT_VALUE
      .HIGH_VALUE
  )

  expectEqual(
    'Guaranteed destination certainty survives value model',
    guaranteedDestinationWithStochasticTmCost
      .destinationCertainty,
    RAID_INVESTMENT_DESTINATION_CERTAINTY
      .GUARANTEED
  )

  expectTrue(
    'Guaranteed destination can still preserve stochastic TM quantity warning',
    guaranteedDestinationWithStochasticTmCost
      .reasonCodes
      .includes(
        'STOCHASTIC_RESOURCE_QUANTITY'
      )
  )

  expectEqual(
    'Stochastic TM quantity does not become stochastic destination',
    guaranteedDestinationWithStochasticTmCost
      .reasonCodes
      .includes(
        'STOCHASTIC_DESTINATION'
      ),
    false
  )

  const unavailableDestination =
    buildRaidInvestmentValue({
      assessment:
        buildAssessment({
          investmentSignal:
            RAID_INVESTMENT_SIGNAL
              .UNAVAILABLE,

          destinationCertainty:
            RAID_INVESTMENT_DESTINATION_CERTAINTY
              .UNAVAILABLE,
        }),

      possibleState:
        buildState({
          actionType:
            'SPECIAL_ACQUISITION',

          reachable:
            false,
        }),
    })

  expectEqual(
    'Unavailable destination remains unavailable',
    unavailableDestination.value,
    RAID_INVESTMENT_VALUE
      .UNAVAILABLE
  )

  expectEqual(
    'Unavailable destination certainty survives value model',
    unavailableDestination
      .destinationCertainty,
    RAID_INVESTMENT_DESTINATION_CERTAINTY
      .UNAVAILABLE
  )

  // ------------------------------------------------
  // Metadata preservation
  // ------------------------------------------------

  expectEqual(
    'Pokémon identity survives value model',
    highValue.pokemonIdentity,
    'RAYQUAZA__NORMAL'
  )

  expectEqual(
    'Possible state type survives value model',
    highValue.possibleStateType,
    'TEST_STATE'
  )

  expectEqual(
    'Performance classification survives value model',
    highValue.performance,
    RAID_INVESTMENT_PERFORMANCE
      .STRONG_IMPROVEMENT
  )

  expectEqual(
    'Investment signal survives value model',
    highValue.investmentSignal,
    RAID_INVESTMENT_SIGNAL
      .PROMISING
  )

  expectEqual(
    'Confidence survives value model',
    highValue.confidence,
    RAID_INVESTMENT_CONFIDENCE
      .HIGH
  )

  expectTrue(
    'Performance evidence survives value model',
    Boolean(
      highValue
        .performanceEvidence
    )
  )

  expectTrue(
    'Matchup coverage survives value model',
    Boolean(
      highValue
        .matchupCoverage
    )
  )

  expectTrue(
    'Full assessment remains attached',
    Boolean(
      highValue.assessment
    )
  )

  expectTrue(
    'Full cost evidence remains attached',
    Boolean(
      highValue.cost
    )
  )

  // ------------------------------------------------
  // Invalid assessment
  // ------------------------------------------------

  const missingAssessment =
    buildRaidInvestmentValue({
      assessment:
        null,

      possibleState:
        buildState(),
    })

  expectEqual(
    'Missing assessment is rejected',
    missingAssessment.status,
    RAID_INVESTMENT_VALUE_STATUS
      .INVALID_ASSESSMENT
  )

  const invalidAssessment =
    buildRaidInvestmentValue({
      assessment: {
        status:
          RAID_INVESTMENT_ASSESSMENT_STATUS
            .INVALID_EVIDENCE,
      },

      possibleState:
        buildState(),
    })

  expectEqual(
    'Invalid assessment is rejected',
    invalidAssessment.status,
    RAID_INVESTMENT_VALUE_STATUS
      .INVALID_ASSESSMENT
  )

  // ------------------------------------------------
  // Insufficient evidence
  // ------------------------------------------------

  const insufficientEvidence =
    buildRaidInvestmentValue({
      assessment: {
        status:
          RAID_INVESTMENT_ASSESSMENT_STATUS
            .INSUFFICIENT_EVIDENCE,

        pokemonIdentity:
          'RAYQUAZA__NORMAL',

        possibleStateType:
          'TEST_STATE',
      },

      possibleState:
        buildState(),
    })

  expectEqual(
    'Insufficient assessment evidence stays explicit',
    insufficientEvidence.status,
    RAID_INVESTMENT_VALUE_STATUS
      .INSUFFICIENT_EVIDENCE
  )

  // ------------------------------------------------
  // Invalid possible state
  // ------------------------------------------------

  const invalidCost =
    buildRaidInvestmentValue({
      assessment:
        buildAssessment(),

      possibleState:
        null,
    })

  expectEqual(
    'Invalid state produces invalid cost status',
    invalidCost.status,
    RAID_INVESTMENT_VALUE_STATUS
      .INVALID_COST
  )

  // ------------------------------------------------
  // Input immutability
  // ------------------------------------------------

  const assessmentFixture =
    buildAssessment()

  const stateFixture =
    buildState({
      actionType:
        'FAST_TM',
    })

  buildRaidInvestmentValue({
    assessment:
      assessmentFixture,

    possibleState:
      stateFixture,
  })

  expectEqual(
    'Assessment performance is not mutated',
    assessmentFixture
      .performance,
    RAID_INVESTMENT_PERFORMANCE
      .STRONG_IMPROVEMENT
  )

  expectEqual(
    'Assessment signal is not mutated',
    assessmentFixture
      .investmentSignal,
    RAID_INVESTMENT_SIGNAL
      .PROMISING
  )

  expectEqual(
    'Possible-state action is not mutated',
    stateFixture
      .action
      .type,
    'FAST_TM'
  )

  expectEqual(
    'Possible-state move is not mutated',
    stateFixture
      .moves
      .chargedMove1Id,
    'OUTRAGE'
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

main()