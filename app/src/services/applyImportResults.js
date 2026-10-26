export function applyImportResults(
  currentCollection,
  reviewItems,
  importMetadata = {}
) {
  let updatedCollection = [...currentCollection]

  const importCategory = importMetadata.importCategory ?? 'general'
  const traits = importMetadata.traits ?? []

  const importedMetadata = {
  importCategory:
    importCategory === 'general'
      ? null
      : importCategory,

  ...(traits.includes('Shadow')
  ? { shadow: true }
  : {}),

...(traits.includes('Shiny')
  ? { shiny: true }
  : {}),

...(traits.includes('Lucky')
  ? { lucky: true }
  : {}),
}

if (importCategory === '4star') {
  importedMetadata.ivs = {
    attack: 15,
    defense: 15,
    stamina: 15,
  }
}

  reviewItems.forEach((pokemon) => {
    switch (pokemon.decision) {
      case 'keep': {
        const {
          importId,
          match,
          decision,
          ...pokemonData
        } = pokemon

        updatedCollection.push({
  id: crypto.randomUUID(),

  ...pokemonData,

  ...importedMetadata,
})

        break
      }

      case 'replace': {
        if (!pokemon.match?.existingPokemon) {
          break
        }

        updatedCollection = updatedCollection.map(
          (existingPokemon) => {
            if (
              existingPokemon.id !==
              pokemon.match.existingPokemon.id
            ) {
              return existingPokemon
            }

            const {
              importId,
              match,
              decision,
              ...pokemonData
            } = pokemon

            return {
  ...existingPokemon,

  ...pokemonData,

  ...importedMetadata,

  id: existingPokemon.id,
}
          }
        )

        break
      }

      case 'skip':
      default:
        break
    }
  })

  return updatedCollection
}