import {
  buildRaidInvestmentCost,
  RAID_INVESTMENT_COST_STATUS,
  RAID_INVESTMENT_COST_CERTAINTY,
  RAID_INVESTMENT_RESOURCE,
} from './raidInvestmentCost.js'

import {
  RAID_INVESTMENT_ASSESSMENT_STATUS,
  RAID_INVESTMENT_PERFORMANCE,
  RAID_INVESTMENT_SIGNAL,
  RAID_INVESTMENT_DESTINATION_CERTAINTY,
} from './raidInvestmentAssessment.js'

// --------------------------------------------------
// Status
// --------------------------------------------------

export const RAID_INVESTMENT_VALUE_STATUS = {
  SUCCESS:
    'SUCCESS',

  INVALID_ASSESSMENT:
    'INVALID_ASSESSMENT',

  INVALID_COST:
    'INVALID_COST',

  INSUFFICIENT_EVIDENCE:
    'INSUFFICIENT_EVIDENCE',
}

// --------------------------------------------------
// Value classifications
//
// These are intentionally categorical.
//
// V1 does NOT assign arbitrary point values to:
// - TMs
// - Elite TMs
// - Stardust
// - Candy
// - Candy XL
// - performance gains
//
// That allows us to reason about investment value
// without pretending those resources are universally
// interchangeable.
//
// Power-up extension:
//
// Stardust + ordinary Candy are currently treated as
// ordinary resources.
//
// Candy XL is treated as a premium raid-investment
// resource because it represents the Level 40+
// investment tier.
//
// A later cost-efficiency layer can distinguish
// different ordinary Stardust/Candy investments
// without collapsing resources into arbitrary points.
// --------------------------------------------------

export const RAID_INVESTMENT_VALUE = {
  HIGH_VALUE:
    'HIGH_VALUE',

  MODERATE_VALUE:
    'MODERATE_VALUE',

  PREMIUM_RESOURCE:
    'PREMIUM_RESOURCE',

  STOCHASTIC_DESTINATION:
    'STOCHASTIC_DESTINATION',

  COST_INCOMPLETE:
    'COST_INCOMPLETE',

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
// Resource burden
// --------------------------------------------------

export const RAID_INVESTMENT_RESOURCE_BURDEN = {
  NONE:
    'NONE',

  ORDINARY:
    'ORDINARY',

  PREMIUM:
    'PREMIUM',

  INCOMPLETE:
    'INCOMPLETE',
}

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function hasResource(
  cost,
  resource
) {
  return (
    cost?.requirements ?? []
  ).some(
    (requirement) =>
      requirement.resource ===
      resource
  )
}

function usesEliteResource(
  cost
) {
  return (
    hasResource(
      cost,
      RAID_INVESTMENT_RESOURCE
        .ELITE_FAST_TM
    ) ||
    hasResource(
      cost,
      RAID_INVESTMENT_RESOURCE
        .ELITE_CHARGED_TM
    )
  )
}

function usesCandyXL(
  cost
) {
  return hasResource(
    cost,
    RAID_INVESTMENT_RESOURCE
      .CANDY_XL
  )
}

function usesPowerUpResource(
  cost
) {
  return (
    hasResource(
      cost,
      RAID_INVESTMENT_RESOURCE
        .STARDUST
    ) ||
    hasResource(
      cost,
      RAID_INVESTMENT_RESOURCE
        .CANDY
    ) ||
    hasResource(
      cost,
      RAID_INVESTMENT_RESOURCE
        .CANDY_XL
    )
  )
}

function usesOrdinaryTm(
  cost
) {
  return (
    hasResource(
      cost,
      RAID_INVESTMENT_RESOURCE
        .FAST_TM
    ) ||
    hasResource(
      cost,
      RAID_INVESTMENT_RESOURCE
        .CHARGED_TM
    )
  )
}

function hasStochasticResourceCost(
  cost
) {
  if (
    cost?.summary?.hasStochasticCost ===
    true
  ) {
    return true
  }

  return (
    cost?.requirements ?? []
  ).some(
    (requirement) =>
      requirement.stochastic ===
      true
  )
}

function determineResourceBurden(
  cost
) {
  if (
    cost.certainty ===
      RAID_INVESTMENT_COST_CERTAINTY
        .INCOMPLETE
  ) {
    return RAID_INVESTMENT_RESOURCE_BURDEN
      .INCOMPLETE
  }

  if (
    usesEliteResource(
      cost
    ) ||
    usesCandyXL(
      cost
    )
  ) {
    return RAID_INVESTMENT_RESOURCE_BURDEN
      .PREMIUM
  }

  if (
    usesOrdinaryTm(
      cost
    ) ||
    usesPowerUpResource(
      cost
    )
  ) {
    return RAID_INVESTMENT_RESOURCE_BURDEN
      .ORDINARY
  }

  if (
    cost.requirements.length ===
    0
  ) {
    return RAID_INVESTMENT_RESOURCE_BURDEN
      .NONE
  }

  return RAID_INVESTMENT_RESOURCE_BURDEN
    .ORDINARY
}

function determineValueClassification({
  assessment,
  resourceBurden,
}) {
  // ------------------------------------------------
  // Feasibility overrides investment value.
  //
  // Performance classification remains preserved
  // separately in the result.
  // ------------------------------------------------

  if (
    assessment.investmentSignal ===
    RAID_INVESTMENT_SIGNAL
      .UNAVAILABLE
  ) {
    return RAID_INVESTMENT_VALUE
      .UNAVAILABLE
  }

  if (
    assessment.investmentSignal ===
    RAID_INVESTMENT_SIGNAL
      .PRESERVATION_RISK
  ) {
    return RAID_INVESTMENT_VALUE
      .PRESERVATION_RISK
  }

  // ------------------------------------------------
  // Negative or negligible performance should not
  // become valuable simply because the action is
  // cheap.
  // ------------------------------------------------

  if (
    assessment.performance ===
      RAID_INVESTMENT_PERFORMANCE
        .REGRESSION ||
    assessment.investmentSignal ===
      RAID_INVESTMENT_SIGNAL
        .NEGATIVE
  ) {
    return RAID_INVESTMENT_VALUE
      .NEGATIVE
  }

  if (
    assessment.performance ===
      RAID_INVESTMENT_PERFORMANCE
        .NO_MEANINGFUL_CHANGE ||
    assessment.investmentSignal ===
      RAID_INVESTMENT_SIGNAL
        .LOW_VALUE
  ) {
    return RAID_INVESTMENT_VALUE
      .LOW_VALUE
  }

  // ------------------------------------------------
  // Incomplete cost information must remain
  // explicit.
  // ------------------------------------------------

  if (
    resourceBurden ===
    RAID_INVESTMENT_RESOURCE_BURDEN
      .INCOMPLETE
  ) {
    return RAID_INVESTMENT_VALUE
      .COST_INCOMPLETE
  }

  // ------------------------------------------------
  // A stochastic exact destination must never be
  // presented as guaranteed high/moderate value.
  //
  // This classification describes destination risk,
  // not resource-cost randomness. A normal TM can
  // have stochastic quantity while still guaranteeing
  // the target destination eventually.
  // ------------------------------------------------

  if (
    assessment.destinationCertainty ===
    RAID_INVESTMENT_DESTINATION_CERTAINTY
      .STOCHASTIC
  ) {
    return RAID_INVESTMENT_VALUE
      .STOCHASTIC_DESTINATION
  }

  // ------------------------------------------------
  // Premium resources remain explicit.
  //
  // This includes:
  // - Elite TMs
  // - Candy XL
  //
  // We do not call these bad investments. We simply
  // avoid treating them as equivalent to ordinary
  // TMs, Stardust, or normal Candy.
  // ------------------------------------------------

  if (
    resourceBurden ===
    RAID_INVESTMENT_RESOURCE_BURDEN
      .PREMIUM
  ) {
    return RAID_INVESTMENT_VALUE
      .PREMIUM_RESOURCE
  }

  // ------------------------------------------------
  // Strong or consistent gains with no premium or
  // incomplete resource burden are high value.
  // ------------------------------------------------

  if (
    assessment.performance ===
      RAID_INVESTMENT_PERFORMANCE
        .STRONG_IMPROVEMENT ||
    assessment.performance ===
      RAID_INVESTMENT_PERFORMANCE
        .CONSISTENT_IMPROVEMENT
  ) {
    return RAID_INVESTMENT_VALUE
      .HIGH_VALUE
  }

  // ------------------------------------------------
  // Situational or mixed gains can still be useful.
  // ------------------------------------------------

  if (
    assessment.performance ===
      RAID_INVESTMENT_PERFORMANCE
        .SITUATIONAL_IMPROVEMENT ||
    assessment.performance ===
      RAID_INVESTMENT_PERFORMANCE
        .MIXED
  ) {
    return RAID_INVESTMENT_VALUE
      .MODERATE_VALUE
  }

  return RAID_INVESTMENT_VALUE
    .LOW_VALUE
}

function buildReasonCodes({
  assessment,
  cost,
  resourceBurden,
  value,
}) {
  const reasons = []

  if (
    value ===
    RAID_INVESTMENT_VALUE
      .HIGH_VALUE
  ) {
    reasons.push(
      'STRONG_VALUE_WITHOUT_PREMIUM_COST'
    )
  }

  if (
    value ===
    RAID_INVESTMENT_VALUE
      .MODERATE_VALUE
  ) {
    reasons.push(
      'USEFUL_BUT_CONTEXT_DEPENDENT'
    )
  }

  if (
    value ===
    RAID_INVESTMENT_VALUE
      .PREMIUM_RESOURCE
  ) {
    reasons.push(
      'REQUIRES_PREMIUM_RESOURCE'
    )
  }

  if (
    value ===
    RAID_INVESTMENT_VALUE
      .STOCHASTIC_DESTINATION
  ) {
    reasons.push(
      'EXACT_DESTINATION_NOT_GUARANTEED'
    )
  }

  if (
    value ===
    RAID_INVESTMENT_VALUE
      .COST_INCOMPLETE
  ) {
    reasons.push(
      'RESOURCE_COST_INCOMPLETE'
    )
  }

  if (
    value ===
    RAID_INVESTMENT_VALUE
      .LOW_VALUE
  ) {
    reasons.push(
      'LIMITED_VALUE_FOR_CHANGE'
    )
  }

  if (
    value ===
    RAID_INVESTMENT_VALUE
      .NEGATIVE
  ) {
    reasons.push(
      'PERFORMANCE_REGRESSION'
    )
  }

  if (
    value ===
    RAID_INVESTMENT_VALUE
      .UNAVAILABLE
  ) {
    reasons.push(
      'STATE_UNAVAILABLE'
    )
  }

  if (
    value ===
    RAID_INVESTMENT_VALUE
      .PRESERVATION_RISK
  ) {
    reasons.push(
      'PROTECTED_MOVE_AT_RISK'
    )
  }

  if (
    assessment.destinationCertainty ===
    RAID_INVESTMENT_DESTINATION_CERTAINTY
      .STOCHASTIC
  ) {
    reasons.push(
      'STOCHASTIC_DESTINATION'
    )
  }

  if (
    assessment.destinationCertainty ===
    RAID_INVESTMENT_DESTINATION_CERTAINTY
      .UNKNOWN
  ) {
    reasons.push(
      'UNKNOWN_DESTINATION_CERTAINTY'
    )
  }

  // ------------------------------------------------
  // Stochastic cost is a component-level property.
  // ------------------------------------------------

  if (
    hasStochasticResourceCost(
      cost
    )
  ) {
    reasons.push(
      'STOCHASTIC_RESOURCE_QUANTITY'
    )
  }

  if (
    usesEliteResource(
      cost
    )
  ) {
    reasons.push(
      'ELITE_TM_REQUIRED'
    )
  }

  if (
    usesCandyXL(
      cost
    )
  ) {
    reasons.push(
      'CANDY_XL_REQUIRED'
    )
  }

  if (
    usesPowerUpResource(
      cost
    )
  ) {
    reasons.push(
      'POWER_UP_RESOURCES_REQUIRED'
    )
  }

  if (
    resourceBurden ===
    RAID_INVESTMENT_RESOURCE_BURDEN
      .NONE
  ) {
    reasons.push(
      'NO_MODELED_RESOURCE_COST'
    )
  }

  return reasons
}

// --------------------------------------------------
// Public API
// --------------------------------------------------

export function buildRaidInvestmentValue({
  assessment,
  possibleState,
  candidate = null,
}) {
  if (
    !assessment
  ) {
    return {
      status:
        RAID_INVESTMENT_VALUE_STATUS
          .INVALID_ASSESSMENT,
    }
  }

  if (
    assessment.status ===
    RAID_INVESTMENT_ASSESSMENT_STATUS
      .INSUFFICIENT_EVIDENCE
  ) {
    return {
      status:
        RAID_INVESTMENT_VALUE_STATUS
          .INSUFFICIENT_EVIDENCE,

      assessment,
    }
  }

  if (
    assessment.status !==
    RAID_INVESTMENT_ASSESSMENT_STATUS
      .SUCCESS
  ) {
    return {
      status:
        RAID_INVESTMENT_VALUE_STATUS
          .INVALID_ASSESSMENT,

      assessment,
    }
  }

  const cost =
    buildRaidInvestmentCost(
      possibleState,
      candidate
    )

  if (
    cost.status !==
    RAID_INVESTMENT_COST_STATUS
      .SUCCESS
  ) {
    return {
      status:
        RAID_INVESTMENT_VALUE_STATUS
          .INVALID_COST,

      assessment,

      cost,
    }
  }

  const resourceBurden =
    determineResourceBurden(
      cost
    )

  const value =
    determineValueClassification({
      assessment,
      resourceBurden,
    })

  const reasonCodes =
    buildReasonCodes({
      assessment,
      cost,
      resourceBurden,
      value,
    })

  return {
    status:
      RAID_INVESTMENT_VALUE_STATUS
        .SUCCESS,

    pokemonIdentity:
      assessment
        .pokemonIdentity ??
      cost
        .pokemonIdentity ??
      null,

    sourcePokemonIdentity:
      assessment
        .sourcePokemonIdentity ??
      cost
        .sourcePokemonIdentity ??
      null,

    resultingPokemonIdentity:
      assessment
        .resultingPokemonIdentity ??
      assessment
        .pokemonIdentity ??
      cost
        .resultingPokemonIdentity ??
      cost
        .pokemonIdentity ??
      null,

    possibleStateType:
      assessment
        .possibleStateType ??
      cost
        .possibleStateType ??
      null,

    value,

    resourceBurden,

    reasonCodes,

    reachable:
      assessment.reachable !==
      false,

    destroysProtectedMove:
      assessment
        .destroysProtectedMove ===
      true,

    performance:
      assessment.performance,

    investmentSignal:
      assessment.investmentSignal,

    confidence:
      assessment.confidence,

    destinationCertainty:
      assessment
        .destinationCertainty ??
      RAID_INVESTMENT_DESTINATION_CERTAINTY
        .UNKNOWN,

    action:
      assessment.action ??
      cost.action ??
      null,

    actions:
      Array.isArray(
        assessment.actions
      )
        ? assessment.actions
        : Array.isArray(
            cost.actions
          )
          ? cost.actions
          : [],

    additionalMoveAction:
      assessment
        .additionalMoveAction ??
      cost
        .additionalMoveAction ??
      null,

    performanceEvidence:
      assessment
        .performanceEvidence ??
      null,

    matchupCoverage:
      assessment
        .matchupCoverage ??
      null,

    cost,

    assessment,
  }
}