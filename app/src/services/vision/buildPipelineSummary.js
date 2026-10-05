function getStatusFromConfidence(confidence) {
  if (confidence >= 90) {
    return 'success'
  }

  if (confidence >= 70) {
    return 'warning'
  }

  return 'error'
}

function hasCompleteIvs(ivs) {
  return (
    Number.isInteger(ivs?.attack) &&
    Number.isInteger(ivs?.defense) &&
    Number.isInteger(ivs?.stamina)
  )
}

export function buildPipelineSummary(analysisResult) {
  if (!analysisResult) {
    return []
  }

  const parsedPokemon = analysisResult.parsedPokemon
  const confidence = analysisResult.confidence ?? {}
  const diagnostics = analysisResult.diagnostics
  const corrections =
    diagnostics?.normalization?.corrections ?? []

  const speciesIdentified =
    Number.isInteger(parsedPokemon?.pokemonId) &&
    parsedPokemon.pokemonId > 0 &&
    parsedPokemon.name &&
    parsedPokemon.name !== 'Unknown Pokémon'

  const cpIdentified =
    Number.isFinite(parsedPokemon?.cp) &&
    parsedPokemon.cp >= 0

  const ivsIdentified = hasCompleteIvs(
    parsedPokemon?.ivs
  )

  const essentialFieldsReady =
    speciesIdentified &&
    cpIdentified &&
    ivsIdentified

  return [
    {
      id: 'ocr',
      title: 'OCR',
      status: 'success',
      message: `Text detected with ${
        confidence.overall ?? 0
      }% confidence.`,
    },

    {
      id: 'normalization',
      title: 'Normalization',
      status:
        corrections.length > 0
          ? 'warning'
          : 'success',
      message:
        corrections.length > 0
          ? `${corrections.length} correction${
              corrections.length === 1 ? '' : 's'
            } applied.`
          : 'No text corrections were needed.',
    },

    {
      id: 'species',
      title: 'Species',
      status: speciesIdentified
        ? getStatusFromConfidence(
            confidence.species ?? 0
          )
        : 'error',
      message: speciesIdentified
        ? `${parsedPokemon.name} identified at ${
            confidence.species ?? 0
          }% confidence.`
        : 'Pokémon species could not be identified.',
    },

    {
      id: 'cp',
      title: 'CP',
      status: cpIdentified
        ? getStatusFromConfidence(confidence.cp ?? 0)
        : 'error',
      message: cpIdentified
        ? `CP ${parsedPokemon.cp.toLocaleString()} detected.`
        : 'CP could not be read.',
    },

    {
      id: 'ivs',
      title: 'IVs',
      status: ivsIdentified
        ? getStatusFromConfidence(confidence.ivs ?? 0)
        : 'error',
      message: ivsIdentified
        ? `${parsedPokemon.ivs.attack} / ${parsedPokemon.ivs.defense} / ${parsedPokemon.ivs.stamina} extracted.`
        : 'Complete IVs could not be extracted.',
    },

    {
      id: 'ready',
      title: 'Import Readiness',
      status: essentialFieldsReady
        ? 'success'
        : 'error',
      message: essentialFieldsReady
        ? 'This detection is ready for import review.'
        : 'Required fields are missing and need attention.',
    },
  ]
}