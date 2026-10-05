import fs from 'node:fs/promises'
import path from 'node:path'
import {
  fileURLToPath,
} from 'node:url'

import {
  buildRaidCandidates,
} from '../src/engine/raid/candidates.js'

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

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  console.log(
    'Inspecting temporary-evolution raid candidates...'
  )

  const [
    pokemon,
    combat,
  ] =
    await Promise.all([
      readJson(
        'pokemon.json'
      ),

      readJson(
        'combat.json'
      ),
    ])

  const cpMultiplier =
    combat
      .cpMultipliers
      .allLevels['40']

  const result =
    buildRaidCandidates({
      pokemon,
      cpMultiplier,
    })

  const temporaryCandidates =
    result
      .temporaryEvolutionCandidates ??
    []

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'SUMMARY'
  )
  console.log(
    '================================'
  )

  console.log(
    `Permanent candidates: ${
      result
        .permanentCandidates
        ?.length ?? 0
    }`
  )

  console.log(
    `Temporary candidates: ${
      temporaryCandidates.length
    }`
  )

  console.log(
    `Total candidates: ${
      result.candidates.length
    }`
  )

  const temporaryRejections =
    result.rejected.filter(
      (entry) =>
        entry.candidateType ===
        'TEMPORARY_EVOLUTION'
    )

  console.log(
    `Temporary rejections: ${
      temporaryRejections.length
    }`
  )

  // ------------------------------------------------
  // Candidates
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'TEMPORARY CANDIDATES'
  )
  console.log(
    '================================'
  )

  for (
    const candidate
    of temporaryCandidates
  ) {
    const metadata =
      candidate
        .pokemon
        .raidCandidateMetadata
        ?.temporaryEvolution

    console.log('')
    console.log(
      candidate.id
    )

    console.log(
      `  Label: ${candidate.label}`
    )

    console.log(
      `  Source: ${
        metadata?.sourcePokemonId
      } [${
        metadata?.sourceForm
      }]`
    )

    console.log(
      `  Temporary ID: ${
        metadata?.id
      }`
    )

    console.log(
      `  Stats: ${
        candidate.pokemon.stats.attack
      } / ${
        candidate.pokemon.stats.defense
      } / ${
        candidate.pokemon.stats.stamina
      }`
    )

    console.log(
      `  Types: ${
        candidate
          .pokemon
          .types
          .join(' / ')
      }`
    )

    console.log(
      `  Required Move: ${
        metadata
          ?.requirements
          ?.move ??
        'None'
      }`
    )
  }

  // ------------------------------------------------
  // Rejections
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'TEMPORARY REJECTIONS'
  )
  console.log(
    '================================'
  )

  if (
    !temporaryRejections.length
  ) {
    console.log(
      'None'
    )
  } else {
    for (
      const rejection
      of temporaryRejections
    ) {
      console.log(
        `${
          rejection.id
        } [${
          rejection.form
        }] | ${
          rejection
            .temporaryEvolutionId ??
          'NULL'
        } → ${
          rejection.reasons.join(', ')
        }`
      )
    }
  }

  // ------------------------------------------------
  // Important checks
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'IMPORTANT TEMPORARY FORMS'
  )
  console.log(
    '================================'
  )

  const checks = [
    'RAYQUAZA',
    'GROUDON',
    'KYOGRE',
    'MEWTWO',
    'CHARIZARD',
    'GENGAR',
    'GARDEVOIR',
    'LUCARIO',
    'TYRANITAR',
    'DIANCIE',
  ]

  for (
    const pokemonId
    of checks
  ) {
    const matches =
      temporaryCandidates.filter(
        (candidate) =>
          candidate
            .pokemon
            .raidCandidateMetadata
            ?.temporaryEvolution
            ?.sourcePokemonId ===
          pokemonId
      )

    console.log('')
    console.log(
      `${pokemonId}: ${matches.length}`
    )

    for (
      const candidate
      of matches
    ) {
      console.log(
        `  ${candidate.id}`
      )
    }
  }

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
      'Temporary candidate inspection failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)