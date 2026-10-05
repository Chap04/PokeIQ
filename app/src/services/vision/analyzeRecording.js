import {
  extractRecordingFrames,
  waitForVideoEvent,
} from './extractRecordingFrames'

import {
  findStorageGridAlignment,
} from './findStorageGridAlignment'

import {
  measureStorageFrameMovement,
} from './measureStorageFrameMovement'

import {
  detectStorageRegions,
} from './detectStorageRegions'

import {
  cropStorageRegions,
} from './cropStorageRegions'

import {
  analyzeStorageCrop,
} from './analyzeStorageCrop'

import {
  getAllPokemonReferences,
} from '../../utils/pokemonReference'

import {
  calculatePokemonCp,
  getCpmForLevel,
} from '../../utils/pokemonLevel'

// --------------------------------------------------
// Recording Analysis V7S
//
// V7S introduces position-level species reuse.
//
// The first successfully resolved species for a
// tracked absolute position is retained.
//
// Subsequent OCR appearances for that same position
// reuse the known species and skip:
//
// - name preprocessing
// - name Tesseract OCR
// - species resolution
//
// Preserved:
// - V7R sparse OCR alignment
// - V7R.1 checkpoint diagnostics
// - V7H list-space tracking
// - V7K semantic occupancy
// - V7M appearance selection
// - V7N adaptive stopping
// - V7O species-aware CP plausibility
// - V7P performance diagnostics
// - all three CP OCR passes
// - recording reviewImage evidence
//
// V7S intentionally does NOT change:
// - CP crop geometry
// - CP preprocessing
// - CP OCR thresholds
// - CP consensus
// - cross-appearance CP selection
// - semantic occupancy rules
// - tracking identity
// - alignment checkpoint frequency
//
// Goal:
//
// Reduce repeated name OCR work without weakening
// the existing CP or tracking accuracy architecture.
// --------------------------------------------------

const DEFAULT_FRAME_INTERVAL =
  0.25

const MAX_PHASE_ROWS =
  3

const WEAK_IMAGE_SCORE =
  0.60

const MIN_MEANINGFUL_MOVEMENT =
  20

const RECENT_MOVEMENT_COUNT =
  4

const STORAGE_TOP_RATIO =
  0.19

const STORAGE_BOTTOM_RATIO =
  0.99

const MAX_OCR_ATTEMPTS_PER_POSITION =
  4

const MAX_CP_LEVEL =
  51

const MAX_CP_IV =
  15

// --------------------------------------------------
// V7R sparse-alignment settings
// --------------------------------------------------

const ALIGNMENT_CHECKPOINT_INTERVAL =
  4

// --------------------------------------------------
// Performance helpers
// --------------------------------------------------

function getNow() {
  if (
    typeof performance !== 'undefined' &&
    typeof performance.now === 'function'
  ) {
    return performance.now()
  }

  return Date.now()
}

function getElapsedMs(
  startTime
) {
  return (
    getNow() -
    startTime
  )
}

function createPerformanceTotals() {
  return {
    videoLoadMs:
      0,

    frameExtractionMs:
      0,

    alignmentMs:
      0,

    movementMs:
      0,

    detectionTrackingMs:
      0,

    cropMs:
      0,

    storageAnalysisMs:
      0,

    imageLoadMs:
      0,

    cpPreprocessingMs:
      0,

    cpNormalOcrMs:
      0,

    cpStrongOcrMs:
      0,

    cpThresholdOcrMs:
      0,

    cpOcrMs:
      0,

    cpConsensusMs:
      0,

    cpTotalMs:
      0,

    namePreprocessingMs:
      0,

    nameOcrMs:
      0,

    speciesResolutionMs:
      0,

    storageOtherMs:
      0,

    storageTotalMs:
      0,

    totalMs:
      0,

    alignmentFullFrames:
      0,

    alignmentCheckpointFrames:
      0,

    alignmentPredictedFrames:
      0,

    /*
      V7S counters.

      These describe storage-crop analysis only.

      nameOcrCalls:
      Number of appearances that actually ran name
      Tesseract OCR.

      knownSpeciesReuses:
      Number of appearances that reused a species
      established earlier for the same absolute
      position.
    */

    nameOcrCalls:
      0,

    knownSpeciesReuses:
      0,
  }
}

function addStoragePerformance(
  totals,
  performanceData
) {
  if (!performanceData) {
    return
  }

  totals.imageLoadMs +=
    performanceData.imageLoadMs ??
    0

  totals.cpPreprocessingMs +=
    performanceData.cpPreprocessingMs ??
    0

  totals.cpNormalOcrMs +=
    performanceData.cpNormalOcrMs ??
    0

  totals.cpStrongOcrMs +=
    performanceData.cpStrongOcrMs ??
    0

  totals.cpThresholdOcrMs +=
    performanceData.cpThresholdOcrMs ??
    0

  totals.cpOcrMs +=
    performanceData.cpOcrMs ??
    0

  totals.cpConsensusMs +=
    performanceData.cpConsensusMs ??
    0

  totals.cpTotalMs +=
    performanceData.cpTotalMs ??
    0

  totals.namePreprocessingMs +=
    performanceData.namePreprocessingMs ??
    0

  totals.nameOcrMs +=
    performanceData.nameOcrMs ??
    0

  totals.speciesResolutionMs +=
    performanceData.speciesResolutionMs ??
    0

  totals.storageOtherMs +=
    performanceData.otherMs ??
    0

  totals.storageTotalMs +=
    performanceData.totalMs ??
    0

  if (
    performanceData.reusedKnownSpecies
  ) {
    totals.knownSpeciesReuses +=
      1
  } else {
    totals.nameOcrCalls +=
      1
  }
}

function formatMilliseconds(
  value
) {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return '0 ms'
  }

  if (value < 1000) {
    return `${Math.round(value)} ms`
  }

  const seconds =
    value / 1000

  if (seconds < 60) {
    return `${seconds.toFixed(2)} s`
  }

  const minutes =
    Math.floor(
      seconds / 60
    )

  const remainingSeconds =
    seconds -
    minutes * 60

  return (
    `${minutes}m ` +
    `${remainingSeconds.toFixed(1)}s`
  )
}

function getAverageMs(
  total,
  count
) {
  if (
    !Number.isFinite(
      total
    ) ||
    !Number.isFinite(
      count
    ) ||
    count <= 0
  ) {
    return 0
  }

  return total / count
}

// --------------------------------------------------
// Video
// --------------------------------------------------

async function loadRecordingVideo(
  file
) {
  if (!(file instanceof File)) {
    throw new Error(
      'A recording file is required.'
    )
  }

  const objectUrl =
    URL.createObjectURL(
      file
    )

  const video =
    document.createElement(
      'video'
    )

  video.preload =
    'auto'

  video.muted =
    true

  video.playsInline =
    true

  try {
    const loadedPromise =
      waitForVideoEvent(
        video,
        'loadeddata'
      )

    video.src =
      objectUrl

    video.load()

    await loadedPromise

    if (
      !Number.isFinite(
        video.duration
      ) ||
      video.duration <= 0
    ) {
      throw new Error(
        'The recording duration could not be determined.'
      )
    }

    if (
      !video.videoWidth ||
      !video.videoHeight
    ) {
      throw new Error(
        'The recording dimensions could not be determined.'
      )
    }

    return {
      video,
      objectUrl,
    }
  } catch (error) {
    URL.revokeObjectURL(
      objectUrl
    )

    throw error
  }
}

function cleanupRecordingVideo({
  video,
  objectUrl,
}) {
  if (video) {
    video.pause()

    video.removeAttribute(
      'src'
    )

    video.load()
  }

  if (objectUrl) {
    URL.revokeObjectURL(
      objectUrl
    )
  }
}

// --------------------------------------------------
// Grid phase
// --------------------------------------------------

function getPhaseDelta({
  previousOffsetY,
  currentOffsetY,
  rowStepPixels,
}) {
  if (
    !Number.isFinite(
      previousOffsetY
    ) ||
    !Number.isFinite(
      currentOffsetY
    ) ||
    !Number.isFinite(
      rowStepPixels
    ) ||
    rowStepPixels <= 0
  ) {
    return {
      rawDelta: 0,
      shortestDelta: 0,
    }
  }

  const rawDelta =
    currentOffsetY -
    previousOffsetY

  let shortestDelta =
    rawDelta

  const halfRow =
    rowStepPixels / 2

  while (
    shortestDelta >
    halfRow
  ) {
    shortestDelta -=
      rowStepPixels
  }

  while (
    shortestDelta <
    -halfRow
  ) {
    shortestDelta +=
      rowStepPixels
  }

  return {
    rawDelta,
    shortestDelta,
  }
}

// --------------------------------------------------
// V7R predicted phase helpers
// --------------------------------------------------

function normalizePhaseDelta({
  shiftY,
  rowStepPixels,
}) {
  if (
    !Number.isFinite(
      shiftY
    ) ||
    !Number.isFinite(
      rowStepPixels
    ) ||
    rowStepPixels <= 0
  ) {
    return 0
  }

  let normalized =
    shiftY

  const halfRow =
    rowStepPixels / 2

  while (
    normalized >
    halfRow
  ) {
    normalized -=
      rowStepPixels
  }

  while (
    normalized <
    -halfRow
  ) {
    normalized +=
      rowStepPixels
  }

  return normalized
}

// --------------------------------------------------
// V7R.1 checkpoint diagnostic
// --------------------------------------------------

function normalizeCheckpointCorrection({
  correction,
  rowStepPixels,
}) {
  return normalizePhaseDelta({
    shiftY:
      correction,

    rowStepPixels,
  })
}

function predictAlignmentOffset({
  previousOffsetY,
  movementShiftY,
  rowStepPixels,
}) {
  const safePreviousOffset =
    Number.isFinite(
      previousOffsetY
    )
      ? previousOffsetY
      : 0

  const phaseDelta =
    normalizePhaseDelta({
      shiftY:
        movementShiftY,

      rowStepPixels,
    })

  return {
    offsetY:
      safePreviousOffset +
      phaseDelta,

    phaseDelta,
  }
}

function buildPredictedAlignment({
  previousAlignment,
  movement,
  rowStepPixels,
}) {
  const prediction =
    predictAlignmentOffset({
      previousOffsetY:
        previousAlignment
          ?.offsetY ??
        0,

      movementShiftY:
        movement
          ?.shiftY ??
        0,

      rowStepPixels,
    })

  return {
    offsetY:
      prediction.offsetY,

    usable:
      true,

    score:
      null,

    successfulProbes:
      0,

    rowStepPixels:
      Math.round(
        rowStepPixels
      ),

    mode:
      'predicted',

    predictedPhaseDelta:
      prediction.phaseDelta,

    primaryProbe:
      null,

    confirmationProbe:
      null,

    candidates:
      [],
  }
}

function shouldRunAlignmentCheckpoint(
  frameIndex
) {
  if (frameIndex === 0) {
    return true
  }

  return (
    frameIndex %
      ALIGNMENT_CHECKPOINT_INTERVAL ===
    0
  )
}

// --------------------------------------------------
// Movement candidates
// --------------------------------------------------

function buildPhaseCandidates({
  shortestPhaseDelta,
  rowStepPixels,
}) {
  const candidates = []

  for (
    let rowMultiple =
      -MAX_PHASE_ROWS;
    rowMultiple <=
      MAX_PHASE_ROWS;
    rowMultiple += 1
  ) {
    candidates.push({
      rowMultiple,

      shift:
        shortestPhaseDelta +
        rowMultiple *
          rowStepPixels,
    })
  }

  return candidates
}

function calculateRecentMovement(
  resolvedMovements
) {
  const recent =
    resolvedMovements
      .filter(
        (movement) =>
          !movement.weak &&
          Math.abs(
            movement.shift
          ) >=
            MIN_MEANINGFUL_MOVEMENT
      )
      .slice(
        -RECENT_MOVEMENT_COUNT
      )

  if (
    recent.length ===
    0
  ) {
    return 0
  }

  return (
    recent.reduce(
      (
        total,
        movement
      ) =>
        total +
        movement.shift,
      0
    ) /
    recent.length
  )
}

function findNearestCandidate({
  candidates,
  target,
}) {
  let winner = null

  for (
    const candidate
    of candidates
  ) {
    const distance =
      Math.abs(
        candidate.shift -
          target
      )

    if (
      !winner ||
      distance <
        winner.distance
    ) {
      winner = {
        ...candidate,
        distance,
      }
    }
  }

  return winner
}

function resolveMovement({
  shortestPhaseDelta,
  rowStepPixels,
  movement,
  resolvedMovements,
}) {
  const phaseCandidates =
    buildPhaseCandidates({
      shortestPhaseDelta,
      rowStepPixels,
    })

  const imageShift =
    movement?.shiftY ??
    0

  const imageScore =
    movement?.score ??
    Infinity

  const weakImage =
    !Number.isFinite(
      imageScore
    ) ||
    imageScore >=
      WEAK_IMAGE_SCORE

  const recentMovement =
    calculateRecentMovement(
      resolvedMovements
    )

  let target =
    imageShift

  let strategy =
    'IMAGE'

  if (weakImage) {
    if (
      Math.abs(
        recentMovement
      ) >=
        MIN_MEANINGFUL_MOVEMENT
    ) {
      target =
        recentMovement

      strategy =
        'CONTINUITY'
    } else {
      target =
        shortestPhaseDelta

      strategy =
        'PHASE'
    }
  }

  const winner =
    findNearestCandidate({
      candidates:
        phaseCandidates,

      target,
    })

  return {
    shiftY:
      winner?.shift ??
      shortestPhaseDelta,

    rowMultiple:
      winner?.rowMultiple ??
      0,

    target,

    weakImage,

    recentMovement,

    strategy,
  }
}

// --------------------------------------------------
// Region helpers
// --------------------------------------------------

function getRegionRow(
  region,
  fallbackIndex
) {
  if (
    Number.isFinite(
      region?.row
    )
  ) {
    return Math.round(
      region.row
    )
  }

  return Math.floor(
    fallbackIndex / 3
  )
}

function getRegionPhaseRow(
  region,
  fallbackRow
) {
  if (
    Number.isFinite(
      region?.phaseRow
    )
  ) {
    return Math.round(
      region.phaseRow
    )
  }

  return fallbackRow
}

function getRegionColumn(
  region,
  fallbackIndex
) {
  if (
    Number.isFinite(
      region?.column
    )
  ) {
    return Math.round(
      region.column
    )
  }

  return (
    fallbackIndex % 3
  )
}

function getRegionY(
  region
) {
  if (
    Number.isFinite(
      region?.y
    )
  ) {
    return region.y
  }

  if (
    Number.isFinite(
      region?.top
    )
  ) {
    return region.top
  }

  return null
}

function getDetectedRegions(
  detection
) {
  if (
    Array.isArray(
      detection
    )
  ) {
    return detection
  }

  if (
    Array.isArray(
      detection?.regions
    )
  ) {
    return detection.regions
  }

  return []
}

// --------------------------------------------------
// List-space position
// --------------------------------------------------

function buildListSpacePosition({
  regionY,
  cumulativeResolvedY,
  baselineListY,
  rowStepPixels,
  column,
}) {
  if (
    !Number.isFinite(
      regionY
    ) ||
    !Number.isFinite(
      cumulativeResolvedY
    ) ||
    !Number.isFinite(
      baselineListY
    ) ||
    !Number.isFinite(
      rowStepPixels
    ) ||
    rowStepPixels <= 0
  ) {
    return null
  }

  const listSpaceY =
    regionY -
    cumulativeResolvedY

  const absoluteRowFloat =
    (
      listSpaceY -
      baselineListY
    ) /
    rowStepPixels

  const absoluteRow =
    Math.round(
      absoluteRowFloat
    )

  const rowResidual =
    absoluteRowFloat -
    absoluteRow

  return {
    listSpaceY,

    absoluteRowFloat,

    absoluteRow,

    rowResidual,

    column,

    absolutePosition:
      `${absoluteRow}:${column}`,
  }
}

// --------------------------------------------------
// Appearance quality
// --------------------------------------------------

function calculateAppearanceQuality({
  frame,
  region,
}) {
  if (
    !frame ||
    !region
  ) {
    return {
      score:
        Infinity,

      centerY:
        null,

      targetY:
        null,
    }
  }

  const regionY =
    getRegionY(
      region
    )

  if (
    !Number.isFinite(
      regionY
    ) ||
    !Number.isFinite(
      region.height
    ) ||
    !Number.isFinite(
      frame.height
    )
  ) {
    return {
      score:
        Infinity,

      centerY:
        null,

      targetY:
        null,
    }
  }

  const storageTop =
    frame.height *
    STORAGE_TOP_RATIO

  const storageBottom =
    frame.height *
    STORAGE_BOTTOM_RATIO

  const targetY =
    (
      storageTop +
      storageBottom
    ) / 2

  const centerY =
    regionY +
    region.height / 2

  const score =
    Math.abs(
      centerY -
      targetY
    )

  return {
    score,

    centerY,

    targetY,
  }
}

// --------------------------------------------------
// Appearance selection
// --------------------------------------------------

function getAppearanceBoundaryQuality(
  appearance
) {
  const frame =
    appearance?.frame

  const region =
    appearance?.region

  const regionY =
    getRegionY(
      region
    )

  if (
    !frame ||
    !Number.isFinite(
      frame.height
    ) ||
    !Number.isFinite(
      regionY
    ) ||
    !Number.isFinite(
      region?.height
    )
  ) {
    return {
      fullyVisible:
        false,

      clearance:
        -Infinity,
    }
  }

  const storageTop =
    frame.height *
    STORAGE_TOP_RATIO

  const storageBottom =
    frame.height *
    STORAGE_BOTTOM_RATIO

  const regionBottom =
    regionY +
    region.height

  const topClearance =
    regionY -
    storageTop

  const bottomClearance =
    storageBottom -
    regionBottom

  const clearance =
    Math.min(
      topClearance,
      bottomClearance
    )

  return {
    fullyVisible:
      topClearance >= 0 &&
      bottomClearance >= 0,

    clearance,
  }
}

function selectOcrAppearances(
  appearances,
  maximumAttempts =
    MAX_OCR_ATTEMPTS_PER_POSITION
) {
  if (
    !Array.isArray(
      appearances
    ) ||
    appearances.length === 0
  ) {
    return []
  }

  const rankedAppearances =
    appearances
      .map(
        (
          appearance,
          originalIndex
        ) => {
          const boundary =
            getAppearanceBoundaryQuality(
              appearance
            )

          return {
            appearance,

            originalIndex,

            fullyVisible:
              boundary.fullyVisible,

            clearance:
              boundary.clearance,

            qualityScore:
              Number.isFinite(
                appearance
                  .qualityScore
              )
                ? appearance
                    .qualityScore
                : Infinity,
          }
        }
      )

  /*
    Prefer fully visible appearances whenever
    possible.

    If none are fully visible, retain the complete
    appearance set so edge positions can still be
    attempted.
  */

  const fullyVisible =
    rankedAppearances.filter(
      (entry) =>
        entry.fullyVisible
    )

  const candidates =
    fullyVisible.length > 0
      ? fullyVisible
      : rankedAppearances

  /*
    Preserve chronological order.

    V7T intentionally samples across the tracked
    position's lifetime instead of simply choosing
    the appearances with the greatest viewport
    clearance.

    This protects positions that remain geometrically
    tracked after their useful visual appearance has
    already passed through the viewport.
  */

  const chronological =
    [...candidates].sort(
      (
        first,
        second
      ) => {
        const firstFrame =
          first
            .appearance
            .frameIndex

        const secondFrame =
          second
            .appearance
            .frameIndex

        if (
          firstFrame !==
          secondFrame
        ) {
          return (
            firstFrame -
            secondFrame
          )
        }

        return (
          first.originalIndex -
          second.originalIndex
        )
      }
    )

  if (
    chronological.length <=
    maximumAttempts
  ) {
    return chronological.map(
      (entry) =>
        entry.appearance
    )
  }

  /*
    Divide the appearance lifetime into temporal
    buckets.

    Pick the best-quality appearance from each
    bucket.

    With four OCR attempts this gives us evidence
    from approximately:

    - early
    - early-middle
    - late-middle
    - late

    rather than four neighboring frames from one
    end of the position's lifetime.
  */

  const selected =
    []

  for (
    let bucketIndex = 0;
    bucketIndex <
      maximumAttempts;
    bucketIndex += 1
  ) {
    const startIndex =
      Math.floor(
        (
          bucketIndex *
          chronological.length
        ) /
        maximumAttempts
      )

    const endIndex =
      Math.floor(
        (
          (
            bucketIndex + 1
          ) *
          chronological.length
        ) /
        maximumAttempts
      )

    const bucket =
      chronological.slice(
        startIndex,
        Math.max(
          startIndex + 1,
          endIndex
        )
      )

    const winner =
      [...bucket].sort(
        (
          first,
          second
        ) => {
          if (
            first.qualityScore !==
            second.qualityScore
          ) {
            return (
              first.qualityScore -
              second.qualityScore
            )
          }

          if (
            second.clearance !==
            first.clearance
          ) {
            return (
              second.clearance -
              first.clearance
            )
          }

          return (
            first.originalIndex -
            second.originalIndex
          )
        }
      )[0]

    if (winner) {
      selected.push(
        winner
      )
    }
  }

  return selected.map(
    (entry) =>
      entry.appearance
  )
}

// --------------------------------------------------
// Species helpers
// --------------------------------------------------

function hasResolvedSpecies(
  analysis
) {
  return Boolean(
    analysis
      ?.speciesMatch
      ?.species
  )
}

function getSpeciesKey(
  analysis
) {
  const species =
    analysis
      ?.speciesMatch
      ?.species

  if (!species) {
    return null
  }

  if (
    species.id !==
      null &&
    species.id !==
      undefined
  ) {
    return `id:${species.id}`
  }

  if (
    typeof species.apiName ===
      'string' &&
    species.apiName
  ) {
    return `api:${species.apiName}`
  }

  if (
    typeof species.name ===
      'string' &&
    species.name
  ) {
    return `name:${species.name}`
  }

  return null
}

function getSpeciesStrength(
  analysis
) {
  if (
    !hasResolvedSpecies(
      analysis
    )
  ) {
    return -Infinity
  }

  const speciesConfidence =
    Number.isFinite(
      analysis
        ?.speciesMatch
        ?.confidence
    )
      ? analysis
          .speciesMatch
          .confidence
      : 0

  const ocrConfidence =
    Number.isFinite(
      analysis
        ?.name
        ?.ocrConfidence
    )
      ? analysis
          .name
          .ocrConfidence
      : 0

  return (
    speciesConfidence *
      10 +
    ocrConfidence
  )
}

function chooseSpeciesResult(
  results
) {
  const resolved =
    results.filter(
      (result) =>
        hasResolvedSpecies(
          result.analysis
        )
    )

  if (
    resolved.length ===
    0
  ) {
    return null
  }

  const groups =
    new Map()

  resolved.forEach(
    (result) => {
      const key =
        getSpeciesKey(
          result.analysis
        )

      if (!key) {
        return
      }

      const existing =
        groups.get(
          key
        ) ?? []

      existing.push(
        result
      )

      groups.set(
        key,
        existing
      )
    }
  )

  if (
    groups.size ===
    0
  ) {
    return null
  }

  const ranked =
    Array.from(
      groups.entries()
    )
      .map(
        ([
          key,
          groupResults,
        ]) => ({
          key,

          results:
            groupResults,

          count:
            groupResults.length,

          totalStrength:
            groupResults.reduce(
              (
                total,
                result
              ) =>
                total +
                getSpeciesStrength(
                  result.analysis
                ),
              0
            ),
        })
      )
      .sort(
        (
          first,
          second
        ) => {
          if (
            second.count !==
            first.count
          ) {
            return (
              second.count -
              first.count
            )
          }

          return (
            second.totalStrength -
            first.totalStrength
          )
        }
      )

  const winner =
    ranked[0]

  return [
    ...winner.results,
  ].sort(
    (
      first,
      second
    ) =>
      getSpeciesStrength(
        second.analysis
      ) -
      getSpeciesStrength(
        first.analysis
      )
  )[0]
}

// --------------------------------------------------
// V7O species/reference matching
// --------------------------------------------------

function normalizeSpeciesLookupValue(
  value
) {
  if (
    typeof value !==
    'string'
  ) {
    return ''
  }

  return value
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(
      /[^a-zA-Z0-9]+/g,
      ''
    )
    .toLowerCase()
}

function getSpeciesReferenceCandidates(
  analysis
) {
  const species =
    analysis
      ?.speciesMatch
      ?.species

  if (!species) {
    return []
  }

  const lookupValues =
    [
      species.apiName,
      species.name,
    ]
      .map(
        normalizeSpeciesLookupValue
      )
      .filter(Boolean)

  if (
    lookupValues.length ===
    0
  ) {
    return []
  }

  const lookupSet =
    new Set(
      lookupValues
    )

  return getAllPokemonReferences()
    .filter(
      (reference) => {
        const referenceValues =
          [
            reference.id,
            reference.apiName,
            reference.name,
          ]
            .map(
              normalizeSpeciesLookupValue
            )
            .filter(Boolean)

        return referenceValues.some(
          (value) =>
            lookupSet.has(
              value
            )
        )
      }
    )
}

function getMaximumPossibleCpForSpecies(
  analysis
) {
  const references =
    getSpeciesReferenceCandidates(
      analysis
    )

  if (
    references.length ===
    0
  ) {
    return {
      maximumCp:
        null,

      references:
        [],
    }
  }

  const maximumCpm =
    getCpmForLevel(
      MAX_CP_LEVEL
    )

  if (
    !Number.isFinite(
      maximumCpm
    )
  ) {
    return {
      maximumCp:
        null,

      references,
    }
  }

  let maximumCp =
    null

  for (
    const reference
    of references
  ) {
    const baseAttack =
      reference
        ?.stats
        ?.attack

    const baseDefense =
      reference
        ?.stats
        ?.defense

    const baseStamina =
      reference
        ?.stats
        ?.stamina

    if (
      !Number.isFinite(
        baseAttack
      ) ||
      !Number.isFinite(
        baseDefense
      ) ||
      !Number.isFinite(
        baseStamina
      )
    ) {
      continue
    }

    const cp =
      calculatePokemonCp({
        baseAttack,
        baseDefense,
        baseStamina,

        attackIv:
          MAX_CP_IV,

        defenseIv:
          MAX_CP_IV,

        staminaIv:
          MAX_CP_IV,

        cpm:
          maximumCpm,
      })

    if (
      !Number.isInteger(
        cp
      )
    ) {
      continue
    }

    if (
      maximumCp ===
        null ||
      cp >
        maximumCp
    ) {
      maximumCp =
        cp
    }
  }

  return {
    maximumCp,
    references,
  }
}

// --------------------------------------------------
// CP observations
// --------------------------------------------------

function getCpObservation(
  result
) {
  const cp =
    result
      ?.analysis
      ?.cp

  if (
    !Number.isInteger(
      cp?.value
    )
  ) {
    return null
  }

  return {
    value:
      cp.value,

    confidence:
      Number.isFinite(
        cp.confidence
      )
        ? cp.confidence
        : 0,

    internalAgreement:
      cp.agreement ??
      'unknown',

    internalCount:
      Number.isFinite(
        cp.consensusCount
      )
        ? cp.consensusCount
        : 0,

    rawText:
      cp.rawText ??
      '',

    result,
  }
}

// --------------------------------------------------
// V7U CP observation reliability
// --------------------------------------------------

function getCpObservationReliability(
  observation
) {
  if (!observation) {
    return 0
  }

  const qualityScore =
    Number.isFinite(
      observation.qualityScore
    )
      ? observation.qualityScore
      : Infinity

  const geometryScore =
    Number.isFinite(
      qualityScore
    )
      ? 1 / (
          1 +
          qualityScore / 200
        )
      : 0

  const confidenceScore =
    Math.max(
      0,
      Math.min(
        1,
        observation.confidence /
          100
      )
    )

  let internalScore =
    0.5

  if (
    observation.internalAgreement ===
      'unanimous' ||
    observation.internalCount >= 3
  ) {
    internalScore =
      1
  } else if (
    observation.internalCount >= 2
  ) {
    internalScore =
      0.8
  }

  return (
    geometryScore *
      0.45 +
    confidenceScore *
      0.30 +
    internalScore *
      0.25
  )
}

function getCpObservation(
  result
) {
  const cp =
    result
      ?.analysis
      ?.cp

  if (
    !Number.isInteger(
      cp?.value
    )
  ) {
    return null
  }

  const observation = {
    value:
      cp.value,

    confidence:
      Number.isFinite(
        cp.confidence
      )
        ? cp.confidence
        : 0,

    internalAgreement:
      cp.agreement ??
      'unknown',

    internalCount:
      Number.isFinite(
        cp.consensusCount
      )
        ? cp.consensusCount
        : 0,

    rawText:
      cp.rawText ??
      '',

    frameIndex:
      result
        ?.appearance
        ?.frameIndex ??
      null,

    qualityScore:
      Number.isFinite(
        result
          ?.appearance
          ?.qualityScore
      )
        ? result
            .appearance
            .qualityScore
        : Infinity,

    result,
  }

  observation.reliability =
    getCpObservationReliability(
      observation
    )

  return observation
}

function chooseCrossAppearanceCp(
  results,
  speciesAnalysis
) {
  const allObservations =
    results
      .map(
        getCpObservation
      )
      .filter(Boolean)

  const {
    maximumCp,
    references,
  } =
    getMaximumPossibleCpForSpecies(
      speciesAnalysis
    )

  const hasCpCeiling =
    Number.isInteger(
      maximumCp
    )

  const observations =
    hasCpCeiling
      ? allObservations.filter(
          (observation) =>
            observation.value <=
            maximumCp
        )
      : allObservations

  const rejectedObservations =
    hasCpCeiling
      ? allObservations.filter(
          (observation) =>
            observation.value >
            maximumCp
        )
      : []

  if (
    observations.length ===
    0
  ) {
    return {
      value:
        null,

      agreement:
        allObservations.length >
          0 &&
        hasCpCeiling
          ? 'all-impossible'
          : 'none',

      count:
        0,

      total:
        observations.length,

      rawTotal:
        allObservations.length,

      selectedObservation:
        null,

      observations,

      allObservations,

      rejectedObservations,

      maximumPossibleCp:
        maximumCp,

      referenceCount:
        references.length,
    }
  }

  const groups =
    new Map()

  observations.forEach(
    (observation) => {
      const existing =
        groups.get(
          observation.value
        ) ?? []

      existing.push(
        observation
      )

      groups.set(
        observation.value,
        existing
      )
    }
  )

  const ranked =
    Array.from(
      groups.entries()
    )
      .map(
        ([
          value,
          group,
        ]) => ({
          value,

          group,

          count:
            group.length,

                    confidence:
            group.reduce(
              (
                total,
                observation
              ) =>
                total +
                observation.confidence,
              0
            ),

          reliability:
            group.reduce(
              (
                total,
                observation
              ) =>
                total +
                observation.reliability,
              0
            ),
        })
      )
      .sort(
        (
          first,
          second
        ) => {
                    if (
            second.count !==
            first.count
          ) {
            return (
              second.count -
              first.count
            )
          }

          if (
            second.reliability !==
            first.reliability
          ) {
            return (
              second.reliability -
              first.reliability
            )
          }

          return (
            second.confidence -
            first.confidence
          )
        }
      )

  const winner =
    ranked[0]

  const second =
    ranked[1] ??
    null

  if (
    ranked.length ===
    1
  ) {
    const selectedObservation =
      [...winner.group]
        .sort(
          (
            first,
            secondObservation
          ) =>
            secondObservation
              .confidence -
            first.confidence
        )[0]

    return {
      value:
        winner.value,

      agreement:
        winner.count >= 2
          ? 'plausible-cross-frame'
          : 'single-plausible',

      count:
        winner.count,

      total:
        observations.length,

      rawTotal:
        allObservations.length,

      selectedObservation,

      observations,

      allObservations,

      rejectedObservations,

      maximumPossibleCp:
        maximumCp,

      referenceCount:
        references.length,
    }
  }

  if (
    winner.count < 2
  ) {
    return {
      value:
        null,

      agreement:
        'plausible-disagreement',

      count:
        winner.count,

      total:
        observations.length,

      rawTotal:
        allObservations.length,

      selectedObservation:
        null,

      observations,

      allObservations,

      rejectedObservations,

      maximumPossibleCp:
        maximumCp,

      referenceCount:
        references.length,
    }
  }

  if (
    second &&
    second.count ===
      winner.count
  ) {
    return {
      value:
        null,

      agreement:
        'plausible-tie',

      count:
        winner.count,

      total:
        observations.length,

      rawTotal:
        allObservations.length,

      selectedObservation:
        null,

      observations,

      allObservations,

      rejectedObservations,

      maximumPossibleCp:
        maximumCp,

      referenceCount:
        references.length,
    }
  }

  const selectedObservation =
    [...winner.group]
      .sort(
        (
          first,
          secondObservation
        ) =>
          secondObservation
            .confidence -
          first.confidence
      )[0]

  return {
    value:
      winner.value,

    agreement:
      winner.count ===
        observations.length
        ? 'plausible-cross-frame-unanimous'
        : 'plausible-cross-frame-majority',

    count:
      winner.count,

    total:
      observations.length,

    rawTotal:
      allObservations.length,

    selectedObservation,

    observations,

    allObservations,

    rejectedObservations,

    maximumPossibleCp:
      maximumCp,

    referenceCount:
      references.length,
  }
}

// --------------------------------------------------
// Final recognized Pokémon
// --------------------------------------------------

function buildRecognizedPokemon({
  position,
  speciesResult,
  cpConsensus,
}) {
  const analysis =
    speciesResult
      ?.analysis

  const recognized =
    analysis
      ?.recognizedPokemon ??
    {}

  const selectedCp =
    cpConsensus
      ?.selectedObservation

  return {
    absolutePosition:
      position.absolutePosition,

    absoluteRow:
      position.absoluteRow,

    column:
      position.column,

    reviewImage:
      speciesResult
        ?.crop
        ?.previewUrl ??
      null,

    pokemonId:
      recognized.pokemonId ??
      null,

    apiName:
      recognized.apiName ??
      null,

    name:
      recognized.name ??
      null,

    cp:
      Number.isInteger(
        cpConsensus?.value
      )
        ? cpConsensus.value
        : null,

    nameRawText:
      analysis
        ?.name
        ?.rawText ??
      '',

    nameConfidence:
      analysis
        ?.name
        ?.confidence ??
      0,

    nameOcrConfidence:
      analysis
        ?.name
        ?.ocrConfidence ??
      0,

    nameMatchType:
      analysis
        ?.name
        ?.matchType ??
      null,

    cpRawText:
      selectedCp
        ?.rawText ??
      '',

    cpConfidence:
      selectedCp
        ?.confidence ??
      0,

    cpAgreement:
      cpConsensus
        ?.agreement ??
      'none',

    cpConsensusCount:
      cpConsensus
        ?.count ??
      0,

    cpConsensusTotal:
      cpConsensus
        ?.total ??
      0,

    cpRawObservationTotal:
      cpConsensus
        ?.rawTotal ??
      0,

    cpMaximumPossible:
      cpConsensus
        ?.maximumPossibleCp ??
      null,

    cpReferenceCount:
      cpConsensus
        ?.referenceCount ??
      0,

    cpObservations:
      cpConsensus
        ?.observations
        ?.map(
          (observation) => ({
            value:
              observation.value,

            confidence:
              observation.confidence,

            internalAgreement:
              observation.internalAgreement,

            internalCount:
              observation.internalCount,

            rawText:
              observation.rawText,

            frameIndex:
              observation
                .result
                .appearance
                .frameIndex,

            timestamp:
              observation
                .result
                .appearance
                .timestamp,

                            reliability:
              observation.reliability,

            qualityScore:
              observation.qualityScore,
          })
        ) ??
      [],

    cpRejectedObservations:
      cpConsensus
        ?.rejectedObservations
        ?.map(
          (observation) => ({
            value:
              observation.value,

            confidence:
              observation.confidence,

            internalAgreement:
              observation.internalAgreement,

            internalCount:
              observation.internalCount,

            rawText:
              observation.rawText,

            frameIndex:
              observation
                .result
                .appearance
                .frameIndex,

            timestamp:
              observation
                .result
                .appearance
                .timestamp,
          })
        ) ??
      [],

    analysis,
  }
}

// --------------------------------------------------
// Main
// --------------------------------------------------

export async function analyzeRecording(
  file,
  {
    interval =
      DEFAULT_FRAME_INTERVAL,

    onProgress =
      null,
  } = {}
) {
  const totalStart =
    getNow()

  const performanceTotals =
    createPerformanceTotals()

  const videoLoadStart =
    getNow()

  const recording =
    await loadRecordingVideo(
      file
    )

  performanceTotals.videoLoadMs =
    getElapsedMs(
      videoLoadStart
    )

  const {
    video,
    objectUrl,
  } =
    recording

  try {
    // ------------------------------------------------
    // Phase 1: extract frames
    // ------------------------------------------------

    const frameExtractionStart =
      getNow()

    const frames =
      await extractRecordingFrames({
        video,

        interval,

        onProgress:
          ({
            current,
            total,
            timestamp,
          }) => {
            onProgress?.({
              phase:
                'frames',

              current,
              total,
              timestamp,
            })
          },
      })

    performanceTotals.frameExtractionMs =
      getElapsedMs(
        frameExtractionStart
      )

    const frameResults = []

    const resolvedMovements = []

    const uniquePositions =
      new Map()

    let previousAlignment =
      null

    let previousFrame =
      null

    let cumulativeResolvedY =
      0

    let baselineListY =
      null

    console.log(
      '================================'
    )

    console.log(
      'POKEIQ RECORDING V7S SPECIES REUSE'
    )

    console.log(
      '================================'
    )

    console.log(
      `Frames: ${frames.length}`
    )

    console.log(
      `Alignment checkpoint interval: ${ALIGNMENT_CHECKPOINT_INTERVAL} frames`
    )

    console.log(
      `Video load: ${formatMilliseconds(
        performanceTotals.videoLoadMs
      )}`
    )

    console.log(
      `Frame extraction: ${formatMilliseconds(
        performanceTotals.frameExtractionMs
      )}`
    )

    console.log(
      'V7S preserves V7R.1 tracking and adds position-level species reuse during storage OCR.'
    )

    // ------------------------------------------------
    // Phase 2: track all geometric positions
    // ------------------------------------------------

    for (
      let frameIndex = 0;
      frameIndex <
        frames.length;
      frameIndex += 1
    ) {
      const frame =
        frames[frameIndex]

      try {
        // --------------------------------------------
        // Establish row-step geometry.
        // --------------------------------------------

        const rowStepPixels =
          previousAlignment
            ?.rowStepPixels ??
          Math.round(
            frame.height *
              0.17
          )

        // --------------------------------------------
        // Measure movement before alignment.
        // --------------------------------------------

        let movement =
          null

        let movementMs =
          0

        if (
          previousFrame
        ) {
          const movementStart =
            getNow()

          movement =
            await measureStorageFrameMovement({
              previousFrame,

              currentFrame:
                frame,
            })

          movementMs =
            getElapsedMs(
              movementStart
            )

          performanceTotals.movementMs +=
            movementMs
        }

        // --------------------------------------------
        // Build movement-predicted alignment.
        // --------------------------------------------

        let predictedAlignment =
          null

        if (
          previousAlignment &&
          movement
        ) {
          predictedAlignment =
            buildPredictedAlignment({
              previousAlignment,

              movement,

              rowStepPixels,
            })
        }

        // --------------------------------------------
        // Decide whether OCR alignment is needed.
        // --------------------------------------------

        const isFirstFrame =
          frameIndex === 0

        const isCheckpoint =
          !isFirstFrame &&
          shouldRunAlignmentCheckpoint(
            frameIndex
          )

        let alignment =
          null

        let alignmentMs =
          0

        let alignmentSource =
          'predicted'

        if (isFirstFrame) {
          const alignmentStart =
            getNow()

          alignment =
            await findStorageGridAlignment(
              frame,
              {
                previousAlignment:
                  null,

                forceFullSearch:
                  true,

                onProgress:
                  (
                    progress
                  ) => {
                    onProgress?.({
                      ...progress,

                      frameIndex,
                    })
                  },
              }
            )

          alignmentMs =
            getElapsedMs(
              alignmentStart
            )

          performanceTotals.alignmentMs +=
            alignmentMs

          performanceTotals.alignmentFullFrames +=
            1

          alignmentSource =
            'full'
        } else if (
          isCheckpoint
        ) {
          const checkpointSeed =
            predictedAlignment ??
            previousAlignment

          const alignmentStart =
            getNow()

          alignment =
            await findStorageGridAlignment(
              frame,
              {
                previousAlignment:
                  checkpointSeed,

                forceFullSearch:
                  false,

                onProgress:
                  (
                    progress
                  ) => {
                    onProgress?.({
                      ...progress,

                      frameIndex,
                    })
                  },
              }
            )

          alignmentMs =
            getElapsedMs(
              alignmentStart
            )

          performanceTotals.alignmentMs +=
            alignmentMs

          performanceTotals.alignmentCheckpointFrames +=
            1

          alignmentSource =
            'checkpoint'
        } else {
          alignment =
            predictedAlignment ??
            previousAlignment

          performanceTotals.alignmentPredictedFrames +=
            1

          alignmentSource =
            'predicted'
        }

        if (!alignment) {
          throw new Error(
            'V7S could not establish storage-grid alignment.'
          )
        }

        const currentRowStepPixels =
          alignment
            ?.rowStepPixels ??
          rowStepPixels

        // --------------------------------------------
        // Phase delta
        // --------------------------------------------

        let rawPhaseDelta =
          0

        let shortestPhaseDelta =
          0

        if (
          previousAlignment
        ) {
          const phase =
            getPhaseDelta({
              previousOffsetY:
                previousAlignment
                  .offsetY,

              currentOffsetY:
                alignment
                  .offsetY,

              rowStepPixels:
                currentRowStepPixels,
            })

          rawPhaseDelta =
            phase.rawDelta

          shortestPhaseDelta =
            phase.shortestDelta
        }

        // --------------------------------------------
        // Existing V7R movement resolution.
        // --------------------------------------------

        let resolution = {
          shiftY: 0,
          rowMultiple: 0,
          target: 0,
          weakImage: false,
          recentMovement: 0,
          strategy: 'FIRST',
        }

        if (
          previousFrame
        ) {
          resolution =
            resolveMovement({
              shortestPhaseDelta,

              rowStepPixels:
                currentRowStepPixels,

              movement,

              resolvedMovements,
            })

          resolvedMovements.push({
            shift:
              resolution.shiftY,

            weak:
              resolution.weakImage,

            strategy:
              resolution.strategy,

            rowMultiple:
              resolution.rowMultiple,
          })

          cumulativeResolvedY +=
            resolution.shiftY
        }

        // --------------------------------------------
        // Detection/tracking
        // --------------------------------------------

        const detectionTrackingStart =
          getNow()

        const detection =
          detectStorageRegions({
            width:
              frame.width,

            height:
              frame.height,

            offsetY:
              alignment.offsetY,
          })

        const regions =
          getDetectedRegions(
            detection
          )

        const skippedRowsAbove =
          Number.isFinite(
            detection
              ?.skippedRowsAbove
          )
            ? detection
                .skippedRowsAbove
            : 0

        if (
          !Number.isFinite(
            baselineListY
          ) &&
          regions.length > 0
        ) {
          const firstRegionY =
            getRegionY(
              regions[0]
            )

          if (
            Number.isFinite(
              firstRegionY
            )
          ) {
            baselineListY =
              firstRegionY -
              cumulativeResolvedY

            console.log(
              `[V7S] Baseline list Y established at ${baselineListY.toFixed(
                2
              )} px`
            )
          }
        }

        let newPositions =
          0

        let reusedPositions =
          0

        let invalidPositions =
          0

        let maxResidual =
          0

        const framePositions =
          []

        regions.forEach(
          (
            region,
            regionIndex
          ) => {
            const localRow =
              getRegionRow(
                region,
                regionIndex
              )

            const phaseRow =
              getRegionPhaseRow(
                region,
                localRow
              )

            const column =
              getRegionColumn(
                region,
                regionIndex
              )

            const regionY =
              getRegionY(
                region
              )

            const position =
              buildListSpacePosition({
                regionY,

                cumulativeResolvedY,

                baselineListY,

                rowStepPixels:
                  currentRowStepPixels,

                column,
              })

            if (!position) {
              invalidPositions +=
                1

              return
            }

            const quality =
              calculateAppearanceQuality({
                frame,
                region,
              })

            maxResidual =
              Math.max(
                maxResidual,

                Math.abs(
                  position.rowResidual
                )
              )

            const appearance = {
              frameIndex,

              frameId:
                frame.id,

              timestamp:
                frame.timestamp,

              frame,

              region: {
                ...region,
              },

              localRow,

              phaseRow,

              column,

              regionY,

              listSpaceY:
                position.listSpaceY,

              absoluteRowFloat:
                position.absoluteRowFloat,

              rowResidual:
                position.rowResidual,

              skippedRowsAbove,

              qualityScore:
                quality.score,

              centerY:
                quality.centerY,

              targetY:
                quality.targetY,
            }

            const existing =
              uniquePositions.get(
                position
                  .absolutePosition
              )

            if (existing) {
              reusedPositions +=
                1

              existing
                .appearances
                .push(
                  appearance
                )

              if (
                appearance
                  .qualityScore <
                existing
                  .bestAppearance
                  .qualityScore
              ) {
                existing.bestAppearance =
                  appearance
              }
            } else {
              newPositions +=
                1

              uniquePositions.set(
                position
                  .absolutePosition,
                {
                  ...position,

                  firstFrameIndex:
                    frameIndex,

                  firstTimestamp:
                    frame.timestamp,

                  firstLocalRow:
                    localRow,

                  firstPhaseRow:
                    phaseRow,

                  appearances: [
                    appearance,
                  ],

                  bestAppearance:
                    appearance,

                  crop:
                    null,

                  analysis:
                    null,

                  recognizedPokemon:
                    null,

                  occupied:
                    null,

                  ocrAttempts:
                    0,

                  ocrError:
                    null,

                  ocrResults:
                    [],

                  /*
                    V7S:

                    Species is established later during
                    selected-appearance OCR.

                    It is deliberately position-local.
                  */

                  knownSpecies:
                    null,

                  speciesReuseCount:
                    0,
                }
              )
            }

            framePositions.push({
              ...position,

              localRow,

              phaseRow,

              qualityScore:
                quality.score,

              isNew:
                !existing,
            })
          }
        )

        const detectionTrackingMs =
          getElapsedMs(
            detectionTrackingStart
          )

        performanceTotals.detectionTrackingMs +=
          detectionTrackingMs

        // --------------------------------------------
        // V7R.1 checkpoint diagnostics
        // --------------------------------------------

        const movementScore =
          Number.isFinite(
            movement?.score
          )
            ? movement.score
                .toFixed(3)
            : 'N/A'

        const predictedOffset =
          Number.isFinite(
            predictedAlignment
              ?.offsetY
          )
            ? Math.round(
                predictedAlignment
                  .offsetY
              )
            : null

        const checkpointCorrection =
          (
            isCheckpoint &&
            predictedAlignment &&
            Number.isFinite(
              alignment.offsetY
            )
          )
            ? (
                alignment.offsetY -
                predictedAlignment
                  .offsetY
              )
            : null

        const normalizedCheckpointCorrection =
          Number.isFinite(
            checkpointCorrection
          )
            ? normalizeCheckpointCorrection({
                correction:
                  checkpointCorrection,

                rowStepPixels:
                  currentRowStepPixels,
              })
            : null

        console.log(
          `[V7S] Frame ${frameIndex + 1}/${frames.length} | ` +
          `phase: ${Math.round(
            alignment.offsetY
          )} | ` +
          `source: ${alignmentSource} | ` +
          `predicted: ${
            predictedOffset ??
            'N/A'
          } | ` +
          `correction: ${
            Number.isFinite(
              checkpointCorrection
            )
              ? Math.round(
                  checkpointCorrection
                )
              : 'N/A'
          } | ` +
          `phase-correction: ${
            Number.isFinite(
              normalizedCheckpointCorrection
            )
              ? Math.round(
                  normalizedCheckpointCorrection
                )
              : 'N/A'
          } | ` +
          `skip-top: ${skippedRowsAbove} | ` +
          `move: ${Math.round(
            resolution.shiftY
          )} | ` +
          `cum: ${Math.round(
            cumulativeResolvedY
          )} | ` +
          `visible: ${regions.length} | ` +
          `new: ${newPositions} | ` +
          `reused: ${reusedPositions} | ` +
          `geometric: ${uniquePositions.size} | ` +
          `residual: ${maxResidual.toFixed(
            3
          )} | ` +
          `score: ${movementScore} | ` +
          `${resolution.strategy} | ` +
          `align ${Math.round(
            alignmentMs
          )}ms | ` +
          `movement ${Math.round(
            movementMs
          )}ms${
            resolution.weakImage
              ? ' WEAK'
              : ''
          }`
        )

        console.log(
          `[V7S] Positions: ${
            framePositions
              .map(
                (position) =>
                  `${
                    position.isNew
                      ? '+'
                      : '='
                  }${position.absolutePosition}` +
                  `[${position.absoluteRowFloat.toFixed(
                    2
                  )}]`
              )
              .join(', ')
          }`
        )

        frameResults.push({
          frameIndex,

          frameId:
            frame.id,

          timestamp:
            frame.timestamp,

          alignmentOffset:
            alignment.offsetY,

          alignmentMode:
            alignment.mode,

          alignmentSource,

          predictedAlignmentOffset:
            predictedAlignment
              ?.offsetY ??
            null,

          predictedPhaseDelta:
            predictedAlignment
              ?.predictedPhaseDelta ??
            null,

          checkpointCorrection,

          normalizedCheckpointCorrection,

          normalizedOffsetY:
            detection
              ?.normalizedOffsetY ??
            null,

          skippedRowsAbove,

          rowStepPixels:
            currentRowStepPixels,

          rawPhaseDelta,

          shortestPhaseDelta,

          imageShiftY:
            movement?.shiftY ??
            0,

          imageScore:
            movement?.score ??
            null,

          resolvedShiftY:
            resolution.shiftY,

          movementRowMultiple:
            resolution.rowMultiple,

          cumulativeResolvedY,

          baselineListY,

          weakImage:
            resolution.weakImage,

          strategy:
            resolution.strategy,

          visiblePositions:
            regions.length,

          newPositions,

          reusedPositions,

          invalidPositions,

          maxResidual,

          geometricPositions:
            uniquePositions.size,

          positions:
            framePositions,

          performance: {
            alignmentMs,

            movementMs,

            detectionTrackingMs,
          },

          error:
            null,
        })

        previousAlignment =
          alignment

        previousFrame =
          frame
      } catch (
        frameError
      ) {
        console.error(
          `[V7S] Frame ${frameIndex + 1} FAILED`,
          frameError
        )

        frameResults.push({
          frameIndex,

          frameId:
            frame.id,

          timestamp:
            frame.timestamp,

          error:
            frameError instanceof Error
              ? frameError.message
              : 'Recording tracking failed.',
        })
      }

      onProgress?.({
        phase:
          'analysis',

        current:
          frameIndex + 1,

        total:
          frames.length,

        timestamp:
          frame.timestamp,
      })

      await new Promise(
        (resolve) =>
          window.setTimeout(
            resolve,
            0
          )
      )
    }

    // ------------------------------------------------
    // Sort tracked geometric positions
    // ------------------------------------------------

    const positions =
      Array.from(
        uniquePositions.values()
      ).sort(
        (
          first,
          second
        ) => {
          if (
            first.absoluteRow !==
            second.absoluteRow
          ) {
            return (
              first.absoluteRow -
              second.absoluteRow
            )
          }

          return (
            first.column -
            second.column
          )
        }
      )

    console.log('')

    console.log(
      '================================'
    )

    console.log(
      'V7S TRACKING COMPLETE'
    )

    console.log(
      '================================'
    )

    console.log(
      `Geometric positions to validate: ${positions.length}`
    )

    console.log(
      `OCR appearances per position: up to ${MAX_OCR_ATTEMPTS_PER_POSITION}`
    )

    console.log(
      `Full-alignment frames: ${performanceTotals.alignmentFullFrames}`
    )

    console.log(
      `Checkpoint-alignment frames: ${performanceTotals.alignmentCheckpointFrames}`
    )

    console.log(
      `Predicted-alignment frames: ${performanceTotals.alignmentPredictedFrames}`
    )

    console.log(
      `Alignment total: ${formatMilliseconds(
        performanceTotals.alignmentMs
      )}`
    )

    console.log(
      `Movement total: ${formatMilliseconds(
        performanceTotals.movementMs
      )}`
    )

    console.log(
      `Detection/tracking total: ${formatMilliseconds(
        performanceTotals.detectionTrackingMs
      )}`
    )

      // ------------------------------------------------
    // Phase 3:
    // OCR selected appearances.
    //
    // V7S species reuse:
    //
    // - The first appearance that successfully resolves
    //   a species establishes position.knownSpecies.
    //
    // - Later appearances for the SAME absolute
    //   position pass that species into
    //   analyzeStorageCrop().
    //
    // - analyzeStorageCrop still performs all three
    //   CP OCR passes.
    //
    // - Only repeated name preprocessing, name OCR,
    //   and species resolution are skipped.
    //
    // Preserved:
    // - V7N adaptive stopping
    // - V7O CP plausibility
    // - crop timing
    // - complete storage-analysis timing
    // ------------------------------------------------

    const recognizedPokemon =
      []

    const rejectedPositions =
      []

    let successfulOcr =
      0

    let failedOcr =
      0

    let totalOcrAttempts =
      0

    for (
      let positionIndex = 0;
      positionIndex <
        positions.length;
      positionIndex += 1
    ) {
      const position =
        positions[positionIndex]

      const attempts =
        selectOcrAppearances(
          position.appearances
        )

        console.log(
  `[V7T SELECT] ${position.absolutePosition} | ` +
  `lifetime F${
    position.appearances[0]
      ?.frameIndex + 1
  }-F${
    position.appearances[
      position.appearances.length - 1
    ]?.frameIndex + 1
  } | selected ${
    attempts
      .map(
        (appearance) =>
          `F${appearance.frameIndex + 1}` +
          `(q=${appearance.qualityScore.toFixed(
            1
          )})`
      )
      .join(', ')
  }`
)

      console.log(
        `[V7S OCR] ${positionIndex + 1}/${positions.length} | ` +
        `${position.absolutePosition} | ` +
        `${position.appearances.length} appearances | ` +
        `${attempts.length} attempts`
      )

      const results =
        []

      let lastError =
        null

      let executedAttempts =
        0

      /*
        V7S species state is deliberately scoped to one
        tracked absolute position.

        It cannot leak from one Pokémon position into
        another.
      */

      let knownSpecies =
        position.knownSpecies ??
        null

      for (
        let attemptIndex = 0;
        attemptIndex <
          attempts.length;
        attemptIndex += 1
      ) {
        const appearance =
          attempts[attemptIndex]

        totalOcrAttempts +=
          1

        executedAttempts +=
          1

        try {
          // ------------------------------------------
          // Crop timing
          // ------------------------------------------

          const cropStart =
            getNow()

          const crops =
            await cropStorageRegions({
              frame:
                appearance.frame,

              detection: {
                regions: [
                  {
                    ...appearance.region,

                    id:
                      `recording-${position.absoluteRow}-${position.column}-attempt-${attemptIndex + 1}`,

                    absoluteRow:
                      position.absoluteRow,

                    absolutePosition:
                      position.absolutePosition,
                  },
                ],
              },
            })

          const cropMs =
            getElapsedMs(
              cropStart
            )

          performanceTotals.cropMs +=
            cropMs

          const crop =
            crops[0]

          if (!crop) {
            throw new Error(
              'The selected storage appearance could not be cropped.'
            )
          }

          // ------------------------------------------
          // V7S species reuse state before analysis
          // ------------------------------------------

          const reusedSpeciesForAttempt =
            Boolean(
              knownSpecies
            )

          // ------------------------------------------
          // Storage analysis timing
          //
          // With no knownSpecies this behaves exactly
          // like V7R.1.
          //
          // Once knownSpecies exists, analyzeStorageCrop
          // skips only its name/species OCR path.
          // ------------------------------------------

          const storageAnalysisStart =
            getNow()

          const analysis =
            await analyzeStorageCrop(
              crop,
              {
                knownSpecies,
              }
            )

          const storageAnalysisMs =
            getElapsedMs(
              storageAnalysisStart
            )

          performanceTotals.storageAnalysisMs +=
            storageAnalysisMs

          addStoragePerformance(
            performanceTotals,
            analysis?.performance
          )

          successfulOcr +=
            1

          const result = {
            appearance,

            crop,

            analysis,

            reusedKnownSpecies:
              Boolean(
                analysis
                  ?.performance
                  ?.reusedKnownSpecies
              ),

            performance: {
              cropMs,

              storageAnalysisMs,
            },
          }

          results.push(
            result
          )

          const hasSpecies =
            hasResolvedSpecies(
              analysis
            )

          const hasCp =
            Number.isInteger(
              analysis
                ?.cp
                ?.value
            )

          const cpAgreement =
            analysis
              ?.cp
              ?.agreement ??
            'none'

          // ------------------------------------------
          // V7S:
          // Establish species after the first
          // successful species resolution.
          //
          // This happens AFTER analysis so the first
          // appearance still uses the original OCR
          // path.
          // ------------------------------------------

          if (
            !knownSpecies &&
            hasSpecies
          ) {
            knownSpecies =
              analysis
                .speciesMatch
                .species

            position.knownSpecies =
              knownSpecies

            console.log(
              `[V7S SPECIES] ${position.absolutePosition} -> ` +
              `${
                knownSpecies
                  ?.name ??
                knownSpecies
                  ?.apiName ??
                'UNKNOWN'
              } established from attempt ${attemptIndex + 1}`
            )
          }

          if (
            reusedSpeciesForAttempt
          ) {
            position.speciesReuseCount +=
              1
          }

          const speciesSource =
            analysis
              ?.performance
              ?.reusedKnownSpecies
              ? 'REUSED'
              : 'OCR'

          console.log(
            `[V7S OCR] ${position.absolutePosition} | ` +
            `attempt ${attemptIndex + 1}/${attempts.length} | ` +
            `frame ${appearance.frameIndex + 1} | ` +
            `time ${appearance.timestamp.toFixed(
              2
            )}s | ` +
            `quality ${appearance.qualityScore.toFixed(
              1
            )} | ` +
            `${
              analysis
                ?.recognizedPokemon
                ?.name ??
              'UNKNOWN'
            } | ` +
            `species ${speciesSource} | ` +
            `CP ${
              hasCp
                ? analysis.cp.value
                : '?'
            } | ` +
            `internal ${cpAgreement} | ` +
            `crop ${Math.round(
              cropMs
            )}ms | ` +
            `analysis ${Math.round(
              storageAnalysisMs
            )}ms | ` +
            `raw name "${
              analysis
                ?.name
                ?.rawText ??
              ''
            }" | ` +
            `raw CP "${
              analysis
                ?.cp
                ?.rawText ??
              ''
            }"`
          )

          /*
            Preserve V7N adaptive stopping.

            Two identical independent observations are
            enough to stop further OCR attempts.

            V7S species reuse means later analyses for
            this position carry the established species,
            but the CP observations still come from
            separate recording appearances.

            V7O plausibility filtering remains later.
          */

                    if (
            hasSpecies &&
            hasCp
          ) {
            const currentSpeciesKey =
              getSpeciesKey(
                analysis
              )

            const matchingSpeciesResults =
              results.filter(
                (candidate) =>
                  getSpeciesKey(
                    candidate.analysis
                  ) ===
                    currentSpeciesKey &&
                  Number.isInteger(
                    candidate.analysis
                      ?.cp
                      ?.value
                  )
              )

            const matchingCpCount =
              matchingSpeciesResults.filter(
                (candidate) =>
                  candidate.analysis
                    ?.cp
                    ?.value ===
                    analysis.cp.value
              ).length

            const distinctCpValues =
              new Set(
                matchingSpeciesResults.map(
                  (candidate) =>
                    candidate.analysis
                      .cp
                      .value
                )
              )

            /*
              V7U adaptive stopping.

              Two matching observations only stop
              early when there has been NO conflicting
              CP evidence.

              Example:

              807 -> 807
              Safe to stop.

              807 -> 4 -> 4
              NOT safe to stop. A conflict already
              exists, so use the remaining temporally
              diverse appearance(s).

              This preserves the speed win for clean
              positions while preventing a repeated
              OCR mistake from immediately locking in
              a false majority.
            */

            const hasConflictingCp =
              distinctCpValues.size >
              1

            if (
              matchingCpCount >= 2 &&
              !hasConflictingCp
            ) {
              console.log(
                `[V7U OCR] ${position.absolutePosition} -> ` +
                `CP ${analysis.cp.value} confirmed across ` +
                `${matchingCpCount} conflict-free appearances; ` +
                `remaining appearances skipped`
              )

              break
            }

            if (
              matchingCpCount >= 2 &&
              hasConflictingCp
            ) {
              console.log(
                `[V7U OCR] ${position.absolutePosition} -> ` +
                `CP ${analysis.cp.value} seen ${matchingCpCount} times ` +
                `but conflicting CP evidence exists; ` +
                `continuing validation`
              )
            } else {
              console.log(
                `[V7U OCR] ${position.absolutePosition} -> ` +
                `CP ${analysis.cp.value} seen once; ` +
                `waiting for independent confirmation`
              )
            }
          }
        } catch (
          ocrError
        ) {
          failedOcr +=
            1

          lastError =
            ocrError instanceof Error
              ? ocrError.message
              : 'Storage OCR failed.'

          console.error(
            `[V7S OCR] ${position.absolutePosition} | ` +
            `attempt ${attemptIndex + 1} FAILED`,
            ocrError
          )
        }

        await new Promise(
          (resolve) =>
            window.setTimeout(
              resolve,
              0
            )
        )
      }

      position.ocrAttempts =
        executedAttempts

      position.ocrResults =
        results

      // ----------------------------------------------
      // Species occupancy
      // ----------------------------------------------

      const speciesResult =
        chooseSpeciesResult(
          results
        )

      if (!speciesResult) {
        position.crop =
          null

        position.analysis =
          null

        position.recognizedPokemon =
          null

        position.occupied =
          false

        position.ocrError =
          lastError

        rejectedPositions.push(
          position
        )

        console.log(
          `[V7S] REJECT ${position.absolutePosition} -> ` +
          `no species recognized across ${executedAttempts} attempts`
        )

        onProgress?.({
          phase:
            'ocr',

          current:
            positionIndex + 1,

          total:
            positions.length,

          position:
            position.absolutePosition,
        })

        continue
      }

      // ----------------------------------------------
      // Only use CP observations from appearances that
      // resolved to the chosen species.
      //
      // V7S reused analyses resolve to the same species
      // object established for this position.
      // ----------------------------------------------

      const chosenSpeciesKey =
        getSpeciesKey(
          speciesResult.analysis
        )

      const matchingSpeciesResults =
        results.filter(
          (result) =>
            getSpeciesKey(
              result.analysis
            ) ===
            chosenSpeciesKey
        )

      const cpConsensus =
        chooseCrossAppearanceCp(
          matchingSpeciesResults,
          speciesResult.analysis
        )

      const pokemon =
        buildRecognizedPokemon({
          position,

          speciesResult,

          cpConsensus,
        })

      position.bestAppearance =
        speciesResult.appearance

      position.crop =
        speciesResult.crop

      position.analysis =
        speciesResult.analysis

      position.recognizedPokemon =
        pokemon

      position.occupied =
        true

      position.ocrError =
        null

      position.cpConsensus =
        cpConsensus

      recognizedPokemon.push(
        pokemon
      )

      const cpEvidence =
        cpConsensus
          .observations
          .map(
            (observation) =>
              observation.value
          )
          .join(', ')

      const rejectedCpEvidence =
        cpConsensus
          .rejectedObservations
          .map(
            (observation) =>
              observation.value
          )
          .join(', ')

      console.log(
        `[V7S] ACCEPT ${position.absolutePosition} -> ` +
        `${pokemon.name} | ` +
        `CP ${pokemon.cp ?? '?'} | ` +
        `${pokemon.cpAgreement} ` +
        `(${pokemon.cpConsensusCount}/${pokemon.cpConsensusTotal}) | ` +
        `max ${pokemon.cpMaximumPossible ?? '?'} | ` +
        `species reuses ${position.speciesReuseCount} | ` +
        `plausible [${cpEvidence || 'none'}] | ` +
        `rejected [${rejectedCpEvidence || 'none'}]`
      )

      onProgress?.({
        phase:
          'ocr',

        current:
          positionIndex + 1,

        total:
          positions.length,

        position:
          position.absolutePosition,
      })

      await new Promise(
        (resolve) =>
          window.setTimeout(
            resolve,
            0
        )
      )
    }

    // ------------------------------------------------
    // Final position groups
    // ------------------------------------------------

    const occupiedPositions =
      positions.filter(
        (position) =>
          position.occupied
      )

    const geometricRows =
      Array.from(
        new Set(
          positions.map(
            (position) =>
              position.absoluteRow
          )
        )
      ).sort(
        (
          first,
          second
        ) =>
          first -
          second
      )

    const rows =
      Array.from(
        new Set(
          occupiedPositions.map(
            (position) =>
              position.absoluteRow
          )
        )
      ).sort(
        (
          first,
          second
        ) =>
          first -
          second
      )

    const importablePokemon =
      recognizedPokemon.filter(
        (pokemon) =>
          pokemon.name &&
          Number.isFinite(
            pokemon.cp
          )
      )

    const incompletePokemon =
      recognizedPokemon.filter(
        (pokemon) =>
          pokemon.name &&
          !Number.isFinite(
            pokemon.cp
          )
      )

    const duplicateIdentityGroups =
      new Map()

    recognizedPokemon.forEach(
      (pokemon) => {
        const identityKey =
          `${
            pokemon.name ??
            'UNKNOWN'
          }|${
            Number.isFinite(
              pokemon.cp
            )
              ? pokemon.cp
              : '?'
          }`

        const existing =
          duplicateIdentityGroups.get(
            identityKey
          ) ?? []

        existing.push(
          pokemon
        )

        duplicateIdentityGroups.set(
          identityKey,
          existing
        )
      }
    )

    const repeatedIdentities =
      Array.from(
        duplicateIdentityGroups.entries()
      )
        .filter(
          (
            [
              ,
              pokemon,
            ]
          ) =>
            pokemon.length >
            1
        )

    // ------------------------------------------------
    // V7S final performance calculations
    // ------------------------------------------------

    performanceTotals.totalMs =
      getElapsedMs(
        totalStart
      )

    /*
      Every successful analyzed appearance still runs
      exactly three CP Tesseract calls.

      Name OCR is now counted from the actual storage
      analyses rather than assuming one name call per
      successful appearance.
    */

    const cpOcrCalls =
      successfulOcr *
      3

    const nameOcrCalls =
      performanceTotals
        .nameOcrCalls

    const knownSpeciesReuses =
      performanceTotals
        .knownSpeciesReuses

    const actualOcrCalls =
      cpOcrCalls +
      nameOcrCalls

    const avoidedNameOcrCalls =
      knownSpeciesReuses

    const originalEquivalentOcrCalls =
      cpOcrCalls +
      successfulOcr

    const alignmentOcrFrames =
      performanceTotals
        .alignmentFullFrames +
      performanceTotals
        .alignmentCheckpointFrames

    const averageAlignmentMs =
      getAverageMs(
        performanceTotals.alignmentMs,
        alignmentOcrFrames
      )

    const averageAlignmentAcrossAllFramesMs =
      getAverageMs(
        performanceTotals.alignmentMs,
        frames.length
      )

    const averageMovementMs =
      getAverageMs(
        performanceTotals.movementMs,
        Math.max(
          0,
          frames.length - 1
        )
      )

    const averageCropMs =
      getAverageMs(
        performanceTotals.cropMs,
        totalOcrAttempts
      )

    const averageStorageAnalysisMs =
      getAverageMs(
        performanceTotals.storageAnalysisMs,
        successfulOcr
      )

    const averageCpOcrMs =
      getAverageMs(
        performanceTotals.cpOcrMs,
        cpOcrCalls
      )

    const averageNameOcrMs =
      getAverageMs(
        performanceTotals.nameOcrMs,
        nameOcrCalls
      )

    const averageActualOcrMs =
      getAverageMs(
        performanceTotals.cpOcrMs +
          performanceTotals.nameOcrMs,
        actualOcrCalls
      )

    const totalOcrEngineMs =
      performanceTotals.cpOcrMs +
      performanceTotals.nameOcrMs

    const measuredMajorStagesMs =
      performanceTotals.videoLoadMs +
      performanceTotals.frameExtractionMs +
      performanceTotals.alignmentMs +
      performanceTotals.movementMs +
      performanceTotals.detectionTrackingMs +
      performanceTotals.cropMs +
      performanceTotals.storageAnalysisMs

    const orchestrationOtherMs =
      Math.max(
        0,
        performanceTotals.totalMs -
          measuredMajorStagesMs
      )

    const ocrShare =
      performanceTotals.totalMs >
        0
        ? (
            totalOcrEngineMs /
            performanceTotals.totalMs
          ) *
          100
        : 0

    const alignmentShare =
      performanceTotals.totalMs >
        0
        ? (
            performanceTotals.alignmentMs /
            performanceTotals.totalMs
          ) *
          100
        : 0

    const frameExtractionShare =
      performanceTotals.totalMs >
        0
        ? (
            performanceTotals.frameExtractionMs /
            performanceTotals.totalMs
          ) *
          100
        : 0

      // ------------------------------------------------
    // V7R.1 checkpoint diagnostics
    // ------------------------------------------------

    const checkpointResults =
      frameResults.filter(
        (result) =>
          result.alignmentSource ===
            'checkpoint' &&
          Number.isFinite(
            result.checkpointCorrection
          )
      )

    const checkpointCorrections =
      checkpointResults.map(
        (result) =>
          Math.abs(
            result.checkpointCorrection
          )
      )

    const normalizedCheckpointCorrections =
      checkpointResults
        .map(
          (result) =>
            result
              .normalizedCheckpointCorrection
        )
        .filter(
          Number.isFinite
        )
        .map(
          Math.abs
        )

    const maximumCheckpointCorrection =
      checkpointCorrections.length >
        0
        ? Math.max(
            ...checkpointCorrections
          )
        : 0

    const averageCheckpointCorrection =
      checkpointCorrections.length >
        0
        ? checkpointCorrections.reduce(
            (
              total,
              correction
            ) =>
              total +
              correction,
            0
          ) /
          checkpointCorrections.length
        : 0

    const maximumNormalizedCheckpointCorrection =
      normalizedCheckpointCorrections.length >
        0
        ? Math.max(
            ...normalizedCheckpointCorrections
          )
        : 0

    const averageNormalizedCheckpointCorrection =
      normalizedCheckpointCorrections.length >
        0
        ? normalizedCheckpointCorrections.reduce(
            (
              total,
              correction
            ) =>
              total +
              correction,
            0
          ) /
          normalizedCheckpointCorrections.length
        : 0

    // ------------------------------------------------
    // Final accuracy diagnostics
    // ------------------------------------------------

    console.log('')

    console.log(
      '================================'
    )

    console.log(
      'V7S ACCURACY RESULT'
    )

    console.log(
      '================================'
    )

    console.log(
      `Geometric positions: ${positions.length}`
    )

    console.log(
      `Occupied Pokémon positions: ${occupiedPositions.length}`
    )

    console.log(
      `Rejected geometric positions: ${rejectedPositions.length}`
    )

    console.log(
      `Pokémon with accepted CP: ${importablePokemon.length}`
    )

    console.log(
      `Pokémon with unresolved CP: ${incompletePokemon.length}`
    )

    console.log(
      `Position OCR attempts: ${totalOcrAttempts}`
    )

    console.log(
      `Successful analyzed appearances: ${successfulOcr}`
    )

    console.log(
      `Failed analyzed appearances: ${failedOcr}`
    )

    console.log(
      `Actual name OCR calls: ${nameOcrCalls}`
    )

    console.log(
      `Known-species reuses: ${knownSpeciesReuses}`
    )

    console.log(
      `Avoided name OCR calls: ${avoidedNameOcrCalls}`
    )

    console.log(
      `Actual storage-crop Tesseract calls: ${actualOcrCalls}`
    )

    console.log(
      `V7R.1-equivalent storage-crop calls: ${originalEquivalentOcrCalls}`
    )

    if (
      rejectedPositions.length >
      0
    ) {
      console.log(
        `Rejected positions: ${
          rejectedPositions
            .map(
              (position) =>
                position.absolutePosition
            )
            .join(', ')
        }`
      )
    }

    console.log(
      '--------------------------------'
    )

    console.log(
      'FINAL POKÉMON'
    )

    console.log(
      '--------------------------------'
    )

    occupiedPositions.forEach(
      (position) => {
        const pokemon =
          position
            .recognizedPokemon

        const observations =
          pokemon
            ?.cpObservations
            ?.map(
              (observation) =>
                `${observation.value}@F${observation.frameIndex + 1}` +
`(r=${(
  observation.reliability ??
  0
).toFixed(2)})`
            )
            .join(', ') ??
          ''

        const rejectedObservations =
          pokemon
            ?.cpRejectedObservations
            ?.map(
              (observation) =>
                `${observation.value}@F${observation.frameIndex + 1}`
            )
            .join(', ') ??
          ''

        console.log(
          `[V7S] ${position.absolutePosition} | ` +
          `${pokemon?.name ?? 'UNKNOWN'} | ` +
          `CP ${pokemon?.cp ?? '?'} | ` +
          `${pokemon?.cpAgreement ?? 'none'} | ` +
          `max ${pokemon?.cpMaximumPossible ?? '?'} | ` +
          `species reuses ${position.speciesReuseCount ?? 0} | ` +
          `evidence [${observations || 'none'}] | ` +
          `rejected [${rejectedObservations || 'none'}]`
        )
      }
    )

    // ------------------------------------------------
    // V7S performance diagnostics
    // ------------------------------------------------

    console.log('')

    console.log(
      '================================'
    )

    console.log(
      'V7S PERFORMANCE BREAKDOWN'
    )

    console.log(
      '================================'
    )

    console.log(
      `TOTAL RECORDING ANALYSIS: ${formatMilliseconds(
        performanceTotals.totalMs
      )}`
    )

    console.log(
      '--------------------------------'
    )

    console.log(
      'ALIGNMENT STRATEGY'
    )

    console.log(
      '--------------------------------'
    )

    console.log(
      `Full-alignment frames: ${performanceTotals.alignmentFullFrames}`
    )

    console.log(
      `Checkpoint-alignment frames: ${performanceTotals.alignmentCheckpointFrames}`
    )

    console.log(
      `Predicted-alignment frames: ${performanceTotals.alignmentPredictedFrames}`
    )

    console.log(
      `Total OCR-alignment frames: ${alignmentOcrFrames}/${frames.length}`
    )

    console.log(
      `Checkpoint interval: ${ALIGNMENT_CHECKPOINT_INTERVAL}`
    )

    console.log(
      `Average checkpoint correction: ${averageCheckpointCorrection.toFixed(
        2
      )} px`
    )

    console.log(
      `Maximum checkpoint correction: ${maximumCheckpointCorrection.toFixed(
        2
      )} px`
    )

    console.log(
      `Average phase-normalized correction: ${averageNormalizedCheckpointCorrection.toFixed(
        2
      )} px`
    )

    console.log(
      `Maximum phase-normalized correction: ${maximumNormalizedCheckpointCorrection.toFixed(
        2
      )} px`
    )

    console.log(
      '--------------------------------'
    )

    console.log(
      'MAJOR STAGES'
    )

    console.log(
      '--------------------------------'
    )

    console.log(
      `Video load: ${formatMilliseconds(
        performanceTotals.videoLoadMs
      )}`
    )

    console.log(
      `Frame extraction: ${formatMilliseconds(
        performanceTotals.frameExtractionMs
      )} (${frameExtractionShare.toFixed(
        1
      )}%)`
    )

    console.log(
      `Grid alignment: ${formatMilliseconds(
        performanceTotals.alignmentMs
      )} (${alignmentShare.toFixed(
        1
      )}%)`
    )

    console.log(
      `Frame movement: ${formatMilliseconds(
        performanceTotals.movementMs
      )}`
    )

    console.log(
      `Detection/tracking: ${formatMilliseconds(
        performanceTotals.detectionTrackingMs
      )}`
    )

    console.log(
      `Crop generation: ${formatMilliseconds(
        performanceTotals.cropMs
      )}`
    )

    console.log(
      `Storage analysis: ${formatMilliseconds(
        performanceTotals.storageAnalysisMs
      )}`
    )

    console.log(
      `Orchestration / yielding / other: ${formatMilliseconds(
        orchestrationOtherMs
      )}`
    )

    console.log(
      '--------------------------------'
    )

    console.log(
      'STORAGE ANALYSIS DETAIL'
    )

    console.log(
      '--------------------------------'
    )

    console.log(
      `Crop image loading: ${formatMilliseconds(
        performanceTotals.imageLoadMs
      )}`
    )

    console.log(
      `CP preprocessing: ${formatMilliseconds(
        performanceTotals.cpPreprocessingMs
      )}`
    )

    console.log(
      `CP OCR - normal: ${formatMilliseconds(
        performanceTotals.cpNormalOcrMs
      )}`
    )

    console.log(
      `CP OCR - strong: ${formatMilliseconds(
        performanceTotals.cpStrongOcrMs
      )}`
    )

    console.log(
      `CP OCR - threshold: ${formatMilliseconds(
        performanceTotals.cpThresholdOcrMs
      )}`
    )

    console.log(
      `CP OCR total: ${formatMilliseconds(
        performanceTotals.cpOcrMs
      )}`
    )

    console.log(
      `CP consensus: ${formatMilliseconds(
        performanceTotals.cpConsensusMs
      )}`
    )

    console.log(
      `Name preprocessing: ${formatMilliseconds(
        performanceTotals.namePreprocessingMs
      )}`
    )

    console.log(
      `Name OCR: ${formatMilliseconds(
        performanceTotals.nameOcrMs
      )}`
    )

    console.log(
      `Species resolution: ${formatMilliseconds(
        performanceTotals.speciesResolutionMs
      )}`
    )

    console.log(
      `Storage-analysis other: ${formatMilliseconds(
        performanceTotals.storageOtherMs
      )}`
    )

    console.log(
      '--------------------------------'
    )

    console.log(
      'V7S SPECIES REUSE'
    )

    console.log(
      '--------------------------------'
    )

    console.log(
      `Successful analyzed appearances: ${successfulOcr}`
    )

    console.log(
      `Name OCR calls performed: ${nameOcrCalls}`
    )

    console.log(
      `Known-species reuses: ${knownSpeciesReuses}`
    )

    console.log(
      `Name OCR calls avoided: ${avoidedNameOcrCalls}`
    )

    const nameReuseRate =
      successfulOcr >
        0
        ? (
            knownSpeciesReuses /
            successfulOcr
          ) *
          100
        : 0

    console.log(
      `Species reuse rate: ${nameReuseRate.toFixed(
        1
      )}%`
    )

    console.log(
      '--------------------------------'
    )

    console.log(
      'OCR ENGINE'
    )

    console.log(
      '--------------------------------'
    )

    console.log(
      `CP OCR calls: ${cpOcrCalls}`
    )

    console.log(
      `Name OCR calls: ${nameOcrCalls}`
    )

    console.log(
      `Storage-crop OCR calls: ${actualOcrCalls}`
    )

    console.log(
      `V7R.1-equivalent calls without species reuse: ${originalEquivalentOcrCalls}`
    )

    console.log(
      `Storage OCR calls avoided: ${avoidedNameOcrCalls}`
    )

    console.log(
      `Storage OCR engine time: ${formatMilliseconds(
        totalOcrEngineMs
      )} (${ocrShare.toFixed(
        1
      )}% of total)`
    )

    console.log(
      'Note: storage-crop OCR call counts do not include OCR performed by grid alignment.'
    )

    console.log(
      '--------------------------------'
    )

    console.log(
      'AVERAGES'
    )

    console.log(
      '--------------------------------'
    )

    console.log(
      `Alignment / OCR-aligned frame: ${formatMilliseconds(
        averageAlignmentMs
      )}`
    )

    console.log(
      `Alignment cost / all frames: ${formatMilliseconds(
        averageAlignmentAcrossAllFramesMs
      )}`
    )

    console.log(
      `Movement / transition: ${formatMilliseconds(
        averageMovementMs
      )}`
    )

    console.log(
      `Crop / appearance: ${formatMilliseconds(
        averageCropMs
      )}`
    )

    console.log(
      `Storage analysis / appearance: ${formatMilliseconds(
        averageStorageAnalysisMs
      )}`
    )

    console.log(
      `CP OCR / call: ${formatMilliseconds(
        averageCpOcrMs
      )}`
    )

    console.log(
      `Name OCR / performed call: ${formatMilliseconds(
        averageNameOcrMs
      )}`
    )

    console.log(
      `All storage OCR / performed call: ${formatMilliseconds(
        averageActualOcrMs
      )}`
    )

    console.log(
      '================================'
    )

    // ------------------------------------------------
    // Return
    // ------------------------------------------------

    return {
      source: {
        name:
          file.name,

        type:
          file.type,

        size:
          file.size,

        duration:
          video.duration,

        width:
          video.videoWidth,

        height:
          video.videoHeight,

        interval,

        analyzedAt:
          new Date()
            .toISOString(),
      },

      frameResults,

      positions,

      occupiedPositions,

      rejectedPositions,

      detectedPokemon:
        recognizedPokemon,

      importablePokemon,

      incompletePokemon,

      performance: {
        ...performanceTotals,

        orchestrationOtherMs,

        measuredMajorStagesMs,

        totalOcrEngineMs,

        cpOcrCalls,

        nameOcrCalls,

        knownSpeciesReuses,

        avoidedNameOcrCalls,

        originalEquivalentOcrCalls,

        actualOcrCalls,

        nameReuseRate,

        alignment: {
          checkpointInterval:
            ALIGNMENT_CHECKPOINT_INTERVAL,

          fullFrames:
            performanceTotals
              .alignmentFullFrames,

          checkpointFrames:
            performanceTotals
              .alignmentCheckpointFrames,

          predictedFrames:
            performanceTotals
              .alignmentPredictedFrames,

          ocrAlignedFrames:
            alignmentOcrFrames,

          averageCheckpointCorrection,

          maximumCheckpointCorrection,

          averageNormalizedCheckpointCorrection,

          maximumNormalizedCheckpointCorrection,
        },

        averages: {
          alignmentMs:
            averageAlignmentMs,

          alignmentAcrossAllFramesMs:
            averageAlignmentAcrossAllFramesMs,

          movementMs:
            averageMovementMs,

          cropMs:
            averageCropMs,

          storageAnalysisMs:
            averageStorageAnalysisMs,

          cpOcrMs:
            averageCpOcrMs,

          nameOcrMs:
            averageNameOcrMs,

          actualOcrMs:
            averageActualOcrMs,
        },

        percentages: {
          frameExtraction:
            frameExtractionShare,

          alignment:
            alignmentShare,

          ocrEngine:
            ocrShare,
        },
      },

      summary: {
        frames:
          frames.length,

        geometricPositions:
          positions.length,

        uniquePositions:
          occupiedPositions.length,

        rejectedPositions:
          rejectedPositions.length,

        geometricRows:
          geometricRows.length,

        uniqueRows:
          rows.length,

        rows,

        expectedPokemon:
          36,

        baselineListY,

        cumulativeResolvedY,

        trackedPokemon:
          occupiedPositions.length,

        detectedPokemon:
          recognizedPokemon.length,

        importablePokemon:
          importablePokemon.length,

        incompletePokemon:
          incompletePokemon.length,

        totalOcrAttempts,

        cpOcrCalls,

        nameOcrCalls,

        knownSpeciesReuses,

        avoidedNameOcrCalls,

        actualOcrCalls,

        originalEquivalentOcrCalls,

        nameReuseRate,

        ocrPositionsAttempted:
          positions.length,

        ocrPositionsSucceeded:
          successfulOcr,

        ocrPositionsFailed:
          failedOcr,

        repeatedIdentities:
          repeatedIdentities.length,

        weakMovementFrames:
          resolvedMovements.filter(
            (movement) =>
              movement.weak
          ).length,

        frameErrors:
          frameResults.filter(
            (result) =>
              Boolean(
                result.error
              )
          ).length,

        alignment: {
          checkpointInterval:
            ALIGNMENT_CHECKPOINT_INTERVAL,

          fullFrames:
            performanceTotals
              .alignmentFullFrames,

          checkpointFrames:
            performanceTotals
              .alignmentCheckpointFrames,

          predictedFrames:
            performanceTotals
              .alignmentPredictedFrames,

          ocrAlignedFrames:
            alignmentOcrFrames,

          averageCheckpointCorrection,

          maximumCheckpointCorrection,

          averageNormalizedCheckpointCorrection,

          maximumNormalizedCheckpointCorrection,
        },

        performanceMs: {
          total:
            performanceTotals.totalMs,

          frameExtraction:
            performanceTotals.frameExtractionMs,

          alignment:
            performanceTotals.alignmentMs,

          movement:
            performanceTotals.movementMs,

          detectionTracking:
            performanceTotals.detectionTrackingMs,

          cropping:
            performanceTotals.cropMs,

          storageAnalysis:
            performanceTotals.storageAnalysisMs,

          cpOcr:
            performanceTotals.cpOcrMs,

          nameOcr:
            performanceTotals.nameOcrMs,

          totalOcrEngine:
            totalOcrEngineMs,
        },
      },
    }
  } finally {
    cleanupRecordingVideo({
      video,
      objectUrl,
    })
  }
}

export default analyzeRecording