import {
  RAID_INVESTMENT_EVIDENCE_STATUS,
} from './raidInvestmentEvidence.js'

// --------------------------------------------------
// Status
// --------------------------------------------------

export const RAID_INVESTMENT_ASSESSMENT_STATUS = {
  SUCCESS:
    'SUCCESS',

  INVALID_EVIDENCE:
    'INVALID_EVIDENCE',

  INSUFFICIENT_EVIDENCE:
    'INSUFFICIENT_EVIDENCE',
}

// --------------------------------------------------
// Performance classifications
// --------------------------------------------------

export const RAID_INVESTMENT_PERFORMANCE = {
  STRONG_IMPROVEMENT:
    'STRONG_IMPROVEMENT',

  CONSISTENT_IMPROVEMENT:
    'CONSISTENT_IMPROVEMENT',

  SITUATIONAL_IMPROVEMENT:
    'SITUATIONAL_IMPROVEMENT',

  MIXED:
    'MIXED',

  NO_MEANINGFUL_CHANGE:
    'NO_MEANINGFUL_CHANGE',

  REGRESSION:
    'REGRESSION',
}

// --------------------------------------------------
// Investment signals
//
// These are NOT final recommendations.
//
// They describe how promising the evidence looks,
// while keeping feasibility and preservation risk
// explicit.
// --------------------------------------------------

export const RAID_INVESTMENT_SIGNAL = {
  PROMISING:
    'PROMISING',

  CONTEXT_DEPENDENT:
    'CONTEXT_DEPENDENT',

  LOW_VALUE:
    'LOW_VALUE',

  NEGATIVE:
    'NEGATIVE',

  UNAVAILABLE:
    'UNAVAILABLE',

  PRESERVATION_RISK:
    'PRESERVATION_RISK',
}

// --------------------------------------------------
// Evidence confidence
//
// This describes confidence in the matchup evidence.
//
// It does NOT describe the probability of obtaining
// the represented possible-state destination.
// Destination certainty is modeled separately below.
// --------------------------------------------------

export const RAID_INVESTMENT_CONFIDENCE = {
  HIGH:
    'HIGH',

  MEDIUM:
    'MEDIUM',

  LOW:
    'LOW',
}

// --------------------------------------------------
// Destination certainty
//
// This is intentionally separate from evidence
// confidence and resource-cost certainty.
//
// GUARANTEED:
// The represented final state can be intentionally
// reached through the modeled action sequence.
//
// STOCHASTIC:
// The represented exact destination depends on an
// uncontrolled outcome, such as a natural evolution
// move roll.
//
// UNAVAILABLE:
// The modeled action path cannot currently produce
// the represented destination.
//
// UNKNOWN:
// The upstream state did not provide enough certainty
// information to classify the destination.
// --------------------------------------------------

export const RAID_INVESTMENT_DESTINATION_CERTAINTY = {
  GUARANTEED:
    'GUARANTEED',

  STOCHASTIC:
    'STOCHASTIC',

  UNAVAILABLE:
    'UNAVAILABLE',

  UNKNOWN:
    'UNKNOWN',
}

// --------------------------------------------------
// V1 thresholds
//
// These are intentionally explicit.
//
// They are heuristics for interpreting evidence,
// not Pokémon GO mechanics and not permanent
// recommendation rules.
// --------------------------------------------------

export const RAID_INVESTMENT_ASSESSMENT_THRESHOLDS = {
  meaningfulGainPercent:
    3,

  strongGainPercent:
    10,

  consistentImprovementRate:
    0.75,

  situationalPeakGainPercent:
    10,

  meaningfulRegressionPercent:
    -3,

  highConfidenceCoverageRate:
    0.9,

  mediumConfidenceCoverageRate:
    0.6,

  highConfidenceMinimumMatchups:
    3,

  mediumConfidenceMinimumMatchups:
    2,
}

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function isFiniteNumber(
  value
) {
  return Number.isFinite(
    value
  )
}

function isValidEvidence(
  evidence
) {
  return (
    evidence &&
    evidence.status ===
      RAID_INVESTMENT_EVIDENCE_STATUS
        .SUCCESS &&
    Number.isFinite(
      evidence.matchupCount
    ) &&
    Number.isFinite(
      evidence.successfulMatchupCount
    ) &&
    evidence.successfulMatchupCount >
      0
  )
}

function getCoverageRate(
  evidence
) {
  if (
    !Number.isFinite(
      evidence.matchupCount
    ) ||
    evidence.matchupCount <=
      0
  ) {
    return 0
  }

  return (
    evidence.successfulMatchupCount /
    evidence.matchupCount
  )
}

function normalizeDestinationCertainty(
  evidence
) {
  const certainty =
    evidence
      ?.destinationCertainty

  if (
    certainty ===
      RAID_INVESTMENT_DESTINATION_CERTAINTY
        .GUARANTEED ||
    certainty ===
      RAID_INVESTMENT_DESTINATION_CERTAINTY
        .STOCHASTIC ||
    certainty ===
      RAID_INVESTMENT_DESTINATION_CERTAINTY
        .UNAVAILABLE ||
    certainty ===
      RAID_INVESTMENT_DESTINATION_CERTAINTY
        .UNKNOWN
  ) {
    return certainty
  }

  return RAID_INVESTMENT_DESTINATION_CERTAINTY
    .UNKNOWN
}

function classifyConfidence(
  evidence
) {
  const coverageRate =
    getCoverageRate(
      evidence
    )

  const successfulCount =
    evidence.successfulMatchupCount

  const thresholds =
    RAID_INVESTMENT_ASSESSMENT_THRESHOLDS

  if (
    coverageRate >=
      thresholds
        .highConfidenceCoverageRate &&
    successfulCount >=
      thresholds
        .highConfidenceMinimumMatchups
  ) {
    return RAID_INVESTMENT_CONFIDENCE
      .HIGH
  }

  if (
    coverageRate >=
      thresholds
        .mediumConfidenceCoverageRate &&
    successfulCount >=
      thresholds
        .mediumConfidenceMinimumMatchups
  ) {
    return RAID_INVESTMENT_CONFIDENCE
      .MEDIUM
  }

  return RAID_INVESTMENT_CONFIDENCE
    .LOW
}

function classifyPerformance(
  evidence
) {
  const thresholds =
    RAID_INVESTMENT_ASSESSMENT_THRESHOLDS

  const improvementRate =
    evidence.improvementRate

  const reductionRate =
    evidence.reductionRate

  const medianGain =
    evidence.medianPercentGain

  const averageGain =
    evidence.averagePercentGain

  const minimumGain =
    evidence.minimumPercentGain

  const maximumGain =
    evidence.maximumPercentGain

  const improvedCount =
    evidence.improvedMatchupCount

  const reducedCount =
    evidence.reducedMatchupCount

  // ------------------------------------------------
  // Clear regression
  // ------------------------------------------------

  if (
    isFiniteNumber(
      medianGain
    ) &&
    medianGain <=
      thresholds
        .meaningfulRegressionPercent &&
    isFiniteNumber(
      reductionRate
    ) &&
    reductionRate >
      0.5
  ) {
    return RAID_INVESTMENT_PERFORMANCE
      .REGRESSION
  }

  // ------------------------------------------------
  // Strong and consistent
  // ------------------------------------------------

  if (
    isFiniteNumber(
      improvementRate
    ) &&
    improvementRate >=
      thresholds
        .consistentImprovementRate &&
    isFiniteNumber(
      medianGain
    ) &&
    medianGain >=
      thresholds
        .strongGainPercent
  ) {
    return RAID_INVESTMENT_PERFORMANCE
      .STRONG_IMPROVEMENT
  }

  // ------------------------------------------------
  // Meaningful and consistent
  // ------------------------------------------------

  if (
    isFiniteNumber(
      improvementRate
    ) &&
    improvementRate >=
      thresholds
        .consistentImprovementRate &&
    isFiniteNumber(
      medianGain
    ) &&
    medianGain >=
      thresholds
        .meaningfulGainPercent
  ) {
    return RAID_INVESTMENT_PERFORMANCE
      .CONSISTENT_IMPROVEMENT
  }

  // ------------------------------------------------
  // Mixed results
  //
  // Meaningful upside exists, but there is also
  // meaningful downside across the matchup set.
  // ------------------------------------------------

  if (
    improvedCount >
      0 &&
    reducedCount >
      0 &&
    isFiniteNumber(
      minimumGain
    ) &&
    minimumGain <=
      thresholds
        .meaningfulRegressionPercent &&
    isFiniteNumber(
      maximumGain
    ) &&
    maximumGain >=
      thresholds
        .meaningfulGainPercent
  ) {
    return RAID_INVESTMENT_PERFORMANCE
      .MIXED
  }

  // ------------------------------------------------
  // Large upside, but not consistently useful
  // ------------------------------------------------

  if (
    isFiniteNumber(
      maximumGain
    ) &&
    maximumGain >=
      thresholds
        .situationalPeakGainPercent
  ) {
    return RAID_INVESTMENT_PERFORMANCE
      .SITUATIONAL_IMPROVEMENT
  }

  // ------------------------------------------------
  // Smaller but still meaningful positive evidence
  // ------------------------------------------------

  if (
    (
      isFiniteNumber(
        medianGain
      ) &&
      medianGain >=
        thresholds
          .meaningfulGainPercent
    ) ||
    (
      isFiniteNumber(
        averageGain
      ) &&
      averageGain >=
        thresholds
          .meaningfulGainPercent
    )
  ) {
    return RAID_INVESTMENT_PERFORMANCE
      .SITUATIONAL_IMPROVEMENT
  }

  // ------------------------------------------------
  // General negative evidence
  // ------------------------------------------------

  if (
    (
      isFiniteNumber(
        medianGain
      ) &&
      medianGain <=
        thresholds
          .meaningfulRegressionPercent
    ) ||
    (
      isFiniteNumber(
        averageGain
      ) &&
      averageGain <=
        thresholds
          .meaningfulRegressionPercent
    )
  ) {
    return RAID_INVESTMENT_PERFORMANCE
      .REGRESSION
  }

  // ------------------------------------------------
  // Small changes in either direction
  // ------------------------------------------------

  return RAID_INVESTMENT_PERFORMANCE
    .NO_MEANINGFUL_CHANGE
}

function buildReasonCodes({
  evidence,
  performance,
  confidence,
  destinationCertainty,
}) {
  const reasons = []

  if (
    evidence.reachable ===
    false
  ) {
    reasons.push(
      'STATE_UNREACHABLE'
    )
  }

  if (
    destinationCertainty ===
    RAID_INVESTMENT_DESTINATION_CERTAINTY
      .UNAVAILABLE
  ) {
    reasons.push(
      'DESTINATION_UNAVAILABLE'
    )
  }

  if (
    destinationCertainty ===
    RAID_INVESTMENT_DESTINATION_CERTAINTY
      .STOCHASTIC
  ) {
    reasons.push(
      'STOCHASTIC_DESTINATION'
    )
  }

  if (
    destinationCertainty ===
    RAID_INVESTMENT_DESTINATION_CERTAINTY
      .UNKNOWN
  ) {
    reasons.push(
      'UNKNOWN_DESTINATION_CERTAINTY'
    )
  }

  if (
    evidence.destroysProtectedMove ===
    true
  ) {
    reasons.push(
      'DESTROYS_PROTECTED_MOVE'
    )
  }

  if (
    confidence ===
    RAID_INVESTMENT_CONFIDENCE
      .LOW
  ) {
    reasons.push(
      'LOW_EVIDENCE_CONFIDENCE'
    )
  }

  if (
    performance ===
    RAID_INVESTMENT_PERFORMANCE
      .STRONG_IMPROVEMENT
  ) {
    reasons.push(
      'STRONG_MULTI_MATCHUP_GAIN'
    )
  }

  if (
    performance ===
    RAID_INVESTMENT_PERFORMANCE
      .CONSISTENT_IMPROVEMENT
  ) {
    reasons.push(
      'CONSISTENT_MULTI_MATCHUP_GAIN'
    )
  }

  if (
    performance ===
    RAID_INVESTMENT_PERFORMANCE
      .SITUATIONAL_IMPROVEMENT
  ) {
    reasons.push(
      'SITUATIONAL_UPSIDE'
    )
  }

  if (
    performance ===
    RAID_INVESTMENT_PERFORMANCE
      .MIXED
  ) {
    reasons.push(
      'MIXED_MATCHUP_RESULTS'
    )
  }

  if (
    performance ===
    RAID_INVESTMENT_PERFORMANCE
      .NO_MEANINGFUL_CHANGE
  ) {
    reasons.push(
      'LIMITED_PERFORMANCE_GAIN'
    )
  }

  if (
    performance ===
    RAID_INVESTMENT_PERFORMANCE
      .REGRESSION
  ) {
    reasons.push(
      'GENERAL_PERFORMANCE_REGRESSION'
    )
  }

  return reasons
}

function determineInvestmentSignal({
  evidence,
  performance,
  destinationCertainty,
}) {
  // ------------------------------------------------
  // Feasibility overrides performance promise
  // ------------------------------------------------

  if (
    evidence.reachable ===
      false ||
    destinationCertainty ===
      RAID_INVESTMENT_DESTINATION_CERTAINTY
        .UNAVAILABLE
  ) {
    return RAID_INVESTMENT_SIGNAL
      .UNAVAILABLE
  }

  // ------------------------------------------------
  // Protect valuable owned moves before treating
  // performance gain as actionable.
  // ------------------------------------------------

  if (
    evidence.destroysProtectedMove ===
    true
  ) {
    return RAID_INVESTMENT_SIGNAL
      .PRESERVATION_RISK
  }

  // ------------------------------------------------
  // Destination certainty does NOT alter performance.
  //
  // A stochastic destination can still be a genuinely
  // strong raid outcome. Its stochastic nature remains
  // explicit through destinationCertainty and the
  // reason codes, and the downstream value layer can
  // decide how that affects final investment value.
  // ------------------------------------------------

  if (
    performance ===
      RAID_INVESTMENT_PERFORMANCE
        .STRONG_IMPROVEMENT ||
    performance ===
      RAID_INVESTMENT_PERFORMANCE
        .CONSISTENT_IMPROVEMENT
  ) {
    return RAID_INVESTMENT_SIGNAL
      .PROMISING
  }

  if (
    performance ===
      RAID_INVESTMENT_PERFORMANCE
        .SITUATIONAL_IMPROVEMENT ||
    performance ===
      RAID_INVESTMENT_PERFORMANCE
        .MIXED
  ) {
    return RAID_INVESTMENT_SIGNAL
      .CONTEXT_DEPENDENT
  }

  if (
    performance ===
    RAID_INVESTMENT_PERFORMANCE
      .REGRESSION
  ) {
    return RAID_INVESTMENT_SIGNAL
      .NEGATIVE
  }

  return RAID_INVESTMENT_SIGNAL
    .LOW_VALUE
}

// --------------------------------------------------
// Public assessment
// --------------------------------------------------

export function assessRaidInvestmentEvidence(
  evidence
) {
  if (
    !evidence ||
    evidence.status ===
      RAID_INVESTMENT_EVIDENCE_STATUS
        .INVALID_MATCHUPS
  ) {
    return {
      status:
        RAID_INVESTMENT_ASSESSMENT_STATUS
          .INVALID_EVIDENCE,
    }
  }

  const destinationCertainty =
    normalizeDestinationCertainty(
      evidence
    )

  if (
    evidence.status ===
      RAID_INVESTMENT_EVIDENCE_STATUS
        .NO_SUCCESSFUL_MATCHUPS
  ) {
    return {
      status:
        RAID_INVESTMENT_ASSESSMENT_STATUS
          .INSUFFICIENT_EVIDENCE,

      pokemonIdentity:
        evidence
          .pokemonIdentity ??
        null,

      sourcePokemonIdentity:
        evidence
          .sourcePokemonIdentity ??
        null,

      resultingPokemonIdentity:
        evidence
          .resultingPokemonIdentity ??
        evidence
          .pokemonIdentity ??
        null,

      possibleStateType:
        evidence
          .possibleStateType ??
        null,

      reachable:
        evidence.reachable !==
        false,

      destinationCertainty,

      action:
        evidence.action ??
        null,

      actions:
        Array.isArray(
          evidence.actions
        )
          ? evidence.actions
          : [],

      additionalMoveAction:
        evidence
          .additionalMoveAction ??
        null,

      changes:
        evidence.changes ??
        null,

      preservation:
        evidence
          .preservation ??
        null,

      destroysProtectedMove:
        evidence
          .destroysProtectedMove ===
        true,

      matchupCount:
        evidence
          .matchupCount ??
        0,

      successfulMatchupCount:
        0,

      failedMatchupCount:
        evidence
          .failedMatchupCount ??
        0,

      evidence,
    }
  }

  if (
    !isValidEvidence(
      evidence
    )
  ) {
    return {
      status:
        RAID_INVESTMENT_ASSESSMENT_STATUS
          .INVALID_EVIDENCE,
    }
  }

  const performance =
    classifyPerformance(
      evidence
    )

  const confidence =
    classifyConfidence(
      evidence
    )

  const investmentSignal =
    determineInvestmentSignal({
      evidence,
      performance,
      destinationCertainty,
    })

  const reasonCodes =
    buildReasonCodes({
      evidence,
      performance,
      confidence,
      destinationCertainty,
    })

  const coverageRate =
    getCoverageRate(
      evidence
    )

  return {
    status:
      RAID_INVESTMENT_ASSESSMENT_STATUS
        .SUCCESS,

    pokemonIdentity:
      evidence
        .pokemonIdentity ??
      null,

    sourcePokemonIdentity:
      evidence
        .sourcePokemonIdentity ??
      null,

    resultingPokemonIdentity:
      evidence
        .resultingPokemonIdentity ??
      evidence
        .pokemonIdentity ??
      null,

    possibleStateType:
      evidence
        .possibleStateType ??
      null,

    performance,

    investmentSignal,

    confidence,

    destinationCertainty,

    reasonCodes,

    reachable:
      evidence.reachable !==
      false,

    destroysProtectedMove:
      evidence
        .destroysProtectedMove ===
      true,

    action:
      evidence.action ??
      null,

    actions:
      Array.isArray(
        evidence.actions
      )
        ? evidence.actions
        : [],

    additionalMoveAction:
      evidence
        .additionalMoveAction ??
      null,

    changes:
      evidence.changes ??
      null,

    preservation:
      evidence
        .preservation ??
      null,

    matchupCoverage: {
      total:
        evidence.matchupCount,

      successful:
        evidence.successfulMatchupCount,

      failed:
        evidence.failedMatchupCount,

      coverageRate,
    },

    performanceEvidence: {
      improvedMatchupCount:
        evidence.improvedMatchupCount,

      reducedMatchupCount:
        evidence.reducedMatchupCount,

      unchangedMatchupCount:
        evidence.unchangedMatchupCount,

      improvementRate:
        evidence.improvementRate,

      reductionRate:
        evidence.reductionRate,

      averagePercentGain:
        evidence.averagePercentGain,

      medianPercentGain:
        evidence.medianPercentGain,

      minimumPercentGain:
        evidence.minimumPercentGain,

      maximumPercentGain:
        evidence.maximumPercentGain,

      averagePerformanceMultiplier:
        evidence
          .averagePerformanceMultiplier,
    },

    evidence,
  }
}