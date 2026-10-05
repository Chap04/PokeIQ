import {
  buildRaidInvestmentCost,
  RAID_INVESTMENT_COST_CERTAINTY,
  RAID_INVESTMENT_COST_STATUS,
  RAID_INVESTMENT_RESOURCE,
} from '../src/utils/raidInvestmentCost.js'

// --------------------------------------------------
// Test helpers
// --------------------------------------------------

let passed = 0
let failed = 0

function expectEqual(
  name,
  actual,
  expected
) {
  if (actual === expected) {
    passed += 1
    console.log(`PASS - ${name}`)
    return
  }

  failed += 1
  console.log(`FAIL - ${name}`)
  console.log(`   Expected: ${expected}`)
  console.log(`   Actual:   ${actual}`)
}

function expectTrue(
  name,
  value
) {
  expectEqual(
    name,
    value,
    true
  )
}

function getRequirement(
  result,
  resource,
  reason = null
) {
  return result.requirements.find(
    (requirement) =>
      requirement.resource ===
        resource &&
      (
        reason == null ||
        requirement.reason ===
          reason
      )
  )
}

function buildState({
  action,
  actions,
  additionalMoveAction = null,
  reachable = true,
}) {
  return {
    type:
      actions
        ? 'EVOLUTION_MOVE_CHANGE'
        : 'TEST_STATE',

    current:
      false,

    reachable,

    pokemonIdentity:
      'TESTMON__NORMAL',

    moves: {
      fastMoveId:
        'FAST_MOVE',

      chargedMove1Id:
        'CHARGED_MOVE',

      chargedMove2Id:
        null,
    },

    loadouts: [
      {
        fastMoveId:
          'FAST_MOVE',

        chargedMoveId:
          'CHARGED_MOVE',
      },
    ],

    action,

    ...(actions
      ? {
          actions,
        }
      : {}),

    additionalMoveAction,
  }
}

function buildEvolutionAction({
  candy = 50,
  purifiedCandy = 45,
  items = [],
}) {
  return {
    type:
      'EVOLVE',

    availability:
      'EVOLUTION',

    costs: {
      candy,
      purifiedCandy,
      items,
    },
  }
}

// --------------------------------------------------
// Main
// --------------------------------------------------

function main() {
  console.log('')
  console.log('================================')
  console.log('RAID MULTI-ACTION COST VALIDATION')
  console.log('================================')
  console.log('')

  // ------------------------------------------------
  // Existing single-action behavior
  // ------------------------------------------------

  const singleTm =
    buildRaidInvestmentCost(
      buildState({
        action: {
          type:
            'CHARGED_TM',
        },
      })
    )

  expectEqual(
    'Single TM cost succeeds',
    singleTm.status,
    RAID_INVESTMENT_COST_STATUS
      .SUCCESS
  )

  expectEqual(
    'Single normal TM remains uncertain',
    singleTm.certainty,
    RAID_INVESTMENT_COST_CERTAINTY
      .UNCERTAIN
  )

  expectEqual(
    'Single normal TM minimum is one',
    getRequirement(
      singleTm,
      RAID_INVESTMENT_RESOURCE
        .CHARGED_TM
    )?.minimumQuantity,
    1
  )

  // ------------------------------------------------
  // Natural evolution cost
  // ------------------------------------------------

  const naturalEvolution =
    buildRaidInvestmentCost(
      buildState({
        action:
          buildEvolutionAction({
            candy:
              50,
          }),
      }),
      {
        traits: {
          purified:
            false,
        },
      }
    )

  expectEqual(
    'Natural evolution cost succeeds',
    naturalEvolution.status,
    RAID_INVESTMENT_COST_STATUS
      .SUCCESS
  )

  expectEqual(
    'Natural evolution cost is exact',
    naturalEvolution.certainty,
    RAID_INVESTMENT_COST_CERTAINTY
      .EXACT
  )

  expectEqual(
    'Natural evolution costs 50 Candy',
    naturalEvolution
      .summary
      .candy,
    50
  )

  expectEqual(
    'Natural evolution is identified in summary',
    naturalEvolution
      .summary
      .requiresEvolution,
    true
  )

  // ------------------------------------------------
  // Evolution + Elite Charged TM
  // ------------------------------------------------

  const evolutionAction =
    buildEvolutionAction({
      candy:
        125,

      purifiedCandy:
        112,
    })

  const eliteAction = {
    type:
      'ELITE_CHARGED_TM',

    availability:
      'ELITE',

    targetMoveId:
      'METEOR_MASH',
  }

  const eliteComposite =
    buildRaidInvestmentCost(
      buildState({
        action: {
          type:
            'EVOLUTION_MOVE_CHANGE',
        },

        actions: [
          evolutionAction,
          eliteAction,
        ],
      }),
      {
        traits: {
          purified:
            false,
        },
      }
    )

  expectEqual(
    'Composite evolution + Elite TM succeeds',
    eliteComposite.status,
    RAID_INVESTMENT_COST_STATUS
      .SUCCESS
  )

  expectEqual(
    'Composite action path is preserved',
    eliteComposite
      .actions
      .length,
    2
  )

  expectEqual(
    'Composite regular evolution uses 125 Candy',
    eliteComposite
      .summary
      .candy,
    125
  )

  expectEqual(
    'Composite has one Elite TM requirement',
    eliteComposite
      .summary
      .eliteTmRequirementCount,
    1
  )

  expectEqual(
    'Evolution + Elite TM cost is exact',
    eliteComposite.certainty,
    RAID_INVESTMENT_COST_CERTAINTY
      .EXACT
  )

  expectEqual(
    'Composite wrapper does not create unknown cost',
    eliteComposite
      .summary
      .hasUnknownRequirement,
    false
  )

  expectEqual(
    'Elite Charged TM exact quantity is one',
    getRequirement(
      eliteComposite,
      RAID_INVESTMENT_RESOURCE
        .ELITE_CHARGED_TM
    )?.exactQuantity,
    1
  )

  // ------------------------------------------------
  // Evolution + normal TM remains stochastic
  // ------------------------------------------------

  const normalTmComposite =
    buildRaidInvestmentCost(
      buildState({
        action: {
          type:
            'EVOLUTION_MOVE_CHANGE',
        },

        actions: [
          buildEvolutionAction({
            candy:
              50,
          }),

          {
            type:
              'CHARGED_TM',

            availability:
              'NORMAL',
          },
        ],
      }),
      {
        traits: {
          purified:
            false,
        },
      }
    )

  expectEqual(
    'Evolution + normal TM is uncertain',
    normalTmComposite.certainty,
    RAID_INVESTMENT_COST_CERTAINTY
      .UNCERTAIN
  )

  expectEqual(
    'Evolution + normal TM still prices Candy',
    normalTmComposite
      .summary
      .candy,
    50
  )

  expectEqual(
    'Evolution + normal TM records stochastic cost',
    normalTmComposite
      .summary
      .hasStochasticCost,
    true
  )

  // ------------------------------------------------
  // Purified evolution Candy
  // ------------------------------------------------

  const purifiedEvolution =
    buildRaidInvestmentCost(
      buildState({
        action:
          buildEvolutionAction({
            candy:
              50,

            purifiedCandy:
              45,
          }),
      }),
      {
        traits: {
          purified:
            true,
        },
      }
    )

  expectEqual(
    'Purified candidate uses purified evolution Candy',
    purifiedEvolution
      .summary
      .candy,
    45
  )

  expectTrue(
    'Purified evolution requirement uses purified reason',
    Boolean(
      getRequirement(
        purifiedEvolution,
        RAID_INVESTMENT_RESOURCE
          .CANDY,
        'EVOLUTION_PURIFIED_CANDY'
      )
    )
  )

  // ------------------------------------------------
  // Evolution items
  // ------------------------------------------------

  const itemEvolution =
    buildRaidInvestmentCost(
      buildState({
        action:
          buildEvolutionAction({
            candy:
              25,

            items: [
              'UP_GRADE',
            ],
          }),
      }),
      {
        traits: {
          purified:
            false,
        },
      }
    )

  expectEqual(
    'Evolution item cost remains exact',
    itemEvolution.certainty,
    RAID_INVESTMENT_COST_CERTAINTY
      .EXACT
  )

  expectEqual(
    'Evolution item requirement count is one',
    itemEvolution
      .summary
      .evolutionItemRequirementCount,
    1
  )

  expectEqual(
    'Evolution item identity is preserved',
    itemEvolution
      .summary
      .evolutionItems[0]
      ?.itemId,
    'UP_GRADE'
  )

  expectEqual(
    'Evolution item quantity is one',
    itemEvolution
      .summary
      .evolutionItems[0]
      ?.quantity,
    1
  )

  const duplicateItems =
    buildRaidInvestmentCost(
      buildState({
        action:
          buildEvolutionAction({
            candy:
              100,

            items: [
              'TEST_ITEM',
              'TEST_ITEM',
            ],
          }),
      }),
      {
        traits: {
          purified:
            false,
        },
      }
    )

  expectEqual(
    'Duplicate same evolution items aggregate',
    duplicateItems
      .summary
      .evolutionItems[0]
      ?.quantity,
    2
  )

  // ------------------------------------------------
  // Legacy additionalMoveAction still works
  // ------------------------------------------------

  const legacyCombined =
    buildRaidInvestmentCost(
      buildState({
        action: {
          type:
            'FAST_TM',
        },

        additionalMoveAction: {
          type:
            'ELITE_CHARGED_TM',
        },
      })
    )

  expectEqual(
    'Legacy primary plus additional action still works',
    legacyCombined
      .requirements
      .length,
    2
  )

  expectEqual(
    'Legacy normal TM keeps uncertainty',
    legacyCombined.certainty,
    RAID_INVESTMENT_COST_CERTAINTY
      .UNCERTAIN
  )

  // ------------------------------------------------
  // Explicit actions are authoritative
  // ------------------------------------------------

  const authoritativeActions =
    buildRaidInvestmentCost(
      buildState({
        action: {
          type:
            'EVOLUTION_MOVE_CHANGE',
        },

        actions: [
          buildEvolutionAction({
            candy:
              50,
          }),

          {
            type:
              'ELITE_FAST_TM',
          },
        ],

        additionalMoveAction: {
          type:
            'SPECIAL_ACQUISITION',
        },
      }),
      {
        traits: {
          purified:
            false,
        },
      }
    )

  expectEqual(
    'Explicit actions ignore legacy additional action',
    authoritativeActions
      .summary
      .requiresSpecialAcquisition,
    false
  )

  expectEqual(
    'Explicit action path remains exact',
    authoritativeActions.certainty,
    RAID_INVESTMENT_COST_CERTAINTY
      .EXACT
  )

  // ------------------------------------------------
  // SPECIAL acquisition in action path
  // ------------------------------------------------

  const specialComposite =
    buildRaidInvestmentCost(
      buildState({
        action: {
          type:
            'EVOLUTION_MOVE_CHANGE',
        },

        actions: [
          buildEvolutionAction({
            candy:
              50,
          }),

          {
            type:
              'SPECIAL_ACQUISITION',
          },
        ],
      }),
      {
        traits: {
          purified:
            false,
        },
      }
    )

  expectEqual(
    'Special composite cost is incomplete',
    specialComposite.certainty,
    RAID_INVESTMENT_COST_CERTAINTY
      .INCOMPLETE
  )

  expectEqual(
    'Special composite still includes evolution Candy',
    specialComposite
      .summary
      .candy,
    50
  )

  expectEqual(
    'Special composite identifies special acquisition',
    specialComposite
      .summary
      .requiresSpecialAcquisition,
    true
  )

  // ------------------------------------------------
  // Results
  // ------------------------------------------------

  console.log('')
  console.log('================================')
  console.log('TEST RESULTS')
  console.log('================================')
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  console.log(`Total: ${passed + failed}`)
  console.log('')

  if (failed === 0) {
    console.log(
      `🎉 ${passed}/${passed} tests passed.`
    )
  } else {
    console.log(
      `❌ ${failed} test(s) failed.`
    )

    process.exitCode = 1
  }
}

try {
  main()
} catch (
  error
) {
  console.error('')
  console.error(
    'Raid multi-action cost test failed:'
  )
  console.error(error)
  process.exitCode = 1
}