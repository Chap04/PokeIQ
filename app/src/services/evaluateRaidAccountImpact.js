import {
  projectRaidTypeProfile,
  RAID_ATTACK_TYPES,
  RAID_TYPE_PROFILE_STATUS,
  RAID_TYPE_PROFILE_PROJECTION_STATUS,
} from './buildRaidTypeProfile.js'

// --------------------------------------------------
// Raid Account Impact V1
//
// Compares:
//
// CURRENT 18-Type Account Profile
//
// against:
//
// PROJECTED 18-Type Account Profile
//
// after applying exactly one already-evaluated Raid
// Investment possible state.
//
// This remains completely boss-agnostic.
//
// It answers:
//
// "If I make this investment, how much stronger does
//  my raid account become?"
// --------------------------------------------------

// --------------------------------------------------
// Status
// --------------------------------------------------

export const RAID_ACCOUNT_IMPACT_STATUS = {
  SUCCESS:
    'SUCCESS',

  INVALID_PROFILE:
    'INVALID_PROFILE',

  INVALID_OPPORTUNITY:
    'INVALID_OPPORTUNITY',

  PROJECTION_FAILED:
    'PROJECTION_FAILED',
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

function round(
  value,
  decimals = 2
) {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return null
  }

  const multiplier =
    10 ** decimals

  return (
    Math.round(
      value *
        multiplier
    ) /
    multiplier
  )
}

function average(
  values
) {
  const finiteValues =
    values.filter(
      Number.isFinite
    )

  if (
    finiteValues.length ===
    0
  ) {
    return null
  }

  return (
    finiteValues.reduce(
      (
        total,
        value
      ) =>
        total +
        value,
      0
    ) /
    finiteValues.length
  )
}

function calculatePercentChange({
  current,
  projected,
}) {
  if (
    !Number.isFinite(
      current
    ) ||
    !Number.isFinite(
      projected
    )
  ) {
    return null
  }

  if (current === 0) {
    return projected === 0
      ? 0
      : null
  }

  return round(
    (
      (
        projected -
        current
      ) /
      current
    ) *
      100,
    2
  )
}

function getTeamMemberKey(
  member
) {
  if (!member) {
    return ''
  }

  return [
    member
      ?.collectionId ??
      '',

    member
      ?.pokemonIdentity ??
      '',

    member
      ?.bestCurrentLoadout
      ?.fastMoveId ??
      '',

    member
      ?.bestCurrentLoadout
      ?.chargedMoveId ??
      '',
  ].join(
    '::'
  )
}

function getTeamSignature(
  team
) {
  if (
    !Array.isArray(
      team
    )
  ) {
    return ''
  }

  return team
    .map(
      getTeamMemberKey
    )
    .join(
      '|'
    )
}

function didTeamChange(
  currentTeam,
  projectedTeam
) {
  return (
    getTeamSignature(
      currentTeam
    ) !==
    getTeamSignature(
      projectedTeam
    )
  )
}

function calculateOverallProfileScore({
  profile,
  scoreField,
}) {
  if (
    profile
      ?.status !==
      RAID_TYPE_PROFILE_STATUS
        .SUCCESS
  ) {
    return null
  }

  const scores =
    RAID_ATTACK_TYPES.map(
      (type) =>
        finiteOrFallback(
          profile
            ?.types
            ?.[type]
            ?.[scoreField],
          0
        )
    )

  return round(
    average(
      scores
    ),
    2
  )
}

// --------------------------------------------------
// One type comparison
// --------------------------------------------------

function buildTypeImpact({
  type,
  currentTeam,
  projectedTeam,
}) {
  const currentStrength =
    finiteOrFallback(
      currentTeam
        ?.strengthScore,
      0
    )

  const projectedStrength =
    finiteOrFallback(
      projectedTeam
        ?.strengthScore,
      0
    )

  const strengthPointChange =
    round(
      projectedStrength -
        currentStrength,
      2
    )

  const strengthPercentChange =
    calculatePercentChange({
      current:
        currentStrength,

      projected:
        projectedStrength,
    })

  const currentAbsoluteStrength =
    finiteOrFallback(
      currentTeam
        ?.absoluteStrengthScore,
      0
    )

  const projectedAbsoluteStrength =
    finiteOrFallback(
      projectedTeam
        ?.absoluteStrengthScore,
      0
    )

  const absoluteStrengthPointChange =
    round(
      projectedAbsoluteStrength -
        currentAbsoluteStrength,
      2
    )

  const absoluteStrengthPercentChange =
    calculatePercentChange({
      current:
        currentAbsoluteStrength,

      projected:
        projectedAbsoluteStrength,
    })

  const newCoverage =
    currentTeam
      ?.filledSlotCount ===
      0 &&
    projectedTeam
      ?.filledSlotCount >
      0

  const lostCoverage =
    currentTeam
      ?.filledSlotCount >
      0 &&
    projectedTeam
      ?.filledSlotCount ===
      0

  const teamChanged =
    didTeamChange(
      currentTeam?.team,
      projectedTeam?.team
    )

  const improved =
    strengthPointChange >
    0

  const regressed =
    strengthPointChange <
    0

  const changed =
    teamChanged ||
    strengthPointChange !==
      0 ||
    absoluteStrengthPointChange !==
      0

  return {
    type,

    changed,

    improved,

    regressed,

    newCoverage,

    lostCoverage,

    teamChanged,

    current: {
      status:
        currentTeam
          ?.status ??
        null,

      filledSlotCount:
        currentTeam
          ?.filledSlotCount ??
        0,

      strengthScore:
        currentStrength,

      absoluteStrengthScore:
        currentAbsoluteStrength,

      team:
        currentTeam
          ?.team ??
        [],
    },

    projected: {
      status:
        projectedTeam
          ?.status ??
        null,

      filledSlotCount:
        projectedTeam
          ?.filledSlotCount ??
        0,

      strengthScore:
        projectedStrength,

      absoluteStrengthScore:
        projectedAbsoluteStrength,

      team:
        projectedTeam
          ?.team ??
        [],
    },

    strengthPointChange,

    strengthPercentChange,

    absoluteStrengthPointChange,

    absoluteStrengthPercentChange,
  }
}

// --------------------------------------------------
// Impact ordering
//
// Most positive account improvements first.
//
// Regressions naturally fall toward the bottom.
// --------------------------------------------------

function compareTypeImpacts(
  first,
  second
) {
  const strengthDifference =
    finiteOrFallback(
      second
        ?.strengthPointChange,
      0
    ) -
    finiteOrFallback(
      first
        ?.strengthPointChange,
      0
    )

  if (
    strengthDifference !==
    0
  ) {
    return strengthDifference
  }

  const absoluteDifference =
    finiteOrFallback(
      second
        ?.absoluteStrengthPointChange,
      0
    ) -
    finiteOrFallback(
      first
        ?.absoluteStrengthPointChange,
      0
    )

  if (
    absoluteDifference !==
    0
  ) {
    return absoluteDifference
  }

  return (
    RAID_ATTACK_TYPES.indexOf(
      first.type
    ) -
    RAID_ATTACK_TYPES.indexOf(
      second.type
    )
  )
}

// --------------------------------------------------
// Public API
// --------------------------------------------------

export function evaluateRaidAccountImpact({
  currentProfile,
  collectionId,
  opportunity = null,
  possibleState = null,
  raidStrength = null,
}) {
  if (
    currentProfile
      ?.status !==
      RAID_TYPE_PROFILE_STATUS
        .SUCCESS
  ) {
    return {
      status:
        RAID_ACCOUNT_IMPACT_STATUS
          .INVALID_PROFILE,

      currentProfile,

      projectedProfile:
        null,

      typeImpacts: [],

      affectedTypes: [],
    }
  }

  const resolvedPossibleState =
    possibleState ??
    opportunity
      ?.possibleState ??
    null

  const resolvedRaidStrength =
    raidStrength ??
    opportunity
      ?.raidStrength ??
    null

  if (
    !collectionId ||
    !resolvedPossibleState ||
    !resolvedRaidStrength
  ) {
    return {
      status:
        RAID_ACCOUNT_IMPACT_STATUS
          .INVALID_OPPORTUNITY,

      currentProfile,

      projectedProfile:
        null,

      typeImpacts: [],

      affectedTypes: [],
    }
  }

  const projection =
    projectRaidTypeProfile({
      currentProfile,

      collectionId,

      possibleState:
        resolvedPossibleState,

      raidStrength:
        resolvedRaidStrength,
    })

  if (
    projection?.status !==
      RAID_TYPE_PROFILE_PROJECTION_STATUS
        .SUCCESS ||
    !projection?.profile
  ) {
    return {
      status:
        RAID_ACCOUNT_IMPACT_STATUS
          .PROJECTION_FAILED,

      projectionStatus:
        projection?.status ??
        null,

      currentProfile,

      projectedProfile:
        null,

      typeImpacts: [],

      affectedTypes: [],
    }
  }

  const projectedProfile =
    projection.profile

  const typeImpacts =
    RAID_ATTACK_TYPES.map(
      (type) =>
        buildTypeImpact({
          type,

          currentTeam:
            currentProfile
              ?.types
              ?.[type] ??
            null,

          projectedTeam:
            projectedProfile
              ?.types
              ?.[type] ??
            null,
        })
    )

  const affectedTypes =
    typeImpacts
      .filter(
        (impact) =>
          impact.changed ===
          true
      )
      .sort(
        compareTypeImpacts
      )

  const improvedTypes =
    affectedTypes.filter(
      (impact) =>
        impact.improved ===
        true
    )

  const regressedTypes =
    affectedTypes.filter(
      (impact) =>
        impact.regressed ===
        true
    )

  const unchangedTypes =
    typeImpacts.filter(
      (impact) =>
        impact.changed !==
        true
    )

  // ------------------------------------------------
  // Overall account score
  //
  // V1 = simple equal-weight average across the same
  // 18 attacking-type team scores.
  //
  // This is deliberately transparent and provisional.
  //
  // Later Opportunity scoring may weight account need,
  // scarcity, longevity, availability, resource cost,
  // etc. None of that belongs in this mechanical
  // before/after account-impact calculation.
  // ------------------------------------------------

  const currentOverallStrengthScore =
    calculateOverallProfileScore({
      profile:
        currentProfile,

      scoreField:
        'strengthScore',
    })

  const projectedOverallStrengthScore =
    calculateOverallProfileScore({
      profile:
        projectedProfile,

      scoreField:
        'strengthScore',
    })

  const overallStrengthPointChange =
    round(
      finiteOrFallback(
        projectedOverallStrengthScore,
        0
      ) -
      finiteOrFallback(
        currentOverallStrengthScore,
        0
      ),
      2
    )

  const overallStrengthPercentChange =
    calculatePercentChange({
      current:
        currentOverallStrengthScore,

      projected:
        projectedOverallStrengthScore,
    })

  const currentOverallAbsoluteStrengthScore =
    calculateOverallProfileScore({
      profile:
        currentProfile,

      scoreField:
        'absoluteStrengthScore',
    })

  const projectedOverallAbsoluteStrengthScore =
    calculateOverallProfileScore({
      profile:
        projectedProfile,

      scoreField:
        'absoluteStrengthScore',
    })

  const overallAbsoluteStrengthPointChange =
    round(
      finiteOrFallback(
        projectedOverallAbsoluteStrengthScore,
        0
      ) -
      finiteOrFallback(
        currentOverallAbsoluteStrengthScore,
        0
      ),
      2
    )

  const overallAbsoluteStrengthPercentChange =
    calculatePercentChange({
      current:
        currentOverallAbsoluteStrengthScore,

      projected:
        projectedOverallAbsoluteStrengthScore,
    })

  return {
    status:
      RAID_ACCOUNT_IMPACT_STATUS
        .SUCCESS,

    collectionId,

    pokemonIdentity:
      projection
        ?.projectedEvaluation
        ?.candidate
        ?.pokemonIdentity ??
      null,

    possibleStateType:
      resolvedPossibleState
        ?.type ??
      null,

    currentProfile,

    projectedProfile,

    typeImpacts,

    affectedTypes,

    improvedTypes,

    regressedTypes,

    unchangedTypes,

    affectedTypeCount:
      affectedTypes.length,

    improvedTypeCount:
      improvedTypes.length,

    regressedTypeCount:
      regressedTypes.length,

    currentOverallStrengthScore,

    projectedOverallStrengthScore,

    overallStrengthPointChange,

    overallStrengthPercentChange,

    currentOverallAbsoluteStrengthScore,

    projectedOverallAbsoluteStrengthScore,

    overallAbsoluteStrengthPointChange,

    overallAbsoluteStrengthPercentChange,
  }
}