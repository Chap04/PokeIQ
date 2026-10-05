import fs from 'node:fs/promises'
import path from 'node:path'

import {
  fileURLToPath,
} from 'node:url'

import {
  buildRaidPossibleStates,
  RAID_POSSIBLE_STATE_TYPE,
} from '../src/utils/raidPossibleStates.js'

import {
  evaluateRaidPossibleStateMatchup,
  RAID_STATE_MATCHUP_STATUS,
} from '../src/utils/raidStateMatchup.js'

import {
  getChargedMoveOptions,
  getFastMoveOptions,
  getPokemonReference,
} from '../src/utils/pokemonReference.js'

import {
  calculatePokemonStats,
  getCpmForLevel,
} from '../src/utils/pokemonLevel.js'

// --------------------------------------------------
// Test helpers
// --------------------------------------------------

let passed = 0
let failed = 0

function expectEqual(
  name,
  actual,
  expected
) {
  if (actual === expected) {
    passed += 1

    console.log(
      `PASS - ${name}`
    )

    return
  }

  failed += 1

  console.log(
    `FAIL - ${name}`
  )

  console.log(
    `   Expected: ${expected}`
  )

  console.log(
    `   Actual:   ${actual}`
  )
}

function expectTrue(
  name,
  value
) {
  if (value === true) {
    passed += 1

    console.log(
      `PASS - ${name}`
    )

    return
  }

  failed += 1

  console.log(
    `FAIL - ${name}`
  )

  console.log(
    '   Expected: true'
  )

  console.log(
    `   Actual:   ${value}`
  )
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

// --------------------------------------------------
// Reference data
// --------------------------------------------------

const __filename =
  fileURLToPath(
    import.meta.url
  )

const __dirname =
  path.dirname(
    __filename
  )

const REFERENCE_DIR =
  path.resolve(
    __dirname,
    '../src/data/reference'
  )

async function readJson(
  filename
) {
  const contents =
    await fs.readFile(
      path.join(
        REFERENCE_DIR,
        filename
      ),
      'utf8'
    )

  return JSON.parse(
    contents
  )
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
  pokemonId
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

  const chargedMoveId =
    chargedOptions[0]?.id

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
        false,

      shiny:
        false,
    },

    moves: {
      fast:
        fastMoveId,

      charged: [
        chargedMoveId,
      ],

      chargedSlots: {
        slot1:
          chargedMoveId,

        slot2:
          null,
      },
    },

    loadouts: [
      {
        fastMoveId,

        chargedMoveId,
      },
    ],
  }
}

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'RAID EVOLUTION MATCHUP INTEGRATION'
  )
  console.log(
    '================================'
  )
  console.log('')

  const [
    pokemon,
    moves,
    combat,
  ] = await Promise.all([
    readJson(
      'pokemon.json'
    ),

    readJson(
      'moves-pve.json'
    ),

    readJson(
      'combat.json'
    ),
  ])

  // ------------------------------------------------
  // Source candidate
  // ------------------------------------------------

  const anorith =
    buildCandidate(
      'ANORITH'
    )

  const armaldo =
    getPokemonReference(
      'ARMALDO'
    )

  expectTrue(
    'Anorith candidate exists',
    Boolean(
      anorith.reference
    )
  )

  expectTrue(
    'Armaldo reference exists',
    Boolean(
      armaldo
    )
  )

  // ------------------------------------------------
  // Generate real production evolution states
  // ------------------------------------------------

  const possibleStateResult =
    buildRaidPossibleStates(
      anorith
    )

  const armaldoStates =
    possibleStateResult
      .evolutionStates
      .filter(
        (state) =>
          state.pokemonIdentity ===
          'ARMALDO__NORMAL'
      )

  expectTrue(
    'Production possible-state builder generates Armaldo',
    armaldoStates.length >
      0
  )

  const evolutionState =
    armaldoStates[0]

  expectEqual(
    'Generated state is EVOLUTION',
    evolutionState?.type,
    RAID_POSSIBLE_STATE_TYPE
      .EVOLUTION
  )

  expectEqual(
    'Generated state carries Armaldo candidate',
    evolutionState
      ?.candidate
      ?.pokemonIdentity,
    'ARMALDO__NORMAL'
  )

  expectEqual(
    'Generated state records Anorith source',
    evolutionState
      ?.sourcePokemonIdentity,
    'ANORITH__NORMAL'
  )

  // ------------------------------------------------
  // Defender
  //
  // Use Rayquaza because the existing state-matchup
  // suite already proves it works as a stable raid
  // defender fixture.
  // ------------------------------------------------

  const rayquaza =
    pokemon.find(
      (entry) =>
        entry.id ===
          'RAYQUAZA' &&
        entry.form ===
          'NORMAL'
    )

  if (!rayquaza) {
    throw new Error(
      'Rayquaza reference data not found.'
    )
  }

  const defender = {
    ...rayquaza,

    ivs: {
      attack:
        15,

      defense:
        15,

      stamina:
        15,
    },

    raidBoss: {
      cpMultiplier:
        0.79,
    },
  }

  // ------------------------------------------------
  // Evaluate generated evolution state
  // ------------------------------------------------

  const result =
    evaluateRaidPossibleStateMatchup({
      candidate:
        anorith,

      state:
        evolutionState,

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Generated evolution state evaluates successfully',
    result.status,
    RAID_STATE_MATCHUP_STATUS
      .SUCCESS
  )

  expectEqual(
    'Evaluation reports Armaldo identity',
    result.pokemonIdentity,
    'ARMALDO__NORMAL'
  )

  expectEqual(
    'Evaluation preserves Anorith as source identity',
    result.sourcePokemonIdentity,
    'ANORITH__NORMAL'
  )

  expectEqual(
    'Evaluation reports candidate override',
    result.candidateOverride,
    true
  )

  expectEqual(
    'Evaluation preserves EVOLUTION state type',
    result.stateType,
    RAID_POSSIBLE_STATE_TYPE
      .EVOLUTION
  )

  expectEqual(
    'Evaluation preserves EVOLVE action',
    result
      ?.action
      ?.type,
    'EVOLVE'
  )

  expectEqual(
    'Evaluation preserves 50 Candy evolution cost',
    result
      ?.action
      ?.costs
      ?.candy,
    50
  )

  // ------------------------------------------------
  // Prove Armaldo stats are being used
  // ------------------------------------------------

  const expectedArmaldoStats =
    calculatePokemonStats({
      baseAttack:
        armaldo.stats.attack,

      baseDefense:
        armaldo.stats.defense,

      baseStamina:
        armaldo.stats.stamina,

      attackIv:
        anorith.ivs.attack,

      defenseIv:
        anorith.ivs.defense,

      staminaIv:
        anorith.ivs.stamina,

      cpm:
        anorith.cpm,
    })

  const expectedAnorithStats =
    calculatePokemonStats({
      baseAttack:
        anorith
          .reference
          .stats
          .attack,

      baseDefense:
        anorith
          .reference
          .stats
          .defense,

      baseStamina:
        anorith
          .reference
          .stats
          .stamina,

      attackIv:
        anorith.ivs.attack,

      defenseIv:
        anorith.ivs.defense,

      staminaIv:
        anorith.ivs.stamina,

      cpm:
        anorith.cpm,
    })

  expectTrue(
    'Derived Armaldo Attack differs from Anorith Attack',
    !approximatelyEqual(
      evolutionState
        .candidate
        .stats
        .attack,
      expectedAnorithStats
        .attack
    )
  )

  expectTrue(
    'Derived candidate Attack matches Armaldo',
    approximatelyEqual(
      evolutionState
        .candidate
        .stats
        .attack,
      expectedArmaldoStats
        .attack
    )
  )

  expectTrue(
    'Derived candidate Defense matches Armaldo',
    approximatelyEqual(
      evolutionState
        .candidate
        .stats
        .defense,
      expectedArmaldoStats
        .defense
    )
  )

  expectEqual(
    'Derived candidate Stamina matches Armaldo',
    evolutionState
      .candidate
      .stats
      .stamina,
    expectedArmaldoStats
      .stamina
  )

  // ------------------------------------------------
  // Prove evaluated moves come from evolved state
  // ------------------------------------------------

  expectEqual(
    'Best Fast Move comes from generated evolution state',
    result
      ?.bestLoadout
      ?.fastMoveId,
    evolutionState
      .moves
      .fastMoveId
  )

  expectEqual(
    'Best Charged Move comes from generated evolution state',
    result
      ?.bestLoadout
      ?.chargedMoveId,
    evolutionState
      .moves
      .chargedMove1Id
  )

  // ------------------------------------------------
  // Identity guard still protects candidate override
  // ------------------------------------------------

  const malformedState = {
    ...evolutionState,

    pokemonIdentity:
      'METAGROSS__NORMAL',
  }

  const malformedResult =
    evaluateRaidPossibleStateMatchup({
      candidate:
        anorith,

      state:
        malformedState,

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Mismatched evolution identity is rejected',
    malformedResult.status,
    RAID_STATE_MATCHUP_STATUS
      .INVALID_STATE
  )

  // ------------------------------------------------
  // Original candidate remains untouched
  // ------------------------------------------------

  expectEqual(
    'Original candidate remains Anorith',
    anorith.pokemonIdentity,
    'ANORITH__NORMAL'
  )

  expectEqual(
    'Original candidate reference remains Anorith',
    anorith.reference.id,
    'ANORITH'
  )

  expectTrue(
    'Original candidate stats remain Anorith stats',
    approximatelyEqual(
      anorith.stats.attack,
      expectedAnorithStats
        .attack
    )
  )

  // ------------------------------------------------
  // Results
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'TEST RESULTS'
  )
  console.log(
    '================================'
  )

  console.log(
    `Passed: ${passed}`
  )

  console.log(
    `Failed: ${failed}`
  )

  console.log(
    `Total: ${passed + failed}`
  )

  console.log('')

  if (
    failed ===
    0
  ) {
    console.log(
      `🎉 ${passed}/${passed} tests passed.`
    )
  } else {
    console.log(
      `❌ ${failed} test(s) failed.`
    )

    process.exitCode = 1
  }
}

main().catch(
  (error) => {
    console.error('')
    console.error(
      'Raid evolution matchup integration test failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)