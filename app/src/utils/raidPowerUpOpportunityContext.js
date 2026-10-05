import {
  buildRaidPowerUpEfficiency,
  RAID_POWER_UP_EFFICIENCY_STATUS,
} from './raidPowerUpEfficiency.js'

import {
  buildRaidPowerUpStoppingPoint,
  RAID_POWER_UP_STOPPING_POINT_STATUS,
} from './raidPowerUpStoppingPoint.js'

import {
  RAID_POSSIBLE_STATE_TYPE,
  RAID_POSSIBLE_STATE_ACTION,
} from './raidPossibleStates.js'

// --------------------------------------------------
// Status
// --------------------------------------------------

export const RAID_POWER_UP_OPPORTUNITY_CONTEXT_STATUS = {
  SUCCESS:
    'SUCCESS',

  INVALID_CANDIDATE:
    'INVALID_CANDIDATE',

  INVALID_CURRENT_STATE:
    'INVALID_CURRENT_STATE',

  INVALID_POWER_UP_STATES:
    'INVALID_POWER_UP_STATES',

  EFFICIENCY_FAILED:
    'EFFICIENCY_FAILED',

  STOPPING_POINT_FAILED:
    'STOPPING_POINT_FAILED',
}

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function isPowerUpState(
  state
) {
  return (
    state?.type ===
      RAID_POSSIBLE_STATE_TYPE
        .POWER_UP ||
    state?.action?.type ===
      RAID_POSSIBLE_STATE_ACTION
        .POWER_UP
  )
}

function getTargetLevel(
  state
) {
  const actionTarget =
    state?.action?.targetLevel

  if (
    Number.isFinite(
      actionTarget
    )
  ) {
    return actionTarget
  }

  const combatLevel =
    state?.combat?.level

  if (
    Number.isFinite(
      combatLevel
    )
  ) {
    return combatLevel
  }

  const changeTarget =
    state
      ?.changes
      ?.level
      ?.to

  return Number.isFinite(
    changeTarget
  )
    ? changeTarget
    : null
}

function buildCheckpointContext(
  checkpoint
) {
  if (!checkpoint) {
    return null
  }

  return {
    fromLevel:
      checkpoint.fromLevel,

    targetLevel:
      checkpoint.targetLevel,

    marginalGainClassification:
      checkpoint
        .marginalGainClassification ??
      null,

    checkpointRole:
      checkpoint
        .checkpointRole ??
      null,

    resourceTier:
      checkpoint
        .resourceTier ??
      null,

    diminishingReturn:
      checkpoint
        .diminishingReturn ===
      true,

    entersPremiumTier:
      checkpoint
        .entersPremiumTier ===
      true,

    incrementalPerformance: {
      available:
        checkpoint
          ?.performance
          ?.available ===
        true,

      medianPercentGain:
        checkpoint
          ?.performance
          ?.medianPercentGain ??
        null,

      averagePercentGain:
        checkpoint
          ?.performance
          ?.averagePercentGain ??
        null,

      minimumPercentGain:
        checkpoint
          ?.performance
          ?.minimumPercentGain ??
        null,

      maximumPercentGain:
        checkpoint
          ?.performance
          ?.maximumPercentGain ??
        null,

      improvementRate:
        checkpoint
          ?.performance
          ?.improvementRate ??
        null,

      reductionRate:
        checkpoint
          ?.performance
          ?.reductionRate ??
        null,
    },

    incrementalCost: {
      available:
        checkpoint
          ?.cost
          ?.available ===
        true,

      stardust:
        checkpoint
          ?.cost
          ?.stardust ??
        null,

      candy:
        checkpoint
          ?.cost
          ?.candy ??
        null,

      candyXL:
        checkpoint
          ?.cost
          ?.candyXL ??
        null,
    },
  }
}

// --------------------------------------------------
// Public API
// --------------------------------------------------

export function buildRaidPowerUpOpportunityContext({
  candidate,
  currentState,
  powerUpStates,
  matchups,
  moves,
  combatData,
}) {
  if (
    !candidate ||
    candidate.status !==
      'READY'
  ) {
    return {
      status:
        RAID_POWER_UP_OPPORTUNITY_CONTEXT_STATUS
          .INVALID_CANDIDATE,

      contexts: [],
    }
  }

  if (!currentState) {
    return {
      status:
        RAID_POWER_UP_OPPORTUNITY_CONTEXT_STATUS
          .INVALID_CURRENT_STATE,

      contexts: [],
    }
  }

  if (
    !Array.isArray(
      powerUpStates
    )
  ) {
    return {
      status:
        RAID_POWER_UP_OPPORTUNITY_CONTEXT_STATUS
          .INVALID_POWER_UP_STATES,

      contexts: [],
    }
  }

  const filteredPowerUpStates =
    powerUpStates.filter(
      isPowerUpState
    )

  const efficiency =
    buildRaidPowerUpEfficiency({
      candidate,

      currentState,

      powerUpStates:
        filteredPowerUpStates,

      matchups,

      moves,

      combatData,
    })

  if (
    efficiency.status !==
      RAID_POWER_UP_EFFICIENCY_STATUS
        .SUCCESS
  ) {
    return {
      status:
        RAID_POWER_UP_OPPORTUNITY_CONTEXT_STATUS
          .EFFICIENCY_FAILED,

      pokemonIdentity:
        candidate
          .pokemonIdentity ??
        null,

      efficiency,

      stoppingPoint:
        null,

      contexts: [],
    }
  }

  const stoppingPoint =
    buildRaidPowerUpStoppingPoint(
      efficiency
    )

  if (
    stoppingPoint.status !==
      RAID_POWER_UP_STOPPING_POINT_STATUS
        .SUCCESS
  ) {
    return {
      status:
        RAID_POWER_UP_OPPORTUNITY_CONTEXT_STATUS
          .STOPPING_POINT_FAILED,

      pokemonIdentity:
        candidate
          .pokemonIdentity ??
        null,

      efficiency,

      stoppingPoint,

      contexts: [],
    }
  }

  const contexts =
    filteredPowerUpStates.map(
      (possibleState) => {
        const targetLevel =
          getTargetLevel(
            possibleState
          )

        const checkpoint =
          stoppingPoint
            .checkpoints
            .find(
              (entry) =>
                entry.targetLevel ===
                targetLevel
            ) ??
          null

        const checkpointContext =
          buildCheckpointContext(
            checkpoint
          )

        const isOrdinaryStoppingPoint =
          stoppingPoint
            .ordinaryStoppingPoint
            ?.targetLevel ===
          targetLevel

        const isPremiumOpportunity =
          stoppingPoint
            .premiumOpportunity
            ?.targetLevel ===
          targetLevel

        return {
          pokemonIdentity:
            candidate
              .pokemonIdentity ??
            null,

          possibleState,

          possibleStateType:
            possibleState
              ?.type ??
            null,

          targetLevel,

          checkpoint:
            checkpointContext,

          marginalGainClassification:
            checkpointContext
              ?.marginalGainClassification ??
            null,

          checkpointRole:
            checkpointContext
              ?.checkpointRole ??
            null,

          resourceTier:
            checkpointContext
              ?.resourceTier ??
            null,

          isOrdinaryStoppingPoint,

          isPremiumOpportunity,

          isRecommendedCheckpoint:
            isOrdinaryStoppingPoint ||
            isPremiumOpportunity,

          incrementalPerformance:
            checkpointContext
              ?.incrementalPerformance ??
            null,

          incrementalCost:
            checkpointContext
              ?.incrementalCost ??
            null,
        }
      }
    )

  const ordinaryStoppingPointContext =
    contexts.find(
      (context) =>
        context
          .isOrdinaryStoppingPoint
    ) ??
    null

  const premiumOpportunityContext =
    contexts.find(
      (context) =>
        context
          .isPremiumOpportunity
    ) ??
    null

  return {
    status:
      RAID_POWER_UP_OPPORTUNITY_CONTEXT_STATUS
        .SUCCESS,

    pokemonIdentity:
      candidate
        .pokemonIdentity ??
      null,

    currentLevel:
      efficiency.currentLevel,

    contexts,

    ordinaryStoppingPointContext,

    premiumOpportunityContext,

    hasOrdinaryStoppingPoint:
      Boolean(
        ordinaryStoppingPointContext
      ),

    hasPremiumOpportunity:
      Boolean(
        premiumOpportunityContext
      ),

    efficiency,

    stoppingPoint,
  }
}

export function findRaidPowerUpOpportunityContext({
  contextResult,
  possibleState,
}) {
  if (
    contextResult?.status !==
      RAID_POWER_UP_OPPORTUNITY_CONTEXT_STATUS
        .SUCCESS ||
    !isPowerUpState(
      possibleState
    )
  ) {
    return null
  }

  const targetLevel =
    getTargetLevel(
      possibleState
    )

  if (
    !Number.isFinite(
      targetLevel
    )
  ) {
    return null
  }

  return (
    contextResult.contexts.find(
      (context) =>
        context.targetLevel ===
        targetLevel
    ) ??
    null
  )
}