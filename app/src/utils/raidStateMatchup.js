import {
  evaluateOwnedRaidMatchup,
  RAID_MATCHUP_STATUS,
} from './raidMatchup.js'

// --------------------------------------------------
// Status
// --------------------------------------------------

export const RAID_STATE_MATCHUP_STATUS = {
  SUCCESS:
    'SUCCESS',

  INVALID_CANDIDATE:
    'INVALID_CANDIDATE',

  INVALID_STATE:
    'INVALID_STATE',

  NO_SUCCESSFUL_LOADOUTS:
    'NO_SUCCESSFUL_LOADOUTS',
}

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function isValidCandidate(
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

function hasValidCombatOverride(
  state
) {
  if (!state?.combat) {
    return true
  }

  return (
    Number.isFinite(
      state.combat.level
    ) &&
    Number.isFinite(
      state.combat.cpm
    )
  )
}

function hasValidCandidateOverride(
  state
) {
  if (!state?.candidate) {
    return true
  }

  return isValidCandidate(
    state.candidate
  )
}

function isValidState(
  state
) {
  return (
    state &&
    state.moves &&
    state.moves.fastMoveId &&
    Array.isArray(
      state.loadouts
    ) &&
    state.loadouts.length >
      0 &&
    hasValidCombatOverride(
      state
    ) &&
    hasValidCandidateOverride(
      state
    )
  )
}

function getEffectiveCandidate({
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
    getEffectiveCandidate({
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

function getChargedMovesFromState(
  state
) {
  return [
    state.moves
      .chargedMove1Id,

    state.moves
      .chargedMove2Id,
  ].filter(
    Boolean
  )
}

function buildCandidateForState({
  candidate,
  state,
}) {
  const effectiveCandidate =
    getEffectiveCandidate({
      candidate,
      state,
    })

  const chargedMoves =
    getChargedMovesFromState(
      state
    )

  const level =
    state
      ?.combat
      ?.level ??
    effectiveCandidate.level

  const cpm =
    state
      ?.combat
      ?.cpm ??
    effectiveCandidate.cpm

  return {
    ...effectiveCandidate,

    level,

    cpm,

    moves: {
      fast:
        state.moves
          .fastMoveId,

      charged:
        chargedMoves,

      chargedSlots: {
        slot1:
          state.moves
            .chargedMove1Id ??
          null,

        slot2:
          state.moves
            .chargedMove2Id ??
          null,
      },
    },

    loadouts:
      state.loadouts.map(
        (loadout) => ({
          fastMoveId:
            loadout.fastMoveId,

          chargedMoveId:
            loadout
              .chargedMoveId,
        })
      ),
  }
}

function getCycleDps(
  evaluation
) {
  const cycleDps =
    evaluation
      ?.performance
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

function findBestSuccessfulEvaluation(
  evaluations
) {
  const successful =
    evaluations.filter(
      (evaluation) =>
        evaluation.status ===
          RAID_MATCHUP_STATUS
            .SUCCESS &&
        getCycleDps(
          evaluation
        ) != null
    )

  if (
    successful.length ===
    0
  ) {
    return null
  }

  return successful.reduce(
    (
      best,
      current
    ) => {
      if (!best) {
        return current
      }

      const bestDps =
        getCycleDps(
          best
        )

      const currentDps =
        getCycleDps(
          current
        )

      return currentDps >
        bestDps
        ? current
        : best
    },
    null
  )
}

function buildStateMetadata(
  state
) {
  return {
    stateType:
      state.type,

    pokemonIdentity:
      state
        .pokemonIdentity ??
      null,

    reachable:
      state.reachable,

    preservation:
      state.preservation ??
      null,

    action:
      state.action ??
      null,

    ...(state.candidate
      ? {
          candidateOverride:
            true,

          sourcePokemonIdentity:
            state.candidate
              ?.sourcePokemonIdentity ??
            null,
        }
      : {}),

    ...(state.combat
      ? {
          combat: {
            ...state.combat,
          },
        }
      : {}),
  }
}

// --------------------------------------------------
// Single possible-state matchup
// --------------------------------------------------

export function evaluateRaidPossibleStateMatchup({
  candidate,
  state,
  defender,
  moves,
  combatData,
}) {
  if (
    !isValidCandidate(
      candidate
    )
  ) {
    return {
      status:
        RAID_STATE_MATCHUP_STATUS
          .INVALID_CANDIDATE,
    }
  }

  if (
    !isValidState(
      state
    )
  ) {
    return {
      status:
        RAID_STATE_MATCHUP_STATUS
          .INVALID_STATE,
    }
  }

  if (
    !hasValidStateIdentity({
      candidate,
      state,
    })
  ) {
    return {
      status:
        RAID_STATE_MATCHUP_STATUS
          .INVALID_STATE,
    }
  }

  const effectiveCandidate =
    getEffectiveCandidate({
      candidate,
      state,
    })

  const stateCandidate =
    buildCandidateForState({
      candidate,
      state,
    })

  const evaluations =
    state.loadouts.map(
      (loadout) =>
        evaluateOwnedRaidMatchup({
          candidate:
            stateCandidate,

          loadout,

          defender,

          moves,

          combatData,
        })
    )

  const successfulEvaluations =
    evaluations.filter(
      (evaluation) =>
        evaluation.status ===
          RAID_MATCHUP_STATUS
            .SUCCESS
    )

  const bestEvaluation =
    findBestSuccessfulEvaluation(
      evaluations
    )

  if (
    successfulEvaluations.length ===
      0 ||
    !bestEvaluation
  ) {
    return {
      status:
        RAID_STATE_MATCHUP_STATUS
          .NO_SUCCESSFUL_LOADOUTS,

      pokemonIdentity:
        effectiveCandidate
          .pokemonIdentity,

      ...(effectiveCandidate
          .pokemonIdentity !==
        candidate
          .pokemonIdentity
        ? {
            sourcePokemonIdentity:
              candidate
                .pokemonIdentity,
          }
        : {}),

      ...buildStateMetadata(
        state
      ),

      evaluations,
    }
  }

  return {
    status:
      RAID_STATE_MATCHUP_STATUS
        .SUCCESS,

    pokemonIdentity:
      effectiveCandidate
        .pokemonIdentity,

    ...(effectiveCandidate
        .pokemonIdentity !==
      candidate
        .pokemonIdentity
      ? {
          sourcePokemonIdentity:
            candidate
              .pokemonIdentity,
        }
      : {}),

    stateType:
      state.type,

    current:
      state.current ===
      true,

    reachable:
      state.reachable !==
      false,

    moves: {
      ...state.moves,
    },

    ...(state.combat
      ? {
          combat: {
            ...state.combat,
          },
        }
      : {}),

    preservation:
      state.preservation ??
      null,

    action:
      state.action ??
      null,

    changes:
      state.changes ??
      null,

    candidateOverride:
      Boolean(
        state.candidate
      ),

    evaluations,

    successfulEvaluations,

    bestEvaluation,

    bestLoadout: {
      ...bestEvaluation
        .loadout,
    },

    bestPerformance:
      bestEvaluation
        .performance,
  }
}

// --------------------------------------------------
// Multiple possible states
// --------------------------------------------------

export function evaluateRaidPossibleStatesMatchup({
  candidate,
  states,
  defender,
  moves,
  combatData,
}) {
  if (
    !isValidCandidate(
      candidate
    )
  ) {
    return {
      status:
        RAID_STATE_MATCHUP_STATUS
          .INVALID_CANDIDATE,

      evaluations:
        [],
    }
  }

  if (
    !Array.isArray(
      states
    )
  ) {
    return {
      status:
        RAID_STATE_MATCHUP_STATUS
          .INVALID_STATE,

      evaluations:
        [],
    }
  }

  const evaluations =
    states.map(
      (state) =>
        evaluateRaidPossibleStateMatchup({
          candidate,
          state,
          defender,
          moves,
          combatData,
        })
    )

  const successfulEvaluations =
    evaluations.filter(
      (evaluation) =>
        evaluation.status ===
          RAID_STATE_MATCHUP_STATUS
            .SUCCESS
    )

  return {
    status:
      RAID_STATE_MATCHUP_STATUS
        .SUCCESS,

    pokemonIdentity:
      candidate
        .pokemonIdentity,

    evaluations,

    successfulEvaluations,
  }
}