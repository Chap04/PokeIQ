/**
 * PokeIQ Raid Engine
 * ------------------
 * Raid Boss Move Resolution V1
 *
 * Resolves the move combinations a raid boss can
 * actually use from its reference record.
 *
 * IMPORTANT:
 *
 * Raid-boss move availability is deliberately
 * separate from owned-Pokémon move availability.
 *
 * Owned Pokémon may legitimately possess:
 *
 * - Elite moves
 * - legacy moves
 * - Special moves
 * - form-change-derived moves
 * - Frustration
 * - Return
 *
 * Those moves must NOT automatically become possible
 * raid-boss moves.
 *
 * V1 therefore uses only the Pokémon reference's
 * NORMAL Fast and Charged Move pools.
 */

// --------------------------------------------------
// Validation
// --------------------------------------------------

function normalizeMoveIds(
  moveIds
) {
  if (
    !Array.isArray(
      moveIds
    )
  ) {
    return []
  }

  const seen =
    new Set()

  const result = []

  for (
    const moveId
    of moveIds
  ) {
    if (
      !moveId ||
      seen.has(
        moveId
      )
    ) {
      continue
    }

    seen.add(
      moveId
    )

    result.push(
      moveId
    )
  }

  return result
}

// --------------------------------------------------
// Boss move pools
// --------------------------------------------------

export function getRaidBossFastMoveIds(
  pokemon
) {
  return normalizeMoveIds(
    pokemon
      ?.moves
      ?.fast
      ?.normal
  )
}

export function getRaidBossChargedMoveIds(
  pokemon
) {
  return normalizeMoveIds(
    pokemon
      ?.moves
      ?.charged
      ?.normal
  )
}

// --------------------------------------------------
// Boss movesets
// --------------------------------------------------

/**
 * Produces every legal V1 raid-boss Fast/Charged
 * combination.
 *
 * Example:
 *
 * Fast:
 * - Psycho Cut
 * - Confusion
 *
 * Charged:
 * - Psychic
 * - Ice Beam
 *
 * produces:
 *
 * Psycho Cut / Psychic
 * Psycho Cut / Ice Beam
 * Confusion / Psychic
 * Confusion / Ice Beam
 */
export function buildRaidBossMoveSets(
  pokemon
) {
  const fastMoveIds =
    getRaidBossFastMoveIds(
      pokemon
    )

  const chargedMoveIds =
    getRaidBossChargedMoveIds(
      pokemon
    )

  const moveSets = []

  for (
    const fastMoveId
    of fastMoveIds
  ) {
    for (
      const chargedMoveId
      of chargedMoveIds
    ) {
      moveSets.push({
        fastMoveId,
        chargedMoveId,
      })
    }
  }

  return moveSets
}

// --------------------------------------------------
// Complete resolution
// --------------------------------------------------

export function resolveRaidBossMoves(
  pokemon
) {
  if (!pokemon) {
    return {
      status:
        'INVALID_POKEMON',

      fastMoveIds:
        [],

      chargedMoveIds:
        [],

      moveSets:
        [],
    }
  }

  const fastMoveIds =
    getRaidBossFastMoveIds(
      pokemon
    )

  const chargedMoveIds =
    getRaidBossChargedMoveIds(
      pokemon
    )

  if (
    fastMoveIds.length ===
    0
  ) {
    return {
      status:
        'FAST_MOVES_MISSING',

      fastMoveIds,

      chargedMoveIds,

      moveSets:
        [],
    }
  }

  if (
    chargedMoveIds.length ===
    0
  ) {
    return {
      status:
        'CHARGED_MOVES_MISSING',

      fastMoveIds,

      chargedMoveIds,

      moveSets:
        [],
    }
  }

  return {
    status:
      'READY',

    fastMoveIds,

    chargedMoveIds,

    moveSets:
      buildRaidBossMoveSets(
        pokemon
      ),
  }
}