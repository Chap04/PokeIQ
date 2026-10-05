import {
  RAID_ATTACK_TYPES,
  RAID_TYPE_RECOMMENDATION_STATUS,
  selectRaidTypeRecommendations,
} from '../src/services/selectRaidTypeRecommendations.js'

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

function runTest(
  name,
  test
) {
  try {
    test()

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
      `       ${error.message}`
    )
  }
}

function buildTypeTeam({
  type,
  rating,
  rawStrength,
}) {
  return {
    type,

    typeTeamRating:
      rating,

    rawStrengthScore:
      rawStrength,
  }
}

function buildProfile({
  type,
  rating,
  rawStrength,
}) {
  return {
    status:
      'SUCCESS',

    types: {
      [type]:
        buildTypeTeam({
          type,
          rating,
          rawStrength,
        }),
    },
  }
}

function buildRecommendation({
  collectionId,
  pokemonName,
  type = 'FIRE',
  currentRating = 20,
  projectedRating = 30,
  currentRawStrength = 40,
  projectedRawStrength = 60,
  actionable = true,
  resourceBurdenType = 'LOW',
  rank = 1,
  teamChanged = true,
  newCoverage = false,
  cp = 2500,
  title = 'Improve Pokémon',
  actionPathText = 'Improve',
  resourceSummary = '10,000 Stardust and 25 Candy',
}) {
  return {
    collectionId,

    pokemonName,

    pokemon: {
      id: 1,
      form: 'NORMAL',
      name: pokemonName,
      shiny: false,
      variant: 'normal',
    },

    ownedPokemon: {
      cp,
    },

    title,

    actionPathText,

    resourceSummary,

    actionable,

    recommendationType:
      actionable
        ? 'ACTIONABLE'
        : 'POTENTIAL_EVOLUTION',

    resourceBurdenType,

    resourceBurden:
      resourceBurdenType,

    rank,

    engineRank:
      rank,

    opportunity: {
      id:
        `${collectionId}-opportunity`,
    },

    accountImpact: {
      status:
        'SUCCESS',

      currentProfile:
        buildProfile({
          type,
          rating:
            currentRating,
          rawStrength:
            currentRawStrength,
        }),

      projectedProfile:
        buildProfile({
          type,
          rating:
            projectedRating,
          rawStrength:
            projectedRawStrength,
        }),

      affectedTypes: [
        {
          type,
          teamChanged,
          newCoverage,
        },
      ],
    },
  }
}

console.log(
  '\n================================'
)

console.log(
  'RAID TYPE RECOMMENDATION VALIDATION'
)

console.log(
  '================================\n'
)

runTest(
  'Invalid recommendation input is rejected safely',
  () => {
    const result =
      selectRaidTypeRecommendations({
        recommendations:
          null,
      })

    assert(
      result.status ===
        RAID_TYPE_RECOMMENDATION_STATUS
          .INVALID_RECOMMENDATIONS,
      'Expected INVALID_RECOMMENDATIONS.'
    )

    assert(
      result.recommendationCount ===
        0,
      'Invalid input should select no recommendations.'
    )
  }
)

runTest(
  'All 18 attacking types are always returned',
  () => {
    const result =
      selectRaidTypeRecommendations({
        recommendations: [],
      })

    assert(
      Object.keys(
        result.byType
      ).length ===
        18,
      'Expected exactly 18 type keys.'
    )

    assert(
      RAID_ATTACK_TYPES.every(
        (type) =>
          Object.hasOwn(
            result.byType,
            type
          )
      ),
      'At least one attacking type is missing.'
    )
  }
)

runTest(
  'A type receives at most one recommendation',
  () => {
    const result =
      selectRaidTypeRecommendations({
        recommendations: [
          buildRecommendation({
            collectionId:
              'fire-1',
            pokemonName:
              'Charizard',
          }),

          buildRecommendation({
            collectionId:
              'fire-2',
            pokemonName:
              'Reshiram',
            projectedRating:
              35,
            projectedRawStrength:
              70,
          }),
        ],
      })

    assert(
      result.recommendationCount ===
        1,
      'Expected exactly one selected type recommendation.'
    )

    assert(
      result.byType.FIRE !==
        null,
      'Expected a Fire recommendation.'
    )
  }
)

runTest(
  'The largest clearly superior rating gain wins',
  () => {
    const result =
      selectRaidTypeRecommendations({
        recommendations: [
          buildRecommendation({
            collectionId:
              'small-gain',
            pokemonName:
              'Charizard',
            projectedRating:
              25,
            projectedRawStrength:
              50,
            resourceBurdenType:
              'LOW',
          }),

          buildRecommendation({
            collectionId:
              'large-gain',
            pokemonName:
              'Reshiram',
            projectedRating:
              40,
            projectedRawStrength:
              80,
            resourceBurdenType:
              'PREMIUM',
          }),
        ],
      })

    assert(
      result.byType.FIRE
        ?.collectionId ===
        'large-gain',
      'The clearly larger rating gain should win.'
    )
  }
)

runTest(
  'Lower resource burden wins when rating gains are close',
  () => {
    const result =
      selectRaidTypeRecommendations({
        recommendations: [
          buildRecommendation({
            collectionId:
              'premium-close',
            pokemonName:
              'Premium attacker',
            projectedRating:
              30,
            projectedRawStrength:
              60,
            resourceBurdenType:
              'PREMIUM',
          }),

          buildRecommendation({
            collectionId:
              'low-close',
            pokemonName:
              'Low-cost attacker',
            projectedRating:
              29.5,
            projectedRawStrength:
              59,
            resourceBurdenType:
              'LOW',
          }),
        ],
      })

    assert(
      result.byType.FIRE
        ?.collectionId ===
        'low-close',
      'The lower-cost close alternative should win.'
    )
  }
)

runTest(
  'Actionable recommendation wins when gains are close',
  () => {
    const result =
      selectRaidTypeRecommendations({
        recommendations: [
          buildRecommendation({
            collectionId:
              'potential-close',
            pokemonName:
              'Potential evolution',
            projectedRating:
              30,
            projectedRawStrength:
              60,
            actionable:
              false,
          }),

          buildRecommendation({
            collectionId:
              'actionable-close',
            pokemonName:
              'Actionable attacker',
            projectedRating:
              29.5,
            projectedRawStrength:
              59,
            actionable:
              true,
          }),
        ],
      })

    assert(
      result.byType.FIRE
        ?.collectionId ===
        'actionable-close',
      'The actionable close alternative should win.'
    )
  }
)

runTest(
  'Excluded Project Pokémon cannot be selected',
  () => {
    const result =
      selectRaidTypeRecommendations({
        recommendations: [
          buildRecommendation({
            collectionId:
              'active-project',
            pokemonName:
              'Project Pokémon',
            projectedRating:
              40,
            projectedRawStrength:
              80,
          }),

          buildRecommendation({
            collectionId:
              'available',
            pokemonName:
              'Available Pokémon',
            projectedRating:
              30,
            projectedRawStrength:
              60,
          }),
        ],

        excludedCollectionIds:
          new Set([
            'active-project',
          ]),
      })

    assert(
      result.byType.FIRE
        ?.collectionId ===
        'available',
      'The excluded Project Pokémon was selected.'
    )

    assert(
      result.excludedRecommendationCount ===
        1,
      'Expected one excluded recommendation.'
    )
  }
)

runTest(
  'Zero rating gain produces no recommendation',
  () => {
    const result =
      selectRaidTypeRecommendations({
        recommendations: [
          buildRecommendation({
            collectionId:
              'zero-gain',
            pokemonName:
              'No improvement',
            projectedRating:
              20,
            projectedRawStrength:
              40,
          }),
        ],
      })

    assert(
      result.byType.FIRE ===
        null,
      'A zero-impact recommendation should not be selected.'
    )
  }
)

runTest(
  'Raw-strength regression is rejected',
  () => {
    const result =
      selectRaidTypeRecommendations({
        recommendations: [
          buildRecommendation({
            collectionId:
              'raw-regression',
            pokemonName:
              'Regressive attacker',
            projectedRating:
              30,
            projectedRawStrength:
              39,
          }),
        ],
      })

    assert(
      result.byType.FIRE ===
        null,
      'A raw-strength regression should not be selected.'
    )
  }
)

runTest(
  'Missing account-impact profiles are ignored safely',
  () => {
    const result =
      selectRaidTypeRecommendations({
        recommendations: [
          {
            collectionId:
              'missing-impact',
            pokemonName:
              'Missing impact',
            accountImpact:
              null,
          },
        ],
      })

    assert(
      result.recommendationCount ===
        0,
      'Missing impact data should not produce a recommendation.'
    )
  }
)

runTest(
  'Dashboard order breaks otherwise equal ties',
  () => {
    const result =
      selectRaidTypeRecommendations({
        recommendations: [
          buildRecommendation({
            collectionId:
              'dashboard-first',
            pokemonName:
              'First recommendation',
            rank: 1,
          }),

          buildRecommendation({
            collectionId:
              'dashboard-second',
            pokemonName:
              'Second recommendation',
            rank: 2,
          }),
        ],
      })

    assert(
      result.byType.FIRE
        ?.collectionId ===
        'dashboard-first',
      'Expected existing Dashboard order to break the tie.'
    )
  }
)

runTest(
  'Selected result exposes projected type-team change',
  () => {
    const result =
      selectRaidTypeRecommendations({
        recommendations: [
          buildRecommendation({
            collectionId:
              'new-coverage',
            pokemonName:
              'Coverage creator',
            type:
              'FAIRY',
            currentRating:
              0,
            projectedRating:
              8.75,
            currentRawStrength:
              0,
            projectedRawStrength:
              15.5,
            newCoverage:
              true,
          }),
        ],
      })

    const recommendation =
      result.byType.FAIRY

    assert(
      recommendation
        ?.ratingGain ===
        8.75,
      'Expected the exact projected rating gain.'
    )

    assert(
      recommendation
        ?.rawStrengthGain ===
        15.5,
      'Expected the exact raw-strength gain.'
    )

    assert(
      recommendation
        ?.createsNewCoverage ===
        true,
      'Expected new coverage to be exposed.'
    )
  }
)

runTest(
  'Selected result exposes compact Raid Profile display fields',
  () => {
    const result =
      selectRaidTypeRecommendations({
        recommendations: [
          buildRecommendation({
            collectionId:
              'display-contract',
            pokemonName:
              'Mewtwo',
            type:
              'PSYCHIC',
            cp:
              2387,
            title:
              'Power Up to Level 35',
            actionPathText:
              'Power Up',
            resourceSummary:
              '137,000 Stardust and 130 Mewtwo Candy',
          }),
        ],
      })

    const recommendation =
      result.byType.PSYCHIC

    assert(
      recommendation
        ?.ownedPokemon
        ?.cp ===
        2387,
      'Expected exact owned Pokémon CP to be exposed.'
    )

    assert(
      recommendation
        ?.title ===
        'Power Up to Level 35',
      'Expected recommendation title to be exposed.'
    )

    assert(
      recommendation
        ?.actionPathText ===
        'Power Up',
      'Expected action-path text to be exposed.'
    )

    assert(
      recommendation
        ?.resourceSummary ===
        '137,000 Stardust and 130 Mewtwo Candy',
      'Expected compact resource summary to be exposed.'
    )
  }
)

console.log(
  `\n${passed}/${passed + failed} tests passed`
)

if (
  failed >
  0
) {
  process.exitCode = 1
}