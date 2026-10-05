import {
  reconcileProjectHistory,
  getProjectHistoryEvents,
  PROJECT_HISTORY_EVENT_TYPE,
  PROJECT_HISTORY_RECORD_TYPE,
} from '../src/services/reconcileProjectHistory.js'

// --------------------------------------------------
// Test harness
// --------------------------------------------------

let passed = 0
let failed = 0

function assert(
  condition,
  message
) {
  if (!condition) {
    throw new Error(
      message
    )
  }
}

function runTest(
  name,
  test
) {
  try {
    test()

    passed += 1

    console.log(
      `PASS - ${name}`
    )
  } catch (error) {
    failed += 1

    console.log(
      `FAIL - ${name}`
    )

    console.log(
      `       ${error.message}`
    )
  }
}

// --------------------------------------------------
// Fixtures
// --------------------------------------------------

function buildProject() {
  return {
    id:
      'project-1',

    collectionId:
      'collection-1',

    status:
      'ACTIVE',
  }
}

function buildOwnedPokemon({
  name = 'Swinub',
  pokemonIdentity =
    'SWINUB__NORMAL',
} = {}) {
  return {
    id:
      'collection-1',

    pokemonIdentity,

    name,
  }
}

function buildCandidate({
  pokemonIdentity =
    'SWINUB__NORMAL',

  level = 30,

  fastMove =
    'POWDER_SNOW_FAST',

  chargedMove1 =
    'BODY_SLAM',

  chargedMove2 =
    null,
} = {}) {
  return {
    pokemonIdentity,

    level,

    moves: {
      fast:
        fastMove,

      charged:
        [
          chargedMove1,
          chargedMove2,
        ].filter(Boolean),

      chargedSlots: {
        slot1:
          chargedMove1,

        slot2:
          chargedMove2,
      },
    },
  }
}

function buildPlan({
  candidate =
    buildCandidate(),

  recommendedNow = [],
  futureInvestments = [],
} = {}) {
  return {
    candidate,

    pokemonIdentity:
      candidate
        .pokemonIdentity,

    recommendedNow,

    futureInvestments,

    notCurrentlyJustified:
      [],
  }
}

function buildPowerUpItem(
  level
) {
  return {
    intentKey:
      'POWER_UP',

    title:
      `Power up to Level ${level}`,

    actionType:
      'POWER_UP',

    possibleStateType:
      'POWER_UP',

    isPowerUp:
      true,

    targetLevel:
      level,

    moveChange:
      null,

    isEvolution:
      false,

    evolutionTargetName:
      null,

    actionPath: [
      {
        type:
          'POWER_UP',
      },
    ],

    opportunity: {},
  }
}

function buildFastMoveItem({
  from =
    'ICE_SHARD_FAST',

  to =
    'POWDER_SNOW_FAST',
} = {}) {
  return {
    intentKey:
      'FAST_MOVE',

    title:
      'Teach Powder Snow',

    actionType:
      'USE_FAST_TM',

    possibleStateType:
      'FAST_MOVE_CHANGE',

    isPowerUp:
      false,

    targetLevel:
      null,

    moveChange: {
      moveType:
        'FAST',

      slot:
        null,

      from,

      to,
    },

    isEvolution:
      false,

    evolutionTargetName:
      null,

    actionPath: [
      {
        type:
          'USE_FAST_TM',
      },
    ],

    opportunity: {},
  }
}

function buildChargedMoveItem({
  slot =
    'slot1',

  from =
    'BODY_SLAM',

  to =
    'AVALANCHE',
} = {}) {
  return {
    intentKey:
      `CHARGED_MOVE::${slot}`,

    title:
      'Teach Avalanche',

    actionType:
      'USE_CHARGED_TM',

    possibleStateType:
      'CHARGED_MOVE_CHANGE',

    isPowerUp:
      false,

    targetLevel:
      null,

    moveChange: {
      moveType:
        'CHARGED',

      slot,

      from,

      to,
    },

    isEvolution:
      false,

    evolutionTargetName:
      null,

    actionPath: [
      {
        type:
          'USE_CHARGED_TM',
      },
    ],

    opportunity: {},
  }
}

function buildSecondMoveItem() {
  return {
    intentKey:
      'SECOND_CHARGED_MOVE',

    title:
      'Unlock second Charged Move',

    actionType:
      'UNLOCK_SECOND_CHARGED_MOVE',

    possibleStateType:
      'SECOND_CHARGED_MOVE',

    isPowerUp:
      false,

    targetLevel:
      null,

    moveChange:
      null,

    isEvolution:
      false,

    evolutionTargetName:
      null,

    actionPath: [
      {
        type:
          'UNLOCK_SECOND_CHARGED_MOVE',
      },
    ],

    opportunity: {},
  }
}

function buildEvolutionItem() {
  return {
    intentKey:
      'EVOLUTION',

    title:
      'Evolve into Mamoswine',

    actionType:
      'EVOLVE',

    possibleStateType:
      'EVOLUTION',

    isPowerUp:
      false,

    targetLevel:
      null,

    moveChange:
      null,

    isEvolution:
      true,

    evolutionTargetName:
      'Mamoswine',

    actionPath: [
      {
        type:
          'EVOLVE',
      },
    ],

    opportunity: {
      possibleState: {
        pokemonIdentity:
          'MAMOSWINE__NORMAL',
      },
    },
  }
}

function initialize({
  plan,
  ownedPokemon =
    buildOwnedPokemon(),
} = {}) {
  return reconcileProjectHistory({
    project:
      buildProject(),

    plan,

    ownedPokemon,

    existingRecords:
      [],

    now:
      '2026-09-02T12:00:00.000Z',
  })
}

// --------------------------------------------------
// Tests
// --------------------------------------------------

console.log('')
console.log(
  '================================'
)
console.log(
  'PROJECT HISTORY VALIDATION'
)
console.log(
  '================================'
)
console.log('')

runTest(
  'First observation creates snapshot but no history event',
  () => {
    const result =
      initialize({
        plan:
          buildPlan({
            recommendedNow: [
              buildPowerUpItem(
                40
              ),
            ],
          }),
      })

    assert(
      result.initialized ===
        true,
      'Expected initialization.'
    )

    assert(
      result.events.length ===
        0,
      'Initial state must not create retroactive history.'
    )

    assert(
      result.recordsToAdd
        .length ===
        1,
      'Expected one baseline snapshot.'
    )

    assert(
      result.recordsToAdd[0]
        .recordType ===
        PROJECT_HISTORY_RECORD_TYPE
          .STATE_SNAPSHOT,
      'Expected snapshot record.'
    )
  }
)

runTest(
  'Unchanged state creates no duplicate snapshot',
  () => {
    const plan =
      buildPlan({
        recommendedNow: [
          buildPowerUpItem(
            40
          ),
        ],
      })

    const initial =
      initialize({
        plan,
      })

    const result =
      reconcileProjectHistory({
        project:
          buildProject(),

        plan,

        ownedPokemon:
          buildOwnedPokemon(),

        existingRecords:
          initial.recordsToAdd,

        now:
          '2026-09-02T12:05:00.000Z',
      })

    assert(
      result.changed ===
        false,
      'Expected unchanged reconciliation.'
    )

    assert(
      result.recordsToAdd
        .length ===
        0,
      'Expected no new records.'
    )
  }
)

runTest(
  'Completed power-up creates history event',
  () => {
    const initialPlan =
      buildPlan({
        candidate:
          buildCandidate({
            level:
              30,
          }),

        recommendedNow: [
          buildPowerUpItem(
            40
          ),
        ],
      })

    const initial =
      initialize({
        plan:
          initialPlan,
      })

    const updatedPlan =
      buildPlan({
        candidate:
          buildCandidate({
            level:
              40,
          }),

        recommendedNow:
          [],
      })

    const result =
      reconcileProjectHistory({
        project:
          buildProject(),

        plan:
          updatedPlan,

        ownedPokemon:
          buildOwnedPokemon(),

        existingRecords:
          initial.recordsToAdd,

        now:
          '2026-09-02T13:00:00.000Z',
      })

    assert(
      result.events.length ===
        1,
      'Expected one power-up event.'
    )

    assert(
      result.events[0]
        .eventType ===
        PROJECT_HISTORY_EVENT_TYPE
          .POWER_UP,
      'Expected power-up event type.'
    )

    assert(
      result.events[0]
        .title ===
        'Reached Level 40',
      'Expected Level 40 title.'
    )
  }
)

runTest(
  'Partial power-up does not complete higher target',
  () => {
    const initial =
      initialize({
        plan:
          buildPlan({
            candidate:
              buildCandidate({
                level:
                  30,
              }),

            recommendedNow: [
              buildPowerUpItem(
                40
              ),
            ],
          }),
      })

    const result =
      reconcileProjectHistory({
        project:
          buildProject(),

        plan:
          buildPlan({
            candidate:
              buildCandidate({
                level:
                  35,
              }),

            recommendedNow: [
              buildPowerUpItem(
                40
              ),
            ],
          }),

        ownedPokemon:
          buildOwnedPokemon(),

        existingRecords:
          initial.recordsToAdd,

        now:
          '2026-09-02T13:00:00.000Z',
      })

    assert(
      result.events.length ===
        0,
      'Level 35 should not complete Level 40 target.'
    )
  }
)

runTest(
  'Completed Fast Move change creates history event',
  () => {
    const initial =
      initialize({
        plan:
          buildPlan({
            candidate:
              buildCandidate({
                fastMove:
                  'ICE_SHARD_FAST',
              }),

            recommendedNow: [
              buildFastMoveItem(),
            ],
          }),
      })

    const result =
      reconcileProjectHistory({
        project:
          buildProject(),

        plan:
          buildPlan({
            candidate:
              buildCandidate({
                fastMove:
                  'POWDER_SNOW_FAST',
              }),
          }),

        ownedPokemon:
          buildOwnedPokemon(),

        existingRecords:
          initial.recordsToAdd,

        now:
          '2026-09-02T13:00:00.000Z',
      })

    assert(
      result.events.length ===
        1,
      'Expected Fast Move history event.'
    )

    assert(
      result.events[0]
        .eventType ===
        PROJECT_HISTORY_EVENT_TYPE
          .FAST_MOVE,
      'Expected Fast Move event type.'
    )
  }
)

runTest(
  'Completed Charged Move change creates history event',
  () => {
    const initial =
      initialize({
        plan:
          buildPlan({
            candidate:
              buildCandidate({
                chargedMove1:
                  'BODY_SLAM',
              }),

            recommendedNow: [
              buildChargedMoveItem(),
            ],
          }),
      })

    const result =
      reconcileProjectHistory({
        project:
          buildProject(),

        plan:
          buildPlan({
            candidate:
              buildCandidate({
                chargedMove1:
                  'AVALANCHE',
              }),
          }),

        ownedPokemon:
          buildOwnedPokemon(),

        existingRecords:
          initial.recordsToAdd,

        now:
          '2026-09-02T13:00:00.000Z',
      })

    assert(
      result.events.length ===
        1,
      'Expected Charged Move history event.'
    )

    assert(
      result.events[0]
        .eventType ===
        PROJECT_HISTORY_EVENT_TYPE
          .CHARGED_MOVE,
      'Expected Charged Move event type.'
    )
  }
)

runTest(
  'Second Charged Move unlock creates history event',
  () => {
    const initial =
      initialize({
        plan:
          buildPlan({
            candidate:
              buildCandidate({
                chargedMove2:
                  null,
              }),

            recommendedNow: [
              buildSecondMoveItem(),
            ],
          }),
      })

    const result =
      reconcileProjectHistory({
        project:
          buildProject(),

        plan:
          buildPlan({
            candidate:
              buildCandidate({
                chargedMove2:
                  'AVALANCHE',
              }),
          }),

        ownedPokemon:
          buildOwnedPokemon(),

        existingRecords:
          initial.recordsToAdd,

        now:
          '2026-09-02T13:00:00.000Z',
      })

    assert(
      result.events.length ===
        1,
      'Expected second Charged Move event.'
    )

    assert(
      result.events[0]
        .eventType ===
        PROJECT_HISTORY_EVENT_TYPE
          .SECOND_CHARGED_MOVE,
      'Expected second Charged Move event type.'
    )
  }
)

runTest(
  'Evolution creates history event',
  () => {
    const initial =
      initialize({
        plan:
          buildPlan({
            candidate:
              buildCandidate({
                pokemonIdentity:
                  'SWINUB__NORMAL',
              }),

            recommendedNow: [
              buildEvolutionItem(),
            ],
          }),

        ownedPokemon:
          buildOwnedPokemon({
            name:
              'Swinub',

            pokemonIdentity:
              'SWINUB__NORMAL',
          }),
      })

    const result =
      reconcileProjectHistory({
        project:
          buildProject(),

        plan:
          buildPlan({
            candidate:
              buildCandidate({
                pokemonIdentity:
                  'MAMOSWINE__NORMAL',
              }),
          }),

        ownedPokemon:
          buildOwnedPokemon({
            name:
              'Mamoswine',

            pokemonIdentity:
              'MAMOSWINE__NORMAL',
          }),

        existingRecords:
          initial.recordsToAdd,

        now:
          '2026-09-02T13:00:00.000Z',
      })

    assert(
      result.events.length ===
        1,
      'Expected evolution event.'
    )

    assert(
      result.events[0]
        .eventType ===
        PROJECT_HISTORY_EVENT_TYPE
          .EVOLUTION,
      'Expected evolution event type.'
    )

    assert(
      result.events[0]
        .title ===
        'Evolved into Mamoswine',
      'Expected Mamoswine title.'
    )
  }
)

runTest(
  'Multiple completed investments are detected together',
  () => {
    const initial =
      initialize({
        plan:
          buildPlan({
            candidate:
              buildCandidate({
                level:
                  30,

                fastMove:
                  'ICE_SHARD_FAST',

                chargedMove1:
                  'BODY_SLAM',
              }),

            recommendedNow: [
              buildPowerUpItem(
                40
              ),

              buildFastMoveItem(),

              buildChargedMoveItem(),
            ],
          }),
      })

    const result =
      reconcileProjectHistory({
        project:
          buildProject(),

        plan:
          buildPlan({
            candidate:
              buildCandidate({
                level:
                  40,

                fastMove:
                  'POWDER_SNOW_FAST',

                chargedMove1:
                  'AVALANCHE',
              }),
          }),

        ownedPokemon:
          buildOwnedPokemon(),

        existingRecords:
          initial.recordsToAdd,

        now:
          '2026-09-02T13:00:00.000Z',
      })

    assert(
      result.events.length ===
        3,
      'Expected three completed investments.'
    )
  }
)

runTest(
  'History events are not duplicated',
  () => {
    const initial =
      initialize({
        plan:
          buildPlan({
            candidate:
              buildCandidate({
                level:
                  30,
              }),

            recommendedNow: [
              buildPowerUpItem(
                40
              ),
            ],
          }),
      })

    const completed =
      reconcileProjectHistory({
        project:
          buildProject(),

        plan:
          buildPlan({
            candidate:
              buildCandidate({
                level:
                  40,
              }),
          }),

        ownedPokemon:
          buildOwnedPokemon(),

        existingRecords:
          initial.recordsToAdd,

        now:
          '2026-09-02T13:00:00.000Z',
      })

    const records = [
      ...initial.recordsToAdd,
      ...completed.recordsToAdd,
    ]

    const repeated =
      reconcileProjectHistory({
        project:
          buildProject(),

        plan:
          buildPlan({
            candidate:
              buildCandidate({
                level:
                  40,
              }),
          }),

        ownedPokemon:
          buildOwnedPokemon(),

        existingRecords:
          records,

        now:
          '2026-09-02T14:00:00.000Z',
      })

    assert(
      repeated.events.length ===
        0,
      'Completed event must not repeat.'
    )
  }
)

runTest(
  'Not Currently Justified targets never become history',
  () => {
    const plan =
      buildPlan({
        candidate:
          buildCandidate({
            level:
              30,
          }),
      })

    plan.notCurrentlyJustified = [
      buildPowerUpItem(
        50
      ),
    ]

    const initial =
      initialize({
        plan,
      })

    const updatedPlan =
      buildPlan({
        candidate:
          buildCandidate({
            level:
              50,
          }),
      })

    const result =
      reconcileProjectHistory({
        project:
          buildProject(),

        plan:
          updatedPlan,

        ownedPokemon:
          buildOwnedPokemon(),

        existingRecords:
          initial.recordsToAdd,

        now:
          '2026-09-02T13:00:00.000Z',
      })

    assert(
      result.events.length ===
        0,
      'Unjustified target must not create history.'
    )
  }
)

runTest(
  'History helper returns newest events first',
  () => {
    const records = [
      {
        recordType:
          PROJECT_HISTORY_RECORD_TYPE
            .HISTORY_EVENT,

        projectId:
          'project-1',

        eventKey:
          'old',

        completedAt:
          '2026-09-01T12:00:00.000Z',
      },

      {
        recordType:
          PROJECT_HISTORY_RECORD_TYPE
            .HISTORY_EVENT,

        projectId:
          'project-1',

        eventKey:
          'new',

        completedAt:
          '2026-09-02T12:00:00.000Z',
      },
    ]

    const history =
      getProjectHistoryEvents(
        records,
        'project-1'
      )

    assert(
      history[0]
        .eventKey ===
        'new',
      'Newest event should be first.'
    )
  }
)

// --------------------------------------------------
// Summary
// --------------------------------------------------

console.log('')
console.log(
  `${passed}/${passed + failed} tests passed`
)

if (failed > 0) {
  process.exitCode = 1
}