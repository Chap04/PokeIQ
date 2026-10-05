import combatData from '../src/data/reference/combat.json' with { type: 'json' }

import {
  buildRaidBossAnalysis,
  RAID_BOSS_ANALYSIS_STATUS,
} from '../src/services/buildRaidBossAnalysis.js'

import {
  getPokemonReferenceByIdentity,
} from '../src/utils/pokemonReference.js'

import {
  calculatePokemonCp,
} from '../src/utils/pokemonLevel.js'

// --------------------------------------------------
// Controlled Mewtwo Boss Analysis V2 diagnostic
//
// This script exercises the SAME public service used
// by the Boss Analysis page.
//
// It intentionally uses controlled Pokémon fixtures.
// Browser localStorage Collection data is not
// available to this Node script.
// --------------------------------------------------

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function buildOwnedPokemon({
  id,
  identity,
  level,

  attackIv = 15,
  defenseIv = 15,
  staminaIv = 15,

  fastMoveId,
  chargedMove1Id,
  chargedMove2Id = null,

  shadow = false,
}) {
  const reference =
    getPokemonReferenceByIdentity(
      identity
    )

  if (!reference) {
    throw new Error(
      `Reference not found: ${identity}`
    )
  }

  const cpm =
    combatData
      .cpMultipliers
      .allLevels[
        String(level)
      ]

  if (
    !Number.isFinite(cpm)
  ) {
    throw new Error(
      `CPM not found for level ${level}`
    )
  }

  const cp =
    calculatePokemonCp({
      baseAttack:
        reference.stats.attack,

      baseDefense:
        reference.stats.defense,

      baseStamina:
        reference.stats.stamina,

      attackIv,
      defenseIv,
      staminaIv,

      cpm,
    })

  return {
    id,

    pokemonId:
      reference.id,

    pokemonForm:
      reference.form,

    pokemonIdentity:
      identity,

    name:
      reference.id,

    cp,

    ivs: {
      attack:
        attackIv,

      defense:
        defenseIv,

      stamina:
        staminaIv,
    },

    fastMoveId,
    chargedMove1Id,
    chargedMove2Id,

    shiny:
      false,

    shadow,

    purified:
      false,

    lucky:
      false,
  }
}

function formatNumber(
  value,
  decimals = 2
) {
  if (
    !Number.isFinite(value)
  ) {
    return 'N/A'
  }

  return value.toFixed(
    decimals
  )
}

function formatMoveSet(
  moveSet
) {
  if (!moveSet) {
    return 'N/A'
  }

  const fast =
    moveSet.fastMoveName ??
    moveSet.fastMoveId ??
    'Unknown Fast Move'

  const charged =
    moveSet.chargedMoveName ??
    moveSet.chargedMoveId ??
    'Unknown Charged Move'

  return `${fast} / ${charged}`
}

function separator(
  character = '=',
  length = 64
) {
  console.log(
    character.repeat(length)
  )
}

// --------------------------------------------------
// Controlled attackers
// --------------------------------------------------

const collection = [
  buildOwnedPokemon({
    id:
      'zacian-controlled',

    identity:
      'ZACIAN__ZACIAN_CROWNED_SWORD',

    level:
      40,

    fastMoveId:
      'METAL_CLAW_FAST',

    chargedMove1Id:
      'BEHEMOTH_BLADE',
  }),

  buildOwnedPokemon({
    id:
      'hydreigon-controlled',

    identity:
      'HYDREIGON__NORMAL',

    level:
      40,

    fastMoveId:
      'BITE_FAST',

    chargedMove1Id:
      'BRUTAL_SWING',
  }),

  buildOwnedPokemon({
    id:
      'tyranitar-controlled',

    identity:
      'TYRANITAR__NORMAL',

    level:
      40,

    fastMoveId:
      'BITE_FAST',

    chargedMove1Id:
      'BRUTAL_SWING',
  }),

  buildOwnedPokemon({
    id:
      'rayquaza-controlled',

    identity:
      'RAYQUAZA__NORMAL',

    level:
      40,

    fastMoveId:
      'DRAGON_TAIL_FAST',

    chargedMove1Id:
      'OUTRAGE',

    chargedMove2Id:
      'BREAKING_SWIPE',
  }),
]

// --------------------------------------------------
// Run real Boss Analysis V2 service
// --------------------------------------------------

const result =
  buildRaidBossAnalysis({
    collection,

    bossPokemonIdentity:
      'MEWTWO__NORMAL',

    raidProfileId:
      'TIER_5',
  })

console.log('')
separator()

console.log(
  'MEWTWO TIER 5 - BOSS ANALYSIS V2 DIAGNOSTIC'
)

separator()
console.log('')

// --------------------------------------------------
// Basic result
// --------------------------------------------------

console.log(
  `Status: ${result.status}`
)

if (
  result.status !==
  RAID_BOSS_ANALYSIS_STATUS.SUCCESS
) {
  console.log('')
  console.log(
    'Boss Analysis did not succeed.'
  )

  console.log(
    result
  )

  process.exitCode = 1
} else {
  console.log(
    `Boss: ${result.boss.pokemonName}`
  )

  console.log(
    `Types: ${result.boss.types.join(', ')}`
  )

  console.log(
    `Raid Tier: ${result.boss.raidProfileName}`
  )

  console.log(
    `Boss HP: ${result.boss.hp}`
  )

  console.log(
    `Timer: ${result.boss.timerSeconds}s`
  )

  console.log(
    `Ranking Metric: ${result.summary.rankingMetric}`
  )

  console.log(
    `Boss Moveset Assumption: ${result.summary.bossMovesetAssumption}`
  )

  console.log('')

  separator(
    '-'
  )

  console.log(
    'RANKINGS'
  )

  separator(
    '-'
  )

  // ------------------------------------------------
  // Rankings
  // ------------------------------------------------

  result.rankings.forEach(
    (
      attacker,
      index
    ) => {
      console.log('')

      console.log(
        `#${index + 1} ${attacker.pokemonName}`
      )

      console.log(
        `Collection ID: ${attacker.collectionId}`
      )

      console.log(
        `CP: ${attacker.cp}`
      )

      console.log(
        `Level: ${attacker.level}`
      )

      console.log(
        `Moves: ${attacker.loadout.fastMoveName} / ${attacker.loadout.chargedMoveName}`
      )

      console.log('')
      console.log(
        'OFFENSE'
      )

      console.log(
        `  Cycle DPS: ${formatNumber(attacker.cycleDps, 4)}`
      )

      console.log('')
      console.log(
        'BULK / PRESSURE'
      )

      console.log(
        `  HP: ${attacker.hp}`
      )

      console.log(
        `  Avg Incoming DPS: ${formatNumber(attacker.averageIncomingCycleDps, 4)}`
      )

      console.log(
        `  Avg Survival: ${formatNumber(attacker.averageTimeToFaintSeconds, 2)}s`
      )

      console.log('')
      console.log(
        'OUTPUT'
      )

      console.log(
        `  Avg TDO: ${formatNumber(attacker.averageTotalDamageOutput, 2)}`
      )

      console.log(
        `  Avg Raid Score: ${formatNumber(attacker.averageRaidScore, 4)}`
      )

      console.log(
        `  Raid Score Range: ${formatNumber(attacker.minimumRaidScore, 4)} - ${formatNumber(attacker.maximumRaidScore, 4)}`
      )

      console.log('')
      console.log(
        'BOSS MOVESET EXTREMES'
      )

      console.log(
        `  Safest: ${formatMoveSet(attacker.safestBossMoveset)}`
      )

      console.log(
        `  Most Dangerous: ${formatMoveSet(attacker.mostDangerousBossMoveset)}`
      )

      console.log(
        `  Scenarios: ${attacker.survivabilityScenarioCount}`
      )

      console.log('')

      separator(
        '.'
      )
    }
  )

  // ------------------------------------------------
  // Compact comparison
  // ------------------------------------------------

  console.log('')
  separator(
    '-'
  )

  console.log(
    'COMPACT COMPARISON'
  )

  separator(
    '-'
  )

  console.log('')

  for (
    const attacker
    of result.rankings
  ) {
    console.log(
      [
        attacker.pokemonName,
        `DPS ${formatNumber(attacker.cycleDps)}`,
        `Score ${formatNumber(attacker.raidScore)}`,
        `Survival ${formatNumber(attacker.averageTimeToFaintSeconds)}s`,
        `TDO ${formatNumber(attacker.averageTotalDamageOutput)}`,
      ].join(
        ' | '
      )
    )
  }

  console.log('')
  separator()
}