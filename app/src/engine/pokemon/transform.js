// --------------------------------------------------
// Validation
// --------------------------------------------------

function requirePokemon(
  pokemon
) {
  if (!pokemon) {
    throw new Error(
      'pokemon is required.'
    )
  }

  return pokemon
}

function requireTemporaryEvolutionId(
  temporaryEvolutionId
) {
  if (
    typeof temporaryEvolutionId !== 'string' ||
    temporaryEvolutionId.length === 0
  ) {
    throw new Error(
      'temporaryEvolutionId is required.'
    )
  }

  return temporaryEvolutionId
}

// --------------------------------------------------
// Temporary evolution lookup
// --------------------------------------------------

export function getTemporaryEvolution(
  pokemon,
  temporaryEvolutionId
) {
  requirePokemon(
    pokemon
  )

  requireTemporaryEvolutionId(
    temporaryEvolutionId
  )

  const temporaryEvolutions =
    pokemon.temporaryEvolutions ?? []

  return (
    temporaryEvolutions.find(
      (temporaryEvolution) =>
        temporaryEvolution.id ===
        temporaryEvolutionId
    ) ?? null
  )
}

// --------------------------------------------------
// Temporary evolution availability
// --------------------------------------------------

export function hasTemporaryEvolution(
  pokemon,
  temporaryEvolutionId
) {
  return Boolean(
    getTemporaryEvolution(
      pokemon,
      temporaryEvolutionId
    )
  )
}

// --------------------------------------------------
// Resolve temporary evolution
// --------------------------------------------------

export function resolveTemporaryEvolution(
  pokemon,
  temporaryEvolutionId
) {
  requirePokemon(
    pokemon
  )

  requireTemporaryEvolutionId(
    temporaryEvolutionId
  )

  const temporaryEvolution =
    getTemporaryEvolution(
      pokemon,
      temporaryEvolutionId
    )

  if (!temporaryEvolution) {
    throw new Error(
      `Temporary evolution not found: ${temporaryEvolutionId}`
    )
  }

  if (!temporaryEvolution.stats) {
    throw new Error(
      `Temporary evolution has no stats: ${temporaryEvolutionId}`
    )
  }

  const types =
    temporaryEvolution.types?.length
      ? temporaryEvolution.types
      : pokemon.types

  return {
    ...pokemon,

    stats: {
      ...temporaryEvolution.stats,
    },

    types: [
      ...types,
    ],

    temporaryEvolution: {
      id:
        temporaryEvolution.id,

      requirements:
        temporaryEvolution.requirements
          ? {
              ...temporaryEvolution.requirements,
            }
          : null,
    },
  }
}