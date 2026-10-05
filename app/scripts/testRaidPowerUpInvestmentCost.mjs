import assert from 'node:assert/strict'

import {
  buildRaidCandidate,
} from '../src/utils/raidCandidate.js'

import {
  buildRaidPossibleStates,
} from '../src/utils/raidPossibleStates.js'

import {
  buildRaidInvestmentCost,
  RAID_INVESTMENT_COST_STATUS,
  RAID_INVESTMENT_COST_CERTAINTY,
  RAID_INVESTMENT_RESOURCE,
} from '../src/utils/raidInvestmentCost.js'

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
    'POWER_UP_COST_TOGETIC',

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

const level35State =
  stateResult.powerUpStates.find(
    (state) =>
      state.combat.level ===
      35
  )

const level40State =
  stateResult.powerUpStates.find(
    (state) =>
      state.combat.level ===
      40
  )

const level50State =
  stateResult.powerUpStates.find(
    (state) =>
      state.combat.level ===
      50
  )

const level35Cost =
  buildRaidInvestmentCost(
    level35State,
    candidate
  )

const level40Cost =
  buildRaidInvestmentCost(
    level40State,
    candidate
  )

const level50Cost =
  buildRaidInvestmentCost(
    level50State,
    candidate
  )

// --------------------------------------------------
// Basic integration
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
  'Candidate starts at Level 30',
  () => {
    assert.equal(
      candidate.level,
      30
    )
  }
)

test(
  'Level 35 cost succeeds',
  () => {
    assert.equal(
      level35Cost.status,
      RAID_INVESTMENT_COST_STATUS
        .SUCCESS
    )
  }
)

test(
  'Level 40 cost succeeds',
  () => {
    assert.equal(
      level40Cost.status,
      RAID_INVESTMENT_COST_STATUS
        .SUCCESS
    )
  }
)

test(
  'Level 50 cost succeeds',
  () => {
    assert.equal(
      level50Cost.status,
      RAID_INVESTMENT_COST_STATUS
        .SUCCESS
    )
  }
)

// --------------------------------------------------
// Exactness
// --------------------------------------------------

test(
  'Level 35 power-up cost is exact',
  () => {
    assert.equal(
      level35Cost.certainty,
      RAID_INVESTMENT_COST_CERTAINTY
        .EXACT
    )

    assert.equal(
      level35Cost
        .exactCostKnown,
      true
    )
  }
)

test(
  'Level 40 power-up cost is exact',
  () => {
    assert.equal(
      level40Cost.certainty,
      RAID_INVESTMENT_COST_CERTAINTY
        .EXACT
    )

    assert.equal(
      level40Cost
        .exactCostKnown,
      true
    )
  }
)

test(
  'Level 50 power-up cost is exact',
  () => {
    assert.equal(
      level50Cost.certainty,
      RAID_INVESTMENT_COST_CERTAINTY
        .EXACT
    )

    assert.equal(
      level50Cost
        .exactCostKnown,
      true
    )
  }
)

// --------------------------------------------------
// Resource summaries
// --------------------------------------------------

test(
  'Level 35 summary contains Stardust and Candy',
  () => {
    assert.ok(
      level35Cost
        .summary
        .stardust >
      0
    )

    assert.ok(
      level35Cost
        .summary
        .candy >
      0
    )

    assert.equal(
      level35Cost
        .summary
        .candyXL,
      0
    )
  }
)

test(
  'Level 40 summary contains Stardust and Candy',
  () => {
    assert.ok(
      level40Cost
        .summary
        .stardust >
      0
    )

    assert.ok(
      level40Cost
        .summary
        .candy >
      0
    )

    assert.equal(
      level40Cost
        .summary
        .candyXL,
      0
    )
  }
)

test(
  'Level 50 summary includes Candy XL',
  () => {
    assert.ok(
      level50Cost
        .summary
        .stardust >
      0
    )

    assert.ok(
      level50Cost
        .summary
        .candy >
      0
    )

    assert.equal(
      level50Cost
        .summary
        .candyXL,
      296
    )
  }
)

test(
  'All power-up summaries identify power-up requirement',
  () => {
    assert.equal(
      level35Cost
        .summary
        .requiresPowerUp,
      true
    )

    assert.equal(
      level40Cost
        .summary
        .requiresPowerUp,
      true
    )

    assert.equal(
      level50Cost
        .summary
        .requiresPowerUp,
      true
    )
  }
)

// --------------------------------------------------
// Requirement resources
// --------------------------------------------------

test(
  'Level 35 has Stardust requirement',
  () => {
    assert.ok(
      level35Cost
        .requirements
        .some(
          (requirement) =>
            requirement.resource ===
            RAID_INVESTMENT_RESOURCE
              .STARDUST
        )
    )
  }
)

test(
  'Level 35 has Candy requirement',
  () => {
    assert.ok(
      level35Cost
        .requirements
        .some(
          (requirement) =>
            requirement.resource ===
            RAID_INVESTMENT_RESOURCE
              .CANDY
        )
    )
  }
)

test(
  'Level 35 has no Candy XL requirement',
  () => {
    assert.equal(
      level35Cost
        .requirements
        .some(
          (requirement) =>
            requirement.resource ===
            RAID_INVESTMENT_RESOURCE
              .CANDY_XL
        ),
      false
    )
  }
)

test(
  'Level 50 has Candy XL requirement',
  () => {
    assert.ok(
      level50Cost
        .requirements
        .some(
          (requirement) =>
            requirement.resource ===
            RAID_INVESTMENT_RESOURCE
              .CANDY_XL
        )
    )
  }
)

// --------------------------------------------------
// Progression
// --------------------------------------------------

test(
  'Level 40 costs more Stardust than Level 35',
  () => {
    assert.ok(
      level40Cost
        .summary
        .stardust >
      level35Cost
        .summary
        .stardust
    )
  }
)

test(
  'Level 40 costs more Candy than Level 35',
  () => {
    assert.ok(
      level40Cost
        .summary
        .candy >
      level35Cost
        .summary
        .candy
    )
  }
)

test(
  'Level 50 costs more Stardust than Level 40',
  () => {
    assert.ok(
      level50Cost
        .summary
        .stardust >
      level40Cost
        .summary
        .stardust
    )
  }
)

test(
  'Level 50 retains Level 30 to 40 Candy cost',
  () => {
    assert.equal(
      level50Cost
        .summary
        .candy,
      level40Cost
        .summary
        .candy
    )
  }
)

// --------------------------------------------------
// Metadata
// --------------------------------------------------

test(
  'Power-up action survives cost model',
  () => {
    assert.equal(
      level40Cost
        .action
        .type,
      'POWER_UP'
    )
  }
)

test(
  'Possible state type survives cost model',
  () => {
    assert.equal(
      level40Cost
        .possibleStateType,
      'POWER_UP'
    )
  }
)

test(
  'Power-up state remains reachable',
  () => {
    assert.equal(
      level40Cost
        .reachable,
      true
    )
  }
)

test(
  'Power-up cost has no stochastic requirement',
  () => {
    assert.equal(
      level40Cost
        .summary
        .hasStochasticCost,
      false
    )
  }
)

test(
  'Power-up cost has no incomplete resource requirement',
  () => {
    assert.equal(
      level40Cost
        .summary
        .hasIncompleteResourceCost,
      false
    )
  }
)

// --------------------------------------------------
// Candidate context modifiers
// --------------------------------------------------

test(
  'Lucky candidate receives Stardust discount',
  () => {
    const luckyCandidate = {
      ...candidate,

      traits: {
        ...candidate.traits,
        lucky: true,
      },
    }

    const result =
      buildRaidInvestmentCost(
        level40State,
        luckyCandidate
      )

    assert.equal(
      result
        .summary
        .stardust,
      level40Cost
        .summary
        .stardust /
        2
    )

    assert.equal(
      result
        .summary
        .candy,
      level40Cost
        .summary
        .candy
    )
  }
)

test(
  'Shadow candidate receives increased cost',
  () => {
    const shadowCandidate = {
      ...candidate,

      traits: {
        ...candidate.traits,
        shadow: true,
      },
    }

    const result =
      buildRaidInvestmentCost(
        level40State,
        shadowCandidate
      )

    assert.ok(
      result
        .summary
        .stardust >
      level40Cost
        .summary
        .stardust
    )

    assert.ok(
      result
        .summary
        .candy >
      level40Cost
        .summary
        .candy
    )
  }
)

test(
  'Purified candidate receives reduced cost',
  () => {
    const purifiedCandidate = {
      ...candidate,

      traits: {
        ...candidate.traits,
        purified: true,
      },
    }

    const result =
      buildRaidInvestmentCost(
        level40State,
        purifiedCandidate
      )

    assert.ok(
      result
        .summary
        .stardust <
      level40Cost
        .summary
        .stardust
    )

    assert.ok(
      result
        .summary
        .candy <=
      level40Cost
        .summary
        .candy
    )
  }
)

// --------------------------------------------------
// Missing candidate behavior
// --------------------------------------------------

test(
  'Standard power-up can still calculate without candidate traits',
  () => {
    const result =
      buildRaidInvestmentCost(
        level40State
      )

    assert.equal(
      result.status,
      RAID_INVESTMENT_COST_STATUS
        .SUCCESS
    )

    assert.equal(
      result.certainty,
      RAID_INVESTMENT_COST_CERTAINTY
        .EXACT
    )
  }
)

// --------------------------------------------------
// Diagnostic table
// --------------------------------------------------

console.log('')
console.log(
  'RAID POWER-UP INVESTMENT COST'
)

console.table(
  [
    {
      targetLevel: 35,
      stardust:
        level35Cost
          .summary
          .stardust,
      candy:
        level35Cost
          .summary
          .candy,
      candyXL:
        level35Cost
          .summary
          .candyXL,
      certainty:
        level35Cost
          .certainty,
    },

    {
      targetLevel: 40,
      stardust:
        level40Cost
          .summary
          .stardust,
      candy:
        level40Cost
          .summary
          .candy,
      candyXL:
        level40Cost
          .summary
          .candyXL,
      certainty:
        level40Cost
          .certainty,
    },

    {
      targetLevel: 50,
      stardust:
        level50Cost
          .summary
          .stardust,
      candy:
        level50Cost
          .summary
          .candy,
      candyXL:
        level50Cost
          .summary
          .candyXL,
      certainty:
        level50Cost
          .certainty,
    },
  ]
)

// --------------------------------------------------
// Summary
// --------------------------------------------------

console.log('')
console.log(
  '================================'
)
console.log(
  'RAID POWER-UP INVESTMENT COST VALIDATION'
)
console.log(
  '================================'
)
console.log('')

console.log(
  `${passed}/${passed + failed} tests passed`
)

if (failed > 0) {
  process.exitCode = 1
}