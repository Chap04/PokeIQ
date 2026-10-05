import {
  getPokemonEvolutionPaths,
  getPokemonEvolutions,
  getPokemonEvolutionTargets,
  getPokemonReference,
} from '../src/utils/pokemonReference.js'

let passed = 0
let failed = 0

function test(
  description,
  condition
) {
  if (condition) {
    console.log(
      `PASS - ${description}`
    )

    passed += 1
    return
  }

  console.log(
    `FAIL - ${description}`
  )

  failed += 1
}

console.log('')
console.log(
  '================================'
)
console.log(
  'POKÉMON EVOLUTION VALIDATION'
)
console.log(
  '================================'
)
console.log('')

// --------------------------------------------------
// Anorith → Armaldo
// --------------------------------------------------

const anorith =
  getPokemonReference(
    'ANORITH'
  )

const anorithEvolutions =
  getPokemonEvolutions(
    anorith
  )

const anorithTargets =
  getPokemonEvolutionTargets(
    anorith
  )

const anorithPaths =
  getPokemonEvolutionPaths(
    anorith
  )

test(
  'Anorith reference exists',
  Boolean(
    anorith
  )
)

test(
  'Anorith has one direct evolution',
  anorithEvolutions.length ===
    1
)

test(
  'Anorith direct evolution resolves to Armaldo',
  anorithEvolutions[0]
    ?.target
    ?.id ===
    'ARMALDO'
)

test(
  'Anorith target helper returns Armaldo',
  anorithTargets[0]
    ?.id ===
    'ARMALDO'
)

test(
  'Anorith evolution costs 50 Candy',
  anorithEvolutions[0]
    ?.costs
    ?.candy ===
    50
)

test(
  'Anorith purified evolution costs 45 Candy',
  anorithEvolutions[0]
    ?.costs
    ?.purifiedCandy ===
    45
)

test(
  'Anorith has one reachable evolution path',
  anorithPaths.length ===
    1
)

test(
  'Anorith path ends at Armaldo',
  anorithPaths[0]
    ?.target
    ?.id ===
    'ARMALDO'
)

// --------------------------------------------------
// Beldum → Metang → Metagross
// --------------------------------------------------

const beldum =
  getPokemonReference(
    'BELDUM'
  )

const beldumPaths =
  getPokemonEvolutionPaths(
    beldum
  )

const metangPath =
  beldumPaths.find(
    (path) =>
      path.target
        ?.id ===
      'METANG'
  )

const metagrossPath =
  beldumPaths.find(
    (path) =>
      path.target
        ?.id ===
      'METAGROSS'
  )

test(
  'Beldum reference exists',
  Boolean(
    beldum
  )
)

test(
  'Beldum exposes Metang path',
  Boolean(
    metangPath
  )
)

test(
  'Beldum exposes Metagross path',
  Boolean(
    metagrossPath
  )
)

test(
  'Metang path has one stage',
  metangPath
    ?.stageCount ===
    1
)

test(
  'Metagross path has two stages',
  metagrossPath
    ?.stageCount ===
    2
)

test(
  'Beldum → Metang costs 25 Candy',
  metangPath
    ?.costs
    ?.candy ===
    25
)

test(
  'Beldum → Metagross costs 125 Candy',
  metagrossPath
    ?.costs
    ?.candy ===
    125
)

test(
  'Purified Beldum → Metagross costs 112 Candy',
  metagrossPath
    ?.costs
    ?.purifiedCandy ===
    112
)

// --------------------------------------------------
// Eevee branching
// --------------------------------------------------

const eevee =
  getPokemonReference(
    'EEVEE'
  )

const eeveeEvolutions =
  getPokemonEvolutions(
    eevee
  )

const eeveeTargets =
  new Set(
    eeveeEvolutions.map(
      (evolution) =>
        evolution.target
          ?.id
    )
  )

test(
  'Eevee has eight direct evolution branches',
  eeveeEvolutions.length ===
    8
)

test(
  'Eevee includes Vaporeon',
  eeveeTargets.has(
    'VAPOREON'
  )
)

test(
  'Eevee includes Espeon',
  eeveeTargets.has(
    'ESPEON'
  )
)

test(
  'Eevee includes Sylveon',
  eeveeTargets.has(
    'SYLVEON'
  )
)

const espeonEvolution =
  eeveeEvolutions.find(
    (evolution) =>
      evolution.target
        ?.id ===
      'ESPEON'
  )

const leafeonEvolution =
  eeveeEvolutions.find(
    (evolution) =>
      evolution.target
        ?.id ===
      'LEAFEON'
  )

test(
  'Espeon preserves 10 km buddy requirement',
  espeonEvolution
    ?.requirements
    ?.buddyDistanceKm ===
    10
)

test(
  'Espeon preserves must-be-buddy requirement',
  espeonEvolution
    ?.requirements
    ?.mustBeBuddy ===
    true
)

test(
  'Espeon preserves daytime requirement',
  espeonEvolution
    ?.requirements
    ?.daytime ===
    true
)

test(
  'Leafeon preserves Mossy Lure requirement',
  leafeonEvolution
    ?.requirements
    ?.lureItem ===
    'ITEM_TROY_DISK_MOSSY'
)

// --------------------------------------------------
// Item requirement
// --------------------------------------------------

const porygon =
  getPokemonReference(
    'PORYGON'
  )

const porygonEvolution =
  getPokemonEvolutions(
    porygon
  )[0]

test(
  'Porygon preserves Up-Grade requirement',
  porygonEvolution
    ?.costs
    ?.item ===
    'ITEM_UP_GRADE'
)

// --------------------------------------------------
// Special requirements
// --------------------------------------------------

const ursaring =
  getPokemonReference(
    'URSARING'
  )

const ursaringEvolution =
  getPokemonEvolutions(
    ursaring
  )[0]

test(
  'Ursaring preserves full-moon requirement',
  ursaringEvolution
    ?.requirements
    ?.fullMoon ===
    true
)

const inkay =
  getPokemonReference(
    'INKAY'
  )

const inkayEvolution =
  getPokemonEvolutions(
    inkay
  )[0]

test(
  'Inkay preserves upside-down requirement',
  inkayEvolution
    ?.requirements
    ?.upsideDown ===
    true
)

// --------------------------------------------------
// Terminal evolution
// --------------------------------------------------

const metagross =
  getPokemonReference(
    'METAGROSS'
  )

test(
  'Metagross has no permanent evolution paths',
  getPokemonEvolutionPaths(
    metagross
  ).length ===
    0
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

if (
  failed >
  0
) {
  process.exitCode = 1
}