const SAMPLE_SIZE = 32

const DEFAULT_THRESHOLD = 0.94

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
              'Could not load a storage crop for comparison.'
            )
          )

      image.src =
        source
    }
  )
}

function buildSignature(
  image
) {
  const canvas =
    document.createElement(
      'canvas'
    )

  canvas.width =
    SAMPLE_SIZE

  canvas.height =
    SAMPLE_SIZE

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
      'Could not create the crop comparison canvas.'
    )
  }

  context.drawImage(
    image,
    0,
    0,
    SAMPLE_SIZE,
    SAMPLE_SIZE
  )

  const imageData =
    context.getImageData(
      0,
      0,
      SAMPLE_SIZE,
      SAMPLE_SIZE
    )

  const data =
    imageData.data

  const signature =
    new Float32Array(
      SAMPLE_SIZE *
        SAMPLE_SIZE
    )

  let total =
    0

  for (
    let index = 0;
    index <
      signature.length;
    index += 1
  ) {
    const pixelIndex =
      index * 4

    const value =
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

    signature[index] =
      value

    total +=
      value
  }

  const mean =
    total /
    signature.length

  let variance =
    0

  for (
    let index = 0;
    index <
      signature.length;
    index += 1
  ) {
    const difference =
      signature[index] -
      mean

    variance +=
      difference *
      difference
  }

  const standardDeviation =
    Math.sqrt(
      variance /
        signature.length
    ) || 1

  for (
    let index = 0;
    index <
      signature.length;
    index += 1
  ) {
    signature[index] =
      (
        signature[index] -
        mean
      ) /
      standardDeviation
  }

  return signature
}

function calculateSimilarity(
  first,
  second
) {
  if (
    first.length !==
    second.length
  ) {
    return 0
  }

  let difference =
    0

  for (
    let index = 0;
    index <
      first.length;
    index += 1
  ) {
    difference +=
      Math.abs(
        first[index] -
          second[index]
      )
  }

  const meanDifference =
    difference /
    first.length

  return Math.max(
    0,
    1 -
      meanDifference /
        2
  )
}

export async function compareStorageCrops(
  firstCrop,
  secondCrop,
  {
    threshold =
      DEFAULT_THRESHOLD,
  } = {}
) {
  if (
    !firstCrop?.previewUrl ||
    !secondCrop?.previewUrl
  ) {
    return {
      matches: false,
      similarity: 0,
    }
  }

  const [
    firstImage,
    secondImage,
  ] =
    await Promise.all([
      loadImage(
        firstCrop.previewUrl
      ),

      loadImage(
        secondCrop.previewUrl
      ),
    ])

  const firstSignature =
    buildSignature(
      firstImage
    )

  const secondSignature =
    buildSignature(
      secondImage
    )

  const similarity =
    calculateSimilarity(
      firstSignature,
      secondSignature
    )

  return {
    matches:
      similarity >=
      threshold,

    similarity,

    threshold,
  }
}

export default compareStorageCrops