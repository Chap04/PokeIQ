const RELEASE_SOURCE_URL =
  'https://bulbapedia.bulbagarden.net/w/api.php' +
  '?action=parse' +
  '&page=List_of_Pok%C3%A9mon_by_availability_in_Pok%C3%A9mon_GO' +
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
      `^===?${escapeRegex(heading)}===?\\s*$`,
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
      /^={2,3}[^=\n].*?={2,3}\s*$/m
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
}) {
  console.log('')
  console.log(
    '================================'
  )
  console.log(title)
  console.log(
    '================================'
  )

  if (!section) {
    console.log(
      'Section not found.'
    )

    return
  }

  console.log(
    section
  )
}

function printMatches({
  wikitext,
  label,
  pattern,
  context = 300,
}) {
  console.log('')
  console.log(
    '================================'
  )
  console.log(label)
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

    if (
      count >= 20
    ) {
      console.log('')
      console.log(
        '...stopping after 20 matches'
      )

      break
    }
  }

  if (
    count === 0
  ) {
    console.log(
      'No matches found.'
    )
  } else {
    console.log('')
    console.log(
      `Matches shown: ${Math.min(count, 20)}`
    )
  }
}

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  console.log(
    'Inspecting temporary-evolution release sections...'
  )

  console.log('')
  console.log(
    'Downloading Bulbapedia availability data...'
  )

  const response =
    await fetch(
      RELEASE_SOURCE_URL,
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
      'Bulbapedia wikitext not found.'
    )
  }

  console.log(
    `Downloaded ${wikitext.length} characters.`
  )

  // ------------------------------------------------
  // Known sections
  // ------------------------------------------------

  const megaSection =
    getSection(
      wikitext,
      'Mega Evolution and Primal Reversion'
    )

  const gigantamaxSection =
    getSection(
      wikitext,
      'Gigantamax'
    )

  const fusionSection =
    getSection(
      wikitext,
      'Fusions'
    )

  printSection({
    title:
      'MEGA EVOLUTION AND PRIMAL REVERSION',

    section:
      megaSection,
  })

  printSection({
    title:
      'FUSIONS',

    section:
      fusionSection,
  })

  printSection({
    title:
      'GIGANTAMAX',

    section:
      gigantamaxSection,
  })

  // ------------------------------------------------
  // Targeted searches
  // ------------------------------------------------

  printMatches({
    wikitext,

    label:
      'RAYQUAZA',

    pattern:
      'Rayquaza',
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
      'PRIMAL',

    pattern:
      'Primal|Primo|Proto',
  })

  printMatches({
    wikitext,

    label:
      'MEGA RELEASE LANGUAGE',

    pattern:
      'Mega Evolutions have yet to be released|Mega Evolution|Mega Evolved',
  })

  printMatches({
    wikitext,

    label:
      'UNRELEASED TEMPORARY LANGUAGE',

    pattern:
      'yet to be released|have yet to be released|unreleased',
  })

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
      'Temporary release-section inspection failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)