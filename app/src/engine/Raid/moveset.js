import {
  calculatePokemonMoveDamage,
} from './damage.js'

import {
  calculateRaidDurationMs,
} from './timing.js'

import {
  canUseChargedMove,
  applyFastMoveEnergy,
  applyChargedMoveEnergy,
  getChargedMoveCost,
} from './energy.js'

import {
  resolveRaidFastEnergyDelta,
  resolveRaidChargedEnergyDelta,
  isStaticRaidMovesetSupported,
  getUnsupportedRaidMoveReason,
} from './moveSemantics.js'

/**
 * PokeIQ Raid Engine
 * ------------------
 * Moveset Cycle V1
 *
 * Simulates an attacker repeatedly using:
 *
 * - its Fast Move when it cannot afford its Charged Move
 * - its Charged Move when sufficient energy is available
 *
 * Known exceptional PvE move semantics are resolved
 * before normal simulation rules are applied.
 *
 * Supported exceptions currently include:
 *
 * - Splash
 *   0 damage, normal energy generation
 *
 * - Yawn
 *   0 damage, normal energy generation
 *
 * - Struggle
 *   normal damage, 0 energy cost
 *
 * Unsupported static mechanic:
 *
 * - Transform
 *   requires dynamic opponent-copying behavior
 *
 * This intentionally does NOT model:
 * - incoming damage
 * - damage-generated energy
 * - fainting
 * - dodging
 * - boss actions
 * - weather
 * - friendship
 * - Party Power
 * - Mega ally boosts
 */

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

function requireMoveBase(
  move,
  label
) {
  if (!move) {
    throw new Error(
      `${label} is required.`
    )
  }

  if (!move.id) {
    throw new Error(
      `${label}.id is required.`
    )
  }

  requireFiniteNumber(
    move.durationMs,
    `${label}.durationMs`
  )

  if (
    move.durationMs <=
    0
  ) {
    throw new Error(
      `${label}.durationMs must be greater than 0.`
    )
  }

  return move
}

function requireSupportedMoveset({
  fastMove,
  chargedMove,
}) {
  requireMoveBase(
    fastMove,
    'fastMove'
  )

  requireMoveBase(
    chargedMove,
    'chargedMove'
  )

  if (
    isStaticRaidMovesetSupported({
      fastMove,
      chargedMove,
    })
  ) {
    return
  }

  const unsupportedMove =
    !getUnsupportedRaidMoveReason(
      fastMove
    )
      ? chargedMove
      : fastMove

  const reason =
    getUnsupportedRaidMoveReason(
      unsupportedMove
    )

  throw new Error(
    `Moveset cannot be simulated statically because ${unsupportedMove.id} is unsupported. ${reason ?? ''}`.trim()
  )
}

// --------------------------------------------------
// Individual move execution
// --------------------------------------------------

function executeFastMove({
  currentEnergy,
  elapsedMs,
  totalDamage,

  attacker,
  defender,

  move,

  energyDelta,

  attackerCpMultiplier,
  defenderCpMultiplier,

  combatData,
  attackerModifiers,
}) {
  const durationMs =
    calculateRaidDurationMs(
      move.durationMs
    )

  const damageResult =
    calculatePokemonMoveDamage({
      attacker,
      defender,

      move,

      attackerCpMultiplier,
      defenderCpMultiplier,

      combatData,
      attackerModifiers,
    })

  const energyAfter =
    applyFastMoveEnergy(
      currentEnergy,
      energyDelta
    )

  return {
    action: {
      type:
        'FAST',

      moveId:
        move.id,

      startTimeMs:
        elapsedMs,

      endTimeMs:
        elapsedMs +
        durationMs,

      durationMs,

      energyBefore:
        currentEnergy,

      energyAfter,

      damage:
        damageResult.damage,

      cumulativeDamage:
        totalDamage +
        damageResult.damage,
    },

    elapsedMs:
      elapsedMs +
      durationMs,

    energy:
      energyAfter,

    totalDamage:
      totalDamage +
      damageResult.damage,
  }
}

function executeChargedMove({
  currentEnergy,
  elapsedMs,
  totalDamage,

  attacker,
  defender,

  move,

  energyDelta,

  attackerCpMultiplier,
  defenderCpMultiplier,

  combatData,
  attackerModifiers,
}) {
  const durationMs =
    calculateRaidDurationMs(
      move.durationMs
    )

  const damageResult =
    calculatePokemonMoveDamage({
      attacker,
      defender,

      move,

      attackerCpMultiplier,
      defenderCpMultiplier,

      combatData,
      attackerModifiers,
    })

  const energyAfter =
    applyChargedMoveEnergy(
      currentEnergy,
      energyDelta
    )

  return {
    action: {
      type:
        'CHARGED',

      moveId:
        move.id,

      startTimeMs:
        elapsedMs,

      endTimeMs:
        elapsedMs +
        durationMs,

      durationMs,

      energyBefore:
        currentEnergy,

      energyAfter,

      damage:
        damageResult.damage,

      cumulativeDamage:
        totalDamage +
        damageResult.damage,
    },

    elapsedMs:
      elapsedMs +
      durationMs,

    energy:
      energyAfter,

    totalDamage:
      totalDamage +
      damageResult.damage,
  }
}

// --------------------------------------------------
// Moveset simulation
// --------------------------------------------------

export function simulateMoveset({
  attacker,
  defender,

  fastMove,
  chargedMove,

  attackerCpMultiplier,
  defenderCpMultiplier,

  combatData,

  durationMs = 100000,

  startingEnergy = 0,

  attackerModifiers = [],
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

  requireSupportedMoveset({
    fastMove,
    chargedMove,
  })

  // ------------------------------------------------
  // Resolve exceptional move semantics
  // ------------------------------------------------

  const fastEnergyDelta =
    resolveRaidFastEnergyDelta(
      fastMove
    )

  const chargedEnergyDelta =
    resolveRaidChargedEnergyDelta(
      chargedMove
    )

  if (
    fastEnergyDelta <
    0
  ) {
    throw new Error(
      'fastMove must generate energy.'
    )
  }

  if (
    chargedEnergyDelta >
    0
  ) {
    throw new Error(
      'chargedMove cannot generate energy.'
    )
  }

  requireFiniteNumber(
    durationMs,
    'durationMs'
  )

  if (
    durationMs <=
    0
  ) {
    throw new Error(
      'durationMs must be greater than 0.'
    )
  }

  requireFiniteNumber(
    startingEnergy,
    'startingEnergy'
  )

  if (
    startingEnergy < 0 ||
    startingEnergy > 100
  ) {
    throw new Error(
      'startingEnergy must be between 0 and 100.'
    )
  }

  const chargedMoveCost =
    getChargedMoveCost(
      chargedEnergyDelta
    )

  let elapsedMs = 0
  let energy =
    startingEnergy
  let totalDamage = 0

  let fastMovesUsed = 0
  let chargedMovesUsed = 0

  const actions = []

  // ------------------------------------------------
  // Battle loop
  // ------------------------------------------------

  while (
    elapsedMs <
    durationMs
  ) {
    /**
     * A zero-cost Charged Move is immediately
     * available because:
     *
     * currentEnergy >= 0
     *
     * is always true.
     *
     * This intentionally causes a Struggle moveset
     * to repeatedly use Struggle rather than wasting
     * time on its Fast Move.
     */
    const useChargedMove =
      canUseChargedMove(
        energy,
        chargedMoveCost
      )

    const selectedMove =
      useChargedMove
        ? chargedMove
        : fastMove

    const selectedDuration =
      calculateRaidDurationMs(
        selectedMove.durationMs
      )

    // Do not begin an action that would finish
    // outside the requested simulation window.
    if (
      elapsedMs +
        selectedDuration >
      durationMs
    ) {
      break
    }

    const result =
      useChargedMove
        ? executeChargedMove({
            currentEnergy:
              energy,

            elapsedMs,
            totalDamage,

            attacker,
            defender,

            move:
              chargedMove,

            energyDelta:
              chargedEnergyDelta,

            attackerCpMultiplier,
            defenderCpMultiplier,

            combatData,
            attackerModifiers,
          })
        : executeFastMove({
            currentEnergy:
              energy,

            elapsedMs,
            totalDamage,

            attacker,
            defender,

            move:
              fastMove,

            energyDelta:
              fastEnergyDelta,

            attackerCpMultiplier,
            defenderCpMultiplier,

            combatData,
            attackerModifiers,
          })

    actions.push(
      result.action
    )

    elapsedMs =
      result.elapsedMs

    energy =
      result.energy

    totalDamage =
      result.totalDamage

    if (useChargedMove) {
      chargedMovesUsed +=
        1
    } else {
      fastMovesUsed +=
        1
    }
  }

  // ------------------------------------------------
  // Result rates
  // ------------------------------------------------

  const elapsedSeconds =
    elapsedMs /
    1000

  const requestedDurationSeconds =
    durationMs /
    1000

  /**
   * Active DPS
   *
   * Damage divided by the amount of time occupied by
   * completed moves.
   */
  const activeDps =
    elapsedSeconds > 0
      ? totalDamage /
        elapsedSeconds
      : 0

  /**
   * Window DPS
   *
   * Damage divided by the entire requested simulation
   * window, including unused time at the end.
   */
  const windowDps =
    requestedDurationSeconds >
    0
      ? totalDamage /
        requestedDurationSeconds
      : 0

  return {
    requestedDurationMs:
      durationMs,

    requestedDurationSeconds,

    elapsedMs,

    elapsedSeconds,

    remainingMs:
      durationMs -
      elapsedMs,

    startingEnergy,

    endingEnergy:
      energy,

    totalDamage,

    activeDps,

    windowDps,

    fastMovesUsed,

    chargedMovesUsed,

    totalMovesUsed:
      fastMovesUsed +
      chargedMovesUsed,

    actions,
  }
}