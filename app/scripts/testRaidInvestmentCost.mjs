import {
  buildRaidInvestmentCost,
  RAID_INVESTMENT_COST_STATUS,
  RAID_INVESTMENT_COST_CERTAINTY,
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
  if (
    actual ===
    expected
  ) {
    passed += 1

    console.log(
      `PASS - ${name}`
    )
  } else {
    failed += 1

    console.log(
      `FAIL - ${name}`
    )

    console.log(
      `   Expected: ${expected}`
    )

    console.log(
      `   Actual:   ${actual}`
    )
  }
}

function expectTrue(
  name,
  value
) {
  if (
    value === true
  ) {
    passed += 1

    console.log(
      `PASS - ${name}`
    )
  } else {
    failed += 1

    console.log(
      `FAIL - ${name}`
    )

    console.log(
      '   Expected: true'
    )

    console.log(
      `   Actual:   ${value}`
    )
  }
}

function buildState({
  type = 'TEST_STATE',
  actionType = 'NONE',
  additionalActionType = null,
  reachable = true,
} = {}) {
  return {
    type,

    current:
      false,

    reachable,

    pokemonIdentity:
      'RAYQUAZA__NORMAL',

    moves: {
      fastMoveId:
        'DRAGON_TAIL_FAST',

      chargedMove1Id:
        'OUTRAGE',

      chargedMove2Id:
        null,
    },

    loadouts: [
      {
        fastMoveId:
          'DRAGON_TAIL_FAST',

        chargedMoveId:
          'OUTRAGE',
      },
    ],

    action: {
      type:
        actionType,
    },

    additionalMoveAction:
      additionalActionType
        ? {
            type:
              additionalActionType,
          }
        : null,
  }
}

function findRequirement(
  result,
  resource
) {
  return result.requirements.find(
    (requirement) =>
      requirement.resource ===
      resource
  )
}

// --------------------------------------------------
// Main
// --------------------------------------------------

function main() {
  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'RAID INVESTMENT COST VALIDATION'
  )
  console.log(
    '================================'
  )
  console.log('')

  // ------------------------------------------------
  // No action
  // ------------------------------------------------

  const noAction =
    buildRaidInvestmentCost(
      buildState({
        actionType:
          'NONE',
      })
    )

  expectEqual(
    'No-action state succeeds',
    noAction.status,
    RAID_INVESTMENT_COST_STATUS
      .SUCCESS
  )

  expectEqual(
    'No-action state has no requirements',
    noAction.requirements.length,
    0
  )

  expectEqual(
    'No-action state has no resource cost',
    noAction.certainty,
    RAID_INVESTMENT_COST_CERTAINTY
      .NONE
  )

  expectEqual(
    'No-action state reports exact cost as false',
    noAction.exactCostKnown,
    false
  )

  // ------------------------------------------------
  // Normal Fast TM
  // ------------------------------------------------

  const fastTm =
    buildRaidInvestmentCost(
      buildState({
        actionType:
          'FAST_TM',
      })
    )

  const fastTmRequirement =
    findRequirement(
      fastTm,
      RAID_INVESTMENT_RESOURCE
        .FAST_TM
    )

  expectEqual(
    'Fast TM state succeeds',
    fastTm.status,
    RAID_INVESTMENT_COST_STATUS
      .SUCCESS
  )

  expectTrue(
    'Fast TM requirement exists',
    Boolean(
      fastTmRequirement
    )
  )

  expectEqual(
    'Fast TM minimum quantity is one',
    fastTmRequirement
      ?.minimumQuantity,
    1
  )

  expectEqual(
    'Fast TM exact quantity is unknown',
    fastTmRequirement
      ?.exactQuantity,
    null
  )

  expectEqual(
    'Fast TM target is stochastic',
    fastTmRequirement
      ?.stochastic,
    true
  )

  expectEqual(
    'Fast TM cost certainty is uncertain',
    fastTm.certainty,
    RAID_INVESTMENT_COST_CERTAINTY
      .UNCERTAIN
  )

  // ------------------------------------------------
  // Normal Charged TM
  // ------------------------------------------------

  const chargedTm =
    buildRaidInvestmentCost(
      buildState({
        actionType:
          'CHARGED_TM',
      })
    )

  const chargedTmRequirement =
    findRequirement(
      chargedTm,
      RAID_INVESTMENT_RESOURCE
        .CHARGED_TM
    )

  expectTrue(
    'Charged TM requirement exists',
    Boolean(
      chargedTmRequirement
    )
  )

  expectEqual(
    'Charged TM quantity is not falsely exact',
    chargedTmRequirement
      ?.quantityKnown,
    false
  )

  expectEqual(
    'Charged TM is stochastic',
    chargedTmRequirement
      ?.stochastic,
    true
  )

  // ------------------------------------------------
  // Combined normal TMs
  // ------------------------------------------------

  const combinedNormal =
    buildRaidInvestmentCost(
      buildState({
        actionType:
          'FAST_AND_CHARGED_TM',
      })
    )

  expectEqual(
    'Combined normal-TM state has two requirements',
    combinedNormal
      .requirements
      .length,
    2
  )

  expectEqual(
    'Combined normal-TM cost remains uncertain',
    combinedNormal.certainty,
    RAID_INVESTMENT_COST_CERTAINTY
      .UNCERTAIN
  )

  expectEqual(
    'Combined normal-TM state reports stochastic cost',
    combinedNormal
      .summary
      .hasStochasticCost,
    true
  )

  // ------------------------------------------------
  // Elite Fast TM
  // ------------------------------------------------

  const eliteFast =
    buildRaidInvestmentCost(
      buildState({
        actionType:
          'ELITE_FAST_TM',
      })
    )

  const eliteFastRequirement =
    findRequirement(
      eliteFast,
      RAID_INVESTMENT_RESOURCE
        .ELITE_FAST_TM
    )

  expectEqual(
    'Elite Fast TM requirement is exact',
    eliteFastRequirement
      ?.exactQuantity,
    1
  )

  expectEqual(
    'Elite Fast TM target is deterministic',
    eliteFastRequirement
      ?.deterministic,
    true
  )

  expectEqual(
    'Elite Fast TM cost is exact',
    eliteFast.certainty,
    RAID_INVESTMENT_COST_CERTAINTY
      .EXACT
  )

  expectEqual(
    'Elite Fast TM exact cost is known',
    eliteFast.exactCostKnown,
    true
  )

  // ------------------------------------------------
  // Elite Charged TM
  // ------------------------------------------------

  const eliteCharged =
    buildRaidInvestmentCost(
      buildState({
        actionType:
          'ELITE_CHARGED_TM',
      })
    )

  const eliteChargedRequirement =
    findRequirement(
      eliteCharged,
      RAID_INVESTMENT_RESOURCE
        .ELITE_CHARGED_TM
    )

  expectEqual(
    'Elite Charged TM exact quantity is one',
    eliteChargedRequirement
      ?.exactQuantity,
    1
  )

  expectEqual(
    'Elite Charged TM is not stochastic',
    eliteChargedRequirement
      ?.stochastic,
    false
  )

  // ------------------------------------------------
  // Second Charged Move unlock
  // ------------------------------------------------

  const secondMove =
    buildRaidInvestmentCost(
      buildState({
        actionType:
          'UNLOCK_SECOND_CHARGED_MOVE',
      })
    )

  const secondMoveRequirement =
    findRequirement(
      secondMove,
      RAID_INVESTMENT_RESOURCE
        .SECOND_CHARGED_MOVE_UNLOCK
    )

  expectTrue(
    'Second move unlock requirement exists',
    Boolean(
      secondMoveRequirement
    )
  )

  expectEqual(
    'Second move unlock action count is exact',
    secondMoveRequirement
      ?.exactQuantity,
    1
  )

  expectEqual(
    'Second move Stardust cost is not invented',
    secondMoveRequirement
      ?.stardust,
    null
  )

  expectEqual(
    'Second move Candy cost is not invented',
    secondMoveRequirement
      ?.candy,
    null
  )

  expectEqual(
    'Second move resource cost is incomplete',
    secondMove.certainty,
    RAID_INVESTMENT_COST_CERTAINTY
      .INCOMPLETE
  )

  expectEqual(
    'Second move summary reports unlock requirement',
    secondMove
      .summary
      .requiresSecondMoveUnlock,
    true
  )

  // ------------------------------------------------
  // Second move + normal TM
  //
  // This is important:
  // We know the unlock is required, but a normal TM
  // target is not guaranteed.
  // ------------------------------------------------

  const secondMoveWithTm =
    buildRaidInvestmentCost(
      buildState({
        actionType:
          'UNLOCK_SECOND_CHARGED_MOVE',

        additionalActionType:
          'CHARGED_TM',
      })
    )

  expectEqual(
    'Second move plus TM has two resource requirements',
    secondMoveWithTm
      .requirements
      .length,
    2
  )

  expectTrue(
    'Second move plus TM includes unlock',
    Boolean(
      findRequirement(
        secondMoveWithTm,
        RAID_INVESTMENT_RESOURCE
          .SECOND_CHARGED_MOVE_UNLOCK
      )
    )
  )

  expectTrue(
    'Second move plus TM includes Charged TM',
    Boolean(
      findRequirement(
        secondMoveWithTm,
        RAID_INVESTMENT_RESOURCE
          .CHARGED_TM
      )
    )
  )

  expectEqual(
    'Second move plus TM remains incomplete overall',
    secondMoveWithTm
      .certainty,
    RAID_INVESTMENT_COST_CERTAINTY
      .INCOMPLETE
  )

  expectEqual(
    'Second move plus TM reports stochastic component',
    secondMoveWithTm
      .summary
      .hasStochasticCost,
    true
  )

  // ------------------------------------------------
  // Special acquisition
  // ------------------------------------------------

  const special =
    buildRaidInvestmentCost(
      buildState({
        actionType:
          'SPECIAL_ACQUISITION',

        reachable:
          false,
      })
    )

  expectEqual(
    'Special acquisition succeeds as cost evidence',
    special.status,
    RAID_INVESTMENT_COST_STATUS
      .SUCCESS
  )

  expectEqual(
    'Special acquisition preserves unreachable state',
    special.reachable,
    false
  )

  expectEqual(
    'Special acquisition cost is incomplete',
    special.certainty,
    RAID_INVESTMENT_COST_CERTAINTY
      .INCOMPLETE
  )

  expectEqual(
    'Special acquisition summary is explicit',
    special
      .summary
      .requiresSpecialAcquisition,
    true
  )

  // ------------------------------------------------
  // Unknown action
  // ------------------------------------------------

  const unknown =
    buildRaidInvestmentCost(
      buildState({
        actionType:
          'TOTALLY_NEW_ACTION',
      })
    )

  const unknownRequirement =
    findRequirement(
      unknown,
      RAID_INVESTMENT_RESOURCE
        .UNKNOWN
    )

  expectTrue(
    'Unknown action still produces requirement evidence',
    Boolean(
      unknownRequirement
    )
  )

  expectEqual(
    'Unknown action type is preserved',
    unknownRequirement
      ?.actionType,
    'TOTALLY_NEW_ACTION'
  )

  expectEqual(
    'Unknown action is incomplete rather than guessed',
    unknown.certainty,
    RAID_INVESTMENT_COST_CERTAINTY
      .INCOMPLETE
  )

  expectEqual(
    'Unknown requirement is visible in summary',
    unknown
      .summary
      .hasUnknownRequirement,
    true
  )

  // ------------------------------------------------
  // Metadata
  // ------------------------------------------------

  expectEqual(
    'Pokémon identity survives cost model',
    fastTm.pokemonIdentity,
    'RAYQUAZA__NORMAL'
  )

  expectEqual(
    'Possible state type survives cost model',
    fastTm.possibleStateType,
    'TEST_STATE'
  )

  // ------------------------------------------------
  // Invalid state
  // ------------------------------------------------

  const invalidNull =
    buildRaidInvestmentCost(
      null
    )

  expectEqual(
    'Missing state is rejected',
    invalidNull.status,
    RAID_INVESTMENT_COST_STATUS
      .INVALID_STATE
  )

  expectEqual(
    'Missing state produces no requirements',
    invalidNull
      .requirements
      .length,
    0
  )

  const invalidMoves =
    buildRaidInvestmentCost({
      type:
        'BROKEN_STATE',
    })

  expectEqual(
    'State without moves is rejected',
    invalidMoves.status,
    RAID_INVESTMENT_COST_STATUS
      .INVALID_STATE
  )

  // ------------------------------------------------
  // Input state remains untouched
  // ------------------------------------------------

  const mutationFixture =
    buildState({
      actionType:
        'CHARGED_TM',
  })

  buildRaidInvestmentCost(
    mutationFixture
  )

  expectEqual(
    'Possible state action is not mutated',
    mutationFixture
      .action
      .type,
    'CHARGED_TM'
  )

  expectEqual(
    'Possible state move is not mutated',
    mutationFixture
      .moves
      .chargedMove1Id,
    'OUTRAGE'
  )

  // ------------------------------------------------
  // Results
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'TEST RESULTS'
  )
  console.log(
    '================================'
  )

  console.log(
    `Passed: ${passed}`
  )

  console.log(
    `Failed: ${failed}`
  )

  console.log(
    `Total: ${passed + failed}`
  )

  console.log('')

  if (
    failed ===
    0
  ) {
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

main()