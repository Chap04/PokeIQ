import fs from 'node:fs/promises'
import path from 'node:path'
import {
  fileURLToPath,
} from 'node:url'

import {
  getAvailabilityId,
  getPokemonAvailability,
  isPokemonReleased,
  isPokemonPlayerUsable,
  filterPlayerUsablePokemon,
  inspectPokemonAvailability,
} from '../src/engine/pokemon/availability.js'

// --------------------------------------------------
// Test state
// --------------------------------------------------

let passed = 0
let failed = 0

// --------------------------------------------------
// Test helpers
// --------------------------------------------------

function expectEqual(
  name,
  actual,
  expected
) {
  if (actual === expected) {
    passed += 1
    console.log(
      `✅ ${name}`
    )
  } else {
    failed += 1
    console.log(
      `❌ ${name}`
    )

    console.log(
      `   Expected: ${expected}`
    )

    console.log(
      `   Actual:   ${actual}`
    )
  }
}

// --------------------------------------------------
// Paths
// --------------------------------------------------

const __filename =
  fileURLToPath(
    import.meta.url
  )

const __dirname =
  path.dirname(
    __filename
  )

const REFERENCE_DIR =
  path.resolve(
    __dirname,
    '../src/data/reference'
  )

// --------------------------------------------------
// File helpers
// --------------------------------------------------

async function readJson(
  filename
) {
  const contents =
    await fs.readFile(
      path.join(
        REFERENCE_DIR,
        filename
      ),
      'utf8'
    )

  return JSON.parse(
    contents
  )
}

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  console.log(
    'Testing PokeIQ Pokémon Availability Engine...'
  )

  const availabilityData =
    await readJson(
      'pokemon-availability.json'
    )

  // Use isolated test data so this test remains
  // deterministic while the real availability
  // dataset is still being built.

  const testAvailabilityData = {
    ...availabilityData,

    defaultPlayerUsable:
      false,

    overrides: {
      RAYQUAZA: {
        released: true,
        playerUsable: true,
      },

      NECROZMA__NECROZMA_ULTRA: {
        released: false,
        playerUsable: false,
      },

      TEST_RELEASED_UNUSABLE: {
        released: true,
        playerUsable: false,
      },
    },
  }

  const rayquaza = {
    id:
      'RAYQUAZA',

    form:
      'NORMAL',
  }

  const ultraNecrozma = {
    id:
      'NECROZMA',

    form:
      'NECROZMA_ULTRA',
  }

  const unknownPokemon = {
    id:
      'TOTALLY_UNKNOWN',

    form:
      'NORMAL',
  }

  const releasedUnusable = {
    id:
      'TEST_RELEASED_UNUSABLE',

    form:
      'NORMAL',
  }

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'ID RESOLUTION'
  )
  console.log(
    '================================'
  )

  expectEqual(
    'Normal form uses species ID',
    getAvailabilityId(
      rayquaza
    ),
    'RAYQUAZA'
  )

  expectEqual(
    'Alternate form uses species + form',
    getAvailabilityId(
      ultraNecrozma
    ),
    'NECROZMA__NECROZMA_ULTRA'
  )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'EXPLICIT AVAILABILITY'
  )
  console.log(
    '================================'
  )

  expectEqual(
    'Rayquaza is released',
    isPokemonReleased(
      rayquaza,
      testAvailabilityData
    ),
    true
  )

  expectEqual(
    'Rayquaza is player usable',
    isPokemonPlayerUsable(
      rayquaza,
      testAvailabilityData
    ),
    true
  )

  expectEqual(
    'Ultra Necrozma is not released',
    isPokemonReleased(
      ultraNecrozma,
      testAvailabilityData
    ),
    false
  )

  expectEqual(
    'Ultra Necrozma is not player usable',
    isPokemonPlayerUsable(
      ultraNecrozma,
      testAvailabilityData
    ),
    false
  )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'FAIL-CLOSED DEFAULT'
  )
  console.log(
    '================================'
  )

  const unknownAvailability =
    getPokemonAvailability(
      unknownPokemon,
      testAvailabilityData
    )

  expectEqual(
    'Unknown Pokémon is not released',
    unknownAvailability.released,
    false
  )

  expectEqual(
    'Unknown Pokémon is not player usable',
    unknownAvailability.playerUsable,
    false
  )

  expectEqual(
    'Unknown Pokémon is not explicit',
    unknownAvailability.explicit,
    false
  )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'RELEASED VS PLAYER-USABLE'
  )
  console.log(
    '================================'
  )

  expectEqual(
    'Released Pokémon can still be unusable',
    isPokemonReleased(
      releasedUnusable,
      testAvailabilityData
    ),
    true
  )

  expectEqual(
    'Released/unusable Pokémon is excluded',
    isPokemonPlayerUsable(
      releasedUnusable,
      testAvailabilityData
    ),
    false
  )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'FILTERING'
  )
  console.log(
    '================================'
  )

  const candidates = [
    {
      id:
        'rayquaza-candidate',

      pokemon:
        rayquaza,
    },

    {
      id:
        'ultra-necrozma-candidate',

      pokemon:
        ultraNecrozma,
    },

    {
      id:
        'unknown-candidate',

      pokemon:
        unknownPokemon,
    },
  ]

  const usable =
    filterPlayerUsablePokemon(
      candidates,
      testAvailabilityData
    )

  expectEqual(
    'Only one candidate survives',
    usable.length,
    1
  )

  expectEqual(
    'Rayquaza survives filtering',
    usable[0].id,
    'rayquaza-candidate'
  )

  const inspection =
    inspectPokemonAvailability(
      candidates,
      testAvailabilityData
    )

  expectEqual(
    'Inspection finds one usable candidate',
    inspection.usable.length,
    1
  )

  expectEqual(
    'Inspection finds two unavailable candidates',
    inspection.unavailable.length,
    2
  )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'TEST RESULTS'
  )
  console.log(
    '================================'
  )

  console.log(
    `Passed: ${passed}`
  )

  console.log(
    `Failed: ${failed}`
  )

  console.log(
    `Total: ${passed + failed}`
  )

  console.log('')

  if (failed === 0) {
    console.log(
      `🎉 ${passed}/${passed} tests passed.`
    )

    console.log(
      'Pokémon Availability V1 validation successful.'
    )
  } else {
    console.log(
      `❌ ${failed} test(s) failed.`
    )

    process.exitCode = 1
  }
}

// --------------------------------------------------
// Run
// --------------------------------------------------

main().catch(
  (error) => {
    console.error('')
    console.error(
      'Pokémon availability test failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)