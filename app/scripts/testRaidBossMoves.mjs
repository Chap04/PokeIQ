import {
  buildRaidBossMoveSets,
  getRaidBossChargedMoveIds,
  getRaidBossFastMoveIds,
  resolveRaidBossMoves,
} from '../src/engine/Raid/bossMoves.js'

// --------------------------------------------------
// Test state
// --------------------------------------------------

let passed = 0
let failed = 0

function pass(
  name
) {
  passed += 1

  console.log(
    `PASS - ${name}`
  )
}

function fail(
  name,
  actual,
  expected
) {
  failed += 1

  console.log(
    `FAIL - ${name}`
  )

  console.log(
    `  Expected: ${expected}`
  )

  console.log(
    `  Actual:   ${actual}`
  )
}

function expectEqual(
  name,
  actual,
  expected
) {
  if (
    actual ===
    expected
  ) {
    pass(
      name
    )
  } else {
    fail(
      name,
      actual,
      expected
    )
  }
}

function expectArrayEqual(
  name,
  actual,
  expected
) {
  expectEqual(
    name,
    JSON.stringify(
      actual
    ),
    JSON.stringify(
      expected
    )
  )
}

// --------------------------------------------------
// Fixtures
// --------------------------------------------------

const testPokemon = {
  id:
    'TESTMON',

  form:
    'NORMAL',

  moves: {
    fast: {
      normal: [
        'FAST_A',
        'FAST_B',
      ],

      elite: [
        'FAST_ELITE',
      ],

      special: [
        'FAST_SPECIAL',
      ],
    },

    charged: {
      normal: [
        'CHARGED_A',
        'CHARGED_B',
      ],

      elite: [
        'CHARGED_ELITE',
      ],

      special: [
        'CHARGED_SPECIAL',
      ],
    },
  },
}

// --------------------------------------------------
// Normal pools
// --------------------------------------------------

console.log('')
console.log(
  '================================'
)
console.log(
  'RAID BOSS MOVE VALIDATION'
)
console.log(
  '================================'
)

expectArrayEqual(
  'Fast pool contains normal moves',
  getRaidBossFastMoveIds(
    testPokemon
  ),
  [
    'FAST_A',
    'FAST_B',
  ]
)

expectArrayEqual(
  'Charged pool contains normal moves',
  getRaidBossChargedMoveIds(
    testPokemon
  ),
  [
    'CHARGED_A',
    'CHARGED_B',
  ]
)

// --------------------------------------------------
// Elite / Special exclusion
// --------------------------------------------------

expectEqual(
  'Elite Fast Move excluded',
  getRaidBossFastMoveIds(
    testPokemon
  ).includes(
    'FAST_ELITE'
  ),
  false
)

expectEqual(
  'Special Fast Move excluded',
  getRaidBossFastMoveIds(
    testPokemon
  ).includes(
    'FAST_SPECIAL'
  ),
  false
)

expectEqual(
  'Elite Charged Move excluded',
  getRaidBossChargedMoveIds(
    testPokemon
  ).includes(
    'CHARGED_ELITE'
  ),
  false
)

expectEqual(
  'Special Charged Move excluded',
  getRaidBossChargedMoveIds(
    testPokemon
  ).includes(
    'CHARGED_SPECIAL'
  ),
  false
)

// --------------------------------------------------
// Cartesian product
// --------------------------------------------------

const moveSets =
  buildRaidBossMoveSets(
    testPokemon
  )

expectEqual(
  'Two Fast × two Charged produces four movesets',
  moveSets.length,
  4
)

expectArrayEqual(
  'Movesets preserve expected combinations',
  moveSets,
  [
    {
      fastMoveId:
        'FAST_A',

      chargedMoveId:
        'CHARGED_A',
    },

    {
      fastMoveId:
        'FAST_A',

      chargedMoveId:
        'CHARGED_B',
    },

    {
      fastMoveId:
        'FAST_B',

      chargedMoveId:
        'CHARGED_A',
    },

    {
      fastMoveId:
        'FAST_B',

      chargedMoveId:
        'CHARGED_B',
    },
  ]
)

// --------------------------------------------------
// Duplicate protection
// --------------------------------------------------

const duplicatePokemon = {
  moves: {
    fast: {
      normal: [
        'FAST_A',
        'FAST_A',
      ],
    },

    charged: {
      normal: [
        'CHARGED_A',
        'CHARGED_A',
      ],
    },
  },
}

expectArrayEqual(
  'Duplicate Fast Moves removed',
  getRaidBossFastMoveIds(
    duplicatePokemon
  ),
  [
    'FAST_A',
  ]
)

expectArrayEqual(
  'Duplicate Charged Moves removed',
  getRaidBossChargedMoveIds(
    duplicatePokemon
  ),
  [
    'CHARGED_A',
  ]
)

// --------------------------------------------------
// Resolution
// --------------------------------------------------

const resolved =
  resolveRaidBossMoves(
    testPokemon
  )

expectEqual(
  'Complete boss resolves READY',
  resolved.status,
  'READY'
)

expectEqual(
  'Resolved boss contains four movesets',
  resolved.moveSets.length,
  4
)

// --------------------------------------------------
// Missing data
// --------------------------------------------------

expectEqual(
  'Missing Pokémon rejected',
  resolveRaidBossMoves(
    null
  ).status,
  'INVALID_POKEMON'
)

expectEqual(
  'Missing Fast Moves reported',
  resolveRaidBossMoves({
    moves: {
      charged: {
        normal: [
          'CHARGED_A',
        ],
      },
    },
  }).status,
  'FAST_MOVES_MISSING'
)

expectEqual(
  'Missing Charged Moves reported',
  resolveRaidBossMoves({
    moves: {
      fast: {
        normal: [
          'FAST_A',
        ],
      },
    },
  }).status,
  'CHARGED_MOVES_MISSING'
)

// --------------------------------------------------
// Results
// --------------------------------------------------

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
  `${passed}/${passed + failed} tests passed`
)

if (
  failed > 0
) {
  process.exitCode = 1
}