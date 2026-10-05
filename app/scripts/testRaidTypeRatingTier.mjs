import {
  getRaidTypeRatingTier,
} from '../src/utils/raidTypeRatingTier.js'

let passed = 0
let failed = 0

function assert(
  condition,
  message
) {
  if (!condition) {
    throw new Error(
      message
    )
  }
}

function runTest(
  name,
  test
) {
  try {
    test()

    passed += 1

    console.log(
      `PASS - ${name}`
    )
  } catch (error) {
    failed += 1

    console.error(
      `FAIL - ${name}`
    )

    console.error(
      `       ${error.message}`
    )
  }
}

function expectTier(
  rating,
  expectedLabel
) {
  const tier =
    getRaidTypeRatingTier(
      rating
    )

  assert(
    tier.label ===
      expectedLabel,
    `Expected ${rating} to be ${expectedLabel}, received ${tier.label}.`
  )
}

console.log(
  '\n================================'
)

console.log(
  'RAID TYPE RATING TIER VALIDATION'
)

console.log(
  '================================\n'
)

runTest(
  '0 is Foundation',
  () => {
    expectTier(
      0,
      'Foundation'
    )
  }
)

runTest(
  '19.99 is Foundation',
  () => {
    expectTier(
      19.99,
      'Foundation'
    )
  }
)

runTest(
  '20 is Early',
  () => {
    expectTier(
      20,
      'Early'
    )
  }
)

runTest(
  '39.99 is Early',
  () => {
    expectTier(
      39.99,
      'Early'
    )
  }
)

runTest(
  '40 is Developing',
  () => {
    expectTier(
      40,
      'Developing'
    )
  }
)

runTest(
  '59.99 is Developing',
  () => {
    expectTier(
      59.99,
      'Developing'
    )
  }
)

runTest(
  '60 is Strong',
  () => {
    expectTier(
      60,
      'Strong'
    )
  }
)

runTest(
  '74.99 is Strong',
  () => {
    expectTier(
      74.99,
      'Strong'
    )
  }
)

runTest(
  '75 is Incredible',
  () => {
    expectTier(
      75,
      'Incredible'
    )
  }
)

runTest(
  '89.99 is Incredible',
  () => {
    expectTier(
      89.99,
      'Incredible'
    )
  }
)

runTest(
  '90 is Elite',
  () => {
    expectTier(
      90,
      'Elite'
    )
  }
)

runTest(
  '99.99 is Elite',
  () => {
    expectTier(
      99.99,
      'Elite'
    )
  }
)

runTest(
  '100 is Perfect',
  () => {
    expectTier(
      100,
      'Perfect'
    )
  }
)

runTest(
  'Invalid rating safely falls back to Foundation',
  () => {
    expectTier(
      undefined,
      'Foundation'
    )
  }
)

console.log(
  `\n${passed}/${passed + failed} tests passed`
)

if (
  failed >
  0
) {
  process.exitCode = 1
}