import pokemon from '../src/data/reference/pokemon.json' with { type: 'json' }
import availability from '../src/data/reference/pokemon-availability.json' with { type: 'json' }
import moves from '../src/data/reference/moves-pve.json' with { type: 'json' }
import combat from '../src/data/reference/combat.json' with { type: 'json' }
import raidStrengthReference from '../src/data/reference/raid-strength.json' with { type: 'json' }

import {
  buildRaidCandidates,
} from '../src/engine/Raid/candidates.js'

import {
  compareRaidAttackersDetailed,
} from '../src/engine/Raid/comparison.js'

import {
  buildRaidBenchmarks,
} from '../src/utils/raidBenchmarks.js'

import {
  evaluateRaidStrength,
  RAID_STRENGTH_STATUS,
} from '../src/utils/raidStrength.js'

// --------------------------------------------------
// Raid Strength equivalence validation
//
// Purpose:
//
// Validate that the compact production reference
// produces the same individual Raid Strength evidence
// as the full theoretical-ranking path.
//
// Raid Strength V6 evaluates exact owned/projected
// loadouts.
//
// Therefore representative test states must explicitly
// contain a legal Fast + Charged Move combination.
// The test obtains those loadouts from the full
// theoretical rankings, then supplies the exact same
// state to both evaluation paths.
// --------------------------------------------------

// --------------------------------------------------
// Test helpers
// --------------------------------------------------

let passed = 0
let failed = 0

function pass(
  name
) {
  passed += 1

  console.log(
    `PASS - ${name}`
  )
}

function fail(
  name,
  detail = null
) {
  failed += 1

  console.log(
    `FAIL - ${name}`
  )

  if (detail) {
    console.log(
      `       ${detail}`
    )
  }
}

function expectTrue(
  name,
  condition,
  detail = null
) {
  if (condition) {
    pass(
      name
    )
  } else {
    fail(
      name,
      detail
    )
  }
}

function expectEqual(
  name,
  actual,
  expected
) {
  if (
    actual ===
    expected
  ) {
    pass(
      name
    )
  } else {
    fail(
      name,
      `Expected ${expected}, got ${actual}`
    )
  }
}

function expectApproximatelyEqual(
  name,
  actual,
  expected,
  tolerance = 0.01
) {
  if (
    Number.isFinite(
      actual
    ) &&
    Number.isFinite(
      expected
    ) &&
    Math.abs(
      actual -
      expected
    ) <=
      tolerance
  ) {
    pass(
      name
    )

    return
  }

  if (
    actual ===
      null &&
    expected ===
      null
  ) {
    pass(
      name
    )

    return
  }

  fail(
    name,
    `Expected approximately ${expected}, got ${actual}`
  )
}

// --------------------------------------------------
// Availability helpers
// --------------------------------------------------

function getReleasedShadowCandidateIds() {
  return Object.entries(
    availability
      ?.shadowOverrides ??
    {}
  )
    .filter(
      ([
        ,
        entry,
      ]) =>
        entry?.released ===
          true &&
        entry?.playerUsable ===
          true
    )
    .map(
      ([
        id,
      ]) =>
        id
    )
}

function isPermanentCandidateAvailable(
  candidate
) {
  const availabilityEntry =
    availability
      ?.overrides
      ?.[candidate.id]

  return (
    availabilityEntry
      ?.released ===
        true &&
    availabilityEntry
      ?.playerUsable ===
        true
  )
}

function isTemporaryCandidateAvailable(
  candidate
) {
  const availabilityEntry =
    availability
      ?.temporaryEvolutionOverrides
      ?.[candidate.id]

  return (
    availabilityEntry
      ?.released ===
        true &&
    availabilityEntry
      ?.playerUsable ===
        true
  )
}

function isShadowCandidateAvailable(
  candidate
) {
  const availabilityEntry =
    availability
      ?.shadowOverrides
      ?.[candidate.id]

  return (
    availabilityEntry
      ?.released ===
        true &&
    availabilityEntry
      ?.playerUsable ===
        true
  )
}

function isCandidatePlayerUsable(
  candidate
) {
  const candidateType =
    candidate
      ?.candidateType ??
    candidate
      ?.pokemon
      ?.raidCandidateMetadata
      ?.candidateType

  if (
    candidateType ===
    'TEMPORARY_EVOLUTION'
  ) {
    return (
      isTemporaryCandidateAvailable(
        candidate
      )
    )
  }

  if (
    candidateType ===
    'SHADOW'
  ) {
    return (
      isShadowCandidateAvailable(
        candidate
      )
    )
  }

  return (
    isPermanentCandidateAvailable(
      candidate
    )
  )
}

// --------------------------------------------------
// Combat level CPM
// --------------------------------------------------

function getLevelCpm(
  level
) {
  const cpMultiplier =
    combat
      ?.cpMultipliers
      ?.allLevels
      ?.[String(
        level
      )]

  if (
    !Number.isFinite(
      cpMultiplier
    )
  ) {
    throw new Error(
      `Level ${level} CPM could not be resolved from combat.json.`
    )
  }

  return cpMultiplier
}

// --------------------------------------------------
// Candidate lookup
// --------------------------------------------------

function findCandidate(
  candidates,
  ids
) {
  for (
    const id
    of ids
  ) {
    const candidate =
      candidates.find(
        (entry) =>
          entry?.id ===
          id
      )

    if (candidate) {
      return candidate
    }
  }

  return null
}

// --------------------------------------------------
// Theoretical benchmark universe
// --------------------------------------------------

function buildTheoreticalRankings({
  candidates,
  matchups,
}) {
  const results = []

  for (
    const matchup
    of matchups
  ) {
    const comparison =
      compareRaidAttackersDetailed({
        candidates,

        defender:
          matchup.defender,

        defenderCpMultiplier:
          matchup
            .defender
            .raidBoss
            .cpMultiplier,

        moves,

        combatData:
          combat,
      })

    results.push({
      matchupId:
        matchup.id,

      matchupLabel:
        matchup.label,

      rankings:
        comparison.rankings,

      unsupported:
        comparison.unsupported,

      errors:
        comparison.errors,
    })

    console.log(
      `Ranked ${matchup.label}: ${comparison.rankings.length} attackers`
    )
  }

  return results
}

// --------------------------------------------------
// Representative exact-state loadouts
// --------------------------------------------------

function normalizeRepresentativeLoadout(
  moveset
) {
  const fastMoveId =
    moveset
      ?.fastMoveId

  const chargedMoveId =
    moveset
      ?.chargedMoveId

  if (
    fastMoveId ===
      null ||
    fastMoveId ===
      undefined ||
    fastMoveId ===
      '' ||
    chargedMoveId ===
      null ||
    chargedMoveId ===
      undefined ||
    chargedMoveId ===
      ''
  ) {
    return null
  }

  return {
    fastMoveId:
      String(
        fastMoveId
      ),

    chargedMoveId:
      String(
        chargedMoveId
      ),
  }
}

function getRankingMovesets(
  ranking
) {
  if (
    Array.isArray(
      ranking
        ?.movesetRankings
    ) &&
    ranking
      .movesetRankings
      .length >
      0
  ) {
    return (
      ranking
        .movesetRankings
    )
  }

  if (
    ranking
      ?.bestMoveset
  ) {
    return [
      ranking
        .bestMoveset,
    ]
  }

  return []
}

function findRepresentativeLoadout({
  theoreticalRankings,
  candidate,
}) {
  if (
    !candidate
      ?.id
  ) {
    return null
  }

  for (
    const benchmark
    of theoreticalRankings
  ) {
    const ranking =
      benchmark
        ?.rankings
        ?.find(
          (entry) =>
            entry?.id ===
            candidate.id
        )

    if (!ranking) {
      continue
    }

    for (
      const moveset
      of getRankingMovesets(
        ranking
      )
    ) {
      const loadout =
        normalizeRepresentativeLoadout(
          moveset
        )

      if (loadout) {
        return loadout
      }
    }
  }

  return null
}

// --------------------------------------------------
// Display helpers
// --------------------------------------------------

function printStrength(
  label,
  result,
  prefix
) {
  console.log(
    `${prefix} source: ${result.referenceSource ?? '—'}`
  )

  console.log(
    `${prefix} best strength: ${result.bestStrengthScore?.toFixed(1) ?? '—'} / 100`
  )

  console.log(
    `${prefix} classification: ${result.bestClassification ?? '—'}`
  )

  console.log(
    `${prefix} best matchup: ${result.bestMatchupLabel ?? result.bestMatchupId ?? '—'}`
  )

  console.log(
    `${prefix} best role: ${result.bestRoleType ?? '—'}`
  )

  console.log(
    `${prefix} relevant matchups: ${result.relevantMatchupCount ?? '—'}`
  )

  console.log(
    `${prefix} elite / strong / competitive: ${result.eliteMatchupCount ?? '—'} / ${result.strongMatchupCount ?? '—'} / ${result.competitiveMatchupCount ?? '—'}`
  )

  console.log(
    `${prefix} median relevant strength: ${result.medianStrengthScore?.toFixed(1) ?? '—'} / 100`
  )

  console.log(
    `${prefix} average relevant strength: ${result.averageStrengthScore?.toFixed(1) ?? '—'} / 100`
  )

  console.log(
    `${prefix} best overall benchmark strength: ${result.bestOverallStrengthScore?.toFixed(1) ?? '—'} / 100`
  )
}

// --------------------------------------------------
// Equivalence checks
// --------------------------------------------------

function compareStrengthResults({
  label,
  theoretical,
  compact,
}) {
  expectEqual(
    `${label} compact status matches theoretical`,
    compact.status,
    theoretical.status
  )

  expectEqual(
    `${label} theoretical path reports theoretical source`,
    theoretical.referenceSource,
    'THEORETICAL_RANKINGS'
  )

  expectEqual(
    `${label} compact path reports compact source`,
    compact.referenceSource,
    'COMPACT_REFERENCE'
  )

  if (
    theoretical.status !==
      RAID_STRENGTH_STATUS.SUCCESS ||
    compact.status !==
      RAID_STRENGTH_STATUS.SUCCESS
  ) {
    return
  }

  expectApproximatelyEqual(
    `${label} best strength matches`,
    compact.bestStrengthScore,
    theoretical.bestStrengthScore
  )

  expectEqual(
    `${label} best classification matches`,
    compact.bestClassification,
    theoretical.bestClassification
  )

  expectEqual(
    `${label} best matchup matches`,
    compact.bestMatchupId,
    theoretical.bestMatchupId
  )

  expectEqual(
    `${label} best role matches`,
    compact.bestRoleType,
    theoretical.bestRoleType
  )

  expectApproximatelyEqual(
    `${label} median strength matches`,
    compact.medianStrengthScore,
    theoretical.medianStrengthScore
  )

  expectApproximatelyEqual(
    `${label} average strength matches`,
    compact.averageStrengthScore,
    theoretical.averageStrengthScore
  )

  expectApproximatelyEqual(
    `${label} best overall strength matches`,
    compact.bestOverallStrengthScore,
    theoretical.bestOverallStrengthScore
  )

  expectApproximatelyEqual(
    `${label} median overall strength matches`,
    compact.medianOverallStrengthScore,
    theoretical.medianOverallStrengthScore
  )

  expectApproximatelyEqual(
    `${label} average overall strength matches`,
    compact.averageOverallStrengthScore,
    theoretical.averageOverallStrengthScore
  )

  expectEqual(
    `${label} relevant matchup count matches`,
    compact.relevantMatchupCount,
    theoretical.relevantMatchupCount
  )

  expectEqual(
    `${label} elite matchup count matches`,
    compact.eliteMatchupCount,
    theoretical.eliteMatchupCount
  )

  expectEqual(
    `${label} strong matchup count matches`,
    compact.strongMatchupCount,
    theoretical.strongMatchupCount
  )

  expectEqual(
    `${label} competitive matchup count matches`,
    compact.competitiveMatchupCount,
    theoretical.competitiveMatchupCount
  )

  expectEqual(
    `${label} role count matches`,
    compact.roleCount,
    theoretical.roleCount
  )

  expectTrue(
    `${label} compact relevant matchups are super effective`,
    compact.relevantMatchups.every(
      (matchup) =>
        matchup.relevant ===
          true &&
        Number.isFinite(
          matchup.effectiveness
        ) &&
        matchup.effectiveness >
          1
    )
  )

  expectTrue(
    `${label} breadth counts do not exceed relevant matchups`,
    compact.eliteMatchupCount <=
      compact.relevantMatchupCount &&
    compact.strongMatchupCount <=
      compact.relevantMatchupCount &&
    compact.competitiveMatchupCount <=
      compact.relevantMatchupCount
  )

  expectTrue(
    `${label} compact role summaries exist`,
    Array.isArray(
      compact.roleSummaries
    ) &&
    compact.roleSummaries.length >
      0
  )
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
    'RAID STRENGTH V6'
  )
  console.log(
    'THEORETICAL VS COMPACT REFERENCE'
  )
  console.log(
    '================================'
  )

  // ------------------------------------------------
  // Build theoretical universe
  // ------------------------------------------------

  const level40Cpm =
    getLevelCpm(
      40
    )

  const level50Cpm =
    getLevelCpm(
      50
    )

  console.log('')
  console.log(
    `Level 40 CPM: ${level40Cpm}`
  )

  console.log(
    `Level 50 CPM: ${level50Cpm}`
  )

  const shadowCandidateIds =
    getReleasedShadowCandidateIds()

  console.log(
    `Released Shadow IDs: ${shadowCandidateIds.length}`
  )

  const candidateResult =
    buildRaidCandidates({
      pokemon,

      cpMultiplier:
        level40Cpm,

      shadowCandidateIds,

      shadowAttackMultiplier:
        combat
          ?.modifiers
          ?.shadowAttack ??
        1.2,
    })

  const allCandidates =
    candidateResult
      .candidates

  const usableCandidates =
    allCandidates.filter(
      isCandidatePlayerUsable
    )

  console.log(
    `All generated candidates: ${allCandidates.length}`
  )

  console.log(
    `Player-usable candidates: ${usableCandidates.length}`
  )

  expectTrue(
    'Theoretical universe contains more than 1000 attackers',
    usableCandidates.length >
      1000,
    `Actual count: ${usableCandidates.length}`
  )

  expectTrue(
    'Released Shadow universe contains 475 IDs',
    shadowCandidateIds.length ===
      475,
    `Actual count: ${shadowCandidateIds.length}`
  )

  // ------------------------------------------------
  // Compact reference V2 validation
  // ------------------------------------------------

  expectEqual(
    'Compact reference schema version is 2',
    raidStrengthReference
      ?.schemaVersion,
    2
  )

  expectEqual(
    'Compact reference contains 18 benchmarks',
    Object.keys(
      raidStrengthReference
        ?.benchmarks ??
      {}
    ).length,
    18
  )

  expectEqual(
    'Compact reference Level 40 individual ceiling is level 40',
    raidStrengthReference
      ?.methodology
      ?.individualCeilings
      ?.theoreticalLevel,
    40
  )

  expectApproximatelyEqual(
    'Compact reference Level 40 CPM matches combat data',
    raidStrengthReference
      ?.methodology
      ?.individualCeilings
      ?.cpMultiplier,
    level40Cpm,
    0.0000001
  )

  expectEqual(
    'Compact reference Level 50 type-team benchmark is level 50',
    raidStrengthReference
      ?.methodology
      ?.typeTeamBenchmarks
      ?.theoreticalLevel,
    50
  )

  expectApproximatelyEqual(
    'Compact reference Level 50 CPM matches combat data',
    raidStrengthReference
      ?.methodology
      ?.typeTeamBenchmarks
      ?.cpMultiplier,
    level50Cpm,
    0.0000001
  )

  expectEqual(
    'Compact reference Level 40 candidate count matches current universe',
    raidStrengthReference
      ?.methodology
      ?.level40TheoreticalCandidateCount,
    usableCandidates.length
  )

  expectEqual(
    'Compact reference Shadow count matches current universe',
    raidStrengthReference
      ?.methodology
      ?.releasedShadowCandidateCount,
    shadowCandidateIds.length
  )

  expectEqual(
    'Compact reference type-team size is 6',
    raidStrengthReference
      ?.methodology
      ?.typeTeamBenchmarks
      ?.teamSize,
    6
  )

  expectEqual(
    'Compact reference allows one temporary evolution per type team',
    raidStrengthReference
      ?.methodology
      ?.typeTeamBenchmarks
      ?.maximumTemporaryEvolutions,
    1
  )

  expectEqual(
    'Compact reference role definition matches V2',
    raidStrengthReference
      ?.methodology
      ?.roleDefinition,
    'FAST_OR_CHARGED_MOVE_TYPE'
  )

  // ------------------------------------------------
  // Benchmarks
  // ------------------------------------------------

  const matchups =
    buildRaidBenchmarks()

  console.log('')
  console.log(
    `Benchmark matchups: ${matchups.length}`
  )

  expectEqual(
    '18 type benchmarks exist',
    matchups.length,
    18
  )

  // ------------------------------------------------
  // Full theoretical rankings
  // ------------------------------------------------

  console.log('')
  console.log(
    'Building theoretical benchmark rankings...'
  )

  const theoreticalRankings =
    buildTheoreticalRankings({
      candidates:
        usableCandidates,

      matchups,
    })

  expectEqual(
    'Theoretical ranking exists for every benchmark',
    theoreticalRankings.length,
    matchups.length
  )

  const rankingErrors =
    theoreticalRankings.reduce(
      (
        total,
        entry
      ) =>
        total +
        (
          entry.errors
            ?.length ??
          0
        ),
      0
    )

  expectEqual(
    'No unexpected theoretical ranking errors',
    rankingErrors,
    0
  )

  // ------------------------------------------------
  // Representatives
  // ------------------------------------------------

  const amaura =
    findCandidate(
      usableCandidates,
      [
        'AMAURA',
      ]
    )

  const aurorus =
    findCandidate(
      usableCandidates,
      [
        'AURORUS',
      ]
    )

  const nihilego =
    findCandidate(
      usableCandidates,
      [
        'NIHILEGO',
      ]
    )

  const mewtwo =
    findCandidate(
      usableCandidates,
      [
        'MEWTWO',
      ]
    )

  const shadowMewtwo =
    findCandidate(
      usableCandidates,
      [
        'MEWTWO__SHADOW',
      ]
    )

  const megaRayquaza =
    findCandidate(
      usableCandidates,
      [
        'RAYQUAZA__TEMP_EVOLUTION_MEGA',
        'RAYQUAZA__NORMAL__TEMP_EVOLUTION_MEGA',
      ]
    )

  expectTrue(
    'Amaura candidate exists',
    Boolean(
      amaura
    )
  )

  expectTrue(
    'Aurorus candidate exists',
    Boolean(
      aurorus
    )
  )

  expectTrue(
    'Nihilego candidate exists',
    Boolean(
      nihilego
    )
  )

  expectTrue(
    'Mewtwo candidate exists',
    Boolean(
      mewtwo
    )
  )

  expectTrue(
    'Shadow Mewtwo candidate exists',
    Boolean(
      shadowMewtwo
    )
  )

  expectTrue(
    'Mega Rayquaza candidate exists',
    Boolean(
      megaRayquaza
    )
  )

  const representatives = [
    {
      label:
        'Amaura',

      candidate:
        amaura,
    },

    {
      label:
        'Aurorus',

      candidate:
        aurorus,
    },

    {
      label:
        'Nihilego',

      candidate:
        nihilego,
    },

    {
      label:
        'Mewtwo',

      candidate:
        mewtwo,
    },

    {
      label:
        'Shadow Mewtwo',

      candidate:
        shadowMewtwo,
    },

    {
      label:
        'Mega Rayquaza',

      candidate:
        megaRayquaza,
    },
  ].map(
    (
      representative
    ) => ({
      ...representative,

      loadout:
        findRepresentativeLoadout({
          theoreticalRankings,

          candidate:
            representative
              .candidate,
        }),
    })
  )

  for (
    const representative
    of representatives
  ) {
    expectTrue(
      `${representative.label} representative loadout exists`,
      Boolean(
        representative
          .loadout
      ),
      representative
        .candidate
        ?.id
        ? `No ranked loadout found for ${representative.candidate.id}`
        : 'Representative candidate is missing'
    )

    if (
      representative
        .loadout
    ) {
      console.log(
        `${representative.label} test loadout: ${representative.loadout.fastMoveId} + ${representative.loadout.chargedMoveId}`
      )
    }
  }

  const theoreticalStrengthResults =
    new Map()

  const compactStrengthResults =
    new Map()

  // ------------------------------------------------
  // Evaluate both paths
  //
  // V6 requires exact state moves.
  //
  // Both paths receive the identical candidate and
  // identical explicit loadout. Only the theoretical
  // ceiling source differs.
  // ------------------------------------------------

  for (
    const representative
    of representatives
  ) {
    if (
      !representative
        .candidate ||
      !representative
        .loadout
    ) {
      continue
    }

    const state = {
      candidate:
        representative
          .candidate,

      loadouts: [
        representative
          .loadout,
      ],
    }

    const theoreticalResult =
      evaluateRaidStrength({
        state,

        matchups,

        theoreticalRankings,

        moves,

        combatData:
          combat,
      })

    const compactResult =
      evaluateRaidStrength({
        state,

        matchups,

        strengthReference:
          raidStrengthReference,

        moves,

        combatData:
          combat,
      })

    theoreticalStrengthResults.set(
      representative.label,
      theoreticalResult
    )

    compactStrengthResults.set(
      representative.label,
      compactResult
    )

    console.log('')
    console.log(
      '--------------------------------'
    )
    console.log(
      representative.label
    )
    console.log(
      '--------------------------------'
    )

    console.log(
      `Exact loadout: ${representative.loadout.fastMoveId} + ${representative.loadout.chargedMoveId}`
    )

    printStrength(
      representative.label,
      theoreticalResult,
      'FULL'
    )

    printStrength(
      representative.label,
      compactResult,
      'COMPACT'
    )

    expectEqual(
      `${representative.label} theoretical evaluation succeeds`,
      theoreticalResult.status,
      RAID_STRENGTH_STATUS.SUCCESS
    )

    expectEqual(
      `${representative.label} compact evaluation succeeds`,
      compactResult.status,
      RAID_STRENGTH_STATUS.SUCCESS
    )

    compareStrengthResults({
      label:
        representative.label,

      theoretical:
        theoreticalResult,

      compact:
        compactResult,
    })
  }

  // ------------------------------------------------
  // Broad sanity relationships
  // ------------------------------------------------

  const compactAmaura =
    compactStrengthResults.get(
      'Amaura'
    )

  const compactNihilego =
    compactStrengthResults.get(
      'Nihilego'
    )

  const compactMewtwo =
    compactStrengthResults.get(
      'Mewtwo'
    )

  const compactShadowMewtwo =
    compactStrengthResults.get(
      'Shadow Mewtwo'
    )

  const compactMegaRayquaza =
    compactStrengthResults.get(
      'Mega Rayquaza'
    )

  if (
    compactAmaura &&
    compactNihilego &&
    compactAmaura.status ===
      RAID_STRENGTH_STATUS.SUCCESS &&
    compactNihilego.status ===
      RAID_STRENGTH_STATUS.SUCCESS
  ) {
    expectTrue(
      'Compact Nihilego has greater raid strength than Amaura',
      compactNihilego
        .bestStrengthScore >
      compactAmaura
        .bestStrengthScore,
      `Amaura ${compactAmaura.bestStrengthScore} vs Nihilego ${compactNihilego.bestStrengthScore}`
    )
  }

  if (
    compactMewtwo &&
    compactShadowMewtwo &&
    compactMewtwo.status ===
      RAID_STRENGTH_STATUS.SUCCESS &&
    compactShadowMewtwo.status ===
      RAID_STRENGTH_STATUS.SUCCESS
  ) {
    expectTrue(
      'Compact Shadow Mewtwo has at least as much raid strength as Mewtwo',
      compactShadowMewtwo
        .bestStrengthScore >=
      compactMewtwo
        .bestStrengthScore,
      `Mewtwo ${compactMewtwo.bestStrengthScore} vs Shadow ${compactShadowMewtwo.bestStrengthScore}`
    )
  }

  if (
    compactMegaRayquaza &&
    compactMegaRayquaza.status ===
      RAID_STRENGTH_STATUS.SUCCESS
  ) {
    expectTrue(
      'Mega Rayquaza only counts actually relevant matchups',
      compactMegaRayquaza
        .relevantMatchupCount >
        0 &&
      compactMegaRayquaza
        .relevantMatchupCount <
        18,
      `Relevant matchups: ${compactMegaRayquaza.relevantMatchupCount}`
    )

    expectTrue(
      'Mega Rayquaza does not have 18 Elite matchups',
      compactMegaRayquaza
        .eliteMatchupCount <
        18,
      `Elite matchups: ${compactMegaRayquaza.eliteMatchupCount}`
    )
  }

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

    console.log(
      'Compact Raid Strength reference matches the full theoretical ranking path for exact V6 states.'
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
      'Raid Strength V6 equivalence test failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)