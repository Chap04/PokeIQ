import { useEffect, useState } from 'react'
import PokemonArtwork from './PokemonArtwork'

function getMatchTitle(match, requiresManualCp) {
  if (requiresManualCp) {
    return 'CP needs manual input'
  }

  if (!match?.found) {
    return 'No possible match found'
  }

  if (match.type === 'exact-duplicate') {
    return 'Possible duplicate found'
  }

  if (match.type === 'updated-pokemon') {
    return 'Possible updated Pokémon'
  }

  if (match.type === 'possible-evolution') {
    return 'Possible evolution detected'
  }

  return 'Possible match found'
}

function ImportReviewCard({
  pokemon,
  decision,
  match,
  onCpChange,
  onKeep,
  onReplace,
  onSkip,
}) {
  const [manualCp, setManualCp] = useState('')

  const reviewKey =
    pokemon.absolutePosition ??
    pokemon.importId ??
    `${pokemon.pokemonId}-${pokemon.name}`

  useEffect(() => {
    setManualCp('')
  }, [reviewKey])

  const artworkVariant = pokemon.shadow
    ? 'shadow'
    : pokemon.purified
      ? 'purified'
      : 'normal'

  const artworkPokemon = {
    id: pokemon.pokemonId,
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

  const ivPercentage = hasCompleteIvs
    ? Math.round(
        ((ivs.attack +
          ivs.defense +
          ivs.stamina) /
          45) *
          100
      )
    : null

  const hasReadableCp =
    Number.isFinite(pokemon.cp) &&
    pokemon.cp > 0

  const requiresManualCp =
    pokemon.requiresManualCp === true ||
    pokemon.reviewReason === 'missing-cp' ||
    !hasReadableCp

  const hasReviewImage =
    typeof pokemon.reviewImage === 'string' &&
    pokemon.reviewImage.trim() !== ''

  const parsedManualCp =
    Number.parseInt(manualCp, 10)

  const hasValidManualCp =
    Number.isInteger(parsedManualCp) &&
    parsedManualCp > 0

  function handleManualCpChange(event) {
    const value = event.target.value

    if (
      value === '' ||
      /^\d+$/.test(value)
    ) {
      setManualCp(value)
    }
  }

  function applyManualCp() {
    if (!hasValidManualCp) {
      return
    }

    onCpChange?.(parsedManualCp)
  }

  function handleManualCpKeyDown(event) {
    if (
      event.key === 'Enter' &&
      hasValidManualCp
    ) {
      event.preventDefault()
      applyManualCp()
    }
  }

  return (
    <article className="card import-review-card">
      <div className="import-review-artwork">
        <PokemonArtwork
          pokemon={artworkPokemon}
        />
      </div>

      <div className="import-review-details">
        <p className="collection-dex-number">
          #
          {String(
            pokemon.pokemonId
          ).padStart(4, '0')}
        </p>

        <h2>{pokemon.name}</h2>

        {requiresManualCp && hasReviewImage && (
          <div className="import-review-source">
            <div className="import-review-source-header">
              <strong>
                Original recording
              </strong>

              <span>
                Use this image to enter
                the CP shown in Pokémon GO.
              </span>
            </div>

            <div className="import-review-source-image">
              <img
                src={pokemon.reviewImage}
                alt={`${pokemon.name} from the original recording`}
                style={{
                  display: 'block',
                  width: '100%',
                  maxWidth: '360px',
                  height: 'auto',
                  borderRadius: '12px',
                }}
              />
            </div>
          </div>
        )}

        {requiresManualCp && !hasReviewImage && (
          <div className="import-review-source">
            <div className="import-review-source-header">
              <strong>
                Original recording image unavailable
              </strong>

              <span>
                PokeIQ identified the Pokémon,
                but no source crop was attached
                to this review item.
              </span>
            </div>
          </div>
        )}

        <div className="import-review-stats">
          <div>
            <span>CP</span>

            {requiresManualCp ? (
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Enter CP"
                  value={manualCp}
                  onChange={
                    handleManualCpChange
                  }
                  onKeyDown={
                    handleManualCpKeyDown
                  }
                  aria-label={`CP for ${pokemon.name}`}
                />

                <button
                  className="secondary-button"
                  type="button"
                  disabled={
                    !hasValidManualCp
                  }
                  onClick={applyManualCp}
                >
                  Apply CP
                </button>
              </div>
            ) : (
              <strong>
                {pokemon.cp.toLocaleString()}
              </strong>
            )}
          </div>

          {hasCompleteIvs && (
            <div>
              <span>IVs</span>

              <strong>
                {ivPercentage}%
              </strong>

              <small>
                {ivs.attack} /{' '}
                {ivs.defense} /{' '}
                {ivs.stamina}
              </small>
            </div>
          )}
        </div>

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

        <div
          className={
            match?.found
              ? 'import-duplicate-status match-found'
              : 'import-duplicate-status'
          }
        >
          <strong>
            {getMatchTitle(
              match,
              requiresManualCp
            )}
          </strong>

          {requiresManualCp ? (
            <>
              <p>
                PokeIQ identified this
                Pokémon, but its CP could
                not be read reliably.
              </p>

              {hasReviewImage ? (
                <p>
                  Check the original
                  recording image above,
                  enter the full CP, then
                  select Apply CP.
                </p>
              ) : (
                <p>
                  Enter the full CP above,
                  then select Apply CP.
                </p>
              )}
            </>
          ) : match?.found ? (
            <>
              <p>
                Match confidence:{' '}
                {match.confidence}%
              </p>

              <p>
                Existing entry:{' '}
                {
                  match.existingPokemon
                    .name
                }
                , CP{' '}
                {Number.isFinite(
                  match.existingPokemon
                    .cp
                )
                  ? match.existingPokemon.cp.toLocaleString()
                  : 'Unknown'}
              </p>

              <ul className="match-reasons">
                {(match.reasons ?? []).map(
                  (reason) => (
                    <li key={reason}>
                      {reason}
                    </li>
                  )
                )}
              </ul>
            </>
          ) : (
            <p>
              This Pokémon appears to be
              a new collection entry.
            </p>
          )}
        </div>

        <div className="import-review-decisions">
          <button
            className={
              decision === 'skip'
                ? 'decision-button skip active'
                : 'decision-button skip'
            }
            type="button"
            onClick={onSkip}
          >
            Skip
          </button>

          {match?.found &&
            !requiresManualCp && (
              <button
                className={
                  decision === 'replace'
                    ? 'decision-button replace active'
                    : 'decision-button replace'
                }
                type="button"
                onClick={onReplace}
              >
                {match.type ===
                'possible-evolution'
                  ? `Replace ${match.existingPokemon.name}`
                  : 'Replace Existing'}
              </button>
            )}

          <button
            className={
              decision === 'keep'
                ? 'decision-button keep active'
                : 'decision-button keep'
            }
            type="button"
            onClick={onKeep}
            disabled={requiresManualCp}
          >
            {requiresManualCp
              ? 'Enter CP to Keep'
              : match?.found
                ? 'Keep Both'
                : 'Keep'}
          </button>
        </div>
      </div>
    </article>
  )
}

export default ImportReviewCard