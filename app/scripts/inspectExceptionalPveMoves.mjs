import fs from 'node:fs/promises'
import path from 'node:path'
import {
  fileURLToPath,
} from 'node:url'

import {
  buildRaidCandidates,
} from '../src/engine/raid/candidates.js'

import {
  filterPlayerUsablePokemon,
} from '../src/engine/pokemon/availability.js'

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

function collectMoveIds(
  pokemon
) {
  return {
    fast: [
      ...(
        pokemon
          ?.moves
          ?.fast
          ?.normal ??
        []
      ),

      ...(
        pokemon
          ?.moves
          ?.fast
          ?.elite ??
        []
      ),

      ...(
        pokemon
          ?.moves
          ?.fast
          ?.special ??
        []
      ),
    ],

    charged: [
      ...(
        pokemon
          ?.moves
          ?.charged
          ?.normal ??
        []
      ),

      ...(
        pokemon
          ?.moves
          ?.charged
          ?.elite ??
        []
      ),

      ...(
        pokemon
          ?.moves
          ?.charged
          ?.special ??
        []
      ),
    ],
  }
}

function getMoveLookup(
  moves
) {
  return new Map(
    moves.map(
      (move) => [
        String(
          move.id
        ),
        move,
      ]
    )
  )
}

function addReference(
  map,
  moveId,
  candidate
) {
  if (
    !map.has(
      moveId
    )
  ) {
    map.set(
      moveId,
      []
    )
  }

  map
    .get(
      moveId
    )
    .push({
      id:
        candidate.id,

      label:
        candidate.label,

      pokemonId:
        candidate
          .pokemon
          .id,

      form:
        candidate
          .pokemon
          .form,
    })
}

function findTemplateName(
  move
) {
  if (!move) {
    return null
  }

  return (
    move.templateId ??
    move.sourceTemplateId ??
    null
  )
}

function printDivider() {
  console.log(
    '================================'
  )
}

function printMoveBlock({
  title,
  entries,
}) {
  console.log('')
  printDivider()
  console.log(title)
  printDivider()

  console.log(
    `Count: ${entries.length}`
  )

  if (
    entries.length ===
    0
  ) {
    console.log('')
    console.log('None')

    return
  }

  for (
    const entry
    of entries
  ) {
    console.log('')
    console.log(
      `${entry.moveId}`
    )

    console.log(
      `  type: ${entry.move?.type ?? 'NULL'}`
    )

    console.log(
      `  power: ${entry.move?.power ?? 'NULL'}`
    )

    console.log(
      `  energyDelta: ${entry.move?.energyDelta ?? 'NULL'}`
    )

    console.log(
      `  durationMs: ${entry.move?.durationMs ?? 'NULL'}`
    )

    console.log(
      `  damageWindowStartMs: ${entry.move?.damageWindowStartMs ?? 'NULL'}`
    )

    console.log(
      `  damageWindowEndMs: ${entry.move?.damageWindowEndMs ?? 'NULL'}`
    )

    const templateName =
      findTemplateName(
        entry.move
      )

    if (templateName) {
      console.log(
        `  template: ${templateName}`
      )
    }

    console.log(
      `  referenced by: ${entry.references.length}`
    )

    for (
      const reference
      of entry.references.slice(
        0,
        30
      )
    ) {
      console.log(
        `    ${reference.id}` +
        ` | ${reference.label}` +
        ` | form=${reference.form ?? 'NORMAL'}`
      )
    }

    if (
      entry.references.length >
      30
    ) {
      console.log(
        `    ...and ${entry.references.length - 30} more`
      )
    }
  }
}

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  console.log(
    'Inspecting exceptional PvE moves...'
  )

  const [
    pokemon,
    moves,
    combat,
    availability,
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
      'pokemon-availability.json'
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

  const {
    candidates,
  } =
    buildRaidCandidates({
      pokemon,

      cpMultiplier:
        level40Cpm,
    })

  const usableCandidates =
    filterPlayerUsablePokemon(
      candidates,
      availability
    )

  const moveLookup =
    getMoveLookup(
      moves
    )

  // ------------------------------------------------
  // Build move-reference maps
  // ------------------------------------------------

  const fastReferences =
    new Map()

  const chargedReferences =
    new Map()

  for (
    const candidate
    of usableCandidates
  ) {
    const pools =
      collectMoveIds(
        candidate.pokemon
      )

    for (
      const moveId
      of pools.fast
    ) {
      addReference(
        fastReferences,
        String(moveId),
        candidate
      )
    }

    for (
      const moveId
      of pools.charged
    ) {
      addReference(
        chargedReferences,
        String(moveId),
        candidate
      )
    }
  }

  // ------------------------------------------------
  // Exceptional move collections
  // ------------------------------------------------

  const fastNullPower = []
  const fastNullEnergy = []
  const chargedNullPower = []
  const chargedNullEnergy = []
  const missingFastMoves = []
  const missingChargedMoves = []

  for (
    const [
      moveId,
      references,
    ]
    of fastReferences
  ) {
    const move =
      moveLookup.get(
        moveId
      )

    if (!move) {
      missingFastMoves.push({
        moveId,
        move:
          null,

        references,
      })

      continue
    }

    if (
      !Number.isFinite(
        move.power
      )
    ) {
      fastNullPower.push({
        moveId,

        move,

        references,
      })
    }

    if (
      !Number.isFinite(
        move.energyDelta
      )
    ) {
      fastNullEnergy.push({
        moveId,

        move,

        references,
      })
    }
  }

  for (
    const [
      moveId,
      references,
    ]
    of chargedReferences
  ) {
    const move =
      moveLookup.get(
        moveId
      )

    if (!move) {
      missingChargedMoves.push({
        moveId,

        move:
          null,

        references,
      })

      continue
    }

    if (
      !Number.isFinite(
        move.power
      )
    ) {
      chargedNullPower.push({
        moveId,

        move,

        references,
      })
    }

    if (
      !Number.isFinite(
        move.energyDelta
      )
    ) {
      chargedNullEnergy.push({
        moveId,

        move,

        references,
      })
    }
  }

  // ------------------------------------------------
  // Summary
  // ------------------------------------------------

  console.log('')
  printDivider()
  console.log(
    'ROSTER SUMMARY'
  )
  printDivider()

  console.log(
    `Reference Pokémon: ${pokemon.length}`
  )

  console.log(
    `PvE moves: ${moves.length}`
  )

  console.log(
    `Raid candidates: ${candidates.length}`
  )

  console.log(
    `Player-usable candidates: ${usableCandidates.length}`
  )

  console.log(
    `Referenced Fast Moves: ${fastReferences.size}`
  )

  console.log(
    `Referenced Charged Moves: ${chargedReferences.size}`
  )

  console.log('')
  printDivider()
  console.log(
    'EXCEPTION SUMMARY'
  )
  printDivider()

  console.log(
    `Fast Moves with null/non-finite power: ${fastNullPower.length}`
  )

  console.log(
    `Fast Moves with null/non-finite energyDelta: ${fastNullEnergy.length}`
  )

  console.log(
    `Charged Moves with null/non-finite power: ${chargedNullPower.length}`
  )

  console.log(
    `Charged Moves with null/non-finite energyDelta: ${chargedNullEnergy.length}`
  )

  console.log(
    `Missing referenced Fast Moves: ${missingFastMoves.length}`
  )

  console.log(
    `Missing referenced Charged Moves: ${missingChargedMoves.length}`
  )

  // ------------------------------------------------
  // Detail
  // ------------------------------------------------

  printMoveBlock({
    title:
      'FAST MOVES — NULL / NON-FINITE POWER',

    entries:
      fastNullPower,
  })

  printMoveBlock({
    title:
      'FAST MOVES — NULL / NON-FINITE ENERGY',

    entries:
      fastNullEnergy,
  })

  printMoveBlock({
    title:
      'CHARGED MOVES — NULL / NON-FINITE POWER',

    entries:
      chargedNullPower,
  })

  printMoveBlock({
    title:
      'CHARGED MOVES — NULL / NON-FINITE ENERGY',

    entries:
      chargedNullEnergy,
  })

  printMoveBlock({
    title:
      'MISSING REFERENCED FAST MOVES',

    entries:
      missingFastMoves,
  })

  printMoveBlock({
    title:
      'MISSING REFERENCED CHARGED MOVES',

    entries:
      missingChargedMoves,
  })

  // ------------------------------------------------
  // Numeric move IDs
  // ------------------------------------------------

  console.log('')
  printDivider()
  console.log(
    'NUMERIC MOVE IDS'
  )
  printDivider()

  const numericMoveIds =
    moves
      .filter(
        (move) =>
          /^\d+$/.test(
            String(
              move.id
            )
          )
      )
      .map(
        (move) =>
          String(
            move.id
          )
      )
      .sort(
        (a, b) =>
          Number(a) -
          Number(b)
      )

  console.log(
    `Count: ${numericMoveIds.length}`
  )

  for (
    const moveId
    of numericMoveIds
  ) {
    const move =
      moveLookup.get(
        moveId
      )

    const fastUsers =
      fastReferences.get(
        moveId
      ) ??
      []

    const chargedUsers =
      chargedReferences.get(
        moveId
      ) ??
      []

    console.log('')
    console.log(
      `${moveId}`
    )

    console.log(
      `  type: ${move?.type ?? 'NULL'}`
    )

    console.log(
      `  power: ${move?.power ?? 'NULL'}`
    )

    console.log(
      `  energyDelta: ${move?.energyDelta ?? 'NULL'}`
    )

    console.log(
      `  durationMs: ${move?.durationMs ?? 'NULL'}`
    )

    console.log(
      `  fast references: ${fastUsers.length}`
    )

    console.log(
      `  charged references: ${chargedUsers.length}`
    )

    for (
      const reference
      of [
        ...fastUsers,
        ...chargedUsers,
      ].slice(
        0,
        20
      )
    ) {
      console.log(
        `    ${reference.id} | ${reference.label}`
      )
    }
  }

  console.log('')
  printDivider()
  console.log(
    'INSPECTION COMPLETE'
  )
  printDivider()

  console.log(
    'No PokeIQ files were modified.'
  )
}

main().catch(
  (error) => {
    console.error('')
    console.error(
      'Exceptional PvE move inspection failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)