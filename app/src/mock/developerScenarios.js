function createPokemon({
  pokemonId,
  name,
  cp,
  attack,
  defense,
  stamina,
  shiny = false,
  shadow = false,
  purified = false,
  lucky = false,
  favorite = false,
}) {
  return {
    id: crypto.randomUUID(),
    pokemonId,
    name,
    cp,
    ivs: {
      attack,
      defense,
      stamina,
    },
    shiny,
    shadow,
    purified,
    lucky,
    favorite,
  }
}

export function createTestCollection() {
  return [
    createPokemon({
      pokemonId: 473,
      name: 'Mamoswine',
      cp: 3120,
      attack: 15,
      defense: 14,
      stamina: 15,
      shiny: true,
      shadow: true,
      favorite: true,
    }),

    createPokemon({
      pokemonId: 448,
      name: 'Lucario',
      cp: 2468,
      attack: 10,
      defense: 8,
      stamina: 7,
    }),

    createPokemon({
      pokemonId: 384,
      name: 'Rayquaza',
      cp: 4275,
      attack: 15,
      defense: 15,
      stamina: 14,
      lucky: true,
    }),
  ]
}

export function createDuplicateScenario() {
  return [
    createPokemon({
      pokemonId: 473,
      name: 'Mamoswine',
      cp: 3120,
      attack: 15,
      defense: 14,
      stamina: 15,
      shiny: true,
      shadow: true,
    }),
  ]
}

export function createEvolutionScenario() {
  return [
    createPokemon({
      pokemonId: 220,
      name: 'Swinub',
      cp: 742,
      attack: 15,
      defense: 14,
      stamina: 15,
      shiny: true,
      shadow: true,
    }),
  ]
}

export function createBrandNewTrainerScenario() {
  return [
    createPokemon({
      pokemonId: 25,
      name: 'Pikachu',
      cp: 622,
      attack: 12,
      defense: 10,
      stamina: 11,
      favorite: true,
    }),

    createPokemon({
      pokemonId: 133,
      name: 'Eevee',
      cp: 504,
      attack: 13,
      defense: 12,
      stamina: 10,
    }),

    createPokemon({
      pokemonId: 7,
      name: 'Squirtle',
      cp: 418,
      attack: 9,
      defense: 12,
      stamina: 14,
    }),
  ]
}

export function createMessyCollectionScenario() {
  return [
    ...createTestCollection(),

    createPokemon({
      pokemonId: 473,
      name: 'Mamoswine',
      cp: 2844,
      attack: 8,
      defense: 7,
      stamina: 10,
      shadow: true,
    }),

    createPokemon({
      pokemonId: 448,
      name: 'Lucario',
      cp: 2121,
      attack: 0,
      defense: 15,
      stamina: 5,
      shiny: true,
      shadow: true,
    }),

    createPokemon({
      pokemonId: 25,
      name: 'Pikachu',
      cp: 901,
      attack: 15,
      defense: 15,
      stamina: 15,
      lucky: true,
      favorite: true,
    }),
  ]
}
