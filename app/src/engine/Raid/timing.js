/**
 * PokeIQ Raid Engine
 * ------------------
 * Current Pokémon GO raid move timing calculations.
 *
 * Modern raids operate on 500 ms timing increments.
 *
 * This module converts the raw move duration stored
 * in the Game Master into the effective duration used
 * by the raid engine.
 */

const RAID_TURN_MS = 500

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

// --------------------------------------------------
// Raid timing
// --------------------------------------------------

/**
 * Converts a raw Game Master move duration into the
 * effective duration used in modern raid combat.
 *
 * Raid timing is quantized to 500 ms increments.
 *
 * Examples:
 *
 * 700 ms  -> 500 ms
 * 800 ms  -> 1000 ms
 * 1000 ms -> 1000 ms
 * 2300 ms -> 2500 ms
 */
export function calculateRaidDurationMs(
  durationMs
) {
  requireFiniteNumber(
    durationMs,
    'durationMs'
  )

  if (durationMs <= 0) {
    throw new Error(
      'durationMs must be greater than 0.'
    )
  }

  return (
    Math.round(
      durationMs /
      RAID_TURN_MS
    ) *
    RAID_TURN_MS
  )
}

/**
 * Same calculation, returned in seconds.
 */
export function calculateRaidDurationSeconds(
  durationMs
) {
  return (
    calculateRaidDurationMs(
      durationMs
    ) / 1000
  )
}

/**
 * Returns how many 500 ms raid turns a move occupies.
 */
export function calculateRaidTurns(
  durationMs
) {
  return (
    calculateRaidDurationMs(
      durationMs
    ) /
    RAID_TURN_MS
  )
}

export {
  RAID_TURN_MS,
}