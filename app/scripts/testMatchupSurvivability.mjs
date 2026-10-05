import moves from '../src/data/reference/moves-pve.json' with { type: 'json' }
import combatData from '../src/data/reference/combat.json' with { type: 'json' }

import {
  createRaidBoss,
} from '../src/engine/Raid/boss.js'

import {
  evaluateMatchupSurvivability,
  MATCHUP_SURVIVABILITY_STATUS,
} from '../src/engine/Raid/matchupSurvivability.js'

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
  expectTrue(
    name,
    Number.isFinite(
      value
    )
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
    },

    charged: {
      normal: [
        'PSYCHIC',
        'FOCUS_BLAST',
      ],
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

const candidate = {
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

const outgoingCycleDps =
  24.8163

// --------------------------------------------------
// Header
// --------------------------------------------------

console.log('')
console.log(
  '================================'
)
console.log(
  'MATCHUP SURVIVABILITY VALIDATION'
)
console.log(
  '================================'
)

// --------------------------------------------------
// Validation
// --------------------------------------------------

expectEqual(
  'Invalid candidate rejected',
  evaluateMatchupSurvivability({
    boss,

    defenderCandidate:
      null,

    outgoingCycleDps,

    moves,

    combatData,
  }).status,
  MATCHUP_SURVIVABILITY_STATUS
    .INVALID_CANDIDATE
)

expectEqual(
  'Zero outgoing DPS rejected',
  evaluateMatchupSurvivability({
    boss,

    defenderCandidate:
      candidate,

    outgoingCycleDps:
      0,

    moves,

    combatData,
  }).status,
  MATCHUP_SURVIVABILITY_STATUS
    .INVALID_OUTGOING_DPS
)

expectEqual(
  'Negative outgoing DPS rejected',
  evaluateMatchupSurvivability({
    boss,

    defenderCandidate:
      candidate,

    outgoingCycleDps:
      -1,

    moves,

    combatData,
  }).status,
  MATCHUP_SURVIVABILITY_STATUS
    .INVALID_OUTGOING_DPS
)

// --------------------------------------------------
// Evaluation
// --------------------------------------------------

const result =
  evaluateMatchupSurvivability({
    boss,

    defenderCandidate:
      candidate,

    outgoingCycleDps,

    moves,

    combatData,
  })

expectEqual(
  'Matchup survivability succeeds',
  result.status,
  MATCHUP_SURVIVABILITY_STATUS
    .SUCCESS
)

expectEqual(
  'Two boss scenarios evaluated',
  result
    .summary
    .scenarioCount,
  2
)

expectEqual(
  'No survivability scenarios rejected',
  result
    .summary
    .rejectedScenarioCount,
  0
)

expectEqual(
  'Outgoing Cycle DPS preserved',
  result
    .outgoingCycleDps,
  outgoingCycleDps
)

expectTrue(
  'Owned HP is positive',
  result.hp > 0
)

// --------------------------------------------------
// Aggregate values
// --------------------------------------------------

expectFinite(
  'Average incoming DPS finite',
  result
    .summary
    .averageIncomingCycleDps
)

expectFinite(
  'Average survival time finite',
  result
    .summary
    .averageTimeToFaintSeconds
)

expectFinite(
  'Average TDO finite',
  result
    .summary
    .averageTotalDamageOutput
)

expectFinite(
  'Average Raid Score finite',
  result
    .summary
    .averageRaidScore
)

// --------------------------------------------------
// Scenario relationship
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
  'Psychic survivability scenario exists',
  Boolean(
    psychicScenario
  )
)

expectTrue(
  'Focus Blast survivability scenario exists',
  Boolean(
    focusBlastScenario
  )
)

expectTrue(
  'Focus Blast produces greater incoming DPS',
  focusBlastScenario
    .incomingCycleDps >
    psychicScenario
      .incomingCycleDps
)

expectTrue(
  'Focus Blast produces shorter survival time',
  focusBlastScenario
    .timeToFaintSeconds <
    psychicScenario
      .timeToFaintSeconds
)

expectTrue(
  'Focus Blast produces lower TDO',
  focusBlastScenario
    .totalDamageOutput <
    psychicScenario
      .totalDamageOutput
)

expectTrue(
  'Focus Blast produces lower Raid Score',
  focusBlastScenario
    .raidScore <
    psychicScenario
      .raidScore
)

// --------------------------------------------------
// Move-set labels
// --------------------------------------------------

expectEqual(
  'Safest Charged Move is Psychic',
  result
    .summary
    .safestMoveSet
    .chargedMoveId,
  'PSYCHIC'
)

expectEqual(
  'Most dangerous Charged Move is Focus Blast',
  result
    .summary
    .mostDangerousMoveSet
    .chargedMoveId,
  'FOCUS_BLAST'
)

// --------------------------------------------------
// Diagnostic output
// --------------------------------------------------

console.log('')
console.log(
  `Owned HP: ${result.hp}`
)

console.log(
  `Outgoing DPS: ${result.outgoingCycleDps.toFixed(4)}`
)

console.log('')

for (
  const scenario
  of result.scenarios
) {
  console.log(
    `${scenario.fastMoveId} / ${scenario.chargedMoveId}`
  )

  console.log(
    `  Incoming DPS: ${scenario.incomingCycleDps.toFixed(4)}`
  )

  console.log(
    `  Survival: ${scenario.timeToFaintSeconds.toFixed(2)}s`
  )

  console.log(
    `  TDO: ${scenario.totalDamageOutput.toFixed(2)}`
  )

  console.log(
    `  Raid Score: ${scenario.raidScore.toFixed(4)}`
  )
}

console.log('')

console.log(
  'Average matchup:'
)

console.log(
  `  Incoming DPS: ${result.summary.averageIncomingCycleDps.toFixed(4)}`
)

console.log(
  `  Survival: ${result.summary.averageTimeToFaintSeconds.toFixed(2)}s`
)

console.log(
  `  TDO: ${result.summary.averageTotalDamageOutput.toFixed(2)}`
)

console.log(
  `  Raid Score: ${result.summary.averageRaidScore.toFixed(4)}`
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