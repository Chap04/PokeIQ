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
          'The screenshot could not be loaded for region detection.'
        )
      )
    }

    image.src = objectUrl
  })
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value))
}

function cropImage(image, region) {
  const canvas = document.createElement('canvas')

  canvas.width = region.width
  canvas.height = region.height

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error(
      'Canvas region detection is not available.'
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

  return canvas.toDataURL('image/png')
}

function createRegion(
  image,
  {
    id,
    label,
    purpose,
    xPercent,
    yPercent,
    widthPercent,
    heightPercent,
    availability = 'available',
    obstructionRisk = 'low',
  }
) {
  const imageWidth = image.naturalWidth
  const imageHeight = image.naturalHeight

  const requestedX = Math.round(
    imageWidth * xPercent
  )

  const requestedY = Math.round(
    imageHeight * yPercent
  )

  const requestedWidth = Math.round(
    imageWidth * widthPercent
  )

  const requestedHeight = Math.round(
    imageHeight * heightPercent
  )

  const x = clamp(
    requestedX,
    0,
    imageWidth - 1
  )

  const y = clamp(
    requestedY,
    0,
    imageHeight - 1
  )

  const width = clamp(
    requestedWidth,
    1,
    imageWidth - x
  )

  const height = clamp(
    requestedHeight,
    1,
    imageHeight - y
  )

  const region = {
    id,
    label,
    purpose,
    availability,
    obstructionRisk,
    x,
    y,
    width,
    height,
  }

  return {
    ...region,
    previewUrl: cropImage(image, region),
  }
}

const BASE_APPRAISAL_REGIONS = [
  {
    id: 'cp',
    label: 'CP',
    purpose: 'Read the Pokémon’s combat power.',
    xPercent: 0.342,
    yPercent: 0.047,
    widthPercent: 0.237,
    heightPercent: 0.047,
  },

  {
    id: 'pokemon-sprite',
    label: 'Pokémon Sprite',
    purpose:
      'Inspect the model for forms, costumes, and visual traits.',
    xPercent: 0,
    yPercent: 0.084,
    widthPercent: 1,
    heightPercent: 0.301,
  },

  {
    id: 'displayed-name',
    label: 'Displayed Name',
    purpose:
      'Read the displayed species name or user nickname.',
    xPercent: 0.161,
    yPercent: 0.385,
    widthPercent: 0.681,
    heightPercent: 0.055,
  },

  {
    id: 'hp',
    label: 'HP',
    purpose: 'Read the current and maximum HP values.',
    xPercent: 0.251,
    yPercent: 0.426,
    widthPercent: 0.501,
    heightPercent: 0.05,
  },

  {
    id: 'weight',
    label: 'Weight',
    purpose: 'Read the Pokémon’s weight.',
    xPercent: 0.07,
    yPercent: 0.51,
    widthPercent: 0.237,
    heightPercent: 0.04,
  },

  {
    id: 'types',
    label: 'Types',
    purpose:
      'Read or visually inspect the Pokémon’s type icons.',
    xPercent: 0.33,
    yPercent: 0.539,
    widthPercent: 0.334,
    heightPercent: 0.028,
  },

  {
    id: 'height',
    label: 'Height',
    purpose: 'Read the Pokémon’s height.',
    xPercent: 0.685,
    yPercent: 0.513,
    widthPercent: 0.234,
    heightPercent: 0.036,
  },

  {
    id: 'special-status',
    label: 'Special Status',
    purpose:
      'Inspect Dynamax, Gigantamax, Mega, or similar status text and icons.',
    xPercent: 0.201,
    yPercent: 0.574,
    widthPercent: 0.599,
    heightPercent: 0.07,
  },

  {
    id: 'candy-count',
    label: 'Candy Count',
    purpose:
      'Read only the visible normal candy number.',
    xPercent: 0.375,
    yPercent: 0.64,
    widthPercent: 0.23,
    heightPercent: 0.07,
  },

  {
    id: 'candy-xl-count',
    label: 'Candy XL Count',
    purpose:
      'Read only the visible Candy XL number.',
    xPercent: 0.745,
    yPercent: 0.64,
    widthPercent: 0.201,
    heightPercent: 0.07,
  },

  {
    id: 'appraisal-bars',
    label: 'Appraisal Bars',
    purpose:
      'Measure the Attack, Defense, and HP appraisal bars.',
    xPercent: 0.029,
    yPercent: 0.752,
    widthPercent: 0.476,
    heightPercent: 0.14,
  },

  {
    id: 'catch-details',
    label: 'Catch Details',
    purpose:
      'Read the catch date, location, and related information.',
    xPercent: 0,
    yPercent: 0.865,
    widthPercent: 0.921,
    heightPercent: 0.13,
  },
]

function copyRegions(regions) {
  return regions.map((region) => ({
    ...region,
  }))
}

const TEAM_LAYOUTS = {
  mystic: {
    id: 'pokemon-details-appraisal-mystic-portrait-v1',
    team: 'mystic',
    leader: 'Blanche',

    regions: copyRegions(
      BASE_APPRAISAL_REGIONS
    ).map((region) => {
      if (
        region.id === 'candy-count' ||
        region.id === 'candy-xl-count'
      ) {
        return {
          ...region,
          obstructionRisk: 'medium',
        }
      }

      return region
    }),
  },

  instinct: {
    id: 'pokemon-details-appraisal-instinct-portrait-v1',
    team: 'instinct',
    leader: 'Spark',

    /*
      Spark currently inherits the base coordinates.

      We will calibrate the affected middle-screen regions
      separately using the uncropped Spark screenshot.
    */
    regions: copyRegions(
      BASE_APPRAISAL_REGIONS
    ).map((region) => {
      if (
        region.id === 'types' ||
        region.id === 'height' ||
        region.id === 'candy-count' ||
        region.id === 'candy-xl-count'
      ) {
        return {
          ...region,
          obstructionRisk: 'high',
        }
      }

      return region
    }),
  },

  valor: {
    id: 'pokemon-details-appraisal-valor-portrait-v1',
    team: 'valor',
    leader: 'Candela',

    /*
      Candela temporarily inherits the base coordinates until
      we calibrate a Valor appraisal screenshot.
    */
    regions: copyRegions(
      BASE_APPRAISAL_REGIONS
    ).map((region) => {
      if (
        region.id === 'candy-count' ||
        region.id === 'candy-xl-count'
      ) {
        return {
          ...region,
          obstructionRisk: 'high',
        }
      }

      return region
    }),
  },
}

function normalizeTeam(team) {
  const normalizedTeam =
    typeof team === 'string'
      ? team.trim().toLowerCase()
      : ''

  if (
    Object.hasOwn(
      TEAM_LAYOUTS,
      normalizedTeam
    )
  ) {
    return normalizedTeam
  }

  return 'mystic'
}

export async function detectPokemonRegions(
  file,
  team = 'mystic'
) {
  if (!(file instanceof File)) {
    throw new Error(
      'A valid screenshot file is required.'
    )
  }

  if (!file.type.startsWith('image/')) {
    throw new Error(
      'Region detection only supports image files.'
    )
  }

  const startedAt = performance.now()
  const image = await loadImageFromFile(file)

  const selectedTeam = normalizeTeam(team)
  const selectedLayout =
    TEAM_LAYOUTS[selectedTeam]

  const regions =
    selectedLayout.regions.map(
      (definition) =>
        createRegion(image, definition)
    )

  const finishedAt = performance.now()

  return {
    layout: selectedLayout.id,
    team: selectedLayout.team,
    leader: selectedLayout.leader,

    regions,

    source: {
      width: image.naturalWidth,
      height: image.naturalHeight,
      aspectRatio:
        image.naturalWidth /
        image.naturalHeight,
    },

    timing: {
      duration: Math.round(
        finishedAt - startedAt
      ),
    },
  }
}