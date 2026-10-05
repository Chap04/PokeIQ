import { evolutionFamilies } from '../data/evolutionFamilies'

function hasCompleteIvs(pokemon) {
  return (
    pokemon.ivs?.attack !== null &&
    pokemon.ivs?.attack !== undefined &&
    pokemon.ivs?.defense !== null &&
    pokemon.ivs?.defense !== undefined &&
    pokemon.ivs?.stamina !== null &&
    pokemon.ivs?.stamina !== undefined
  )
}

function haveSameIvs(pokemonA, pokemonB) {
  if (!hasCompleteIvs(pokemonA) || !hasCompleteIvs(pokemonB)) {
    return false
  }

  return (
    pokemonA.ivs.attack === pokemonB.ivs.attack &&
    pokemonA.ivs.defense === pokemonB.ivs.defense &&
    pokemonA.ivs.stamina === pokemonB.ivs.stamina
  )
}

function haveSameTraits(pokemonA, pokemonB) {
  const persistentTraits = [
    'shiny',
    'shadow',
    'purified',
    'lucky',
  ]

  return persistentTraits.every(
    (trait) => Boolean(pokemonA[trait]) === Boolean(pokemonB[trait])
  )
}

function areInSameEvolutionFamily(pokemonIdA, pokemonIdB) {
  return evolutionFamilies.some(
    (family) =>
      family.includes(pokemonIdA) &&
      family.includes(pokemonIdB)
  )
}

function getEvolutionPosition(pokemonId) {
  const family = evolutionFamilies.find((currentFamily) =>
    currentFamily.includes(pokemonId)
  )

  if (!family) {
    return null
  }

  return {
    family,
    position: family.indexOf(pokemonId),
  }
}

function isForwardEvolution(existingPokemon, importedPokemon) {
  const existingPosition = getEvolutionPosition(
    existingPokemon.pokemonId
  )

  const importedPosition = getEvolutionPosition(
    importedPokemon.pokemonId
  )

  if (!existingPosition || !importedPosition) {
    return false
  }

  const sameFamily =
    existingPosition.family === importedPosition.family

  return (
    sameFamily &&
    importedPosition.position > existingPosition.position
  )
}

function scoreSameSpecies(importedPokemon, existingPokemon) {
  let confidence = 35
  const reasons = ['Same species']

  if (haveSameIvs(importedPokemon, existingPokemon)) {
    confidence += 40
    reasons.push('Same IVs')
  }

  if (haveSameTraits(importedPokemon, existingPokemon)) {
    confidence += 20
    reasons.push('Same traits')
  }

  if (importedPokemon.cp === existingPokemon.cp) {
    confidence += 5
    reasons.push('Same CP')
  } else {
    reasons.push('CP changed')
  }

  const type =
    importedPokemon.cp === existingPokemon.cp
      ? 'exact-duplicate'
      : 'updated-pokemon'

  return {
    type,
    confidence: Math.min(confidence, 100),
    reasons,
  }
}

function scorePossibleEvolution(
  importedPokemon,
  existingPokemon
) {
  let confidence = 25
  const reasons = ['Same evolution family']

  if (haveSameIvs(importedPokemon, existingPokemon)) {
    confidence += 45
    reasons.push('Same IVs')
  }

  if (haveSameTraits(importedPokemon, existingPokemon)) {
    confidence += 25
    reasons.push('Same traits')
  }

  return {
    type: 'possible-evolution',
    confidence: Math.min(confidence, 100),
    reasons,
  }
}

export function matchImportedPokemon(
  importedPokemon,
  collection
) {
  let bestMatch = null

  collection.forEach((existingPokemon) => {
    let result = null

    if (
      importedPokemon.pokemonId === existingPokemon.pokemonId
    ) {
      result = scoreSameSpecies(
        importedPokemon,
        existingPokemon
      )
    } else if (
      areInSameEvolutionFamily(
        importedPokemon.pokemonId,
        existingPokemon.pokemonId
      ) &&
      isForwardEvolution(existingPokemon, importedPokemon)
    ) {
      result = scorePossibleEvolution(
        importedPokemon,
        existingPokemon
      )
    }

    if (!result || result.confidence < 70) {
      return
    }

    if (
      !bestMatch ||
      result.confidence > bestMatch.confidence
    ) {
      bestMatch = {
        found: true,
        ...result,
        existingPokemon,
      }
    }
  })

  return (
    bestMatch ?? {
      found: false,
      type: 'new-pokemon',
      confidence: 0,
      reasons: [],
      existingPokemon: null,
    }
  )
}