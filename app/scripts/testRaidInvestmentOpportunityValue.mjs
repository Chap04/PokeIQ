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

import {
  RAID_INVESTMENT_VALUE,
  RAID_INVESTMENT_RESOURCE_BURDEN,
} from '../src/utils/raidInvestmentValue.js'

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
    actual === expected
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
      entry.id === id &&
      entry.form === 'NORMAL'
  )
}

function buildRaidDefender(
  pokemon
) {
  return {
    ...pokemon,

    ivs: {
      attack: 15,
      defense: 15,
      stamina: 15,
    },

    raidBoss: {
      cpMultiplier: 0.79,
    },
  }
}

// --------------------------------------------------
// Candidate / state fixtures
// --------------------------------------------------

function buildCandidate({
  reference,
  cpm,
}) {
  return {
    status: 'READY',

    pokemonIdentity:
      'RAYQUAZA__NORMAL',

    reference,

    level: 40,

    cpm,

    ivs: {
      attack: 15,
      defense: 15,
      stamina: 15,
    },

    traits: {
      shadow: false,
      purified: false,
      lucky: false,
      shiny: false,
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
}

function buildState({
  type,
  fastMoveId,
  chargedMoveId,
  actionType,
  current = false,
  reachable = true,
  destroysProtectedMove = false,
  additionalActionType = null,
}) {
  return {
    type,

    current,

    reachable,

    pokemonIdentity:
      'RAYQUAZA__NORMAL',

    moves: {
      fastMoveId,

      chargedMove1Id:
        chargedMoveId,

      chargedMove2Id:
        null,
    },

    loadouts: [
      {
        fastMoveId,

        chargedMoveId,
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

    preservation: {
      replacesExistingMove:
        !current,

      destroysProtectedMove,
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
    'RAID INVESTMENT OPPORTUNITY VALUE VALIDATION'
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

  const candidate =
    buildCandidate({
      reference:
        rayquaza,

      cpm:
        attackerCpm,
    })

  const currentState =
    buildState({
      type:
        'CURRENT',

      fastMoveId:
        'AIR_SLASH_FAST',

      chargedMoveId:
        'ANCIENT_POWER',

      actionType:
        'NONE',

      current:
        true,
    })

  // ------------------------------------------------
  // Same strong target moveset, different resource
  // paths.
  //
  // This isolates the VALUE layer from performance.
  // ------------------------------------------------

  const ordinaryState =
    buildState({
      type:
        'ORDINARY_STATE',

      fastMoveId:
        'DRAGON_TAIL_FAST',

      chargedMoveId:
        'OUTRAGE',

      actionType:
        'FAST_AND_CHARGED_TM',
    })

  const premiumState =
    buildState({
      type:
        'PREMIUM_STATE',

      fastMoveId:
        'DRAGON_TAIL_FAST',

      chargedMoveId:
        'OUTRAGE',

      actionType:
        'ELITE_FAST_AND_CHARGED_TM',
    })

  const incompleteState =
    buildState({
      type:
        'INCOMPLETE_STATE',

      fastMoveId:
        'DRAGON_TAIL_FAST',

      chargedMoveId:
        'OUTRAGE',

      actionType:
        'UNLOCK_SECOND_CHARGED_MOVE',

      additionalActionType:
        'CHARGED_TM',
    })

  const protectedState =
    buildState({
      type:
        'PROTECTED_STATE',

      fastMoveId:
        'DRAGON_TAIL_FAST',

      chargedMoveId:
        'OUTRAGE',

      actionType:
        'FAST_AND_CHARGED_TM',

      destroysProtectedMove:
        true,
    })

  const unavailableState =
    buildState({
      type:
        'UNAVAILABLE_STATE',

      fastMoveId:
        'DRAGON_TAIL_FAST',

      chargedMoveId:
        'OUTRAGE',

      actionType:
        'SPECIAL_ACQUISITION',

      reachable:
        false,
    })

  const matchups = [
    {
      id:
        'RAYQUAZA',

      defender:
        buildRaidDefender(
          rayquaza
        ),
    },

    {
      id:
        'MEWTWO',

      defender:
        buildRaidDefender(
          mewtwo
        ),
    },

    {
      id:
        'GROUDON',

      defender:
        buildRaidDefender(
          groudon
        ),
    },
  ]

  const possibleStates = [
    premiumState,
    incompleteState,
    protectedState,
    unavailableState,
    ordinaryState,
  ]

  const result =
    rankRaidInvestmentOpportunities({
      candidate,

      currentState,

      possibleStates,

      matchups,

      moves,

      combatData:
        combat,
    })

  // ------------------------------------------------
  // Basic result
  // ------------------------------------------------

  expectEqual(
    'Value-aware opportunity ranking succeeds',
    result.status,
    RAID_INVESTMENT_OPPORTUNITY_STATUS
      .SUCCESS
  )

  expectEqual(
    'All possible states become opportunities',
    result.opportunityCount,
    5
  )

  expectEqual(
    'Five ranked opportunities are returned',
    result.rankedOpportunities.length,
    5
  )

  // ------------------------------------------------
  // Find states
  // ------------------------------------------------

  const ordinary =
    result.rankedOpportunities.find(
      (entry) =>
        entry.possibleStateType ===
        'ORDINARY_STATE'
    )

  const premium =
    result.rankedOpportunities.find(
      (entry) =>
        entry.possibleStateType ===
        'PREMIUM_STATE'
    )

  const incomplete =
    result.rankedOpportunities.find(
      (entry) =>
        entry.possibleStateType ===
        'INCOMPLETE_STATE'
    )

  const protectedOpportunity =
    result.rankedOpportunities.find(
      (entry) =>
        entry.possibleStateType ===
        'PROTECTED_STATE'
    )

  const unavailable =
    result.rankedOpportunities.find(
      (entry) =>
        entry.possibleStateType ===
        'UNAVAILABLE_STATE'
    )

  expectTrue(
    'Ordinary opportunity exists',
    Boolean(
      ordinary
    )
  )

  expectTrue(
    'Premium opportunity exists',
    Boolean(
      premium
    )
  )

  expectTrue(
    'Incomplete opportunity exists',
    Boolean(
      incomplete
    )
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
      unavailable
    )
  )

  // ------------------------------------------------
  // Value classifications
  // ------------------------------------------------

  expectEqual(
    'Ordinary strong improvement is high value',
    ordinary
      ?.valueClassification,
    RAID_INVESTMENT_VALUE
      .HIGH_VALUE
  )

  expectEqual(
    'Premium strong improvement is premium resource',
    premium
      ?.valueClassification,
    RAID_INVESTMENT_VALUE
      .PREMIUM_RESOURCE
  )

  expectEqual(
    'Incomplete strong improvement is cost incomplete',
    incomplete
      ?.valueClassification,
    RAID_INVESTMENT_VALUE
      .COST_INCOMPLETE
  )

  expectEqual(
    'Protected state remains preservation risk',
    protectedOpportunity
      ?.valueClassification,
    RAID_INVESTMENT_VALUE
      .PRESERVATION_RISK
  )

  expectEqual(
    'Unavailable state remains unavailable',
    unavailable
      ?.valueClassification,
    RAID_INVESTMENT_VALUE
      .UNAVAILABLE
  )

  // ------------------------------------------------
  // Resource burden
  // ------------------------------------------------

  expectEqual(
    'Ordinary state has ordinary burden',
    ordinary
      ?.resourceBurden,
    RAID_INVESTMENT_RESOURCE_BURDEN
      .ORDINARY
  )

  expectEqual(
    'Premium state has premium burden',
    premium
      ?.resourceBurden,
    RAID_INVESTMENT_RESOURCE_BURDEN
      .PREMIUM
  )

  expectEqual(
    'Incomplete state has incomplete burden',
    incomplete
      ?.resourceBurden,
    RAID_INVESTMENT_RESOURCE_BURDEN
      .INCOMPLETE
  )

  // ------------------------------------------------
  // Actionability survives
  // ------------------------------------------------

  expectEqual(
    'Ordinary state stays actionable promising',
    ordinary
      ?.rankGroup,
    RAID_INVESTMENT_RANK_GROUP
      .ACTIONABLE_PROMISING
  )

  expectEqual(
    'Premium state stays actionable promising',
    premium
      ?.rankGroup,
    RAID_INVESTMENT_RANK_GROUP
      .ACTIONABLE_PROMISING
  )

  expectEqual(
    'Incomplete state stays actionable promising',
    incomplete
      ?.rankGroup,
    RAID_INVESTMENT_RANK_GROUP
      .ACTIONABLE_PROMISING
  )

  expectEqual(
    'Protected state stays outside actionable group',
    protectedOpportunity
      ?.rankGroup,
    RAID_INVESTMENT_RANK_GROUP
      .PRESERVATION_RISK
  )

  expectEqual(
    'Unavailable state stays outside actionable group',
    unavailable
      ?.rankGroup,
    RAID_INVESTMENT_RANK_GROUP
      .UNAVAILABLE
  )

  // ------------------------------------------------
  // VALUE ordering
  //
  // All three actionable states have the exact same
  // target moveset and therefore the same theoretical
  // performance.
  //
  // Resource burden should decide the ordering.
  // ------------------------------------------------

  expectTrue(
    'High-value ordinary state outranks premium state',
    ordinary.rank <
      premium.rank
  )

  expectTrue(
    'Premium state outranks cost-incomplete state',
    premium.rank <
      incomplete.rank
  )

  expectTrue(
    'Cost-incomplete actionable state outranks protected state',
    incomplete.rank <
      protectedOpportunity.rank
  )

  expectTrue(
    'Protected state outranks unavailable state',
    protectedOpportunity.rank <
      unavailable.rank
  )

  // ------------------------------------------------
  // Actionable ranking
  // ------------------------------------------------

  expectEqual(
    'Three opportunities remain actionable',
    result
      .actionableOpportunities
      .length,
    3
  )

  expectEqual(
    'Top actionable opportunity is ordinary state',
    result
      ?.topActionableOpportunity
      ?.possibleStateType,
    'ORDINARY_STATE'
  )

  expectEqual(
    'Top actionable opportunity is high value',
    result
      ?.topActionableOpportunity
      ?.valueClassification,
    RAID_INVESTMENT_VALUE
      .HIGH_VALUE
  )

  expectEqual(
    'Top high-value opportunity is ordinary state',
    result
      ?.topHighValueOpportunity
      ?.possibleStateType,
    'ORDINARY_STATE'
  )

  // ------------------------------------------------
  // Value-specific collections
  // ------------------------------------------------

  expectEqual(
    'Exactly one high-value opportunity exists',
    result
      .highValueOpportunities
      .length,
    1
  )

  expectEqual(
    'Exactly one premium-resource opportunity exists',
    result
      .premiumResourceOpportunities
      .length,
    1
  )

  expectEqual(
    'Exactly one cost-incomplete opportunity exists',
    result
      .costIncompleteOpportunities
      .length,
    1
  )

  // ------------------------------------------------
  // Evidence remains attached
  // ------------------------------------------------

  expectTrue(
    'Ordinary opportunity retains assessment',
    Boolean(
      ordinary
        ?.assessment
    )
  )

  expectTrue(
    'Ordinary opportunity retains cost evidence',
    Boolean(
      ordinary
        ?.cost
    )
  )

  expectTrue(
    'Ordinary opportunity retains full value evidence',
    Boolean(
      ordinary
        ?.value
    )
  )

  expectTrue(
    'Premium opportunity records Elite TM reason',
    premium
      ?.value
      ?.reasonCodes
      ?.includes(
        'ELITE_TM_REQUIRED'
      ) === true
  )

  expectTrue(
    'Incomplete opportunity records incomplete-cost reason',
    incomplete
      ?.value
      ?.reasonCodes
      ?.includes(
        'RESOURCE_COST_INCOMPLETE'
      ) === true
  )

  // ------------------------------------------------
  // Original order remains untouched
  // ------------------------------------------------

  expectEqual(
    'Original first state remains premium',
    possibleStates[0]
      .type,
    'PREMIUM_STATE'
  )

  expectEqual(
    'Original last state remains ordinary',
    possibleStates[4]
      .type,
    'ORDINARY_STATE'
  )

  expectEqual(
    'Unranked opportunity collection preserves original order',
    result
      .opportunities[0]
      .possibleStateType,
    'PREMIUM_STATE'
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
    failed === 0
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
      'Raid investment opportunity value test failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)