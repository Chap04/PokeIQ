import assert from 'node:assert/strict'

import {
  calculatePowerUpCost,
  getPowerUpStepCost,
  POWER_UP_COST_STATUS,
} from '../src/utils/pokemonPowerUpCost.js'

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
// Pokémon fixtures
// --------------------------------------------------

const standardPokemon = {
  pokemonId:
    'TOGETIC',
}

const luckyPokemon = {
  pokemonId:
    'TOGETIC',

  lucky:
    true,
}

const shadowPokemon = {
  pokemonId:
    'TOGETIC',

  shadow:
    true,
}

const purifiedPokemon = {
  pokemonId:
    'TOGETIC',

  purified:
    true,
}

const luckyPurifiedPokemon = {
  pokemonId:
    'TOGETIC',

  lucky:
    true,

  purified:
    true,
}

const eternatus = {
  pokemonId:
    'ETERNATUS',
}

// --------------------------------------------------
// Standard step costs
// --------------------------------------------------

test(
  'Level 30 step costs 5000 Stardust and 4 Candy',
  () => {
    const result =
      getPowerUpStepCost({
        level: 30,
        pokemon:
          standardPokemon,
      })

    assert.equal(
      result.status,
      POWER_UP_COST_STATUS
        .SUCCESS
    )

    assert.deepEqual(
      result.cost,
      {
        stardust: 5000,
        candy: 4,
        candyXL: 0,
      }
    )
  }
)

test(
  'Level 39.5 step still uses normal Candy',
  () => {
    const result =
      getPowerUpStepCost({
        level: 39.5,
        pokemon:
          standardPokemon,
      })

    assert.deepEqual(
      result.cost,
      {
        stardust: 10000,
        candy: 15,
        candyXL: 0,
      }
    )
  }
)

test(
  'Level 40 step uses Candy XL',
  () => {
    const result =
      getPowerUpStepCost({
        level: 40,
        pokemon:
          standardPokemon,
      })

    assert.deepEqual(
      result.cost,
      {
        stardust: 10000,
        candy: 0,
        candyXL: 10,
      }
    )
  }
)

test(
  'Level 49.5 step costs 15000 Stardust and 20 Candy XL',
  () => {
    const result =
      getPowerUpStepCost({
        level: 49.5,
        pokemon:
          standardPokemon,
      })

    assert.deepEqual(
      result.cost,
      {
        stardust: 15000,
        candy: 0,
        candyXL: 20,
      }
    )
  }
)

// --------------------------------------------------
// Level 40 to 50 known total
// --------------------------------------------------

test(
  'Standard Level 40 to 50 costs 250000 Stardust',
  () => {
    const result =
      calculatePowerUpCost({
        fromLevel: 40,
        targetLevel: 50,
        pokemon:
          standardPokemon,
      })

    assert.equal(
      result.cost.stardust,
      250000
    )
  }
)

test(
  'Standard Level 40 to 50 costs 296 Candy XL',
  () => {
    const result =
      calculatePowerUpCost({
        fromLevel: 40,
        targetLevel: 50,
        pokemon:
          standardPokemon,
      })

    assert.equal(
      result.cost.candyXL,
      296
    )
  }
)

test(
  'Standard Level 40 to 50 uses no normal Candy',
  () => {
    const result =
      calculatePowerUpCost({
        fromLevel: 40,
        targetLevel: 50,
        pokemon:
          standardPokemon,
      })

    assert.equal(
      result.cost.candy,
      0
    )
  }
)

test(
  'Level 40 to 50 requires 20 power-ups',
  () => {
    const result =
      calculatePowerUpCost({
        fromLevel: 40,
        targetLevel: 50,
        pokemon:
          standardPokemon,
      })

    assert.equal(
      result.powerUpCount,
      20
    )
  }
)

// --------------------------------------------------
// Level 30 targets used by PokeIQ
// --------------------------------------------------

const level30To35 =
  calculatePowerUpCost({
    fromLevel: 30,
    targetLevel: 35,
    pokemon:
      standardPokemon,
  })

const level30To40 =
  calculatePowerUpCost({
    fromLevel: 30,
    targetLevel: 40,
    pokemon:
      standardPokemon,
  })

const level30To50 =
  calculatePowerUpCost({
    fromLevel: 30,
    targetLevel: 50,
    pokemon:
      standardPokemon,
  })

test(
  'Level 30 to 35 succeeds',
  () => {
    assert.equal(
      level30To35.status,
      POWER_UP_COST_STATUS
        .SUCCESS
    )
  }
)

test(
  'Level 30 to 40 succeeds',
  () => {
    assert.equal(
      level30To40.status,
      POWER_UP_COST_STATUS
        .SUCCESS
    )
  }
)

test(
  'Level 30 to 50 succeeds',
  () => {
    assert.equal(
      level30To50.status,
      POWER_UP_COST_STATUS
        .SUCCESS
    )
  }
)

test(
  'Level 30 to 35 requires 10 power-ups',
  () => {
    assert.equal(
      level30To35
        .powerUpCount,
      10
    )
  }
)

test(
  'Level 30 to 40 requires 20 power-ups',
  () => {
    assert.equal(
      level30To40
        .powerUpCount,
      20
    )
  }
)

test(
  'Level 30 to 50 requires 40 power-ups',
  () => {
    assert.equal(
      level30To50
        .powerUpCount,
      40
    )
  }
)

test(
  'Level 30 to 35 uses no Candy XL',
  () => {
    assert.equal(
      level30To35
        .cost
        .candyXL,
      0
    )
  }
)

test(
  'Level 30 to 40 uses no Candy XL',
  () => {
    assert.equal(
      level30To40
        .cost
        .candyXL,
      0
    )
  }
)

test(
  'Level 30 to 50 includes 296 Candy XL',
  () => {
    assert.equal(
      level30To50
        .cost
        .candyXL,
      296
    )
  }
)

// --------------------------------------------------
// Lucky
// --------------------------------------------------

test(
  'Lucky Level 30 step halves Stardust only',
  () => {
    const result =
      getPowerUpStepCost({
        level: 30,
        pokemon:
          luckyPokemon,
      })

    assert.deepEqual(
      result.cost,
      {
        stardust: 2500,
        candy: 4,
        candyXL: 0,
      }
    )
  }
)

test(
  'Lucky Level 40 to 50 costs 125000 Stardust',
  () => {
    const result =
      calculatePowerUpCost({
        fromLevel: 40,
        targetLevel: 50,
        pokemon:
          luckyPokemon,
      })

    assert.equal(
      result.cost.stardust,
      125000
    )

    assert.equal(
      result.cost.candyXL,
      296
    )
  }
)

// --------------------------------------------------
// Shadow
// --------------------------------------------------

test(
  'Shadow Level 30 step costs 20 percent more',
  () => {
    const result =
      getPowerUpStepCost({
        level: 30,
        pokemon:
          shadowPokemon,
      })

    assert.deepEqual(
      result.cost,
      {
        stardust: 6000,
        candy: 5,
        candyXL: 0,
      }
    )
  }
)

test(
  'Shadow Level 40 to 50 costs 300000 Stardust',
  () => {
    const result =
      calculatePowerUpCost({
        fromLevel: 40,
        targetLevel: 50,
        pokemon:
          shadowPokemon,
      })

    assert.equal(
      result.cost.stardust,
      300000
    )
  }
)

test(
  'Shadow Level 40 to 50 costs 360 Candy XL',
  () => {
    const result =
      calculatePowerUpCost({
        fromLevel: 40,
        targetLevel: 50,
        pokemon:
          shadowPokemon,
      })

    assert.equal(
      result.cost.candyXL,
      360
    )
  }
)

// --------------------------------------------------
// Purified
// --------------------------------------------------

test(
  'Purified Level 35 Candy rounds up',
  () => {
    const result =
      getPowerUpStepCost({
        level: 35,
        pokemon:
          purifiedPokemon,
      })

    assert.deepEqual(
      result.cost,
      {
        stardust: 7200,
        candy: 9,
        candyXL: 0,
      }
    )
  }
)

test(
  'Purified Level 39 Candy rounds up',
  () => {
    const result =
      getPowerUpStepCost({
        level: 39,
        pokemon:
          purifiedPokemon,
      })

    assert.deepEqual(
      result.cost,
      {
        stardust: 9000,
        candy: 14,
        candyXL: 0,
      }
    )
  }
)

// --------------------------------------------------
// Lucky + Purified
// --------------------------------------------------

test(
  'Lucky and Purified Stardust discounts stack',
  () => {
    const result =
      getPowerUpStepCost({
        level: 30,
        pokemon:
          luckyPurifiedPokemon,
      })

    assert.equal(
      result.cost.stardust,
      2250
    )

    assert.equal(
      result.cost.candy,
      4
    )
  }
)

// --------------------------------------------------
// Validation
// --------------------------------------------------

test(
  'Whole and half levels are accepted',
  () => {
    assert.equal(
      getPowerUpStepCost({
        level: 30.5,
        pokemon:
          standardPokemon,
      }).status,
      POWER_UP_COST_STATUS
        .SUCCESS
    )
  }
)

test(
  'Quarter level is rejected',
  () => {
    assert.equal(
      getPowerUpStepCost({
        level: 30.25,
        pokemon:
          standardPokemon,
      }).status,
      POWER_UP_COST_STATUS
        .INVALID_LEVEL
    )
  }
)

test(
  'Level 50 cannot be powered up',
  () => {
    assert.equal(
      getPowerUpStepCost({
        level: 50,
        pokemon:
          standardPokemon,
      }).status,
      POWER_UP_COST_STATUS
        .LEVEL_OUT_OF_RANGE
    )
  }
)

test(
  'Target level must exceed current level',
  () => {
    assert.equal(
      calculatePowerUpCost({
        fromLevel: 40,
        targetLevel: 35,
        pokemon:
          standardPokemon,
      }).status,
      POWER_UP_COST_STATUS
        .INVALID_LEVEL_RANGE
    )
  }
)

test(
  'Same level is rejected',
  () => {
    assert.equal(
      calculatePowerUpCost({
        fromLevel: 40,
        targetLevel: 40,
        pokemon:
          standardPokemon,
      }).status,
      POWER_UP_COST_STATUS
        .INVALID_LEVEL_RANGE
    )
  }
)

test(
  'Eternatus is explicitly unsupported',
  () => {
    assert.equal(
      calculatePowerUpCost({
        fromLevel: 20,
        targetLevel: 40,
        pokemon:
          eternatus,
      }).status,
      POWER_UP_COST_STATUS
        .UNSUPPORTED_SPECIES
    )
  }
)

// --------------------------------------------------
// Diagnostic table
// --------------------------------------------------

console.log('')
console.log(
  'POWER-UP COST EXAMPLES'
)

console.table(
  [
    {
      range: '30 → 35',
      stardust:
        level30To35
          .cost
          .stardust,
      candy:
        level30To35
          .cost
          .candy,
      candyXL:
        level30To35
          .cost
          .candyXL,
    },

    {
      range: '30 → 40',
      stardust:
        level30To40
          .cost
          .stardust,
      candy:
        level30To40
          .cost
          .candy,
      candyXL:
        level30To40
          .cost
          .candyXL,
    },

    {
      range: '30 → 50',
      stardust:
        level30To50
          .cost
          .stardust,
      candy:
        level30To50
          .cost
          .candy,
      candyXL:
        level30To50
          .cost
          .candyXL,
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
  'POKEMON POWER-UP COST VALIDATION'
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