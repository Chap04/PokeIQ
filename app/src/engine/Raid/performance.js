import {
  calculatePokemonMoveDamage,
} from './damage.js'

import {
  calculateRaidDurationSeconds,
} from './timing.js'

import {
  getFastMoveEnergy,
  getChargedMoveCost,
} from './energy.js'

import {
  resolveRaidFastEnergyDelta,
  resolveRaidChargedEnergyDelta,
} from './moveSemantics.js'

// --------------------------------------------------
// Validation
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

function requirePositiveNumber(
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

function requireNonNegativeNumber(
  value,
  label
) {
  requireFiniteNumber(
    value,
    label
  )

  if (value < 0) {
    throw new Error(
      `${label} cannot be negative.`
    )
  }

  return value
}

// --------------------------------------------------
// Basic move rates
// --------------------------------------------------

export function calculateMoveDps({
  damage,
  durationSeconds,
}) {
  requireFiniteNumber(
    damage,
    'damage'
  )

  if (damage < 0) {
    throw new Error(
      'damage cannot be negative.'
    )
  }

  requirePositiveNumber(
    durationSeconds,
    'durationSeconds'
  )

  return (
    damage /
    durationSeconds
  )
}

export function calculateFastMoveEps({
  energyGain,
  durationSeconds,
}) {
  requireNonNegativeNumber(
    energyGain,
    'energyGain'
  )

  requirePositiveNumber(
    durationSeconds,
    'durationSeconds'
  )

  return (
    energyGain /
    durationSeconds
  )
}

/**
 * Charged Move energy consumption rate.
 *
 * Conventional Charged Moves consume positive energy.
 *
 * Exceptional zero-cost moves such as Struggle are
 * valid and therefore return 0 EPS rather than being
 * rejected.
 */
export function calculateChargedMoveEps({
  energyCost,
  durationSeconds,
}) {
  requireNonNegativeNumber(
    energyCost,
    'energyCost'
  )

  requirePositiveNumber(
    durationSeconds,
    'durationSeconds'
  )

  return (
    energyCost /
    durationSeconds
  )
}

// --------------------------------------------------
// Simple Cycle DPS
// --------------------------------------------------

/**
 * Calculates theoretical sustained Cycle DPS.
 *
 * Assumptions:
 *
 * - continuous attacking
 * - no incoming damage
 * - no damage-generated energy
 * - no fainting
 * - no dodging
 * - no idle time
 *
 * Conventional movesets:
 *
 * Fast Move energy generation and Charged Move
 * energy consumption are treated as continuous rates.
 *
 * Zero-cost Charged Moves:
 *
 * A 0-cost Charged Move is immediately usable at all
 * times. Under the current sustained-DPS model there
 * is therefore no reason to use the Fast Move.
 *
 * Cycle DPS becomes the Charged Move's DPS.
 */
export function calculateSimpleCycleDps({
  fastDamage,
  chargedDamage,

  fastEnergyGain,
  chargedEnergyCost,

  fastDurationSeconds,
  chargedDurationSeconds,
}) {
  const fastDps =
    calculateMoveDps({
      damage:
        fastDamage,

      durationSeconds:
        fastDurationSeconds,
    })

  const chargedDps =
    calculateMoveDps({
      damage:
        chargedDamage,

      durationSeconds:
        chargedDurationSeconds,
    })

  const fastEps =
    calculateFastMoveEps({
      energyGain:
        fastEnergyGain,

      durationSeconds:
        fastDurationSeconds,
    })

  const chargedEps =
    calculateChargedMoveEps({
      energyCost:
        chargedEnergyCost,

      durationSeconds:
        chargedDurationSeconds,
    })

  // ------------------------------------------------
  // Exceptional zero-cost Charged Move
  // ------------------------------------------------

  if (
    chargedEnergyCost ===
    0
  ) {
    return chargedDps
  }

  // ------------------------------------------------
  // Conventional energy cycle
  // ------------------------------------------------

  const denominator =
    chargedEps +
    fastEps

  if (
    denominator <= 0
  ) {
    throw new Error(
      'Cycle energy rate must be greater than 0.'
    )
  }

  return (
    (
      fastDps *
      chargedEps
    ) +
    (
      chargedDps *
      fastEps
    )
  ) /
    denominator
}

// --------------------------------------------------
// Pokémon moveset performance
// --------------------------------------------------

export function calculateMovesetPerformance({
  attacker,
  defender,

  fastMove,
  chargedMove,

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

  if (!fastMove) {
    throw new Error(
      'fastMove is required.'
    )
  }

  if (!chargedMove) {
    throw new Error(
      'chargedMove is required.'
    )
  }

  // ------------------------------------------------
  // Resolve exceptional energy semantics
  // ------------------------------------------------

  const fastEnergyDelta =
    resolveRaidFastEnergyDelta(
      fastMove
    )

  const chargedEnergyDelta =
    resolveRaidChargedEnergyDelta(
      chargedMove
    )

  // ------------------------------------------------
  // Damage
  // ------------------------------------------------

  const fastDamageResult =
    calculatePokemonMoveDamage({
      attacker,
      defender,

      move:
        fastMove,

      attackerCpMultiplier,
      defenderCpMultiplier,

      combatData,

      attackerModifiers,
      defenderModifiers,
    })

  const chargedDamageResult =
    calculatePokemonMoveDamage({
      attacker,
      defender,

      move:
        chargedMove,

      attackerCpMultiplier,
      defenderCpMultiplier,

      combatData,

      attackerModifiers,
      defenderModifiers,
    })

  // ------------------------------------------------
  // Timing
  // ------------------------------------------------

  const fastDurationSeconds =
    calculateRaidDurationSeconds(
      fastMove.durationMs
    )

  const chargedDurationSeconds =
    calculateRaidDurationSeconds(
      chargedMove.durationMs
    )

  // ------------------------------------------------
  // Energy
  // ------------------------------------------------

  const fastEnergyGain =
    getFastMoveEnergy(
      fastEnergyDelta
    )

  const chargedEnergyCost =
    getChargedMoveCost(
      chargedEnergyDelta
    )

  // ------------------------------------------------
  // Individual rates
  // ------------------------------------------------

  const fastDps =
    calculateMoveDps({
      damage:
        fastDamageResult.damage,

      durationSeconds:
        fastDurationSeconds,
    })

  const chargedDps =
    calculateMoveDps({
      damage:
        chargedDamageResult.damage,

      durationSeconds:
        chargedDurationSeconds,
    })

  const fastEps =
    calculateFastMoveEps({
      energyGain:
        fastEnergyGain,

      durationSeconds:
        fastDurationSeconds,
    })

  const chargedEps =
    calculateChargedMoveEps({
      energyCost:
        chargedEnergyCost,

      durationSeconds:
        chargedDurationSeconds,
    })

  // ------------------------------------------------
  // Sustained performance
  // ------------------------------------------------

  const cycleDps =
    calculateSimpleCycleDps({
      fastDamage:
        fastDamageResult.damage,

      chargedDamage:
        chargedDamageResult.damage,

      fastEnergyGain,

      chargedEnergyCost,

      fastDurationSeconds,

      chargedDurationSeconds,
    })

  // ------------------------------------------------
  // Result
  // ------------------------------------------------

  return {
    fastMove: {
      id:
        fastMove.id,

      damage:
        fastDamageResult.damage,

      durationSeconds:
        fastDurationSeconds,

      energyGain:
        fastEnergyGain,

      dps:
        fastDps,

      eps:
        fastEps,

      damageDetails:
        fastDamageResult,
    },

    chargedMove: {
      id:
        chargedMove.id,

      damage:
        chargedDamageResult.damage,

      durationSeconds:
        chargedDurationSeconds,

      energyCost:
        chargedEnergyCost,

      dps:
        chargedDps,

      eps:
        chargedEps,

      damageDetails:
        chargedDamageResult,
    },

    cycleDps,
  }
}