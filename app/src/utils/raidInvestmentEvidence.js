import {
  compareRaidPossibleStateToCurrent,
  RAID_STATE_COMPARISON_STATUS,
} from './raidStateComparison.js'

// --------------------------------------------------
// Raid Investment Evidence V3
//
// V3 preserves ordered multi-action investment paths,
// distinguishes source Pokémon identity from the
// resulting possible-state Pokémon identity, and
// carries destination certainty forward from the
// possible-state layer.
//
// This layer does not interpret investment actions or
// destination certainty. It preserves the state/action
// metadata while collecting matchup comparison evidence.
// --------------------------------------------------

// --------------------------------------------------
// Status
// --------------------------------------------------

export const RAID_INVESTMENT_EVIDENCE_STATUS = {
  SUCCESS:
    'SUCCESS',

  INVALID_MATCHUPS:
    'INVALID_MATCHUPS',

  NO_SUCCESSFUL_MATCHUPS:
    'NO_SUCCESSFUL_MATCHUPS',
}

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function getPercentGain(
  comparison
) {
  const percentGain =
    comparison
      ?.performanceChange
      ?.percentGain

  return Number.isFinite(
    percentGain
  )
    ? percentGain
    : null
}

function getPerformanceMultiplier(
  comparison
) {
  const multiplier =
    comparison
      ?.performanceChange
      ?.performanceMultiplier

  return Number.isFinite(
    multiplier
  )
    ? multiplier
    : null
}

function average(
  values
) {
  if (
    values.length ===
    0
  ) {
    return null
  }

  const total =
    values.reduce(
      (
        sum,
        value
      ) =>
        sum + value,
      0
    )

  return (
    total /
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

  const middleIndex =
    Math.floor(
      sorted.length / 2
    )

  if (
    sorted.length %
      2 ===
    1
  ) {
    return sorted[
      middleIndex
    ]
  }

  return (
    sorted[
      middleIndex - 1
    ] +
    sorted[
      middleIndex
    ]
  ) / 2
}

function getSourcePokemonIdentity({
  candidate,
  possibleState,
}) {
  return (
    possibleState
      ?.sourcePokemonIdentity ??
    candidate
      ?.pokemonIdentity ??
    null
  )
}

function getResultingPokemonIdentity({
  candidate,
  possibleState,
}) {
  return (
    possibleState
      ?.pokemonIdentity ??
    candidate
      ?.pokemonIdentity ??
    null
  )
}

function getActions(
  possibleState
) {
  if (
    Array.isArray(
      possibleState
        ?.actions
    ) &&
    possibleState.actions.length >
      0
  ) {
    return possibleState.actions
  }

  return [
    possibleState
      ?.action,

    possibleState
      ?.additionalMoveAction,
  ].filter(
    Boolean
  )
}

function getDestinationCertainty(
  possibleState
) {
  return (
    possibleState
      ?.destinationCertainty ??
    null
  )
}

function buildStateMetadata({
  candidate,
  possibleState,
}) {
  const sourcePokemonIdentity =
    getSourcePokemonIdentity({
      candidate,
      possibleState,
    })

  const resultingPokemonIdentity =
    getResultingPokemonIdentity({
      candidate,
      possibleState,
    })

  const actions =
    getActions(
      possibleState
    )

  const destinationCertainty =
    getDestinationCertainty(
      possibleState
    )

  return {
    pokemonIdentity:
      resultingPokemonIdentity,

    sourcePokemonIdentity,

    resultingPokemonIdentity,

    possibleStateType:
      possibleState
        ?.type ??
      null,

    reachable:
      possibleState
        ?.reachable !==
      false,

    destinationCertainty,

    action:
      possibleState
        ?.action ??
      null,

    actions,

    additionalMoveAction:
      possibleState
        ?.additionalMoveAction ??
      null,

    changes:
      possibleState
        ?.changes ??
      null,

    preservation:
      possibleState
        ?.preservation ??
      null,

    destroysProtectedMove:
      possibleState
        ?.preservation
        ?.destroysProtectedMove ===
      true,
  }
}

function buildSummary(
  successfulEvidence
) {
  const percentGains =
    successfulEvidence
      .map(
        (entry) =>
          getPercentGain(
            entry.comparison
          )
      )
      .filter(
        (value) =>
          value != null
      )

  const multipliers =
    successfulEvidence
      .map(
        (entry) =>
          getPerformanceMultiplier(
            entry.comparison
          )
      )
      .filter(
        (value) =>
          value != null
      )

  const improved =
    successfulEvidence.filter(
      (entry) =>
        entry
          .comparison
          .performanceChange
          .improvesPerformance ===
        true
    ).length

  const reduced =
    successfulEvidence.filter(
      (entry) =>
        entry
          .comparison
          .performanceChange
          .reducesPerformance ===
        true
    ).length

  const unchanged =
    successfulEvidence.filter(
      (entry) =>
        entry
          .comparison
          .performanceChange
          .unchangedPerformance ===
        true
    ).length

  const successfulCount =
    successfulEvidence.length

  return {
    successfulMatchupCount:
      successfulCount,

    improvedMatchupCount:
      improved,

    reducedMatchupCount:
      reduced,

    unchangedMatchupCount:
      unchanged,

    improvementRate:
      successfulCount ===
      0
        ? null
        : improved /
          successfulCount,

    reductionRate:
      successfulCount ===
      0
        ? null
        : reduced /
          successfulCount,

    averagePercentGain:
      average(
        percentGains
      ),

    medianPercentGain:
      median(
        percentGains
      ),

    minimumPercentGain:
      percentGains.length ===
      0
        ? null
        : Math.min(
            ...percentGains
          ),

    maximumPercentGain:
      percentGains.length ===
      0
        ? null
        : Math.max(
            ...percentGains
          ),

    averagePerformanceMultiplier:
      average(
        multipliers
      ),
  }
}

// --------------------------------------------------
// Investment evidence
// --------------------------------------------------

export function buildRaidInvestmentEvidence({
  candidate,
  currentState,
  possibleState,
  matchups,
  moves,
  combatData,
}) {
  if (
    !Array.isArray(
      matchups
    ) ||
    matchups.length ===
      0
  ) {
    return {
      status:
        RAID_INVESTMENT_EVIDENCE_STATUS
          .INVALID_MATCHUPS,

      evidence: [],

      successfulEvidence: [],

      failedEvidence: [],
    }
  }

  const stateMetadata =
    buildStateMetadata({
      candidate,
      possibleState,
    })

  const evidence =
    matchups.map(
      (
        matchup,
        index
      ) => {
        const comparison =
          compareRaidPossibleStateToCurrent({
            candidate,

            currentState,

            possibleState,

            defender:
              matchup
                ?.defender,

            moves,

            combatData,
          })

        return {
          matchupId:
            matchup?.id ??
            `MATCHUP_${index + 1}`,

          label:
            matchup?.label ??
            null,

          comparison,
        }
      }
    )

  const successfulEvidence =
    evidence.filter(
      (entry) =>
        entry
          .comparison
          .status ===
        RAID_STATE_COMPARISON_STATUS
          .SUCCESS
    )

  const failedEvidence =
    evidence.filter(
      (entry) =>
        entry
          .comparison
          .status !==
        RAID_STATE_COMPARISON_STATUS
          .SUCCESS
    )

  if (
    successfulEvidence.length ===
    0
  ) {
    return {
      status:
        RAID_INVESTMENT_EVIDENCE_STATUS
          .NO_SUCCESSFUL_MATCHUPS,

      ...stateMetadata,

      matchupCount:
        evidence.length,

      successfulMatchupCount:
        0,

      failedMatchupCount:
        failedEvidence.length,

      evidence,

      successfulEvidence,

      failedEvidence,
    }
  }

  const summary =
    buildSummary(
      successfulEvidence
    )

  return {
    status:
      RAID_INVESTMENT_EVIDENCE_STATUS
        .SUCCESS,

    ...stateMetadata,

    matchupCount:
      evidence.length,

    failedMatchupCount:
      failedEvidence.length,

    ...summary,

    evidence,

    successfulEvidence,

    failedEvidence,
  }
}