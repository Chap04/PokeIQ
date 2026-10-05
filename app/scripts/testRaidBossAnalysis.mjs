import combatData from '../src/data/reference/combat.json' with { type: 'json' }

import {
  buildRaidBossAnalysis,
  RAID_BOSS_ANALYSIS_STATUS,
  RAID_BOSS_TEAM_SIZE,
} from '../src/services/buildRaidBossAnalysis.js'

import {
  getPokemonReferenceByIdentity,
} from '../src/utils/pokemonReference.js'

import {
  calculatePokemonCp,
} from '../src/utils/pokemonLevel.js'

// --------------------------------------------------
// Test state
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
      `✅ ${name}`
    )
    return
  }

  failed += 1
  console.log(
    `❌ ${name}`
  )
  console.log(
    `   Expected: ${expected}`
  )
  console.log(
    `   Actual:   ${actual}`
  )
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

// --------------------------------------------------
// Fixture builder
// --------------------------------------------------

function buildOwnedPokemon({
  id,
  identity,
  level,

  attackIv = 15,
  defenseIv = 15,
  staminaIv = 15,

  fastMoveId,
  chargedMove1Id,
  chargedMove2Id = null,

  shadow = false,
}) {
  const reference =
    getPokemonReferenceByIdentity(
      identity
    )

  if (!reference) {
    throw new Error(
      `Reference not found: ${identity}`
    )
  }

  const cpm =
    combatData
      .cpMultipliers
      .allLevels[
        String(level)
      ]

  if (
    !Number.isFinite(cpm)
  ) {
    throw new Error(
      `CPM not found for level ${level}`
    )
  }

  const cp =
    calculatePokemonCp({
      baseAttack:
        reference
          .stats
          .attack,

      baseDefense:
        reference
          .stats
          .defense,

      baseStamina:
        reference
          .stats
          .stamina,

      attackIv,
      defenseIv,
      staminaIv,

      cpm,
    })

  return {
    id,

    pokemonId:
      reference.id,

    pokemonForm:
      reference.form,

    pokemonIdentity:
      identity,

    name:
      reference.id,

    cp,

    ivs: {
      attack:
        attackIv,

      defense:
        defenseIv,

      stamina:
        staminaIv,
    },

    fastMoveId,
    chargedMove1Id,
    chargedMove2Id,

    shiny:
      false,

    shadow,

    purified:
      false,

    lucky:
      false,
  }
}

// --------------------------------------------------
// Header
// --------------------------------------------------

console.log('')
console.log(
  '================================'
)
console.log(
  'RAID BOSS ANALYSIS V2 VALIDATION'
)
console.log(
  '================================'
)
console.log('')

// --------------------------------------------------
// Input validation
// --------------------------------------------------

const invalidCollection =
  buildRaidBossAnalysis({
    collection:
      null,

    bossPokemonIdentity:
      'MEWTWO__NORMAL',

    raidProfileId:
      'TIER_5',
  })

expectEqual(
  'Invalid collection is rejected',
  invalidCollection.status,
  RAID_BOSS_ANALYSIS_STATUS
    .INVALID_COLLECTION
)

const missingBoss =
  buildRaidBossAnalysis({
    collection:
      [],

    bossPokemonIdentity:
      'NOT_A_REAL_BOSS__NORMAL',

    raidProfileId:
      'TIER_5',
  })

expectEqual(
  'Unknown boss is rejected',
  missingBoss.status,
  RAID_BOSS_ANALYSIS_STATUS
    .BOSS_NOT_FOUND
)

const missingProfile =
  buildRaidBossAnalysis({
    collection:
      [],

    bossPokemonIdentity:
      'MEWTWO__NORMAL',

    raidProfileId:
      'NOT_A_REAL_TIER',
  })

expectEqual(
  'Unknown raid profile is rejected',
  missingProfile.status,
  RAID_BOSS_ANALYSIS_STATUS
    .RAID_PROFILE_NOT_FOUND
)

// --------------------------------------------------
// Real current-team fixture
// --------------------------------------------------

const collection = [
  buildOwnedPokemon({
    id:
      'ttar-40',

    identity:
      'TYRANITAR__NORMAL',

    level:
      40,

    fastMoveId:
      'BITE_FAST',

    chargedMove1Id:
      'BRUTAL_SWING',
  }),

  buildOwnedPokemon({
    id:
      'ttar-20',

    identity:
      'TYRANITAR__NORMAL',

    level:
      20,

    fastMoveId:
      'BITE_FAST',

    chargedMove1Id:
      'BRUTAL_SWING',
  }),

  buildOwnedPokemon({
    id:
      'rayquaza-40',

    identity:
      'RAYQUAZA__NORMAL',

    level:
      40,

    fastMoveId:
      'DRAGON_TAIL_FAST',

    chargedMove1Id:
      'OUTRAGE',

    chargedMove2Id:
      'BREAKING_SWIPE',
  }),
]

const result =
  buildRaidBossAnalysis({
    collection,

    bossPokemonIdentity:
      'MEWTWO__NORMAL',

    raidProfileId:
      'TIER_5',
  })

// --------------------------------------------------
// Basic success
// --------------------------------------------------

expectEqual(
  'Real analysis succeeds',
  result.status,
  RAID_BOSS_ANALYSIS_STATUS
    .SUCCESS
)

expectEqual(
  'Selected boss is preserved',
  result
    .boss
    .pokemonIdentity,
  'MEWTWO__NORMAL'
)

expectEqual(
  'Selected raid tier is preserved',
  result
    .boss
    .raidProfileId,
  'TIER_5'
)

expectEqual(
  'All valid owned Pokémon are analyzed',
  result
    .rankings
    .length,
  3
)

expectEqual(
  'Team contains available analyzed Pokémon',
  result
    .team
    .length,
  3
)

// --------------------------------------------------
// V2 ranking metric
// --------------------------------------------------

expectEqual(
  'Summary identifies Raid Score ranking',
  result
    .summary
    .rankingMetric,
  'AVERAGE_RAID_SCORE'
)

expectEqual(
  'Summary identifies equal legal boss moveset assumption',
  result
    .summary
    .bossMovesetAssumption,
  'EQUAL_WEIGHT_LEGAL_MOVESETS'
)

expectTrue(
  'Rankings are descending by average Raid Score',
  result
    .rankings
    .every(
      (
        entry,
        index
      ) =>
        index === 0 ||
        result
          .rankings[
            index - 1
          ]
          .raidScore >=
          entry.raidScore
    )
)

// --------------------------------------------------
// Identical Pokémon at different levels
// --------------------------------------------------

const highLevelTyranitar =
  result
    .rankings
    .find(
      (entry) =>
        entry
          .collectionId ===
        'ttar-40'
    )

const lowLevelTyranitar =
  result
    .rankings
    .find(
      (entry) =>
        entry
          .collectionId ===
        'ttar-20'
    )

expectTrue(
  'Higher-level identical Tyranitar has greater outgoing DPS',
  highLevelTyranitar
    .cycleDps >
    lowLevelTyranitar
      .cycleDps
)

expectTrue(
  'Higher-level identical Tyranitar has greater Raid Score',
  highLevelTyranitar
    .raidScore >
    lowLevelTyranitar
      .raidScore
)

expectTrue(
  'Higher-level identical Tyranitar survives longer on average',
  highLevelTyranitar
    .averageTimeToFaintSeconds >
    lowLevelTyranitar
      .averageTimeToFaintSeconds
)

expectTrue(
  'Higher-level identical Tyranitar produces more average TDO',
  highLevelTyranitar
    .averageTotalDamageOutput >
    lowLevelTyranitar
      .averageTotalDamageOutput
)

// --------------------------------------------------
// Identity / exact owned state
// --------------------------------------------------

expectEqual(
  'Exact owned collection ID is preserved',
  highLevelTyranitar
    .collectionId,
  'ttar-40'
)

expectEqual(
  'Current Fast Move is preserved',
  highLevelTyranitar
    .loadout
    .fastMoveId,
  'BITE_FAST'
)

expectEqual(
  'Current Charged Move is preserved',
  highLevelTyranitar
    .loadout
    .chargedMoveId,
  'BRUTAL_SWING'
)

// --------------------------------------------------
// Outgoing performance
// --------------------------------------------------

expectTrue(
  'Cycle DPS remains exposed',
  Number.isFinite(
    highLevelTyranitar
      .cycleDps
  )
)

expectTrue(
  'Display Cycle DPS remains exposed',
  Number.isFinite(
    highLevelTyranitar
      .displayCycleDps
  )
)

// --------------------------------------------------
// Survivability / TDO / Raid Score
// --------------------------------------------------

expectTrue(
  'Owned HP is exposed',
  Number.isFinite(
    highLevelTyranitar.hp
  ) &&
  highLevelTyranitar.hp > 0
)

expectTrue(
  'Average incoming boss DPS is exposed',
  Number.isFinite(
    highLevelTyranitar
      .averageIncomingCycleDps
  ) &&
  highLevelTyranitar
    .averageIncomingCycleDps > 0
)

expectTrue(
  'Average time to faint is exposed',
  Number.isFinite(
    highLevelTyranitar
      .averageTimeToFaintSeconds
  ) &&
  highLevelTyranitar
    .averageTimeToFaintSeconds > 0
)

expectTrue(
  'Average TDO is exposed',
  Number.isFinite(
    highLevelTyranitar
      .averageTotalDamageOutput
  ) &&
  highLevelTyranitar
    .averageTotalDamageOutput > 0
)

expectTrue(
  'Average Raid Score is exposed',
  Number.isFinite(
    highLevelTyranitar
      .averageRaidScore
  ) &&
  highLevelTyranitar
    .averageRaidScore > 0
)

expectEqual(
  'Primary Raid Score aliases average Raid Score',
  highLevelTyranitar
    .raidScore,
  highLevelTyranitar
    .averageRaidScore
)

expectTrue(
  'Display Raid Score is exposed',
  Number.isFinite(
    highLevelTyranitar
      .displayRaidScore
  )
)

expectTrue(
  'Minimum Raid Score does not exceed average',
  highLevelTyranitar
    .minimumRaidScore <=
    highLevelTyranitar
      .averageRaidScore
)

expectTrue(
  'Maximum Raid Score is not below average',
  highLevelTyranitar
    .maximumRaidScore >=
    highLevelTyranitar
      .averageRaidScore
)

expectTrue(
  'Boss survivability scenarios are analyzed',
  Number.isInteger(
    highLevelTyranitar
      .survivabilityScenarioCount
  ) &&
  highLevelTyranitar
    .survivabilityScenarioCount > 0
)

// --------------------------------------------------
// Boss moveset evidence
// --------------------------------------------------

expectTrue(
  'Safest boss moveset is exposed',
  Boolean(
    highLevelTyranitar
      .safestBossMoveset
      ?.fastMoveId
  ) &&
  Boolean(
    highLevelTyranitar
      .safestBossMoveset
      ?.chargedMoveId
  )
)

expectTrue(
  'Most dangerous boss moveset is exposed',
  Boolean(
    highLevelTyranitar
      .mostDangerousBossMoveset
      ?.fastMoveId
  ) &&
  Boolean(
    highLevelTyranitar
      .mostDangerousBossMoveset
      ?.chargedMoveId
  )
)

// --------------------------------------------------
// Dual-Charged-Move current-state support
// --------------------------------------------------

const rayquaza =
  result
    .rankings
    .find(
      (entry) =>
        entry
          .collectionId ===
        'rayquaza-40'
    )

expectTrue(
  'Dual-move Pokémon keeps one of its actual current Charged Moves',
  [
    'OUTRAGE',
    'BREAKING_SWIPE',
  ].includes(
    rayquaza
      .loadout
      .chargedMoveId
  )
)

expectTrue(
  'Dual-move Pokémon receives a valid Raid Score',
  Number.isFinite(
    rayquaza
      .raidScore
  ) &&
  rayquaza
    .raidScore > 0
)

// --------------------------------------------------
// Team cap
// --------------------------------------------------

const sevenTyranitar =
  Array.from(
    {
      length:
        7,
    },

    (
      _,
      index
    ) =>
      buildOwnedPokemon({
        id:
          `ttar-${index + 1}`,

        identity:
          'TYRANITAR__NORMAL',

        level:
          40 - index,

        fastMoveId:
          'BITE_FAST',

        chargedMove1Id:
          'BRUTAL_SWING',
      })
  )

const cappedResult =
  buildRaidBossAnalysis({
    collection:
      sevenTyranitar,

    bossPokemonIdentity:
      'MEWTWO__NORMAL',

    raidProfileId:
      'TIER_5',
  })

expectEqual(
  'Current team is capped at six Pokémon',
  cappedResult
    .team
    .length,
  RAID_BOSS_TEAM_SIZE
)

expectEqual(
  'All seven still remain in full rankings',
  cappedResult
    .rankings
    .length,
  7
)

expectTrue(
  'Complete-team summary is true at six slots',
  cappedResult
    .summary
    .completeTeam
)

expectTrue(
  'Capped team itself remains Raid Score ordered',
  cappedResult
    .team
    .every(
      (
        entry,
        index
      ) =>
        index === 0 ||
        cappedResult
          .team[
            index - 1
          ]
          .raidScore >=
          entry.raidScore
    )
)

// --------------------------------------------------
// Invalid owned entry is skipped, not fatal
// --------------------------------------------------

const mixedResult =
  buildRaidBossAnalysis({
    collection: [
      ...collection,

      {
        id:
          'broken-entry',

        pokemonIdentity:
          'RAYQUAZA__NORMAL',

        cp:
          null,
      },
    ],

    bossPokemonIdentity:
      'MEWTWO__NORMAL',

    raidProfileId:
      'TIER_5',
  })

expectEqual(
  'Bad collection entry does not fail whole analysis',
  mixedResult.status,
  RAID_BOSS_ANALYSIS_STATUS
    .SUCCESS
)

expectEqual(
  'Bad collection entry is reported as skipped',
  mixedResult
    .skipped
    .length,
  1
)

// --------------------------------------------------
// Diagnostic output
// --------------------------------------------------

console.log('')
console.log(
  '--------------------------------'
)
console.log(
  'MEWTWO TIER 5 TEST RANKINGS'
)
console.log(
  '--------------------------------'
)

for (
  const attacker
  of result.rankings
) {
  console.log(
    [
      attacker.collectionId,
      `DPS ${attacker.displayCycleDps}`,
      `Raid Score ${attacker.displayRaidScore}`,
      `Survival ${attacker.displayAverageTimeToFaintSeconds}s`,
      `TDO ${attacker.displayAverageTotalDamageOutput}`,
      `${attacker.loadout.fastMoveId} / ${attacker.loadout.chargedMoveId}`,
    ].join(
      ' | '
    )
  )
}

// --------------------------------------------------
// Results
// --------------------------------------------------

console.log('')
console.log(
  '================================'
)

console.log(
  `${passed} passed / ${failed} failed`
)

console.log(
  '================================'
)
console.log('')

if (
  failed > 0
) {
  process.exitCode = 1
}