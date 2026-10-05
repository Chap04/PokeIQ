import {
  assessRaidInvestmentEvidence,
  RAID_INVESTMENT_ASSESSMENT_STATUS,
  RAID_INVESTMENT_PERFORMANCE,
  RAID_INVESTMENT_SIGNAL,
  RAID_INVESTMENT_CONFIDENCE,
} from '../src/utils/raidInvestmentAssessment.js'

import {
  RAID_INVESTMENT_EVIDENCE_STATUS,
} from '../src/utils/raidInvestmentEvidence.js'

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
// Fixture builder
// --------------------------------------------------

function buildEvidence({
  reachable = true,
  destroysProtectedMove = false,

  matchupCount = 4,
  successfulMatchupCount = 4,
  failedMatchupCount = 0,

  improvedMatchupCount = 4,
  reducedMatchupCount = 0,
  unchangedMatchupCount = 0,

  improvementRate = 1,
  reductionRate = 0,

  averagePercentGain = 12,
  medianPercentGain = 12,

  minimumPercentGain = 8,
  maximumPercentGain = 16,

  averagePerformanceMultiplier = 1.12,
} = {}) {
  return {
    status:
      RAID_INVESTMENT_EVIDENCE_STATUS
        .SUCCESS,

    pokemonIdentity:
      'RAYQUAZA__NORMAL',

    possibleStateType:
      'MOVESET_CHANGE',

    reachable,

    action: {
      type:
        'CHARGED_TM',
    },

    additionalMoveAction:
      null,

    changes: {
      chargedMove1Changed:
        true,
    },

    preservation: {
      destroysProtectedMove,
    },

    destroysProtectedMove,

    matchupCount,

    successfulMatchupCount,

    failedMatchupCount,

    improvedMatchupCount,

    reducedMatchupCount,

    unchangedMatchupCount,

    improvementRate,

    reductionRate,

    averagePercentGain,

    medianPercentGain,

    minimumPercentGain,

    maximumPercentGain,

    averagePerformanceMultiplier,

    evidence: [],

    successfulEvidence: [],

    failedEvidence: [],
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
    'RAID INVESTMENT ASSESSMENT VALIDATION'
  )
  console.log(
    '================================'
  )
  console.log('')

  // ------------------------------------------------
  // Strong improvement
  // ------------------------------------------------

  const strong =
    assessRaidInvestmentEvidence(
      buildEvidence()
    )

  expectEqual(
    'Strong evidence assessment succeeds',
    strong.status,
    RAID_INVESTMENT_ASSESSMENT_STATUS
      .SUCCESS
  )

  expectEqual(
    'Strong evidence is classified correctly',
    strong.performance,
    RAID_INVESTMENT_PERFORMANCE
      .STRONG_IMPROVEMENT
  )

  expectEqual(
    'Strong evidence produces promising signal',
    strong.investmentSignal,
    RAID_INVESTMENT_SIGNAL
      .PROMISING
  )

  expectEqual(
    'Strong complete evidence has high confidence',
    strong.confidence,
    RAID_INVESTMENT_CONFIDENCE
      .HIGH
  )

  expectTrue(
    'Strong assessment explains multi-matchup gain',
    strong.reasonCodes.includes(
      'STRONG_MULTI_MATCHUP_GAIN'
    )
  )

  // ------------------------------------------------
  // Consistent improvement
  // ------------------------------------------------

  const consistent =
    assessRaidInvestmentEvidence(
      buildEvidence({
        averagePercentGain:
          6,

        medianPercentGain:
          6,

        minimumPercentGain:
          2,

        maximumPercentGain:
          9,

        averagePerformanceMultiplier:
          1.06,
      })
    )

  expectEqual(
    'Consistent gain is classified correctly',
    consistent.performance,
    RAID_INVESTMENT_PERFORMANCE
      .CONSISTENT_IMPROVEMENT
  )

  expectEqual(
    'Consistent gain remains promising',
    consistent.investmentSignal,
    RAID_INVESTMENT_SIGNAL
      .PROMISING
  )

  expectTrue(
    'Consistent gain reason is included',
    consistent.reasonCodes.includes(
      'CONSISTENT_MULTI_MATCHUP_GAIN'
    )
  )

  // ------------------------------------------------
  // Situational improvement
  // ------------------------------------------------

  const situational =
    assessRaidInvestmentEvidence(
      buildEvidence({
        improvedMatchupCount:
          1,

        reducedMatchupCount:
          0,

        unchangedMatchupCount:
          3,

        improvementRate:
          0.25,

        reductionRate:
          0,

        averagePercentGain:
          3,

        medianPercentGain:
          0,

        minimumPercentGain:
          0,

        maximumPercentGain:
          12,
      })
    )

  expectEqual(
    'Situational upside is classified correctly',
    situational.performance,
    RAID_INVESTMENT_PERFORMANCE
      .SITUATIONAL_IMPROVEMENT
  )

  expectEqual(
    'Situational improvement is context dependent',
    situational.investmentSignal,
    RAID_INVESTMENT_SIGNAL
      .CONTEXT_DEPENDENT
  )

  // ------------------------------------------------
  // Mixed result
  // ------------------------------------------------

  const mixed =
    assessRaidInvestmentEvidence(
      buildEvidence({
        improvedMatchupCount:
          2,

        reducedMatchupCount:
          2,

        unchangedMatchupCount:
          0,

        improvementRate:
          0.5,

        reductionRate:
          0.5,

        averagePercentGain:
          1,

        medianPercentGain:
          1,

        minimumPercentGain:
          -8,

        maximumPercentGain:
          10,
      })
    )

  expectEqual(
    'Mixed evidence is classified correctly',
    mixed.performance,
    RAID_INVESTMENT_PERFORMANCE
      .MIXED
  )

  expectEqual(
    'Mixed evidence is context dependent',
    mixed.investmentSignal,
    RAID_INVESTMENT_SIGNAL
      .CONTEXT_DEPENDENT
  )

  expectTrue(
    'Mixed evidence reason is included',
    mixed.reasonCodes.includes(
      'MIXED_MATCHUP_RESULTS'
    )
  )

  // ------------------------------------------------
  // No meaningful change
  // ------------------------------------------------

  const lowValue =
    assessRaidInvestmentEvidence(
      buildEvidence({
        improvedMatchupCount:
          2,

        reducedMatchupCount:
          1,

        unchangedMatchupCount:
          1,

        improvementRate:
          0.5,

        reductionRate:
          0.25,

        averagePercentGain:
          1,

        medianPercentGain:
          1,

        minimumPercentGain:
          -2,

        maximumPercentGain:
          2,
      })
    )

  expectEqual(
    'Small changes are classified as no meaningful change',
    lowValue.performance,
    RAID_INVESTMENT_PERFORMANCE
      .NO_MEANINGFUL_CHANGE
  )

  expectEqual(
    'No meaningful change produces low-value signal',
    lowValue.investmentSignal,
    RAID_INVESTMENT_SIGNAL
      .LOW_VALUE
  )

  // ------------------------------------------------
  // Regression
  // ------------------------------------------------

  const regression =
    assessRaidInvestmentEvidence(
      buildEvidence({
        improvedMatchupCount:
          0,

        reducedMatchupCount:
          4,

        unchangedMatchupCount:
          0,

        improvementRate:
          0,

        reductionRate:
          1,

        averagePercentGain:
          -8,

        medianPercentGain:
          -8,

        minimumPercentGain:
          -12,

        maximumPercentGain:
          -4,

        averagePerformanceMultiplier:
          0.92,
      })
    )

  expectEqual(
    'Regression is classified correctly',
    regression.performance,
    RAID_INVESTMENT_PERFORMANCE
      .REGRESSION
  )

  expectEqual(
    'Regression produces negative signal',
    regression.investmentSignal,
    RAID_INVESTMENT_SIGNAL
      .NEGATIVE
  )

  expectTrue(
    'Regression reason is included',
    regression.reasonCodes.includes(
      'GENERAL_PERFORMANCE_REGRESSION'
    )
  )

  // ------------------------------------------------
  // Unreachable state
  // ------------------------------------------------

  const unreachable =
    assessRaidInvestmentEvidence(
      buildEvidence({
        reachable:
          false,
      })
    )

  expectEqual(
    'Unreachable strong state still keeps performance classification',
    unreachable.performance,
    RAID_INVESTMENT_PERFORMANCE
      .STRONG_IMPROVEMENT
  )

  expectEqual(
    'Unreachable state produces unavailable signal',
    unreachable.investmentSignal,
    RAID_INVESTMENT_SIGNAL
      .UNAVAILABLE
  )

  expectEqual(
    'Reachability remains false',
    unreachable.reachable,
    false
  )

  expectTrue(
    'Unreachable reason is included',
    unreachable.reasonCodes.includes(
      'STATE_UNREACHABLE'
    )
  )

  // ------------------------------------------------
  // Protected move destruction
  // ------------------------------------------------

  const protectedMove =
    assessRaidInvestmentEvidence(
      buildEvidence({
        destroysProtectedMove:
          true,
      })
    )

  expectEqual(
    'Protected move risk does not erase performance evidence',
    protectedMove.performance,
    RAID_INVESTMENT_PERFORMANCE
      .STRONG_IMPROVEMENT
  )

  expectEqual(
    'Protected move destruction produces preservation-risk signal',
    protectedMove.investmentSignal,
    RAID_INVESTMENT_SIGNAL
      .PRESERVATION_RISK
  )

  expectEqual(
    'Protected move destruction remains explicit',
    protectedMove.destroysProtectedMove,
    true
  )

  expectTrue(
    'Protected move reason is included',
    protectedMove.reasonCodes.includes(
      'DESTROYS_PROTECTED_MOVE'
    )
  )

  // ------------------------------------------------
  // Medium confidence
  // ------------------------------------------------

  const mediumConfidence =
    assessRaidInvestmentEvidence(
      buildEvidence({
        matchupCount:
          4,

        successfulMatchupCount:
          3,

        failedMatchupCount:
          1,
      })
    )

  expectEqual(
    'Partial but useful evidence gets medium confidence',
    mediumConfidence.confidence,
    RAID_INVESTMENT_CONFIDENCE
      .MEDIUM
  )

  expectEqual(
    'Coverage total is preserved',
    mediumConfidence
      .matchupCoverage
      .total,
    4
  )

  expectEqual(
    'Coverage successful count is preserved',
    mediumConfidence
      .matchupCoverage
      .successful,
    3
  )

  expectEqual(
    'Coverage failed count is preserved',
    mediumConfidence
      .matchupCoverage
      .failed,
    1
  )

  // ------------------------------------------------
  // Low confidence
  // ------------------------------------------------

  const lowConfidence =
    assessRaidInvestmentEvidence(
      buildEvidence({
        matchupCount:
          5,

        successfulMatchupCount:
          1,

        failedMatchupCount:
          4,

        improvedMatchupCount:
          1,

        reducedMatchupCount:
          0,

        unchangedMatchupCount:
          0,

        improvementRate:
          1,

        reductionRate:
          0,
      })
    )

  expectEqual(
    'Sparse evidence gets low confidence',
    lowConfidence.confidence,
    RAID_INVESTMENT_CONFIDENCE
      .LOW
  )

  expectTrue(
    'Low-confidence reason is included',
    lowConfidence.reasonCodes.includes(
      'LOW_EVIDENCE_CONFIDENCE'
    )
  )

  // ------------------------------------------------
  // Metadata preservation
  // ------------------------------------------------

  expectEqual(
    'Action metadata survives assessment',
    strong
      ?.action
      ?.type,
    'CHARGED_TM'
  )

  expectEqual(
    'Pokémon identity survives assessment',
    strong.pokemonIdentity,
    'RAYQUAZA__NORMAL'
  )

  expectEqual(
    'Possible state type survives assessment',
    strong.possibleStateType,
    'MOVESET_CHANGE'
  )

  expectEqual(
    'Average percent gain survives assessment',
    strong
      .performanceEvidence
      .averagePercentGain,
    12
  )

  expectEqual(
    'Median percent gain survives assessment',
    strong
      .performanceEvidence
      .medianPercentGain,
    12
  )

  // ------------------------------------------------
  // Invalid evidence
  // ------------------------------------------------

  const invalid =
    assessRaidInvestmentEvidence(
      null
    )

  expectEqual(
    'Missing evidence is rejected',
    invalid.status,
    RAID_INVESTMENT_ASSESSMENT_STATUS
      .INVALID_EVIDENCE
  )

  const invalidStatus =
    assessRaidInvestmentEvidence({
      status:
        RAID_INVESTMENT_EVIDENCE_STATUS
          .INVALID_MATCHUPS,
    })

  expectEqual(
    'Invalid matchup evidence is rejected',
    invalidStatus.status,
    RAID_INVESTMENT_ASSESSMENT_STATUS
      .INVALID_EVIDENCE
  )

  // ------------------------------------------------
  // No successful evidence
  // ------------------------------------------------

  const insufficient =
    assessRaidInvestmentEvidence({
      status:
        RAID_INVESTMENT_EVIDENCE_STATUS
          .NO_SUCCESSFUL_MATCHUPS,

      pokemonIdentity:
        'RAYQUAZA__NORMAL',

      possibleStateType:
        'MOVESET_CHANGE',

      matchupCount:
        3,

      successfulMatchupCount:
        0,

      failedMatchupCount:
        3,
    })

  expectEqual(
    'No successful matchups produces insufficient evidence status',
    insufficient.status,
    RAID_INVESTMENT_ASSESSMENT_STATUS
      .INSUFFICIENT_EVIDENCE
  )

  expectEqual(
    'Insufficient evidence preserves failed count',
    insufficient.failedMatchupCount,
    3
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