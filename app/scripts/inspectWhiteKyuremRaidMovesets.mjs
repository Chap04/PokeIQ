import fs from 'node:fs/promises'
import path from 'node:path'
import {
  fileURLToPath,
} from 'node:url'

import {
  buildRaidCandidates,
} from '../src/engine/raid/candidates.js'

import {
  createRaidBoss,
} from '../src/engine/raid/boss.js'

import {
  optimizePokemonRaidMovesets,
} from '../src/engine/raid/optimizer.js'

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
// JSON helper
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

// --------------------------------------------------
// Formatting
// --------------------------------------------------

function formatValue(
  value,
  digits = 6
) {
  if (!Number.isFinite(value)) {
    return String(value)
  }

  return value.toFixed(
    digits
  )
}

function printMove(
  label,
  move
) {
  console.log(
    `${label}: ${move.id}`
  )

  console.log(
    `  Type: ${move.type}`
  )

  console.log(
    `  Power: ${move.power}`
  )

  console.log(
    `  Energy Delta: ${move.energyDelta}`
  )

  console.log(
    `  Raw Duration: ${move.durationMs} ms`
  )
}

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  console.log(
    'Inspecting White Kyurem Raid Movesets...'
  )

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
  // Level 40 CPM
  // ------------------------------------------------

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
  // Build actual raid candidates
  // ------------------------------------------------

  const {
    candidates,
  } =
    buildRaidCandidates({
      pokemon,

      cpMultiplier:
        level40Cpm,
    })

  const whiteKyuremCandidate =
    candidates.find(
      (candidate) =>
        candidate.id ===
        'KYUREM__KYUREM_WHITE'
    )

  if (!whiteKyuremCandidate) {
    throw new Error(
      'White Kyurem raid candidate not found.'
    )
  }

  const whiteKyurem =
    whiteKyuremCandidate
      .pokemon

  // ------------------------------------------------
  // Locate Rayquaza
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
      'Rayquaza reference record not found.'
    )
  }

  const megaRayquaza =
    rayquaza
      .temporaryEvolutions
      ?.find(
        (entry) =>
          entry.id ===
          'TEMP_EVOLUTION_MEGA'
      )

  if (!megaRayquaza) {
    throw new Error(
      'Mega Rayquaza temporary evolution not found.'
    )
  }

  const megaRayquazaPokemon = {
    ...rayquaza,

    stats: {
      ...megaRayquaza.stats,
    },

    types: [
      ...megaRayquaza.types,
    ],
  }

  // ------------------------------------------------
  // Raid boss
  // ------------------------------------------------

  const megaRaidProfile = {
    id:
      'MEGA_LEGENDARY',

    name:
      'Mega Legendary Raid',

    bossHp:
      9000,

    cpMultiplier:
      0.79,

    timerSeconds:
      300,
  }

  const boss =
    createRaidBoss({
      pokemon:
        megaRayquazaPokemon,

      raidProfile:
        megaRaidProfile,
    })

  // ------------------------------------------------
  // Candidate information
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'WHITE KYUREM RAID CANDIDATE'
  )
  console.log(
    '================================'
  )

  console.log(
    `Candidate ID: ${whiteKyuremCandidate.id}`
  )

  console.log(
    `ID: ${whiteKyurem.id}`
  )

  console.log(
    `Form: ${whiteKyurem.form}`
  )

  console.log(
    `Attack: ${whiteKyurem.stats.attack}`
  )

  console.log(
    `Defense: ${whiteKyurem.stats.defense}`
  )

  console.log(
    `Stamina: ${whiteKyurem.stats.stamina}`
  )

  console.log(
    `Types: ${whiteKyurem.types.join(' / ')}`
  )

  console.log('')
  console.log(
    'Fast Move Pool:'
  )

  console.dir(
    whiteKyurem.moves.fast,
    {
      depth:
        null,
    }
  )

  console.log('')
  console.log(
    'Charged Move Pool:'
  )

  console.dir(
    whiteKyurem.moves.charged,
    {
      depth:
        null,
    }
  )

  console.log('')
  console.log(
    'Derived Move Metadata:'
  )

  console.dir(
    whiteKyurem
      .raidCandidateMetadata
      ?.derivedMoves ??
      null,
    {
      depth:
        null,
    }
  )

  // ------------------------------------------------
  // Relevant move records
  // ------------------------------------------------

  const referencedMoveIds =
    new Set([
      ...(
        whiteKyurem.moves.fast
          ?.normal ??
        []
      ),

      ...(
        whiteKyurem.moves.fast
          ?.elite ??
        []
      ),

      ...(
        whiteKyurem.moves.fast
          ?.special ??
        []
      ),

      ...(
        whiteKyurem.moves.charged
          ?.normal ??
        []
      ),

      ...(
        whiteKyurem.moves.charged
          ?.elite ??
        []
      ),

      ...(
        whiteKyurem.moves.charged
          ?.special ??
        []
      ),
    ])

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'RAW MOVE DATA'
  )
  console.log(
    '================================'
  )

  for (
    const moveId
    of referencedMoveIds
  ) {
    const move =
      moves.find(
        (entry) =>
          String(
            entry.id
          ) ===
          String(
            moveId
          )
      )

    if (!move) {
      console.log('')
      console.log(
        `❌ Missing move: ${moveId}`
      )

      continue
    }

    console.log('')

    printMove(
      'Move',
      move
    )
  }

  // ------------------------------------------------
  // Optimization
  // ------------------------------------------------

  const rankings =
    optimizePokemonRaidMovesets({
      pokemon:
        whiteKyurem,

      defender:
        boss,

      moves,

      attackerCpMultiplier:
        whiteKyuremCandidate
          .cpMultiplier,

      defenderCpMultiplier:
        boss
          .raidBoss
          .cpMultiplier,

      combatData:
        combat,

      attackerModifiers:
        whiteKyuremCandidate
          .attackerModifiers ??
        [],
    })

  // ------------------------------------------------
  // Full ranking
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'ALL WHITE KYUREM MOVESETS'
  )
  console.log(
    '================================'
  )

  console.log('')

  for (
    const result
    of rankings
  ) {
    const fast =
      result
        .performance
        .fastMove

    const charged =
      result
        .performance
        .chargedMove

    console.log(
      `#${result.rank}`
    )

    console.log(
      `${result.fastMoveId} + ${result.chargedMoveId}`
    )

    console.log(
      `Availability: ${result.availability}`
    )

    console.log('')

    console.log(
      `Fast Damage: ${fast.damage}`
    )

    console.log(
      `Fast Duration: ${fast.durationSeconds}s`
    )

    console.log(
      `Fast Energy: ${fast.energyGain}`
    )

    console.log(
      `Fast DPS: ${formatValue(fast.dps)}`
    )

    console.log(
      `Fast EPS: ${formatValue(fast.eps)}`
    )

    console.log('')

    console.log(
      `Charged Damage: ${charged.damage}`
    )

    console.log(
      `Charged Duration: ${charged.durationSeconds}s`
    )

    console.log(
      `Charged Cost: ${charged.energyCost}`
    )

    console.log(
      `Charged DPS: ${formatValue(charged.dps)}`
    )

    console.log(
      `Charged Energy Rate: ${formatValue(charged.eps)}`
    )

    console.log('')

    console.log(
      `Cycle DPS: ${formatValue(result.cycleDps)}`
    )

    console.log(
      '--------------------------------'
    )
  }

  // ------------------------------------------------
  // Ice Burn / Blizzard comparison
  // ------------------------------------------------

  const iceBurnResults =
    rankings.filter(
      (result) =>
        result.chargedMoveId ===
        'ICE_BURN'
    )

  const blizzardResults =
    rankings.filter(
      (result) =>
        result.chargedMoveId ===
        'BLIZZARD'
    )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'ICE BURN VS BLIZZARD'
  )
  console.log(
    '================================'
  )

  console.log('')

  if (!iceBurnResults.length) {
    console.log(
      '⚠️ No Ice Burn moveset was generated.'
    )
  } else {
    for (
      const result
      of iceBurnResults
    ) {
      console.log(
        `ICE BURN: ${result.fastMoveId} + ${result.chargedMoveId}`
      )

      console.log(
        `Cycle DPS: ${formatValue(result.cycleDps)}`
      )

      console.log(
        `Availability: ${result.availability}`
      )

      console.log('')
    }
  }

  if (!blizzardResults.length) {
    console.log(
      '⚠️ No Blizzard moveset was generated.'
    )
  } else {
    for (
      const result
      of blizzardResults
    ) {
      console.log(
        `BLIZZARD: ${result.fastMoveId} + ${result.chargedMoveId}`
      )

      console.log(
        `Cycle DPS: ${formatValue(result.cycleDps)}`
      )

      console.log(
        `Availability: ${result.availability}`
      )

      console.log('')
    }
  }

  // ------------------------------------------------
  // Winner
  // ------------------------------------------------

  console.log(
    '================================'
  )
  console.log(
    'BEST MOVESET'
  )
  console.log(
    '================================'
  )

  const best =
    rankings[0]

  if (!best) {
    console.log(
      'No rankable movesets.'
    )

    return
  }

  console.log('')
  console.log(
    `${best.fastMoveId} + ${best.chargedMoveId}`
  )

  console.log(
    `Availability: ${best.availability}`
  )

  console.log(
    `Cycle DPS: ${formatValue(best.cycleDps)}`
  )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'INSPECTION COMPLETE'
  )
  console.log(
    '================================'
  )

  console.log(
    'No PokeIQ files were modified.'
  )
}

main().catch(
  (error) => {
    console.error('')
    console.error(
      'White Kyurem inspection failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)