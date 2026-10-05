import {
  evaluateRaidAttackerLoadoutsDetailed,
  RAID_ATTACKER_EVALUATION_STATUS,
} from '../engine/Raid/comparison.js'

// --------------------------------------------------
// Raid Strength V6
//
// Purpose:
//
// Measure how strong an exact owned/projected raid
// state actually is.
//
// V4 established the exact-state rule:
//
// - owned/projected states only receive credit for the
//   Fast + Charged loadouts they actually possess
// - theoretical/reference ceilings remain theoretical
//
// V5 expanded attacking-role semantics:
//
// - Fast Move type counts as a represented role
// - Charged Move type counts as a represented role
// - one Fast + two Charged Moves can therefore represent
//   up to three distinct attacking types
//
// V6 makes exact-state evaluation independent from
// theoretical species/form movepool generation:
//
// - exact owned loadouts are evaluated directly
// - already-owned special/acquisition-specific moves
//   do not need to appear in the ordinary generated
//   species/form move pool
// - theoretical/reference ceilings remain unchanged
//
// The entire exact loadout remains the combat unit.
// We do NOT artificially split Cycle DPS into separate
// Fast-Move DPS and Charged-Move DPS.
//
// This module produces evidence only.
// --------------------------------------------------

// --------------------------------------------------
// Status
// --------------------------------------------------

export const RAID_STRENGTH_STATUS = {
  SUCCESS:
    'SUCCESS',

  INVALID_STATE:
    'INVALID_STATE',

  INVALID_MATCHUPS:
    'INVALID_MATCHUPS',

  INVALID_THEORETICAL_RANKINGS:
    'INVALID_THEORETICAL_RANKINGS',

  INVALID_STRENGTH_REFERENCE:
    'INVALID_STRENGTH_REFERENCE',

  INVALID_MOVES:
    'INVALID_MOVES',

  INVALID_COMBAT_DATA:
    'INVALID_COMBAT_DATA',

  NO_STATE_LOADOUTS:
    'NO_STATE_LOADOUTS',

  NO_EVALUATED_STATE_LOADOUTS:
    'NO_EVALUATED_STATE_LOADOUTS',

  NO_RELEVANT_MATCHUPS:
    'NO_RELEVANT_MATCHUPS',

  NO_COMPARABLE_MATCHUPS:
    'NO_COMPARABLE_MATCHUPS',
}

// --------------------------------------------------
// Strength classifications
// --------------------------------------------------

export const RAID_STRENGTH_CLASSIFICATION = {
  ELITE:
    'ELITE',

  STRONG:
    'STRONG',

  COMPETITIVE:
    'COMPETITIVE',

  LIMITED:
    'LIMITED',

  WEAK:
    'WEAK',
}

// --------------------------------------------------
// Strength universes
// --------------------------------------------------

export const RAID_STRENGTH_UNIVERSE = {
  STANDARD:
    'STANDARD',

  TEMPORARY_EVOLUTION:
    'TEMPORARY_EVOLUTION',
}

// --------------------------------------------------
// Thresholds
// --------------------------------------------------

export const RAID_STRENGTH_THRESHOLDS = {
  eliteRatio:
    0.9,

  strongRatio:
    0.8,

  competitiveRatio:
    0.7,

  limitedRatio:
    0.5,

  relevantEffectiveness:
    1,
}

// --------------------------------------------------
// Basic helpers
// --------------------------------------------------

function finiteOrNull(
  value
) {
  return Number.isFinite(
    value
  )
    ? value
    : null
}

function clamp(
  value,
  minimum,
  maximum
) {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value
    )
  )
}

function round(
  value,
  decimals = 4
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

function median(
  values
) {
  const finiteValues =
    values
      .filter(
        Number.isFinite
      )
      .sort(
        (a, b) =>
          a - b
      )

  if (
    finiteValues.length ===
    0
  ) {
    return null
  }

  const middle =
    Math.floor(
      finiteValues.length /
        2
    )

  if (
    finiteValues.length %
      2 ===
    1
  ) {
    return finiteValues[
      middle
    ]
  }

  return (
    finiteValues[
      middle - 1
    ] +
    finiteValues[
      middle
    ]
  ) / 2
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

// --------------------------------------------------
// State normalization
// --------------------------------------------------

function resolveStateCandidate(
  state
) {
  if (!state) {
    return null
  }

  if (
    state.candidate?.pokemon &&
    Number.isFinite(
      state
        .candidate
        .cpMultiplier
    )
  ) {
    return state.candidate
  }

  if (
    state.pokemon &&
    Number.isFinite(
      state.cpMultiplier
    )
  ) {
    return state
  }

  return null
}

// --------------------------------------------------
// Exact-state loadouts
// --------------------------------------------------

function normalizeMoveId(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null
  }

  return String(
    value
  )
}

function normalizeLoadout(
  loadout
) {
  const fastMoveId =
    normalizeMoveId(
      loadout
        ?.fastMoveId
    )

  const chargedMoveId =
    normalizeMoveId(
      loadout
        ?.chargedMoveId
    )

  if (
    !fastMoveId ||
    !chargedMoveId
  ) {
    return null
  }

  return {
    fastMoveId,
    chargedMoveId,
  }
}

function buildLoadoutsFromMoves(
  moves
) {
  if (!moves) {
    return []
  }

  const fastMoveId =
    normalizeMoveId(
      moves.fastMoveId ??
      moves.fast ??
      null
    )

  if (!fastMoveId) {
    return []
  }

  const chargedMoveIds = [
    moves.chargedMove1Id ??
      moves.charged1 ??
      null,

    moves.chargedMove2Id ??
      moves.charged2 ??
      null,

    moves.chargedMoveId ??
      moves.charged ??
      null,
  ]
    .map(
      normalizeMoveId
    )
    .filter(
      Boolean
    )

  return (
    chargedMoveIds.map(
      (
        chargedMoveId
      ) => ({
        fastMoveId,
        chargedMoveId,
      })
    )
  )
}

function getLoadoutKey(
  loadout
) {
  const normalized =
    normalizeLoadout(
      loadout
    )

  if (!normalized) {
    return null
  }

  return (
    `${normalized.fastMoveId}::${normalized.chargedMoveId}`
  )
}

function dedupeLoadouts(
  loadouts
) {
  const seen =
    new Set()

  const result = []

  for (
    const loadout
    of loadouts ??
    []
  ) {
    const normalized =
      normalizeLoadout(
        loadout
      )

    const key =
      getLoadoutKey(
        normalized
      )

    if (
      !normalized ||
      !key ||
      seen.has(
        key
      )
    ) {
      continue
    }

    seen.add(
      key
    )

    result.push(
      normalized
    )
  }

  return result
}

function getStateLoadouts({
  state,
  candidate,
}) {
  const sources = [
    Array.isArray(
      state
        ?.loadouts
    )
      ? state.loadouts
      : null,

    buildLoadoutsFromMoves(
      state
        ?.moves
    ),

    Array.isArray(
      candidate
        ?.loadouts
    )
      ? candidate.loadouts
      : null,

    buildLoadoutsFromMoves(
      candidate
        ?.moves
    ),
  ]

  for (
    const source
    of sources
  ) {
    if (
      !Array.isArray(
        source
      )
    ) {
      continue
    }

    const loadouts =
      dedupeLoadouts(
        source
      )

    if (
      loadouts.length >
      0
    ) {
      return loadouts
    }
  }

  return []
}

// --------------------------------------------------
// Move helpers
// --------------------------------------------------

function buildMoveLookup(
  moves
) {
  const lookup =
    new Map()

  if (
    !Array.isArray(
      moves
    )
  ) {
    return lookup
  }

  for (
    const move
    of moves
  ) {
    if (
      move?.id ===
        null ||
      move?.id ===
        undefined
    ) {
      continue
    }

    lookup.set(
      String(
        move.id
      ),
      move
    )
  }

  return lookup
}

function getMoveType(
  move
) {
  const type =
    move?.type ??
    move?.pokemonType ??
    move?.moveType ??
    null

  if (!type) {
    return null
  }

  return String(
    type
  ).toUpperCase()
}

// --------------------------------------------------
// V5/V6 role semantics
//
// One exact loadout may represent:
//
// Fast Move type
// Charged Move type
//
// Duplicate typing is collapsed.
//
// Examples:
//
// Psycho Cut + Focus Blast
// -> PSYCHIC + FIGHTING
//
// Rock Throw + Stone Edge
// -> ROCK
//
// Dragon Tail + Outrage / Breaking Swipe
// -> DRAGON
// --------------------------------------------------

function getMovesetRoleTypes({
  moveset,
  moveLookup,
}) {
  if (!moveset) {
    return []
  }

  const fastMove =
    moveset
      .fastMoveId
      ? moveLookup.get(
          String(
            moveset
              .fastMoveId
          )
        )
      : null

  const chargedMove =
    moveset
      .chargedMoveId
      ? moveLookup.get(
          String(
            moveset
              .chargedMoveId
          )
        )
      : null

  const types = [
    getMoveType(
      fastMove
    ),

    getMoveType(
      chargedMove
    ),
  ]

  return (
    types.filter(
      (
        type,
        index
      ) =>
        Boolean(
          type
        ) &&
        types.indexOf(
          type
        ) ===
          index
    )
  )
}

function movesetRepresentsRole({
  moveset,
  roleType,
  moveLookup,
}) {
  return (
    getMovesetRoleTypes({
      moveset,
      moveLookup,
    }).includes(
      roleType
    )
  )
}

// --------------------------------------------------
// Type effectiveness
// --------------------------------------------------

function getDefenderTypes(
  matchup
) {
  const types =
    matchup
      ?.defender
      ?.types

  if (
    !Array.isArray(
      types
    )
  ) {
    return []
  }

  return (
    types
      .filter(
        Boolean
      )
      .map(
        (
          type
        ) =>
          String(
            type
          ).toUpperCase()
      )
  )
}

function getTypeEffectiveness({
  attackType,
  defenderTypes,
  combatData,
}) {
  if (
    !attackType ||
    !Array.isArray(
      defenderTypes
    ) ||
    defenderTypes.length ===
      0
  ) {
    return null
  }

  const chart =
    combatData
      ?.typeEffectiveness
      ?.[attackType]

  if (!chart) {
    return null
  }

  let multiplier =
    1

  for (
    const defenderType
    of defenderTypes
  ) {
    const scalar =
      finiteOrNull(
        chart[
          defenderType
        ]
      )

    if (
      scalar ===
      null
    ) {
      return null
    }

    multiplier *=
      scalar
  }

  return multiplier
}

function getRoleRelevance({
  roleType,
  matchup,
  combatData,
}) {
  const effectiveness =
    getTypeEffectiveness({
      attackType:
        roleType,

      defenderTypes:
        getDefenderTypes(
          matchup
        ),

      combatData,
    })

  return {
    relevant:
      Number.isFinite(
        effectiveness
      ) &&
      effectiveness >
        RAID_STRENGTH_THRESHOLDS
          .relevantEffectiveness,

    effectiveness,
  }
}

// --------------------------------------------------
// Candidate universes
// --------------------------------------------------

function isTemporaryEvolutionId(
  id
) {
  return (
    Boolean(
      id
    ) &&
    String(
      id
    ).includes(
      '__TEMP_EVOLUTION_'
    )
  )
}

function getCandidateUniverse(
  candidate
) {
  if (!candidate) {
    return null
  }

  const candidateType =
    candidate
      ?.candidateType ??
    candidate
      ?.pokemon
      ?.raidCandidateMetadata
      ?.candidateType ??
    null

  if (
    candidateType ===
      'TEMPORARY_EVOLUTION' ||
    isTemporaryEvolutionId(
      candidate.id
    )
  ) {
    return (
      RAID_STRENGTH_UNIVERSE
        .TEMPORARY_EVOLUTION
    )
  }

  return (
    RAID_STRENGTH_UNIVERSE
      .STANDARD
  )
}

function getRankingUniverse(
  ranking
) {
  if (
    isTemporaryEvolutionId(
      ranking
        ?.id
    )
  ) {
    return (
      RAID_STRENGTH_UNIVERSE
        .TEMPORARY_EVOLUTION
    )
  }

  return (
    RAID_STRENGTH_UNIVERSE
      .STANDARD
  )
}

// --------------------------------------------------
// Theoretical ranking helpers
// --------------------------------------------------

function getTheoreticalRankings(
  theoreticalResult
) {
  if (
    Array.isArray(
      theoreticalResult
        ?.rankings
    )
  ) {
    return (
      theoreticalResult
        .rankings
    )
  }

  if (
    Array.isArray(
      theoreticalResult
        ?.comparison
        ?.rankings
    )
  ) {
    return (
      theoreticalResult
        .comparison
        .rankings
    )
  }

  return []
}

function getRankingMovesets(
  ranking
) {
  if (
    Array.isArray(
      ranking
        ?.movesetRankings
    )
  ) {
    return (
      ranking
        .movesetRankings
    )
  }

  if (
    ranking
      ?.bestMoveset
  ) {
    return [
      ranking.bestMoveset,
    ]
  }

  return []
}

// --------------------------------------------------
// Best theoretical moveset for one role
// --------------------------------------------------

function getBestRoleMoveset({
  ranking,
  roleType,
  moveLookup,
}) {
  if (
    !ranking ||
    !roleType
  ) {
    return null
  }

  let best =
    null

  for (
    const moveset
    of getRankingMovesets(
      ranking
    )
  ) {
    if (
      !movesetRepresentsRole({
        moveset,
        roleType,
        moveLookup,
      })
    ) {
      continue
    }

    const dps =
      finiteOrNull(
        moveset
          ?.cycleDps
      )

    if (
      dps === null ||
      dps <= 0
    ) {
      continue
    }

    if (
      !best ||
      dps >
        best.cycleDps
    ) {
      best =
        moveset
    }
  }

  return best
}

// --------------------------------------------------
// Relevant roles for one exact evaluated state
// --------------------------------------------------

function getRelevantStateRoles({
  evaluation,
  matchup,
  moveLookup,
  combatData,
}) {
  const roleMap =
    new Map()

  for (
    const moveset
    of getRankingMovesets(
      evaluation
    )
  ) {
    const dps =
      finiteOrNull(
        moveset
          ?.cycleDps
      )

    if (
      dps === null ||
      dps <= 0
    ) {
      continue
    }

    const roleTypes =
      getMovesetRoleTypes({
        moveset,
        moveLookup,
      })

    for (
      const roleType
      of roleTypes
    ) {
      const relevance =
        getRoleRelevance({
          roleType,
          matchup,
          combatData,
        })

      if (
        !relevance
          .relevant
      ) {
        continue
      }

      const current =
        roleMap.get(
          roleType
        )

      if (
        !current ||
        dps >
          current
            .stateDps
      ) {
        const fastMoveType =
          getMoveType(
            moveLookup.get(
              String(
                moveset
                  .fastMoveId
              )
            )
          )

        const chargedMoveType =
          getMoveType(
            moveLookup.get(
              String(
                moveset
                  .chargedMoveId
              )
            )
          )

        roleMap.set(
          roleType,
          {
            roleType,

            effectiveness:
              relevance
                .effectiveness,

            stateDps:
              dps,

            moveset,

            representedBy: {
              fastMove:
                fastMoveType ===
                roleType,

              chargedMove:
                chargedMoveType ===
                roleType,
            },
          }
        )
      }
    }
  }

  return [
    ...roleMap.values(),
  ]
}

// --------------------------------------------------
// Full theoretical-ranking ceiling
// --------------------------------------------------

function getRoleTheoreticalLeader({
  theoreticalResult,
  roleType,
  universe,
  moveLookup,
}) {
  let leader =
    null

  const rankings =
    getTheoreticalRankings(
      theoreticalResult
    )

  for (
    const ranking
    of rankings
  ) {
    if (
      getRankingUniverse(
        ranking
      ) !==
      universe
    ) {
      continue
    }

    const moveset =
      getBestRoleMoveset({
        ranking,
        roleType,
        moveLookup,
      })

    const dps =
      finiteOrNull(
        moveset
          ?.cycleDps
      )

    if (
      dps === null ||
      dps <= 0
    ) {
      continue
    }

    if (
      !leader ||
      dps >
        leader.dps
    ) {
      leader = {
        ranking,
        moveset,
        dps,
      }
    }
  }

  return leader
}

function getOverallTheoreticalLeader({
  theoreticalResult,
  universe,
}) {
  const rankings =
    getTheoreticalRankings(
      theoreticalResult
    )

  for (
    const ranking
    of rankings
  ) {
    if (
      getRankingUniverse(
        ranking
      ) !==
      universe
    ) {
      continue
    }

    const dps =
      finiteOrNull(
        ranking
          ?.bestMoveset
          ?.cycleDps
      )

    if (
      dps !== null &&
      dps > 0
    ) {
      return ranking
    }
  }

  return null
}

// --------------------------------------------------
// Matchup lookup
// --------------------------------------------------

function getMatchupId(
  matchup,
  index
) {
  return (
    matchup?.id ??
    `MATCHUP_${index + 1}`
  )
}

function findTheoreticalResult({
  theoreticalRankings,
  matchupId,
  index,
}) {
  if (
    !Array.isArray(
      theoreticalRankings
    )
  ) {
    return null
  }

  const byId =
    theoreticalRankings.find(
      (
        entry
      ) =>
        entry
          ?.matchupId ===
          matchupId ||
        entry
          ?.id ===
          matchupId ||
        entry
          ?.matchup
          ?.id ===
          matchupId
    )

  return (
    byId ??
    theoreticalRankings[
      index
    ] ??
    null
  )
}

// --------------------------------------------------
// Compact production reference
// --------------------------------------------------

function getStrengthReferenceBenchmark({
  strengthReference,
  matchupId,
}) {
  return (
    strengthReference
      ?.benchmarks
      ?.[matchupId] ??
    null
  )
}

function getStrengthReferenceUniverse({
  strengthBenchmark,
  universe,
}) {
  return (
    strengthBenchmark
      ?.universes
      ?.[universe] ??
    null
  )
}

function getReferenceRoleLeader({
  strengthBenchmark,
  universe,
  roleType,
}) {
  const universeReference =
    getStrengthReferenceUniverse({
      strengthBenchmark,
      universe,
    })

  const leader =
    universeReference
      ?.roles
      ?.[roleType] ??
    null

  const dps =
    finiteOrNull(
      leader
        ?.cycleDps
    )

  if (
    !leader ||
    dps === null ||
    dps <= 0
  ) {
    return null
  }

  const moveset = {
    fastMoveId:
      leader.fastMoveId ??
      null,

    chargedMoveId:
      leader.chargedMoveId ??
      null,

    cycleDps:
      dps,
  }

  return {
    ranking: {
      id:
        leader.candidateId ??
        null,

      candidateType:
        leader.candidateType ??
        null,

      bestMoveset:
        moveset,
    },

    moveset,

    dps,
  }
}

function getReferenceOverallLeader({
  strengthBenchmark,
  universe,
}) {
  const universeReference =
    getStrengthReferenceUniverse({
      strengthBenchmark,
      universe,
    })

  const leader =
    universeReference
      ?.overall ??
    null

  const dps =
    finiteOrNull(
      leader
        ?.cycleDps
    )

  if (
    !leader ||
    dps === null ||
    dps <= 0
  ) {
    return null
  }

  return {
    id:
      leader.candidateId ??
      null,

    candidateType:
      leader.candidateType ??
      null,

    bestMoveset: {
      fastMoveId:
        leader.fastMoveId ??
        null,

      chargedMoveId:
        leader.chargedMoveId ??
        null,

      cycleDps:
        dps,
    },
  }
}

function hasTheoreticalRankingSource(
  theoreticalResult
) {
  return (
    getTheoreticalRankings(
      theoreticalResult
    ).length >
    0
  )
}

function hasStrengthReferenceSource(
  strengthBenchmark
) {
  return Boolean(
    strengthBenchmark
      ?.universes
  )
}

// --------------------------------------------------
// Classification
// --------------------------------------------------

export function classifyRaidStrength(
  strengthRatio
) {
  if (
    !Number.isFinite(
      strengthRatio
    )
  ) {
    return null
  }

  if (
    strengthRatio >=
    RAID_STRENGTH_THRESHOLDS
      .eliteRatio
  ) {
    return (
      RAID_STRENGTH_CLASSIFICATION
        .ELITE
    )
  }

  if (
    strengthRatio >=
    RAID_STRENGTH_THRESHOLDS
      .strongRatio
  ) {
    return (
      RAID_STRENGTH_CLASSIFICATION
        .STRONG
    )
  }

  if (
    strengthRatio >=
    RAID_STRENGTH_THRESHOLDS
      .competitiveRatio
  ) {
    return (
      RAID_STRENGTH_CLASSIFICATION
        .COMPETITIVE
    )
  }

  if (
    strengthRatio >=
    RAID_STRENGTH_THRESHOLDS
      .limitedRatio
  ) {
    return (
      RAID_STRENGTH_CLASSIFICATION
        .LIMITED
    )
  }

  return (
    RAID_STRENGTH_CLASSIFICATION
      .WEAK
  )
}

// --------------------------------------------------
// Evaluate one role
// --------------------------------------------------

function evaluateRoleStrength({
  stateRole,
  theoreticalResult = null,
  strengthBenchmark = null,
  universe,
  moveLookup,
  overallTheoreticalLeader,
}) {
  const theoreticalRoleLeader =
    strengthBenchmark
      ? getReferenceRoleLeader({
          strengthBenchmark,
          universe,

          roleType:
            stateRole
              .roleType,
        })
      : getRoleTheoreticalLeader({
          theoreticalResult,

          roleType:
            stateRole
              .roleType,

          universe,
          moveLookup,
        })

  if (
    !theoreticalRoleLeader
  ) {
    return null
  }

  const theoreticalBestDps =
    finiteOrNull(
      theoreticalRoleLeader
        .dps
    )

  if (
    theoreticalBestDps ===
      null ||
    theoreticalBestDps <= 0
  ) {
    return null
  }

  const rawStrengthRatio =
    stateRole
      .stateDps /
    theoreticalBestDps

  const strengthRatio =
    clamp(
      rawStrengthRatio,
      0,
      1
    )

  const overallBestDps =
    finiteOrNull(
      overallTheoreticalLeader
        ?.bestMoveset
        ?.cycleDps
    )

  const overallRawStrengthRatio =
    overallBestDps !==
      null &&
    overallBestDps > 0
      ? (
          stateRole
            .stateDps /
          overallBestDps
        )
      : null

  const overallStrengthRatio =
    overallRawStrengthRatio !==
      null
      ? clamp(
          overallRawStrengthRatio,
          0,
          1
        )
      : null

  return {
    roleType:
      stateRole
        .roleType,

    representedBy:
      stateRole
        .representedBy ??
      null,

    effectiveness:
      round(
        stateRole
          .effectiveness,
        6
      ),

    stateDps:
      round(
        stateRole
          .stateDps,
        6
      ),

    stateMoveset:
      stateRole
        .moveset,

    theoreticalBestDps:
      round(
        theoreticalBestDps,
        6
      ),

    theoreticalLeader:
      theoreticalRoleLeader
        .ranking,

    theoreticalLeaderMoveset:
      theoreticalRoleLeader
        .moveset,

    rawStrengthRatio:
      round(
        rawStrengthRatio,
        6
      ),

    strengthRatio:
      round(
        strengthRatio,
        6
      ),

    strengthScore:
      round(
        strengthRatio *
          100,
        2
      ),

    classification:
      classifyRaidStrength(
        strengthRatio
      ),

    overallTheoreticalBestDps:
      round(
        overallBestDps,
        6
      ),

    overallRawStrengthRatio:
      round(
        overallRawStrengthRatio,
        6
      ),

    overallStrengthRatio:
      round(
        overallStrengthRatio,
        6
      ),

    overallStrengthScore:
      overallStrengthRatio !==
        null
        ? round(
            overallStrengthRatio *
              100,
            2
          )
        : null,
  }
}

// --------------------------------------------------
// Evaluate one benchmark matchup
// --------------------------------------------------

export function evaluateRaidStrengthMatchup({
  state,
  matchup,
  theoreticalResult = null,
  strengthBenchmark = null,
  moves,
  combatData,
}) {
  const candidate =
    resolveStateCandidate(
      state
    )

  if (!candidate) {
    return {
      success:
        false,

      relevant:
        false,

      reason:
        RAID_STRENGTH_STATUS
          .INVALID_STATE,
    }
  }

  if (
    !matchup
      ?.defender
  ) {
    return {
      success:
        false,

      relevant:
        false,

      reason:
        RAID_STRENGTH_STATUS
          .INVALID_MATCHUPS,
    }
  }

  if (
    !Array.isArray(
      moves
    ) ||
    moves.length ===
      0
  ) {
    return {
      success:
        false,

      relevant:
        false,

      reason:
        RAID_STRENGTH_STATUS
          .INVALID_MOVES,
    }
  }

  if (
    !combatData
      ?.typeEffectiveness
  ) {
    return {
      success:
        false,

      relevant:
        false,

      reason:
        RAID_STRENGTH_STATUS
          .INVALID_COMBAT_DATA,
    }
  }

  const hasDiagnosticSource =
    hasTheoreticalRankingSource(
      theoreticalResult
    )

  const hasProductionSource =
    hasStrengthReferenceSource(
      strengthBenchmark
    )

  if (
    !hasDiagnosticSource &&
    !hasProductionSource
  ) {
    return {
      success:
        false,

      relevant:
        false,

      reason:
        RAID_STRENGTH_STATUS
          .INVALID_STRENGTH_REFERENCE,
    }
  }

  const stateLoadouts =
    getStateLoadouts({
      state,
      candidate,
    })

  if (
    stateLoadouts.length ===
      0
  ) {
    return {
      success:
        false,

      relevant:
        false,

      reason:
        RAID_STRENGTH_STATUS
          .NO_STATE_LOADOUTS,

      stateLoadouts: [],
    }
  }

  const defenderCpMultiplier =
    finiteOrNull(
      matchup
        ?.defender
        ?.raidBoss
        ?.cpMultiplier
    )

  if (
    defenderCpMultiplier ===
      null
  ) {
    return {
      success:
        false,

      relevant:
        false,

      reason:
        RAID_STRENGTH_STATUS
          .INVALID_MATCHUPS,

      stateLoadouts,
    }
  }

  // ------------------------------------------------
  // V6 exact-state evaluation
  //
  // Evaluate the supplied owned/projected loadouts
  // directly.
  //
  // We deliberately do NOT:
  //
  // 1. generate the species/form theoretical movepool
  // 2. optimize every theoretical moveset
  // 3. filter those rankings back to the owned state
  //
  // Ownership is sufficient evidence that the current
  // loadout exists. Acquisition legality belongs to
  // reference/recommendation logic, not current-state
  // combat evaluation.
  // ------------------------------------------------

  const evaluation =
    evaluateRaidAttackerLoadoutsDetailed({
      candidate,

      loadouts:
        stateLoadouts,

      defender:
        matchup.defender,

      defenderCpMultiplier,

      moves,
      combatData,
    })

  if (
    evaluation
      .status !==
    RAID_ATTACKER_EVALUATION_STATUS
      .SUCCESS
  ) {
    return {
      success:
        false,

      relevant:
        false,

      reason:
        evaluation
          .status,

      stateLoadouts,

      evaluation,
    }
  }

  if (
    !Array.isArray(
      evaluation
        .movesetRankings
    ) ||
    evaluation
      .movesetRankings
      .length ===
      0
  ) {
    return {
      success:
        false,

      relevant:
        false,

      reason:
        RAID_STRENGTH_STATUS
          .NO_EVALUATED_STATE_LOADOUTS,

      stateLoadouts,

      evaluation,
    }
  }

  const moveLookup =
    buildMoveLookup(
      moves
    )

  const universe =
    getCandidateUniverse(
      candidate
    )

  const relevantStateRoles =
    getRelevantStateRoles({
      evaluation,
      matchup,
      moveLookup,
      combatData,
    })

  if (
    relevantStateRoles
      .length ===
    0
  ) {
    return {
      success:
        true,

      relevant:
        false,

      reason:
        'NO_RELEVANT_ROLE',

      matchupId:
        matchup.id ??
        null,

      matchupLabel:
        matchup.label ??
        null,

      defenderTypes:
        getDefenderTypes(
          matchup
        ),

      universe,

      stateLoadouts,

      roles: [],

      evaluation,
    }
  }

  const overallTheoreticalLeader =
    hasProductionSource
      ? getReferenceOverallLeader({
          strengthBenchmark,
          universe,
        })
      : getOverallTheoreticalLeader({
          theoreticalResult,
          universe,
        })

  const roleResults =
    relevantStateRoles
      .map(
        (
          stateRole
        ) =>
          evaluateRoleStrength({
            stateRole,
            theoreticalResult,
            strengthBenchmark,
            universe,
            moveLookup,
            overallTheoreticalLeader,
          })
      )
      .filter(
        Boolean
      )
      .sort(
        (
          a,
          b
        ) => {
          const strengthDifference =
            b.strengthRatio -
            a.strengthRatio

          if (
            strengthDifference !==
            0
          ) {
            return (
              strengthDifference
            )
          }

          return (
            (
              b.overallStrengthRatio ??
              0
            ) -
            (
              a.overallStrengthRatio ??
              0
            )
          )
        }
      )

  if (
    roleResults.length ===
      0
  ) {
    return {
      success:
        false,

      relevant:
        true,

      reason:
        hasProductionSource
          ? RAID_STRENGTH_STATUS
              .INVALID_STRENGTH_REFERENCE
          : RAID_STRENGTH_STATUS
              .INVALID_THEORETICAL_RANKINGS,

      matchupId:
        matchup.id ??
        null,

      matchupLabel:
        matchup.label ??
        null,

      universe,

      stateLoadouts,

      evaluation,
    }
  }

  const bestRole =
    roleResults[
      0
    ]

  return {
    success:
      true,

    relevant:
      true,

    matchupId:
      matchup.id ??
      null,

    matchupLabel:
      matchup.label ??
      null,

    defenderTypes:
      getDefenderTypes(
        matchup
      ),

    universe,

    stateLoadouts,

    roles:
      roleResults,

    roleCount:
      roleResults.length,

    roleType:
      bestRole
        .roleType,

    effectiveness:
      bestRole
        .effectiveness,

    stateDps:
      bestRole
        .stateDps,

    theoreticalBestDps:
      bestRole
        .theoreticalBestDps,

    rawStrengthRatio:
      bestRole
        .rawStrengthRatio,

    strengthRatio:
      bestRole
        .strengthRatio,

    strengthScore:
      bestRole
        .strengthScore,

    classification:
      bestRole
        .classification,

    theoreticalLeader:
      bestRole
        .theoreticalLeader,

    theoreticalLeaderMoveset:
      bestRole
        .theoreticalLeaderMoveset,

    overallStrengthRatio:
      bestRole
        .overallStrengthRatio,

    overallStrengthScore:
      bestRole
        .overallStrengthScore,

    overallTheoreticalLeader,

    evaluation,
  }
}

// --------------------------------------------------
// Role summaries
// --------------------------------------------------

function buildRoleSummaries(
  relevantMatchups
) {
  const roleMap =
    new Map()

  for (
    const matchup
    of relevantMatchups
  ) {
    for (
      const role
      of matchup.roles ??
      []
    ) {
      if (
        !roleMap.has(
          role
            .roleType
        )
      ) {
        roleMap.set(
          role
            .roleType,
          []
        )
      }

      roleMap
        .get(
          role
            .roleType
        )
        .push({
          ...role,

          matchupId:
            matchup
              .matchupId,

          matchupLabel:
            matchup
              .matchupLabel,

          defenderTypes:
            matchup
              .defenderTypes,
        })
    }
  }

  return (
    [
      ...roleMap
        .entries(),
    ]
      .map(
        ([
          roleType,
          results,
        ]) => {
          const sorted =
            [
              ...results,
            ].sort(
              (
                a,
                b
              ) => {
                const strengthDifference =
                  b.strengthRatio -
                  a.strengthRatio

                if (
                  strengthDifference !==
                  0
                ) {
                  return (
                    strengthDifference
                  )
                }

                return (
                  (
                    b.overallStrengthRatio ??
                    0
                  ) -
                  (
                    a.overallStrengthRatio ??
                    0
                  )
                )
              }
            )

          const best =
            sorted[
              0
            ] ??
            null

          const ratios =
            results.map(
              (
                result
              ) =>
                result
                  .strengthRatio
            )

          const scores =
            results.map(
              (
                result
              ) =>
                result
                  .strengthScore
            )

          const overallRatios =
            results
              .map(
                (
                  result
                ) =>
                  result
                    .overallStrengthRatio
              )
              .filter(
                Number.isFinite
              )

          const elite =
            results.filter(
              (
                result
              ) =>
                result
                  .strengthRatio >=
                RAID_STRENGTH_THRESHOLDS
                  .eliteRatio
            )

          const strong =
            results.filter(
              (
                result
              ) =>
                result
                  .strengthRatio >=
                RAID_STRENGTH_THRESHOLDS
                  .strongRatio
            )

          const competitive =
            results.filter(
              (
                result
              ) =>
                result
                  .strengthRatio >=
                RAID_STRENGTH_THRESHOLDS
                  .competitiveRatio
            )

          return {
            roleType,

            relevantMatchupCount:
              results.length,

            bestStrengthRatio:
              best
                ?.strengthRatio ??
              null,

            bestStrengthScore:
              best
                ?.strengthScore ??
              null,

            bestClassification:
              best
                ?.classification ??
              null,

            bestMatchupId:
              best
                ?.matchupId ??
              null,

            bestMatchupLabel:
              best
                ?.matchupLabel ??
              null,

            bestEffectiveness:
              best
                ?.effectiveness ??
              null,

            representedBy:
              best
                ?.representedBy ??
              null,

            medianStrengthRatio:
              round(
                median(
                  ratios
                ),
                6
              ),

            medianStrengthScore:
              round(
                median(
                  scores
                ),
                2
              ),

            averageStrengthRatio:
              round(
                average(
                  ratios
                ),
                6
              ),

            averageStrengthScore:
              round(
                average(
                  scores
                ),
                2
              ),

            bestOverallStrengthRatio:
              overallRatios.length >
                0
                ? round(
                    Math.max(
                      ...overallRatios
                    ),
                    6
                  )
                : null,

            bestOverallStrengthScore:
              overallRatios.length >
                0
                ? round(
                    Math.max(
                      ...overallRatios
                    ) *
                      100,
                    2
                  )
                : null,

            eliteMatchupCount:
              elite.length,

            strongMatchupCount:
              strong.length,

            competitiveMatchupCount:
              competitive.length,

            matchups:
              results,
          }
        }
      )
      .sort(
        (
          a,
          b
        ) => {
          const strengthDifference =
            (
              b.bestStrengthRatio ??
              0
            ) -
            (
              a.bestStrengthRatio ??
              0
            )

          if (
            strengthDifference !==
            0
          ) {
            return (
              strengthDifference
            )
          }

          const relevanceDifference =
            (
              b.bestOverallStrengthRatio ??
              0
            ) -
            (
              a.bestOverallStrengthRatio ??
              0
            )

          if (
            relevanceDifference !==
            0
          ) {
            return (
              relevanceDifference
            )
          }

          return (
            b.relevantMatchupCount -
            a.relevantMatchupCount
          )
        }
      )
  )
}

// --------------------------------------------------
// Full-state Raid Strength
// --------------------------------------------------

export function evaluateRaidStrength({
  state,
  matchups,
  theoreticalRankings = null,
  strengthReference = null,
  moves,
  combatData,
}) {
  const candidate =
    resolveStateCandidate(
      state
    )

  if (!candidate) {
    return {
      status:
        RAID_STRENGTH_STATUS
          .INVALID_STATE,

      matchups: [],
    }
  }

  if (
    !Array.isArray(
      matchups
    ) ||
    matchups.length ===
      0
  ) {
    return {
      status:
        RAID_STRENGTH_STATUS
          .INVALID_MATCHUPS,

      matchups: [],
    }
  }

  const hasDiagnosticSource =
    Array.isArray(
      theoreticalRankings
    ) &&
    theoreticalRankings.length >
      0

  const hasProductionSource =
    Boolean(
      strengthReference
        ?.benchmarks
    )

  if (
    !hasDiagnosticSource &&
    !hasProductionSource
  ) {
    return {
      status:
        RAID_STRENGTH_STATUS
          .INVALID_STRENGTH_REFERENCE,

      matchups: [],
    }
  }

  if (
    !Array.isArray(
      moves
    ) ||
    moves.length ===
      0
  ) {
    return {
      status:
        RAID_STRENGTH_STATUS
          .INVALID_MOVES,

      matchups: [],
    }
  }

  if (
    !combatData
      ?.typeEffectiveness
  ) {
    return {
      status:
        RAID_STRENGTH_STATUS
          .INVALID_COMBAT_DATA,

      matchups: [],
    }
  }

  const stateLoadouts =
    getStateLoadouts({
      state,
      candidate,
    })

  if (
    stateLoadouts.length ===
      0
  ) {
    return {
      status:
        RAID_STRENGTH_STATUS
          .NO_STATE_LOADOUTS,

      stateLoadouts: [],

      matchups: [],
    }
  }

  const matchupResults =
    matchups.map(
      (
        matchup,
        index
      ) => {
        const matchupId =
          getMatchupId(
            matchup,
            index
          )

        const theoreticalResult =
          hasDiagnosticSource
            ? findTheoreticalResult({
                theoreticalRankings,
                matchupId,
                index,
              })
            : null

        const strengthBenchmark =
          hasProductionSource
            ? getStrengthReferenceBenchmark({
                strengthReference,
                matchupId,
              })
            : null

        return (
          evaluateRaidStrengthMatchup({
            state,
            matchup,
            theoreticalResult,
            strengthBenchmark,
            moves,
            combatData,
          })
        )
      }
    )

  const successful =
    matchupResults.filter(
      (
        result
      ) =>
        result.success ===
        true
    )

  const relevant =
    successful.filter(
      (
        result
      ) =>
        result.relevant ===
        true
    )

  const failures =
    matchupResults.filter(
      (
        result
      ) =>
        result.success !==
        true
    )

  if (
    successful.length ===
      0
  ) {
    const noEvaluatedLoadouts =
      failures.some(
        (
          result
        ) =>
          result.reason ===
          RAID_STRENGTH_STATUS
            .NO_EVALUATED_STATE_LOADOUTS
      )

    return {
      status:
        noEvaluatedLoadouts
          ? RAID_STRENGTH_STATUS
              .NO_EVALUATED_STATE_LOADOUTS
          : RAID_STRENGTH_STATUS
              .NO_COMPARABLE_MATCHUPS,

      stateLoadouts,

      matchups:
        matchupResults,

      comparableMatchupCount:
        0,

      relevantMatchupCount:
        0,

      totalMatchupCount:
        matchups.length,
    }
  }

  if (
    relevant.length ===
      0
  ) {
    return {
      status:
        RAID_STRENGTH_STATUS
          .NO_RELEVANT_MATCHUPS,

      referenceSource:
        hasProductionSource
          ? 'COMPACT_REFERENCE'
          : 'THEORETICAL_RANKINGS',

      universe:
        getCandidateUniverse(
          candidate
        ),

      stateLoadouts,

      matchups:
        matchupResults,

      successfulMatchups:
        successful,

      relevantMatchups: [],

      failedMatchups:
        failures,

      comparableMatchupCount:
        successful.length,

      relevantMatchupCount:
        0,

      totalMatchupCount:
        matchups.length,

      coverageRate:
        0,

      roleCount:
        0,

      roleSummaries: [],

      bestRole:
        null,
    }
  }

  const sortedByStrength =
    [
      ...relevant,
    ].sort(
      (
        a,
        b
      ) => {
        const strengthDifference =
          b.strengthRatio -
          a.strengthRatio

        if (
          strengthDifference !==
          0
        ) {
          return (
            strengthDifference
          )
        }

        const overallDifference =
          (
            b.overallStrengthRatio ??
            0
          ) -
          (
            a.overallStrengthRatio ??
            0
          )

        if (
          overallDifference !==
          0
        ) {
          return (
            overallDifference
          )
        }

        return (
          (
            b.effectiveness ??
            0
          ) -
          (
            a.effectiveness ??
            0
          )
        )
      }
    )

  const bestMatchup =
    sortedByStrength[
      0
    ] ??
    null

  const ratios =
    relevant.map(
      (
        result
      ) =>
        result
          .strengthRatio
    )

  const scores =
    relevant.map(
      (
        result
      ) =>
        result
          .strengthScore
    )

  const overallRatios =
    relevant
      .map(
        (
          result
        ) =>
          result
            .overallStrengthRatio
      )
      .filter(
        Number.isFinite
      )

  const overallScores =
    relevant
      .map(
        (
          result
        ) =>
          result
            .overallStrengthScore
      )
      .filter(
        Number.isFinite
      )

  const eliteMatchups =
    relevant.filter(
      (
        result
      ) =>
        result.strengthRatio >=
        RAID_STRENGTH_THRESHOLDS
          .eliteRatio
    )

  const strongMatchups =
    relevant.filter(
      (
        result
      ) =>
        result.strengthRatio >=
        RAID_STRENGTH_THRESHOLDS
          .strongRatio
    )

  const competitiveMatchups =
    relevant.filter(
      (
        result
      ) =>
        result.strengthRatio >=
        RAID_STRENGTH_THRESHOLDS
          .competitiveRatio
    )

  const roleSummaries =
    buildRoleSummaries(
      relevant
    )

  const bestRole =
    roleSummaries[
      0
    ] ??
    null

  return {
    status:
      RAID_STRENGTH_STATUS
        .SUCCESS,

    referenceSource:
      hasProductionSource
        ? 'COMPACT_REFERENCE'
        : 'THEORETICAL_RANKINGS',

    universe:
      getCandidateUniverse(
        candidate
      ),

    stateLoadouts,

    matchups:
      matchupResults,

    successfulMatchups:
      successful,

    relevantMatchups:
      relevant,

    failedMatchups:
      failures,

    comparableMatchupCount:
      successful.length,

    relevantMatchupCount:
      relevant.length,

    totalMatchupCount:
      matchups.length,

    coverageRate:
      round(
        relevant.length /
          matchups.length,
        4
      ),

    // ----------------------------------------------
    // Primary evidence
    // ----------------------------------------------

    bestStrengthRatio:
      bestMatchup
        ?.strengthRatio ??
      null,

    bestStrengthScore:
      bestMatchup
        ?.strengthScore ??
      null,

    bestClassification:
      bestMatchup
        ?.classification ??
      null,

    bestMatchupId:
      bestMatchup
        ?.matchupId ??
      null,

    bestMatchupLabel:
      bestMatchup
        ?.matchupLabel ??
      null,

    bestRoleType:
      bestMatchup
        ?.roleType ??
      null,

    bestEffectiveness:
      bestMatchup
        ?.effectiveness ??
      null,

    // ----------------------------------------------
    // Type-role evidence
    // ----------------------------------------------

    roleCount:
      roleSummaries.length,

    roleSummaries,

    bestRole,

    // ----------------------------------------------
    // Relevant-matchup strength
    // ----------------------------------------------

    medianStrengthRatio:
      round(
        median(
          ratios
        ),
        6
      ),

    medianStrengthScore:
      round(
        median(
          scores
        ),
        2
      ),

    averageStrengthRatio:
      round(
        average(
          ratios
        ),
        6
      ),

    averageStrengthScore:
      round(
        average(
          scores
        ),
        2
      ),

    // ----------------------------------------------
    // Overall benchmark evidence
    // ----------------------------------------------

    bestOverallStrengthRatio:
      overallRatios.length >
        0
        ? round(
            Math.max(
              ...overallRatios
            ),
            6
          )
        : null,

    bestOverallStrengthScore:
      overallScores.length >
        0
        ? round(
            Math.max(
              ...overallScores
            ),
            2
          )
        : null,

    medianOverallStrengthRatio:
      round(
        median(
          overallRatios
        ),
        6
      ),

    medianOverallStrengthScore:
      round(
        median(
          overallScores
        ),
        2
      ),

    averageOverallStrengthRatio:
      round(
        average(
          overallRatios
        ),
        6
      ),

    averageOverallStrengthScore:
      round(
        average(
          overallScores
        ),
        2
      ),

    // ----------------------------------------------
    // Relevant breadth
    // ----------------------------------------------

    eliteMatchupCount:
      eliteMatchups.length,

    strongMatchupCount:
      strongMatchups.length,

    competitiveMatchupCount:
      competitiveMatchups.length,

    eliteMatchupRate:
      round(
        eliteMatchups.length /
          relevant.length,
        4
      ),

    strongMatchupRate:
      round(
        strongMatchups.length /
          relevant.length,
        4
      ),

    competitiveMatchupRate:
      round(
        competitiveMatchups.length /
          relevant.length,
        4
      ),
  }
}