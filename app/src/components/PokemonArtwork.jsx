import { getPokemonArtwork } from '../utils/getPokemonArtwork'

function PokemonArtwork({ pokemon }) {
  const artwork = getPokemonArtwork(pokemon)

  if (!artwork) {
    return null
  }

  return (
    <div className={`pokemon-artwork-wrapper ${pokemon.variant || ''}`}>
      <img
        className="pokemon-artwork"
        src={artwork}
        alt={pokemon.name}
      />
    </div>
  )
}

export default PokemonArtwork