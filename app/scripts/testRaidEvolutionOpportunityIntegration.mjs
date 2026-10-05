import assert from 'node:assert/strict'

import moves from '../src/data/reference/moves-pve.json' with { type: 'json' }
import combatData from '../src/data/reference/combat.json' with { type: 'json' }

import {
  getChargedMoveOptions,
  getFastMoveOptions,
  getPokemonReference,
} from '../src/utils/pokemonReference.js'

import {
  calculatePokemonStats,
  getCpmForLevel,
} from '../src/utils/pokemonLevel.js'

import {
  buildRaidPossibleStates,
  RAID_POSSIBLE_STATE_STATUS,
  RAID_POSSIBLE_STATE_TYPE,
  RAID_POSSIBLE_STATE_DESTINATION_CERTAINTY,
} from '../src/utils/raidPossibleStates.js'

import {
  buildRaidBenchmarks,
} from '../src/utils/raidBenchmarks.js'

import {
  RAID_INVESTMENT_EVIDENCE_STATUS,
} from '../src/utils/raidInvestmentEvidence.js'

import {
  RAID_INVESTMENT_ASSESSMENT_STATUS,
  RAID_INVESTMENT_DESTINATION_CERTAINTY,
} from '../src/utils/raidInvestmentAssessment.js'

import {
  RAID_INVESTMENT_VALUE_STATUS,
  RAID_INVESTMENT_VALUE,
} from '../src/utils/raidInvestmentValue.js'

import {
  rankRaidInvestmentOpportunities,
  RAID_INVESTMENT_OPPORTUNITY_STATUS,
  RAID_INVESTMENT_RANK_GROUP,
} from '../src/utils/raidInvestmentOpportunity.js'

// --------------------------------------------------
// Harness
// --------------------------------------------------

let passed = 0
let failed = 0

function test(
  name,
  callback
) {
  try {
    callback()

    passed += 1

    console.log(
      `PASS - ${name}`
    )
  } catch (error) {
    failed += 1

    console.error(
      `FAIL - ${name}`
    )

    console.error(
      error
    )
  }
}

// --------------------------------------------------
// Candidate fixture
// --------------------------------------------------

function getNormalOptions(
  options
) {
  return options.filter(
    (option) =>
      option.availability ===
      'NORMAL'
  )
}

function buildCandidate(
  pokemonId
) {
  const reference =
    getPokemonReference(
      pokemonId
    )

  if (!reference) {
    throw new Error(
      `${pokemonId} reference not found.`
    )
  }

  const fastOptions =
    getNormalOptions(
      getFastMoveOptions(
        reference
      )
    )

  const chargedOptions =
    getNormalOptions(
      getChargedMoveOptions(
        reference
      )
    )

  if (
    fastOptions.length ===
      0 ||
    chargedOptions.length ===
      0
  ) {
    throw new Error(
      `${pokemonId} does not have enough NORMAL moves for this test.`
    )
  }

  const level =
    40

  const cpm =
    getCpmForLevel(
      level
    )

  const ivs = {
    attack:
      15,

    defense:
      14,

    stamina:
      13,
  }

  const stats =
    calculatePokemonStats({
      baseAttack:
        reference.stats.attack,

      baseDefense:
        reference.stats.defense,

      baseStamina:
        reference.stats.stamina,

      attackIv:
        ivs.attack,

      defenseIv:
        ivs.defense,

      staminaIv:
        ivs.stamina,

      cpm,
    })

  const fastMoveId =
    fastOptions[0].id

  const chargedMoveId =
    chargedOptions[0].id

  return {
    status:
      'READY',

    pokemonIdentity:
      `${reference.id}__${reference.form}`,

    reference,

    level,

    cpm,

    ivs,

    stats,

    traits: {
      shadow:
        false,

      purified:
        false,

      lucky:
        false,

      shiny:
        false,
    },

    moves: {
      fast:
        fastMoveId,

      charged: [
        chargedMoveId,
      ],

      chargedSlots: {
        slot1:
          chargedMoveId,

        slot2:
          null,
      },
    },

    loadouts: [
      {
        fastMoveId,

        chargedMoveId,
      },
    ],
  }
}

// --------------------------------------------------
// Fixture generation
//
// Anorith -> Armaldo is intentionally used here
// because its real generated evolution composites
// already exercise stochastic destination certainty.
//
// Nothing below hand-builds an investment state.
// --------------------------------------------------

const candidate =
  buildCandidate(
    'ANORITH'
  )

const stateResult =
  buildRaidPossibleStates(
    candidate
  )

const matchups =
  buildRaidBenchmarks()

const opportunityResult =
  rankRaidInvestmentOpportunities({
    candidate,

    currentState:
      stateResult.currentState,

    possibleStates:
      stateResult.possibleStates,

    matchups,

    moves,

    combatData,
  })

// --------------------------------------------------
// Find real generated composite states
// --------------------------------------------------

const generatedCompositeStates =
  stateResult
    .possibleStates
    .filter(
      (state) =>
        state.type ===
        RAID_POSSIBLE_STATE_TYPE
          .EVOLUTION_MOVE_CHANGE
    )

const generatedStochasticCompositeStates =
  generatedCompositeStates
    .filter(
      (state) =>
        state.destinationCertainty ===
        RAID_POSSIBLE_STATE_DESTINATION_CERTAINTY
          .STOCHASTIC
    )

// --------------------------------------------------
// Find the corresponding real opportunities
// --------------------------------------------------

const stochasticCompositeOpportunities =
  opportunityResult
    .opportunities
    .filter(
      (opportunity) =>
        opportunity.possibleStateType ===
          RAID_POSSIBLE_STATE_TYPE
            .EVOLUTION_MOVE_CHANGE &&
        opportunity
          .destinationCertainty ===
          RAID_INVESTMENT_DESTINATION_CERTAINTY
            .STOCHASTIC
    )

// --------------------------------------------------
// We specifically want one state that survives the
// complete pipeline:
//
// Possible State
//   -> Evidence
//   -> Assessment
//   -> Value
//   -> Opportunity
//
// and receives the dedicated stochastic classification
// at both Value and Opportunity ranking layers.
// --------------------------------------------------

const fullyClassifiedStochasticOpportunity =
  stochasticCompositeOpportunities
    .find(
      (opportunity) =>
        opportunity
          ?.evidence
          ?.status ===
          RAID_INVESTMENT_EVIDENCE_STATUS
            .SUCCESS &&
        opportunity
          ?.assessment
          ?.status ===
          RAID_INVESTMENT_ASSESSMENT_STATUS
            .SUCCESS &&
        opportunity
          ?.value
          ?.status ===
          RAID_INVESTMENT_VALUE_STATUS
            .SUCCESS &&
        opportunity
          ?.valueClassification ===
          RAID_INVESTMENT_VALUE
            .STOCHASTIC_DESTINATION &&
        opportunity
          ?.rankGroup ===
          RAID_INVESTMENT_RANK_GROUP
            .STOCHASTIC_DESTINATION
    )

// --------------------------------------------------
// Possible-state production promotion
// --------------------------------------------------

test(
  'Possible-state generation succeeds',
  () => {
    assert.equal(
      stateResult.status,
      RAID_POSSIBLE_STATE_STATUS
        .READY
    )
  }
)

test(
  'Production possibleStates contain evolution move-change composites',
  () => {
    assert.ok(
      generatedCompositeStates.length >
      0
    )
  }
)

test(
  'Production possibleStates contain stochastic evolution composites',
  () => {
    assert.ok(
      generatedStochasticCompositeStates.length >
      0
    )
  }
)

test(
  'Generated stochastic composites are real Armaldo destinations',
  () => {
    assert.ok(
      generatedStochasticCompositeStates
        .some(
          (state) =>
            state.pokemonIdentity ===
            'ARMALDO__NORMAL'
        )
    )
  }
)

// --------------------------------------------------
// Opportunity integration
// --------------------------------------------------

test(
  'Opportunity ranking succeeds with production states',
  () => {
    assert.equal(
      opportunityResult.status,
      RAID_INVESTMENT_OPPORTUNITY_STATUS
        .SUCCESS
    )
  }
)

test(
  'Every production possible state becomes an opportunity',
  () => {
    assert.equal(
      opportunityResult
        .opportunityCount,
      stateResult
        .possibleStates
        .length
    )
  }
)

test(
  'Generated stochastic composite reaches Opportunity layer',
  () => {
    assert.ok(
      stochasticCompositeOpportunities.length >
      0
    )
  }
)

test(
  'At least one real stochastic composite survives the complete pipeline',
  () => {
    assert.ok(
      fullyClassifiedStochasticOpportunity
    )
  }
)

// --------------------------------------------------
// Possible State -> Evidence
// --------------------------------------------------

test(
  'Evidence preserves evolution move-change state type',
  () => {
    assert.equal(
      fullyClassifiedStochasticOpportunity
        ?.evidence
        ?.possibleStateType,
      RAID_POSSIBLE_STATE_TYPE
        .EVOLUTION_MOVE_CHANGE
    )
  }
)

test(
  'Evidence preserves source Anorith identity',
  () => {
    assert.equal(
      fullyClassifiedStochasticOpportunity
        ?.evidence
        ?.sourcePokemonIdentity,
      'ANORITH__NORMAL'
    )
  }
)

test(
  'Evidence preserves resulting Armaldo identity',
  () => {
    assert.equal(
      fullyClassifiedStochasticOpportunity
        ?.evidence
        ?.resultingPokemonIdentity,
      'ARMALDO__NORMAL'
    )
  }
)

test(
  'Evidence preserves stochastic destination certainty',
  () => {
    assert.equal(
      fullyClassifiedStochasticOpportunity
        ?.evidence
        ?.destinationCertainty,
      RAID_POSSIBLE_STATE_DESTINATION_CERTAINTY
        .STOCHASTIC
    )
  }
)

test(
  'Evidence preserves ordered composite actions',
  () => {
    assert.equal(
      fullyClassifiedStochasticOpportunity
        ?.evidence
        ?.actions
        ?.length,
      2
    )
  }
)

test(
  'Evidence composite begins with EVOLVE',
  () => {
    assert.equal(
      fullyClassifiedStochasticOpportunity
        ?.evidence
        ?.actions?.[0]
        ?.type,
      'EVOLVE'
    )
  }
)

// --------------------------------------------------
// Evidence -> Assessment
// --------------------------------------------------

test(
  'Assessment succeeds for real stochastic composite',
  () => {
    assert.equal(
      fullyClassifiedStochasticOpportunity
        ?.assessment
        ?.status,
      RAID_INVESTMENT_ASSESSMENT_STATUS
        .SUCCESS
    )
  }
)

test(
  'Assessment preserves stochastic destination certainty',
  () => {
    assert.equal(
      fullyClassifiedStochasticOpportunity
        ?.assessment
        ?.destinationCertainty,
      RAID_INVESTMENT_DESTINATION_CERTAINTY
        .STOCHASTIC
    )
  }
)

test(
  'Assessment reports stochastic destination reason',
  () => {
    assert.ok(
      fullyClassifiedStochasticOpportunity
        ?.assessment
        ?.reasonCodes
        ?.includes(
          'STOCHASTIC_DESTINATION'
        )
    )
  }
)

test(
  'Assessment preserves ordered composite actions',
  () => {
    assert.equal(
      fullyClassifiedStochasticOpportunity
        ?.assessment
        ?.actions
        ?.length,
      2
    )
  }
)

// --------------------------------------------------
// Assessment -> Value
// --------------------------------------------------

test(
  'Value evaluation succeeds for real stochastic composite',
  () => {
    assert.equal(
      fullyClassifiedStochasticOpportunity
        ?.value
        ?.status,
      RAID_INVESTMENT_VALUE_STATUS
        .SUCCESS
    )
  }
)

test(
  'Real stochastic composite receives stochastic value classification',
  () => {
    assert.equal(
      fullyClassifiedStochasticOpportunity
        ?.valueClassification,
      RAID_INVESTMENT_VALUE
        .STOCHASTIC_DESTINATION
    )
  }
)

test(
  'Value preserves stochastic destination certainty',
  () => {
    assert.equal(
      fullyClassifiedStochasticOpportunity
        ?.value
        ?.destinationCertainty,
      RAID_INVESTMENT_DESTINATION_CERTAINTY
        .STOCHASTIC
    )
  }
)

test(
  'Value reports exact destination is not guaranteed',
  () => {
    assert.ok(
      fullyClassifiedStochasticOpportunity
        ?.value
        ?.reasonCodes
        ?.includes(
          'EXACT_DESTINATION_NOT_GUARANTEED'
        )
    )
  }
)

test(
  'Value reports stochastic destination separately',
  () => {
    assert.ok(
      fullyClassifiedStochasticOpportunity
        ?.value
        ?.reasonCodes
        ?.includes(
          'STOCHASTIC_DESTINATION'
        )
    )
  }
)

test(
  'Value preserves ordered composite actions',
  () => {
    assert.equal(
      fullyClassifiedStochasticOpportunity
        ?.value
        ?.actions
        ?.length,
      2
    )
  }
)

// --------------------------------------------------
// Value -> Opportunity
// --------------------------------------------------

test(
  'Real stochastic composite receives stochastic rank group',
  () => {
    assert.equal(
      fullyClassifiedStochasticOpportunity
        ?.rankGroup,
      RAID_INVESTMENT_RANK_GROUP
        .STOCHASTIC_DESTINATION
    )
  }
)

test(
  'Real stochastic composite appears in stochastic opportunity bucket',
  () => {
    assert.ok(
      opportunityResult
        .stochasticDestinationOpportunities
        .some(
          (opportunity) =>
            opportunity.originalIndex ===
            fullyClassifiedStochasticOpportunity
              .originalIndex
        )
    )
  }
)

// --------------------------------------------------
// Actionability safety rail
// --------------------------------------------------

test(
  'Real stochastic composite is excluded from actionable opportunities',
  () => {
    assert.equal(
      opportunityResult
        .actionableOpportunities
        .some(
          (opportunity) =>
            opportunity.originalIndex ===
            fullyClassifiedStochasticOpportunity
              .originalIndex
        ),
      false
    )
  }
)

test(
  'No stochastic destination is present in actionable opportunities',
  () => {
    assert.equal(
      opportunityResult
        .actionableOpportunities
        .some(
          (opportunity) =>
            opportunity
              .destinationCertainty ===
            RAID_INVESTMENT_DESTINATION_CERTAINTY
              .STOCHASTIC
        ),
      false
    )
  }
)

test(
  'Real stochastic composite cannot become top actionable opportunity',
  () => {
    assert.notEqual(
      opportunityResult
        .topActionableOpportunity
        ?.originalIndex,
      fullyClassifiedStochasticOpportunity
        ?.originalIndex
    )
  }
)

test(
  'Top actionable opportunity is never stochastic',
  () => {
    assert.notEqual(
      opportunityResult
        .topActionableOpportunity
        ?.destinationCertainty,
      RAID_INVESTMENT_DESTINATION_CERTAINTY
        .STOCHASTIC
    )
  }
)

// --------------------------------------------------
// Identity and action path survive end-to-end
// --------------------------------------------------

test(
  'Final opportunity still represents Armaldo',
  () => {
    assert.equal(
      fullyClassifiedStochasticOpportunity
        ?.possibleState
        ?.pokemonIdentity,
      'ARMALDO__NORMAL'
    )
  }
)

test(
  'Final opportunity still preserves Anorith source identity',
  () => {
    assert.equal(
      fullyClassifiedStochasticOpportunity
        ?.possibleState
        ?.sourcePokemonIdentity,
      'ANORITH__NORMAL'
    )
  }
)

test(
  'Final opportunity still contains ordered composite actions',
  () => {
    assert.equal(
      fullyClassifiedStochasticOpportunity
        ?.possibleState
        ?.actions
        ?.length,
      2
    )
  }
)

test(
  'Final opportunity composite still begins with EVOLVE',
  () => {
    assert.equal(
      fullyClassifiedStochasticOpportunity
        ?.possibleState
        ?.actions?.[0]
        ?.type,
      'EVOLVE'
    )
  }
)

test(
  'Final opportunity composite ends with a move action',
  () => {
    const moveAction =
      fullyClassifiedStochasticOpportunity
        ?.possibleState
        ?.actions?.[1]
        ?.type

    assert.ok(
      [
        'FAST_TM',
        'CHARGED_TM',
        'ELITE_FAST_TM',
        'ELITE_CHARGED_TM',
        'SPECIAL_ACQUISITION',
      ].includes(
        moveAction
      )
    )
  }
)

// --------------------------------------------------
// Diagnostic output
// --------------------------------------------------

console.log('')
console.log(
  'REAL STOCHASTIC EVOLUTION OPPORTUNITY'
)

if (
  fullyClassifiedStochasticOpportunity
) {
  console.table([
    {
      source:
        fullyClassifiedStochasticOpportunity
          .possibleState
          ?.sourcePokemonIdentity,

      result:
        fullyClassifiedStochasticOpportunity
          .possibleState
          ?.pokemonIdentity,

      stateType:
        fullyClassifiedStochasticOpportunity
          .possibleStateType,

      certainty:
        fullyClassifiedStochasticOpportunity
          .destinationCertainty,

      evidence:
        fullyClassifiedStochasticOpportunity
          .evidence
          ?.status,

      assessment:
        fullyClassifiedStochasticOpportunity
          .assessment
          ?.status,

      value:
        fullyClassifiedStochasticOpportunity
          .valueClassification,

      rankGroup:
        fullyClassifiedStochasticOpportunity
          .rankGroup,

      rank:
        opportunityResult
          .rankedOpportunities
          .find(
            (opportunity) =>
              opportunity.originalIndex ===
              fullyClassifiedStochasticOpportunity
                .originalIndex
          )
          ?.rank,

      actionable:
        opportunityResult
          .actionableOpportunities
          .some(
            (opportunity) =>
              opportunity.originalIndex ===
              fullyClassifiedStochasticOpportunity
                .originalIndex
          ),
    },
  ])
}

// --------------------------------------------------
// Results
// --------------------------------------------------

console.log('')
console.log(
  '================================'
)
console.log(
  'RAID EVOLUTION OPPORTUNITY INTEGRATION VALIDATION'
)
console.log(
  '================================'
)
console.log('')

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