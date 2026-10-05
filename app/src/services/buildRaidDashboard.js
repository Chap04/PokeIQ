import moves from '../data/reference/moves-pve.json'
import combatData from '../data/reference/combat.json'
import strengthReference from '../data/reference/raid-strength.json'

import {
  buildRaidCandidate,
} from '../utils/raidCandidate'

import {
  buildRaidPossibleStates,
} from '../utils/raidPossibleStates'

import {
  buildRaidBenchmarks,
} from '../utils/raidBenchmarks'

import {
  rankRaidCollectionInvestments,
  RAID_COLLECTION_INVESTMENT_STATUS,
} from '../utils/raidCollectionInvestment'

// --------------------------------------------------
// Possible states
// --------------------------------------------------

function normalizeStateResult(
  result
) {
  if (!result) {
    return null
  }

  if (Array.isArray(result)) {
    const currentState =
      result.find(
        (state) =>
          state?.current === true
      ) ??
      null

    const possibleStates =
      result.filter(
        (state) =>
          state?.current !== true
      )

    return {
      currentState,

      possibleStates,

      powerUpStates:
        possibleStates.filter(
          (state) =>
            state?.type ===
              'POWER_UP' ||
            state?.action?.type ===
              'POWER_UP'
        ),
    }
  }

  const stateList =
    Array.isArray(
      result.states
    )
      ? result.states
      : null

  const currentState =
    result.currentState ??
    result.current ??
    stateList?.find(
      (state) =>
        state?.current === true
    ) ??
    null

  const possibleStates =
    Array.isArray(
      result.possibleStates
    )
      ? result.possibleStates
      : stateList
        ? stateList.filter(
            (state) =>
              state?.current !==
              true
          )
        : null

  if (
    !currentState ||
    !Array.isArray(
      possibleStates
    )
  ) {
    return null
  }

  const powerUpStates =
    Array.isArray(
      result.powerUpStates
    )
      ? result.powerUpStates
      : possibleStates.filter(
          (state) =>
            state?.type ===
              'POWER_UP' ||
            state?.action?.type ===
              'POWER_UP'
        )

  return {
    currentState,

    possibleStates,

    powerUpStates,

    powerUpsIncluded:
      result.powerUpsIncluded ===
      true,
  }
}

function tryBuildPossibleStates(
  candidate
) {
  try {
    const result =
      buildRaidPossibleStates(
        candidate,
        {
          includePowerUps:
            true,
        }
      )

    const normalized =
      normalizeStateResult(
        result
      )

    if (!normalized) {
      return {
        success:
          false,

        reason:
          result?.status ??
          'INVALID_STATE_RESULT',
      }
    }

    return {
      success:
        true,

      ...normalized,
    }
  } catch (error) {
    return {
      success:
        false,

      reason:
        'POSSIBLE_STATES_ERROR',

      error:
        error?.message ??
        String(error),
    }
  }
}

// --------------------------------------------------
// Collection conversion
// --------------------------------------------------

function buildCollectionEntry(
  pokemon
) {
  const candidate =
    buildRaidCandidate(
      pokemon
    )

  if (
    candidate?.status !==
    'READY'
  ) {
    return {
      success:
        false,

      collectionId:
        pokemon.id,

      pokemon,

      reason:
        candidate?.status ??
        'CANDIDATE_NOT_READY',
    }
  }

  const stateResult =
    tryBuildPossibleStates(
      candidate
    )

  if (
    !stateResult.success
  ) {
    return {
      success:
        false,

      collectionId:
        pokemon.id,

      pokemon,

      reason:
        stateResult.reason ??
        'POSSIBLE_STATES_FAILED',

      detail:
        stateResult.error ??
        null,
    }
  }

  return {
    success:
      true,

    entry: {
      collectionId:
        pokemon.id,

      candidate,

      currentState:
        stateResult
          .currentState,

      possibleStates:
        stateResult
          .possibleStates,

      powerUpStates:
        stateResult
          .powerUpStates ??
        [],

      powerUpsIncluded:
        true,
    },
  }
}

// --------------------------------------------------
// Basic formatting
// --------------------------------------------------

function formatEnum(
  value
) {
  if (!value) {
    return 'Unknown'
  }

  return String(value)
    .replace(
      /_/g,
      ' '
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    )
}

function formatMoveName(
  moveId
) {
  if (!moveId) {
    return 'Unknown Move'
  }

  return String(moveId)
    .replace(
      /_FAST$/,
      ''
    )
    .replace(
      /_/g,
      ' '
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    )
}

function formatNumber(
  value
) {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return '0'
  }

  return Math.round(
    value
  ).toLocaleString(
    'en-CA'
  )
}

function formatActionName(
  actionType
) {
  const names = {
    FAST_TM:
      'Fast TM',

    CHARGED_TM:
      'Charged TM',

    ELITE_FAST_TM:
      'Elite Fast TM',

    ELITE_CHARGED_TM:
      'Elite Charged TM',

    UNLOCK_SECOND_CHARGED_MOVE:
      'Unlock Second Charged Move',

    SPECIAL_ACQUISITION:
      'Special Acquisition',

    POWER_UP:
      'Power Up',

    EVOLVE:
      'Evolve',

    EVOLUTION_MOVE_CHANGE:
      'Evolution Move Change',
  }

  return (
    names[
      actionType
    ] ??
    formatEnum(
      actionType
    )
  )
}

function getFirstFinite(
  ...values
) {
  return (
    values.find(
      (value) =>
        Number.isFinite(
          value
        )
    ) ??
    null
  )
}

// --------------------------------------------------
// Opportunity access helpers
// --------------------------------------------------

function getAction(
  opportunity
) {
  return (
    opportunity
      ?.action ??
    opportunity
      ?.assessment
      ?.action ??
    opportunity
      ?.possibleState
      ?.action ??
    null
  )
}

function getActions(
  opportunity
) {
  const actions =
    opportunity
      ?.actions ??
    opportunity
      ?.assessment
      ?.actions ??
    opportunity
      ?.evidence
      ?.actions ??
    opportunity
      ?.possibleState
      ?.actions ??
    null

  if (
    Array.isArray(
      actions
    ) &&
    actions.length >
      0
  ) {
    return actions
  }

  const action =
    getAction(
      opportunity
    )

  return action
    ? [action]
    : []
}

function buildActionPath(
  opportunity
) {
  return getActions(
    opportunity
  )
    .map(
      (
        action,
        index
      ) => ({
        index,

        type:
          action?.type ??
          null,

        label:
          formatActionName(
            action?.type
          ),

        action,
      })
    )
    .filter(
      (step) =>
        Boolean(
          step.type
        )
    )
}

function getChanges(
  opportunity
) {
  return (
    opportunity
      ?.changes ??
    opportunity
      ?.assessment
      ?.changes ??
    opportunity
      ?.possibleState
      ?.changes ??
    null
  )
}

function getDestinationCertainty(
  opportunity
) {
  return (
    opportunity
      ?.destinationCertainty ??
    opportunity
      ?.assessment
      ?.destinationCertainty ??
    opportunity
      ?.evidence
      ?.destinationCertainty ??
    opportunity
      ?.possibleState
      ?.destinationCertainty ??
    'UNKNOWN'
  )
}

function getPossibleStateType(
  opportunity
) {
  return (
    opportunity
      ?.possibleStateType ??
    opportunity
      ?.possibleState
      ?.type ??
    null
  )
}

function getMedianGain(
  opportunity
) {
  return getFirstFinite(
    opportunity
      ?.medianPercentGain,

    opportunity
      ?.assessment
      ?.performanceEvidence
      ?.medianPercentGain,

    opportunity
      ?.assessment
      ?.medianPercentGain,

    opportunity
      ?.evidence
      ?.medianPercentGain,

    opportunity
      ?.assessment
      ?.evidence
      ?.medianPercentGain
  )
}

function getImprovementRate(
  opportunity
) {
  return getFirstFinite(
    opportunity
      ?.improvementRate,

    opportunity
      ?.assessment
      ?.performanceEvidence
      ?.improvementRate,

    opportunity
      ?.assessment
      ?.improvementRate,

    opportunity
      ?.evidence
      ?.improvementRate,

    opportunity
      ?.assessment
      ?.evidence
      ?.improvementRate
  )
}

const MIN_RECOMMENDED_RAID_STRENGTH =
  50

function getRecommendationRaidStrengthScore(
  opportunity
) {
  const raidStrength =
    opportunity
      ?.raidStrength

  return getFirstFinite(
    raidStrength
      ?.bestOverallStrengthScore,

    raidStrength
      ?.bestStrengthScore
  )
}

function isDashboardRecommendationWorthy(
  opportunity
) {
  const performance =
    opportunity
      ?.assessment
      ?.performance ??
    opportunity
      ?.performanceClassification ??
    null

  const raidStrengthScore =
    getRecommendationRaidStrengthScore(
      opportunity
    )

  const hasStrongEnoughDestination =
    Number.isFinite(
      raidStrengthScore
    ) &&
    raidStrengthScore >
      MIN_RECOMMENDED_RAID_STRENGTH

  return (
    hasStrongEnoughDestination &&
    (
      performance ===
        'STRONG_IMPROVEMENT' ||
      performance ===
        'CONSISTENT_IMPROVEMENT'
    )
  )
}

function getMoveChange(
  opportunity
) {
  const changes =
    getChanges(
      opportunity
    )

  if (
    changes
      ?.chargedMove
  ) {
    return {
      moveType:
        'CHARGED',

      ...changes
        .chargedMove,
    }
  }

  if (
    changes
      ?.fastMove
  ) {
    return {
      moveType:
        'FAST',

      ...changes
        .fastMove,
    }
  }

  return null
}

function isPowerUpOpportunity(
  opportunity
) {
  return (
    getPossibleStateType(
      opportunity
    ) ===
      'POWER_UP' ||
    opportunity
      ?.possibleState
      ?.action
      ?.type ===
      'POWER_UP'
  )
}

function isEvolutionOpportunity(
  opportunity
) {
  const possibleStateType =
    getPossibleStateType(
      opportunity
    )

  if (
    possibleStateType ===
      'EVOLUTION' ||
    possibleStateType ===
      'EVOLUTION_MOVE_CHANGE'
  ) {
    return true
  }

  return getActions(
    opportunity
  ).some(
    (action) =>
      action?.type ===
      'EVOLVE'
  )
}

function isStochasticDestinationOpportunity(
  opportunity
) {
  return (
    getDestinationCertainty(
      opportunity
    ) ===
      'STOCHASTIC' ||
    opportunity
      ?.rankGroup ===
      'STOCHASTIC_DESTINATION' ||
    opportunity
      ?.valueClassification ===
      'STOCHASTIC_DESTINATION'
  )
}

function getPowerUpLevels(
  opportunity
) {
  const action =
    getAction(
      opportunity
    )

  const changes =
    getChanges(
      opportunity
    )

  const fromLevel =
    getFirstFinite(
      action
        ?.fromLevel,

      changes
        ?.level
        ?.from,

      opportunity
        ?.powerUpContext
        ?.checkpoint
        ?.fromLevel
    )

  const targetLevel =
    getFirstFinite(
      action
        ?.targetLevel,

      changes
        ?.level
        ?.to,

      opportunity
        ?.possibleState
        ?.combat
        ?.level,

      opportunity
        ?.powerUpContext
        ?.targetLevel
    )

  return {
    fromLevel,

    targetLevel,
  }
}

// --------------------------------------------------
// Evolution identity
// --------------------------------------------------

function getSourcePokemonIdentity(
  opportunity
) {
  return (
    opportunity
      ?.sourcePokemonIdentity ??
    opportunity
      ?.assessment
      ?.sourcePokemonIdentity ??
    opportunity
      ?.evidence
      ?.sourcePokemonIdentity ??
    opportunity
      ?.possibleState
      ?.sourcePokemonIdentity ??
    null
  )
}

function getResultingPokemonIdentity(
  opportunity
) {
  return (
    opportunity
      ?.resultingPokemonIdentity ??
    opportunity
      ?.assessment
      ?.resultingPokemonIdentity ??
    opportunity
      ?.evidence
      ?.resultingPokemonIdentity ??
    opportunity
      ?.possibleState
      ?.pokemonIdentity ??
    null
  )
}

function getEvolutionAction(
  opportunity
) {
  return (
    getActions(
      opportunity
    ).find(
      (action) =>
        action?.type ===
        'EVOLVE'
    ) ??
    null
  )
}

function getEvolutionTargetName(
  opportunity
) {
  const evolutionAction =
    getEvolutionAction(
      opportunity
    )

  const possibleState =
    opportunity
      ?.possibleState

  const candidates = [
    evolutionAction
      ?.toName,

    evolutionAction
      ?.targetName,

    evolutionAction
      ?.resultingName,

    evolutionAction
      ?.target
      ?.name,

    possibleState
      ?.candidate
      ?.reference
      ?.name,

    possibleState
      ?.candidate
      ?.pokemon
      ?.name,

    possibleState
      ?.reference
      ?.name,

    possibleState
      ?.pokemon
      ?.name,
  ]

  return (
    candidates.find(
      (value) =>
        typeof value ===
          'string' &&
        value.trim()
          .length >
          0
    ) ??
    null
  )
}

// --------------------------------------------------
// Candy family
// --------------------------------------------------

function normalizeCandyFamilyId(
  familyId
) {
  if (
    typeof familyId !==
      'string' ||
    familyId.trim()
      .length ===
      0
  ) {
    return null
  }

  return familyId.trim()
}

function formatCandyFamilyName(
  familyId
) {
  const normalized =
    normalizeCandyFamilyId(
      familyId
    )

  if (!normalized) {
    return null
  }

  const familyToken =
    normalized.replace(
      /^FAMILY_/,
      ''
    )

  if (!familyToken) {
    return null
  }

  return formatEnum(
    familyToken
  )
}

function getCandyFamilyId({
  entry,
  opportunity,
}) {
  const candidates = [
    opportunity
      ?.candyFamilyId,

    opportunity
      ?.possibleState
      ?.candidate
      ?.reference
      ?.familyId,

    opportunity
      ?.possibleState
      ?.reference
      ?.familyId,

    opportunity
      ?.assessment
      ?.possibleState
      ?.candidate
      ?.reference
      ?.familyId,

    opportunity
      ?.evidence
      ?.possibleState
      ?.candidate
      ?.reference
      ?.familyId,

    entry
      ?.candidate
      ?.reference
      ?.familyId,

    entry
      ?.currentState
      ?.candidate
      ?.reference
      ?.familyId,

    entry
      ?.currentState
      ?.reference
      ?.familyId,
  ]

  for (
    const candidate
    of candidates
  ) {
    const normalized =
      normalizeCandyFamilyId(
        candidate
      )

    if (normalized) {
      return normalized
    }
  }

  return null
}

function getCandyFamilyMetadata(
  familyId
) {
  const candyFamilyId =
    normalizeCandyFamilyId(
      familyId
    )

  return {
    candyFamilyId,

    candyFamilyName:
      formatCandyFamilyName(
        candyFamilyId
      ),
  }
}

function buildCandyResourceLabel({
  resource,
  candyFamilyName,
}) {
  if (
    resource ===
    'CANDY'
  ) {
    return candyFamilyName
      ? `${candyFamilyName} Candy`
      : 'Candy'
  }

  if (
    resource ===
    'CANDY_XL'
  ) {
    return candyFamilyName
      ? `${candyFamilyName} Candy XL`
      : 'Candy XL'
  }

  return null
}

// --------------------------------------------------
// Raid Strength
// --------------------------------------------------

function getRaidStrength(
  opportunity
) {
  return (
    opportunity
      ?.raidStrength ??
    null
  )
}

function getRaidStrengthScore(
  opportunity
) {
  const raidStrength =
    getRaidStrength(
      opportunity
    )

  return getFirstFinite(
    raidStrength
      ?.bestOverallStrengthScore,

    raidStrength
      ?.bestStrengthScore
  )
}

function getRaidStrengthRoleScore(
  opportunity
) {
  const raidStrength =
    getRaidStrength(
      opportunity
    )

  return getFirstFinite(
    raidStrength
      ?.bestStrengthScore
  )
}

// --------------------------------------------------
// Resource requirements
//
// This is the Recommendation-facing representation
// of an engine cost.
//
// It does NOT represent the resources the player
// currently owns.
//
// Player-resource actionability is evaluated later,
// outside this service.
//
// Pokémon Candy is family-specific. The normalized
// Game Master familyId is therefore attached here so
// downstream resource logic can distinguish:
//
//   FAMILY_ABRA Candy
//   FAMILY_EEVEE Candy
//   FAMILY_BELDUM Candy
//
// without requiring the Raid engine itself to know
// anything about account resource balances.
// --------------------------------------------------

const RESOURCE_LABELS = {
  STARDUST:
    'Stardust',

  CANDY:
    'Candy',

  CANDY_XL:
    'Candy XL',

  FAST_TM:
    'Fast TM',

  CHARGED_TM:
    'Charged TM',

  ELITE_FAST_TM:
    'Elite Fast TM',

  ELITE_CHARGED_TM:
    'Elite Charged TM',

  SECOND_CHARGED_MOVE_UNLOCK:
    'Second Charged Move Unlock',

  SPECIAL_ACQUISITION:
    'Special Acquisition',

  UNKNOWN:
    'Unknown Resource',
}

function getResourceLabel(
  resource
) {
  return (
    RESOURCE_LABELS[
      resource
    ] ??
    formatEnum(
      resource
    )
  )
}

function decorateCandyRequirement(
  requirement,
  fallbackCandyFamilyId = null
) {
  if (!requirement) {
    return null
  }

  if (
    requirement.resource !==
      'CANDY' &&
    requirement.resource !==
      'CANDY_XL'
  ) {
    return requirement
  }

  const candyFamilyId =
    normalizeCandyFamilyId(
      requirement
        .candyFamilyId ??
      fallbackCandyFamilyId
    )

  const candyFamilyName =
    requirement
      .candyFamilyName ??
    formatCandyFamilyName(
      candyFamilyId
    )

  return {
    ...requirement,

    candyFamilyId,

    candyFamilyName,

    label:
      buildCandyResourceLabel({
        resource:
          requirement.resource,

        candyFamilyName,
      }) ??
      requirement.label ??
      getResourceLabel(
        requirement.resource
      ),
  }
}

function normalizeRequirement(
  requirement,
  fallbackCandyFamilyId = null
) {
  if (
    !requirement ||
    !requirement.resource
  ) {
    return null
  }

  const exactQuantity =
    Number.isFinite(
      requirement
        .exactQuantity
    )
      ? requirement
          .exactQuantity
      : null

  const minimumQuantity =
    Number.isFinite(
      requirement
        .minimumQuantity
    )
      ? requirement
          .minimumQuantity
      : null

  const quantityKnown =
    requirement
      .quantityKnown ===
      true ||
    exactQuantity !==
      null

  const normalized = {
    resource:
      requirement.resource,

    label:
      getResourceLabel(
        requirement.resource
      ),

    quantity:
      exactQuantity,

    minimumQuantity,

    exactQuantity,

    quantityKnown,

    exact:
      exactQuantity !==
      null,

    deterministic:
      requirement
        .deterministic ===
      true,

    stochastic:
      requirement
        .stochastic ===
      true,

    reason:
      requirement
        .reason ??
      null,
  }

  return decorateCandyRequirement(
    normalized,
    requirement
      .candyFamilyId ??
    fallbackCandyFamilyId
  )
}

function buildSummaryResourceRequirements(
  cost,
  candyFamilyId = null
) {
  const summary =
    cost?.summary

  if (!summary) {
    return []
  }

  const requirements = []

  const stardust =
    getFirstFinite(
      summary.stardust
    ) ??
    0

  const candy =
    getFirstFinite(
      summary.candy
    ) ??
    0

  const candyXL =
    getFirstFinite(
      summary.candyXL
    ) ??
    0

  if (
    stardust >
    0
  ) {
    requirements.push({
      resource:
        'STARDUST',

      label:
        'Stardust',

      quantity:
        stardust,

      minimumQuantity:
        stardust,

      exactQuantity:
        stardust,

      quantityKnown:
        true,

      exact:
        true,

      deterministic:
        true,

      stochastic:
        false,

      reason:
        null,
    })
  }

  if (
    candy >
    0
  ) {
    requirements.push(
      decorateCandyRequirement(
        {
          resource:
            'CANDY',

          label:
            'Candy',

          quantity:
            candy,

          minimumQuantity:
            candy,

          exactQuantity:
            candy,

          quantityKnown:
            true,

          exact:
            true,

          deterministic:
            true,

          stochastic:
            false,

          reason:
            null,
        },
        candyFamilyId
      )
    )
  }

  if (
    candyXL >
    0
  ) {
    requirements.push(
      decorateCandyRequirement(
        {
          resource:
            'CANDY_XL',

          label:
            'Candy XL',

          quantity:
            candyXL,

          minimumQuantity:
            candyXL,

          exactQuantity:
            candyXL,

          quantityKnown:
            true,

          exact:
            true,

          deterministic:
            true,

          stochastic:
            false,

          reason:
            null,
        },
        candyFamilyId
      )
    )
  }

  return requirements
}

function buildPowerUpContextRequirements(
  opportunity,
  candyFamilyId = null
) {
  const cost =
    opportunity
      ?.powerUpContext
      ?.incrementalCost

  if (!cost) {
    return []
  }

  const requirements = []

  const resources = [
    {
      resource:
        'STARDUST',

      quantity:
        cost.stardust,
    },

    {
      resource:
        'CANDY',

      quantity:
        cost.candy,
    },

    {
      resource:
        'CANDY_XL',

      quantity:
        cost.candyXL,
    },
  ]

  resources.forEach(
    ({
      resource,
      quantity,
    }) => {
      if (
        !Number.isFinite(
          quantity
        ) ||
        quantity <=
          0
      ) {
        return
      }

      const requirement = {
        resource,

        label:
          getResourceLabel(
            resource
          ),

        quantity,

        minimumQuantity:
          quantity,

        exactQuantity:
          quantity,

        quantityKnown:
          true,

        exact:
          true,

        deterministic:
          true,

        stochastic:
          false,

        reason:
          null,
      }

      requirements.push(
        decorateCandyRequirement(
          requirement,
          candyFamilyId
        )
      )
    }
  )

  return requirements
}

function mergeResourceRequirements(
  primary,
  secondary
) {
  const merged =
    new Map()

  ;[
    ...primary,
    ...secondary,
  ].forEach(
    (requirement) => {
      if (
        !requirement
          ?.resource
      ) {
        return
      }

      const mergeKey =
        requirement.resource ===
          'CANDY' ||
        requirement.resource ===
          'CANDY_XL'
          ? (
              `${requirement.resource}:` +
              `${requirement.candyFamilyId ?? 'UNKNOWN_FAMILY'}`
            )
          : requirement.resource

      if (
        !merged.has(
          mergeKey
        )
      ) {
        merged.set(
          mergeKey,
          requirement
        )

        return
      }

      const existing =
        merged.get(
          mergeKey
        )

      if (
        existing
          ?.exact !==
          true &&
        requirement
          ?.exact ===
          true
      ) {
        merged.set(
          mergeKey,
          requirement
        )

        return
      }

      if (
        !existing
          ?.candyFamilyId &&
        requirement
          ?.candyFamilyId
      ) {
        merged.set(
          mergeKey,
          requirement
        )
      }
    }
  )

  return [
    ...merged.values(),
  ]
}

function buildResourceRequirements(
  opportunity,
  candyFamilyId = null
) {
  const cost =
    opportunity?.cost ??
    opportunity
      ?.value
      ?.cost ??
    null

  const explicitRequirements =
    Array.isArray(
      cost?.requirements
    )
      ? cost.requirements
          .map(
            (requirement) =>
              normalizeRequirement(
                requirement,
                candyFamilyId
              )
          )
          .filter(
            Boolean
          )
      : []

  const summaryRequirements =
    buildSummaryResourceRequirements(
      cost,
      candyFamilyId
    )

  const contextRequirements =
    isPowerUpOpportunity(
      opportunity
    )
      ? buildPowerUpContextRequirements(
          opportunity,
          candyFamilyId
        )
      : []

  return mergeResourceRequirements(
    mergeResourceRequirements(
      explicitRequirements,
      summaryRequirements
    ),

    contextRequirements
  )
}

function buildResourceRequirementText(
  requirement
) {
  if (!requirement) {
    return null
  }

  if (
    Number.isFinite(
      requirement.quantity
    )
  ) {
    return (
      `${formatNumber(
        requirement.quantity
      )} ${requirement.label}`
    )
  }

  if (
    Number.isFinite(
      requirement
        .minimumQuantity
    )
  ) {
    if (
      requirement.stochastic ===
      true
    ) {
      return (
        `${requirement.label} required`
      )
    }

    return (
      `At least ${formatNumber(
        requirement.minimumQuantity
      )} ${requirement.label}`
    )
  }

  return (
    `${requirement.label} required`
  )
}

function buildResourceSummary(
  resourceRequirements
) {
  if (
    !Array.isArray(
      resourceRequirements
    ) ||
    resourceRequirements
      .length ===
      0
  ) {
    return null
  }

  const parts =
    resourceRequirements
      .map(
        buildResourceRequirementText
      )
      .filter(
        Boolean
      )

  if (
    parts.length ===
    0
  ) {
    return null
  }

  if (
    parts.length ===
    1
  ) {
    return parts[0]
  }

  if (
    parts.length ===
    2
  ) {
    return (
      `${parts[0]} and ${parts[1]}`
    )
  }

  return (
    `${parts
      .slice(
        0,
        -1
      )
      .join(
        ', '
      )}, and ${
        parts[
          parts.length -
          1
        ]
      }`
  )
}

// --------------------------------------------------
// Titles
// --------------------------------------------------

function buildTitle(
  opportunity
) {
  if (
    isPowerUpOpportunity(
      opportunity
    )
  ) {
    const {
      targetLevel,
    } =
      getPowerUpLevels(
        opportunity
      )

    if (
      Number.isFinite(
        targetLevel
      )
    ) {
      return (
        `Power Up to Level ${targetLevel}`
      )
    }

    return 'Power Up'
  }

  if (
    isEvolutionOpportunity(
      opportunity
    )
  ) {
    const targetName =
      getEvolutionTargetName(
        opportunity
      )

    if (targetName) {
      return (
        `Evolve into ${targetName}`
      )
    }

    return 'Evolution Investment'
  }

  const moveChange =
    getMoveChange(
      opportunity
    )

  if (
    moveChange?.to
  ) {
    return (
      `Teach ${formatMoveName(
        moveChange.to
      )}`
    )
  }

  const action =
    getAction(
      opportunity
    )

  return formatActionName(
    action?.type ??
      'IMPROVE_RAID_MOVESET'
  )
}

// --------------------------------------------------
// Recommendation action description
// --------------------------------------------------

function buildActionDescription(
  opportunity,
  resourceSummary
) {
  if (
    isPowerUpOpportunity(
      opportunity
    )
  ) {
    const {
      fromLevel,
      targetLevel,
    } =
      getPowerUpLevels(
        opportunity
      )

    let actionText

    if (
      Number.isFinite(
        fromLevel
      ) &&
      Number.isFinite(
        targetLevel
      )
    ) {
      actionText =
        `Power this Pokémon from Level ${fromLevel} to Level ${targetLevel}.`
    } else if (
      Number.isFinite(
        targetLevel
      )
    ) {
      actionText =
        `Power this Pokémon up to Level ${targetLevel}.`
    } else {
      actionText =
        'Power this Pokémon up.'
    }

    if (
      resourceSummary
    ) {
      return (
        `${actionText} Requires ${resourceSummary}.`
      )
    }

    return actionText
  }

  if (
    isEvolutionOpportunity(
      opportunity
    )
  ) {
    const targetName =
      getEvolutionTargetName(
        opportunity
      )

    const actionPath =
      buildActionPath(
        opportunity
      )

    const pathText =
      actionPath
        .map(
          (step) =>
            step.label
        )
        .join(
          ' → '
        )

    let actionText

    if (targetName) {
      actionText =
        `Develop this Pokémon into ${targetName}.`
    } else {
      actionText =
        'Develop this Pokémon through its evolution path.'
    }

    if (
      pathText
    ) {
      actionText +=
        ` Planned path: ${pathText}.`
    }

    if (
      resourceSummary
    ) {
      actionText +=
        ` Requires ${resourceSummary}.`
    }

    return actionText
  }

  const moveChange =
    getMoveChange(
      opportunity
    )

  const action =
    getAction(
      opportunity
    )

  const actionName =
    formatActionName(
      action?.type
    )

  if (
    moveChange?.from &&
    moveChange?.to
  ) {
    return (
      `Replace ${formatMoveName(
        moveChange.from
      )} with ${formatMoveName(
        moveChange.to
      )} using a ${actionName}.`
    )
  }

  if (
    moveChange?.to
  ) {
    return (
      `Teach ${formatMoveName(
        moveChange.to
      )} using a ${actionName}.`
    )
  }

  if (
    resourceSummary
  ) {
    return (
      `Requires ${resourceSummary}.`
    )
  }

  return null
}

function buildPerformanceDescription(
  opportunity
) {
  const medianGain =
    getMedianGain(
      opportunity
    )

  const improvementRate =
    getImprovementRate(
      opportunity
    )

  const parts = []

  if (
    Number.isFinite(
      medianGain
    )
  ) {
    parts.push(
      `${
        medianGain >=
        0
          ? '+'
          : ''
      }${medianGain.toFixed(
        1
      )}% median raid DPS`
    )
  }

  if (
    Number.isFinite(
      improvementRate
    )
  ) {
    parts.push(
      `improves ${Math.round(
        improvementRate *
          100
      )}% of benchmark matchups`
    )
  }

  if (
    parts.length ===
    0
  ) {
    return (
      'PokeIQ found a better general raid state for this Pokémon.'
    )
  }

  return `${parts.join(
    ' and '
  )}.`
}

function buildPowerUpContextDescription(
  opportunity
) {
  if (
    !isPowerUpOpportunity(
      opportunity
    )
  ) {
    return null
  }

  const context =
    opportunity
      ?.powerUpContext

  if (!context) {
    return null
  }

  const marginalGain =
    context
      ?.incrementalPerformance
      ?.medianPercentGain

  const targetLevel =
    context
      ?.targetLevel

  if (
    context
      ?.isPremiumOpportunity ===
      true
  ) {
    if (
      Number.isFinite(
        marginalGain
      )
    ) {
      return (
        `The final stretch to Level ${targetLevel} adds about ${marginalGain.toFixed(
          1
        )}% median raid DPS and is a meaningful premium investment.`
      )
    }

    return (
      `Level ${targetLevel} is a meaningful premium investment checkpoint.`
    )
  }

  if (
    context
      ?.isOrdinaryStoppingPoint ===
      true
  ) {
    return (
      `Level ${targetLevel} is the recommended ordinary-resource stopping point.`
    )
  }

  if (
    context
      ?.isRecommendedCheckpoint ===
      true
  ) {
    return (
      `Level ${targetLevel} is a recommended power-up checkpoint.`
    )
  }

  return null
}

function buildDestinationDescription(
  opportunity
) {
  const certainty =
    getDestinationCertainty(
      opportunity
    )

  if (
    certainty ===
    'STOCHASTIC'
  ) {
    return (
      'The exact represented post-evolution moveset is not guaranteed, so treat this as a planning opportunity rather than a guaranteed action.'
    )
  }

  if (
    certainty ===
    'UNAVAILABLE'
  ) {
    return (
      'The exact represented destination is not currently obtainable.'
    )
  }

  if (
    certainty ===
    'UNKNOWN'
  ) {
    return (
      'PokeIQ cannot currently guarantee the exact represented destination.'
    )
  }

  return null
}

function buildDescription(
  opportunity,
  resourceSummary
) {
  const actionDescription =
    buildActionDescription(
      opportunity,
      resourceSummary
    )

  const performanceDescription =
    buildPerformanceDescription(
      opportunity
    )

  const powerUpContextDescription =
    buildPowerUpContextDescription(
      opportunity
    )

  const destinationDescription =
    isStochasticDestinationOpportunity(
      opportunity
    )
      ? buildDestinationDescription(
          opportunity
        )
      : null

  return [
    actionDescription,
    performanceDescription,
    powerUpContextDescription,
    destinationDescription,
  ]
    .filter(
      Boolean
    )
    .join(
      ' '
    )
}

// --------------------------------------------------
// Warning
// --------------------------------------------------

function buildWarning(
  opportunity,
  resourceRequirements = null
) {
  if (
    opportunity
      ?.destroysProtectedMove ===
      true
  ) {
    return (
      'This change would replace a protected move.'
    )
  }

  if (
    opportunity
      ?.reachable ===
      false
  ) {
    return (
      'This target state is not currently obtainable.'
    )
  }

  if (
    getDestinationCertainty(
      opportunity
    ) ===
    'STOCHASTIC'
  ) {
    return (
      'The exact post-evolution moveset is not guaranteed.'
    )
  }

  if (
    opportunity
      ?.valueClassification ===
      'COST_INCOMPLETE'
  ) {
    return (
      'Some required resource costs are not fully modeled yet.'
    )
  }

  const resolvedResourceRequirements =
    Array.isArray(
      resourceRequirements
    )
      ? resourceRequirements
      : buildResourceRequirements(
          opportunity
        )

  const hasResource = (
    resource
  ) =>
    resolvedResourceRequirements.some(
      (requirement) =>
        requirement
          ?.resource ===
        resource
    )

  if (
    hasResource(
      'ELITE_CHARGED_TM'
    )
  ) {
    return (
      'This change requires an Elite Charged TM.'
    )
  }

  if (
    hasResource(
      'ELITE_FAST_TM'
    )
  ) {
    return (
      'This change requires an Elite Fast TM.'
    )
  }

  if (
    hasResource(
      'SPECIAL_ACQUISITION'
    )
  ) {
    return (
      'This move requires a special acquisition method.'
    )
  }

  if (
    hasResource(
      'CANDY_XL'
    )
  ) {
    return (
      'This power-up requires Candy XL.'
    )
  }

  if (
    isPowerUpOpportunity(
      opportunity
    ) &&
    opportunity
      ?.powerUpContext
      ?.isPremiumOpportunity ===
      true
  ) {
    return (
      'This power-up crosses into premium Candy XL investment.'
    )
  }

  if (
    opportunity
      ?.resourceBurden ===
      'PREMIUM'
  ) {
    return (
      'This investment requires a premium resource.'
    )
  }

  return null
}

// --------------------------------------------------
// Artwork
// --------------------------------------------------

function buildPokemonArtworkData(
  pokemon
) {
  if (!pokemon) {
    return null
  }

  return {
    id:
      pokemon.pokemonId,

    form:
      pokemon.pokemonForm,

    name:
      pokemon.name,

    shiny:
      pokemon.shiny ??
      false,

    variant:
      pokemon.shadow
        ? 'shadow'
        : pokemon.purified
          ? 'purified'
          : 'normal',
  }
}

// --------------------------------------------------
// Recommendation
// --------------------------------------------------

function buildRecommendation({
  entry,
  pokemon,
  opportunityOverride = null,
  rankOverride = null,
  recommendationType =
    'ACTIONABLE',
}) {
  const opportunity =
    opportunityOverride ??
    entry
      ?.topActionableOpportunity ??
    entry
      ?.topOpportunity

  if (!opportunity) {
    return null
  }

  const moveChange =
    getMoveChange(
      opportunity
    )

  const action =
    getAction(
      opportunity
    )

  const actions =
    getActions(
      opportunity
    )

  const actionPath =
    buildActionPath(
      opportunity
    )

  const powerUp =
    isPowerUpOpportunity(
      opportunity
    )

  const evolution =
    isEvolutionOpportunity(
      opportunity
    )

  const stochasticDestination =
    isStochasticDestinationOpportunity(
      opportunity
    )

  const powerUpLevels =
    powerUp
      ? getPowerUpLevels(
          opportunity
        )
      : null

  const candyFamilyId =
    getCandyFamilyId({
      entry,
      opportunity,
    })

  const {
    candyFamilyName,
  } =
    getCandyFamilyMetadata(
      candyFamilyId
    )

  const resourceRequirements =
    buildResourceRequirements(
      opportunity,
      candyFamilyId
    )

  const resourceSummary =
    buildResourceSummary(
      resourceRequirements
    )

  const raidStrength =
    getRaidStrength(
      opportunity
    )

  const destinationCertainty =
    getDestinationCertainty(
      opportunity
    )

  const sourcePokemonIdentity =
    getSourcePokemonIdentity(
      opportunity
    )

  const resultingPokemonIdentity =
    getResultingPokemonIdentity(
      opportunity
    )

  const evolutionTargetName =
    evolution
      ? getEvolutionTargetName(
          opportunity
        )
      : null

  return {
    collectionId:
      entry.collectionId,

    rank:
      rankOverride ??
      entry
        .actionableRank ??
      entry
        .stochasticDestinationRank ??
      entry.rank ??
      null,

    recommendationType,

    actionable:
      recommendationType ===
        'ACTIONABLE' &&
      !stochasticDestination,

    stochasticDestination,

    destinationCertainty,

    possibleStateType:
      getPossibleStateType(
        opportunity
      ),

    sourcePokemonIdentity,

    resultingPokemonIdentity,

    candyFamilyId,

    candyFamilyName,

    pokemonName:
      pokemon?.name ??
      entry
        ?.candidate
        ?.reference
        ?.name ??
      'Pokémon',

    pokemon:
      buildPokemonArtworkData(
        pokemon
      ),

    ownedPokemon: {
      cp:
        Number.isFinite(
          pokemon?.cp
        )
          ? pokemon.cp
          : null,

      ivs: {
        attack:
          Number.isFinite(
            pokemon
              ?.ivs
              ?.attack
          )
            ? pokemon.ivs.attack
            : null,

        defense:
          Number.isFinite(
            pokemon
              ?.ivs
              ?.defense
          )
            ? pokemon.ivs.defense
            : null,

        stamina:
          Number.isFinite(
            pokemon
              ?.ivs
              ?.stamina
          )
            ? pokemon.ivs.stamina
            : null,
      },
    },

    title:
      buildTitle(
        opportunity
      ),

    description:
      buildDescription(
        opportunity,
        resourceSummary
      ),

    action:
      formatActionName(
        action?.type
      ),

    actionType:
      action?.type ??
      null,

    actions,

    actionPath,

    actionPathText:
      actionPath
        .map(
          (step) =>
            step.label
        )
        .join(
          ' → '
        ),

    moveChange:
      moveChange
        ? {
            ...moveChange,

            fromName:
              formatMoveName(
                moveChange.from
              ),

            toName:
              formatMoveName(
                moveChange.to
              ),
          }
        : null,

    isEvolution:
      evolution,

    evolution:
      evolution
        ? {
            targetName:
              evolutionTargetName,

            sourcePokemonIdentity,

            resultingPokemonIdentity,

            destinationCertainty,

            stochasticDestination,

            candyFamilyId,

            candyFamilyName,
          }
        : null,

    // ------------------------------------------------
    // Raid Strength
    // ------------------------------------------------

    raidStrength,

    raidStrengthStatus:
      raidStrength
        ?.status ??
      null,

    raidStrengthClassification:
      raidStrength
        ?.bestClassification ??
      null,

    raidStrengthScore:
      getRaidStrengthScore(
        opportunity
      ),

    raidStrengthRoleScore:
      getRaidStrengthRoleScore(
        opportunity
      ),

    raidStrengthBestMatchupId:
      raidStrength
        ?.bestMatchupId ??
      null,

    raidStrengthBestRoleType:
      raidStrength
        ?.bestRoleType ??
      null,

    raidStrengthCompetitiveMatchupCount:
      raidStrength
        ?.competitiveMatchupCount ??
      0,

    raidStrengthStrongMatchupCount:
      raidStrength
        ?.strongMatchupCount ??
      0,

    raidStrengthEliteMatchupCount:
      raidStrength
        ?.eliteMatchupCount ??
      0,

    raidStrengthRelevantMatchupCount:
      raidStrength
        ?.relevantMatchupCount ??
      0,

    // ------------------------------------------------
    // Resource requirement output
    // ------------------------------------------------

    resourceRequirements,

    resourceRequirementCount:
      resourceRequirements
        .length,

    resourceSummary,

    hasResourceRequirements:
      resourceRequirements
        .length >
      0,

    hasExactResourceRequirements:
      resourceRequirements
        .length >
        0 &&
      resourceRequirements
        .every(
          (requirement) =>
            requirement.exact ===
            true
        ),

    hasStochasticResourceRequirement:
      resourceRequirements
        .some(
          (requirement) =>
            requirement.stochastic ===
            true
        ),

    isPowerUp:
      powerUp,

    powerUp:
      powerUp
        ? {
            fromLevel:
              powerUpLevels
                ?.fromLevel ??
              null,

            targetLevel:
              powerUpLevels
                ?.targetLevel ??
              null,

            recommendedCheckpoint:
              opportunity
                ?.powerUpContext
                ?.isRecommendedCheckpoint ===
              true,

            ordinaryStoppingPoint:
              opportunity
                ?.powerUpContext
                ?.isOrdinaryStoppingPoint ===
              true,

            premiumOpportunity:
              opportunity
                ?.powerUpContext
                ?.isPremiumOpportunity ===
              true,

            checkpointRole:
              opportunity
                ?.powerUpContext
                ?.checkpointRole ??
              null,

            marginalGain:
              opportunity
                ?.powerUpContext
                ?.incrementalPerformance
                ?.medianPercentGain ??
              null,
          }
        : null,

    medianGain:
      getMedianGain(
        opportunity
      ),

    improvementRate:
      getImprovementRate(
        opportunity
      ),

    value:
      formatEnum(
        opportunity
          .valueClassification
      ),

    valueClassification:
      opportunity
        .valueClassification ??
      null,

    performance:
      formatEnum(
        opportunity
          ?.assessment
          ?.performance ??
        opportunity
          ?.performanceClassification
      ),

    resourceBurden:
      formatEnum(
        opportunity
          .resourceBurden
      ),

    resourceBurdenType:
      opportunity
        .resourceBurden ??
      null,

    warning:
      buildWarning(
        opportunity,
        resourceRequirements
      ),

    opportunity,
  }
}

// --------------------------------------------------
// Public API
// --------------------------------------------------

export function buildRaidDashboard(
  pokemonCollection
) {
  if (
    !Array.isArray(
      pokemonCollection
    )
  ) {
    return {
      status:
        'INVALID_COLLECTION',

      recommendations: [],

      potentialEvolutionInvestments:
        [],

      analyzedCount:
        0,

      skippedCount:
        0,

      benchmarkCount:
        0,

      actionableCount:
        0,

      stochasticDestinationCount:
        0,

      potentialEvolutionInvestmentCount:
        0,

      highValueCount:
        0,

      powerUpsEnabled:
        true,

      skippedPokemon: [],
    }
  }

  const converted =
    pokemonCollection.map(
      buildCollectionEntry
    )

  const successful =
    converted.filter(
      (result) =>
        result.success ===
        true
    )

  const skipped =
    converted.filter(
      (result) =>
        result.success !==
        true
    )

  const entries =
    successful.map(
      (result) =>
        result.entry
    )

  const matchups =
    buildRaidBenchmarks()

  if (
    entries.length ===
    0
  ) {
    return {
      status:
        'NO_ANALYZABLE_POKEMON',

      recommendations: [],

      potentialEvolutionInvestments:
        [],

      analyzedCount:
        0,

      skippedCount:
        skipped.length,

      benchmarkCount:
        matchups.length,

      actionableCount:
        0,

      stochasticDestinationCount:
        0,

      potentialEvolutionInvestmentCount:
        0,

      highValueCount:
        0,

      powerUpsEnabled:
        true,

      skippedPokemon:
        skipped,
    }
  }

  const ranking =
    rankRaidCollectionInvestments({
      entries,

      matchups,

      moves,

      combatData,

      strengthReference,
    })

  if (
    ranking.status !==
    RAID_COLLECTION_INVESTMENT_STATUS
      .SUCCESS
  ) {
    return {
      status:
        'RANKING_FAILED',

      rankingStatus:
        ranking.status,

      recommendations: [],

      potentialEvolutionInvestments:
        [],

      analyzedCount:
        entries.length,

      skippedCount:
        skipped.length,

      benchmarkCount:
        matchups.length,

      actionableCount:
        0,

      stochasticDestinationCount:
        0,

      potentialEvolutionInvestmentCount:
        0,

      highValueCount:
        0,

      powerUpsEnabled:
        true,

      skippedPokemon:
        skipped,
    }
  }

  const collectionLookup =
    new Map(
      pokemonCollection.map(
        (pokemon) => [
          pokemon.id,
          pokemon,
        ]
      )
    )

  // ------------------------------------------------
  // Guaranteed actionable recommendations
  //
  // These remain the only opportunities shown as
  // "Recommended Next Steps".
  // ------------------------------------------------

  const sourceEntries =
    (
      ranking
        .actionableEntries ??
      []
    ).filter(
      (entry) =>
        isDashboardRecommendationWorthy(
          entry
            ?.topActionableOpportunity ??
          entry
            ?.topOpportunity
        )
    )

    const recommendations =
    sourceEntries
      .map(
        (entry) =>
          buildRecommendation({
            entry,

            pokemon:
              collectionLookup.get(
                entry.collectionId
              ),

            recommendationType:
              'ACTIONABLE',
          })
      )
      .filter(
        Boolean
      )
      .map(
        (
          recommendation,
          index
        ) => ({
          ...recommendation,

          engineRank:
            recommendation.rank,

          rank:
            index + 1,
        })
      )

  // ------------------------------------------------
  // Stochastic evolution investments
  //
  // These are intentionally NOT merged into
  // `recommendations`.
  //
  // The exact represented final moveset is not
  // guaranteed, so the Dashboard must present these
  // as planning opportunities rather than instructions.
  // ------------------------------------------------

  const stochasticEntries =
    ranking
      .stochasticDestinationEntries ??
    []

  const potentialEvolutionInvestments =
    stochasticEntries
      .filter(
        (entry) => {
          const opportunity =
            entry
              ?.topStochasticDestinationOpportunity ??
            entry
              ?.topOpportunity

          return (
            isEvolutionOpportunity(
              opportunity
            ) &&
            isDashboardRecommendationWorthy(
              opportunity
            )
          )
        }
      )
      .map(
        (entry) => {
          const opportunity =
            entry
              ?.topStochasticDestinationOpportunity ??
            entry
              ?.topOpportunity

          return buildRecommendation({
            entry,

            pokemon:
              collectionLookup.get(
                entry.collectionId
              ),

            opportunityOverride:
              opportunity,

            rankOverride:
              entry
                .stochasticDestinationRank ??
              null,

            recommendationType:
              'POTENTIAL_EVOLUTION',
          })
        }
      )
      .filter(
        Boolean
      )
      .slice(
        0,
        6
      )
      .map(
        (
          recommendation,
          index
        ) => ({
          ...recommendation,

          engineRank:
            recommendation.rank,

          rank:
            index + 1,
        })
      )

  const powerUpRecommendations =
    recommendations.filter(
      (recommendation) =>
        recommendation
          .isPowerUp ===
        true
    )

  return {
    status:
      'SUCCESS',

    recommendations,

    potentialEvolutionInvestments,

    analyzedCount:
      entries.length,

    skippedCount:
      skipped.length,

    benchmarkCount:
      matchups.length,

    actionableCount:
      ranking
        .actionableEntryCount ??
      recommendations.length,

    stochasticDestinationCount:
      ranking
        .stochasticDestinationEntryCount ??
      0,

    potentialEvolutionInvestmentCount:
      potentialEvolutionInvestments
        .length,

    highValueCount:
      ranking
        .highValueEntryCount ??
      0,

    powerUpsEnabled:
      true,

    powerUpRecommendationCount:
      powerUpRecommendations
        .length,

    powerUpRecommendations,

    skippedPokemon:
      skipped,

    ranking,
  }
}