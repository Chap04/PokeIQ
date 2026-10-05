import fs from 'node:fs/promises'
import path from 'node:path'
import {
  fileURLToPath,
} from 'node:url'

import {
  resolveTemporaryEvolution,
} from '../src/engine/pokemon/transform.js'

import {
  createRaidBoss,
} from '../src/engine/raid/boss.js'

import {
  compareRaidAttackers,
} from '../src/engine/raid/comparison.js'

// --------------------------------------------------
// Paths
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

// --------------------------------------------------
// Helpers
// --------------------------------------------------

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

function findPokemon(
  pokemon,
  id,
  form = 'NORMAL'
) {
  const result =
    pokemon.find(
      (entry) =>
        entry.id === id &&
        entry.form === form
    )

  if (!result) {
    throw new Error(
      `Pokémon not found: ${id} (${form})`
    )
  }

  return result
}

function withIvs(
  pokemon,
  attack = 15,
  defense = 15,
  stamina = 15
) {
  return {
    ...pokemon,

    ivs: {
      attack,
      defense,
      stamina,
    },
  }
}

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  console.log(
    'Testing PokeIQ Raid Attacker Comparison...'
  )

  const [
    pokemon,
    moves,
    combat,
    raidProfiles,
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

    readJson(
      'raid-profiles.json'
    ),
  ])

  const level40Cpm =
    combat
      .cpMultipliers
      .allLevels['40']

  if (
    !Number.isFinite(
      level40Cpm
    )
  ) {
    throw new Error(
      'Level 40 CPM not found.'
    )
  }

  // ------------------------------------------------
  // Build Mega Rayquaza raid boss
  // ------------------------------------------------

  const baseRayquaza =
    findPokemon(
      pokemon,
      'RAYQUAZA'
    )

  const megaRayquaza =
    resolveTemporaryEvolution(
      baseRayquaza,
      'TEMP_EVOLUTION_MEGA'
    )

  const boss =
    createRaidBoss({
      pokemon:
        megaRayquaza,

      raidProfile:
        raidProfiles.MEGA,
    })

  // ------------------------------------------------
  // Build attacker candidates
  // ------------------------------------------------

  const mamoswine =
    withIvs(
      findPokemon(
        pokemon,
        'MAMOSWINE'
      )
    )

  const baxcalibur =
    withIvs(
      findPokemon(
        pokemon,
        'BAXCALIBUR'
      )
    )

  const dragonite =
    withIvs(
      findPokemon(
        pokemon,
        'DRAGONITE'
      )
    )

  const galarianDarmanitanReference =
    pokemon.find(
      (entry) =>
        entry.id ===
          'DARMANITAN' &&
        entry.form ===
          'DARMANITAN_GALARIAN_STANDARD'
    )

  if (!galarianDarmanitanReference) {
    throw new Error(
      'Galarian Darmanitan reference data not found.'
    )
  }

  const galarianDarmanitan =
    withIvs(
      galarianDarmanitanReference
    )

  const megaRayquazaAttacker =
    withIvs(
      megaRayquaza
    )

  const candidates = [
    {
      id:
        'MEGA_RAYQUAZA',

      label:
        'Mega Rayquaza',

      pokemon:
        megaRayquazaAttacker,

      cpMultiplier:
        level40Cpm,
    },

    {
      id:
        'MAMOSWINE',

      label:
        'Mamoswine',

      pokemon:
        mamoswine,

      cpMultiplier:
        level40Cpm,
    },

    {
      id:
        'BAXCALIBUR',

      label:
        'Baxcalibur',

      pokemon:
        baxcalibur,

      cpMultiplier:
        level40Cpm,
    },

    {
      id:
        'GALARIAN_DARMANITAN',

      label:
        'Galarian Darmanitan',

      pokemon:
        galarianDarmanitan,

      cpMultiplier:
        level40Cpm,
    },

    {
      id:
        'DRAGONITE',

      label:
        'Dragonite',

      pokemon:
        dragonite,

      cpMultiplier:
        level40Cpm,
    },
  ]

  // ------------------------------------------------
  // Compare
  // ------------------------------------------------

  const rankings =
    compareRaidAttackers({
      candidates,

      defender:
        boss,

      defenderCpMultiplier:
        boss
          .raidBoss
          .cpMultiplier,

      moves,

      combatData:
        combat,
    })

  // ------------------------------------------------
  // Output
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'MEGA RAYQUAZA COUNTER SAMPLE'
  )
  console.log(
    '================================'
  )

  console.log('')
  console.log(
    `Boss HP: ${boss.raidBoss.hp}`
  )

  console.log(
    `Boss CPM: ${boss.raidBoss.cpMultiplier}`
  )

  console.log(
    `Boss Types: ${boss.types.join(' / ')}`
  )

  console.log('')

  for (
    const result
    of rankings
  ) {
    const best =
      result.bestMoveset

    console.log(
      `${String(
        result.rank
      ).padStart(2)}. ` +
      `${result.label.padEnd(22)} | ` +
      `${best.fastMoveId.padEnd(20)} + ` +
      `${best.chargedMoveId.padEnd(18)} | ` +
      `${best.cycleDps
        .toFixed(6)
        .padStart(10)} DPS | ` +
      `${best.availability}`
    )
  }

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'BEST NORMAL MOVESETS'
  )
  console.log(
    '================================'
  )

  console.log('')

  for (
    const result
    of rankings
  ) {
    const normal =
      result.bestNormalMoveset

    if (!normal) {
      console.log(
        `${result.label}: none`
      )

      continue
    }

    console.log(
      `${result.label}: ` +
      `${normal.fastMoveId} + ` +
      `${normal.chargedMoveId} | ` +
      `${normal.cycleDps.toFixed(6)} DPS`
    )
  }
}

main().catch(
  (error) => {
    console.error('')
    console.error(
      'Raid attacker comparison failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)