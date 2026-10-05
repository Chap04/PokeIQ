import { runOcr } from './runOcr'
import { runRegionOcr } from './runRegionOcr'
import { parsePokemonText } from './parsePokemonText'
import { scoreVisionConfidence } from './scoreVisionConfidence'
import { buildPipelineSummary } from './buildPipelineSummary'
import { detectAppraisalIvs } from './detectAppraisalIvs'
import { detectPokemonRegions } from './detectPokemonRegions'

export async function analyzeScreenshot(
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
      'The selected file must be an image.'
    )
  }

  const totalStartedAt = performance.now()

  /*
    OCR and region detection can run at the same time.

    Appraisal detection runs afterward because it needs the
    calibrated "appraisal-bars" region.
  */
  const [
    ocrResult,
    regionResult,
  ] = await Promise.all([
    runOcr(file),
    detectPokemonRegions(file, team),
  ])

  const detectedRegions =
    Array.isArray(regionResult?.regions)
      ? regionResult.regions
      : []

  const appraisalRegion =
    detectedRegions.find(
      (region) =>
        region?.id === 'appraisal-bars'
    ) ?? null

  console.log(
    'Detected regions:',
    detectedRegions
  )

  console.log(
    'Appraisal region:',
    appraisalRegion
  )

  if (!appraisalRegion) {
    const availableRegionIds =
      detectedRegions
        .map((region) => region?.id)
        .filter(Boolean)
        .join(', ')

    throw new Error(
      availableRegionIds
        ? `The appraisal-bars region was not available. Detected regions: ${availableRegionIds}`
        : 'No screenshot regions were returned by region detection.'
    )
  }

  const appraisalResult =
    await detectAppraisalIvs(
      file,
      appraisalRegion
    )

  const regionOcrResult =
    await runRegionOcr(
      detectedRegions
    )

  const regionLookup =
    Object.fromEntries(
      regionOcrResult.items.map(
        (item) => [
          item.id,
          item,
        ]
      )
    )

  const combinedText = [
    regionLookup['displayed-name']
      ?.rawText,

    regionLookup['cp']
      ?.rawText,

    regionLookup['hp']
      ?.rawText,

    regionLookup['weight']
      ?.rawText,

    regionLookup['height']
      ?.rawText,

    ocrResult.rawText,
  ]
    .filter(Boolean)
    .join('\n')

  const parserStartedAt =
    performance.now()

  const {
    parsedPokemon,
    diagnostics,
  } = parsePokemonText(
    combinedText
  )

  const parserFinishedAt =
    performance.now()

  const parsedPokemonWithAppraisal = {
    ...parsedPokemon,

    ivs: {
      attack:
        appraisalResult.ivs
          ?.attack ??
        parsedPokemon.ivs
          ?.attack ??
        null,

      defense:
        appraisalResult.ivs
          ?.defense ??
        parsedPokemon.ivs
          ?.defense ??
        null,

      stamina:
        appraisalResult.ivs
          ?.stamina ??
        parsedPokemon.ivs
          ?.stamina ??
        null,
    },
  }

  const confidence =
    scoreVisionConfidence({
      ocrResult,

      parsedPokemon:
        parsedPokemonWithAppraisal,
    })

  const totalFinishedAt =
    performance.now()

  const analysisResult = {
    rawText:
      ocrResult.rawText,

    regionOcr:
      regionOcrResult,

    parsedPokemon:
      parsedPokemonWithAppraisal,

    confidence,

    preprocessing: {
      previewUrl:
        ocrResult.preprocessing
          ?.previewUrl ?? null,

      diagnostics:
        ocrResult.preprocessing
          ?.diagnostics ?? null,
    },

    regions: {
      items:
        detectedRegions,

      source:
        regionResult.source,

      layout:
        regionResult.layout,

      team:
        regionResult.team,

      leader:
        regionResult.leader,
    },

    diagnostics: {
      ...diagnostics,

      preprocessing:
        ocrResult.preprocessing
          ?.diagnostics ?? null,

      appraisal:
        appraisalResult
          .diagnostics ?? null,

      regions: {
        items:
          detectedRegions,

        source:
          regionResult.source,

        layout:
          regionResult.layout,

        team:
          regionResult.team,

        leader:
          regionResult.leader,
      },

      regionOcr:
        regionOcrResult.items,
    },

    source: {
      name:
        file.name,

      type:
        file.type,

      size:
        file.size,
    },

    timing: {
      preprocessing:
        ocrResult.preprocessing
          ?.timing
          ?.duration ?? 0,

      regions:
        regionResult.timing
          ?.duration ?? 0,

      regionOcr:
        regionOcrResult
          .totalDuration ?? 0,

      ocr:
        ocrResult.timing
          ?.duration ?? 0,

      parser:
        Math.round(
          parserFinishedAt -
          parserStartedAt
        ),

      appraisal:
        appraisalResult.timing
          ?.duration ?? 0,

      total:
        Math.round(
          totalFinishedAt -
          totalStartedAt
        ),
    },
  }

  return {
    ...analysisResult,

    pipelineSummary:
      buildPipelineSummary(
        analysisResult
      ),
  }
}