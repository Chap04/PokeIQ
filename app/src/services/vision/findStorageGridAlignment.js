import {
  recognizeImage,
} from './runOcr'

import {
  resolveStorageSpecies,
} from './resolveStorageSpecies'

import {
  detectStorageRegions,
} from './detectStorageRegions'

// --------------------------------------------------
// Storage Grid Alignment V7Q
//
// V7Q keeps the existing full OCR alignment search
// for the first frame and as a recovery fallback.
//
// The previous fast path performed:
// - 7 candidate OCR probes
// - 1 confirmation OCR probe
//
// on essentially every subsequent frame.
//
// V7Q replaces that with adaptive fast alignment:
//
// 1. Probe the previous frame's offset.
// 2. If species resolves, accept immediately.
// 3. Otherwise probe one nearby offset above.
// 4. Probe one nearby offset below.
// 5. If either recovery probe resolves, use the
//    strongest recognized candidate.
// 6. If all three fail, fall back to the original
//    full search.
//
// This preserves the alignment contract while greatly
// reducing routine alignment OCR.
//
// V7H list-space tracking remains untouched.
// --------------------------------------------------

const NAME_BAND = {
  top: 0.68,
  bottom: 0.98,
}

const OCR_SCALE = 4

const NAME_WHITELIST =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-' ."

// --------------------------------------------------
// V7Q adaptive fast-search settings
// --------------------------------------------------

// Local recovery distance around the previous phase.
//
// This uses the same 18% radius as the previous fast
// search, but V7Q only probes one offset on either
// side instead of scanning five local candidates plus
// two row-boundary candidates.
const FAST_SEARCH_RADIUS_RATIO =
  0.18

// --------------------------------------------------
// Image helpers
// --------------------------------------------------

function loadImage(
  source
) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const image =
        new Image()

      image.onload = () =>
        resolve(image)

      image.onerror = () =>
        reject(
          new Error(
            'Could not load the recording frame for grid alignment.'
          )
        )

      image.src =
        source
    }
  )
}

function clamp(
  value,
  minimum,
  maximum
) {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value
    )
  )
}

// --------------------------------------------------
// Name band generation
// --------------------------------------------------

function createNameBandCanvas({
  image,
  region,
}) {
  const sourceX =
    Math.round(
      region.x
    )

  const sourceY =
    Math.round(
      region.y +
        region.height *
          NAME_BAND.top
    )

  const sourceWidth =
    Math.max(
      1,
      Math.round(
        region.width
      )
    )

  const sourceHeight =
    Math.max(
      1,
      Math.round(
        region.height *
          (
            NAME_BAND.bottom -
            NAME_BAND.top
          )
      )
    )

  const safeX =
    clamp(
      sourceX,
      0,
      Math.max(
        0,
        image.naturalWidth -
          1
      )
    )

  const safeY =
    clamp(
      sourceY,
      0,
      Math.max(
        0,
        image.naturalHeight -
          1
      )
    )

  const safeWidth =
    Math.min(
      sourceWidth,
      image.naturalWidth -
        safeX
    )

  const safeHeight =
    Math.min(
      sourceHeight,
      image.naturalHeight -
        safeY
    )

  if (
    safeWidth <= 0 ||
    safeHeight <= 0
  ) {
    return null
  }

  const canvas =
    document.createElement(
      'canvas'
    )

  canvas.width =
    Math.max(
      1,
      Math.round(
        safeWidth *
          OCR_SCALE
      )
    )

  canvas.height =
    Math.max(
      1,
      Math.round(
        safeHeight *
          OCR_SCALE
      )
    )

  const context =
    canvas.getContext(
      '2d',
      {
        willReadFrequently:
          true,
      }
    )

  if (!context) {
    throw new Error(
      'Could not create the alignment OCR canvas.'
    )
  }

  context.imageSmoothingEnabled =
    true

  context.imageSmoothingQuality =
    'high'

  context.drawImage(
    image,
    safeX,
    safeY,
    safeWidth,
    safeHeight,
    0,
    0,
    canvas.width,
    canvas.height
  )

  const imageData =
    context.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    )

  const data =
    imageData.data

  const contrast =
    1.75

  const brightness =
    10

  for (
    let index = 0;
    index < data.length;
    index += 4
  ) {
    const red =
      data[index]

    const green =
      data[index + 1]

    const blue =
      data[index + 2]

    const grayscale =
      (
        red * 0.299 +
        green * 0.587 +
        blue * 0.114
      )

    const adjusted =
      clamp(
        (
          grayscale -
          128
        ) *
          contrast +
          128 +
          brightness,
        0,
        255
      )

    data[index] =
      adjusted

    data[index + 1] =
      adjusted

    data[index + 2] =
      adjusted
  }

  context.putImageData(
    imageData,
    0,
    0
  )

  return canvas
}

// --------------------------------------------------
// Region helpers
// --------------------------------------------------

function findProbeRegion(
  detection,
  preferredRow
) {
  if (
    !detection?.regions?.length
  ) {
    return null
  }

  const centerColumn =
    1

  const exact =
    detection.regions.find(
      (region) =>
        region.column ===
          centerColumn &&
        region.row ===
          preferredRow
    )

  if (exact) {
    return exact
  }

  return (
    detection.regions.find(
      (region) =>
        region.column ===
        centerColumn
    ) ??
    detection.regions[0] ??
    null
  )
}

// --------------------------------------------------
// Probe one candidate alignment
// --------------------------------------------------

async function probeAlignment({
  image,
  width,
  height,
  offsetY,
  preferredRow,
}) {
  const detection =
    detectStorageRegions({
      width,
      height,
      offsetY,
    })

  const region =
    findProbeRegion(
      detection,
      preferredRow
    )

  if (!region) {
    return {
      offsetY,
      score: 0,
      species: null,
      rawText: '',
      speciesConfidence: 0,
      ocrConfidence: 0,
      detection,
    }
  }

  const canvas =
    createNameBandCanvas({
      image,
      region,
    })

  if (!canvas) {
    return {
      offsetY,
      score: 0,
      species: null,
      rawText: '',
      speciesConfidence: 0,
      ocrConfidence: 0,
      detection,
    }
  }

  const recognition =
    await recognizeImage(
      canvas,
      {
        label:
          `Storage alignment ${offsetY}`,

        whitelist:
          NAME_WHITELIST,
      }
    )

  const rawText =
    recognition?.text?.trim?.() ??
    ''

  const speciesMatch =
    resolveStorageSpecies(
      rawText
    )

  const speciesConfidence =
    speciesMatch?.confidence ??
    0

  const ocrConfidence =
    Math.round(
      recognition?.confidence ??
        0
    )

  const score =
    speciesMatch?.species
      ? 100 +
        speciesConfidence +
        ocrConfidence *
          0.1
      : ocrConfidence *
        0.05

  return {
    offsetY,
    score,

    species:
      speciesMatch?.species ??
      null,

    rawText,

    speciesConfidence,

    ocrConfidence,

    matchType:
      speciesMatch?.matchType ??
      null,

    detection,
  }
}

// --------------------------------------------------
// Full-search candidate generation
// --------------------------------------------------

function buildBroadOffsets(
  rowStepPixels
) {
  const halfStep =
    rowStepPixels / 2

  const increments =
    6

  const offsets =
    []

  for (
    let index = 0;
    index <= increments;
    index += 1
  ) {
    const ratio =
      index /
      increments

    offsets.push(
      Math.round(
        -halfStep +
          rowStepPixels *
            ratio
      )
    )
  }

  return Array.from(
    new Set(offsets)
  )
}

function buildRefinedOffsets({
  winner,
  rowStepPixels,
}) {
  const broadStep =
    rowStepPixels / 6

  const refineStep =
    broadStep / 4

  const offsets =
    []

  for (
    let index = -2;
    index <= 2;
    index += 1
  ) {
    offsets.push(
      Math.round(
        winner +
          refineStep *
            index
      )
    )
  }

  return Array.from(
    new Set(offsets)
  )
}

// --------------------------------------------------
// Result builder
// --------------------------------------------------

function buildAlignmentResult({
  winner,
  confirmation,
  mode,
  candidates,
  successfulProbes,
  rowStepPixels,
}) {
  const primarySpecies =
    winner?.species ??
    null

  const confirmationSpecies =
    confirmation?.species ??
    null

  const usable =
    Boolean(
      primarySpecies ||
      confirmationSpecies
    )

  const combinedScore =
    (
      winner?.score ??
      0
    ) +
    (
      confirmation?.score ??
      0
    )

  return {
    offsetY:
      winner?.offsetY ??
      0,

    usable,

    score:
      combinedScore,

    successfulProbes,

    rowStepPixels:
      Math.round(
        rowStepPixels
      ),

    mode,

    primaryProbe: {
      species:
        primarySpecies,

      rawText:
        winner?.rawText ??
        '',

      speciesConfidence:
        winner
          ?.speciesConfidence ??
        0,

      ocrConfidence:
        winner
          ?.ocrConfidence ??
        0,

      matchType:
        winner?.matchType ??
        null,
    },

    confirmationProbe:
      confirmation
        ? {
            species:
              confirmation.species,

            rawText:
              confirmation.rawText ??
              '',

            speciesConfidence:
              confirmation
                .speciesConfidence ??
              0,

            ocrConfidence:
              confirmation
                .ocrConfidence ??
              0,

            matchType:
              confirmation.matchType ??
              null,
          }
        : null,

    candidates:
      candidates.map(
        (candidate) => ({
          offsetY:
            candidate.offsetY,

          score:
            candidate.score,

          species:
            candidate.species
              ?.name ??
            null,
        })
      ),
  }
}

// --------------------------------------------------
// V7Q adaptive fast alignment
// --------------------------------------------------

async function findFastAlignment({
  image,
  width,
  height,
  previousAlignment,
  onProgress,
}) {
  const rowStepPixels =
    height *
    0.17

  const previousOffset =
    Number.isFinite(
      previousAlignment?.offsetY
    )
      ? Math.round(
          previousAlignment.offsetY
        )
      : 0

  const recoveryDistance =
    Math.max(
      8,
      Math.round(
        rowStepPixels *
          FAST_SEARCH_RADIUS_RATIO
      )
    )

  // ------------------------------------------------
  // Probe 1:
  // previous alignment exactly.
  //
  // This is the expected common path.
  // ------------------------------------------------

  const primary =
    await probeAlignment({
      image,
      width,
      height,

      offsetY:
        previousOffset,

      preferredRow:
        1,
    })

  onProgress?.({
    phase:
      'alignment',

    mode:
      'adaptive-fast',

    current:
      1,

    total:
      3,
  })

  if (primary.species) {
    return buildAlignmentResult({
      winner:
        primary,

      confirmation:
        null,

      mode:
        'adaptive-fast-direct',

      candidates: [
        primary,
      ],

      successfulProbes:
        1,

      rowStepPixels,
    })
  }

  // ------------------------------------------------
  // Primary failed.
  //
  // Probe one local candidate above and below the
  // previous phase.
  // ------------------------------------------------

  const upperOffset =
    previousOffset -
    recoveryDistance

  const lowerOffset =
    previousOffset +
    recoveryDistance

  const upper =
    await probeAlignment({
      image,
      width,
      height,

      offsetY:
        upperOffset,

      preferredRow:
        1,
    })

  onProgress?.({
    phase:
      'alignment',

    mode:
      'adaptive-fast',

    current:
      2,

    total:
      3,
  })

  const lower =
    await probeAlignment({
      image,
      width,
      height,

      offsetY:
        lowerOffset,

      preferredRow:
        1,
    })

  onProgress?.({
    phase:
      'alignment',

    mode:
      'adaptive-fast',

    current:
      3,

    total:
      3,
  })

  const recoveryResults =
    [
      upper,
      lower,
    ]

  const recognizedRecovery =
    recoveryResults
      .filter(
        (result) =>
          Boolean(
            result.species
          )
      )
      .sort(
        (
          first,
          second
        ) =>
          second.score -
          first.score
      )

  const winner =
    recognizedRecovery[0] ??
    null

  if (!winner) {
    return null
  }

  return buildAlignmentResult({
    winner,

    confirmation:
      null,

    mode:
      'adaptive-fast-recovery',

    candidates: [
      primary,
      upper,
      lower,
    ],

    successfulProbes:
      recognizedRecovery.length,

    rowStepPixels,
  })
}

// --------------------------------------------------
// Full alignment
//
// This remains the original V7O/V7P full search.
// --------------------------------------------------

async function findFullAlignment({
  image,
  width,
  height,
  onProgress,
}) {
  const rowStepPixels =
    height *
    0.17

  const broadOffsets =
    buildBroadOffsets(
      rowStepPixels
    )

  const broadResults =
    []

  let completed =
    0

  const estimatedTotal =
    broadOffsets.length +
    5 +
    2

  for (
    const offsetY of broadOffsets
  ) {
    const result =
      await probeAlignment({
        image,
        width,
        height,
        offsetY,
        preferredRow:
          1,
      })

    broadResults.push(
      result
    )

    completed += 1

    onProgress?.({
      phase:
        'alignment',

      mode:
        'full',

      current:
        completed,

      total:
        estimatedTotal,
    })

    await new Promise(
      (resolve) =>
        window.setTimeout(
          resolve,
          0
        )
    )
  }

  broadResults.sort(
    (
      first,
      second
    ) =>
      second.score -
      first.score
  )

  const broadWinner =
    broadResults[0]

  const refinedOffsets =
    buildRefinedOffsets({
      winner:
        broadWinner?.offsetY ??
        0,

      rowStepPixels,
    })

  const refinedResults =
    []

  for (
    const offsetY of refinedOffsets
  ) {
    const result =
      await probeAlignment({
        image,
        width,
        height,
        offsetY,
        preferredRow:
          1,
      })

    refinedResults.push(
      result
    )

    completed += 1

    onProgress?.({
      phase:
        'alignment',

      mode:
        'full',

      current:
        completed,

      total:
        estimatedTotal,
    })

    await new Promise(
      (resolve) =>
        window.setTimeout(
          resolve,
          0
        )
    )
  }

  const combinedResults =
    [
      ...broadResults,
      ...refinedResults,
    ]

  combinedResults.sort(
    (
      first,
      second
    ) =>
      second.score -
      first.score
  )

  const strongestTwo =
    combinedResults.slice(
      0,
      2
    )

  const confirmedResults =
    []

  for (
    const candidate of strongestTwo
  ) {
    const confirmation =
      await probeAlignment({
        image,
        width,
        height,

        offsetY:
          candidate.offsetY,

        preferredRow:
          2,
      })

    completed += 1

    onProgress?.({
      phase:
        'alignment',

      mode:
        'full',

      current:
        completed,

      total:
        estimatedTotal,
    })

    confirmedResults.push({
      ...candidate,

      confirmation,

      combinedScore:
        candidate.score +
        confirmation.score,
    })
  }

  confirmedResults.sort(
    (
      first,
      second
    ) =>
      second.combinedScore -
      first.combinedScore
  )

  const winner =
    confirmedResults[0]

  const successfulProbes =
    [
      winner?.species,
      winner
        ?.confirmation
        ?.species,
    ].filter(Boolean).length

  return buildAlignmentResult({
    winner,

    confirmation:
      winner?.confirmation ??
      null,

    mode:
      'full',

    candidates:
      confirmedResults,

    successfulProbes,

    rowStepPixels,
  })
}

// --------------------------------------------------
// Main alignment finder
// --------------------------------------------------

async function findStorageGridAlignment(
  frame,
  {
    previousAlignment = null,
    forceFullSearch = false,
    onProgress = null,
  } = {}
) {
  if (
    !frame?.previewUrl
  ) {
    throw new Error(
      'A recording frame preview is required for storage-grid alignment.'
    )
  }

  if (
    !Number.isFinite(
      frame.width
    ) ||
    !Number.isFinite(
      frame.height
    )
  ) {
    throw new Error(
      'The recording frame must include valid dimensions.'
    )
  }

  const image =
    await loadImage(
      frame.previewUrl
    )

  // ------------------------------------------------
  // First frame:
  // preserve the original full OCR search.
  //
  // Subsequent frames:
  // try V7Q adaptive fast alignment.
  // ------------------------------------------------

  if (
    previousAlignment &&
    !forceFullSearch
  ) {
    const fastResult =
      await findFastAlignment({
        image,

        width:
          frame.width,

        height:
          frame.height,

        previousAlignment,

        onProgress,
      })

    if (fastResult) {
      return fastResult
    }

    console.log(
      '[V7Q ALIGNMENT] Adaptive fast alignment failed; falling back to full search.'
    )
  }

  return findFullAlignment({
    image,

    width:
      frame.width,

    height:
      frame.height,

    onProgress,
  })
}

export {
  findStorageGridAlignment,
}

export default findStorageGridAlignment