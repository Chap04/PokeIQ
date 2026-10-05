import {
  getChargedMoveOptions,
  getFastMoveOptions,
  getPokemonIdentity,
} from './pokemonReference.js'

import {
  getPokemonCombatState,
} from './pokemonCombatState.js'

import {
  calculatePokemonStats,
} from './pokemonLevel.js'

function getAllowedMoveIds(
  moveOptions
) {
  return new Set(
    moveOptions.map(
      (option) => option.id
    )
  )
}

function validateFastMove(
  reference,
  fastMoveId
) {
  if (!fastMoveId) {
    return {
      valid: false,
      reason: 'FAST_MOVE_MISSING',
    }
  }

  const allowedFastMoves =
    getAllowedMoveIds(
      getFastMoveOptions(reference)
    )

  if (
    !allowedFastMoves.has(
      fastMoveId
    )
  ) {
    return {
      valid: false,
      reason: 'FAST_MOVE_INVALID',
    }
  }

  return {
    valid: true,
    reason: null,
  }
}

function validateChargedMoves(
  reference,
  chargedMoveIds,
  traits
) {
  const allowedChargedMoves =
    getAllowedMoveIds(
      getChargedMoveOptions(
        reference,
        {
          shadow:
            traits?.shadow ===
            true,

          purified:
            traits?.purified ===
            true,
        }
      )
    )

  const validMoves = []
  const invalidMoves = []

  chargedMoveIds.forEach(
    (moveId) => {
      if (
        allowedChargedMoves.has(
          moveId
        )
      ) {
        validMoves.push(
          moveId
        )
      } else {
        invalidMoves.push(
          moveId
        )
      }
    }
  )

  return {
    validMoves,
    invalidMoves,
  }
}

function buildLoadouts({
  fastMoveId,
  chargedMoveIds,
}) {
  return chargedMoveIds.map(
    (chargedMoveId) => ({
      fastMoveId,
      chargedMoveId,
    })
  )
}

function hasValidReferenceStats(
  reference
) {
  return (
    Number.isFinite(
      reference
        ?.stats
        ?.attack
    ) &&
    Number.isFinite(
      reference
        ?.stats
        ?.defense
    ) &&
    Number.isFinite(
      reference
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

function buildEmptyMoves() {
  return {
    fast:
      null,

    charged:
      [],

    chargedSlots: {
      slot1:
        null,

      slot2:
        null,
    },
  }
}

// --------------------------------------------------
// Standard owned Raid Candidate
// --------------------------------------------------

export function buildRaidCandidate(
  ownedPokemon
) {
  const combatState =
    getPokemonCombatState(
      ownedPokemon
    )

  if (!combatState) {
    return {
      status:
        'INVALID_INPUT',

      combatState:
        null,

      loadouts:
        [],
    }
  }

  if (
    combatState.status !==
    'READY'
  ) {
    return {
      status:
        'COMBAT_STATE_NOT_READY',

      combatState,

      combatStateStatus:
        combatState.status,

      loadouts:
        [],
    }
  }

  const reference =
    combatState.reference

  const fastMoveId =
    combatState.moves.fast

  const chargedMoveIds =
    combatState.moves.charged

  const fastMoveValidation =
    validateFastMove(
      reference,
      fastMoveId
    )

  if (
    !fastMoveValidation.valid
  ) {
    return {
      status:
        fastMoveValidation.reason,

      combatState,

      loadouts:
        [],
    }
  }

  if (
    chargedMoveIds.length ===
    0
  ) {
    return {
      status:
        'CHARGED_MOVE_MISSING',

      combatState,

      loadouts:
        [],
    }
  }

  const chargedValidation =
    validateChargedMoves(
      reference,
      chargedMoveIds,
      combatState.traits
    )

  if (
    chargedValidation.validMoves
      .length ===
    0
  ) {
    return {
      status:
        'CHARGED_MOVE_INVALID',

      combatState,

      invalidChargedMoves:
        chargedValidation
          .invalidMoves,

      loadouts:
        [],
    }
  }

  const loadouts =
    buildLoadouts({
      fastMoveId,

      chargedMoveIds:
        chargedValidation
          .validMoves,
    })

  return {
    status:
      'READY',

    pokemonIdentity:
      ownedPokemon
        .pokemonIdentity,

    reference,

    level:
      combatState.level,

    cpm:
      combatState.cpm,

    ivs:
      combatState.ivs,

    stats:
      combatState.stats,

    traits:
      combatState.traits,

    moves:
      combatState.moves,

    loadouts,

    invalidChargedMoves:
      chargedValidation
        .invalidMoves,

    combatState,
  }
}

// --------------------------------------------------
// Derived Raid Candidate
//
// Used when a possible state changes the Pokémon's
// reference identity while preserving the individual
// Pokémon.
//
// Evolution is the first use case:
//
// Anorith
//   ↓
// Armaldo
//
// The individual keeps:
//
// - level
// - CPM
// - IVs
// - Shadow/Purified/Lucky/Shiny traits
//
// The resulting species gets:
//
// - new reference identity
// - new base stats
// - recalculated combat stats
//
// Moves are deliberately empty here.
//
// Evolution does not preserve the source Pokémon's
// moves, and this layer must not invent a particular
// post-evolution moveset.
//
// A possible state supplies the resulting moves when
// that state is evaluated.
// --------------------------------------------------

export function deriveRaidCandidateForReference({
  candidate,
  reference,
}) {
  if (
    !candidate ||
    candidate.status !==
      'READY'
  ) {
    return {
      status:
        'INVALID_SOURCE_CANDIDATE',

      loadouts:
        [],
    }
  }

  if (
    !reference ||
    !reference.id ||
    !hasValidReferenceStats(
      reference
    )
  ) {
    return {
      status:
        'INVALID_TARGET_REFERENCE',

      loadouts:
        [],
    }
  }

  if (
    !Number.isFinite(
      candidate.level
    ) ||
    !Number.isFinite(
      candidate.cpm
    ) ||
    !hasValidIvs(
      candidate.ivs
    )
  ) {
    return {
      status:
        'INVALID_SOURCE_COMBAT_STATE',

      loadouts:
        [],
    }
  }

  const pokemonIdentity =
    getPokemonIdentity(
      reference
    )

  if (!pokemonIdentity) {
    return {
      status:
        'INVALID_TARGET_IDENTITY',

      loadouts:
        [],
    }
  }

  const stats =
    calculatePokemonStats({
      baseAttack:
        reference.stats.attack,

      baseDefense:
        reference.stats.defense,

      baseStamina:
        reference.stats.stamina,

      attackIv:
        candidate.ivs.attack,

      defenseIv:
        candidate.ivs.defense,

      staminaIv:
        candidate.ivs.stamina,

      cpm:
        candidate.cpm,
    })

  if (!stats) {
    return {
      status:
        'STAT_CALCULATION_FAILED',

      loadouts:
        [],
    }
  }

  const moves =
    buildEmptyMoves()

  const ivs = {
    attack:
      candidate.ivs.attack,

    defense:
      candidate.ivs.defense,

    stamina:
      candidate.ivs.stamina,
  }

  const traits = {
    shadow:
      candidate
        ?.traits
        ?.shadow ===
      true,

    purified:
      candidate
        ?.traits
        ?.purified ===
      true,

    lucky:
      candidate
        ?.traits
        ?.lucky ===
      true,

    shiny:
      candidate
        ?.traits
        ?.shiny ===
      true,
  }

  const combatState = {
    status:
      'READY',

    reference,

    level:
      candidate.level,

    cpm:
      candidate.cpm,

    ivs,

    stats,

    moves,

    traits,
  }

  return {
    status:
      'READY',

    pokemonIdentity,

    reference,

    level:
      candidate.level,

    cpm:
      candidate.cpm,

    ivs,

    stats,

    traits,

    moves,

    loadouts:
      [],

    invalidChargedMoves:
      [],

    combatState,

    derived:
      true,

    sourcePokemonIdentity:
      candidate
        .pokemonIdentity ??
      null,
  }
}

// --------------------------------------------------
// Collection
// --------------------------------------------------

export function buildRaidCandidates(
  ownedPokemonList
) {
  if (
    !Array.isArray(
      ownedPokemonList
    )
  ) {
    return []
  }

  return ownedPokemonList.map(
    (pokemon) =>
      buildRaidCandidate(
        pokemon
      )
  )
}