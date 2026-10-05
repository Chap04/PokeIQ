import {
  buildRaidPossibleStates,
  RAID_POSSIBLE_STATE_ACTION,
  RAID_POSSIBLE_STATE_TYPE,
} from '../src/utils/raidPossibleStates.js'

import {
  getChargedMoveOptions,
  getFastMoveOptions,
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

function getNormalOptions(
  options
) {
  return options.filter(
    (option) =>
      option.availability ===
      'NORMAL'
  )
}

function buildCandidate(
  pokemonId,
  {
    twoChargedMoves = false,
  } = {}
) {
  const reference =
    getPokemonReference(
      pokemonId
    )

  const fastOptions =
    getNormalOptions(
      getFastMoveOptions(
        reference
      )
    )

  const chargedOptions =
    getNormalOptions(
      getChargedMoveOptions(
        reference
      )
    )

  const level = 40

  const cpm =
    getCpmForLevel(
      level
    )

  const ivs = {
    attack:
      15,

    defense:
      14,

    stamina:
      13,
  }

  const stats =
    calculatePokemonStats({
      baseAttack:
        reference.stats.attack,

      baseDefense:
        reference.stats.defense,

      baseStamina:
        reference.stats.stamina,

      attackIv:
        ivs.attack,

      defenseIv:
        ivs.defense,

      staminaIv:
        ivs.stamina,

      cpm,
    })

  const fastMoveId =
    fastOptions[0]?.id

  const chargedMove1Id =
    chargedOptions[0]?.id

  const chargedMove2Id =
    twoChargedMoves
      ? chargedOptions[1]?.id ??
        null
      : null

  return {
    status:
      'READY',

    pokemonIdentity:
      `${reference.id}__${reference.form}`,

    reference,

    level,

    cpm,

    ivs,

    stats,

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
        fastMoveId,

      charged: [
        chargedMove1Id,
        chargedMove2Id,
      ].filter(
        Boolean
      ),

      chargedSlots: {
        slot1:
          chargedMove1Id,

        slot2:
          chargedMove2Id,
      },
    },

    loadouts: [
      chargedMove1Id,
      chargedMove2Id,
    ]
      .filter(
        Boolean
      )
      .map(
        (chargedMoveId) => ({
          fastMoveId,
          chargedMoveId,
        })
      ),
  }
}

console.log('')
console.log(
  '================================'
)
console.log(
  'RAID EVOLUTION STATE VALIDATION'
)
console.log(
  '================================'
)
console.log('')

// --------------------------------------------------
// Anorith → Armaldo
// --------------------------------------------------

const anorith =
  buildCandidate(
    'ANORITH'
  )

const anorithResult =
  buildRaidPossibleStates(
    anorith
  )

const armaldoStates =
  anorithResult
    .evolutionStates
    .filter(
      (state) =>
        state.pokemonIdentity ===
        'ARMALDO__NORMAL'
    )

test(
  'Anorith possible states are READY',
  anorithResult.status ===
    'READY'
)

test(
  'Anorith generates evolution states',
  armaldoStates.length >
    0
)

test(
  'Evolution states use EVOLUTION type',
  armaldoStates.every(
    (state) =>
      state.type ===
      RAID_POSSIBLE_STATE_TYPE
        .EVOLUTION
  )
)

test(
  'Evolution states use EVOLVE action',
  armaldoStates.every(
    (state) =>
      state.action?.type ===
      RAID_POSSIBLE_STATE_ACTION
        .EVOLVE
  )
)

test(
  'Evolution state identity is Armaldo',
  armaldoStates.every(
    (state) =>
      state.pokemonIdentity ===
      'ARMALDO__NORMAL'
  )
)

test(
  'Evolution candidate reference is Armaldo',
  armaldoStates.every(
    (state) =>
      state.candidate
        ?.reference
        ?.id ===
      'ARMALDO'
  )
)

test(
  'Evolution candidate records Anorith source',
  armaldoStates.every(
    (state) =>
      state.sourcePokemonIdentity ===
        'ANORITH__NORMAL' &&
      state.candidate
        ?.sourcePokemonIdentity ===
        'ANORITH__NORMAL'
  )
)

test(
  'Evolution preserves level',
  armaldoStates.every(
    (state) =>
      state.candidate
        ?.level ===
      anorith.level
  )
)

test(
  'Evolution preserves CPM',
  armaldoStates.every(
    (state) =>
      state.candidate
        ?.cpm ===
      anorith.cpm
  )
)

test(
  'Evolution preserves IVs',
  armaldoStates.every(
    (state) =>
      state.candidate
        ?.ivs
        ?.attack ===
        anorith.ivs.attack &&
      state.candidate
        ?.ivs
        ?.defense ===
        anorith.ivs.defense &&
      state.candidate
        ?.ivs
        ?.stamina ===
        anorith.ivs.stamina
  )
)

test(
  'Evolution preserves Lucky trait',
  armaldoStates.every(
    (state) =>
      state.candidate
        ?.traits
        ?.lucky ===
      true
  )
)

test(
  'Evolution preserves Shiny trait',
  armaldoStates.every(
    (state) =>
      state.candidate
        ?.traits
        ?.shiny ===
      true
  )
)

test(
  'Anorith → Armaldo costs 50 Candy',
  armaldoStates.every(
    (state) =>
      state.action
        ?.costs
        ?.candy ===
      50
  )
)

test(
  'Anorith evolution path has one stage',
  armaldoStates.every(
    (state) =>
      state.action
        ?.stageCount ===
      1
  )
)

test(
  'Evolution marks source moves as replaced',
  armaldoStates.every(
    (state) =>
      state.preservation
        ?.replacesExistingMove ===
      true
  )
)

test(
  'Evolution records replaced source moves',
  armaldoStates.every(
    (state) =>
      state.preservation
        ?.replacedMoves
        ?.length ===
      2
  )
)

// --------------------------------------------------
// Evolution move pools
// --------------------------------------------------

const armaldoReference =
  getPokemonReference(
    'ARMALDO'
  )

const armaldoNormalFastMoves =
  new Set(
    getNormalOptions(
      getFastMoveOptions(
        armaldoReference
      )
    ).map(
      (option) =>
        option.id
    )
  )

const armaldoNormalChargedMoves =
  new Set(
    getNormalOptions(
      getChargedMoveOptions(
        armaldoReference
      )
    ).map(
      (option) =>
        option.id
    )
  )

test(
  'Every evolution Fast Move belongs to Armaldo NORMAL pool',
  armaldoStates.every(
    (state) =>
      armaldoNormalFastMoves.has(
        state.moves
          .fastMoveId
      )
  )
)

test(
  'Every evolution Charged Move belongs to Armaldo NORMAL pool',
  armaldoStates.every(
    (state) =>
      armaldoNormalChargedMoves.has(
        state.moves
          .chargedMove1Id
      )
  )
)

test(
  'One-move Anorith stays one Charged Move after evolution',
  armaldoStates.every(
    (state) =>
      state.moves
        .chargedMove2Id ===
      null
  )
)

test(
  'Evolution states have valid loadouts',
  armaldoStates.every(
    (state) =>
      state.loadouts.length ===
        1 &&
      state.loadouts[0]
        ?.fastMoveId ===
        state.moves.fastMoveId &&
      state.loadouts[0]
        ?.chargedMoveId ===
        state.moves
          .chargedMove1Id
  )
)

// --------------------------------------------------
// Two Charged Move slot preservation
// --------------------------------------------------

const twoMoveAnorith =
  buildCandidate(
    'ANORITH',
    {
      twoChargedMoves:
        true,
    }
  )

const twoMoveResult =
  buildRaidPossibleStates(
    twoMoveAnorith
  )

const twoMoveArmaldoStates =
  twoMoveResult
    .evolutionStates
    .filter(
      (state) =>
        state.pokemonIdentity ===
        'ARMALDO__NORMAL'
    )

test(
  'Two-move Anorith generates Armaldo states',
  twoMoveArmaldoStates.length >
    0
)

test(
  'Unlocked second Charged Move survives evolution',
  twoMoveArmaldoStates.every(
    (state) =>
      Boolean(
        state.moves
          .chargedMove1Id
      ) &&
      Boolean(
        state.moves
          .chargedMove2Id
      )
  )
)

test(
  'Evolved two-move outcomes do not duplicate Charged Moves',
  twoMoveArmaldoStates.every(
    (state) =>
      state.moves
        .chargedMove1Id !==
      state.moves
        .chargedMove2Id
  )
)

test(
  'Two-move evolution states expose two loadouts',
  twoMoveArmaldoStates.every(
    (state) =>
      state.loadouts.length ===
      2
  )
)

// --------------------------------------------------
// Beldum → Metang → Metagross
// --------------------------------------------------

const beldum =
  buildCandidate(
    'BELDUM'
  )

const beldumResult =
  buildRaidPossibleStates(
    beldum
  )

const metangStates =
  beldumResult
    .evolutionStates
    .filter(
      (state) =>
        state.pokemonIdentity ===
        'METANG__NORMAL'
    )

const metagrossStates =
  beldumResult
    .evolutionStates
    .filter(
      (state) =>
        state.pokemonIdentity ===
        'METAGROSS__NORMAL'
    )

test(
  'Beldum generates Metang states',
  metangStates.length >
    0
)

test(
  'Beldum generates direct-path Metagross states',
  metagrossStates.length >
    0
)

test(
  'Beldum → Metang costs 25 Candy',
  metangStates.every(
    (state) =>
      state.action
        ?.costs
        ?.candy ===
      25
  )
)

test(
  'Beldum → Metagross costs cumulative 125 Candy',
  metagrossStates.every(
    (state) =>
      state.action
        ?.costs
        ?.candy ===
      125
  )
)

test(
  'Metagross path records two stages',
  metagrossStates.every(
    (state) =>
      state.action
        ?.stageCount ===
      2
  )
)

test(
  'Metagross state actually uses Metagross reference',
  metagrossStates.every(
    (state) =>
      state.candidate
        ?.reference
        ?.id ===
      'METAGROSS'
  )
)

// --------------------------------------------------
// Terminal evolution
// --------------------------------------------------

const metagross =
  buildCandidate(
    'METAGROSS'
  )

const terminalResult =
  buildRaidPossibleStates(
    metagross
  )

test(
  'Terminal Metagross has zero evolution states',
  terminalResult
    .evolutionStates
    .length ===
    0
)

// --------------------------------------------------
// Existing state families remain
// --------------------------------------------------

test(
  'Current state remains present',
  anorithResult
    .currentState
    ?.type ===
    RAID_POSSIBLE_STATE_TYPE
      .CURRENT
)

test(
  'Fast Move states remain available',
  Array.isArray(
    anorithResult
      .fastMoveStates
  )
)

test(
  'Charged Move states remain available',
  Array.isArray(
    anorithResult
      .chargedMoveStates
  )
)

test(
  'Second Charged Move states remain available',
  Array.isArray(
    anorithResult
      .secondChargedMoveStates
  )
)

test(
  'Evolution states are included in possibleStates',
  armaldoStates.every(
    (state) =>
      anorithResult
        .possibleStates
        .includes(
          state
        )
  )
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