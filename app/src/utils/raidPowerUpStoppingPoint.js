import {
  RAID_INVESTMENT_ASSESSMENT_THRESHOLDS,
} from './raidInvestmentAssessment.js'

import {
  RAID_POWER_UP_EFFICIENCY_STATUS,
  RAID_POWER_UP_RESOURCE_TIER,
} from './raidPowerUpEfficiency.js'

// --------------------------------------------------
// Status
// --------------------------------------------------

export const RAID_POWER_UP_STOPPING_POINT_STATUS = {
  SUCCESS:
    'SUCCESS',

  INVALID_EFFICIENCY:
    'INVALID_EFFICIENCY',

  NO_CHECKPOINTS:
    'NO_CHECKPOINTS',
}

// --------------------------------------------------
// Marginal performance classification
// --------------------------------------------------

export const RAID_POWER_UP_MARGINAL_GAIN = {
  STRONG:
    'STRONG',

  MEANINGFUL:
    'MEANINGFUL',

  LIMITED:
    'LIMITED',

  REGRESSION:
    'REGRESSION',

  UNKNOWN:
    'UNKNOWN',
}

// --------------------------------------------------
// Checkpoint recommendation role
// --------------------------------------------------

export const RAID_POWER_UP_CHECKPOINT_ROLE = {
  ORDINARY_VALUE:
    'ORDINARY_VALUE',

  ORDINARY_LIMITED:
    'ORDINARY_LIMITED',

  PREMIUM_OPPORTUNITY:
    'PREMIUM_OPPORTUNITY',

  PREMIUM_LIMITED:
    'PREMIUM_LIMITED',

  REGRESSION:
    'REGRESSION',

  UNKNOWN:
    'UNKNOWN',
}

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function getMedianGain(
  checkpoint
) {
  const value =
    checkpoint
      ?.performance
      ?.medianPercentGain

  return Number.isFinite(
    value
  )
    ? value
    : null
}

function classifyMarginalGain(
  checkpoint
) {
  const medianGain =
    getMedianGain(
      checkpoint
    )

  if (
    !Number.isFinite(
      medianGain
    )
  ) {
    return RAID_POWER_UP_MARGINAL_GAIN
      .UNKNOWN
  }

  const thresholds =
    RAID_INVESTMENT_ASSESSMENT_THRESHOLDS

  if (
    medianGain <=
    thresholds
      .meaningfulRegressionPercent
  ) {
    return RAID_POWER_UP_MARGINAL_GAIN
      .REGRESSION
  }

  if (
    medianGain >=
    thresholds
      .strongGainPercent
  ) {
    return RAID_POWER_UP_MARGINAL_GAIN
      .STRONG
  }

  if (
    medianGain >=
    thresholds
      .meaningfulGainPercent
  ) {
    return RAID_POWER_UP_MARGINAL_GAIN
      .MEANINGFUL
  }

  return RAID_POWER_UP_MARGINAL_GAIN
    .LIMITED
}

function determineCheckpointRole({
  checkpoint,
  marginalGain,
}) {
  if (
    marginalGain ===
    RAID_POWER_UP_MARGINAL_GAIN
      .REGRESSION
  ) {
    return RAID_POWER_UP_CHECKPOINT_ROLE
      .REGRESSION
  }

  if (
    marginalGain ===
    RAID_POWER_UP_MARGINAL_GAIN
      .UNKNOWN
  ) {
    return RAID_POWER_UP_CHECKPOINT_ROLE
      .UNKNOWN
  }

  const premium =
    checkpoint.resourceTier ===
    RAID_POWER_UP_RESOURCE_TIER
      .PREMIUM

  const meaningful =
    marginalGain ===
      RAID_POWER_UP_MARGINAL_GAIN
        .MEANINGFUL ||
    marginalGain ===
      RAID_POWER_UP_MARGINAL_GAIN
        .STRONG

  if (
    premium &&
    meaningful
  ) {
    return RAID_POWER_UP_CHECKPOINT_ROLE
      .PREMIUM_OPPORTUNITY
  }

  if (
    premium
  ) {
    return RAID_POWER_UP_CHECKPOINT_ROLE
      .PREMIUM_LIMITED
  }

  if (
    meaningful
  ) {
    return RAID_POWER_UP_CHECKPOINT_ROLE
      .ORDINARY_VALUE
  }

  return RAID_POWER_UP_CHECKPOINT_ROLE
    .ORDINARY_LIMITED
}

function annotateCheckpoint(
  checkpoint
) {
  const marginalGain =
    classifyMarginalGain(
      checkpoint
    )

  const role =
    determineCheckpointRole({
      checkpoint,
      marginalGain,
    })

  return {
    ...checkpoint,

    marginalGainClassification:
      marginalGain,

    checkpointRole:
      role,
  }
}

function isOrdinaryValue(
  checkpoint
) {
  return (
    checkpoint
      .checkpointRole ===
    RAID_POWER_UP_CHECKPOINT_ROLE
      .ORDINARY_VALUE
  )
}

function isPremiumOpportunity(
  checkpoint
) {
  return (
    checkpoint
      .checkpointRole ===
    RAID_POWER_UP_CHECKPOINT_ROLE
      .PREMIUM_OPPORTUNITY
  )
}

// --------------------------------------------------
// Public API
// --------------------------------------------------

export function buildRaidPowerUpStoppingPoint(
  efficiency
) {
  if (
    !efficiency ||
    efficiency.status !==
      RAID_POWER_UP_EFFICIENCY_STATUS
        .SUCCESS
  ) {
    return {
      status:
        RAID_POWER_UP_STOPPING_POINT_STATUS
          .INVALID_EFFICIENCY,

      checkpoints: [],
    }
  }

  if (
    !Array.isArray(
      efficiency.checkpoints
    ) ||
    efficiency.checkpoints.length ===
      0
  ) {
    return {
      status:
        RAID_POWER_UP_STOPPING_POINT_STATUS
          .NO_CHECKPOINTS,

      pokemonIdentity:
        efficiency
          .pokemonIdentity ??
        null,

      currentLevel:
        efficiency
          .currentLevel ??
        null,

      checkpoints: [],
    }
  }

  const checkpoints =
    efficiency.checkpoints.map(
      annotateCheckpoint
    )

  const ordinaryValueCheckpoints =
    checkpoints.filter(
      isOrdinaryValue
    )

  const premiumOpportunityCheckpoints =
    checkpoints.filter(
      isPremiumOpportunity
    )

  // ------------------------------------------------
  // Ordinary stopping point
  //
  // This means:
  //
  // "How far can we justify going without crossing
  // into premium XL investment?"
  //
  // We deliberately choose the LAST meaningful
  // ordinary checkpoint because reaching that level
  // includes all earlier required power-ups.
  // ------------------------------------------------

  const ordinaryStoppingPoint =
    ordinaryValueCheckpoints.length >
    0
      ? ordinaryValueCheckpoints[
          ordinaryValueCheckpoints.length -
          1
        ]
      : null

  // ------------------------------------------------
  // Premium opportunity
  //
  // Kept separate from ordinary stopping point.
  //
  // A strong XL upgrade should not automatically
  // become the recommendation merely because its
  // performance gain is large.
  // ------------------------------------------------

  const premiumOpportunity =
    premiumOpportunityCheckpoints[
      0
    ] ??
    null

  const hasMeaningfulOrdinaryUpgrade =
    Boolean(
      ordinaryStoppingPoint
    )

  const hasMeaningfulPremiumUpgrade =
    Boolean(
      premiumOpportunity
    )

  return {
    status:
      RAID_POWER_UP_STOPPING_POINT_STATUS
        .SUCCESS,

    pokemonIdentity:
      efficiency
        .pokemonIdentity ??
      null,

    currentLevel:
      efficiency
        .currentLevel ??
      null,

    checkpoints,

    ordinaryValueCheckpoints,

    premiumOpportunityCheckpoints,

    ordinaryStoppingPoint,

    premiumOpportunity,

    hasMeaningfulOrdinaryUpgrade,

    hasMeaningfulPremiumUpgrade,

    summary: {
      ordinaryTargetLevel:
        ordinaryStoppingPoint
          ?.targetLevel ??
        null,

      premiumTargetLevel:
        premiumOpportunity
          ?.targetLevel ??
        null,

      premiumRequiresCandyXL:
        (
          premiumOpportunity
            ?.cost
            ?.candyXL ??
          0
        ) >
        0,
    },

    efficiency,
  }
}