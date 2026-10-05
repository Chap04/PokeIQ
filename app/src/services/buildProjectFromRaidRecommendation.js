import {
  PROJECT_BUILD_STATUS,
  PROJECT_SCHEMA_VERSION,
  PROJECT_SOURCE_TYPE,
  PROJECT_STATUS,
  PROJECT_TYPE,
} from '../utils/projectConstants.js'

// --------------------------------------------------
// PokeIQ Raid Project Builder V2
//
// A recommendation is only the ENTRY POINT into a
// Project.
//
// The resulting Project represents:
//
//   "I have decided to invest in this exact Pokémon."
//
// It does NOT persist:
//
// - one exact target level
// - one exact target moveset
// - one frozen investment path
// - resource requirements as permanent Actions
//
// Those are derived later from current Raid Investment
// intelligence.
//
// The original recommendation is preserved only as
// historical context explaining why the Project was
// started.
// --------------------------------------------------

function createDefaultId(
  prefix
) {
  if (
    typeof crypto !==
      'undefined' &&
    typeof crypto.randomUUID ===
      'function'
  ) {
    return (
      `${prefix}-${crypto.randomUUID()}`
    )
  }

  return (
    `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`
  )
}

function getTimestamp(
  now
) {
  if (
    typeof now ===
      'string' &&
    now.trim().length > 0
  ) {
    return now
  }

  if (
    now instanceof Date
  ) {
    return now.toISOString()
  }

  return new Date().toISOString()
}

function getCollectionId(
  recommendation
) {
  const candidates = [
    recommendation
      ?.collectionId,

    recommendation
      ?.ownedPokemon
      ?.collectionId,

    recommendation
      ?.pokemon
      ?.collectionId,

    recommendation
      ?.candidate
      ?.collectionId,

    recommendation
      ?.opportunity
      ?.collectionId,
  ]

  return (
    candidates.find(
      value =>
        typeof value ===
          'string' &&
        value.trim().length > 0
    ) ??
    null
  )
}

function getPokemonName(
  recommendation
) {
  const candidates = [
    recommendation
      ?.pokemonName,

    recommendation
      ?.ownedPokemon
      ?.name,

    recommendation
      ?.pokemon
      ?.name,

    recommendation
      ?.candidate
      ?.name,
  ]

  return (
    candidates.find(
      value =>
        typeof value ===
          'string' &&
        value.trim().length > 0
    ) ??
    'Pokémon'
  )
}

function getPokemonIdentity(
  recommendation
) {
  const candidates = [
    recommendation
      ?.sourcePokemonIdentity,

    recommendation
      ?.pokemonIdentity,

    recommendation
      ?.ownedPokemon
      ?.pokemonIdentity,

    recommendation
      ?.pokemon
      ?.pokemonIdentity,

    recommendation
      ?.candidate
      ?.pokemonIdentity,
  ]

  return (
    candidates.find(
      value =>
        typeof value ===
          'string' &&
        value.trim().length > 0
    ) ??
    null
  )
}

function getOriginalRank(
  recommendation
) {
  const candidates = [
    recommendation
      ?.accountAwareRank,

    recommendation
      ?.engineRank,

    recommendation
      ?.rank,
  ]

  return (
    candidates.find(
      value =>
        Number.isFinite(
          value
        )
    ) ??
    null
  )
}

function getSourceSnapshot(
  recommendation
) {
  const accountImpact =
    recommendation
      ?.accountImpactSummary

  return {
    type:
      PROJECT_SOURCE_TYPE
        .RAID_RECOMMENDATION,

    initialRecommendation: {
      recommendationType:
        recommendation
          ?.recommendationType ??
        null,

      title:
        recommendation
          ?.title ??
        null,

      actionType:
        recommendation
          ?.actionType ??
        null,

      possibleStateType:
        recommendation
          ?.possibleStateType ??
        null,

      rank:
        getOriginalRank(
          recommendation
        ),

      resultingPokemonIdentity:
        recommendation
          ?.resultingPokemonIdentity ??
        null,

      raidStrength: {
        score:
          Number.isFinite(
            recommendation
              ?.raidStrengthScore
          )
            ? recommendation
                .raidStrengthScore
            : null,

        classification:
          recommendation
            ?.raidStrengthClassification ??
          null,
      },

      accountImpact: {
        pointChange:
          Number.isFinite(
            accountImpact
              ?.overallStrengthPointChange
          )
            ? accountImpact
                .overallStrengthPointChange
            : null,

        percentChange:
          Number.isFinite(
            accountImpact
              ?.overallStrengthPercentChange
          )
            ? accountImpact
                .overallStrengthPercentChange
            : null,
      },
    },
  }
}

// --------------------------------------------------
// Public API
// --------------------------------------------------

export function buildProjectFromRaidRecommendation({
  recommendation,
  idFactory = createDefaultId,
  now = null,
} = {}) {
  if (
    !recommendation ||
    typeof recommendation !==
      'object'
  ) {
    return {
      status:
        PROJECT_BUILD_STATUS
          .INVALID_RECOMMENDATION,

      project: null,
      actions: [],
    }
  }

  const collectionId =
    getCollectionId(
      recommendation
    )

  if (!collectionId) {
    return {
      status:
        PROJECT_BUILD_STATUS
          .MISSING_COLLECTION_ID,

      project: null,
      actions: [],
    }
  }

  const timestamp =
    getTimestamp(
      now
    )

  const pokemonName =
    getPokemonName(
      recommendation
    )

  const project = {
    id:
      idFactory(
        'project'
      ),

    schemaVersion:
      PROJECT_SCHEMA_VERSION,

    type:
      PROJECT_TYPE
        .RAID_INVESTMENT,

    status:
      PROJECT_STATUS
        .ACTIVE,

    // ----------------------------------------------
    // Durable identity
    // ----------------------------------------------

    collectionId,

    // Historical identity only.
    //
    // The Pokémon may later evolve, so this must not
    // be used to decide whether the Project still
    // belongs to the same Collection entry.
    sourcePokemonIdentity:
      getPokemonIdentity(
        recommendation
      ),

    // ----------------------------------------------
    // Display
    // ----------------------------------------------

    title:
      `${pokemonName} Raid Investment`,

    // ----------------------------------------------
    // Historical reason the player started Project
    // ----------------------------------------------

    source:
      getSourceSnapshot(
        recommendation
      ),

    // ----------------------------------------------
    // V2 Projects do not freeze recommendation Actions
    // ----------------------------------------------

    actions: [],

    createdAt:
      timestamp,

    updatedAt:
      timestamp,

    completedAt:
      null,

    pausedAt:
      null,

    abandonedAt:
      null,
  }

  return {
    status:
      PROJECT_BUILD_STATUS
        .SUCCESS,

    project,

    actions: [],
  }
}

export default buildProjectFromRaidRecommendation