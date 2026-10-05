/**
 * PokeIQ Raid Engine
 * ------------------
 * Raid Boss Offensive Pressure V1
 *
 * Evaluates how much sustained damage a raid boss's
 * legal current movesets deal to one owned attacker.
 *
 * This module:
 *
 * - resolves legal raid-boss movesets
 * - uses the same Pokémon GO damage engine as attacker
 *   matchup calculations
 * - applies boss Attack / raid CPM
 * - applies owned Pokémon Defense / IVs / CPM
 * - applies Shadow Defense when relevant
 * - applies STAB
 * - applies type effectiveness
 * - calculates boss Fast / Charged / Cycle DPS
 * - reports minimum, average, and maximum pressure
 *
 * It does NOT yet:
 *
 * - calculate attacker survival
 * - calculate TDO
 * - rank attackers
 * - model dodging
 * - simulate individual move events
 * - model boss energy gained from incoming damage
 */

import {
  calculateMovesetPerformance,
} from './performance.js'

import {
  resolveRaidBossMoves,
} from './bossMoves.js'

// --------------------------------------------------
// Status
// --------------------------------------------------

export const RAID_BOSS_PRESSURE_STATUS = {
  SUCCESS:
    'SUCCESS',

  INVALID_BOSS:
    'INVALID_BOSS',

  INVALID_DEFENDER:
    'INVALID_DEFENDER',

  BOSS_MOVES_NOT_READY:
    'BOSS_MOVES_NOT_READY',

  NO_SUPPORTED_MOVESETS:
    'NO_SUPPORTED_MOVESETS',
}

// --------------------------------------------------
// Validation helpers
// --------------------------------------------------

function hasValidStats(
  pokemon
) {
  return (
    Number.isFinite(
      pokemon
        ?.stats
        ?.attack
    ) &&
    Number.isFinite(
      pokemon
        ?.stats
        ?.defense
    ) &&
    Number.isFinite(
      pokemon
        ?.stats
        ?.stamina
    )
  )
}

function hasValidIvs(
  ivs
) {
  return (
    Number.isFinite(
      ivs?.attack
    ) &&
    Number.isFinite(
      ivs?.defense
    ) &&
    Number.isFinite(
      ivs?.stamina
    )
  )
}

function isReadyCandidate(
  candidate
) {
  return (
    candidate?.status ===
      'READY' &&
    candidate.reference &&
    hasValidStats(
      candidate.reference
    ) &&
    hasValidIvs(
      candidate.ivs
    ) &&
    Number.isFinite(
      candidate.cpm
    ) &&
    candidate.cpm > 0
  )
}

// --------------------------------------------------
// Move lookup
// --------------------------------------------------

function buildMoveLookup(
  moves
) {
  const lookup =
    new Map()

  for (
    const move
    of moves ?? []
  ) {
    if (!move?.id) {
      continue
    }

    lookup.set(
      move.id,
      move
    )
  }

  return lookup
}

// --------------------------------------------------
// Owned defender
// --------------------------------------------------

function buildOwnedDefender(
  candidate
) {
  return {
    ...candidate.reference,

    ivs: {
      attack:
        candidate.ivs.attack,

      defense:
        candidate.ivs.defense,

      stamina:
        candidate.ivs.stamina,
    },
  }
}

function buildDefenderModifiers({
  defenderCandidate,
  combatData,
}) {
  const modifiers = []

  if (
    defenderCandidate
      ?.traits
      ?.shadow ===
    true
  ) {
    const shadowDefense =
      combatData
        ?.modifiers
        ?.shadowDefense

    if (
      Number.isFinite(
        shadowDefense
      ) &&
      shadowDefense > 0
    ) {
      modifiers.push(
        shadowDefense
      )
    }
  }

  return modifiers
}

// --------------------------------------------------
// Individual moveset pressure
// --------------------------------------------------

function evaluateBossMoveSet({
  boss,
  defenderCandidate,
  moveSet,
  moveLookup,
  combatData,
}) {
  const fastMove =
    moveLookup.get(
      moveSet.fastMoveId
    )

  const chargedMove =
    moveLookup.get(
      moveSet.chargedMoveId
    )

  if (
    !fastMove ||
    !chargedMove
  ) {
    return {
      status:
        'MOVE_NOT_FOUND',

      fastMoveId:
        moveSet.fastMoveId,

      chargedMoveId:
        moveSet.chargedMoveId,
    }
  }

  const defender =
    buildOwnedDefender(
      defenderCandidate
    )

  const defenderModifiers =
    buildDefenderModifiers({
      defenderCandidate,
      combatData,
    })

  try {
    const performance =
      calculateMovesetPerformance({
        attacker:
          boss,

        defender,

        fastMove,

        chargedMove,

        attackerCpMultiplier:
          boss
            .raidBoss
            .cpMultiplier,

        defenderCpMultiplier:
          defenderCandidate.cpm,

        combatData,

        attackerModifiers:
          [],

        defenderModifiers,
      })

    if (
      !Number.isFinite(
        performance?.cycleDps
      )
    ) {
      return {
        status:
          'INVALID_PERFORMANCE',

        fastMoveId:
          moveSet.fastMoveId,

        chargedMoveId:
          moveSet.chargedMoveId,
      }
    }

    return {
      status:
        'SUCCESS',

      fastMoveId:
        moveSet.fastMoveId,

      chargedMoveId:
        moveSet.chargedMoveId,

      fastMove: {
        id:
          fastMove.id,

        type:
          fastMove.type,

        damage:
          performance
            .fastMove
            .damage,

        dps:
          performance
            .fastMove
            .dps,

        energyGain:
          performance
            .fastMove
            .energyGain,

        durationSeconds:
          performance
            .fastMove
            .durationSeconds,
      },

      chargedMove: {
        id:
          chargedMove.id,

        type:
          chargedMove.type,

        damage:
          performance
            .chargedMove
            .damage,

        dps:
          performance
            .chargedMove
            .dps,

        energyCost:
          performance
            .chargedMove
            .energyCost,

        durationSeconds:
          performance
            .chargedMove
            .durationSeconds,
      },

      defenderModifiers,

      cycleDps:
        performance
          .cycleDps,

      performance,
    }
  } catch (error) {
    return {
      status:
        'ERROR',

      fastMoveId:
        moveSet.fastMoveId,

      chargedMoveId:
        moveSet.chargedMoveId,

      error:
        error instanceof Error
          ? error.message
          : String(error),
    }
  }
}

// --------------------------------------------------
// Aggregation
// --------------------------------------------------

function calculateAverage(
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
        sum +
        value,
      0
    )

  return (
    total /
    values.length
  )
}

function sortByPressure(
  entries
) {
  return [
    ...entries,
  ].sort(
    (
      left,
      right
    ) =>
      left.cycleDps -
      right.cycleDps
  )
}

// --------------------------------------------------
// Public API
// --------------------------------------------------

export function evaluateRaidBossPressure({
  boss,
  defenderCandidate,
  moves,
  combatData,
}) {
  if (
    !boss ||
    !boss.raidBoss ||
    !Number.isFinite(
      boss
        ?.raidBoss
        ?.cpMultiplier
    )
  ) {
    return {
      status:
        RAID_BOSS_PRESSURE_STATUS
          .INVALID_BOSS,

      scenarios:
        [],
    }
  }

  if (
    !isReadyCandidate(
      defenderCandidate
    )
  ) {
    return {
      status:
        RAID_BOSS_PRESSURE_STATUS
          .INVALID_DEFENDER,

      scenarios:
        [],
    }
  }

  const moveResolution =
    resolveRaidBossMoves(
      boss
    )

  if (
    moveResolution.status !==
      'READY'
  ) {
    return {
      status:
        RAID_BOSS_PRESSURE_STATUS
          .BOSS_MOVES_NOT_READY,

      bossMoveStatus:
        moveResolution.status,

      scenarios:
        [],
    }
  }

  const moveLookup =
    buildMoveLookup(
      moves
    )

  const evaluated =
    moveResolution
      .moveSets
      .map(
        (moveSet) =>
          evaluateBossMoveSet({
            boss,

            defenderCandidate,

            moveSet,

            moveLookup,

            combatData,
          })
      )

  const successful =
    evaluated.filter(
      (entry) =>
        entry.status ===
        'SUCCESS'
    )

  const rejected =
    evaluated.filter(
      (entry) =>
        entry.status !==
        'SUCCESS'
    )

  if (
    successful.length ===
    0
  ) {
    return {
      status:
        RAID_BOSS_PRESSURE_STATUS
          .NO_SUPPORTED_MOVESETS,

      scenarios:
        [],

      rejected,
    }
  }

  const scenarios =
    sortByPressure(
      successful
    )

  const incomingDpsValues =
    scenarios.map(
      (scenario) =>
        scenario.cycleDps
    )

  const minimum =
    scenarios[0]

  const maximum =
    scenarios[
      scenarios.length - 1
    ]

  const averageCycleDps =
    calculateAverage(
      incomingDpsValues
    )

  return {
    status:
      RAID_BOSS_PRESSURE_STATUS
        .SUCCESS,

    scenarios,

    rejected,

    summary: {
      totalMoveSets:
        moveResolution
          .moveSets
          .length,

      analyzedMoveSets:
        scenarios.length,

      rejectedMoveSets:
        rejected.length,

      minimumCycleDps:
        minimum.cycleDps,

      averageCycleDps,

      maximumCycleDps:
        maximum.cycleDps,

      minimumPressureMoveSet: {
        fastMoveId:
          minimum.fastMoveId,

        chargedMoveId:
          minimum.chargedMoveId,
      },

      maximumPressureMoveSet: {
        fastMoveId:
          maximum.fastMoveId,

        chargedMoveId:
          maximum.chargedMoveId,
      },
    },
  }
}