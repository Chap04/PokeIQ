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
          'The screenshot could not be loaded for preprocessing.'
        )
      )
    }

    image.src = objectUrl
  })
}

function clampColour(value) {
  return Math.max(0, Math.min(255, value))
}

export async function preprocessImage(file) {
  if (!(file instanceof File)) {
    throw new Error('A valid screenshot file is required.')
  }

  if (!file.type.startsWith('image/')) {
    throw new Error(
      'Image preprocessing only supports image files.'
    )
  }

  const startedAt = performance.now()
  const image = await loadImageFromFile(file)

  /*
    Upscaling can make small interface text easier for OCR to inspect.
    We cap the scale so very large screenshots do not become excessive.
  */
  const scale =
    image.naturalWidth < 1600
      ? 1.5
      : 1

  const canvas = document.createElement('canvas')

  canvas.width = Math.round(
    image.naturalWidth * scale
  )

  canvas.height = Math.round(
    image.naturalHeight * scale
  )

  const context = canvas.getContext('2d', {
    willReadFrequently: true,
  })

  if (!context) {
    throw new Error(
      'Canvas image preprocessing is not available.'
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
  const contrast = 1.35
  const midpoint = 128

  for (let index = 0; index < pixels.length; index += 4) {
    const red = pixels[index]
    const green = pixels[index + 1]
    const blue = pixels[index + 2]

    const grayscale =
      red * 0.299 +
      green * 0.587 +
      blue * 0.114

    const contrasted =
      midpoint +
      contrast * (grayscale - midpoint)

    const finalValue = clampColour(contrasted)

    pixels[index] = finalValue
    pixels[index + 1] = finalValue
    pixels[index + 2] = finalValue
  }

  context.putImageData(imageData, 0, 0)

  const finishedAt = performance.now()

  return {
    image: canvas,

    previewUrl: canvas.toDataURL('image/png'),

    diagnostics: {
      originalWidth: image.naturalWidth,
      originalHeight: image.naturalHeight,
      processedWidth: canvas.width,
      processedHeight: canvas.height,
      scale,
      grayscale: true,
      contrast,
    },

    timing: {
      duration: Math.round(
        finishedAt - startedAt
      ),
    },
  }
}