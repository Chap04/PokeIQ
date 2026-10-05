const SHADOW_SOURCE_URL =
  'https://bulbapedia.bulbagarden.net/w/api.php' +
  '?action=parse' +
  '&page=List_of_Shadow_Pok%C3%A9mon_in_Pok%C3%A9mon_GO' +
  '&prop=wikitext' +
  '&format=json' +
  '&origin=*'

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function escapeRegex(
  value
) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  )
}

function getSection(
  wikitext,
  heading
) {
  const headingPattern =
    new RegExp(
      `^==${escapeRegex(heading)}==\\s*$`,
      'mi'
    )

  const match =
    headingPattern.exec(
      wikitext
    )

  if (!match) {
    return null
  }

  const start =
    match.index +
    match[0].length

  const remaining =
    wikitext.slice(
      start
    )

  const nextHeading =
    remaining.search(
      /^==[^=\n].*?==\s*$/m
    )

  if (
    nextHeading === -1
  ) {
    return remaining
  }

  return remaining.slice(
    0,
    nextHeading
  )
}

function printSection({
  title,
  section,
  maxLength = 25000,
}) {
  console.log('')
  console.log(
    '================================'
  )
  console.log(
    title
  )
  console.log(
    '================================'
  )

  if (!section) {
    console.log(
      'Section not found.'
    )

    return
  }

  if (
    section.length <=
    maxLength
  ) {
    console.log(
      section
    )

    return
  }

  console.log(
    section.slice(
      0,
      maxLength
    )
  )

  console.log('')
  console.log(
    `...truncated ${section.length - maxLength} characters`
  )
}

function printMatches({
  wikitext,
  label,
  pattern,
  context = 350,
  maxMatches = 20,
}) {
  console.log('')
  console.log(
    '================================'
  )
  console.log(
    label
  )
  console.log(
    '================================'
  )

  const regex =
    new RegExp(
      pattern,
      'gi'
    )

  let match
  let count = 0

  while (
    (
      match =
        regex.exec(
          wikitext
        )
    ) !== null
  ) {
    count += 1

    if (
      count >
      maxMatches
    ) {
      break
    }

    const start =
      Math.max(
        0,
        match.index -
          context
      )

    const end =
      Math.min(
        wikitext.length,
        match.index +
          match[0].length +
          context
      )

    console.log('')
    console.log(
      `--- Match ${count} ---`
    )

    console.log(
      wikitext.slice(
        start,
        end
      )
    )
  }

  if (
    count === 0
  ) {
    console.log(
      'No matches found.'
    )

    return
  }

  console.log('')
  console.log(
    `Matches shown: ${Math.min(count, maxMatches)}`
  )

  if (
    count >
    maxMatches
  ) {
    console.log(
      `Additional matches not shown: ${count - maxMatches}`
    )
  }
}

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  console.log(
    'Inspecting Shadow Pokémon availability source...'
  )

  console.log('')
  console.log(
    'Downloading Bulbapedia Shadow catalogue...'
  )

  const response =
    await fetch(
      SHADOW_SOURCE_URL,
      {
        headers: {
          'User-Agent':
            'PokeIQ-development/1.0',
        },
      }
    )

  if (!response.ok) {
    throw new Error(
      `Bulbapedia request failed: ${response.status}`
    )
  }

  const result =
    await response.json()

  const wikitext =
    result
      ?.parse
      ?.wikitext
      ?.['*']

  if (
    typeof wikitext !==
    'string'
  ) {
    throw new Error(
      'Bulbapedia Shadow wikitext not found.'
    )
  }

  console.log(
    `Downloaded ${wikitext.length} characters.`
  )

  // ------------------------------------------------
  // Main sections
  // ------------------------------------------------

  const shadowList =
    getSection(
      wikitext,
      'List of Shadow Pokémon'
    )

  const unobtainable =
    getSection(
      wikitext,
      'Unobtainable Shadow Pokémon'
    )

  printSection({
    title:
      'LIST OF SHADOW POKÉMON',

    section:
      shadowList,
  })

  printSection({
    title:
      'UNOBTAINABLE SHADOW POKÉMON',

    section:
      unobtainable,
  })

  // ------------------------------------------------
  // Known important attackers
  // ------------------------------------------------

  printMatches({
    wikitext,

    label:
      'MAMOSWINE',

    pattern:
      'Mamoswine',
  })

  printMatches({
    wikitext,

    label:
      'MEWTWO',

    pattern:
      'Mewtwo',
  })

  printMatches({
    wikitext,

    label:
      'SALAMENCE',

    pattern:
      'Salamence',
  })

  printMatches({
    wikitext,

    label:
      'TYRANITAR',

    pattern:
      'Tyranitar',
  })

  printMatches({
    wikitext,

    label:
      'GARDEVOIR',

    pattern:
      'Gardevoir',
  })

  printMatches({
    wikitext,

    label:
      'GARCHOMP',

    pattern:
      'Garchomp',
  })

  // ------------------------------------------------
  // Special cases
  // ------------------------------------------------

  printMatches({
    wikitext,

    label:
      'APEX SHADOW',

    pattern:
      'Apex',
  })

  printMatches({
    wikitext,

    label:
      'REGIONAL FORMS',

    pattern:
      'Alolan|Galarian|Hisuian|Paldean',
  })

  printMatches({
    wikitext,

    label:
      'COSTUME / EVENT SHADOWS',

    pattern:
      'costume|hat|cowboy|event',
  })

  printMatches({
    wikitext,

    label:
      'UNOBTAINABLE LANGUAGE',

    pattern:
      'unobtainable|unavailable|could not be obtained|cannot be obtained',
  })

  // ------------------------------------------------
  // Template survey
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'COMMON TEMPLATE NAMES'
  )
  console.log(
    '================================'
  )

  const templateCounts =
    new Map()

  const templateRegex =
    /\{\{([^|{}\n]+)(?:\||\}\})/g

  let match

  while (
    (
      match =
        templateRegex.exec(
          wikitext
        )
    ) !== null
  ) {
    const name =
      match[1].trim()

    templateCounts.set(
      name,
      (
        templateCounts.get(
          name
        ) ??
        0
      ) +
        1
    )
  }

  const sortedTemplates =
    [
      ...templateCounts.entries(),
    ]
      .sort(
        (a, b) =>
          b[1] -
          a[1]
      )
      .slice(
        0,
        50
      )

  for (
    const [
      name,
      count,
    ]
    of sortedTemplates
  ) {
    console.log(
      `${name}: ${count}`
    )
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
      'Shadow availability inspection failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)