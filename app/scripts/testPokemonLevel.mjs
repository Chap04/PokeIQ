import pokemonReferenceData from '../src/data/reference/pokemon.json' with {
  type: 'json',
}
import combatData from '../src/data/reference/combat.json' with {
  type: 'json',
}

const MAX_PLAYER_LEVEL = 51

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

function getCpmForLevel(level) {
  return (
    combatData.cpMultipliers.allLevels[
      String(level)
    ] ?? null
  )
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

function getPokemon(id, form = 'NORMAL') {
  const pokemon = pokemonReferenceData.find(
    (candidate) =>
      candidate.id === id &&
      candidate.form === form
  )

  if (!pokemon) {
    throw new Error(
      `Could not find ${id} ${form}`
    )
  }

  return pokemon
}

let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`)
    passed += 1
  } else {
    console.error(`✗ ${message}`)
    failed += 1
  }
}

function testKnownPokemon({
  id,
  form = 'NORMAL',
  level,
  attackIv,
  defenseIv,
  staminaIv,
}) {
  const pokemon = getPokemon(id, form)
  const cpm = getCpmForLevel(level)

  if (!cpm) {
    throw new Error(
      `No CPM found for level ${level}`
    )
  }

  const cp = calculatePokemonCp({
    baseAttack: pokemon.stats.attack,
    baseDefense: pokemon.stats.defense,
    baseStamina: pokemon.stats.stamina,
    attackIv,
    defenseIv,
    staminaIv,
    cpm,
  })

  const result = inferPokemonLevel({
    cp,
    baseAttack: pokemon.stats.attack,
    baseDefense: pokemon.stats.defense,
    baseStamina: pokemon.stats.stamina,
    attackIv,
    defenseIv,
    staminaIv,
  })

  console.log(
    `\n${id} ${form} — Level ${level}, ` +
      `${attackIv}/${defenseIv}/${staminaIv}, CP ${cp}`
  )

  console.log('Inference:', result)

  const containsExpectedLevel =
    result.candidates.some(
      (candidate) =>
        candidate.level === level
    )

  assert(
    containsExpectedLevel,
    `${id} result includes level ${level}`
  )

  if (result.status === 'EXACT') {
    assert(
      result.level === level,
      `${id} uniquely resolves to level ${level}`
    )
  } else {
    console.log(
      `  → ${result.status}: ${result.candidates
        .map((candidate) => candidate.level)
        .join(', ')}`
    )
  }
}

console.log(
  '\n================================'
)
console.log('POKÉMON LEVEL VALIDATION')
console.log(
  '================================'
)

testKnownPokemon({
  id: 'RAYQUAZA',
  level: 40,
  attackIv: 15,
  defenseIv: 15,
  staminaIv: 15,
})

testKnownPokemon({
  id: 'RAYQUAZA',
  level: 20,
  attackIv: 10,
  defenseIv: 10,
  staminaIv: 10,
})

testKnownPokemon({
  id: 'ARCANINE',
  level: 25,
  attackIv: 12,
  defenseIv: 14,
  staminaIv: 13,
})

testKnownPokemon({
  id: 'SNEASEL',
  form: 'SNEASEL_HISUIAN',
  level: 30.5,
  attackIv: 7,
  defenseIv: 11,
  staminaIv: 15,
})

testKnownPokemon({
  id: 'MEWTWO',
  level: 50,
  attackIv: 15,
  defenseIv: 15,
  staminaIv: 15,
})

console.log(
  '\n================================'
)
console.log(
  `Passed: ${passed}`
)
console.log(
  `Failed: ${failed}`
)
console.log(
  '================================\n'
)

if (failed > 0) {
  process.exitCode = 1
}