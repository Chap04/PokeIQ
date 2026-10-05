import {
  getPokemonReferenceByIdentity,
} from './pokemonReference.js'

import {
  calculatePokemonStats,
  inferPokemonLevel,
} from './pokemonLevel.js'

export function getPokemonCombatState(
  ownedPokemon
) {
  if (!ownedPokemon) {
    return null
  }

  const {
    pokemonIdentity,
    cp,
    ivs,
  } = ownedPokemon

  const attackIv =
    ivs?.attack

  const defenseIv =
    ivs?.defense

  const staminaIv =
    ivs?.stamina

  if (
    !pokemonIdentity ||
    cp == null ||
    attackIv == null ||
    defenseIv == null ||
    staminaIv == null
  ) {
    return {
      status:
        'INCOMPLETE',

      reference:
        null,

      level:
        null,

      cpm:
        null,

      stats:
        null,
    }
  }

  const reference =
    getPokemonReferenceByIdentity(
      pokemonIdentity
    )

  if (!reference) {
    return {
      status:
        'REFERENCE_NOT_FOUND',

      reference:
        null,

      level:
        null,

      cpm:
        null,

      stats:
        null,
    }
  }

  const levelResult =
    inferPokemonLevel({
      cp,

      baseAttack:
        reference.stats.attack,

      baseDefense:
        reference.stats.defense,

      baseStamina:
        reference.stats.stamina,

      attackIv,

      defenseIv,

      staminaIv,
    })

  if (!levelResult) {
    return {
      status:
        'LEVEL_INFERENCE_FAILED',

      reference,

      level:
        null,

      cpm:
        null,

      stats:
        null,
    }
  }

  if (
    levelResult.status !==
    'EXACT'
  ) {
    return {
      status:
        levelResult.status,

      reference,

      level:
        null,

      cpm:
        null,

      stats:
        null,

      candidates:
        levelResult.candidates ??
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

      attackIv,

      defenseIv,

      staminaIv,

      cpm:
        levelResult.cpm,
    })

  const chargedMove1Id =
    ownedPokemon
      .chargedMove1Id ??
    null

  const chargedMove2Id =
    ownedPokemon
      .chargedMove2Id ??
    null

  return {
    status:
      'READY',

    reference,

    level:
      levelResult.level,

    cpm:
      levelResult.cpm,

    ivs: {
      attack:
        attackIv,

      defense:
        defenseIv,

      stamina:
        staminaIv,
    },

    stats,

    moves: {
      fast:
        ownedPokemon
          .fastMoveId ??
        null,

      charged: [
        chargedMove1Id,
        chargedMove2Id,
      ].filter(
        Boolean
      ),

      chargedSlots: {
        slot1:
          chargedMove1Id,

        slot2:
          chargedMove2Id,
      },
    },

    traits: {
      shadow:
        ownedPokemon
          .shadow ===
        true,

      purified:
        ownedPokemon
          .purified ===
        true,

      lucky:
        ownedPokemon
          .lucky ===
        true,

      shiny:
        ownedPokemon
          .shiny ===
        true,
    },
  }
}