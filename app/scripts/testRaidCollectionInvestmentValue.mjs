import fs from 'node:fs/promises'
import path from 'node:path'

import {
  fileURLToPath,
} from 'node:url'

import {
  rankRaidCollectionInvestments,
  RAID_COLLECTION_INVESTMENT_STATUS,
} from '../src/utils/raidCollectionInvestment.js'

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
// Candidate fixtures
// --------------------------------------------------

function buildCandidate({
  reference,
  cpm,
  collectionId,
}) {
  return {
    status:
      'READY',

    pokemonIdentity:
      'RAYQUAZA__NORMAL',

    collectionId,

    reference,

    level:
      40,

    cpm,

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
}

function buildCurrentState() {
  return {
    type:
      'CURRENT',

    current:
      true,

    reachable:
      true,

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
      replacesExistingMove:
        false,

      destroysProtectedMove:
        false,
    },
  }
}

function buildPossibleState({
  type,
  actionType,
  reachable = true,
  destroysProtectedMove = false,
  additionalActionType = null,
}) {
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

    preservation: {
      replacesExistingMove:
        true,

      destroysProtectedMove,
    },
  }
}

function buildEntry({
  collectionId,
  candidate,
  possibleState,
}) {
  return {
    collectionId,

    candidate,

    currentState:
      buildCurrentState(),

    possibleStates: [
      possibleState,
    ],
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
    'RAID COLLECTION INVESTMENT VALUE VALIDATION'
  )
  console.log(
    '================================'
  )
  console.log('')

  const [
    pokemon,
    moves,
    combat,
  ] =
    await Promise.all([
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
  // Same Pokémon.
  // Same current moves.
  // Same target moves.
  // Same matchup performance.
  //
  // ONLY the resource path differs.
  //
  // This isolates collection-level VALUE ranking.
  // ------------------------------------------------

  const ordinaryCandidate =
    buildCandidate({
      reference:
        rayquaza,

      cpm:
        attackerCpm,

      collectionId:
        'ordinary-rayquaza',
    })

  const premiumCandidate =
    buildCandidate({
      reference:
        rayquaza,

      cpm:
        attackerCpm,

      collectionId:
        'premium-rayquaza',
    })

  const incompleteCandidate =
    buildCandidate({
      reference:
        rayquaza,

      cpm:
        attackerCpm,

      collectionId:
        'incomplete-rayquaza',
    })

  const protectedCandidate =
    buildCandidate({
      reference:
        rayquaza,

      cpm:
        attackerCpm,

      collectionId:
        'protected-rayquaza',
    })

  const unavailableCandidate =
    buildCandidate({
      reference:
        rayquaza,

      cpm:
        attackerCpm,

      collectionId:
        'unavailable-rayquaza',
    })

  const ordinaryEntry =
    buildEntry({
      collectionId:
        'ordinary-rayquaza',

      candidate:
        ordinaryCandidate,

      possibleState:
        buildPossibleState({
          type:
            'ORDINARY_STATE',

          actionType:
            'FAST_AND_CHARGED_TM',
        }),
    })

  const premiumEntry =
    buildEntry({
      collectionId:
        'premium-rayquaza',

      candidate:
        premiumCandidate,

      possibleState:
        buildPossibleState({
          type:
            'PREMIUM_STATE',

          actionType:
            'ELITE_FAST_AND_CHARGED_TM',
        }),
    })

  const incompleteEntry =
    buildEntry({
      collectionId:
        'incomplete-rayquaza',

      candidate:
        incompleteCandidate,

      possibleState:
        buildPossibleState({
          type:
            'INCOMPLETE_STATE',

          actionType:
            'UNLOCK_SECOND_CHARGED_MOVE',

          additionalActionType:
            'CHARGED_TM',
        }),
    })

  const protectedEntry =
    buildEntry({
      collectionId:
        'protected-rayquaza',

      candidate:
        protectedCandidate,

      possibleState:
        buildPossibleState({
          type:
            'PROTECTED_STATE',

          actionType:
            'FAST_AND_CHARGED_TM',

          destroysProtectedMove:
            true,
        }),
    })

  const unavailableEntry =
    buildEntry({
      collectionId:
        'unavailable-rayquaza',

      candidate:
        unavailableCandidate,

      possibleState:
        buildPossibleState({
          type:
            'UNAVAILABLE_STATE',

          actionType:
            'SPECIAL_ACQUISITION',

          reachable:
            false,
        }),
    })

  // ------------------------------------------------
  // Deliberately place the premium/incomplete options
  // before ordinary in source order.
  //
  // If value-aware sorting works, ordinary should
  // move ahead of both.
  // ------------------------------------------------

  const entries = [
    premiumEntry,
    incompleteEntry,
    protectedEntry,
    unavailableEntry,
    ordinaryEntry,
  ]

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

  const result =
    rankRaidCollectionInvestments({
      entries,

      matchups,

      moves,

      combatData:
        combat,
    })

  // ------------------------------------------------
  // Basic result
  // ------------------------------------------------

  expectEqual(
    'Collection value ranking succeeds',
    result.status,
    RAID_COLLECTION_INVESTMENT_STATUS
      .SUCCESS
  )

  expectEqual(
    'All five collection entries are preserved',
    result.entryCount,
    5
  )

  expectEqual(
    'Five ranked entries are returned',
    result.rankedEntries.length,
    5
  )

  // ------------------------------------------------
  // Locate entries
  // ------------------------------------------------

  const ordinary =
    result.rankedEntries.find(
      (entry) =>
        entry.collectionId ===
        'ordinary-rayquaza'
    )

  const premium =
    result.rankedEntries.find(
      (entry) =>
        entry.collectionId ===
        'premium-rayquaza'
    )

  const incomplete =
    result.rankedEntries.find(
      (entry) =>
        entry.collectionId ===
        'incomplete-rayquaza'
    )

  const protectedEntryResult =
    result.rankedEntries.find(
      (entry) =>
        entry.collectionId ===
        'protected-rayquaza'
    )

  const unavailable =
    result.rankedEntries.find(
      (entry) =>
        entry.collectionId ===
        'unavailable-rayquaza'
    )

  expectTrue(
    'Ordinary collection entry exists',
    Boolean(
      ordinary
    )
  )

  expectTrue(
    'Premium collection entry exists',
    Boolean(
      premium
    )
  )

  expectTrue(
    'Incomplete collection entry exists',
    Boolean(
      incomplete
    )
  )

  expectTrue(
    'Protected collection entry exists',
    Boolean(
      protectedEntryResult
    )
  )

  expectTrue(
    'Unavailable collection entry exists',
    Boolean(
      unavailable
    )
  )

  // ------------------------------------------------
  // Value evidence survives into collection layer
  // ------------------------------------------------

  expectEqual(
    'Ordinary entry is high value',
    ordinary
      ?.topOpportunity
      ?.valueClassification,
    RAID_INVESTMENT_VALUE
      .HIGH_VALUE
  )

  expectEqual(
    'Premium entry is premium-resource value',
    premium
      ?.topOpportunity
      ?.valueClassification,
    RAID_INVESTMENT_VALUE
      .PREMIUM_RESOURCE
  )

  expectEqual(
    'Incomplete entry is cost incomplete',
    incomplete
      ?.topOpportunity
      ?.valueClassification,
    RAID_INVESTMENT_VALUE
      .COST_INCOMPLETE
  )

  expectEqual(
    'Protected entry remains preservation risk',
    protectedEntryResult
      ?.topOpportunity
      ?.valueClassification,
    RAID_INVESTMENT_VALUE
      .PRESERVATION_RISK
  )

  expectEqual(
    'Unavailable entry remains unavailable',
    unavailable
      ?.topOpportunity
      ?.valueClassification,
    RAID_INVESTMENT_VALUE
      .UNAVAILABLE
  )

  // ------------------------------------------------
  // Resource burden survives
  // ------------------------------------------------

  expectEqual(
    'Ordinary collection entry has ordinary burden',
    ordinary
      ?.topOpportunity
      ?.resourceBurden,
    RAID_INVESTMENT_RESOURCE_BURDEN
      .ORDINARY
  )

  expectEqual(
    'Premium collection entry has premium burden',
    premium
      ?.topOpportunity
      ?.resourceBurden,
    RAID_INVESTMENT_RESOURCE_BURDEN
      .PREMIUM
  )

  expectEqual(
    'Incomplete collection entry has incomplete burden',
    incomplete
      ?.topOpportunity
      ?.resourceBurden,
    RAID_INVESTMENT_RESOURCE_BURDEN
      .INCOMPLETE
  )

  // ------------------------------------------------
  // Overall value-aware ordering
  // ------------------------------------------------

  expectTrue(
    'Ordinary high-value investment outranks premium investment',
    ordinary.rank <
      premium.rank
  )

  expectTrue(
    'Premium investment outranks cost-incomplete investment',
    premium.rank <
      incomplete.rank
  )

  expectTrue(
    'Cost-incomplete actionable investment outranks preservation risk',
    incomplete.rank <
      protectedEntryResult.rank
  )

  expectTrue(
    'Preservation-risk entry outranks unavailable entry',
    protectedEntryResult.rank <
      unavailable.rank
  )

  // ------------------------------------------------
  // Top overall
  // ------------------------------------------------

  expectEqual(
    'Top collection entry is ordinary investment',
    result
      ?.topEntry
      ?.collectionId,
    'ordinary-rayquaza'
  )

  expectEqual(
    'Top collection entry is high value',
    result
      ?.topEntry
      ?.topOpportunity
      ?.valueClassification,
    RAID_INVESTMENT_VALUE
      .HIGH_VALUE
  )

  // ------------------------------------------------
  // Actionable collection ranking
  // ------------------------------------------------

  expectEqual(
    'Three entries have actionable investments',
    result
      .actionableEntryCount,
    3
  )

  expectEqual(
    'Three actionable entries are returned',
    result
      .actionableEntries
      .length,
    3
  )

  expectEqual(
    'Top actionable collection investment is ordinary',
    result
      ?.topActionableEntry
      ?.collectionId,
    'ordinary-rayquaza'
  )

  expectEqual(
    'Top actionable investment is high value',
    result
      ?.topActionableEntry
      ?.topOpportunity
      ?.valueClassification,
    RAID_INVESTMENT_VALUE
      .HIGH_VALUE
  )

  expectEqual(
    'Premium investment is second actionable entry',
    result
      ?.actionableEntries[1]
      ?.collectionId,
    'premium-rayquaza'
  )

  expectEqual(
    'Incomplete investment is third actionable entry',
    result
      ?.actionableEntries[2]
      ?.collectionId,
    'incomplete-rayquaza'
  )

  // ------------------------------------------------
  // High-value collection
  // ------------------------------------------------

  expectEqual(
    'Exactly one Pokémon has a high-value opportunity',
    result
      .highValueEntryCount,
    1
  )

  expectEqual(
    'Exactly one high-value entry is returned',
    result
      .highValueEntries
      .length,
    1
  )

  expectEqual(
    'High-value collection entry is ordinary Rayquaza',
    result
      ?.highValueEntries[0]
      ?.collectionId,
    'ordinary-rayquaza'
  )

  expectEqual(
    'Top high-value entry is ordinary Rayquaza',
    result
      ?.topHighValueEntry
      ?.collectionId,
    'ordinary-rayquaza'
  )

  expectEqual(
    'Top high-value entry has high-value rank one',
    result
      ?.topHighValueEntry
      ?.highValueRank,
    1
  )

  // ------------------------------------------------
  // Cost evidence remains available
  // ------------------------------------------------

  expectTrue(
    'Top investment retains cost evidence',
    Boolean(
      result
        ?.topActionableEntry
        ?.topOpportunity
        ?.cost
    )
  )

  expectTrue(
    'Top investment retains value evidence',
    Boolean(
      result
        ?.topActionableEntry
        ?.topOpportunity
        ?.value
    )
  )

  expectTrue(
    'Premium investment preserves Elite TM reason',
    premium
      ?.topOpportunity
      ?.value
      ?.reasonCodes
      ?.includes(
        'ELITE_TM_REQUIRED'
      ) === true
  )

  expectTrue(
    'Incomplete investment preserves incomplete-cost reason',
    incomplete
      ?.topOpportunity
      ?.value
      ?.reasonCodes
      ?.includes(
        'RESOURCE_COST_INCOMPLETE'
      ) === true
  )

  // ------------------------------------------------
  // Source collection order is unchanged
  // ------------------------------------------------

  expectEqual(
    'Original first entry remains premium',
    entries[0]
      .collectionId,
    'premium-rayquaza'
  )

  expectEqual(
    'Original last entry remains ordinary',
    entries[4]
      .collectionId,
    'ordinary-rayquaza'
  )

  expectEqual(
    'Unranked entry list preserves original first entry',
    result
      .entries[0]
      .collectionId,
    'premium-rayquaza'
  )

  expectEqual(
    'Unranked entry list preserves original last entry',
    result
      .entries[4]
      .collectionId,
    'ordinary-rayquaza'
  )

  // ------------------------------------------------
  // Candidate inputs remain unchanged
  // ------------------------------------------------

  expectEqual(
    'Ordinary candidate Fast Move is not mutated',
    ordinaryCandidate
      .moves
      .fast,
    'AIR_SLASH_FAST'
  )

  expectEqual(
    'Premium candidate Charged Move is not mutated',
    premiumCandidate
      .moves
      .charged[0],
    'ANCIENT_POWER'
  )

  // ------------------------------------------------
  // Empty collection
  // ------------------------------------------------

  const emptyResult =
    rankRaidCollectionInvestments({
      entries: [],

      matchups,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Empty collection succeeds',
    emptyResult.status,
    RAID_COLLECTION_INVESTMENT_STATUS
      .SUCCESS
  )

  expectEqual(
    'Empty collection has zero entries',
    emptyResult.entryCount,
    0
  )

  expectEqual(
    'Empty collection has no top actionable investment',
    emptyResult
      .topActionableEntry,
    null
  )

  expectEqual(
    'Empty collection has no top high-value investment',
    emptyResult
      .topHighValueEntry,
    null
  )

  // ------------------------------------------------
  // Invalid collection
  // ------------------------------------------------

  const invalidResult =
    rankRaidCollectionInvestments({
      entries:
        null,

      matchups,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Non-array collection is rejected',
    invalidResult.status,
    RAID_COLLECTION_INVESTMENT_STATUS
      .INVALID_ENTRIES
  )

  expectEqual(
    'Invalid collection has no high-value entries',
    invalidResult
      .highValueEntries
      .length,
    0
  )

  expectEqual(
    'Invalid collection has no top high-value entry',
    invalidResult
      .topHighValueEntry,
    null
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
      'Raid collection investment value test failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)