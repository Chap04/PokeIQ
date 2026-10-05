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

function expectFinite(
  name,
  value
) {
  expectEqual(
    name,
    Number.isFinite(
      value
    ),
    true
  )
}

// --------------------------------------------------
// Fixtures
// --------------------------------------------------

const bossReference = {
  id:
    'TEST_MEWTWO',

  form:
    'NORMAL',

  types: [
    'PSYCHIC',
  ],

  stats: {
    attack:
      300,

    defense:
      182,

    stamina:
      214,
  },

  moves: {
    fast: {
      normal: [
        'PSYCHO_CUT_FAST',
      ],

      elite: [],
      special: [],
    },

    charged: {
      normal: [
        'PSYCHIC',
        'FOCUS_BLAST',
      ],

      elite: [],
      special: [],
    },
  },
}

const raidProfile = {
  id:
    'TEST_TIER_5',

  name:
    'Test Tier 5',

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

/**
 * Deliberately Dark / Dragon.
 *
 * Psychic is resisted because of Dark.
 * Fighting is super effective against Dark.
 *
 * That gives us a useful controlled validation that
 * boss move typing actually changes incoming pressure.
 */
const hydreigonLikeCandidate = {
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

  reference: {
    id:
      'TEST_HYDREIGON',

    form:
      'NORMAL',

    types: [
      'DARK',
      'DRAGON',
    ],

    stats: {
      attack:
        256,

      defense:
        188,

      stamina:
        211,
    },
  },
}

// --------------------------------------------------
// Validation
// --------------------------------------------------

console.log('')
console.log(
  '================================'
)
console.log(
  'RAID BOSS PRESSURE VALIDATION'
)
console.log(
  '================================'
)

expectEqual(
  'Invalid boss rejected',
  evaluateRaidBossPressure({
    boss:
      null,

    defenderCandidate:
      hydreigonLikeCandidate,

    moves,

    combatData,
  }).status,
  RAID_BOSS_PRESSURE_STATUS
    .INVALID_BOSS
)

expectEqual(
  'Invalid defender rejected',
  evaluateRaidBossPressure({
    boss,

    defenderCandidate:
      null,

    moves,

    combatData,
  }).status,
  RAID_BOSS_PRESSURE_STATUS
    .INVALID_DEFENDER
)

// --------------------------------------------------
// Real pressure evaluation
// --------------------------------------------------

const result =
  evaluateRaidBossPressure({
    boss,

    defenderCandidate:
      hydreigonLikeCandidate,

    moves,

    combatData,
  })

expectEqual(
  'Boss pressure succeeds',
  result.status,
  RAID_BOSS_PRESSURE_STATUS
    .SUCCESS
)

expectEqual(
  'One Fast × two Charged creates two scenarios',
  result
    .summary
    .totalMoveSets,
  2
)

expectEqual(
  'Both boss movesets analyzed',
  result
    .summary
    .analyzedMoveSets,
  2
)

expectEqual(
  'No boss movesets rejected',
  result
    .summary
    .rejectedMoveSets,
  0
)

expectEqual(
  'Two pressure scenarios returned',
  result
    .scenarios
    .length,
  2
)

// --------------------------------------------------
// Pressure numbers
// --------------------------------------------------

expectFinite(
  'Minimum incoming DPS is finite',
  result
    .summary
    .minimumCycleDps
)

expectFinite(
  'Average incoming DPS is finite',
  result
    .summary
    .averageCycleDps
)

expectFinite(
  'Maximum incoming DPS is finite',
  result
    .summary
    .maximumCycleDps
)

expectTrue(
  'Maximum incoming DPS exceeds minimum',
  result
    .summary
    .maximumCycleDps >
    result
      .summary
      .minimumCycleDps
)

expectTrue(
  'Average pressure lies between minimum and maximum',
  result
    .summary
    .averageCycleDps >=
      result
        .summary
        .minimumCycleDps &&
    result
      .summary
      .averageCycleDps <=
      result
        .summary
        .maximumCycleDps
)

// --------------------------------------------------
// Type-effectiveness validation
// --------------------------------------------------

const psychicScenario =
  result
    .scenarios
    .find(
      (scenario) =>
        scenario
          .chargedMoveId ===
        'PSYCHIC'
    )

const focusBlastScenario =
  result
    .scenarios
    .find(
      (scenario) =>
        scenario
          .chargedMoveId ===
        'FOCUS_BLAST'
    )

expectTrue(
  'Psychic scenario exists',
  Boolean(
    psychicScenario
  )
)

expectTrue(
  'Focus Blast scenario exists',
  Boolean(
    focusBlastScenario
  )
)

expectTrue(
  'Focus Blast deals more charged damage than Psychic into Dark/Dragon',
  focusBlastScenario
    .chargedMove
    .damage >
    psychicScenario
      .chargedMove
      .damage
)

expectTrue(
  'Focus Blast moveset creates more incoming pressure',
  focusBlastScenario
    .cycleDps >
    psychicScenario
      .cycleDps
)

// --------------------------------------------------
// Sorting
// --------------------------------------------------

expectTrue(
  'Pressure scenarios sorted weakest to strongest',
  result
    .scenarios
    .every(
      (
        scenario,
        index,
        array
      ) =>
        index ===
          0 ||
        scenario
          .cycleDps >=
          array[
            index - 1
          ].cycleDps
    )
)

// --------------------------------------------------
// Diagnostic output
// --------------------------------------------------

console.log('')
console.log(
  'Boss pressure scenarios:'
)

for (
  const scenario
  of result.scenarios
) {
  console.log(
    `${scenario.fastMoveId} / ${scenario.chargedMoveId}`
  )

  console.log(
    `  Fast damage: ${scenario.fastMove.damage}`
  )

  console.log(
    `  Charged damage: ${scenario.chargedMove.damage}`
  )

  console.log(
    `  Cycle DPS: ${scenario.cycleDps.toFixed(4)}`
  )
}

console.log('')
console.log(
  'Pressure summary:'
)

console.log(
  `  Min DPS: ${result.summary.minimumCycleDps.toFixed(4)}`
)

console.log(
  `  Avg DPS: ${result.summary.averageCycleDps.toFixed(4)}`
)

console.log(
  `  Max DPS: ${result.summary.maximumCycleDps.toFixed(4)}`
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