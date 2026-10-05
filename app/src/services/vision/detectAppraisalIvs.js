const FULL_BAR_FILL_RATIO = 0.951

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)

      reject(
        new Error(
          'The screenshot could not be loaded for IV analysis.'
        )
      )
    }

    image.src = objectUrl
  })
}

function createCanvas(width, height) {
  const canvas = document.createElement('canvas')

  canvas.width = Math.max(
    1,
    Math.round(width)
  )

  canvas.height = Math.max(
    1,
    Math.round(height)
  )

  const context = canvas.getContext(
    '2d',
    {
      willReadFrequently: true,
    }
  )

  if (!context) {
    throw new Error(
      'Canvas image analysis is not available.'
    )
  }

  return {
    canvas,
    context,
  }
}

function canvasToDataUrl(canvas) {
  return canvas.toDataURL('image/png')
}

function clamp(
  value,
  minimum,
  maximum
) {
  return Math.max(
    minimum,
    Math.min(maximum, value)
  )
}

function drawRegionLabel(
  context,
  region,
  label,
  canvasWidth
) {
  const fontSize = Math.max(
    12,
    Math.round(canvasWidth * 0.035)
  )

  context.font =
    `${fontSize}px sans-serif`

  const textWidth =
    context.measureText(label).width

  const paddingX = 6
  const paddingY = 4

  const labelWidth =
    textWidth + paddingX * 2

  const labelHeight =
    fontSize + paddingY * 2

  const labelX = region.x

  const labelY = Math.max(
    0,
    region.y - labelHeight - 3
  )

  context.fillStyle =
    'rgba(0, 0, 0, 0.75)'

  context.fillRect(
    labelX,
    labelY,
    labelWidth,
    labelHeight
  )

  context.fillStyle = 'white'

  context.fillText(
    label,
    labelX + paddingX,
    labelY + fontSize + paddingY - 1
  )
}

function isAppraisalBarPixel(
  red,
  green,
  blue,
  alpha
) {
  if (alpha < 170) {
    return false
  }

  return (
    red >= 155 &&
    green >= 55 &&
    green <= 195 &&
    blue >= 55 &&
    blue <= 205 &&
    red >= green + 18 &&
    red >= blue + 8
  )
}

function convertFillRatioToIv(fillRatio) {
  if (
    fillRatio === null ||
    fillRatio === undefined
  ) {
    return null
  }

  const normalizedFillRatio = clamp(
    fillRatio / FULL_BAR_FILL_RATIO,
    0,
    1
  )

  return clamp(
    Math.round(normalizedFillRatio * 15),
    0,
    15
  )
}

function measureBarFill(
  context,
  region
) {
  const imageData =
    context.getImageData(
      region.x,
      region.y,
      region.width,
      region.height
    )

  const {
    data,
    width,
    height,
  } = imageData

  const columnCoverage =
    new Array(width).fill(0)

  for (
    let x = 0;
    x < width;
    x += 1
  ) {
    let matchingPixelCount = 0

    for (
      let y = 0;
      y < height;
      y += 1
    ) {
      const index =
        (y * width + x) * 4

      const red = data[index]
      const green = data[index + 1]
      const blue = data[index + 2]
      const alpha = data[index + 3]

      if (
        isAppraisalBarPixel(
          red,
          green,
          blue,
          alpha
        )
      ) {
        matchingPixelCount += 1
      }
    }

    columnCoverage[x] =
      matchingPixelCount / height
  }

  const minimumCoverage = 0.18

  const activeColumns = []

  for (
    let x = 0;
    x < width;
    x += 1
  ) {
    if (
      columnCoverage[x] >=
      minimumCoverage
    ) {
      activeColumns.push(x)
    }
  }

  if (activeColumns.length === 0) {
    return {
      stat: region.stat,
      value: null,
      confidence: 0,
      fillRatio: null,
      normalizedFillRatio: null,
      fillPercent: null,
      normalizedFillPercent: null,
      region,
      status: 'No bar colour detected',
      detectedFill: null,

      diagnostics: {
        activeColumnCount: 0,
        firstActiveColumn: null,
        lastActiveColumn: null,
        usableWidth: null,
        filledWidth: null,
        horizontalDensity: 0,
        averageCoverage: 0,
      },
    }
  }

  const firstActiveColumn =
    activeColumns[0]

  const lastActiveColumn =
    activeColumns[
      activeColumns.length - 1
    ]

  const usableWidth = Math.max(
    1,
    width - firstActiveColumn
  )

  const filledWidth = Math.max(
    0,
    lastActiveColumn -
      firstActiveColumn +
      1
  )

  const fillRatio = clamp(
    filledWidth / usableWidth,
    0,
    1
  )

  const normalizedFillRatio = clamp(
    fillRatio / FULL_BAR_FILL_RATIO,
    0,
    1
  )

  const fillPercent =
    Number(
      (fillRatio * 100).toFixed(1)
    )

  const normalizedFillPercent =
    Number(
      (
        normalizedFillRatio * 100
      ).toFixed(1)
    )

  const value =
    convertFillRatioToIv(fillRatio)

  const coveredColumns =
    activeColumns.filter(
      (column) =>
        column >= firstActiveColumn &&
        column <= lastActiveColumn
    ).length

  const spanWidth = Math.max(
    1,
    lastActiveColumn -
      firstActiveColumn +
      1
  )

  const horizontalDensity =
    coveredColumns / spanWidth

  const averageCoverage =
    activeColumns.reduce(
      (sum, column) =>
        sum + columnCoverage[column],
      0
    ) / activeColumns.length

  const densityScore = clamp(
    (horizontalDensity - 0.55) /
      0.35,
    0,
    1
  )

  const coverageScore = clamp(
    (averageCoverage - 0.18) /
      0.42,
    0,
    1
  )

  const confidence =
    Math.round(
      (
        densityScore * 0.55 +
        coverageScore * 0.45
      ) * 100
    )

  return {
    stat: region.stat,
    value,
    confidence,
    fillRatio,
    normalizedFillRatio,
    fillPercent,
    normalizedFillPercent,
    region,

    status:
      `Detected ${value}/15 from ${fillPercent}% measured fill`,

    detectedFill: {
      x:
        region.x +
        firstActiveColumn,

      y:
        region.y,

      width:
        filledWidth,

      height:
        region.height,
    },

    diagnostics: {
      activeColumnCount:
        activeColumns.length,

      firstActiveColumn,

      lastActiveColumn,

      usableWidth,

      filledWidth,

      horizontalDensity:
        Number(
          horizontalDensity.toFixed(4)
        ),

      averageCoverage:
        Number(
          averageCoverage.toFixed(4)
        ),
    },
  }
}

function createDetectionPreview(
  sourceCanvas,
  detectedBars
) {
  const {
    canvas,
    context,
  } = createCanvas(
    sourceCanvas.width,
    sourceCanvas.height
  )

  context.drawImage(
    sourceCanvas,
    0,
    0
  )

  context.lineWidth = Math.max(
    2,
    Math.round(
      canvas.width * 0.006
    )
  )

  detectedBars.forEach((bar) => {
    context.strokeStyle =
      'rgba(0, 120, 255, 0.95)'

    context.strokeRect(
      bar.region.x,
      bar.region.y,
      bar.region.width,
      bar.region.height
    )

    if (bar.detectedFill) {
      context.strokeStyle =
        'rgba(0, 190, 90, 0.95)'

      context.strokeRect(
        bar.detectedFill.x,
        bar.detectedFill.y,
        bar.detectedFill.width,
        bar.detectedFill.height
      )
    }

    const resultLabel =
      bar.value === null
        ? 'No IV detected'
        : `${bar.value}/15 • ${bar.fillPercent}% fill`

    drawRegionLabel(
      context,
      bar.region,
      `${bar.region.label} • ${resultLabel}`,
      canvas.width
    )
  })

  return canvasToDataUrl(canvas)
}

function calculateMeasurementConfidence(
  detectedBars
) {
  if (
    detectedBars.length === 0 ||
    detectedBars.some(
      (bar) => bar.value === null
    )
  ) {
    return 0
  }

  return Math.round(
    detectedBars.reduce(
      (sum, bar) =>
        sum + bar.confidence,
      0
    ) / detectedBars.length
  )
}

export async function detectAppraisalIvs(
  file,
  appraisalRegion = null
) {
  if (!(file instanceof File)) {
    throw new Error(
      'A valid screenshot file is required.'
    )
  }

  if (
    !file.type.startsWith('image/')
  ) {
    throw new Error(
      'IV detection can only analyze image files.'
    )
  }

  const startedAt =
    performance.now()

  const image =
    await loadImageFromFile(file)

  if (!appraisalRegion) {
    throw new Error(
      'The appraisal-bars region was not available.'
    )
  }

  const crop = {
    x: Math.round(
      appraisalRegion.x
    ),

    y: Math.round(
      appraisalRegion.y
    ),

    width: Math.round(
      appraisalRegion.width
    ),

    height: Math.round(
      appraisalRegion.height
    ),
  }

  const {
    canvas,
    context,
  } = createCanvas(
    crop.width,
    crop.height
  )

  context.drawImage(
    image,

    crop.x,
    crop.y,
    crop.width,
    crop.height,

    0,
    0,
    crop.width,
    crop.height
  )

  /*
    These are your calibrated rectangle values.
  */
  const sharedRegion = {
    x: Math.round(
      canvas.width * 0.165
    ),

    width: Math.round(
      canvas.width * 0.79
    ),

    height: Math.round(
      canvas.height * 0.08
    ),
  }

  const barRegions = [
    {
      stat: 'attack',
      label: 'Attack bar',

      x: sharedRegion.x,

      y: Math.round(
        canvas.height * 0.105
      ),

      width:
        sharedRegion.width,

      height:
        sharedRegion.height,
    },

    {
      stat: 'defense',
      label: 'Defense bar',

      x: sharedRegion.x,

      y: Math.round(
        canvas.height * 0.43
      ),

      width:
        sharedRegion.width,

      height:
        sharedRegion.height,
    },

    {
      stat: 'stamina',
      label: 'HP bar',

      x: sharedRegion.x,

      y: Math.round(
        canvas.height * 0.725
      ),

      width:
        sharedRegion.width,

      height:
        sharedRegion.height,
    },
  ]

  const detectedBars =
    barRegions.map(
      (region) =>
        measureBarFill(
          context,
          region
        )
    )

  const confidence =
    calculateMeasurementConfidence(
      detectedBars
    )

  const barLookup =
    Object.fromEntries(
      detectedBars.map(
        (bar) => [
          bar.stat,
          bar,
        ]
      )
    )

  const finishedAt =
    performance.now()

  return {
    ivs: {
      attack:
        barLookup.attack
          ?.value ?? null,

      defense:
        barLookup.defense
          ?.value ?? null,

      stamina:
        barLookup.stamina
          ?.value ?? null,
    },

    confidence,

    diagnostics: {
      appraisalRegion:
        crop,

      cropPreviewUrl:
        canvasToDataUrl(canvas),

      detectionPreviewUrl:
        createDetectionPreview(
          canvas,
          detectedBars
        ),

      barRegions,

      detectedBars,

      calibration: {
        fullBarFillRatio:
          FULL_BAR_FILL_RATIO,
      },

      measurementVersion: 3,
    },

    timing: {
      duration: Math.round(
        finishedAt - startedAt
      ),
    },
  }
}