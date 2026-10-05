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
  RAID_INVESTMENT_RANK_GROUP,
} from '../src/utils/raidInvestmentOpportunity.js'

import {
  buildRaidBenchmarks,
} from '../src/utils/raidBenchmarks.js'

import {
  RAID_STRENGTH_STATUS,
  RAID_STRENGTH_CLASSIFICATION,
} from '../src/utils/raidStrength.js'

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
  value,
  detail = null
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

    if (detail) {
      console.log(
        `   Detail:   ${detail}`
      )
    }
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

function buildCandidate({
  reference,
  identity,
  cpm,
  fastMoveId,
  chargedMoveId,
}) {
  return {
    status:
      'READY',

    pokemonIdentity:
      identity,

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

function buildState({
  type,
  identity,
  fastMoveId,
  chargedMoveId,
  current = false,
  reachable = true,
  destroysProtectedMove = false,
  actionType = 'TEST_ACTION',
}) {
  return {
    type,

    current,

    reachable,

    pokemonIdentity:
      identity,

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
    'RAID COLLECTION INVESTMENT VALIDATION'
  )
  console.log(
    '================================'
  )
  console.log('')

  const [
    pokemon,
    moves,
    combat,
    strengthReference,
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

    readJson(
      'raid-strength.json'
    ),
  ])

  const rayquaza =
    findPokemon(
      pokemon,
      'RAYQUAZA'
    )

  const dragonite =
    findPokemon(
      pokemon,
      'DRAGONITE'
    )

  const salamence =
    findPokemon(
      pokemon,
      'SALAMENCE'
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

  const amaura =
    findPokemon(
      pokemon,
      'AMAURA'
    )

  const nihilego =
    findPokemon(
      pokemon,
      'NIHILEGO'
    )

  if (
    !rayquaza ||
    !dragonite ||
    !salamence ||
    !mewtwo ||
    !groudon ||
    !amaura ||
    !nihilego
  ) {
    throw new Error(
      'Required reference Pokémon not found.'
    )
  }

  const attackerCpm =
    combat
      .cpMultipliers
      .allLevels['40']

  // --------------------------------------------------
  // Rayquaza
  //
  // Weak current moveset -> strong Dragon moveset.
  // Intended to be the strongest actionable entry.
  // --------------------------------------------------

  const rayquazaCandidate =
    buildCandidate({
      reference:
        rayquaza,

      identity:
        'RAYQUAZA__NORMAL',

      cpm:
        attackerCpm,

      fastMoveId:
        'AIR_SLASH_FAST',

      chargedMoveId:
        'ANCIENT_POWER',
    })

  const rayquazaCurrent =
    buildState({
      type:
        'CURRENT',

      identity:
        'RAYQUAZA__NORMAL',

      fastMoveId:
        'AIR_SLASH_FAST',

      chargedMoveId:
        'ANCIENT_POWER',

      current:
        true,

      actionType:
        'NONE',
    })

  const rayquazaImprovement =
    buildState({
      type:
        'RAYQUAZA_IMPROVEMENT',

      identity:
        'RAYQUAZA__NORMAL',

      fastMoveId:
        'DRAGON_TAIL_FAST',

      chargedMoveId:
        'OUTRAGE',

      actionType:
        'FAST_AND_CHARGED_TM',
    })

  // --------------------------------------------------
  // Dragonite
  //
  // Deliberately poor current raid moveset -> strong
  // Dragon moveset.
  //
  // Previous fixture used Dragon Breath + Outrage
  // -> Dragon Tail + Outrage, which was correctly
  // classified as too small a change to be actionable.
  // --------------------------------------------------

  const dragoniteCandidate =
    buildCandidate({
      reference:
        dragonite,

      identity:
        'DRAGONITE__NORMAL',

      cpm:
        attackerCpm,

      fastMoveId:
        'STEEL_WING_FAST',

      chargedMoveId:
        'HYPER_BEAM',
    })

  const dragoniteCurrent =
    buildState({
      type:
        'CURRENT',

      identity:
        'DRAGONITE__NORMAL',

      fastMoveId:
        'STEEL_WING_FAST',

      chargedMoveId:
        'HYPER_BEAM',

      current:
        true,

      actionType:
        'NONE',
    })

  const dragoniteImprovement =
    buildState({
      type:
        'DRAGONITE_IMPROVEMENT',

      identity:
        'DRAGONITE__NORMAL',

      fastMoveId:
        'DRAGON_TAIL_FAST',

      chargedMoveId:
        'OUTRAGE',

      actionType:
        'FAST_AND_CHARGED_TM',
    })

  // --------------------------------------------------
  // Salamence
  //
  // Strong theoretical state, but protected.
  // This should NOT beat safe actionable options.
  // --------------------------------------------------

  const salamenceCandidate =
    buildCandidate({
      reference:
        salamence,

      identity:
        'SALAMENCE__NORMAL',

      cpm:
        attackerCpm,

      fastMoveId:
        'FIRE_FANG_FAST',

      chargedMoveId:
        'FIRE_BLAST',
    })

  const salamenceCurrent =
    buildState({
      type:
        'CURRENT',

      identity:
        'SALAMENCE__NORMAL',

      fastMoveId:
        'FIRE_FANG_FAST',

      chargedMoveId:
        'FIRE_BLAST',

      current:
        true,

      actionType:
        'NONE',
    })

  const salamenceProtected =
    buildState({
      type:
        'SALAMENCE_PROTECTED',

      identity:
        'SALAMENCE__NORMAL',

      fastMoveId:
        'DRAGON_TAIL_FAST',

      chargedMoveId:
        'OUTRAGE',

      destroysProtectedMove:
        true,

      actionType:
        'PROTECTED_TEST',
    })

  // --------------------------------------------------
  // Entry with no possible states
  // --------------------------------------------------

  const noOpportunityEntry = {
    collectionId:
      'NO_OPPORTUNITY',

    candidate:
      rayquazaCandidate,

    currentState:
      rayquazaCurrent,

    possibleStates: [],
  }

  // --------------------------------------------------
  // Existing three-matchup regression set
  // --------------------------------------------------

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

  const entries = [
    {
      collectionId:
        'SALAMENCE_1',

      candidate:
        salamenceCandidate,

      currentState:
        salamenceCurrent,

      possibleStates: [
        salamenceProtected,
      ],
    },

    {
      collectionId:
        'DRAGONITE_1',

      candidate:
        dragoniteCandidate,

      currentState:
        dragoniteCurrent,

      possibleStates: [
        dragoniteImprovement,
      ],
    },

    {
      collectionId:
        'RAYQUAZA_1',

      candidate:
        rayquazaCandidate,

      currentState:
        rayquazaCurrent,

      possibleStates: [
        rayquazaImprovement,
      ],
    },

    noOpportunityEntry,
  ]

  // --------------------------------------------------
  // Existing ranking
  //
  // IMPORTANT:
  //
  // No strengthReference is supplied here.
  //
  // These original tests therefore prove that the
  // collection ranker remains backwards compatible
  // when Raid Strength is not enabled.
  // --------------------------------------------------

  const result =
    rankRaidCollectionInvestments({
      entries,

      matchups,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Collection investment ranking succeeds',
    result.status,
    RAID_COLLECTION_INVESTMENT_STATUS
      .SUCCESS
  )

  expectEqual(
    'Every collection entry is preserved',
    result.entryCount,
    4
  )

  expectEqual(
    'Original entries collection contains every Pokémon',
    result.entries.length,
    4
  )

  expectEqual(
    'Ranked entries collection contains every Pokémon',
    result.rankedEntries.length,
    4
  )

  // --------------------------------------------------
  // Individual entry results
  // --------------------------------------------------

  const rayquazaEntry =
    result.rankedEntries.find(
      (entry) =>
        entry.collectionId ===
        'RAYQUAZA_1'
    )

  const dragoniteEntry =
    result.rankedEntries.find(
      (entry) =>
        entry.collectionId ===
        'DRAGONITE_1'
    )

  const salamenceEntry =
    result.rankedEntries.find(
      (entry) =>
        entry.collectionId ===
        'SALAMENCE_1'
    )

  const emptyEntry =
    result.rankedEntries.find(
      (entry) =>
        entry.collectionId ===
        'NO_OPPORTUNITY'
    )

  expectTrue(
    'Rayquaza collection entry exists',
    Boolean(
      rayquazaEntry
    )
  )

  expectTrue(
    'Dragonite collection entry exists',
    Boolean(
      dragoniteEntry
    )
  )

  expectTrue(
    'Salamence collection entry exists',
    Boolean(
      salamenceEntry
    )
  )

  expectTrue(
    'No-opportunity collection entry exists',
    Boolean(
      emptyEntry
    )
  )

  // --------------------------------------------------
  // Single-Pokémon pipelines succeeded
  // --------------------------------------------------

  expectEqual(
    'Rayquaza opportunity pipeline succeeds',
    rayquazaEntry
      ?.opportunityResult
      ?.status,
    'SUCCESS'
  )

  expectEqual(
    'Dragonite opportunity pipeline succeeds',
    dragoniteEntry
      ?.opportunityResult
      ?.status,
    'SUCCESS'
  )

  expectEqual(
    'Salamence opportunity pipeline succeeds',
    salamenceEntry
      ?.opportunityResult
      ?.status,
    'SUCCESS'
  )

  // --------------------------------------------------
  // Expected groups
  // --------------------------------------------------

  expectEqual(
    'Rayquaza has actionable promising opportunity',
    rayquazaEntry
      ?.topOpportunity
      ?.rankGroup,
    RAID_INVESTMENT_RANK_GROUP
      .ACTIONABLE_PROMISING
  )

  expectEqual(
    'Dragonite has an actionable opportunity',
    dragoniteEntry
      ?.hasActionableOpportunity,
    true
  )

  expectEqual(
    'Salamence theoretical opportunity is preservation risk',
    salamenceEntry
      ?.topOpportunity
      ?.rankGroup,
    RAID_INVESTMENT_RANK_GROUP
      .PRESERVATION_RISK
  )

  expectEqual(
    'Salamence has no actionable opportunity',
    salamenceEntry
      ?.topActionableOpportunity,
    null
  )

  expectEqual(
    'Empty entry has no top opportunity',
    emptyEntry
      ?.topOpportunity,
    null
  )

  // --------------------------------------------------
  // Collection ordering
  // --------------------------------------------------

  expectTrue(
    'Rayquaza outranks preservation-risk Salamence',
    rayquazaEntry.rank <
      salamenceEntry.rank
  )

  expectTrue(
    'Dragonite outranks preservation-risk Salamence',
    dragoniteEntry.rank <
      salamenceEntry.rank
  )

  expectTrue(
    'Any ranked opportunity outranks no-opportunity entry',
    salamenceEntry.rank <
      emptyEntry.rank
  )

  // --------------------------------------------------
  // Actionable collection
  // --------------------------------------------------

  expectEqual(
    'Two Pokémon have actionable opportunities',
    result
      .actionableEntryCount,
    2
  )

  expectEqual(
    'Actionable collection contains two entries',
    result
      .actionableEntries
      .length,
    2
  )

  expectTrue(
    'Every actionable collection entry has an actionable opportunity',
    result
      .actionableEntries
      .every(
        (entry) =>
          Boolean(
            entry
              .topActionableOpportunity
          )
      )
  )

  expectTrue(
    'Preservation-risk Salamence is excluded from actionable collection',
    !result
      .actionableEntries
      .some(
        (entry) =>
          entry.collectionId ===
          'SALAMENCE_1'
      )
  )

  // --------------------------------------------------
  // Top actionable investment
  // --------------------------------------------------

  expectTrue(
    'Top actionable collection entry exists',
    Boolean(
      result
        .topActionableEntry
    )
  )

  expectEqual(
    'Top actionable entry uses actionable promising group',
    result
      ?.topActionableEntry
      ?.topOpportunity
      ?.rankGroup,
    RAID_INVESTMENT_RANK_GROUP
      .ACTIONABLE_PROMISING
  )

  expectEqual(
    'Top actionable entry has actionable rank one',
    result
      ?.topActionableEntry
      ?.actionableRank,
    1
  )

  // --------------------------------------------------
  // Evidence remains explainable
  // --------------------------------------------------

  expectTrue(
    'Top actionable entry contains median gain',
    Number.isFinite(
      result
        ?.topActionableEntry
        ?.topOpportunity
        ?.assessment
        ?.performanceEvidence
        ?.medianPercentGain
    )
  )

  expectTrue(
    'Top actionable entry contains improvement rate',
    Number.isFinite(
      result
        ?.topActionableEntry
        ?.topOpportunity
        ?.assessment
        ?.performanceEvidence
        ?.improvementRate
    )
  )

  expectTrue(
    'Top actionable entry preserves reason codes',
    Array.isArray(
      result
        ?.topActionableEntry
        ?.topOpportunity
        ?.assessment
        ?.reasonCodes
    )
  )

  // --------------------------------------------------
  // Original collection order is preserved
  // --------------------------------------------------

  expectEqual(
    'Original first collection entry remains Salamence',
    result
      .entries[0]
      .collectionId,
    'SALAMENCE_1'
  )

  expectEqual(
    'Original third collection entry remains Rayquaza',
    result
      .entries[2]
      .collectionId,
    'RAYQUAZA_1'
  )

  // --------------------------------------------------
  // Empty collection
  // --------------------------------------------------

  const emptyResult =
    rankRaidCollectionInvestments({
      entries: [],

      matchups,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Empty collection is valid',
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
    'Empty collection has no top entry',
    emptyResult.topEntry,
    null
  )

  expectEqual(
    'Empty collection has no top actionable entry',
    emptyResult
      .topActionableEntry,
    null
  )

  // --------------------------------------------------
  // Invalid collection
  // --------------------------------------------------

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
    'Invalid collection has no ranked entries',
    invalidResult
      .rankedEntries
      .length,
    0
  )

  // --------------------------------------------------
  // Inputs remain untouched
  // --------------------------------------------------

  expectEqual(
    'Rayquaza candidate Fast Move is not mutated',
    rayquazaCandidate
      .moves
      .fast,
    'AIR_SLASH_FAST'
  )

  expectEqual(
    'Dragonite candidate Charged Move is not mutated',
    dragoniteCandidate
      .moves
      .charged[0],
    'HYPER_BEAM'
  )

  expectEqual(
    'Original collection array remains Salamence first',
    entries[0]
      .collectionId,
    'SALAMENCE_1'
  )

  // --------------------------------------------------
  // Raid Strength disabled regression
  //
  // The original ranking intentionally omitted the
  // compact reference.
  // --------------------------------------------------

  expectEqual(
    'Raid Strength remains disabled when reference is omitted',
    result
      .raidStrengthEnabled,
    false
  )

  // --------------------------------------------------
  // Raid Strength collection-ranking regression
  //
  // This reproduces the Dashboard failure mode that
  // motivated absolute resulting-attacker strength.
  //
  // Amaura:
  //
  //   Frost Breath + Thunderbolt
  //       ->
  //   Powder Snow + Weather Ball Ice
  //
  // This should be a very large relative improvement,
  // but Amaura remains a weak absolute raid attacker.
  //
  // Nihilego:
  //
  //   Pound + Power Gem
  //       ->
  //   Poison Jab + Sludge Bomb
  //
  // This is intended to be a smaller relative change,
  // but the resulting Nihilego is a legitimately strong
  // raid attacker.
  //
  // Correct collection ranking:
  //
  //   Nihilego > Amaura
  //
  // We use the same stable 18-type benchmark set used
  // by the general Raid Investment system.
  // --------------------------------------------------

  console.log('')
  console.log(
    '--------------------------------'
  )
  console.log(
    'RAID STRENGTH COLLECTION REGRESSION'
  )
  console.log(
    '--------------------------------'
  )
  console.log('')

  const strengthMatchups =
    buildRaidBenchmarks()

  expectEqual(
    'Raid Strength benchmark set contains 18 type matchups',
    strengthMatchups.length,
    18
  )

  // --------------------------------------------------
  // Amaura fixture
  // --------------------------------------------------

  const amauraCandidate =
    buildCandidate({
      reference:
        amaura,

      identity:
        'AMAURA__NORMAL',

      cpm:
        attackerCpm,

      fastMoveId:
        'FROST_BREATH_FAST',

      chargedMoveId:
        'THUNDERBOLT',
    })

  const amauraCurrent =
    buildState({
      type:
        'CURRENT',

      identity:
        'AMAURA__NORMAL',

      fastMoveId:
        'FROST_BREATH_FAST',

      chargedMoveId:
        'THUNDERBOLT',

      current:
        true,

      actionType:
        'NONE',
    })

  const amauraImprovement =
    buildState({
      type:
        'AMAURA_IMPROVEMENT',

      identity:
        'AMAURA__NORMAL',

      fastMoveId:
        'POWDER_SNOW_FAST',

      chargedMoveId:
        'WEATHER_BALL_ICE',

      actionType:
        'FAST_AND_CHARGED_TM',
    })

  // --------------------------------------------------
  // Nihilego fixture
  // --------------------------------------------------

  const nihilegoCandidate =
    buildCandidate({
      reference:
        nihilego,

      identity:
        'NIHILEGO__NORMAL',

      cpm:
        attackerCpm,

      fastMoveId:
        'POUND_FAST',

      chargedMoveId:
        'POWER_GEM',
    })

  const nihilegoCurrent =
    buildState({
      type:
        'CURRENT',

      identity:
        'NIHILEGO__NORMAL',

      fastMoveId:
        'POUND_FAST',

      chargedMoveId:
        'POWER_GEM',

      current:
        true,

      actionType:
        'NONE',
    })

  const nihilegoImprovement =
    buildState({
      type:
        'NIHILEGO_IMPROVEMENT',

      identity:
        'NIHILEGO__NORMAL',

      fastMoveId:
        'POISON_JAB_FAST',

      chargedMoveId:
        'SLUDGE_BOMB',

      actionType:
        'FAST_AND_CHARGED_TM',
    })

  const strengthEntries = [
    {
      collectionId:
        'AMAURA_STRENGTH_TEST',

      candidate:
        amauraCandidate,

      currentState:
        amauraCurrent,

      possibleStates: [
        amauraImprovement,
      ],
    },

    {
      collectionId:
        'NIHILEGO_STRENGTH_TEST',

      candidate:
        nihilegoCandidate,

      currentState:
        nihilegoCurrent,

      possibleStates: [
        nihilegoImprovement,
      ],
    },
  ]

  const strengthResult =
    rankRaidCollectionInvestments({
      entries:
        strengthEntries,

      matchups:
        strengthMatchups,

      moves,

      combatData:
        combat,

      strengthReference,
    })

  expectEqual(
    'Raid Strength collection ranking succeeds',
    strengthResult.status,
    RAID_COLLECTION_INVESTMENT_STATUS
      .SUCCESS
  )

  expectEqual(
    'Raid Strength is enabled when compact reference is supplied',
    strengthResult
      .raidStrengthEnabled,
    true
  )

  expectEqual(
    'Raid Strength test preserves both collection entries',
    strengthResult
      .entryCount,
    2
  )

  const strengthAmauraEntry =
    strengthResult
      .rankedEntries
      .find(
        (entry) =>
          entry.collectionId ===
          'AMAURA_STRENGTH_TEST'
      )

  const strengthNihilegoEntry =
    strengthResult
      .rankedEntries
      .find(
        (entry) =>
          entry.collectionId ===
          'NIHILEGO_STRENGTH_TEST'
      )

  expectTrue(
    'Raid Strength Amaura entry exists',
    Boolean(
      strengthAmauraEntry
    )
  )

  expectTrue(
    'Raid Strength Nihilego entry exists',
    Boolean(
      strengthNihilegoEntry
    )
  )

  const amauraOpportunity =
    strengthAmauraEntry
      ?.topOpportunity

  const nihilegoOpportunity =
    strengthNihilegoEntry
      ?.topOpportunity

  expectTrue(
    'Amaura has a ranked opportunity',
    Boolean(
      amauraOpportunity
    )
  )

  expectTrue(
    'Nihilego has a ranked opportunity',
    Boolean(
      nihilegoOpportunity
    )
  )

  expectEqual(
    'Amaura resulting Raid Strength evaluation succeeds',
    amauraOpportunity
      ?.raidStrength
      ?.status,
    RAID_STRENGTH_STATUS
      .SUCCESS
  )

  expectEqual(
    'Nihilego resulting Raid Strength evaluation succeeds',
    nihilegoOpportunity
      ?.raidStrength
      ?.status,
    RAID_STRENGTH_STATUS
      .SUCCESS
  )

  expectEqual(
    'Amaura resulting Raid Strength uses compact reference',
    amauraOpportunity
      ?.raidStrength
      ?.referenceSource,
    'COMPACT_REFERENCE'
  )

  expectEqual(
    'Nihilego resulting Raid Strength uses compact reference',
    nihilegoOpportunity
      ?.raidStrength
      ?.referenceSource,
    'COMPACT_REFERENCE'
  )

  // --------------------------------------------------
  // Absolute strength classification
  //
  // These classifications were independently validated
  // by the full-theoretical-vs-compact Raid Strength
  // parity suite.
  // --------------------------------------------------

  expectEqual(
    'Improved Amaura remains a weak absolute raid attacker',
    amauraOpportunity
      ?.raidStrength
      ?.bestClassification,
    RAID_STRENGTH_CLASSIFICATION
      .WEAK
  )

  expectEqual(
    'Improved Nihilego is a strong absolute raid attacker',
    nihilegoOpportunity
      ?.raidStrength
      ?.bestClassification,
    RAID_STRENGTH_CLASSIFICATION
      .STRONG
  )

  expectTrue(
    'Nihilego resulting best Raid Strength exceeds Amaura',
    (
      nihilegoOpportunity
        ?.raidStrength
        ?.bestStrengthScore ??
      Number.NEGATIVE_INFINITY
    ) >
    (
      amauraOpportunity
        ?.raidStrength
        ?.bestStrengthScore ??
      Number.NEGATIVE_INFINITY
    ),
    (
      `Amaura ${amauraOpportunity?.raidStrength?.bestStrengthScore}` +
      ` vs Nihilego ${nihilegoOpportunity?.raidStrength?.bestStrengthScore}`
    )
  )

  expectTrue(
    'Nihilego resulting best overall strength exceeds Amaura',
    (
      nihilegoOpportunity
        ?.raidStrength
        ?.bestOverallStrengthScore ??
      Number.NEGATIVE_INFINITY
    ) >
    (
      amauraOpportunity
        ?.raidStrength
        ?.bestOverallStrengthScore ??
      Number.NEGATIVE_INFINITY
    ),
    (
      `Amaura ${amauraOpportunity?.raidStrength?.bestOverallStrengthScore}` +
      ` vs Nihilego ${nihilegoOpportunity?.raidStrength?.bestOverallStrengthScore}`
    )
  )

  // --------------------------------------------------
  // Relative-gain trap
  //
  // This is the core regression.
  //
  // We deliberately expect Amaura to show the larger
  // percentage improvement.
  //
  // If this fixture no longer produces that relationship
  // because combat data changes, this assertion will tell
  // us explicitly rather than silently weakening the test.
  // --------------------------------------------------

  const amauraMedianGain =
    amauraOpportunity
      ?.assessment
      ?.performanceEvidence
      ?.medianPercentGain

  const nihilegoMedianGain =
    nihilegoOpportunity
      ?.assessment
      ?.performanceEvidence
      ?.medianPercentGain

  expectTrue(
    'Amaura fixture has larger relative median gain than Nihilego',
    Number.isFinite(
      amauraMedianGain
    ) &&
    Number.isFinite(
      nihilegoMedianGain
    ) &&
    amauraMedianGain >
      nihilegoMedianGain,
    (
      `Amaura ${amauraMedianGain}%` +
      ` vs Nihilego ${nihilegoMedianGain}%`
    )
  )

  // --------------------------------------------------
  // Corrected collection ranking
  //
  // This is the actual behavior we need to lock.
  //
  // Despite Amaura's larger relative improvement,
  // Nihilego must rank first because the resulting
  // attacker is substantially stronger.
  // --------------------------------------------------

  expectTrue(
    'Nihilego outranks Amaura despite Amaura larger relative gain',
    strengthNihilegoEntry
      ?.rank <
    strengthAmauraEntry
      ?.rank,
    (
      `Amaura rank ${strengthAmauraEntry?.rank}` +
      ` vs Nihilego rank ${strengthNihilegoEntry?.rank}`
    )
  )

  expectEqual(
    'Nihilego is top Raid Strength collection investment',
    strengthResult
      ?.topEntry
      ?.collectionId,
    'NIHILEGO_STRENGTH_TEST'
  )

  // --------------------------------------------------
  // Actionable ranking should use the same corrected
  // resulting-strength policy.
  // --------------------------------------------------

  expectTrue(
    'Amaura strength fixture is actionable',
    Boolean(
      strengthAmauraEntry
        ?.topActionableOpportunity
    )
  )

  expectTrue(
    'Nihilego strength fixture is actionable',
    Boolean(
      strengthNihilegoEntry
        ?.topActionableOpportunity
    )
  )

  const actionableAmaura =
    strengthResult
      .actionableEntries
      .find(
        (entry) =>
          entry.collectionId ===
          'AMAURA_STRENGTH_TEST'
      )

  const actionableNihilego =
    strengthResult
      .actionableEntries
      .find(
        (entry) =>
          entry.collectionId ===
          'NIHILEGO_STRENGTH_TEST'
      )

  expectTrue(
    'Nihilego outranks Amaura in actionable ranking',
    Boolean(
      actionableNihilego
    ) &&
    Boolean(
      actionableAmaura
    ) &&
    actionableNihilego
      .actionableRank <
    actionableAmaura
      .actionableRank,
    (
      `Amaura actionable rank ${actionableAmaura?.actionableRank}` +
      ` vs Nihilego actionable rank ${actionableNihilego?.actionableRank}`
    )
  )

  expectEqual(
    'Nihilego is top actionable Raid Strength investment',
    strengthResult
      ?.topActionableEntry
      ?.collectionId,
    'NIHILEGO_STRENGTH_TEST'
  )

  // --------------------------------------------------
  // Raid Strength evidence contains both role-aware and
  // overall quality measurements.
  // --------------------------------------------------

  expectTrue(
    'Nihilego Raid Strength contains median overall strength',
    Number.isFinite(
      nihilegoOpportunity
        ?.raidStrength
        ?.medianOverallStrengthScore
    )
  )

  expectTrue(
    'Nihilego Raid Strength contains competitive breadth',
    Number.isFinite(
      nihilegoOpportunity
        ?.raidStrength
        ?.competitiveMatchupCount
    )
  )

  expectTrue(
    'Amaura Raid Strength contains median overall strength',
    Number.isFinite(
      amauraOpportunity
        ?.raidStrength
        ?.medianOverallStrengthScore
    )
  )

  // --------------------------------------------------
  // Strength evaluation must not mutate owned candidates
  // --------------------------------------------------

  expectEqual(
    'Raid Strength evaluation does not mutate Amaura Fast Move',
    amauraCandidate
      .moves
      .fast,
    'FROST_BREATH_FAST'
  )

  expectEqual(
    'Raid Strength evaluation does not mutate Nihilego Charged Move',
    nihilegoCandidate
      .moves
      .charged[0],
    'POWER_GEM'
  )

  // --------------------------------------------------
  // Results
  // --------------------------------------------------

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
      'Raid collection investment test failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)