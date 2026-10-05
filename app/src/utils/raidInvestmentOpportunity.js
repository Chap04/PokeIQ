import {
  buildRaidInvestmentEvidence,
} from './raidInvestmentEvidence.js'

import {
  assessRaidInvestmentEvidence,
  RAID_INVESTMENT_ASSESSMENT_STATUS,
  RAID_INVESTMENT_PERFORMANCE,
  RAID_INVESTMENT_SIGNAL,
  RAID_INVESTMENT_CONFIDENCE,
  RAID_INVESTMENT_DESTINATION_CERTAINTY,
} from './raidInvestmentAssessment.js'

import {
  buildRaidInvestmentValue,
  RAID_INVESTMENT_VALUE_STATUS,
  RAID_INVESTMENT_VALUE,
} from './raidInvestmentValue.js'

import {
  buildRaidPowerUpOpportunityContext,
  findRaidPowerUpOpportunityContext,
  RAID_POWER_UP_OPPORTUNITY_CONTEXT_STATUS,
} from './raidPowerUpOpportunityContext.js'

export const RAID_INVESTMENT_OPPORTUNITY_STATUS = {
  SUCCESS:
    'SUCCESS',

  INVALID_POSSIBLE_STATES:
    'INVALID_POSSIBLE_STATES',
}

export const RAID_INVESTMENT_RANK_GROUP = {
  ACTIONABLE_PROMISING:
    'ACTIONABLE_PROMISING',

  ACTIONABLE_CONTEXT_DEPENDENT:
    'ACTIONABLE_CONTEXT_DEPENDENT',

  STOCHASTIC_DESTINATION:
    'STOCHASTIC_DESTINATION',

  PRESERVATION_RISK:
    'PRESERVATION_RISK',

  UNAVAILABLE:
    'UNAVAILABLE',

  LOW_VALUE:
    'LOW_VALUE',

  NEGATIVE:
    'NEGATIVE',

  UNRESOLVED:
    'UNRESOLVED',
}

const RANK_GROUP_PRIORITY = {
  [
    RAID_INVESTMENT_RANK_GROUP
      .ACTIONABLE_PROMISING
  ]:
    1,

  [
    RAID_INVESTMENT_RANK_GROUP
      .ACTIONABLE_CONTEXT_DEPENDENT
  ]:
    2,

  [
    RAID_INVESTMENT_RANK_GROUP
      .STOCHASTIC_DESTINATION
  ]:
    3,

  [
    RAID_INVESTMENT_RANK_GROUP
      .PRESERVATION_RISK
  ]:
    4,

  [
    RAID_INVESTMENT_RANK_GROUP
      .UNAVAILABLE
  ]:
    5,

  [
    RAID_INVESTMENT_RANK_GROUP
      .LOW_VALUE
  ]:
    6,

  [
    RAID_INVESTMENT_RANK_GROUP
      .NEGATIVE
  ]:
    7,

  [
    RAID_INVESTMENT_RANK_GROUP
      .UNRESOLVED
  ]:
    8,
}

// --------------------------------------------------
// Value priority
//
// Higher number = preferred.
//
// This is intentionally categorical rather than
// assigning arbitrary numerical prices to resources.
//
// Stochastic destinations receive their own value
// priority. They remain below deterministic actionable
// value classifications and are separately protected
// by the rank-group policy.
// --------------------------------------------------

const VALUE_PRIORITY = {
  [
    RAID_INVESTMENT_VALUE
      .HIGH_VALUE
  ]:
    8,

  [
    RAID_INVESTMENT_VALUE
      .MODERATE_VALUE
  ]:
    7,

  [
    RAID_INVESTMENT_VALUE
      .PREMIUM_RESOURCE
  ]:
    6,

  [
    RAID_INVESTMENT_VALUE
      .STOCHASTIC_DESTINATION
  ]:
    5,

  [
    RAID_INVESTMENT_VALUE
      .COST_INCOMPLETE
  ]:
    4,

  [
    RAID_INVESTMENT_VALUE
      .PRESERVATION_RISK
  ]:
    3,

  [
    RAID_INVESTMENT_VALUE
      .UNAVAILABLE
  ]:
    2,

  [
    RAID_INVESTMENT_VALUE
      .LOW_VALUE
  ]:
    1,

  [
    RAID_INVESTMENT_VALUE
      .NEGATIVE
  ]:
    0,
}

const PERFORMANCE_PRIORITY = {
  [
    RAID_INVESTMENT_PERFORMANCE
      .STRONG_IMPROVEMENT
  ]:
    6,

  [
    RAID_INVESTMENT_PERFORMANCE
      .CONSISTENT_IMPROVEMENT
  ]:
    5,

  [
    RAID_INVESTMENT_PERFORMANCE
      .SITUATIONAL_IMPROVEMENT
  ]:
    4,

  [
    RAID_INVESTMENT_PERFORMANCE
      .MIXED
  ]:
    3,

  [
    RAID_INVESTMENT_PERFORMANCE
      .NO_MEANINGFUL_CHANGE
  ]:
    2,

  [
    RAID_INVESTMENT_PERFORMANCE
      .REGRESSION
  ]:
    1,
}

const CONFIDENCE_PRIORITY = {
  [
    RAID_INVESTMENT_CONFIDENCE
      .HIGH
  ]:
    3,

  [
    RAID_INVESTMENT_CONFIDENCE
      .MEDIUM
  ]:
    2,

  [
    RAID_INVESTMENT_CONFIDENCE
      .LOW
  ]:
    1,
}

// --------------------------------------------------
// General helpers
// --------------------------------------------------

function finiteOrFallback(
  value,
  fallback
) {
  return Number.isFinite(
    value
  )
    ? value
    : fallback
}

function determineRankGroup(
  assessment
) {
  if (
    !assessment ||
    assessment.status !==
      RAID_INVESTMENT_ASSESSMENT_STATUS
        .SUCCESS
  ) {
    return RAID_INVESTMENT_RANK_GROUP
      .UNRESOLVED
  }

  // ------------------------------------------------
  // Destination certainty guard
  //
  // A stochastic exact destination can still have
  // excellent theoretical performance, but it is not
  // an actionable recommendation for that exact state.
  //
  // Safety classifications still take precedence:
  // preservation risk and unavailable states remain
  // in their dedicated groups.
  // ------------------------------------------------

  if (
    assessment.investmentSignal ===
      RAID_INVESTMENT_SIGNAL
        .PRESERVATION_RISK
  ) {
    return RAID_INVESTMENT_RANK_GROUP
      .PRESERVATION_RISK
  }

  if (
    assessment.investmentSignal ===
      RAID_INVESTMENT_SIGNAL
        .UNAVAILABLE ||
    assessment.destinationCertainty ===
      RAID_INVESTMENT_DESTINATION_CERTAINTY
        .UNAVAILABLE
  ) {
    return RAID_INVESTMENT_RANK_GROUP
      .UNAVAILABLE
  }

  if (
    assessment.destinationCertainty ===
      RAID_INVESTMENT_DESTINATION_CERTAINTY
        .STOCHASTIC
  ) {
    return RAID_INVESTMENT_RANK_GROUP
      .STOCHASTIC_DESTINATION
  }

  switch (
    assessment.investmentSignal
  ) {
    case RAID_INVESTMENT_SIGNAL
      .PROMISING:
      return RAID_INVESTMENT_RANK_GROUP
        .ACTIONABLE_PROMISING

    case RAID_INVESTMENT_SIGNAL
      .CONTEXT_DEPENDENT:
      return RAID_INVESTMENT_RANK_GROUP
        .ACTIONABLE_CONTEXT_DEPENDENT

    case RAID_INVESTMENT_SIGNAL
      .PRESERVATION_RISK:
      return RAID_INVESTMENT_RANK_GROUP
        .PRESERVATION_RISK

    case RAID_INVESTMENT_SIGNAL
      .UNAVAILABLE:
      return RAID_INVESTMENT_RANK_GROUP
        .UNAVAILABLE

    case RAID_INVESTMENT_SIGNAL
      .LOW_VALUE:
      return RAID_INVESTMENT_RANK_GROUP
        .LOW_VALUE

    case RAID_INVESTMENT_SIGNAL
      .NEGATIVE:
      return RAID_INVESTMENT_RANK_GROUP
        .NEGATIVE

    default:
      return RAID_INVESTMENT_RANK_GROUP
        .UNRESOLVED
  }
}

function getValuePriority(
  valueResult
) {
  if (
    !valueResult ||
    valueResult.status !==
      RAID_INVESTMENT_VALUE_STATUS
        .SUCCESS
  ) {
    return 0
  }

  return (
    VALUE_PRIORITY[
      valueResult.value
    ] ??
    0
  )
}

function getPerformancePriority(
  assessment
) {
  return (
    PERFORMANCE_PRIORITY[
      assessment?.performance
    ] ??
    0
  )
}

function getConfidencePriority(
  assessment
) {
  return (
    CONFIDENCE_PRIORITY[
      assessment?.confidence
    ] ??
    0
  )
}

function getMedianGain(
  assessment
) {
  return finiteOrFallback(
    assessment
      ?.performanceEvidence
      ?.medianPercentGain,

    Number.NEGATIVE_INFINITY
  )
}

function getImprovementRate(
  assessment
) {
  return finiteOrFallback(
    assessment
      ?.performanceEvidence
      ?.improvementRate,

    Number.NEGATIVE_INFINITY
  )
}

function getAverageGain(
  assessment
) {
  return finiteOrFallback(
    assessment
      ?.performanceEvidence
      ?.averagePercentGain,

    Number.NEGATIVE_INFINITY
  )
}

function getMinimumGain(
  assessment
) {
  return finiteOrFallback(
    assessment
      ?.performanceEvidence
      ?.minimumPercentGain,

    Number.NEGATIVE_INFINITY
  )
}

function getCoverageRate(
  assessment
) {
  return finiteOrFallback(
    assessment
      ?.matchupCoverage
      ?.coverageRate,

    Number.NEGATIVE_INFINITY
  )
}

function compareDescending(
  first,
  second
) {
  if (
    first === second
  ) {
    return 0
  }

  return second - first
}

function isPowerUpState(
  state
) {
  return (
    state?.type ===
      'POWER_UP' ||
    state?.action?.type ===
      'POWER_UP'
  )
}

function isActionableRankGroup(
  rankGroup
) {
  return (
    rankGroup ===
      RAID_INVESTMENT_RANK_GROUP
        .ACTIONABLE_PROMISING ||
    rankGroup ===
      RAID_INVESTMENT_RANK_GROUP
        .ACTIONABLE_CONTEXT_DEPENDENT
  )
}

// --------------------------------------------------
// Power-Up Ranking Policy V1
//
// Recommended power-up checkpoints compete normally.
//
// Intermediate / non-recommended power-up checkpoints
// receive a small categorical ranking penalty.
//
// This keeps the comparator transitive:
//
// NORMAL OPPORTUNITY       = 1
// RECOMMENDED POWER-UP     = 1
// INTERMEDIATE POWER-UP    = 0
//
// The rule only applies inside the same rank group,
// because actionability / safety remains the first and
// strongest ranking criterion.
//
// This means:
//
// - a recommended power-up does NOT receive a special
//   bonus over a TM or other action;
//
// - an intermediate power-up is deprioritized behind
//   a normal opportunity in the same rank group;
//
// - a recommended power-up is preferred over an
//   intermediate power-up in the same rank group;
//
// - power-up context cannot override safety or
//   actionability classifications.
// --------------------------------------------------

function getPowerUpCheckpointPriority(
  opportunity
) {
  if (
    !isActionableRankGroup(
      opportunity?.rankGroup
    )
  ) {
    return 1
  }

  if (
    !isPowerUpState(
      opportunity?.possibleState
    )
  ) {
    return 1
  }

  const recommended =
    opportunity
      ?.powerUpContext
      ?.isRecommendedCheckpoint ===
    true

  return recommended
    ? 1
    : 0
}

export function compareRaidPowerUpCheckpointPreference(
  first,
  second
) {
  if (
    first?.rankGroup !==
    second?.rankGroup
  ) {
    return 0
  }

  const firstPriority =
    getPowerUpCheckpointPriority(
      first
    )

  const secondPriority =
    getPowerUpCheckpointPriority(
      second
    )

  return compareDescending(
    firstPriority,
    secondPriority
  )
}

// --------------------------------------------------
// Opportunity comparison
//
// Ordering:
//
// 1. Actionability / safety
// 2. Power-up checkpoint quality
// 3. Investment value
// 4. Performance classification
// 5. Confidence
// 6. Median gain
// 7. Improvement rate
// 8. Average gain
// 9. Minimum gain
// 10. Evidence coverage
// 11. Stable input order
// --------------------------------------------------

function compareOpportunities(
  first,
  second
) {
  // ------------------------------------------------
  // 1. Actionability / safety group
  // ------------------------------------------------

  const firstGroupPriority =
    RANK_GROUP_PRIORITY[
      first.rankGroup
    ] ??
    Number.MAX_SAFE_INTEGER

  const secondGroupPriority =
    RANK_GROUP_PRIORITY[
      second.rankGroup
    ] ??
    Number.MAX_SAFE_INTEGER

  if (
    firstGroupPriority !==
    secondGroupPriority
  ) {
    return (
      firstGroupPriority -
      secondGroupPriority
    )
  }

  // ------------------------------------------------
  // 2. Power-up checkpoint quality
  //
  // Intermediate checkpoints are deprioritized.
  //
  // Recommended checkpoints compete normally with
  // other investment actions.
  // ------------------------------------------------

  const powerUpCheckpointComparison =
    compareRaidPowerUpCheckpointPreference(
      first,
      second
    )

  if (
    powerUpCheckpointComparison !==
    0
  ) {
    return powerUpCheckpointComparison
  }

  // ------------------------------------------------
  // 3. Investment value
  // ------------------------------------------------

  const valueComparison =
    compareDescending(
      getValuePriority(
        first.value
      ),

      getValuePriority(
        second.value
      )
    )

  if (
    valueComparison !==
    0
  ) {
    return valueComparison
  }

  // ------------------------------------------------
  // 4. Performance classification
  // ------------------------------------------------

  const performanceComparison =
    compareDescending(
      getPerformancePriority(
        first.assessment
      ),

      getPerformancePriority(
        second.assessment
      )
    )

  if (
    performanceComparison !==
    0
  ) {
    return performanceComparison
  }

  // ------------------------------------------------
  // 5. Confidence
  // ------------------------------------------------

  const confidenceComparison =
    compareDescending(
      getConfidencePriority(
        first.assessment
      ),

      getConfidencePriority(
        second.assessment
      )
    )

  if (
    confidenceComparison !==
    0
  ) {
    return confidenceComparison
  }

  // ------------------------------------------------
  // 6. Median gain
  // ------------------------------------------------

  const medianComparison =
    compareDescending(
      getMedianGain(
        first.assessment
      ),

      getMedianGain(
        second.assessment
      )
    )

  if (
    medianComparison !==
    0
  ) {
    return medianComparison
  }

  // ------------------------------------------------
  // 7. Improvement rate
  // ------------------------------------------------

  const improvementRateComparison =
    compareDescending(
      getImprovementRate(
        first.assessment
      ),

      getImprovementRate(
        second.assessment
      )
    )

  if (
    improvementRateComparison !==
    0
  ) {
    return improvementRateComparison
  }

  // ------------------------------------------------
  // 8. Average gain
  // ------------------------------------------------

  const averageComparison =
    compareDescending(
      getAverageGain(
        first.assessment
      ),

      getAverageGain(
        second.assessment
      )
    )

  if (
    averageComparison !==
    0
  ) {
    return averageComparison
  }

  // ------------------------------------------------
  // 9. Minimum gain
  // ------------------------------------------------

  const minimumComparison =
    compareDescending(
      getMinimumGain(
        first.assessment
      ),

      getMinimumGain(
        second.assessment
      )
    )

  if (
    minimumComparison !==
    0
  ) {
    return minimumComparison
  }

  // ------------------------------------------------
  // 10. Evidence coverage
  // ------------------------------------------------

  const coverageComparison =
    compareDescending(
      getCoverageRate(
        first.assessment
      ),

      getCoverageRate(
        second.assessment
      )
    )

  if (
    coverageComparison !==
    0
  ) {
    return coverageComparison
  }

  // ------------------------------------------------
  // 11. Stable input order
  // ------------------------------------------------

  return (
    first.originalIndex -
    second.originalIndex
  )
}

// --------------------------------------------------
// Build one opportunity
// --------------------------------------------------

function buildOpportunity({
  candidate,
  currentState,
  possibleState,
  matchups,
  moves,
  combatData,
  originalIndex,
  powerUpContextResult,
}) {
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

  const rankGroup =
    determineRankGroup(
      assessment
    )

  const powerUpContext =
    findRaidPowerUpOpportunityContext({
      contextResult:
        powerUpContextResult,

      possibleState,
    })

  return {
    originalIndex,

    pokemonIdentity:
      candidate
        ?.pokemonIdentity ??
      null,

    possibleStateType:
      possibleState
        ?.type ??
      null,

    destinationCertainty:
      assessment
        ?.destinationCertainty ??
      RAID_INVESTMENT_DESTINATION_CERTAINTY
        .UNKNOWN,

    possibleState,

    evidence,

    assessment,

    value,

    valueClassification:
      value.status ===
      RAID_INVESTMENT_VALUE_STATUS
        .SUCCESS
        ? value.value
        : null,

    resourceBurden:
      value.status ===
      RAID_INVESTMENT_VALUE_STATUS
        .SUCCESS
        ? value.resourceBurden
        : null,

    cost:
      value.status ===
      RAID_INVESTMENT_VALUE_STATUS
        .SUCCESS
        ? value.cost
        : null,

    powerUpContext,

    rankGroup,

    rankGroupPriority:
      RANK_GROUP_PRIORITY[
        rankGroup
      ] ??
      Number.MAX_SAFE_INTEGER,

    valuePriority:
      getValuePriority(
        value
      ),
  }
}

// --------------------------------------------------
// Public API
// --------------------------------------------------

export function rankRaidInvestmentOpportunities({
  candidate,
  currentState,
  possibleStates,
  matchups,
  moves,
  combatData,
}) {
  if (
    !Array.isArray(
      possibleStates
    )
  ) {
    return {
      status:
        RAID_INVESTMENT_OPPORTUNITY_STATUS
          .INVALID_POSSIBLE_STATES,

      opportunities: [],

      rankedOpportunities: [],
    }
  }

  // ------------------------------------------------
  // Build power-up progression context once.
  //
  // The efficiency / stopping-point system must see
  // the entire progression rather than evaluating
  // each target independently.
  // ------------------------------------------------

  const powerUpStates =
    possibleStates.filter(
      isPowerUpState
    )

  let powerUpContextResult =
    null

  if (
    powerUpStates.length >
    0
  ) {
    powerUpContextResult =
      buildRaidPowerUpOpportunityContext({
        candidate,

        currentState,

        powerUpStates,

        matchups,

        moves,

        combatData,
      })
  }

  const hasPowerUpContext =
    powerUpContextResult?.status ===
    RAID_POWER_UP_OPPORTUNITY_CONTEXT_STATUS
      .SUCCESS

  const opportunities =
    possibleStates.map(
      (
        possibleState,
        originalIndex
      ) =>
        buildOpportunity({
          candidate,

          currentState,

          possibleState,

          matchups,

          moves,

          combatData,

          originalIndex,

          powerUpContextResult:
            hasPowerUpContext
              ? powerUpContextResult
              : null,
        })
    )

  const rankedOpportunities =
    [...opportunities].sort(
      compareOpportunities
    )

  const rankedWithPositions =
    rankedOpportunities.map(
      (
        opportunity,
        index
      ) => ({
        ...opportunity,

        rank:
          index + 1,
      })
    )

  const actionableOpportunities =
    rankedWithPositions.filter(
      (opportunity) =>
        opportunity.rankGroup ===
          RAID_INVESTMENT_RANK_GROUP
            .ACTIONABLE_PROMISING ||
        opportunity.rankGroup ===
          RAID_INVESTMENT_RANK_GROUP
            .ACTIONABLE_CONTEXT_DEPENDENT
    )

  const promisingOpportunities =
    rankedWithPositions.filter(
      (opportunity) =>
        opportunity.rankGroup ===
        RAID_INVESTMENT_RANK_GROUP
          .ACTIONABLE_PROMISING
    )

  const stochasticDestinationOpportunities =
    rankedWithPositions.filter(
      (opportunity) =>
        opportunity.rankGroup ===
        RAID_INVESTMENT_RANK_GROUP
          .STOCHASTIC_DESTINATION
    )

  const preservationRiskOpportunities =
    rankedWithPositions.filter(
      (opportunity) =>
        opportunity.rankGroup ===
        RAID_INVESTMENT_RANK_GROUP
          .PRESERVATION_RISK
    )

  const unavailableOpportunities =
    rankedWithPositions.filter(
      (opportunity) =>
        opportunity.rankGroup ===
        RAID_INVESTMENT_RANK_GROUP
          .UNAVAILABLE
    )

  const highValueOpportunities =
    actionableOpportunities.filter(
      (opportunity) =>
        opportunity.valueClassification ===
        RAID_INVESTMENT_VALUE
          .HIGH_VALUE
    )

  const moderateValueOpportunities =
    actionableOpportunities.filter(
      (opportunity) =>
        opportunity.valueClassification ===
        RAID_INVESTMENT_VALUE
          .MODERATE_VALUE
    )

  const premiumResourceOpportunities =
    actionableOpportunities.filter(
      (opportunity) =>
        opportunity.valueClassification ===
        RAID_INVESTMENT_VALUE
          .PREMIUM_RESOURCE
    )

  const costIncompleteOpportunities =
    actionableOpportunities.filter(
      (opportunity) =>
        opportunity.valueClassification ===
        RAID_INVESTMENT_VALUE
          .COST_INCOMPLETE
    )

  const powerUpOpportunities =
    rankedWithPositions.filter(
      (opportunity) =>
        isPowerUpState(
          opportunity.possibleState
        )
    )

  const recommendedPowerUpOpportunities =
    powerUpOpportunities.filter(
      (opportunity) =>
        opportunity
          .powerUpContext
          ?.isRecommendedCheckpoint ===
        true
    )

  const ordinaryStoppingPointOpportunity =
    recommendedPowerUpOpportunities.find(
      (opportunity) =>
        opportunity
          .powerUpContext
          ?.isOrdinaryStoppingPoint ===
        true
    ) ??
    null

  const premiumPowerUpOpportunity =
    recommendedPowerUpOpportunities.find(
      (opportunity) =>
        opportunity
          .powerUpContext
          ?.isPremiumOpportunity ===
        true
    ) ??
    null

  const topOpportunity =
    rankedWithPositions[0] ??
    null

  const topActionableOpportunity =
    actionableOpportunities[0] ??
    null

  const topHighValueOpportunity =
    highValueOpportunities[0] ??
    null

  return {
    status:
      RAID_INVESTMENT_OPPORTUNITY_STATUS
        .SUCCESS,

    pokemonIdentity:
      candidate
        ?.pokemonIdentity ??
      null,

    opportunityCount:
      opportunities.length,

    opportunities,

    rankedOpportunities:
      rankedWithPositions,

    actionableOpportunities,

    promisingOpportunities,

    stochasticDestinationOpportunities,

    preservationRiskOpportunities,

    unavailableOpportunities,

    highValueOpportunities,

    moderateValueOpportunities,

    premiumResourceOpportunities,

    costIncompleteOpportunities,

    powerUpContextResult:
      hasPowerUpContext
        ? powerUpContextResult
        : null,

    powerUpOpportunities,

    recommendedPowerUpOpportunities,

    ordinaryStoppingPointOpportunity,

    premiumPowerUpOpportunity,

    hasPowerUpContext,

    topOpportunity,

    topActionableOpportunity,

    topHighValueOpportunity,
  }
}