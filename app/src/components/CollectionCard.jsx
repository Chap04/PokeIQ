import PokemonArtwork from './PokemonArtwork'
import { getPokemonCombatState } from '../utils/pokemonCombatState'

function CollectionCard({
  pokemon,
  onEditPokemon,
  onDeletePokemon,
}) {
  const combatState = getPokemonCombatState(pokemon)

  const artworkVariant = pokemon.shadow
    ? 'shadow'
    : pokemon.purified
      ? 'purified'
      : 'normal'

  const artworkPokemon = {
    id: pokemon.pokemonId,
    form: pokemon.pokemonForm,
    name: pokemon.name,
    shiny: pokemon.shiny ?? false,
    variant: artworkVariant,
  }

  const ivs = pokemon.ivs ?? {
    attack: null,
    defense: null,
    stamina: null,
  }

  const hasCompleteIvs =
    ivs.attack !== null &&
    ivs.attack !== undefined &&
    ivs.defense !== null &&
    ivs.defense !== undefined &&
    ivs.stamina !== null &&
    ivs.stamina !== undefined

  const ivTotal = hasCompleteIvs
    ? ivs.attack + ivs.defense + ivs.stamina
    : null

  const ivPercentage =
    ivTotal !== null
      ? Math.round((ivTotal / 45) * 100)
      : null

  function getIvClass(percentage) {
    if (percentage === 100) {
      return 'iv-perfect'
    }

    if (percentage >= 96) {
      return 'iv-excellent'
    }

    if (percentage >= 82) {
      return 'iv-good'
    }

    if (percentage >= 67) {
      return 'iv-average'
    }

    return 'iv-low'
  }

  function getCardClasses() {
    const classes = ['card', 'collection-card']

    if (pokemon.shadow) {
      classes.push('shadow-card')
    } else if (pokemon.purified) {
      classes.push('purified-card')
    } else if (pokemon.lucky) {
      classes.push('lucky-card')
    }

    if (pokemon.shiny) {
      classes.push('shiny-card')
    }

    return classes.join(' ')
  }

  function handleDelete() {
    const shouldDelete = window.confirm(
      `Delete ${pokemon.name} from your collection?`
    )

    if (shouldDelete) {
      onDeletePokemon(pokemon.id)
    }
  }

  return (
    <article className={getCardClasses()}>
      <PokemonArtwork pokemon={artworkPokemon} />

      <div className="collection-card-content">
        <p className="collection-dex-number">
          {pokemon.pokemonId}
        </p>

        <h3>
          {pokemon.favorite && (
            <span className="favorite-star">★ </span>
          )}
          {pokemon.name}
        </h3>

        <div className="collection-card-stat">
          <span>CP</span>
          <strong>{pokemon.cp.toLocaleString()}</strong>
        </div>

        {combatState?.status === 'READY' && (
          <div className="collection-card-stat">
            <span>Level</span>
            <strong>{combatState.level}</strong>
          </div>
        )}

        {combatState?.status === 'AMBIGUOUS' && (
          <div className="collection-card-stat">
            <span>Level</span>
            <strong>
              {combatState.candidates
                ?.map((candidate) => candidate.level)
                .join(' / ')}
            </strong>
          </div>
        )}

        {combatState?.status === 'NO_EXACT_MATCH' && (
          <div className="collection-card-stat">
            <span>Level</span>
            <strong>Unknown</strong>
          </div>
        )}

        {hasCompleteIvs && (
          <div className="iv-summary">
            <div className="iv-summary-header">
              <span>IVs</span>

              <strong className={getIvClass(ivPercentage)}>
                {ivPercentage}%
              </strong>
            </div>

            <p>
              {ivs.attack} / {ivs.defense} / {ivs.stamina}
            </p>
          </div>
        )}

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

        <div className="collection-card-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => onEditPokemon(pokemon)}
          >
            Edit
          </button>

          <button
            className="danger-button"
            type="button"
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  )
}

export default CollectionCard