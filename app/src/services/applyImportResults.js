export function applyImportResults(
  currentCollection,
  reviewItems
) {
  let updatedCollection = [...currentCollection]

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