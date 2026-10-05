import moves from '../src/data/reference/moves-pve.json' with { type: 'json' }
import combatData from '../src/data/reference/combat.json' with { type: 'json' }

import {
  createRaidBoss,
} from '../src/engine/Raid/boss.js'

import {
  evaluateRaidBossPressure,
  RAID_BOSS_PRESSURE_STATUS,
} from '../src/engine/Raid/bossPressure.js'

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

const bossReference = {
  id:
    'TEST_BOSS',

  form:
    'NORMAL',

  types: [
    'NORMAL',
  ],

  stats: {
    attack:
      250,

    defense:
      180,

    stamina:
      200,
  },

  moves: {
    fast: {
      normal: [
        'TACKLE_FAST',
      ],
    },

    charged: {
      normal: [
        'HYPER_BEAM',
      ],
    },
  },
}

const raidProfile = {
  id:
    'TEST_TIER',

  name:
    'Test Tier',

  bossHp:
    15000,

  cpMultiplier:
    0.79,

  timerSeconds:
    300,
}

const boss =
  createRaidBoss({
    pokemon:
      bossReference,

    raidProfile,
  })

function buildCandidate({
  shadow,
}) {
  return {
    status:
      'READY',

    cpm:
      0.79030001,

    ivs: {
      attack:
        15,

      defense:
        15,

      stamina:
        15,
    },

    traits: {
      shadow:
        shadow ===
        true,

      purified:
        false,

      lucky:
        false,

      shiny:
        false,
    },

    reference: {
      id:
        'TEST_DEFENDER',

      form:
        'NORMAL',

      types: [
        'NORMAL',
      ],

      stats: {
        attack:
          220,

        defense:
          200,

        stamina:
          200,
      },
    },
  }
}

const normalCandidate =
  buildCandidate({
    shadow:
      false,
  })

const shadowCandidate =
  buildCandidate({
    shadow:
      true,
  })

// --------------------------------------------------
// Header
// --------------------------------------------------

console.log('')
console.log(
  '================================'
)
console.log(
  'RAID BOSS SHADOW PRESSURE VALIDATION'
)
console.log(
  '================================'
)

// --------------------------------------------------
// Evaluate normal
// --------------------------------------------------

const normalResult =
  evaluateRaidBossPressure({
    boss,

    defenderCandidate:
      normalCandidate,

    moves,

    combatData,
  })

expectEqual(
  'Normal defender pressure succeeds',
  normalResult.status,
  RAID_BOSS_PRESSURE_STATUS
    .SUCCESS
)

expectEqual(
  'Normal defender has one scenario',
  normalResult
    .scenarios
    .length,
  1
)

// --------------------------------------------------
// Evaluate Shadow
// --------------------------------------------------

const shadowResult =
  evaluateRaidBossPressure({
    boss,

    defenderCandidate:
      shadowCandidate,

    moves,

    combatData,
  })

expectEqual(
  'Shadow defender pressure succeeds',
  shadowResult.status,
  RAID_BOSS_PRESSURE_STATUS
    .SUCCESS
)

expectEqual(
  'Shadow defender has one scenario',
  shadowResult
    .scenarios
    .length,
  1
)

// --------------------------------------------------
// Compare
// --------------------------------------------------

const normalScenario =
  normalResult
    .scenarios[0]

const shadowScenario =
  shadowResult
    .scenarios[0]

expectTrue(
  'Shadow defender takes more Fast Move damage',
  shadowScenario
    .fastMove
    .damage >
    normalScenario
      .fastMove
      .damage
)

expectTrue(
  'Shadow defender takes more Charged Move damage',
  shadowScenario
    .chargedMove
    .damage >
    normalScenario
      .chargedMove
      .damage
)

expectTrue(
  'Shadow defender has greater incoming Cycle DPS',
  shadowScenario
    .cycleDps >
    normalScenario
      .cycleDps
)

expectEqual(
  'Normal defender has no Defense modifiers',
  normalScenario
    .defenderModifiers
    .length,
  0
)

expectEqual(
  'Shadow defender has one Defense modifier',
  shadowScenario
    .defenderModifiers
    .length,
  1
)

expectClose(
  'Shadow defender uses reference Shadow Defense scalar',
  shadowScenario
    .defenderModifiers[0],
  combatData
    .modifiers
    .shadowDefense
)

// --------------------------------------------------
// Damage detail propagation
// --------------------------------------------------

expectEqual(
  'Normal Fast damage detail exposes defender modifier 1',
  normalScenario
    .performance
    .fastMove
    .damageDetails
    .defenderModifier,
  1
)

expectClose(
  'Shadow Fast damage detail exposes Shadow modifier',
  shadowScenario
    .performance
    .fastMove
    .damageDetails
    .defenderModifier,
  combatData
    .modifiers
    .shadowDefense
)

expectClose(
  'Shadow Charged damage detail exposes Shadow modifier',
  shadowScenario
    .performance
    .chargedMove
    .damageDetails
    .defenderModifier,
  combatData
    .modifiers
    .shadowDefense
)

// --------------------------------------------------
// Diagnostic output
// --------------------------------------------------

console.log('')

console.log(
  `Normal Fast damage: ${normalScenario.fastMove.damage}`
)

console.log(
  `Shadow Fast damage: ${shadowScenario.fastMove.damage}`
)

console.log(
  `Normal Charged damage: ${normalScenario.chargedMove.damage}`
)

console.log(
  `Shadow Charged damage: ${shadowScenario.chargedMove.damage}`
)

console.log(
  `Normal incoming DPS: ${normalScenario.cycleDps.toFixed(4)}`
)

console.log(
  `Shadow incoming DPS: ${shadowScenario.cycleDps.toFixed(4)}`
)

console.log(
  `Shadow Defense modifier: ${shadowScenario.defenderModifiers[0]}`
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