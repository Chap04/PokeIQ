/**
 * PokeIQ Raid Engine
 * ------------------
 * Matchup Survivability V1
 *
 * Combines:
 *
 * - an owned attacker's outgoing Cycle DPS
 * - legal raid-boss incoming pressure scenarios
 * - the owned attacker's actual HP
 *
 * to estimate:
 *
 * - survival time
 * - Total Damage Output (TDO)
 * - blended Raid Score
 *
 * Each legal boss moveset is evaluated separately.
 *
 * This matters because one attacker may be extremely
 * durable against one boss moveset and fragile against
 * another.
 *
 * Example:
 *
 * Hydreigon vs Mewtwo
 *
 * Psychic:
 *   low incoming pressure
 *
 * Focus Blast:
 *   very high incoming pressure
 *
 * Averaging boss DPS before survivability would hide
 * some of that matchup behavior, so V1 calculates each
 * scenario independently and aggregates afterward.
 */

import {
  evaluateRaidBossPressure,
  RAID_BOSS_PRESSURE_STATUS,
} from './bossPressure.js'

import {
  calculateRaidSurvivability,
} from './survivability.js'

// --------------------------------------------------
// Status
// --------------------------------------------------

export const MATCHUP_SURVIVABILITY_STATUS = {
  SUCCESS:
    'SUCCESS',

  INVALID_CANDIDATE:
    'INVALID_CANDIDATE',

  INVALID_OUTGOING_DPS:
    'INVALID_OUTGOING_DPS',

  BOSS_PRESSURE_FAILED:
    'BOSS_PRESSURE_FAILED',

  NO_SURVIVABILITY_SCENARIOS:
    'NO_SURVIVABILITY_SCENARIOS',
}

// --------------------------------------------------
// Validation
// --------------------------------------------------

function isValidCandidate(
  candidate
) {
  return (
    candidate?.status ===
      'READY' &&
    Number.isFinite(
      candidate
        ?.reference
        ?.stats
        ?.stamina
    ) &&
    Number.isFinite(
      candidate
        ?.ivs
        ?.stamina
    ) &&
    Number.isFinite(
      candidate?.cpm
    ) &&
    candidate.cpm > 0
  )
}

// --------------------------------------------------
// Numeric helpers
// --------------------------------------------------

function average(
  values
) {
  if (
    values.length ===
    0
  ) {
    return null
  }

  return (
    values.reduce(
      (
        total,
        value
      ) =>
        total +
        value,
      0
    ) /
    values.length
  )
}

function minimum(
  values
) {
  if (
    values.length ===
    0
  ) {
    return null
  }

  return Math.min(
    ...values
  )
}

function maximum(
  values
) {
  if (
    values.length ===
    0
  ) {
    return null
  }

  return Math.max(
    ...values
  )
}

// --------------------------------------------------
// Scenario
// --------------------------------------------------

function buildSurvivabilityScenario({
  pressureScenario,
  defenderCandidate,
  outgoingCycleDps,
}) {
  try {
    const survivability =
      calculateRaidSurvivability({
        baseStamina:
          defenderCandidate
            .reference
            .stats
            .stamina,

        staminaIv:
          defenderCandidate
            .ivs
            .stamina,

        cpMultiplier:
          defenderCandidate.cpm,

        outgoingCycleDps,

        incomingCycleDps:
          pressureScenario
            .cycleDps,
      })

    return {
      status:
        'SUCCESS',

      fastMoveId:
        pressureScenario
          .fastMoveId,

      chargedMoveId:
        pressureScenario
          .chargedMoveId,

      incomingCycleDps:
        pressureScenario
          .cycleDps,

      hp:
        survivability.hp,

      timeToFaintSeconds:
        survivability
          .timeToFaintSeconds,

      totalDamageOutput:
        survivability
          .totalDamageOutput,

      raidScore:
        survivability
          .raidScore,

      pressure:
        pressureScenario,

      survivability,
    }
  } catch (error) {
    return {
      status:
        'ERROR',

      fastMoveId:
        pressureScenario
          ?.fastMoveId ??
        null,

      chargedMoveId:
        pressureScenario
          ?.chargedMoveId ??
        null,

      error:
        error instanceof Error
          ? error.message
          : String(error),
    }
  }
}

// --------------------------------------------------
// Public API
// --------------------------------------------------

export function evaluateMatchupSurvivability({
  boss,
  defenderCandidate,
  outgoingCycleDps,
  moves,
  combatData,
}) {
  if (
    !isValidCandidate(
      defenderCandidate
    )
  ) {
    return {
      status:
        MATCHUP_SURVIVABILITY_STATUS
          .INVALID_CANDIDATE,

      scenarios:
        [],
    }
  }

  if (
    !Number.isFinite(
      outgoingCycleDps
    ) ||
    outgoingCycleDps <= 0
  ) {
    return {
      status:
        MATCHUP_SURVIVABILITY_STATUS
          .INVALID_OUTGOING_DPS,

      scenarios:
        [],
    }
  }

  const pressure =
    evaluateRaidBossPressure({
      boss,

      defenderCandidate,

      moves,

      combatData,
    })

  if (
    pressure.status !==
      RAID_BOSS_PRESSURE_STATUS
        .SUCCESS
  ) {
    return {
      status:
        MATCHUP_SURVIVABILITY_STATUS
          .BOSS_PRESSURE_FAILED,

      pressureStatus:
        pressure.status,

      pressure,

      scenarios:
        [],
    }
  }

  const evaluated =
    pressure
      .scenarios
      .map(
        (
          pressureScenario
        ) =>
          buildSurvivabilityScenario({
            pressureScenario,

            defenderCandidate,

            outgoingCycleDps,
          })
      )

  const scenarios =
    evaluated.filter(
      (scenario) =>
        scenario.status ===
        'SUCCESS'
    )

  const rejected =
    evaluated.filter(
      (scenario) =>
        scenario.status !==
        'SUCCESS'
    )

  if (
    scenarios.length ===
    0
  ) {
    return {
      status:
        MATCHUP_SURVIVABILITY_STATUS
          .NO_SURVIVABILITY_SCENARIOS,

      pressure,

      scenarios:
        [],

      rejected,
    }
  }

  const incomingDpsValues =
    scenarios.map(
      (scenario) =>
        scenario
          .incomingCycleDps
    )

  const survivalValues =
    scenarios.map(
      (scenario) =>
        scenario
          .timeToFaintSeconds
    )

  const tdoValues =
    scenarios.map(
      (scenario) =>
        scenario
          .totalDamageOutput
    )

  const raidScoreValues =
    scenarios.map(
      (scenario) =>
        scenario
          .raidScore
    )

  /**
   * Highest incoming pressure corresponds to the
   * attacker's most dangerous boss moveset.
   */
  const mostDangerousScenario =
    scenarios.reduce(
      (
        current,
        scenario
      ) =>
        scenario
          .incomingCycleDps >
        current
          .incomingCycleDps
          ? scenario
          : current
    )

  /**
   * Lowest incoming pressure corresponds to the
   * attacker's safest boss moveset.
   */
  const safestScenario =
    scenarios.reduce(
      (
        current,
        scenario
      ) =>
        scenario
          .incomingCycleDps <
        current
          .incomingCycleDps
          ? scenario
          : current
    )

  return {
    status:
      MATCHUP_SURVIVABILITY_STATUS
        .SUCCESS,

    outgoingCycleDps,

    hp:
      scenarios[0].hp,

    scenarios,

    rejected,

    pressure,

    summary: {
      scenarioCount:
        scenarios.length,

      rejectedScenarioCount:
        rejected.length,

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
          survivalValues
        ),

      averageTimeToFaintSeconds:
        average(
          survivalValues
        ),

      maximumTimeToFaintSeconds:
        maximum(
          survivalValues
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

      safestMoveSet: {
        fastMoveId:
          safestScenario
            .fastMoveId,

        chargedMoveId:
          safestScenario
            .chargedMoveId,
      },

      mostDangerousMoveSet: {
        fastMoveId:
          mostDangerousScenario
            .fastMoveId,

        chargedMoveId:
          mostDangerousScenario
            .chargedMoveId,
      },
    },
  }
}