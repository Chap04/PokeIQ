import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import pokemon from '../src/data/reference/pokemon.json' with { type: 'json' }
import availability from '../src/data/reference/pokemon-availability.json' with { type: 'json' }
import moves from '../src/data/reference/moves-pve.json' with { type: 'json' }
import combat from '../src/data/reference/combat.json' with { type: 'json' }

import { buildRaidCandidates } from '../src/engine/Raid/candidates.js'
import { compareRaidAttackersDetailed } from '../src/engine/Raid/comparison.js'
import { buildRaidBenchmarks } from '../src/utils/raidBenchmarks.js'

// --------------------------------------------------
// Raid Strength Reference Generator
//
// Preserves the Level 40 individual Raid Strength
// ceilings and additionally generates Level 50 legal
// six-slot team benchmarks for every attacking type.
//
// A moveset represents every attacking type present on
// either its Fast Move or Charged Move. This matches the
// Raid Strength V5 role semantics.
// --------------------------------------------------

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const outputPath = path.resolve(
  __dirname,
  '../src/data/reference/raid-strength.json'
)

const RAID_STRENGTH_UNIVERSE = {
  STANDARD: 'STANDARD',
  TEMPORARY_EVOLUTION: 'TEMPORARY_EVOLUTION',
}

const THEORETICAL_IVS = {
  attack: 15,
  defense: 15,
  stamina: 15,
}

const TEAM_SIZE = 6

// --------------------------------------------------
// Basic helpers
// --------------------------------------------------

function finiteOrNull(value) {
  return Number.isFinite(value)
    ? value
    : null
}

function round(value, decimals = 6) {
  if (!Number.isFinite(value)) {
    return null
  }

  const multiplier =
    10 ** decimals

  return (
    Math.round(
      value *
      multiplier
    ) /
    multiplier
  )
}

// --------------------------------------------------
// Candidate availability
// --------------------------------------------------

function getCandidateType(candidate) {
  return (
    candidate?.candidateType ??
    candidate
      ?.pokemon
      ?.raidCandidateMetadata
      ?.candidateType ??
    null
  )
}

function getReleasedShadowCandidateIds() {
  return Object.entries(
    availability?.shadowOverrides ??
    {}
  )
    .filter(
      ([
        ,
        entry,
      ]) =>
        entry?.released === true &&
        entry?.playerUsable === true
    )
    .map(
      ([
        id,
      ]) =>
        id
    )
}

function isCandidatePlayerUsable(candidate) {
  const candidateType =
    getCandidateType(
      candidate
    )

  let entry

  if (
    candidateType ===
    'TEMPORARY_EVOLUTION'
  ) {
    entry =
      availability
        ?.temporaryEvolutionOverrides
        ?.[candidate.id]
  } else if (
    candidateType ===
    'SHADOW'
  ) {
    entry =
      availability
        ?.shadowOverrides
        ?.[candidate.id]
  } else {
    entry =
      availability
        ?.overrides
        ?.[candidate.id]
  }

  return (
    entry?.released === true &&
    entry?.playerUsable === true
  )
}

// --------------------------------------------------
// Combat level
// --------------------------------------------------

function getLevelCpm(level) {
  const cpMultiplier =
    combat
      ?.cpMultipliers
      ?.allLevels
      ?.[String(level)]

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
// Move lookup and role semantics
// --------------------------------------------------

function buildMoveLookup() {
  const lookup =
    new Map()

  for (
    const move
    of moves
  ) {
    if (
      move?.id
    ) {
      lookup.set(
        String(
          move.id
        ),
        move
      )
    }
  }

  return lookup
}

function getMoveType(move) {
  const type =
    move?.type ??
    move?.pokemonType ??
    move?.moveType ??
    null

  return type
    ? String(
        type
      ).toUpperCase()
    : null
}

function getMovesetRoleTypes({
  moveset,
  moveLookup,
}) {
  const roleTypes =
    new Set()

  const fastType =
    getMoveType(
      moveLookup.get(
        String(
          moveset
            ?.fastMoveId ??
          ''
        )
      )
    )

  const chargedType =
    getMoveType(
      moveLookup.get(
        String(
          moveset
            ?.chargedMoveId ??
          ''
        )
      )
    )

  if (
    fastType
  ) {
    roleTypes.add(
      fastType
    )
  }

  if (
    chargedType
  ) {
    roleTypes.add(
      chargedType
    )
  }

  return [
    ...roleTypes,
  ]
}

// --------------------------------------------------
// Candidate universe
// --------------------------------------------------

function isTemporaryEvolutionId(id) {
  return (
    Boolean(
      id
    ) &&
    String(
      id
    ).includes(
      '__TEMP_EVOLUTION_'
    )
  )
}

function getRankingUniverse(ranking) {
  if (
    getCandidateType(
      ranking
    ) ===
      'TEMPORARY_EVOLUTION' ||
    isTemporaryEvolutionId(
      ranking?.id
    )
  ) {
    return (
      RAID_STRENGTH_UNIVERSE
        .TEMPORARY_EVOLUTION
    )
  }

  return (
    RAID_STRENGTH_UNIVERSE
      .STANDARD
  )
}

// --------------------------------------------------
// Type effectiveness
// --------------------------------------------------

function getDefenderTypes(matchup) {
  const types =
    matchup
      ?.defender
      ?.types

  return Array.isArray(
    types
  )
    ? types
        .filter(
          Boolean
        )
        .map(
          (type) =>
            String(
              type
            ).toUpperCase()
        )
    : []
}

function getTypeEffectiveness({
  attackType,
  defenderTypes,
}) {
  if (
    !attackType ||
    !Array.isArray(
      defenderTypes
    ) ||
    defenderTypes.length ===
      0
  ) {
    return null
  }

  const chart =
    combat
      ?.typeEffectiveness
      ?.[attackType]

  if (
    !chart
  ) {
    return null
  }

  let multiplier = 1

  for (
    const defenderType
    of defenderTypes
  ) {
    const scalar =
      finiteOrNull(
        chart[
          defenderType
        ]
      )

    if (
      scalar ===
      null
    ) {
      return null
    }

    multiplier *=
      scalar
  }

  return multiplier
}

function isRoleRelevant({
  roleType,
  matchup,
}) {
  const effectiveness =
    getTypeEffectiveness({
      attackType:
        roleType,

      defenderTypes:
        getDefenderTypes(
          matchup
        ),
    })

  return (
    Number.isFinite(
      effectiveness
    ) &&
    effectiveness > 1
  )
}

// --------------------------------------------------
// Ranking helpers
// --------------------------------------------------

function getRankingMovesets(ranking) {
  if (
    Array.isArray(
      ranking
        ?.movesetRankings
    )
  ) {
    return (
      ranking
        .movesetRankings
    )
  }

  return ranking
    ?.bestMoveset
    ? [
        ranking
          .bestMoveset,
      ]
    : []
}

// Raw Raid Strength is intentionally uncapped.
//
// The current V5 model's unnormalized per-attacker
// value is cycle DPS, so team strength is the sum of
// all six slot values.

function getMovesetRawStrength(moveset) {
  return finiteOrNull(
    moveset
      ?.cycleDps
  )
}

function buildCompactLeader({
  ranking,
  moveset,
  roleType = null,
}) {
  if (
    !ranking ||
    !moveset
  ) {
    return null
  }

  return {
    candidateId:
      ranking.id ??
      null,

    candidateType:
      getCandidateType(
        ranking
      ),

    roleType,

    fastMoveId:
      moveset
        ?.fastMoveId ??
      null,

    chargedMoveId:
      moveset
        ?.chargedMoveId ??
      null,

    cycleDps:
      round(
        moveset
          ?.cycleDps,
        6
      ),

    rawStrength:
      round(
        getMovesetRawStrength(
          moveset
        ),
        6
      ),
  }
}

function findRoleLeaders({
  comparison,
  matchup,
  moveLookup,
  relevantRolesOnly = true,
}) {
  const leaders = {
    [RAID_STRENGTH_UNIVERSE.STANDARD]:
      {},

    [RAID_STRENGTH_UNIVERSE.TEMPORARY_EVOLUTION]:
      {},
  }

  for (
    const ranking
    of comparison.rankings
  ) {
    const universeLeaders =
      leaders[
        getRankingUniverse(
          ranking
        )
      ]

    if (
      !universeLeaders
    ) {
      continue
    }

    for (
      const moveset
      of getRankingMovesets(
        ranking
      )
    ) {
      const rawStrength =
        getMovesetRawStrength(
          moveset
        )

      if (
        rawStrength ===
          null ||
        rawStrength <=
          0
      ) {
        continue
      }

      const roleTypes =
        getMovesetRoleTypes({
          moveset,
          moveLookup,
        })

      for (
        const roleType
        of roleTypes
      ) {
                if (
          relevantRolesOnly &&
          !isRoleRelevant({
            roleType,
            matchup,
          })
        ) {
          continue
        }

        const current =
          universeLeaders[
            roleType
          ]

        if (
          current &&
          current.rawStrength >=
            rawStrength
        ) {
          continue
        }

        universeLeaders[
          roleType
        ] =
          buildCompactLeader({
            ranking,
            moveset,
            roleType,
          })
      }
    }
  }

  return leaders
}

function findOverallLeader({
  comparison,
  universe,
}) {
  const ranking =
    comparison
      .rankings
      .find(
        (entry) =>
          getRankingUniverse(
            entry
          ) ===
            universe &&
          Number.isFinite(
            entry
              ?.bestMoveset
              ?.cycleDps
          ) &&
          entry
            .bestMoveset
            .cycleDps >
            0
      )

  return ranking
    ? buildCompactLeader({
        ranking,

        moveset:
          ranking
            .bestMoveset,
      })
    : null
}

// --------------------------------------------------
// Level 40 individual ceilings
// --------------------------------------------------

function buildLevel40BenchmarkReference({
  matchup,
  comparison,
  moveLookup,
}) {
  const roleLeaders =
    findRoleLeaders({
      comparison,
      matchup,
      moveLookup,
    })

  return {
    id:
      matchup.id,

    label:
      matchup.label,

    defenderTypes:
      getDefenderTypes(
        matchup
      ),

    universes: {
      STANDARD: {
        overall:
          findOverallLeader({
            comparison,

            universe:
              RAID_STRENGTH_UNIVERSE
                .STANDARD,
          }),

        roles:
          roleLeaders
            .STANDARD,
      },

      TEMPORARY_EVOLUTION: {
        overall:
          findOverallLeader({
            comparison,

            universe:
              RAID_STRENGTH_UNIVERSE
                .TEMPORARY_EVOLUTION,
          }),

        roles:
          roleLeaders
            .TEMPORARY_EVOLUTION,
      },
    },
  }
}

// --------------------------------------------------
// Level 50 legal team benchmarks
// --------------------------------------------------

function buildRepeatedSlots(
  leader,
  count,
  startingSlot = 1
) {
  if (
    !leader ||
    count <= 0
  ) {
    return []
  }

    return Array.from(
    {
      length:
        count,
    },

    (
      _,
      index
    ) => ({
      slot:
        startingSlot +
        index,

      ...leader,
    })
  )
}

function getTeamRawStrength(slots) {
  return slots.reduce(
    (
      total,
      slot
    ) =>
      total +
      (
        finiteOrNull(
          slot
            ?.rawStrength
        ) ??
        0
      ),

    0
  )
}

function buildTeamOption({
  option,
  standardLeader,
  temporaryEvolutionLeader,
}) {
  let slots = []

  if (
    option ===
    'SIX_STANDARD'
  ) {
    slots =
      buildRepeatedSlots(
        standardLeader,
        TEAM_SIZE
      )
  } else if (
    option ===
    'ONE_TEMPORARY_FIVE_STANDARD'
  ) {
    if (
      temporaryEvolutionLeader
    ) {
      slots.push({
        slot: 1,

        ...temporaryEvolutionLeader,
      })
    }

    slots.push(
      ...buildRepeatedSlots(
        standardLeader,
        TEAM_SIZE - 1,
        2
      )
    )
  }

  return {
    option,

    rawStrength:
      round(
        getTeamRawStrength(
          slots
        ),
        6
      ),

    completeness:
      `${slots.length} / ${TEAM_SIZE}`,

    filledSlots:
      slots.length,

    teamSize:
      TEAM_SIZE,

    slots,
  }
}

function buildLegalTypeTeamBenchmark({
  roleType,
  standardLeader,
  temporaryEvolutionLeader,
}) {
  const sixStandard =
    buildTeamOption({
      option:
        'SIX_STANDARD',

      standardLeader,

      temporaryEvolutionLeader:
        null,
    })

  const oneTemporaryFiveStandard =
    buildTeamOption({
      option:
        'ONE_TEMPORARY_FIVE_STANDARD',

      standardLeader,

      temporaryEvolutionLeader,
    })

  const selected =
    oneTemporaryFiveStandard
      .rawStrength >
    sixStandard
      .rawStrength
      ? oneTemporaryFiveStandard
      : sixStandard

  if (
    selected
      .rawStrength <=
    0
  ) {
    return null
  }

  return {
    roleType,

    theoreticalLevel:
      50,

    ivs:
      THEORETICAL_IVS,

    standardLeader,

    temporaryEvolutionLeader,

    selectedOption:
      selected
        .option,

    rawStrength:
      selected
        .rawStrength,

    completeness:
      selected
        .completeness,

    filledSlots:
      selected
        .filledSlots,

    teamSize:
      selected
        .teamSize,

    slots:
      selected
        .slots,
  }
}

function buildLevel50TypeTeams({
  comparison,
  matchup,
  moveLookup,
}) {
    const roleLeaders =
    findRoleLeaders({
      comparison,
      matchup,
      moveLookup,

      relevantRolesOnly:
        false,
    })

  const roleTypes =
    new Set([
      ...Object.keys(
        roleLeaders
          .STANDARD
      ),

      ...Object.keys(
        roleLeaders
          .TEMPORARY_EVOLUTION
      ),
    ])

  const typeTeams = {}

  for (
    const roleType
    of [
      ...roleTypes,
    ].sort()
  ) {
    const benchmark =
      buildLegalTypeTeamBenchmark({
        roleType,

        standardLeader:
          roleLeaders
            .STANDARD[
              roleType
            ] ??
          null,

        temporaryEvolutionLeader:
          roleLeaders
            .TEMPORARY_EVOLUTION[
              roleType
            ] ??
          null,
      })

    if (
      benchmark
    ) {
      typeTeams[
        roleType
      ] =
        benchmark
    }
  }

  return typeTeams
}

// --------------------------------------------------
// Candidate generation and comparison
// --------------------------------------------------

function buildTheoreticalCandidates({
  level,
  shadowCandidateIds,
}) {
  const cpMultiplier =
    getLevelCpm(
      level
    )

  const result =
    buildRaidCandidates({
      pokemon,

      cpMultiplier,

      shadowCandidateIds,

      shadowAttackMultiplier:
        combat
          ?.modifiers
          ?.shadowAttack ??
        1.2,
    })

  const allCandidates =
    result
      .candidates

  const usableCandidates =
    allCandidates.filter(
      isCandidatePlayerUsable
    )

  if (
    usableCandidates.length <=
    1000
  ) {
    throw new Error(
      `Level ${level} theoretical attacker universe is unexpectedly small: ${usableCandidates.length}.`
    )
  }

  return {
    level,
    cpMultiplier,
    allCandidates,
    usableCandidates,
  }
}

function compareCandidatesForMatchup({
  candidates,
  matchup,
}) {
  return (
    compareRaidAttackersDetailed({
      candidates,

      defender:
        matchup
          .defender,

      defenderCpMultiplier:
        matchup
          .defender
          .raidBoss
          .cpMultiplier,

      moves,

      combatData:
        combat,
    })
  )
}

// --------------------------------------------------
// Validation
// --------------------------------------------------

function validateLeader({
  leader,
  label,
}) {
  if (
    !leader
      ?.candidateId
  ) {
    throw new Error(
      `${label} is missing a candidate ID.`
    )
  }

  if (
    !Number.isFinite(
      leader
        ?.rawStrength
    ) ||
    leader
      .rawStrength <=
      0
  ) {
    throw new Error(
      `${label} has invalid raw strength.`
    )
  }

  if (
    !leader
      ?.fastMoveId ||
    !leader
      ?.chargedMoveId
  ) {
    throw new Error(
      `${label} is missing a legal moveset.`
    )
  }
}

function validateTypeTeam({
  benchmarkId,
  roleType,
  typeTeam,
}) {
  const label =
    `${benchmarkId}/${roleType}`

  if (
    typeTeam
      ?.roleType !==
    roleType
  ) {
    throw new Error(
      `${label} has a mismatched role type.`
    )
  }

  if (
    !Number.isFinite(
      typeTeam
        ?.rawStrength
    ) ||
    typeTeam
      .rawStrength <=
      0
  ) {
    throw new Error(
      `${label} has invalid team raw strength.`
    )
  }

  if (
    !Array.isArray(
      typeTeam
        ?.slots
    ) ||
    typeTeam
      .slots
      .length <
      1 ||
    typeTeam
      .slots
      .length >
      TEAM_SIZE
  ) {
    throw new Error(
      `${label} has an invalid slot count.`
    )
  }

  const temporarySlots =
    typeTeam
      .slots
      .filter(
        (slot) =>
          slot
            ?.candidateType ===
              'TEMPORARY_EVOLUTION' ||
          isTemporaryEvolutionId(
            slot
              ?.candidateId
          )
      )

  if (
    temporarySlots.length >
    1
  ) {
    throw new Error(
      `${label} contains more than one temporary evolution.`
    )
  }

  for (
    const slot
    of typeTeam.slots
  ) {
    validateLeader({
      leader:
        slot,

      label:
        `${label} slot ${slot?.slot ?? '?'}`,
    })
  }

  const calculatedRawStrength =
    round(
      getTeamRawStrength(
        typeTeam
          .slots
      ),
      6
    )

  if (
    calculatedRawStrength !==
    typeTeam
      .rawStrength
  ) {
    throw new Error(
      `${label} raw strength does not equal the sum of its slots.`
    )
  }
}

function validateReference(reference) {
  const benchmarkEntries =
    Object.entries(
      reference
        ?.benchmarks ??
      {}
    )

  if (
    benchmarkEntries.length !==
    18
  ) {
    throw new Error(
      `Expected 18 Raid Strength benchmarks, found ${benchmarkEntries.length}.`
    )
  }

  let standardRoleCount = 0
  let temporaryRoleCount = 0
  let typeTeamCount = 0

  const coveredTypes =
    new Set()

  for (
    const [
      benchmarkId,
      benchmark,
    ]
    of benchmarkEntries
  ) {
    const standard =
      benchmark
        ?.universes
        ?.STANDARD

    const temporary =
      benchmark
        ?.universes
        ?.TEMPORARY_EVOLUTION

    if (
      !standard
        ?.overall
        ?.cycleDps
    ) {
      throw new Error(
        `${benchmarkId} is missing a STANDARD overall ceiling.`
      )
    }

    if (
      !temporary
        ?.overall
        ?.cycleDps
    ) {
      throw new Error(
        `${benchmarkId} is missing a TEMPORARY_EVOLUTION overall ceiling.`
      )
    }

    standardRoleCount +=
      Object.keys(
        standard
          .roles ??
        {}
      ).length

    temporaryRoleCount +=
      Object.keys(
        temporary
          .roles ??
        {}
      ).length

    for (
      const [
        roleType,
        typeTeam,
      ]
      of Object.entries(
        benchmark
          ?.typeTeams ??
        {}
      )
    ) {
      validateTypeTeam({
        benchmarkId,
        roleType,
        typeTeam,
      })

      coveredTypes.add(
        roleType
      )

      typeTeamCount += 1
    }
  }

  if (
    standardRoleCount ===
    0
  ) {
    throw new Error(
      'No STANDARD Raid Strength role ceilings were generated.'
    )
  }

  if (
    temporaryRoleCount ===
    0
  ) {
    throw new Error(
      'No TEMPORARY_EVOLUTION Raid Strength role ceilings were generated.'
    )
  }

  const expectedTypes =
    Object.keys(
      combat
        ?.typeEffectiveness ??
      {}
    ).sort()

  if (
    expectedTypes.length !==
    18
  ) {
    throw new Error(
      `Expected combat data for 18 attacking types, found ${expectedTypes.length}.`
    )
  }

  const missingTypes =
    expectedTypes.filter(
      (type) =>
        !coveredTypes.has(
          type
        )
    )

  if (
    missingTypes.length >
    0
  ) {
    throw new Error(
      `Level 50 type-team coverage is missing: ${missingTypes.join(', ')}.`
    )
  }

  return {
    benchmarkCount:
      benchmarkEntries.length,

    standardRoleCount,

    temporaryRoleCount,

    typeTeamCount,

    coveredTypeCount:
      coveredTypes.size,
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
    'RAID STRENGTH REFERENCE UPDATE'
  )
  console.log(
    '================================'
  )

  const shadowCandidateIds =
    getReleasedShadowCandidateIds()

  const level40 =
    buildTheoreticalCandidates({
      level:
        40,

      shadowCandidateIds,
    })

  const level50 =
    buildTheoreticalCandidates({
      level:
        50,

      shadowCandidateIds,
    })

  console.log('')
  console.log(
    `Level 40 CPM: ${level40.cpMultiplier}`
  )
  console.log(
    `Level 50 CPM: ${level50.cpMultiplier}`
  )
  console.log(
    `Released Shadow IDs: ${shadowCandidateIds.length}`
  )
  console.log(
    `Level 40 player-usable candidates: ${level40.usableCandidates.length}`
  )
  console.log(
    `Level 50 player-usable candidates: ${level50.usableCandidates.length}`
  )

  const matchups =
    buildRaidBenchmarks()

  console.log('')
  console.log(
    `Benchmark matchups: ${matchups.length}`
  )

  if (
    matchups.length !==
    18
  ) {
    throw new Error(
      `Expected 18 Raid Strength benchmarks, found ${matchups.length}.`
    )
  }

  const moveLookup =
    buildMoveLookup()

  const benchmarks = {}

  let rankingErrorCount = 0

  console.log('')
  console.log(
    'Building Level 40 ceilings and Level 50 legal type teams...'
  )

  for (
    const matchup
    of matchups
  ) {
    const level40Comparison =
      compareCandidatesForMatchup({
        candidates:
          level40
            .usableCandidates,

        matchup,
      })

    const level50Comparison =
      compareCandidatesForMatchup({
        candidates:
          level50
            .usableCandidates,

        matchup,
      })

    rankingErrorCount +=
      (
        level40Comparison
          ?.errors
          ?.length ??
        0
      ) +
      (
        level50Comparison
          ?.errors
          ?.length ??
        0
      )

    const benchmark =
      buildLevel40BenchmarkReference({
        matchup,

        comparison:
          level40Comparison,

        moveLookup,
      })

    benchmark.typeTeams =
      buildLevel50TypeTeams({
        comparison:
          level50Comparison,

        matchup,

        moveLookup,
      })

    benchmarks[
      matchup.id
    ] =
      benchmark

    const standardRoles =
      Object.keys(
        benchmark
          ?.universes
          ?.STANDARD
          ?.roles ??
        {}
      ).length

    const temporaryRoles =
      Object.keys(
        benchmark
          ?.universes
          ?.TEMPORARY_EVOLUTION
          ?.roles ??
        {}
      ).length

    const typeTeams =
      Object.keys(
        benchmark
          ?.typeTeams ??
        {}
      ).length

    console.log(
      `${matchup.label}: ${level40Comparison.rankings.length} attackers | ${standardRoles} standard roles | ${temporaryRoles} temporary roles | ${typeTeams} type teams`
    )
  }

  if (
    rankingErrorCount !==
    0
  ) {
    throw new Error(
      `Theoretical ranking produced ${rankingErrorCount} unexpected error(s).`
    )
  }

  const reference = {
    schemaVersion:
      2,

    generatedAt:
      new Date()
        .toISOString(),

    methodology: {
      individualCeilings: {
        theoreticalLevel:
          40,

        cpMultiplier:
          level40
            .cpMultiplier,
      },

      typeTeamBenchmarks: {
        theoreticalLevel:
          50,

        cpMultiplier:
          level50
            .cpMultiplier,

        ivs:
          THEORETICAL_IVS,

        teamSize:
          TEAM_SIZE,

        duplicateStandardAllowed:
          true,

        duplicateShadowAllowed:
          true,

        maximumTemporaryEvolutions:
          1,

        missingSlotStrength:
          0,

        selectionRule:
          'MAX_OF_SIX_STANDARD_OR_ONE_TEMPORARY_PLUS_FIVE_STANDARD',

        rawStrengthDefinition:
          'SUM_OF_SLOT_CYCLE_DPS',
      },

      roleDefinition:
        'FAST_OR_CHARGED_MOVE_TYPE',

      relevantRoleRule:
        'SUPER_EFFECTIVE',

      standardUniverse:
        'PERMANENT_AND_SHADOW',

      temporaryEvolutionUniverse:
        'SEPARATE_ONE_PER_TEAM',

      benchmarkCount:
        matchups.length,

      level40TheoreticalCandidateCount:
        level40
          .usableCandidates
          .length,

      level50TheoreticalCandidateCount:
        level50
          .usableCandidates
          .length,

      releasedShadowCandidateCount:
        shadowCandidateIds
          .length,
    },

    benchmarks,
  }

  const validation =
    validateReference(
      reference
    )

  console.log('')
  console.log(
    'Validation:'
  )
  console.log(
    `Benchmarks: ${validation.benchmarkCount}`
  )
  console.log(
    `STANDARD role ceilings: ${validation.standardRoleCount}`
  )
  console.log(
    `TEMPORARY_EVOLUTION role ceilings: ${validation.temporaryRoleCount}`
  )
  console.log(
    `Level 50 type teams: ${validation.typeTeamCount}`
  )
  console.log(
    `Attacking types covered: ${validation.coveredTypeCount} / 18`
  )

  fs.writeFileSync(
    outputPath,
    `${JSON.stringify(
      reference,
      null,
      2
    )}\n`,
    'utf8'
  )

  const fileSize =
    fs.statSync(
      outputPath
    ).size

  console.log('')
  console.log(
    `Wrote: ${outputPath}`
  )
  console.log(
    `Size: ${(fileSize / 1024).toFixed(1)} KB`
  )
  console.log('')
  console.log(
    '✅ Raid Strength reference updated successfully.'
  )
}

main().catch(
  (error) => {
    console.error('')
    console.error(
      'Raid Strength reference update failed:'
    )
    console.error(
      error
    )

    process.exitCode = 1
  }
)