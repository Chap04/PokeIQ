import moves from '../data/reference/moves-pve.json' with { type: 'json' }
import combatData from '../data/reference/combat.json' with { type: 'json' }
import raidProfiles from '../data/reference/raid-profiles.json' with { type: 'json' }

import {
  createRaidBoss,
} from '../engine/Raid/boss.js'

import {
  evaluateMatchupSurvivability,
} from '../engine/Raid/matchupSurvivability.js'

import {
  buildRaidCandidate,
} from '../utils/raidCandidate.js'

import {
  evaluateOwnedRaidMatchup,
  RAID_MATCHUP_STATUS,
} from '../utils/raidMatchup.js'

import {
  getPokemonDisplayName,
  getPokemonReferenceByIdentity,
} from '../utils/pokemonReference.js'

// --------------------------------------------------
// Boss-Specific Current-Team Analysis V2
//
// Answers:
//
// "What are the best six Pokémon I currently own to
//  use against this raid boss right now?"
//
// V2 evaluates:
//
// - current owned combat state
// - current equipped moves
// - outgoing matchup DPS
// - legal boss movesets
// - incoming boss pressure
// - owned HP / survivability
// - estimated TDO
// - blended Raid Score
//
// It does NOT assume:
//
// - TMs
// - power-ups
// - evolutions
// - dodging
// - relobbying
// - friendship
// - weather
// - Party Power
// - Mega ally boosts
//
// Boss movesets are currently treated as equally
// plausible scenarios.
// --------------------------------------------------

// --------------------------------------------------
// Status
// --------------------------------------------------

export const RAID_BOSS_ANALYSIS_STATUS = {
  SUCCESS:
    'SUCCESS',

  INVALID_COLLECTION:
    'INVALID_COLLECTION',

  BOSS_NOT_FOUND:
    'BOSS_NOT_FOUND',

  RAID_PROFILE_NOT_FOUND:
    'RAID_PROFILE_NOT_FOUND',

  NO_ANALYZABLE_POKEMON:
    'NO_ANALYZABLE_POKEMON',
}

export const RAID_BOSS_TEAM_SIZE =
  6

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function round(
  value,
  decimals = 2
) {
  if (!Number.isFinite(value)) {
    return null
  }

  const multiplier =
    10 ** decimals

  return (
    Math.round(
      value * multiplier
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
        sum,
        value
      ) =>
        sum + value,
      0
    ) /
    finiteValues.length
  )
}

function minimum(
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

  return Math.min(
    ...finiteValues
  )
}

function maximum(
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

  return Math.max(
    ...finiteValues
  )
}

function getCollectionId(
  ownedPokemon,
  index
) {
  return (
    ownedPokemon?.collectionId ??
    ownedPokemon?.id ??
    `collection-${index}`
  )
}

function getOwnedPokemonName({
  ownedPokemon,
  candidate,
}) {
  return (
    ownedPokemon?.name ||
    getPokemonDisplayName(
      candidate?.reference
    ) ||
    candidate?.reference?.id ||
    'Unknown Pokémon'
  )
}

function buildMoveLookup() {
  return new Map(
    moves.map(
      (move) => [
        String(move.id),
        move,
      ]
    )
  )
}

const MOVE_LOOKUP =
  buildMoveLookup()

function getMoveName(
  moveId
) {
  if (!moveId) {
    return null
  }

  const move =
    MOVE_LOOKUP.get(
      String(moveId)
    )

  return (
    move?.name ??
    move?.displayName ??
    move?.id ??
    moveId
  )
}

// --------------------------------------------------
// Survivability scenario helpers
// --------------------------------------------------

function buildBossMoveSet(
  scenario
) {
  return {
    fastMoveId:
      scenario?.fastMoveId ??
      null,

    fastMoveName:
      getMoveName(
        scenario?.fastMoveId
      ),

    chargedMoveId:
      scenario?.chargedMoveId ??
      null,

    chargedMoveName:
      getMoveName(
        scenario?.chargedMoveId
      ),
  }
}

function buildSurvivabilitySummary(
  result
) {
  const scenarios =
    result?.scenarios ?? []

  const incomingDpsValues =
    scenarios.map(
      (scenario) =>
        scenario
          ?.incomingCycleDps
    )

  const timeToFaintValues =
    scenarios.map(
      (scenario) =>
        scenario
          ?.timeToFaintSeconds
    )

  const tdoValues =
    scenarios.map(
      (scenario) =>
        scenario
          ?.totalDamageOutput
    )

  const raidScoreValues =
    scenarios.map(
      (scenario) =>
        scenario
          ?.raidScore
    )

  const safestScenario =
    scenarios.reduce(
      (
        safest,
        scenario
      ) => {
        if (!safest) {
          return scenario
        }

        return (
          scenario
            .incomingCycleDps <
          safest
            .incomingCycleDps
        )
          ? scenario
          : safest
      },
      null
    )

  const mostDangerousScenario =
    scenarios.reduce(
      (
        dangerous,
        scenario
      ) => {
        if (!dangerous) {
          return scenario
        }

        return (
          scenario
            .incomingCycleDps >
          dangerous
            .incomingCycleDps
        )
          ? scenario
          : dangerous
      },
      null
    )

  return {
    scenarioCount:
      scenarios.length,

    hp:
      scenarios[0]
        ?.hp ??
      null,

    minimumIncomingCycleDps:
      minimum(
        incomingDpsValues
      ),

    averageIncomingCycleDps:
      average(
        incomingDpsValues
      ),

    maximumIncomingCycleDps:
      maximum(
        incomingDpsValues
      ),

    minimumTimeToFaintSeconds:
      minimum(
        timeToFaintValues
      ),

    averageTimeToFaintSeconds:
      average(
        timeToFaintValues
      ),

    maximumTimeToFaintSeconds:
      maximum(
        timeToFaintValues
      ),

    minimumTotalDamageOutput:
      minimum(
        tdoValues
      ),

    averageTotalDamageOutput:
      average(
        tdoValues
      ),

    maximumTotalDamageOutput:
      maximum(
        tdoValues
      ),

    minimumRaidScore:
      minimum(
        raidScoreValues
      ),

    averageRaidScore:
      average(
        raidScoreValues
      ),

    maximumRaidScore:
      maximum(
        raidScoreValues
      ),

    safestBossMoveset:
      safestScenario
        ? buildBossMoveSet(
            safestScenario
          )
        : null,

    mostDangerousBossMoveset:
      mostDangerousScenario
        ? buildBossMoveSet(
            mostDangerousScenario
          )
        : null,
  }
}

// --------------------------------------------------
// Candidate loadout evaluation
// --------------------------------------------------

function evaluateCandidateLoadouts({
  candidate,
  defender,
}) {
  const successful = []
  const rejected = []

  for (
    const loadout
    of candidate.loadouts ?? []
  ) {
    // ----------------------------------------------
    // Outgoing damage
    // ----------------------------------------------

    const matchup =
      evaluateOwnedRaidMatchup({
        candidate,
        loadout,
        defender,
        moves,
        combatData,
      })

    if (
      matchup.status !==
        RAID_MATCHUP_STATUS.SUCCESS ||
      !Number.isFinite(
        matchup
          ?.performance
          ?.cycleDps
      )
    ) {
      rejected.push({
        loadout,

        stage:
          'OUTGOING_MATCHUP',

        status:
          matchup.status,

        error:
          matchup.error ??
          null,

        unsupportedMechanics:
          matchup
            .unsupportedMechanics ??
          [],
      })

      continue
    }

    // ----------------------------------------------
    // Incoming pressure + survivability
    // ----------------------------------------------

    const survivability =
      evaluateMatchupSurvivability({
        boss:
          defender,

        defenderCandidate:
          candidate,

        outgoingCycleDps:
          matchup
            .performance
            .cycleDps,

        moves,

        combatData,
      })

    if (
      survivability?.status !==
        'SUCCESS' ||
      !Array.isArray(
        survivability?.scenarios
      ) ||
      survivability
        .scenarios
        .length ===
        0
    ) {
      rejected.push({
        loadout,

        stage:
          'SURVIVABILITY',

        status:
          survivability
            ?.status ??
          'UNKNOWN',

        error:
          survivability
            ?.error ??
          null,
      })

      continue
    }

    const survivabilitySummary =
      buildSurvivabilitySummary(
        survivability
      )

    if (
      !Number.isFinite(
        survivabilitySummary
          .averageRaidScore
      )
    ) {
      rejected.push({
        loadout,

        stage:
          'RAID_SCORE',

        status:
          'INVALID_RAID_SCORE',
      })

      continue
    }

    successful.push({
      loadout,

      matchup,

      performance:
        matchup.performance,

      survivability,

      survivabilitySummary,

      raidScore:
        survivabilitySummary
          .averageRaidScore,
    })
  }

  // ------------------------------------------------
  // Best CURRENT loadout
  //
  // Primary:
  //   average Raid Score
  //
  // Tie-break:
  //   outgoing Cycle DPS
  // ------------------------------------------------

  successful.sort(
    (
      first,
      second
    ) => {
      const scoreDifference =
        second.raidScore -
        first.raidScore

      if (
        scoreDifference !==
        0
      ) {
        return scoreDifference
      }

      return (
        second
          .performance
          .cycleDps -
        first
          .performance
          .cycleDps
      )
    }
  )

  return {
    best:
      successful[0] ??
      null,

    successful,
    rejected,
  }
}

// --------------------------------------------------
// Ranked attacker
// --------------------------------------------------

function buildRankedAttacker({
  ownedPokemon,
  candidate,
  bestMatchup,
  collectionId,
}) {
  const loadout =
    bestMatchup.loadout

  const survivability =
    bestMatchup
      .survivabilitySummary

  const cycleDps =
    bestMatchup
      .performance
      .cycleDps

  return {
    collectionId,

    pokemonIdentity:
      candidate.pokemonIdentity,

    pokemonId:
      candidate.reference?.id ??
      ownedPokemon?.pokemonId ??
      null,

    pokemonForm:
      candidate.reference?.form ??
      ownedPokemon?.pokemonForm ??
      null,

    pokemonName:
      getOwnedPokemonName({
        ownedPokemon,
        candidate,
      }),

    cp:
      Number.isFinite(
        ownedPokemon?.cp
      )
        ? ownedPokemon.cp
        : null,

    level:
      candidate.level,

    ivs: {
      ...candidate.ivs,
    },

    traits: {
      ...candidate.traits,
    },

    loadout: {
      fastMoveId:
        loadout.fastMoveId,

      fastMoveName:
        getMoveName(
          loadout.fastMoveId
        ),

      chargedMoveId:
        loadout.chargedMoveId,

      chargedMoveName:
        getMoveName(
          loadout.chargedMoveId
        ),
    },

    // ----------------------------------------------
    // Offense
    // ----------------------------------------------

    cycleDps,

    displayCycleDps:
      round(
        cycleDps
      ),

    // ----------------------------------------------
    // Survivability
    // ----------------------------------------------

    hp:
      survivability.hp,

    averageIncomingCycleDps:
      survivability
        .averageIncomingCycleDps,

    displayAverageIncomingCycleDps:
      round(
        survivability
          .averageIncomingCycleDps
      ),

    averageTimeToFaintSeconds:
      survivability
        .averageTimeToFaintSeconds,

    displayAverageTimeToFaintSeconds:
      round(
        survivability
          .averageTimeToFaintSeconds
      ),

    averageTotalDamageOutput:
      survivability
        .averageTotalDamageOutput,

    displayAverageTotalDamageOutput:
      round(
        survivability
          .averageTotalDamageOutput
      ),

    // ----------------------------------------------
    // Raid Score
    // ----------------------------------------------

    raidScore:
      survivability
        .averageRaidScore,

    averageRaidScore:
      survivability
        .averageRaidScore,

    displayRaidScore:
      round(
        survivability
          .averageRaidScore
      ),

    minimumRaidScore:
      survivability
        .minimumRaidScore,

    maximumRaidScore:
      survivability
        .maximumRaidScore,

    displayMinimumRaidScore:
      round(
        survivability
          .minimumRaidScore
      ),

    displayMaximumRaidScore:
      round(
        survivability
          .maximumRaidScore
      ),

    safestBossMoveset:
      survivability
        .safestBossMoveset,

    mostDangerousBossMoveset:
      survivability
        .mostDangerousBossMoveset,

    survivabilityScenarioCount:
      survivability
        .scenarioCount,

    // ----------------------------------------------
    // Diagnostics / full engine evidence
    // ----------------------------------------------

    performance:
      bestMatchup.performance,

    survivability:
      bestMatchup.survivability,
  }
}

// --------------------------------------------------
// Skipped Collection entry
// --------------------------------------------------

function buildSkippedEntry({
  ownedPokemon,
  index,
  status,
  details = null,
}) {
  return {
    collectionId:
      getCollectionId(
        ownedPokemon,
        index
      ),

    pokemonIdentity:
      ownedPokemon
        ?.pokemonIdentity ??
      null,

    pokemonName:
      ownedPokemon?.name ??
      null,

    cp:
      Number.isFinite(
        ownedPokemon?.cp
      )
        ? ownedPokemon.cp
        : null,

    status,
    details,
  }
}

// --------------------------------------------------
// Ranking
// --------------------------------------------------

function compareRankedAttackers(
  first,
  second
) {
  // ------------------------------------------------
  // Primary:
  // average blended Raid Score
  // ------------------------------------------------

  const scoreDifference =
    second.raidScore -
    first.raidScore

  if (
    scoreDifference !==
    0
  ) {
    return scoreDifference
  }

  // ------------------------------------------------
  // First tie-break:
  // raw outgoing DPS
  // ------------------------------------------------

  const dpsDifference =
    second.cycleDps -
    first.cycleDps

  if (
    dpsDifference !==
    0
  ) {
    return dpsDifference
  }

  // ------------------------------------------------
  // Second tie-break:
  // CP
  // ------------------------------------------------

  const cpDifference =
    (second.cp ?? 0) -
    (first.cp ?? 0)

  if (
    cpDifference !==
    0
  ) {
    return cpDifference
  }

  // ------------------------------------------------
  // Deterministic final tie-break
  // ------------------------------------------------

  return String(
    first.collectionId
  ).localeCompare(
    String(
      second.collectionId
    )
  )
}

// --------------------------------------------------
// Public builder
// --------------------------------------------------

export function buildRaidBossAnalysis({
  collection,
  bossPokemonIdentity,
  raidProfileId = 'TIER_5',
} = {}) {
  if (!Array.isArray(collection)) {
    return {
      status:
        RAID_BOSS_ANALYSIS_STATUS
          .INVALID_COLLECTION,

      team: [],
      rankings: [],
      skipped: [],
    }
  }

  const bossReference =
    getPokemonReferenceByIdentity(
      bossPokemonIdentity
    )

  if (!bossReference) {
    return {
      status:
        RAID_BOSS_ANALYSIS_STATUS
          .BOSS_NOT_FOUND,

      bossPokemonIdentity:
        bossPokemonIdentity ??
        null,

      raidProfileId:
        raidProfileId ??
        null,

      team: [],
      rankings: [],
      skipped: [],
    }
  }

  const raidProfile =
    raidProfiles?.[
      raidProfileId
    ] ??
    null

  if (!raidProfile) {
    return {
      status:
        RAID_BOSS_ANALYSIS_STATUS
          .RAID_PROFILE_NOT_FOUND,

      bossPokemonIdentity,

      raidProfileId:
        raidProfileId ??
        null,

      team: [],
      rankings: [],
      skipped: [],
    }
  }

  const defender =
    createRaidBoss({
      pokemon:
        bossReference,

      raidProfile,
    })

  const rankings = []
  const skipped = []

  collection.forEach(
    (
      ownedPokemon,
      index
    ) => {
      const candidate =
        buildRaidCandidate(
          ownedPokemon
        )

      if (
        candidate.status !==
        'READY'
      ) {
        skipped.push(
          buildSkippedEntry({
            ownedPokemon,
            index,

            status:
              candidate.status,

            details: {
              combatStateStatus:
                candidate
                  .combatStateStatus ??
                candidate
                  ?.combatState
                  ?.status ??
                null,
            },
          })
        )

        return
      }

      const evaluated =
        evaluateCandidateLoadouts({
          candidate,
          defender,
        })

      if (!evaluated.best) {
        skipped.push(
          buildSkippedEntry({
            ownedPokemon,
            index,

            status:
              'NO_SUPPORTED_CURRENT_LOADOUT',

            details: {
              rejectedLoadouts:
                evaluated.rejected,
            },
          })
        )

        return
      }

      rankings.push(
        buildRankedAttacker({
          ownedPokemon,
          candidate,

          bestMatchup:
            evaluated.best,

          collectionId:
            getCollectionId(
              ownedPokemon,
              index
            ),
        })
      )
    }
  )

  rankings.sort(
    compareRankedAttackers
  )

  const team =
    rankings
      .slice(
        0,
        RAID_BOSS_TEAM_SIZE
      )
      .map(
        (
          attacker,
          index
        ) => ({
          ...attacker,

          teamSlot:
            index + 1,
        })
      )

  const status =
    rankings.length > 0
      ? RAID_BOSS_ANALYSIS_STATUS
          .SUCCESS
      : RAID_BOSS_ANALYSIS_STATUS
          .NO_ANALYZABLE_POKEMON

  return {
    status,

    boss: {
      pokemonIdentity:
        bossPokemonIdentity,

      pokemonId:
        bossReference.id,

      pokemonForm:
        bossReference.form,

      pokemonName:
        getPokemonDisplayName(
          bossReference
        ),

      types: [
        ...bossReference.types,
      ],

      raidProfileId:
        raidProfile.id,

      raidProfileName:
        raidProfile.name,

      hp:
        defender
          .raidBoss
          .hp,

      timerSeconds:
        defender
          .raidBoss
          .timerSeconds,
    },

    team,
    rankings,
    skipped,

    summary: {
      collectionCount:
        collection.length,

      analyzedCount:
        rankings.length,

      skippedCount:
        skipped.length,

      teamCount:
        team.length,

      completeTeam:
        team.length ===
        RAID_BOSS_TEAM_SIZE,

      rankingMetric:
        'AVERAGE_RAID_SCORE',

      bossMovesetAssumption:
        'EQUAL_WEIGHT_LEGAL_MOVESETS',
    },
  }
}