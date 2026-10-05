import combatData from '../data/reference/combat.json' with { type: 'json' }

const MIN_PLAYER_LEVEL = 1
const MAX_PLAYER_LEVEL = 51

export function calculatePokemonCp({
  baseAttack,
  baseDefense,
  baseStamina,
  attackIv,
  defenseIv,
  staminaIv,
  cpm,
}) {
  if (
    baseAttack == null ||
    baseDefense == null ||
    baseStamina == null ||
    attackIv == null ||
    defenseIv == null ||
    staminaIv == null ||
    cpm == null
  ) {
    return null
  }

  const attack = baseAttack + attackIv
  const defense = baseDefense + defenseIv
  const stamina = baseStamina + staminaIv

  const rawCp =
    (attack *
      Math.sqrt(defense) *
      Math.sqrt(stamina) *
      cpm *
      cpm) /
    10

  return Math.max(10, Math.floor(rawCp))
}

export function getCpmForLevel(level) {
  if (level == null) {
    return null
  }

  return (
    combatData.cpMultipliers?.allLevels?.[
      String(level)
    ] ?? null
  )
}

export function getPlayerLevelEntries({
  minLevel = MIN_PLAYER_LEVEL,
  maxLevel = MAX_PLAYER_LEVEL,
} = {}) {
  const allLevels =
    combatData.cpMultipliers?.allLevels ?? {}

  return Object.entries(allLevels)
    .map(([level, cpm]) => ({
      level: Number(level),
      cpm,
    }))
    .filter(
      ({ level }) =>
        Number.isFinite(level) &&
        level >= minLevel &&
        level <= maxLevel
    )
    .sort((a, b) => a.level - b.level)
}

export function inferPokemonLevel({
  cp,
  baseAttack,
  baseDefense,
  baseStamina,
  attackIv,
  defenseIv,
  staminaIv,
  minLevel = MIN_PLAYER_LEVEL,
  maxLevel = MAX_PLAYER_LEVEL,
}) {
  if (
    cp == null ||
    baseAttack == null ||
    baseDefense == null ||
    baseStamina == null ||
    attackIv == null ||
    defenseIv == null ||
    staminaIv == null
  ) {
    return null
  }

  const targetCp = Number(cp)

  if (!Number.isFinite(targetCp) || targetCp < 10) {
    return null
  }

  const levelEntries = getPlayerLevelEntries({
    minLevel,
    maxLevel,
  })

  const matches = levelEntries
    .map(({ level, cpm }) => {
      const calculatedCp = calculatePokemonCp({
        baseAttack,
        baseDefense,
        baseStamina,
        attackIv,
        defenseIv,
        staminaIv,
        cpm,
      })

      return {
        level,
        cpm,
        calculatedCp,
        cpDifference: Math.abs(
          calculatedCp - targetCp
        ),
      }
    })
    .filter(
      ({ calculatedCp }) =>
        calculatedCp === targetCp
    )

  if (matches.length === 0) {
    return {
      status: 'NO_EXACT_MATCH',
      level: null,
      cpm: null,
      calculatedCp: null,
      candidates: [],
    }
  }

  if (matches.length === 1) {
    const match = matches[0]

    return {
      status: 'EXACT',
      level: match.level,
      cpm: match.cpm,
      calculatedCp: match.calculatedCp,
      candidates: matches,
    }
  }

  return {
    status: 'AMBIGUOUS',
    level: null,
    cpm: null,
    calculatedCp: targetCp,
    candidates: matches,
  }
}

export function calculatePokemonStats({
  baseAttack,
  baseDefense,
  baseStamina,
  attackIv,
  defenseIv,
  staminaIv,
  cpm,
}) {
  if (
    baseAttack == null ||
    baseDefense == null ||
    baseStamina == null ||
    attackIv == null ||
    defenseIv == null ||
    staminaIv == null ||
    cpm == null
  ) {
    return null
  }

  return {
    attack: (baseAttack + attackIv) * cpm,
    defense: (baseDefense + defenseIv) * cpm,
    stamina: Math.floor(
      (baseStamina + staminaIv) * cpm
    ),
  }
}