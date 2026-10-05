// --------------------------------------------------
// Raid Type Recommendation Selector V1
//
// Selects at most one already-enriched Raid Investment
// recommendation for each attacking type.
//
// This service does NOT build, rank, or enrich Raid
// Investment recommendations. It consumes the existing
// Dashboard recommendation results after account-impact
// enrichment and answers:
//
// "Which single available recommendation would improve
//  this attacking team the most?"
// --------------------------------------------------

export const RAID_TYPE_RECOMMENDATION_STATUS = {
  SUCCESS:
    'SUCCESS',

  INVALID_RECOMMENDATIONS:
    'INVALID_RECOMMENDATIONS',
}

export const RAID_ATTACK_TYPES = [
  'BUG',
  'DARK',
  'DRAGON',
  'ELECTRIC',
  'FAIRY',
  'FIGHTING',
  'FIRE',
  'FLYING',
  'GHOST',
  'GRASS',
  'GROUND',
  'ICE',
  'NORMAL',
  'POISON',
  'PSYCHIC',
  'ROCK',
  'STEEL',
  'WATER',
]

const MINIMUM_RATING_GAIN =
  0.01

const CLOSE_RATING_GAIN_POINTS =
  1

const CLOSE_RATING_GAIN_RATIO =
  0.9

const RESOURCE_BURDEN_PRIORITY = {
  NONE: 0,
  FREE: 0,
  LOW: 1,
  MODERATE: 2,
  HIGH: 3,
  PREMIUM: 4,
}

function toFiniteNumber(
  value
) {
  const numericValue =
    Number(value)

  return Number.isFinite(
    numericValue
  )
    ? numericValue
    : null
}

function round(
  value,
  precision = 2
) {
  const numericValue =
    toFiniteNumber(
      value
    )

  if (
    numericValue ===
    null
  ) {
    return null
  }

  const multiplier =
    10 ** precision

  return (
    Math.round(
      (
        numericValue +
        Number.EPSILON
      ) *
        multiplier
    ) /
    multiplier
  )
}

function getTypeTeam(
  profile,
  type
) {
  const types =
    profile?.types

  if (!types) {
    return null
  }

  if (
    !Array.isArray(
      types
    ) &&
    typeof types ===
      'object'
  ) {
    return (
      types[type] ??
      null
    )
  }

  if (
    !Array.isArray(
      types
    )
  ) {
    return null
  }

  return (
    types.find(
      (team) =>
        team?.type ===
        type
    ) ??
    null
  )
}

function getExcludedCollectionIdSet(
  excludedCollectionIds
) {
  if (
    excludedCollectionIds instanceof
    Set
  ) {
    return excludedCollectionIds
  }

  if (
    Array.isArray(
      excludedCollectionIds
    )
  ) {
    return new Set(
      excludedCollectionIds
    )
  }

  return new Set()
}

function getResourceBurdenPriority(
  recommendation
) {
  const resourceBurden =
    String(
      recommendation
        ?.resourceBurdenType ??
      'NONE'
    ).toUpperCase()

  return (
    RESOURCE_BURDEN_PRIORITY[
      resourceBurden
    ] ??
    Number.MAX_SAFE_INTEGER
  )
}

function buildCandidate({
  recommendation,
  recommendationIndex,
  type,
}) {
  const accountImpact =
    recommendation
      ?.accountImpact

  const currentTeam =
    getTypeTeam(
      accountImpact
        ?.currentProfile,
      type
    )

  const projectedTeam =
    getTypeTeam(
      accountImpact
        ?.projectedProfile,
      type
    )

  if (
    !currentTeam ||
    !projectedTeam
  ) {
    return null
  }

  const currentRating =
    toFiniteNumber(
      currentTeam
        .typeTeamRating
    )

  const projectedRating =
    toFiniteNumber(
      projectedTeam
        .typeTeamRating
    )

  const currentRawStrength =
    toFiniteNumber(
      currentTeam
        .rawStrengthScore
    )

  const projectedRawStrength =
    toFiniteNumber(
      projectedTeam
        .rawStrengthScore
    )

  if (
    currentRating ===
      null ||
    projectedRating ===
      null ||
    currentRawStrength ===
      null ||
    projectedRawStrength ===
      null
  ) {
    return null
  }

  const ratingGain =
    projectedRating -
    currentRating

  const rawStrengthGain =
    projectedRawStrength -
    currentRawStrength

  if (
    ratingGain <
      MINIMUM_RATING_GAIN ||
    rawStrengthGain <=
      0
  ) {
    return null
  }

  const impact =
    (
      accountImpact
        ?.affectedTypes ??
      []
    ).find(
      (typeImpact) =>
        typeImpact?.type ===
        type
    ) ??
    null

  return {
    type,

    collectionId:
      recommendation
        .collectionId,

    pokemonName:
      recommendation
        .pokemonName,

    pokemon:
      recommendation
        .pokemon ??
      null,

    ownedPokemon:
      recommendation
        .ownedPokemon ??
      null,

    title:
      recommendation
        .title ??
      null,

    actionPathText:
      recommendation
        .actionPathText ??
      null,

    resourceSummary:
      recommendation
        .resourceSummary ??
      null,

    recommendationType:
      recommendation
        .recommendationType ??
      null,

    actionable:
      recommendation
        .actionable ===
      true,

    currentRating:
      round(
        currentRating
      ),

    projectedRating:
      round(
        projectedRating
      ),

    ratingGain:
      round(
        ratingGain
      ),

    currentRawStrength:
      round(
        currentRawStrength,
        6
      ),

    projectedRawStrength:
      round(
        projectedRawStrength,
        6
      ),

    rawStrengthGain:
      round(
        rawStrengthGain,
        6
      ),

    teamChanged:
      impact
        ?.teamChanged ===
      true,

    createsNewCoverage:
      impact
        ?.newCoverage ===
      true,

    resourceBurden:
      recommendation
        .resourceBurden ??
      null,

    resourceBurdenType:
      recommendation
        .resourceBurdenType ??
      null,

    dashboardRank:
      recommendation
        .rank ??
      recommendationIndex +
        1,

    engineRank:
      recommendation
        .engineRank ??
      null,

    opportunity:
      recommendation
        .opportunity,

    recommendation,

    ranking: {
      recommendationIndex,

      resourceBurdenPriority:
        getResourceBurdenPriority(
          recommendation
        ),
    },
  }
}

function gainsAreClose(
  candidateA,
  candidateB
) {
  const largerGain =
    Math.max(
      candidateA.ratingGain,
      candidateB.ratingGain
    )

  const smallerGain =
    Math.min(
      candidateA.ratingGain,
      candidateB.ratingGain
    )

  return (
    largerGain -
      smallerGain <=
      CLOSE_RATING_GAIN_POINTS ||
    smallerGain >=
      largerGain *
        CLOSE_RATING_GAIN_RATIO
  )
}

function compareCandidates(
  candidateA,
  candidateB
) {
  if (
    !gainsAreClose(
      candidateA,
      candidateB
    )
  ) {
    return (
      candidateB.ratingGain -
      candidateA.ratingGain
    )
  }

  if (
    candidateA.actionable !==
    candidateB.actionable
  ) {
    return candidateA.actionable
      ? -1
      : 1
  }

  const resourceDifference =
    candidateA
      .ranking
      .resourceBurdenPriority -
    candidateB
      .ranking
      .resourceBurdenPriority

  if (
    resourceDifference !==
    0
  ) {
    return resourceDifference
  }

  if (
    candidateA.ratingGain !==
    candidateB.ratingGain
  ) {
    return (
      candidateB.ratingGain -
      candidateA.ratingGain
    )
  }

  if (
    candidateA.rawStrengthGain !==
    candidateB.rawStrengthGain
  ) {
    return (
      candidateB.rawStrengthGain -
      candidateA.rawStrengthGain
    )
  }

  return (
    candidateA
      .ranking
      .recommendationIndex -
    candidateB
      .ranking
      .recommendationIndex
  )
}

function removeInternalRanking(
  candidate
) {
  if (!candidate) {
    return null
  }

  const {
    ranking,
    ...recommendation
  } = candidate

  return recommendation
}

export function selectRaidTypeRecommendations({
  recommendations,
  excludedCollectionIds = [],
}) {
  const byType =
    Object.fromEntries(
      RAID_ATTACK_TYPES.map(
        (type) => [
          type,
          null,
        ]
      )
    )

  if (
    !Array.isArray(
      recommendations
    )
  ) {
    return {
      status:
        RAID_TYPE_RECOMMENDATION_STATUS
          .INVALID_RECOMMENDATIONS,

      byType,

      recommendations: [],

      recommendationCount:
        0,

      coveredTypeCount:
        0,

      emptyTypeCount:
        RAID_ATTACK_TYPES
          .length,

      excludedRecommendationCount:
        0,
    }
  }

  const excludedIds =
    getExcludedCollectionIdSet(
      excludedCollectionIds
    )

  const availableRecommendations =
    recommendations.filter(
      (recommendation) =>
        recommendation
          ?.collectionId &&
        !excludedIds.has(
          recommendation
            .collectionId
        )
    )

  RAID_ATTACK_TYPES.forEach(
    (type) => {
      const candidates =
        availableRecommendations
          .map(
            (
              recommendation,
              recommendationIndex
            ) =>
              buildCandidate({
                recommendation,
                recommendationIndex,
                type,
              })
          )
          .filter(Boolean)
          .sort(
            compareCandidates
          )

      byType[type] =
        removeInternalRanking(
          candidates[0] ??
          null
        )
    }
  )

  const selectedRecommendations =
    RAID_ATTACK_TYPES
      .map(
        (type) =>
          byType[type]
      )
      .filter(Boolean)

  return {
    status:
      RAID_TYPE_RECOMMENDATION_STATUS
        .SUCCESS,

    byType,

    recommendations:
      selectedRecommendations,

    recommendationCount:
      selectedRecommendations
        .length,

    coveredTypeCount:
      selectedRecommendations
        .length,

    emptyTypeCount:
      RAID_ATTACK_TYPES
        .length -
      selectedRecommendations
        .length,

    excludedRecommendationCount:
      recommendations.length -
      availableRecommendations
        .length,
  }
}

export default selectRaidTypeRecommendations