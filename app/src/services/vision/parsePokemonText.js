import { normalizePokemonText } from './normalizePokemonText'
import { extractPokemonFields } from './extractPokemonFields'

export function parsePokemonText(rawText) {
  if (
    typeof rawText !== 'string' ||
    rawText.trim() === ''
  ) {
    throw new Error('OCR returned no readable text.')
  }

  const normalization = normalizePokemonText(rawText)

  const extractedFields = extractPokemonFields(rawText)

  const species = extractedFields.species.species

  const parsedPokemon = {
    pokemonId: species?.id ?? null,
    name: species?.name ?? 'Unknown Pokémon',
    cp: extractedFields.cp.value,

    ivs: extractedFields.ivs.value,

    shiny: extractedFields.traits.shiny,
    shadow: extractedFields.traits.shadow,
    purified: extractedFields.traits.purified,
    lucky: extractedFields.traits.lucky,
    favorite: false,
  }

  return {
    parsedPokemon,

    diagnostics: {
      normalization,
      extractedFields,
    },
  }
}