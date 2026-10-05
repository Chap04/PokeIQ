import fs from 'node:fs/promises'
import path from 'node:path'
import {
  fileURLToPath,
} from 'node:url'

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
  if (actual === expected) {
    passed += 1
    console.log(`✅ ${name}`)
  } else {
    failed += 1
    console.log(`❌ ${name}`)
    console.log(
      `   Expected: ${expected}`
    )
    console.log(
      `   Actual:   ${actual}`
    )
  }
}

function expectTrue(
  name,
  value
) {
  if (value === true) {
    passed += 1
    console.log(`✅ ${name}`)
  } else {
    failed += 1
    console.log(`❌ ${name}`)
    console.log(
      '   Expected: true'
    )
    console.log(
      `   Actual:   ${value}`
    )
  }
}

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
// Availability helpers
// --------------------------------------------------

function getEntry(
  availability,
  id
) {
  return (
    availability
      .overrides
      ?.[id] ??
    null
  )
}

function expectEntryExists(
  availability,
  id
) {
  const entry =
    getEntry(
      availability,
      id
    )

  expectTrue(
    `${id} exists`,
    Boolean(entry)
  )

  return entry
}

function expectUsable(
  availability,
  id
) {
  const entry =
    expectEntryExists(
      availability,
      id
    )

  if (!entry) {
    return
  }

  expectEqual(
    `${id} is released`,
    entry.released,
    true
  )

  expectEqual(
    `${id} is player usable`,
    entry.playerUsable,
    true
  )
}

function expectUnavailable(
  availability,
  id
) {
  const entry =
    expectEntryExists(
      availability,
      id
    )

  if (!entry) {
    return
  }

  expectEqual(
    `${id} is released`,
    entry.released,
    false
  )

  expectEqual(
    `${id} is player usable`,
    entry.playerUsable,
    false
  )
}

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  console.log(
    'Testing PokeIQ Generated Pokémon Availability...'
  )

  const availability =
    await readJson(
      'pokemon-availability.json'
    )

  const overrides =
    availability.overrides ?? {}

  const entries =
    Object.entries(
      overrides
    )

  // ------------------------------------------------
  // Dataset summary
  // ------------------------------------------------

  const usableEntries =
    entries.filter(
      ([, entry]) =>
        entry.playerUsable ===
        true
    )

  const unavailableEntries =
    entries.filter(
      ([, entry]) =>
        entry.playerUsable ===
        false
    )

  const explicitEntries =
    entries.filter(
      ([, entry]) =>
        entry.confidence ===
        'EXPLICIT'
    )

  const inferredEntries =
    entries.filter(
      ([, entry]) =>
        entry.confidence ===
        'INFERRED'
    )

  const unknownEntries =
    entries.filter(
      ([, entry]) =>
        entry.confidence ===
        'UNKNOWN'
    )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'GENERATED DATASET'
  )
  console.log(
    '================================'
  )

  console.log(
    `Total candidates: ${entries.length}`
  )

  console.log(
    `Player usable: ${usableEntries.length}`
  )

  console.log(
    `Unavailable: ${unavailableEntries.length}`
  )

  console.log(
    `Explicit: ${explicitEntries.length}`
  )

  console.log(
    `Inferred: ${inferredEntries.length}`
  )

  console.log(
    `Unknown: ${unknownEntries.length}`
  )

  // ------------------------------------------------
  // Dataset structure
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'DATASET VALIDATION'
  )
  console.log(
    '================================'
  )

  expectEqual(
    'Availability version is 1',
    availability.version,
    1
  )

  expectEqual(
    'Default player usability is fail-closed',
    availability.defaultPlayerUsable,
    false
  )

  expectEqual(
    'Generated dataset contains 1413 availability identities',
    entries.length,
    1413
  )

  expectEqual(
    'Player-usable candidate count',
    usableEntries.length,
    1284
  )

  expectEqual(
    'Unavailable candidate count',
    unavailableEntries.length,
    129
  )

  expectEqual(
    'Explicit decision count',
    explicitEntries.length,
    1096
  )

  expectEqual(
    'Inferred decision count',
    inferredEntries.length,
    317
  )

  expectEqual(
    'Unknown decision count',
    unknownEntries.length,
    0
  )

  expectEqual(
    'Usable + unavailable equals total',
    usableEntries.length +
      unavailableEntries.length,
    entries.length
  )

  expectEqual(
    'Confidence categories equal total',
    explicitEntries.length +
      inferredEntries.length +
      unknownEntries.length,
    entries.length
  )

  // ------------------------------------------------
  // Known released Pokémon
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'KNOWN RELEASED POKÉMON'
  )
  console.log(
    '================================'
  )

  const knownUsableIds = [
    'RAYQUAZA',
    'BAXCALIBUR',
    'MEWTWO__MEWTWO_A',

    'GIRATINA__GIRATINA_ORIGIN',

    'DARMANITAN__DARMANITAN_GALARIAN_STANDARD',

    'NECROZMA',
    'NECROZMA__NECROZMA_DAWN_WINGS',
    'NECROZMA__NECROZMA_DUSK_MANE',

    'ETERNATUS',

    'KELDEO',
    'KELDEO__KELDEO_ORDINARY',
    'KELDEO__KELDEO_RESOLUTE',

    'LYCANROC',
    'LYCANROC__LYCANROC_MIDDAY',
    'LYCANROC__LYCANROC_DUSK',
    'LYCANROC__LYCANROC_MIDNIGHT',

    'TOXTRICITY',
    'TOXTRICITY__TOXTRICITY_AMPED',
    'TOXTRICITY__TOXTRICITY_LOW_KEY',

    'PIKACHU__PIKACHU_JEJU',
    'PIKACHU__PIKACHU_DOCTOR',
    'PIKACHU__PIKACHU_FLYING_01',
    'PIKACHU__PIKACHU_HORIZONS',
    'PIKACHU__PIKACHU_POP_STAR',
    'PIKACHU__PIKACHU_ROCK_STAR',
  ]

  for (
    const id
    of knownUsableIds
  ) {
    expectUsable(
      availability,
      id
    )
  }

  // ------------------------------------------------
  // Known unavailable Pokémon
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'KNOWN UNAVAILABLE POKÉMON'
  )
  console.log(
    '================================'
  )

  const knownUnavailableIds = [
    'DARMANITAN__DARMANITAN_GALARIAN_ZEN',

    'NECROZMA__NECROZMA_ULTRA',

    'ETERNATUS__ETERNATUS_ETERNAMAX',

    'CALYREX__CALYREX_SHADOW_RIDER',

    'ARCEUS',

    'SILVALLY',

    'PIKACHU__PIKACHU_COSTUME_2020',

    'PIKACHU__PIKACHU_VS_2019',
  ]

  for (
    const id
    of knownUnavailableIds
  ) {
    expectUnavailable(
      availability,
      id
    )
  }

  // ------------------------------------------------
  // Important form distinctions
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'FORM DISTINCTION REGRESSIONS'
  )
  console.log(
    '================================'
  )

  // ------------------------------------------------
  // Necrozma
  // ------------------------------------------------

  const necrozma =
    getEntry(
      availability,
      'NECROZMA'
    )

  const dawnWings =
    getEntry(
      availability,
      'NECROZMA__NECROZMA_DAWN_WINGS'
    )

  const duskMane =
    getEntry(
      availability,
      'NECROZMA__NECROZMA_DUSK_MANE'
    )

  const ultraNecrozma =
    getEntry(
      availability,
      'NECROZMA__NECROZMA_ULTRA'
    )

  expectTrue(
    'Base Necrozma remains usable',
    necrozma?.playerUsable ===
      true
  )

  expectTrue(
    'Dawn Wings remains usable',
    dawnWings?.playerUsable ===
      true
  )

  expectTrue(
    'Dusk Mane remains usable',
    duskMane?.playerUsable ===
      true
  )

  expectTrue(
    'Ultra Necrozma remains unavailable',
    ultraNecrozma?.playerUsable ===
      false
  )

  // ------------------------------------------------
  // Galarian Darmanitan
  // ------------------------------------------------

  const standardGalarianDarmanitan =
    getEntry(
      availability,
      'DARMANITAN__DARMANITAN_GALARIAN_STANDARD'
    )

  const zenGalarianDarmanitan =
    getEntry(
      availability,
      'DARMANITAN__DARMANITAN_GALARIAN_ZEN'
    )

  expectTrue(
    'Galarian Darmanitan Standard remains usable',
    standardGalarianDarmanitan
      ?.playerUsable ===
      true
  )

  expectTrue(
    'Galarian Darmanitan Zen remains unavailable',
    zenGalarianDarmanitan
      ?.playerUsable ===
      false
  )

  // ------------------------------------------------
  // Keldeo
  // ------------------------------------------------

  const baseKeldeo =
    getEntry(
      availability,
      'KELDEO'
    )

  const ordinaryKeldeo =
    getEntry(
      availability,
      'KELDEO__KELDEO_ORDINARY'
    )

  const resoluteKeldeo =
    getEntry(
      availability,
      'KELDEO__KELDEO_RESOLUTE'
    )

  expectTrue(
    'Base Keldeo availability identity exists',
    Boolean(
      baseKeldeo
    )
  )

  expectTrue(
    'Keldeo Ordinary collectible identity exists',
    Boolean(
      ordinaryKeldeo
    )
  )

  expectTrue(
    'Keldeo Resolute collectible identity exists',
    Boolean(
      resoluteKeldeo
    )
  )

  expectTrue(
    'Base Keldeo remains usable',
    baseKeldeo
      ?.playerUsable ===
      true
  )

  expectTrue(
    'Keldeo Ordinary is player usable',
    ordinaryKeldeo
      ?.playerUsable ===
      true
  )

  expectTrue(
    'Keldeo Resolute is player usable',
    resoluteKeldeo
      ?.playerUsable ===
      true
  )

  expectTrue(
    'Keldeo Ordinary is recognized as a form identity',
    ordinaryKeldeo
      ?.reason ===
      'RELEASED_SPECIES_WITH_EXTERNAL_FORM' &&
    ordinaryKeldeo
      ?.confidence ===
      'INFERRED'
  )

  expectTrue(
    'Keldeo Resolute is recognized as a form identity',
    resoluteKeldeo
      ?.reason ===
      'RELEASED_SPECIES_WITH_EXTERNAL_FORM' &&
    resoluteKeldeo
      ?.confidence ===
      'INFERRED'
  )

  // ------------------------------------------------
  // Lycanroc
  // ------------------------------------------------

  const baseLycanroc =
    getEntry(
      availability,
      'LYCANROC'
    )

  const middayLycanroc =
    getEntry(
      availability,
      'LYCANROC__LYCANROC_MIDDAY'
    )

  const duskLycanroc =
    getEntry(
      availability,
      'LYCANROC__LYCANROC_DUSK'
    )

  const midnightLycanroc =
    getEntry(
      availability,
      'LYCANROC__LYCANROC_MIDNIGHT'
    )

  expectTrue(
    'Base Lycanroc remains usable',
    baseLycanroc
      ?.playerUsable ===
      true
  )

  expectTrue(
    'Lycanroc Midday is usable',
    middayLycanroc
      ?.playerUsable ===
      true
  )

  expectTrue(
    'Lycanroc Dusk is usable',
    duskLycanroc
      ?.playerUsable ===
      true
  )

  expectTrue(
    'Lycanroc Midnight is usable',
    midnightLycanroc
      ?.playerUsable ===
      true
  )

  // ------------------------------------------------
  // Toxtricity
  // ------------------------------------------------

  const baseToxtricity =
    getEntry(
      availability,
      'TOXTRICITY'
    )

  const ampedToxtricity =
    getEntry(
      availability,
      'TOXTRICITY__TOXTRICITY_AMPED'
    )

  const lowKeyToxtricity =
    getEntry(
      availability,
      'TOXTRICITY__TOXTRICITY_LOW_KEY'
    )

  expectTrue(
    'Base Toxtricity remains usable',
    baseToxtricity
      ?.playerUsable ===
      true
  )

  expectTrue(
    'Toxtricity Amped is usable',
    ampedToxtricity
      ?.playerUsable ===
      true
  )

  expectTrue(
    'Toxtricity Low Key is usable',
    lowKeyToxtricity
      ?.playerUsable ===
      true
  )

  // ------------------------------------------------
  // Resolved edge cases
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'RESOLVED EDGE CASES'
  )
  console.log(
    '================================'
  )

  const resolvedUsableIds = [
    'LYCANROC',

    'LYCANROC__LYCANROC_MIDDAY',

    'LYCANROC__LYCANROC_DUSK',

    'LYCANROC__LYCANROC_MIDNIGHT',

    'TOXTRICITY',

    'TOXTRICITY__TOXTRICITY_AMPED',

    'TOXTRICITY__TOXTRICITY_LOW_KEY',

    'PIKACHU__PIKACHU_JEJU',

    'PIKACHU__PIKACHU_DOCTOR',

    'PIKACHU__PIKACHU_FLYING_01',

    'PIKACHU__PIKACHU_HORIZONS',

    'PIKACHU__PIKACHU_POP_STAR',

    'PIKACHU__PIKACHU_ROCK_STAR',
  ]

  const resolvedUnavailableIds = [
    'PIKACHU__PIKACHU_COSTUME_2020',

    'PIKACHU__PIKACHU_VS_2019',
  ]

  for (
    const id
    of resolvedUsableIds
  ) {
    const entry =
      getEntry(
        availability,
        id
      )

    expectTrue(
      `${id} is explicitly resolved as usable`,
      entry?.released ===
        true &&
      entry?.playerUsable ===
        true &&
      entry?.confidence ===
        'EXPLICIT'
    )
  }

  for (
    const id
    of resolvedUnavailableIds
  ) {
    const entry =
      getEntry(
        availability,
        id
      )

    expectTrue(
      `${id} is explicitly resolved as unavailable`,
      entry?.released ===
        false &&
      entry?.playerUsable ===
        false &&
      entry?.confidence ===
        'EXPLICIT'
    )
  }

  // ------------------------------------------------
  // No unresolved decisions
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'UNKNOWN DECISIONS'
  )
  console.log(
    '================================'
  )

  expectEqual(
    'No availability records remain unresolved',
    unknownEntries.length,
    0
  )

  const nonExplicitOrInferred =
    entries.filter(
      ([, entry]) =>
        entry.confidence !==
          'EXPLICIT' &&
        entry.confidence !==
          'INFERRED'
    )

  expectEqual(
    'Every candidate has a resolved confidence category',
    nonExplicitOrInferred.length,
    0
  )

  // ------------------------------------------------
  // Generation metadata
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'GENERATION METADATA'
  )
  console.log(
    '================================'
  )

  expectEqual(
    'Raw reference record count',
    availability
      .generation
      ?.rawReferenceRecords,
    1505
  )

  expectEqual(
    'Generated raid candidate count remains combat-deduplicated',
    availability
      .generation
      ?.raidCandidates,
    1189
  )

  expectEqual(
    'Rejected reference record count',
    availability
      .generation
      ?.rejectedRecords,
    1
  )

  expectEqual(
    'Collapsed combat-equivalent count',
    availability
      .generation
      ?.collapsedCombatEquivalentRecords,
    315
  )

  expectEqual(
    'Unreleased species catalogue count',
    availability
      .generation
      ?.unreleasedSpeciesCodes,
    69
  )

  expectEqual(
    'Unreleased form catalogue count',
    availability
      .generation
      ?.unreleasedFormEntries,
    12
  )

  // ------------------------------------------------
  // Architecture regression
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'AVAILABILITY IDENTITY REGRESSION'
  )
  console.log(
    '================================'
  )

  expectTrue(
    'Availability universe is larger than combat-deduplicated raid universe',
    entries.length >
      (
        availability
          .generation
          ?.raidCandidates ??
        0
      )
  )

  expectEqual(
    'Availability identity count is 1413',
    entries.length,
    1413
  )

  expectEqual(
    'Raid combat identity count remains 1189',
    availability
      .generation
      ?.raidCandidates,
    1189
  )

  expectTrue(
    'Ordinary Keldeo survives combat identity collapse',
    Boolean(
      overrides[
        'KELDEO__KELDEO_ORDINARY'
      ]
    )
  )

  expectTrue(
    'Resolute Keldeo survives combat identity collapse',
    Boolean(
      overrides[
        'KELDEO__KELDEO_RESOLUTE'
      ]
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

  if (failed === 0) {
    console.log(
      `🎉 ${passed}/${passed} tests passed.`
    )

    console.log(
      'Generated Pokémon Availability V1 validation successful.'
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
      'Generated availability validation failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)