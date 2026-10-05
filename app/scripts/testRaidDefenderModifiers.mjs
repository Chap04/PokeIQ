import combatData from '../src/data/reference/combat.json' with { type: 'json' }

import {
  applyDefenseModifiers,
  calculatePokemonMoveDamage,
} from '../src/engine/Raid/damage.js'

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

function expectTrue(
  name,
  value
) {
  expectEqual(
    name,
    value,
    true
  )
}

function expectClose(
  name,
  actual,
  expected,
  tolerance =
    0.000001
) {
  expectTrue(
    name,
    Math.abs(
      actual -
      expected
    ) <=
      tolerance
  )
}

// --------------------------------------------------
// Fixtures
// --------------------------------------------------

const attacker = {
  id:
    'TEST_ATTACKER',

  types: [
    'NORMAL',
  ],

  stats: {
    attack:
      250,

    defense:
      150,

    stamina:
      200,
  },

  ivs: {
    attack:
      15,

    defense:
      15,

    stamina:
      15,
  },
}

const defender = {
  id:
    'TEST_DEFENDER',

  types: [
    'NORMAL',
  ],

  stats: {
    attack:
      200,

    defense:
      200,

    stamina:
      200,
  },

  ivs: {
    attack:
      15,

    defense:
      15,

    stamina:
      15,
  },
}

const move = {
  id:
    'TEST_NORMAL_MOVE',

  type:
    'NORMAL',

  power:
    100,

  energyDelta:
    -50,

  durationMs:
    2000,
}

const attackerCpm =
  0.79030001

const defenderCpm =
  0.79030001

const shadowDefenseModifier =
  combatData
    ?.modifiers
    ?.shadowDefense

// --------------------------------------------------
// Header
// --------------------------------------------------

console.log('')
console.log(
  '================================'
)
console.log(
  'RAID DEFENDER MODIFIER VALIDATION'
)
console.log(
  '================================'
)

// --------------------------------------------------
// Combat reference
// --------------------------------------------------

expectTrue(
  'Shadow Defense modifier exists',
  Number.isFinite(
    shadowDefenseModifier
  )
)

expectTrue(
  'Shadow Defense modifier is below 1',
  shadowDefenseModifier <
    1
)

// --------------------------------------------------
// Defense helper
// --------------------------------------------------

const normalDefenseState =
  applyDefenseModifiers({
    defenderDefense:
      200,

    defenderModifiers:
      [],
  })

expectEqual(
  'No modifiers preserve Defense',
  normalDefenseState
    .defense,
  200
)

expectEqual(
  'No modifiers produce scalar 1',
  normalDefenseState
    .modifier,
  1
)

const shadowDefenseState =
  applyDefenseModifiers({
    defenderDefense:
      200,

    defenderModifiers: [
      shadowDefenseModifier,
    ],
  })

expectClose(
  'Shadow Defense modifier lowers effective Defense',
  shadowDefenseState
    .defense,
  200 *
    shadowDefenseModifier
)

expectClose(
  'Shadow Defense scalar is preserved',
  shadowDefenseState
    .modifier,
  shadowDefenseModifier
)

// --------------------------------------------------
// Normal incoming damage
// --------------------------------------------------

const normalResult =
  calculatePokemonMoveDamage({
    attacker,

    defender,

    move,

    attackerCpMultiplier:
      attackerCpm,

    defenderCpMultiplier:
      defenderCpm,

    combatData,

    defenderModifiers:
      [],
  })

expectTrue(
  'Normal damage is positive',
  normalResult.damage >
    0
)

expectClose(
  'Normal defender Defense equals base Defense',
  normalResult
    .defenderDefense,
  normalResult
    .baseDefenderDefense
)

expectEqual(
  'Normal defender modifier is 1',
  normalResult
    .defenderModifier,
  1
)

// --------------------------------------------------
// Shadow incoming damage
// --------------------------------------------------

const shadowResult =
  calculatePokemonMoveDamage({
    attacker,

    defender,

    move,

    attackerCpMultiplier:
      attackerCpm,

    defenderCpMultiplier:
      defenderCpm,

    combatData,

    defenderModifiers: [
      shadowDefenseModifier,
    ],
  })

expectTrue(
  'Shadow defender takes more damage',
  shadowResult.damage >
    normalResult.damage
)

expectTrue(
  'Shadow effective Defense is lower',
  shadowResult
    .defenderDefense <
    normalResult
      .defenderDefense
)

expectClose(
  'Shadow effective Defense uses combat reference modifier',
  shadowResult
    .defenderDefense,
  normalResult
    .defenderDefense *
    shadowDefenseModifier
)

expectClose(
  'Shadow result exposes Defense modifier',
  shadowResult
    .defenderModifier,
  shadowDefenseModifier
)

// --------------------------------------------------
// Invalid modifier validation
// --------------------------------------------------

let rejectedZeroModifier =
  false

try {
  applyDefenseModifiers({
    defenderDefense:
      200,

    defenderModifiers: [
      0,
    ],
  })
} catch {
  rejectedZeroModifier =
    true
}

expectTrue(
  'Zero Defense modifier rejected',
  rejectedZeroModifier
)

let rejectedNegativeModifier =
  false

try {
  applyDefenseModifiers({
    defenderDefense:
      200,

    defenderModifiers: [
      -1,
    ],
  })
} catch {
  rejectedNegativeModifier =
    true
}

expectTrue(
  'Negative Defense modifier rejected',
  rejectedNegativeModifier
)

// --------------------------------------------------
// Diagnostic output
// --------------------------------------------------

console.log('')

console.log(
  `Shadow Defense modifier: ${shadowDefenseModifier}`
)

console.log(
  `Normal effective Defense: ${normalResult.defenderDefense.toFixed(4)}`
)

console.log(
  `Shadow effective Defense: ${shadowResult.defenderDefense.toFixed(4)}`
)

console.log(
  `Normal damage: ${normalResult.damage}`
)

console.log(
  `Shadow damage: ${shadowResult.damage}`
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