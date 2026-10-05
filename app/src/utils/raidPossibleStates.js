import {
  getChargedMoveAvailability,
  getChargedMoveOptions,
  getFastMoveAvailability,
  getFastMoveOptions,
  getPokemonEvolutionPaths,
} from './pokemonReference.js'

import {
  deriveRaidCandidateForReference,
} from './raidCandidate.js'

import {
  getCpmForLevel,
} from './pokemonLevel.js'

// --------------------------------------------------
// Status
// --------------------------------------------------

export const RAID_POSSIBLE_STATE_STATUS = {
  READY:
    'READY',

  INVALID_CANDIDATE:
    'INVALID_CANDIDATE',
}

// --------------------------------------------------
// State / action types
// --------------------------------------------------

export const RAID_POSSIBLE_STATE_TYPE = {
  CURRENT:
    'CURRENT',

  FAST_MOVE_CHANGE:
    'FAST_MOVE_CHANGE',

  CHARGED_MOVE_CHANGE:
    'CHARGED_MOVE_CHANGE',

  SECOND_CHARGED_MOVE:
    'SECOND_CHARGED_MOVE',

  POWER_UP:
    'POWER_UP',

  EVOLUTION:
    'EVOLUTION',

  EVOLUTION_MOVE_CHANGE:
    'EVOLUTION_MOVE_CHANGE',
}

export const RAID_POSSIBLE_STATE_ACTION = {
  NONE:
    'NONE',

  FAST_TM:
    'FAST_TM',

  CHARGED_TM:
    'CHARGED_TM',

  ELITE_FAST_TM:
    'ELITE_FAST_TM',

  ELITE_CHARGED_TM:
    'ELITE_CHARGED_TM',

  UNLOCK_SECOND_CHARGED_MOVE:
    'UNLOCK_SECOND_CHARGED_MOVE',

  SPECIAL_ACQUISITION:
    'SPECIAL_ACQUISITION',

  POWER_UP:
    'POWER_UP',

  EVOLVE:
    'EVOLVE',

  EVOLUTION_MOVE_CHANGE:
    'EVOLUTION_MOVE_CHANGE',
}

// --------------------------------------------------
// Destination certainty
//
// This is intentionally separate from resource-cost
// certainty. A destination can be guaranteed even when
// the number of resources required is stochastic, such
// as repeatedly using an ordinary TM until the target
// move is obtained.
//
// Natural evolution move rolls are different: the
// represented exact moveset may itself be stochastic.
// --------------------------------------------------

export const RAID_POSSIBLE_STATE_DESTINATION_CERTAINTY = {
  GUARANTEED:
    'GUARANTEED',

  STOCHASTIC:
    'STOCHASTIC',

  UNAVAILABLE:
    'UNAVAILABLE',

  UNKNOWN:
    'UNKNOWN',
}

// --------------------------------------------------
// Power-up milestones
// --------------------------------------------------

export const RAID_POWER_UP_LEVELS = [
  35,
  40,
  50,
]

// --------------------------------------------------
// Preservation
// --------------------------------------------------

export const RAID_MOVE_PRESERVATION = {
  STANDARD:
    'STANDARD',

  PROTECTED:
    'PROTECTED',

  UNKNOWN:
    'UNKNOWN',
}

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function getDestinationCertainty({
  reachable = true,
  stochastic = false,
} = {}) {
  if (
    reachable ===
    false
  ) {
    return RAID_POSSIBLE_STATE_DESTINATION_CERTAINTY
      .UNAVAILABLE
  }

  if (
    stochastic ===
    true
  ) {
    return RAID_POSSIBLE_STATE_DESTINATION_CERTAINTY
      .STOCHASTIC
  }

  return RAID_POSSIBLE_STATE_DESTINATION_CERTAINTY
    .GUARANTEED
}

function getMoveAction({
  moveType,
  availability,
}) {
  if (
    availability ===
    'NORMAL'
  ) {
    return moveType ===
      'FAST'
      ? RAID_POSSIBLE_STATE_ACTION
          .FAST_TM
      : RAID_POSSIBLE_STATE_ACTION
          .CHARGED_TM
  }

  if (
    availability ===
    'ELITE'
  ) {
    return moveType ===
      'FAST'
      ? RAID_POSSIBLE_STATE_ACTION
          .ELITE_FAST_TM
      : RAID_POSSIBLE_STATE_ACTION
          .ELITE_CHARGED_TM
  }

  if (
    availability ===
    'SPECIAL'
  ) {
    return RAID_POSSIBLE_STATE_ACTION
      .SPECIAL_ACQUISITION
  }

  return null
}

function getPreservationClass(
  availability
) {
  if (
    availability ===
      'ELITE' ||
    availability ===
      'SPECIAL'
  ) {
    return RAID_MOVE_PRESERVATION
      .PROTECTED
  }

  if (
    availability ===
      'NORMAL'
  ) {
    return RAID_MOVE_PRESERVATION
      .STANDARD
  }

  return RAID_MOVE_PRESERVATION
    .UNKNOWN
}

function isProtectedAvailability(
  availability
) {
  return (
    availability ===
      'ELITE' ||
    availability ===
      'SPECIAL'
  )
}

function getChargedSlots(
  candidate
) {
  const explicitSlots =
    candidate
      ?.moves
      ?.chargedSlots

  if (explicitSlots) {
    return {
      slot1:
        explicitSlots.slot1 ??
        null,

      slot2:
        explicitSlots.slot2 ??
        null,
    }
  }

  const chargedMoves =
    candidate
      ?.moves
      ?.charged ??
    []

  return {
    slot1:
      chargedMoves[0] ??
      null,

    slot2:
      chargedMoves[1] ??
      null,
  }
}

function buildMoves({
  fastMoveId,
  chargedMove1Id,
  chargedMove2Id,
}) {
  return {
    fastMoveId,

    chargedMove1Id:
      chargedMove1Id ??
      null,

    chargedMove2Id:
      chargedMove2Id ??
      null,
  }
}

function buildLoadouts(
  moves
) {
  return [
    moves.chargedMove1Id,
    moves.chargedMove2Id,
  ]
    .filter(
      Boolean
    )
    .map(
      (chargedMoveId) => ({
        fastMoveId:
          moves.fastMoveId,

        chargedMoveId,
      })
    )
}

function buildOwnedMoveRecord({
  moveType,
  slot = null,
  moveId,
  availability,
}) {
  if (!moveId) {
    return null
  }

  return {
    moveType,

    slot,

    moveId,

    availability:
      availability ??
      'UNKNOWN',

    preservation:
      getPreservationClass(
        availability
      ),

    protected:
      isProtectedAvailability(
        availability
      ),
  }
}

function getOwnedMoveRecords(
  candidate
) {
  const slots =
    getChargedSlots(
      candidate
    )

  const records = []

  const fastMoveId =
    candidate
      ?.moves
      ?.fast

  if (fastMoveId) {
    records.push(
      buildOwnedMoveRecord({
        moveType:
          'FAST',

        moveId:
          fastMoveId,

        availability:
          getFastMoveAvailability(
            candidate.reference,
            fastMoveId
          ),
      })
    )
  }

  if (slots.slot1) {
    records.push(
      buildOwnedMoveRecord({
        moveType:
          'CHARGED',

        slot:
          'slot1',

        moveId:
          slots.slot1,

        availability:
          getChargedMoveAvailability(
            candidate.reference,
            slots.slot1
          ),
      })
    )
  }

  if (slots.slot2) {
    records.push(
      buildOwnedMoveRecord({
        moveType:
          'CHARGED',

        slot:
          'slot2',

        moveId:
          slots.slot2,

        availability:
          getChargedMoveAvailability(
            candidate.reference,
            slots.slot2
          ),
      })
    )
  }

  return records.filter(
    Boolean
  )
}

function getProtectedOwnedMoves(
  candidate
) {
  return getOwnedMoveRecords(
    candidate
  ).filter(
    (move) =>
      move.protected ===
      true
  )
}

function buildReplacementPreservation({
  candidate,
  moveType,
  slot = null,
  moveId,
}) {
  const availability =
    moveType ===
      'FAST'
      ? getFastMoveAvailability(
          candidate.reference,
          moveId
        )
      : getChargedMoveAvailability(
          candidate.reference,
          moveId
        )

  const replacedMove =
    buildOwnedMoveRecord({
      moveType,
      slot,
      moveId,
      availability,
    })

  return {
    replacesExistingMove:
      true,

    replacedMove,

    destroysProtectedMove:
      replacedMove
        ?.protected ===
      true,

    protectedOwnedMoves:
      getProtectedOwnedMoves(
        candidate
      ),
  }
}

function buildNonDestructivePreservation(
  candidate
) {
  return {
    replacesExistingMove:
      false,

    replacedMove:
      null,

    destroysProtectedMove:
      false,

    protectedOwnedMoves:
      getProtectedOwnedMoves(
        candidate
      ),
  }
}

function buildState({
  type,
  candidate,
  moves,
  current = false,
  reachable = true,
  destinationCertainty =
    RAID_POSSIBLE_STATE_DESTINATION_CERTAINTY
      .UNKNOWN,
  changes = null,
  action,
  actions = null,
  preservation,
  candidateOverride = null,
  combat = null,
}) {
  const effectiveCandidate =
    candidateOverride ??
    candidate

  return {
    type,

    current,

    reachable,

    destinationCertainty,

    pokemonIdentity:
      effectiveCandidate
        .pokemonIdentity,

    ...(candidateOverride
      ? {
          candidate:
            candidateOverride,

          sourcePokemonIdentity:
            candidate
              .pokemonIdentity,
        }
      : {}),

    moves,

    loadouts:
      buildLoadouts(
        moves
      ),

    changes,

    action,

    ...(Array.isArray(
      actions
    )
      ? {
          actions,
        }
      : {}),

    preservation,

    ...(combat
      ? {
          combat,
        }
      : {}),
  }
}

// --------------------------------------------------
// Current state
// --------------------------------------------------

function buildCurrentState(
  candidate
) {
  const slots =
    getChargedSlots(
      candidate
    )

  const moves =
    buildMoves({
      fastMoveId:
        candidate.moves.fast,

      chargedMove1Id:
        slots.slot1,

      chargedMove2Id:
        slots.slot2,
    })

  return buildState({
    type:
      RAID_POSSIBLE_STATE_TYPE
        .CURRENT,

    candidate,

    moves,

    current:
      true,

    destinationCertainty:
      RAID_POSSIBLE_STATE_DESTINATION_CERTAINTY
        .GUARANTEED,

    action: {
      type:
        RAID_POSSIBLE_STATE_ACTION
          .NONE,

      availability:
        'OWNED',
    },

    preservation:
      buildNonDestructivePreservation(
        candidate
      ),
  })
}

// --------------------------------------------------
// Fast Move changes
// --------------------------------------------------

function buildFastMoveStates(
  candidate
) {
  const slots =
    getChargedSlots(
      candidate
    )

  const currentFastMoveId =
    candidate.moves.fast

  const options =
    getFastMoveOptions(
      candidate.reference
    )

  const states = []

  for (
    const option
    of options
  ) {
    if (
      option.id ===
      currentFastMoveId
    ) {
      continue
    }

    const actionType =
      getMoveAction({
        moveType:
          'FAST',

        availability:
          option.availability,
      })

    const moves =
      buildMoves({
        fastMoveId:
          option.id,

        chargedMove1Id:
          slots.slot1,

        chargedMove2Id:
          slots.slot2,
      })

    states.push(
      buildState({
        type:
          RAID_POSSIBLE_STATE_TYPE
            .FAST_MOVE_CHANGE,

        candidate,

        moves,

        reachable:
          option.availability !==
          'SPECIAL',

        destinationCertainty:
          getDestinationCertainty({
            reachable:
              option.availability !==
              'SPECIAL',
          }),

        changes: {
          fastMove: {
            from:
              currentFastMoveId,

            to:
              option.id,
          },
        },

        action: {
          type:
            actionType,

          availability:
            option.availability,
        },

        preservation:
          buildReplacementPreservation({
            candidate,

            moveType:
              'FAST',

            moveId:
              currentFastMoveId,
          }),
      })
    )
  }

  return states
}

// --------------------------------------------------
// Charged Move replacements
// --------------------------------------------------

function buildChargedMoveReplacementStates(
  candidate
) {
  const slots =
    getChargedSlots(
      candidate
    )

  const options =
    getChargedMoveOptions(
      candidate.reference
    )

  const states = []

  const currentSlots = [
    {
      slot:
        'slot1',

      moveId:
        slots.slot1,
    },

    {
      slot:
        'slot2',

      moveId:
        slots.slot2,
    },
  ].filter(
    (entry) =>
      Boolean(
        entry.moveId
      )
  )

  for (
    const currentSlot
    of currentSlots
  ) {
    for (
      const option
      of options
    ) {
      if (
        option.id ===
        currentSlot.moveId
      ) {
        continue
      }

      const otherMoveId =
        currentSlot.slot ===
        'slot1'
          ? slots.slot2
          : slots.slot1

      if (
        option.id ===
        otherMoveId
      ) {
        continue
      }

      const actionType =
        getMoveAction({
          moveType:
            'CHARGED',

          availability:
            option.availability,
        })

      const nextSlots = {
        ...slots,

        [currentSlot.slot]:
          option.id,
      }

      const moves =
        buildMoves({
          fastMoveId:
            candidate.moves.fast,

          chargedMove1Id:
            nextSlots.slot1,

          chargedMove2Id:
            nextSlots.slot2,
        })

      states.push(
        buildState({
          type:
            RAID_POSSIBLE_STATE_TYPE
              .CHARGED_MOVE_CHANGE,

          candidate,

          moves,

          reachable:
            option.availability !==
            'SPECIAL',

          destinationCertainty:
            getDestinationCertainty({
              reachable:
                option.availability !==
                'SPECIAL',
            }),

          changes: {
            chargedMove: {
              slot:
                currentSlot.slot,

              from:
                currentSlot.moveId,

              to:
                option.id,
            },
          },

          action: {
            type:
              actionType,

            availability:
              option.availability,
          },

          preservation:
            buildReplacementPreservation({
              candidate,

              moveType:
                'CHARGED',

              slot:
                currentSlot.slot,

              moveId:
                currentSlot.moveId,
            }),
        })
      )
    }
  }

  return states
}

// --------------------------------------------------
// Second Charged Move
// --------------------------------------------------

function buildSecondChargedMoveStates(
  candidate
) {
  const slots =
    getChargedSlots(
      candidate
    )

  if (
    slots.slot1 &&
    slots.slot2
  ) {
    return []
  }

  const occupiedMoveId =
    slots.slot1 ??
    slots.slot2

  if (!occupiedMoveId) {
    return []
  }

  const emptySlot =
    slots.slot1
      ? 'slot2'
      : 'slot1'

  const options =
    getChargedMoveOptions(
      candidate.reference
    )

  const states = []

  for (
    const option
    of options
  ) {
    if (
      option.id ===
      occupiedMoveId
    ) {
      continue
    }

    const nextSlots = {
      ...slots,

      [emptySlot]:
        option.id,
    }

    const moves =
      buildMoves({
        fastMoveId:
          candidate.moves.fast,

        chargedMove1Id:
          nextSlots.slot1,

        chargedMove2Id:
          nextSlots.slot2,
      })

    states.push(
      buildState({
        type:
          RAID_POSSIBLE_STATE_TYPE
            .SECOND_CHARGED_MOVE,

        candidate,

        moves,

        reachable:
          option.availability !==
          'SPECIAL',

        destinationCertainty:
          getDestinationCertainty({
            reachable:
              option.availability !==
              'SPECIAL',
          }),

        changes: {
          secondChargedMove: {
            slot:
              emptySlot,

            addedMoveId:
              option.id,
          },
        },

        action: {
          type:
            RAID_POSSIBLE_STATE_ACTION
              .UNLOCK_SECOND_CHARGED_MOVE,

          moveAvailability:
            option.availability,

          additionalMoveAction:
            getMoveAction({
              moveType:
                'CHARGED',

              availability:
                option.availability,
            }),
        },

        preservation:
          buildNonDestructivePreservation(
            candidate
          ),
      })
    )
  }

  return states
}

// --------------------------------------------------
// Power-up states
// --------------------------------------------------

function buildPowerUpStates(
  candidate
) {
  if (
    !Number.isFinite(
      candidate.level
    )
  ) {
    return []
  }

  const slots =
    getChargedSlots(
      candidate
    )

  const moves =
    buildMoves({
      fastMoveId:
        candidate.moves.fast,

      chargedMove1Id:
        slots.slot1,

      chargedMove2Id:
        slots.slot2,
    })

  return RAID_POWER_UP_LEVELS
    .filter(
      (targetLevel) =>
        targetLevel >
        candidate.level
    )
    .map(
      (targetLevel) => {
        const targetCpm =
          getCpmForLevel(
            targetLevel
          )

        if (
          !Number.isFinite(
            targetCpm
          )
        ) {
          return null
        }

        return buildState({
          type:
            RAID_POSSIBLE_STATE_TYPE
              .POWER_UP,

          candidate,

          moves,

          reachable:
            true,

          destinationCertainty:
            RAID_POSSIBLE_STATE_DESTINATION_CERTAINTY
              .GUARANTEED,

          combat: {
            level:
              targetLevel,

            cpm:
              targetCpm,
          },

          changes: {
            level: {
              from:
                candidate.level,

              to:
                targetLevel,
            },
          },

          action: {
            type:
              RAID_POSSIBLE_STATE_ACTION
                .POWER_UP,

            fromLevel:
              candidate.level,

            targetLevel,
          },

          preservation:
            buildNonDestructivePreservation(
              candidate
            ),
        })
      }
    )
    .filter(
      Boolean
    )
}

// --------------------------------------------------
// Evolution
//
// Evolution changes the Pokémon reference itself.
//
// The source individual's level, CPM, IVs and traits
// are preserved by deriveRaidCandidateForReference().
// The evolved species receives recalculated combat
// stats from its own base stats.
//
// Source moves are not carried through evolution.
// Instead, each state represents one possible immediate
// post-evolution outcome from the target species' NORMAL
// move pool. Exact movesets are marked STOCHASTIC when
// more than one natural post-evolution outcome exists.
//
// Elite and SPECIAL moves are deliberately excluded
// here. Evolution must not pretend that an Elite or
// event-exclusive move is guaranteed by an ordinary
// evolution action.
// --------------------------------------------------

function getNormalMoveOptions(
  options
) {
  return options.filter(
    (option) =>
      option.availability ===
      'NORMAL'
  )
}

function getEvolutionChargedMoveOutcomes({
  candidate,
  targetReference,
}) {
  const sourceSlots =
    getChargedSlots(
      candidate
    )

  const hasSecondChargedMove =
    Boolean(
      sourceSlots.slot1 &&
      sourceSlots.slot2
    )

  const chargedOptions =
    getNormalMoveOptions(
      getChargedMoveOptions(
        targetReference
      )
    )

  if (
    chargedOptions.length ===
    0
  ) {
    return []
  }

  if (!hasSecondChargedMove) {
    return chargedOptions.map(
      (option) => ({
        chargedMove1Id:
          option.id,

        chargedMove2Id:
          null,
      })
    )
  }

  const outcomes = []

  for (
    let firstIndex = 0;
    firstIndex <
      chargedOptions.length;
    firstIndex += 1
  ) {
    for (
      let secondIndex =
        firstIndex + 1;
      secondIndex <
        chargedOptions.length;
      secondIndex += 1
    ) {
      outcomes.push({
        chargedMove1Id:
          chargedOptions[
            firstIndex
          ].id,

        chargedMove2Id:
          chargedOptions[
            secondIndex
          ].id,
      })
    }
  }

  return outcomes
}

function buildEvolutionPreservation(
  candidate
) {
  const replacedMoves =
    getOwnedMoveRecords(
      candidate
    )

  const protectedOwnedMoves =
    replacedMoves.filter(
      (move) =>
        move.protected ===
        true
    )

  return {
    replacesExistingMove:
      replacedMoves.length >
      0,

    replacedMove:
      null,

    replacedMoves,

    destroysProtectedMove:
      protectedOwnedMoves.length >
      0,

    protectedOwnedMoves,
  }
}

function buildEvolutionAction(
  path
) {
  return {
    type:
      RAID_POSSIBLE_STATE_ACTION
        .EVOLVE,

    availability:
      'EVOLUTION',

    targetPokemonIdentity:
      path.targetIdentity,

    targetPokemonId:
      path.pokemonId,

    targetForm:
      path.form,

    stageCount:
      path.stageCount,

    costs: {
      candy:
        path.costs?.candy ??
        null,

      purifiedCandy:
        path.costs
          ?.purifiedCandy ??
        null,

      items: [
        ...(path.costs
          ?.items ??
          []),
      ],
    },

    requirements:
      path.requirements ??
      [],

    evolutionPath:
      path,
  }
}

function buildEvolutionChanges({
  candidate,
  path,
}) {
  return {
    evolution: {
      fromPokemonIdentity:
        candidate
          .pokemonIdentity,

      toPokemonIdentity:
        path.targetIdentity,

      pokemonId:
        path.pokemonId,

      form:
        path.form,

      stageCount:
        path.stageCount,

      costs: {
        candy:
          path.costs?.candy ??
          null,

        purifiedCandy:
          path.costs
            ?.purifiedCandy ??
          null,

        items: [
          ...(path.costs
            ?.items ??
            []),
        ],
      },

      requirements:
        path.requirements ??
        [],

      steps:
        path.steps ??
        [],
    },
  }
}

// --------------------------------------------------
// Evolution + Move Change
//
// These states are destination-based.
//
// Natural evolution states above model random NORMAL
// post-evolution move rolls.
//
// Composite states below model:
//   EVOLVE -> intentional move acquisition
//
// NORMAL TM destinations are eventually targetable, but
// the required TM quantity can be stochastic.
//
// ELITE TM destinations are targeted and guaranteed in
// one Elite TM use.
//
// Destination certainty still describes the complete
// represented moveset. If an untouched Fast or Charged
// Move remains a natural post-evolution roll, the exact
// composite destination remains STOCHASTIC even though
// the intentionally changed move is targetable.
//
// SPECIAL acquisition remains visible but unreachable
// through the ordinary investment path.
//
// These states participate in possibleStates alongside
// natural evolution states. Downstream certainty/value
// logic is responsible for keeping stochastic exact
// destinations out of actionable recommendations.
// --------------------------------------------------

function buildEvolutionMoveChangeAction({
  moveType,
  option,
}) {
  const actionType =
    getMoveAction({
      moveType,
      availability:
        option.availability,
    })

  return {
    type:
      actionType,

    availability:
      option.availability,

    moveType,

    targetMoveId:
      option.id,

    targeted:
      option.availability ===
      'ELITE',

    guaranteedSingleUse:
      option.availability ===
      'ELITE',

    randomOutcome:
      option.availability ===
      'NORMAL',
  }
}

function buildCompositeEvolutionAction({
  evolutionAction,
  moveAction,
}) {
  return {
    type:
      RAID_POSSIBLE_STATE_ACTION
        .EVOLUTION_MOVE_CHANGE,

    availability:
      'COMPOSITE',

    targetPokemonIdentity:
      evolutionAction
        ?.targetPokemonIdentity ??
      null,

    targetMoveId:
      moveAction
        ?.targetMoveId ??
      null,

    moveType:
      moveAction
        ?.moveType ??
      null,

    actions: [
      evolutionAction,
      moveAction,
    ],
  }
}

function buildEvolutionMoveChangePreservation({
  candidate,
  moveType,
  targetMoveId,
}) {
  const evolutionPreservation =
    buildEvolutionPreservation(
      candidate
    )

  return {
    ...evolutionPreservation,

    postEvolutionMoveChange: {
      moveType,

      targetMoveId,

      replacesExistingMove:
        true,

      sourceMove:
        'POST_EVOLUTION_RANDOM_NORMAL',

      destroysProtectedMove:
        false,
    },
  }
}

function buildEvolutionMoveChangeChanges({
  candidate,
  path,
  moveType,
  targetMoveId,
  availability,
  retainedChargedMoveId = null,
}) {
  return {
    ...buildEvolutionChanges({
      candidate,
      path,
    }),

    moveChange: {
      moveType,

      from:
        'POST_EVOLUTION_RANDOM_NORMAL',

      to:
        targetMoveId,

      availability,

      ...(retainedChargedMoveId
        ? {
            retainedChargedMoveId,
          }
        : {}),
    },
  }
}

function getEvolutionMoveChangeStateKey(
  state
) {
  const chargedIds = [
    state
      ?.moves
      ?.chargedMove1Id,
    state
      ?.moves
      ?.chargedMove2Id,
  ]
    .filter(
      Boolean
    )
    .sort()

  const finalMovesKey = [
    state
      ?.moves
      ?.fastMoveId ??
      '',
    ...chargedIds,
  ].join(
    '|'
  )

  const moveAction =
    state
      ?.actions?.[1] ??
    null

  return [
    state
      ?.pokemonIdentity ??
      '',
    finalMovesKey,
    moveAction
      ?.type ??
      '',
  ].join(
    '::'
  )
}

function deduplicateEvolutionMoveChangeStates(
  states
) {
  const uniqueStates =
    new Map()

  for (
    const state
    of states
  ) {
    const key =
      getEvolutionMoveChangeStateKey(
        state
      )

    if (
      !uniqueStates.has(
        key
      )
    ) {
      uniqueStates.set(
        key,
        state
      )
    }
  }

  return [
    ...uniqueStates.values(),
  ]
}

function buildEvolutionMoveChangeStates(
  candidate
) {
  const paths =
    getPokemonEvolutionPaths(
      candidate.reference
    )

  if (
    paths.length ===
    0
  ) {
    return []
  }

  const states = []

  for (
    const path
    of paths
  ) {
    if (
      path.resolved !==
        true ||
      !path.target
    ) {
      continue
    }

    const evolvedCandidate =
      deriveRaidCandidateForReference({
        candidate,

        reference:
          path.target,
      })

    if (
      evolvedCandidate.status !==
      'READY'
    ) {
      continue
    }

    const allFastOptions =
      getFastMoveOptions(
        path.target
      )

    const normalFastOptions =
      getNormalMoveOptions(
        allFastOptions
      )

    const allChargedOptions =
      getChargedMoveOptions(
        path.target
      )

    const normalChargedOptions =
      getNormalMoveOptions(
        allChargedOptions
      )

    const naturalChargedOutcomes =
      getEvolutionChargedMoveOutcomes({
        candidate,

        targetReference:
          path.target,
      })

    if (
      normalFastOptions.length ===
        0 ||
      naturalChargedOutcomes.length ===
        0
    ) {
      continue
    }

    const evolutionAction =
      buildEvolutionAction(
        path
      )

    // ----------------------------------------------
    // Evolution + Fast Move change
    //
    // The Charged Move outcome remains a natural
    // post-evolution roll. The Fast Move is the
    // intentional destination.
    // ----------------------------------------------

    for (
      const fastOption
      of allFastOptions
    ) {
      const canRequireFastChange =
        fastOption.availability !==
          'NORMAL' ||
        normalFastOptions.some(
          (option) =>
            option.id !==
            fastOption.id
        )

      if (
        !canRequireFastChange
      ) {
        continue
      }

      const moveAction =
        buildEvolutionMoveChangeAction({
          moveType:
            'FAST',

          option:
            fastOption,
        })

      if (
        !moveAction.type
      ) {
        continue
      }

      const compositeAction =
        buildCompositeEvolutionAction({
          evolutionAction,
          moveAction,
        })

      for (
        const chargedOutcome
        of naturalChargedOutcomes
      ) {
        const moves =
          buildMoves({
            fastMoveId:
              fastOption.id,

            chargedMove1Id:
              chargedOutcome
                .chargedMove1Id,

            chargedMove2Id:
              chargedOutcome
                .chargedMove2Id,
          })

        states.push(
          buildState({
            type:
              RAID_POSSIBLE_STATE_TYPE
                .EVOLUTION_MOVE_CHANGE,

            candidate,

            candidateOverride:
              evolvedCandidate,

            moves,

            reachable:
              fastOption
                .availability !==
              'SPECIAL',

            destinationCertainty:
              getDestinationCertainty({
                reachable:
                  fastOption
                    .availability !==
                  'SPECIAL',

                stochastic:
                  naturalChargedOutcomes.length >
                  1,
              }),

            changes:
              buildEvolutionMoveChangeChanges({
                candidate,
                path,

                moveType:
                  'FAST',

                targetMoveId:
                  fastOption.id,

                availability:
                  fastOption
                    .availability,
              }),

            action:
              compositeAction,

            actions: [
              evolutionAction,
              moveAction,
            ],

            preservation:
              buildEvolutionMoveChangePreservation({
                candidate,

                moveType:
                  'FAST',

                targetMoveId:
                  fastOption.id,
              }),
          })
        )
      }
    }

    // ----------------------------------------------
    // Evolution + Charged Move change
    //
    // With one Charged Move slot, the destination
    // is simply the selected target move.
    //
    // With two unlocked slots, one natural NORMAL
    // post-evolution Charged Move is retained while
    // the other slot is intentionally changed.
    // ----------------------------------------------

    const sourceSlots =
      getChargedSlots(
        candidate
      )

    const hasSecondChargedMove =
      Boolean(
        sourceSlots.slot1 &&
        sourceSlots.slot2
      )

    for (
      const chargedOption
      of allChargedOptions
    ) {
      const moveAction =
        buildEvolutionMoveChangeAction({
          moveType:
            'CHARGED',

          option:
            chargedOption,
        })

      if (
        !moveAction.type
      ) {
        continue
      }

      const compositeAction =
        buildCompositeEvolutionAction({
          evolutionAction,
          moveAction,
        })

      if (
        !hasSecondChargedMove
      ) {
        const canRequireChargedChange =
          chargedOption
            .availability !==
            'NORMAL' ||
          normalChargedOptions.some(
            (option) =>
              option.id !==
              chargedOption.id
          )

        if (
          !canRequireChargedChange
        ) {
          continue
        }

        for (
          const fastOption
          of normalFastOptions
        ) {
          const moves =
            buildMoves({
              fastMoveId:
                fastOption.id,

              chargedMove1Id:
                chargedOption.id,

              chargedMove2Id:
                null,
            })

          states.push(
            buildState({
              type:
                RAID_POSSIBLE_STATE_TYPE
                  .EVOLUTION_MOVE_CHANGE,

              candidate,

              candidateOverride:
                evolvedCandidate,

              moves,

              reachable:
                chargedOption
                  .availability !==
                'SPECIAL',

              destinationCertainty:
                getDestinationCertainty({
                  reachable:
                    chargedOption
                      .availability !==
                    'SPECIAL',

                  stochastic:
                    normalFastOptions.length >
                    1,
                }),

              changes:
                buildEvolutionMoveChangeChanges({
                  candidate,
                  path,

                  moveType:
                    'CHARGED',

                  targetMoveId:
                    chargedOption.id,

                  availability:
                    chargedOption
                      .availability,
                }),

              action:
                compositeAction,

              actions: [
                evolutionAction,
                moveAction,
              ],

              preservation:
                buildEvolutionMoveChangePreservation({
                  candidate,

                  moveType:
                    'CHARGED',

                  targetMoveId:
                    chargedOption.id,
                }),
            })
          )
        }

        continue
      }

      for (
        const retainedOption
        of normalChargedOptions
      ) {
        if (
          retainedOption.id ===
          chargedOption.id
        ) {
          continue
        }

        const canRequireChargedChange =
          chargedOption
            .availability !==
            'NORMAL'
            ? normalChargedOptions.some(
                (option) =>
                  option.id !==
                    retainedOption.id
              )
            : normalChargedOptions.some(
                (option) =>
                  option.id !==
                    retainedOption.id &&
                  option.id !==
                    chargedOption.id
              )

        if (
          !canRequireChargedChange
        ) {
          continue
        }

        for (
          const fastOption
          of normalFastOptions
        ) {
          const chargedPair = [
            retainedOption.id,
            chargedOption.id,
          ].sort()

          const moves =
            buildMoves({
              fastMoveId:
                fastOption.id,

              chargedMove1Id:
                chargedPair[0],

              chargedMove2Id:
                chargedPair[1],
            })

          states.push(
            buildState({
              type:
                RAID_POSSIBLE_STATE_TYPE
                  .EVOLUTION_MOVE_CHANGE,

              candidate,

              candidateOverride:
                evolvedCandidate,

              moves,

              reachable:
                chargedOption
                  .availability !==
                'SPECIAL',

              destinationCertainty:
                getDestinationCertainty({
                  reachable:
                    chargedOption
                      .availability !==
                    'SPECIAL',

                  stochastic:
                    normalFastOptions.length >
                      1 ||
                    normalChargedOptions.length >
                      2,
                }),

              changes:
                buildEvolutionMoveChangeChanges({
                  candidate,
                  path,

                  moveType:
                    'CHARGED',

                  targetMoveId:
                    chargedOption.id,

                  availability:
                    chargedOption
                      .availability,

                  retainedChargedMoveId:
                    retainedOption.id,
                }),

              action:
                compositeAction,

              actions: [
                evolutionAction,
                moveAction,
              ],

              preservation:
                buildEvolutionMoveChangePreservation({
                  candidate,

                  moveType:
                    'CHARGED',

                  targetMoveId:
                    chargedOption.id,
                }),
            })
          )
        }
      }
    }
  }

  return deduplicateEvolutionMoveChangeStates(
    states
  )
}

function buildEvolutionStates(
  candidate
) {
  const paths =
    getPokemonEvolutionPaths(
      candidate.reference
    )

  if (
    paths.length ===
    0
  ) {
    return []
  }

  const states = []

  for (
    const path
    of paths
  ) {
    if (
      path.resolved !==
        true ||
      !path.target
    ) {
      continue
    }

    const evolvedCandidate =
      deriveRaidCandidateForReference({
        candidate,

        reference:
          path.target,
      })

    if (
      evolvedCandidate.status !==
      'READY'
    ) {
      continue
    }

    const fastOptions =
      getNormalMoveOptions(
        getFastMoveOptions(
          path.target
        )
      )

    const chargedOutcomes =
      getEvolutionChargedMoveOutcomes({
        candidate,

        targetReference:
          path.target,
      })

    if (
      fastOptions.length ===
        0 ||
      chargedOutcomes.length ===
        0
    ) {
      continue
    }

    const preservation =
      buildEvolutionPreservation(
        candidate
      )

    const action =
      buildEvolutionAction(
        path
      )

    const changes =
      buildEvolutionChanges({
        candidate,
        path,
      })

    for (
      const fastOption
      of fastOptions
    ) {
      for (
        const chargedOutcome
        of chargedOutcomes
      ) {
        const moves =
          buildMoves({
            fastMoveId:
              fastOption.id,

            chargedMove1Id:
              chargedOutcome
                .chargedMove1Id,

            chargedMove2Id:
              chargedOutcome
                .chargedMove2Id,
          })

        states.push(
          buildState({
            type:
              RAID_POSSIBLE_STATE_TYPE
                .EVOLUTION,

            candidate,

            candidateOverride:
              evolvedCandidate,

            moves,

            reachable:
              true,

            destinationCertainty:
              getDestinationCertainty({
                stochastic:
                  fastOptions.length >
                    1 ||
                  chargedOutcomes.length >
                    1,
              }),

            changes,

            action,

            preservation,
          })
        )
      }
    }
  }

  return states
}

// --------------------------------------------------
// Possible-state generation
// --------------------------------------------------

export function buildRaidPossibleStates(
  candidate,
  {
    includePowerUps = false,
  } = {}
) {
  if (
    !candidate ||
    candidate.status !==
      'READY' ||
    !candidate.reference ||
    !candidate.moves ||
    !candidate.moves.fast ||
    !Array.isArray(
      candidate.moves.charged
    )
  ) {
    return {
      status:
        RAID_POSSIBLE_STATE_STATUS
          .INVALID_CANDIDATE,

      states: [],
    }
  }

  const currentState =
    buildCurrentState(
      candidate
    )

  const fastMoveStates =
    buildFastMoveStates(
      candidate
    )

  const chargedMoveStates =
    buildChargedMoveReplacementStates(
      candidate
    )

  const secondChargedMoveStates =
    buildSecondChargedMoveStates(
      candidate
    )

  const powerUpStates =
    buildPowerUpStates(
      candidate
    )

  const enabledPowerUpStates =
    includePowerUps
      ? powerUpStates
      : []

  const evolutionStates =
    buildEvolutionStates(
      candidate
    )

  const evolutionMoveChangeStates =
    buildEvolutionMoveChangeStates(
      candidate
    )

  const possibleStates = [
    ...fastMoveStates,
    ...chargedMoveStates,
    ...secondChargedMoveStates,
    ...enabledPowerUpStates,
    ...evolutionStates,
    ...evolutionMoveChangeStates,
  ]

  return {
    status:
      RAID_POSSIBLE_STATE_STATUS
        .READY,

    pokemonIdentity:
      candidate
        .pokemonIdentity,

    states: [
      currentState,
      ...possibleStates,
    ],

    currentState,

    currentStates: [
      currentState,
    ],

    possibleStates,

    fastMoveStates,

    chargedMoveStates,

    secondChargedMoveStates,

    powerUpStates,

    powerUpsIncluded:
      includePowerUps ===
      true,

    evolutionStates,

    evolutionMoveChangeStates,

    protectedOwnedMoves:
      getProtectedOwnedMoves(
        candidate
      ),
  }
}