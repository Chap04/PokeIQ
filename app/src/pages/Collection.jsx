import {
  useState,
} from 'react'

import CollectionCard from '../components/CollectionCard'
import CollectionControls from '../components/CollectionControls'

function getIvPercentage(
  pokemon
) {
  const attack =
    pokemon.ivs
      ?.attack

  const defense =
    pokemon.ivs
      ?.defense

  const stamina =
    pokemon.ivs
      ?.stamina

  const hasCompleteIvs =
    attack !==
      null &&
    attack !==
      undefined &&
    defense !==
      null &&
    defense !==
      undefined &&
    stamina !==
      null &&
    stamina !==
      undefined

  if (
    !hasCompleteIvs
  ) {
    return -1
  }

  return Math.round(
    (
      (
        attack +
        defense +
        stamina
      ) /
      45
    ) *
    100
  )
}

function Collection({
  pokemonCollection,
  onAddPokemon,
  onEditPokemon,
  onDeletePokemon,
  onClearCollection,
}) {
  const [
    searchTerm,
    setSearchTerm,
  ] =
    useState(
      ''
    )

  const [
    sortBy,
    setSortBy,
  ] =
    useState(
      'recent'
    )

  const [
    activeFilter,
    setActiveFilter,
  ] =
    useState(
      'all'
    )

  const normalizedSearch =
    searchTerm
      .trim()
      .toLowerCase()

  const visiblePokemon =
    pokemonCollection
      .filter(
        (
          pokemon
        ) => {
          const matchesName =
            pokemon.name
              .toLowerCase()
              .includes(
                normalizedSearch
              )

          const matchesDexNumber =
            String(
              pokemon.pokemonId
            ).includes(
              normalizedSearch
            )

          return (
            matchesName ||
            matchesDexNumber
          )
        }
      )
      .filter(
        (
          pokemon
        ) => {
          if (
            activeFilter ===
            'all'
          ) {
            return true
          }

          return (
            pokemon[
              activeFilter
            ] === true
          )
        }
      )
      .sort(
        (
          pokemonA,
          pokemonB
        ) => {
          if (
            sortBy ===
            'cp-high'
          ) {
            return (
              pokemonB.cp -
              pokemonA.cp
            )
          }

          if (
            sortBy ===
            'cp-low'
          ) {
            return (
              pokemonA.cp -
              pokemonB.cp
            )
          }

          if (
            sortBy ===
            'iv-high'
          ) {
            return (
              getIvPercentage(
                pokemonB
              ) -
              getIvPercentage(
                pokemonA
              )
            )
          }

          if (
            sortBy ===
            'name'
          ) {
            return pokemonA
              .name
              .localeCompare(
                pokemonB
                  .name
              )
          }

          if (
            sortBy ===
            'dex'
          ) {
            return (
              pokemonA
                .pokemonId -
              pokemonB
                .pokemonId
            )
          }

          return 0
        }
      )

  if (
    sortBy ===
    'recent'
  ) {
    visiblePokemon.reverse()
  }

  const isFiltering =
    searchTerm.trim() !==
      '' ||
    activeFilter !==
      'all'

  function handleClearCollection() {
    if (
      pokemonCollection.length ===
      0
    ) {
      return
    }

    const confirmed =
      window.confirm(
        `Clear your entire collection?\n\nThis will permanently remove all ${pokemonCollection.length} Pokémon from PokeIQ. This cannot be undone.`
      )

    if (
      !confirmed
    ) {
      return
    }

    onClearCollection()
  }

  return (
    <main className="app">
      <header className="header collection-page-header">
        <div>
          <p className="eyebrow">
            PokeIQ
          </p>

          <h1>
            Pokémon Collection
          </h1>

          <p className="subtitle">
            Browse and manage the Pokémon currently on your account.
          </p>
        </div>

        <button
          className="primary-button collection-add-button"
          type="button"
          onClick={
            onAddPokemon
          }
        >
          + Add Pokémon
        </button>
      </header>

      <section className="section">
        <CollectionControls
          searchTerm={
            searchTerm
          }

          onSearchChange={
            setSearchTerm
          }

          sortBy={
            sortBy
          }

          onSortChange={
            setSortBy
          }

          activeFilter={
            activeFilter
          }

          onFilterChange={
            setActiveFilter
          }
        />
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <h2>
              Your Pokémon
            </h2>

            <p>
              {
                isFiltering
                  ? `${visiblePokemon.length} of ${pokemonCollection.length} Pokémon shown.`
                  : `${pokemonCollection.length} Pokémon recorded.`
              }
            </p>
          </div>

          {
            pokemonCollection.length >
              0 &&
            (
              <button
                className="danger-button"
                type="button"
                onClick={
                  handleClearCollection
                }
              >
                Clear Collection
              </button>
            )
          }
        </div>

        {
          pokemonCollection.length ===
          0
            ? (
              <div className="card empty-state">
                <h3>
                  Your collection is empty
                </h3>

                <p>
                  Add your first Pokémon manually or use one of the import methods.
                </p>

                <button
                  className="primary-button empty-state-button"
                  type="button"
                  onClick={
                    onAddPokemon
                  }
                >
                  Add your first Pokémon
                </button>
              </div>
            )
            : visiblePokemon.length ===
                0
              ? (
                <div className="card empty-state">
                  <h3>
                    No matching Pokémon
                  </h3>

                  <p>
                    Try changing your search or selected filter.
                  </p>
                </div>
              )
              : (
                <div className="grid">
                  {
                    visiblePokemon.map(
                      (
                        pokemon
                      ) => (
                        <CollectionCard
                          key={
                            pokemon.id
                          }

                          pokemon={
                            pokemon
                          }

                          onEditPokemon={
                            onEditPokemon
                          }

                          onDeletePokemon={
                            onDeletePokemon
                          }
                        />
                      )
                    )
                  }
                </div>
              )
        }
      </section>
    </main>
  )
}

export default Collection