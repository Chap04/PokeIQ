import powerUpCostData from '../data/reference/power-up-costs.json' with { type: 'json' }

export const POWER_UP_COST_STATUS = {
  SUCCESS:
    'SUCCESS',

  INVALID_LEVEL:
    'INVALID_LEVEL',

  INVALID_LEVEL_RANGE:
    'INVALID_LEVEL_RANGE',

  LEVEL_OUT_OF_RANGE:
    'LEVEL_OUT_OF_RANGE',

  UNSUPPORTED_SPECIES:
    'UNSUPPORTED_SPECIES',

  COST_DATA_MISSING:
    'COST_DATA_MISSING',
}

function isHalfLevel(
  level
) {
  return (
    Number.isFinite(level) &&
    Number.isInteger(
      level * 2
    )
  )
}

function isValidLevel(
  level
) {
  return (
    isHalfLevel(level) &&
    level >=
      powerUpCostData.minimumLevel &&
    level <=
      powerUpCostData.maximumLevel
  )
}

function getBaseStepCost(
  level
) {
  return (
    powerUpCostData.costs.find(
      (entry) =>
        level >=
          entry.minLevel &&
        level <=
          entry.maxLevel
    ) ??
    null
  )
}

function roundModifiedCost(
  value
) {
  return Math.ceil(
    value
  )
}

function getPokemonTraits(
  pokemon
) {
  return {
    lucky:
      pokemon?.lucky === true ||
      pokemon?.traits?.lucky ===
        true,

    shadow:
      pokemon?.shadow === true ||
      pokemon?.traits?.shadow ===
        true,

    purified:
      pokemon?.purified === true ||
      pokemon?.traits?.purified ===
        true,
  }
}

function getCostModifiers(
  pokemon
) {
  const traits =
    getPokemonTraits(
      pokemon
    )

  let stardust =
    powerUpCostData
      .modifiers
      .standard
      .stardust

  let candy =
    powerUpCostData
      .modifiers
      .standard
      .candy

  let candyXL =
    powerUpCostData
      .modifiers
      .standard
      .candyXL

  if (traits.shadow) {
    stardust *=
      powerUpCostData
        .modifiers
        .shadow
        .stardust

    candy *=
      powerUpCostData
        .modifiers
        .shadow
        .candy

    candyXL *=
      powerUpCostData
        .modifiers
        .shadow
        .candyXL
  }

  if (traits.purified) {
    stardust *=
      powerUpCostData
        .modifiers
        .purified
        .stardust

    candy *=
      powerUpCostData
        .modifiers
        .purified
        .candy

    candyXL *=
      powerUpCostData
        .modifiers
        .purified
        .candyXL
  }

  if (traits.lucky) {
    stardust *=
      powerUpCostData
        .modifiers
        .lucky
        .stardust
  }

  return {
    ...traits,

    stardust,
    candy,
    candyXL,
  }
}

function getPokemonId(
  pokemon
) {
  return (
    pokemon?.pokemonId ??
    pokemon?.reference?.id ??
    pokemon?.pokemonIdentity ??
    null
  )
}

function normalizePokemonId(
  pokemon
) {
  const pokemonId =
    getPokemonId(
      pokemon
    )

  if (!pokemonId) {
    return null
  }

  return String(
    pokemonId
  )
    .split('__')[0]
    .toUpperCase()
}

function isUnsupportedSpecies(
  pokemon
) {
  const pokemonId =
    normalizePokemonId(
      pokemon
    )

  if (!pokemonId) {
    return false
  }

  return (
    powerUpCostData
      .unsupportedSpecies
      .includes(
        pokemonId
      )
  )
}

function applyModifiers(
  baseCost,
  modifiers
) {
  return {
    stardust:
      roundModifiedCost(
        baseCost.stardust *
          modifiers.stardust
      ),

    candy:
      roundModifiedCost(
        baseCost.candy *
          modifiers.candy
      ),

    candyXL:
      roundModifiedCost(
        baseCost.candyXL *
          modifiers.candyXL
      ),
  }
}

export function getPowerUpStepCost({
  level,
  pokemon = null,
}) {
  if (
    !Number.isFinite(level) ||
    !isHalfLevel(level)
  ) {
    return {
      status:
        POWER_UP_COST_STATUS
          .INVALID_LEVEL,

      level,

      cost: null,
    }
  }

  if (
    level <
      powerUpCostData.minimumLevel ||
    level >=
      powerUpCostData.maximumLevel
  ) {
    return {
      status:
        POWER_UP_COST_STATUS
          .LEVEL_OUT_OF_RANGE,

      level,

      cost: null,
    }
  }

  if (
    isUnsupportedSpecies(
      pokemon
    )
  ) {
    return {
      status:
        POWER_UP_COST_STATUS
          .UNSUPPORTED_SPECIES,

      level,

      cost: null,
    }
  }

  const baseCost =
    getBaseStepCost(
      level
    )

  if (!baseCost) {
    return {
      status:
        POWER_UP_COST_STATUS
          .COST_DATA_MISSING,

      level,

      cost: null,
    }
  }

  const modifiers =
    getCostModifiers(
      pokemon
    )

  const cost =
    applyModifiers(
      baseCost,
      modifiers
    )

  return {
    status:
      POWER_UP_COST_STATUS
        .SUCCESS,

    fromLevel:
      level,

    targetLevel:
      level + 0.5,

    baseCost: {
      stardust:
        baseCost.stardust,

      candy:
        baseCost.candy,

      candyXL:
        baseCost.candyXL,
    },

    modifiers,

    cost,
  }
}

export function calculatePowerUpCost({
  fromLevel,
  targetLevel,
  pokemon = null,
}) {
  if (
    !isValidLevel(
      fromLevel
    ) ||
    !isValidLevel(
      targetLevel
    )
  ) {
    return {
      status:
        POWER_UP_COST_STATUS
          .INVALID_LEVEL,

      fromLevel,
      targetLevel,

      cost: null,
      steps: [],
    }
  }

  if (
    targetLevel <=
      fromLevel
  ) {
    return {
      status:
        POWER_UP_COST_STATUS
          .INVALID_LEVEL_RANGE,

      fromLevel,
      targetLevel,

      cost: null,
      steps: [],
    }
  }

  if (
    isUnsupportedSpecies(
      pokemon
    )
  ) {
    return {
      status:
        POWER_UP_COST_STATUS
          .UNSUPPORTED_SPECIES,

      fromLevel,
      targetLevel,

      cost: null,
      steps: [],
    }
  }

  const steps = []

  let totalStardust = 0
  let totalCandy = 0
  let totalCandyXL = 0

  for (
    let level = fromLevel;
    level < targetLevel;
    level += 0.5
  ) {
    const step =
      getPowerUpStepCost({
        level,
        pokemon,
      })

    if (
      step.status !==
      POWER_UP_COST_STATUS
        .SUCCESS
    ) {
      return {
        status:
          step.status,

        fromLevel,
        targetLevel,

        failedLevel:
          level,

        cost: null,
        steps,
      }
    }

    steps.push(
      step
    )

    totalStardust +=
      step.cost.stardust

    totalCandy +=
      step.cost.candy

    totalCandyXL +=
      step.cost.candyXL
  }

  const modifiers =
    getCostModifiers(
      pokemon
    )

  return {
    status:
      POWER_UP_COST_STATUS
        .SUCCESS,

    fromLevel,
    targetLevel,

    powerUpCount:
      steps.length,

    cost: {
      stardust:
        totalStardust,

      candy:
        totalCandy,

      candyXL:
        totalCandyXL,
    },

    modifiers,

    steps,
  }
}