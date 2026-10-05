import {
  PROJECT_ACTION_STATUS,
  PROJECT_ACTION_TYPE,
  PROJECT_HEALTH,
  PROJECT_STATUS,
} from '../utils/projectConstants.js'

import {
  evaluateProjectAction,
} from './evaluateProjectAction.js'

// --------------------------------------------------
// PokeIQ Project Progress Evaluator V1
//
// Evaluates one persisted Project against the
// player's current account state.
//
// Current responsibilities:
//
// - Verify the Project's owned Pokémon still exists.
// - Evaluate resource Actions first.
// - Evaluate dependent Pokémon Actions afterward.
// - Derive Project progress from Action results.
// - Determine whether the Project goal is complete.
// - Preserve player-controlled Project lifecycle.
// - Never spend, reserve, or convert resources.
//
// Project completion is derived from live account
// state. Persistence decisions remain outside this
// service.
// --------------------------------------------------

export const PROJECT_PROGRESS_STATUS = {
  SUCCESS:
    'SUCCESS',

  INVALID_PROJECT:
    'INVALID_PROJECT',

  COLLECTION_ENTRY_NOT_FOUND:
    'COLLECTION_ENTRY_NOT_FOUND',
}

// --------------------------------------------------
// Generic helpers
// --------------------------------------------------

function getCollectionId(
  pokemon
) {
  const candidates = [
    pokemon?.collectionId,
    pokemon?.id,
  ]

  return (
    candidates.find(
      value =>
        typeof value ===
          'string' &&
        value.trim().length > 0
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

function normalizeActions({
  project,
  actions,
}) {
  if (
    !Array.isArray(
      actions
    )
  ) {
    return []
  }

  const projectActionIds =
    Array.isArray(
      project?.actions
    )
      ? new Set(
          project.actions
        )
      : null

  return actions
    .filter(
      action => {
        if (
          !action ||
          typeof action !==
            'object'
        ) {
          return false
        }

        if (
          action.projectId ===
          project?.id
        ) {
          return true
        }

        if (
          projectActionIds &&
          projectActionIds.has(
            action.id
          )
        ) {
          return true
        }

        return false
      }
    )
    .sort(
      (
        first,
        second
      ) => {
        const firstOrder =
          Number.isFinite(
            first?.order
          )
            ? first.order
            : Number.MAX_SAFE_INTEGER

        const secondOrder =
          Number.isFinite(
            second?.order
          )
            ? second.order
            : Number.MAX_SAFE_INTEGER

        if (
          firstOrder !==
          secondOrder
        ) {
          return (
            firstOrder -
            secondOrder
          )
        }

        return String(
          first?.id ?? ''
        ).localeCompare(
          String(
            second?.id ?? ''
          )
        )
      }
    )
}

function buildEvaluationMap(
  evaluations
) {
  const result = {}

  for (
    const evaluation
    of evaluations
  ) {
    if (
      !evaluation?.actionId
    ) {
      continue
    }

    result[
      evaluation.actionId
    ] = evaluation
  }

  return result
}

// --------------------------------------------------
// Action ordering
// --------------------------------------------------
//
// Resource Actions are evaluated before dependent
// Pokémon Actions.
//
// This lets the POWER_UP_POKEMON evaluator inspect
// the live resource Action results without needing
// resource logic of its own.
// --------------------------------------------------

function getEvaluationPriority(
  action
) {
  if (
    action?.type ===
    PROJECT_ACTION_TYPE
      .MEET_RESOURCE_REQUIREMENT
  ) {
    return 1
  }

  if (
    action?.type ===
    PROJECT_ACTION_TYPE
      .POWER_UP_POKEMON
  ) {
    return 2
  }

  return 3
}

function orderActionsForEvaluation(
  actions
) {
  return [...actions].sort(
    (
      first,
      second
    ) => {
      const priorityDifference =
        getEvaluationPriority(
          first
        ) -
        getEvaluationPriority(
          second
        )

      if (
        priorityDifference !==
        0
      ) {
        return (
          priorityDifference
        )
      }

      const firstOrder =
        Number.isFinite(
          first?.order
        )
          ? first.order
          : Number.MAX_SAFE_INTEGER

      const secondOrder =
        Number.isFinite(
          second?.order
        )
          ? second.order
          : Number.MAX_SAFE_INTEGER

      return (
        firstOrder -
        secondOrder
      )
    }
  )
}

// --------------------------------------------------
// Combat-state resolution
// --------------------------------------------------
//
// The caller may supply combat state in either:
//
// 1. A single combatState object
// 2. A combatStatesByCollectionId map
//
// This keeps this service independent from the
// canonical combat-state builder.
// --------------------------------------------------

function getCombatStateForAction({
  action,
  project,
  combatState,
  combatStatesByCollectionId,
}) {
  const collectionId =
    action?.collectionId ??
    project?.collectionId ??
    null

  if (
    collectionId &&
    combatStatesByCollectionId &&
    typeof combatStatesByCollectionId ===
      'object'
  ) {
    const mapped =
      combatStatesByCollectionId[
        collectionId
      ]

    if (mapped) {
      return mapped
    }
  }

  if (
    combatState &&
    typeof combatState ===
      'object'
  ) {
    return combatState
  }

  return null
}

// --------------------------------------------------
// Summary
// --------------------------------------------------

function buildActionSummary(
  evaluations
) {
  let completeCount = 0
  let readyCount = 0
  let blockedCount = 0
  let inProgressCount = 0
  let unknownCount = 0

  for (
    const evaluation
    of evaluations
  ) {
    switch (
      evaluation?.status
    ) {
      case PROJECT_ACTION_STATUS
        .COMPLETE:
        completeCount += 1
        break

      case PROJECT_ACTION_STATUS
        .READY:
        readyCount += 1
        break

      case PROJECT_ACTION_STATUS
        .BLOCKED:
        blockedCount += 1
        break

      case PROJECT_ACTION_STATUS
        .IN_PROGRESS:
        inProgressCount += 1
        break

      default:
        unknownCount += 1
        break
    }
  }

  const totalCount =
    evaluations.length

  const incompleteCount =
    Math.max(
      0,
      totalCount -
        completeCount
    )

  const progressPercent =
    totalCount > 0
      ? (
          completeCount /
          totalCount
        ) *
        100
      : 0

  return {
    totalCount,
    completeCount,
    incompleteCount,
    readyCount,
    blockedCount,
    inProgressCount,
    unknownCount,

    progressPercent:
      Math.min(
        100,
        Math.max(
          0,
          progressPercent
        )
      ),

    allComplete:
      totalCount > 0 &&
      completeCount ===
        totalCount,
  }
}

// --------------------------------------------------
// Project lifecycle
// --------------------------------------------------

function getEffectiveProjectStatus({
  project,
  actionSummary,
}) {
  const storedStatus =
    project?.status

  // Explicit player lifecycle choices win.
  if (
    storedStatus ===
    PROJECT_STATUS
      .ABANDONED
  ) {
    return (
      PROJECT_STATUS
        .ABANDONED
    )
  }

  if (
    storedStatus ===
    PROJECT_STATUS
      .PAUSED
  ) {
    return (
      PROJECT_STATUS
        .PAUSED
    )
  }

  // Completion is derived from the live target state.
  if (
    actionSummary
      ?.allComplete
  ) {
    return (
      PROJECT_STATUS
        .COMPLETED
    )
  }

  // A previously completed Project can become
  // incomplete if the live account state no longer
  // satisfies its requirements.
  //
  // We intentionally derive ACTIVE here rather than
  // trusting stale persisted completion.
  return (
    PROJECT_STATUS
      .ACTIVE
  )
}

// --------------------------------------------------
// Public API
// --------------------------------------------------

export function evaluateProjectProgress({
  project,
  actions = [],
  collection = [],
  playerResources = {},
  candyFamilyBalances = {},
  combatState = null,
  combatStatesByCollectionId = {},
} = {}) {
  if (
    !project ||
    typeof project !==
      'object' ||
    !project.id
  ) {
    return {
      status:
        PROJECT_PROGRESS_STATUS
          .INVALID_PROJECT,

      projectId:
        project?.id ??
        null,

      health:
        PROJECT_HEALTH
          .UNKNOWN,

      storedStatus:
        project?.status ??
        null,

      effectiveStatus:
        null,

      ownedPokemon:
        null,

      actions: [],

      actionSummary:
        buildActionSummary(
          []
        ),
    }
  }

  const projectActions =
    normalizeActions({
      project,
      actions,
    })

  const ownedPokemon =
    findCollectionPokemon({
      collection,
      collectionId:
        project.collectionId,
    })

  if (!ownedPokemon) {
    return {
      status:
        PROJECT_PROGRESS_STATUS
          .COLLECTION_ENTRY_NOT_FOUND,

      projectId:
        project.id,

      health:
        PROJECT_HEALTH
          .INVALID,

      storedStatus:
        project.status,

      effectiveStatus:
        project.status,

      ownedPokemon:
        null,

      actions: [],

      actionSummary:
        buildActionSummary(
          []
        ),

      reason:
        'PROJECT_POKEMON_NOT_FOUND',
    }
  }

  const orderedActions =
    orderActionsForEvaluation(
      projectActions
    )

  const evaluations = []

  for (
    const action
    of orderedActions
  ) {
    const actionEvaluations =
      buildEvaluationMap(
        evaluations
      )

    const resolvedCombatState =
      getCombatStateForAction({
        action,
        project,
        combatState,
        combatStatesByCollectionId,
      })

    const evaluation =
      evaluateProjectAction({
        action,
        collection,
        playerResources,
        candyFamilyBalances,
        combatState:
          resolvedCombatState,
        actionEvaluations,
      })

    evaluations.push(
      evaluation
    )
  }

  // Return evaluations in display order rather than
  // internal evaluation-priority order.
  const evaluationMap =
    buildEvaluationMap(
      evaluations
    )

  const displayEvaluations =
    projectActions.map(
      action => ({
        action,
        evaluation:
          evaluationMap[
            action.id
          ] ?? {
            actionId:
              action.id,

            projectId:
              project.id,

            type:
              action.type,

            status:
              PROJECT_ACTION_STATUS
                .UNKNOWN,

            reason:
              'ACTION_NOT_EVALUATED',
          },
      })
    )

  const actionSummary =
    buildActionSummary(
      displayEvaluations.map(
        item =>
          item.evaluation
      )
    )

  const effectiveStatus =
    getEffectiveProjectStatus({
      project,
      actionSummary,
    })

  return {
    status:
      PROJECT_PROGRESS_STATUS
        .SUCCESS,

    projectId:
      project.id,

    health:
      PROJECT_HEALTH
        .VALID,

    storedStatus:
      project.status,

    effectiveStatus,

    isComplete:
      actionSummary
        .allComplete,

    ownedPokemon,

    targetState:
      project
        ?.targetState ??
      null,

    actions:
      displayEvaluations,

    actionSummary,
  }
}

export default evaluateProjectProgress