import {
  RAID_TURN_MS,
  calculateRaidDurationMs,
  calculateRaidDurationSeconds,
  calculateRaidTurns,
} from '../src/engine/raid/timing.js'

// --------------------------------------------------
// Test helpers
// --------------------------------------------------

let passed = 0
let failed = 0

function expectEqual(
  name,
  actual,
  expected
) {
  if (actual === expected) {
    passed += 1
    console.log(`✅ ${name}`)
  } else {
    failed += 1
    console.log(`❌ ${name}`)
    console.log(
      `   Expected: ${expected}`
    )
    console.log(
      `   Actual:   ${actual}`
    )
  }
}

// --------------------------------------------------
// Tests
// --------------------------------------------------

console.log(
  'Testing PokeIQ Raid Timing Engine...'
)

console.log('')

console.log(
  '================================'
)
console.log(
  'RAID TIMING CONSTANTS'
)
console.log(
  '================================'
)

expectEqual(
  'Raid turn duration',
  RAID_TURN_MS,
  500
)

console.log('')
console.log(
  '================================'
)
console.log(
  'DURATION ROUNDING'
)
console.log(
  '================================'
)

expectEqual(
  '700 ms → 500 ms',
  calculateRaidDurationMs(700),
  500
)

expectEqual(
  '800 ms → 1000 ms',
  calculateRaidDurationMs(800),
  1000
)

expectEqual(
  '1000 ms → 1000 ms',
  calculateRaidDurationMs(1000),
  1000
)

expectEqual(
  '2300 ms → 2500 ms',
  calculateRaidDurationMs(2300),
  2500
)

expectEqual(
  '3700 ms → 3500 ms',
  calculateRaidDurationMs(3700),
  3500
)

console.log('')
console.log(
  '================================'
)
console.log(
  'SECONDS'
)
console.log(
  '================================'
)

expectEqual(
  '500 ms → 0.5 seconds',
  calculateRaidDurationSeconds(
    500
  ),
  0.5
)

expectEqual(
  '1500 ms → 1.5 seconds',
  calculateRaidDurationSeconds(
    1500
  ),
  1.5
)

console.log('')
console.log(
  '================================'
)
console.log(
  'RAID TURNS'
)
console.log(
  '================================'
)

expectEqual(
  '500 ms → 1 turn',
  calculateRaidTurns(500),
  1
)

expectEqual(
  '1000 ms → 2 turns',
  calculateRaidTurns(1000),
  2
)

expectEqual(
  '2500 ms → 5 turns',
  calculateRaidTurns(2500),
  5
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

if (failed === 0) {
  console.log(
    `🎉 ${passed}/${passed} tests passed.`
  )

  console.log(
    'Raid timing validation successful.'
  )
} else {
  console.log(
    `❌ ${failed} test(s) failed.`
  )

  process.exitCode = 1
}