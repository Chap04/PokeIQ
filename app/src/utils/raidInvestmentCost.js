import {
  calculatePowerUpCost,
  POWER_UP_COST_STATUS,
} from './pokemonPowerUpCost.js'

// --------------------------------------------------
// Raid Investment Resource Cost Model V3
//
// This layer describes the resource burden required
// to reach a possible raid investment state.
//
// V2 added exact power-up resource costs.
//
// V3 adds ordered multi-action investment paths and
// exact evolution Candy / evolution-item costs.
//
// IMPORTANT:
//
// Normal TMs remain stochastic. One TM may reach the
// target move, or several may be required.
//
// Elite TMs are deterministic target selection.
//
// Second Charged Move unlock costs are represented
// explicitly, but their species-specific Stardust
// and Candy quantities are not modeled yet.
//
// Power-up costs are exact when the source Pokémon,
// source level, target level, and supported species
// mechanics are known.
// --------------------------------------------------

// --------------------------------------------------
// Status
// --------------------------------------------------

export const RAID_INVESTMENT_COST_STATUS = {
  SUCCESS:
    'SUCCESS',

  INVALID_STATE:
    'INVALID_STATE',
}

// --------------------------------------------------
// Cost certainty
// --------------------------------------------------

export const RAID_INVESTMENT_COST_CERTAINTY = {
  EXACT:
    'EXACT',

  UNCERTAIN:
    'UNCERTAIN',

  INCOMPLETE:
    'INCOMPLETE',

  NONE:
    'NONE',
}

// --------------------------------------------------
// Resource types
// --------------------------------------------------

export const RAID_INVESTMENT_RESOURCE = {
  FAST_TM:
    'FAST_TM',

  CHARGED_TM:
    'CHARGED_TM',

  ELITE_FAST_TM:
    'ELITE_FAST_TM',

  ELITE_CHARGED_TM:
    'ELITE_CHARGED_TM',

  SECOND_CHARGED_MOVE_UNLOCK:
    'SECOND_CHARGED_MOVE_UNLOCK',

  STARDUST:
    'STARDUST',

  CANDY:
    'CANDY',

  CANDY_XL:
    'CANDY_XL',

  SPECIAL_ACQUISITION:
    'SPECIAL_ACQUISITION',

  EVOLUTION_ITEM:
    'EVOLUTION_ITEM',

  UNKNOWN:
    'UNKNOWN',
}

// --------------------------------------------------
// Requirement helpers
// --------------------------------------------------

function buildNormalTmRequirement(
  resource
) {
  return {
    resource,

    minimumQuantity:
      1,

    exactQuantity:
      null,

    deterministic:
      false,

    quantityKnown:
      false,

    stochastic:
      true,

    reason:
      'NORMAL_TM_TARGET_NOT_GUARANTEED',
  }
}

function buildEliteTmRequirement(
  resource
) {
  return {
    resource,

    minimumQuantity:
      1,

    exactQuantity:
      1,

    deterministic:
      true,

    quantityKnown:
      true,

    stochastic:
      false,

    reason:
      'ELITE_TM_TARGET_SELECTION',
  }
}

function buildSecondMoveRequirement() {
  return {
    resource:
      RAID_INVESTMENT_RESOURCE
        .SECOND_CHARGED_MOVE_UNLOCK,

    minimumQuantity:
      1,

    exactQuantity:
      1,

    deterministic:
      true,

    quantityKnown:
      true,

    stochastic:
      false,

    resourceCostKnown:
      false,

    stardust:
      null,

    candy:
      null,

    reason:
      'SECOND_MOVE_RESOURCE_COST_NOT_MODELED',
  }
}

function buildSpecialRequirement() {
  return {
    resource:
      RAID_INVESTMENT_RESOURCE
        .SPECIAL_ACQUISITION,

    minimumQuantity:
      null,

    exactQuantity:
      null,

    deterministic:
      false,

    quantityKnown:
      false,

    stochastic:
      false,

    resourceCostKnown:
      false,

    reason:
      'SPECIAL_ACQUISITION_NOT_MODELED',
  }
}

function buildUnknownRequirement(
  actionType
) {
  return {
    resource:
      RAID_INVESTMENT_RESOURCE
        .UNKNOWN,

    actionType:
      actionType ??
      null,

    minimumQuantity:
      null,

    exactQuantity:
      null,

    deterministic:
      false,

    quantityKnown:
      false,

    stochastic:
      false,

    resourceCostKnown:
      false,

    reason:
      'UNKNOWN_ACTION_COST',
  }
}

function buildExactResourceRequirement(
  resource,
  quantity,
  reason
) {
  return {
    resource,

    minimumQuantity:
      quantity,

    exactQuantity:
      quantity,

    deterministic:
      true,

    quantityKnown:
      true,

    stochastic:
      false,

    resourceCostKnown:
      true,

    reason,
  }
}

function buildIncompletePowerUpRequirement(
  reason
) {
  return {
    resource:
      RAID_INVESTMENT_RESOURCE
        .UNKNOWN,

    actionType:
      'POWER_UP',

    minimumQuantity:
      null,

    exactQuantity:
      null,

    deterministic:
      false,

    quantityKnown:
      false,

    stochastic:
      false,

    resourceCostKnown:
      false,

    reason,
  }
}

function normalizeEvolutionItem(
  item
) {
  if (
    typeof item ===
    'string'
  ) {
    return {
      itemId:
        item,

      quantity:
        1,
    }
  }

  if (
    !item ||
    typeof item !==
      'object'
  ) {
    return null
  }

  const itemId =
    item.itemId ??
    item.id ??
    item.item ??
    item.name ??
    null

  if (!itemId) {
    return null
  }

  const quantity =
    Number.isFinite(
      item.quantity
    )
      ? item.quantity
      : 1

  return {
    itemId,

    quantity,
  }
}

function buildEvolutionItemRequirement(
  item
) {
  const normalized =
    normalizeEvolutionItem(
      item
    )

  if (!normalized) {
    return buildUnknownRequirement(
      'EVOLVE_ITEM'
    )
  }

  return {
    ...buildExactResourceRequirement(
      RAID_INVESTMENT_RESOURCE
        .EVOLUTION_ITEM,

      normalized.quantity,

      'EVOLUTION_ITEM'
    ),

    itemId:
      normalized.itemId,
  }
}

function buildEvolutionRequirements(
  action,
  candidate
) {
  const requirements = []

  const regularCandy =
    action
      ?.costs
      ?.candy

  const purifiedCandy =
    action
      ?.costs
      ?.purifiedCandy

  const usePurifiedCost =
    candidate
      ?.traits
      ?.purified ===
      true &&
    Number.isFinite(
      purifiedCandy
    )

  const candy =
    usePurifiedCost
      ? purifiedCandy
      : regularCandy

  if (
    Number.isFinite(
      candy
    ) &&
    candy > 0
  ) {
    requirements.push(
      buildExactResourceRequirement(
        RAID_INVESTMENT_RESOURCE
          .CANDY,

        candy,

        usePurifiedCost
          ? 'EVOLUTION_PURIFIED_CANDY'
          : 'EVOLUTION_CANDY'
      )
    )
  } else if (
    candy != null &&
    !Number.isFinite(
      candy
    )
  ) {
    requirements.push(
      buildUnknownRequirement(
        'EVOLVE_CANDY'
      )
    )
  }

  const items =
    Array.isArray(
      action
        ?.costs
        ?.items
    )
      ? action.costs.items
      : []

  for (
    const item
    of items
  ) {
    requirements.push(
      buildEvolutionItemRequirement(
        item
      )
    )
  }

  return requirements
}

// --------------------------------------------------
// Power-up helpers
// --------------------------------------------------

function getPowerUpLevels(
  possibleState
) {
  const fromLevel =
    possibleState
      ?.action
      ?.fromLevel ??
    possibleState
      ?.changes
      ?.level
      ?.from ??
    null

  const targetLevel =
    possibleState
      ?.action
      ?.targetLevel ??
    possibleState
      ?.changes
      ?.level
      ?.to ??
    possibleState
      ?.combat
      ?.level ??
    null

  return {
    fromLevel,
    targetLevel,
  }
}

function buildPowerUpPokemonContext(
  possibleState,
  candidate
) {
  return {
    pokemonId:
      candidate
        ?.reference
        ?.id ??
      candidate
        ?.pokemonId ??
      possibleState
        ?.pokemonIdentity ??
      null,

    pokemonIdentity:
      candidate
        ?.pokemonIdentity ??
      possibleState
        ?.pokemonIdentity ??
      null,

    lucky:
      candidate
        ?.traits
        ?.lucky ===
      true,

    shadow:
      candidate
        ?.traits
        ?.shadow ===
      true,

    purified:
      candidate
        ?.traits
        ?.purified ===
      true,

    traits: {
      lucky:
        candidate
          ?.traits
          ?.lucky ===
        true,

      shadow:
        candidate
          ?.traits
          ?.shadow ===
        true,

      purified:
        candidate
          ?.traits
          ?.purified ===
        true,
    },
  }
}

function buildPowerUpRequirements(
  possibleState,
  candidate
) {
  const {
    fromLevel,
    targetLevel,
  } =
    getPowerUpLevels(
      possibleState
    )

  if (
    !Number.isFinite(
      fromLevel
    ) ||
    !Number.isFinite(
      targetLevel
    )
  ) {
    return [
      buildIncompletePowerUpRequirement(
        'POWER_UP_LEVELS_MISSING'
      ),
    ]
  }

  const pokemon =
    buildPowerUpPokemonContext(
      possibleState,
      candidate
    )

  const result =
    calculatePowerUpCost({
      fromLevel,
      targetLevel,
      pokemon,
    })

  if (
    result.status !==
    POWER_UP_COST_STATUS
      .SUCCESS
  ) {
    return [
      buildIncompletePowerUpRequirement(
        result.status ===
          POWER_UP_COST_STATUS
            .UNSUPPORTED_SPECIES
          ? 'POWER_UP_SPECIES_NOT_SUPPORTED'
          : 'POWER_UP_RESOURCE_COST_NOT_AVAILABLE'
      ),
    ]
  }

  const requirements = []

  if (
    result.cost.stardust >
    0
  ) {
    requirements.push(
      buildExactResourceRequirement(
        RAID_INVESTMENT_RESOURCE
          .STARDUST,

        result.cost.stardust,

        'POWER_UP_STARDUST'
      )
    )
  }

  if (
    result.cost.candy >
    0
  ) {
    requirements.push(
      buildExactResourceRequirement(
        RAID_INVESTMENT_RESOURCE
          .CANDY,

        result.cost.candy,

        'POWER_UP_CANDY'
      )
    )
  }

  if (
    result.cost.candyXL >
    0
  ) {
    requirements.push(
      buildExactResourceRequirement(
        RAID_INVESTMENT_RESOURCE
          .CANDY_XL,

        result.cost.candyXL,

        'POWER_UP_CANDY_XL'
      )
    )
  }

  return requirements
}

// --------------------------------------------------
// Action interpretation
// --------------------------------------------------

function getRequirementsForAction(
  action,
  possibleState,
  candidate
) {
  if (
    !action ||
    !action.type ||
    action.type ===
      'NONE'
  ) {
    return []
  }

  switch (
    action.type
  ) {
    case 'FAST_TM':
      return [
        buildNormalTmRequirement(
          RAID_INVESTMENT_RESOURCE
            .FAST_TM
        ),
      ]

    case 'CHARGED_TM':
      return [
        buildNormalTmRequirement(
          RAID_INVESTMENT_RESOURCE
            .CHARGED_TM
        ),
      ]

    case 'FAST_AND_CHARGED_TM':
      return [
        buildNormalTmRequirement(
          RAID_INVESTMENT_RESOURCE
            .FAST_TM
        ),

        buildNormalTmRequirement(
          RAID_INVESTMENT_RESOURCE
            .CHARGED_TM
        ),
      ]

    case 'ELITE_FAST_TM':
      return [
        buildEliteTmRequirement(
          RAID_INVESTMENT_RESOURCE
            .ELITE_FAST_TM
        ),
      ]

    case 'ELITE_CHARGED_TM':
      return [
        buildEliteTmRequirement(
          RAID_INVESTMENT_RESOURCE
            .ELITE_CHARGED_TM
        ),
      ]

    case 'ELITE_FAST_AND_CHARGED_TM':
      return [
        buildEliteTmRequirement(
          RAID_INVESTMENT_RESOURCE
            .ELITE_FAST_TM
        ),

        buildEliteTmRequirement(
          RAID_INVESTMENT_RESOURCE
            .ELITE_CHARGED_TM
        ),
      ]

    case 'FAST_TM_AND_ELITE_CHARGED_TM':
      return [
        buildNormalTmRequirement(
          RAID_INVESTMENT_RESOURCE
            .FAST_TM
        ),

        buildEliteTmRequirement(
          RAID_INVESTMENT_RESOURCE
            .ELITE_CHARGED_TM
        ),
      ]

    case 'ELITE_FAST_TM_AND_CHARGED_TM':
      return [
        buildEliteTmRequirement(
          RAID_INVESTMENT_RESOURCE
            .ELITE_FAST_TM
        ),

        buildNormalTmRequirement(
          RAID_INVESTMENT_RESOURCE
            .CHARGED_TM
        ),
      ]

    case 'UNLOCK_SECOND_CHARGED_MOVE':
      return [
        buildSecondMoveRequirement(),
      ]

    case 'POWER_UP':
      return buildPowerUpRequirements(
        possibleState,
        candidate
      )

    case 'EVOLVE':
      return buildEvolutionRequirements(
        action,
        candidate
      )

    case 'SPECIAL_ACQUISITION':
      return [
        buildSpecialRequirement(),
      ]

    default:
      return [
        buildUnknownRequirement(
          action.type
        ),
      ]
  }
}

// --------------------------------------------------
// Requirement aggregation
// --------------------------------------------------

function getRequirementKey(
  requirement
) {
  return [
    requirement.resource,
    requirement.reason,
    requirement.actionType ?? '',
    requirement.itemId ?? '',
  ].join(
    '::'
  )
}

function mergeRequirements(
  requirements
) {
  const merged =
    new Map()

  requirements.forEach(
    (requirement) => {
      const key =
        getRequirementKey(
          requirement
        )

      const existing =
        merged.get(
          key
        )

      if (
        !existing
      ) {
        merged.set(
          key,
          {
            ...requirement,
          }
        )

        return
      }

      // --------------------------------------------
      // Exact deterministic quantities can safely
      // be added together.
      // --------------------------------------------

      if (
        existing.quantityKnown ===
          true &&
        requirement.quantityKnown ===
          true &&
        Number.isFinite(
          existing.exactQuantity
        ) &&
        Number.isFinite(
          requirement.exactQuantity
        )
      ) {
        existing.exactQuantity +=
          requirement.exactQuantity
      } else {
        existing.exactQuantity =
          null

        existing.quantityKnown =
          false
      }

      // --------------------------------------------
      // Minimum quantities can still be aggregated.
      // --------------------------------------------

      if (
        Number.isFinite(
          existing.minimumQuantity
        ) &&
        Number.isFinite(
          requirement.minimumQuantity
        )
      ) {
        existing.minimumQuantity +=
          requirement.minimumQuantity
      } else {
        existing.minimumQuantity =
          null
      }

      existing.deterministic =
        existing.deterministic ===
          true &&
        requirement.deterministic ===
          true

      existing.stochastic =
        existing.stochastic ===
          true ||
        requirement.stochastic ===
          true
    }
  )

  return [
    ...merged.values(),
  ]
}

// --------------------------------------------------
// Cost classification
// --------------------------------------------------

function determineCertainty(
  requirements
) {
  if (
    requirements.length ===
    0
  ) {
    return RAID_INVESTMENT_COST_CERTAINTY
      .NONE
  }

  const hasIncomplete =
    requirements.some(
      (requirement) =>
        requirement.resource ===
          RAID_INVESTMENT_RESOURCE
            .SECOND_CHARGED_MOVE_UNLOCK ||
        requirement.resource ===
          RAID_INVESTMENT_RESOURCE
            .SPECIAL_ACQUISITION ||
        requirement.resource ===
          RAID_INVESTMENT_RESOURCE
            .UNKNOWN ||
        requirement.resourceCostKnown ===
          false
    )

  if (
    hasIncomplete
  ) {
    return RAID_INVESTMENT_COST_CERTAINTY
      .INCOMPLETE
  }

  const hasUncertain =
    requirements.some(
      (requirement) =>
        requirement.quantityKnown !==
          true ||
        requirement.stochastic ===
          true
    )

  if (
    hasUncertain
  ) {
    return RAID_INVESTMENT_COST_CERTAINTY
      .UNCERTAIN
  }

  return RAID_INVESTMENT_COST_CERTAINTY
    .EXACT
}

function summarizeRequirements(
  requirements
) {
  const normalTmRequirements =
    requirements.filter(
      (requirement) =>
        requirement.resource ===
          RAID_INVESTMENT_RESOURCE
            .FAST_TM ||
        requirement.resource ===
          RAID_INVESTMENT_RESOURCE
            .CHARGED_TM
    )

  const eliteTmRequirements =
    requirements.filter(
      (requirement) =>
        requirement.resource ===
          RAID_INVESTMENT_RESOURCE
            .ELITE_FAST_TM ||
        requirement.resource ===
          RAID_INVESTMENT_RESOURCE
            .ELITE_CHARGED_TM
    )

  const requiresSecondMoveUnlock =
    requirements.some(
      (requirement) =>
        requirement.resource ===
        RAID_INVESTMENT_RESOURCE
          .SECOND_CHARGED_MOVE_UNLOCK
    )

  const requiresSpecialAcquisition =
    requirements.some(
      (requirement) =>
        requirement.resource ===
        RAID_INVESTMENT_RESOURCE
          .SPECIAL_ACQUISITION
    )

  const hasUnknownRequirement =
    requirements.some(
      (requirement) =>
        requirement.resource ===
        RAID_INVESTMENT_RESOURCE
          .UNKNOWN
    )

  const hasStochasticCost =
    requirements.some(
      (requirement) =>
        requirement.stochastic ===
        true
    )

  const hasIncompleteResourceCost =
    requirements.some(
      (requirement) =>
        requirement.resourceCostKnown ===
        false
    )

  const evolutionItemRequirements =
    requirements.filter(
      (requirement) =>
        requirement.resource ===
        RAID_INVESTMENT_RESOURCE
          .EVOLUTION_ITEM
    )

  const requiresEvolution =
    requirements.some(
      (requirement) =>
        requirement.reason ===
          'EVOLUTION_CANDY' ||
        requirement.reason ===
          'EVOLUTION_PURIFIED_CANDY' ||
        requirement.reason ===
          'EVOLUTION_ITEM'
    )

  const evolutionItems =
    evolutionItemRequirements.map(
      (requirement) => ({
        itemId:
          requirement.itemId ??
          null,

        quantity:
          requirement.exactQuantity ??
          requirement.minimumQuantity ??
          null,
      })
    )

  const stardust =
    requirements
      .filter(
        (requirement) =>
          requirement.resource ===
          RAID_INVESTMENT_RESOURCE
            .STARDUST
      )
      .reduce(
        (
          total,
          requirement
        ) =>
          total +
          (
            requirement
              .exactQuantity ??
            0
          ),
        0
      )

  const candy =
    requirements
      .filter(
        (requirement) =>
          requirement.resource ===
          RAID_INVESTMENT_RESOURCE
            .CANDY
      )
      .reduce(
        (
          total,
          requirement
        ) =>
          total +
          (
            requirement
              .exactQuantity ??
            0
          ),
        0
      )

  const candyXL =
    requirements
      .filter(
        (requirement) =>
          requirement.resource ===
          RAID_INVESTMENT_RESOURCE
            .CANDY_XL
      )
      .reduce(
        (
          total,
          requirement
        ) =>
          total +
          (
            requirement
              .exactQuantity ??
            0
          ),
        0
      )

  const requiresPowerUp =
    requirements.some(
      (requirement) =>
        requirement.reason ===
          'POWER_UP_STARDUST' ||
        requirement.reason ===
          'POWER_UP_CANDY' ||
        requirement.reason ===
          'POWER_UP_CANDY_XL' ||
        (
          requirement.resource ===
            RAID_INVESTMENT_RESOURCE
              .UNKNOWN &&
          requirement.actionType ===
            'POWER_UP'
        )
    )

  return {
    requirementCount:
      requirements.length,

    normalTmRequirementCount:
      normalTmRequirements.length,

    eliteTmRequirementCount:
      eliteTmRequirements.length,

    requiresSecondMoveUnlock,

    requiresSpecialAcquisition,

    requiresPowerUp,

    requiresEvolution,

    evolutionItemRequirementCount:
      evolutionItemRequirements.length,

    evolutionItems,

    hasUnknownRequirement,

    hasStochasticCost,

    hasIncompleteResourceCost,

    stardust,

    candy,

    candyXL,
  }
}

// --------------------------------------------------
// Public API
// --------------------------------------------------

export function buildRaidInvestmentCost(
  possibleState,
  candidate = null
) {
  if (
    !possibleState ||
    !possibleState.moves
  ) {
    return {
      status:
        RAID_INVESTMENT_COST_STATUS
          .INVALID_STATE,

      requirements: [],
    }
  }

  const actions =
    Array.isArray(
      possibleState.actions
    ) &&
    possibleState.actions.length >
      0
      ? possibleState.actions
      : [
          possibleState.action,

          possibleState
            .additionalMoveAction,
        ].filter(
          Boolean
        )

  const requirements =
    mergeRequirements(
      actions.flatMap(
        (action) =>
          getRequirementsForAction(
            action,
            possibleState,
            candidate
          )
      )
    )

  const certainty =
    determineCertainty(
      requirements
    )

  const summary =
    summarizeRequirements(
      requirements
    )

  return {
    status:
      RAID_INVESTMENT_COST_STATUS
        .SUCCESS,

    pokemonIdentity:
      possibleState
        .pokemonIdentity ??
      null,

    possibleStateType:
      possibleState
        .type ??
      null,

    reachable:
      possibleState
        .reachable !==
      false,

    action:
      possibleState
        .action ??
      null,

    actions,

    additionalMoveAction:
      possibleState
        .additionalMoveAction ??
      null,

    certainty,

    exactCostKnown:
      certainty ===
      RAID_INVESTMENT_COST_CERTAINTY
        .EXACT,

    requirements,

    summary,
  }
}