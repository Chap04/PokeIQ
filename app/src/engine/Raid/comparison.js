import {
  evaluatePokemonRaidLoadouts,
  optimizePokemonRaidMovesets,
  generateRaidMovesets,
} from './optimizer.js'

import {
  isStaticRaidMovesetSupported,
  getUnsupportedRaidMoveReason,
} from './moveSemantics.js'

// --------------------------------------------------
// Evaluation status
// --------------------------------------------------

export const RAID_ATTACKER_EVALUATION_STATUS = {
  SUCCESS:
    'SUCCESS',

  UNSUPPORTED_DYNAMIC_MECHANIC:
    'UNSUPPORTED_DYNAMIC_MECHANIC',

  ERROR:
    'ERROR',
}

// --------------------------------------------------
// Validation
// --------------------------------------------------

function requireArray(
  value,
  label
) {
  if (!Array.isArray(value)) {
    throw new Error(
      `${label} must be an array.`
    )
  }

  return value
}

function requireCandidate(
  candidate,
  index
) {
  if (!candidate) {
    throw new Error(
      `candidate[${index}] is required.`
    )
  }

  if (!candidate.pokemon) {
    throw new Error(
      `candidate[${index}].pokemon is required.`
    )
  }

  if (
    !Number.isFinite(
      candidate.cpMultiplier
    )
  ) {
    throw new Error(
      `candidate[${index}].cpMultiplier must be a finite number.`
    )
  }

  return candidate
}

// --------------------------------------------------
// Move ID normalization
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

// --------------------------------------------------
// Move lookup
// --------------------------------------------------

function buildMoveLookup(
  moves
) {
  requireArray(
    moves,
    'moves'
  )

  return new Map(
    moves.map(
      (move) => [
        String(
          move.id
        ),
        move,
      ]
    )
  )
}

// --------------------------------------------------
// Exact loadout normalization
// --------------------------------------------------

function normalizeExactLoadouts(
  loadouts
) {
  requireArray(
    loadouts,
    'loadouts'
  )

  const seen =
    new Set()

  const normalized = []

  for (
    const loadout
    of loadouts
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
      continue
    }

    const key =
      `${fastMoveId}::${chargedMoveId}`

    if (
      seen.has(
        key
      )
    ) {
      continue
    }

    seen.add(
      key
    )

    normalized.push({
      ...loadout,

      fastMoveId,
      chargedMoveId,
    })
  }

  return normalized
}

// --------------------------------------------------
// Unsupported mechanic inspection
// --------------------------------------------------

function inspectUnsupportedCombinations({
  combinations,
  moves,
}) {
  requireArray(
    combinations,
    'combinations'
  )

  const moveLookup =
    buildMoveLookup(
      moves
    )

  const unsupported = []

  for (
    const combination
    of combinations
  ) {
    const fastMove =
      moveLookup.get(
        String(
          combination.fastMoveId
        )
      )

    const chargedMove =
      moveLookup.get(
        String(
          combination.chargedMoveId
        )
      )

    if (
      !fastMove ||
      !chargedMove
    ) {
      continue
    }

    const supported =
      isStaticRaidMovesetSupported({
        fastMove,
        chargedMove,
      })

    if (supported) {
      continue
    }

    const fastReason =
      getUnsupportedRaidMoveReason(
        fastMove
      )

    const chargedReason =
      getUnsupportedRaidMoveReason(
        chargedMove
      )

    if (fastReason) {
      unsupported.push({
        moveId:
          fastMove.id,

        moveType:
          'FAST',

        reason:
          fastReason,

        fastMoveId:
          combination.fastMoveId,

        chargedMoveId:
          combination.chargedMoveId,
      })

      continue
    }

    if (chargedReason) {
      unsupported.push({
        moveId:
          chargedMove.id,

        moveType:
          'CHARGED',

        reason:
          chargedReason,

        fastMoveId:
          combination.fastMoveId,

        chargedMoveId:
          combination.chargedMoveId,
      })
    }
  }

  return {
    totalCombinations:
      combinations.length,

    unsupported,
  }
}

function inspectUnsupportedMovesets({
  pokemon,
  moves,
}) {
  const combinations =
    generateRaidMovesets(
      pokemon
    )

  return (
    inspectUnsupportedCombinations({
      combinations,
      moves,
    })
  )
}

function inspectUnsupportedExactLoadouts({
  loadouts,
  moves,
}) {
  const combinations =
    normalizeExactLoadouts(
      loadouts
    )

  return (
    inspectUnsupportedCombinations({
      combinations,
      moves,
    })
  )
}

// --------------------------------------------------
// Unsupported result builder
// --------------------------------------------------

function buildUnsupportedEvaluation({
  candidate,
  supportInspection,
}) {
  const uniqueMechanics =
    new Map()

  for (
    const entry
    of supportInspection.unsupported
  ) {
    const key =
      `${entry.moveType}::${entry.moveId}`

    if (
      uniqueMechanics.has(
        key
      )
    ) {
      continue
    }

    uniqueMechanics.set(
      key,
      {
        moveId:
          entry.moveId,

        moveType:
          entry.moveType,

        reason:
          entry.reason,
      }
    )
  }

  return {
    status:
      RAID_ATTACKER_EVALUATION_STATUS
        .UNSUPPORTED_DYNAMIC_MECHANIC,

    id:
      candidate.id ??
      candidate.pokemon.id,

    label:
      candidate.label ??
      candidate.pokemon.id,

    pokemonId:
      candidate.pokemon.id,

    form:
      candidate.pokemon.form,

    cpMultiplier:
      candidate.cpMultiplier,

    attackerModifiers:
      candidate.attackerModifiers ??
      [],

    unsupportedMechanics:
      [
        ...uniqueMechanics.values(),
      ],

    generatedMovesets:
      supportInspection
        .totalCombinations,

    supportedMovesets:
      0,

    bestMoveset:
      null,

    bestNormalMoveset:
      null,

    movesetRankings:
      [],
  }
}

// --------------------------------------------------
// Error result builder
// --------------------------------------------------

function buildErrorEvaluation({
  candidate,
  name,
  message,
}) {
  return {
    status:
      RAID_ATTACKER_EVALUATION_STATUS
        .ERROR,

    id:
      candidate.id ??
      candidate.pokemon.id,

    label:
      candidate.label ??
      candidate.pokemon.id,

    pokemonId:
      candidate.pokemon.id,

    form:
      candidate.pokemon.form,

    error: {
      name,
      message,
    },
  }
}

// --------------------------------------------------
// Successful result builder
// --------------------------------------------------

function buildSuccessfulEvaluation({
  candidate,
  rankings,
}) {
  const best =
    rankings[0]

  const bestNormal =
    rankings.find(
      (result) =>
        result.availability ===
        'NORMAL'
    ) ?? null

  return {
    status:
      RAID_ATTACKER_EVALUATION_STATUS
        .SUCCESS,

    id:
      candidate.id ??
      candidate.pokemon.id,

    label:
      candidate.label ??
      candidate.pokemon.id,

    pokemonId:
      candidate.pokemon.id,

    form:
      candidate.pokemon.form,

    cpMultiplier:
      candidate.cpMultiplier,

    attackerModifiers:
      candidate.attackerModifiers ??
      [],

    bestMoveset: {
      fastMoveId:
        best.fastMoveId,

      chargedMoveId:
        best.chargedMoveId,

      availability:
        best.availability,

      cycleDps:
        best.cycleDps,
    },

    bestNormalMoveset:
      bestNormal
        ? {
            fastMoveId:
              bestNormal.fastMoveId,

            chargedMoveId:
              bestNormal.chargedMoveId,

            availability:
              bestNormal.availability,

            cycleDps:
              bestNormal.cycleDps,
          }
        : null,

    movesetRankings:
      rankings,
  }
}

// --------------------------------------------------
// Single attacker evaluation
// --------------------------------------------------

/**
 * Conventional theoretical evaluation helper.
 *
 * This preserves the existing contract:
 *
 * - generates movesets from the species/form reference
 *   move pool
 * - returns a successful ranking result
 * - throws if no static moveset can be evaluated
 *
 * Use evaluateRaidAttackerDetailed() when the caller
 * needs structured unsupported/error classification.
 */
export function evaluateRaidAttacker({
  candidate,
  defender,
  defenderCpMultiplier,
  moves,
  combatData,
}) {
  if (!candidate) {
    throw new Error(
      'candidate is required.'
    )
  }

  if (!defender) {
    throw new Error(
      'defender is required.'
    )
  }

  const rankings =
    optimizePokemonRaidMovesets({
      pokemon:
        candidate.pokemon,

      defender,

      moves,

      attackerCpMultiplier:
        candidate.cpMultiplier,

      defenderCpMultiplier,

      combatData,

      attackerModifiers:
        candidate.attackerModifiers ??
        [],
    })

  if (!rankings.length) {
    throw new Error(
      `No static raid movesets generated for ${candidate.label ?? candidate.pokemon.id}.`
    )
  }

  return buildSuccessfulEvaluation({
    candidate,
    rankings,
  })
}

// --------------------------------------------------
// Detailed theoretical attacker evaluation
// --------------------------------------------------

/**
 * Evaluates one theoretical species/form attacker
 * without conflating known unsupported mechanics
 * with unexpected errors.
 *
 * Possible statuses:
 *
 * SUCCESS
 *
 * UNSUPPORTED_DYNAMIC_MECHANIC
 * Example: Ditto / Transform
 *
 * ERROR
 * Unexpected data or engine failure
 */
export function evaluateRaidAttackerDetailed({
  candidate,
  defender,
  defenderCpMultiplier,
  moves,
  combatData,
}) {
  if (!candidate) {
    throw new Error(
      'candidate is required.'
    )
  }

  if (!defender) {
    throw new Error(
      'defender is required.'
    )
  }

  try {
    const rankings =
      optimizePokemonRaidMovesets({
        pokemon:
          candidate.pokemon,

        defender,

        moves,

        attackerCpMultiplier:
          candidate.cpMultiplier,

        defenderCpMultiplier,

        combatData,

        attackerModifiers:
          candidate.attackerModifiers ??
          [],
      })

    if (rankings.length) {
      return buildSuccessfulEvaluation({
        candidate,
        rankings,
      })
    }

    const supportInspection =
      inspectUnsupportedMovesets({
        pokemon:
          candidate.pokemon,

        moves,
      })

    if (
      supportInspection
        .unsupported
        .length >
      0
    ) {
      return (
        buildUnsupportedEvaluation({
          candidate,
          supportInspection,
        })
      )
    }

    return (
      buildErrorEvaluation({
        candidate,

        name:
          'NoRaidMovesetsError',

        message:
          `No raid movesets could be evaluated for ${candidate.label ?? candidate.pokemon.id}.`,
      })
    )
  } catch (error) {
    return (
      buildErrorEvaluation({
        candidate,

        name:
          error?.name ??
          'Error',

        message:
          error?.message ??
          String(
            error
          ),
      })
    )
  }
}

// --------------------------------------------------
// Detailed exact-state attacker evaluation
// --------------------------------------------------

/**
 * Evaluates explicitly supplied owned Fast + Charged
 * loadouts.
 *
 * Unlike evaluateRaidAttackerDetailed(), this does
 * not require the supplied moves to appear in the
 * species/form theoretical move pool.
 *
 * This is the correct path for evaluating the exact
 * current state of an owned Pokémon.
 *
 * Examples include:
 *
 * - Behemoth Blade
 * - Secret Sword
 * - Ice Burn
 * - Freeze Shock
 * - Roar of Time
 * - Frustration
 *
 * Known unsupported dynamic mechanics still receive
 * structured UNSUPPORTED_DYNAMIC_MECHANIC results.
 */
export function evaluateRaidAttackerLoadoutsDetailed({
  candidate,
  loadouts,
  defender,
  defenderCpMultiplier,
  moves,
  combatData,
}) {
  if (!candidate) {
    throw new Error(
      'candidate is required.'
    )
  }

  if (!defender) {
    throw new Error(
      'defender is required.'
    )
  }

  requireArray(
    loadouts,
    'loadouts'
  )

  try {
    const normalizedLoadouts =
      normalizeExactLoadouts(
        loadouts
      )

    if (
      normalizedLoadouts.length ===
      0
    ) {
      return (
        buildErrorEvaluation({
          candidate,

          name:
            'NoRaidLoadoutsError',

          message:
            `No exact raid loadouts were supplied for ${candidate.label ?? candidate.pokemon.id}.`,
        })
      )
    }

    const rankings =
      evaluatePokemonRaidLoadouts({
        pokemon:
          candidate.pokemon,

        loadouts:
          normalizedLoadouts,

        defender,

        moves,

        attackerCpMultiplier:
          candidate.cpMultiplier,

        defenderCpMultiplier,

        combatData,

        attackerModifiers:
          candidate.attackerModifiers ??
          [],
      })

    if (rankings.length) {
      return buildSuccessfulEvaluation({
        candidate,
        rankings,
      })
    }

    const supportInspection =
      inspectUnsupportedExactLoadouts({
        loadouts:
          normalizedLoadouts,

        moves,
      })

    if (
      supportInspection
        .unsupported
        .length >
      0
    ) {
      return (
        buildUnsupportedEvaluation({
          candidate,
          supportInspection,
        })
      )
    }

    return (
      buildErrorEvaluation({
        candidate,

        name:
          'NoRaidLoadoutsError',

        message:
          `No supplied raid loadouts could be evaluated for ${candidate.label ?? candidate.pokemon.id}.`,
      })
    )
  } catch (error) {
    return (
      buildErrorEvaluation({
        candidate,

        name:
          error?.name ??
          'Error',

        message:
          error?.message ??
          String(
            error
          ),
      })
    )
  }
}

// --------------------------------------------------
// Detailed multi-attacker comparison
// --------------------------------------------------

/**
 * Full theoretical comparison pipeline.
 *
 * Returns:
 *
 * rankings
 *   Successful statically evaluated attackers.
 *
 * unsupported
 *   Legitimate Pokémon whose mechanics are outside
 *   the current static Raid Engine.
 *
 * errors
 *   Unexpected failures that require investigation.
 */
export function compareRaidAttackersDetailed({
  candidates,
  defender,
  defenderCpMultiplier,
  moves,
  combatData,
}) {
  requireArray(
    candidates,
    'candidates'
  )

  if (!candidates.length) {
    throw new Error(
      'At least one attacker candidate is required.'
    )
  }

  if (!defender) {
    throw new Error(
      'defender is required.'
    )
  }

  if (
    !Number.isFinite(
      defenderCpMultiplier
    )
  ) {
    throw new Error(
      'defenderCpMultiplier must be a finite number.'
    )
  }

  const successful = []
  const unsupported = []
  const errors = []

  for (
    let index = 0;
    index < candidates.length;
    index += 1
  ) {
    const candidate =
      requireCandidate(
        candidates[index],
        index
      )

    const result =
      evaluateRaidAttackerDetailed({
        candidate,

        defender,

        defenderCpMultiplier,

        moves,

        combatData,
      })

    if (
      result.status ===
      RAID_ATTACKER_EVALUATION_STATUS
        .SUCCESS
    ) {
      successful.push(
        result
      )

      continue
    }

    if (
      result.status ===
      RAID_ATTACKER_EVALUATION_STATUS
        .UNSUPPORTED_DYNAMIC_MECHANIC
    ) {
      unsupported.push(
        result
      )

      continue
    }

    errors.push(
      result
    )
  }

  successful.sort(
    (a, b) =>
      b.bestMoveset.cycleDps -
      a.bestMoveset.cycleDps
  )

  const rankings =
    successful.map(
      (
        result,
        index
      ) => ({
        rank:
          index + 1,

        ...result,
      })
    )

  return {
    totalCandidates:
      candidates.length,

    successfulEvaluations:
      rankings.length,

    unsupportedEvaluations:
      unsupported.length,

    errorEvaluations:
      errors.length,

    rankings,

    unsupported,

    errors,
  }
}

// --------------------------------------------------
// Backward-compatible multi-attacker comparison
// --------------------------------------------------

/**
 * Existing simple comparison API.
 *
 * Known unsupported dynamic mechanics are omitted
 * from static rankings.
 *
 * Unexpected evaluation errors still cause the
 * comparison to fail loudly.
 */
export function compareRaidAttackers({
  candidates,
  defender,
  defenderCpMultiplier,
  moves,
  combatData,
}) {
  const result =
    compareRaidAttackersDetailed({
      candidates,

      defender,

      defenderCpMultiplier,

      moves,

      combatData,
    })

  if (
    result.errors.length >
    0
  ) {
    const firstError =
      result.errors[0]

    throw new Error(
      `Raid attacker comparison encountered ${result.errors.length} unexpected evaluation error(s). ` +
      `First error: ${firstError.label} — ${firstError.error?.message ?? 'Unknown error'}`
    )
  }

  return result.rankings
}