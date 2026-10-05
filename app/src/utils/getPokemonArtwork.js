import { pokemonSpecies } from '../data/pokemonSpecies'

// --------------------------------------------------
// PokéAPI form sprite mapping
// --------------------------------------------------

/**
 * PokéAPI represents many alternate Pokémon forms as
 * separate Pokémon resources with their own sprite IDs.
 *
 * PokeIQ uses Pokémon GO / Game Master form identifiers,
 * so this table maps those form identifiers to the
 * corresponding PokéAPI sprite IDs.
 *
 * Unknown forms deliberately fall back to the base
 * National Pokédex sprite instead of producing a broken
 * image URL.
 */

const FORM_SPRITE_IDS = {
  // ------------------------------------------------
  // Mega / Primal
  // ------------------------------------------------

  'RAYQUAZA:TEMP_EVOLUTION_MEGA':
    10079,

  'RAYQUAZA:MEGA':
    10079,

  // ------------------------------------------------
  // Forces of Nature
  // ------------------------------------------------

  'TORNADUS:TORNADUS_INCARNATE':
    641,

  'TORNADUS:TORNADUS_THERIAN':
    10019,

  'THUNDURUS:THUNDURUS_INCARNATE':
    642,

  'THUNDURUS:THUNDURUS_THERIAN':
    10020,

  'LANDORUS:LANDORUS_INCARNATE':
    645,

  'LANDORUS:LANDORUS_THERIAN':
    10021,

  'ENAMORUS:ENAMORUS_INCARNATE':
    905,

  'ENAMORUS:ENAMORUS_THERIAN':
    10249,

  // ------------------------------------------------
  // Kyurem
  // ------------------------------------------------

  'KYUREM:NORMAL':
    646,

  'KYUREM:KYUREM_BLACK':
    10022,

  'KYUREM:KYUREM_WHITE':
    10023,

  // ------------------------------------------------
  // Necrozma
  // ------------------------------------------------

  'NECROZMA:NORMAL':
    800,

  'NECROZMA:NECROZMA_DUSK_MANE':
    10155,

  'NECROZMA:NECROZMA_DAWN_WINGS':
    10156,

  'NECROZMA:NECROZMA_ULTRA':
    10157,
}

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function normalizeSpeciesName(
  value
) {
  return value
    ?.toLowerCase()
    .replace(
      /[^a-z0-9]/g,
      ''
    )
}

function normalizePokemonId(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null
  }

  return String(
    value
  )
    .trim()
    .toUpperCase()
}

function normalizePokemonForm(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return 'NORMAL'
  }

  return String(
    value
  )
    .trim()
    .toUpperCase()
}

function getPokedexNumber(
  pokemon
) {
  if (
    !pokemon?.id
  ) {
    return null
  }

  if (
    typeof pokemon.id ===
    'number'
  ) {
    return pokemon.id
  }

  const normalizedId =
    normalizeSpeciesName(
      pokemon.id
    )

  const species =
    pokemonSpecies.find(
      (candidate) =>
        normalizeSpeciesName(
          candidate.name
        ) ===
          normalizedId ||
        normalizeSpeciesName(
          candidate.apiName
        ) ===
          normalizedId
    )

  return (
    species?.id ??
    null
  )
}

function getFormSpriteId(
  pokemon
) {
  const pokemonId =
    normalizePokemonId(
      pokemon?.id
    )

  const form =
    normalizePokemonForm(
      pokemon?.form
    )

  if (
    !pokemonId
  ) {
    return null
  }

  const key =
    `${pokemonId}:${form}`

  return (
    FORM_SPRITE_IDS[key] ??
    null
  )
}

function buildSpriteUrl({
  spriteId,
  shiny,
}) {
  if (
    !spriteId
  ) {
    return null
  }

  const shinyPath =
    shiny
      ? 'shiny/'
      : ''

  return (
    'https://raw.githubusercontent.com/' +
    'PokeAPI/sprites/master/' +
    'sprites/pokemon/' +
    `${shinyPath}${spriteId}.png`
  )
}

// --------------------------------------------------
// Public artwork resolver
// --------------------------------------------------

export function getPokemonArtwork(
  pokemon
) {
  if (
    !pokemon?.id
  ) {
    return null
  }

  // ------------------------------------------------
  // Known form-specific PokéAPI sprite
  // ------------------------------------------------

  const formSpriteId =
    getFormSpriteId(
      pokemon
    )

  if (
    formSpriteId
  ) {
    return buildSpriteUrl({
      spriteId:
        formSpriteId,

      shiny:
        Boolean(
          pokemon.shiny
        ),
    })
  }

  // ------------------------------------------------
  // Base-species fallback
  // ------------------------------------------------

  const pokedexNumber =
    getPokedexNumber(
      pokemon
    )

  if (
    !pokedexNumber
  ) {
    return null
  }

  return buildSpriteUrl({
    spriteId:
      pokedexNumber,

    shiny:
      Boolean(
        pokemon.shiny
      ),
  })
}