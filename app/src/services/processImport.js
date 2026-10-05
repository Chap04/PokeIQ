import { matchImportedPokemon } from '../utils/matchImportedPokemon'

function hasReadablePokemonIdentity(
  pokemon
) {
  return (
    typeof pokemon.pokemonIdentity ===
      'string' &&
    pokemon.pokemonIdentity.trim() !==
      ''
  )
}

function hasReadablePokemonId(
  pokemon
) {
  if (
    typeof pokemon.pokemonId ===
    'string'
  ) {
    return (
      pokemon.pokemonId.trim() !==
      ''
    )
  }

  return (
    Number.isInteger(
      pokemon.pokemonId
    ) &&
    pokemon.pokemonId > 0
  )
}

function hasReadableApiName(
  pokemon
) {
  return (
    typeof pokemon.apiName ===
      'string' &&
    pokemon.apiName.trim() !== ''
  )
}

function hasReadableSpecies(
  pokemon
) {
  return (
    hasReadablePokemonIdentity(
      pokemon
    ) ||
    hasReadablePokemonId(
      pokemon
    ) ||
    hasReadableApiName(
      pokemon
    )
  )
}

function hasReadableName(
  pokemon
) {
  return (
    typeof pokemon.name ===
      'string' &&
    pokemon.name.trim() !== ''
  )
}

function hasReadableCp(
  pokemon
) {
  return (
    Number.isFinite(
      pokemon.cp
    ) &&
    pokemon.cp >= 0
  )
}

function hasReadableIdentity(
  pokemon
) {
  return (
    hasReadableSpecies(
      pokemon
    ) &&
    hasReadableName(
      pokemon
    )
  )
}

function prepareReviewItem(
  pokemon,
  match,
  extra = {}
) {
  return {
    ...pokemon,
    match,
    decision: 'pending',
    importStatus:
      'review-required',
    ...extra,
  }
}

export function processImport(
  detectedPokemon,
  currentCollection
) {
  const autoApproved = []
  const reviewRequired = []
  const unreadable = []

  detectedPokemon.forEach(
    (pokemon) => {
      /*
       * If we cannot identify the
       * Pokémon itself, there is not
       * enough information for a useful
       * manual review.
       */
      if (
        !hasReadableIdentity(
          pokemon
        )
      ) {
        unreadable.push({
          ...pokemon,

          importStatus:
            'unreadable',

          issues:
            getReadabilityIssues(
              pokemon
            ),
        })

        return
      }

      /*
       * If the Pokémon is identified but
       * CP could not be determined
       * reliably, preserve it and send it
       * to review instead of discarding
       * it as unreadable.
       *
       * Matching is intentionally skipped
       * until the user supplies a CP.
       */
      if (
        !hasReadableCp(
          pokemon
        )
      ) {
        reviewRequired.push(
          prepareReviewItem(
            pokemon,
            {
              found: false,
              type:
                'missing-cp',
            },
            {
              reviewReason:
                'missing-cp',

              issues: [
                'CP could not be read',
              ],

              requiresManualCp:
                true,
            }
          )
        )

        return
      }

      const match =
        matchImportedPokemon(
          pokemon,
          currentCollection
        )

      if (match.found) {
        reviewRequired.push(
          prepareReviewItem(
            pokemon,
            match
          )
        )

        return
      }

      autoApproved.push({
        ...pokemon,

        match,

        decision:
          'keep',

        importStatus:
          'auto-approved',
      })
    }
  )

  return {
    autoApproved,

    reviewRequired,

    unreadable,

    summary: {
      detected:
        detectedPokemon.length,

      autoApproved:
        autoApproved.length,

      reviewRequired:
        reviewRequired.length,

      unreadable:
        unreadable.length,

      missingCp:
        reviewRequired.filter(
          (pokemon) =>
            pokemon.reviewReason ===
            'missing-cp'
        ).length,

      exactDuplicates:
        reviewRequired.filter(
          (pokemon) =>
            pokemon.match?.type ===
            'exact-duplicate'
        ).length,

      updatedPokemon:
        reviewRequired.filter(
          (pokemon) =>
            pokemon.match?.type ===
            'updated-pokemon'
        ).length,

      possibleEvolutions:
        reviewRequired.filter(
          (pokemon) =>
            pokemon.match?.type ===
            'possible-evolution'
        ).length,
    },
  }
}

function getReadabilityIssues(
  pokemon
) {
  const issues = []

  if (
    !hasReadableSpecies(
      pokemon
    )
  ) {
    issues.push(
      'Pokémon species could not be identified'
    )
  }

  if (
    !hasReadableName(
      pokemon
    )
  ) {
    issues.push(
      'Pokémon name could not be read'
    )
  }

  if (
    !hasReadableCp(
      pokemon
    )
  ) {
    issues.push(
      'CP could not be read'
    )
  }

  return issues
}