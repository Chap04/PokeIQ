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

function getHeadingLevel(
  line
) {
  const match =
    line.match(
      /^(=+)\s*(.*?)\s*\1\s*$/
    )

  if (!match) {
    return null
  }

  return {
    level:
      match[1].length,

    title:
      match[2].trim(),
  }
}

function countPokemonTemplates(
  text
) {
  const matches =
    text.match(
      /\{\{MSP(?:\/GO)?\|/g
    )

  return (
    matches?.length ??
    0
  )
}

function countGoPokemonTemplates(
  text
) {
  const matches =
    text.match(
      /\{\{MSP\/GO\|/g
    )

  return (
    matches?.length ??
    0
  )
}

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  console.log(
    'Inspecting Bulbapedia Pokémon GO availability sections...'
  )

  console.log('')
  console.log(
    'Downloading release data...'
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
      `Release source request failed: ${response.status}`
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
      'No wikitext returned by release source.'
    )
  }

  console.log(
    `Downloaded ${wikitext.length} characters.`
  )

  // ------------------------------------------------
  // Split into sections
  // ------------------------------------------------

  const lines =
    wikitext.split('\n')

  const sections = []

  let currentSection = {
    title:
      'PAGE ROOT',

    level:
      0,

    lines: [],
  }

  sections.push(
    currentSection
  )

  for (
    const line
    of lines
  ) {
    const heading =
      getHeadingLevel(
        line
      )

    if (heading) {
      currentSection = {
        title:
          heading.title,

        level:
          heading.level,

        lines: [],
      }

      sections.push(
        currentSection
      )

      continue
    }

    currentSection
      .lines
      .push(line)
  }

  // ------------------------------------------------
  // Output
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'SECTION SUMMARY'
  )
  console.log(
    '================================'
  )

  for (
    const section
    of sections
  ) {
    const text =
      section.lines.join('\n')

    const allPokemonCount =
      countPokemonTemplates(
        text
      )

    const goPokemonCount =
      countGoPokemonTemplates(
        text
      )

    if (
      allPokemonCount === 0 &&
      goPokemonCount === 0
    ) {
      continue
    }

    const indent =
      '  '.repeat(
        Math.max(
          0,
          section.level - 2
        )
      )

    console.log(
      `${indent}${section.title}`
    )

    console.log(
      `${indent}  Pokémon templates: ${allPokemonCount}`
    )

    console.log(
      `${indent}  GO templates: ${goPokemonCount}`
    )
  }

  // ------------------------------------------------
  // Search for unreleased wording
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'UNRELEASED LANGUAGE'
  )
  console.log(
    '================================'
  )

  const phrases = [
    'yet to be released',
    'not yet released',
    'unreleased',
    'have yet to be released',
  ]

  for (
    const phrase
    of phrases
  ) {
    const regex =
      new RegExp(
        `.{0,100}${phrase}.{0,180}`,
        'gi'
      )

    const matches =
      wikitext.match(
        regex
      ) ??
      []

    console.log('')
    console.log(
      `${phrase}: ${matches.length}`
    )

    for (
      const match
      of matches.slice(
        0,
        10
      )
    ) {
      console.log(
        `  ${match.replace(/\n/g, ' ')}`
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
      'Release-section inspection failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)