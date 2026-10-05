import fs from 'node:fs/promises'
import path from 'node:path'

import {
  fileURLToPath,
} from 'node:url'

import {
  buildRaidInvestmentEvidence,
  RAID_INVESTMENT_EVIDENCE_STATUS,
} from '../src/utils/raidInvestmentEvidence.js'

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
    'RAID INVESTMENT EVIDENCE VALIDATION'
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

    stats:
      null,

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
  // States
  // ------------------------------------------------

  const currentState = {
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
      destroysProtectedMove:
        false,
    },
  }

  const possibleState = {
    type:
      'MOVESET_CHANGE',

    current:
      false,

    reachable:
      true,

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

    changes: {
      fastMoveChanged:
        true,

      chargedMove1Changed:
        true,
    },

    preservation: {
      replacesExistingMove:
        true,

      destroysProtectedMove:
        false,
    },
  }

  const protectedState = {
    ...possibleState,

    type:
      'SPECIAL_MOVE_CHANGE',

    reachable:
      false,

    action: {
      type:
        'SPECIAL_ACQUISITION',
    },

    preservation: {
      replacesExistingMove:
        true,

      destroysProtectedMove:
        true,
    },
  }

  // ------------------------------------------------
  // Matchup set
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
  // Test 1
  // Successful evidence build
  // ------------------------------------------------

  const result =
    buildRaidInvestmentEvidence({
      candidate,

      currentState,

      possibleState,

      matchups,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Multi-matchup evidence succeeds',
    result.status,
    RAID_INVESTMENT_EVIDENCE_STATUS
      .SUCCESS
  )

  // ------------------------------------------------
  // Test 2
  // Matchup count
  // ------------------------------------------------

  expectEqual(
    'All matchups are counted',
    result.matchupCount,
    3
  )

  // ------------------------------------------------
  // Test 3
  // Successful count
  // ------------------------------------------------

  expectEqual(
    'All valid matchups succeed',
    result.successfulMatchupCount,
    3
  )

  // ------------------------------------------------
  // Test 4
  // No failures
  // ------------------------------------------------

  expectEqual(
    'No valid matchups fail',
    result.failedMatchupCount,
    0
  )

  // ------------------------------------------------
  // Test 5
  // Evidence entries
  // ------------------------------------------------

  expectEqual(
    'Evidence contains every matchup',
    result
      .evidence
      .length,
    3
  )

  // ------------------------------------------------
  // Test 6
  // Successful evidence entries
  // ------------------------------------------------

  expectEqual(
    'Successful evidence contains every matchup',
    result
      .successfulEvidence
      .length,
    3
  )

  // ------------------------------------------------
  // Test 7
  // Each comparison succeeded
  // ------------------------------------------------

  expectTrue(
    'Each matchup contains a successful comparison',
    result
      .successfulEvidence
      .every(
        (entry) =>
          entry
            ?.comparison
            ?.status ===
          'SUCCESS'
      )
  )

  // ------------------------------------------------
  // Test 8
  // Individual matchup IDs
  // ------------------------------------------------

  expectEqual(
    'First matchup ID is preserved',
    result
      .evidence[0]
      .matchupId,
    'RAYQUAZA'
  )

  expectEqual(
    'Matchup label is preserved',
    result
      .evidence[0]
      .label,
    'Rayquaza'
  )

  // ------------------------------------------------
  // Test 9
  // Summary counts are internally consistent
  // ------------------------------------------------

  expectEqual(
    'Improved + reduced + unchanged equals successful count',
    result
      .improvedMatchupCount +
    result
      .reducedMatchupCount +
    result
      .unchangedMatchupCount,
    result
      .successfulMatchupCount
  )

  // ------------------------------------------------
  // Test 10
  // Improvement rate
  // ------------------------------------------------

  expectTrue(
    'Improvement rate is between zero and one',
    result
      .improvementRate >=
      0 &&
    result
      .improvementRate <=
      1
  )

  // ------------------------------------------------
  // Test 11
  // Reduction rate
  // ------------------------------------------------

  expectTrue(
    'Reduction rate is between zero and one',
    result
      .reductionRate >=
      0 &&
    result
      .reductionRate <=
      1
  )

  // ------------------------------------------------
  // Test 12
  // Average percent gain
  // ------------------------------------------------

  expectTrue(
    'Average percent gain is finite',
    Number.isFinite(
      result
        .averagePercentGain
    )
  )

  // ------------------------------------------------
  // Test 13
  // Median percent gain
  // ------------------------------------------------

  expectTrue(
    'Median percent gain is finite',
    Number.isFinite(
      result
        .medianPercentGain
    )
  )

  // ------------------------------------------------
  // Test 14
  // Minimum / maximum
  // ------------------------------------------------

  expectTrue(
    'Minimum percent gain does not exceed maximum',
    result
      .minimumPercentGain <=
    result
      .maximumPercentGain
  )

  // ------------------------------------------------
  // Test 15
  // Average multiplier
  // ------------------------------------------------

  expectTrue(
    'Average performance multiplier is finite',
    Number.isFinite(
      result
        .averagePerformanceMultiplier
    )
  )

  // ------------------------------------------------
  // Test 16
  // Reachability metadata
  // ------------------------------------------------

  expectEqual(
    'Reachability is preserved',
    result.reachable,
    true
  )

  // ------------------------------------------------
  // Test 17
  // Action metadata
  // ------------------------------------------------

  expectEqual(
    'Action metadata is preserved',
    result
      ?.action
      ?.type,
    'FAST_AND_CHARGED_TM'
  )

  // ------------------------------------------------
  // Test 18
  // Protected move metadata
  // ------------------------------------------------

  expectEqual(
    'Protected move flag is preserved',
    result
      .destroysProtectedMove,
    false
  )

  // ------------------------------------------------
  // Test 19
  // Unreachable state still produces evidence
  // ------------------------------------------------

  const protectedResult =
    buildRaidInvestmentEvidence({
      candidate,

      currentState,

      possibleState:
        protectedState,

      matchups,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Unreachable state can still produce evidence',
    protectedResult.status,
    RAID_INVESTMENT_EVIDENCE_STATUS
      .SUCCESS
  )

  expectEqual(
    'Unreachable state remains unreachable',
    protectedResult.reachable,
    false
  )

  expectEqual(
    'Protected move destruction is preserved',
    protectedResult
      .destroysProtectedMove,
    true
  )

  // ------------------------------------------------
  // Test 20
  // Partial failure
  // ------------------------------------------------

  const partialMatchups = [
    ...matchups,

    {
      id:
        'BROKEN',

      label:
        'Broken Defender',

      defender:
        null,
    },
  ]

  const partialResult =
    buildRaidInvestmentEvidence({
      candidate,

      currentState,

      possibleState,

      matchups:
        partialMatchups,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Evidence survives a partial matchup failure',
    partialResult.status,
    RAID_INVESTMENT_EVIDENCE_STATUS
      .SUCCESS
  )

  expectEqual(
    'Partial failure is counted',
    partialResult
      .failedMatchupCount,
    1
  )

  expectEqual(
    'Valid matchups remain successful after partial failure',
    partialResult
      .successfulMatchupCount,
    3
  )

  // ------------------------------------------------
  // Test 21
  // Invalid matchup collection
  // ------------------------------------------------

  const invalidMatchups =
    buildRaidInvestmentEvidence({
      candidate,

      currentState,

      possibleState,

      matchups:
        null,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Non-array matchups are rejected',
    invalidMatchups.status,
    RAID_INVESTMENT_EVIDENCE_STATUS
      .INVALID_MATCHUPS
  )

  // ------------------------------------------------
  // Test 22
  // Empty matchup collection
  // ------------------------------------------------

  const emptyMatchups =
    buildRaidInvestmentEvidence({
      candidate,

      currentState,

      possibleState,

      matchups: [],

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Empty matchup collection is rejected',
    emptyMatchups.status,
    RAID_INVESTMENT_EVIDENCE_STATUS
      .INVALID_MATCHUPS
  )

  // ------------------------------------------------
  // Test 23
  // No successful matchups
  // ------------------------------------------------

  const brokenOnly =
    buildRaidInvestmentEvidence({
      candidate,

      currentState,

      possibleState,

      matchups: [
        {
          id:
            'BROKEN_1',

          defender:
            null,
        },

        {
          id:
            'BROKEN_2',

          defender:
            null,
        },
      ],

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'All-failed matchup set is surfaced',
    brokenOnly.status,
    RAID_INVESTMENT_EVIDENCE_STATUS
      .NO_SUCCESSFUL_MATCHUPS
  )

  expectEqual(
    'All failed matchups are counted',
    brokenOnly
      .failedMatchupCount,
    2
  )

  expectEqual(
    'No successful matchups are reported',
    brokenOnly
      .successfulMatchupCount,
    0
  )

  // ------------------------------------------------
  // Test 24
  // Candidate is not mutated
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
      'Raid investment evidence test failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)