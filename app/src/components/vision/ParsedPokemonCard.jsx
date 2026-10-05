import PokemonArtwork from '../PokemonArtwork'

function ParsedPokemonCard({ pokemon }) {
  if (!pokemon) {
    return null
  }

  return (
    <article className="card vision-debug-panel">
      <p className="eyebrow">Stage 3</p>
      <h2>Parsed Pokémon</h2>

      <div className="vision-parsed-pokemon">
        {pokemon.pokemonId ? (
          <PokemonArtwork
            pokemon={{
              id: pokemon.pokemonId,
              name: pokemon.name,
              shiny: pokemon.shiny,
              variant: pokemon.shadow
                ? 'shadow'
                : pokemon.purified
                  ? 'purified'
                  : 'normal',
            }}
          />
        ) : (
          <div className="pokemon-artwork-wrapper">
            <span>?</span>
          </div>
        )}

        <div>
          <p className="collection-dex-number">
            {pokemon.pokemonId
              ? `#${String(pokemon.pokemonId).padStart(4, '0')}`
              : 'Unknown species'}
          </p>

          <h3>{pokemon.name}</h3>

          <p>
            CP{' '}
            {pokemon.cp !== null
              ? pokemon.cp.toLocaleString()
              : 'Unknown'}
          </p>

          <p>
            {pokemon.ivs.attack ?? '—'} /{' '}
            {pokemon.ivs.defense ?? '—'} /{' '}
            {pokemon.ivs.stamina ?? '—'}
          </p>

          <div className="pokemon-badges">
            {pokemon.shiny && (
              <span className="pokemon-badge shiny-badge">
                ✨ Shiny
              </span>
            )}

            {pokemon.shadow && (
              <span className="pokemon-badge shadow-badge">
                Shadow
              </span>
            )}

            {pokemon.purified && (
              <span className="pokemon-badge purified-badge">
                Purified
              </span>
            )}

            {pokemon.lucky && (
              <span className="pokemon-badge lucky-badge">
                Lucky
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

export default ParsedPokemonCard
