/**
 * PokeIQ Raid Engine
 * ------------------
 * Exceptional PvE Move Semantics
 *
 * Pokémon GO's Game Master does not represent every
 * raid move using ordinary numeric power / energy
 * fields.
 *
 * This module interprets known exceptional mechanics
 * without weakening validation for normal moves.
 *
 * Current supported exceptions:
 *
 * - Splash
 *   0 raid damage
 *   normal Game Master energy generation
 *
 * - Yawn
 *   0 raid damage
 *   normal Game Master energy generation
 *
 * - Struggle
 *   normal raid damage
 *   0 raid energy cost
 *
 * Current unsupported static mechanic:
 *
 * - Transform
 *   Ditto copies the opposing Pokémon in Gyms/Raids.
 *   It cannot be accurately represented as an
 *   ordinary static Fast Move.
 */

// --------------------------------------------------
// Exceptional move IDs
// --------------------------------------------------

export const ZERO_DAMAGE_FAST_MOVE_IDS =
  new Set([
    'SPLASH_FAST',
    'YAWN_FAST',
  ])

export const ZERO_COST_CHARGED_MOVE_IDS =
  new Set([
    'STRUGGLE',
  ])

export const UNSUPPORTED_STATIC_RAID_MOVE_IDS =
  new Set([
    'TRANSFORM_FAST',
  ])

// --------------------------------------------------
// Validation
// --------------------------------------------------

function requireMove(
  move
) {
  if (!move) {
    throw new Error(
      'move is required.'
    )
  }

  if (!move.id) {
    throw new Error(
      'move.id is required.'
    )
  }

  return move
}

// --------------------------------------------------
// Support checks
// --------------------------------------------------

export function isStaticRaidMoveSupported(
  move
) {
  requireMove(
    move
  )

  return (
    !UNSUPPORTED_STATIC_RAID_MOVE_IDS
      .has(
        move.id
      )
  )
}

export function getUnsupportedRaidMoveReason(
  move
) {
  requireMove(
    move
  )

  if (
    move.id ===
    'TRANSFORM_FAST'
  ) {
    return (
      'Transform copies the raid opponent and ' +
      'requires dynamic Pokémon transformation simulation.'
    )
  }

  return null
}

// --------------------------------------------------
// Raid move power
// --------------------------------------------------

/**
 * Resolves the effective PvE power used by PokeIQ.
 *
 * Ordinary moves must contain finite Game Master
 * power.
 *
 * Known zero-damage Fast Moves are explicitly
 * resolved to 0.
 */
export function resolveRaidMovePower(
  move
) {
  requireMove(
    move
  )

  if (
    ZERO_DAMAGE_FAST_MOVE_IDS
      .has(
        move.id
      )
  ) {
    return 0
  }

  if (
    UNSUPPORTED_STATIC_RAID_MOVE_IDS
      .has(
        move.id
      )
  ) {
    throw new Error(
      `Raid Move ${move.id} requires unsupported dynamic battle semantics.`
    )
  }

  if (
    !Number.isFinite(
      move.power
    )
  ) {
    throw new Error(
      `Raid Move ${move.id} has no finite power and is not a known zero-damage move.`
    )
  }

  return move.power
}

// --------------------------------------------------
// Fast Move energy
// --------------------------------------------------

/**
 * Returns the raw PvE energyDelta that should be
 * passed into the standard energy engine.
 *
 * Exceptional zero-damage moves such as Splash and
 * Yawn still use their ordinary Game Master energy
 * generation.
 */
export function resolveRaidFastEnergyDelta(
  move
) {
  requireMove(
    move
  )

  if (
    UNSUPPORTED_STATIC_RAID_MOVE_IDS
      .has(
        move.id
      )
  ) {
    throw new Error(
      `Raid Move ${move.id} requires unsupported dynamic battle semantics.`
    )
  }

  if (
    !Number.isFinite(
      move.energyDelta
    )
  ) {
    throw new Error(
      `Fast Move ${move.id} has no finite raid energyDelta.`
    )
  }

  if (
    move.energyDelta <
    0
  ) {
    throw new Error(
      `Fast Move ${move.id} cannot consume energy.`
    )
  }

  return move.energyDelta
}

// --------------------------------------------------
// Charged Move energy
// --------------------------------------------------

/**
 * Returns the raw PvE energyDelta that should be
 * passed into the standard energy engine.
 *
 * Struggle is explicitly represented as a 0-cost
 * Charged Move in Gym/Raid combat even though its
 * Game Master energyDelta is null.
 */
export function resolveRaidChargedEnergyDelta(
  move
) {
  requireMove(
    move
  )

  if (
    ZERO_COST_CHARGED_MOVE_IDS
      .has(
        move.id
      )
  ) {
    return 0
  }

  if (
    !Number.isFinite(
      move.energyDelta
    )
  ) {
    throw new Error(
      `Charged Move ${move.id} has no finite raid energyDelta and is not a known zero-cost move.`
    )
  }

  if (
    move.energyDelta >
    0
  ) {
    throw new Error(
      `Charged Move ${move.id} cannot generate energy.`
    )
  }

  return move.energyDelta
}

// --------------------------------------------------
// Moveset support
// --------------------------------------------------

export function isStaticRaidMovesetSupported({
  fastMove,
  chargedMove,
}) {
  requireMove(
    fastMove
  )

  requireMove(
    chargedMove
  )

  return (
    isStaticRaidMoveSupported(
      fastMove
    ) &&
    isStaticRaidMoveSupported(
      chargedMove
    )
  )
}