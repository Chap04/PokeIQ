// --------------------------------------------------
// PokeIQ Raid Type Team Benchmark V1
//
// Pure legal-team selection and rating utility.
//
// This module does NOT:
//
// - evaluate raid combat
// - read reference data
// - decide Pokémon availability
// - generate theoretical candidates
// - build the player's current profile
//
// It receives already-evaluated theoretical attackers
// and answers:
//
// "What is the strongest legal six-Pokémon team for
//  this attacking type?"
//
// Legal-team rules:
//
// - Six total team slots
// - Permanent Pokémon may be duplicated
// - Shadow Pokémon may be duplicated
// - At most one temporary evolution may be used
// - Temporary evolutions include Mega and Primal forms
// - Empty slots contribute zero
//
// Because ordinary duplicates are legal, the strongest
// standard team is six copies of the strongest standard
// attacker.
//
// A temporary-evolution team is:
//
// - one strongest temporary-evolution attacker
// - five copies of the strongest standard attacker
//
// The stronger of those two legal teams becomes the
// benchmark.
// --------------------------------------------------

// --------------------------------------------------
// Constants
// --------------------------------------------------

export const RAID_TYPE_TEAM_BENCHMARK_STATUS = {
  SUCCESS:
    'SUCCESS',

  INVALID_TYPE:
    'INVALID_TYPE',

  NO_ELIGIBLE_ATTACKERS:
    'NO_ELIGIBLE_ATTACKERS',
}

export const RAID_TYPE_TEAM_RATING_STATUS = {
  SUCCESS:
    'SUCCESS',

  INVALID_CURRENT_STRENGTH:
    'INVALID_CURRENT_STRENGTH',

  INVALID_BENCHMARK_STRENGTH:
    'INVALID_BENCHMARK_STRENGTH',
}

export const RAID_TYPE_TEAM_BENCHMARK_STRATEGY = {
  STANDARD_ONLY:
    'STANDARD_ONLY',

  TEMPORARY_EVOLUTION:
    'TEMPORARY_EVOLUTION',
}

export const RAID_TYPE_TEAM_BENCHMARK_MEMBER_TYPE = {
  STANDARD:
    'STANDARD',

  TEMPORARY_EVOLUTION:
    'TEMPORARY_EVOLUTION',
}

export const RAID_TYPE_TEAM_BENCHMARK_SIZE =
  6

const TEMPORARY_EVOLUTION_CANDIDATE_TYPE =
  'TEMPORARY_EVOLUTION'

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

function clamp(
  value,
  minimum,
  maximum
) {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value
    )
  )
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

// --------------------------------------------------
// Text helpers
// --------------------------------------------------

function normalizeType(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null
  }

  return String(
    value
  ).toUpperCase()
}

// --------------------------------------------------
// Attacker normalization
// --------------------------------------------------

function getCandidateType(
  attacker
) {
  return (
    attacker?.candidateType ??
    attacker
      ?.pokemon
      ?.raidCandidateMetadata
      ?.candidateType ??
    null
  )
}

function isTemporaryEvolution(
  attacker
) {
  return (
    getCandidateType(
      attacker
    ) ===
    TEMPORARY_EVOLUTION_CANDIDATE_TYPE
  )
}

function getRawStrengthScore(
  attacker
) {
  return (
    finiteOrNull(
      attacker?.rawStrengthScore
    ) ??
    finiteOrNull(
      attacker?.averageRawStrengthScore
    ) ??
    finiteOrNull(
      attacker?.rawScore
    )
  )
}

function getDisplayStrengthScore(
  attacker
) {
  return (
    finiteOrNull(
      attacker?.strengthScore
    ) ??
    finiteOrNull(
      attacker?.averageStrengthScore
    )
  )
}

function normalizeAttacker({
  attacker,
  type,
}) {
  if (!attacker) {
    return null
  }

  const attackerType =
    normalizeType(
      attacker.type ??
      attacker.roleType
    )

  if (
    attackerType &&
    attackerType !==
      type
  ) {
    return null
  }

  const rawStrengthScore =
    getRawStrengthScore(
      attacker
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
    ...attacker,

    type,

    candidateId:
      attacker.candidateId ??
      attacker.id ??
      null,

    candidateType:
      getCandidateType(
        attacker
      ),

    pokemonId:
      attacker.pokemonId ??
      attacker
        ?.pokemon
        ?.id ??
      null,

    pokemonName:
      attacker.pokemonName ??
      attacker.label ??
      attacker
        ?.pokemon
        ?.name ??
      attacker
        ?.pokemon
        ?.displayName ??
      'Pokémon',

    form:
      attacker.form ??
      attacker
        ?.pokemon
        ?.form ??
      null,

    rawStrengthScore,

    strengthScore:
      getDisplayStrengthScore(
        attacker
      ),
  }
}

// --------------------------------------------------
// Attacker ordering
// --------------------------------------------------

function compareAttackers(
  first,
  second
) {
  const rawDifference =
    finiteOrFallback(
      second?.rawStrengthScore,
      Number.NEGATIVE_INFINITY
    ) -
    finiteOrFallback(
      first?.rawStrengthScore,
      Number.NEGATIVE_INFINITY
    )

  if (
    rawDifference !==
    0
  ) {
    return rawDifference
  }

  const displayDifference =
    finiteOrFallback(
      second?.strengthScore,
      Number.NEGATIVE_INFINITY
    ) -
    finiteOrFallback(
      first?.strengthScore,
      Number.NEGATIVE_INFINITY
    )

  if (
    displayDifference !==
    0
  ) {
    return displayDifference
  }

  const firstId =
    String(
      first?.candidateId ??
      ''
    )

  const secondId =
    String(
      second?.candidateId ??
      ''
    )

  return firstId.localeCompare(
    secondId
  )
}

function findBestAttacker(
  attackers
) {
  return [
    ...attackers,
  ].sort(
    compareAttackers
  )[0] ?? null
}

// --------------------------------------------------
// Team-member construction
// --------------------------------------------------

function buildTeamMember({
  attacker,
  slot,
  memberType,
}) {
  return {
    slot,

    memberType,

    candidateId:
      attacker?.candidateId ??
      null,

    candidateType:
      attacker?.candidateType ??
      null,

    pokemonId:
      attacker?.pokemonId ??
      null,

    pokemonName:
      attacker?.pokemonName ??
      'Pokémon',

    form:
      attacker?.form ??
      null,

    type:
      attacker?.type ??
      null,

    rawStrengthScore:
      finiteOrNull(
        attacker?.rawStrengthScore
      ),

    strengthScore:
      finiteOrNull(
        attacker?.strengthScore
      ),

    fastMoveId:
      attacker?.fastMoveId ??
      attacker
        ?.bestMoveset
        ?.fastMoveId ??
      null,

    chargedMoveId:
      attacker?.chargedMoveId ??
      attacker
        ?.bestMoveset
        ?.chargedMoveId ??
      null,
  }
}

function buildRepeatedTeam({
  standardAttacker,
  temporaryAttacker = null,
}) {
  const team = []

  if (temporaryAttacker) {
    team.push(
      buildTeamMember({
        attacker:
          temporaryAttacker,

        slot:
          1,

        memberType:
          RAID_TYPE_TEAM_BENCHMARK_MEMBER_TYPE
            .TEMPORARY_EVOLUTION,
      })
    )
  }

  while (
    team.length <
      RAID_TYPE_TEAM_BENCHMARK_SIZE &&
    standardAttacker
  ) {
    team.push(
      buildTeamMember({
        attacker:
          standardAttacker,

        slot:
          team.length + 1,

        memberType:
          RAID_TYPE_TEAM_BENCHMARK_MEMBER_TYPE
            .STANDARD,
      })
    )
  }

  return team
}

// --------------------------------------------------
// Team strength
//
// Six slots always count.
//
// If fewer than six legal members exist, missing slots
// contribute zero.
// --------------------------------------------------

function calculateTeamStrength(
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
          member?.[scoreField],
          0
        ),
      0
    )

  return round(
    total /
      RAID_TYPE_TEAM_BENCHMARK_SIZE,
    6
  )
}

function buildTeamOption({
  strategy,
  standardAttacker,
  temporaryAttacker = null,
}) {
  const team =
    buildRepeatedTeam({
      standardAttacker,
      temporaryAttacker,
    })

  return {
    strategy,

    teamSize:
      RAID_TYPE_TEAM_BENCHMARK_SIZE,

    filledSlotCount:
      team.length,

    missingSlotCount:
      Math.max(
        0,
        RAID_TYPE_TEAM_BENCHMARK_SIZE -
          team.length
      ),

    temporaryEvolutionCount:
      team.filter(
        (member) =>
          member.memberType ===
          RAID_TYPE_TEAM_BENCHMARK_MEMBER_TYPE
            .TEMPORARY_EVOLUTION
      ).length,

    rawStrengthScore:
      calculateTeamStrength(
        team,
        'rawStrengthScore'
      ),

    strengthScore:
      calculateTeamStrength(
        team,
        'strengthScore'
      ),

    team,
  }
}

function compareTeamOptions(
  first,
  second
) {
  const rawDifference =
    finiteOrFallback(
      second?.rawStrengthScore,
      Number.NEGATIVE_INFINITY
    ) -
    finiteOrFallback(
      first?.rawStrengthScore,
      Number.NEGATIVE_INFINITY
    )

  if (
    rawDifference !==
    0
  ) {
    return rawDifference
  }

  // When two teams are exactly equal, prefer the
  // standard-only team because it does not consume the
  // account's one temporary-evolution slot.
  if (
    first?.strategy ===
      RAID_TYPE_TEAM_BENCHMARK_STRATEGY
        .STANDARD_ONLY
  ) {
    return -1
  }

  if (
    second?.strategy ===
      RAID_TYPE_TEAM_BENCHMARK_STRATEGY
        .STANDARD_ONLY
  ) {
    return 1
  }

  return 0
}

// --------------------------------------------------
// Public API — legal theoretical benchmark
// --------------------------------------------------

export function buildRaidTypeTeamBenchmark({
  type,
  attackers,
}) {
  const normalizedType =
    normalizeType(
      type
    )

  if (!normalizedType) {
    return {
      status:
        RAID_TYPE_TEAM_BENCHMARK_STATUS
          .INVALID_TYPE,

      type:
        null,

      teamSize:
        RAID_TYPE_TEAM_BENCHMARK_SIZE,

      team: [],
    }
  }

  const normalizedAttackers =
    (
      Array.isArray(
        attackers
      )
        ? attackers
        : []
    )
      .map(
        (attacker) =>
          normalizeAttacker({
            attacker,
            type:
              normalizedType,
          })
      )
      .filter(
        Boolean
      )

  const standardAttackers =
    normalizedAttackers.filter(
      (attacker) =>
        !isTemporaryEvolution(
          attacker
        )
    )

  const temporaryAttackers =
    normalizedAttackers.filter(
      isTemporaryEvolution
    )

  const bestStandardAttacker =
    findBestAttacker(
      standardAttackers
    )

  const bestTemporaryAttacker =
    findBestAttacker(
      temporaryAttackers
    )

  if (
    !bestStandardAttacker &&
    !bestTemporaryAttacker
  ) {
    return {
      status:
        RAID_TYPE_TEAM_BENCHMARK_STATUS
          .NO_ELIGIBLE_ATTACKERS,

      type:
        normalizedType,

      teamSize:
        RAID_TYPE_TEAM_BENCHMARK_SIZE,

      eligibleAttackerCount:
        0,

      standardAttackerCount:
        0,

      temporaryAttackerCount:
        0,

      bestStandardAttacker:
        null,

      bestTemporaryAttacker:
        null,

      strategy:
        null,

      rawStrengthScore:
        null,

      strengthScore:
        null,

      team: [],
    }
  }

  const options = []

  if (bestStandardAttacker) {
    options.push(
      buildTeamOption({
        strategy:
          RAID_TYPE_TEAM_BENCHMARK_STRATEGY
            .STANDARD_ONLY,

        standardAttacker:
          bestStandardAttacker,
      })
    )
  }

  if (bestTemporaryAttacker) {
    options.push(
      buildTeamOption({
        strategy:
          RAID_TYPE_TEAM_BENCHMARK_STRATEGY
            .TEMPORARY_EVOLUTION,

        standardAttacker:
          bestStandardAttacker,

        temporaryAttacker:
          bestTemporaryAttacker,
      })
    )
  }

  const bestOption =
    [
      ...options,
    ].sort(
      compareTeamOptions
    )[0]

  return {
    status:
      RAID_TYPE_TEAM_BENCHMARK_STATUS
        .SUCCESS,

    type:
      normalizedType,

    teamSize:
      RAID_TYPE_TEAM_BENCHMARK_SIZE,

    eligibleAttackerCount:
      normalizedAttackers.length,

    standardAttackerCount:
      standardAttackers.length,

    temporaryAttackerCount:
      temporaryAttackers.length,

    bestStandardAttacker,

    bestTemporaryAttacker,

    strategy:
      bestOption.strategy,

    filledSlotCount:
      bestOption.filledSlotCount,

    missingSlotCount:
      bestOption.missingSlotCount,

    temporaryEvolutionCount:
      bestOption.temporaryEvolutionCount,

    rawStrengthScore:
      bestOption.rawStrengthScore,

    strengthScore:
      bestOption.strengthScore,

    team:
      bestOption.team,

    options,
  }
}

// --------------------------------------------------
// Public API — player rating
// --------------------------------------------------

export function calculateRaidTypeTeamRating({
  currentRawStrengthScore,
  benchmarkRawStrengthScore,
}) {
  if (
    !Number.isFinite(
      currentRawStrengthScore
    ) ||
    currentRawStrengthScore <
      0
  ) {
    return {
      status:
        RAID_TYPE_TEAM_RATING_STATUS
          .INVALID_CURRENT_STRENGTH,

      rating:
        null,
    }
  }

  if (
    !Number.isFinite(
      benchmarkRawStrengthScore
    ) ||
    benchmarkRawStrengthScore <=
      0
  ) {
    return {
      status:
        RAID_TYPE_TEAM_RATING_STATUS
          .INVALID_BENCHMARK_STRENGTH,

      rating:
        null,
    }
  }

  const rawRatio =
    currentRawStrengthScore /
    benchmarkRawStrengthScore

  const ratio =
    clamp(
      rawRatio,
      0,
      1
    )

  return {
    status:
      RAID_TYPE_TEAM_RATING_STATUS
        .SUCCESS,

    currentRawStrengthScore:
      round(
        currentRawStrengthScore,
        6
      ),

    benchmarkRawStrengthScore:
      round(
        benchmarkRawStrengthScore,
        6
      ),

    rawRatio:
      round(
        rawRatio,
        6
      ),

    ratio:
      round(
        ratio,
        6
      ),

    rating:
      round(
        ratio *
          100,
        2
      ),
  }
}