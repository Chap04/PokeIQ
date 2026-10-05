import {
  PROJECT_ACTION_STATUS,
  PROJECT_ACTION_TYPE,
  PROJECT_RESOURCE,
} from '../utils/projectConstants.js'

// --------------------------------------------------
// PokeIQ Project Action Evaluator V1
//
// Current supported vertical slice:
//
// 1. MEET_RESOURCE_REQUIREMENT
// 2. POWER_UP_POKEMON
//
// The evaluator derives live Action status from:
// - Player resource balances
// - Family Candy balances
// - Current Collection membership
// - Canonical Pokémon combat state
// - Dependency Action evaluations
//
// It does NOT:
// - spend resources
// - reserve resources
// - convert Rare Candy
// - modify Collection Pokémon
// - persist status
//
// Action status is derived every time the Project is
// evaluated.
// --------------------------------------------------

export const PROJECT_ACTION_EVALUATION_REASON = {
  REQUIREMENT_MET:
    'REQUIREMENT_MET',

  INSUFFICIENT_RESOURCE:
    'INSUFFICIENT_RESOURCE',

  RESOURCE_BALANCE_UNKNOWN:
    'RESOURCE_BALANCE_UNKNOWN',

  INVALID_RESOURCE_REQUIREMENT:
    'INVALID_RESOURCE_REQUIREMENT',

  COLLECTION_ENTRY_NOT_FOUND:
    'COLLECTION_ENTRY_NOT_FOUND',

  COMBAT_STATE_UNKNOWN:
    'COMBAT_STATE_UNKNOWN',

  CURRENT_LEVEL_UNKNOWN:
    'CURRENT_LEVEL_UNKNOWN',

  TARGET_LEVEL_REACHED:
    'TARGET_LEVEL_REACHED',

  TARGET_LEVEL_NOT_REACHED:
    'TARGET_LEVEL_NOT_REACHED',

  DEPENDENCIES_INCOMPLETE:
    'DEPENDENCIES_INCOMPLETE',

  READY_TO_PERFORM:
    'READY_TO_PERFORM',

  UNSUPPORTED_ACTION:
    'UNSUPPORTED_ACTION',

  INVALID_ACTION:
    'INVALID_ACTION',
}

// --------------------------------------------------
// Generic helpers
// --------------------------------------------------

function clamp(
  value,
  minimum,
  maximum
) {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value
    )
  )
}

function getProgressPercent({
  current,
  required,
}) {
  if (
    !Number.isFinite(
      current
    ) ||
    !Number.isFinite(
      required
    ) ||
    required <= 0
  ) {
    return null
  }

  return clamp(
    (
      current /
      required
    ) *
      100,
    0,
    100
  )
}

function buildProgress({
  current,
  required,
}) {
  if (
    !Number.isFinite(
      current
    ) ||
    !Number.isFinite(
      required
    )
  ) {
    return {
      current:
        Number.isFinite(
          current
        )
          ? current
          : null,

      required:
        Number.isFinite(
          required
        )
          ? required
          : null,

      remaining:
        null,

      percent:
        null,
    }
  }

  const remaining =
    Math.max(
      0,
      required -
        current
    )

  return {
    current,
    required,
    remaining,

    percent:
      getProgressPercent({
        current,
        required,
      }),
  }
}

function getCollectionId(
  pokemon
) {
  const candidates = [
    pokemon
      ?.collectionId,

    pokemon
      ?.id,
  ]

  return (
    candidates.find(
      value =>
        typeof value ===
          'string' &&
        value.trim().length >
          0
    ) ??
    null
  )
}

function findCollectionPokemon({
  collection,
  collectionId,
}) {
  if (
    !Array.isArray(
      collection
    ) ||
    !collectionId
  ) {
    return null
  }

  return (
    collection.find(
      pokemon =>
        getCollectionId(
          pokemon
        ) ===
        collectionId
    ) ??
    null
  )
}

function getDependencyEvaluations({
  action,
  actionEvaluations,
}) {
  const dependencyIds =
    Array.isArray(
      action
        ?.dependsOn
    )
      ? action.dependsOn
      : []

  if (
    dependencyIds.length ===
    0
  ) {
    return []
  }

  if (
    Array.isArray(
      actionEvaluations
    )
  ) {
    return dependencyIds
      .map(
        dependencyId =>
          actionEvaluations.find(
            evaluation =>
              evaluation
                ?.actionId ===
              dependencyId
          ) ??
          null
      )
  }

  if (
    actionEvaluations &&
    typeof actionEvaluations ===
      'object'
  ) {
    return dependencyIds.map(
      dependencyId =>
        actionEvaluations[
          dependencyId
        ] ??
        null
    )
  }

  return dependencyIds.map(
    () => null
  )
}

function evaluateDependencies({
  action,
  actionEvaluations,
}) {
  const dependencyIds =
    Array.isArray(
      action
        ?.dependsOn
    )
      ? action.dependsOn
      : []

  if (
    dependencyIds.length ===
    0
  ) {
    return {
      dependencyCount: 0,
      completeCount: 0,
      incompleteCount: 0,
      unknownCount: 0,
      allComplete: true,
      evaluations: [],
    }
  }

  const evaluations =
    getDependencyEvaluations({
      action,
      actionEvaluations,
    })

  let completeCount = 0
  let incompleteCount = 0
  let unknownCount = 0

  for (
    const evaluation
    of evaluations
  ) {
    if (!evaluation) {
      unknownCount += 1
      continue
    }

    if (
      evaluation.status ===
      PROJECT_ACTION_STATUS
        .COMPLETE
    ) {
      completeCount += 1
      continue
    }

    if (
      evaluation.status ===
      PROJECT_ACTION_STATUS
        .UNKNOWN
    ) {
      unknownCount += 1
      continue
    }

    incompleteCount += 1
  }

  return {
    dependencyCount:
      dependencyIds.length,

    completeCount,
    incompleteCount,
    unknownCount,

    allComplete:
      completeCount ===
      dependencyIds.length,

    evaluations,
  }
}

// --------------------------------------------------
// Resource balance helpers
// --------------------------------------------------

function getGlobalResourceBalance({
  resource,
  playerResources,
}) {
  if (
    !playerResources ||
    typeof playerResources !==
      'object'
  ) {
    return null
  }

  if (
    resource ===
    PROJECT_RESOURCE
      .STARDUST
  ) {
    return (
      Number.isFinite(
        playerResources
          .stardust
      )
        ? playerResources
            .stardust
        : null
    )
  }

  return null
}

function getFamilyResourceBalance({
  resource,
  candyFamilyId,
  candyFamilyBalances,
}) {
  if (
    !candyFamilyId ||
    !candyFamilyBalances ||
    typeof candyFamilyBalances !==
      'object'
  ) {
    return null
  }

  const familyBalance =
    candyFamilyBalances[
      candyFamilyId
    ]

  if (
    !familyBalance ||
    typeof familyBalance !==
      'object'
  ) {
    return null
  }

  if (
    resource ===
    PROJECT_RESOURCE
      .CANDY
  ) {
    return (
      Number.isFinite(
        familyBalance.candy
      )
        ? familyBalance.candy
        : null
    )
  }

  if (
    resource ===
    PROJECT_RESOURCE
      .CANDY_XL
  ) {
    return (
      Number.isFinite(
        familyBalance.candyXL
      )
        ? familyBalance
            .candyXL
        : null
    )
  }

  return null
}

function getResourceBalance({
  requirement,
  playerResources,
  candyFamilyBalances,
}) {
  const resource =
    requirement
      ?.resource

  if (
    resource ===
    PROJECT_RESOURCE
      .STARDUST
  ) {
    return (
      getGlobalResourceBalance({
        resource,
        playerResources,
      })
    )
  }

  if (
    resource ===
      PROJECT_RESOURCE
        .CANDY ||
    resource ===
      PROJECT_RESOURCE
        .CANDY_XL
  ) {
    return (
      getFamilyResourceBalance({
        resource,
        candyFamilyId:
          requirement
            ?.candyFamilyId,
        candyFamilyBalances,
      })
    )
  }

  return null
}

// --------------------------------------------------
// Resource Action
// --------------------------------------------------

function evaluateResourceAction({
  action,
  playerResources,
  candyFamilyBalances,
}) {
  const requirement =
    action
      ?.requirement

  const resource =
    requirement
      ?.resource

  const required =
    requirement
      ?.required

  const validResource =
    resource ===
      PROJECT_RESOURCE
        .STARDUST ||
    resource ===
      PROJECT_RESOURCE
        .CANDY ||
    resource ===
      PROJECT_RESOURCE
        .CANDY_XL

  if (
    !validResource ||
    !Number.isFinite(
      required
    ) ||
    required <= 0
  ) {
    return {
      actionId:
        action?.id ??
        null,

      projectId:
        action
          ?.projectId ??
        null,

      type:
        action?.type ??
        null,

      status:
        PROJECT_ACTION_STATUS
          .UNKNOWN,

      reason:
        PROJECT_ACTION_EVALUATION_REASON
          .INVALID_RESOURCE_REQUIREMENT,

      progress:
        buildProgress({
          current: null,
          required:
            Number.isFinite(
              required
            )
              ? required
              : null,
        }),

      resource:
        resource ??
        null,

      candyFamilyId:
        requirement
          ?.candyFamilyId ??
        null,
    }
  }

  const owned =
    getResourceBalance({
      requirement,
      playerResources,
      candyFamilyBalances,
    })

  if (
    !Number.isFinite(
      owned
    )
  ) {
    return {
      actionId:
        action.id,

      projectId:
        action
          ?.projectId ??
        null,

      type:
        action.type,

      status:
        PROJECT_ACTION_STATUS
          .UNKNOWN,

      reason:
        PROJECT_ACTION_EVALUATION_REASON
          .RESOURCE_BALANCE_UNKNOWN,

      progress:
        buildProgress({
          current: null,
          required,
        }),

      resource,

      candyFamilyId:
        requirement
          ?.candyFamilyId ??
        null,
    }
  }

  const progress =
    buildProgress({
      current: owned,
      required,
    })

  if (
    owned >=
    required
  ) {
    return {
      actionId:
        action.id,

      projectId:
        action
          ?.projectId ??
        null,

      type:
        action.type,

      status:
        PROJECT_ACTION_STATUS
          .COMPLETE,

      reason:
        PROJECT_ACTION_EVALUATION_REASON
          .REQUIREMENT_MET,

      progress,

      resource,

      candyFamilyId:
        requirement
          ?.candyFamilyId ??
        null,
    }
  }

  return {
    actionId:
      action.id,

    projectId:
      action
        ?.projectId ??
      null,

    type:
      action.type,

    status:
      PROJECT_ACTION_STATUS
        .IN_PROGRESS,

    reason:
      PROJECT_ACTION_EVALUATION_REASON
        .INSUFFICIENT_RESOURCE,

    progress,

    resource,

    candyFamilyId:
      requirement
        ?.candyFamilyId ??
      null,
  }
}

// --------------------------------------------------
// Pokémon combat-state helpers
// --------------------------------------------------

function getCombatStateLevel(
  combatState
) {
  const candidates = [
    combatState
      ?.level,

    combatState
      ?.combat
      ?.level,

    combatState
      ?.playerLevel,

    combatState
      ?.inferredLevel,

    combatState
      ?.levelInference
      ?.level,
  ]

  return (
    candidates.find(
      value =>
        Number.isFinite(
          value
        )
    ) ??
    null
  )
}

function combatStateIsUsable(
  combatState
) {
  if (
    !combatState ||
    typeof combatState !==
      'object'
  ) {
    return false
  }

  if (
    combatState.status ===
    'READY'
  ) {
    return true
  }

  return Number.isFinite(
    getCombatStateLevel(
      combatState
    )
  )
}

// --------------------------------------------------
// Power-Up Action
// --------------------------------------------------

function evaluatePowerUpAction({
  action,
  collection,
  combatState,
  actionEvaluations,
}) {
  const collectionId =
    action
      ?.collectionId

  const targetLevel =
    action
      ?.target
      ?.level

  const ownedPokemon =
    findCollectionPokemon({
      collection,
      collectionId,
    })

  if (!ownedPokemon) {
    return {
      actionId:
        action?.id ??
        null,

      projectId:
        action
          ?.projectId ??
        null,

      type:
        action?.type ??
        null,

      status:
        PROJECT_ACTION_STATUS
          .UNKNOWN,

      reason:
        PROJECT_ACTION_EVALUATION_REASON
          .COLLECTION_ENTRY_NOT_FOUND,

      collectionId:
        collectionId ??
        null,

      currentLevel:
        null,

      targetLevel:
        Number.isFinite(
          targetLevel
        )
          ? targetLevel
          : null,

      dependencies:
        evaluateDependencies({
          action,
          actionEvaluations,
        }),
    }
  }

  if (
    !combatStateIsUsable(
      combatState
    )
  ) {
    return {
      actionId:
        action.id,

      projectId:
        action
          ?.projectId ??
        null,

      type:
        action.type,

      status:
        PROJECT_ACTION_STATUS
          .UNKNOWN,

      reason:
        PROJECT_ACTION_EVALUATION_REASON
          .COMBAT_STATE_UNKNOWN,

      collectionId,

      currentLevel:
        null,

      targetLevel:
        Number.isFinite(
          targetLevel
        )
          ? targetLevel
          : null,

      dependencies:
        evaluateDependencies({
          action,
          actionEvaluations,
        }),
    }
  }

  const currentLevel =
    getCombatStateLevel(
      combatState
    )

  if (
    !Number.isFinite(
      currentLevel
    )
  ) {
    return {
      actionId:
        action.id,

      projectId:
        action
          ?.projectId ??
        null,

      type:
        action.type,

      status:
        PROJECT_ACTION_STATUS
          .UNKNOWN,

      reason:
        PROJECT_ACTION_EVALUATION_REASON
          .CURRENT_LEVEL_UNKNOWN,

      collectionId,

      currentLevel:
        null,

      targetLevel:
        Number.isFinite(
          targetLevel
        )
          ? targetLevel
          : null,

      dependencies:
        evaluateDependencies({
          action,
          actionEvaluations,
        }),
    }
  }

  if (
    Number.isFinite(
      targetLevel
    ) &&
    currentLevel >=
      targetLevel
  ) {
    return {
      actionId:
        action.id,

      projectId:
        action
          ?.projectId ??
        null,

      type:
        action.type,

      status:
        PROJECT_ACTION_STATUS
          .COMPLETE,

      reason:
        PROJECT_ACTION_EVALUATION_REASON
          .TARGET_LEVEL_REACHED,

      collectionId,

      currentLevel,
      targetLevel,

      progress:
        buildProgress({
          current:
            currentLevel,

          required:
            targetLevel,
        }),

      dependencies:
        evaluateDependencies({
          action,
          actionEvaluations,
        }),
    }
  }

  const dependencies =
    evaluateDependencies({
      action,
      actionEvaluations,
    })

  if (
    !dependencies
      .allComplete
  ) {
    return {
      actionId:
        action.id,

      projectId:
        action
          ?.projectId ??
        null,

      type:
        action.type,

      status:
        PROJECT_ACTION_STATUS
          .BLOCKED,

      reason:
        PROJECT_ACTION_EVALUATION_REASON
          .DEPENDENCIES_INCOMPLETE,

      collectionId,

      currentLevel,
      targetLevel,

      progress:
        buildProgress({
          current:
            currentLevel,

          required:
            targetLevel,
        }),

      dependencies,
    }
  }

  return {
    actionId:
      action.id,

    projectId:
      action
        ?.projectId ??
      null,

    type:
      action.type,

    status:
      PROJECT_ACTION_STATUS
        .READY,

    reason:
      PROJECT_ACTION_EVALUATION_REASON
        .READY_TO_PERFORM,

    collectionId,

    currentLevel,
    targetLevel,

    progress:
      buildProgress({
        current:
          currentLevel,

        required:
          targetLevel,
      }),

    dependencies,
  }
}

// --------------------------------------------------
// Public API
// --------------------------------------------------

export function evaluateProjectAction({
  action,
  collection = [],
  playerResources = {},
  candyFamilyBalances = {},
  combatState = null,
  actionEvaluations = [],
} = {}) {
  if (
    !action ||
    typeof action !==
      'object' ||
    !action.type
  ) {
    return {
      actionId:
        action?.id ??
        null,

      projectId:
        action
          ?.projectId ??
        null,

      type:
        action?.type ??
        null,

      status:
        PROJECT_ACTION_STATUS
          .UNKNOWN,

      reason:
        PROJECT_ACTION_EVALUATION_REASON
          .INVALID_ACTION,
    }
  }

  if (
    action.type ===
    PROJECT_ACTION_TYPE
      .MEET_RESOURCE_REQUIREMENT
  ) {
    return (
      evaluateResourceAction({
        action,
        playerResources,
        candyFamilyBalances,
      })
    )
  }

  if (
    action.type ===
    PROJECT_ACTION_TYPE
      .POWER_UP_POKEMON
  ) {
    return (
      evaluatePowerUpAction({
        action,
        collection,
        combatState,
        actionEvaluations,
      })
    )
  }

  return {
    actionId:
      action.id,

    projectId:
      action
        ?.projectId ??
      null,

    type:
      action.type,

    status:
      PROJECT_ACTION_STATUS
        .UNKNOWN,

    reason:
      PROJECT_ACTION_EVALUATION_REASON
        .UNSUPPORTED_ACTION,
  }
}

export default evaluateProjectAction