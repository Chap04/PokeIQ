function hasAcceptedSpecies(parsedPokemon) {
  return (
    Number.isInteger(parsedPokemon?.pokemonId) &&
    parsedPokemon.pokemonId > 0 &&
    typeof parsedPokemon.name === 'string' &&
    parsedPokemon.name.trim() !== '' &&
    parsedPokemon.name !== 'Unknown Pokémon'
  )
}

function hasValidCp(parsedPokemon) {
  return (
    Number.isFinite(parsedPokemon?.cp) &&
    parsedPokemon.cp >= 0
  )
}

function hasCompleteIvs(parsedPokemon) {
  const ivs = parsedPokemon?.ivs

  return (
    Number.isInteger(ivs?.attack) &&
    Number.isInteger(ivs?.defense) &&
    Number.isInteger(ivs?.stamina) &&
    ivs.attack >= 0 &&
    ivs.attack <= 15 &&
    ivs.defense >= 0 &&
    ivs.defense <= 15 &&
    ivs.stamina >= 0 &&
    ivs.stamina <= 15
  )
}

function hasDetectedTraits(parsedPokemon) {
  return (
    typeof parsedPokemon?.shiny === 'boolean' &&
    typeof parsedPokemon?.shadow === 'boolean' &&
    typeof parsedPokemon?.purified === 'boolean' &&
    typeof parsedPokemon?.lucky === 'boolean'
  )
}

export function scoreVisionConfidence({
  ocrResult,
  parsedPokemon,
}) {
  const speciesAccepted =
    hasAcceptedSpecies(parsedPokemon)

  const cpAccepted =
    hasValidCp(parsedPokemon)

  const ivsAccepted =
    hasCompleteIvs(parsedPokemon)

  const traitsAccepted =
    hasDetectedTraits(parsedPokemon)

  return {
    species: speciesAccepted ? 98 : 0,
    cp: cpAccepted ? 96 : 0,
    ivs: ivsAccepted ? 92 : 0,
    traits: traitsAccepted ? 89 : 0,
    overall: Math.round(ocrResult?.confidence ?? 0),
  }
}