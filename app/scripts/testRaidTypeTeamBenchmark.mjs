import {
  buildRaidTypeTeamBenchmark,
  calculateRaidTypeTeamRating,
  RAID_TYPE_TEAM_BENCHMARK_STATUS,
  RAID_TYPE_TEAM_BENCHMARK_STRATEGY,
  RAID_TYPE_TEAM_RATING_STATUS,
} from '../src/utils/raidTypeTeamBenchmark.js'

// --------------------------------------------------
// PokeIQ Raid Type Team Benchmark Validation
// --------------------------------------------------

let passed = 0
let failed = 0

function assert(
  condition,
  message
) {
  if (!condition) {
    throw new Error(
      message
    )
  }
}

function assertEqual(
  actual,
  expected,
  message
) {
  if (
    actual !==
    expected
  ) {
    throw new Error(
      `${message}\nExpected: ${expected}\nActual: ${actual}`
    )
  }
}

function assertClose(
  actual,
  expected,
  tolerance,
  message
) {
  if (
    !Number.isFinite(
      actual
    ) ||
    Math.abs(
      actual -
      expected
    ) >
      tolerance
  ) {
    throw new Error(
      `${message}\nExpected: ${expected}\nActual: ${actual}`
    )
  }
}

function test(
  name,
  callback
) {
  try {
    callback()

    passed += 1

    console.log(
      `PASS - ${name}`
    )
  } catch (error) {
    failed += 1

    console.error(
      `FAIL - ${name}`
    )

    console.error(
      error?.message ??
      error
    )
  }
}

function buildAttacker({
  id,
  type = 'DRAGON',
  candidateType = 'PERMANENT',
  rawStrengthScore,
  strengthScore = null,
  pokemonName = null,
}) {
  return {
    candidateId:
      id,

    candidateType,

    pokemonId:
      id,

    pokemonName:
      pokemonName ??
      id,

    type,

    rawStrengthScore,

    strengthScore,

    fastMoveId:
      'TEST_FAST',

    chargedMoveId:
      'TEST_CHARGED',
  }
}

console.log('')
console.log(
  '================================'
)
console.log(
  'RAID TYPE TEAM BENCHMARK VALIDATION'
)
console.log(
  '================================'
)
console.log('')

// --------------------------------------------------
// Input validation
// --------------------------------------------------

test(
  'Missing attacking type is rejected',
  () => {
    const result =
      buildRaidTypeTeamBenchmark({
        type:
          null,

        attackers: [],
      })

    assertEqual(
      result.status,
      RAID_TYPE_TEAM_BENCHMARK_STATUS
        .INVALID_TYPE,
      'Missing type should return INVALID_TYPE.'
    )
  }
)

test(
  'Empty attacker list returns no eligible attackers',
  () => {
    const result =
      buildRaidTypeTeamBenchmark({
        type:
          'DRAGON',

        attackers: [],
      })

    assertEqual(
      result.status,
      RAID_TYPE_TEAM_BENCHMARK_STATUS
        .NO_ELIGIBLE_ATTACKERS,
      'Empty attacker list should return NO_ELIGIBLE_ATTACKERS.'
    )

    assertEqual(
      result.team.length,
      0,
      'Empty attacker list should build no team members.'
    )
  }
)

// --------------------------------------------------
// Standard-team construction
// --------------------------------------------------

test(
  'Best standard attacker fills all six legal slots',
  () => {
    const result =
      buildRaidTypeTeamBenchmark({
        type:
          'DRAGON',

        attackers: [
          buildAttacker({
            id:
              'DRAGONITE',

            rawStrengthScore:
              92,
          }),
        ],
      })

    assertEqual(
      result.status,
      RAID_TYPE_TEAM_BENCHMARK_STATUS
        .SUCCESS,
      'Standard benchmark should succeed.'
    )

    assertEqual(
      result.strategy,
      RAID_TYPE_TEAM_BENCHMARK_STRATEGY
        .STANDARD_ONLY,
      'Standard-only strategy should be selected.'
    )

    assertEqual(
      result.team.length,
      6,
      'Standard attacker should fill six team slots.'
    )

    assert(
      result.team.every(
        (member) =>
          member.candidateId ===
          'DRAGONITE'
      ),
      'Every standard slot should use the best standard attacker.'
    )

    assertClose(
      result.rawStrengthScore,
      92,
      0.000001,
      'Repeated standard team should preserve the attacker average.'
    )
  }
)

test(
  'Stronger standard attacker is selected',
  () => {
    const result =
      buildRaidTypeTeamBenchmark({
        type:
          'DRAGON',

        attackers: [
          buildAttacker({
            id:
              'DRAGONITE',

            rawStrengthScore:
              92,
          }),

          buildAttacker({
            id:
              'RAYQUAZA',

            rawStrengthScore:
              108,
          }),

          buildAttacker({
            id:
              'HAXORUS',

            rawStrengthScore:
              97,
          }),
        ],
      })

    assertEqual(
      result.bestStandardAttacker
        .candidateId,
      'RAYQUAZA',
      'Highest raw-strength standard attacker should be selected.'
    )

    assert(
      result.team.every(
        (member) =>
          member.candidateId ===
          'RAYQUAZA'
      ),
      'The legal standard team should use six copies of Rayquaza.'
    )

    assertClose(
      result.rawStrengthScore,
      108,
      0.000001,
      'Team score should equal Rayquaza raw strength.'
    )
  }
)

test(
  'Shadow attacker is treated as a duplicable standard member',
  () => {
    const result =
      buildRaidTypeTeamBenchmark({
        type:
          'ICE',

        attackers: [
          buildAttacker({
            id:
              'MAMOSWINE',

            type:
              'ICE',

            candidateType:
              'PERMANENT',

            rawStrengthScore:
              88,
          }),

          buildAttacker({
            id:
              'MAMOSWINE__SHADOW',

            type:
              'ICE',

            candidateType:
              'SHADOW',

            rawStrengthScore:
              104,
          }),
        ],
      })

    assertEqual(
      result.strategy,
      RAID_TYPE_TEAM_BENCHMARK_STRATEGY
        .STANDARD_ONLY,
      'Shadow team should remain STANDARD_ONLY.'
    )

    assertEqual(
      result.bestStandardAttacker
        .candidateId,
      'MAMOSWINE__SHADOW',
      'Shadow Mamoswine should be the best standard-slot attacker.'
    )

    assertEqual(
      result.team.length,
      6,
      'Shadow attacker should be legally duplicated into six slots.'
    )

    assert(
      result.team.every(
        (member) =>
          member.candidateType ===
          'SHADOW'
      ),
      'Every slot should preserve Shadow candidate metadata.'
    )
  }
)

// --------------------------------------------------
// Temporary-evolution legality
// --------------------------------------------------

test(
  'One stronger temporary evolution replaces one standard slot',
  () => {
    const result =
      buildRaidTypeTeamBenchmark({
        type:
          'DRAGON',

        attackers: [
          buildAttacker({
            id:
              'RAYQUAZA',

            rawStrengthScore:
              100,
          }),

          buildAttacker({
            id:
              'RAYQUAZA__TEMP_EVOLUTION_MEGA',

            candidateType:
              'TEMPORARY_EVOLUTION',

            rawStrengthScore:
              130,
          }),
        ],
      })

    assertEqual(
      result.strategy,
      RAID_TYPE_TEAM_BENCHMARK_STRATEGY
        .TEMPORARY_EVOLUTION,
      'Temporary-evolution strategy should win.'
    )

    assertEqual(
      result.team.length,
      6,
      'Temporary-evolution team should contain six members.'
    )

    assertEqual(
      result.temporaryEvolutionCount,
      1,
      'Temporary-evolution team must contain exactly one temporary member.'
    )

    assertEqual(
      result.team[0]
        .candidateId,
      'RAYQUAZA__TEMP_EVOLUTION_MEGA',
      'Temporary evolution should occupy the first slot.'
    )

    assert(
      result.team
        .slice(
          1
        )
        .every(
          (member) =>
            member.candidateId ===
            'RAYQUAZA'
        ),
      'Remaining five slots should use the best standard attacker.'
    )

    assertClose(
      result.rawStrengthScore,
      105,
      0.000001,
      'Expected team average is (130 + 5 × 100) ÷ 6.'
    )
  }
)

test(
  'Only the strongest temporary evolution may be used',
  () => {
    const result =
      buildRaidTypeTeamBenchmark({
        type:
          'FIRE',

        attackers: [
          buildAttacker({
            id:
              'RESHIRAM',

            type:
              'FIRE',

            rawStrengthScore:
              100,
          }),

          buildAttacker({
            id:
              'CHARIZARD__MEGA_X',

            type:
              'FIRE',

            candidateType:
              'TEMPORARY_EVOLUTION',

            rawStrengthScore:
              115,
          }),

          buildAttacker({
            id:
              'BLAZIKEN__MEGA',

            type:
              'FIRE',

            candidateType:
              'TEMPORARY_EVOLUTION',

            rawStrengthScore:
              125,
          }),
        ],
      })

    assertEqual(
      result.bestTemporaryAttacker
        .candidateId,
      'BLAZIKEN__MEGA',
      'Strongest temporary evolution should be selected.'
    )

    assertEqual(
      result.temporaryEvolutionCount,
      1,
      'Only one temporary evolution may appear on the team.'
    )

    assertEqual(
      result.team.filter(
        (member) =>
          member.candidateType ===
          'TEMPORARY_EVOLUTION'
      ).length,
      1,
      'The final team must enforce the one-temporary limit.'
    )
  }
)

test(
  'Weaker temporary evolution is excluded',
  () => {
    const result =
      buildRaidTypeTeamBenchmark({
        type:
          'WATER',

        attackers: [
          buildAttacker({
            id:
              'KYOGRE',

            type:
              'WATER',

            rawStrengthScore:
              110,
          }),

          buildAttacker({
            id:
              'TEST_WEAK_MEGA',

            type:
              'WATER',

            candidateType:
              'TEMPORARY_EVOLUTION',

            rawStrengthScore:
              90,
          }),
        ],
      })

    assertEqual(
      result.strategy,
      RAID_TYPE_TEAM_BENCHMARK_STRATEGY
        .STANDARD_ONLY,
      'Weaker temporary evolution should not consume the temporary slot.'
    )

    assertEqual(
      result.temporaryEvolutionCount,
      0,
      'Standard-only winning team should contain no temporary evolution.'
    )

    assertClose(
      result.rawStrengthScore,
      110,
      0.000001,
      'Standard-only team should preserve the stronger standard score.'
    )
  }
)

test(
  'Temporary-only universe fills one legal slot',
  () => {
    const result =
      buildRaidTypeTeamBenchmark({
        type:
          'POISON',

        attackers: [
          buildAttacker({
            id:
              'TEST_POISON_MEGA',

            type:
              'POISON',

            candidateType:
              'TEMPORARY_EVOLUTION',

            rawStrengthScore:
              120,
          }),
        ],
      })

    assertEqual(
      result.status,
      RAID_TYPE_TEAM_BENCHMARK_STATUS
        .SUCCESS,
      'Temporary-only benchmark should still succeed.'
    )

    assertEqual(
      result.team.length,
      1,
      'Only one temporary evolution may fill the otherwise empty team.'
    )

    assertEqual(
      result.missingSlotCount,
      5,
      'Five legal team slots should remain empty.'
    )

    assertClose(
      result.rawStrengthScore,
      20,
      0.000001,
      'One score-120 attacker across six slots should average to 20.'
    )
  }
)

// --------------------------------------------------
// Role filtering
// --------------------------------------------------

test(
  'Attackers for another type are ignored',
  () => {
    const result =
      buildRaidTypeTeamBenchmark({
        type:
          'DRAGON',

        attackers: [
          buildAttacker({
            id:
              'RAYQUAZA',

            type:
              'DRAGON',

            rawStrengthScore:
              105,
          }),

          buildAttacker({
            id:
              'MEWTWO',

            type:
              'PSYCHIC',

            rawStrengthScore:
              140,
          }),
        ],
      })

    assertEqual(
      result.eligibleAttackerCount,
      1,
      'Only matching-role attackers should be eligible.'
    )

    assertEqual(
      result.bestStandardAttacker
        .candidateId,
      'RAYQUAZA',
      'Psychic attacker must not enter the Dragon benchmark.'
    )
  }
)

// --------------------------------------------------
// Rating calculation
// --------------------------------------------------

test(
  'Current team receives proportional rating',
  () => {
    const result =
      calculateRaidTypeTeamRating({
        currentRawStrengthScore:
          75,

        benchmarkRawStrengthScore:
          100,
      })

    assertEqual(
      result.status,
      RAID_TYPE_TEAM_RATING_STATUS
        .SUCCESS,
      'Valid rating should succeed.'
    )

    assertClose(
      result.rating,
      75,
      0.000001,
      '75 against a 100 benchmark should rate 75.'
    )
  }
)

test(
  'Rating is capped at 100',
  () => {
    const result =
      calculateRaidTypeTeamRating({
        currentRawStrengthScore:
          110,

        benchmarkRawStrengthScore:
          100,
      })

    assertClose(
      result.rawRatio,
      1.1,
      0.000001,
      'Raw ratio should preserve evidence above the benchmark.'
    )

    assertClose(
      result.rating,
      100,
      0.000001,
      'Displayed rating should be capped at 100.'
    )
  }
)

test(
  'Zero-strength current team receives rating zero',
  () => {
    const result =
      calculateRaidTypeTeamRating({
        currentRawStrengthScore:
          0,

        benchmarkRawStrengthScore:
          120,
      })

    assertEqual(
      result.status,
      RAID_TYPE_TEAM_RATING_STATUS
        .SUCCESS,
      'Zero current strength is valid.'
    )

    assertClose(
      result.rating,
      0,
      0.000001,
      'Empty current team should rate zero.'
    )
  }
)

test(
  'Invalid benchmark strength is rejected',
  () => {
    const result =
      calculateRaidTypeTeamRating({
        currentRawStrengthScore:
          50,

        benchmarkRawStrengthScore:
          0,
      })

    assertEqual(
      result.status,
      RAID_TYPE_TEAM_RATING_STATUS
        .INVALID_BENCHMARK_STRENGTH,
      'Zero benchmark strength should be rejected.'
    )

    assertEqual(
      result.rating,
      null,
      'Invalid benchmark should not produce a rating.'
    )
  }
)

// --------------------------------------------------
// Summary
// --------------------------------------------------

console.log('')
console.log(
  '================================'
)
console.log(
  `${passed}/${passed + failed} tests passed`
)
console.log(
  '================================'
)
console.log('')

if (
  failed >
  0
) {
  process.exitCode = 1
}