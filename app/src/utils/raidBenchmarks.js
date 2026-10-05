import pokemonReferenceData from '../data/reference/pokemon.json' with { type: 'json' }

// --------------------------------------------------
// Stable general-raid benchmark
// --------------------------------------------------

const BENCHMARK_DEFENSE = 200
const BENCHMARK_ATTACK = 200
const BENCHMARK_STAMINA = 200
const BENCHMARK_CPM = 0.79

function getReferenceTypes() {
  const types =
    new Set()

  pokemonReferenceData.forEach(
    (pokemon) => {
      if (
        !Array.isArray(
          pokemon?.types
        )
      ) {
        return
      }

      pokemon.types.forEach(
        (type) => {
          if (type) {
            types.add(
              type
            )
          }
        }
      )
    }
  )

  return [
    ...types,
  ].sort()
}

function buildBenchmarkDefender(
  type
) {
  return {
    id:
      `POKEIQ_RAID_BENCHMARK_${type}`,

    form:
      'BENCHMARK',

    types: [
      type,
    ],

    stats: {
      attack:
        BENCHMARK_ATTACK,

      defense:
        BENCHMARK_DEFENSE,

      stamina:
        BENCHMARK_STAMINA,
    },

    ivs: {
      attack: 15,
      defense: 15,
      stamina: 15,
    },

    raidBoss: {
      cpMultiplier:
        BENCHMARK_CPM,
    },
  }
}

export function buildRaidBenchmarks() {
  return getReferenceTypes().map(
    (type) => ({
      id:
        `TYPE_${type}`,

      label:
        `${type} benchmark`,

      defender:
        buildBenchmarkDefender(
          type
        ),
    })
  )
}