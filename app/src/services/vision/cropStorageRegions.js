function loadImage(source) {
  return new Promise(
    (resolve, reject) => {
      const image =
        new Image()

      image.onload = () => {
        resolve(image)
      }

      image.onerror = () => {
        reject(
          new Error(
            'The recording frame could not be loaded for cropping.'
          )
        )
      }

      image.src = source
    }
  )
}

function cropImageRegion(
  image,
  region
) {
  const canvas =
    document.createElement(
      'canvas'
    )

  canvas.width =
    region.width

  canvas.height =
    region.height

  const context =
    canvas.getContext('2d')

  if (!context) {
    throw new Error(
      'Canvas image cropping is unavailable.'
    )
  }

  context.drawImage(
    image,

    region.x,
    region.y,
    region.width,
    region.height,

    0,
    0,
    region.width,
    region.height
  )

  return {
    ...region,

    previewUrl:
      canvas.toDataURL(
        'image/jpeg',
        0.92
      ),
  }
}

export async function cropStorageRegions({
  frame,
  detection,
} = {}) {
  if (
    !frame?.previewUrl
  ) {
    throw new Error(
      'A recording frame is required.'
    )
  }

  if (
    !Array.isArray(
      detection?.regions
    )
  ) {
    throw new Error(
      'Storage regions must be detected before cropping.'
    )
  }

  const image =
    await loadImage(
      frame.previewUrl
    )

  const crops =
    detection.regions.map(
      (region) =>
        cropImageRegion(
          image,
          region
        )
    )

  return crops
}

export default cropStorageRegions