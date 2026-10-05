import fs from 'node:fs/promises'
import path from 'node:path'
import {
  fileURLToPath,
} from 'node:url'

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

function inspectKeys(
  value,
  prefix = ''
) {
  if (
    !value ||
    typeof value !==
      'object' ||
    Array.isArray(
      value
    )
  ) {
    return []
  }

  const results = []

  for (
    const [
      key,
      child,
    ]
    of Object.entries(
      value
    )
  ) {
    const path =
      prefix
        ? `${prefix}.${key}`
        : key

    if (
      /shadow|purif/i.test(
        key
      )
    ) {
      results.push({
        path,
        value:
          child,
      })
    }

    if (
      child &&
      typeof child ===
        'object' &&
      !Array.isArray(
        child
      )
    ) {
      results.push(
        ...inspectKeys(
          child,
          path
        )
      )
    }
  }

  return results
}

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  console.log(
    'Inspecting Shadow-related reference data...'
  )

  const pokemon =
    await readJson(
      'pokemon.json'
    )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'REFERENCE SUMMARY'
  )
  console.log(
    '================================'
  )

  console.log(
    `Pokémon records: ${pokemon.length}`
  )

  const recordsWithShadowData =
    []

  for (
    const entry
    of pokemon
  ) {
    const matches =
      inspectKeys(
        entry
      )

    if (
      matches.length ===
      0
    ) {
      continue
    }

    recordsWithShadowData.push({
      entry,
      matches,
    })
  }

  console.log(
    `Records containing Shadow/Purified-related fields: ${recordsWithShadowData.length}`
  )

  // ------------------------------------------------
  // Known Pokémon
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'KNOWN SPECIES'
  )
  console.log(
    '================================'
  )

  const knownIds = [
    'MAMOSWINE',
    'SWINUB',
    'PILOSWINE',
    'MEWTWO',
    'TYRANITAR',
    'SALAMENCE',
    'GARDEVOIR',
    'GARCHOMP',
    'RAIKOU',
    'ENTEI',
    'MOLTRES',
  ]

  for (
    const id
    of knownIds
  ) {
    const matches =
      pokemon.filter(
        (entry) =>
          entry.id ===
          id
      )

    console.log('')
    console.log(
      '--------------------------------'
    )
    console.log(
      id
    )
    console.log(
      '--------------------------------'
    )

    if (
      matches.length ===
      0
    ) {
      console.log(
        'No reference records.'
      )

      continue
    }

    for (
      const entry
      of matches
    ) {
      console.log('')
      console.log(
        `${entry.id} [${entry.form}]`
      )

      const shadowFields =
        inspectKeys(
          entry
        )

      if (
        shadowFields.length ===
        0
      ) {
        console.log(
          '  No Shadow/Purified fields.'
        )

        continue
      }

      for (
        const field
        of shadowFields
      ) {
        console.log(
          `  ${field.path}:`
        )

        console.dir(
          field.value,
          {
            depth:
              null,
          }
        )
      }
    }
  }

  // ------------------------------------------------
  // All matched fields
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'ALL SHADOW/PURIFIED FIELD PATHS'
  )
  console.log(
    '================================'
  )

  const pathCounts =
    new Map()

  for (
    const {
      matches,
    }
    of recordsWithShadowData
  ) {
    for (
      const match
      of matches
    ) {
      pathCounts.set(
        match.path,
        (
          pathCounts.get(
            match.path
          ) ??
          0
        ) +
          1
      )
    }
  }

  const sortedPaths =
    [
      ...pathCounts.entries(),
    ].sort(
      (a, b) =>
        b[1] -
        a[1]
    )

  if (
    sortedPaths.length ===
    0
  ) {
    console.log(
      'None found.'
    )
  } else {
    for (
      const [
        fieldPath,
        count,
      ]
      of sortedPaths
    ) {
      console.log(
        `${fieldPath}: ${count}`
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
      'Shadow reference inspection failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)