/**
 * PokeIQ Raid Engine
 * ------------------
 * Raid Survivability + Damage Output V1
 *
 * Converts a Pokémon's current combat state and
 * incoming raid pressure into useful raid metrics.
 *
 * This module handles:
 * - effective HP
 * - estimated time to faint
 * - total damage output (TDO)
 * - a blended raid-performance score
 *
 * It intentionally does NOT:
 * - choose boss moves
 * - calculate incoming boss damage
 * - calculate outgoing attacker DPS
 * - simulate individual battle events
 * - model dodging
 * - model relobby time
 *
 * Those values are supplied by higher engine layers.
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

function requireIv(
  value,
  label
) {
  requireFiniteNumber(
    value,
    label
  )

  if (
    value < 0 ||
    value > 15
  ) {
    throw new Error(
      `${label} must be between 0 and 15.`
    )
  }

  return value
}

// --------------------------------------------------
// Effective HP
// --------------------------------------------------

/**
 * Pokémon GO combat HP:
 *
 * floor(
 *   (Base Stamina + Stamina IV)
 *   × CPM
 * )
 *
 * Minimum combat HP is 10.
 */
export function calculateEffectiveHp({
  baseStamina,
  staminaIv = 0,
  cpMultiplier,
}) {
  requireFiniteNumber(
    baseStamina,
    'baseStamina'
  )

  requireIv(
    staminaIv,
    'staminaIv'
  )

  requirePositiveNumber(
    cpMultiplier,
    'cpMultiplier'
  )

  if (baseStamina < 0) {
    throw new Error(
      'baseStamina cannot be negative.'
    )
  }

  return Math.max(
    10,
    Math.floor(
      (
        baseStamina +
        staminaIv
      ) *
      cpMultiplier
    )
  )
}

// --------------------------------------------------
// Survival time
// --------------------------------------------------

/**
 * Estimates how long the attacker remains active
 * against sustained incoming raid damage.
 *
 * This is intentionally continuous rather than
 * event-based for V1.
 *
 * Time To Faint =
 * HP / Incoming DPS
 */
export function calculateTimeToFaint({
  hp,
  incomingDps,
}) {
  requirePositiveNumber(
    hp,
    'hp'
  )

  requirePositiveNumber(
    incomingDps,
    'incomingDps'
  )

  return (
    hp /
    incomingDps
  )
}

// --------------------------------------------------
// Total Damage Output
// --------------------------------------------------

/**
 * Estimated damage dealt before fainting.
 *
 * TDO =
 * Outgoing DPS × Time To Faint
 */
export function calculateTotalDamageOutput({
  cycleDps,
  timeToFaintSeconds,
}) {
  requirePositiveNumber(
    cycleDps,
    'cycleDps'
  )

  requirePositiveNumber(
    timeToFaintSeconds,
    'timeToFaintSeconds'
  )

  return (
    cycleDps *
    timeToFaintSeconds
  )
}

// --------------------------------------------------
// Raid Performance Score
// --------------------------------------------------

/**
 * Blended raid-performance metric.
 *
 * We do NOT rank directly by TDO because that can
 * over-reward extremely bulky Pokémon with poor
 * damage rates.
 *
 * We also do NOT rank directly by DPS because that
 * ignores how long the attacker survives.
 *
 * This score uses the established raid-ranking idea
 * behind DPS^3 × TDO, but restores the result to a
 * DPS-like scale with the fourth root:
 *
 * Raid Score =
 * (DPS^3 × TDO) ^ (1 / 4)
 *
 * Equivalent form:
 *
 * DPS × TimeToFaint^(1 / 4)
 *
 * This deliberately weights DPS more strongly than
 * survivability because raid battles are constrained
 * by a timer.
 */
export function calculateRaidPerformanceScore({
  cycleDps,
  totalDamageOutput,
}) {
  requirePositiveNumber(
    cycleDps,
    'cycleDps'
  )

  requirePositiveNumber(
    totalDamageOutput,
    'totalDamageOutput'
  )

  return Math.pow(
    (
      Math.pow(
        cycleDps,
        3
      ) *
      totalDamageOutput
    ),
    1 / 4
  )
}

// --------------------------------------------------
// Combined helper
// --------------------------------------------------

/**
 * Produces all V1 survivability metrics for one
 * attacker in one boss matchup.
 */
export function calculateRaidSurvivability({
  baseStamina,
  staminaIv = 0,
  cpMultiplier,

  outgoingCycleDps,
  incomingCycleDps,
}) {
  const hp =
    calculateEffectiveHp({
      baseStamina,
      staminaIv,
      cpMultiplier,
    })

  const timeToFaintSeconds =
    calculateTimeToFaint({
      hp,

      incomingDps:
        incomingCycleDps,
    })

  const totalDamageOutput =
    calculateTotalDamageOutput({
      cycleDps:
        outgoingCycleDps,

      timeToFaintSeconds,
    })

  const raidScore =
    calculateRaidPerformanceScore({
      cycleDps:
        outgoingCycleDps,

      totalDamageOutput,
    })

  return {
    hp,

    outgoingCycleDps,

    incomingCycleDps,

    timeToFaintSeconds,

    totalDamageOutput,

    raidScore,
  }
}