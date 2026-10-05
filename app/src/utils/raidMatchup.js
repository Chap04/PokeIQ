import {
  calculateMovesetPerformance,
} from '../engine/Raid/performance.js'

import {
  isStaticRaidMovesetSupported,
  getUnsupportedRaidMoveReason,
} from '../engine/Raid/moveSemantics.js'

// --------------------------------------------------
// Status
// --------------------------------------------------

export const RAID_MATCHUP_STATUS = {
  SUCCESS:
    'SUCCESS',

  INVALID_CANDIDATE:
    'INVALID_CANDIDATE',

  INVALID_LOADOUT:
    'INVALID_LOADOUT',

  INVALID_DEFENDER:
    'INVALID_DEFENDER',

  MOVE_NOT_FOUND:
    'MOVE_NOT_FOUND',

  UNSUPPORTED_DYNAMIC_MECHANIC:
    'UNSUPPORTED_DYNAMIC_MECHANIC',

  ERROR:
    'ERROR',
}

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function buildMoveLookup(
  moves
) {
  if (!Array.isArray(moves)) {
    throw new Error(
      'moves must be an array.'
    )
  }

  return new Map(
    moves.map(
      (move) => [
        String(move.id),
        move,
      ]
    )
  )
}

function loadoutMatchesCandidate({
  candidate,
  loadout,
}) {
  if (
    !candidate ||
    !loadout
  ) {
    return false
  }

  return (
    candidate.loadouts ?? []
  ).some(
    (candidateLoadout) =>
      candidateLoadout.fastMoveId ===
        loadout.fastMoveId &&
      candidateLoadout.chargedMoveId ===
        loadout.chargedMoveId
  )
}

function buildOwnedAttacker(
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

function buildAttackerModifiers({
  candidate,
  combatData,
}) {
  const modifiers = []

  if (
    candidate
      ?.traits
      ?.shadow ===
    true
  ) {
    const shadowAttack =
      combatData
        ?.modifiers
        ?.shadowAttack

    if (
      !Number.isFinite(
        shadowAttack
      )
    ) {
      throw new Error(
        'combatData.modifiers.shadowAttack must be a finite number for Shadow attackers.'
      )
    }

    modifiers.push(
      shadowAttack
    )
  }

  return modifiers
}

// --------------------------------------------------
// Matchup evaluation
// --------------------------------------------------

export function evaluateOwnedRaidMatchup({
  candidate,
  loadout,
  defender,
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
        RAID_MATCHUP_STATUS
          .INVALID_CANDIDATE,
    }
  }

  if (
    !candidate.reference ||
    !candidate.ivs ||
    !Number.isFinite(
      candidate.cpm
    )
  ) {
    return {
      status:
        RAID_MATCHUP_STATUS
          .INVALID_CANDIDATE,
    }
  }

  if (
    !loadout ||
    !loadout.fastMoveId ||
    !loadout.chargedMoveId ||
    !loadoutMatchesCandidate({
      candidate,
      loadout,
    })
  ) {
    return {
      status:
        RAID_MATCHUP_STATUS
          .INVALID_LOADOUT,
    }
  }

  if (
    !defender ||
    !defender.stats ||
    !Array.isArray(
      defender.types
    ) ||
    !Number.isFinite(
      defender
        ?.raidBoss
        ?.cpMultiplier
    )
  ) {
    return {
      status:
        RAID_MATCHUP_STATUS
          .INVALID_DEFENDER,
    }
  }

  try {
    const moveLookup =
      buildMoveLookup(
        moves
      )

    const fastMove =
      moveLookup.get(
        String(
          loadout.fastMoveId
        )
      )

    const chargedMove =
      moveLookup.get(
        String(
          loadout.chargedMoveId
        )
      )

    if (
      !fastMove ||
      !chargedMove
    ) {
      return {
        status:
          RAID_MATCHUP_STATUS
            .MOVE_NOT_FOUND,

        fastMoveFound:
          Boolean(
            fastMove
          ),

        chargedMoveFound:
          Boolean(
            chargedMove
          ),
      }
    }

    if (
      !isStaticRaidMovesetSupported({
        fastMove,
        chargedMove,
      })
    ) {
      return {
        status:
          RAID_MATCHUP_STATUS
            .UNSUPPORTED_DYNAMIC_MECHANIC,

        unsupportedMechanics: [
          {
            moveId:
              fastMove.id,

            reason:
              getUnsupportedRaidMoveReason(
                fastMove
              ),
          },

          {
            moveId:
              chargedMove.id,

            reason:
              getUnsupportedRaidMoveReason(
                chargedMove
              ),
          },
        ].filter(
          (entry) =>
            entry.reason
        ),
      }
    }

    const attacker =
      buildOwnedAttacker(
        candidate
      )

    const attackerModifiers =
      buildAttackerModifiers({
        candidate,
        combatData,
      })

    const performance =
      calculateMovesetPerformance({
        attacker,

        defender,

        fastMove,
        chargedMove,

        attackerCpMultiplier:
          candidate.cpm,

        defenderCpMultiplier:
          defender
            .raidBoss
            .cpMultiplier,

        combatData,

        attackerModifiers,
      })

    return {
      status:
        RAID_MATCHUP_STATUS
          .SUCCESS,

      pokemonIdentity:
        candidate
          .pokemonIdentity,

      level:
        candidate.level,

      cpm:
        candidate.cpm,

      ivs: {
        ...candidate.ivs,
      },

      traits: {
        ...candidate.traits,
      },

      loadout: {
        fastMoveId:
          loadout.fastMoveId,

        chargedMoveId:
          loadout.chargedMoveId,
      },

      performance,
    }
  } catch (error) {
    return {
      status:
        RAID_MATCHUP_STATUS
          .ERROR,

      error: {
        name:
          error?.name ??
          'Error',

        message:
          error?.message ??
          String(error),
      },
    }
  }
}