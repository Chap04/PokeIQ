import moves from '../data/reference/moves-pve.json'
import combatData from '../data/reference/combat.json'
import strengthReference from '../data/reference/raid-strength.json'

import {
  buildRaidCandidate,
} from '../utils/raidCandidate'

import {
  buildRaidBenchmarks,
} from '../utils/raidBenchmarks'

import {
  evaluateRaidStrength,
  RAID_STRENGTH_STATUS,
} from '../utils/raidStrength'

import {
  calculateRaidTypeTeamRating,
} from '../utils/raidTypeTeamBenchmark'

// --------------------------------------------------
// Raid Type Profile V2
//
// Describes the player's current raid attacking
// strength across all 18 Pokémon types.
//
// Each type team now includes:
//
// - the six strongest currently owned attackers
// - current uncapped raw strength
// - the Level 50 legal theoretical benchmark
// - a player-facing 0–100 Type Team Rating
//
// Missing team slots contribute zero.
// --------------------------------------------------

// --------------------------------------------------
// Status
// --------------------------------------------------

export const RAID_TYPE_PROFILE_STATUS = {
  SUCCESS:
    'SUCCESS',

  INVALID_COLLECTION:
    'INVALID_COLLECTION',

  NO_ANALYZABLE_POKEMON:
    'NO_ANALYZABLE_POKEMON',
}

export const RAID_TYPE_TEAM_STATUS = {
  READY:
    'READY',

  PARTIAL:
    'PARTIAL',

  EMPTY:
    'EMPTY',
}

export const RAID_TYPE_PROFILE_PROJECTION_STATUS = {
  SUCCESS:
    'SUCCESS',

  INVALID_PROFILE:
    'INVALID_PROFILE',

  INVALID_REPLACEMENT:
    'INVALID_REPLACEMENT',

  COLLECTION_ENTRY_NOT_FOUND:
    'COLLECTION_ENTRY_NOT_FOUND',
}

// --------------------------------------------------
// Types
// --------------------------------------------------

export const RAID_ATTACK_TYPES = [
  'BUG',
  'DARK',
  'DRAGON',
  'ELECTRIC',
  'FAIRY',
  'FIGHTING',
  'FIRE',
  'FLYING',
  'GHOST',
  'GRASS',
  'GROUND',
  'ICE',
  'NORMAL',
  'POISON',
  'PSYCHIC',
  'ROCK',
  'STEEL',
  'WATER',
]

export const RAID_TYPE_TEAM_SIZE =
  6

// --------------------------------------------------
// Numeric helpers
// --------------------------------------------------

function finiteOrNull(
  value
) {
  return Number.isFinite(
    value
  )
    ? value
    : null
}

function finiteOrFallback(
  value,
  fallback
) {
  return Number.isFinite(
    value
  )
    ? value
    : fallback
}

function round(
  value,
  decimals = 2
) {
  if (
    !Number.isFinite(
      value
    )
  ) {
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

function average(
  values
) {
  const finiteValues =
    values.filter(
      Number.isFinite
    )

  if (
    finiteValues.length ===
    0
  ) {
    return null
  }

  return (
    finiteValues.reduce(
      (
        total,
        value
      ) =>
        total +
        value,
      0
    ) /
    finiteValues.length
  )
}

function median(
  values
) {
  const finiteValues =
    values
      .filter(
        Number.isFinite
      )
      .sort(
        (first, second) =>
          first -
          second
      )

  if (
    finiteValues.length ===
    0
  ) {
    return null
  }

  const middle =
    Math.floor(
      finiteValues.length /
      2
    )

  if (
    finiteValues.length %
    2 ===
    1
  ) {
    return finiteValues[
      middle
    ]
  }

  return (
    finiteValues[
      middle - 1
    ] +
    finiteValues[
      middle
    ]
  ) / 2
}

// --------------------------------------------------
// Current candidate normalization
// --------------------------------------------------

function normalizeCurrentRaidCandidate(
  candidate
) {
  if (
    !candidate ||
    candidate.status !==
      'READY'
  ) {
    return null
  }

  const pokemon =
    candidate.pokemon ??
    candidate.reference ??
    null

  const reference =
    candidate.reference ??
    candidate.pokemon ??
    pokemon

  const cpMultiplier =
    finiteOrNull(
      candidate.cpMultiplier
    ) ??
    finiteOrNull(
      candidate.cpm
    )

  if (
    !pokemon ||
    !reference ||
    cpMultiplier ===
      null
  ) {
    return null
  }

  return {
    ...candidate,

    pokemon,

    reference,

    cpm:
      finiteOrNull(
        candidate.cpm
      ) ??
      cpMultiplier,

    cpMultiplier,
  }
}

// --------------------------------------------------
// Collection identity helpers
// --------------------------------------------------

function getCollectionId(
  pokemon
) {
  return (
    pokemon?.id ??
    pokemon?.collectionId ??
    null
  )
}

function getPokemonName({
  pokemon,
  candidate,
}) {
  return (
    candidate
      ?.reference
      ?.name ??
    candidate
      ?.pokemon
      ?.name ??
    pokemon?.name ??
    'Pokémon'
  )
}

function getPokemonIdentity({
  pokemon,
  candidate,
}) {
  return (
    candidate
      ?.pokemonIdentity ??
    pokemon
      ?.pokemonIdentity ??
    null
  )
}

// --------------------------------------------------
// Role helpers
// --------------------------------------------------

function getRoleSummary(
  raidStrength,
  type
) {
  if (
    raidStrength
      ?.status !==
      RAID_STRENGTH_STATUS
        .SUCCESS
  ) {
    return null
  }

  if (
    !Array.isArray(
      raidStrength
        ?.roleSummaries
    )
  ) {
    return null
  }

  return (
    raidStrength
      .roleSummaries
      .find(
        (role) =>
          role?.roleType ===
          type
      ) ??
    null
  )
}

function getRoleMatchups(
  roleSummary
) {
  return Array.isArray(
    roleSummary?.matchups
  )
    ? roleSummary.matchups
    : []
}

function getBestRoleMatchup(
  roleSummary
) {
  const matchups =
    getRoleMatchups(
      roleSummary
    )

  if (
    matchups.length ===
    0
  ) {
    return null
  }

  const bestMatchupId =
    roleSummary
      ?.bestMatchupId

  if (
    bestMatchupId
  ) {
    const exactMatch =
      matchups.find(
        (matchup) =>
          matchup
            ?.matchupId ===
          bestMatchupId
      )

    if (
      exactMatch
    ) {
      return exactMatch
    }
  }

  return [
    ...matchups,
  ].sort(
    (
      first,
      second
    ) => {
      const strengthDifference =
        finiteOrFallback(
          second
            ?.strengthRatio,
          0
        ) -
        finiteOrFallback(
          first
            ?.strengthRatio,
          0
        )

      if (
        strengthDifference !==
        0
      ) {
        return strengthDifference
      }

      return (
        finiteOrFallback(
          second
            ?.overallStrengthRatio,
          0
        ) -
        finiteOrFallback(
          first
            ?.overallStrengthRatio,
          0
        )
      )
    }
  )[0] ??
  null
}

// --------------------------------------------------
// Type attacker scores
// --------------------------------------------------

function getRoleStrengthScore(
  roleSummary
) {
  return finiteOrNull(
    roleSummary
      ?.averageStrengthScore
  )
}

function getRoleMedianStrengthScore(
  roleSummary
) {
  return finiteOrNull(
    roleSummary
      ?.medianStrengthScore
  )
}

function getRoleBestStrengthScore(
  roleSummary
) {
  return finiteOrNull(
    roleSummary
      ?.bestStrengthScore
  )
}

function getRoleOverallStrengthScores(
  roleSummary
) {
  return getRoleMatchups(
    roleSummary
  )
    .map(
      (matchup) =>
        finiteOrNull(
          matchup
            ?.overallStrengthScore
        )
    )
    .filter(
      Number.isFinite
    )
}

function getRoleOverallStrengthScore(
  roleSummary
) {
  return round(
    average(
      getRoleOverallStrengthScores(
        roleSummary
      )
    ),
    2
  )
}

function getRoleMedianOverallStrengthScore(
  roleSummary
) {
  return round(
    median(
      getRoleOverallStrengthScores(
        roleSummary
      )
    ),
    2
  )
}

function getRoleBestOverallStrengthScore(
  roleSummary
) {
  const scores =
    getRoleOverallStrengthScores(
      roleSummary
    )

  if (
    scores.length ===
    0
  ) {
    return null
  }

  return round(
    Math.max(
      ...scores
    ),
    2
  )
}

function getRoleRawStrengthScores(
  roleSummary
) {
  return getRoleMatchups(
    roleSummary
  )
    .map(
      (matchup) =>
        finiteOrNull(
          matchup
            ?.stateMoveset
            ?.cycleDps
        )
    )
    .filter(
      Number.isFinite
    )
}

function getRoleRawStrengthScore(
  roleSummary
) {
  return round(
    average(
      getRoleRawStrengthScores(
        roleSummary
      )
    ),
    6
  )
}

// --------------------------------------------------
// One owned attacker / one attacking role
// --------------------------------------------------

function buildTypeAttacker({
  pokemon,
  candidate,
  raidStrength,
  roleSummary,
  type,
  collectionIndex,
  collectionId = null,
  cpOverride = undefined,
}) {
  const bestMatchup =
    getBestRoleMatchup(
      roleSummary
    )

  const bestMoveset =
    bestMatchup
      ?.stateMoveset ??
    null

  return {
    collectionId:
      collectionId ??
      getCollectionId(
        pokemon
      ),

    collectionIndex,

    pokemonIdentity:
      getPokemonIdentity({
        pokemon,
        candidate,
      }),

          pokemonId:
      pokemon
        ?.pokemonId ??
      candidate
        ?.reference
        ?.pokemonId ??
      candidate
        ?.reference
        ?.id ??
      null,

    pokemonForm:
      pokemon
        ?.pokemonForm ??
      candidate
        ?.reference
        ?.form ??
      null,

    pokemonName:
      getPokemonName({
        pokemon,
        candidate,
      }),

    type,

    level:
      finiteOrNull(
        candidate?.level
      ),

    cpm:
      finiteOrNull(
        candidate?.cpm
      ) ??
      finiteOrNull(
        candidate
          ?.cpMultiplier
      ),

    cp:
      cpOverride !==
        undefined
        ? finiteOrNull(
            cpOverride
          )
        : finiteOrNull(
            pokemon?.cp
          ),

    ivs: {
      attack:
        finiteOrNull(
          candidate
            ?.ivs
            ?.attack
        ),

      defense:
        finiteOrNull(
          candidate
            ?.ivs
            ?.defense
        ),

      stamina:
        finiteOrNull(
          candidate
            ?.ivs
            ?.stamina
        ),
    },

    traits: {
      shadow:
        candidate
          ?.traits
          ?.shadow ===
        true,

      purified:
        candidate
          ?.traits
          ?.purified ===
        true,

      lucky:
        candidate
          ?.traits
          ?.lucky ===
        true,

      shiny:
        candidate
          ?.traits
          ?.shiny ===
        true,
    },

    strengthScore:
      getRoleStrengthScore(
        roleSummary
      ),

    medianStrengthScore:
      getRoleMedianStrengthScore(
        roleSummary
      ),

    bestStrengthScore:
      getRoleBestStrengthScore(
        roleSummary
      ),

    absoluteStrengthScore:
      getRoleOverallStrengthScore(
        roleSummary
      ),

    medianAbsoluteStrengthScore:
      getRoleMedianOverallStrengthScore(
        roleSummary
      ),

    bestAbsoluteStrengthScore:
      getRoleBestOverallStrengthScore(
        roleSummary
      ),

    rawStrengthScore:
      getRoleRawStrengthScore(
        roleSummary
      ),

    classification:
      roleSummary
        ?.bestClassification ??
      null,

    relevantMatchupCount:
      finiteOrFallback(
        roleSummary
          ?.relevantMatchupCount,
        0
      ),

    eliteMatchupCount:
      finiteOrFallback(
        roleSummary
          ?.eliteMatchupCount,
        0
      ),

    strongMatchupCount:
      finiteOrFallback(
        roleSummary
          ?.strongMatchupCount,
        0
      ),

    competitiveMatchupCount:
      finiteOrFallback(
        roleSummary
          ?.competitiveMatchupCount,
        0
      ),

    bestCurrentLoadout:
      bestMoveset
        ? {
            fastMoveId:
              bestMoveset
                .fastMoveId ??
              null,

            chargedMoveId:
              bestMoveset
                .chargedMoveId ??
              null,
          }
        : null,

    bestMatchupId:
      roleSummary
        ?.bestMatchupId ??
      null,

    bestMatchupLabel:
      roleSummary
        ?.bestMatchupLabel ??
      null,

    bestEffectiveness:
      finiteOrNull(
        roleSummary
          ?.bestEffectiveness
      ),

    roleSummary,

    raidStrength,
  }
}

// --------------------------------------------------
// Build all roles for one evaluated candidate
// --------------------------------------------------

function buildTypeAttackersFromRaidStrength({
  pokemon,
  candidate,
  raidStrength,
  collectionIndex,
  collectionId = null,
  cpOverride = undefined,
}) {
  const attackers = []

  for (
    const type
    of RAID_ATTACK_TYPES
  ) {
    const roleSummary =
      getRoleSummary(
        raidStrength,
        type
      )

    if (
      !roleSummary
    ) {
      continue
    }

    const strengthScore =
      getRoleStrengthScore(
        roleSummary
      )

    const rawStrengthScore =
      getRoleRawStrengthScore(
        roleSummary
      )

    if (
      strengthScore ===
        null ||
      rawStrengthScore ===
        null
    ) {
      continue
    }

    attackers.push(
      buildTypeAttacker({
        pokemon,

        candidate,

        raidStrength,

        roleSummary,

        type,

        collectionIndex,

        collectionId,

        cpOverride,
      })
    )
  }

  return attackers
}

// --------------------------------------------------
// Type attacker ordering
// --------------------------------------------------

function compareTypeAttackers(
  first,
  second
) {
  const rawStrengthDifference =
    finiteOrFallback(
      second
        ?.rawStrengthScore,
      Number.NEGATIVE_INFINITY
    ) -
    finiteOrFallback(
      first
        ?.rawStrengthScore,
      Number.NEGATIVE_INFINITY
    )

  if (
    rawStrengthDifference !==
    0
  ) {
    return rawStrengthDifference
  }

  const averageDifference =
    finiteOrFallback(
      second
        ?.strengthScore,
      Number.NEGATIVE_INFINITY
    ) -
    finiteOrFallback(
      first
        ?.strengthScore,
      Number.NEGATIVE_INFINITY
    )

  if (
    averageDifference !==
    0
  ) {
    return averageDifference
  }

  const medianDifference =
    finiteOrFallback(
      second
        ?.medianStrengthScore,
      Number.NEGATIVE_INFINITY
    ) -
    finiteOrFallback(
      first
        ?.medianStrengthScore,
      Number.NEGATIVE_INFINITY
    )

  if (
    medianDifference !==
    0
  ) {
    return medianDifference
  }

  const bestDifference =
    finiteOrFallback(
      second
        ?.bestStrengthScore,
      Number.NEGATIVE_INFINITY
    ) -
    finiteOrFallback(
      first
        ?.bestStrengthScore,
      Number.NEGATIVE_INFINITY
    )

  if (
    bestDifference !==
    0
  ) {
    return bestDifference
  }

  const absoluteDifference =
    finiteOrFallback(
      second
        ?.absoluteStrengthScore,
      Number.NEGATIVE_INFINITY
    ) -
    finiteOrFallback(
      first
        ?.absoluteStrengthScore,
      Number.NEGATIVE_INFINITY
    )

  if (
    absoluteDifference !==
    0
  ) {
    return absoluteDifference
  }

  const coverageDifference =
    finiteOrFallback(
      second
        ?.relevantMatchupCount,
      0
    ) -
    finiteOrFallback(
      first
        ?.relevantMatchupCount,
      0
    )

  if (
    coverageDifference !==
    0
  ) {
    return coverageDifference
  }

  return (
    finiteOrFallback(
      first
        ?.collectionIndex,
      Number.MAX_SAFE_INTEGER
    ) -
    finiteOrFallback(
      second
        ?.collectionIndex,
      Number.MAX_SAFE_INTEGER
    )
  )
}

// --------------------------------------------------
// Team strength
//
// Missing slots count as zero.
// --------------------------------------------------

function calculateAverageTeamStrength(
  team,
  scoreField
) {
  const total =
    team.reduce(
      (
        sum,
        member
      ) =>
        sum +
        finiteOrFallback(
          member?.[
            scoreField
          ],
          0
        ),
      0
    )

  return round(
    total /
    RAID_TYPE_TEAM_SIZE,
    2
  )
}

function calculateRawTeamStrength(
  team
) {
  return round(
    team.reduce(
      (
        total,
        member
      ) =>
        total +
        finiteOrFallback(
          member
            ?.rawStrengthScore,
          0
        ),
      0
    ),
    6
  )
}

// --------------------------------------------------
// Theoretical benchmark lookup
// --------------------------------------------------

function getTypeTeamBenchmarkEntries(
  type
) {
  const benchmarkEntries =
    Object.values(
      strengthReference
        ?.benchmarks ??
      {}
    )

  const relevantEntries =
    benchmarkEntries.filter(
      (benchmark) =>
        benchmark
          ?.universes
          ?.STANDARD
          ?.roles
          ?.[type]
    )

  // Normal-type attacks are never super effective.
  // If a type has no super-effective benchmark, use
  // every generated neutral benchmark for that type.
  const sourceEntries =
    relevantEntries.length >
      0
      ? relevantEntries
      : benchmarkEntries

  return sourceEntries
    .map(
      (benchmark) => {
        const typeTeam =
          benchmark
            ?.typeTeams
            ?.[type]

        const rawStrengthScore =
          finiteOrNull(
            typeTeam
              ?.rawStrength
          )

        if (
          rawStrengthScore ===
            null ||
          rawStrengthScore <=
            0
        ) {
          return null
        }

        return {
          matchupId:
            benchmark
              ?.id ??
            null,

          matchupLabel:
            benchmark
              ?.label ??
            null,

          rawStrengthScore,

          selectedOption:
            typeTeam
              ?.selectedOption ??
            null,

          filledSlotCount:
            finiteOrFallback(
              typeTeam
                ?.filledSlots,
              0
            ),

          missingSlotCount:
            Math.max(
              0,
              RAID_TYPE_TEAM_SIZE -
              finiteOrFallback(
                typeTeam
                  ?.filledSlots,
                0
              )
            ),

          teamSize:
            finiteOrFallback(
              typeTeam
                ?.teamSize,
              RAID_TYPE_TEAM_SIZE
            ),

          team:
            Array.isArray(
              typeTeam
                ?.slots
            )
              ? typeTeam.slots
              : [],
        }
      }
    )
    .filter(
      Boolean
    )
}

function buildTypeTeamBenchmark(
  type
) {
  const matchups =
    getTypeTeamBenchmarkEntries(
      type
    )

  const rawStrengthScore =
    round(
      average(
        matchups.map(
          (matchup) =>
            matchup
              .rawStrengthScore
        )
      ),
      6
    )

  return {
    status:
      Number.isFinite(
        rawStrengthScore
      ) &&
      rawStrengthScore >
        0
        ? 'READY'
        : 'MISSING',

    type,

    theoreticalLevel:
      finiteOrNull(
        strengthReference
          ?.methodology
          ?.typeTeamBenchmarks
          ?.theoreticalLevel
      ),

    rawStrengthScore,

    matchupCount:
      matchups.length,

    matchups,
  }
}

// --------------------------------------------------
// One type team
// --------------------------------------------------

function buildTypeTeam({
  type,
  attackers,
}) {
  const rankedAttackers =
    [
      ...attackers,
    ]
      .sort(
        compareTypeAttackers
      )
      .map(
        (
          attacker,
          index
        ) => ({
          ...attacker,

          typeRank:
            index + 1,
        })
      )

  const team =
    rankedAttackers.slice(
      0,
      RAID_TYPE_TEAM_SIZE
    )

  const filledSlotCount =
    team.length

  const missingSlotCount =
    Math.max(
      0,
      RAID_TYPE_TEAM_SIZE -
      filledSlotCount
    )

  let status =
    RAID_TYPE_TEAM_STATUS
      .EMPTY

  if (
    filledSlotCount ===
    RAID_TYPE_TEAM_SIZE
  ) {
    status =
      RAID_TYPE_TEAM_STATUS
        .READY
  } else if (
    filledSlotCount >
    0
  ) {
    status =
      RAID_TYPE_TEAM_STATUS
        .PARTIAL
  }

  const rawStrengthScore =
    calculateRawTeamStrength(
      team
    )

  const benchmark =
    buildTypeTeamBenchmark(
      type
    )

  const rating =
    calculateRaidTypeTeamRating({
      currentRawStrengthScore:
        rawStrengthScore,

      benchmarkRawStrengthScore:
        benchmark
          .rawStrengthScore,
    })

  return {
    type,

    status,

    teamSize:
      RAID_TYPE_TEAM_SIZE,

    filledSlotCount,

    missingSlotCount,

    completeness:
      `${filledSlotCount} / ${RAID_TYPE_TEAM_SIZE}`,

    eligibleAttackerCount:
      rankedAttackers.length,

    strengthScore:
      calculateAverageTeamStrength(
        team,
        'strengthScore'
      ),

    absoluteStrengthScore:
      calculateAverageTeamStrength(
        team,
        'absoluteStrengthScore'
      ),

    rawStrengthScore,

    benchmarkRawStrengthScore:
      benchmark
        .rawStrengthScore,

    typeTeamRating:
      rating
        .rating,

    ratingStatus:
      rating
        .status,

    rating,

    benchmark,

    team,

    rankedAttackers,
  }
}

// --------------------------------------------------
// Empty profile
// --------------------------------------------------

function buildEmptyTypeTeams() {
  return Object.fromEntries(
    RAID_ATTACK_TYPES.map(
      (type) => [
        type,

        buildTypeTeam({
          type,

          attackers: [],
        }),
      ]
    )
  )
}

// --------------------------------------------------
// Profile summary helpers
// --------------------------------------------------

function summarizeTypeTeams(
  types
) {
  const typeTeams =
    Object.values(
      types
    )

  return {
    completeTeamCount:
      typeTeams.filter(
        (team) =>
          team.status ===
          RAID_TYPE_TEAM_STATUS
            .READY
      ).length,

    partialTeamCount:
      typeTeams.filter(
        (team) =>
          team.status ===
          RAID_TYPE_TEAM_STATUS
            .PARTIAL
      ).length,

    emptyTeamCount:
      typeTeams.filter(
        (team) =>
          team.status ===
          RAID_TYPE_TEAM_STATUS
            .EMPTY
      ).length,
  }
}

function buildTypesFromEvaluations(
  evaluations
) {
  const attackersByType =
    new Map(
      RAID_ATTACK_TYPES.map(
        (type) => [
          type,
          [],
        ]
      )
    )

  for (
    const evaluation
    of evaluations
  ) {
    for (
      const attacker
      of evaluation
        ?.typeAttackers ??
      []
    ) {
      attackersByType
        .get(
          attacker.type
        )
        ?.push(
          attacker
        )
    }
  }

  return Object.fromEntries(
    RAID_ATTACK_TYPES.map(
      (type) => [
        type,

        buildTypeTeam({
          type,

          attackers:
            attackersByType.get(
              type
            ) ??
            [],
        }),
      ]
    )
  )
}

// --------------------------------------------------
// One Collection Pokémon
// --------------------------------------------------

function evaluateCollectionPokemon({
  pokemon,
  collectionIndex,
  matchups,
}) {
  let candidate

  try {
    candidate =
      buildRaidCandidate(
        pokemon
      )
  } catch (error) {
    return {
      success:
        false,

      collectionId:
        getCollectionId(
          pokemon
        ),

      collectionIndex,

      pokemon,

      reason:
        'CANDIDATE_BUILD_ERROR',

      detail:
        error?.message ??
        String(error),
    }
  }

  if (
    candidate?.status !==
    'READY'
  ) {
    return {
      success:
        false,

      collectionId:
        getCollectionId(
          pokemon
        ),

      collectionIndex,

      pokemon,

      candidate,

      reason:
        candidate?.status ??
        'CANDIDATE_NOT_READY',

      detail:
        null,
    }
  }

  const normalizedCandidate =
    normalizeCurrentRaidCandidate(
      candidate
    )

  if (
    !normalizedCandidate
  ) {
    return {
      success:
        false,

      collectionId:
        getCollectionId(
          pokemon
        ),

      collectionIndex,

      pokemon,

      candidate,

      reason:
        'CURRENT_CANDIDATE_NORMALIZATION_FAILED',

      detail:
        null,
    }
  }

  let raidStrength

  try {
    raidStrength =
      evaluateRaidStrength({
        state: {
          candidate:
            normalizedCandidate,
        },

        matchups,

        strengthReference,

        moves,

        combatData,
      })
  } catch (error) {
    return {
      success:
        false,

      collectionId:
        getCollectionId(
          pokemon
        ),

      collectionIndex,

      pokemon,

      candidate:
        normalizedCandidate,

      reason:
        'RAID_STRENGTH_ERROR',

      detail:
        error?.message ??
        String(error),
    }
  }

  if (
    raidStrength?.status !==
      RAID_STRENGTH_STATUS
        .SUCCESS &&
    raidStrength?.status !==
      RAID_STRENGTH_STATUS
        .NO_RELEVANT_MATCHUPS
  ) {
    return {
      success:
        false,

      collectionId:
        getCollectionId(
          pokemon
        ),

      collectionIndex,

      pokemon,

      candidate:
        normalizedCandidate,

      raidStrength,

      reason:
        raidStrength?.status ??
        'RAID_STRENGTH_FAILED',

      detail:
        null,
    }
  }

  const typeAttackers =
    buildTypeAttackersFromRaidStrength({
      pokemon,

      candidate:
        normalizedCandidate,

      raidStrength,

      collectionIndex,
    })

  return {
    success:
      true,

    collectionId:
      getCollectionId(
        pokemon
      ),

    collectionIndex,

    pokemon,

    candidate:
      normalizedCandidate,

    raidStrength,

    typeAttackers,
  }
}

// --------------------------------------------------
// Projected candidate metadata
// --------------------------------------------------

function buildProjectedCandidateMetadata({
  sourceEvaluation,
  possibleState,
}) {
  const sourceCandidate =
    sourceEvaluation
      ?.candidate ??
    null

  const stateCandidate =
    possibleState
      ?.candidate ??
    null

  if (
    !sourceCandidate
  ) {
    return null
  }

  const reference =
    stateCandidate
      ?.reference ??
    stateCandidate
      ?.pokemon ??
    sourceCandidate
      ?.reference ??
    sourceCandidate
      ?.pokemon ??
    null

  const pokemon =
    stateCandidate
      ?.pokemon ??
    stateCandidate
      ?.reference ??
    sourceCandidate
      ?.pokemon ??
    sourceCandidate
      ?.reference ??
    reference

  const cpm =
    finiteOrNull(
      possibleState
        ?.combat
        ?.cpm
    ) ??
    finiteOrNull(
      stateCandidate
        ?.cpm
    ) ??
    finiteOrNull(
      stateCandidate
        ?.cpMultiplier
    ) ??
    finiteOrNull(
      sourceCandidate
        ?.cpm
    ) ??
    finiteOrNull(
      sourceCandidate
        ?.cpMultiplier
    )

  const level =
    finiteOrNull(
      possibleState
        ?.combat
        ?.level
    ) ??
    finiteOrNull(
      stateCandidate
        ?.level
    ) ??
    finiteOrNull(
      sourceCandidate
        ?.level
    )

  return {
    ...sourceCandidate,
    ...(stateCandidate ?? {}),

    status:
      'READY',

    pokemon,

    reference,

    pokemonIdentity:
      possibleState
        ?.pokemonIdentity ??
      stateCandidate
        ?.pokemonIdentity ??
      sourceCandidate
        ?.pokemonIdentity ??
      null,

    level,

    cpm,

    cpMultiplier:
      cpm,

    ivs:
      stateCandidate
        ?.ivs ??
      sourceCandidate
        ?.ivs ??
      null,

    traits:
      stateCandidate
        ?.traits ??
      sourceCandidate
        ?.traits ??
      null,
  }
}

function buildProjectedPokemonMetadata({
  sourceEvaluation,
  projectedCandidate,
}) {
  const sourcePokemon =
    sourceEvaluation
      ?.pokemon ??
    {}

  return {
    ...sourcePokemon,

    id:
      sourceEvaluation
        ?.collectionId ??
      getCollectionId(
        sourcePokemon
      ),

    collectionId:
      sourceEvaluation
        ?.collectionId ??
      getCollectionId(
        sourcePokemon
      ),

    pokemonIdentity:
      projectedCandidate
        ?.pokemonIdentity ??
      sourcePokemon
        ?.pokemonIdentity ??
      null,

    name:
      projectedCandidate
        ?.reference
        ?.name ??
      projectedCandidate
        ?.pokemon
        ?.name ??
      sourcePokemon
        ?.name ??
      'Pokémon',
  }
}

// --------------------------------------------------
// Public API — current account profile
// --------------------------------------------------

export function buildRaidTypeProfile(
  pokemonCollection
) {
  if (
    !Array.isArray(
      pokemonCollection
    )
  ) {
    return {
      status:
        RAID_TYPE_PROFILE_STATUS
          .INVALID_COLLECTION,

      types:
        buildEmptyTypeTeams(),

      typeOrder:
        RAID_ATTACK_TYPES,

      teamSize:
        RAID_TYPE_TEAM_SIZE,

      analyzedCount:
        0,

      skippedCount:
        0,

      benchmarkCount:
        0,

      eligibleTypeRoleCount:
        0,

      completeTeamCount:
        0,

      partialTeamCount:
        0,

      emptyTeamCount:
        RAID_ATTACK_TYPES.length,

      skippedPokemon: [],

      evaluations: [],
    }
  }

  const matchups =
    buildRaidBenchmarks()

  const evaluations =
    pokemonCollection.map(
      (
        pokemon,
        collectionIndex
      ) =>
        evaluateCollectionPokemon({
          pokemon,

          collectionIndex,

          matchups,
        })
    )

  const successful =
    evaluations.filter(
      (evaluation) =>
        evaluation.success ===
        true
    )

  const skipped =
    evaluations.filter(
      (evaluation) =>
        evaluation.success !==
        true
    )

  if (
    successful.length ===
    0
  ) {
    return {
      status:
        RAID_TYPE_PROFILE_STATUS
          .NO_ANALYZABLE_POKEMON,

      types:
        buildEmptyTypeTeams(),

      typeOrder:
        RAID_ATTACK_TYPES,

      teamSize:
        RAID_TYPE_TEAM_SIZE,

      analyzedCount:
        0,

      skippedCount:
        skipped.length,

      benchmarkCount:
        matchups.length,

      eligibleTypeRoleCount:
        0,

      completeTeamCount:
        0,

      partialTeamCount:
        0,

      emptyTeamCount:
        RAID_ATTACK_TYPES.length,

      skippedPokemon:
        skipped,

      evaluations,
    }
  }

  const types =
    buildTypesFromEvaluations(
      successful
    )

  const {
    completeTeamCount,
    partialTeamCount,
    emptyTeamCount,
  } =
    summarizeTypeTeams(
      types
    )

  const eligibleTypeRoleCount =
    successful.reduce(
      (
        total,
        evaluation
      ) =>
        total +
        (
          evaluation
            ?.typeAttackers
            ?.length ??
          0
        ),
      0
    )

  return {
    status:
      RAID_TYPE_PROFILE_STATUS
        .SUCCESS,

    types,

    typeOrder:
      RAID_ATTACK_TYPES,

    teamSize:
      RAID_TYPE_TEAM_SIZE,

    analyzedCount:
      successful.length,

    skippedCount:
      skipped.length,

    benchmarkCount:
      matchups.length,

    eligibleTypeRoleCount,

    completeTeamCount,

    partialTeamCount,

    emptyTeamCount,

    skippedPokemon:
      skipped,

    evaluations:
      successful,
  }
}

// --------------------------------------------------
// Public API — projected account profile
// --------------------------------------------------

export function projectRaidTypeProfile({
  currentProfile,
  collectionId,
  possibleState,
  raidStrength,
}) {
  if (
    currentProfile
      ?.status !==
      RAID_TYPE_PROFILE_STATUS
        .SUCCESS ||
    !Array.isArray(
      currentProfile
        ?.evaluations
    )
  ) {
    return {
      status:
        RAID_TYPE_PROFILE_PROJECTION_STATUS
          .INVALID_PROFILE,

      profile:
        null,
    }
  }

  if (
    !collectionId ||
    !possibleState ||
    (
      raidStrength
        ?.status !==
        RAID_STRENGTH_STATUS
          .SUCCESS &&
      raidStrength
        ?.status !==
        RAID_STRENGTH_STATUS
          .NO_RELEVANT_MATCHUPS
    )
  ) {
    return {
      status:
        RAID_TYPE_PROFILE_PROJECTION_STATUS
          .INVALID_REPLACEMENT,

      profile:
        null,
    }
  }

  const sourceEvaluation =
    currentProfile
      .evaluations
      .find(
        (evaluation) =>
          evaluation
            ?.collectionId ===
          collectionId
      )

  if (
    !sourceEvaluation
  ) {
    return {
      status:
        RAID_TYPE_PROFILE_PROJECTION_STATUS
          .COLLECTION_ENTRY_NOT_FOUND,

      profile:
        null,
    }
  }

  const projectedCandidate =
    buildProjectedCandidateMetadata({
      sourceEvaluation,

      possibleState,
    })

  if (
    !projectedCandidate
  ) {
    return {
      status:
        RAID_TYPE_PROFILE_PROJECTION_STATUS
          .INVALID_REPLACEMENT,

      profile:
        null,
    }
  }

  const projectedPokemon =
    buildProjectedPokemonMetadata({
      sourceEvaluation,

      projectedCandidate,
    })

  const projectedTypeAttackers =
    buildTypeAttackersFromRaidStrength({
      pokemon:
        projectedPokemon,

      candidate:
        projectedCandidate,

      raidStrength,

      collectionIndex:
        sourceEvaluation
          .collectionIndex,

      collectionId,

      cpOverride:
        null,
    })

  const projectedEvaluation = {
    ...sourceEvaluation,

    pokemon:
      projectedPokemon,

    candidate:
      projectedCandidate,

    raidStrength,

    typeAttackers:
      projectedTypeAttackers,

    projected:
      true,

    possibleState,
  }

  const projectedEvaluations =
    currentProfile
      .evaluations
      .map(
        (evaluation) =>
          evaluation
            ?.collectionId ===
          collectionId
            ? projectedEvaluation
            : evaluation
      )

  const types =
    buildTypesFromEvaluations(
      projectedEvaluations
    )

  const {
    completeTeamCount,
    partialTeamCount,
    emptyTeamCount,
  } =
    summarizeTypeTeams(
      types
    )

  const eligibleTypeRoleCount =
    projectedEvaluations.reduce(
      (
        total,
        evaluation
      ) =>
        total +
        (
          evaluation
            ?.typeAttackers
            ?.length ??
          0
        ),
      0
    )

  const profile = {
    ...currentProfile,

    status:
      RAID_TYPE_PROFILE_STATUS
        .SUCCESS,

    types,

    eligibleTypeRoleCount,

    completeTeamCount,

    partialTeamCount,

    emptyTeamCount,

    evaluations:
      projectedEvaluations,

    projected:
      true,

    projection: {
      collectionId,

      pokemonIdentity:
        projectedCandidate
          ?.pokemonIdentity ??
        null,

      possibleStateType:
        possibleState
          ?.type ??
        null,
    },
  }

  return {
    status:
      RAID_TYPE_PROFILE_PROJECTION_STATUS
        .SUCCESS,

    profile,

    sourceEvaluation,

    projectedEvaluation,
  }
}