import fs from 'node:fs/promises'
import path from 'node:path'
import {
  fileURLToPath,
} from 'node:url'

import {
  buildRaidCandidates,
  RAID_CANDIDATE_TYPE,
} from '../src/engine/raid/candidates.js'

// --------------------------------------------------
// Paths
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

// --------------------------------------------------
// Test state
// --------------------------------------------------

let passed = 0
let failed = 0

// --------------------------------------------------
// Test helpers
// --------------------------------------------------

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
  if (
    value ===
    true
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
    '   Expected: true'
  )

  console.log(
    `   Actual:   ${value}`
  )
}

// --------------------------------------------------
// File helpers
// --------------------------------------------------

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

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  console.log(
    'Testing PokeIQ Shadow Raid Candidates...'
  )

  const [
    pokemon,
    combat,
    availability,
  ] =
    await Promise.all([
      readJson(
        'pokemon.json'
      ),

      readJson(
        'combat.json'
      ),

      readJson(
        'pokemon-availability.json'
      ),
    ])

  const level40Cpm =
    combat
      .cpMultipliers
      .allLevels['40']

  const shadowAttackMultiplier =
    combat
      .modifiers
      .shadowAttack

  if (
    !Number.isFinite(
      level40Cpm
    )
  ) {
    throw new Error(
      'Level 40 CPM not found.'
    )
  }

  if (
    !Number.isFinite(
      shadowAttackMultiplier
    )
  ) {
    throw new Error(
      'Shadow Attack multiplier not found.'
    )
  }

  const shadowOverrides =
    availability
      ?.shadowOverrides ??
    {}

  const shadowCandidateIds =
    Object.entries(
      shadowOverrides
    )
      .filter(
        ([
          ,
          value,
        ]) =>
          value
            ?.playerUsable ===
          true
      )
      .map(
        ([
          id,
        ]) =>
          id
      )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'SHADOW AVAILABILITY INPUT'
  )
  console.log(
    '================================'
  )

  console.log(
    `Released Shadow IDs: ${shadowCandidateIds.length}`
  )

  console.log(
    `Shadow Attack multiplier: ${shadowAttackMultiplier}`
  )

  // ------------------------------------------------
  // Build candidate universe
  // ------------------------------------------------

  const result =
    buildRaidCandidates({
      pokemon,

      cpMultiplier:
        level40Cpm,

      shadowCandidateIds,

      shadowAttackMultiplier,
    })

  const {
    candidates,
    permanentCandidates,
    temporaryEvolutionCandidates,
    shadowCandidates,
    unmatchedShadowCandidateIds,
    metadata,
  } =
    result

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'CANDIDATE SUMMARY'
  )
  console.log(
    '================================'
  )

  console.log(
    `Permanent candidates: ${permanentCandidates.length}`
  )

  console.log(
    `Temporary evolution candidates: ${temporaryEvolutionCandidates.length}`
  )

  console.log(
    `Shadow candidates: ${shadowCandidates.length}`
  )

  console.log(
    `Unmatched Shadow IDs: ${unmatchedShadowCandidateIds.length}`
  )

  console.log(
    `Total candidates: ${candidates.length}`
  )

  // ------------------------------------------------
  // Known Shadow candidate
  // ------------------------------------------------

  const shadowMamoswine =
    shadowCandidates.find(
      (candidate) =>
        candidate.id ===
        'MAMOSWINE__SHADOW'
    )

  const normalMamoswine =
    permanentCandidates.find(
      (candidate) =>
        candidate.id ===
        'MAMOSWINE'
    )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'SHADOW MAMOSWINE'
  )
  console.log(
    '================================'
  )

  if (
    shadowMamoswine
  ) {
    console.log(
      `ID: ${shadowMamoswine.id}`
    )

    console.log(
      `Label: ${shadowMamoswine.label}`
    )

    console.log(
      `Attack: ${shadowMamoswine.pokemon.stats.attack}`
    )

    console.log(
      `Defense: ${shadowMamoswine.pokemon.stats.defense}`
    )

    console.log(
      `Stamina: ${shadowMamoswine.pokemon.stats.stamina}`
    )

    console.log(
      `Types: ${shadowMamoswine.pokemon.types.join(' / ')}`
    )

    console.log(
      `Modifiers: ${JSON.stringify(
        shadowMamoswine
          .attackerModifiers
      )}`
    )

    console.log(
      `Candidate Type: ${
        shadowMamoswine
          .pokemon
          .raidCandidateMetadata
          ?.candidateType
      }`
    )

    console.log(
      `Source Candidate: ${
        shadowMamoswine
          .pokemon
          .raidCandidateMetadata
          ?.shadow
          ?.sourceCandidateId
      }`
    )
  } else {
    console.log(
      'Shadow Mamoswine not found.'
    )
  }

  // ------------------------------------------------
  // Forbidden Shadow combinations
  // ------------------------------------------------

  const shadowTemporaryCandidates =
    shadowCandidates.filter(
      (candidate) =>
        candidate.id.includes(
          'TEMP_EVOLUTION'
        )
    )

  const duplicateShadowSuffixes =
    shadowCandidates.filter(
      (candidate) =>
        candidate.id.includes(
          '__SHADOW__SHADOW'
        )
    )

  // ------------------------------------------------
  // Regression tests
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'REGRESSION TESTS'
  )
  console.log(
    '================================'
  )

  expectEqual(
    'Released Shadow availability count',
    shadowCandidateIds.length,
    475
  )

  expectEqual(
    'Permanent candidate count remains unchanged',
    permanentCandidates.length,
    1189
  )

  expectEqual(
    'Temporary evolution count remains unchanged',
    temporaryEvolutionCandidates.length,
    51
  )

  expectEqual(
    'Shadow candidate count',
    shadowCandidates.length,
    475
  )

  expectEqual(
    'No Shadow availability IDs are unmatched',
    unmatchedShadowCandidateIds.length,
    0
  )

  expectEqual(
    'Total candidate count with Shadows',
    candidates.length,
    1715
  )

  expectEqual(
    'Metadata Shadow candidate count',
    metadata.shadowCandidateCount,
    475
  )

  expectEqual(
    'Metadata total candidate count',
    metadata.totalCandidateCount,
    1715
  )

  expectTrue(
    'Shadow Mamoswine exists',
    Boolean(
      shadowMamoswine
    )
  )

  expectTrue(
    'Normal Mamoswine exists',
    Boolean(
      normalMamoswine
    )
  )

  expectEqual(
    'Shadow Mamoswine candidate type',
    shadowMamoswine
      ?.pokemon
      ?.raidCandidateMetadata
      ?.candidateType,
    RAID_CANDIDATE_TYPE
      .SHADOW
  )

  expectEqual(
    'Shadow Mamoswine source candidate ID',
    shadowMamoswine
      ?.pokemon
      ?.raidCandidateMetadata
      ?.shadow
      ?.sourceCandidateId,
    'MAMOSWINE'
  )

  expectEqual(
    'Shadow Mamoswine Attack matches normal',
    shadowMamoswine
      ?.pokemon
      ?.stats
      ?.attack,
    normalMamoswine
      ?.pokemon
      ?.stats
      ?.attack
  )

  expectEqual(
    'Shadow Mamoswine Defense matches normal',
    shadowMamoswine
      ?.pokemon
      ?.stats
      ?.defense,
    normalMamoswine
      ?.pokemon
      ?.stats
      ?.defense
  )

  expectEqual(
    'Shadow Mamoswine Stamina matches normal',
    shadowMamoswine
      ?.pokemon
      ?.stats
      ?.stamina,
    normalMamoswine
      ?.pokemon
      ?.stats
      ?.stamina
  )

  expectEqual(
    'Shadow Mamoswine Fast Move pool matches normal',
    JSON.stringify(
      shadowMamoswine
        ?.pokemon
        ?.moves
        ?.fast
    ),
    JSON.stringify(
      normalMamoswine
        ?.pokemon
        ?.moves
        ?.fast
    )
  )

  expectEqual(
    'Shadow Mamoswine Charged Move pool matches normal',
    JSON.stringify(
      shadowMamoswine
        ?.pokemon
        ?.moves
        ?.charged
    ),
    JSON.stringify(
      normalMamoswine
        ?.pokemon
        ?.moves
        ?.charged
    )
  )

  expectEqual(
    'Shadow Mamoswine has one attacker modifier',
    shadowMamoswine
      ?.attackerModifiers
      ?.length,
    1
  )

  expectEqual(
    'Shadow Mamoswine uses Shadow Attack multiplier',
    shadowMamoswine
      ?.attackerModifiers
      ?.[0],
    shadowAttackMultiplier
  )

  expectEqual(
    'No Shadow temporary-evolution candidates generated',
    shadowTemporaryCandidates.length,
    0
  )

  expectEqual(
    'No duplicate Shadow suffix candidates generated',
    duplicateShadowSuffixes.length,
    0
  )

  // ------------------------------------------------
  // Other known Shadows
  // ------------------------------------------------

  const knownShadowIds = [
    'MEWTWO__SHADOW',
    'TYRANITAR__SHADOW',
    'SALAMENCE__SHADOW',
    'GARDEVOIR__SHADOW',
    'GARCHOMP__SHADOW',
    'DRAGONITE__SHADOW',
    'MOLTRES__SHADOW',
    'RAIKOU__SHADOW',
  ]

  for (
    const id
    of knownShadowIds
  ) {
    expectTrue(
      `${id} exists`,
      shadowCandidates.some(
        (candidate) =>
          candidate.id ===
          id
      )
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
      'Shadow Raid Candidate validation successful.'
    )
  } else {
    console.log(
      `❌ ${failed} test(s) failed.`
    )

    process.exitCode = 1
  }
}

// --------------------------------------------------
// Run
// --------------------------------------------------

main().catch(
  (error) => {
    console.error('')

    console.error(
      'Shadow raid candidate test failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)