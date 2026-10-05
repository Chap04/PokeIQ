import assert from 'node:assert/strict'

import moves from '../src/data/reference/moves-pve.json' with { type: 'json' }
import combatData from '../src/data/reference/combat.json' with { type: 'json' }

import {
  buildRaidCandidate,
} from '../src/utils/raidCandidate.js'

import {
  buildRaidPossibleStates,
} from '../src/utils/raidPossibleStates.js'

import {
  buildRaidPowerUpEfficiency,
  RAID_POWER_UP_EFFICIENCY_STATUS,
  RAID_POWER_UP_RESOURCE_TIER,
} from '../src/utils/raidPowerUpEfficiency.js'

import {
  buildRaidBenchmarks,
} from '../src/utils/raidBenchmarks.js'

// --------------------------------------------------
// Test harness
// --------------------------------------------------

let passed = 0
let failed = 0

function test(
  name,
  callback
) {
  try {
    callback()

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
      error
    )
  }
}

// --------------------------------------------------
// Fixture
// --------------------------------------------------

const ownedTogetic = {
  id:
    'POWER_UP_EFFICIENCY_TOGETIC',

  pokemonId:
    'TOGETIC',

  pokemonForm:
    'NORMAL',

  pokemonIdentity:
    'TOGETIC__NORMAL',

  name:
    'Togetic',

  cp:
    1464,

  ivs: {
    attack: 15,
    defense: 15,
    stamina: 15,
  },

  fastMoveId:
    'EXTRASENSORY_FAST',

  chargedMove1Id:
    'DRAINING_KISS',

  chargedMove2Id:
    null,

  shiny:
    false,

  shadow:
    false,

  purified:
    false,

  lucky:
    false,

  favorite:
    false,
}

const candidate =
  buildRaidCandidate(
    ownedTogetic
  )

const stateResult =
  buildRaidPossibleStates(
    candidate,
    {
      includePowerUps:
        true,
    }
  )

const matchups =
  buildRaidBenchmarks()

const result =
  buildRaidPowerUpEfficiency({
    candidate,

    currentState:
      stateResult.currentState,

    powerUpStates:
      stateResult.powerUpStates,

    matchups,

    moves,

    combatData,
  })

const level35 =
  result.checkpoints.find(
    (checkpoint) =>
      checkpoint.targetLevel ===
      35
  )

const level40 =
  result.checkpoints.find(
    (checkpoint) =>
      checkpoint.targetLevel ===
      40
  )

const level50 =
  result.checkpoints.find(
    (checkpoint) =>
      checkpoint.targetLevel ===
      50
  )

// --------------------------------------------------
// Basic pipeline
// --------------------------------------------------

test(
  'Candidate is ready',
  () => {
    assert.equal(
      candidate.status,
      'READY'
    )
  }
)

test(
  'Candidate begins at Level 30',
  () => {
    assert.equal(
      candidate.level,
      30
    )
  }
)

test(
  'Efficiency succeeds',
  () => {
    assert.equal(
      result.status,
      RAID_POWER_UP_EFFICIENCY_STATUS
        .SUCCESS
    )
  }
)

test(
  'Efficiency uses Level 30 as current level',
  () => {
    assert.equal(
      result.currentLevel,
      30
    )
  }
)

test(
  'Efficiency contains three checkpoints',
  () => {
    assert.equal(
      result.checkpointCount,
      3
    )
  }
)

// --------------------------------------------------
// Progression
// --------------------------------------------------

test(
  'First checkpoint is 30 to 35',
  () => {
    assert.equal(
      level35.fromLevel,
      30
    )

    assert.equal(
      level35.targetLevel,
      35
    )
  }
)

test(
  'Second checkpoint is 35 to 40',
  () => {
    assert.equal(
      level40.fromLevel,
      35
    )

    assert.equal(
      level40.targetLevel,
      40
    )
  }
)

test(
  'Third checkpoint is 40 to 50',
  () => {
    assert.equal(
      level50.fromLevel,
      40
    )

    assert.equal(
      level50.targetLevel,
      50
    )
  }
)

// --------------------------------------------------
// Incremental cost
// --------------------------------------------------

test(
  '30 to 35 costs 62000 Stardust',
  () => {
    assert.equal(
      level35.cost.stardust,
      62000
    )
  }
)

test(
  '30 to 35 costs 64 Candy',
  () => {
    assert.equal(
      level35.cost.candy,
      64
    )
  }
)

test(
  '30 to 35 costs no Candy XL',
  () => {
    assert.equal(
      level35.cost.candyXL,
      0
    )
  }
)

test(
  '35 to 40 costs 88000 Stardust',
  () => {
    assert.equal(
      level40.cost.stardust,
      88000
    )
  }
)

test(
  '35 to 40 costs 118 Candy',
  () => {
    assert.equal(
      level40.cost.candy,
      118
    )
  }
)

test(
  '35 to 40 costs no Candy XL',
  () => {
    assert.equal(
      level40.cost.candyXL,
      0
    )
  }
)

test(
  '40 to 50 costs 250000 Stardust',
  () => {
    assert.equal(
      level50.cost.stardust,
      250000
    )
  }
)

test(
  '40 to 50 costs no normal Candy',
  () => {
    assert.equal(
      level50.cost.candy,
      0
    )
  }
)

test(
  '40 to 50 costs 296 Candy XL',
  () => {
    assert.equal(
      level50.cost.candyXL,
      296
    )
  }
)

// --------------------------------------------------
// Resource tiers
// --------------------------------------------------

test(
  '30 to 35 is ordinary',
  () => {
    assert.equal(
      level35.resourceTier,
      RAID_POWER_UP_RESOURCE_TIER
        .ORDINARY
    )
  }
)

test(
  '35 to 40 is ordinary',
  () => {
    assert.equal(
      level40.resourceTier,
      RAID_POWER_UP_RESOURCE_TIER
        .ORDINARY
    )
  }
)

test(
  '40 to 50 is premium',
  () => {
    assert.equal(
      level50.resourceTier,
      RAID_POWER_UP_RESOURCE_TIER
        .PREMIUM
    )
  }
)

test(
  'There are two ordinary checkpoints',
  () => {
    assert.equal(
      result
        .ordinaryCheckpoints
        .length,
      2
    )
  }
)

test(
  'There is one premium checkpoint',
  () => {
    assert.equal(
      result
        .premiumCheckpoints
        .length,
      1
    )
  }
)

test(
  'Level 50 is the premium entry checkpoint',
  () => {
    assert.equal(
      result
        .premiumEntryCheckpoint
        ?.targetLevel,
      50
    )
  }
)

// --------------------------------------------------
// Performance evidence
// --------------------------------------------------

test(
  '30 to 35 has performance evidence',
  () => {
    assert.equal(
      level35
        .performance
        .available,
      true
    )
  }
)

test(
  '35 to 40 has performance evidence',
  () => {
    assert.equal(
      level40
        .performance
        .available,
      true
    )
  }
)

test(
  '40 to 50 has performance evidence',
  () => {
    assert.equal(
      level50
        .performance
        .available,
      true
    )
  }
)

test(
  '30 to 35 improves raid performance',
  () => {
    assert.ok(
      level35
        .performance
        .medianPercentGain >
      0
    )
  }
)

test(
  '35 to 40 improves raid performance',
  () => {
    assert.ok(
      level40
        .performance
        .medianPercentGain >
      0
    )
  }
)

test(
  '40 to 50 improves raid performance',
  () => {
    assert.ok(
      level50
        .performance
        .medianPercentGain >
      0
    )
  }
)

// --------------------------------------------------
// Relative efficiency metadata
// --------------------------------------------------

test(
  'First checkpoint has no previous checkpoint',
  () => {
    assert.equal(
      level35
        .previousCheckpoint,
      null
    )
  }
)

test(
  'Level 40 knows Level 35 precedes it',
  () => {
    assert.deepEqual(
      level40
        .previousCheckpoint,
      {
        fromLevel:
          30,

        targetLevel:
          35,
      }
    )
  }
)

test(
  'Level 50 knows Level 40 precedes it',
  () => {
    assert.deepEqual(
      level50
        .previousCheckpoint,
      {
        fromLevel:
          35,

        targetLevel:
          40,
      }
    )
  }
)

test(
  'Level 50 enters the premium tier',
  () => {
    assert.equal(
      level50
        .entersPremiumTier,
      true
    )
  }
)

test(
  'Level 35 does not enter premium tier',
  () => {
    assert.equal(
      level35
        .entersPremiumTier,
      false
    )
  }
)

test(
  'Level 40 does not enter premium tier',
  () => {
    assert.equal(
      level40
        .entersPremiumTier,
      false
    )
  }
)

// --------------------------------------------------
// Immutability / integrity
// --------------------------------------------------

test(
  'Original Level 40 power-up state still starts at Level 30',
  () => {
    const originalLevel40 =
      stateResult
        .powerUpStates
        .find(
          (state) =>
            state.combat.level ===
            40
        )

    assert.equal(
      originalLevel40
        .action
        .fromLevel,
      30
    )
  }
)

test(
  'Original Level 50 power-up state still starts at Level 30',
  () => {
    const originalLevel50 =
      stateResult
        .powerUpStates
        .find(
          (state) =>
            state.combat.level ===
            50
        )

    assert.equal(
      originalLevel50
        .action
        .fromLevel,
      30
    )
  }
)

// --------------------------------------------------
// Diagnostics
// --------------------------------------------------

console.log('')
console.log(
  'POWER-UP COST EFFICIENCY'
)

console.table(
  result.checkpoints.map(
    (checkpoint) => ({
      from:
        checkpoint.fromLevel,

      to:
        checkpoint.targetLevel,

      medianGain:
        checkpoint
          .performance
          .medianPercentGain,

      stardust:
        checkpoint
          .cost
          .stardust,

      candy:
        checkpoint
          .cost
          .candy,

      candyXL:
        checkpoint
          .cost
          .candyXL,

      tier:
        checkpoint
          .resourceTier,

      diminishingReturn:
        checkpoint
          .diminishingReturn,

      entersPremium:
        checkpoint
          .entersPremiumTier,
    })
  )
)

console.log('')
console.log(
  '================================'
)
console.log(
  'RAID POWER-UP EFFICIENCY VALIDATION'
)
console.log(
  '================================'
)
console.log('')

console.log(
  `${passed}/${passed + failed} tests passed`
)

if (
  failed > 0
) {
  process.exitCode = 1
}