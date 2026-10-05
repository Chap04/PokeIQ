import {
  buildRaidInvestmentEvidence,
  RAID_INVESTMENT_EVIDENCE_STATUS,
} from './raidInvestmentEvidence.js'

import {
  buildRaidInvestmentCost,
  RAID_INVESTMENT_COST_STATUS,
} from './raidInvestmentCost.js'

// --------------------------------------------------
// Status
// --------------------------------------------------

export const RAID_POWER_UP_EFFICIENCY_STATUS = {
  SUCCESS:
    'SUCCESS',

  INVALID_CANDIDATE:
    'INVALID_CANDIDATE',

  INVALID_CURRENT_STATE:
    'INVALID_CURRENT_STATE',

  INVALID_POWER_UP_STATES:
    'INVALID_POWER_UP_STATES',

  NO_POWER_UP_STATES:
    'NO_POWER_UP_STATES',
}

// --------------------------------------------------
// Resource tier
// --------------------------------------------------

export const RAID_POWER_UP_RESOURCE_TIER = {
  ORDINARY:
    'ORDINARY',

  PREMIUM:
    'PREMIUM',
}

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function getStateLevel(
  state
) {
  const combatLevel =
    state?.combat?.level

  if (
    Number.isFinite(
      combatLevel
    )
  ) {
    return combatLevel
  }

  const targetLevel =
    state?.action?.targetLevel

  if (
    Number.isFinite(
      targetLevel
    )
  ) {
    return targetLevel
  }

  return null
}

function getCurrentLevel({
  candidate,
  currentState,
}) {
  const stateLevel =
    getStateLevel(
      currentState
    )

  if (
    Number.isFinite(
      stateLevel
    )
  ) {
    return stateLevel
  }

  if (
    Number.isFinite(
      candidate?.level
    )
  ) {
    return candidate.level
  }

  return null
}

function isPowerUpState(
  state
) {
  return (
    state?.action?.type ===
      'POWER_UP' &&
    Number.isFinite(
      getStateLevel(
        state
      )
    )
  )
}

function getSortedPowerUpStates(
  powerUpStates
) {
  return [...powerUpStates]
    .filter(
      isPowerUpState
    )
    .sort(
      (
        first,
        second
      ) =>
        getStateLevel(first) -
        getStateLevel(second)
    )
}

function buildIncrementalCostState({
  possibleState,
  fromLevel,
  targetLevel,
}) {
  return {
    ...possibleState,

    action: {
      ...possibleState.action,

      type:
        'POWER_UP',

      fromLevel,

      targetLevel,
    },

    changes: {
      ...possibleState.changes,

      level: {
        from:
          fromLevel,

        to:
          targetLevel,
      },
    },

    combat: {
      ...possibleState.combat,

      level:
        targetLevel,
    },
  }
}

function getResourceTier(
  cost
) {
  const candyXL =
    cost?.summary?.candyXL ??
    0

  if (
    candyXL > 0
  ) {
    return RAID_POWER_UP_RESOURCE_TIER
      .PREMIUM
  }

  return RAID_POWER_UP_RESOURCE_TIER
    .ORDINARY
}

function buildCostSummary(
  cost
) {
  if (
    cost?.status !==
    RAID_INVESTMENT_COST_STATUS
      .SUCCESS
  ) {
    return {
      available:
        false,

      stardust:
        null,

      candy:
        null,

      candyXL:
        null,
    }
  }

  return {
    available:
      true,

    stardust:
      cost.summary
        ?.stardust ??
      0,

    candy:
      cost.summary
        ?.candy ??
      0,

    candyXL:
      cost.summary
        ?.candyXL ??
      0,
  }
}

// --------------------------------------------------
// Statistical helpers
// --------------------------------------------------

function average(
  values
) {
  if (
    values.length ===
    0
  ) {
    return null
  }

  return (
    values.reduce(
      (
        total,
        value
      ) =>
        total + value,
      0
    ) /
    values.length
  )
}

function median(
  values
) {
  if (
    values.length ===
    0
  ) {
    return null
  }

  const sorted =
    [...values].sort(
      (
        first,
        second
      ) =>
        first - second
    )

  const middle =
    Math.floor(
      sorted.length /
      2
    )

  if (
    sorted.length %
      2 ===
    1
  ) {
    return sorted[
      middle
    ]
  }

  return (
    sorted[
      middle - 1
    ] +
    sorted[
      middle
    ]
  ) /
  2
}

function minimum(
  values
) {
  return values.length >
    0
    ? Math.min(
        ...values
      )
    : null
}

function maximum(
  values
) {
  return values.length >
    0
    ? Math.max(
        ...values
      )
    : null
}

// --------------------------------------------------
// Cumulative matchup extraction
//
// Every power-up state is evaluated against the true
// current state.
//
// This keeps the established investment-evidence
// semantics intact.
//
// Incremental checkpoint performance is then derived
// from the cumulative per-matchup DPS values.
// --------------------------------------------------

function getSuccessfulEvidenceEntries(
  evidence
) {
  if (
    evidence?.status !==
    RAID_INVESTMENT_EVIDENCE_STATUS
      .SUCCESS
  ) {
    return []
  }

  if (
    Array.isArray(
      evidence.successfulEvidence
    )
  ) {
    return evidence
      .successfulEvidence
  }

  if (
    Array.isArray(
      evidence.evidence
    )
  ) {
    return evidence
      .evidence
      .filter(
        (entry) =>
          entry
            ?.comparison
            ?.status ===
          'SUCCESS'
      )
  }

  return []
}

function getMatchupId(
  entry,
  index
) {
  return (
    entry?.matchupId ??
    entry?.id ??
    `MATCHUP_${index}`
  )
}

function getCurrentCycleDps(
  entry
) {
  const direct =
    entry
      ?.comparison
      ?.performanceChange
      ?.currentCycleDps

  if (
    Number.isFinite(
      direct
    )
  ) {
    return direct
  }

  const evaluation =
    entry
      ?.comparison
      ?.currentEvaluation
      ?.bestPerformance
      ?.cycleDps

  return Number.isFinite(
    evaluation
  )
    ? evaluation
    : null
}

function getPossibleCycleDps(
  entry
) {
  const direct =
    entry
      ?.comparison
      ?.performanceChange
      ?.possibleCycleDps

  if (
    Number.isFinite(
      direct
    )
  ) {
    return direct
  }

  const evaluation =
    entry
      ?.comparison
      ?.possibleEvaluation
      ?.bestPerformance
      ?.cycleDps

  return Number.isFinite(
    evaluation
  )
    ? evaluation
    : null
}

function buildPerformanceMap(
  evidence
) {
  const entries =
    getSuccessfulEvidenceEntries(
      evidence
    )

  const map =
    new Map()

  entries.forEach(
    (
      entry,
      index
    ) => {
      const matchupId =
        getMatchupId(
          entry,
          index
        )

      const currentCycleDps =
        getCurrentCycleDps(
          entry
        )

      const possibleCycleDps =
        getPossibleCycleDps(
          entry
        )

      if (
        !Number.isFinite(
          currentCycleDps
        ) ||
        !Number.isFinite(
          possibleCycleDps
        )
      ) {
        return
      }

      map.set(
        matchupId,
        {
          matchupId,

          label:
            entry?.label ??
            null,

          currentCycleDps,

          possibleCycleDps,
        }
      )
    }
  )

  return map
}

function calculatePercentGain(
  fromDps,
  toDps
) {
  if (
    !Number.isFinite(
      fromDps
    ) ||
    !Number.isFinite(
      toDps
    ) ||
    fromDps <=
      0
  ) {
    return null
  }

  return (
    (
      toDps -
      fromDps
    ) /
    fromDps
  ) *
    100
}

function buildIncrementalPerformance({
  currentPerformanceMap,
  previousPerformanceMap,
  targetPerformanceMap,
}) {
  const gains = []

  const matchupResults = []

  targetPerformanceMap.forEach(
    (
      target,
      matchupId
    ) => {
      const base =
        previousPerformanceMap
          ? previousPerformanceMap
              .get(
                matchupId
              )
          : currentPerformanceMap
              .get(
                matchupId
              )

      if (
        !base
      ) {
        return
      }

      const fromDps =
        previousPerformanceMap
          ? base.possibleCycleDps
          : base.currentCycleDps

      const toDps =
        target
          .possibleCycleDps

      const percentGain =
        calculatePercentGain(
          fromDps,
          toDps
        )

      if (
        !Number.isFinite(
          percentGain
        )
      ) {
        return
      }

      gains.push(
        percentGain
      )

      matchupResults.push({
        matchupId,

        label:
          target.label,

        fromCycleDps:
          fromDps,

        toCycleDps:
          toDps,

        absoluteGain:
          toDps -
          fromDps,

        percentGain,

        improvesPerformance:
          percentGain >
          0,

        reducesPerformance:
          percentGain <
          0,

        unchangedPerformance:
          percentGain ===
          0,
      })
    }
  )

  if (
    gains.length ===
    0
  ) {
    return {
      available:
        false,

      matchupCount:
        0,

      medianPercentGain:
        null,

      averagePercentGain:
        null,

      minimumPercentGain:
        null,

      maximumPercentGain:
        null,

      improvementRate:
        null,

      reductionRate:
        null,

      matchupResults: [],
    }
  }

  const improvedCount =
    matchupResults.filter(
      (result) =>
        result
          .improvesPerformance
    ).length

  const reducedCount =
    matchupResults.filter(
      (result) =>
        result
          .reducesPerformance
    ).length

  return {
    available:
      true,

    matchupCount:
      matchupResults.length,

    medianPercentGain:
      median(
        gains
      ),

    averagePercentGain:
      average(
        gains
      ),

    minimumPercentGain:
      minimum(
        gains
      ),

    maximumPercentGain:
      maximum(
        gains
      ),

    improvementRate:
      improvedCount /
      matchupResults.length,

    reductionRate:
      reducedCount /
      matchupResults.length,

    matchupResults,
  }
}

// --------------------------------------------------
// Relative checkpoint metadata
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

function addRelativeEfficiencyMetadata(
  checkpoints
) {
  return checkpoints.map(
    (
      checkpoint,
      index
    ) => {
      if (
        index === 0
      ) {
        return {
          ...checkpoint,

          previousCheckpoint:
            null,

          marginalGainChange:
            null,

          diminishingReturn:
            false,

          entersPremiumTier:
            checkpoint
              .resourceTier ===
              RAID_POWER_UP_RESOURCE_TIER
                .PREMIUM,
        }
      }

      const previous =
        checkpoints[
          index - 1
        ]

      const currentMedian =
        getMedianGain(
          checkpoint
        )

      const previousMedian =
        getMedianGain(
          previous
        )

      const marginalGainChange =
        Number.isFinite(
          currentMedian
        ) &&
        Number.isFinite(
          previousMedian
        )
          ? currentMedian -
            previousMedian
          : null

      const diminishingReturn =
        Number.isFinite(
          marginalGainChange
        )
          ? marginalGainChange <
            0
          : false

      const entersPremiumTier =
        checkpoint
          .resourceTier ===
          RAID_POWER_UP_RESOURCE_TIER
            .PREMIUM &&
        previous
          .resourceTier !==
          RAID_POWER_UP_RESOURCE_TIER
            .PREMIUM

      return {
        ...checkpoint,

        previousCheckpoint: {
          fromLevel:
            previous.fromLevel,

          targetLevel:
            previous.targetLevel,
        },

        marginalGainChange,

        diminishingReturn,

        entersPremiumTier,
      }
    }
  )
}

// --------------------------------------------------
// Public API
// --------------------------------------------------

export function buildRaidPowerUpEfficiency({
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
        RAID_POWER_UP_EFFICIENCY_STATUS
          .INVALID_CANDIDATE,

      checkpoints: [],
    }
  }

  const currentLevel =
    getCurrentLevel({
      candidate,
      currentState,
    })

  if (
    !currentState ||
    !Number.isFinite(
      currentLevel
    )
  ) {
    return {
      status:
        RAID_POWER_UP_EFFICIENCY_STATUS
          .INVALID_CURRENT_STATE,

      checkpoints: [],
    }
  }

  if (
    !Array.isArray(
      powerUpStates
    )
  ) {
    return {
      status:
        RAID_POWER_UP_EFFICIENCY_STATUS
          .INVALID_POWER_UP_STATES,

      checkpoints: [],
    }
  }

  const sortedStates =
    getSortedPowerUpStates(
      powerUpStates
    ).filter(
      (state) =>
        getStateLevel(
          state
        ) >
        currentLevel
    )

  if (
    sortedStates.length ===
    0
  ) {
    return {
      status:
        RAID_POWER_UP_EFFICIENCY_STATUS
          .NO_POWER_UP_STATES,

      pokemonIdentity:
        candidate
          .pokemonIdentity ??
        null,

      currentLevel,

      checkpoints: [],
    }
  }

  // ------------------------------------------------
  // First build cumulative evidence using the real
  // current state for EVERY target.
  // ------------------------------------------------

  const cumulativeResults =
    sortedStates.map(
      (
        possibleState,
        index
      ) => {
        const targetLevel =
          getStateLevel(
            possibleState
          )

        const evidence =
          buildRaidInvestmentEvidence({
            candidate,

            currentState,

            possibleState,

            matchups,

            moves,

            combatData,
          })

        return {
          index,

          possibleState,

          targetLevel,

          evidence,

          performanceMap:
            buildPerformanceMap(
              evidence
            ),
        }
      }
    )

  const firstPerformanceMap =
    cumulativeResults[
      0
    ]?.performanceMap

  const currentPerformanceMap =
    new Map()

  if (
    firstPerformanceMap
  ) {
    firstPerformanceMap.forEach(
      (
        value,
        matchupId
      ) => {
        currentPerformanceMap.set(
          matchupId,
          value
        )
      }
    )
  }

  // ------------------------------------------------
  // Derive each incremental checkpoint.
  // ------------------------------------------------

  const rawCheckpoints = []

  cumulativeResults.forEach(
    (
      result,
      index
    ) => {
      const previousResult =
        index >
        0
          ? cumulativeResults[
              index - 1
            ]
          : null

      const fromLevel =
        previousResult
          ? previousResult
              .targetLevel
          : currentLevel

      const targetLevel =
        result.targetLevel

      const performance =
        buildIncrementalPerformance({
          currentPerformanceMap,

          previousPerformanceMap:
            previousResult
              ?.performanceMap ??
            null,

          targetPerformanceMap:
            result
              .performanceMap,
        })

      const incrementalCostState =
        buildIncrementalCostState({
          possibleState:
            result
              .possibleState,

          fromLevel,

          targetLevel,
        })

      const cost =
        buildRaidInvestmentCost(
          incrementalCostState,
          candidate
        )

      rawCheckpoints.push({
        index,

        pokemonIdentity:
          candidate
            .pokemonIdentity ??
          null,

        fromLevel,

        targetLevel,

        performance,

        cost:
          buildCostSummary(
            cost
          ),

        resourceTier:
          getResourceTier(
            cost
          ),

        cumulativeEvidence:
          result.evidence,

        investmentCost:
          cost,

        possibleState:
          result
            .possibleState,
      })
    }
  )

  const checkpoints =
    addRelativeEfficiencyMetadata(
      rawCheckpoints
    )

  const ordinaryCheckpoints =
    checkpoints.filter(
      (checkpoint) =>
        checkpoint.resourceTier ===
        RAID_POWER_UP_RESOURCE_TIER
          .ORDINARY
    )

  const premiumCheckpoints =
    checkpoints.filter(
      (checkpoint) =>
        checkpoint.resourceTier ===
        RAID_POWER_UP_RESOURCE_TIER
          .PREMIUM
    )

  const diminishingReturnCheckpoints =
    checkpoints.filter(
      (checkpoint) =>
        checkpoint
          .diminishingReturn ===
        true
    )

  const premiumEntryCheckpoint =
    checkpoints.find(
      (checkpoint) =>
        checkpoint
          .entersPremiumTier ===
        true
    ) ??
    null

  return {
    status:
      RAID_POWER_UP_EFFICIENCY_STATUS
        .SUCCESS,

    pokemonIdentity:
      candidate
        .pokemonIdentity ??
      null,

    currentLevel,

    checkpointCount:
      checkpoints.length,

    checkpoints,

    ordinaryCheckpoints,

    premiumCheckpoints,

    diminishingReturnCheckpoints,

    premiumEntryCheckpoint,
  }
}