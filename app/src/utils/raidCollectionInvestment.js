import {
  rankRaidInvestmentOpportunities,
  RAID_INVESTMENT_OPPORTUNITY_STATUS,
  RAID_INVESTMENT_RANK_GROUP,
} from './raidInvestmentOpportunity.js'

import {
  RAID_INVESTMENT_PERFORMANCE,
  RAID_INVESTMENT_CONFIDENCE,
} from './raidInvestmentAssessment.js'

import {
  RAID_INVESTMENT_VALUE_STATUS,
  RAID_INVESTMENT_VALUE,
} from './raidInvestmentValue.js'

import {
  evaluateRaidStrength,
  RAID_STRENGTH_STATUS,
  RAID_STRENGTH_CLASSIFICATION,
} from './raidStrength.js'

// --------------------------------------------------
// Status
// --------------------------------------------------

export const RAID_COLLECTION_INVESTMENT_STATUS = {
  SUCCESS:
    'SUCCESS',

  INVALID_ENTRIES:
    'INVALID_ENTRIES',
}

// --------------------------------------------------
// Collection ranking groups
//
// Lower number = preferred.
//
// Actionability and safety remain the strongest
// collection-wide ranking criterion.
//
// STOCHASTIC_DESTINATION is intentionally ranked below
// both actionable groups. These opportunities are real
// and useful for planning, but the exact represented
// destination is not guaranteed.
//
// They remain above preservation risk, unavailable,
// low-value, negative and unresolved opportunities.
// --------------------------------------------------

const COLLECTION_GROUP_PRIORITY = {
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
// Investment value priority
//
// Higher number = preferred.
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

// --------------------------------------------------
// Performance priority
//
// Higher number = preferred.
// --------------------------------------------------

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

// --------------------------------------------------
// Confidence priority
//
// Higher number = preferred.
// --------------------------------------------------

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
// Raid Strength priority
//
// Higher number = preferred.
//
// Raid Strength measures the quality of the RESULTING
// attacker rather than merely the size of the change.
//
// This is what prevents a huge relative improvement to
// a weak attacker from automatically outranking a
// genuinely strong raid investment.
// --------------------------------------------------

const RAID_STRENGTH_PRIORITY = {
  [
    RAID_STRENGTH_CLASSIFICATION
      .ELITE
  ]:
    5,

  [
    RAID_STRENGTH_CLASSIFICATION
      .STRONG
  ]:
    4,

  [
    RAID_STRENGTH_CLASSIFICATION
      .COMPETITIVE
  ]:
    3,

  [
    RAID_STRENGTH_CLASSIFICATION
      .LIMITED
  ]:
    2,

  [
    RAID_STRENGTH_CLASSIFICATION
      .WEAK
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

function getGroupPriority(
  opportunity
) {
  return (
    COLLECTION_GROUP_PRIORITY[
      opportunity?.rankGroup
    ] ??
    Number.MAX_SAFE_INTEGER
  )
}

// --------------------------------------------------
// Collection safety priority
//
// ACTIONABLE_PROMISING and
// ACTIONABLE_CONTEXT_DEPENDENT are both safe,
// reachable investment actions.
//
// Their distinction still matters as investment
// evidence, but it should not prevent Raid Strength
// from comparing the quality of the resulting
// attackers.
//
// STOCHASTIC_DESTINATION remains a separate lower
// safety group because its exact represented final
// destination is not guaranteed.
//
// The original group ordering is retained separately
// so it can still be used as the legacy fallback when
// Raid Strength is unavailable.
// --------------------------------------------------

function getSafetyGroupPriority(
  opportunity
) {
  const rankGroup =
    opportunity?.rankGroup

  if (
    rankGroup ===
      RAID_INVESTMENT_RANK_GROUP
        .ACTIONABLE_PROMISING ||
    rankGroup ===
      RAID_INVESTMENT_RANK_GROUP
        .ACTIONABLE_CONTEXT_DEPENDENT
  ) {
    return 1
  }

  return getGroupPriority(
    opportunity
  )
}

function getValuePriority(
  opportunity
) {
  if (
    opportunity
      ?.value
      ?.status !==
    RAID_INVESTMENT_VALUE_STATUS
      .SUCCESS
  ) {
    return 0
  }

  return (
    VALUE_PRIORITY[
      opportunity
        ?.valueClassification
    ] ??
    0
  )
}

function getPerformancePriority(
  opportunity
) {
  return (
    PERFORMANCE_PRIORITY[
      opportunity
        ?.assessment
        ?.performance
    ] ??
    0
  )
}

function getConfidencePriority(
  opportunity
) {
  return (
    CONFIDENCE_PRIORITY[
      opportunity
        ?.assessment
        ?.confidence
    ] ??
    0
  )
}

function getMedianGain(
  opportunity
) {
  return finiteOrFallback(
    opportunity
      ?.assessment
      ?.performanceEvidence
      ?.medianPercentGain,

    Number.NEGATIVE_INFINITY
  )
}

function getImprovementRate(
  opportunity
) {
  return finiteOrFallback(
    opportunity
      ?.assessment
      ?.performanceEvidence
      ?.improvementRate,

    Number.NEGATIVE_INFINITY
  )
}

function getAverageGain(
  opportunity
) {
  return finiteOrFallback(
    opportunity
      ?.assessment
      ?.performanceEvidence
      ?.averagePercentGain,

    Number.NEGATIVE_INFINITY
  )
}

function getMinimumGain(
  opportunity
) {
  return finiteOrFallback(
    opportunity
      ?.assessment
      ?.performanceEvidence
      ?.minimumPercentGain,

    Number.NEGATIVE_INFINITY
  )
}

function getCoverageRate(
  opportunity
) {
  return finiteOrFallback(
    opportunity
      ?.assessment
      ?.matchupCoverage
      ?.coverageRate,

    Number.NEGATIVE_INFINITY
  )
}

// --------------------------------------------------
// Raid Strength helpers
// --------------------------------------------------

function hasSuccessfulRaidStrength(
  opportunity
) {
  return (
    opportunity
      ?.raidStrength
      ?.status ===
    RAID_STRENGTH_STATUS
      .SUCCESS
  )
}

function getRaidStrengthAvailabilityPriority(
  opportunity
) {
  return hasSuccessfulRaidStrength(
    opportunity
  )
    ? 1
    : 0
}

function getRaidStrengthClassificationPriority(
  opportunity
) {
  if (
    !hasSuccessfulRaidStrength(
      opportunity
    )
  ) {
    return 0
  }

  return (
    RAID_STRENGTH_PRIORITY[
      opportunity
        ?.raidStrength
        ?.bestClassification
    ] ??
    0
  )
}

function getBestOverallStrengthScore(
  opportunity
) {
  if (
    !hasSuccessfulRaidStrength(
      opportunity
    )
  ) {
    return Number.NEGATIVE_INFINITY
  }

  return finiteOrFallback(
    opportunity
      ?.raidStrength
      ?.bestOverallStrengthScore,

    Number.NEGATIVE_INFINITY
  )
}

function getMedianOverallStrengthScore(
  opportunity
) {
  if (
    !hasSuccessfulRaidStrength(
      opportunity
    )
  ) {
    return Number.NEGATIVE_INFINITY
  }

  return finiteOrFallback(
    opportunity
      ?.raidStrength
      ?.medianOverallStrengthScore,

    Number.NEGATIVE_INFINITY
  )
}

function getCompetitiveMatchupCount(
  opportunity
) {
  if (
    !hasSuccessfulRaidStrength(
      opportunity
    )
  ) {
    return Number.NEGATIVE_INFINITY
  }

  return finiteOrFallback(
    opportunity
      ?.raidStrength
      ?.competitiveMatchupCount,

    Number.NEGATIVE_INFINITY
  )
}

function getStrongMatchupCount(
  opportunity
) {
  if (
    !hasSuccessfulRaidStrength(
      opportunity
    )
  ) {
    return Number.NEGATIVE_INFINITY
  }

  return finiteOrFallback(
    opportunity
      ?.raidStrength
      ?.strongMatchupCount,

    Number.NEGATIVE_INFINITY
  )
}

function getBestRaidStrengthScore(
  opportunity
) {
  if (
    !hasSuccessfulRaidStrength(
      opportunity
    )
  ) {
    return Number.NEGATIVE_INFINITY
  }

  return finiteOrFallback(
    opportunity
      ?.raidStrength
      ?.bestStrengthScore,

    Number.NEGATIVE_INFINITY
  )
}

function getMedianRaidStrengthScore(
  opportunity
) {
  if (
    !hasSuccessfulRaidStrength(
      opportunity
    )
  ) {
    return Number.NEGATIVE_INFINITY
  }

  return finiteOrFallback(
    opportunity
      ?.raidStrength
      ?.medianStrengthScore,

    Number.NEGATIVE_INFINITY
  )
}

// --------------------------------------------------
// Resulting candidate
//
// Possible states intentionally contain state-specific
// moves, loadouts and optional combat overrides rather
// than duplicating the entire candidate.
//
// Raid Strength evaluates a candidate, so this helper
// projects the possible state back onto the owned
// candidate without mutating either source object.
// --------------------------------------------------

function getStateChargedMoveIds({
  candidate,
  possibleState,
}) {
  const stateChargedMoves = [
    possibleState
      ?.moves
      ?.chargedMove1Id,

    possibleState
      ?.moves
      ?.chargedMove2Id,
  ].filter(
    Boolean
  )

  if (
    stateChargedMoves.length >
    0
  ) {
    return stateChargedMoves
  }

  return Array.isArray(
    candidate
      ?.moves
      ?.charged
  )
    ? [
        ...candidate
          .moves
          .charged,
      ]
    : []
}

function buildResultingRaidCandidate({
  candidate,
  possibleState,
}) {
  if (
    !candidate ||
    !possibleState
  ) {
    return null
  }

  // ------------------------------------------------
  // Reference identity bridge
  //
  // Owned raid candidates use `reference`.
  //
  // Evolution possible states may provide a destination
  // candidate/reference override.
  //
  // Prefer the possible-state destination reference so
  // Raid Strength evaluates the evolved Pokémon rather
  // than projecting evolved moves onto the source
  // species.
  //
  // Preserve both `pokemon` and `reference` because
  // different Raid layers use different aliases.
  // ------------------------------------------------

  const stateCandidate =
    possibleState
      ?.candidate ??
    null

  const pokemon =
    stateCandidate
      ?.pokemon ??
    stateCandidate
      ?.reference ??
    candidate
      ?.pokemon ??
    candidate
      ?.reference ??
    null

  const reference =
    stateCandidate
      ?.reference ??
    stateCandidate
      ?.pokemon ??
    candidate
      ?.reference ??
    candidate
      ?.pokemon ??
    pokemon

  const candidateId =
    possibleState
      ?.pokemonIdentity ??
    stateCandidate
      ?.id ??
    stateCandidate
      ?.pokemonIdentity ??
    candidate
      ?.id ??
    candidate
      ?.pokemonIdentity ??
    (
      pokemon?.id &&
      pokemon?.form
        ? `${pokemon.id}__${pokemon.form}`
        : pokemon?.id ??
          null
    )

  const fastMoveId =
    possibleState
      ?.moves
      ?.fastMoveId ??
    stateCandidate
      ?.moves
      ?.fast ??
    candidate
      ?.moves
      ?.fast ??
    null

  const chargedMoveIds =
    getStateChargedMoveIds({
      candidate:
        stateCandidate ??
        candidate,

      possibleState,
    })

  if (
    !fastMoveId ||
    chargedMoveIds.length ===
      0
  ) {
    return null
  }

  const chargedMove1Id =
    possibleState
      ?.moves
      ?.chargedMove1Id ??
    chargedMoveIds[0] ??
    null

  const chargedMove2Id =
    possibleState
      ?.moves
      ?.chargedMove2Id ??
    chargedMoveIds[1] ??
    null

  const stateLoadouts =
    Array.isArray(
      possibleState
        ?.loadouts
    )
      ? possibleState
          .loadouts
          .filter(
            (loadout) =>
              Boolean(
                loadout
                  ?.fastMoveId
              ) &&
              Boolean(
                loadout
                  ?.chargedMoveId
              )
          )
      : []

  const loadouts =
    stateLoadouts.length >
      0
      ? stateLoadouts.map(
          (loadout) => ({
            ...loadout,
          })
        )
      : chargedMoveIds.map(
          (chargedMoveId) => ({
            fastMoveId,

            chargedMoveId,
          })
        )

  // ------------------------------------------------
  // Combat state
  //
  // Evolution states may expose destination combat
  // values through either possibleState.combat or the
  // state-specific candidate override.
  //
  // Power-up possible states provide target CPM through
  // possibleState.combat.cpm.
  // ------------------------------------------------

  const cpm =
    finiteOrFallback(
      possibleState
        ?.combat
        ?.cpm,

      finiteOrFallback(
        stateCandidate
          ?.cpm,

        finiteOrFallback(
          stateCandidate
            ?.cpMultiplier,

          finiteOrFallback(
            candidate
              ?.cpm,

            candidate
              ?.cpMultiplier
          )
        )
      )
    )

  const level =
    finiteOrFallback(
      possibleState
        ?.combat
        ?.level,

      finiteOrFallback(
        stateCandidate
          ?.level,

        candidate
          ?.level
      )
    )

  const stats =
    possibleState
      ?.combat
      ?.stats ??
    stateCandidate
      ?.stats ??
    candidate
      ?.stats ??
    null

  const existingMoves =
    stateCandidate
      ?.moves ??
    candidate
      ?.moves ??
    {}

  const existingChargedSlots =
    existingMoves
      ?.chargedSlots ??
    {}

  return {
    ...candidate,
    ...(stateCandidate ?? {}),

    id:
      candidateId,

    pokemonIdentity:
      possibleState
        ?.pokemonIdentity ??
      stateCandidate
        ?.pokemonIdentity ??
      candidate
        ?.pokemonIdentity ??
      candidateId,

    pokemon,

    reference,

    cpm,

    cpMultiplier:
      cpm,

    level,

    stats,

    moves: {
      ...existingMoves,

      fast:
        fastMoveId,

      charged:
        chargedMoveIds,

      chargedSlots: {
        ...existingChargedSlots,

        slot1:
          chargedMove1Id,

        slot2:
          chargedMove2Id,
      },
    },

    loadouts,
  }
}

// --------------------------------------------------
// Evaluate resulting Raid Strength
//
// Called once per opportunity when a compact strength
// reference is supplied.
//
// Without a strength reference, null is returned and
// the collection comparator naturally falls back to
// the pre-Raid-Strength ranking policy.
// --------------------------------------------------

function buildOpportunityRaidStrength({
  candidate,
  opportunity,
  matchups,
  moves,
  combatData,
  strengthReference,
}) {
  if (
    !strengthReference
      ?.benchmarks ||
    !opportunity
      ?.possibleState
  ) {
    return null
  }

  const resultingCandidate =
    buildResultingRaidCandidate({
      candidate,

      possibleState:
        opportunity
          .possibleState,
    })

  if (
    !resultingCandidate
  ) {
    return null
  }

  return evaluateRaidStrength({
    state: {
      candidate:
        resultingCandidate,
    },

    matchups,

    strengthReference,

    moves,

    combatData,
  })
}

// --------------------------------------------------
// Opportunity-result enrichment
//
// rankRaidInvestmentOpportunities() remains responsible
// for choosing the best investment action for one
// Pokémon.
//
// This collection layer then evaluates the resulting
// strength of each opportunity exactly once.
//
// Existing opportunity ordering is not mutated here.
//
// All important opportunity buckets, including
// STOCHASTIC_DESTINATION, are preserved through this
// enrichment step.
// --------------------------------------------------

function enrichOpportunityResult({
  opportunityResult,
  candidate,
  matchups,
  moves,
  combatData,
  strengthReference,
}) {
  if (
    opportunityResult
      ?.status !==
    RAID_INVESTMENT_OPPORTUNITY_STATUS
      .SUCCESS
  ) {
    return opportunityResult
  }

  const strengthByOriginalIndex =
    new Map()

  function getStrength(
    opportunity
  ) {
    if (!opportunity) {
      return null
    }

    const key =
      opportunity
        .originalIndex

    if (
      strengthByOriginalIndex.has(
        key
      )
    ) {
      return strengthByOriginalIndex.get(
        key
      )
    }

    const raidStrength =
      buildOpportunityRaidStrength({
        candidate,

        opportunity,

        matchups,

        moves,

        combatData,

        strengthReference,
      })

    strengthByOriginalIndex.set(
      key,
      raidStrength
    )

    return raidStrength
  }

  function enrichOpportunity(
    opportunity
  ) {
    if (!opportunity) {
      return null
    }

    return {
      ...opportunity,

      raidStrength:
        getStrength(
          opportunity
        ),
    }
  }

  function enrichArray(
    opportunities
  ) {
    return Array.isArray(
      opportunities
    )
      ? opportunities.map(
          enrichOpportunity
        )
      : []
  }

  return {
    ...opportunityResult,

    opportunities:
      enrichArray(
        opportunityResult
          .opportunities
      ),

    rankedOpportunities:
      enrichArray(
        opportunityResult
          .rankedOpportunities
      ),

    actionableOpportunities:
      enrichArray(
        opportunityResult
          .actionableOpportunities
      ),

    promisingOpportunities:
      enrichArray(
        opportunityResult
          .promisingOpportunities
      ),

    stochasticDestinationOpportunities:
      enrichArray(
        opportunityResult
          .stochasticDestinationOpportunities
      ),

    preservationRiskOpportunities:
      enrichArray(
        opportunityResult
          .preservationRiskOpportunities
      ),

    unavailableOpportunities:
      enrichArray(
        opportunityResult
          .unavailableOpportunities
      ),

    highValueOpportunities:
      enrichArray(
        opportunityResult
          .highValueOpportunities
      ),

    moderateValueOpportunities:
      enrichArray(
        opportunityResult
          .moderateValueOpportunities
      ),

    premiumResourceOpportunities:
      enrichArray(
        opportunityResult
          .premiumResourceOpportunities
      ),

    costIncompleteOpportunities:
      enrichArray(
        opportunityResult
          .costIncompleteOpportunities
      ),

    powerUpOpportunities:
      enrichArray(
        opportunityResult
          .powerUpOpportunities
      ),

    recommendedPowerUpOpportunities:
      enrichArray(
        opportunityResult
          .recommendedPowerUpOpportunities
      ),

    ordinaryStoppingPointOpportunity:
      enrichOpportunity(
        opportunityResult
          .ordinaryStoppingPointOpportunity
      ),

    premiumPowerUpOpportunity:
      enrichOpportunity(
        opportunityResult
          .premiumPowerUpOpportunity
      ),

    topOpportunity:
      enrichOpportunity(
        opportunityResult
          .topOpportunity
      ),

    topActionableOpportunity:
      enrichOpportunity(
        opportunityResult
          .topActionableOpportunity
      ),

    topHighValueOpportunity:
      enrichOpportunity(
        opportunityResult
          .topHighValueOpportunity
      ),
  }
}

// --------------------------------------------------
// Cross-Pokémon comparison
//
// Collection Ranking V4
//
// Ordering:
//
// 1. Actionability / safety
//
// ACTIONABLE_PROMISING and
// ACTIONABLE_CONTEXT_DEPENDENT are treated as the same
// safe-actionable bucket when Raid Strength can compare
// the resulting attackers.
//
// STOCHASTIC_DESTINATION is retained as a visible
// planning group below actionable opportunities.
//
// If neither opportunity has usable Raid Strength, the
// original rank-group ordering is preserved.
//
// If Raid Strength is available:
//
// 2. Resulting Raid Strength availability
// 3. Resulting Raid Strength classification
// 4. Best overall benchmark strength
// 5. Median overall benchmark strength
// 6. Competitive matchup breadth
// 7. Strong matchup breadth
// 8. Best role-aware Raid Strength
// 9. Median role-aware Raid Strength
//
// Existing ranking evidence then remains:
//
// 10. Investment value
// 11. Performance classification
// 12. Confidence
// 13. Median gain
// 14. Improvement consistency
// 15. Average gain
// 16. Worst-case gain
// 17. Evidence coverage
// 18. Stable original collection order
//
// When Raid Strength is unavailable for both entries,
// criteria 2-9 all tie and the exact previous ranking
// policy resumes.
// --------------------------------------------------

function compareCollectionOpportunities(
  first,
  second
) {
  const firstOpportunity =
    first.topOpportunity

  const secondOpportunity =
    second.topOpportunity

  // ------------------------------------------------
  // 1. Actionability / safety
  // ------------------------------------------------

  const safetyGroupComparison =
    getSafetyGroupPriority(
      firstOpportunity
    ) -
    getSafetyGroupPriority(
      secondOpportunity
    )

  if (
    safetyGroupComparison !==
    0
  ) {
    return safetyGroupComparison
  }

  const firstHasRaidStrength =
    hasSuccessfulRaidStrength(
      firstOpportunity
    )

  const secondHasRaidStrength =
    hasSuccessfulRaidStrength(
      secondOpportunity
    )

  // ------------------------------------------------
  // Legacy fallback
  // ------------------------------------------------

  if (
    !firstHasRaidStrength &&
    !secondHasRaidStrength
  ) {
    const legacyGroupComparison =
      getGroupPriority(
        firstOpportunity
      ) -
      getGroupPriority(
        secondOpportunity
      )

    if (
      legacyGroupComparison !==
      0
    ) {
      return legacyGroupComparison
    }
  }

  // ------------------------------------------------
  // 2. Raid Strength availability
  // ------------------------------------------------

  const strengthAvailabilityComparison =
    compareDescending(
      getRaidStrengthAvailabilityPriority(
        firstOpportunity
      ),

      getRaidStrengthAvailabilityPriority(
        secondOpportunity
      )
    )

  if (
    strengthAvailabilityComparison !==
    0
  ) {
    return strengthAvailabilityComparison
  }

  // ------------------------------------------------
  // 3. Raid Strength classification
  // ------------------------------------------------

  const strengthClassificationComparison =
    compareDescending(
      getRaidStrengthClassificationPriority(
        firstOpportunity
      ),

      getRaidStrengthClassificationPriority(
        secondOpportunity
      )
    )

  if (
    strengthClassificationComparison !==
    0
  ) {
    return strengthClassificationComparison
  }

  // ------------------------------------------------
  // 4. Best overall benchmark strength
  // ------------------------------------------------

  const bestOverallStrengthComparison =
    compareDescending(
      getBestOverallStrengthScore(
        firstOpportunity
      ),

      getBestOverallStrengthScore(
        secondOpportunity
      )
    )

  if (
    bestOverallStrengthComparison !==
    0
  ) {
    return bestOverallStrengthComparison
  }

  // ------------------------------------------------
  // 5. Median overall benchmark strength
  // ------------------------------------------------

  const medianOverallStrengthComparison =
    compareDescending(
      getMedianOverallStrengthScore(
        firstOpportunity
      ),

      getMedianOverallStrengthScore(
        secondOpportunity
      )
    )

  if (
    medianOverallStrengthComparison !==
    0
  ) {
    return medianOverallStrengthComparison
  }

  // ------------------------------------------------
  // 6. Competitive matchup breadth
  // ------------------------------------------------

  const competitiveBreadthComparison =
    compareDescending(
      getCompetitiveMatchupCount(
        firstOpportunity
      ),

      getCompetitiveMatchupCount(
        secondOpportunity
      )
    )

  if (
    competitiveBreadthComparison !==
    0
  ) {
    return competitiveBreadthComparison
  }

  // ------------------------------------------------
  // 7. Strong matchup breadth
  // ------------------------------------------------

  const strongBreadthComparison =
    compareDescending(
      getStrongMatchupCount(
        firstOpportunity
      ),

      getStrongMatchupCount(
        secondOpportunity
      )
    )

  if (
    strongBreadthComparison !==
    0
  ) {
    return strongBreadthComparison
  }

  // ------------------------------------------------
  // 8. Best role-aware Raid Strength
  // ------------------------------------------------

  const bestRaidStrengthComparison =
    compareDescending(
      getBestRaidStrengthScore(
        firstOpportunity
      ),

      getBestRaidStrengthScore(
        secondOpportunity
      )
    )

  if (
    bestRaidStrengthComparison !==
    0
  ) {
    return bestRaidStrengthComparison
  }

  // ------------------------------------------------
  // 9. Median role-aware Raid Strength
  // ------------------------------------------------

  const medianRaidStrengthComparison =
    compareDescending(
      getMedianRaidStrengthScore(
        firstOpportunity
      ),

      getMedianRaidStrengthScore(
        secondOpportunity
      )
    )

  if (
    medianRaidStrengthComparison !==
    0
  ) {
    return medianRaidStrengthComparison
  }

  // ------------------------------------------------
  // 10. Investment value
  // ------------------------------------------------

  const valueComparison =
    compareDescending(
      getValuePriority(
        firstOpportunity
      ),

      getValuePriority(
        secondOpportunity
      )
    )

  if (
    valueComparison !==
    0
  ) {
    return valueComparison
  }

  // ------------------------------------------------
  // 11. Performance classification
  // ------------------------------------------------

  const performanceComparison =
    compareDescending(
      getPerformancePriority(
        firstOpportunity
      ),

      getPerformancePriority(
        secondOpportunity
      )
    )

  if (
    performanceComparison !==
    0
  ) {
    return performanceComparison
  }

  // ------------------------------------------------
  // 12. Confidence
  // ------------------------------------------------

  const confidenceComparison =
    compareDescending(
      getConfidencePriority(
        firstOpportunity
      ),

      getConfidencePriority(
        secondOpportunity
      )
    )

  if (
    confidenceComparison !==
    0
  ) {
    return confidenceComparison
  }

  // ------------------------------------------------
  // 13. Median gain
  // ------------------------------------------------

  const medianComparison =
    compareDescending(
      getMedianGain(
        firstOpportunity
      ),

      getMedianGain(
        secondOpportunity
      )
    )

  if (
    medianComparison !==
    0
  ) {
    return medianComparison
  }

  // ------------------------------------------------
  // 14. Improvement rate
  // ------------------------------------------------

  const improvementComparison =
    compareDescending(
      getImprovementRate(
        firstOpportunity
      ),

      getImprovementRate(
        secondOpportunity
      )
    )

  if (
    improvementComparison !==
    0
  ) {
    return improvementComparison
  }

  // ------------------------------------------------
  // 15. Average gain
  // ------------------------------------------------

  const averageComparison =
    compareDescending(
      getAverageGain(
        firstOpportunity
      ),

      getAverageGain(
        secondOpportunity
      )
    )

  if (
    averageComparison !==
    0
  ) {
    return averageComparison
  }

  // ------------------------------------------------
  // 16. Minimum gain
  // ------------------------------------------------

  const minimumComparison =
    compareDescending(
      getMinimumGain(
        firstOpportunity
      ),

      getMinimumGain(
        secondOpportunity
      )
    )

  if (
    minimumComparison !==
    0
  ) {
    return minimumComparison
  }

  // ------------------------------------------------
  // 17. Existing evidence coverage
  // ------------------------------------------------

  const coverageComparison =
    compareDescending(
      getCoverageRate(
        firstOpportunity
      ),

      getCoverageRate(
        secondOpportunity
      )
    )

  if (
    coverageComparison !==
    0
  ) {
    return coverageComparison
  }

  // ------------------------------------------------
  // 18. Stable collection order
  // ------------------------------------------------

  return (
    first.originalIndex -
    second.originalIndex
  )
}

// --------------------------------------------------
// Build one collection entry
// --------------------------------------------------

function buildCollectionEntry({
  entry,
  originalIndex,
  matchups,
  moves,
  combatData,
  strengthReference,
}) {
  const rawOpportunityResult =
    rankRaidInvestmentOpportunities({
      candidate:
        entry?.candidate,

      currentState:
        entry?.currentState,

      possibleStates:
        entry?.possibleStates,

      matchups,

      moves,

      combatData,
    })

  const opportunityResult =
    enrichOpportunityResult({
      opportunityResult:
        rawOpportunityResult,

      candidate:
        entry?.candidate,

      matchups,

      moves,

      combatData,

      strengthReference,
    })

  const validOpportunityResult =
    opportunityResult
      ?.status ===
    RAID_INVESTMENT_OPPORTUNITY_STATUS
      .SUCCESS

  const topOpportunity =
    validOpportunityResult
      ? opportunityResult
          .topOpportunity
      : null

  const topActionableOpportunity =
    validOpportunityResult
      ? opportunityResult
          .topActionableOpportunity
      : null

  const topHighValueOpportunity =
    validOpportunityResult
      ? opportunityResult
          .topHighValueOpportunity
      : null

  const topStochasticDestinationOpportunity =
    validOpportunityResult
      ? opportunityResult
          .stochasticDestinationOpportunities
          ?.[0] ??
        null
      : null

  return {
    originalIndex,

    collectionId:
      entry?.collectionId ??
      null,

    pokemonIdentity:
      entry
        ?.candidate
        ?.pokemonIdentity ??
      null,

    candidate:
      entry?.candidate ??
      null,

    currentState:
      entry?.currentState ??
      null,

    possibleStates:
      entry?.possibleStates ??
      null,

    opportunityResult,

    topOpportunity,

    topActionableOpportunity,

    topHighValueOpportunity,

    topStochasticDestinationOpportunity,

    hasActionableOpportunity:
      Boolean(
        topActionableOpportunity
      ),

    hasHighValueOpportunity:
      Boolean(
        topHighValueOpportunity
      ),

    hasStochasticDestinationOpportunity:
      Boolean(
        topStochasticDestinationOpportunity
      ),

    hasRaidStrength:
      hasSuccessfulRaidStrength(
        topOpportunity
      ),
  }
}

// --------------------------------------------------
// Public API
// --------------------------------------------------

export function rankRaidCollectionInvestments({
  entries,
  matchups,
  moves,
  combatData,
  strengthReference = null,
}) {
  if (
    !Array.isArray(
      entries
    )
  ) {
    return {
      status:
        RAID_COLLECTION_INVESTMENT_STATUS
          .INVALID_ENTRIES,

      entries: [],

      rankedEntries: [],

      actionableEntries: [],

      stochasticDestinationEntries: [],

      highValueEntries: [],

      topEntry:
        null,

      topActionableEntry:
        null,

      topStochasticDestinationEntry:
        null,

      topHighValueEntry:
        null,

      raidStrengthEnabled:
        false,
    }
  }

  const raidStrengthEnabled =
    Boolean(
      strengthReference
        ?.benchmarks
    )

  const collectionEntries =
    entries.map(
      (
        entry,
        originalIndex
      ) =>
        buildCollectionEntry({
          entry,

          originalIndex,

          matchups,

          moves,

          combatData,

          strengthReference,
        })
    )

  // ------------------------------------------------
  // Overall collection ranking
  // ------------------------------------------------

  const rankedEntries =
    [
      ...collectionEntries,
    ].sort(
      (
        first,
        second
      ) => {
        const firstHasOpportunity =
          Boolean(
            first
              .topOpportunity
          )

        const secondHasOpportunity =
          Boolean(
            second
              .topOpportunity
          )

        if (
          firstHasOpportunity &&
          !secondHasOpportunity
        ) {
          return -1
        }

        if (
          !firstHasOpportunity &&
          secondHasOpportunity
        ) {
          return 1
        }

        if (
          !firstHasOpportunity &&
          !secondHasOpportunity
        ) {
          return (
            first.originalIndex -
            second.originalIndex
          )
        }

        return compareCollectionOpportunities(
          first,
          second
        )
      }
    )

  const rankedWithPositions =
    rankedEntries.map(
      (
        entry,
        index
      ) => ({
        ...entry,

        rank:
          index + 1,
      })
    )

  // ------------------------------------------------
  // Actionable collection ranking
  // ------------------------------------------------

  const actionableEntries =
    collectionEntries
      .filter(
        (entry) =>
          Boolean(
            entry
              .topActionableOpportunity
          )
      )
      .map(
        (entry) => ({
          ...entry,

          topOpportunity:
            entry
              .topActionableOpportunity,
        })
      )
      .sort(
        compareCollectionOpportunities
      )
      .map(
        (
          entry,
          index
        ) => ({
          ...entry,

          actionableRank:
            index + 1,
        })
      )

  // ------------------------------------------------
  // Stochastic-destination collection ranking
  //
  // These are NOT actionable recommendations.
  //
  // They are retained as a separate planning view so
  // the UI can show worthwhile evolution paths without
  // pretending that the exact represented final
  // moveset is guaranteed.
  // ------------------------------------------------

  const stochasticDestinationEntries =
    collectionEntries
      .filter(
        (entry) =>
          Boolean(
            entry
              .topStochasticDestinationOpportunity
          )
      )
      .map(
        (entry) => ({
          ...entry,

          topOpportunity:
            entry
              .topStochasticDestinationOpportunity,
        })
      )
      .sort(
        compareCollectionOpportunities
      )
      .map(
        (
          entry,
          index
        ) => ({
          ...entry,

          stochasticDestinationRank:
            index + 1,
        })
      )

  // ------------------------------------------------
  // High-value collection ranking
  // ------------------------------------------------

  const highValueEntries =
    collectionEntries
      .filter(
        (entry) =>
          Boolean(
            entry
              .topHighValueOpportunity
          )
      )
      .map(
        (entry) => ({
          ...entry,

          topOpportunity:
            entry
              .topHighValueOpportunity,
        })
      )
      .sort(
        compareCollectionOpportunities
      )
      .map(
        (
          entry,
          index
        ) => ({
          ...entry,

          highValueRank:
            index + 1,
        })
      )

  const topEntry =
    rankedWithPositions[0] ??
    null

  const topActionableEntry =
    actionableEntries[0] ??
    null

  const topStochasticDestinationEntry =
    stochasticDestinationEntries[0] ??
    null

  const topHighValueEntry =
    highValueEntries[0] ??
    null

  return {
    status:
      RAID_COLLECTION_INVESTMENT_STATUS
        .SUCCESS,

    raidStrengthEnabled,

    entryCount:
      collectionEntries.length,

    entries:
      collectionEntries,

    rankedEntries:
      rankedWithPositions,

    actionableEntries,

    actionableEntryCount:
      actionableEntries.length,

    stochasticDestinationEntries,

    stochasticDestinationEntryCount:
      stochasticDestinationEntries
        .length,

    highValueEntries,

    highValueEntryCount:
      highValueEntries.length,

    topEntry,

    topActionableEntry,

    topStochasticDestinationEntry,

    topHighValueEntry,
  }
}