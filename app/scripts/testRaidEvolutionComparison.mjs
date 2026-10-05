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
  compareRaidPossibleStateToCurrent,
  compareRaidPossibleStatesToCurrent,
  RAID_STATE_COMPARISON_STATUS,
} from '../src/utils/raidStateComparison.js'

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
    'RAID EVOLUTION COMPARISON VALIDATION'
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

  const anorith =
    buildCandidate(
      'ANORITH'
    )

  const states =
    buildRaidPossibleStates(
      anorith
    )

  const currentState =
    states.currentState

  const armaldoState =
    states
      .evolutionStates
      .find(
        (state) =>
          state.pokemonIdentity ===
          'ARMALDO__NORMAL'
      )

  expectTrue(
    'Generated Armaldo state exists',
    Boolean(
      armaldoState
    )
  )

  expectEqual(
    'Generated state is EVOLUTION',
    armaldoState?.type,
    RAID_POSSIBLE_STATE_TYPE
      .EVOLUTION
  )

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
  // Single comparison
  // ------------------------------------------------

  const comparison =
    compareRaidPossibleStateToCurrent({
      candidate:
        anorith,

      currentState,

      possibleState:
        armaldoState,

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Evolution comparison succeeds',
    comparison.status,
    RAID_STATE_COMPARISON_STATUS
      .SUCCESS
  )

  expectEqual(
    'Comparison source remains Anorith',
    comparison.pokemonIdentity,
    'ANORITH__NORMAL'
  )

  expectEqual(
    'Comparison result is Armaldo',
    comparison.resultingPokemonIdentity,
    'ARMALDO__NORMAL'
  )

  expectEqual(
    'Possible evaluation uses Armaldo',
    comparison
      ?.possibleEvaluation
      ?.pokemonIdentity,
    'ARMALDO__NORMAL'
  )

  expectEqual(
    'Possible state type remains EVOLUTION',
    comparison.possibleStateType,
    RAID_POSSIBLE_STATE_TYPE
      .EVOLUTION
  )

  expectEqual(
    'EVOLVE action survives comparison',
    comparison
      ?.action
      ?.type,
    'EVOLVE'
  )

  expectEqual(
    'Evolution Candy cost survives comparison',
    comparison
      ?.action
      ?.costs
      ?.candy,
    50
  )

  expectTrue(
    'Evolution comparison has finite current DPS',
    Number.isFinite(
      comparison
        ?.performanceChange
        ?.currentCycleDps
    )
  )

  expectTrue(
    'Evolution comparison has finite possible DPS',
    Number.isFinite(
      comparison
        ?.performanceChange
        ?.possibleCycleDps
    )
  )

  expectTrue(
    'Evolution comparison has finite percent gain',
    Number.isFinite(
      comparison
        ?.performanceChange
        ?.percentGain
    )
  )

  expectEqual(
    'Comparison marks candidate override',
    comparison.candidateOverride,
    true
  )

  expectEqual(
    'Comparison exposes source identity',
    comparison.sourcePokemonIdentity,
    'ANORITH__NORMAL'
  )

  // ------------------------------------------------
  // Backward-compatible actions array
  // ------------------------------------------------

  expectTrue(
    'Single-action evolution exposes actions array',
    Array.isArray(
      comparison.actions
    )
  )

  expectEqual(
    'Single-action evolution has one action',
    comparison.actions.length,
    1
  )

  expectEqual(
    'Actions array contains EVOLVE',
    comparison
      .actions[0]
      ?.type,
    'EVOLVE'
  )

  // ------------------------------------------------
  // Bulk comparison
  // ------------------------------------------------

  const bulk =
    compareRaidPossibleStatesToCurrent({
      candidate:
        anorith,

      currentState,

      possibleStates: [
        armaldoState,
      ],

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Bulk comparison succeeds',
    bulk.status,
    RAID_STATE_COMPARISON_STATUS
      .SUCCESS
  )

  expectEqual(
    'Bulk comparison returns one comparison',
    bulk.comparisons.length,
    1
  )

  expectEqual(
    'Bulk evolution comparison succeeds',
    bulk
      .comparisons[0]
      ?.status,
    RAID_STATE_COMPARISON_STATUS
      .SUCCESS
  )

  expectEqual(
    'Bulk comparison result is Armaldo',
    bulk
      .comparisons[0]
      ?.resultingPokemonIdentity,
    'ARMALDO__NORMAL'
  )

  expectEqual(
    'Bulk successful comparisons contains evolution',
    bulk
      .successfulComparisons
      .length,
    1
  )

  // ------------------------------------------------
  // Ordinary state remains valid
  // ------------------------------------------------

  const ordinaryState =
    states.fastMoveStates[0] ??
    states.chargedMoveStates[0]

  if (!ordinaryState) {
    throw new Error(
      'No ordinary Anorith move-change state found.'
    )
  }

  const ordinaryComparison =
    compareRaidPossibleStateToCurrent({
      candidate:
        anorith,

      currentState,

      possibleState:
        ordinaryState,

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Ordinary same-species comparison still succeeds',
    ordinaryComparison.status,
    RAID_STATE_COMPARISON_STATUS
      .SUCCESS
  )

  expectEqual(
    'Ordinary comparison result remains Anorith',
    ordinaryComparison
      .resultingPokemonIdentity,
    'ANORITH__NORMAL'
  )

  expectEqual(
    'Ordinary comparison has no candidate override',
    ordinaryComparison
      .candidateOverride,
    false
  )

  // ------------------------------------------------
  // Malformed override remains rejected
  // ------------------------------------------------

  const malformedState = {
    ...armaldoState,

    pokemonIdentity:
      'METAGROSS__NORMAL',
  }

  const malformedComparison =
    compareRaidPossibleStateToCurrent({
      candidate:
        anorith,

      currentState,

      possibleState:
        malformedState,

      defender,

      moves,

      combatData:
        combat,
    })

  expectEqual(
    'Malformed evolution identity is rejected',
    malformedComparison.status,
    RAID_STATE_COMPARISON_STATUS
      .INVALID_POSSIBLE_STATE
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
      'Raid evolution comparison test failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)