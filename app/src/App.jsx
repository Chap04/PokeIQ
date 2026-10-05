import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import './App.css'

import Dashboard from './pages/Dashboard.jsx'
import RaidProfile from './pages/RaidProfile.jsx'
import RaidBossAnalysis from './pages/RaidBossAnalysis.jsx'
import Projects from './pages/Projects.jsx'
import Collection from './pages/Collection.jsx'
import Resources from './pages/Resources.jsx'
import Imports from './pages/Imports.jsx'
import ImportMethod from './pages/ImportMethod.jsx'
import ManualEntry from './pages/ManualEntry.jsx'
import ImportReview from './pages/ImportReview.jsx'
import DeveloperTools from './pages/DeveloperTools.jsx'
import VisionLab from './pages/VisionLab.jsx'
import RecordingLab from './pages/RecordingLab.jsx'

import {
  applyImportResults,
} from './services/applyImportResults.js'

import {
  buildProjectFromRaidRecommendation,
} from './services/buildProjectFromRaidRecommendation.js'

import {
  buildRaidDashboard,
} from './services/buildRaidDashboard.js'

import {
  buildRaidProjectPlan,
  RAID_PROJECT_PLAN_STATUS,
} from './services/buildRaidProjectPlan.js'

import {
  buildRaidTypeProfile,
} from './services/buildRaidTypeProfile.js'

import {
  buildRaidProjectIntelligence,
} from './services/buildRaidProjectIntelligence.js'

import {
  enrichRaidRecommendationWithAccountImpact,
  enrichRaidRecommendationsWithAccountImpact,
} from './services/enrichRaidRecommendationsWithAccountImpact.js'

import {
  selectRaidTypeRecommendations,
} from './services/selectRaidTypeRecommendations.js'

import {
  PROJECT_HISTORY_RECORD_TYPE,
  reconcileProjectHistory,
} from './services/reconcileProjectHistory.js'

import {
  PROJECT_BUILD_STATUS,
  PROJECT_STATUS,
} from './utils/projectConstants.js'

import {
  findMatchingProjectForRecommendation,
} from './utils/projectMatching.js'

import {
  createTestCollection,
  createDuplicateScenario,
  createEvolutionScenario,
  createBrandNewTrainerScenario,
  createMessyCollectionScenario,
} from './mock/developerScenarios.js'

const COLLECTION_STORAGE_KEY =
  'pokeiq-pokemon-collection'

const RESOURCE_STORAGE_KEY =
  'pokeiq-player-resources'

const CANDY_FAMILY_STORAGE_KEY =
  'pokeiq-candy-family-balances'

const PROJECT_STORAGE_KEY =
  'pokeiq-projects'

const PROJECT_ACTION_STORAGE_KEY =
  'pokeiq-project-actions'

const DEFAULT_PLAYER_RESOURCES = {
  stardust: null,
  rareCandy: null,
  rareCandyXl: null,
  fastTms: null,
  chargedTms: null,
  eliteFastTms: null,
  eliteChargedTms: null,
}

const RAID_PROJECT_INTELLIGENCE_DEPENDENCIES = {
  raidDashboardBuilder:
    buildRaidDashboard,

  raidTypeProfileBuilder:
    buildRaidTypeProfile,

  projectPlanBuilder:
    buildRaidProjectPlan,

  accountImpactEnricher:
    enrichRaidRecommendationWithAccountImpact,
}

function loadStoredArray(
  storageKey
) {
  const savedValue =
    localStorage.getItem(
      storageKey
    )

  if (!savedValue) {
    return []
  }

  try {
    const parsedValue =
      JSON.parse(
        savedValue
      )

    return Array.isArray(
      parsedValue
    )
      ? parsedValue
      : []
  } catch {
    return []
  }
}

function App() {
  const [
    currentPage,
    setCurrentPage,
  ] =
    useState(
      'dashboard'
    )

  const [
    selectedImportMethod,
    setSelectedImportMethod,
  ] =
    useState(
      null
    )

  const [
    pendingImport,
    setPendingImport,
  ] =
    useState(
      null
    )

  const [
    editingPokemon,
    setEditingPokemon,
  ] =
    useState(
      null
    )

  const [
    pokemonCollection,
    setPokemonCollection,
  ] =
    useState(
      () => {
        const savedCollection =
          localStorage.getItem(
            COLLECTION_STORAGE_KEY
          )

        if (
          !savedCollection
        ) {
          return []
        }

        try {
          return JSON.parse(
            savedCollection
          )
        } catch {
          return []
        }
      }
    )

  const [
    playerResources,
    setPlayerResources,
  ] =
    useState(
      () => {
        const savedResources =
          localStorage.getItem(
            RESOURCE_STORAGE_KEY
          )

        if (
          !savedResources
        ) {
          return {
            ...DEFAULT_PLAYER_RESOURCES,
          }
        }

        try {
          const parsedResources =
            JSON.parse(
              savedResources
            )

          return {
            ...DEFAULT_PLAYER_RESOURCES,
            ...parsedResources,
          }
        } catch {
          return {
            ...DEFAULT_PLAYER_RESOURCES,
          }
        }
      }
    )

  const [
    candyFamilyBalances,
    setCandyFamilyBalances,
  ] =
    useState(
      () => {
        const savedCandyFamilyBalances =
          localStorage.getItem(
            CANDY_FAMILY_STORAGE_KEY
          )

        if (
          !savedCandyFamilyBalances
        ) {
          return {}
        }

        try {
          const parsedCandyFamilyBalances =
            JSON.parse(
              savedCandyFamilyBalances
            )

          if (
            !parsedCandyFamilyBalances ||
            typeof parsedCandyFamilyBalances !==
              'object' ||
            Array.isArray(
              parsedCandyFamilyBalances
            )
          ) {
            return {}
          }

          return parsedCandyFamilyBalances
        } catch {
          return {}
        }
      }
    )

  const [
    projects,
    setProjects,
  ] =
    useState(
      () =>
        loadStoredArray(
          PROJECT_STORAGE_KEY
        )
    )

  const [
    projectActions,
    setProjectActions,
  ] =
    useState(
      () =>
        loadStoredArray(
          PROJECT_ACTION_STORAGE_KEY
        )
    )

    const projectIntelligence =
    useMemo(
      () =>
        buildRaidProjectIntelligence({
          projects,

          pokemonCollection,

          dependencies:
            RAID_PROJECT_INTELLIGENCE_DEPENDENCIES,
        }),
      [
        projects,
        pokemonCollection,
      ]
    )

  const raidTypeProfile =
    useMemo(
      () =>
        buildRaidTypeProfile(
          pokemonCollection
        ),
      [
        pokemonCollection,
      ]
    )

  const raidDashboard =
    useMemo(
      () =>
        buildRaidDashboard(
          pokemonCollection
        ),
      [
        pokemonCollection,
      ]
    )

  const enrichedRaidRecommendations =
    useMemo(
      () =>
        enrichRaidRecommendationsWithAccountImpact({
          recommendations:
            raidDashboard
              ?.recommendations ??
            [],

          currentProfile:
            raidTypeProfile,
        }),
      [
        raidDashboard,
        raidTypeProfile,
      ]
    )

  const excludedRaidRecommendationCollectionIds =
    useMemo(
      () =>
        new Set(
          projects
            .filter(
              project =>
                project?.status ===
                  PROJECT_STATUS
                    .ACTIVE ||
                project?.status ===
                  PROJECT_STATUS
                    .PAUSED
            )
            .map(
              project =>
                project
                  ?.collectionId
            )
            .filter(Boolean)
        ),
      [
        projects,
      ]
    )

  const raidTypeRecommendations =
    useMemo(
      () =>
        selectRaidTypeRecommendations({
          recommendations:
            enrichedRaidRecommendations
              ?.recommendations ??
            [],

          excludedCollectionIds:
            excludedRaidRecommendationCollectionIds,
        }),
      [
        enrichedRaidRecommendations,
        excludedRaidRecommendationCollectionIds,
      ]
    )
  useEffect(
    () => {
      localStorage.setItem(
        COLLECTION_STORAGE_KEY,
        JSON.stringify(
          pokemonCollection
        )
      )
    },
    [
      pokemonCollection,
    ]
  )

  useEffect(
    () => {
      localStorage.setItem(
        RESOURCE_STORAGE_KEY,
        JSON.stringify(
          playerResources
        )
      )
    },
    [
      playerResources,
    ]
  )

  useEffect(
    () => {
      localStorage.setItem(
        CANDY_FAMILY_STORAGE_KEY,
        JSON.stringify(
          candyFamilyBalances
        )
      )
    },
    [
      candyFamilyBalances,
    ]
  )

  useEffect(
    () => {
      localStorage.setItem(
        PROJECT_STORAGE_KEY,
        JSON.stringify(
          projects
        )
      )
    },
    [
      projects,
    ]
  )

  useEffect(
    () => {
      localStorage.setItem(
        PROJECT_ACTION_STORAGE_KEY,
        JSON.stringify(
          projectActions
        )
      )
    },
    [
      projectActions,
    ]
  )

  useEffect(
    () => {
      const entries =
        Array.isArray(
          projectIntelligence
            ?.evaluatedProjects
        )
          ? projectIntelligence
              .evaluatedProjects
          : []

      if (
        entries.length ===
        0
      ) {
        return
      }

      const now =
        new Date()
          .toISOString()

      setProjectActions(
        currentRecords => {
          let nextRecords =
            currentRecords

          let changed =
            false

          for (
            const entry
            of entries
          ) {
            if (
              !entry?.project ||
              !entry?.ownedPokemon ||
              entry?.plan?.status !==
                RAID_PROJECT_PLAN_STATUS
                  .SUCCESS
            ) {
              continue
            }

            const result =
              reconcileProjectHistory({
                project:
                  entry.project,

                plan:
                  entry.plan,

                ownedPokemon:
                  entry.ownedPokemon,

                existingRecords:
                  nextRecords,

                now,
              })

            const recordsToAdd =
              Array.isArray(
                result
                  ?.recordsToAdd
              )
                ? result
                    .recordsToAdd
                : []

            if (
              recordsToAdd.length ===
              0
            ) {
              continue
            }

            if (
              !changed
            ) {
              nextRecords = [
                ...currentRecords,
              ]

              changed =
                true
            }

            nextRecords.push(
              ...recordsToAdd
            )
          }

          return changed
            ? nextRecords
            : currentRecords
        }
      )
    },
    [
      projectIntelligence,
    ]
  )

  function openPage(
    page
  ) {
    setEditingPokemon(
      null
    )

    if (
      page !==
      'import-review'
    ) {
      setPendingImport(
        null
      )
    }

    setCurrentPage(
      page
    )
  }

  function openManualEntry(
    pokemon = null
  ) {
    setEditingPokemon(
      pokemon
    )

    setCurrentPage(
      'manual-entry'
    )
  }

  function addPokemon(
    newPokemon
  ) {
    setPokemonCollection(
      currentCollection => [
        ...currentCollection,
        newPokemon,
      ]
    )

    setEditingPokemon(
      null
    )

    setCurrentPage(
      'collection'
    )
  }

  function updatePokemon(
    updatedPokemon
  ) {
    setPokemonCollection(
      currentCollection =>
        currentCollection.map(
          pokemon =>
            pokemon.id ===
            updatedPokemon.id
              ? updatedPokemon
              : pokemon
        )
    )

    setEditingPokemon(
      null
    )

    setCurrentPage(
      'collection'
    )
  }

  function deletePokemon(
    pokemonId
  ) {
    setPokemonCollection(
      currentCollection =>
        currentCollection.filter(
          pokemon =>
            pokemon.id !==
            pokemonId
        )
    )

    if (
      editingPokemon?.id ===
      pokemonId
    ) {
      setEditingPokemon(
        null
      )
    }
  }

  function clearCollection() {
    setPokemonCollection(
      []
    )

    setEditingPokemon(
      null
    )
  }

  function updatePlayerResource(
    resourceKey,
    value
  ) {
    setPlayerResources(
      currentResources => ({
        ...currentResources,

        [resourceKey]:
          value,
      })
    )
  }

  function clearPlayerResources() {
    setPlayerResources({
      ...DEFAULT_PLAYER_RESOURCES,
    })
  }

  function updateCandyFamilyBalance(
    candyFamilyId,
    resourceKey,
    value
  ) {
    if (
      !candyFamilyId ||
      (
        resourceKey !==
          'candy' &&
        resourceKey !==
          'candyXL'
      )
    ) {
      return
    }

    setCandyFamilyBalances(
      currentBalances => {
        const currentFamilyBalance =
          currentBalances[
            candyFamilyId
          ] ?? {}

        return {
          ...currentBalances,

          [candyFamilyId]: {
            ...currentFamilyBalance,

            [resourceKey]:
              value,

            updatedAt:
              new Date()
                .toISOString(),
          },
        }
      }
    )
  }

  function addRaidRecommendationProject(
    recommendation
  ) {
    const existingProject =
      findMatchingProjectForRecommendation(
        projects,
        recommendation
      )

    if (
      existingProject
    ) {
      return {
        success: false,
        duplicate: true,

        status:
          'DUPLICATE_PROJECT',

        project:
          existingProject,
      }
    }

    const buildResult =
      buildProjectFromRaidRecommendation({
        recommendation,
      })

    if (
      buildResult.status !==
        PROJECT_BUILD_STATUS
          .SUCCESS ||
      !buildResult.project
    ) {
      return {
        success: false,
        duplicate: false,

        status:
          buildResult.status,

        project: null,
      }
    }

    setProjects(
      currentProjects => [
        ...currentProjects,
        buildResult.project,
      ]
    )

    setProjectActions(
      currentActions => [
        ...currentActions,
        ...buildResult.actions,
      ]
    )

    return {
      success: true,
      duplicate: false,

      status:
        buildResult.status,

      project:
        buildResult.project,
    }
  }

  function updateProjectStatus(
    projectId,
    status
  ) {
    if (
      !projectId ||
      !Object.values(
        PROJECT_STATUS
      ).includes(
        status
      )
    ) {
      return
    }

    const now =
      new Date()
        .toISOString()

    setProjects(
      currentProjects =>
        currentProjects.map(
          project => {
            if (
              project?.id !==
              projectId
            ) {
              return project
            }

            if (
              status ===
              PROJECT_STATUS
                .PAUSED
            ) {
              return {
                ...project,

                status,

                updatedAt:
                  now,

                pausedAt:
                  now,

                abandonedAt:
                  null,
              }
            }

            if (
              status ===
              PROJECT_STATUS
                .ABANDONED
            ) {
              return {
                ...project,

                status,

                updatedAt:
                  now,

                pausedAt:
                  null,

                abandonedAt:
                  now,
              }
            }

            if (
              status ===
              PROJECT_STATUS
                .ACTIVE
            ) {
              return {
                ...project,

                status,

                updatedAt:
                  now,

                pausedAt:
                  null,

                abandonedAt:
                  null,

                completedAt:
                  null,
              }
            }

            return {
              ...project,

              status,

              updatedAt:
                now,
            }
          }
        )
    )
  }

  function pauseProject(
    projectId
  ) {
    updateProjectStatus(
      projectId,
      PROJECT_STATUS.PAUSED
    )
  }

  function resumeProject(
    projectId
  ) {
    updateProjectStatus(
      projectId,
      PROJECT_STATUS.ACTIVE
    )
  }

  function removeProject(
    projectId
  ) {
    updateProjectStatus(
      projectId,
      PROJECT_STATUS.ABANDONED
    )
  }

  function resetProjectHistoryBaseline(
    projectId
  ) {
    if (
      !projectId
    ) {
      return
    }

    setProjectActions(
      currentRecords => {
        const nextRecords =
          currentRecords.filter(
            record => {
              const recordType =
                record
                  ?.recordType ??
                record
                  ?.type

              const isProjectSnapshot =
                record
                  ?.projectId ===
                  projectId &&
                recordType ===
                  PROJECT_HISTORY_RECORD_TYPE
                    .STATE_SNAPSHOT

              return (
                !isProjectSnapshot
              )
            }
          )

        return (
          nextRecords.length ===
          currentRecords.length
            ? currentRecords
            : nextRecords
        )
      }
    )
  }

  function restoreProject(
    projectId
  ) {
    resetProjectHistoryBaseline(
      projectId
    )

    updateProjectStatus(
      projectId,
      PROJECT_STATUS.ACTIVE
    )
  }

  function cancelManualEntry() {
    setEditingPokemon(
      null
    )

    setCurrentPage(
      'collection'
    )
  }

  function openImportMethod(
    method
  ) {
    if (
      method ===
      'manual'
    ) {
      openManualEntry()
      return
    }

    setPendingImport(
      null
    )

    setSelectedImportMethod(
      method
    )

    setCurrentPage(
      'import-method'
    )
  }

  function openImportReview(
    importPayload
  ) {
    setPendingImport(
      importPayload
    )

    setCurrentPage(
      'import-review'
    )
  }

  function returnToImports() {
    setPendingImport(
      null
    )

    setSelectedImportMethod(
      null
    )

    setCurrentPage(
      'imports'
    )
  }

  function confirmImport(
    reviewItems
  ) {
    setPokemonCollection(
      currentCollection =>
        applyImportResults(
          currentCollection,
          reviewItems
        )
    )

    setPendingImport(
      null
    )

    setSelectedImportMethod(
      null
    )

    setCurrentPage(
      'collection'
    )
  }

  function openVisionLab() {
    setCurrentPage(
      'vision-lab'
    )
  }

  function openRecordingLab() {
    setCurrentPage(
      'recording-lab'
    )
  }

  function returnToDeveloperTools() {
    setCurrentPage(
      'developer'
    )
  }

  function addGeneratedPokemon(
    generatedPokemon
  ) {
    setPokemonCollection(
      currentCollection => [
        ...currentCollection,
        ...generatedPokemon,
      ]
    )
  }

  function generateTestCollection() {
    addGeneratedPokemon(
      createTestCollection()
    )
  }

  function generateDuplicateScenario() {
    addGeneratedPokemon(
      createDuplicateScenario()
    )
  }

  function generateEvolutionScenario() {
    addGeneratedPokemon(
      createEvolutionScenario()
    )
  }

  function generateBrandNewTrainerScenario() {
    setPokemonCollection(
      createBrandNewTrainerScenario()
    )
  }

  function generateMessyCollectionScenario() {
    setPokemonCollection(
      createMessyCollectionScenario()
    )
  }

  const developerPageActive =
    currentPage ===
      'developer' ||
    currentPage ===
      'vision-lab' ||
    currentPage ===
      'recording-lab'

  const activeProjectCount =
    projectIntelligence
      ?.projectCount ??
    0

  return (
    <>
      <nav className="main-nav">
        <button
          className={
            currentPage ===
            'dashboard'
              ? 'nav-button active'
              : 'nav-button'
          }
          onClick={() =>
            openPage(
              'dashboard'
            )
          }
        >
          Dashboard
        </button>

                <button
          className={
            currentPage ===
            'raid-profile'
              ? 'nav-button active'
              : 'nav-button'
          }
          onClick={() =>
            openPage(
              'raid-profile'
            )
          }
        >
          Raid Profile
        </button>

        <button
          className={
            currentPage ===
            'raid-boss-analysis'
              ? 'nav-button active'
              : 'nav-button'
          }
          onClick={() =>
            openPage(
              'raid-boss-analysis'
            )
          }
        >
          Boss Analysis
        </button>

        <button
          className={
            currentPage ===
            'projects'
              ? 'nav-button active'
              : 'nav-button'
          }
          onClick={() =>
            openPage(
              'projects'
            )
          }
        >
          Projects
          {activeProjectCount > 0
            ? ` (${activeProjectCount})`
            : ''}
        </button>

        <button
          className={
            developerPageActive
              ? 'nav-button active'
              : 'nav-button'
          }
          onClick={() =>
            openPage(
              'developer'
            )
          }
        >
          Developer
        </button>

        <button
          className={
            currentPage ===
              'collection' ||
            currentPage ===
              'manual-entry'
              ? 'nav-button active'
              : 'nav-button'
          }
          onClick={() =>
            openPage(
              'collection'
            )
          }
        >
          Collection
        </button>

        <button
          className={
            currentPage ===
              'resources'
              ? 'nav-button active'
              : 'nav-button'
          }
          onClick={() =>
            openPage(
              'resources'
            )
          }
        >
          Resources
        </button>

        <button
          className={
            currentPage ===
              'imports' ||
            currentPage ===
              'import-method' ||
            currentPage ===
              'import-review'
              ? 'nav-button active'
              : 'nav-button'
          }
          onClick={() =>
            openPage(
              'imports'
            )
          }
        >
          Imports
        </button>
      </nav>

      {currentPage ===
        'dashboard' && (
        <Dashboard
          pokemonCollection={
            pokemonCollection
          }
          playerResources={
            playerResources
          }
          candyFamilyBalances={
            candyFamilyBalances
          }
          projects={
            projects
          }
          onAddProject={
            addRaidRecommendationProject
          }
          onUpdateCandyFamilyBalance={
            updateCandyFamilyBalance
          }
        />
      )}

                  {currentPage ===
        'raid-profile' && (
        <RaidProfile
          raidTypeProfile={
            raidTypeProfile
          }

          raidTypeRecommendations={
            raidTypeRecommendations
              .byType
          }
        />
      )}

      {currentPage ===
        'raid-boss-analysis' && (
        <RaidBossAnalysis
          pokemonCollection={
            pokemonCollection
          }
        />
      )}

      {currentPage ===
        'projects' && (
        <Projects
          projectIntelligence={
            projectIntelligence
          }
          projectActions={
            projectActions
          }
          pokemonCollection={
            pokemonCollection
          }
          playerResources={
            playerResources
          }
          candyFamilyBalances={
            candyFamilyBalances
          }
          onUpdateCandyFamilyBalance={
            updateCandyFamilyBalance
          }
          onPauseProject={
            pauseProject
          }
          onResumeProject={
            resumeProject
          }
          onRemoveProject={
            removeProject
          }
          onRestoreProject={
            restoreProject
          }
        />
      )}

      {currentPage ===
        'collection' && (
        <Collection
          pokemonCollection={
            pokemonCollection
          }
          onAddPokemon={() =>
            openManualEntry()
          }
          onEditPokemon={
            openManualEntry
          }
          onDeletePokemon={
            deletePokemon
          }
          onClearCollection={
            clearCollection
          }
        />
      )}

      {currentPage ===
        'manual-entry' && (
        <ManualEntry
          editingPokemon={
            editingPokemon
          }
          onAddPokemon={
            addPokemon
          }
          onUpdatePokemon={
            updatePokemon
          }
          onCancel={
            cancelManualEntry
          }
        />
      )}

      {currentPage ===
        'resources' && (
        <Resources
          pokemonCollection={
            pokemonCollection
          }
          playerResources={
            playerResources
          }
          candyFamilyBalances={
            candyFamilyBalances
          }
          onUpdateResource={
            updatePlayerResource
          }
          onUpdateCandyFamilyBalance={
            updateCandyFamilyBalance
          }
          onClearResources={
            clearPlayerResources
          }
        />
      )}

      {currentPage ===
        'imports' && (
        <Imports
          onSelectMethod={
            openImportMethod
          }
        />
      )}

      {currentPage ===
        'import-method' && (
        <ImportMethod
          method={
            selectedImportMethod
          }
          onBack={
            returnToImports
          }
          onContinue={
            openImportReview
          }
        />
      )}

      {currentPage ===
        'import-review' && (
        <ImportReview
          pokemonCollection={
            pokemonCollection
          }
          importPayload={
            pendingImport
          }
          onBack={
            returnToImports
          }
          onConfirmImport={
            confirmImport
          }
        />
      )}

      {currentPage ===
        'developer' && (
        <DeveloperTools
          collectionCount={
            pokemonCollection.length
          }
          onGenerateTestCollection={
            generateTestCollection
          }
          onGenerateBrandNewTrainer={
            generateBrandNewTrainerScenario
          }
          onGenerateMessyCollection={
            generateMessyCollectionScenario
          }
          onClearCollection={
            clearCollection
          }
          onGenerateDuplicateScenario={
            generateDuplicateScenario
          }
          onGenerateEvolutionScenario={
            generateEvolutionScenario
          }
          onOpenVisionLab={
            openVisionLab
          }
          onOpenRecordingLab={
            openRecordingLab
          }
        />
      )}

      {currentPage ===
        'vision-lab' && (
        <VisionLab
          onBack={
            returnToDeveloperTools
          }
        />
      )}

      {currentPage ===
        'recording-lab' && (
        <RecordingLab
          onBack={
            returnToDeveloperTools
          }
        />
      )}
    </>
  )
}

export default App