// --------------------------------------------------
// PokeIQ Project History V1
//
// Project History answers:
//
//   "What meaningful Project investments have already
//    been completed on this exact owned Pokémon?"
//
// The Project plan remains LIVE.
//
// History is PERSISTED.
//
// We do not infer accomplishments from titles.
//
// Instead:
//
// Previous Project snapshot
//          ↓
// Current owned Pokémon state
//          ↓
// Previous justified Project targets
//          ↓
// Detect completed investments
//          ↓
// Immutable history events
//          ↓
// New snapshot
//
// IMPORTANT:
//
// - collectionId remains the exact owned-Pokémon anchor.
// - Only investments that were previously justified by
//   the Project plan can become history events.
// - Not Currently Justified opportunities do NOT count.
// - A Collection edit may complete multiple investments.
// - Snapshots are only added when the meaningful Project
//   state or tracked targets actually change.
// --------------------------------------------------

export const PROJECT_HISTORY_RECORD_TYPE = {
  STATE_SNAPSHOT:
    'PROJECT_STATE_SNAPSHOT',

  HISTORY_EVENT:
    'PROJECT_HISTORY_EVENT',
}

export const PROJECT_HISTORY_EVENT_TYPE = {
  POWER_UP:
    'POWER_UP_COMPLETED',

  EVOLUTION:
    'EVOLUTION_COMPLETED',

  FAST_MOVE:
    'FAST_MOVE_CHANGED',

  CHARGED_MOVE:
    'CHARGED_MOVE_CHANGED',

  SECOND_CHARGED_MOVE:
    'SECOND_CHARGED_MOVE_UNLOCKED',
}

// --------------------------------------------------
// Generic helpers
// --------------------------------------------------

function normalizeString(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null
  }

  const normalized =
    String(
      value
    ).trim()

  return normalized.length > 0
    ? normalized
    : null
}

function normalizeIdentity(
  value
) {
  const normalized =
    normalizeString(
      value
    )

  return normalized
    ? normalized.toUpperCase()
    : null
}

function normalizeMoveId(
  value
) {
  const normalized =
    normalizeString(
      value
    )

  return normalized
    ? normalized.toUpperCase()
    : null
}

function normalizeNameForComparison(
  value
) {
  const normalized =
    normalizeString(
      value
    )

  if (!normalized) {
    return null
  }

  return normalized
    .toLowerCase()
    .replace(
      /[^a-z0-9]/g,
      ''
    )
}

function formatEnum(
  value
) {
  if (!value) {
    return 'Unknown'
  }

  return String(value)
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
      character =>
        character.toUpperCase()
    )
}

function formatMoveName(
  moveId
) {
  return formatEnum(
    moveId
  )
}

function formatPokemonIdentityName(
  pokemonIdentity
) {
  const normalized =
    normalizeIdentity(
      pokemonIdentity
    )

  if (!normalized) {
    return null
  }

  const speciesId =
    normalized
      .split('__')[0]

  return formatEnum(
    speciesId
  )
}

function unique(
  values
) {
  return [
    ...new Set(
      values.filter(
        value =>
          value !==
          null &&
          value !==
          undefined
      )
    ),
  ]
}

// --------------------------------------------------
// Current Pokémon state
// --------------------------------------------------

function getCandidate(
  plan
) {
  return (
    plan?.candidate ??
    plan
      ?.currentState
      ?.candidate ??
    null
  )
}

function getChargedSlots(
  candidate,
  ownedPokemon
) {
  const candidateSlots =
    candidate
      ?.moves
      ?.chargedSlots

  if (
    candidateSlots &&
    typeof candidateSlots ===
      'object'
  ) {
    return {
      slot1:
        normalizeMoveId(
          candidateSlots
            .slot1
        ),

      slot2:
        normalizeMoveId(
          candidateSlots
            .slot2
        ),
    }
  }

  const candidateCharged =
    Array.isArray(
      candidate
        ?.moves
        ?.charged
    )
      ? candidate
          .moves
          .charged
      : []

  if (
    candidateCharged.length >
    0
  ) {
    return {
      slot1:
        normalizeMoveId(
          candidateCharged[0]
        ),

      slot2:
        normalizeMoveId(
          candidateCharged[1]
        ),
    }
  }

  return {
    slot1:
      normalizeMoveId(
        ownedPokemon
          ?.chargedMove1Id ??
        ownedPokemon
          ?.chargedMove1
      ),

    slot2:
      normalizeMoveId(
        ownedPokemon
          ?.chargedMove2Id ??
        ownedPokemon
          ?.chargedMove2
      ),
  }
}

function buildPokemonState({
  plan,
  ownedPokemon,
}) {
  const candidate =
    getCandidate(
      plan
    )

  const chargedSlots =
    getChargedSlots(
      candidate,
      ownedPokemon
    )

  const pokemonIdentity =
    normalizeIdentity(
      candidate
        ?.pokemonIdentity ??
      plan
        ?.pokemonIdentity ??
      ownedPokemon
        ?.pokemonIdentity
    )

  const pokemonName =
    normalizeString(
      ownedPokemon?.name
    ) ??
    formatPokemonIdentityName(
      pokemonIdentity
    )

  return {
    pokemonIdentity,

    pokemonName,

    level:
      Number.isFinite(
        candidate?.level
      )
        ? candidate.level
        : null,

    fastMoveId:
      normalizeMoveId(
        candidate
          ?.moves
          ?.fast ??
        ownedPokemon
          ?.fastMoveId ??
        ownedPokemon
          ?.fastMove
      ),

    chargedMove1Id:
      chargedSlots.slot1,

    chargedMove2Id:
      chargedSlots.slot2,
  }
}

// --------------------------------------------------
// Planned target extraction
//
// Only Recommended Now and Future Investment are
// included.
//
// Not Currently Justified deliberately does not become
// a tracked completion target.
// --------------------------------------------------

function getJustifiedPlanItems(
  plan
) {
  return [
    ...(
      Array.isArray(
        plan?.recommendedNow
      )
        ? plan
            .recommendedNow
        : []
    ),

    ...(
      Array.isArray(
        plan?.futureInvestments
      )
        ? plan
            .futureInvestments
        : []
    ),
  ]
}

function getEvolutionTargetIdentity(
  item
) {
  const opportunity =
    item?.opportunity

  const candidates = [
    opportunity
      ?.possibleState
      ?.pokemonIdentity,

    opportunity
      ?.possibleState
      ?.candidate
      ?.pokemonIdentity,

    opportunity
      ?.possibleState
      ?.candidate
      ?.reference
      ?.identity,

    opportunity
      ?.possibleState
      ?.reference
      ?.identity,
  ]

  for (
    const candidate
    of candidates
  ) {
    const normalized =
      normalizeIdentity(
        candidate
      )

    if (normalized) {
      return normalized
    }
  }

  return null
}

function isSecondMovePlanItem(
  item
) {
  if (
    item?.actionType ===
      'UNLOCK_SECOND_CHARGED_MOVE'
  ) {
    return true
  }

  return (
    Array.isArray(
      item?.actionPath
    ) &&
    item.actionPath.some(
      step =>
        step?.type ===
        'UNLOCK_SECOND_CHARGED_MOVE'
    )
  )
}

function buildTrackedTarget(
  item
) {
  if (!item) {
    return null
  }

  return {
    intentKey:
      item.intentKey ??
      null,

    title:
      item.title ??
      null,

    actionType:
      item.actionType ??
      null,

    possibleStateType:
      item.possibleStateType ??
      null,

    isPowerUp:
      item.isPowerUp ===
      true,

    targetLevel:
      Number.isFinite(
        item.targetLevel
      )
        ? item.targetLevel
        : null,

    moveChange:
      item.moveChange
        ? {
            moveType:
              item
                .moveChange
                .moveType ??
              null,

            slot:
              item
                .moveChange
                .slot ??
              null,

            from:
              normalizeMoveId(
                item
                  .moveChange
                  .from
              ),

            to:
              normalizeMoveId(
                item
                  .moveChange
                  .to
              ),
          }
        : null,

    isEvolution:
      item.isEvolution ===
      true,

    evolutionTargetName:
      normalizeString(
        item.evolutionTargetName
      ),

    evolutionTargetIdentity:
      getEvolutionTargetIdentity(
        item
      ),

    isSecondChargedMove:
      isSecondMovePlanItem(
        item
      ),
  }
}

function buildTrackedTargets(
  plan
) {
  return getJustifiedPlanItems(
    plan
  )
    .map(
      buildTrackedTarget
    )
    .filter(Boolean)
}

// --------------------------------------------------
// Stable target keys
// --------------------------------------------------

function buildTargetKey(
  target
) {
  if (
    target?.isPowerUp &&
    Number.isFinite(
      target.targetLevel
    )
  ) {
    return (
      `POWER_UP::${target.targetLevel}`
    )
  }

  if (
    target?.isEvolution
  ) {
    return (
      'EVOLUTION::' +
      (
        target
          .evolutionTargetIdentity ??
        target
          .evolutionTargetName ??
        'UNKNOWN'
      )
    )
  }

  if (
    target
      ?.moveChange
      ?.moveType ===
      'FAST' &&
    target
      ?.moveChange
      ?.to
  ) {
    return (
      `FAST_MOVE::${target.moveChange.to}`
    )
  }

  if (
    target
      ?.moveChange
      ?.moveType ===
      'CHARGED' &&
    target
      ?.moveChange
      ?.to
  ) {
    return (
      'CHARGED_MOVE::' +
      `${target.moveChange.slot ?? 'UNKNOWN'}::` +
      `${target.moveChange.to}`
    )
  }

  if (
    target
      ?.isSecondChargedMove
  ) {
    return (
      'SECOND_CHARGED_MOVE'
    )
  }

  return (
    target?.intentKey ??
    target?.actionType ??
    target?.possibleStateType ??
    target?.title ??
    null
  )
}

function normalizeTargets(
  targets
) {
  return targets
    .map(
      target => ({
        ...target,

        targetKey:
          buildTargetKey(
            target
          ),
      })
    )
    .filter(
      target =>
        Boolean(
          target.targetKey
        )
    )
    .sort(
      (
        first,
        second
      ) =>
        String(
          first.targetKey
        ).localeCompare(
          String(
            second.targetKey
          )
        )
    )
}

// --------------------------------------------------
// Snapshot
// --------------------------------------------------

function buildSnapshotPayload({
  project,
  plan,
  ownedPokemon,
}) {
  return {
    projectId:
      project.id,

    collectionId:
      project.collectionId,

    pokemonState:
      buildPokemonState({
        plan,
        ownedPokemon,
      }),

    trackedTargets:
      normalizeTargets(
        buildTrackedTargets(
          plan
        )
      ),
  }
}

function buildSnapshotSignature(
  payload
) {
  return JSON.stringify({
    pokemonState:
      payload.pokemonState,

    trackedTargets:
      payload
        .trackedTargets
        .map(
          target => ({
            targetKey:
              target.targetKey,

            targetLevel:
              target.targetLevel,

            moveChange:
              target.moveChange,

            evolutionTargetIdentity:
              target
                .evolutionTargetIdentity,

            evolutionTargetName:
              target
                .evolutionTargetName,

            isSecondChargedMove:
              target
                .isSecondChargedMove,
          })
        ),
  })
}

function createSnapshot({
  payload,
  now,
}) {
  return {
    id:
      (
        `project-snapshot::` +
        `${payload.projectId}::` +
        `${now}`
      ),

    recordType:
      PROJECT_HISTORY_RECORD_TYPE
        .STATE_SNAPSHOT,

    projectId:
      payload.projectId,

    collectionId:
      payload.collectionId,

    pokemonState:
      payload.pokemonState,

    trackedTargets:
      payload.trackedTargets,

    signature:
      buildSnapshotSignature(
        payload
      ),

    capturedAt:
      now,
  }
}

// --------------------------------------------------
// Existing history access
// --------------------------------------------------

function getProjectRecords(
  records,
  projectId
) {
  if (
    !Array.isArray(
      records
    )
  ) {
    return []
  }

  return records.filter(
    record =>
      record?.projectId ===
      projectId
  )
}

function getLatestSnapshot(
  records,
  projectId
) {
  const snapshots =
    getProjectRecords(
      records,
      projectId
    )
      .filter(
        record =>
          record?.recordType ===
          PROJECT_HISTORY_RECORD_TYPE
            .STATE_SNAPSHOT
      )
      .sort(
        (
          first,
          second
        ) =>
          String(
            second
              .capturedAt ??
            ''
          ).localeCompare(
            String(
              first
                .capturedAt ??
              ''
            )
          )
      )

  return (
    snapshots[0] ??
    null
  )
}

function getExistingEventKeys(
  records,
  projectId
) {
  return new Set(
    getProjectRecords(
      records,
      projectId
    )
      .filter(
        record =>
          record?.recordType ===
          PROJECT_HISTORY_RECORD_TYPE
            .HISTORY_EVENT
      )
      .map(
        record =>
          record?.eventKey
      )
      .filter(Boolean)
  )
}

// --------------------------------------------------
// Completion checks
// --------------------------------------------------

function completedPowerUp({
  target,
  previousState,
  currentState,
}) {
  if (
    !target?.isPowerUp ||
    !Number.isFinite(
      target.targetLevel
    ) ||
    !Number.isFinite(
      currentState?.level
    )
  ) {
    return false
  }

  if (
    currentState.level <
    target.targetLevel
  ) {
    return false
  }

  if (
    Number.isFinite(
      previousState?.level
    ) &&
    previousState.level >=
      target.targetLevel
  ) {
    return false
  }

  return true
}

function completedFastMove({
  target,
  previousState,
  currentState,
}) {
  const moveChange =
    target?.moveChange

  if (
    moveChange?.moveType !==
      'FAST' ||
    !moveChange.to
  ) {
    return false
  }

  return (
    currentState
      ?.fastMoveId ===
      moveChange.to &&
    previousState
      ?.fastMoveId !==
      moveChange.to
  )
}

function getChargedMoveForSlot(
  state,
  slot
) {
  if (
    slot ===
      'slot1' ||
    slot ===
      1 ||
    slot ===
      '1'
  ) {
    return (
      state
        ?.chargedMove1Id ??
      null
    )
  }

  if (
    slot ===
      'slot2' ||
    slot ===
      2 ||
    slot ===
      '2'
  ) {
    return (
      state
        ?.chargedMove2Id ??
      null
    )
  }

  return null
}

function getAllChargedMoves(
  state
) {
  return unique([
    state
      ?.chargedMove1Id ??
    null,

    state
      ?.chargedMove2Id ??
    null,
  ])
}

function completedChargedMove({
  target,
  previousState,
  currentState,
}) {
  const moveChange =
    target?.moveChange

  if (
    moveChange?.moveType !==
      'CHARGED' ||
    !moveChange.to
  ) {
    return false
  }

  if (
    moveChange.slot !==
      null &&
    moveChange.slot !==
      undefined
  ) {
    const previousMove =
      getChargedMoveForSlot(
        previousState,
        moveChange.slot
      )

    const currentMove =
      getChargedMoveForSlot(
        currentState,
        moveChange.slot
      )

    if (
      currentMove !==
      null
    ) {
      return (
        currentMove ===
          moveChange.to &&
        previousMove !==
          moveChange.to
      )
    }
  }

  const previousMoves =
    getAllChargedMoves(
      previousState
    )

  const currentMoves =
    getAllChargedMoves(
      currentState
    )

  return (
    currentMoves.includes(
      moveChange.to
    ) &&
    !previousMoves.includes(
      moveChange.to
    )
  )
}

function completedSecondChargedMove({
  target,
  previousState,
  currentState,
}) {
  if (
    target
      ?.isSecondChargedMove !==
    true
  ) {
    return false
  }

  return (
    !previousState
      ?.chargedMove2Id &&
    Boolean(
      currentState
        ?.chargedMove2Id
    )
  )
}

function completedEvolution({
  target,
  previousState,
  currentState,
}) {
  if (
    target?.isEvolution !==
      true
  ) {
    return false
  }

  const targetIdentity =
    normalizeIdentity(
      target
        .evolutionTargetIdentity
    )

  if (targetIdentity) {
    return (
      currentState
        ?.pokemonIdentity ===
        targetIdentity &&
      previousState
        ?.pokemonIdentity !==
        targetIdentity
    )
  }

  const targetName =
    normalizeNameForComparison(
      target
        .evolutionTargetName
    )

  const currentName =
    normalizeNameForComparison(
      currentState
        ?.pokemonName
    )

  const previousName =
    normalizeNameForComparison(
      previousState
        ?.pokemonName
    )

  if (
    !targetName ||
    !currentName
  ) {
    return false
  }

  return (
    currentName ===
      targetName &&
    previousName !==
      targetName
  )
}

// --------------------------------------------------
// Event creation
// --------------------------------------------------

function createEvent({
  project,
  eventType,
  targetKey,
  title,
  description,
  details,
  now,
}) {
  const eventKey =
    (
      `${project.id}::` +
      `${eventType}::` +
      `${targetKey}`
    )

  return {
    id:
      (
        `project-history::` +
        `${eventKey}::` +
        `${now}`
      ),

    recordType:
      PROJECT_HISTORY_RECORD_TYPE
        .HISTORY_EVENT,

    eventType,

    eventKey,

    projectId:
      project.id,

    collectionId:
      project.collectionId,

    title,

    description,

    details:
      details ??
      null,

    completedAt:
      now,
  }
}

function buildCompletionEvent({
  project,
  target,
  previousState,
  currentState,
  now,
}) {
  if (
    completedPowerUp({
      target,
      previousState,
      currentState,
    })
  ) {
    return createEvent({
      project,

      eventType:
        PROJECT_HISTORY_EVENT_TYPE
          .POWER_UP,

      targetKey:
        target.targetKey,

      title:
        `Reached Level ${target.targetLevel}`,

      description:
        (
          `Powered up from Level ${
            Number.isFinite(
              previousState?.level
            )
              ? previousState.level
              : 'unknown'
          } to Level ${currentState.level}.`
        ),

      details: {
        fromLevel:
          previousState?.level ??
          null,

        targetLevel:
          target.targetLevel,

        currentLevel:
          currentState.level,
      },

      now,
    })
  }

  if (
    completedEvolution({
      target,
      previousState,
      currentState,
    })
  ) {
    const fromName =
      previousState
        ?.pokemonName ??
      formatPokemonIdentityName(
        previousState
          ?.pokemonIdentity
      ) ??
      'Pokémon'

    const toName =
      currentState
        ?.pokemonName ??
      target
        .evolutionTargetName ??
      formatPokemonIdentityName(
        currentState
          ?.pokemonIdentity
      ) ??
      'evolved Pokémon'

    return createEvent({
      project,

      eventType:
        PROJECT_HISTORY_EVENT_TYPE
          .EVOLUTION,

      targetKey:
        target.targetKey,

      title:
        `Evolved into ${toName}`,

      description:
        `${fromName} evolved into ${toName}.`,

      details: {
        fromPokemonIdentity:
          previousState
            ?.pokemonIdentity ??
          null,

        toPokemonIdentity:
          currentState
            ?.pokemonIdentity ??
          target
            .evolutionTargetIdentity ??
          null,

        fromName,

        toName,
      },

      now,
    })
  }

  if (
    completedFastMove({
      target,
      previousState,
      currentState,
    })
  ) {
    const moveId =
      target
        .moveChange
        .to

    return createEvent({
      project,

      eventType:
        PROJECT_HISTORY_EVENT_TYPE
          .FAST_MOVE,

      targetKey:
        target.targetKey,

      title:
        `Learned ${formatMoveName(
          moveId
        )}`,

      description:
        (
          `Fast Move changed from ${
            previousState
              ?.fastMoveId
              ? formatMoveName(
                  previousState
                    .fastMoveId
                )
              : 'unknown'
          } to ${formatMoveName(
            moveId
          )}.`
        ),

      details: {
        moveType:
          'FAST',

        fromMoveId:
          previousState
            ?.fastMoveId ??
          null,

        toMoveId:
          moveId,
      },

      now,
    })
  }

  if (
    completedChargedMove({
      target,
      previousState,
      currentState,
    })
  ) {
    const moveId =
      target
        .moveChange
        .to

    return createEvent({
      project,

      eventType:
        PROJECT_HISTORY_EVENT_TYPE
          .CHARGED_MOVE,

      targetKey:
        target.targetKey,

      title:
        `Learned ${formatMoveName(
          moveId
        )}`,

      description:
        `Charged Move changed to ${formatMoveName(
          moveId
        )}.`,

      details: {
        moveType:
          'CHARGED',

        slot:
          target
            .moveChange
            .slot ??
          null,

        fromMoveId:
          target
            .moveChange
            .from ??
          null,

        toMoveId:
          moveId,
      },

      now,
    })
  }

  if (
    completedSecondChargedMove({
      target,
      previousState,
      currentState,
    })
  ) {
    return createEvent({
      project,

      eventType:
        PROJECT_HISTORY_EVENT_TYPE
          .SECOND_CHARGED_MOVE,

      targetKey:
        target.targetKey,

      title:
        'Unlocked second Charged Move',

      description:
        currentState
          ?.chargedMove2Id
          ? (
              `Second Charged Move unlocked with ${formatMoveName(
                currentState
                  .chargedMove2Id
              )}.`
            )
          : 'Second Charged Move unlocked.',

      details: {
        chargedMove1Id:
          currentState
            ?.chargedMove1Id ??
          null,

        chargedMove2Id:
          currentState
            ?.chargedMove2Id ??
          null,
      },

      now,
    })
  }

  return null
}

// --------------------------------------------------
// Public history helpers
// --------------------------------------------------

export function getProjectHistoryEvents(
  records,
  projectId
) {
  return getProjectRecords(
    records,
    projectId
  )
    .filter(
      record =>
        record?.recordType ===
        PROJECT_HISTORY_RECORD_TYPE
          .HISTORY_EVENT
    )
    .sort(
      (
        first,
        second
      ) =>
        String(
          second
            .completedAt ??
          ''
        ).localeCompare(
          String(
            first
              .completedAt ??
            ''
          )
        )
    )
}

// --------------------------------------------------
// Public reconciliation
// --------------------------------------------------

export function reconcileProjectHistory({
  project,
  plan,
  ownedPokemon,
  existingRecords = [],
  now = new Date()
    .toISOString(),
} = {}) {
  if (
    !project?.id ||
    !project?.collectionId ||
    !plan ||
    !ownedPokemon
  ) {
    return {
      changed:
        false,

      initialized:
        false,

      events: [],

      snapshot:
        null,

      recordsToAdd: [],
    }
  }

  const payload =
    buildSnapshotPayload({
      project,
      plan,
      ownedPokemon,
    })

  const snapshot =
    createSnapshot({
      payload,
      now,
    })

  const previousSnapshot =
    getLatestSnapshot(
      existingRecords,
      project.id
    )

  // First observation establishes the baseline.
  //
  // We must NOT retroactively claim that existing
  // Pokémon state was completed through the Project.
  if (!previousSnapshot) {
    return {
      changed:
        true,

      initialized:
        true,

      events: [],

      snapshot,

      recordsToAdd: [
        snapshot,
      ],
    }
  }

  const existingEventKeys =
    getExistingEventKeys(
      existingRecords,
      project.id
    )

  const events = []

  for (
    const target
    of previousSnapshot
      .trackedTargets ??
    []
  ) {
    const event =
      buildCompletionEvent({
        project,
        target,
        previousState:
          previousSnapshot
            .pokemonState,

        currentState:
          payload
            .pokemonState,

        now,
      })

    if (
      event &&
      !existingEventKeys.has(
        event.eventKey
      )
    ) {
      events.push(
        event
      )

      existingEventKeys.add(
        event.eventKey
      )
    }
  }

  const stateChanged =
    previousSnapshot
      .signature !==
    snapshot.signature

  if (
    !stateChanged &&
    events.length ===
      0
  ) {
    return {
      changed:
        false,

      initialized:
        false,

      events: [],

      snapshot:
        previousSnapshot,

      recordsToAdd: [],
    }
  }

  const recordsToAdd = [
    ...events,
  ]

  if (stateChanged) {
    recordsToAdd.push(
      snapshot
    )
  }

  return {
    changed:
      recordsToAdd.length >
      0,

    initialized:
      false,

    events,

    snapshot:
      stateChanged
        ? snapshot
        : previousSnapshot,

    recordsToAdd,
  }
}

export default reconcileProjectHistory