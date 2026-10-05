import {
  PROJECT_STATUS,
  PROJECT_TYPE,
} from './projectConstants.js'

// --------------------------------------------------
// PokeIQ Project Matching V2
//
// PROJECTS V2 INVARIANT:
//
// One Raid Investment Project represents one exact
// owned Pokémon.
//
// Therefore:
//
//   same collectionId
//   + same Project type
//   + Project not abandoned
//
// means the Pokémon is already being managed under
// Projects.
//
// Individual target levels, evolutions and movesets no
// longer create separate Projects.
// --------------------------------------------------

function normalizeCollectionId(
  value
) {
  if (
    typeof value !==
      'string'
  ) {
    return null
  }

  const normalized =
    value.trim()

  return normalized.length >
    0
    ? normalized
    : null
}

function getRecommendationCollectionId(
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

  for (
    const candidate
    of candidates
  ) {
    const normalized =
      normalizeCollectionId(
        candidate
      )

    if (normalized) {
      return normalized
    }
  }

  return null
}

function projectCountsAsInvestmentCommitment(
  project
) {
  if (
    !project ||
    project.type !==
      PROJECT_TYPE
        .RAID_INVESTMENT
  ) {
    return false
  }

  // An abandoned Project no longer claims the
  // Pokémon. Its recommendations may return to the
  // Dashboard.
  if (
    project.status ===
      PROJECT_STATUS
        .ABANDONED
  ) {
    return false
  }

  return true
}

// --------------------------------------------------
// Legacy export retained.
//
// Under V2, "goal match" means both Projects represent
// the same exact owned Pokémon investment.
// --------------------------------------------------

export function projectGoalsMatch(
  firstProject,
  secondProject
) {
  if (
    !firstProject ||
    !secondProject
  ) {
    return false
  }

  if (
    firstProject.type !==
      secondProject.type
  ) {
    return false
  }

  const firstCollectionId =
    normalizeCollectionId(
      firstProject
        .collectionId
    )

  const secondCollectionId =
    normalizeCollectionId(
      secondProject
        .collectionId
    )

  if (
    !firstCollectionId ||
    !secondCollectionId
  ) {
    return false
  }

  return (
    firstCollectionId ===
    secondCollectionId
  )
}

// --------------------------------------------------
// Direct Collection lookup
// --------------------------------------------------

export function findProjectForCollectionId(
  projects,
  collectionId
) {
  if (
    !Array.isArray(
      projects
    )
  ) {
    return null
  }

  const normalizedCollectionId =
    normalizeCollectionId(
      collectionId
    )

  if (
    !normalizedCollectionId
  ) {
    return null
  }

  return (
    projects.find(
      project =>
        projectCountsAsInvestmentCommitment(
          project
        ) &&
        normalizeCollectionId(
          project
            ?.collectionId
        ) ===
          normalizedCollectionId
    ) ??
    null
  )
}

// --------------------------------------------------
// Recommendation lookup
// --------------------------------------------------

export function findMatchingProjectForRecommendation(
  projects,
  recommendation
) {
  const collectionId =
    getRecommendationCollectionId(
      recommendation
    )

  if (!collectionId) {
    return null
  }

  return (
    findProjectForCollectionId(
      projects,
      collectionId
    )
  )
}

// --------------------------------------------------
// Dashboard-facing boolean helper
// --------------------------------------------------

export function recommendationHasProject(
  projects,
  recommendation
) {
  return Boolean(
    findMatchingProjectForRecommendation(
      projects,
      recommendation
    )
  )
}