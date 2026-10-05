// --------------------------------------------------
// Pokémon GO Storage Frame Movement V7D
//
// Measures vertical movement between consecutive
// recording frames.
//
// V7D deliberately returns to the cheaper V7B-style
// image search.
//
// The image matcher does NOT need to determine the
// exact storage displacement by itself.
//
// Its job is to estimate movement.
//
// The recording-level resolver then snaps that
// estimate to the nearest displacement allowed by
// the repeating storage-grid phase.
// --------------------------------------------------

const STORAGE_AREA = {
  left: 0.02,
  right: 0.98,
  top: 0.19,
  bottom: 0.88,
}

const SAMPLE_WIDTH = 96

const MAX_SHIFT_RATIO = 0.34

const SOURCE_SHIFT_STEP = 8

const REFINEMENT_STEP = 2

const EDGE_MARGIN_RATIO = 0.04

// --------------------------------------------------
// Image loading
// --------------------------------------------------

function loadImage(source) {
  return new Promise(
    (resolve, reject) => {
      const image =
        new Image()

      image.onload =
        () => resolve(image)

      image.onerror =
        () =>
          reject(
            new Error(
              'Could not load a recording frame for movement measurement.'
            )
          )

      image.src =
        source
    }
  )
}

// --------------------------------------------------
// Storage sample
// --------------------------------------------------

function buildStorageSample({
  image,
  frameWidth,
  frameHeight,
}) {
  const sourceX =
    Math.round(
      frameWidth *
        STORAGE_AREA.left
    )

  const sourceY =
    Math.round(
      frameHeight *
        STORAGE_AREA.top
    )

  const sourceWidth =
    Math.round(
      frameWidth *
        (
          STORAGE_AREA.right -
          STORAGE_AREA.left
        )
    )

  const sourceHeight =
    Math.round(
      frameHeight *
        (
          STORAGE_AREA.bottom -
          STORAGE_AREA.top
        )
    )

  const aspectRatio =
    sourceHeight /
    sourceWidth

  const sampleHeight =
    Math.max(
      1,
      Math.round(
        SAMPLE_WIDTH *
          aspectRatio
      )
    )

  const canvas =
    document.createElement(
      'canvas'
    )

  canvas.width =
    SAMPLE_WIDTH

  canvas.height =
    sampleHeight

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
      'Could not create the storage movement canvas.'
    )
  }

  context.imageSmoothingEnabled =
    true

  context.imageSmoothingQuality =
    'high'

  context.drawImage(
    image,

    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,

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

  const pixels =
    new Float32Array(
      canvas.width *
        canvas.height
    )

  let total = 0

  for (
    let index = 0;
    index <
      pixels.length;
    index += 1
  ) {
    const pixelIndex =
      index * 4

    const grayscale =
      data[pixelIndex] *
        0.299 +
      data[
        pixelIndex + 1
      ] *
        0.587 +
      data[
        pixelIndex + 2
      ] *
        0.114

    pixels[index] =
      grayscale

    total +=
      grayscale
  }

  const mean =
    total /
    pixels.length

  let variance = 0

  for (
    let index = 0;
    index <
      pixels.length;
    index += 1
  ) {
    const difference =
      pixels[index] -
      mean

    variance +=
      difference *
      difference
  }

  const standardDeviation =
    Math.sqrt(
      variance /
        pixels.length
    ) || 1

  for (
    let index = 0;
    index <
      pixels.length;
    index += 1
  ) {
    pixels[index] =
      (
        pixels[index] -
        mean
      ) /
      standardDeviation
  }

  return {
    width:
      canvas.width,

    height:
      canvas.height,

    pixels,

    sourceWidth,

    sourceHeight,
  }
}

// --------------------------------------------------
// Shift scoring
// --------------------------------------------------

function scoreVerticalShift({
  previousSample,
  currentSample,
  sourceShiftY,
}) {
  if (
    previousSample.width !==
      currentSample.width ||
    previousSample.height !==
      currentSample.height
  ) {
    return Infinity
  }

  const width =
    previousSample.width

  const height =
    previousSample.height

  const sourcePixelsPerSamplePixel =
    previousSample.sourceHeight /
    height

  const sampleShift =
    Math.round(
      sourceShiftY /
        sourcePixelsPerSamplePixel
    )

  const marginX =
    Math.max(
      1,
      Math.round(
        width *
          EDGE_MARGIN_RATIO
      )
    )

  const marginY =
    Math.max(
      1,
      Math.round(
        height *
          EDGE_MARGIN_RATIO
      )
    )

  const previousStartY =
    Math.max(
      marginY,
      marginY -
        sampleShift
    )

  const previousEndY =
    Math.min(
      height -
        marginY,
      height -
        marginY -
        sampleShift
    )

  if (
    previousEndY <=
    previousStartY
  ) {
    return Infinity
  }

  let difference = 0
  let compared = 0

  for (
    let previousY =
      previousStartY;
    previousY <
      previousEndY;
    previousY += 1
  ) {
    const currentY =
      previousY +
      sampleShift

    for (
      let x =
        marginX;
      x <
        width -
          marginX;
      x += 1
    ) {
      const previousIndex =
        previousY *
          width +
        x

      const currentIndex =
        currentY *
          width +
        x

      difference +=
        Math.abs(
          previousSample
            .pixels[
              previousIndex
            ] -
          currentSample
            .pixels[
              currentIndex
            ]
        )

      compared += 1
    }
  }

  if (compared === 0) {
    return Infinity
  }

  return (
    difference /
    compared
  )
}

// --------------------------------------------------
// Search
// --------------------------------------------------

function findBestShift({
  previousSample,
  currentSample,
  frameHeight,
}) {
  const maximumShift =
    Math.round(
      frameHeight *
        MAX_SHIFT_RATIO
    )

  const coarse =
    []

  for (
    let shift =
      -maximumShift;
    shift <=
      maximumShift;
    shift +=
      SOURCE_SHIFT_STEP
  ) {
    const score =
      scoreVerticalShift({
        previousSample,
        currentSample,
        sourceShiftY:
          shift,
      })

    if (
      Number.isFinite(
        score
      )
    ) {
      coarse.push({
        shift,
        score,
      })
    }
  }

  if (
    !coarse.some(
      (candidate) =>
        candidate.shift ===
        0
    )
  ) {
    coarse.push({
      shift: 0,

      score:
        scoreVerticalShift({
          previousSample,
          currentSample,
          sourceShiftY:
            0,
        }),
    })
  }

  coarse.sort(
    (
      first,
      second
    ) =>
      first.score -
      second.score
  )

  const coarseWinner =
    coarse[0]

  if (!coarseWinner) {
    return {
      shiftY: 0,
      score: Infinity,
      candidates: [],
    }
  }

  const refined =
    []

  const start =
    Math.max(
      -maximumShift,
      coarseWinner.shift -
        SOURCE_SHIFT_STEP
    )

  const end =
    Math.min(
      maximumShift,
      coarseWinner.shift +
        SOURCE_SHIFT_STEP
    )

  for (
    let shift = start;
    shift <= end;
    shift +=
      REFINEMENT_STEP
  ) {
    refined.push({
      shift,

      score:
        scoreVerticalShift({
          previousSample,
          currentSample,
          sourceShiftY:
            shift,
        }),
    })
  }

  refined.sort(
    (
      first,
      second
    ) =>
      first.score -
      second.score
  )

  const winner =
    refined[0] ??
    coarseWinner

  return {
    shiftY:
      winner.shift,

    score:
      winner.score,

    candidates:
      coarse.slice(
        0,
        6
      ),

    maximumShift,

    sampleWidth:
      currentSample.width,

    sampleHeight:
      currentSample.height,

    sourceHeight:
      currentSample.sourceHeight,
  }
}

// --------------------------------------------------
// Public API
// --------------------------------------------------

export async function measureStorageFrameMovement({
  previousFrame,
  currentFrame,
} = {}) {
  if (
    !previousFrame
      ?.previewUrl ||
    !currentFrame
      ?.previewUrl
  ) {
    throw new Error(
      'Two recording frames are required to measure storage movement.'
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

  const previousSample =
    buildStorageSample({
      image:
        previousImage,

      frameWidth:
        previousFrame.width,

      frameHeight:
        previousFrame.height,
    })

  const currentSample =
    buildStorageSample({
      image:
        currentImage,

      frameWidth:
        currentFrame.width,

      frameHeight:
        currentFrame.height,
    })

  return findBestShift({
    previousSample,
    currentSample,

    frameHeight:
      currentFrame.height,
  })
}

export default measureStorageFrameMovement