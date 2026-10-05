import {
  getAllPokemonReferences,
  getPokemonAvailability,
  getPokemonDisplayName,
  getPokemonIdentity,
} from '../src/utils/pokemonReference.js'

const SPECIES = [
  'ZACIAN',
  'MEWTWO',
]

function formatMoveGroup(
  moves
) {
  return {
    normal:
      moves?.normal ?? [],

    elite:
      moves?.elite ?? [],

    special:
      moves?.special ?? [],
  }
}

function inspectPokemon(
  pokemon
) {
  const availability =
    getPokemonAvailability(
      pokemon
    )

  return {
    id:
      pokemon.id,

    form:
      pokemon.form,

    identity:
      getPokemonIdentity(
        pokemon
      ),

    displayName:
      getPokemonDisplayName(
        pokemon
      ),

    playerUsable:
      availability
        ?.playerUsable ??
      null,

    types:
      pokemon.types ??
      [],

    fastMoves:
      formatMoveGroup(
        pokemon
          ?.moves
          ?.fast
      ),

    chargedMoves:
      formatMoveGroup(
        pokemon
          ?.moves
          ?.charged
      ),

    formChanges:
      pokemon
        ?.formChanges ??
      [],

    temporaryEvolutions:
      pokemon
        ?.temporaryEvolutions ??
      [],
  }
}

const references =
  getAllPokemonReferences()

console.log('')
console.log(
  '================================'
)
console.log(
  'MOVE / FORM MECHANIC INSPECTION'
)
console.log(
  '================================'
)

for (
  const speciesId
  of SPECIES
) {
  const matches =
    references.filter(
      (pokemon) =>
        pokemon.id ===
        speciesId
    )

  console.log('')
  console.log(
    '--------------------------------'
  )
  console.log(
    speciesId
  )
  console.log(
    '--------------------------------'
  )

  for (
    const pokemon
    of matches
  ) {
    const inspected =
      inspectPokemon(
        pokemon
      )

    console.log('')
    console.log(
      `Display: ${inspected.displayName}`
    )

    console.log(
      `Identity: ${inspected.identity}`
    )

    console.log(
      `Raw form: ${inspected.form}`
    )

    console.log('')
    console.log(
      'FAST MOVES'
    )

    console.log(
      JSON.stringify(
        inspected.fastMoves,
        null,
        2
      )
    )

    console.log('')
    console.log(
      'CHARGED MOVES'
    )

    console.log(
      JSON.stringify(
        inspected.chargedMoves,
        null,
        2
      )
    )

    console.log('')
    console.log(
      'FORM CHANGES'
    )

    console.log(
      JSON.stringify(
        inspected.formChanges,
        null,
        2
      )
    )

    if (
      inspected
        .temporaryEvolutions
        .length >
      0
    ) {
      console.log('')
      console.log(
        'TEMPORARY EVOLUTIONS'
      )

      console.log(
        JSON.stringify(
          inspected
            .temporaryEvolutions,
          null,
          2
        )
      )
    }
  }
}

console.log('')
console.log(
  '================================'
)
console.log(
  'INSPECTION COMPLETE'
)
console.log(
  '================================'
)