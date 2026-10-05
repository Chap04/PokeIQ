/**
 * PokeIQ Raid Engine
 * ------------------
 * Raid Boss Model V1
 *
 * Converts a Pokémon reference record into a
 * combat-ready raid boss using a raid profile.
 *
 * Raid bosses:
 * - use +15 Attack IV
 * - use +15 Defense IV
 * - use tier-specific CPM
 * - use fixed tier-specific HP
 *
 * Boss HP is NOT calculated from base Stamina.
 */

// --------------------------------------------------
// Validation
// --------------------------------------------------

function requirePokemon(
  pokemon
) {
  if (!pokemon) {
    throw new Error(
      'pokemon is required.'
    )
  }

  if (!pokemon.stats) {
    throw new Error(
      'pokemon.stats is required.'
    )
  }

  return pokemon
}

function requireRaidProfile(
  raidProfile
) {
  if (!raidProfile) {
    throw new Error(
      'raidProfile is required.'
    )
  }

  if (
    !Number.isFinite(
      raidProfile.bossHp
    ) ||
    raidProfile.bossHp <= 0
  ) {
    throw new Error(
      'raidProfile.bossHp must be greater than 0.'
    )
  }

  if (
    !Number.isFinite(
      raidProfile.cpMultiplier
    ) ||
    raidProfile.cpMultiplier <= 0
  ) {
    throw new Error(
      'raidProfile.cpMultiplier must be greater than 0.'
    )
  }

  if (
    !Number.isFinite(
      raidProfile.timerSeconds
    ) ||
    raidProfile.timerSeconds <= 0
  ) {
    throw new Error(
      'raidProfile.timerSeconds must be greater than 0.'
    )
  }

  return raidProfile
}

// --------------------------------------------------
// Raid Boss constants
// --------------------------------------------------

export const RAID_BOSS_ATTACK_IV = 15
export const RAID_BOSS_DEFENSE_IV = 15

// --------------------------------------------------
// Effective raid stats
// --------------------------------------------------

export function calculateRaidBossAttack({
  baseAttack,
  cpMultiplier,
}) {
  if (
    !Number.isFinite(baseAttack)
  ) {
    throw new Error(
      'baseAttack must be a finite number.'
    )
  }

  if (
    !Number.isFinite(
      cpMultiplier
    ) ||
    cpMultiplier <= 0
  ) {
    throw new Error(
      'cpMultiplier must be greater than 0.'
    )
  }

  return (
    (
      baseAttack +
      RAID_BOSS_ATTACK_IV
    ) *
    cpMultiplier
  )
}

export function calculateRaidBossDefense({
  baseDefense,
  cpMultiplier,
}) {
  if (
    !Number.isFinite(baseDefense)
  ) {
    throw new Error(
      'baseDefense must be a finite number.'
    )
  }

  if (
    !Number.isFinite(
      cpMultiplier
    ) ||
    cpMultiplier <= 0
  ) {
    throw new Error(
      'cpMultiplier must be greater than 0.'
    )
  }

  return (
    (
      baseDefense +
      RAID_BOSS_DEFENSE_IV
    ) *
    cpMultiplier
  )
}

// --------------------------------------------------
// Boss resolution
// --------------------------------------------------

export function createRaidBoss({
  pokemon,
  raidProfile,
}) {
  requirePokemon(
    pokemon
  )

  requireRaidProfile(
    raidProfile
  )

  const effectiveAttack =
    calculateRaidBossAttack({
      baseAttack:
        pokemon.stats.attack,

      cpMultiplier:
        raidProfile.cpMultiplier,
    })

  const effectiveDefense =
    calculateRaidBossDefense({
      baseDefense:
        pokemon.stats.defense,

      cpMultiplier:
        raidProfile.cpMultiplier,
    })

  return {
    ...pokemon,

    raidBoss: {
      profileId:
        raidProfile.id,

      profileName:
        raidProfile.name,

      hp:
        raidProfile.bossHp,

      maxHp:
        raidProfile.bossHp,

      timerSeconds:
        raidProfile.timerSeconds,

      cpMultiplier:
        raidProfile.cpMultiplier,

      attackIv:
        RAID_BOSS_ATTACK_IV,

      defenseIv:
        RAID_BOSS_DEFENSE_IV,

      effectiveAttack,

      effectiveDefense,
    },

    /**
     * These IV values let the existing damage engine
     * treat this object as a defender.
     *
     * The raid-specific CPM still needs to be passed
     * separately to calculatePokemonMoveDamage().
     */
    ivs: {
      attack:
        RAID_BOSS_ATTACK_IV,

      defense:
        RAID_BOSS_DEFENSE_IV,

      stamina: 15,
    },
  }
}