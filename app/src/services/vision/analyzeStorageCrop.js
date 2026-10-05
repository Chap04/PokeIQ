import {
  recognizeImage,
} from './runOcr'

import {
  resolveStorageSpecies,
} from './resolveStorageSpecies'

// --------------------------------------------------
// Performance timing
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

      image.onload =
        () => {
          resolve(
            image
          )
        }

      image.onerror =
        () => {
          reject(
            new Error(
              'The storage crop could not be loaded for OCR.'
            )
          )
        }

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

function cloneCanvas(
  source
) {
  const canvas =
    document.createElement(
      'canvas'
    )

  canvas.width =
    source.width

  canvas.height =
    source.height

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
      'Canvas OCR preprocessing is unavailable.'
    )
  }

  context.drawImage(
    source,
    0,
    0
  )

  return canvas
}

// --------------------------------------------------
// Text-band creation
// --------------------------------------------------

function createTextBand(
  image,
  {
    top,
    bottom,

    left = 0,
    right = 1,

    scale = 4,
  }
) {
  const normalizedLeft =
    clamp(
      left,
      0,
      1
    )

  const normalizedRight =
    clamp(
      right,
      0,
      1
    )

  const normalizedTop =
    clamp(
      top,
      0,
      1
    )

  const normalizedBottom =
    clamp(
      bottom,
      0,
      1
    )

  const sourceLeft =
    Math.round(
      image.naturalWidth *
        normalizedLeft
    )

  const sourceRight =
    Math.round(
      image.naturalWidth *
        normalizedRight
    )

  const sourceTop =
    Math.round(
      image.naturalHeight *
        normalizedTop
    )

  const sourceBottom =
    Math.round(
      image.naturalHeight *
        normalizedBottom
    )

  const sourceWidth =
    Math.max(
      1,
      sourceRight -
        sourceLeft
    )

  const sourceHeight =
    Math.max(
      1,
      sourceBottom -
        sourceTop
    )

  const canvas =
    document.createElement(
      'canvas'
    )

  canvas.width =
    Math.max(
      1,
      Math.round(
        sourceWidth *
          scale
      )
    )

  canvas.height =
    Math.max(
      1,
      Math.round(
        sourceHeight *
          scale
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
      'Canvas OCR preprocessing is unavailable.'
    )
  }

  context.imageSmoothingEnabled =
    true

  context.imageSmoothingQuality =
    'high'

  context.drawImage(
    image,

    sourceLeft,
    sourceTop,
    sourceWidth,
    sourceHeight,

    0,
    0,
    canvas.width,
    canvas.height
  )

  return canvas
}

// --------------------------------------------------
// Preprocessing
// --------------------------------------------------

function applyGrayscaleContrast(
  canvas,
  {
    contrast = 1.5,
    brightness = 10,
  } = {}
) {
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
      'Canvas OCR preprocessing is unavailable.'
    )
  }

  const imageData =
    context.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    )

  const pixels =
    imageData.data

  for (
    let index = 0;
    index <
    pixels.length;
    index += 4
  ) {
    const red =
      pixels[index]

    const green =
      pixels[
        index + 1
      ]

    const blue =
      pixels[
        index + 2
      ]

    let value =
      red * 0.299 +
      green * 0.587 +
      blue * 0.114

    value =
      128 +
      contrast *
        (
          value -
          128
        ) +
      brightness

    value =
      clamp(
        value,
        0,
        255
      )

    pixels[index] =
      value

    pixels[
      index + 1
    ] =
      value

    pixels[
      index + 2
    ] =
      value
  }

  context.putImageData(
    imageData,
    0,
    0
  )

  return canvas
}

function applyThreshold(
  canvas,
  threshold = 175
) {
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
      'Canvas OCR preprocessing is unavailable.'
    )
  }

  const imageData =
    context.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    )

  const pixels =
    imageData.data

  for (
    let index = 0;
    index <
    pixels.length;
    index += 4
  ) {
    const red =
      pixels[index]

    const green =
      pixels[
        index + 1
      ]

    const blue =
      pixels[
        index + 2
      ]

    const grayscale =
      red * 0.299 +
      green * 0.587 +
      blue * 0.114

    const value =
      grayscale <
      threshold
        ? 0
        : 255

    pixels[index] =
      value

    pixels[
      index + 1
    ] =
      value

    pixels[
      index + 2
    ] =
      value
  }

  context.putImageData(
    imageData,
    0,
    0
  )

  return canvas
}

// --------------------------------------------------
// CP-label masking
// --------------------------------------------------

function maskCpLabel(
  canvas
) {
  const context =
    canvas.getContext(
      '2d'
    )

  if (!context) {
    throw new Error(
      'Canvas CP masking is unavailable.'
    )
  }

  /*
    V7S PERFORMANCE

    Accuracy behavior remains unchanged.

    Preserve the existing 35% mask so V7S remains
    directly comparable with the successful V7O
    accuracy baseline.
  */

  const maskWidth =
    Math.round(
      canvas.width *
        0.35
    )

  context.fillStyle =
    '#ffffff'

  context.fillRect(
    0,
    0,
    maskWidth,
    canvas.height
  )

  return canvas
}

// --------------------------------------------------
// Text cleanup
// --------------------------------------------------

function cleanText(
  value = ''
) {
  return String(
    value
  )
    .replace(
      /\s+/g,
      ' '
    )
    .trim()
}

function parseCp(
  text
) {
  const cleaned =
    cleanText(
      text
    )

  const digits =
    cleaned.replace(
      /\D/g,
      ''
    )

  if (!digits) {
    return null
  }

  const value =
    Number(
      digits
    )

  if (
    !Number.isInteger(
      value
    ) ||
    value < 1 ||
    value > 10000
  ) {
    return null
  }

  return value
}

// --------------------------------------------------
// One CP OCR pass
// --------------------------------------------------

async function recognizeCpPass(
  canvas,
  {
    crop,
    id,
  }
) {
  const passStart =
    getNow()

  const recognition =
    await recognizeImage(
      canvas,
      {
        label:
          `storage-${crop.id}-cp-${id}`,

        whitelist:
          '0123456789',
      }
    )

  const elapsedMs =
    getElapsedMs(
      passStart
    )

  const rawText =
    cleanText(
      recognition
        ?.rawText
    )

  return {
    id,

    rawText,

    value:
      parseCp(
        rawText
      ),

    confidence:
      Math.round(
        recognition
          ?.confidence ??
          0
      ),

    previewUrl:
      canvas.toDataURL(
        'image/png'
      ),

    timing:
      recognition
        ?.timing ??
      null,

    performance: {
      totalMs:
        elapsedMs,
    },
  }
}

// --------------------------------------------------
// CP consensus
// --------------------------------------------------

function chooseCpConsensus(
  passes
) {
  const validPasses =
    passes.filter(
      (pass) =>
        Number.isInteger(
          pass.value
        )
    )

  if (
    validPasses.length ===
    0
  ) {
    return {
      value:
        null,

      selectedPass:
        passes[0] ??
        null,

      agreement:
        'none',

      consensusCount:
        0,
    }
  }

  const counts =
    new Map()

  validPasses.forEach(
    (pass) => {
      counts.set(
        pass.value,
        (
          counts.get(
            pass.value
          ) ??
          0
        ) + 1
      )
    }
  )

  const ranked =
    Array.from(
      counts.entries()
    )
      .map(
        ([
          value,
          count,
        ]) => ({
          value,
          count,
        })
      )
      .sort(
        (
          first,
          second
        ) =>
          second.count -
          first.count
      )

  const winner =
    ranked[0]

  const winningPasses =
    validPasses.filter(
      (pass) =>
        pass.value ===
        winner.value
    )

  const selectedPass =
    [...winningPasses]
      .sort(
        (
          first,
          second
        ) =>
          second.confidence -
          first.confidence
      )[0] ??
    validPasses[0]

  if (
    ranked.length ===
    1
  ) {
    return {
      value:
        winner.value,

      selectedPass,

      agreement:
        winner.count ===
        passes.length
          ? 'unanimous'
          : winner.count >= 2
            ? 'majority'
            : 'single-valid',

      consensusCount:
        winner.count,
    }
  }

  if (
    winner.count >= 2
  ) {
    return {
      value:
        winner.value,

      selectedPass,

      agreement:
        'majority',

      consensusCount:
        winner.count,
    }
  }

  return {
    value:
      null,

    selectedPass,

    agreement:
      'disagreement',

    consensusCount:
      1,
  }
}

// --------------------------------------------------
// CP analysis
// --------------------------------------------------

async function analyzeCp(
  image,
  crop
) {
  const totalStart =
    getNow()

  const preprocessingStart =
    getNow()

  const baseCanvas =
    createTextBand(
      image,
      {
        top:
          0.06,

        bottom:
          0.38,

        left:
          0,

        right:
          1,

        scale:
          5,
      }
    )

  /*
    Preserve the pre-mask copy.

    This remains part of the existing V7O behavior.
    V7S does not alter the CP image pipeline.
  */

  const rawCanvas =
    cloneCanvas(
      baseCanvas
    )

  maskCpLabel(
    baseCanvas
  )

  const maskedCanvas =
    cloneCanvas(
      baseCanvas
    )

  const normalCanvas =
    applyGrayscaleContrast(
      cloneCanvas(
        baseCanvas
      ),
      {
        contrast:
          1.55,

        brightness:
          12,
      }
    )

  const strongCanvas =
    applyGrayscaleContrast(
      cloneCanvas(
        baseCanvas
      ),
      {
        contrast:
          1.85,

        brightness:
          12,
      }
    )

  const thresholdCanvas =
    applyThreshold(
      applyGrayscaleContrast(
        cloneCanvas(
          baseCanvas
        ),
        {
          contrast:
            1.55,

          brightness:
            12,
        }
      ),
      175
    )

  const preprocessingMs =
    getElapsedMs(
      preprocessingStart
    )

  const passes =
    []

  passes.push(
    await recognizeCpPass(
      normalCanvas,
      {
        crop,
        id:
          'normal',
      }
    )
  )

  passes.push(
    await recognizeCpPass(
      strongCanvas,
      {
        crop,
        id:
          'strong',
      }
    )
  )

  passes.push(
    await recognizeCpPass(
      thresholdCanvas,
      {
        crop,
        id:
          'threshold',
      }
    )
  )

  const consensusStart =
    getNow()

  const consensus =
    chooseCpConsensus(
      passes
    )

  const consensusMs =
    getElapsedMs(
      consensusStart
    )

  const selectedPass =
    consensus.selectedPass

  const normalOcrMs =
    passes.find(
      (pass) =>
        pass.id ===
        'normal'
    )
      ?.performance
      ?.totalMs ??
    0

  const strongOcrMs =
    passes.find(
      (pass) =>
        pass.id ===
        'strong'
    )
      ?.performance
      ?.totalMs ??
    0

  const thresholdOcrMs =
    passes.find(
      (pass) =>
        pass.id ===
        'threshold'
    )
      ?.performance
      ?.totalMs ??
    0

  const ocrMs =
    normalOcrMs +
    strongOcrMs +
    thresholdOcrMs

  const totalMs =
    getElapsedMs(
      totalStart
    )

  return {
    rawText:
      selectedPass
        ?.rawText ??
      '',

    value:
      consensus.value,

    confidence:
      selectedPass
        ?.confidence ??
      0,

    previewUrl:
      selectedPass
        ?.previewUrl ??
      baseCanvas.toDataURL(
        'image/png'
      ),

    timing:
      selectedPass
        ?.timing ??
      null,

    agreement:
      consensus.agreement,

    consensusCount:
      consensus.consensusCount,

    consensusTotal:
      passes.length,

    passes:
      passes.map(
        (pass) => ({
          id:
            pass.id,

          rawText:
            pass.rawText,

          value:
            pass.value,

          confidence:
            pass.confidence,

          previewUrl:
            pass.previewUrl,

          timing:
            pass.timing,

          performance:
            pass.performance,
        })
      ),

    performance: {
      preprocessingMs,

      normalOcrMs,

      strongOcrMs,

      thresholdOcrMs,

      ocrMs,

      consensusMs,

      totalMs,
    },
  }
}

// --------------------------------------------------
// Known-species helpers
// --------------------------------------------------

function hasKnownSpecies(
  species
) {
  return Boolean(
    species &&
    (
      species.id != null ||
      (
        typeof species.apiName ===
          'string' &&
        species.apiName.trim() !==
          ''
      ) ||
      (
        typeof species.name ===
          'string' &&
        species.name.trim() !==
          ''
      )
    )
  )
}

function buildKnownSpeciesMatch(
  species
) {
  return {
    species,

    confidence:
      100,

    matchType:
      'known-species',

    matchedText:
      species.name ??
      species.apiName ??
      '',
  }
}

function buildKnownSpeciesNameResult(
  species
) {
  return {
    value:
      species.name ??
      null,

    rawText:
      species.name ??
      '',

    confidence:
      100,

    ocrConfidence:
      null,

    matchType:
      'known-species',

    matchedText:
      species.name ??
      species.apiName ??
      '',

    species,

    previewUrl:
      null,

    timing:
      null,

    performance: {
      preprocessingMs:
        0,

      ocrMs:
        0,

      speciesResolutionMs:
        0,

      totalMs:
        0,
    },
  }
}

// --------------------------------------------------
// Main Storage Crop Analysis
// --------------------------------------------------

export async function analyzeStorageCrop(
  crop,
  {
    knownSpecies =
      null,
  } = {}
) {
  if (
    !crop?.previewUrl
  ) {
    throw new Error(
      'A storage crop is required.'
    )
  }

  const totalStart =
    getNow()

  // ------------------------------------------------
  // Image loading
  // ------------------------------------------------

  const imageLoadStart =
    getNow()

  const image =
    await loadImage(
      crop.previewUrl
    )

  const imageLoadMs =
    getElapsedMs(
      imageLoadStart
    )

  // ------------------------------------------------
  // CP
  //
  // V7S intentionally leaves the complete CP path
  // untouched regardless of whether the species is
  // already known.
  // ------------------------------------------------

  const cp =
    await analyzeCp(
      image,
      crop
    )

  // ------------------------------------------------
  // Species/name
  //
  // If the caller already knows the species for this
  // tracked absolute position, reuse it and avoid an
  // unnecessary Tesseract name pass.
  //
  // Otherwise preserve the complete existing OCR
  // behavior.
  // ------------------------------------------------

  const reuseKnownSpecies =
    hasKnownSpecies(
      knownSpecies
    )

  let nameResult =
    null

  let speciesMatch =
    null

  let namePreprocessingMs =
    0

  let nameOcrMs =
    0

  let speciesResolutionMs =
    0

  if (
    reuseKnownSpecies
  ) {
    speciesMatch =
      buildKnownSpeciesMatch(
        knownSpecies
      )

    nameResult =
      buildKnownSpeciesNameResult(
        knownSpecies
      )
  } else {
    // ----------------------------------------------
    // Name preprocessing
    // ----------------------------------------------

    const namePreprocessingStart =
      getNow()

    const nameCanvas =
      createTextBand(
        image,
        {
          top:
            0.68,

          bottom:
            0.98,

          scale:
            5,
        }
      )

    applyGrayscaleContrast(
      nameCanvas,
      {
        contrast:
          1.45,

        brightness:
          10,
      }
    )

    namePreprocessingMs =
      getElapsedMs(
        namePreprocessingStart
      )

    // ----------------------------------------------
    // Name OCR
    // ----------------------------------------------

    const nameOcrStart =
      getNow()

    const nameRecognition =
      await recognizeImage(
        nameCanvas,
        {
          label:
            `storage-${crop.id}-name`,

          whitelist:
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-' .",
        }
      )

    nameOcrMs =
      getElapsedMs(
        nameOcrStart
      )

    const nameRawText =
      cleanText(
        nameRecognition
          ?.rawText
      )

    // ----------------------------------------------
    // Species resolution
    // ----------------------------------------------

    const speciesResolutionStart =
      getNow()

    speciesMatch =
      resolveStorageSpecies(
        nameRawText
      )

    speciesResolutionMs =
      getElapsedMs(
        speciesResolutionStart
      )

    nameResult = {
      value:
        speciesMatch
          .species
          ?.name ??
        null,

      rawText:
        nameRawText,

      confidence:
        speciesMatch
          .confidence,

      ocrConfidence:
        Math.round(
          nameRecognition
            ?.confidence ??
            0
        ),

      matchType:
        speciesMatch
          .matchType,

      matchedText:
        speciesMatch
          .matchedText,

      species:
        speciesMatch
          .species,

      previewUrl:
        nameCanvas.toDataURL(
          'image/png'
        ),

      timing:
        nameRecognition
          ?.timing ??
        null,

      performance: {
        preprocessingMs:
          namePreprocessingMs,

        ocrMs:
          nameOcrMs,

        speciesResolutionMs,

        totalMs:
          namePreprocessingMs +
          nameOcrMs +
          speciesResolutionMs,
      },
    }
  }

  // ------------------------------------------------
  // Final timing
  // ------------------------------------------------

  const totalMs =
    getElapsedMs(
      totalStart
    )

  const measuredMs =
    imageLoadMs +
    cp.performance.totalMs +
    namePreprocessingMs +
    nameOcrMs +
    speciesResolutionMs

  const otherMs =
    Math.max(
      0,
      totalMs -
      measuredMs
    )

  // ------------------------------------------------
  // Result
  //
  // Keep the existing result contract intact.
  // ------------------------------------------------

  return {
    cropId:
      crop.id,

    row:
      crop.row,

    column:
      crop.column,

    cp,

    name:
      nameResult,

    speciesMatch,

    recognizedPokemon: {
      pokemonId:
        speciesMatch
          ?.species
          ?.id ??
        null,

      apiName:
        speciesMatch
          ?.species
          ?.apiName ??
        null,

      name:
        speciesMatch
          ?.species
          ?.name ??
        null,

      cp:
        cp.value,
    },

    performance: {
      imageLoadMs,

      cpPreprocessingMs:
        cp.performance
          .preprocessingMs,

      cpNormalOcrMs:
        cp.performance
          .normalOcrMs,

      cpStrongOcrMs:
        cp.performance
          .strongOcrMs,

      cpThresholdOcrMs:
        cp.performance
          .thresholdOcrMs,

      cpOcrMs:
        cp.performance
          .ocrMs,

      cpConsensusMs:
        cp.performance
          .consensusMs,

      cpTotalMs:
        cp.performance
          .totalMs,

      namePreprocessingMs,

      nameOcrMs,

      speciesResolutionMs,

      otherMs,

      totalMs,

      reusedKnownSpecies:
        reuseKnownSpecies,
    },
  }
}

export default analyzeStorageCrop