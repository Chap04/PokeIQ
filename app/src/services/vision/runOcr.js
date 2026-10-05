import { createWorker } from 'tesseract.js'
import { preprocessImage } from './preprocessImage'

let workerPromise = null

function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker(
      'eng',
      1
    )
  }

  return workerPromise
}

export async function recognizeImage(
  image,
  options = {}
) {
  const {
    label = 'image',
    whitelist = null,
  } = options

  const worker =
    await getWorker()

  if (whitelist) {
    await worker.setParameters({
      tessedit_char_whitelist:
        whitelist,
    })
  } else {
    await worker.setParameters({
      tessedit_char_whitelist:
        '',
    })
  }

  const startedAt =
    performance.now()

  const result =
    await worker.recognize(
      image
    )

  const finishedAt =
    performance.now()

  return {
    label,

    rawText:
      result.data.text
        ?.trim() ?? '',

    confidence:
      Math.round(
        result.data.confidence ??
          0
      ),

    timing: {
      duration:
        Math.round(
          finishedAt -
            startedAt
        ),
    },
  }
}

export async function runOcr(
  file
) {
  if (!(file instanceof File)) {
    throw new Error(
      'A valid screenshot file is required.'
    )
  }

  if (
    !file.type.startsWith(
      'image/'
    )
  ) {
    throw new Error(
      'OCR can only analyze image files.'
    )
  }

  const startedAt =
    performance.now()

  const preprocessingResult =
    await preprocessImage(
      file
    )

  const recognitionResult =
    await recognizeImage(
      preprocessingResult.image,
      {
        label:
          'full-screenshot',
      }
    )

  const finishedAt =
    performance.now()

  if (
    !recognitionResult.rawText
  ) {
    throw new Error(
      'No readable text was detected in this screenshot.'
    )
  }

  return {
    rawText:
      recognitionResult.rawText,

    confidence:
      recognitionResult.confidence,

    preprocessing: {
      previewUrl:
        preprocessingResult.previewUrl,

      diagnostics:
        preprocessingResult.diagnostics,

      timing:
        preprocessingResult.timing,
    },

    timing: {
      duration:
        Math.round(
          finishedAt -
            startedAt
        ),
    },
  }
}