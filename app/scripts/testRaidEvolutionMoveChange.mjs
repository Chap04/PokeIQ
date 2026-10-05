import {
  buildRaidPossibleStates,
  RAID_POSSIBLE_STATE_ACTION,
  RAID_POSSIBLE_STATE_STATUS,
  RAID_POSSIBLE_STATE_TYPE,
  RAID_POSSIBLE_STATE_DESTINATION_CERTAINTY,
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

function getNormalOptions(
  options
) {
  return options.filter(
    (option) =>
      option.availability ===
      'NORMAL'
  )
}

function buildCandidate({
  pokemonId,
  secondChargedMove = false,
}) {
  const reference =
    getPokemonReference(
      pokemonId
    )

  if (!reference) {
    throw new Error(
      `${pokemonId} reference not found.`
    )
  }

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

  if (
    fastOptions.length ===
      0 ||
    chargedOptions.length ===
      0
  ) {
    throw new Error(
      `${pokemonId} does not have enough NORMAL moves for this test.`
    )
  }

  if (
    secondChargedMove &&
    chargedOptions.length <
      2
  ) {
    throw new Error(
      `${pokemonId} does not have two NORMAL Charged Moves for this test.`
    )
  }

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
    fastOptions[0].id

  const chargedMove1Id =
    chargedOptions[0].id

  const chargedMove2Id =
    secondChargedMove
      ? chargedOptions[1].id
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
      {
        fastMoveId,

        chargedMoveId:
          chargedMove1Id,
      },

      ...(chargedMove2Id
        ? [
            {
              fastMoveId,

              chargedMoveId:
                chargedMove2Id,
            },
          ]
        : []),
    ],
  }
}

function getFinalStateKey(
  state
) {
  const chargedIds = [
    state
      ?.moves
      ?.chargedMove1Id,
    state
      ?.moves
      ?.chargedMove2Id,
  ]
    .filter(
      Boolean
    )
    .sort()

  return [
    state
      ?.pokemonIdentity ??
      '',
    state
      ?.moves
      ?.fastMoveId ??
      '',
    ...chargedIds,
    state
      ?.actions?.[1]
      ?.type ??
      '',
  ].join(
    '|'
  )
}

// --------------------------------------------------
// Destination-certainty helpers
// --------------------------------------------------

function getDestinationReference(
  state
) {
  return state
    ?.candidate
    ?.reference ??
    null
}

function getNaturalFastOptionsForState(
  state
) {
  const reference =
    getDestinationReference(
      state
    )

  if (!reference) {
    return []
  }

  return getNormalOptions(
    getFastMoveOptions(
      reference
    )
  )
}

function getNaturalChargedOptionsForState(
  state
) {
  const reference =
    getDestinationReference(
      state
    )

  if (!reference) {
    return []
  }

  return getNormalOptions(
    getChargedMoveOptions(
      reference
    )
  )
}

function getChargedSlotCount(
  state
) {
  return state
    ?.moves
    ?.chargedMove2Id
    ? 2
    : 1
}

function getNaturalChargedOutcomeCount(
  state
) {
  const chargedOptions =
    getNaturalChargedOptionsForState(
      state
    )

  const chargedSlotCount =
    getChargedSlotCount(
      state
    )

  if (chargedSlotCount === 1) {
    return chargedOptions.length
  }

  if (chargedOptions.length < 2) {
    return 0
  }

  return (
    chargedOptions.length *
    (chargedOptions.length - 1)
  ) / 2
}

function getExpectedNaturalEvolutionCertainty(
  state
) {
  const fastOptions =
    getNaturalFastOptionsForState(
      state
    )

  const chargedOutcomeCount =
    getNaturalChargedOutcomeCount(
      state
    )

  return (
    fastOptions.length > 1 ||
    chargedOutcomeCount > 1
  )
    ? RAID_POSSIBLE_STATE_DESTINATION_CERTAINTY
        .STOCHASTIC
    : RAID_POSSIBLE_STATE_DESTINATION_CERTAINTY
        .GUARANTEED
}

function getExpectedCompositeCertainty(
  state
) {
  const moveAction =
    state?.actions?.[1]

  if (!moveAction) {
    return RAID_POSSIBLE_STATE_DESTINATION_CERTAINTY
      .UNKNOWN
  }

  if (
    moveAction.availability ===
    'SPECIAL'
  ) {
    return RAID_POSSIBLE_STATE_DESTINATION_CERTAINTY
      .UNAVAILABLE
  }

  const fastOptions =
    getNaturalFastOptionsForState(
      state
    )

  const chargedOptions =
    getNaturalChargedOptionsForState(
      state
    )

  switch (moveAction.type) {
    case RAID_POSSIBLE_STATE_ACTION
      .FAST_TM:

    case RAID_POSSIBLE_STATE_ACTION
      .ELITE_FAST_TM:
      return (
        getNaturalChargedOutcomeCount(
          state
        ) > 1
      )
        ? RAID_POSSIBLE_STATE_DESTINATION_CERTAINTY
            .STOCHASTIC
        : RAID_POSSIBLE_STATE_DESTINATION_CERTAINTY
            .GUARANTEED

    case RAID_POSSIBLE_STATE_ACTION
      .CHARGED_TM:

    case RAID_POSSIBLE_STATE_ACTION
      .ELITE_CHARGED_TM:
      if (
        getChargedSlotCount(
          state
        ) === 2
      ) {
        return (
          fastOptions.length > 1 ||
          chargedOptions.length > 2
        )
          ? RAID_POSSIBLE_STATE_DESTINATION_CERTAINTY
              .STOCHASTIC
          : RAID_POSSIBLE_STATE_DESTINATION_CERTAINTY
              .GUARANTEED
      }

      return fastOptions.length > 1
        ? RAID_POSSIBLE_STATE_DESTINATION_CERTAINTY
            .STOCHASTIC
        : RAID_POSSIBLE_STATE_DESTINATION_CERTAINTY
            .GUARANTEED

    case RAID_POSSIBLE_STATE_ACTION
      .SPECIAL_ACQUISITION:
      return RAID_POSSIBLE_STATE_DESTINATION_CERTAINTY
        .UNAVAILABLE

    default:
      return RAID_POSSIBLE_STATE_DESTINATION_CERTAINTY
        .UNKNOWN
  }
}

// --------------------------------------------------
// Main
// --------------------------------------------------

function main() {
  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'RAID EVOLUTION MOVE CHANGE VALIDATION'
  )
  console.log(
    '================================'
  )
  console.log('')

  // ------------------------------------------------
  // Anorith -> Armaldo composite states
  // ------------------------------------------------

  const anorith =
    buildCandidate({
      pokemonId:
        'ANORITH',
    })

  const anorithResult =
    buildRaidPossibleStates(
      anorith
    )

  expectEqual(
    'Anorith possible states are READY',
    anorithResult.status,
    RAID_POSSIBLE_STATE_STATUS
      .READY
  )

  expectTrue(
    'Anorith generates evolution move-change states',
    anorithResult
      .evolutionMoveChangeStates
      .length >
      0
  )

  const armaldoCompositeStates =
    anorithResult
      .evolutionMoveChangeStates
      .filter(
        (state) =>
          state.pokemonIdentity ===
          'ARMALDO__NORMAL'
      )

  expectTrue(
    'Anorith generates Armaldo composite states',
    armaldoCompositeStates.length >
      0
  )

  expectTrue(
    'All Armaldo composites use EVOLUTION_MOVE_CHANGE type',
    armaldoCompositeStates.every(
      (state) =>
        state.type ===
        RAID_POSSIBLE_STATE_TYPE
          .EVOLUTION_MOVE_CHANGE
    )
  )

  expectTrue(
    'All Armaldo composites preserve candidate override',
    armaldoCompositeStates.every(
      (state) =>
        state
          ?.candidate
          ?.pokemonIdentity ===
        'ARMALDO__NORMAL'
    )
  )

  expectTrue(
    'All Armaldo composites preserve Anorith source identity',
    armaldoCompositeStates.every(
      (state) =>
        state
          ?.sourcePokemonIdentity ===
        'ANORITH__NORMAL'
    )
  )

  expectTrue(
    'All composites expose two ordered actions',
    armaldoCompositeStates.every(
      (state) =>
        Array.isArray(
          state.actions
        ) &&
        state.actions.length ===
          2
    )
  )

  expectTrue(
    'Every composite begins with EVOLVE',
    armaldoCompositeStates.every(
      (state) =>
        state.actions[0]
          ?.type ===
        RAID_POSSIBLE_STATE_ACTION
          .EVOLVE
    )
  )

  expectTrue(
    'Every composite second action is a move action',
    armaldoCompositeStates.every(
      (state) =>
        [
          RAID_POSSIBLE_STATE_ACTION
            .FAST_TM,
          RAID_POSSIBLE_STATE_ACTION
            .CHARGED_TM,
          RAID_POSSIBLE_STATE_ACTION
            .ELITE_FAST_TM,
          RAID_POSSIBLE_STATE_ACTION
            .ELITE_CHARGED_TM,
          RAID_POSSIBLE_STATE_ACTION
            .SPECIAL_ACQUISITION,
        ].includes(
          state.actions[1]
            ?.type
        )
    )
  )

  expectTrue(
    'Composite action mirrors ordered action path',
    armaldoCompositeStates.every(
      (state) =>
        state
          ?.action
          ?.type ===
          RAID_POSSIBLE_STATE_ACTION
            .EVOLUTION_MOVE_CHANGE &&
        state
          ?.action
          ?.actions
          ?.length ===
          2
    )
  )

  // ------------------------------------------------
  // Destination certainty:
  // real Armaldo composite states
  // ------------------------------------------------

  expectTrue(
    'All Armaldo composites expose known destination certainty',
    armaldoCompositeStates.every(
      (state) =>
        [
          RAID_POSSIBLE_STATE_DESTINATION_CERTAINTY
            .GUARANTEED,
          RAID_POSSIBLE_STATE_DESTINATION_CERTAINTY
            .STOCHASTIC,
          RAID_POSSIBLE_STATE_DESTINATION_CERTAINTY
            .UNAVAILABLE,
        ].includes(
          state.destinationCertainty
        )
    )
  )

  expectTrue(
    'Every Armaldo composite certainty matches uncontrolled destination dimensions',
    armaldoCompositeStates.every(
      (state) =>
        state.destinationCertainty ===
        getExpectedCompositeCertainty(
          state
        )
    )
  )

  const armaldoStochasticState =
    armaldoCompositeStates.find(
      (state) =>
        state.destinationCertainty ===
        RAID_POSSIBLE_STATE_DESTINATION_CERTAINTY
          .STOCHASTIC
    )

  expectTrue(
    'Armaldo produces at least one stochastic composite destination',
    Boolean(
      armaldoStochasticState
    )
  )

  const normalTmState =
    armaldoCompositeStates.find(
      (state) =>
        state.actions[1]
          ?.availability ===
        'NORMAL'
    )

  expectTrue(
    'At least one ordinary TM composite exists',
    Boolean(
      normalTmState
    )
  )

  expectEqual(
    'Ordinary TM destination is not guaranteed in one use',
    normalTmState
      ?.actions?.[1]
      ?.guaranteedSingleUse,
    false
  )

  expectEqual(
    'Ordinary TM destination records random outcome',
    normalTmState
      ?.actions?.[1]
      ?.randomOutcome,
    true
  )

  expectTrue(
    'Composite preservation still records evolution replacing source moves',
    armaldoCompositeStates.every(
      (state) =>
        state
          ?.preservation
          ?.replacesExistingMove ===
        true
    )
  )

  expectTrue(
    'Composite preservation records post-evolution move change separately',
    armaldoCompositeStates.every(
      (state) =>
        Boolean(
          state
            ?.preservation
            ?.postEvolutionMoveChange
        )
    )
  )

  const compositeKeys =
    armaldoCompositeStates.map(
      getFinalStateKey
    )

  expectEqual(
    'Armaldo composite destinations are deduplicated',
    new Set(
      compositeKeys
    ).size,
    compositeKeys.length
  )

  expectEqual(
    'Composite states participate in general possibleStates',
    anorithResult
      .possibleStates
      .some(
        (state) =>
          state.type ===
          RAID_POSSIBLE_STATE_TYPE
            .EVOLUTION_MOVE_CHANGE
      ),
    true
  )

  // ------------------------------------------------
  // Beldum -> Metagross -> Meteor Mash
  // ------------------------------------------------

  const beldum =
    buildCandidate({
      pokemonId:
        'BELDUM',
    })

  const beldumResult =
    buildRaidPossibleStates(
      beldum
    )

  const naturalMetagrossStates =
    beldumResult
      .evolutionStates
      .filter(
        (state) =>
          state.pokemonIdentity ===
          'METAGROSS__NORMAL'
      )

  expectTrue(
    'Beldum generates natural Metagross evolution states',
    naturalMetagrossStates.length >
      0
  )

  // ------------------------------------------------
  // Destination certainty:
  // natural Metagross evolution
  // ------------------------------------------------

  expectTrue(
    'Natural Metagross states expose known destination certainty',
    naturalMetagrossStates.every(
      (state) =>
        [
          RAID_POSSIBLE_STATE_DESTINATION_CERTAINTY
            .GUARANTEED,
          RAID_POSSIBLE_STATE_DESTINATION_CERTAINTY
            .STOCHASTIC,
        ].includes(
          state.destinationCertainty
        )
    )
  )

  expectTrue(
    'Natural Metagross certainty matches its natural move outcome space',
    naturalMetagrossStates.every(
      (state) =>
        state.destinationCertainty ===
        getExpectedNaturalEvolutionCertainty(
          state
        )
    )
  )

  expectEqual(
    'Natural Metagross evolution never rolls Meteor Mash',
    naturalMetagrossStates.some(
      (state) =>
        state
          ?.moves
          ?.chargedMove1Id ===
        'METEOR_MASH'
    ),
    false
  )

  const meteorMashState =
    beldumResult
      .evolutionMoveChangeStates
      .find(
        (state) =>
          state.pokemonIdentity ===
            'METAGROSS__NORMAL' &&
          (
            state
              ?.moves
              ?.chargedMove1Id ===
              'METEOR_MASH' ||
            state
              ?.moves
              ?.chargedMove2Id ===
              'METEOR_MASH'
          )
      )

  expectTrue(
    'Beldum generates Metagross Meteor Mash composite',
    Boolean(
      meteorMashState
    )
  )

  expectEqual(
    'Meteor Mash path uses Elite Charged TM',
    meteorMashState
      ?.actions?.[1]
      ?.type,
    RAID_POSSIBLE_STATE_ACTION
      .ELITE_CHARGED_TM
  )

  expectEqual(
    'Meteor Mash action is ELITE availability',
    meteorMashState
      ?.actions?.[1]
      ?.availability,
    'ELITE'
  )

  expectEqual(
    'Elite Charged TM is targeted',
    meteorMashState
      ?.actions?.[1]
      ?.targeted,
    true
  )

  expectEqual(
    'Elite Charged TM target is guaranteed in one use',
    meteorMashState
      ?.actions?.[1]
      ?.guaranteedSingleUse,
    true
  )

  // ------------------------------------------------
  // Important distinction:
  //
  // The Elite Charged TM guarantees Meteor Mash.
  // It does NOT automatically guarantee every other
  // dimension of the final Metagross moveset.
  //
  // Therefore the full destination certainty must be
  // derived from whatever natural move dimensions
  // remain uncontrolled after the Elite TM action.
  // ------------------------------------------------

  expectEqual(
    'Meteor Mash composite certainty matches remaining uncontrolled move dimensions',
    meteorMashState
      ?.destinationCertainty,
    getExpectedCompositeCertainty(
      meteorMashState
    )
  )

  expectEqual(
    'Meteor Mash path preserves cumulative 125 Candy evolution cost',
    meteorMashState
      ?.actions?.[0]
      ?.costs
      ?.candy,
    125
  )

  expectEqual(
    'Meteor Mash path preserves two-stage evolution',
    meteorMashState
      ?.actions?.[0]
      ?.stageCount,
    2
  )

  expectEqual(
    'Meteor Mash composite is reachable',
    meteorMashState
      ?.reachable,
    true
  )

  expectEqual(
    'Meteor Mash change metadata identifies Charged Move',
    meteorMashState
      ?.changes
      ?.moveChange
      ?.moveType,
    'CHARGED'
  )

  expectEqual(
    'Meteor Mash change metadata identifies target',
    meteorMashState
      ?.changes
      ?.moveChange
      ?.to,
    'METEOR_MASH'
  )

  // ------------------------------------------------
  // Existing groups remain present
  // ------------------------------------------------

  expectTrue(
    'Existing current state remains present',
    Boolean(
      anorithResult
        .currentState
    )
  )

  expectTrue(
    'Existing natural evolution states remain present',
    anorithResult
      .evolutionStates
      .length >
      0
  )

  expectTrue(
    'General state collection still contains natural evolution states',
    anorithResult
      .states
      .some(
        (state) =>
          state.type ===
          RAID_POSSIBLE_STATE_TYPE
            .EVOLUTION
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

try {
  main()
} catch (
  error
) {
  console.error('')
  console.error(
    'Raid evolution move-change test failed:'
  )

  console.error(
    error
  )

  process.exitCode = 1
}