import {
  calculateMovesetPerformance,
} from './performance.js'

import {
  isStaticRaidMovesetSupported,
  getUnsupportedRaidMoveReason,
} from './moveSemantics.js'

// --------------------------------------------------
// Move availability
// --------------------------------------------------

const MOVE_AVAILABILITY = {
  NORMAL: 'NORMAL',
  ELITE: 'ELITE',
  SPECIAL: 'SPECIAL',
  OWNED: 'OWNED',
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

function requirePokemon(
  pokemon
) {
  if (!pokemon) {
    throw new Error(
      'pokemon is required.'
    )
  }

  if (!pokemon.moves) {
    throw new Error(
      'pokemon.moves is required.'
    )
  }

  return pokemon
}

// --------------------------------------------------
// Basic normalization
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
// Move pool normalization
// --------------------------------------------------

function normalizeMovePool({
  normal = [],
  elite = [],
  special = [],
}) {
  requireArray(
    normal,
    'normal'
  )

  requireArray(
    elite,
    'elite'
  )

  requireArray(
    special,
    'special'
  )

  const moveMap =
    new Map()

  function addMoves(
    moveIds,
    availability
  ) {
    for (
      const id
      of moveIds
    ) {
      if (!id) {
        continue
      }

      const normalizedId =
        String(
          id
        )

      const existing =
        moveMap.get(
          normalizedId
        )

      /**
       * If the same move appears in multiple
       * acquisition categories, preserve the easiest
       * valid acquisition method.
       *
       * Priority:
       *
       * NORMAL
       *   ↓
       * ELITE
       *   ↓
       * SPECIAL
       */
      if (existing) {
        if (
          existing.availability ===
          MOVE_AVAILABILITY.NORMAL
        ) {
          continue
        }

        if (
          availability ===
          MOVE_AVAILABILITY.NORMAL
        ) {
          moveMap.set(
            normalizedId,
            {
              id:
                normalizedId,

              availability,
            }
          )

          continue
        }

        if (
          existing.availability ===
            MOVE_AVAILABILITY.ELITE &&
          availability ===
            MOVE_AVAILABILITY.SPECIAL
        ) {
          continue
        }
      }

      moveMap.set(
        normalizedId,
        {
          id:
            normalizedId,

          availability,
        }
      )
    }
  }

  addMoves(
    normal,
    MOVE_AVAILABILITY.NORMAL
  )

  addMoves(
    elite,
    MOVE_AVAILABILITY.ELITE
  )

  addMoves(
    special,
    MOVE_AVAILABILITY.SPECIAL
  )

  return [
    ...moveMap.values(),
  ]
}

// --------------------------------------------------
// Public move-pool helper
// --------------------------------------------------

export function getPokemonRaidMovePool(
  pokemon
) {
  requirePokemon(
    pokemon
  )

  const fast =
    normalizeMovePool({
      normal:
        pokemon
          .moves
          .fast
          ?.normal ??
        [],

      elite:
        pokemon
          .moves
          .fast
          ?.elite ??
        [],

      special:
        pokemon
          .moves
          .fast
          ?.special ??
        [],
    })

  const charged =
    normalizeMovePool({
      normal:
        pokemon
          .moves
          .charged
          ?.normal ??
        [],

      elite:
        pokemon
          .moves
          .charged
          ?.elite ??
        [],

      special:
        pokemon
          .moves
          .charged
          ?.special ??
        [],
    })

  return {
    fast,
    charged,
  }
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
// Moveset generation
// --------------------------------------------------

export function generateRaidMovesets(
  pokemon
) {
  const movePool =
    getPokemonRaidMovePool(
      pokemon
    )

  const combinations = []

  for (
    const fast
    of movePool.fast
  ) {
    for (
      const charged
      of movePool.charged
    ) {
      combinations.push({
        fastMoveId:
          String(
            fast.id
          ),

        fastAvailability:
          fast.availability,

        chargedMoveId:
          String(
            charged.id
          ),

        chargedAvailability:
          charged.availability,
      })
    }
  }

  return combinations
}

// --------------------------------------------------
// Exact owned-loadout normalization
// --------------------------------------------------

function getMoveAvailabilityFromPool({
  movePool,
  moveType,
  moveId,
}) {
  const pool =
    moveType ===
      'FAST'
      ? movePool.fast
      : movePool.charged

  const match =
    pool.find(
      (entry) =>
        String(
          entry.id
        ) ===
        String(
          moveId
        )
    )

  return (
    match
      ?.availability ??
    null
  )
}

function normalizeExactRaidLoadouts({
  pokemon,
  loadouts,
}) {
  requirePokemon(
    pokemon
  )

  requireArray(
    loadouts,
    'loadouts'
  )

  const movePool =
    getPokemonRaidMovePool(
      pokemon
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

    const fastAvailability =
      loadout
        ?.fastAvailability ??
      getMoveAvailabilityFromPool({
        movePool,
        moveType:
          'FAST',
        moveId:
          fastMoveId,
      }) ??
      MOVE_AVAILABILITY.OWNED

    const chargedAvailability =
      loadout
        ?.chargedAvailability ??
      getMoveAvailabilityFromPool({
        movePool,
        moveType:
          'CHARGED',
        moveId:
          chargedMoveId,
      }) ??
      MOVE_AVAILABILITY.OWNED

    normalized.push({
      fastMoveId,

      fastAvailability,

      chargedMoveId,

      chargedAvailability,
    })
  }

  return normalized
}

// --------------------------------------------------
// Availability helpers
// --------------------------------------------------

function calculateMovesetAvailability({
  fastAvailability,
  chargedAvailability,
}) {
  if (
    fastAvailability ===
      MOVE_AVAILABILITY.OWNED ||
    chargedAvailability ===
      MOVE_AVAILABILITY.OWNED
  ) {
    return (
      MOVE_AVAILABILITY.OWNED
    )
  }

  if (
    fastAvailability ===
      MOVE_AVAILABILITY.SPECIAL ||
    chargedAvailability ===
      MOVE_AVAILABILITY.SPECIAL
  ) {
    return (
      MOVE_AVAILABILITY.SPECIAL
    )
  }

  if (
    fastAvailability ===
      MOVE_AVAILABILITY.ELITE ||
    chargedAvailability ===
      MOVE_AVAILABILITY.ELITE
  ) {
    return (
      MOVE_AVAILABILITY.ELITE
    )
  }

  return (
    MOVE_AVAILABILITY.NORMAL
  )
}

// --------------------------------------------------
// Static moveset support
// --------------------------------------------------

/**
 * Determines whether a generated Fast + Charged
 * combination can be evaluated by the current static
 * Raid Engine.
 *
 * Examples:
 *
 * Dragon Tail + Outrage
 * → supported
 *
 * Splash + Struggle
 * → supported through explicit exceptional semantics
 *
 * Transform + Struggle
 * → unsupported because Transform requires dynamic
 *   opponent-copying behavior.
 */
function inspectStaticMovesetSupport({
  fastMove,
  chargedMove,
}) {
  const supported =
    isStaticRaidMovesetSupported({
      fastMove,
      chargedMove,
    })

  if (supported) {
    return {
      supported:
        true,

      reason:
        null,

      moveId:
        null,
    }
  }

  const fastReason =
    getUnsupportedRaidMoveReason(
      fastMove
    )

  if (fastReason) {
    return {
      supported:
        false,

      reason:
        fastReason,

      moveId:
        fastMove.id,
    }
  }

  const chargedReason =
    getUnsupportedRaidMoveReason(
      chargedMove
    )

  return {
    supported:
      false,

    reason:
      chargedReason ??
      'Moveset requires unsupported raid mechanics.',

    moveId:
      chargedMove.id,
  }
}

// --------------------------------------------------
// Shared combination evaluator
// --------------------------------------------------

function evaluateRaidMovesetCombinations({
  pokemon,
  combinations,

  defender,

  moves,

  attackerCpMultiplier,
  defenderCpMultiplier,

  combatData,

  attackerModifiers = [],
}) {
  requirePokemon(
    pokemon
  )

  requireArray(
    combinations,
    'combinations'
  )

  if (!defender) {
    throw new Error(
      'defender is required.'
    )
  }

  const moveLookup =
    buildMoveLookup(
      moves
    )

  const results = []

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

    if (!fastMove) {
      throw new Error(
        `Fast Move not found: ${combination.fastMoveId}`
      )
    }

    if (!chargedMove) {
      throw new Error(
        `Charged Move not found: ${combination.chargedMoveId}`
      )
    }

    // ----------------------------------------------
    // Unsupported dynamic mechanics
    // ----------------------------------------------

    const support =
      inspectStaticMovesetSupport({
        fastMove,
        chargedMove,
      })

    /**
     * Unsupported dynamic movesets are intentionally
     * skipped rather than treated as malformed combat
     * data.
     *
     * Current example:
     *
     * Ditto
     * TRANSFORM_FAST + STRUGGLE
     *
     * Transform requires copying the opponent's
     * Pokémon state and therefore cannot be evaluated
     * by the static Raid Engine.
     */
    if (!support.supported) {
      continue
    }

    // ----------------------------------------------
    // Performance
    // ----------------------------------------------

    const performance =
      calculateMovesetPerformance({
        attacker:
          pokemon,

        defender,

        fastMove,

        chargedMove,

        attackerCpMultiplier,

        defenderCpMultiplier,

        combatData,

        attackerModifiers,
      })

    const availability =
      calculateMovesetAvailability({
        fastAvailability:
          combination.fastAvailability,

        chargedAvailability:
          combination.chargedAvailability,
      })

    results.push({
      fastMoveId:
        String(
          combination.fastMoveId
        ),

      chargedMoveId:
        String(
          combination.chargedMoveId
        ),

      fastAvailability:
        combination.fastAvailability,

      chargedAvailability:
        combination.chargedAvailability,

      availability,

      cycleDps:
        performance.cycleDps,

      performance,
    })
  }

  // ------------------------------------------------
  // Ranking
  // ------------------------------------------------

  results.sort(
    (a, b) =>
      b.cycleDps -
      a.cycleDps
  )

  return results.map(
    (
      result,
      index
    ) => ({
      rank:
        index + 1,

      ...result,
    })
  )
}

// --------------------------------------------------
// Moveset optimizer
//
// Theoretical/species-form path.
//
// Generates every legal move combination represented
// by the Pokémon reference move pool.
// --------------------------------------------------

export function optimizePokemonRaidMovesets({
  pokemon,
  defender,

  moves,

  attackerCpMultiplier,
  defenderCpMultiplier,

  combatData,

  attackerModifiers = [],
}) {
  requirePokemon(
    pokemon
  )

  const combinations =
    generateRaidMovesets(
      pokemon
    )

  return (
    evaluateRaidMovesetCombinations({
      pokemon,

      combinations,

      defender,

      moves,

      attackerCpMultiplier,
      defenderCpMultiplier,

      combatData,

      attackerModifiers,
    })
  )
}

// --------------------------------------------------
// Exact owned-loadout evaluator
//
// Exact-state path.
//
// Unlike optimizePokemonRaidMovesets(), this function
// does NOT generate combinations from the Pokémon's
// current reference movepool.
//
// It evaluates only the explicitly supplied Fast +
// Charged loadouts.
//
// This is required for legitimate owned states whose
// moves arise from mechanics outside the ordinary
// species/form move pool:
//
// - form/fusion signature moves
// - special state moves
// - Shadow-owned moves such as Frustration
// - future acquisition mechanics
//
// If a supplied move exists in the normal reference
// pool, its existing NORMAL / ELITE / SPECIAL
// availability is preserved.
//
// If the exact owned move is not represented in that
// pool, availability is marked OWNED.
// --------------------------------------------------

export function evaluatePokemonRaidLoadouts({
  pokemon,
  loadouts,

  defender,

  moves,

  attackerCpMultiplier,
  defenderCpMultiplier,

  combatData,

  attackerModifiers = [],
}) {
  requirePokemon(
    pokemon
  )

  const combinations =
    normalizeExactRaidLoadouts({
      pokemon,
      loadouts,
    })

  return (
    evaluateRaidMovesetCombinations({
      pokemon,

      combinations,

      defender,

      moves,

      attackerCpMultiplier,
      defenderCpMultiplier,

      combatData,

      attackerModifiers,
    })
  )
}

export {
  MOVE_AVAILABILITY,
}