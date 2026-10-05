import {
  getCollectionPokemonReferences,
  getPokemonDisplayName,
  getPokemonIdentity,
} from '../utils/pokemonReference'
import PokemonArtwork from './PokemonArtwork'

function PokemonPicker({
  searchTerm,
  onSearchTermChange,
  selectedPokemon,
  onSelectPokemon,
}) {
  const pokemonReferences =
    getCollectionPokemonReferences()

  const normalizedSearch =
    searchTerm
      .trim()
      .toLowerCase()

  const filteredPokemon =
    pokemonReferences
      .filter((pokemon) => {
        const displayName =
          getPokemonDisplayName(
            pokemon
          )

        const identity =
          getPokemonIdentity(
            pokemon
          )

        const nameMatches =
          displayName
            .toLowerCase()
            .includes(
              normalizedSearch
            )

        const idMatches =
          pokemon.id
            .toLowerCase()
            .includes(
              normalizedSearch
            )

        const identityMatches =
          identity
            ?.toLowerCase()
            .includes(
              normalizedSearch
            )

        return (
          nameMatches ||
          idMatches ||
          identityMatches
        )
      })
      .sort((a, b) => {
        if (
          a.id !==
          b.id
        ) {
          return (
            getPokemonDisplayName(
              a
            ).localeCompare(
              getPokemonDisplayName(
                b
              )
            )
          )
        }

        const aIsNormal =
          !a.form ||
          a.form ===
            'NORMAL'

        const bIsNormal =
          !b.form ||
          b.form ===
            'NORMAL'

        if (
          aIsNormal &&
          !bIsNormal
        ) {
          return -1
        }

        if (
          !aIsNormal &&
          bIsNormal
        ) {
          return 1
        }

        return (
          getPokemonDisplayName(
            a
          ).localeCompare(
            getPokemonDisplayName(
              b
            )
          )
        )
      })

  function selectPokemon(
    pokemon
  ) {
    onSelectPokemon({
      ...pokemon,

      name:
        getPokemonDisplayName(
          pokemon
        ),

      identity:
        getPokemonIdentity(
          pokemon
        ),
    })

    onSearchTermChange(
      getPokemonDisplayName(
        pokemon
      )
    )
  }

  function handleSearchChange(
    event
  ) {
    onSearchTermChange(
      event.target.value
    )

    onSelectPokemon(
      null
    )
  }

  return (
    <div className="pokemon-picker">
      <label htmlFor="pokemon-search">
        Pokémon
      </label>

      <input
        id="pokemon-search"
        type="text"
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder="Search by name or form"
        autoComplete="off"
      />

      {searchTerm &&
        !selectedPokemon && (
          <div className="pokemon-picker-results">
            {filteredPokemon.length >
            0 ? (
              filteredPokemon.map(
                (pokemon) => {
                  const displayName =
                    getPokemonDisplayName(
                      pokemon
                    )

                  const identity =
                    getPokemonIdentity(
                      pokemon
                    )

                  return (
                    <button
                      key={
                        identity
                      }
                      type="button"
                      className="pokemon-picker-option"
                      onClick={() =>
                        selectPokemon(
                          pokemon
                        )
                      }
                    >
                      <PokemonArtwork
                        pokemon={{
                          id:
                            pokemon.id,

                          form:
                            pokemon.form,

                          name:
                            displayName,

                          shiny:
                            false,
                        }}
                      />

                      <div className="pokemon-picker-option-info">
                        <strong>
                          {
                            displayName
                          }
                        </strong>
                      </div>
                    </button>
                  )
                }
              )
            ) : (
              <p className="pokemon-picker-empty">
                No Pokémon
                found.
              </p>
            )}
          </div>
        )}
    </div>
  )
}

export default PokemonPicker