import {
  buildRaidProjectIntelligence,
  findProjectCollectionPokemon,
} from '../src/services/buildRaidProjectIntelligence.js'

import {
  PROJECT_STATUS,
} from '../src/utils/projectConstants.js'

// --------------------------------------------------
// Test harness
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

    console.log(
      `FAIL - ${name}`
    )

    console.log(
      `       ${error.message}`
    )
  }
}

// --------------------------------------------------
// Fixtures
// --------------------------------------------------

function buildPokemon({
  id =
    'collection-1',

  name =
    'Alakazam',
} = {}) {
  return {
    id,
    name,
  }
}

function buildProject({
  id =
    'project-1',

  collectionId =
    'collection-1',

  status =
    PROJECT_STATUS.ACTIVE,
} = {}) {
  return {
    id,

    collectionId,

    type:
      'RAID_INVESTMENT',

    status,
  }
}

function buildDependencies(
  observations = {}
) {
  return {
    raidDashboardBuilder:
      collection => {
        observations
          .dashboardCollection =
          collection

        return {
          marker:
            'RAID_DASHBOARD',
        }
      },

    raidTypeProfileBuilder:
      collection => {
        observations
          .profileCollection =
          collection

        return {
          marker:
            'RAID_PROFILE',
        }
      },

    accountImpactEnricher:
      recommendation => ({
        ...recommendation,

        marker:
          'ACCOUNT_ENRICHER',
      }),

    projectPlanBuilder:
      ({
        project,
        raidDashboard,
        currentProfile,
        accountImpactEnricher,
      }) => {
        if (
          !Array.isArray(
            observations
              .planCalls
          )
        ) {
          observations
            .planCalls = []
        }

        observations
          .planCalls
          .push({
            project,
            raidDashboard,
            currentProfile,
            accountImpactEnricher,
          })

        return {
          status:
            'SUCCESS',

          projectId:
            project.id,

          collectionId:
            project.collectionId,

          recommendedNow:
            [],

          futureInvestments:
            [],

          notCurrentlyJustified:
            [],
        }
      },
  }
}

// --------------------------------------------------
// Tests
// --------------------------------------------------

console.log('')
console.log(
  '================================'
)
console.log(
  'RAID PROJECT INTELLIGENCE'
)
console.log(
  '================================'
)
console.log('')

runTest(
  'Collection helper finds exact owned Pokémon by id',
  () => {
    const pokemon =
      buildPokemon({
        id:
          'exact-id',
      })

    const result =
      findProjectCollectionPokemon({
        pokemonCollection: [
          buildPokemon({
            id:
              'other-id',
          }),

          pokemon,
        ],

        collectionId:
          'exact-id',
      })

    assert(
      result ===
        pokemon,
      'Expected exact Collection Pokémon.'
    )
  }
)

runTest(
  'Collection helper supports collectionId field',
  () => {
    const pokemon = {
      collectionId:
        'collection-id-field',

      name:
        'Mamoswine',
    }

    const result =
      findProjectCollectionPokemon({
        pokemonCollection: [
          pokemon,
        ],

        collectionId:
          'collection-id-field',
      })

    assert(
      result ===
        pokemon,
      'Expected collectionId compatibility.'
    )
  }
)

runTest(
  'Empty input returns empty Project intelligence',
  () => {
    const observations = {}

    const result =
      buildRaidProjectIntelligence({
        projects:
          [],

        pokemonCollection:
          [],

        dependencies:
          buildDependencies(
            observations
          ),
      })

    assert(
      result
        .evaluatedProjects
        .length ===
        0,
      'Expected no evaluated Projects.'
    )

    assert(
      result
        .currentProjects
        .length ===
        0,
      'Expected no current Projects.'
    )

    assert(
      result
        .removedProjects
        .length ===
        0,
      'Expected no removed Projects.'
    )

    assert(
      result
        .projectCount ===
        0,
      'Expected Project count 0.'
    )
  }
)

runTest(
  'Abandoned Projects are separated and not evaluated',
  () => {
    const observations = {}

    const active =
      buildProject({
        id:
          'active',
      })

    const removed =
      buildProject({
        id:
          'removed',

        collectionId:
          'collection-2',

        status:
          PROJECT_STATUS
            .ABANDONED,
      })

    const result =
      buildRaidProjectIntelligence({
        projects: [
          active,
          removed,
        ],

        pokemonCollection: [
          buildPokemon(),
        ],

        dependencies:
          buildDependencies(
            observations
          ),
      })

    assert(
      result
        .currentProjects
        .length ===
        1,
      'Expected one current Project.'
    )

    assert(
      result
        .removedProjects
        .length ===
        1,
      'Expected one removed Project.'
    )

    assert(
      result
        .evaluatedProjects
        .length ===
        1,
      'Removed Project must not be evaluated.'
    )

    assert(
      observations
        .planCalls
        .length ===
        1,
      'Expected one Project-plan build.'
    )

    assert(
      observations
        .planCalls[0]
        .project
        .id ===
        'active',
      'Expected active Project to be evaluated.'
    )
  }
)

runTest(
  'Paused Projects remain live-evaluated',
  () => {
    const observations = {}

    const paused =
      buildProject({
        status:
          PROJECT_STATUS
            .PAUSED,
      })

    const result =
      buildRaidProjectIntelligence({
        projects: [
          paused,
        ],

        pokemonCollection: [
          buildPokemon(),
        ],

        dependencies:
          buildDependencies(
            observations
          ),
      })

    assert(
      result
        .evaluatedProjects
        .length ===
        1,
      'Paused Project should still be evaluated.'
    )

    assert(
      result
        .evaluatedProjects[0]
        .project
        .status ===
        PROJECT_STATUS
          .PAUSED,
      'Expected paused Project.'
    )
  }
)

runTest(
  'Missing Collection Pokémon remains explicit',
  () => {
    const observations = {}

    const result =
      buildRaidProjectIntelligence({
        projects: [
          buildProject(),
        ],

        pokemonCollection:
          [],

        dependencies:
          buildDependencies(
            observations
          ),
      })

    assert(
      result
        .evaluatedProjects
        .length ===
        1,
      'Project should still be evaluated.'
    )

    assert(
      result
        .evaluatedProjects[0]
        .ownedPokemon ===
        null,
      'Missing owned Pokémon should remain null.'
    )
  }
)

runTest(
  'Shared Raid Dashboard and profile are reused by Project plans',
  () => {
    const observations = {}

    const collection = [
      buildPokemon({
        id:
          'collection-1',
      }),

      buildPokemon({
        id:
          'collection-2',
      }),
    ]

    const result =
      buildRaidProjectIntelligence({
        projects: [
          buildProject({
            id:
              'project-1',

            collectionId:
              'collection-1',
          }),

          buildProject({
            id:
              'project-2',

            collectionId:
              'collection-2',
          }),
        ],

        pokemonCollection:
          collection,

        dependencies:
          buildDependencies(
            observations
          ),
      })

    assert(
      observations
        .dashboardCollection ===
        collection,
      'Dashboard should receive Collection once.'
    )

    assert(
      observations
        .profileCollection ===
        collection,
      'Raid profile should receive Collection once.'
    )

    assert(
      observations
        .planCalls
        .length ===
        2,
      'Expected two Project-plan builds.'
    )

    for (
      const call
      of observations.planCalls
    ) {
      assert(
        call
          .raidDashboard ===
          result
            .raidDashboard,
        'Plans should share one Raid Dashboard.'
      )

      assert(
        call
          .currentProfile ===
          result
            .currentRaidProfile,
        'Plans should share one Raid profile.'
      )
    }
  }
)

runTest(
  'Each Project resolves its exact Collection Pokémon',
  () => {
    const observations = {}

    const alakazam =
      buildPokemon({
        id:
          'alakazam-id',

        name:
          'Alakazam',
      })

    const mamoswine =
      buildPokemon({
        id:
          'mamoswine-id',

        name:
          'Mamoswine',
      })

    const result =
      buildRaidProjectIntelligence({
        projects: [
          buildProject({
            id:
              'alakazam-project',

            collectionId:
              'alakazam-id',
          }),

          buildProject({
            id:
              'mamoswine-project',

            collectionId:
              'mamoswine-id',
          }),
        ],

        pokemonCollection: [
          alakazam,
          mamoswine,
        ],

        dependencies:
          buildDependencies(
            observations
          ),
      })

    const first =
      result
        .evaluatedProjects[0]

    const second =
      result
        .evaluatedProjects[1]

    assert(
      first
        .ownedPokemon ===
        alakazam,
      'First Project should resolve Alakazam.'
    )

    assert(
      second
        .ownedPokemon ===
        mamoswine,
      'Second Project should resolve Mamoswine.'
    )
  }
)

runTest(
  'Project plan receives shared account-impact enricher',
  () => {
    const observations = {}

    const dependencies =
      buildDependencies(
        observations
      )

    buildRaidProjectIntelligence({
      projects: [
        buildProject(),
      ],

      pokemonCollection: [
        buildPokemon(),
      ],

      dependencies,
    })

    assert(
      observations
        .planCalls[0]
        .accountImpactEnricher ===
        dependencies
          .accountImpactEnricher,
      'Expected shared account-impact enricher.'
    )
  }
)

// --------------------------------------------------
// Summary
// --------------------------------------------------

console.log('')
console.log(
  `${passed}/${passed + failed} tests passed`
)

if (failed > 0) {
  process.exitCode = 1
}