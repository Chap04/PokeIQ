const GAME_MASTER_URL =
  'https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json'

function unwrapTemplate(template) {
  return template?.data ?? template
}

function objectHasKey(value, targetKey) {
  if (!value || typeof value !== 'object') {
    return false
  }

  if (
    Object.prototype.hasOwnProperty.call(
      value,
      targetKey
    )
  ) {
    return true
  }

  for (const child of Object.values(value)) {
    if (
      child &&
      typeof child === 'object' &&
      objectHasKey(child, targetKey)
    ) {
      return true
    }
  }

  return false
}

function findKeys(value, targetKey, path = []) {
  const results = []

  if (!value || typeof value !== 'object') {
    return results
  }

  for (const [key, child] of Object.entries(value)) {
    const currentPath = [...path, key]

    if (
      key.toLowerCase() ===
      targetKey.toLowerCase()
    ) {
      results.push({
        path: currentPath.join('.'),
        value: child,
      })
    }

    if (
      child &&
      typeof child === 'object'
    ) {
      results.push(
        ...findKeys(
          child,
          targetKey,
          currentPath
        )
      )
    }
  }

  return results
}

async function main() {
  console.log(
    'Downloading Pokémon GO Game Master...'
  )

  const response =
    await fetch(GAME_MASTER_URL)

  if (!response.ok) {
    throw new Error(
      `Game Master request failed: ${response.status}`
    )
  }

  const raw =
    await response.json()

  const templates =
    Array.isArray(raw)
      ? raw
      : raw.itemTemplates ??
        raw.templates ??
        []

  console.log(
    `Loaded ${templates.length} templates.`
  )

  const KEY_SEARCHES = [
    'cpMultiplier',
    'cpMultipliers',
    'attackScalar',
    'attackScalars',
    'typeEffective',
    'typeEffectiveness',
  ]

  for (const keyName of KEY_SEARCHES) {
    console.log('')
    console.log(
      '================================'
    )
    console.log(
      `KEY SEARCH: ${keyName}`
    )
    console.log(
      '================================'
    )

    const matches = []

    for (const template of templates) {
      const data =
        unwrapTemplate(template)

      if (!objectHasKey(data, keyName)) {
        continue
      }

      const templateId =
        data?.templateId ??
        template?.templateId ??
        '(no template ID)'

      const fields =
        findKeys(
          data,
          keyName
        )

      matches.push({
        templateId,
        fields,
      })
    }

    console.log(
      `Templates containing key: ${matches.length}`
    )

    for (const match of matches) {
      console.log('')
      console.log(
        match.templateId
      )

      for (const field of match.fields) {
        console.log(
          `  ${field.path}:`
        )

        console.dir(
          field.value,
          {
            depth: null,
            maxArrayLength: null,
          }
        )
      }
    }
  }

  // Also inspect likely combat-related templates by ID.
  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'COMBAT-RELATED TEMPLATE IDS'
  )
  console.log(
    '================================'
  )

  const likelyCombatTemplates =
    templates
      .map((template) => {
        const data =
          unwrapTemplate(template)

        return {
          templateId:
            data?.templateId ??
            template?.templateId ??
            null,

          data,
        }
      })
      .filter(({ templateId }) => {
        if (!templateId) {
          return false
        }

        const id =
          templateId.toUpperCase()

        return (
          id.includes('COMBAT_SETTINGS') ||
          id.includes('PLAYER_LEVEL') ||
          id.includes('TYPE_EFFECT') ||
          id.includes('CP_MULTIPLIER')
        )
      })

  console.log(
    `Found ${likelyCombatTemplates.length} likely combat template(s).`
  )

  for (const match of likelyCombatTemplates) {
    console.log('')
    console.log(
      '--------------------------------'
    )
    console.log(
      match.templateId
    )
    console.log(
      '--------------------------------'
    )

    console.dir(
      match.data,
      {
        depth: null,
        maxArrayLength: null,
      }
    )
  }
}

main().catch((error) => {
  console.error('')
  console.error(
    'Game Master inspection failed:'
  )
  console.error(error)

  process.exitCode = 1
})