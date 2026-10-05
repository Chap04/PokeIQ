// --------------------------------------------------
// Rare Candy Opportunity-Cost Intelligence V1.1
//
// Purpose:
//
// Compare CURRENTLY KNOWN Raid Investment
// recommendations that have a family-Candy shortfall
// which could potentially be covered by:
//
//   Rare Candy
//   Rare Candy XL
//
// This layer is advisory only.
//
// It does NOT:
// - spend Rare Candy
// - convert Rare Candy automatically
// - change resource actionability
// - change Raid Investment mechanics
// - use boss-specific performance
// - forecast future Pokémon
// - forecast future availability
//
// V1.1 adds a distinction between:
//
// BEST CURRENT USE
// = the strongest known use that can actually be
//   fully covered by the player's current shared
//   Candy balance.
//
// BEST TARGET
// = the strongest known positive opportunity,
//   regardless of whether the player currently owns
//   enough shared Candy to execute it.
//
// --------------------------------------------------

// --------------------------------------------------
// Status
// --------------------------------------------------

export const RARE_CANDY_OPPORTUNITY_COST_STATUS = {
  SUCCESS:
    'SUCCESS',

  INVALID_RECOMMENDATIONS:
    'INVALID_RECOMMENDATIONS',

  NO_OPPORTUNITIES:
    'NO_OPPORTUNITIES',
}

// --------------------------------------------------
// Shared resource types
// --------------------------------------------------

export const SHARED_CANDY_RESOURCE = {
  RARE_CANDY:
    'RARE_CANDY',

  RARE_CANDY_XL:
    'RARE_CANDY_XL',
}

// --------------------------------------------------
// Recommendation
// --------------------------------------------------

export const RARE_CANDY_USE_RECOMMENDATION = {
  BEST_CURRENT_USE:
    'BEST_CURRENT_USE',

  GOOD:
    'GOOD',

  SAVE:
    'SAVE',

  NOT_ENOUGH:
    'NOT_ENOUGH',

  BALANCE_UNKNOWN:
    'BALANCE_UNKNOWN',

  ACCOUNT_VALUE_UNKNOWN:
    'ACCOUNT_VALUE_UNKNOWN',
}

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function getFirstFinite(
  ...values
) {
  return (
    values.find(
      (value) =>
        Number.isFinite(
          value
        )
    ) ??
    null
  )
}

function getPokemonName(
  recommendation
) {
  return (
    recommendation
      ?.pokemonName ??
    recommendation
      ?.pokemon
      ?.name ??
    'Unknown Pokémon'
  )
}

function getRecommendationTitle(
  recommendation
) {
  return (
    recommendation
      ?.title ??
    'Raid Investment'
  )
}

function getAccountImpactPointChange(
  recommendation
) {
  return getFirstFinite(
    recommendation
      ?.accountImpactSummary
      ?.overallStrengthPointChange,

    recommendation
      ?.accountImpact
      ?.overallStrengthPointChange
  )
}

function getAccountImpactPercentChange(
  recommendation
) {
  return getFirstFinite(
    recommendation
      ?.accountImpactSummary
      ?.overallStrengthPercentChange,

    recommendation
      ?.accountImpact
      ?.overallStrengthPercentChange
  )
}

function getImprovedTypeCount(
  recommendation
) {
  return getFirstFinite(
    recommendation
      ?.accountImpactSummary
      ?.improvedTypeCount,

    recommendation
      ?.accountImpact
      ?.improvedTypeCount
  ) ??
    0
}

function getRegressedTypeCount(
  recommendation
) {
  return getFirstFinite(
    recommendation
      ?.accountImpactSummary
      ?.regressedTypeCount,

    recommendation
      ?.accountImpact
      ?.regressedTypeCount
  ) ??
    0
}

function getAccountAwareRank(
  recommendation,
  fallbackIndex
) {
  return getFirstFinite(
    recommendation
      ?.accountAwareRank,

    recommendation
      ?.rank,

    fallbackIndex + 1
  )
}

function getSharedResourceLabel(
  resource
) {
  if (
    resource ===
    SHARED_CANDY_RESOURCE
      .RARE_CANDY
  ) {
    return 'Rare Candy'
  }

  if (
    resource ===
    SHARED_CANDY_RESOURCE
      .RARE_CANDY_XL
  ) {
    return 'Rare Candy XL'
  }

  return 'Shared Candy'
}

function getCandyEvaluations(
  recommendation
) {
  const evaluations =
    recommendation
      ?.resourceActionability
      ?.evaluations

  if (
    !Array.isArray(
      evaluations
    )
  ) {
    return []
  }

  return evaluations.filter(
    (evaluation) =>
      (
        evaluation
          ?.resource ===
          'CANDY' ||
        evaluation
          ?.resource ===
          'CANDY_XL'
      ) &&
      Number.isFinite(
        evaluation
          ?.missing
      ) &&
      evaluation.missing >
        0 &&
      evaluation
        ?.sharedCandyResource
  )
}

function calculateValuePerCandy(
  accountPointChange,
  requiredSharedCandy
) {
  if (
    !Number.isFinite(
      accountPointChange
    ) ||
    !Number.isFinite(
      requiredSharedCandy
    ) ||
    requiredSharedCandy <=
      0
  ) {
    return null
  }

  return (
    accountPointChange /
    requiredSharedCandy
  )
}

function buildCoverage({
  sharedResource,
  requiredSharedCandy,
}) {
  const known =
    sharedResource
      ?.known ===
      true &&
    Number.isFinite(
      sharedResource
        ?.owned
    )

  const owned =
    known
      ? sharedResource.owned
      : null

  if (!known) {
    return {
      known:
        false,

      owned:
        null,

      required:
        requiredSharedCandy,

      remainingAfterSpend:
        null,

      additionalNeeded:
        null,

      canFullyCover:
        null,

      canPartiallyCover:
        null,

      usableAmount:
        null,
    }
  }

  const usableAmount =
    Math.min(
      owned,
      requiredSharedCandy
    )

  const canFullyCover =
    owned >=
    requiredSharedCandy

  return {
    known:
      true,

    owned,

    required:
      requiredSharedCandy,

    remainingAfterSpend:
      canFullyCover
        ? owned -
          requiredSharedCandy
        : null,

    additionalNeeded:
      canFullyCover
        ? 0
        : requiredSharedCandy -
          owned,

    canFullyCover,

    canPartiallyCover:
      owned >
        0 &&
      owned <
        requiredSharedCandy,

    usableAmount,
  }
}

function buildOpportunity({
  recommendation,
  recommendationIndex,
  evaluation,
  opportunityIndex,
}) {
  const sharedResource =
    evaluation
      ?.sharedCandyResource

  const sharedResourceType =
    sharedResource
      ?.resource ??
    (
      evaluation.resource ===
        'CANDY_XL'
        ? SHARED_CANDY_RESOURCE
            .RARE_CANDY_XL
        : SHARED_CANDY_RESOURCE
            .RARE_CANDY
    )

  const requiredSharedCandy =
    evaluation.missing

  const accountPointChange =
    getAccountImpactPointChange(
      recommendation
    )

  const accountPercentChange =
    getAccountImpactPercentChange(
      recommendation
    )

  const accountValueKnown =
    Number.isFinite(
      accountPointChange
    )

  const positiveAccountImpact =
    accountValueKnown &&
    accountPointChange >
      0

  const coverage =
    buildCoverage({
      sharedResource,
      requiredSharedCandy,
    })

  return {
    id:
      [
        recommendation
          ?.collectionId ??
          recommendationIndex,

        sharedResourceType,

        evaluation
          ?.candyFamilyId ??
          'UNKNOWN_FAMILY',

        opportunityIndex,
      ].join(
        '::'
      ),

    recommendationIndex,

    collectionId:
      recommendation
        ?.collectionId ??
      null,

    pokemonName:
      getPokemonName(
        recommendation
      ),

    recommendationTitle:
      getRecommendationTitle(
        recommendation
      ),

    accountAwareRank:
      getAccountAwareRank(
        recommendation,
        recommendationIndex
      ),

    candyResource:
      evaluation.resource,

    candyFamilyId:
      evaluation
        ?.candyFamilyId ??
      null,

    candyFamilyName:
      evaluation
        ?.candyFamilyName ??
      null,

    candyOwned:
      Number.isFinite(
        evaluation
          ?.owned
      )
        ? evaluation.owned
        : null,

    candyRequired:
      Number.isFinite(
        evaluation
          ?.required
      )
        ? evaluation.required
        : null,

    candyMissing:
      requiredSharedCandy,

    sharedResource:
      sharedResourceType,

    sharedResourceLabel:
      sharedResource
        ?.label ??
      getSharedResourceLabel(
        sharedResourceType
      ),

    requiredSharedCandy,

    coverage,

    accountValueKnown,

    positiveAccountImpact,

    accountImpact: {
      pointChange:
        accountPointChange,

      percentChange:
        accountPercentChange,

      improvedTypeCount:
        getImprovedTypeCount(
          recommendation
        ),

      regressedTypeCount:
        getRegressedTypeCount(
          recommendation
        ),
    },

    valuePerSharedCandy:
      calculateValuePerCandy(
        accountPointChange,
        requiredSharedCandy
      ),

    dominatedByCount:
      0,

    dominatesCount:
      0,

    dominatedBy: [],

    dominates: [],

    frontier:
      false,

    sharedResourceRank:
      null,

    recommendation:
      null,
  }
}

// --------------------------------------------------
// Pareto comparison
// --------------------------------------------------

function dominates(
  first,
  second
) {
  if (
    first
      ?.sharedResource !==
    second
      ?.sharedResource
  ) {
    return false
  }

  const firstValue =
    first
      ?.accountImpact
      ?.pointChange

  const secondValue =
    second
      ?.accountImpact
      ?.pointChange

  const firstCost =
    first
      ?.requiredSharedCandy

  const secondCost =
    second
      ?.requiredSharedCandy

  if (
    !Number.isFinite(
      firstValue
    ) ||
    !Number.isFinite(
      secondValue
    ) ||
    !Number.isFinite(
      firstCost
    ) ||
    !Number.isFinite(
      secondCost
    )
  ) {
    return false
  }

  const atLeastAsValuable =
    firstValue >=
    secondValue

  const noMoreExpensive =
    firstCost <=
    secondCost

  const strictlyBetterValue =
    firstValue >
    secondValue

  const strictlyCheaper =
    firstCost <
    secondCost

  return (
    atLeastAsValuable &&
    noMoreExpensive &&
    (
      strictlyBetterValue ||
      strictlyCheaper
    )
  )
}

function addDominanceMetadata(
  opportunities
) {
  return opportunities.map(
    (opportunity) => {
      const dominatedBy =
        opportunities.filter(
          (other) =>
            other.id !==
              opportunity.id &&
            dominates(
              other,
              opportunity
            )
        )

      const dominatesList =
        opportunities.filter(
          (other) =>
            other.id !==
              opportunity.id &&
            dominates(
              opportunity,
              other
            )
        )

      return {
        ...opportunity,

        dominatedByCount:
          dominatedBy.length,

        dominatesCount:
          dominatesList.length,

        dominatedBy:
          dominatedBy.map(
            (entry) => ({
              id:
                entry.id,

              collectionId:
                entry.collectionId,

              pokemonName:
                entry.pokemonName,

              recommendationTitle:
                entry
                  .recommendationTitle,

              requiredSharedCandy:
                entry
                  .requiredSharedCandy,

              accountPointChange:
                entry
                  .accountImpact
                  .pointChange,
            })
          ),

        dominates:
          dominatesList.map(
            (entry) => ({
              id:
                entry.id,

              collectionId:
                entry.collectionId,

              pokemonName:
                entry.pokemonName,

              recommendationTitle:
                entry
                  .recommendationTitle,

              requiredSharedCandy:
                entry
                  .requiredSharedCandy,

              accountPointChange:
                entry
                  .accountImpact
                  .pointChange,
            })
          ),

        frontier:
          dominatedBy.length ===
          0,
      }
    }
  )
}

// --------------------------------------------------
// Ranking
// --------------------------------------------------

function compareNullableDescending(
  first,
  second
) {
  const firstFinite =
    Number.isFinite(
      first
    )

  const secondFinite =
    Number.isFinite(
      second
    )

  if (
    firstFinite &&
    secondFinite
  ) {
    return second -
      first
  }

  if (firstFinite) {
    return -1
  }

  if (secondFinite) {
    return 1
  }

  return 0
}

function compareNullableAscending(
  first,
  second
) {
  const firstFinite =
    Number.isFinite(
      first
    )

  const secondFinite =
    Number.isFinite(
      second
    )

  if (
    firstFinite &&
    secondFinite
  ) {
    return first -
      second
  }

  if (firstFinite) {
    return -1
  }

  if (secondFinite) {
    return 1
  }

  return 0
}

function compareOpportunities(
  first,
  second
) {
  const firstPositive =
    first
      .positiveAccountImpact
      ? 1
      : 0

  const secondPositive =
    second
      .positiveAccountImpact
      ? 1
      : 0

  if (
    firstPositive !==
    secondPositive
  ) {
    return (
      secondPositive -
      firstPositive
    )
  }

  const firstFrontier =
    first.frontier
      ? 1
      : 0

  const secondFrontier =
    second.frontier
      ? 1
      : 0

  if (
    firstFrontier !==
    secondFrontier
  ) {
    return (
      secondFrontier -
      firstFrontier
    )
  }

  const firstCoverable =
    first
      ?.coverage
      ?.canFullyCover ===
      true
      ? 1
      : 0

  const secondCoverable =
    second
      ?.coverage
      ?.canFullyCover ===
      true
      ? 1
      : 0

  if (
    firstCoverable !==
    secondCoverable
  ) {
    return (
      secondCoverable -
      firstCoverable
    )
  }

  let comparison =
    compareNullableDescending(
      first
        ?.accountImpact
        ?.pointChange,

      second
        ?.accountImpact
        ?.pointChange
    )

  if (comparison !== 0) {
    return comparison
  }

  comparison =
    compareNullableDescending(
      first
        ?.valuePerSharedCandy,

      second
        ?.valuePerSharedCandy
    )

  if (comparison !== 0) {
    return comparison
  }

  comparison =
    compareNullableDescending(
      first
        ?.accountImpact
        ?.percentChange,

      second
        ?.accountImpact
        ?.percentChange
    )

  if (comparison !== 0) {
    return comparison
  }

  comparison =
    compareNullableDescending(
      first
        ?.accountImpact
        ?.improvedTypeCount,

      second
        ?.accountImpact
        ?.improvedTypeCount
    )

  if (comparison !== 0) {
    return comparison
  }

  comparison =
    compareNullableAscending(
      first
        ?.requiredSharedCandy,

      second
        ?.requiredSharedCandy
    )

  if (comparison !== 0) {
    return comparison
  }

  return (
    (
      first
        ?.accountAwareRank ??
      Number.MAX_SAFE_INTEGER
    ) -
    (
      second
        ?.accountAwareRank ??
      Number.MAX_SAFE_INTEGER
    )
  )
}

// --------------------------------------------------
// Recommendation classification
// --------------------------------------------------

function classifyOpportunity(
  opportunity,
  rank
) {
  if (
    opportunity
      .accountValueKnown !==
    true
  ) {
    return {
      type:
        RARE_CANDY_USE_RECOMMENDATION
          .ACCOUNT_VALUE_UNKNOWN,

      label:
        'Account Value Unknown',

      summary:
        'PokeIQ knows the Candy shortfall but does not have enough account-impact information to judge whether shared Candy is a good use here.',
    }
  }

  if (
    opportunity
      .positiveAccountImpact !==
    true
  ) {
    return {
      type:
        RARE_CANDY_USE_RECOMMENDATION
          .SAVE,

      label:
        'Save',

      summary:
        `Using ${opportunity.sharedResourceLabel} here does not currently produce a positive overall raid-account improvement.`,
    }
  }

  if (
    opportunity
      ?.coverage
      ?.known !==
      true
  ) {
    return {
      type:
        RARE_CANDY_USE_RECOMMENDATION
          .BALANCE_UNKNOWN,

      label:
        'Balance Unknown',

      summary:
        `PokeIQ can evaluate this investment, but your ${opportunity.sharedResourceLabel} balance is unknown.`,
    }
  }

  if (
    opportunity
      ?.coverage
      ?.canFullyCover !==
      true
  ) {
    return {
      type:
        RARE_CANDY_USE_RECOMMENDATION
          .NOT_ENOUGH,

      label:
        'Not Enough',

      summary:
        `This investment would need ${opportunity.requiredSharedCandy.toLocaleString(
          'en-CA'
        )} ${opportunity.sharedResourceLabel}, more than your currently recorded balance can provide.`,
    }
  }

  if (
    opportunity
      .dominatedByCount >
    0
  ) {
    const better =
      opportunity
        .dominatedBy[0]

    const betterText =
      better
        ? (
            `${better.pokemonName} — ${better.recommendationTitle}`
          )
        : 'another current investment'

    return {
      type:
        RARE_CANDY_USE_RECOMMENDATION
          .SAVE,

      label:
        'Save',

      summary:
        `A currently known investment (${betterText}) provides at least as much account improvement while requiring no more ${opportunity.sharedResourceLabel}.`,
    }
  }

  if (rank === 1) {
    return {
      type:
        RARE_CANDY_USE_RECOMMENDATION
          .BEST_CURRENT_USE,

      label:
        'Best Current Use',

      summary:
        `Among the currently known ${opportunity.sharedResourceLabel} opportunities, this is the strongest current use identified by PokeIQ.`,
    }
  }

  return {
    type:
      RARE_CANDY_USE_RECOMMENDATION
        .GOOD,

    label:
      'Good',

    summary:
      `This investment sits on the current ${opportunity.sharedResourceLabel} value frontier: no known alternative gives at least as much account improvement for less or equal shared Candy.`,
  }
}

function rankResourceOpportunities(
  opportunities
) {
  const withDominance =
    addDominanceMetadata(
      opportunities
    )

  return withDominance
    .sort(
      compareOpportunities
    )
    .map(
      (
        opportunity,
        index
      ) => {
        const rank =
          index + 1

        return {
          ...opportunity,

          sharedResourceRank:
            rank,

          recommendation:
            classifyOpportunity(
              opportunity,
              rank
            ),
        }
      }
    )
}

// --------------------------------------------------
// Best target helpers
// --------------------------------------------------

function isEligibleBestTarget(
  opportunity
) {
  return (
    opportunity
      ?.accountValueKnown ===
      true &&
    opportunity
      ?.positiveAccountImpact ===
      true &&
    opportunity
      ?.frontier ===
      true
  )
}

function buildBestTarget(
  opportunities
) {
  const target =
    (
      opportunities ??
      []
    ).find(
      isEligibleBestTarget
    ) ??
    null

  if (!target) {
    return null
  }

  return {
    id:
      target.id,

    collectionId:
      target.collectionId,

    pokemonName:
      target.pokemonName,

    recommendationTitle:
      target.recommendationTitle,

    sharedResource:
      target.sharedResource,

    sharedResourceLabel:
      target.sharedResourceLabel,

    requiredSharedCandy:
      target.requiredSharedCandy,

    ownedSharedCandy:
      target
        ?.coverage
        ?.owned ??
      null,

    additionalNeeded:
      target
        ?.coverage
        ?.additionalNeeded ??
      null,

    canFullyCover:
      target
        ?.coverage
        ?.canFullyCover ??
      null,

    accountPointChange:
      target
        ?.accountImpact
        ?.pointChange ??
      null,

    accountPercentChange:
      target
        ?.accountImpact
        ?.percentChange ??
      null,

    improvedTypeCount:
      target
        ?.accountImpact
        ?.improvedTypeCount ??
      0,

    regressedTypeCount:
      target
        ?.accountImpact
        ?.regressedTypeCount ??
      0,

    valuePerSharedCandy:
      target
        ?.valuePerSharedCandy ??
      null,

    sharedResourceRank:
      target
        ?.sharedResourceRank ??
      null,

    currentDecision:
      target
        ?.recommendation ??
      null,
  }
}

// --------------------------------------------------
// Recommendation enrichment
// --------------------------------------------------

function buildRecommendationIntelligence(
  recommendation,
  opportunities
) {
  const matching =
    opportunities.filter(
      (opportunity) =>
        opportunity
          .recommendationIndex ===
        recommendation
          .__rareCandyRecommendationIndex
    )

  if (
    matching.length ===
    0
  ) {
    return {
      hasSharedCandyOpportunity:
        false,

      opportunityCount:
        0,

      opportunities: [],

      rareCandy:
        null,

      rareCandyXL:
        null,
    }
  }

  return {
    hasSharedCandyOpportunity:
      true,

    opportunityCount:
      matching.length,

    opportunities:
      matching,

    rareCandy:
      matching.find(
        (opportunity) =>
          opportunity
            .sharedResource ===
          SHARED_CANDY_RESOURCE
            .RARE_CANDY
      ) ??
      null,

    rareCandyXL:
      matching.find(
        (opportunity) =>
          opportunity
            .sharedResource ===
          SHARED_CANDY_RESOURCE
            .RARE_CANDY_XL
      ) ??
      null,
  }
}

// --------------------------------------------------
// Public API
// --------------------------------------------------

export function evaluateRareCandyOpportunityCost(
  recommendations
) {
  if (
    !Array.isArray(
      recommendations
    )
  ) {
    return {
      status:
        RARE_CANDY_OPPORTUNITY_COST_STATUS
          .INVALID_RECOMMENDATIONS,

      recommendationCount:
        0,

      opportunityCount:
        0,

      rareCandyOpportunityCount:
        0,

      rareCandyXlOpportunityCount:
        0,

      recommendations: [],

      opportunities: [],

      resourceRankings: {
        rareCandy: [],
        rareCandyXL: [],
      },

      bestCurrentUses: {
        rareCandy: null,
        rareCandyXL: null,
      },

      bestTargets: {
        rareCandy: null,
        rareCandyXL: null,
      },
    }
  }

  const indexedRecommendations =
    recommendations.map(
      (
        recommendation,
        index
      ) => ({
        ...recommendation,

        __rareCandyRecommendationIndex:
          index,
      })
    )

  const rawOpportunities = []

  indexedRecommendations.forEach(
    (
      recommendation,
      recommendationIndex
    ) => {
      const evaluations =
        getCandyEvaluations(
          recommendation
        )

      evaluations.forEach(
        (
          evaluation,
          opportunityIndex
        ) => {
          rawOpportunities.push(
            buildOpportunity({
              recommendation,
              recommendationIndex,
              evaluation,
              opportunityIndex,
            })
          )
        }
      )
    }
  )

  if (
    rawOpportunities.length ===
    0
  ) {
    return {
      status:
        RARE_CANDY_OPPORTUNITY_COST_STATUS
          .NO_OPPORTUNITIES,

      recommendationCount:
        recommendations.length,

      opportunityCount:
        0,

      rareCandyOpportunityCount:
        0,

      rareCandyXlOpportunityCount:
        0,

      recommendations:
        indexedRecommendations.map(
          (recommendation) => {
            const {
              __rareCandyRecommendationIndex,
              ...cleanRecommendation
            } =
              recommendation

            return {
              ...cleanRecommendation,

              rareCandyIntelligence: {
                hasSharedCandyOpportunity:
                  false,

                opportunityCount:
                  0,

                opportunities: [],

                rareCandy:
                  null,

                rareCandyXL:
                  null,
              },
            }
          }
        ),

      opportunities: [],

      resourceRankings: {
        rareCandy: [],
        rareCandyXL: [],
      },

      bestCurrentUses: {
        rareCandy: null,
        rareCandyXL: null,
      },

      bestTargets: {
        rareCandy: null,
        rareCandyXL: null,
      },
    }
  }

  const rareCandyOpportunities =
    rankResourceOpportunities(
      rawOpportunities.filter(
        (opportunity) =>
          opportunity
            .sharedResource ===
          SHARED_CANDY_RESOURCE
            .RARE_CANDY
      )
    )

  const rareCandyXlOpportunities =
    rankResourceOpportunities(
      rawOpportunities.filter(
        (opportunity) =>
          opportunity
            .sharedResource ===
          SHARED_CANDY_RESOURCE
            .RARE_CANDY_XL
      )
    )

  const opportunities = [
    ...rareCandyOpportunities,
    ...rareCandyXlOpportunities,
  ]

  const enrichedRecommendations =
    indexedRecommendations.map(
      (recommendation) => {
        const intelligence =
          buildRecommendationIntelligence(
            recommendation,
            opportunities
          )

        const {
          __rareCandyRecommendationIndex,
          ...cleanRecommendation
        } =
          recommendation

        return {
          ...cleanRecommendation,

          rareCandyIntelligence:
            intelligence,
        }
      }
    )

  const bestCurrentRareCandy =
    rareCandyOpportunities.find(
      (opportunity) =>
        opportunity
          ?.recommendation
          ?.type ===
        RARE_CANDY_USE_RECOMMENDATION
          .BEST_CURRENT_USE
    ) ??
    null

  const bestCurrentRareCandyXL =
    rareCandyXlOpportunities.find(
      (opportunity) =>
        opportunity
          ?.recommendation
          ?.type ===
        RARE_CANDY_USE_RECOMMENDATION
          .BEST_CURRENT_USE
    ) ??
    null

  return {
    status:
      RARE_CANDY_OPPORTUNITY_COST_STATUS
        .SUCCESS,

    recommendationCount:
      recommendations.length,

    opportunityCount:
      opportunities.length,

    rareCandyOpportunityCount:
      rareCandyOpportunities
        .length,

    rareCandyXlOpportunityCount:
      rareCandyXlOpportunities
        .length,

    recommendations:
      enrichedRecommendations,

    opportunities,

    resourceRankings: {
      rareCandy:
        rareCandyOpportunities,

      rareCandyXL:
        rareCandyXlOpportunities,
    },

    bestCurrentUses: {
      rareCandy:
        bestCurrentRareCandy,

      rareCandyXL:
        bestCurrentRareCandyXL,
    },

    bestTargets: {
      rareCandy:
        buildBestTarget(
          rareCandyOpportunities
        ),

      rareCandyXL:
        buildBestTarget(
          rareCandyXlOpportunities
        ),
    },
  }
}