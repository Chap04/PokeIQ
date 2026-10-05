import fs from 'node:fs/promises'
import path from 'node:path'
import {
  fileURLToPath,
} from 'node:url'

import {
  buildRaidCandidates,
} from '../src/engine/raid/candidates.js'

import {
  buildShadowAvailabilitySource,
} from '../src/engine/pokemon/shadowAvailabilitySource.js'

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
// Test state
// --------------------------------------------------

let passed = 0
let failed = 0

// --------------------------------------------------
// Test helpers
// --------------------------------------------------

function expectEqual(
  name,
  actual,
  expected
) {
  if (
    actual ===
    expected
  ) {
    passed += 1

    console.log(
      `✅ ${name}`
    )

    return
  }

  failed += 1

  console.log(
    `❌ ${name}`
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
  if (
    value ===
    true
  ) {
    passed += 1

    console.log(
      `✅ ${name}`
    )

    return
  }

  failed += 1

  console.log(
    `❌ ${name}`
  )

  console.log(
    '   Expected: true'
  )

  console.log(
    `   Actual:   ${value}`
  )
}

// --------------------------------------------------
// File helpers
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
    'Testing PokeIQ Shadow availability source mapping...'
  )

  // ------------------------------------------------
  // Reference data
  // ------------------------------------------------

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
  // Permanent raid candidate universe
  // ------------------------------------------------

  const candidateResult =
    buildRaidCandidates({
      pokemon,

      cpMultiplier:
        level40Cpm,
    })

  const permanentCandidates =
    candidateResult
      .permanentCandidates

  // ------------------------------------------------
  // Shared Shadow source
  // ------------------------------------------------

  console.log('')
  console.log(
    'Downloading Bulbapedia Shadow catalogue...'
  )

  const shadowSource =
    await buildShadowAvailabilitySource({
      pokemon,

      permanentCandidates,
    })

  const {
    mapped,
    collectibleAliases,
    unmapped,
    apex,
    future,
    invalidDates,
    mappedIntoPermanentUniverse,
    aliasesIntoPermanentUniverse,
    uniqueShadowCandidateIds,
    counts,
  } =
    shadowSource

  // ------------------------------------------------
  // Summary
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'SOURCE SUMMARY'
  )
  console.log(
    '================================'
  )

  console.log(
    `Parsed Shadow entries: ${counts.parsed}`
  )

  console.log(
    `Directly mapped released entries: ${counts.directMapped}`
  )

  console.log(
    `Collectible aliases collapsed: ${counts.collectibleAliases}`
  )

  console.log(
    `Unmapped released entries: ${counts.unmapped}`
  )

  console.log(
    `Apex entries: ${counts.apex}`
  )

  console.log(
    `Future entries: ${counts.future}`
  )

  console.log(
    `Invalid/missing release dates: ${counts.invalidDates}`
  )

  console.log(
    `Direct mappings to combat-distinct permanent candidates: ${counts.directCombatCandidates}`
  )

  console.log(
    `Collectible aliases resolving to combat-distinct candidates: ${counts.collectibleAliasCombatCandidates}`
  )

  console.log(
    `Unique released Shadow combat candidates: ${counts.uniqueReleasedShadowCombatCandidates}`
  )

  // ------------------------------------------------
  // Known Shadow attackers
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'KNOWN SHADOW ATTACKERS'
  )
  console.log(
    '================================'
  )

  const knownIds = [
    'MAMOSWINE',
    'MEWTWO',
    'TYRANITAR',
    'SALAMENCE',
    'GARDEVOIR',
    'GARCHOMP',
    'DRAGONITE',
    'MOLTRES',
    'RAIKOU',
  ]

  for (
    const id
    of knownIds
  ) {
    const match =
      mappedIntoPermanentUniverse.find(
        (entry) =>
          entry.candidatePokemon.id ===
          id
      )

    if (!match) {
      console.log(
        `❌ ${id}: no clean mapping`
      )

      continue
    }

    console.log(
      `✅ ${id} → ${match.shadowCandidateId}`
    )
  }

  // ------------------------------------------------
  // Collectible aliases
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'COLLECTIBLE SHADOW ALIASES'
  )
  console.log(
    '================================'
  )

  if (
    collectibleAliases.length ===
    0
  ) {
    console.log(
      'None'
    )
  } else {
    for (
      const entry
      of collectibleAliases
    ) {
      console.log(
        `${entry.shadowEntry.code} | ` +
        `${entry.shadowEntry.name} → ` +
        `${entry.shadowCandidateId}`
      )
    }
  }

  // ------------------------------------------------
  // Unmapped
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'UNMAPPED RELEASED SHADOW ENTRIES'
  )
  console.log(
    '================================'
  )

  if (
    unmapped.length ===
    0
  ) {
    console.log(
      'None'
    )
  } else {
    for (
      const entry
      of unmapped
    ) {
      console.log('')
      console.log(
        '--------------------------------'
      )

      console.log(
        `${entry.shadowEntry.code} | ${entry.shadowEntry.name}`
      )

      console.log(
        `Kind: ${entry.classification.kind}`
      )

      console.log(
        `Release: ${entry.shadowEntry.releaseDateRaw}`
      )

      console.log(
        'Reference candidates:'
      )

      if (
        entry.referenceEntries.length ===
        0
      ) {
        console.log(
          '  None'
        )
      } else {
        for (
          const referenceEntry
          of entry.referenceEntries
        ) {
          console.log(
            `  ${referenceEntry.id} [${referenceEntry.form}]`
          )
        }
      }
    }
  }

  // ------------------------------------------------
  // Invalid dates
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'INVALID / MISSING RELEASE DATES'
  )
  console.log(
    '================================'
  )

  if (
    invalidDates.length ===
    0
  ) {
    console.log(
      'None'
    )
  } else {
    for (
      const entry
      of invalidDates
    ) {
      console.log(
        `${entry.shadowEntry.code} | ` +
        `${entry.shadowEntry.name} | ` +
        `${entry.shadowEntry.releaseDateRaw || 'EMPTY'}`
      )
    }
  }

  // ------------------------------------------------
  // Direct mappings outside combat universe
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'DIRECTLY MAPPED BUT NOT COMBAT-DISTINCT'
  )
  console.log(
    '================================'
  )

  const mappedButCollapsed =
    mapped.filter(
      (entry) =>
        !entry.existsInPermanentUniverse
    )

  if (
    mappedButCollapsed.length ===
    0
  ) {
    console.log(
      'None'
    )
  } else {
    for (
      const entry
      of mappedButCollapsed
    ) {
      console.log(
        `${entry.candidateId} | ` +
        `${entry.shadowEntry.code} | ` +
        `${entry.shadowEntry.name}`
      )
    }
  }

  // ------------------------------------------------
  // Alias mappings outside combat universe
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'ALIASES NOT IN COMBAT-DISTINCT UNIVERSE'
  )
  console.log(
    '================================'
  )

  const aliasesButCollapsed =
    collectibleAliases.filter(
      (entry) =>
        !entry.existsInPermanentUniverse
    )

  if (
    aliasesButCollapsed.length ===
    0
  ) {
    console.log(
      'None'
    )
  } else {
    for (
      const entry
      of aliasesButCollapsed
    ) {
      console.log(
        `${entry.shadowEntry.code} | ` +
        `${entry.shadowEntry.name} → ` +
        `${entry.candidateId}`
      )
    }
  }

  // ------------------------------------------------
  // Apex
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'APEX SHADOW ENTRIES'
  )
  console.log(
    '================================'
  )

  if (
    apex.length ===
    0
  ) {
    console.log(
      'None'
    )
  } else {
    for (
      const entry
      of apex
    ) {
      console.log(
        `${entry.shadowEntry.code} | ` +
        `${entry.shadowEntry.name} | ` +
        `${entry.shadowEntry.releaseDateRaw}`
      )
    }
  }

  // ------------------------------------------------
  // Future releases
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'FUTURE SHADOW ENTRIES'
  )
  console.log(
    '================================'
  )

  if (
    future.length ===
    0
  ) {
    console.log(
      'None'
    )
  } else {
    for (
      const entry
      of future
    ) {
      console.log(
        `${entry.shadowEntry.code} | ` +
        `${entry.shadowEntry.name} | ` +
        `${entry.shadowEntry.releaseDateRaw}`
      )
    }
  }

  // ------------------------------------------------
  // Regression helpers
  // ------------------------------------------------

  function findMapped(
    id,
    form = 'NORMAL'
  ) {
    return (
      mappedIntoPermanentUniverse.find(
        (entry) =>
          entry.candidatePokemon.id ===
            id &&
          (
            entry.candidatePokemon.form ??
            'NORMAL'
          ) ===
            form
      ) ??
      null
    )
  }

  // ------------------------------------------------
  // Regression tests
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'REGRESSION TESTS'
  )
  console.log(
    '================================'
  )

  expectTrue(
    'Shadow Mamoswine maps',
    Boolean(
      findMapped(
        'MAMOSWINE'
      )
    )
  )

  expectTrue(
    'Shadow Mewtwo maps',
    Boolean(
      findMapped(
        'MEWTWO'
      )
    )
  )

  expectTrue(
    'Shadow Tyranitar maps',
    Boolean(
      findMapped(
        'TYRANITAR'
      )
    )
  )

  expectTrue(
    'Shadow Salamence maps',
    Boolean(
      findMapped(
        'SALAMENCE'
      )
    )
  )

  expectTrue(
    'Shadow Gardevoir maps',
    Boolean(
      findMapped(
        'GARDEVOIR'
      )
    )
  )

  expectTrue(
    'Shadow Garchomp maps',
    Boolean(
      findMapped(
        'GARCHOMP'
      )
    )
  )

  expectEqual(
    'Apex Shadow entry count',
    apex.length,
    2
  )

  const apexLugia =
    apex.find(
      (entry) =>
        entry.shadowEntry.code ===
        '0249A'
    )

  expectTrue(
    'Apex Shadow Lugia detected',
    Boolean(
      apexLugia
    )
  )

  expectEqual(
    'Apex Shadow Lugia release date',
    apexLugia
      ?.shadowEntry
      ?.releaseDate
      ?.toISOString()
      ?.slice(
        0,
        10
      ),
    '2022-03-26'
  )

  const apexHoOh =
    apex.find(
      (entry) =>
        entry.shadowEntry.code ===
        '0250A'
    )

  expectTrue(
    'Apex Shadow Ho-Oh detected',
    Boolean(
      apexHoOh
    )
  )

  expectEqual(
    'Apex Shadow Ho-Oh release date',
    apexHoOh
      ?.shadowEntry
      ?.releaseDate
      ?.toISOString()
      ?.slice(
        0,
        10
      ),
    '2022-02-26'
  )

  expectTrue(
    'Every directly mapped Shadow has a release date',
    mapped.every(
      (entry) =>
        entry
          .shadowEntry
          .releaseDate instanceof
        Date
    )
  )

  expectEqual(
    'Unmapped released Shadow entry count',
    unmapped.length,
    0
  )

  expectEqual(
    'Invalid release date count',
    invalidDates.length,
    0
  )

  expectEqual(
    'Collectible Shadow alias count',
    collectibleAliases.length,
    9
  )

  // ------------------------------------------------
  // Shared-module regression checks
  // ------------------------------------------------

  expectEqual(
    'Direct combat mapping count',
    mappedIntoPermanentUniverse.length,
    475
  )

  expectEqual(
    'Collectible alias combat mapping count',
    aliasesIntoPermanentUniverse.length,
    9
  )

  expectEqual(
    'Unique released Shadow combat candidate count',
    uniqueShadowCandidateIds.size,
    475
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

    console.log(
      'Shared Shadow availability source validation successful.'
    )
  } else {
    console.log(
      `❌ ${failed} test(s) failed.`
    )

    process.exitCode = 1
  }
}

// --------------------------------------------------
// Run
// --------------------------------------------------

main().catch(
  (error) => {
    console.error('')

    console.error(
      'Shadow availability source mapping failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)