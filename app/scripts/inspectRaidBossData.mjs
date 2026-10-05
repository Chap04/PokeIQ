const GAME_MASTER_URL =
  'https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json'

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function unwrapTemplate(
  template
) {
  return (
    template?.data ??
    template
  )
}

function getTemplateId(
  template
) {
  const data =
    unwrapTemplate(
      template
    )

  return (
    data?.templateId ??
    template?.templateId ??
    null
  )
}

function containsAnyTerm(
  value,
  terms
) {
  let text

  try {
    text =
      JSON.stringify(
        value
      ).toUpperCase()
  } catch {
    return false
  }

  return terms.some(
    (term) =>
      text.includes(
        term
      )
  )
}

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  console.log(
    'Inspecting Pokémon GO Game Master for raid configuration...'
  )

  console.log('')
  console.log(
    'Downloading Game Master...'
  )

  const response =
    await fetch(
      GAME_MASTER_URL
    )

  if (!response.ok) {
    throw new Error(
      `Game Master download failed: ${response.status}`
    )
  }

  const raw =
    await response.json()

  const templates =
    Array.isArray(raw)
      ? raw
      : raw.itemTemplates ??
        raw.templates ??
        raw.template ??
        raw.item_templates ??
        []

  console.log(
    `Loaded ${templates.length} templates.`
  )

  // ------------------------------------------------
  // Search likely template IDs
  // ------------------------------------------------

  const ID_TERMS = [
    'RAID',
    'BOSS',
    'FORT',
  ]

  const idMatches =
    templates
      .map(
        (template) => ({
          template,
          templateId:
            getTemplateId(
              template
            ),
        })
      )
      .filter(
        ({ templateId }) => {
          if (!templateId) {
            return false
          }

          const id =
            templateId
              .toUpperCase()

          return ID_TERMS.some(
            (term) =>
              id.includes(
                term
              )
          )
        }
      )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'RAID-RELATED TEMPLATE IDS'
  )
  console.log(
    '================================'
  )

  console.log(
    `Found ${idMatches.length} template(s).`
  )

  for (
    const match
    of idMatches
  ) {
    console.log(
      match.templateId
    )
  }

  // ------------------------------------------------
  // Search actual contents
  // ------------------------------------------------

  const CONTENT_TERMS = [
    'RAID_LEVEL',
    'RAID_TIER',
    'RAID_SETTINGS',
    'BOSS_HP',
    'BOSS_STAMINA',
    'RAID_BOSS',
    'BATTLE_DURATION',
    'RAID_DURATION',
    'BOSS_CP',
    'RAID_CP',
  ]

  const contentMatches =
    templates.filter(
      (template) =>
        containsAnyTerm(
          unwrapTemplate(
            template
          ),
          CONTENT_TERMS
        )
    )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'RAID CONFIGURATION CONTENT MATCHES'
  )
  console.log(
    '================================'
  )

  console.log(
    `Found ${contentMatches.length} matching template(s).`
  )

  for (
    const template
    of contentMatches
  ) {
    const data =
      unwrapTemplate(
        template
      )

    console.log('')
    console.log(
      '--------------------------------'
    )

    console.log(
      getTemplateId(
        template
      ) ??
      '(no template ID)'
    )

    console.log(
      '--------------------------------'
    )

    console.log(
      'Keys:',
      data &&
      typeof data === 'object'
        ? Object.keys(data)
        : []
    )

    console.dir(
      data,
      {
        depth: null,
        maxArrayLength: 100,
      }
    )
  }

  // ------------------------------------------------
  // Search suspicious field names recursively
  // ------------------------------------------------

  const KEY_TERMS = [
    'raid',
    'boss',
    'stamina',
    'battleDuration',
    'cpMultiplier',
  ]

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'SUSPICIOUS RAID FIELD MATCHES'
  )
  console.log(
    '================================'
  )

  let suspiciousCount = 0

  for (
    const template
    of templates
  ) {
    const data =
      unwrapTemplate(
        template
      )

    if (
      !data ||
      typeof data !==
        'object'
    ) {
      continue
    }

    const matchingKeys = []

    function walk(
      value,
      path = []
    ) {
      if (
        !value ||
        typeof value !==
          'object'
      ) {
        return
      }

      for (
        const [
          key,
          child,
        ]
        of Object.entries(
          value
        )
      ) {
        const lowerKey =
          key.toLowerCase()

        const currentPath =
          [
            ...path,
            key,
          ]

        if (
          KEY_TERMS.some(
            (term) =>
              lowerKey.includes(
                term.toLowerCase()
              )
          )
        ) {
          matchingKeys.push({
            path:
              currentPath.join(
                '.'
              ),

            value:
              child,
          })
        }

        if (
          child &&
          typeof child ===
            'object'
        ) {
          walk(
            child,
            currentPath
          )
        }
      }
    }

    walk(
      data
    )

    if (
      matchingKeys.length ===
      0
    ) {
      continue
    }

    suspiciousCount += 1

    console.log('')
    console.log(
      '--------------------------------'
    )

    console.log(
      getTemplateId(
        template
      ) ??
      '(no template ID)'
    )

    console.log(
      '--------------------------------'
    )

    for (
      const match
      of matchingKeys
    ) {
      console.log(
        `${match.path}:`
      )

      console.dir(
        match.value,
        {
          depth: 4,
          maxArrayLength: 50,
        }
      )
    }
  }

  console.log('')
  console.log(
    `Templates with suspicious raid-related fields: ${suspiciousCount}`
  )
}

main().catch(
  (error) => {
    console.error('')
    console.error(
      'Raid data inspection failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)