import fs from 'node:fs/promises'
import path from 'node:path'
import {
  fileURLToPath,
} from 'node:url'

import {
  buildRaidCandidates,
  RAID_CANDIDATE_TYPE,
} from '../src/engine/raid/candidates.js'

import {
  filterPlayerUsablePokemon,
} from '../src/engine/pokemon/availability.js'

import {
  resolveTemporaryEvolution,
} from '../src/engine/pokemon/transform.js'

import {
  createRaidBoss,
} from '../src/engine/raid/boss.js'

import {
  compareRaidAttackersDetailed,
  RAID_ATTACKER_EVALUATION_STATUS,
} from '../src/engine/raid/comparison.js'

// --------------------------------------------------
// Expected dataset snapshot
// --------------------------------------------------

const EXPECTED = {
  rawReferenceRecords:
    1489,

  permanentCandidates:
    1189,

  temporaryEvolutionCandidates:
    51,

  shadowCandidates:
    475,

  totalCandidates:
    1715,

  permanentRejectedRecords:
    1,

  malformedTemporaryRecords:
    3,

  unmatchedShadowCandidateIds:
    0,

  collapsedCombatEquivalentRecords:
    299,

  playerUsablePermanentCandidates:
    1074,

  playerUsableTemporaryCandidates:
    51,

  playerUsableShadowCandidates:
    475,

  totalPlayerUsableCandidates:
    1600,

  successfulEvaluations:
    1599,

  unsupportedEvaluations:
    1,

  errorEvaluations:
    0,
}

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
    value === true
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
// Display helpers
// --------------------------------------------------

function formatRank(
  rank
) {
  return String(
    rank
  ).padStart(
    3
  )
}

function formatDps(
  value
) {
  return value
    .toFixed(
      6
    )
    .padStart(
      10
    )
}

function formatLabel(
  value
) {
  return String(
    value
  ).padEnd(
    36
  )
}

function formatMove(
  value
) {
  return String(
    value
  ).padEnd(
    24
  )
}

function buildMoveDisplayLookup(
  moves
) {
  return new Map(
    moves.map(
      (move) => [
        move.id,

        move.displayId ??
        move.id,
      ]
    )
  )
}

function getMoveDisplayId(
  moveId,
  moveDisplayLookup
) {
  if (!moveId) {
    return moveId
  }

  return (
    moveDisplayLookup.get(
      moveId
    ) ??
    moveId
  )
}

// --------------------------------------------------
// Candidate-type helpers
// --------------------------------------------------

function getCandidateType(
  candidate
) {
  return (
    candidate
      ?.pokemon
      ?.raidCandidateMetadata
      ?.candidateType ??
    null
  )
}

function isTemporaryEvolutionCandidate(
  candidate
) {
  return (
    getCandidateType(
      candidate
    ) ===
    RAID_CANDIDATE_TYPE
      .TEMPORARY_EVOLUTION
  )
}

function isShadowCandidate(
  candidate
) {
  return (
    getCandidateType(
      candidate
    ) ===
    RAID_CANDIDATE_TYPE
      .SHADOW
  )
}

function isPermanentCandidate(
  candidate
) {
  return (
    !isTemporaryEvolutionCandidate(
      candidate
    ) &&
    !isShadowCandidate(
      candidate
    )
  )
}

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  console.log(
    'Testing PokeIQ Full Raid Ranking...'
  )

  const [
    pokemon,
    moves,
    combat,
    availability,
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

      readJson(
        'pokemon-availability.json'
      ),
    ])

  const moveDisplayLookup =
    buildMoveDisplayLookup(
      moves
    )

  // ------------------------------------------------
  // Attacker CPM
  // ------------------------------------------------

  const level40Cpm =
    combat
      .cpMultipliers
      .allLevels['40']

  if (
    !Number.isFinite(
      level40Cpm
    )
  ) {
    throw new Error(
      'Level 40 CPM not found.'
    )
  }

  // ------------------------------------------------
  // Shadow configuration
  // ------------------------------------------------

  const shadowAttackMultiplier =
    combat
      ?.modifiers
      ?.shadowAttack

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

  // ------------------------------------------------
  // Candidate universe
  // ------------------------------------------------

  const candidateResult =
    buildRaidCandidates({
      pokemon,

      cpMultiplier:
        level40Cpm,

      shadowCandidateIds,

      shadowAttackMultiplier,
    })

  const {
    candidates:
      allCandidates,

    permanentCandidates =
      [],

    temporaryEvolutionCandidates =
      [],

    shadowCandidates =
      [],

    unmatchedShadowCandidateIds =
      [],

    rejected,

    collapsed,

    metadata,
  } =
    candidateResult

  const permanentRejected =
    rejected.filter(
      (entry) =>
        entry.candidateType !==
        'TEMPORARY_EVOLUTION'
    )

  const malformedTemporaryRecords =
    rejected.filter(
      (entry) =>
        entry.candidateType ===
        'TEMPORARY_EVOLUTION'
    )

  // ------------------------------------------------
  // Availability filtering
  // ------------------------------------------------

  const usableCandidates =
    filterPlayerUsablePokemon(
      allCandidates,
      availability
    )

  const usablePermanentCandidates =
    usableCandidates.filter(
      (candidate) =>
        isPermanentCandidate(
          candidate
        )
    )

  const usableTemporaryCandidates =
    usableCandidates.filter(
      (candidate) =>
        isTemporaryEvolutionCandidate(
          candidate
        )
    )

  const usableShadowCandidates =
    usableCandidates.filter(
      (candidate) =>
        isShadowCandidate(
          candidate
        )
    )

  // ------------------------------------------------
  // Attacker universe output
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'ATTACKER UNIVERSE'
  )
  console.log(
    '================================'
  )

  console.log(
    `Raw reference records: ${pokemon.length}`
  )

  console.log(
    `Permanent raid candidates: ${permanentCandidates.length}`
  )

  console.log(
    `Temporary evolution candidates: ${temporaryEvolutionCandidates.length}`
  )

  console.log(
    `Shadow candidates: ${shadowCandidates.length}`
  )

  console.log(
    `Total combat-distinct candidates: ${allCandidates.length}`
  )

  console.log(
    `Rejected permanent records: ${permanentRejected.length}`
  )

  console.log(
    `Malformed temporary records: ${malformedTemporaryRecords.length}`
  )

  console.log(
    `Unmatched Shadow IDs: ${unmatchedShadowCandidateIds.length}`
  )

  console.log(
    `Combat-equivalent records collapsed: ${collapsed.length}`
  )

  console.log(
    `Player-usable permanent candidates: ${usablePermanentCandidates.length}`
  )

  console.log(
    `Player-usable temporary candidates: ${usableTemporaryCandidates.length}`
  )

  console.log(
    `Player-usable Shadow candidates: ${usableShadowCandidates.length}`
  )

  console.log(
    `Total player-usable candidates: ${usableCandidates.length}`
  )

  console.log(
    `Shadow Attack multiplier: ${shadowAttackMultiplier}`
  )

  // ------------------------------------------------
  // Malformed temporary records
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'MALFORMED TEMPORARY RECORDS'
  )
  console.log(
    '================================'
  )

  if (
    malformedTemporaryRecords.length ===
    0
  ) {
    console.log('')
    console.log(
      'None'
    )
  } else {
    for (
      const entry
      of malformedTemporaryRecords
    ) {
      console.log('')
      console.log(
        `${entry.id} [${entry.form}]`
      )

      console.log(
        `Temporary ID: ${entry.temporaryEvolutionId ?? 'NULL'}`
      )

      console.log(
        `Reason: ${entry.reasons.join(', ')}`
      )
    }
  }

  // ------------------------------------------------
  // Unmatched Shadow IDs
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'UNMATCHED SHADOW IDS'
  )
  console.log(
    '================================'
  )

  if (
    unmatchedShadowCandidateIds.length ===
    0
  ) {
    console.log('')
    console.log(
      'None'
    )
  } else {
    for (
      const id
      of unmatchedShadowCandidateIds
    ) {
      console.log(
        id
      )
    }
  }

  // ------------------------------------------------
  // Mega Rayquaza boss
  // ------------------------------------------------

  const baseRayquaza =
    pokemon.find(
      (entry) =>
        entry.id ===
          'RAYQUAZA' &&
        entry.form ===
          'NORMAL'
    )

  if (
    !baseRayquaza
  ) {
    throw new Error(
      'Base Rayquaza reference record not found.'
    )
  }

  const megaRayquaza =
    resolveTemporaryEvolution(
      baseRayquaza,
      'TEMP_EVOLUTION_MEGA'
    )

  const megaRaidProfile = {
    id:
      'MEGA',

    name:
      'Mega Raid',

    bossHp:
      9000,

    cpMultiplier:
      0.79,

    timerSeconds:
      300,
  }

  const boss =
    createRaidBoss({
      pokemon:
        megaRayquaza,

      raidProfile:
        megaRaidProfile,
    })

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'MEGA RAYQUAZA RAID BOSS'
  )
  console.log(
    '================================'
  )

  console.log(
    `Attack: ${boss.stats.attack}`
  )

  console.log(
    `Defense: ${boss.stats.defense}`
  )

  console.log(
    `Stamina: ${boss.stats.stamina}`
  )

  console.log(
    `Types: ${boss.types.join(' / ')}`
  )

  console.log(
    `Raid HP: ${boss.raidBoss.hp}`
  )

  console.log(
    `Raid CPM: ${boss.raidBoss.cpMultiplier}`
  )

  console.log(
    `Timer: ${boss.raidBoss.timerSeconds}s`
  )

  // ------------------------------------------------
  // Full roster evaluation
  // ------------------------------------------------

  console.log('')
  console.log(
    'Ranking all player-usable raid attackers...'
  )

  const comparison =
    compareRaidAttackersDetailed({
      candidates:
        usableCandidates,

      defender:
        boss,

      defenderCpMultiplier:
        boss
          .raidBoss
          .cpMultiplier,

      moves,

      combatData:
        combat,
    })

  const {
    rankings,
    unsupported,
    errors,
  } =
    comparison

  // ------------------------------------------------
  // Evaluation summary
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'FULL ROSTER EVALUATION'
  )
  console.log(
    '================================'
  )

  console.log(
    `Player-usable candidates: ${comparison.totalCandidates}`
  )

  console.log(
    `Successfully ranked: ${comparison.successfulEvaluations}`
  )

  console.log(
    `Unsupported mechanics: ${comparison.unsupportedEvaluations}`
  )

  console.log(
    `Unexpected errors: ${comparison.errorEvaluations}`
  )

  // ------------------------------------------------
  // Unsupported mechanics
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'UNSUPPORTED DYNAMIC MECHANICS'
  )
  console.log(
    '================================'
  )

  if (
    unsupported.length ===
    0
  ) {
    console.log('')
    console.log(
      'None'
    )
  }

  for (
    const result
    of unsupported
  ) {
    console.log('')
    console.log(
      '--------------------------------'
    )

    console.log(
      `${result.id} | ${result.label}`
    )

    console.log(
      `Form: ${result.form ?? 'NORMAL'}`
    )

    console.log(
      `Status: ${result.status}`
    )

    for (
      const mechanic
      of result.unsupportedMechanics ??
      []
    ) {
      console.log(
        `Move: ${
          getMoveDisplayId(
            mechanic.moveId,
            moveDisplayLookup
          )
        }`
      )

      console.log(
        `Move Type: ${mechanic.moveType}`
      )

      console.log(
        `Reason: ${mechanic.reason}`
      )
    }
  }

  // ------------------------------------------------
  // Unexpected errors
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'UNEXPECTED EVALUATION ERRORS'
  )
  console.log(
    '================================'
  )

  if (
    errors.length ===
    0
  ) {
    console.log('')
    console.log(
      'None'
    )
  }

  for (
    const result
    of errors.slice(
      0,
      40
    )
  ) {
    console.log('')
    console.log(
      '--------------------------------'
    )

    console.log(
      `${result.id} | ${result.label}`
    )

    console.log(
      `Form: ${result.form ?? 'NORMAL'}`
    )

    console.log(
      `Status: ${result.status}`
    )

    console.log(
      `Error: ${result.error?.message ?? 'Unknown error'}`
    )
  }

  if (
    errors.length >
    40
  ) {
    console.log('')
    console.log(
      `...and ${errors.length - 40} more errors`
    )
  }

  // ------------------------------------------------
  // Top 25 overall
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'TOP 25 — STATICALLY RANKABLE ATTACKERS'
  )
  console.log(
    '================================'
  )

  console.log('')

  for (
    const result
    of rankings.slice(
      0,
      25
    )
  ) {
    console.log(
      `${formatRank(result.rank)}. ` +
      `${formatLabel(result.label)} | ` +
      `${formatMove(
        getMoveDisplayId(
          result.bestMoveset.fastMoveId,
          moveDisplayLookup
        )
      )} + ` +
      `${formatMove(
        getMoveDisplayId(
          result.bestMoveset.chargedMoveId,
          moveDisplayLookup
        )
      )} | ` +
      `${formatDps(result.bestMoveset.cycleDps)} DPS | ` +
      `${result.bestMoveset.availability}`
    )
  }

  // ------------------------------------------------
  // Normal moveset ranking
  // ------------------------------------------------

  const normalRankings =
    rankings
      .filter(
        (result) =>
          result.bestNormalMoveset !==
          null
      )
      .sort(
        (a, b) =>
          b
            .bestNormalMoveset
            .cycleDps -
          a
            .bestNormalMoveset
            .cycleDps
      )
      .map(
        (result, index) => ({
          normalRank:
            index + 1,

          ...result,
        })
      )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'TOP 25 — NORMAL MOVESETS ONLY'
  )
  console.log(
    '================================'
  )

  console.log('')

  for (
    const result
    of normalRankings.slice(
      0,
      25
    )
  ) {
    console.log(
      `${formatRank(result.normalRank)}. ` +
      `${formatLabel(result.label)} | ` +
      `${formatMove(
        getMoveDisplayId(
          result.bestNormalMoveset.fastMoveId,
          moveDisplayLookup
        )
      )} + ` +
      `${formatMove(
        getMoveDisplayId(
          result.bestNormalMoveset.chargedMoveId,
          moveDisplayLookup
        )
      )} | ` +
      `${formatDps(result.bestNormalMoveset.cycleDps)} DPS`
    )
  }

  // ------------------------------------------------
  // Shadow-only ranking
  // ------------------------------------------------

  const shadowRankings =
    rankings.filter(
      (result) =>
        result.id
          ?.endsWith(
            '__SHADOW'
          )
    )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'TOP 25 — SHADOW ATTACKERS'
  )
  console.log(
    '================================'
  )

  console.log('')

  for (
    const result
    of shadowRankings.slice(
      0,
      25
    )
  ) {
    console.log(
      `${formatRank(result.rank)}. ` +
      `${formatLabel(result.label)} | ` +
      `${formatMove(
        getMoveDisplayId(
          result.bestMoveset.fastMoveId,
          moveDisplayLookup
        )
      )} + ` +
      `${formatMove(
        getMoveDisplayId(
          result.bestMoveset.chargedMoveId,
          moveDisplayLookup
        )
      )} | ` +
      `${formatDps(result.bestMoveset.cycleDps)} DPS | ` +
      `${result.bestMoveset.availability}`
    )
  }

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
    'Raw reference record count',
    pokemon.length,
    EXPECTED.rawReferenceRecords
  )

  expectEqual(
    'Permanent raid candidate count',
    permanentCandidates.length,
    EXPECTED.permanentCandidates
  )

  expectEqual(
    'Temporary evolution candidate count',
    temporaryEvolutionCandidates.length,
    EXPECTED.temporaryEvolutionCandidates
  )

  expectEqual(
    'Shadow candidate count',
    shadowCandidates.length,
    EXPECTED.shadowCandidates
  )

  expectEqual(
    'Total combat-distinct candidate count',
    allCandidates.length,
    EXPECTED.totalCandidates
  )

  expectEqual(
    'Rejected permanent record count',
    permanentRejected.length,
    EXPECTED.permanentRejectedRecords
  )

  expectEqual(
    'Malformed temporary record count',
    malformedTemporaryRecords.length,
    EXPECTED.malformedTemporaryRecords
  )

  expectEqual(
    'Unmatched Shadow availability ID count',
    unmatchedShadowCandidateIds.length,
    EXPECTED.unmatchedShadowCandidateIds
  )

  expectEqual(
    'Combat-equivalent candidate count',
    collapsed.length,
    EXPECTED.collapsedCombatEquivalentRecords
  )

  expectEqual(
    'Candidate metadata Shadow count',
    metadata
      ?.shadowCandidateCount,
    EXPECTED.shadowCandidates
  )

  expectEqual(
    'Candidate metadata total count',
    metadata
      ?.totalCandidateCount,
    EXPECTED.totalCandidates
  )

  expectEqual(
    'Player-usable permanent candidate count',
    usablePermanentCandidates.length,
    EXPECTED.playerUsablePermanentCandidates
  )

  expectEqual(
    'Player-usable temporary candidate count',
    usableTemporaryCandidates.length,
    EXPECTED.playerUsableTemporaryCandidates
  )

  expectEqual(
    'Player-usable Shadow candidate count',
    usableShadowCandidates.length,
    EXPECTED.playerUsableShadowCandidates
  )

  expectEqual(
    'Total player-usable candidate count',
    usableCandidates.length,
    EXPECTED.totalPlayerUsableCandidates
  )

  // ------------------------------------------------
  // Temporary-evolution regression
  // ------------------------------------------------

  const megaRayquazaCandidate =
    usableCandidates.find(
      (candidate) =>
        candidate.id ===
        'RAYQUAZA__TEMP_EVOLUTION_MEGA'
    )

  expectTrue(
    'Mega Rayquaza exists in player-usable attacker universe',
    Boolean(
      megaRayquazaCandidate
    )
  )

  const primalGroudonCandidate =
    usableCandidates.find(
      (candidate) =>
        candidate.id ===
        'GROUDON__TEMP_EVOLUTION_PRIMAL'
    )

  expectTrue(
    'Primal Groudon exists in player-usable attacker universe',
    Boolean(
      primalGroudonCandidate
    )
  )

  const primalKyogreCandidate =
    usableCandidates.find(
      (candidate) =>
        candidate.id ===
        'KYOGRE__TEMP_EVOLUTION_PRIMAL'
    )

  expectTrue(
    'Primal Kyogre exists in player-usable attacker universe',
    Boolean(
      primalKyogreCandidate
    )
  )

  expectEqual(
    'Mega Rayquaza candidate Attack',
    megaRayquazaCandidate
      ?.pokemon
      ?.stats
      ?.attack,
    377
  )

  expectEqual(
    'Mega Rayquaza candidate Defense',
    megaRayquazaCandidate
      ?.pokemon
      ?.stats
      ?.defense,
    210
  )

  expectEqual(
    'Mega Rayquaza candidate required move',
    megaRayquazaCandidate
      ?.pokemon
      ?.raidCandidateMetadata
      ?.temporaryEvolution
      ?.requirements
      ?.move,
    'DRAGON_ASCENT'
  )

  // ------------------------------------------------
  // Shadow regression
  // ------------------------------------------------

  const shadowMamoswineCandidate =
    usableCandidates.find(
      (candidate) =>
        candidate.id ===
        'MAMOSWINE__SHADOW'
    )

  const normalMamoswineCandidate =
    usableCandidates.find(
      (candidate) =>
        candidate.id ===
        'MAMOSWINE'
    )

  expectTrue(
    'Shadow Mamoswine exists in player-usable attacker universe',
    Boolean(
      shadowMamoswineCandidate
    )
  )

  expectTrue(
    'Normal Mamoswine exists in player-usable attacker universe',
    Boolean(
      normalMamoswineCandidate
    )
  )

  expectEqual(
    'Shadow Mamoswine candidate type',
    shadowMamoswineCandidate
      ?.pokemon
      ?.raidCandidateMetadata
      ?.candidateType,
    RAID_CANDIDATE_TYPE
      .SHADOW
  )

  expectEqual(
    'Shadow Mamoswine source candidate ID',
    shadowMamoswineCandidate
      ?.pokemon
      ?.raidCandidateMetadata
      ?.shadow
      ?.sourceCandidateId,
    'MAMOSWINE'
  )

  expectEqual(
    'Shadow Mamoswine Attack matches normal base Attack',
    shadowMamoswineCandidate
      ?.pokemon
      ?.stats
      ?.attack,
    normalMamoswineCandidate
      ?.pokemon
      ?.stats
      ?.attack
  )

  expectEqual(
    'Shadow Mamoswine has one attacker modifier',
    shadowMamoswineCandidate
      ?.attackerModifiers
      ?.length,
    1
  )

  expectEqual(
    'Shadow Mamoswine uses combat Shadow Attack multiplier',
    shadowMamoswineCandidate
      ?.attackerModifiers
      ?.[0],
    shadowAttackMultiplier
  )

  const forbiddenShadowTemporaryCandidates =
    shadowCandidates.filter(
      (candidate) =>
        candidate.id.includes(
          'TEMP_EVOLUTION'
        )
    )

  expectEqual(
    'No Shadow temporary-evolution candidates generated',
    forbiddenShadowTemporaryCandidates.length,
    0
  )

  const duplicateShadowSuffixes =
    shadowCandidates.filter(
      (candidate) =>
        candidate.id.includes(
          '__SHADOW__SHADOW'
        )
    )

  expectEqual(
    'No duplicate Shadow suffix candidates generated',
    duplicateShadowSuffixes.length,
    0
  )

  // ------------------------------------------------
  // Detailed comparison integrity
  // ------------------------------------------------

  expectEqual(
    'Detailed comparison candidate count',
    comparison.totalCandidates,
    usableCandidates.length
  )

  expectEqual(
    'Successful + unsupported + errors equals usable roster',
    comparison.successfulEvaluations +
      comparison.unsupportedEvaluations +
      comparison.errorEvaluations,
    usableCandidates.length
  )

  expectEqual(
    'Successfully ranked attacker count',
    comparison.successfulEvaluations,
    EXPECTED.successfulEvaluations
  )

  expectEqual(
    'Unsupported dynamic mechanic count',
    comparison.unsupportedEvaluations,
    EXPECTED.unsupportedEvaluations
  )

  expectEqual(
    'Unexpected evaluation error count',
    comparison.errorEvaluations,
    EXPECTED.errorEvaluations
  )

  // ------------------------------------------------
  // Boss regression
  // ------------------------------------------------

  expectEqual(
    'Mega Rayquaza boss HP',
    boss.raidBoss.hp,
    9000
  )

  expectEqual(
    'Mega Rayquaza boss timer',
    boss.raidBoss.timerSeconds,
    300
  )

  expectEqual(
    'Mega Rayquaza base Attack',
    boss.stats.attack,
    377
  )

  expectEqual(
    'Mega Rayquaza base Defense',
    boss.stats.defense,
    210
  )

  // ------------------------------------------------
  // Ranking integrity
  // ------------------------------------------------

  const correctlySorted =
    rankings.every(
      (result, index) =>
        index ===
          0 ||
        rankings[
          index -
          1
        ]
          .bestMoveset
          .cycleDps >=
        result
          .bestMoveset
          .cycleDps
    )

  expectTrue(
    'Ranking is sorted by descending DPS',
    correctlySorted
  )

  const sequentialRanks =
    rankings.every(
      (result, index) =>
        result.rank ===
        index + 1
    )

  expectTrue(
    'Ranks are sequential',
    sequentialRanks
  )

  // ------------------------------------------------
  // Mega ranking regression
  // ------------------------------------------------

  const megaRayquazaRanking =
    rankings.find(
      (result) =>
        result.id ===
        'RAYQUAZA__TEMP_EVOLUTION_MEGA'
    )

  expectTrue(
    'Mega Rayquaza is statically ranked',
    Boolean(
      megaRayquazaRanking
    )
  )

  expectEqual(
    'Mega Rayquaza best Fast Move',
    megaRayquazaRanking
      ?.bestMoveset
      ?.fastMoveId,
    'DRAGON_TAIL_FAST'
  )

  expectEqual(
    'Mega Rayquaza best Charged Move',
    megaRayquazaRanking
      ?.bestMoveset
      ?.chargedMoveId,
    'BREAKING_SWIPE'
  )

  expectEqual(
    'Mega Rayquaza best moveset availability',
    megaRayquazaRanking
      ?.bestMoveset
      ?.availability,
    'ELITE'
  )

  // ------------------------------------------------
  // Shadow ranking regression
  // ------------------------------------------------

  const shadowMamoswineRanking =
    rankings.find(
      (result) =>
        result.id ===
        'MAMOSWINE__SHADOW'
    )

  expectTrue(
    'Shadow Mamoswine is statically ranked',
    Boolean(
      shadowMamoswineRanking
    )
  )

  expectEqual(
    'Shadow Mamoswine best Fast Move',
    shadowMamoswineRanking
      ?.bestMoveset
      ?.fastMoveId,
    'POWDER_SNOW_FAST'
  )

  expectEqual(
    'Shadow Mamoswine best Charged Move',
    shadowMamoswineRanking
      ?.bestMoveset
      ?.chargedMoveId,
    'AVALANCHE'
  )

  expectTrue(
    'Shadow Mamoswine outranks normal Mamoswine',
    (
      shadowMamoswineRanking
        ?.bestMoveset
        ?.cycleDps ??
      0
    ) >
    (
      rankings.find(
        (result) =>
          result.id ===
          'MAMOSWINE'
      )
        ?.bestMoveset
        ?.cycleDps ??
      0
    )
  )

  // ------------------------------------------------
  // Numeric move display regression
  // ------------------------------------------------

  const eternatusRanking =
    rankings.find(
      (result) =>
        result.id ===
        'ETERNATUS'
    )

  expectTrue(
    'Eternatus is statically ranked',
    Boolean(
      eternatusRanking
    )
  )

  expectEqual(
    'Eternatus internal Charged Move ID remains numeric',
    eternatusRanking
      ?.bestMoveset
      ?.chargedMoveId,
    '482'
  )

  expectEqual(
    'Eternatus Charged Move displays as Dynamax Cannon',
    getMoveDisplayId(
      eternatusRanking
        ?.bestMoveset
        ?.chargedMoveId,
      moveDisplayLookup
    ),
    'DYNAMAX_CANNON'
  )

  // ------------------------------------------------
  // Unsupported mechanic regression
  // ------------------------------------------------

  const ditto =
    unsupported.find(
      (result) =>
        result.pokemonId ===
        'DITTO'
    )

  expectTrue(
    'Ditto is classified as unsupported',
    Boolean(
      ditto
    )
  )

  expectEqual(
    'Ditto unsupported status',
    ditto?.status,
    RAID_ATTACKER_EVALUATION_STATUS
      .UNSUPPORTED_DYNAMIC_MECHANIC
  )

  const dittoTransform =
    ditto
      ?.unsupportedMechanics
      ?.find(
        (mechanic) =>
          mechanic.moveId ===
          'TRANSFORM_FAST'
      )

  expectTrue(
    'Ditto unsupported mechanic is Transform',
    Boolean(
      dittoTransform
    )
  )

  const dittoRanking =
    rankings.find(
      (result) =>
        result.pokemonId ===
        'DITTO'
    )

  expectEqual(
    'Ditto is excluded from static ranking',
    dittoRanking,
    undefined
  )

  // ------------------------------------------------
  // Ranking summary
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'RANKING SUMMARY'
  )
  console.log(
    '================================'
  )

  if (
    rankings.length >
    0
  ) {
    const best =
      rankings[0]

    console.log(
      `Best Overall Attacker: ${best.label}`
    )

    console.log(
      `Moves: ${
        getMoveDisplayId(
          best.bestMoveset.fastMoveId,
          moveDisplayLookup
        )
      } + ${
        getMoveDisplayId(
          best.bestMoveset.chargedMoveId,
          moveDisplayLookup
        )
      }`
    )

    console.log(
      `Availability: ${best.bestMoveset.availability}`
    )

    console.log(
      `DPS: ${best.bestMoveset.cycleDps.toFixed(6)}`
    )
  }

  if (
    normalRankings.length >
    0
  ) {
    const bestNormal =
      normalRankings[0]

    console.log('')

    console.log(
      `Best Normal-Moveset Attacker: ${bestNormal.label}`
    )

    console.log(
      `Moves: ${
        getMoveDisplayId(
          bestNormal.bestNormalMoveset.fastMoveId,
          moveDisplayLookup
        )
      } + ${
        getMoveDisplayId(
          bestNormal.bestNormalMoveset.chargedMoveId,
          moveDisplayLookup
        )
      }`
    )

    console.log(
      `DPS: ${bestNormal.bestNormalMoveset.cycleDps.toFixed(6)}`
    )
  }

  if (
    shadowRankings.length >
    0
  ) {
    const bestShadow =
      shadowRankings[0]

    console.log('')

    console.log(
      `Best Shadow Attacker: ${bestShadow.label}`
    )

    console.log(
      `Moves: ${
        getMoveDisplayId(
          bestShadow.bestMoveset.fastMoveId,
          moveDisplayLookup
        )
      } + ${
        getMoveDisplayId(
          bestShadow.bestMoveset.chargedMoveId,
          moveDisplayLookup
        )
      }`
    )

    console.log(
      `Availability: ${bestShadow.bestMoveset.availability}`
    )

    console.log(
      `DPS: ${bestShadow.bestMoveset.cycleDps.toFixed(6)}`
    )
  }

  // ------------------------------------------------
  // Test results
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
      0 &&
    errors.length ===
      0
  ) {
    console.log(
      `🎉 ${passed}/${passed} tests passed.`
    )

    console.log(
      'Full Raid Ranking V1 validation successful.'
    )

    if (
      unsupported.length >
      0
    ) {
      console.log('')

      console.log(
        `${unsupported.length} known dynamic mechanic(s) are intentionally excluded from static ranking.`
      )
    }
  } else {
    if (
      failed >
      0
    ) {
      console.log(
        `❌ ${failed} regression test(s) failed.`
      )
    }

    if (
      errors.length >
      0
    ) {
      console.log(
        `❌ ${errors.length} unexpected attacker evaluation error(s) occurred.`
      )
    }

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
      'Full raid ranking validation failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)