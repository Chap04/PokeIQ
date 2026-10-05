import {
  deriveRaidCandidateForReference,
} from '../src/utils/raidCandidate.js'

import {
  getPokemonReference,
} from '../src/utils/pokemonReference.js'

import {
  calculatePokemonStats,
  getCpmForLevel,
} from '../src/utils/pokemonLevel.js'

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

function approximatelyEqual(
  a,
  b,
  tolerance = 0.0000001
) {
  return (
    Number.isFinite(a) &&
    Number.isFinite(b) &&
    Math.abs(a - b) <=
      tolerance
  )
}

console.log('')
console.log(
  '================================'
)
console.log(
  'DERIVED RAID CANDIDATE VALIDATION'
)
console.log(
  '================================'
)
console.log('')

// --------------------------------------------------
// Source individual
// --------------------------------------------------

const level = 40

const cpm =
  getCpmForLevel(
    level
  )

const sourceCandidate = {
  status:
    'READY',

  pokemonIdentity:
    'ANORITH__NORMAL',

  reference:
    getPokemonReference(
      'ANORITH'
    ),

  level,

  cpm,

  ivs: {
    attack:
      15,

    defense:
      13,

    stamina:
      14,
  },

  traits: {
    shadow:
      false,

    purified:
      false,

    lucky:
      true,

    shiny:
      true,
  },

  moves: {
    fast:
      'SCRATCH_FAST',

    charged: [
      'ANCIENT_POWER',
    ],

    chargedSlots: {
      slot1:
        'ANCIENT_POWER',

      slot2:
        null,
    },
  },

  loadouts: [],
}

// --------------------------------------------------
// Anorith → Armaldo
// --------------------------------------------------

const armaldo =
  getPokemonReference(
    'ARMALDO'
  )

const derived =
  deriveRaidCandidateForReference({
    candidate:
      sourceCandidate,

    reference:
      armaldo,
  })

test(
  'Armaldo reference exists',
  Boolean(
    armaldo
  )
)

test(
  'Derived candidate is READY',
  derived.status ===
    'READY'
)

test(
  'Derived identity is Armaldo',
  derived.pokemonIdentity ===
    'ARMALDO__NORMAL'
)

test(
  'Derived reference is Armaldo',
  derived.reference?.id ===
    'ARMALDO'
)

test(
  'Source identity is preserved as provenance',
  derived.sourcePokemonIdentity ===
    'ANORITH__NORMAL'
)

test(
  'Level is preserved',
  derived.level ===
    level
)

test(
  'CPM is preserved',
  approximatelyEqual(
    derived.cpm,
    cpm
  )
)

test(
  'Attack IV is preserved',
  derived.ivs?.attack ===
    15
)

test(
  'Defense IV is preserved',
  derived.ivs?.defense ===
    13
)

test(
  'Stamina IV is preserved',
  derived.ivs?.stamina ===
    14
)

test(
  'Lucky trait is preserved',
  derived.traits?.lucky ===
    true
)

test(
  'Shiny trait is preserved',
  derived.traits?.shiny ===
    true
)

test(
  'Source Fast Move is not copied',
  derived.moves?.fast ===
    null
)

test(
  'Source Charged Move is not copied',
  derived.moves?.charged?.length ===
    0
)

test(
  'Derived candidate has no invented loadouts',
  derived.loadouts?.length ===
    0
)

// --------------------------------------------------
// Stat recalculation
// --------------------------------------------------

const expectedStats =
  calculatePokemonStats({
    baseAttack:
      armaldo.stats.attack,

    baseDefense:
      armaldo.stats.defense,

    baseStamina:
      armaldo.stats.stamina,

    attackIv:
      15,

    defenseIv:
      13,

    staminaIv:
      14,

    cpm,
  })

test(
  'Attack stat uses Armaldo base Attack',
  approximatelyEqual(
    derived.stats?.attack,
    expectedStats?.attack
  )
)

test(
  'Defense stat uses Armaldo base Defense',
  approximatelyEqual(
    derived.stats?.defense,
    expectedStats?.defense
  )
)

test(
  'Stamina stat uses Armaldo base Stamina',
  derived.stats?.stamina ===
    expectedStats?.stamina
)

// --------------------------------------------------
// Combat-state consistency
// --------------------------------------------------

test(
  'Derived combat state is READY',
  derived.combatState
    ?.status ===
    'READY'
)

test(
  'Derived combat state uses Armaldo',
  derived.combatState
    ?.reference
    ?.id ===
    'ARMALDO'
)

test(
  'Derived combat state preserves level',
  derived.combatState
    ?.level ===
    level
)

test(
  'Derived combat state preserves CPM',
  approximatelyEqual(
    derived.combatState
      ?.cpm,
    cpm
  )
)

// --------------------------------------------------
// Invalid inputs
// --------------------------------------------------

const invalidSource =
  deriveRaidCandidateForReference({
    candidate: {
      status:
        'INVALID',
    },

    reference:
      armaldo,
  })

test(
  'Invalid source candidate is rejected',
  invalidSource.status ===
    'INVALID_SOURCE_CANDIDATE'
)

const invalidReference =
  deriveRaidCandidateForReference({
    candidate:
      sourceCandidate,

    reference:
      null,
  })

test(
  'Missing target reference is rejected',
  invalidReference.status ===
    'INVALID_TARGET_REFERENCE'
)

// --------------------------------------------------
// Multi-stage destination
// --------------------------------------------------

const metagross =
  getPokemonReference(
    'METAGROSS'
  )

const metagrossDerived =
  deriveRaidCandidateForReference({
    candidate:
      sourceCandidate,

    reference:
      metagross,
  })

test(
  'Generic derivation also supports Metagross',
  metagrossDerived
    .pokemonIdentity ===
    'METAGROSS__NORMAL'
)

test(
  'Metagross derivation uses Metagross stats',
  metagrossDerived
    .stats
    .attack !==
    derived
      .stats
      .attack
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