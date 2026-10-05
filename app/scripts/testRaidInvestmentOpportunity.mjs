import fs from 'node:fs/promises'
import path from 'node:path'

import {
  fileURLToPath,
} from 'node:url'

import {
  rankRaidInvestmentOpportunities,
  RAID_INVESTMENT_OPPORTUNITY_STATUS,
  RAID_INVESTMENT_RANK_GROUP,
} from '../src/utils/raidInvestmentOpportunity.js'

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
    value ===
    true
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

// --------------------------------------------------
// Reference data
// --------------------------------------------------

const __filename =
  fileURLToPath(
    import.meta.url
  )

const __dirname =
  path.dirname(
    __filename
  )

const REFERENCE_DIR =
  path.resolve(
    __dirname,
    '../src/data/reference'
  )

async function readJson(
  filename
) {
  const contents =
    await fs.readFile(
      path.join(
        REFERENCE_DIR,
        filename
      ),
      'utf8'
    )

  return JSON.parse(
    contents
  )
}

function findPokemon(
  pokemon,
  id
) {
  return pokemon.find(
    (entry) =>
      entry.id ===
        id &&
      entry.form ===
        'NORMAL'
  )
}

function buildRaidDefender(
  pokemon
) {
  return {
    ...pokemon,

    ivs: {
      attack:
        15,

      defense:
        15,

      stamina:
        15,
    },

    raidBoss: {
      cpMultiplier:
        0.79,
    },
  }
}

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'RAID INVESTMENT OPPORTUNITY VALIDATION'
  )
  console.log(
    '================================'
  )
  console.log('')

  const [
    pokemon,
    moves,
    combat,
  ] = await Promise.all([
    readJson(
      'pokemon.json'
    ),

    readJson(
      'moves-pve.json'
    ),

    readJson(
      'combat.json'
    ),
  ])

  const rayquaza =
    findPokemon(
      pokemon,
      'RAYQUAZA'
    )

  const mewtwo =
    findPokemon(
      pokemon,
      'MEWTWO'
    )

  const groudon =
    findPokemon(
      pokemon,
      'GROUDON'
    )

  if (
    !rayquaza ||
    !mewtwo ||
    !groudon
  ) {
    throw new Error(
      'Required reference Pokémon not found.'
    )
  }

  const attackerCpm =
    combat
      .cpMultipliers
      .allLevels['40']

  // ------------------------------------------------
  // Candidate
  // ------------------------------------------------

  const candidate = {
    status:
      'READY',

    pokemonIdentity:
      'RAYQUAZA__NORMAL',

    reference:
      rayquaza,

    level:
      40,

    cpm:
      attackerCpm,

    ivs: {
      attack:
        15,

      defense:
        15,

      stamina:
        15,
    },

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
        'AIR_SLASH_FAST',

      charged: [
        'ANCIENT_POWER',
      ],

      chargedSlots: {
        slot1:
          'ANCIENT_POWER',

        slot2:
          null,
      },
    },

    loadouts: [
      {
        fastMoveId:
          'AIR_SLASH_FAST',

        chargedMoveId:
          'ANCIENT_POWER',
      },
    ],
  }

  // ------------------------------------------------
  // Current state
  // ------------------------------------------------

  const currentState = {
    type:
      'CURRENT',

    current:
      true,

    reachable:
      true,

    destinationCertainty:
      'GUARANTEED',

    pokemonIdentity:
      'RAYQUAZA__NORMAL',

    moves: {
      fastMoveId:
        'AIR_SLASH_FAST',

      chargedMove1Id:
        'ANCIENT_POWER',

      chargedMove2Id:
        null,
    },

    loadouts: [
      {
        fastMoveId:
          'AIR_SLASH_FAST',

        chargedMoveId:
          'ANCIENT_POWER',
      },
    ],

    action: {
      type:
        'NONE',
    },

    preservation: {
      destroysProtectedMove:
        false,
    },
  }

  // ------------------------------------------------
  // Possible state:
  // reachable strong improvement
  // ------------------------------------------------

  const promisingState = {
    type:
      'PROMISING_STATE',

    current:
      false,

    reachable:
      true,

    destinationCertainty:
      'GUARANTEED',

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
        'FAST_AND_CHARGED_TM',
    },

    preservation: {
      replacesExistingMove:
        true,

      destroysProtectedMove:
        false,
    },
  }

  // ------------------------------------------------
  // Same performance, but destroys protected move
  // ------------------------------------------------

  const protectedState = {
    ...promisingState,

    type:
      'PROTECTED_STATE',

    preservation: {
      replacesExistingMove:
        true,

      destroysProtectedMove:
        true,
    },
  }

  // ------------------------------------------------
  // Same performance, but unavailable
  // ------------------------------------------------

  const unavailableState = {
    ...promisingState,

    type:
      'UNAVAILABLE_STATE',

    reachable:
      false,

    destinationCertainty:
      'UNAVAILABLE',

    action: {
      type:
        'SPECIAL_ACQUISITION',
    },
  }

  // ------------------------------------------------
  // Strong theoretical improvement, but exact
  // destination is stochastic.
  // ------------------------------------------------

  const stochasticState = {
    ...promisingState,

    type:
      'STOCHASTIC_STATE',

    destinationCertainty:
      'STOCHASTIC',
  }

  // ------------------------------------------------
  // Low-value state:
  // effectively the same performance as current,
  // but represented as a separate possible state.
  // ------------------------------------------------

  const lowValueState = {
    type:
      'LOW_VALUE_STATE',

    current:
      false,

    reachable:
      true,

    destinationCertainty:
      'GUARANTEED',

    pokemonIdentity:
      'RAYQUAZA__NORMAL',

    moves: {
      fastMoveId:
        'AIR_SLASH_FAST',

      chargedMove1Id:
        'ANCIENT_POWER',

      chargedMove2Id:
        null,
    },

    loadouts: [
      {
        fastMoveId:
          'AIR_SLASH_FAST',

        chargedMoveId:
          'ANCIENT_POWER',
      },
    ],

    action: {
      type:
        'NO_EFFECT_TEST',
    },

    preservation: {
      destroysProtectedMove:
        false,
    },
  }

  // ------------------------------------------------
  // Broken state
  // ------------------------------------------------

  const brokenState = {
    type:
      'BROKEN_STATE',

    current:
      false,

    reachable:
      true,

    destinationCertainty:
      'GUARANTEED',

    pokemonIdentity:
      'RAYQUAZA__NORMAL',

    moves: {
      fastMoveId:
        'DRAGON_TAIL_FAST',

      chargedMove1Id:
        'MISSING_MOVE',

      chargedMove2Id:
        null,
    },

    loadouts: [
      {
        fastMoveId:
          'DRAGON_TAIL_FAST',

        chargedMoveId:
          'MISSING_MOVE',
      },
    ],

    action: {
      type:
        'BROKEN_TEST',
    },

    preservation: {
      destroysProtectedMove:
        false,
    },
  }

  // ------------------------------------------------
  // Matchups
  // ------------------------------------------------

  const matchups = [
    {
      id:
        'RAYQUAZA',

      label:
        'Rayquaza',

      defender:
        buildRaidDefender(
          rayquaza
        ),
    },

    {
      id:
        'MEWTWO',

      label:
        'Mewtwo',

      defender:
        buildRaidDefender(
          mewtwo
        ),
    },

    {
      id:
        'GROUDON',

      label:
        'Groudon',

      defender:
        buildRaidDefender(
          groudon
        ),
    },
  ]

  // ------------------------------------------------
  // Main ranking
  // ------------------------------------------------

  const result =
    rankRaidInvestmentOpportunities({
      candidate,

      currentState,

      possibleStates: [
        protectedState,
        unavailableState,
        lowValueState,
        stochasticState,
        promisingState,
        brokenState,
      ],

      matchups,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Opportunity ranking succeeds',
    result.status,
    RAID_INVESTMENT_OPPORTUNITY_STATUS
      .SUCCESS
  )

  expectEqual(
    'Every possible state becomes an opportunity',
    result.opportunityCount,
    6
  )

  expectEqual(
    'Original opportunity collection is preserved',
    result.opportunities.length,
    6
  )

  expectEqual(
    'Ranked opportunity collection contains every state',
    result.rankedOpportunities.length,
    6
  )

  // ------------------------------------------------
  // Find opportunities
  // ------------------------------------------------

  const promisingOpportunity =
    result.rankedOpportunities.find(
      (entry) =>
        entry.possibleStateType ===
        'PROMISING_STATE'
    )

  const stochasticOpportunity =
    result.rankedOpportunities.find(
      (entry) =>
        entry.possibleStateType ===
        'STOCHASTIC_STATE'
    )

  const protectedOpportunity =
    result.rankedOpportunities.find(
      (entry) =>
        entry.possibleStateType ===
        'PROTECTED_STATE'
    )

  const unavailableOpportunity =
    result.rankedOpportunities.find(
      (entry) =>
        entry.possibleStateType ===
        'UNAVAILABLE_STATE'
    )

  const lowValueOpportunity =
    result.rankedOpportunities.find(
      (entry) =>
        entry.possibleStateType ===
        'LOW_VALUE_STATE'
    )

  const brokenOpportunity =
    result.rankedOpportunities.find(
      (entry) =>
        entry.possibleStateType ===
        'BROKEN_STATE'
    )

  expectTrue(
    'Promising opportunity exists',
    Boolean(
      promisingOpportunity
    )
  )

  expectTrue(
    'Stochastic destination opportunity exists',
    Boolean(
      stochasticOpportunity
    )
  )

  expectEqual(
    'Stochastic destination gets dedicated rank group',
    stochasticOpportunity
      ?.rankGroup,
    RAID_INVESTMENT_RANK_GROUP
      .STOCHASTIC_DESTINATION
  )

  expectEqual(
    'Stochastic destination keeps explicit value classification',
    stochasticOpportunity
      ?.valueClassification,
    'STOCHASTIC_DESTINATION'
  )

  expectTrue(
    'Protected opportunity exists',
    Boolean(
      protectedOpportunity
    )
  )

  expectTrue(
    'Unavailable opportunity exists',
    Boolean(
      unavailableOpportunity
    )
  )

  expectTrue(
    'Low-value opportunity exists',
    Boolean(
      lowValueOpportunity
    )
  )

  expectTrue(
    'Broken opportunity exists',
    Boolean(
      brokenOpportunity
    )
  )

  expectEqual(
    'Reachable promising state gets actionable promising group',
    promisingOpportunity
      .rankGroup,
    RAID_INVESTMENT_RANK_GROUP
      .ACTIONABLE_PROMISING
  )

  expectEqual(
    'Protected state gets preservation-risk group',
    protectedOpportunity
      .rankGroup,
    RAID_INVESTMENT_RANK_GROUP
      .PRESERVATION_RISK
  )

  expectEqual(
    'Unavailable state gets unavailable group',
    unavailableOpportunity
      .rankGroup,
    RAID_INVESTMENT_RANK_GROUP
      .UNAVAILABLE
  )

  expectEqual(
    'Unchanged state gets low-value group',
    lowValueOpportunity
      .rankGroup,
    RAID_INVESTMENT_RANK_GROUP
      .LOW_VALUE
  )

  expectEqual(
    'Broken state is unresolved',
    brokenOpportunity
      .rankGroup,
    RAID_INVESTMENT_RANK_GROUP
      .UNRESOLVED
  )

  // ------------------------------------------------
  // Exact precedence
  // ------------------------------------------------

  expectTrue(
    'Promising guaranteed state outranks stronger stochastic destination',
    promisingOpportunity.rank <
      stochasticOpportunity.rank
  )

  expectTrue(
    'Stochastic destination outranks preservation risk',
    stochasticOpportunity.rank <
      protectedOpportunity.rank
  )

  expectTrue(
    'Promising state outranks protected state',
    promisingOpportunity.rank <
      protectedOpportunity.rank
  )

  expectTrue(
    'Protected state outranks unavailable state',
    protectedOpportunity.rank <
      unavailableOpportunity.rank
  )

  expectTrue(
    'Unavailable state outranks low-value state',
    unavailableOpportunity.rank <
      lowValueOpportunity.rank
  )

  expectTrue(
    'Low-value state outranks unresolved state',
    lowValueOpportunity.rank <
      brokenOpportunity.rank
  )

  // ------------------------------------------------
  // Top opportunity
  // ------------------------------------------------

  expectEqual(
    'Top opportunity is promising state',
    result
      ?.topOpportunity
      ?.possibleStateType,
    'PROMISING_STATE'
  )

  expectEqual(
    'Top opportunity has rank one',
    result
      ?.topOpportunity
      ?.rank,
    1
  )

  expectEqual(
    'Top actionable opportunity is promising state',
    result
      ?.topActionableOpportunity
      ?.possibleStateType,
    'PROMISING_STATE'
  )

  // ------------------------------------------------
  // Collections
  // ------------------------------------------------

  expectEqual(
    'One promising opportunity is reported',
    result
      .promisingOpportunities
      .length,
    1
  )

  expectEqual(
    'One stochastic destination opportunity is reported',
    result
      .stochasticDestinationOpportunities
      .length,
    1
  )

  expectEqual(
    'Stochastic destination is excluded from actionable opportunities',
    result
      .actionableOpportunities
      .some(
        (entry) =>
          entry.possibleStateType ===
          'STOCHASTIC_STATE'
      ),
    false
  )

  expectEqual(
    'Stochastic destination cannot become top actionable opportunity',
    result
      ?.topActionableOpportunity
      ?.possibleStateType,
    'PROMISING_STATE'
  )

  expectEqual(
    'One preservation-risk opportunity is reported',
    result
      .preservationRiskOpportunities
      .length,
    1
  )

  expectEqual(
    'One unavailable opportunity is reported',
    result
      .unavailableOpportunities
      .length,
    1
  )

  expectEqual(
    'Promising state is actionable',
    result
      .actionableOpportunities[0]
      .possibleStateType,
    'PROMISING_STATE'
  )

  // ------------------------------------------------
  // Underlying evidence remains available
  // ------------------------------------------------

  expectEqual(
    'Opportunity preserves successful assessment',
    promisingOpportunity
      ?.assessment
      ?.status,
    'SUCCESS'
  )

  expectEqual(
    'Opportunity preserves successful evidence',
    promisingOpportunity
      ?.evidence
      ?.status,
    'SUCCESS'
  )

  expectTrue(
    'Promising opportunity contains median gain',
    Number.isFinite(
      promisingOpportunity
        ?.assessment
        ?.performanceEvidence
        ?.medianPercentGain
    )
  )

  expectTrue(
    'Promising opportunity contains improvement rate',
    Number.isFinite(
      promisingOpportunity
        ?.assessment
        ?.performanceEvidence
        ?.improvementRate
    )
  )

  // ------------------------------------------------
  // Original input order is not mutated
  // ------------------------------------------------

  expectEqual(
    'Original first state remains protected state',
    result
      .opportunities[0]
      .possibleStateType,
    'PROTECTED_STATE'
  )

  expectEqual(
    'Original promising state remains fifth',
    result
      .opportunities[4]
      .possibleStateType,
    'PROMISING_STATE'
  )

  // ------------------------------------------------
  // Empty states are valid
  // ------------------------------------------------

  const emptyResult =
    rankRaidInvestmentOpportunities({
      candidate,

      currentState,

      possibleStates: [],

      matchups,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Empty possible-state collection is valid',
    emptyResult.status,
    RAID_INVESTMENT_OPPORTUNITY_STATUS
      .SUCCESS
  )

  expectEqual(
    'Empty collection produces zero opportunities',
    emptyResult.opportunityCount,
    0
  )

  expectEqual(
    'Empty collection has no top opportunity',
    emptyResult.topOpportunity,
    null
  )

  expectEqual(
    'Empty collection has no top actionable opportunity',
    emptyResult.topActionableOpportunity,
    null
  )

  // ------------------------------------------------
  // Invalid state collection
  // ------------------------------------------------

  const invalidResult =
    rankRaidInvestmentOpportunities({
      candidate,

      currentState,

      possibleStates:
        null,

      matchups,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Non-array possible states are rejected',
    invalidResult.status,
    RAID_INVESTMENT_OPPORTUNITY_STATUS
      .INVALID_POSSIBLE_STATES
  )

  expectEqual(
    'Invalid state collection produces no rankings',
    invalidResult
      .rankedOpportunities
      .length,
    0
  )

  // ------------------------------------------------
  // Candidate remains untouched
  // ------------------------------------------------

  expectEqual(
    'Candidate Fast Move is not mutated',
    candidate
      .moves
      .fast,
    'AIR_SLASH_FAST'
  )

  expectEqual(
    'Candidate Charged Move is not mutated',
    candidate
      .moves
      .charged[0],
    'ANCIENT_POWER'
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

main().catch(
  (error) => {
    console.error('')
    console.error(
      'Raid investment opportunity test failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)