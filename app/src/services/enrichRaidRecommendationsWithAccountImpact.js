import {
  evaluateRaidAccountImpact,
  RAID_ACCOUNT_IMPACT_STATUS,
} from './evaluateRaidAccountImpact.js'

// --------------------------------------------------
// Raid Recommendation Account-Impact Enrichment V1
//
// Adds mechanical 18-type account impact to already
// ranked/formatted Raid Investment recommendations.
//
// IMPORTANT:
//
// This service does NOT:
//
// - change recommendation order
// - change Raid Investment ranking
// - filter recommendations
// - apply resource actionability
// - apply account-need weighting
// - apply availability weighting
// - apply boss-specific weighting
//
// It simply answers:
//
// "What happens to the player's current raid account
//  if this recommendation is completed?"
// --------------------------------------------------

// --------------------------------------------------
// Status
// --------------------------------------------------

export const RAID_RECOMMENDATION_IMPACT_STATUS = {
  SUCCESS:
    'SUCCESS',

  INVALID_RECOMMENDATIONS:
    'INVALID_RECOMMENDATIONS',

  INVALID_PROFILE:
    'INVALID_PROFILE',
}

// --------------------------------------------------
// Compact impact summary
//
// Recommendations keep the full accountImpact result,
// but this summary gives UI / future scoring layers a
// smaller stable shape to consume.
// --------------------------------------------------

function buildAccountImpactSummary(
  accountImpact
) {
  if (
    accountImpact?.status !==
      RAID_ACCOUNT_IMPACT_STATUS
        .SUCCESS
  ) {
    return null
  }

  const improvedTypes =
    (
      accountImpact
        .improvedTypes ??
      []
    ).map(
      (impact) => ({
        type:
          impact.type,

        pointChange:
          impact
            .strengthPointChange,

        percentChange:
          impact
            .strengthPercentChange,

        absolutePointChange:
          impact
            .absoluteStrengthPointChange,

        absolutePercentChange:
          impact
            .absoluteStrengthPercentChange,

        teamChanged:
          impact
            .teamChanged ===
          true,

        newCoverage:
          impact
            .newCoverage ===
          true,
      })
    )

  const regressedTypes =
    (
      accountImpact
        .regressedTypes ??
      []
    ).map(
      (impact) => ({
        type:
          impact.type,

        pointChange:
          impact
            .strengthPointChange,

        percentChange:
          impact
            .strengthPercentChange,

        absolutePointChange:
          impact
            .absoluteStrengthPointChange,

        absolutePercentChange:
          impact
            .absoluteStrengthPercentChange,

        teamChanged:
          impact
            .teamChanged ===
          true,

        lostCoverage:
          impact
            .lostCoverage ===
          true,
      })
    )

  const biggestImprovement =
    improvedTypes[0] ??
    null

  const biggestRegression =
    regressedTypes[
      regressedTypes.length -
        1
    ] ??
    null

  return {
    overallStrengthPointChange:
      accountImpact
        .overallStrengthPointChange,

    overallStrengthPercentChange:
      accountImpact
        .overallStrengthPercentChange,

    overallAbsoluteStrengthPointChange:
      accountImpact
        .overallAbsoluteStrengthPointChange,

    overallAbsoluteStrengthPercentChange:
      accountImpact
        .overallAbsoluteStrengthPercentChange,

    affectedTypeCount:
      accountImpact
        .affectedTypeCount,

    improvedTypeCount:
      accountImpact
        .improvedTypeCount,

    regressedTypeCount:
      accountImpact
        .regressedTypeCount,

    improvedTypes,

    regressedTypes,

    biggestImprovement,

    biggestRegression,

    changesCurrentTypeTeam:
      (
        accountImpact
          .affectedTypes ??
        []
      ).some(
        (impact) =>
          impact
            .teamChanged ===
          true
      ),

    createsNewTypeCoverage:
      (
        accountImpact
          .affectedTypes ??
        []
      ).some(
        (impact) =>
          impact
            .newCoverage ===
          true
      ),

    losesTypeCoverage:
      (
        accountImpact
          .affectedTypes ??
        []
      ).some(
        (impact) =>
          impact
            .lostCoverage ===
          true
      ),
  }
}

// --------------------------------------------------
// One recommendation
// --------------------------------------------------

export function enrichRaidRecommendationWithAccountImpact({
  recommendation,
  currentProfile,
}) {
  if (!recommendation) {
    return recommendation
  }

  const collectionId =
    recommendation
      ?.collectionId

  const opportunity =
    recommendation
      ?.opportunity

  if (
    !collectionId ||
    !opportunity
  ) {
    return {
      ...recommendation,

      accountImpact:
        null,

      accountImpactSummary:
        null,

      accountImpactStatus:
        RAID_ACCOUNT_IMPACT_STATUS
          .INVALID_OPPORTUNITY,
    }
  }

  const accountImpact =
    evaluateRaidAccountImpact({
      currentProfile,

      collectionId,

      opportunity,
    })

  return {
    ...recommendation,

    accountImpact,

    accountImpactSummary:
      buildAccountImpactSummary(
        accountImpact
      ),

    accountImpactStatus:
      accountImpact
        ?.status ??
      null,
  }
}

// --------------------------------------------------
// Recommendation collection
// --------------------------------------------------

export function enrichRaidRecommendationsWithAccountImpact({
  recommendations,
  currentProfile,
}) {
  if (
    !Array.isArray(
      recommendations
    )
  ) {
    return {
      status:
        RAID_RECOMMENDATION_IMPACT_STATUS
          .INVALID_RECOMMENDATIONS,

      recommendations: [],

      successfulCount:
        0,

      failedCount:
        0,

      zeroImpactCount:
        0,

      positiveImpactCount:
        0,

      regressionCount:
        0,
    }
  }

  if (!currentProfile) {
    return {
      status:
        RAID_RECOMMENDATION_IMPACT_STATUS
          .INVALID_PROFILE,

      recommendations:
        recommendations.map(
          (recommendation) => ({
            ...recommendation,

            accountImpact:
              null,

            accountImpactSummary:
              null,

            accountImpactStatus:
              null,
          })
        ),

      successfulCount:
        0,

      failedCount:
        recommendations.length,

      zeroImpactCount:
        0,

      positiveImpactCount:
        0,

      regressionCount:
        0,
    }
  }

  const enriched =
    recommendations.map(
      (recommendation) =>
        enrichRaidRecommendationWithAccountImpact({
          recommendation,

          currentProfile,
        })
    )

  const successful =
    enriched.filter(
      (recommendation) =>
        recommendation
          ?.accountImpactStatus ===
        RAID_ACCOUNT_IMPACT_STATUS
          .SUCCESS
    )

  const failed =
    enriched.filter(
      (recommendation) =>
        recommendation
          ?.accountImpactStatus !==
        RAID_ACCOUNT_IMPACT_STATUS
          .SUCCESS
    )

  const positiveImpact =
    successful.filter(
      (recommendation) =>
        (
          recommendation
            ?.accountImpactSummary
            ?.overallStrengthPointChange ??
          0
        ) >
        0
    )

  const regression =
    successful.filter(
      (recommendation) =>
        (
          recommendation
            ?.accountImpactSummary
            ?.overallStrengthPointChange ??
          0
        ) <
        0
    )

  const zeroImpact =
    successful.filter(
      (recommendation) =>
        (
          recommendation
            ?.accountImpactSummary
            ?.overallStrengthPointChange ??
          0
        ) ===
          0 &&
        (
          recommendation
            ?.accountImpactSummary
            ?.affectedTypeCount ??
          0
        ) ===
          0
    )

  return {
    status:
      RAID_RECOMMENDATION_IMPACT_STATUS
        .SUCCESS,

    recommendations:
      enriched,

    successfulCount:
      successful.length,

    failedCount:
      failed.length,

    zeroImpactCount:
      zeroImpact.length,

    positiveImpactCount:
      positiveImpact.length,

    regressionCount:
      regression.length,
  }
}