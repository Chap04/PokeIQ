/**
 * PokeIQ Pokémon Engine
 * ---------------------
 * Pokémon Availability V1
 *
 * Resolves whether a Pokémon, permanent form,
 * temporary-evolution raid candidate, or Shadow raid
 * candidate is released and usable by a player.
 *
 * This module does not determine release status itself.
 * It consumes normalized pokemon-availability.json data.
 *
 * Important:
 *
 * Availability namespaces are intentionally separate.
 *
 * Base-species availability must NOT automatically make
 * a temporary evolution or Shadow candidate available.
 *
 * Examples:
 *
 * Rayquaza released
 * does not inherently mean
 * Mega Rayquaza released.
 *
 * Mamoswine released
 * does not inherently mean
 * Shadow Mamoswine released.
 */

// --------------------------------------------------
// Candidate-type constants
// --------------------------------------------------

export const AVAILABILITY_CANDIDATE_TYPES = {
  PERMANENT:
    'PERMANENT',

  TEMPORARY_EVOLUTION:
    'TEMPORARY_EVOLUTION',

  SHADOW:
    'SHADOW',
}

// --------------------------------------------------
// Candidate metadata
// --------------------------------------------------

function getRaidCandidateMetadata(
  candidate
) {
  return (
    candidate
      ?.pokemon
      ?.raidCandidateMetadata ??
    candidate
      ?.raidCandidateMetadata ??
    null
  )
}

function getCandidateType(
  candidate
) {
  return (
    getRaidCandidateMetadata(
      candidate
    )
      ?.candidateType ??
    null
  )
}

// --------------------------------------------------
// Permanent Pokémon availability ID
// --------------------------------------------------

export function getAvailabilityId(
  pokemon
) {
  if (!pokemon?.id) {
    throw new Error(
      'pokemon.id is required.'
    )
  }

  if (
    !pokemon.form ||
    pokemon.form ===
      'NORMAL'
  ) {
    return pokemon.id
  }

  return (
    `${pokemon.id}` +
    `__${pokemon.form}`
  )
}

// --------------------------------------------------
// Temporary-evolution metadata
// --------------------------------------------------

function getTemporaryEvolutionMetadata(
  candidate
) {
  return (
    getRaidCandidateMetadata(
      candidate
    )
      ?.temporaryEvolution ??
    null
  )
}

export function isTemporaryEvolutionCandidate(
  candidate
) {
  if (
    getCandidateType(
      candidate
    ) ===
    AVAILABILITY_CANDIDATE_TYPES
      .TEMPORARY_EVOLUTION
  ) {
    return true
  }

  return Boolean(
    getTemporaryEvolutionMetadata(
      candidate
    )
  )
}

// --------------------------------------------------
// Shadow metadata
// --------------------------------------------------

function getShadowMetadata(
  candidate
) {
  return (
    getRaidCandidateMetadata(
      candidate
    )
      ?.shadow ??
    null
  )
}

export function isShadowCandidate(
  candidate
) {
  if (
    getCandidateType(
      candidate
    ) ===
    AVAILABILITY_CANDIDATE_TYPES
      .SHADOW
  ) {
    return true
  }

  return Boolean(
    getShadowMetadata(
      candidate
    )
  )
}

// --------------------------------------------------
// Temporary-evolution availability ID
// --------------------------------------------------

/**
 * The raid candidate builder creates stable IDs such as:
 *
 * RAYQUAZA__TEMP_EVOLUTION_MEGA
 *
 * CHARIZARD__TEMP_EVOLUTION_MEGA_X
 *
 * GROUDON__TEMP_EVOLUTION_PRIMAL
 *
 * Prefer that candidate ID when available.
 */
export function getTemporaryEvolutionAvailabilityId(
  candidate
) {
  if (
    !isTemporaryEvolutionCandidate(
      candidate
    )
  ) {
    throw new Error(
      'candidate is not a temporary evolution.'
    )
  }

  if (candidate?.id) {
    return candidate.id
  }

  const pokemon =
    candidate?.pokemon ??
    candidate

  if (!pokemon?.id) {
    throw new Error(
      'temporary evolution pokemon.id is required.'
    )
  }

  const metadata =
    getTemporaryEvolutionMetadata(
      candidate
    )

  if (!metadata?.id) {
    throw new Error(
      'temporary evolution metadata.id is required.'
    )
  }

  const sourceForm =
    metadata.sourceForm ??
    pokemon.form ??
    'NORMAL'

  const sourceId =
    sourceForm ===
      'NORMAL'
      ? pokemon.id
      : (
          `${pokemon.id}` +
          `__${sourceForm}`
        )

  return (
    `${sourceId}` +
    `__${metadata.id}`
  )
}

// --------------------------------------------------
// Shadow availability ID
// --------------------------------------------------

/**
 * Shadow candidates use stable IDs such as:
 *
 * MAMOSWINE__SHADOW
 *
 * MEWTWO__SHADOW
 *
 * TYRANITAR__SHADOW
 *
 * Prefer the raid candidate's own ID whenever possible.
 *
 * If only the underlying Pokémon object is available,
 * use Shadow metadata to reconstruct the source
 * candidate ID.
 */
export function getShadowAvailabilityId(
  candidate
) {
  if (
    !isShadowCandidate(
      candidate
    )
  ) {
    throw new Error(
      'candidate is not a Shadow candidate.'
    )
  }

  if (
    candidate?.id &&
    candidate.id.endsWith(
      '__SHADOW'
    )
  ) {
    return candidate.id
  }

  const pokemon =
    candidate?.pokemon ??
    candidate

  if (!pokemon?.id) {
    throw new Error(
      'Shadow pokemon.id is required.'
    )
  }

  const metadata =
    getShadowMetadata(
      candidate
    )

  const sourceCandidateId =
    metadata
      ?.sourceCandidateId

  if (sourceCandidateId) {
    return (
      `${sourceCandidateId}` +
      '__SHADOW'
    )
  }

  const permanentId =
    getAvailabilityId(
      pokemon
    )

  return (
    `${permanentId}` +
    '__SHADOW'
  )
}

// --------------------------------------------------
// Default state
// --------------------------------------------------

function getDefaultAvailability(
  availabilityData
) {
  const defaultPlayerUsable =
    availabilityData
      ?.defaultPlayerUsable ===
      true

  return {
    released:
      defaultPlayerUsable,

    playerUsable:
      defaultPlayerUsable,

    source:
      'DEFAULT',
  }
}

// --------------------------------------------------
// Override lookup
// --------------------------------------------------

function getPermanentOverride({
  availabilityId,
  availabilityData,
}) {
  return (
    availabilityData
      ?.overrides
      ?.[availabilityId] ??
    null
  )
}

/**
 * Temporary-evolution availability intentionally lives
 * in its own namespace.
 */
function getTemporaryEvolutionOverride({
  availabilityId,
  availabilityData,
}) {
  return (
    availabilityData
      ?.temporaryEvolutionOverrides
      ?.[availabilityId] ??
    null
  )
}

/**
 * Shadow availability also lives in its own namespace.
 *
 * Expected generated structure:
 *
 * {
 *   "shadowOverrides": {
 *     "MAMOSWINE__SHADOW": {
 *       "released": true,
 *       "playerUsable": true,
 *       ...
 *     }
 *   }
 * }
 *
 * Separating Shadows from permanent Pokémon prevents
 * base-species availability from accidentally making
 * every possible Shadow available.
 */
function getShadowOverride({
  availabilityId,
  availabilityData,
}) {
  return (
    availabilityData
      ?.shadowOverrides
      ?.[availabilityId] ??
    null
  )
}

// --------------------------------------------------
// Availability result construction
// --------------------------------------------------

function resolveOverride({
  id,
  override,
  availabilityData,
  source,
  candidateType,
}) {
  const fallback =
    getDefaultAvailability(
      availabilityData
    )

  if (!override) {
    return {
      id,

      released:
        fallback.released,

      playerUsable:
        fallback.playerUsable,

      source:
        fallback.source,

      explicit:
        false,

      candidateType,
    }
  }

  return {
    id,

    released:
      typeof override.released ===
      'boolean'
        ? override.released
        : fallback.released,

    playerUsable:
      typeof override.playerUsable ===
      'boolean'
        ? override.playerUsable
        : fallback.playerUsable,

    source,

    explicit:
      true,

    candidateType,

    reason:
      override.reason ??
      null,

    confidence:
      override.confidence ??
      null,
  }
}

// --------------------------------------------------
// Permanent Pokémon availability
// --------------------------------------------------

export function getPokemonAvailability(
  pokemon,
  availabilityData
) {
  if (!pokemon) {
    throw new Error(
      'pokemon is required.'
    )
  }

  if (!availabilityData) {
    throw new Error(
      'availabilityData is required.'
    )
  }

  const availabilityId =
    getAvailabilityId(
      pokemon
    )

  const override =
    getPermanentOverride({
      availabilityId,
      availabilityData,
    })

  return resolveOverride({
    id:
      availabilityId,

    override,

    availabilityData,

    source:
      'OVERRIDE',

    candidateType:
      AVAILABILITY_CANDIDATE_TYPES
        .PERMANENT,
  })
}

// --------------------------------------------------
// Temporary-evolution availability
// --------------------------------------------------

export function getTemporaryEvolutionAvailability(
  candidate,
  availabilityData
) {
  if (!candidate) {
    throw new Error(
      'candidate is required.'
    )
  }

  if (!availabilityData) {
    throw new Error(
      'availabilityData is required.'
    )
  }

  if (
    !isTemporaryEvolutionCandidate(
      candidate
    )
  ) {
    throw new Error(
      'candidate is not a temporary evolution.'
    )
  }

  const availabilityId =
    getTemporaryEvolutionAvailabilityId(
      candidate
    )

  const override =
    getTemporaryEvolutionOverride({
      availabilityId,
      availabilityData,
    })

  return resolveOverride({
    id:
      availabilityId,

    override,

    availabilityData,

    source:
      'TEMPORARY_EVOLUTION_OVERRIDE',

    candidateType:
      AVAILABILITY_CANDIDATE_TYPES
        .TEMPORARY_EVOLUTION,
  })
}

// --------------------------------------------------
// Shadow availability
// --------------------------------------------------

export function getShadowAvailability(
  candidate,
  availabilityData
) {
  if (!candidate) {
    throw new Error(
      'candidate is required.'
    )
  }

  if (!availabilityData) {
    throw new Error(
      'availabilityData is required.'
    )
  }

  if (
    !isShadowCandidate(
      candidate
    )
  ) {
    throw new Error(
      'candidate is not a Shadow candidate.'
    )
  }

  const availabilityId =
    getShadowAvailabilityId(
      candidate
    )

  const override =
    getShadowOverride({
      availabilityId,
      availabilityData,
    })

  return resolveOverride({
    id:
      availabilityId,

    override,

    availabilityData,

    source:
      'SHADOW_OVERRIDE',

    candidateType:
      AVAILABILITY_CANDIDATE_TYPES
        .SHADOW,
  })
}

// --------------------------------------------------
// Convenience helpers — permanent Pokémon
// --------------------------------------------------

export function isPokemonReleased(
  pokemon,
  availabilityData
) {
  return getPokemonAvailability(
    pokemon,
    availabilityData
  ).released
}

export function isPokemonPlayerUsable(
  pokemon,
  availabilityData
) {
  return getPokemonAvailability(
    pokemon,
    availabilityData
  ).playerUsable
}

// --------------------------------------------------
// Candidate helpers
// --------------------------------------------------

function getCandidatePokemon(
  candidate
) {
  return (
    candidate?.pokemon ??
    candidate
  )
}

export function getCandidateAvailability(
  candidate,
  availabilityData
) {
  if (!candidate) {
    throw new Error(
      'candidate is required.'
    )
  }

  /**
   * Check special candidate types before falling back
   * to ordinary permanent Pokémon availability.
   *
   * This order matters because Shadow and temporary
   * candidates intentionally retain an underlying
   * ordinary Pokémon object.
   */

  if (
    isTemporaryEvolutionCandidate(
      candidate
    )
  ) {
    return (
      getTemporaryEvolutionAvailability(
        candidate,
        availabilityData
      )
    )
  }

  if (
    isShadowCandidate(
      candidate
    )
  ) {
    return (
      getShadowAvailability(
        candidate,
        availabilityData
      )
    )
  }

  const pokemon =
    getCandidatePokemon(
      candidate
    )

  return getPokemonAvailability(
    pokemon,
    availabilityData
  )
}

export function isCandidateReleased(
  candidate,
  availabilityData
) {
  return getCandidateAvailability(
    candidate,
    availabilityData
  ).released
}

export function isCandidatePlayerUsable(
  candidate,
  availabilityData
) {
  return getCandidateAvailability(
    candidate,
    availabilityData
  ).playerUsable
}

// --------------------------------------------------
// Filtering
// --------------------------------------------------

export function filterPlayerUsablePokemon(
  candidates,
  availabilityData
) {
  if (
    !Array.isArray(
      candidates
    )
  ) {
    throw new Error(
      'candidates must be an array.'
    )
  }

  return candidates.filter(
    (candidate) =>
      isCandidatePlayerUsable(
        candidate,
        availabilityData
      )
  )
}

// --------------------------------------------------
// Inspection
// --------------------------------------------------

export function inspectPokemonAvailability(
  candidates,
  availabilityData
) {
  if (
    !Array.isArray(
      candidates
    )
  ) {
    throw new Error(
      'candidates must be an array.'
    )
  }

  const usable = []
  const unavailable = []

  const permanent = {
    usable: [],
    unavailable: [],
  }

  const temporaryEvolution = {
    usable: [],
    unavailable: [],
  }

  const shadow = {
    usable: [],
    unavailable: [],
  }

  for (
    const candidate
    of candidates
  ) {
    const availability =
      getCandidateAvailability(
        candidate,
        availabilityData
      )

    const result = {
      candidate,
      availability,
    }

    const temporary =
      isTemporaryEvolutionCandidate(
        candidate
      )

    const shadowCandidate =
      isShadowCandidate(
        candidate
      )

    let bucket =
      permanent

    if (temporary) {
      bucket =
        temporaryEvolution
    } else if (
      shadowCandidate
    ) {
      bucket =
        shadow
    }

    if (
      availability.playerUsable
    ) {
      usable.push(
        result
      )

      bucket
        .usable
        .push(
          result
        )
    } else {
      unavailable.push(
        result
      )

      bucket
        .unavailable
        .push(
          result
        )
    }
  }

  return {
    usable,
    unavailable,

    permanent,

    temporaryEvolution,

    shadow,

    counts: {
      total:
        candidates.length,

      usable:
        usable.length,

      unavailable:
        unavailable.length,

      permanentUsable:
        permanent
          .usable
          .length,

      permanentUnavailable:
        permanent
          .unavailable
          .length,

      temporaryEvolutionUsable:
        temporaryEvolution
          .usable
          .length,

      temporaryEvolutionUnavailable:
        temporaryEvolution
          .unavailable
          .length,

      shadowUsable:
        shadow
          .usable
          .length,

      shadowUnavailable:
        shadow
          .unavailable
          .length,
    },
  }
}