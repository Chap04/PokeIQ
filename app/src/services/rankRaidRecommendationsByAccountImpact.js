// --------------------------------------------------
// Account-Aware Raid Recommendation Ranking V1
//
// This layer ranks already-built Raid Investment
// recommendations using their mechanical impact on
// the player's current 18-type raid profile.
//
// IMPORTANT:
//
// This does NOT replace the underlying Raid Investment
// ranking.
//
// The existing recommendation order remains available
// as the fallback / tie-breaker and still represents:
//
// - actionability / safety
// - resulting Raid Strength
// - investment value
// - performance evidence
// - confidence
//
// This layer adds:
//
// - actual account improvement
// - breadth of useful type improvement
//
// It deliberately does NOT include:
//
// - resources
// - Rare Candy opportunity cost
// - availability forecasting
// - player preferences
// - boss-specific performance
// --------------------------------------------------

// --------------------------------------------------
// Status
// --------------------------------------------------

export const RAID_ACCOUNT_RANKING_STATUS = {
  SUCCESS:
    'SUCCESS',

  INVALID_RECOMMENDATIONS:
    'INVALID_RECOMMENDATIONS',
}

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function finiteOrFallback(
  value,
  fallback = 0
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

function getImpactSummary(
  recommendation
) {
  return (
    recommendation
      ?.accountImpactSummary ??
    null
  )
}

// --------------------------------------------------
// Impact class
//
// Higher = better.
//
// Positive account impact is preferred.
//
// Zero-impact recommendations remain valid and visible.
// They simply rank below investments that measurably
// improve the current account.
//
// Regressions remain visible but rank last.
// --------------------------------------------------

function getImpactClass(
  recommendation
) {
  const summary =
    getImpactSummary(
      recommendation
    )

  if (!summary) {
    return 0
  }

  const overallChange =
    finiteOrFallback(
      summary
        .overallStrengthPointChange,
      0
    )

  if (
    overallChange >
    0
  ) {
    return 3
  }

  if (
    overallChange ===
      0 &&
    (
      summary
        .affectedTypeCount ??
      0
    ) ===
      0
  ) {
    return 2
  }

  if (
    overallChange ===
    0
  ) {
    return 1
  }

  return -1
}

function getOverallImpact(
  recommendation
) {
  return finiteOrFallback(
    getImpactSummary(
      recommendation
    )
      ?.overallStrengthPointChange,
    Number.NEGATIVE_INFINITY
  )
}

function getOverallPercentImpact(
  recommendation
) {
  return finiteOrFallback(
    getImpactSummary(
      recommendation
    )
      ?.overallStrengthPercentChange,
    Number.NEGATIVE_INFINITY
  )
}

function getImprovedTypeCount(
  recommendation
) {
  return finiteOrFallback(
    getImpactSummary(
      recommendation
    )
      ?.improvedTypeCount,
    0
  )
}

function getAffectedTypeCount(
  recommendation
) {
  return finiteOrFallback(
    getImpactSummary(
      recommendation
    )
      ?.affectedTypeCount,
    0
  )
}

function getBiggestTypeGain(
  recommendation
) {
  return finiteOrFallback(
    getImpactSummary(
      recommendation
    )
      ?.biggestImprovement
      ?.percentChange,
    Number.NEGATIVE_INFINITY
  )
}

// --------------------------------------------------
// Comparator
//
// V1 ordering:
//
// 1. Impact class
// 2. Overall account point improvement
// 3. Overall account percent improvement
// 4. Improved type count
// 5. Affected type count
// 6. Biggest individual type gain
// 7. Existing recommendation order
//
// Existing order is deliberately the final tie-breaker.
// We are layering account intelligence on top of the
// established Raid Investment evaluation rather than
// deleting it.
// --------------------------------------------------

function compareAccountAwareRecommendations(
  first,
  second
) {
  const impactClassComparison =
    compareDescending(
      getImpactClass(
        first.recommendation
      ),

      getImpactClass(
        second.recommendation
      )
    )

  if (
    impactClassComparison !==
    0
  ) {
    return impactClassComparison
  }

  const overallImpactComparison =
    compareDescending(
      getOverallImpact(
        first.recommendation
      ),

      getOverallImpact(
        second.recommendation
      )
    )

  if (
    overallImpactComparison !==
    0
  ) {
    return overallImpactComparison
  }

  const overallPercentComparison =
    compareDescending(
      getOverallPercentImpact(
        first.recommendation
      ),

      getOverallPercentImpact(
        second.recommendation
      )
    )

  if (
    overallPercentComparison !==
    0
  ) {
    return overallPercentComparison
  }

  const improvedTypeComparison =
    compareDescending(
      getImprovedTypeCount(
        first.recommendation
      ),

      getImprovedTypeCount(
        second.recommendation
      )
    )

  if (
    improvedTypeComparison !==
    0
  ) {
    return improvedTypeComparison
  }

  const affectedTypeComparison =
    compareDescending(
      getAffectedTypeCount(
        first.recommendation
      ),

      getAffectedTypeCount(
        second.recommendation
      )
    )

  if (
    affectedTypeComparison !==
    0
  ) {
    return affectedTypeComparison
  }

  const biggestGainComparison =
    compareDescending(
      getBiggestTypeGain(
        first.recommendation
      ),

      getBiggestTypeGain(
        second.recommendation
      )
    )

  if (
    biggestGainComparison !==
    0
  ) {
    return biggestGainComparison
  }

  return (
    first.originalIndex -
    second.originalIndex
  )
}

// --------------------------------------------------
// Public API
// --------------------------------------------------

export function rankRaidRecommendationsByAccountImpact(
  recommendations
) {
  if (
    !Array.isArray(
      recommendations
    )
  ) {
    return {
      status:
        RAID_ACCOUNT_RANKING_STATUS
          .INVALID_RECOMMENDATIONS,

      recommendations: [],

      recommendationCount:
        0,

      positiveImpactCount:
        0,

      zeroImpactCount:
        0,

      regressionCount:
        0,
    }
  }

  const wrapped =
    recommendations.map(
      (
        recommendation,
        originalIndex
      ) => ({
        recommendation,

        originalIndex,

        previousRank:
          recommendation
            ?.actionableRank ??
          recommendation
            ?.rank ??
          originalIndex + 1,
      })
    )

  const sorted =
    [
      ...wrapped,
    ].sort(
      compareAccountAwareRecommendations
    )

  const rankedRecommendations =
    sorted.map(
      (
        entry,
        index
      ) => ({
        ...entry.recommendation,

        previousAccountAwareRank:
          entry.previousRank,

        accountAwareRank:
          index + 1,

        accountAwareRankChange:
          entry.previousRank -
          (
            index + 1
          ),
      })
    )

  const positiveImpactCount =
    rankedRecommendations.filter(
      (recommendation) =>
        getImpactClass(
          recommendation
        ) ===
        3
    ).length

  const zeroImpactCount =
    rankedRecommendations.filter(
      (recommendation) =>
        getImpactClass(
          recommendation
        ) ===
        2
    ).length

  const regressionCount =
    rankedRecommendations.filter(
      (recommendation) =>
        getImpactClass(
          recommendation
        ) <
        0
    ).length

  return {
    status:
      RAID_ACCOUNT_RANKING_STATUS
        .SUCCESS,

    recommendations:
      rankedRecommendations,

    recommendationCount:
      rankedRecommendations.length,

    positiveImpactCount,

    zeroImpactCount,

    regressionCount,
  }
}