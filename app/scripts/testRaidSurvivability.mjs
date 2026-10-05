import {
  calculateEffectiveHp,
  calculateTimeToFaint,
  calculateTotalDamageOutput,
  calculateRaidPerformanceScore,
  calculateRaidSurvivability,
} from '../src/engine/Raid/survivability.js'

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
    `✅ ${name}`
  )
}

function fail(
  name,
  actual,
  expected
) {
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

function expectClose(
  name,
  actual,
  expected,
  tolerance = 0.000001
) {
  if (
    Math.abs(
      actual -
      expected
    ) <= tolerance
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

function expectThrows(
  name,
  callback
) {
  try {
    callback()

    fail(
      name,
      'no error',
      'error'
    )
  } catch {
    pass(
      name
    )
  }
}

// --------------------------------------------------
// Effective HP
// --------------------------------------------------

console.log('')
console.log(
  '================================'
)
console.log(
  'RAID SURVIVABILITY VALIDATION'
)
console.log(
  '================================'
)

expectEqual(
  'Effective HP uses stamina + IV × CPM',
  calculateEffectiveHp({
    baseStamina:
      200,

    staminaIv:
      15,

    cpMultiplier:
      0.79030001,
  }),
  Math.floor(
    215 *
    0.79030001
  )
)

expectEqual(
  'Effective HP floors result',
  calculateEffectiveHp({
    baseStamina:
      100,

    staminaIv:
      0,

    cpMultiplier:
      0.5,
  }),
  50
)

expectEqual(
  'Effective HP respects minimum 10 HP',
  calculateEffectiveHp({
    baseStamina:
      1,

    staminaIv:
      0,

    cpMultiplier:
      0.1,
  }),
  10
)

expectThrows(
  'Invalid stamina IV rejected',
  () =>
    calculateEffectiveHp({
      baseStamina:
        200,

      staminaIv:
        16,

      cpMultiplier:
        0.79,
    })
)

expectThrows(
  'Invalid CPM rejected',
  () =>
    calculateEffectiveHp({
      baseStamina:
        200,

      staminaIv:
        15,

      cpMultiplier:
        0,
    })
)

// --------------------------------------------------
// Time to faint
// --------------------------------------------------

expectClose(
  'Time to faint uses HP / incoming DPS',
  calculateTimeToFaint({
    hp:
      200,

    incomingDps:
      10,
  }),
  20
)

expectClose(
  'Fractional time to faint preserved',
  calculateTimeToFaint({
    hp:
      175,

    incomingDps:
      12,
  }),
  175 / 12
)

expectThrows(
  'Zero incoming DPS rejected',
  () =>
    calculateTimeToFaint({
      hp:
        200,

      incomingDps:
        0,
    })
)

// --------------------------------------------------
// TDO
// --------------------------------------------------

expectClose(
  'TDO uses DPS × survival time',
  calculateTotalDamageOutput({
    cycleDps:
      25,

    timeToFaintSeconds:
      20,
  }),
  500
)

expectThrows(
  'Zero outgoing DPS rejected for TDO',
  () =>
    calculateTotalDamageOutput({
      cycleDps:
        0,

      timeToFaintSeconds:
        20,
    })
)

// --------------------------------------------------
// Raid score
// --------------------------------------------------

const expectedScore =
  Math.pow(
    (
      Math.pow(
        25,
        3
      ) *
      500
    ),
    1 / 4
  )

expectClose(
  'Raid score uses fourth root of DPS cubed × TDO',
  calculateRaidPerformanceScore({
    cycleDps:
      25,

    totalDamageOutput:
      500,
  }),
  expectedScore
)

const highDpsScore =
  calculateRaidPerformanceScore({
    cycleDps:
      30,

    totalDamageOutput:
      400,
  })

const tankScore =
  calculateRaidPerformanceScore({
    cycleDps:
      20,

    totalDamageOutput:
      600,
  })

expectEqual(
  'Raid score favors strong DPS despite lower TDO',
  highDpsScore >
    tankScore,
  true
)

// --------------------------------------------------
// Combined result
// --------------------------------------------------

const combined =
  calculateRaidSurvivability({
    baseStamina:
      200,

    staminaIv:
      15,

    cpMultiplier:
      0.79030001,

    outgoingCycleDps:
      25,

    incomingCycleDps:
      10,
  })

expectEqual(
  'Combined helper returns correct HP',
  combined.hp,
  Math.floor(
    215 *
    0.79030001
  )
)

expectClose(
  'Combined helper returns correct time to faint',
  combined.timeToFaintSeconds,
  combined.hp /
    10
)

expectClose(
  'Combined helper returns correct TDO',
  combined.totalDamageOutput,
  25 *
    (
      combined.hp /
      10
    )
)

expectClose(
  'Combined helper returns correct raid score',
  combined.raidScore,
  Math.pow(
    (
      Math.pow(
        25,
        3
      ) *
      combined.totalDamageOutput
    ),
    1 / 4
  )
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
  `Passed: ${passed}`
)

console.log(
  `Failed: ${failed}`
)

console.log(
  `Total: ${passed + failed}`
)

console.log('')

if (
  failed === 0
) {
  console.log(
    `🎉 ${passed}/${passed} tests passed.`
  )

  console.log(
    'Raid Survivability V1 validation successful.'
  )
} else {
  process.exitCode = 1
}