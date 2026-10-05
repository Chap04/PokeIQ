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

function printSearchResult(
  wikitext,
  term
) {
  const upper =
    wikitext.toUpperCase()

  const search =
    term.toUpperCase()

  const index =
    upper.indexOf(
      search
    )

  console.log('')
  console.log(
    `--- ${term} ---`
  )

  if (index === -1) {
    console.log(
      'Not found'
    )

    return
  }

  const start =
    Math.max(
      0,
      index - 250
    )

  const end =
    Math.min(
      wikitext.length,
      index + term.length + 500
    )

  console.log(
    wikitext
      .slice(
        start,
        end
      )
      .replace(
        /\n{3,}/g,
        '\n\n'
      )
  )
}

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  console.log(
    'Inspecting Pokémon GO release-status source...'
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
    `Downloaded ${wikitext.length} characters of release data.`
  )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'TARGETED RELEASE CHECKS'
  )
  console.log(
    '================================'
  )

  const targets = [
    'Rayquaza',
    'Mega Rayquaza',
    'Baxcalibur',
    'Armored Mewtwo',
    'Calyrex',
    'Shadow Rider',
    'Necrozma',
    'Dawn Wings',
    'Dusk Mane',
    'Ultra Necrozma',
    'Eternatus',
    'Eternamax',
    'Arceus',
    'Silvally',
  ]

  for (
    const target
    of targets
  ) {
    printSearchResult(
      wikitext,
      target
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
      'Release-source inspection failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)