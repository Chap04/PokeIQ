import pokemonReferenceData from '../src/data/reference/pokemon.json' with {
  type: 'json',
}
import combatData from '../src/data/reference/combat.json' with {
  type: 'json',
}

const MAX_PLAYER_LEVEL = 51

function getPokemonIdentity(pokemon) {
  return `${pokemon.id}__${pokemon.form ?? 'NORMAL'}`
}

function getPokemonReferenceByIdentity(identity) {
  return (
    pokemonReferenceData.find(
      (pokemon) =>
        getPokemonIdentity(pokemon) === identity
    ) ?? null
  )
}

function calculatePokemonCp({
  baseAttack,
  baseDefense,
  baseStamina,
  attackIv,
  defenseIv,
  staminaIv,
  cpm,
}) {
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

function inferPokemonLevel({
  cp,
  baseAttack,
  baseDefense,
  baseStamina,
  attackIv,
  defenseIv,
  staminaIv,
}) {
  const matches = Object.entries(
    combatData.cpMultipliers.allLevels
  )
    .map(([level, cpm]) => ({
      level: Number(level),
      cpm,
    }))
    .filter(
      ({ level }) =>
        level >= 1 &&
        level <= MAX_PLAYER_LEVEL
    )
    .sort((a, b) => a.level - b.level)
    .map(({ level, cpm }) => ({
      level,
      cpm,
      calculatedCp: calculatePokemonCp({
        baseAttack,
        baseDefense,
        baseStamina,
        attackIv,
        defenseIv,
        staminaIv,
        cpm,
      }),
    }))
    .filter(
      ({ calculatedCp }) =>
        calculatedCp === cp
    )

  if (matches.length === 0) {
    return {
      status: 'NO_EXACT_MATCH',
      candidates: [],
    }
  }

  if (matches.length === 1) {
    return {
      status: 'EXACT',
      level: matches[0].level,
      cpm: matches[0].cpm,
      candidates: matches,
    }
  }

  return {
    status: 'AMBIGUOUS',
    level: null,
    cpm: null,
    candidates: matches,
  }
}

function calculatePokemonStats({
  baseAttack,
  baseDefense,
  baseStamina,
  attackIv,
  defenseIv,
  staminaIv,
  cpm,
}) {
  return {
    attack: (baseAttack + attackIv) * cpm,
    defense: (baseDefense + defenseIv) * cpm,
    stamina: Math.floor(
      (baseStamina + staminaIv) * cpm
    ),
  }
}

function getPokemonCombatState(ownedPokemon) {
  const {
    pokemonIdentity,
    cp,
    ivs,
  } = ownedPokemon

  const attackIv = ivs?.attack
  const defenseIv = ivs?.defense
  const staminaIv = ivs?.stamina

  const reference =
    getPokemonReferenceByIdentity(
      pokemonIdentity
    )

  if (!reference) {
    return {
      status: 'REFERENCE_NOT_FOUND',
    }
  }

  const levelResult = inferPokemonLevel({
    cp,
    baseAttack: reference.stats.attack,
    baseDefense: reference.stats.defense,
    baseStamina: reference.stats.stamina,
    attackIv,
    defenseIv,
    staminaIv,
  })

  if (levelResult.status !== 'EXACT') {
    return {
      status: levelResult.status,
      candidates:
        levelResult.candidates ?? [],
    }
  }

  const stats = calculatePokemonStats({
    baseAttack: reference.stats.attack,
    baseDefense: reference.stats.defense,
    baseStamina: reference.stats.stamina,
    attackIv,
    defenseIv,
    staminaIv,
    cpm: levelResult.cpm,
  })

  return {
    status: 'READY',
    reference,
    level: levelResult.level,
    cpm: levelResult.cpm,
    stats,
    moves: {
      fast: ownedPokemon.fastMoveId ?? null,
      charged: [
        ownedPokemon.chargedMove1Id,
        ownedPokemon.chargedMove2Id,
      ].filter(Boolean),
    },
    traits: {
      shadow: ownedPokemon.shadow === true,
      purified:
        ownedPokemon.purified === true,
      lucky: ownedPokemon.lucky === true,
      shiny: ownedPokemon.shiny === true,
    },
  }
}

const rayquaza =
  getPokemonReferenceByIdentity(
    'RAYQUAZA__NORMAL'
  )

const level = 40
const cpm =
  combatData.cpMultipliers.allLevels[
    String(level)
  ]

const ownedRayquaza = {
  id: 'test-rayquaza',
  pokemonId: 'RAYQUAZA',
  pokemonForm: 'NORMAL',
  pokemonIdentity: 'RAYQUAZA__NORMAL',
  name: 'Rayquaza',

  cp: calculatePokemonCp({
    baseAttack: rayquaza.stats.attack,
    baseDefense: rayquaza.stats.defense,
    baseStamina: rayquaza.stats.stamina,
    attackIv: 15,
    defenseIv: 15,
    staminaIv: 15,
    cpm,
  }),

  ivs: {
    attack: 15,
    defense: 15,
    stamina: 15,
  },

  fastMoveId: 'DRAGON_TAIL_FAST',
  chargedMove1Id: 'OUTRAGE',
  chargedMove2Id: 'BREAKING_SWIPE',

  shiny: true,
  shadow: false,
  purified: false,
  lucky: false,
  favorite: true,
}

console.log(
  '\n================================'
)
console.log('POKÉMON COMBAT STATE VALIDATION')
console.log(
  '================================\n'
)

console.log('Owned Pokémon:')
console.log(ownedRayquaza)

const combatState =
  getPokemonCombatState(
    ownedRayquaza
  )

console.log('\nCombat State:')
console.dir(combatState, {
  depth: null,
})

console.log(
  '\n================================'
)

if (
  combatState.status === 'READY' &&
  combatState.level === 40 &&
  combatState.moves.fast ===
    'DRAGON_TAIL_FAST' &&
  combatState.moves.charged.length === 2 &&
  combatState.traits.shiny === true
) {
  console.log('✓ Combat state validation passed')
} else {
  console.error(
    '✗ Combat state validation failed'
  )

  process.exitCode = 1
}

console.log(
  '================================\n'
)