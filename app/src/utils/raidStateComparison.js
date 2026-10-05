import {
  evaluateRaidPossibleStateMatchup,
  RAID_STATE_MATCHUP_STATUS,
} from './raidStateMatchup.js'

// --------------------------------------------------
// Status
// --------------------------------------------------

export const RAID_STATE_COMPARISON_STATUS = {
  SUCCESS:
    'SUCCESS',

  INVALID_CANDIDATE:
    'INVALID_CANDIDATE',

  INVALID_CURRENT_STATE:
    'INVALID_CURRENT_STATE',

  INVALID_POSSIBLE_STATE:
    'INVALID_POSSIBLE_STATE',

  CURRENT_EVALUATION_FAILED:
    'CURRENT_EVALUATION_FAILED',

  POSSIBLE_EVALUATION_FAILED:
    'POSSIBLE_EVALUATION_FAILED',
}

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function isReadyCandidate(
  candidate
) {
  return (
    candidate &&
    candidate.status ===
      'READY' &&
    candidate.reference &&
    candidate.ivs &&
    Number.isFinite(
      candidate.cpm
    )
  )
}

function isValidCurrentState(
  state
) {
  return (
    state &&
    state.current ===
      true &&
    state.moves &&
    Array.isArray(
      state.loadouts
    ) &&
    state.loadouts.length >
      0
  )
}

function isValidPossibleState(
  state
) {
  return (
    state &&
    state.current !==
      true &&
    state.moves &&
    Array.isArray(
      state.loadouts
    ) &&
    state.loadouts.length >
      0
  )
}

function getEffectiveStateCandidate({
  candidate,
  state,
}) {
  return (
    state?.candidate ??
    candidate
  )
}

function hasValidStateIdentity({
  candidate,
  state,
}) {
  if (
    !state
      ?.pokemonIdentity
  ) {
    return true
  }

  const effectiveCandidate =
    getEffectiveStateCandidate({
      candidate,
      state,
    })

  if (
    !effectiveCandidate
      ?.pokemonIdentity
  ) {
    return true
  }

  return (
    state.pokemonIdentity ===
    effectiveCandidate
      .pokemonIdentity
  )
}

function hasValidCandidateOverride(
  state
) {
  if (!state?.candidate) {
    return true
  }

  return isReadyCandidate(
    state.candidate
  )
}

function getCycleDps(
  evaluation
) {
  const cycleDps =
    evaluation
      ?.bestPerformance
      ?.cycleDps

  if (
    !Number.isFinite(
      cycleDps
    )
  ) {
    return null
  }

  return cycleDps
}

function calculatePerformanceChange({
  currentCycleDps,
  possibleCycleDps,
}) {
  const absoluteGain =
    possibleCycleDps -
    currentCycleDps

  const percentGain =
    currentCycleDps === 0
      ? null
      : (
          absoluteGain /
          currentCycleDps
        ) * 100

  const performanceMultiplier =
    currentCycleDps === 0
      ? null
      : possibleCycleDps /
        currentCycleDps

  return {
    currentCycleDps,

    possibleCycleDps,

    absoluteGain,

    percentGain,

    performanceMultiplier,

    improvesPerformance:
      absoluteGain > 0,

    reducesPerformance:
      absoluteGain < 0,

    unchangedPerformance:
      absoluteGain === 0,
  }
}

function buildComparisonMetadata(
  possibleState
) {
  return {
    stateType:
      possibleState.type ??
      null,

    reachable:
      possibleState.reachable !==
      false,

    action:
      possibleState.action ??
      null,

    actions:
      Array.isArray(
        possibleState.actions
      )
        ? possibleState.actions
        : possibleState.action
          ? [
              possibleState.action,
            ]
          : [],

    additionalMoveAction:
      possibleState
        .additionalMoveAction ??
      null,

    changes:
      possibleState.changes ??
      null,

    preservation:
      possibleState
        .preservation ??
      null,

    destroysProtectedMove:
      possibleState
        ?.preservation
        ?.destroysProtectedMove ===
      true,

    resultingPokemonIdentity:
      possibleState
        ?.pokemonIdentity ??
      null,

    sourcePokemonIdentity:
      possibleState
        ?.sourcePokemonIdentity ??
      null,

    candidateOverride:
      Boolean(
        possibleState
          ?.candidate
      ),
  }
}

// --------------------------------------------------
// Single comparison
// --------------------------------------------------

export function compareRaidPossibleStateToCurrent({
  candidate,
  currentState,
  possibleState,
  defender,
  moves,
  combatData,
}) {
  if (
    !isReadyCandidate(
      candidate
    )
  ) {
    return {
      status:
        RAID_STATE_COMPARISON_STATUS
          .INVALID_CANDIDATE,
    }
  }

  if (
    !isValidCurrentState(
      currentState
    )
  ) {
    return {
      status:
        RAID_STATE_COMPARISON_STATUS
          .INVALID_CURRENT_STATE,
    }
  }

  if (
    !isValidPossibleState(
      possibleState
    )
  ) {
    return {
      status:
        RAID_STATE_COMPARISON_STATUS
          .INVALID_POSSIBLE_STATE,
    }
  }

  if (
    currentState.pokemonIdentity &&
    candidate.pokemonIdentity &&
    currentState.pokemonIdentity !==
      candidate.pokemonIdentity
  ) {
    return {
      status:
        RAID_STATE_COMPARISON_STATUS
          .INVALID_CURRENT_STATE,
    }
  }

  if (
    !hasValidCandidateOverride(
      possibleState
    ) ||
    !hasValidStateIdentity({
      candidate,
      state:
        possibleState,
    })
  ) {
    return {
      status:
        RAID_STATE_COMPARISON_STATUS
          .INVALID_POSSIBLE_STATE,
    }
  }

  const currentEvaluation =
    evaluateRaidPossibleStateMatchup({
      candidate,

      state:
        currentState,

      defender,

      moves,

      combatData,
    })

  if (
    currentEvaluation.status !==
    RAID_STATE_MATCHUP_STATUS
      .SUCCESS
  ) {
    return {
      status:
        RAID_STATE_COMPARISON_STATUS
          .CURRENT_EVALUATION_FAILED,

      pokemonIdentity:
        candidate
          .pokemonIdentity,

      currentEvaluation,
    }
  }

  const possibleEvaluation =
    evaluateRaidPossibleStateMatchup({
      candidate,

      state:
        possibleState,

      defender,

      moves,

      combatData,
    })

  if (
    possibleEvaluation.status !==
    RAID_STATE_MATCHUP_STATUS
      .SUCCESS
  ) {
    return {
      status:
        RAID_STATE_COMPARISON_STATUS
          .POSSIBLE_EVALUATION_FAILED,

      pokemonIdentity:
        candidate
          .pokemonIdentity,

      currentEvaluation,

      possibleEvaluation,

      ...buildComparisonMetadata(
        possibleState
      ),
    }
  }

  const currentCycleDps =
    getCycleDps(
      currentEvaluation
    )

  const possibleCycleDps =
    getCycleDps(
      possibleEvaluation
    )

  if (
    currentCycleDps == null
  ) {
    return {
      status:
        RAID_STATE_COMPARISON_STATUS
          .CURRENT_EVALUATION_FAILED,

      pokemonIdentity:
        candidate
          .pokemonIdentity,

      currentEvaluation,
    }
  }

  if (
    possibleCycleDps == null
  ) {
    return {
      status:
        RAID_STATE_COMPARISON_STATUS
          .POSSIBLE_EVALUATION_FAILED,

      pokemonIdentity:
        candidate
          .pokemonIdentity,

      currentEvaluation,

      possibleEvaluation,

      ...buildComparisonMetadata(
        possibleState
      ),
    }
  }

  const performanceChange =
    calculatePerformanceChange({
      currentCycleDps,
      possibleCycleDps,
    })

  return {
    status:
      RAID_STATE_COMPARISON_STATUS
        .SUCCESS,

    pokemonIdentity:
      candidate
        .pokemonIdentity,

    resultingPokemonIdentity:
      possibleState
        ?.pokemonIdentity ??
      candidate
        .pokemonIdentity,

    currentStateType:
      currentState.type ??
      'CURRENT',

    possibleStateType:
      possibleState.type ??
      null,

    currentEvaluation,

    possibleEvaluation,

    currentBestLoadout:
      currentEvaluation
        .bestLoadout,

    possibleBestLoadout:
      possibleEvaluation
        .bestLoadout,

    currentBestPerformance:
      currentEvaluation
        .bestPerformance,

    possibleBestPerformance:
      possibleEvaluation
        .bestPerformance,

    performanceChange,

    ...buildComparisonMetadata(
      possibleState
    ),
  }
}

// --------------------------------------------------
// Multiple possible-state comparisons
// --------------------------------------------------

export function compareRaidPossibleStatesToCurrent({
  candidate,
  currentState,
  possibleStates,
  defender,
  moves,
  combatData,
}) {
  if (
    !isReadyCandidate(
      candidate
    )
  ) {
    return {
      status:
        RAID_STATE_COMPARISON_STATUS
          .INVALID_CANDIDATE,

      comparisons: [],
    }
  }

  if (
    !isValidCurrentState(
      currentState
    )
  ) {
    return {
      status:
        RAID_STATE_COMPARISON_STATUS
          .INVALID_CURRENT_STATE,

      comparisons: [],
    }
  }

  if (
    !Array.isArray(
      possibleStates
    )
  ) {
    return {
      status:
        RAID_STATE_COMPARISON_STATUS
          .INVALID_POSSIBLE_STATE,

      comparisons: [],
    }
  }

  if (
    currentState.pokemonIdentity &&
    candidate.pokemonIdentity &&
    currentState.pokemonIdentity !==
      candidate.pokemonIdentity
  ) {
    return {
      status:
        RAID_STATE_COMPARISON_STATUS
          .INVALID_CURRENT_STATE,

      comparisons: [],
    }
  }

  const currentEvaluation =
    evaluateRaidPossibleStateMatchup({
      candidate,

      state:
        currentState,

      defender,

      moves,

      combatData,
    })

  if (
    currentEvaluation.status !==
    RAID_STATE_MATCHUP_STATUS
      .SUCCESS
  ) {
    return {
      status:
        RAID_STATE_COMPARISON_STATUS
          .CURRENT_EVALUATION_FAILED,

      pokemonIdentity:
        candidate
          .pokemonIdentity,

      currentEvaluation,

      comparisons: [],
    }
  }

  const currentCycleDps =
    getCycleDps(
      currentEvaluation
    )

  if (
    currentCycleDps == null
  ) {
    return {
      status:
        RAID_STATE_COMPARISON_STATUS
          .CURRENT_EVALUATION_FAILED,

      pokemonIdentity:
        candidate
          .pokemonIdentity,

      currentEvaluation,

      comparisons: [],
    }
  }

  const comparisons =
    possibleStates.map(
      (possibleState) => {
        if (
          !isValidPossibleState(
            possibleState
          )
        ) {
          return {
            status:
              RAID_STATE_COMPARISON_STATUS
                .INVALID_POSSIBLE_STATE,

            possibleStateType:
              possibleState?.type ??
              null,
          }
        }

        if (
          !hasValidCandidateOverride(
            possibleState
          ) ||
          !hasValidStateIdentity({
            candidate,
            state:
              possibleState,
          })
        ) {
          return {
            status:
              RAID_STATE_COMPARISON_STATUS
                .INVALID_POSSIBLE_STATE,

            possibleStateType:
              possibleState.type ??
              null,
          }
        }

        const possibleEvaluation =
          evaluateRaidPossibleStateMatchup({
            candidate,

            state:
              possibleState,

            defender,

            moves,

            combatData,
          })

        if (
          possibleEvaluation.status !==
          RAID_STATE_MATCHUP_STATUS
            .SUCCESS
        ) {
          return {
            status:
              RAID_STATE_COMPARISON_STATUS
                .POSSIBLE_EVALUATION_FAILED,

            pokemonIdentity:
              candidate
                .pokemonIdentity,

            currentEvaluation,

            possibleEvaluation,

            ...buildComparisonMetadata(
              possibleState
            ),
          }
        }

        const possibleCycleDps =
          getCycleDps(
            possibleEvaluation
          )

        if (
          possibleCycleDps == null
        ) {
          return {
            status:
              RAID_STATE_COMPARISON_STATUS
                .POSSIBLE_EVALUATION_FAILED,

            pokemonIdentity:
              candidate
                .pokemonIdentity,

            currentEvaluation,

            possibleEvaluation,

            ...buildComparisonMetadata(
              possibleState
            ),
          }
        }

        return {
          status:
            RAID_STATE_COMPARISON_STATUS
              .SUCCESS,

          pokemonIdentity:
            candidate
              .pokemonIdentity,

          resultingPokemonIdentity:
            possibleState
              ?.pokemonIdentity ??
            candidate
              .pokemonIdentity,

          currentStateType:
            currentState.type ??
            'CURRENT',

          possibleStateType:
            possibleState.type ??
            null,

          currentEvaluation,

          possibleEvaluation,

          currentBestLoadout:
            currentEvaluation
              .bestLoadout,

          possibleBestLoadout:
            possibleEvaluation
              .bestLoadout,

          currentBestPerformance:
            currentEvaluation
              .bestPerformance,

          possibleBestPerformance:
            possibleEvaluation
              .bestPerformance,

          performanceChange:
            calculatePerformanceChange({
              currentCycleDps,
              possibleCycleDps,
            }),

          ...buildComparisonMetadata(
            possibleState
          ),
        }
      }
    )

  const successfulComparisons =
    comparisons.filter(
      (comparison) =>
        comparison.status ===
        RAID_STATE_COMPARISON_STATUS
          .SUCCESS
    )

  return {
    status:
      RAID_STATE_COMPARISON_STATUS
        .SUCCESS,

    pokemonIdentity:
      candidate
        .pokemonIdentity,

    currentEvaluation,

    comparisons,

    successfulComparisons,
  }
}