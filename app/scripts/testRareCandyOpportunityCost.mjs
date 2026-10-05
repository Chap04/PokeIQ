import {
  evaluateRareCandyOpportunityCost,
  RARE_CANDY_OPPORTUNITY_COST_STATUS,
  RARE_CANDY_USE_RECOMMENDATION,
} from '../src/services/evaluateRareCandyOpportunityCost.js'

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function buildRecommendation({
  collectionId,
  pokemonName,
  title,
  accountPointChange,
  accountPercentChange,
  improvedTypeCount,
  sharedResource = 'RARE_CANDY',
  sharedResourceOwned = 100,
  candyMissing,
  candyResource = 'CANDY',
}) {
  return {
    collectionId,

    pokemonName,

    title,

    accountImpactSummary: {
      overallStrengthPointChange:
        accountPointChange,

      overallStrengthPercentChange:
        accountPercentChange,

      improvedTypeCount,

      regressedTypeCount:
        accountPointChange <
          0
          ? 1
          : 0,
    },

    resourceActionability: {
      evaluations: [
        {
          resource:
            candyResource,

          candyFamilyId:
            `FAMILY_${pokemonName.toUpperCase()}`,

          candyFamilyName:
            pokemonName,

          owned:
            0,

          required:
            candyMissing,

          minimumRequired:
            candyMissing,

          missing:
            candyMissing,

          sharedCandyResource: {
            resource:
              sharedResource,

            label:
              sharedResource ===
                'RARE_CANDY_XL'
                ? 'Rare Candy XL'
                : 'Rare Candy',

            balanceKey:
              sharedResource ===
                'RARE_CANDY_XL'
                ? 'rareCandyXl'
                : 'rareCandy',

            owned:
              sharedResourceOwned,

            known:
              Number.isFinite(
                sharedResourceOwned
              ),
          },
        },
      ],
    },
  }
}

function runTest(
  name,
  callback
) {
  try {
    callback()

    console.log(
      `PASS - ${name}`
    )

    return true
  } catch (error) {
    console.error(
      `FAIL - ${name}`
    )

    console.error(
      error.message
    )

    return false
  }
}

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

// --------------------------------------------------
// Tests
// --------------------------------------------------

const tests = []

tests.push(
  runTest(
    'Invalid recommendations are rejected',
    () => {
      const result =
        evaluateRareCandyOpportunityCost(
          null
        )

      assert(
        result.status ===
          RARE_CANDY_OPPORTUNITY_COST_STATUS
            .INVALID_RECOMMENDATIONS,
        'Expected INVALID_RECOMMENDATIONS.'
      )
    }
  )
)

tests.push(
  runTest(
    'No Candy shortfalls returns no opportunities',
    () => {
      const result =
        evaluateRareCandyOpportunityCost([
          {
            collectionId:
              '1',

            pokemonName:
              'Alakazam',

            resourceActionability: {
              evaluations: [],
            },
          },
        ])

      assert(
        result.status ===
          RARE_CANDY_OPPORTUNITY_COST_STATUS
            .NO_OPPORTUNITIES,
        'Expected NO_OPPORTUNITIES.'
      )
    }
  )
)

tests.push(
  runTest(
    'Dominated Rare Candy use is marked Save',
    () => {
      const result =
        evaluateRareCandyOpportunityCost([
          buildRecommendation({
            collectionId:
              '1',

            pokemonName:
              'Alakazam',

            title:
              'Power Up',

            accountPointChange:
              0.08,

            accountPercentChange:
              0.95,

            improvedTypeCount:
              2,

            candyMissing:
              40,
          }),

          buildRecommendation({
            collectionId:
              '2',

            pokemonName:
              'WeakerMon',

            title:
              'Power Up',

            accountPointChange:
              0.04,

            accountPercentChange:
              0.40,

            improvedTypeCount:
              1,

            candyMissing:
              60,
          }),
        ])

      const weaker =
        result.resourceRankings
          .rareCandy
          .find(
            (entry) =>
              entry.pokemonName ===
              'WeakerMon'
          )

      assert(
        weaker
          .dominatedByCount ===
          1,
        'Expected WeakerMon to be dominated.'
      )

      assert(
        weaker
          .recommendation
          .type ===
          RARE_CANDY_USE_RECOMMENDATION
            .SAVE,
        'Expected dominated opportunity to be SAVE.'
      )
    }
  )
)

tests.push(
  runTest(
    'Tradeoff opportunities can both remain on the frontier',
    () => {
      const result =
        evaluateRareCandyOpportunityCost([
          buildRecommendation({
            collectionId:
              '1',

            pokemonName:
              'Alakazam',

            title:
              'Power Up',

            accountPointChange:
              0.08,

            accountPercentChange:
              0.95,

            improvedTypeCount:
              2,

            candyMissing:
              40,
          }),

          buildRecommendation({
            collectionId:
              '2',

            pokemonName:
              'Aerodactyl',

            title:
              'Power Up',

            accountPointChange:
              0.05,

            accountPercentChange:
              0.59,

            improvedTypeCount:
              2,

            candyMissing:
              20,
          }),
        ])

      const opportunities =
        result.resourceRankings
          .rareCandy

      assert(
        opportunities.every(
          (entry) =>
            entry.frontier ===
            true
        ),
        'Expected both opportunities to remain on the frontier.'
      )

      assert(
        opportunities.every(
          (entry) =>
            entry
              .dominatedByCount ===
            0
        ),
        'Expected neither opportunity to dominate the other.'
      )
    }
  )
)

tests.push(
  runTest(
    'Insufficient Rare Candy is marked Not Enough',
    () => {
      const result =
        evaluateRareCandyOpportunityCost([
          buildRecommendation({
            collectionId:
              '1',

            pokemonName:
              'Alakazam',

            title:
              'Power Up',

            accountPointChange:
              0.08,

            accountPercentChange:
              0.95,

            improvedTypeCount:
              2,

            candyMissing:
              40,

            sharedResourceOwned:
              10,
          }),
        ])

      const opportunity =
        result.resourceRankings
          .rareCandy[0]

      assert(
        opportunity
          .recommendation
          .type ===
          RARE_CANDY_USE_RECOMMENDATION
            .NOT_ENOUGH,
        'Expected NOT_ENOUGH.'
      )
    }
  )
)

tests.push(
  runTest(
    'Rare Candy XL is ranked separately',
    () => {
      const result =
        evaluateRareCandyOpportunityCost([
          buildRecommendation({
            collectionId:
              '1',

            pokemonName:
              'Alakazam',

            title:
              'Power Up to Level 50',

            accountPointChange:
              0.08,

            accountPercentChange:
              0.95,

            improvedTypeCount:
              2,

            candyMissing:
              20,

            candyResource:
              'CANDY_XL',

            sharedResource:
              'RARE_CANDY_XL',

            sharedResourceOwned:
              30,
          }),
        ])

      assert(
        result
          .rareCandyOpportunityCount ===
          0,
        'Expected no regular Rare Candy opportunities.'
      )

      assert(
        result
          .rareCandyXlOpportunityCount ===
          1,
        'Expected one Rare Candy XL opportunity.'
      )

      assert(
        result
          .resourceRankings
          .rareCandyXL[0]
          .sharedResource ===
          'RARE_CANDY_XL',
        'Expected Rare Candy XL resource.'
      )
    }
  )
)

tests.push(
  runTest(
    'Negative account impact recommends saving',
    () => {
      const result =
        evaluateRareCandyOpportunityCost([
          buildRecommendation({
            collectionId:
              '1',

            pokemonName:
              'Abra',

            title:
              'Evolution Investment',

            accountPointChange:
              -0.07,

            accountPercentChange:
              -0.83,

            improvedTypeCount:
              1,

            candyMissing:
              25,
          }),
        ])

      const opportunity =
        result.resourceRankings
          .rareCandy[0]

      assert(
        opportunity
          .recommendation
          .type ===
          RARE_CANDY_USE_RECOMMENDATION
            .SAVE,
        'Expected negative account impact to recommend SAVE.'
      )
    }
  )
)

// --------------------------------------------------
// Summary
// --------------------------------------------------

const passed =
  tests.filter(
    Boolean
  ).length

console.log('')
console.log(
  '================================'
)
console.log(
  'RARE CANDY INTELLIGENCE VALIDATION'
)
console.log(
  '================================'
)
console.log('')
console.log(
  `${passed}/${tests.length} tests passed`
)

if (
  passed !==
  tests.length
) {
  process.exitCode =
    1
}