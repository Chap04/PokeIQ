import {
  PROJECT_BUILD_STATUS,
  PROJECT_STATUS,
  PROJECT_TYPE,
} from '../src/utils/projectConstants.js'

import {
  buildProjectFromRaidRecommendation,
} from '../src/services/buildProjectFromRaidRecommendation.js'

import {
  buildRaidProjectPlan,
  RAID_PROJECT_JUSTIFICATION,
  RAID_PROJECT_PLAN_STATUS,
} from '../src/services/buildRaidProjectPlan.js'

import {
  findMatchingProjectForRecommendation,
  findProjectForCollectionId,
  projectGoalsMatch,
  recommendationHasProject,
} from '../src/utils/projectMatching.js'

// --------------------------------------------------
// Helpers
// --------------------------------------------------

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

    console.log(
      `PASS - ${name}`
    )

    return true
  } catch (error) {
    console.log(
      `FAIL - ${name}`
    )

    console.log(
      `       ${error.message}`
    )

    return false
  }
}

// --------------------------------------------------
// Deterministic IDs
// --------------------------------------------------

let idCounter = 0

function testIdFactory(
  prefix
) {
  idCounter += 1

  return (
    `${prefix}-${idCounter}`
  )
}

// --------------------------------------------------
// Fixtures
// --------------------------------------------------

const collectionId =
  'collection-shadow-swinub-1'

const initialRecommendation = {
  collectionId,

  pokemonName:
    'Swinub',

  sourcePokemonIdentity:
    'SWINUB__SHADOW',

  resultingPokemonIdentity:
    'MAMOSWINE__SHADOW',

  title:
    'Evolve into Mamoswine',

  recommendationType:
    'ACTIONABLE',

  actionType:
    'EVOLVE',

  accountAwareRank: 2,

  raidStrengthScore:
    72,

  raidStrengthClassification:
    'STRONG',

  accountImpactSummary: {
    overallStrengthPointChange:
      1.25,

    overallStrengthPercentChange:
      4.4,
  },
}

function makeOpportunity({
  originalIndex,
  type,
  actionType,
  strength = 70,
  performance =
    'STRONG_IMPROVEMENT',
  targetLevel = null,
  premium = false,
  ordinary = false,
  moveType = null,
  slot = null,
  fromMove = null,
  toMove = null,
  targetName = null,
  destroysProtectedMove = false,
  destinationCertainty =
    'DETERMINISTIC',
}) {
  const changes = {}

  if (
    moveType ===
    'FAST'
  ) {
    changes.fastMove = {
      from:
        fromMove,

      to:
        toMove,
    }
  }

  if (
    moveType ===
    'CHARGED'
  ) {
    changes.chargedMove = {
      slot,

      from:
        fromMove,

      to:
        toMove,
    }
  }

  if (
    Number.isFinite(
      targetLevel
    )
  ) {
    changes.level = {
      from: 30,
      to:
        targetLevel,
    }
  }

  const actions = []

  if (actionType) {
    const action = {
      type:
        actionType,
    }

    if (
      Number.isFinite(
        targetLevel
      )
    ) {
      action.targetLevel =
        targetLevel
    }

    if (
      actionType ===
        'EVOLVE'
    ) {
      action.targetName =
        targetName
    }

    actions.push(
      action
    )
  }

  return {
    originalIndex,

    rankGroup:
      'ACTIONABLE_PROMISING',

    possibleStateType:
      type,

    destinationCertainty,

    reachable:
      true,

    destroysProtectedMove,

    actions,

    action:
      actions[0] ??
      null,

    changes,

    possibleState: {
      type,

      destinationCertainty,

      combat:
        Number.isFinite(
          targetLevel
        )
          ? {
              level:
                targetLevel,
            }
          : null,

      candidate:
        targetName
          ? {
              reference: {
                name:
                  targetName,

                familyId:
                  'FAMILY_SWINUB',
              },
            }
          : {
              reference: {
                familyId:
                  'FAMILY_SWINUB',
              },
            },
    },

    assessment: {
      performance,

      performanceEvidence: {
        medianPercentGain:
          18,

        improvementRate:
          0.8,
      },

      changes,

      actions,
    },

    powerUpContext:
      Number.isFinite(
        targetLevel
      )
        ? {
            targetLevel,

            isPremiumOpportunity:
              premium,

            isOrdinaryStoppingPoint:
              ordinary,

            isRecommendedCheckpoint:
              true,

            incrementalCost: {
              stardust:
                premium
                  ? 250000
                  : 75000,

              candy:
                premium
                  ? 100
                  : 60,

              candyXL:
                premium
                  ? 296
                  : 0,
            },
          }
        : null,

    raidStrength: {
      status:
        'SUCCESS',

      bestOverallStrengthScore:
        strength,

      bestStrengthScore:
        strength,

      bestClassification:
        strength >= 75
          ? 'ELITE'
          : strength >= 60
            ? 'STRONG'
            : 'LIMITED',
    },
  }
}

function buildFixtureProject() {
  idCounter = 0

  const result =
    buildProjectFromRaidRecommendation({
      recommendation:
        initialRecommendation,

      idFactory:
        testIdFactory,

      now:
        '2026-09-02T13:45:00.000Z',
    })

  assert(
    result.status ===
      PROJECT_BUILD_STATUS
        .SUCCESS,
    'Project builder did not return SUCCESS.'
  )

  return result
}

function buildRaidDashboardFixture(
  opportunities
) {
  return {
    status:
      'SUCCESS',

    ranking: {
      entries: [
        {
          collectionId,

          pokemonIdentity:
            'SWINUB__SHADOW',

          candidate: {
            pokemonIdentity:
              'SWINUB__SHADOW',

            reference: {
              name:
                'Swinub',

              familyId:
                'FAMILY_SWINUB',
            },
          },

          currentState: {
            pokemonIdentity:
              'SWINUB__SHADOW',
          },

          opportunityResult: {
            actionableOpportunities:
              opportunities,
          },
        },
      ],
    },
  }
}

// --------------------------------------------------
// Account-impact test helper
//
// Production uses the real account-impact service.
//
// Tests use deterministic summaries so Project-plan
// policy can be tested independently from 18-type
// profile mechanics.
// --------------------------------------------------

function buildAccountImpactEnricher(
  impactByOriginalIndex = {}
) {
  return ({
    recommendation,
  }) => {
    const originalIndex =
      recommendation
        ?.opportunity
        ?.originalIndex

    const override =
      impactByOriginalIndex[
        originalIndex
      ] ?? {}

    const overallStrengthPointChange =
      Number.isFinite(
        override.pointChange
      )
        ? override.pointChange
        : 0.5

    const overallStrengthPercentChange =
      Number.isFinite(
        override.percentChange
      )
        ? override.percentChange
        : 1

    const improvedTypeCount =
      Number.isFinite(
        override.improvedTypeCount
      )
        ? override.improvedTypeCount
        : (
            overallStrengthPointChange >
            0
              ? 1
              : 0
          )

    const regressedTypeCount =
      Number.isFinite(
        override.regressedTypeCount
      )
        ? override.regressedTypeCount
        : (
            overallStrengthPointChange <
            0
              ? 1
              : 0
          )

    const biggestTypePercent =
      Number.isFinite(
        override.biggestTypePercent
      )
        ? override.biggestTypePercent
        : (
            overallStrengthPointChange >
            0
              ? 5
              : 0
          )

    const createsNewTypeCoverage =
      override
        .createsNewTypeCoverage ===
      true

    const accountImpactSummary = {
      overallStrengthPointChange,

      overallStrengthPercentChange,

      affectedTypeCount:
        improvedTypeCount +
        regressedTypeCount,

      improvedTypeCount,

      regressedTypeCount,

      improvedTypes:
        improvedTypeCount > 0
          ? [
              {
                type:
                  'ICE',

                pointChange:
                  overallStrengthPointChange,

                percentChange:
                  biggestTypePercent,

                teamChanged:
                  true,

                newCoverage:
                  createsNewTypeCoverage,
              },
            ]
          : [],

      regressedTypes:
        regressedTypeCount > 0
          ? [
              {
                type:
                  'GROUND',

                pointChange:
                  -0.1,

                percentChange:
                  -1,

                teamChanged:
                  true,

                lostCoverage:
                  false,
              },
            ]
          : [],

      biggestImprovement:
        improvedTypeCount > 0
          ? {
              type:
                'ICE',

              pointChange:
                overallStrengthPointChange,

              percentChange:
                biggestTypePercent,

              teamChanged:
                true,

              newCoverage:
                createsNewTypeCoverage,
            }
          : null,

      biggestRegression:
        regressedTypeCount > 0
          ? {
              type:
                'GROUND',

              pointChange:
                -0.1,

              percentChange:
                -1,

              teamChanged:
                true,

              lostCoverage:
                false,
            }
          : null,

      changesCurrentTypeTeam:
        improvedTypeCount > 0 ||
        regressedTypeCount > 0,

      createsNewTypeCoverage,

      losesTypeCoverage:
        false,
    }

    return {
      ...recommendation,

      accountImpact: {
        status:
          'SUCCESS',
      },

      accountImpactSummary,

      accountImpactStatus:
        override.status ??
        'SUCCESS',
    }
  }
}

function buildPlan({
  project,
  opportunities,
  impactByOriginalIndex = {},
}) {
  return (
    buildRaidProjectPlan({
      project,

      raidDashboard:
        buildRaidDashboardFixture(
          opportunities
        ),

      currentProfile: {
        status:
          'TEST_PROFILE',
      },

      accountImpactEnricher:
        buildAccountImpactEnricher(
          impactByOriginalIndex
        ),
    })
  )
}

// --------------------------------------------------
// Tests
// --------------------------------------------------

const tests = []

tests.push([
  'Recommendation creates one Pokemon-centric Raid Investment Project',
  () => {
    const {
      project,
      actions,
    } =
      buildFixtureProject()

    assert(
      project,
      'Project was not created.'
    )

    assert(
      project.type ===
        PROJECT_TYPE
          .RAID_INVESTMENT,
      'Project type should be RAID_INVESTMENT.'
    )

    assert(
      project.status ===
        PROJECT_STATUS.ACTIVE,
      'Project should start ACTIVE.'
    )

    assert(
      project.collectionId ===
        collectionId,
      'Project collectionId was not preserved.'
    )

    assert(
      project.title ===
        'Swinub Raid Investment',
      `Unexpected Project title: ${project.title}`
    )

    assert(
      actions.length ===
        0,
      'V2 Project creation should not persist frozen recommendation Actions.'
    )
  },
])

tests.push([
  'V2 Project does not persist one frozen target state',
  () => {
    const {
      project,
    } =
      buildFixtureProject()

    assert(
      !Object.prototype.hasOwnProperty.call(
        project,
        'targetState'
      ),
      'V2 Project should not use targetState as its durable identity.'
    )
  },
])

tests.push([
  'Two different recommendations for the same Pokemon match one Project',
  () => {
    const {
      project,
    } =
      buildFixtureProject()

    const moveRecommendation = {
      collectionId,

      pokemonName:
        'Swinub',

      title:
        'Teach Powder Snow',

      actionType:
        'FAST_TM',
    }

    const matching =
      findMatchingProjectForRecommendation(
        [project],
        moveRecommendation
      )

    assert(
      matching?.id ===
        project.id,
      'Different recommendations for the same collectionId should belong to the same Project.'
    )

    assert(
      recommendationHasProject(
        [project],
        moveRecommendation
      ) === true,
      'Dashboard should treat this Pokemon as already in Projects.'
    )
  },
])

tests.push([
  'Recommendation still matches after the Pokemon species changes',
  () => {
    const {
      project,
    } =
      buildFixtureProject()

    const evolvedRecommendation = {
      collectionId,

      pokemonName:
        'Mamoswine',

      sourcePokemonIdentity:
        'MAMOSWINE__SHADOW',

      title:
        'Power Up to Level 40',
    }

    assert(
      recommendationHasProject(
        [project],
        evolvedRecommendation
      ) === true,
      'Evolution should not break Project ownership of the exact Collection Pokemon.'
    )
  },
])

tests.push([
  'Different owned Pokemon do not share a Project',
  () => {
    const {
      project,
    } =
      buildFixtureProject()

    const otherRecommendation = {
      collectionId:
        'collection-shadow-swinub-2',

      pokemonName:
        'Swinub',
    }

    assert(
      recommendationHasProject(
        [project],
        otherRecommendation
      ) === false,
      'Different Collection Pokemon should not share one Project.'
    )
  },
])

tests.push([
  'Abandoned Project releases the Pokemon back to Dashboard',
  () => {
    const {
      project,
    } =
      buildFixtureProject()

    const abandoned = {
      ...project,

      status:
        PROJECT_STATUS
          .ABANDONED,
    }

    assert(
      findProjectForCollectionId(
        [abandoned],
        collectionId
      ) === null,
      'Abandoned Project should not claim the Pokemon.'
    )

    assert(
      recommendationHasProject(
        [abandoned],
        initialRecommendation
      ) === false,
      'Recommendation should be eligible to return after Project abandonment.'
    )
  },
])

tests.push([
  'Project goal matching is Pokemon-centric',
  () => {
    const {
      project,
    } =
      buildFixtureProject()

    const secondProject = {
      ...project,

      id:
        'different-project-id',

      targetState: {
        combat: {
          level: 50,
        },
      },
    }

    assert(
      projectGoalsMatch(
        project,
        secondProject
      ) === true,
      'Same exact Pokemon should represent the same V2 Raid Investment goal.'
    )
  },
])

tests.push([
  'Live Project plan can contain evolution, move and power-up improvements together',
  () => {
    const {
      project,
    } =
      buildFixtureProject()

    const opportunities = [
      makeOpportunity({
        originalIndex: 0,
        type:
          'EVOLUTION',
        actionType:
          'EVOLVE',
        targetName:
          'Mamoswine',
      }),

      makeOpportunity({
        originalIndex: 1,
        type:
          'FAST_MOVE_CHANGE',
        actionType:
          'FAST_TM',
        moveType:
          'FAST',
        fromMove:
          'MUD_SLAP_FAST',
        toMove:
          'POWDER_SNOW_FAST',
      }),

      makeOpportunity({
        originalIndex: 2,
        type:
          'CHARGED_MOVE_CHANGE',
        actionType:
          'CHARGED_TM',
        moveType:
          'CHARGED',
        slot:
          'slot1',
        fromMove:
          'STONE_EDGE',
        toMove:
          'AVALANCHE',
      }),

      makeOpportunity({
        originalIndex: 3,
        type:
          'POWER_UP',
        actionType:
          'POWER_UP',
        targetLevel: 40,
        ordinary:
          true,
      }),
    ]

    const plan =
      buildPlan({
        project,
        opportunities,
      })

    assert(
      plan.status ===
        RAID_PROJECT_PLAN_STATUS
          .SUCCESS,
      'Project plan should succeed.'
    )

    assert(
      plan.recommendedNow.length ===
        4,
      `Expected 4 current improvements but received ${plan.recommendedNow.length}.`
    )
  },
])

tests.push([
  'Conflicting Charged Move recommendations choose the stronger account improvement',
  () => {
    const {
      project,
    } =
      buildFixtureProject()

    const opportunities = [
      makeOpportunity({
        originalIndex: 0,
        type:
          'CHARGED_MOVE_CHANGE',
        actionType:
          'CHARGED_TM',
        moveType:
          'CHARGED',
        slot:
          'slot1',
        fromMove:
          'STONE_EDGE',
        toMove:
          'AVALANCHE',
        strength:
          80,
      }),

      makeOpportunity({
        originalIndex: 1,
        type:
          'CHARGED_MOVE_CHANGE',
        actionType:
          'CHARGED_TM',
        moveType:
          'CHARGED',
        slot:
          'slot1',
        fromMove:
          'STONE_EDGE',
        toMove:
          'HIGH_HORSEPOWER',
        strength:
          74,
      }),
    ]

    const plan =
      buildPlan({
        project,
        opportunities,

        impactByOriginalIndex: {
          0: {
            pointChange:
              0.2,
          },

          1: {
            pointChange:
              0.9,
          },
        },
      })

    assert(
      plan.items.length ===
        1,
      `Expected one coherent slot1 recommendation but received ${plan.items.length}.`
    )

    assert(
      plan.items[0]
        .title ===
        'Teach High Horsepower',
      'Competing moves should be resolved using account impact before isolated Raid Strength.'
    )
  },
])

tests.push([
  'Ordinary and justified premium power-up checkpoints are separated',
  () => {
    const {
      project,
    } =
      buildFixtureProject()

    const opportunities = [
      makeOpportunity({
        originalIndex: 0,
        type:
          'POWER_UP',
        actionType:
          'POWER_UP',
        targetLevel: 40,
        ordinary:
          true,
      }),

      makeOpportunity({
        originalIndex: 1,
        type:
          'POWER_UP',
        actionType:
          'POWER_UP',
        targetLevel: 50,
        premium:
          true,
        strength:
          82,
      }),

      makeOpportunity({
        originalIndex: 2,
        type:
          'POWER_UP',
        actionType:
          'POWER_UP',
        targetLevel: 35,
        strength:
          65,
      }),
    ]

    const plan =
      buildPlan({
        project,
        opportunities,

        impactByOriginalIndex: {
          1: {
            pointChange:
              0.4,

            percentChange:
              0.6,

            biggestTypePercent:
              3,
          },
        },
      })

    assert(
      plan.recommendedNow.length ===
        1,
      'Expected one ordinary current power-up checkpoint.'
    )

    assert(
      plan.recommendedNow[0]
        .targetLevel ===
        40,
      'Level 40 should be retained as ordinary stopping point.'
    )

    assert(
      plan.futureInvestments.length ===
        1,
      'Expected one justified premium future investment.'
    )

    assert(
      plan.futureInvestments[0]
        .targetLevel ===
        50,
      'Level 50 should be retained as premium future investment.'
    )
  },
])

tests.push([
  'Weak resulting attackers remain outside the Project plan',
  () => {
    const {
      project,
    } =
      buildFixtureProject()

    const opportunities = [
      makeOpportunity({
        originalIndex: 0,
        type:
          'FAST_MOVE_CHANGE',
        actionType:
          'FAST_TM',
        moveType:
          'FAST',
        fromMove:
          'TACKLE_FAST',
        toMove:
          'ICE_SHARD_FAST',
        strength:
          49,
      }),
    ]

    const plan =
      buildPlan({
        project,
        opportunities,
      })

    assert(
      plan.items.length ===
        0,
      'Raid Strength <= 50 should not become a Project investment instruction.'
    )
  },
])

tests.push([
  'Protected-move destruction is excluded from Project instructions',
  () => {
    const {
      project,
    } =
      buildFixtureProject()

    const opportunities = [
      makeOpportunity({
        originalIndex: 0,
        type:
          'CHARGED_MOVE_CHANGE',
        actionType:
          'CHARGED_TM',
        moveType:
          'CHARGED',
        slot:
          'slot1',
        fromMove:
          'LEGACY_MOVE',
        toMove:
          'AVALANCHE',
        destroysProtectedMove:
          true,
        strength:
          85,
      }),
    ]

    const plan =
      buildPlan({
        project,
        opportunities,
      })

    assert(
      plan.items.length ===
        0,
      'Protected move destruction should not become an instruction.'
    )
  },
])

tests.push([
  'Stochastic destination is not presented as a guaranteed Project instruction',
  () => {
    const {
      project,
    } =
      buildFixtureProject()

    const opportunities = [
      makeOpportunity({
        originalIndex: 0,
        type:
          'EVOLUTION',
        actionType:
          'EVOLVE',
        targetName:
          'Mamoswine',
        destinationCertainty:
          'STOCHASTIC',
        strength:
          85,
      }),
    ]

    const plan =
      buildPlan({
        project,
        opportunities,
      })

    assert(
      plan.items.length ===
        0,
      'Stochastic destination should not be presented as a guaranteed Project instruction.'
    )
  },
])

tests.push([
  'Zero account impact is not currently justified',
  () => {
    const {
      project,
    } =
      buildFixtureProject()

    const opportunity =
      makeOpportunity({
        originalIndex: 0,
        type:
          'FAST_MOVE_CHANGE',
        actionType:
          'FAST_TM',
        moveType:
          'FAST',
        fromMove:
          'MUD_SLAP_FAST',
        toMove:
          'POWDER_SNOW_FAST',
        strength:
          80,
      })

    const plan =
      buildPlan({
        project,
        opportunities: [
          opportunity,
        ],

        impactByOriginalIndex: {
          0: {
            pointChange: 0,
            percentChange: 0,
            improvedTypeCount: 0,
            biggestTypePercent: 0,
          },
        },
      })

    assert(
      plan.recommendedNow.length ===
        0,
      'Zero-impact investment should not be Recommended Now.'
    )

    assert(
      plan.notCurrentlyJustified.length ===
        1,
      'Zero-impact investment should remain visible as not currently justified.'
    )

    assert(
      plan.notCurrentlyJustified[0]
        .accountJustification ===
        RAID_PROJECT_JUSTIFICATION
          .NO_ACCOUNT_IMPROVEMENT,
      'Expected NO_ACCOUNT_IMPROVEMENT classification.'
    )
  },
])

tests.push([
  'Account regression is not treated as a durable investment',
  () => {
    const {
      project,
    } =
      buildFixtureProject()

    const opportunity =
      makeOpportunity({
        originalIndex: 0,
        type:
          'CHARGED_MOVE_CHANGE',
        actionType:
          'CHARGED_TM',
        moveType:
          'CHARGED',
        slot:
          'slot1',
        fromMove:
          'STONE_EDGE',
        toMove:
          'AVALANCHE',
        strength:
          85,
      })

    const plan =
      buildPlan({
        project,
        opportunities: [
          opportunity,
        ],

        impactByOriginalIndex: {
          0: {
            pointChange:
              0.3,

            percentChange:
              0.5,

            improvedTypeCount:
              1,

            regressedTypeCount:
              1,
          },
        },
      })

    assert(
      plan.recommendedNow.length ===
        0,
      'Cross-type regression should not be Recommended Now.'
    )

    assert(
      plan.notCurrentlyJustified[0]
        .accountJustification ===
        RAID_PROJECT_JUSTIFICATION
          .ACCOUNT_REGRESSION,
      'Expected ACCOUNT_REGRESSION classification.'
    )
  },
])

tests.push([
  'Marginal premium investment is not currently justified',
  () => {
    const {
      project,
    } =
      buildFixtureProject()

    const opportunity =
      makeOpportunity({
        originalIndex: 0,
        type:
          'POWER_UP',
        actionType:
          'POWER_UP',
        targetLevel: 50,
        premium:
          true,
        strength:
          82,
      })

    const plan =
      buildPlan({
        project,
        opportunities: [
          opportunity,
        ],

        impactByOriginalIndex: {
          0: {
            pointChange:
              0.02,

            percentChange:
              0.08,

            improvedTypeCount:
              1,

            biggestTypePercent:
              1.1,
          },
        },
      })

    assert(
      plan.futureInvestments.length ===
        0,
      'Marginal premium investment should not be presented as Future Investment.'
    )

    assert(
      plan.notCurrentlyJustified.length ===
        1,
      'Marginal premium investment should remain visible for explanation.'
    )

    assert(
      plan.notCurrentlyJustified[0]
        .accountJustification ===
        RAID_PROJECT_JUSTIFICATION
          .PREMIUM_IMPACT_TOO_SMALL,
      'Expected PREMIUM_IMPACT_TOO_SMALL classification.'
    )
  },
])

tests.push([
  'Meaningful premium account improvement remains a future investment',
  () => {
    const {
      project,
    } =
      buildFixtureProject()

    const opportunity =
      makeOpportunity({
        originalIndex: 0,
        type:
          'POWER_UP',
        actionType:
          'POWER_UP',
        targetLevel: 50,
        premium:
          true,
        strength:
          82,
      })

    const plan =
      buildPlan({
        project,
        opportunities: [
          opportunity,
        ],

        impactByOriginalIndex: {
          0: {
            pointChange:
              0.08,

            percentChange:
              0.95,

            improvedTypeCount:
              1,

            biggestTypePercent:
              4.2,
          },
        },
      })

    assert(
      plan.futureInvestments.length ===
        1,
      'Meaningful premium improvement should remain a Future Investment.'
    )

    assert(
      plan.futureInvestments[0]
        .accountJustification ===
        RAID_PROJECT_JUSTIFICATION
          .PREMIUM_JUSTIFIED,
      'Expected PREMIUM_JUSTIFIED classification.'
    )
  },
])

tests.push([
  'New type coverage justifies premium investment',
  () => {
    const {
      project,
    } =
      buildFixtureProject()

    const opportunity =
      makeOpportunity({
        originalIndex: 0,
        type:
          'POWER_UP',
        actionType:
          'POWER_UP',
        targetLevel: 50,
        premium:
          true,
        strength:
          80,
      })

    const plan =
      buildPlan({
        project,
        opportunities: [
          opportunity,
        ],

        impactByOriginalIndex: {
          0: {
            pointChange:
              0.05,

            percentChange:
              0.1,

            improvedTypeCount:
              1,

            biggestTypePercent:
              1,

            createsNewTypeCoverage:
              true,
          },
        },
      })

    assert(
      plan.futureInvestments.length ===
        1,
      'New coverage should justify premium investment.'
    )
  },
])

// --------------------------------------------------
// Run
// --------------------------------------------------

console.log('')
console.log(
  '================================'
)
console.log(
  'PROJECT SYSTEM V2.1 VALIDATION'
)
console.log(
  '================================'
)
console.log('')

let passed = 0

for (
  const [name, test]
  of tests
) {
  if (
    runTest(
      name,
      test
    )
  ) {
    passed += 1
  }
}

console.log('')
console.log(
  `${passed}/${tests.length} tests passed`
)
console.log('')

if (
  passed !==
  tests.length
) {
  process.exitCode = 1
}