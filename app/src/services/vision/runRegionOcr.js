import { recognizeImage } from './runOcr'

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = () => {
      resolve(image)
    }

    image.onerror = () => {
      reject(
        new Error(
          'A detected region could not be loaded for OCR.'
        )
      )
    }

    image.src = dataUrl
  })
}

function clampColour(value) {
  return Math.max(0, Math.min(255, value))
}

function clampConfidence(value) {
  return Math.max(
    0,
    Math.min(100, Math.round(value))
  )
}

function createProcessedCanvas(
  image,
  {
    scale = 3,
    grayscale = true,
    contrast = 1,
    brightness = 0,
    threshold = null,
    invert = false,
  } = {}
) {
  const canvas = document.createElement('canvas')

  canvas.width = Math.max(
    1,
    Math.round(image.naturalWidth * scale)
  )

  canvas.height = Math.max(
    1,
    Math.round(image.naturalHeight * scale)
  )

  const context = canvas.getContext('2d', {
    willReadFrequently: true,
  })

  if (!context) {
    throw new Error(
      'Canvas region preprocessing is unavailable.'
    )
  }

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'

  context.drawImage(
    image,
    0,
    0,
    canvas.width,
    canvas.height
  )

  const imageData = context.getImageData(
    0,
    0,
    canvas.width,
    canvas.height
  )

  const pixels = imageData.data

  for (
    let index = 0;
    index < pixels.length;
    index += 4
  ) {
    const red = pixels[index]
    const green = pixels[index + 1]
    const blue = pixels[index + 2]

    let value = grayscale
      ? red * 0.299 +
        green * 0.587 +
        blue * 0.114
      : red

    value =
      128 +
      contrast * (value - 128) +
      brightness

    value = clampColour(value)

    if (invert) {
      value = 255 - value
    }

    if (threshold !== null) {
      value =
        value >= threshold
          ? 255
          : 0
    }

    pixels[index] = value
    pixels[index + 1] = value
    pixels[index + 2] = value
  }

  context.putImageData(imageData, 0, 0)

  return canvas
}

const REGION_SETTINGS = {
  cp: {
    whitelist: 'CPcp0123456789',

    profiles: [
      {
        id: 'grayscale',
        scale: 4,
        contrast: 1.5,
        brightness: 15,
        threshold: null,
      },
      {
        id: 'inverted',
        scale: 4,
        contrast: 1.7,
        brightness: 10,
        threshold: null,
        invert: true,
      },
      {
        id: 'threshold',
        scale: 4,
        contrast: 1.5,
        threshold: 145,
      },
    ],
  },

  'displayed-name': {
    whitelist:
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-' .",

    profiles: [
      {
        id: 'threshold',
        scale: 3,
        contrast: 1.6,
        threshold: 165,
      },
      {
        id: 'grayscale',
        scale: 3,
        contrast: 1.35,
        threshold: null,
      },
    ],
  },

  hp: {
    whitelist: 'HP0123456789/ ',

    profiles: [
      {
        id: 'grayscale',
        scale: 5,
        contrast: 1.3,
        brightness: 8,
        threshold: null,
      },
      {
        id: 'light-contrast',
        scale: 5,
        contrast: 1.1,
        brightness: 18,
        threshold: null,
      },
      {
        id: 'soft-threshold',
        scale: 5,
        contrast: 1.25,
        threshold: 120,
      },
    ],
  },

  weight: {
    whitelist: '0123456789.,kgKG ',

    profiles: [
      {
        id: 'grayscale',
        scale: 4,
        contrast: 1.25,
        brightness: 5,
        threshold: null,
      },
      {
        id: 'soft-threshold',
        scale: 4,
        contrast: 1.35,
        threshold: 135,
      },
    ],
  },

  height: {
    whitelist: '0123456789.,mM ',

    profiles: [
      {
        id: 'grayscale',
        scale: 4,
        contrast: 1.25,
        brightness: 5,
        threshold: null,
      },
      {
        id: 'soft-threshold',
        scale: 4,
        contrast: 1.35,
        threshold: 135,
      },
    ],
  },

  'candy-count': {
    whitelist: '0123456789,',

    profiles: [
      {
        id: 'grayscale',
        scale: 5,
        contrast: 1.15,
        brightness: 15,
        threshold: null,
      },
      {
        id: 'inverted',
        scale: 5,
        contrast: 1.35,
        brightness: 5,
        threshold: null,
        invert: true,
      },
      {
        id: 'soft-threshold',
        scale: 5,
        contrast: 1.2,
        threshold: 105,
      },
    ],
  },

  'candy-xl-count': {
    whitelist: '0123456789,',

    profiles: [
      {
        id: 'grayscale',
        scale: 5,
        contrast: 1.15,
        brightness: 15,
        threshold: null,
      },
      {
        id: 'inverted',
        scale: 5,
        contrast: 1.35,
        brightness: 5,
        threshold: null,
        invert: true,
      },
      {
        id: 'soft-threshold',
        scale: 5,
        contrast: 1.2,
        threshold: 105,
      },
    ],
  },
}

function cleanText(text = '') {
  return text
    .replace(/\s+/g, ' ')
    .trim()
}

function digitsOnly(text = '') {
  return text.replace(/[^\d]/g, '')
}

function normalizeDecimalText(text = '') {
  return text
    .replace(',', '.')
    .replace(/[^\d.]/g, '')
}

function parseCp(text) {
  const digits = digitsOnly(text)

  if (!digits) {
    return null
  }

  const value = Number(digits)

  if (
    !Number.isInteger(value) ||
    value < 10 ||
    value > 10000
  ) {
    return null
  }

  return value
}

function parseDisplayedName(text) {
  const cleaned = cleanText(text)
    .replace(/[^a-zA-Z' .-]/g, '')
    .trim()

  if (
    cleaned.length < 2 ||
    cleaned.length > 30
  ) {
    return null
  }

  return cleaned
}

function parseHp(text) {
  const cleaned = cleanText(text)

  const match = cleaned.match(
    /(\d{1,4})\s*\/\s*(\d{1,4})/
  )

  if (!match) {
    return null
  }

  const current = Number(match[1])
  const maximum = Number(match[2])

  if (
    !Number.isInteger(current) ||
    !Number.isInteger(maximum) ||
    current < 0 ||
    maximum < 1 ||
    current > maximum ||
    maximum > 1000
  ) {
    return null
  }

  return {
    current,
    maximum,
  }
}

function parseWeight(text) {
  const value = Number(
    normalizeDecimalText(text)
  )

  if (
    !Number.isFinite(value) ||
    value <= 0 ||
    value > 10000
  ) {
    return null
  }

  return value
}

function parseHeight(text) {
  const value = Number(
    normalizeDecimalText(text)
  )

  if (
    !Number.isFinite(value) ||
    value <= 0 ||
    value > 100
  ) {
    return null
  }

  return value
}

function parseCount(text) {
  const digits = digitsOnly(text)

  if (!digits) {
    return null
  }

  const value = Number(digits)

  if (
    !Number.isInteger(value) ||
    value < 0 ||
    value > 10000000
  ) {
    return null
  }

  return value
}

function normalizeRegionResult(
  regionId,
  rawText
) {
  if (regionId === 'cp') {
    return parseCp(rawText)
  }

  if (regionId === 'displayed-name') {
    return parseDisplayedName(rawText)
  }

  if (regionId === 'hp') {
    return parseHp(rawText)
  }

  if (regionId === 'weight') {
    return parseWeight(rawText)
  }

  if (regionId === 'height') {
    return parseHeight(rawText)
  }

  if (
    regionId === 'candy-count' ||
    regionId === 'candy-xl-count'
  ) {
    return parseCount(rawText)
  }

  return null
}

function serializeNormalizedValue(value) {
  if (value === null) {
    return null
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value).toLowerCase()
}

function getAgreementDetails(
  regionId,
  attempts
) {
  const normalizedAttempts = attempts
    .map((attempt) => ({
      ...attempt,
      normalizedValue:
        normalizeRegionResult(
          regionId,
          attempt.rawText
        ),
    }))
    .filter(
      (attempt) =>
        attempt.normalizedValue !== null
    )

  if (normalizedAttempts.length === 0) {
    return {
      agreementCount: 0,
      agreementConfidence: 0,
    }
  }

  const valueCounts = new Map()

  for (const attempt of normalizedAttempts) {
    const key = serializeNormalizedValue(
      attempt.normalizedValue
    )

    valueCounts.set(
      key,
      (valueCounts.get(key) ?? 0) + 1
    )
  }

  const agreementCount = Math.max(
    ...valueCounts.values()
  )

  const agreementConfidence =
    normalizedAttempts.length === 1
      ? 55
      : Math.round(
          (
            agreementCount /
            normalizedAttempts.length
          ) * 100
        )

  return {
    agreementCount,
    agreementConfidence,
  }
}

function getValidationConfidence(
  regionId,
  normalizedValue
) {
  if (normalizedValue === null) {
    return 0
  }

  if (regionId === 'hp') {
    return 100
  }

  if (
    regionId === 'candy-count' ||
    regionId === 'candy-xl-count'
  ) {
    return 100
  }

  if (regionId === 'cp') {
    return 98
  }

  if (regionId === 'displayed-name') {
    return 92
  }

  if (
    regionId === 'weight' ||
    regionId === 'height'
  ) {
    return 95
  }

  return 80
}

function getFinalConfidence({
  ocrConfidence,
  validationConfidence,
  agreementConfidence,
}) {
  if (validationConfidence === 0) {
    return clampConfidence(
      ocrConfidence * 0.5
    )
  }

  return clampConfidence(
    validationConfidence * 0.55 +
    agreementConfidence * 0.3 +
    ocrConfidence * 0.15
  )
}

function getResultScore(
  regionId,
  attempt
) {
  const normalizedValue =
    normalizeRegionResult(
      regionId,
      attempt.rawText
    )

  let score = attempt.confidence

  if (normalizedValue !== null) {
    score += 100
  }

  return score
}

async function recognizeRegion(
  region,
  settings
) {
  const image = await loadImage(
    region.previewUrl
  )

  const attempts = []

  for (const profile of settings.profiles) {
    const processedImage =
      createProcessedCanvas(
        image,
        profile
      )

    const recognition =
      await recognizeImage(
        processedImage,
        {
          label: `${region.id}-${profile.id}`,
          whitelist: settings.whitelist,
        }
      )

    attempts.push({
      profileId: profile.id,
      rawText: cleanText(
        recognition.rawText
      ),
      confidence:
        recognition.confidence,

      normalizedValue:
        normalizeRegionResult(
          region.id,
          recognition.rawText
        ),

      processedPreviewUrl:
        processedImage.toDataURL(
          'image/png'
        ),

      timing: recognition.timing,
    })
  }

  const rankedAttempts = attempts
    .map((attempt) => ({
      ...attempt,
      score: getResultScore(
        region.id,
        attempt
      ),
    }))
    .sort(
      (attemptA, attemptB) =>
        attemptB.score - attemptA.score
    )

  return {
    bestAttempt:
      rankedAttempts[0] ?? null,

    attempts: rankedAttempts,
  }
}

export async function runRegionOcr(
  regions = []
) {
  const readableRegions = regions.filter(
    (region) =>
      Object.hasOwn(
        REGION_SETTINGS,
        region.id
      )
  )

  const results = []

  for (const region of readableRegions) {
    const settings =
      REGION_SETTINGS[region.id]

    const {
      bestAttempt,
      attempts,
    } = await recognizeRegion(
      region,
      settings
    )

    const normalizedValue =
      bestAttempt?.normalizedValue ??
      null

    const {
      agreementCount,
      agreementConfidence,
    } = getAgreementDetails(
      region.id,
      attempts
    )

    const ocrConfidence =
      bestAttempt?.confidence ?? 0

    const validationConfidence =
      getValidationConfidence(
        region.id,
        normalizedValue
      )

    const finalConfidence =
      getFinalConfidence({
        ocrConfidence,
        validationConfidence,
        agreementConfidence,
      })

    const accepted =
      normalizedValue !== null &&
      finalConfidence >= 60

    results.push({
      id: region.id,
      label: region.label,

      rawText:
        bestAttempt?.rawText ?? '',

      normalizedValue,

      accepted,

      ocrConfidence,
      validationConfidence,
      agreementConfidence,
      agreementCount,
      finalConfidence,

      /*
        Kept for compatibility with the current results panel.
        It now represents the final field-aware confidence.
      */
      confidence: finalConfidence,

      selectedProfile:
        bestAttempt?.profileId ?? null,

      processedPreviewUrl:
        bestAttempt
          ?.processedPreviewUrl ?? null,

      timing:
        bestAttempt?.timing ?? {
          duration: 0,
        },

      attempts,
    })
  }

  return {
    items: results,

    totalDuration: results.reduce(
      (total, result) =>
        total +
        result.attempts.reduce(
          (attemptTotal, attempt) =>
            attemptTotal +
            (
              attempt.timing
                ?.duration ?? 0
            ),
          0
        ),
      0
    ),
  }
}