import {
  resolveRaidMovePower,
} from './moveSemantics.js'

/**
 * PokeIQ Raid Engine
 * ------------------
 * Core Pokémon GO PvE damage calculations.
 *
 * This module handles:
 * - effective combat stats
 * - STAB
 * - type effectiveness
 * - attacker modifiers
 * - defender Defense modifiers
 * - Pokémon GO damage flooring
 * - known zero-damage raid moves
 *
 * It intentionally does NOT handle:
 * - move timing
 * - energy cycles
 * - raid boss AI
 * - dodging
 * - weather
 * - friendship
 * - Mega ally boosts
 * - Party Power
 *
 * Those belong in later raid-engine layers.
 */

// --------------------------------------------------
// Validation helpers
// --------------------------------------------------

function requireFiniteNumber(
  value,
  label
) {
  if (!Number.isFinite(value)) {
    throw new Error(
      `${label} must be a finite number.`
    )
  }

  return value
}

function requirePositiveModifier(
  value,
  label
) {
  requireFiniteNumber(
    value,
    label
  )

  if (value <= 0) {
    throw new Error(
      `${label} must be greater than 0.`
    )
  }

  return value
}

function requireIv(
  iv,
  label
) {
  requireFiniteNumber(
    iv,
    label
  )

  if (
    iv < 0 ||
    iv > 15
  ) {
    throw new Error(
      `${label} must be between 0 and 15.`
    )
  }

  return iv
}

function combineModifiers(
  modifiers,
  label
) {
  if (
    !Array.isArray(
      modifiers
    )
  ) {
    throw new Error(
      `${label} must be an array.`
    )
  }

  let product = 1

  for (
    const modifier
    of modifiers
  ) {
    requirePositiveModifier(
      modifier,
      `${label} modifier`
    )

    product *=
      modifier
  }

  return product
}

// --------------------------------------------------
// Effective stats
// --------------------------------------------------

/**
 * Calculates an effective Pokémon GO stat.
 *
 * Effective Stat =
 * (Base Stat + IV) × CPM
 */
export function calculateEffectiveStat({
  baseStat,
  iv = 0,
  cpMultiplier,
}) {
  requireFiniteNumber(
    baseStat,
    'baseStat'
  )

  requireIv(
    iv,
    'iv'
  )

  requireFiniteNumber(
    cpMultiplier,
    'cpMultiplier'
  )

  if (baseStat < 0) {
    throw new Error(
      'baseStat cannot be negative.'
    )
  }

  if (
    cpMultiplier <= 0
  ) {
    throw new Error(
      'cpMultiplier must be greater than 0.'
    )
  }

  return (
    (
      baseStat +
      iv
    ) *
    cpMultiplier
  )
}

export function calculateEffectiveAttack({
  baseAttack,
  attackIv = 0,
  cpMultiplier,
}) {
  return calculateEffectiveStat({
    baseStat:
      baseAttack,

    iv:
      attackIv,

    cpMultiplier,
  })
}

export function calculateEffectiveDefense({
  baseDefense,
  defenseIv = 0,
  cpMultiplier,
}) {
  return calculateEffectiveStat({
    baseStat:
      baseDefense,

    iv:
      defenseIv,

    cpMultiplier,
  })
}

/**
 * Applies state or battle modifiers to an already
 * calculated effective Defense stat.
 *
 * Example:
 *
 * Shadow Pokémon:
 *
 * effectiveDefense
 * × combatData.modifiers.shadowDefense
 *
 * A Shadow Defense modifier below 1 lowers Defense,
 * causing the ordinary damage formula to naturally
 * produce greater incoming damage.
 */
export function applyDefenseModifiers({
  defenderDefense,
  defenderModifiers = [],
}) {
  requireFiniteNumber(
    defenderDefense,
    'defenderDefense'
  )

  if (
    defenderDefense <= 0
  ) {
    throw new Error(
      'defenderDefense must be greater than 0.'
    )
  }

  const modifier =
    combineModifiers(
      defenderModifiers,
      'defenderModifiers'
    )

  return {
    baseDefense:
      defenderDefense,

    modifier,

    defense:
      defenderDefense *
      modifier,
  }
}

// --------------------------------------------------
// STAB
// --------------------------------------------------

/**
 * Returns the Same-Type Attack Bonus.
 *
 * The caller supplies the current STAB modifier from
 * PokeIQ combat reference data.
 */
export function calculateStab({
  moveType,
  attackerTypes,
  stabMultiplier = 1.2,
}) {
  if (!moveType) {
    throw new Error(
      'moveType is required.'
    )
  }

  if (
    !Array.isArray(
      attackerTypes
    )
  ) {
    throw new Error(
      'attackerTypes must be an array.'
    )
  }

  requireFiniteNumber(
    stabMultiplier,
    'stabMultiplier'
  )

  return attackerTypes.includes(
    moveType
  )
    ? stabMultiplier
    : 1
}

// --------------------------------------------------
// Type effectiveness
// --------------------------------------------------

/**
 * Calculates combined type effectiveness against
 * one or two defending types.
 *
 * Example:
 *
 * Rock vs Fire/Flying
 * 1.6 × 1.6 = 2.56
 */
export function calculateTypeEffectiveness({
  moveType,
  defenderTypes,
  typeEffectiveness,
}) {
  if (!moveType) {
    throw new Error(
      'moveType is required.'
    )
  }

  if (
    !Array.isArray(
      defenderTypes
    ) ||
    defenderTypes.length ===
      0
  ) {
    throw new Error(
      'defenderTypes must contain at least one type.'
    )
  }

  const attackChart =
    typeEffectiveness?.[
      moveType
    ]

  if (!attackChart) {
    throw new Error(
      `No type-effectiveness data found for ${moveType}.`
    )
  }

  let multiplier = 1

  for (
    const defenderType
    of defenderTypes
  ) {
    const scalar =
      attackChart[
        defenderType
      ]

    if (
      !Number.isFinite(
        scalar
      )
    ) {
      throw new Error(
        `No ${moveType} → ${defenderType} type-effectiveness value found.`
      )
    }

    multiplier *=
      scalar
  }

  return multiplier
}

// --------------------------------------------------
// Damage
// --------------------------------------------------

/**
 * Calculates the damage of a conventional damaging
 * PvE attack.
 *
 * Pokémon GO core damage formula:
 *
 * floor(
 *   0.5
 *   × Power
 *   × Attack / Defense
 *   × STAB
 *   × Type Effectiveness
 *   × Other Modifiers
 * ) + 1
 *
 * Important:
 *
 * This helper represents the conventional damage
 * formula. Known zero-damage moves are intercepted
 * by calculatePokemonMoveDamage() before reaching
 * this function.
 */
export function calculateDamage({
  movePower,
  attackerAttack,
  defenderDefense,

  stab = 1,

  effectiveness = 1,

  otherModifiers = [],
}) {
  requireFiniteNumber(
    movePower,
    'movePower'
  )

  requireFiniteNumber(
    attackerAttack,
    'attackerAttack'
  )

  requireFiniteNumber(
    defenderDefense,
    'defenderDefense'
  )

  requireFiniteNumber(
    stab,
    'stab'
  )

  requireFiniteNumber(
    effectiveness,
    'effectiveness'
  )

  if (
    movePower < 0
  ) {
    throw new Error(
      'movePower cannot be negative.'
    )
  }

  if (
    attackerAttack <= 0
  ) {
    throw new Error(
      'attackerAttack must be greater than 0.'
    )
  }

  if (
    defenderDefense <= 0
  ) {
    throw new Error(
      'defenderDefense must be greater than 0.'
    )
  }

  let modifier =
    stab *
    effectiveness

  for (
    const additionalModifier
    of otherModifiers
  ) {
    requirePositiveModifier(
      additionalModifier,
      'additionalModifier'
    )

    modifier *=
      additionalModifier
  }

  const rawDamage =
    0.5 *
    movePower *
    (
      attackerAttack /
      defenderDefense
    ) *
    modifier

  return (
    Math.floor(
      rawDamage
    ) +
    1
  )
}

// --------------------------------------------------
// High-level helper
// --------------------------------------------------

/**
 * Convenience function that performs the complete
 * current V1 one-hit calculation.
 *
 * Attacker modifiers multiply outgoing damage.
 *
 * Defender modifiers multiply effective Defense before
 * the conventional damage formula is evaluated.
 *
 * Example:
 *
 * Shadow attacker:
 * attackerModifiers:
 * [combatData.modifiers.shadowAttack]
 *
 * Shadow defender:
 * defenderModifiers:
 * [combatData.modifiers.shadowDefense]
 *
 * Exceptional move semantics are resolved before the
 * conventional damage formula is applied.
 */
export function calculatePokemonMoveDamage({
  attacker,
  defender,
  move,
  attackerCpMultiplier,
  defenderCpMultiplier,
  combatData,
  attackerModifiers = [],
  defenderModifiers = [],
}) {
  if (!attacker) {
    throw new Error(
      'attacker is required.'
    )
  }

  if (!defender) {
    throw new Error(
      'defender is required.'
    )
  }

  if (!move) {
    throw new Error(
      'move is required.'
    )
  }

  if (!combatData) {
    throw new Error(
      'combatData is required.'
    )
  }

  const movePower =
    resolveRaidMovePower(
      move
    )

  const attackerAttack =
    calculateEffectiveAttack({
      baseAttack:
        attacker
          .stats
          .attack,

      attackIv:
        attacker
          .ivs
          ?.attack ??
        0,

      cpMultiplier:
        attackerCpMultiplier,
    })

  const baseDefenderDefense =
    calculateEffectiveDefense({
      baseDefense:
        defender
          .stats
          .defense,

      defenseIv:
        defender
          .ivs
          ?.defense ??
        0,

      cpMultiplier:
        defenderCpMultiplier,
    })

  const defenseState =
    applyDefenseModifiers({
      defenderDefense:
        baseDefenderDefense,

      defenderModifiers,
    })

  const defenderDefense =
    defenseState.defense

  const stab =
    calculateStab({
      moveType:
        move.type,

      attackerTypes:
        attacker.types,

      stabMultiplier:
        combatData
          .modifiers
          .stab,
    })

  const effectiveness =
    calculateTypeEffectiveness({
      moveType:
        move.type,

      defenderTypes:
        defender.types,

      typeEffectiveness:
        combatData
          .typeEffectiveness,
    })

  const attackerModifier =
    combineModifiers(
      attackerModifiers,
      'attackerModifiers'
    )

  const totalModifier =
    stab *
    effectiveness *
    attackerModifier

  /**
   * Zero-damage moves need explicit handling.
   *
   * Sending power 0 through Pokémon GO's ordinary
   * damage formula would produce:
   *
   * floor(0) + 1 = 1
   *
   * Splash and Yawn should instead deal exactly
   * zero raid damage.
   */
  const damage =
    movePower === 0
      ? 0
      : calculateDamage({
          movePower,

          attackerAttack,

          defenderDefense,

          stab,

          effectiveness,

          otherModifiers:
            attackerModifiers,
        })

  return {
    damage,

    attackerAttack,

    baseDefenderDefense,

    defenderDefense,

    defenderModifier:
      defenseState.modifier,

    movePower,

    moveType:
      move.type,

    stab,

    effectiveness,

    attackerModifier,

    totalModifier,
  }
}