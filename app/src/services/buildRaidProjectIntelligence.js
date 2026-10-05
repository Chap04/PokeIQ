// --------------------------------------------------
// PokeIQ Raid Project Intelligence V1
//
// Pure shared Project-intelligence coordinator.
//
// This service deliberately does NOT import the Raid
// engine directly.
//
// Why?
//
// - Keeps this service independently testable in Node.
// - Avoids Node JSON-module import issues.
// - Prevents the service from owning environment-specific
//   dependencies.
// - App.jsx can supply the real Raid builders once and
//   become the single owner of Project intelligence.
//
// Collection
//      ↓
// supplied Raid Dashboard builder
//      ↓
// supplied 18-Type profile builder
//      ↓
// every non-abandoned Project
//      ↓
// exact owned Pokémon + live Project plan
//
// IMPORTANT:
//
// - This service does not persist anything.
// - This service does not derive UI progress.
// - ABANDONED Projects are preserved separately.
// - PAUSED Projects are still evaluated.
// - collectionId remains the exact owned-Pokémon anchor.
// --------------------------------------------------

import {
  PROJECT_STATUS,
} from '../utils/projectConstants.js'

// --------------------------------------------------
// Collection helpers
// --------------------------------------------------

function getCollectionId(
  pokemon
) {
  const candidates = [
    pokemon
      ?.collectionId,

    pokemon
      ?.id,
  ]

  return (
    candidates.find(
      value =>
        typeof value ===
          'string' &&
        value.trim().length >
          0
    ) ??
    null
  )
}

export function findProjectCollectionPokemon({
  pokemonCollection,
  collectionId,
}) {
  if (
    !Array.isArray(
      pokemonCollection
    ) ||
    !collectionId
  ) {
    return null
  }

  return (
    pokemonCollection.find(
      pokemon =>
        getCollectionId(
          pokemon
        ) ===
        collectionId
    ) ??
    null
  )
}

// --------------------------------------------------
// Project grouping
// --------------------------------------------------

function getCurrentProjects(
  projects
) {
  if (
    !Array.isArray(
      projects
    )
  ) {
    return []
  }

  return projects.filter(
    project =>
      project?.status !==
      PROJECT_STATUS
        .ABANDONED
  )
}

function getRemovedProjects(
  projects
) {
  if (
    !Array.isArray(
      projects
    )
  ) {
    return []
  }

  return projects.filter(
    project =>
      project?.status ===
      PROJECT_STATUS
        .ABANDONED
  )
}

// --------------------------------------------------
// Dependency validation
// --------------------------------------------------

function resolveDependencies(
  dependencies
) {
  const raidDashboardBuilder =
    dependencies
      ?.raidDashboardBuilder

  const raidTypeProfileBuilder =
    dependencies
      ?.raidTypeProfileBuilder

  const projectPlanBuilder =
    dependencies
      ?.projectPlanBuilder

  const accountImpactEnricher =
    dependencies
      ?.accountImpactEnricher

  if (
    typeof raidDashboardBuilder !==
      'function'
  ) {
    throw new Error(
      'buildRaidProjectIntelligence requires raidDashboardBuilder.'
    )
  }

  if (
    typeof raidTypeProfileBuilder !==
      'function'
  ) {
    throw new Error(
      'buildRaidProjectIntelligence requires raidTypeProfileBuilder.'
    )
  }

  if (
    typeof projectPlanBuilder !==
      'function'
  ) {
    throw new Error(
      'buildRaidProjectIntelligence requires projectPlanBuilder.'
    )
  }

  if (
    typeof accountImpactEnricher !==
      'function'
  ) {
    throw new Error(
      'buildRaidProjectIntelligence requires accountImpactEnricher.'
    )
  }

  return {
    raidDashboardBuilder,
    raidTypeProfileBuilder,
    projectPlanBuilder,
    accountImpactEnricher,
  }
}

// --------------------------------------------------
// Public API
// --------------------------------------------------

export function buildRaidProjectIntelligence({
  projects = [],
  pokemonCollection = [],
  dependencies,
} = {}) {
  const {
    raidDashboardBuilder,
    raidTypeProfileBuilder,
    projectPlanBuilder,
    accountImpactEnricher,
  } =
    resolveDependencies(
      dependencies
    )

  const safeProjects =
    Array.isArray(
      projects
    )
      ? projects
      : []

  const safeCollection =
    Array.isArray(
      pokemonCollection
    )
      ? pokemonCollection
      : []

  const currentProjects =
    getCurrentProjects(
      safeProjects
    )

  const removedProjects =
    getRemovedProjects(
      safeProjects
    )

  const raidDashboard =
    raidDashboardBuilder(
      safeCollection
    )

  const currentRaidProfile =
    raidTypeProfileBuilder(
      safeCollection
    )

  const evaluatedProjects =
    currentProjects.map(
      project => {
        const ownedPokemon =
          findProjectCollectionPokemon({
            pokemonCollection:
              safeCollection,

            collectionId:
              project
                ?.collectionId,
          })

        const plan =
          projectPlanBuilder({
            project,

            raidDashboard,

            currentProfile:
              currentRaidProfile,

            accountImpactEnricher,
          })

        return {
          project,

          ownedPokemon,

          plan,
        }
      }
    )

  return {
    raidDashboard,

    currentRaidProfile,

    currentProjects,

    removedProjects,

    evaluatedProjects,

    projectCount:
      currentProjects.length,

    removedProjectCount:
      removedProjects.length,
  }
}

export default buildRaidProjectIntelligence