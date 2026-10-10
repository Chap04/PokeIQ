import {
  useEffect,
  useMemo,
  useRef,
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

import {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
} from './lib/auth'

import {
  saveCollection,
  loadCollection,
} from './lib/collections'

import {
  saveProjects,
  loadProjects,
} from './lib/projects'

import {
  getProfile,
  saveProfile,
} from './lib/profile'

import { supabase } from './lib/supabase'

import {
  saveResources,
  loadResources,
} from './lib/resources'

import {
  saveCandyBalances,
  loadCandyBalances,
} from './lib/candyBalances'

import Account from './pages/Account.jsx'

console.log('Supabase connected:', supabase)

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

    
const [currentUser, setCurrentUser] =
  useState(null)

const [email, setEmail] =
  useState('')

const [password, setPassword] =
  useState('')

  const [isLoading, setIsLoading] =
  useState(true)

  const [displayName, setDisplayName] =
  useState('')
  
  const [
  memberSince,
  setMemberSince,
] = useState(null)

  const [
  lastSyncTime,
  setLastSyncTime,
] = useState(null)

  const [
  editableDisplayName,
  setEditableDisplayName,
] = useState(displayName)

useEffect(() => {
  setEditableDisplayName(
    displayName
  )
}, [displayName])

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

  useEffect(() => {
    async function initializeUser() {
      try {
        const user =
  await getCurrentUser()

setCurrentUser(user)

if (!user) {
  return
}

const profile =
  await getProfile(user.id)

if (profile) {
  setDisplayName(
    profile.display_name
  )

  setEditableDisplayName(
    profile.display_name
  )

  setMemberSince(
    profile.created_at
  )
}

        const cloudCollection =
          await loadCollection(
            user.id
          )

          const cloudProjects =
  await loadProjects(
    user.id
  )

  const cloudResources =
  await loadResources(user.id)

if (cloudResources) {
  setPlayerResources(
    cloudResources
  )
}

const cloudCandyBalances =
  await loadCandyBalances(
    user.id
  )

if (cloudCandyBalances) {
  setCandyFamilyBalances(
    cloudCandyBalances
  )

  console.log(
    'Loaded candy balances from cloud'
  )
}

if (
  Array.isArray(
    cloudProjects
  )
) {
  setProjects(
    cloudProjects
  )

  console.log(
    'Loaded projects from cloud'
  )
}

        if (
          Array.isArray(
            cloudCollection
          ) &&
          cloudCollection.length > 0
        ) {
          setPokemonCollection(
            cloudCollection
          )

          console.log(
            'Loaded collection from cloud'
          )
        }
            } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeUser()
  }, [])

  useEffect(() => {
  async function syncToCloud() {
    if (!currentUser) {
      return
    }

    await saveCollection(
      currentUser.id,
      pokemonCollection
    )

    await saveProjects(
      currentUser.id,
      projects
    )

    await saveResources(
  currentUser.id,
  playerResources
)

await saveCandyBalances(
  currentUser.id,
  candyFamilyBalances
)

setLastSyncTime(
  new Date().toLocaleString()
)
  }

  syncToCloud()
}, [
  currentUser,
  pokemonCollection,
  projects,
  playerResources,
  candyFamilyBalances,
])

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

async function handleSignUp() {
  try {
    await signUp(
      email,
      password
    )

    alert(
      'Check your email for verification.'
    )
  } catch (error) {
    console.error(error)
    alert(error.message)
  }
}

async function handleLogin() {
  try {
    const result =
      await signIn(
        email,
        password
      )

    setCurrentUser(
      result.user
    )

    const profile =
  await getProfile(
    result.user.id
  )

if (profile) {
  setDisplayName(
    profile.display_name
  )

  setEditableDisplayName(
    profile.display_name
  )
}

setMemberSince(
  profile.created_at
)

    alert('Logged in')
  } catch (error) {
    console.error(error)
    alert(error.message)
  }
}

async function handleLogout() {
  try {
    await signOut()

    setCurrentUser(null)

    setDisplayName('')

    setEditableDisplayName('')

    setMemberSince(null)

    setCurrentPage(
      'dashboard'
    )

    alert('Logged out')
  } catch (error) {
    console.error(error)
  }
}

  function openPage(
  page
) {
  if (
    !currentUser &&
    page !== 'dashboard'
  ) {
    alert(
      'Please log in to access trainer data.'
    )

    return
  }

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

const showDeveloperTools =
  import.meta.env.DEV

  const activeProjectCount =
  projects.filter(
    project =>
      project?.status !==
      PROJECT_STATUS.ABANDONED
  ).length

    const trainerIntelligence =
    useMemo(() => {
      const warnings = []

      let recommendation =
  'Continue progressing your active projects.'

      if (activeProjectCount > 3) {
  warnings.push(
    'You have several active projects.'
  )

  recommendation =
    'Focus on completing active projects before starting new ones.'
}

      if (
  playerResources.stardust &&
  playerResources.stardust < 100000
) {
  warnings.push(
    'Low Stardust reserves.'
  )

  recommendation =
    'Prioritize Stardust farming before making major investments.'
}

      if (
  pokemonCollection.length === 0
) {
  warnings.push(
    'Build your collection to unlock recommendations.'
  )

  recommendation =
    'Import or add Pokémon to unlock raid analysis.'
}

      return {
  status:
    warnings.length === 0
      ? 'Healthy'
      : 'Needs Attention',

  warnings,

  recommendation,

  projectCount:
    activeProjectCount,

  pokemonCount:
    pokemonCollection.length,
}

    }, [
      activeProjectCount,
      playerResources,
      pokemonCollection,
    ])

  const avatarLetter =
    displayName
      ?.charAt(0)
      ?.toUpperCase() || 'T'

const authControlStyle = {
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #2a3347',
  backgroundColor: '#101827',
  color: 'white',
}

const authButtonStyle = {
  padding: '10px 18px',
  borderRadius: '8px',
  border: '1px solid #3b4b6b',
  backgroundColor: '#2a3347',
  color: 'white',
  cursor: 'pointer',
}

if (isLoading) {
  return (
    <div
      style={{
        padding: '40px',
        textAlign: 'center',
      }}
    >
      <h2>
        Loading PokeIQ...
      </h2>

      <p>
        Syncing your trainer data.
      </p>
    </div>
  )
}

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
  ? ' (' + activeProjectCount + ')'
  : ''}
        </button>

        {showDeveloperTools && (
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
)}

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

        <button
  className={
    currentPage === 'account'
      ? 'nav-button active'
      : 'nav-button'
  }
  onClick={() =>
    openPage('account')
  }
>
  Account
</button>
      </nav>

      {currentUser ? (
        <div
          style={{
            padding: '10px',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          <button
  onClick={() =>
    openPage('account')
  }
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'none',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: 'inherit',
    padding: 0,
  }}
>
  <div
    style={{
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      background: '#6d4aff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      color: 'white',
    }}
  >
    {avatarLetter}
  </div>

  <span>{displayName}</span>
</button>

        </div>
      ) : (
        <div
          style={{
            padding: '10px',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          <input
  type="email"
  placeholder="Email"
  value={email}
  onChange={event =>
    setEmail(event.target.value)
  }
  style={authControlStyle}
/>

          <input
  type="password"
  placeholder="Password"
  value={password}
  onChange={event =>
    setPassword(event.target.value)
  }
  style={authControlStyle}
/>

          <button
  onClick={handleLogin}
  style={authButtonStyle}
>
  Login
</button>

         <button
  onClick={handleSignUp}
  style={authButtonStyle}
>
  Sign Up
</button>
        </div>
      )}

      {currentPage ===
  'dashboard' && (
  currentUser ? (
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
      trainerIntelligence={
        trainerIntelligence
      }
    />
  ) : (
    <div
      style={{
        textAlign: 'center',
        padding: '60px',
      }}
    >
      <h1>Welcome to PokeIQ</h1>

      <p>
        Sign in to access your trainer
        data, projects, raid analysis,
        and recommendations.
      </p>
    </div>
  )
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

      {currentPage === 'account' && (
        <Account
          currentUser={currentUser}
          displayName={displayName}
          editableDisplayName={editableDisplayName}
          setEditableDisplayName={setEditableDisplayName}
          setDisplayName={setDisplayName}
          memberSince={memberSince}
          pokemonCount={pokemonCollection.length}
          projectCount={activeProjectCount}
          currentUserId={currentUser?.id}
          lastSyncTime={lastSyncTime}
          pokemonCollection={pokemonCollection}
projects={projects}
playerResources={playerResources}
candyFamilyBalances={candyFamilyBalances}
setPokemonCollection={setPokemonCollection}
  setProjects={setProjects}
  setPlayerResources={setPlayerResources}
  setCandyFamilyBalances={setCandyFamilyBalances}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'vision-lab' && (
        <VisionLab
          onBack={returnToDeveloperTools}
        />
      )}

      {currentPage === 'recording-lab' && (
        <RecordingLab
          onBack={returnToDeveloperTools}
        />
      )}
    </>
  )
}

export default App;