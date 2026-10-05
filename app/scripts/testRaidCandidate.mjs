import { buildRaidCandidate } from '../src/utils/raidCandidate.js'

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function printResult(name, passed, details = '') {
  const status = passed ? 'PASS' : 'FAIL'

  console.log(
    `${status} - ${name}${
      details ? `: ${details}` : ''
    }`
  )
}

function runTest(name, testFn) {
  try {
    testFn()
    printResult(name, true)
    return true
  } catch (error) {
    printResult(
      name,
      false,
      error.message
    )
    return false
  }
}

const tests = []

tests.push([
  'Ready Pokémon builds one loadout',
  () => {
    const pokemon = {
      pokemonId: 'RAYQUAZA',
      pokemonForm: 'NORMAL',
      pokemonIdentity:
        'RAYQUAZA__NORMAL',

      cp: 3835,

      ivs: {
        attack: 15,
        defense: 15,
        stamina: 15,
      },

      fastMoveId:
        'DRAGON_TAIL_FAST',

      chargedMove1Id:
        'OUTRAGE',

      chargedMove2Id: null,

      shiny: false,
      shadow: false,
      purified: false,
      lucky: false,
    }

    const result =
      buildRaidCandidate(pokemon)

    assert(
      result.status === 'READY',
      `Expected READY, got ${result.status}`
    )

    assert(
      result.level === 40,
      `Expected level 40, got ${result.level}`
    )

    assert(
      result.loadouts.length === 1,
      `Expected 1 loadout, got ${result.loadouts.length}`
    )

    assert(
      result.loadouts[0].fastMoveId ===
        'DRAGON_TAIL_FAST',
      'Fast move did not match'
    )

    assert(
      result.loadouts[0]
        .chargedMoveId ===
        'OUTRAGE',
      'Charged move did not match'
    )
  },
])

tests.push([
  'Two charged moves build two loadouts',
  () => {
    const pokemon = {
      pokemonId: 'RAYQUAZA',
      pokemonForm: 'NORMAL',
      pokemonIdentity:
        'RAYQUAZA__NORMAL',

      cp: 3835,

      ivs: {
        attack: 15,
        defense: 15,
        stamina: 15,
      },

      fastMoveId:
        'DRAGON_TAIL_FAST',

      chargedMove1Id:
        'OUTRAGE',

      chargedMove2Id:
        'BREAKING_SWIPE',

      shiny: false,
      shadow: false,
      purified: false,
      lucky: false,
    }

    const result =
      buildRaidCandidate(pokemon)

    assert(
      result.status === 'READY',
      `Expected READY, got ${result.status}`
    )

    assert(
      result.loadouts.length === 2,
      `Expected 2 loadouts, got ${result.loadouts.length}`
    )

    const chargedMoves =
      result.loadouts.map(
        (loadout) =>
          loadout.chargedMoveId
      )

    assert(
      chargedMoves.includes(
        'OUTRAGE'
      ),
      'Outrage loadout missing'
    )

    assert(
      chargedMoves.includes(
        'BREAKING_SWIPE'
      ),
      'Breaking Swipe loadout missing'
    )
  },
])

tests.push([
  'Missing fast move is rejected',
  () => {
    const pokemon = {
      pokemonId: 'RAYQUAZA',
      pokemonForm: 'NORMAL',
      pokemonIdentity:
        'RAYQUAZA__NORMAL',

      cp: 3835,

      ivs: {
        attack: 15,
        defense: 15,
        stamina: 15,
      },

      fastMoveId: null,

      chargedMove1Id:
        'OUTRAGE',

      chargedMove2Id: null,
    }

    const result =
      buildRaidCandidate(pokemon)

    assert(
      result.status ===
        'FAST_MOVE_MISSING',
      `Expected FAST_MOVE_MISSING, got ${result.status}`
    )

    assert(
      result.loadouts.length === 0,
      'Expected no loadouts'
    )
  },
])

tests.push([
  'Missing charged move is rejected',
  () => {
    const pokemon = {
      pokemonId: 'RAYQUAZA',
      pokemonForm: 'NORMAL',
      pokemonIdentity:
        'RAYQUAZA__NORMAL',

      cp: 3835,

      ivs: {
        attack: 15,
        defense: 15,
        stamina: 15,
      },

      fastMoveId:
        'DRAGON_TAIL_FAST',

      chargedMove1Id: null,
      chargedMove2Id: null,
    }

    const result =
      buildRaidCandidate(pokemon)

    assert(
      result.status ===
        'CHARGED_MOVE_MISSING',
      `Expected CHARGED_MOVE_MISSING, got ${result.status}`
    )

    assert(
      result.loadouts.length === 0,
      'Expected no loadouts'
    )
  },
])

tests.push([
  'Invalid fast move is rejected',
  () => {
    const pokemon = {
      pokemonId: 'RAYQUAZA',
      pokemonForm: 'NORMAL',
      pokemonIdentity:
        'RAYQUAZA__NORMAL',

      cp: 3835,

      ivs: {
        attack: 15,
        defense: 15,
        stamina: 15,
      },

      fastMoveId:
        'VINE_WHIP_FAST',

      chargedMove1Id:
        'OUTRAGE',

      chargedMove2Id: null,
    }

    const result =
      buildRaidCandidate(pokemon)

    assert(
      result.status ===
        'FAST_MOVE_INVALID',
      `Expected FAST_MOVE_INVALID, got ${result.status}`
    )
  },
])

tests.push([
  'Invalid charged move is rejected',
  () => {
    const pokemon = {
      pokemonId: 'RAYQUAZA',
      pokemonForm: 'NORMAL',
      pokemonIdentity:
        'RAYQUAZA__NORMAL',

      cp: 3835,

      ivs: {
        attack: 15,
        defense: 15,
        stamina: 15,
      },

      fastMoveId:
        'DRAGON_TAIL_FAST',

      chargedMove1Id:
        'HYDRO_CANNON',

      chargedMove2Id: null,
    }

    const result =
      buildRaidCandidate(pokemon)

    assert(
      result.status ===
        'CHARGED_MOVE_INVALID',
      `Expected CHARGED_MOVE_INVALID, got ${result.status}`
    )
  },
])

tests.push([
  'One valid and one invalid charged move keeps valid loadout',
  () => {
    const pokemon = {
      pokemonId: 'RAYQUAZA',
      pokemonForm: 'NORMAL',
      pokemonIdentity:
        'RAYQUAZA__NORMAL',

      cp: 3835,

      ivs: {
        attack: 15,
        defense: 15,
        stamina: 15,
      },

      fastMoveId:
        'DRAGON_TAIL_FAST',

      chargedMove1Id:
        'OUTRAGE',

      chargedMove2Id:
        'HYDRO_CANNON',
    }

    const result =
      buildRaidCandidate(pokemon)

    assert(
      result.status === 'READY',
      `Expected READY, got ${result.status}`
    )

    assert(
      result.loadouts.length === 1,
      `Expected 1 valid loadout, got ${result.loadouts.length}`
    )

    assert(
      result.loadouts[0]
        .chargedMoveId ===
        'OUTRAGE',
      'Expected Outrage to remain'
    )

    assert(
      result.invalidChargedMoves
        .includes(
          'HYDRO_CANNON'
        ),
      'Expected invalid charged move to be reported'
    )
  },
])

tests.push([
  'Combat state failure is propagated',
  () => {
    const pokemon = {
      pokemonId: 'RAYQUAZA',
      pokemonForm: 'NORMAL',
      pokemonIdentity:
        'RAYQUAZA__NORMAL',

      cp: 1,

      ivs: {
        attack: 15,
        defense: 15,
        stamina: 15,
      },

      fastMoveId:
        'DRAGON_TAIL_FAST',

      chargedMove1Id:
        'OUTRAGE',
    }

    const result =
      buildRaidCandidate(pokemon)

    assert(
      result.status ===
        'COMBAT_STATE_NOT_READY',
      `Expected COMBAT_STATE_NOT_READY, got ${result.status}`
    )

    assert(
      result.combatStateStatus ===
        'LEVEL_INFERENCE_FAILED',
      `Expected LEVEL_INFERENCE_FAILED, got ${result.combatStateStatus}`
    )
  },
])

console.log(
  '\n================================'
)

console.log(
  'RAID CANDIDATE VALIDATION'
)

console.log(
  '================================\n'
)

let passed = 0

for (const [name, testFn] of tests) {
  if (runTest(name, testFn)) {
    passed += 1
  }
}

console.log(
  `\n${passed}/${tests.length} tests passed.`
)

if (passed !== tests.length) {
  process.exitCode = 1
}