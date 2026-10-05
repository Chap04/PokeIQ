// --------------------------------------------------
// Pokémon GO Storage Frame Motion
//
// Estimates how far the storage grid moved vertically
// between two consecutive recording frames.
//
// This deliberately uses image pixels rather than OCR.
// The storage screen is mostly static except for the
// vertical movement caused by scrolling.
//
// Positive shift:
//   content moved DOWN
//
// Negative shift:
//   content moved UP
// --------------------------------------------------

const STORAGE_LEFT =
  0.02

const STORAGE_RIGHT =
  0.98

const STORAGE_TOP =
  0.19

const STORAGE_BOTTOM =
  0.99

const SAMPLE_WIDTH =
  128

const SAMPLE_HEIGHT =
  128

const ROW_STEP_RATIO =
  0.17

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
        () => resolve(image)

      image.onerror =
        () =>
          reject(
            new Error(
              'Could not load a recording frame for motion analysis.'
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
// Build a small grayscale representation of the
// storage area.
// --------------------------------------------------

function buildSample(
  image
) {
  const sourceX =
    Math.round(
      image.naturalWidth *
        STORAGE_LEFT
    )

  const sourceY =
    Math.round(
      image.naturalHeight *
        STORAGE_TOP
    )

  const sourceWidth =
    Math.round(
      image.naturalWidth *
        (
          STORAGE_RIGHT -
          STORAGE_LEFT
        )
    )

  const sourceHeight =
    Math.round(
      image.naturalHeight *
        (
          STORAGE_BOTTOM -
          STORAGE_TOP
        )
    )

  const canvas =
    document.createElement(
      'canvas'
    )

  canvas.width =
    SAMPLE_WIDTH

  canvas.height =
    SAMPLE_HEIGHT

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
      'Could not create the frame-motion canvas.'
    )
  }

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    SAMPLE_WIDTH,
    SAMPLE_HEIGHT
  )

  const imageData =
    context.getImageData(
      0,
      0,
      SAMPLE_WIDTH,
      SAMPLE_HEIGHT
    )

  const grayscale =
    new Float32Array(
      SAMPLE_WIDTH *
        SAMPLE_HEIGHT
    )

  for (
    let y = 0;
    y < SAMPLE_HEIGHT;
    y += 1
  ) {
    for (
      let x = 0;
      x < SAMPLE_WIDTH;
      x += 1
    ) {
      const index =
        (
          y *
            SAMPLE_WIDTH +
          x
        ) *
        4

      grayscale[
        y *
          SAMPLE_WIDTH +
        x
      ] =
        imageData.data[index] *
          0.299 +
        imageData.data[
          index + 1
        ] *
          0.587 +
        imageData.data[
          index + 2
        ] *
          0.114
    }
  }

  return {
    data:
      grayscale,

    width:
      SAMPLE_WIDTH,

    height:
      SAMPLE_HEIGHT,

    sourceHeight,
  }
}

// --------------------------------------------------
// Compare two sampled frames at a proposed vertical
// shift.
//
// current[y] is compared against
// previous[y - shift].
//
// Therefore:
//   positive shift = content moved down
//   negative shift = content moved up
// --------------------------------------------------

function scoreShift(
  previous,
  current,
  shift
) {
  const width =
    current.width

  const height =
    current.height

  const startY =
    Math.max(
      0,
      shift
    )

  const endY =
    Math.min(
      height,
      height +
        shift
    )

  if (
    endY <=
    startY + 4
  ) {
    return Infinity
  }

  let totalDifference =
    0

  let samples =
    0

  /*
   * Skip pixels horizontally and vertically.
   * We don't need pixel-perfect comparison; we only
   * need to identify the translation.
   */
  const sampleStep =
    2

  for (
    let y = startY;
    y < endY;
    y += sampleStep
  ) {
    const previousY =
      y -
      shift

    if (
      previousY < 0 ||
      previousY >= height
    ) {
      continue
    }

    for (
      let x = 0;
      x < width;
      x += sampleStep
    ) {
      const currentIndex =
        y *
          width +
        x

      const previousIndex =
        previousY *
          width +
        x

      totalDifference +=
        Math.abs(
          current.data[
            currentIndex
          ] -
            previous.data[
              previousIndex
            ]
        )

      samples +=
        1
    }
  }

  if (
    samples === 0
  ) {
    return Infinity
  }

  return (
    totalDifference /
    samples
  )
}

// --------------------------------------------------
// Main estimator
// --------------------------------------------------

export async function estimateStorageFrameShift({
  previousFrame,
  currentFrame,
} = {}) {
  if (
    !previousFrame?.previewUrl ||
    !currentFrame?.previewUrl
  ) {
    throw new Error(
      'Two recording frames are required to estimate storage movement.'
    )
  }

  if (
    !Number.isFinite(
      previousFrame.width
    ) ||
    !Number.isFinite(
      previousFrame.height
    ) ||
    !Number.isFinite(
      currentFrame.width
    ) ||
    !Number.isFinite(
      currentFrame.height
    )
  ) {
    throw new Error(
      'Recording frames must include valid dimensions.'
    )
  }

  const [
    previousImage,
    currentImage,
  ] =
    await Promise.all([
      loadImage(
        previousFrame.previewUrl
      ),

      loadImage(
        currentFrame.previewUrl
      ),
    ])

  const previous =
    buildSample(
      previousImage
    )

  const current =
    buildSample(
      currentImage
    )

  const sourceHeight =
    Math.min(
      previous.sourceHeight,
      current.sourceHeight
    )

  const rowStepPixels =
    Math.min(
      previousFrame.height,
      currentFrame.height
    ) *
    ROW_STEP_RATIO

  /*
   * Convert the expected maximum movement into
   * sample-space pixels.
   *
   * We search a little beyond one full row because
   * a user can scroll more aggressively than our
   * normal recording instructions suggest.
   */
  const samplePixelsPerSourcePixel =
    current.height /
    sourceHeight

  const maximumShift =
    Math.ceil(
      rowStepPixels *
        1.5 *
        samplePixelsPerSourcePixel
    )

  let bestShift =
    0

  let bestScore =
    Infinity

  let secondBestScore =
    Infinity

  for (
    let shift =
      -maximumShift;
    shift <=
      maximumShift;
    shift += 1
  ) {
    const score =
      scoreShift(
        previous,
        current,
        shift
      )

    if (
      score <
      bestScore
    ) {
      secondBestScore =
        bestScore

      bestScore =
        score

      bestShift =
        shift
    } else if (
      score <
      secondBestScore
    ) {
      secondBestScore =
        score
    }
  }

  /*
   * The sampled image is much smaller than the actual
   * recording, so convert the result back to source
   * pixels.
   */
  const pixelsPerSample =
    sourceHeight /
    current.height

  const shiftPixels =
    bestShift *
    pixelsPerSample

  const confidence =
    secondBestScore ===
      Infinity ||
    bestScore ===
      Infinity
      ? 0
      : clamp(
          (
            secondBestScore -
            bestScore
          ) /
            Math.max(
              secondBestScore,
              1
            ),
          0,
          1
        )

  /*
   * Very small motion is effectively no movement.
   * This prevents OCR churn from being caused by tiny
   * estimation noise.
   */
  const movementThreshold =
    Math.max(
      8,
      rowStepPixels *
        0.035
    )

  const meaningfulShift =
    Math.abs(
      shiftPixels
    ) >=
    movementThreshold
      ? shiftPixels
      : 0

  return {
    shiftPixels:
      meaningfulShift,

    rawShiftPixels:
      shiftPixels,

    shiftRows:
      meaningfulShift /
      rowStepPixels,

    rowStepPixels,

    confidence,

    bestScore,

    secondBestScore,

    meaningful:
      meaningfulShift !==
      0,
  }
}

export default estimateStorageFrameShift