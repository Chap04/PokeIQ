import {
  cropStorageRegions,
} from './cropStorageRegions'

import {
  detectStorageRegions,
} from './detectStorageRegions'

import {
  analyzeStorageCrop,
} from './analyzeStorageCrop'

import {
  findStorageGridAlignment,
} from './findStorageGridAlignment'

import {
  compareStorageCrops,
} from './compareStorageCrops'

// --------------------------------------------------
// Storage Frame Analysis V6
//
// First frame:
//   OCR all visible crops.
//
// Later frames:
//   compare current crops with previous crops.
//   Reuse OCR when visual content matches.
//   OCR only genuinely new visual content.
// --------------------------------------------------

const CROP_MATCH_THRESHOLD =
  0.94

function buildSlotResult({
  crop,
  analysis,
  error = null,
  reused = false,
  previousCropId = null,
  visualSimilarity = null,
}) {
  const name =
    analysis?.recognizedPokemon
      ?.name ??
    analysis?.name
      ?.value ??
    null

  const cp =
    analysis?.recognizedPokemon
      ?.cp ??
    analysis?.cp
      ?.value ??
    null

  const pokemonId =
    analysis?.recognizedPokemon
      ?.pokemonId ??
    null

  const apiName =
    analysis?.recognizedPokemon
      ?.apiName ??
    null

  const hasName =
    Boolean(name)

  const hasCp =
    Number.isInteger(cp)

  const recognized =
    hasName &&
    hasCp

  const reviewRequired =
    !recognized &&
    (
      hasName ||
      hasCp
    )

  const unreadable =
    !hasName &&
    !hasCp

  return {
    slot:
      `${crop.row + 1}-${crop.column + 1}`,

    cropId:
      crop.id,

    row:
      crop.row,

    column:
      crop.column,

    pokemonId,

    apiName,

    name,

    cp,

    recognized,

    reviewRequired,

    unreadable,

    error,

    analysis,

    reused,

    previousCropId,

    visualSimilarity,
  }
}

// --------------------------------------------------
// Find best visual match
// --------------------------------------------------

async function findVisualMatch({
  crop,
  previousFrameAnalysis,
  usedPreviousCropIds,
}) {
  if (
    !previousFrameAnalysis
  ) {
    return null
  }

  const previousCrops =
    Array.isArray(
      previousFrameAnalysis.crops
    )
      ? previousFrameAnalysis
          .crops
      : []

  let bestMatch =
    null

  for (
    const previousCrop of
      previousCrops
  ) {
    if (
      usedPreviousCropIds.has(
        previousCrop.id
      )
    ) {
      continue
    }

    /*
     * Pokémon stay in the same column while the
     * storage scrolls, so only compare against the
     * same column.
     */
    if (
      previousCrop.column !==
      crop.column
    ) {
      continue
    }

    const comparison =
      await compareStorageCrops(
        crop,
        previousCrop,
        {
          threshold:
            CROP_MATCH_THRESHOLD,
        }
      )

    if (
      !comparison.matches
    ) {
      continue
    }

    if (
      !bestMatch ||
      comparison.similarity >
        bestMatch.similarity
    ) {
      bestMatch = {
        previousCrop,

        similarity:
          comparison.similarity,
      }
    }
  }

  return bestMatch
}

// --------------------------------------------------
// Main analyzer
// --------------------------------------------------

async function analyzeStorageFrame(
  frame,
  {
    previousAlignment = null,

    previousFrameAnalysis =
      null,

    forceFullAlignment =
      false,

    onProgress =
      null,
  } = {}
) {
  if (!frame) {
    throw new Error(
      'A recording frame is required.'
    )
  }

  if (
    !frame.previewUrl
  ) {
    throw new Error(
      'The recording frame does not have a preview image.'
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

  // ------------------------------------------------
  // Alignment
  // ------------------------------------------------

  const alignment =
    await findStorageGridAlignment(
      frame,
      {
        previousAlignment,

        forceFullSearch:
          forceFullAlignment,

        onProgress,
      }
    )

  // ------------------------------------------------
  // Grid detection
  // ------------------------------------------------

  const detection =
    detectStorageRegions({
      width:
        frame.width,

      height:
        frame.height,

      offsetY:
        alignment.offsetY,
    })

  // ------------------------------------------------
  // Cropping
  // ------------------------------------------------

  const crops =
    await cropStorageRegions({
      frame,

      detection,
    })

  // ------------------------------------------------
  // OCR / visual reuse
  // ------------------------------------------------

  const results =
    []

  const usedPreviousCropIds =
    new Set()

  let reusedCount =
    0

  let ocrCount =
    0

  for (
    let index = 0;
    index <
      crops.length;
    index += 1
  ) {
    const crop =
      crops[index]

    let analysis =
      null

    let error =
      null

    let reused =
      false

    let previousCropId =
      null

    let visualSimilarity =
      null

    if (
      previousFrameAnalysis
    ) {
      try {
        const visualMatch =
          await findVisualMatch({
            crop,

            previousFrameAnalysis,

            usedPreviousCropIds,
          })

        if (
          visualMatch
        ) {
          const previousResult =
            previousFrameAnalysis
              .slotResults
              ?.find(
                (result) =>
                  result.cropId ===
                  visualMatch
                    .previousCrop
                    .id
              )

          if (
            previousResult
          ) {
            analysis =
              previousResult.analysis

            reused =
              true

            previousCropId =
              visualMatch
                .previousCrop
                .id

            visualSimilarity =
              visualMatch
                .similarity

            usedPreviousCropIds.add(
              previousCropId
            )

            reusedCount +=
              1
          }
        }
      } catch (
        comparisonError
      ) {
        console.warn(
          `Visual crop comparison failed for ${crop.id}:`,
          comparisonError
        )
      }
    }

    if (
      !reused
    ) {
      try {
        analysis =
          await analyzeStorageCrop(
            crop
          )

        ocrCount +=
          1
      } catch (
        cropError
      ) {
        console.error(
          `Storage OCR failed for ${crop.id}:`,
          cropError
        )

        error =
          cropError instanceof Error
            ? cropError.message
            : 'Storage crop OCR failed.'
      }
    }

    results.push({
      crop,

      analysis,

      error,

      reused,

      previousCropId,

      visualSimilarity,
    })

    onProgress?.({
      phase:
        'ocr',

      current:
        index + 1,

      total:

        crops.length,

      reused:
        reusedCount,

      ocr:
        ocrCount,
    })

    await new Promise(
      (resolve) =>
        window.setTimeout(
          resolve,
          0
        )
    )
  }

  // --------------------------------------------------
  // Normalize
  // --------------------------------------------------

  const slotResults =
    results.map(
      ({
        crop,
        analysis,
        error,
        reused,
        previousCropId,
        visualSimilarity,
      }) =>
        buildSlotResult({
          crop,

          analysis,

          error,

          reused,

          previousCropId,

          visualSimilarity,
        })
    )

  const recognizedPokemon =
    slotResults.filter(
      (result) =>
        result.recognized
    )

  const reviewRequired =
    slotResults.filter(
      (result) =>
        result.reviewRequired
    )

  const unreadable =
    slotResults.filter(
      (result) =>
        result.unreadable
    )

  return {
    frame: {
      id:
        frame.id,

      timestamp:
        frame.timestamp,

      width:
        frame.width,

      height:
        frame.height,
    },

    alignment,

    detection,

    crops,

    results,

    slotResults,

    recognizedPokemon,

    reviewRequired,

    unreadable,

    summary: {
      totalSlots:
        crops.length,

      recognized:
        recognizedPokemon.length,

      reviewRequired:
        reviewRequired.length,

      unreadable:
        unreadable.length,

      reused:
        reusedCount,

      ocr:
        ocrCount,

      usable:
        recognizedPokemon.length >
        0,
    },
  }
}

export {
  analyzeStorageFrame,
}

export default analyzeStorageFrame