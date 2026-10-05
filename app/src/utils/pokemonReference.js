import pokemonReferenceData from '../data/reference/pokemon.json' with { type: 'json' }
import pokemonAvailabilityData from '../data/reference/pokemon-availability.json' with { type: 'json' }

const REGIONAL_FORMS = {
  ALOLAN: 'Alolan',
  GALARIAN: 'Galarian',
  HISUIAN: 'Hisuian',
  PALDEAN: 'Paldean',
}

// --------------------------------------------------
// Player-facing form overrides
//
// Reference identity and Collection identity are not
// always the same thing.
//
// These rules affect how reference records are shown
// to a player. They do not delete or rewrite the raw
// reference data used by the engine.
// --------------------------------------------------

const COLLECTION_FORM_OVERRIDES = {
  ZACIAN__NORMAL: {
    selectable: false,
  },

  ZAMAZENTA__NORMAL: {
    selectable: false,
  },

  KELDEO__NORMAL: {
    selectable: false,
  },

  MEWTWO__MEWTWO_A: {
    displayName: 'Armored Mewtwo',
  },

  AEGISLASH__NORMAL: {
  selectable: false,
},
}

// --------------------------------------------------
// Move-option overrides
//
// Some live Pokémon GO acquisition rules are not
// represented correctly in the normalized Game Master
// move pools.
//
// These rules affect move acquisition / Collection
// behavior without rewriting the raw reference data.
// --------------------------------------------------

const CHARGED_MOVE_AVAILABILITY_OVERRIDES = {
  DIALGA__DIALGA_ORIGIN: {
    ROAR_OF_TIME: 'ELITE',
  },
}

// --------------------------------------------------
// State-dependent Charged Moves
//
// Frustration and Return are real moves, but they are
// not ordinary species move-pool options.
//
// Frustration belongs to Shadow state.
// Return belongs to Purified state.
//
// They are therefore hidden from generic move-option
// generation and only exposed when the owned Pokémon
// has the matching state.
// --------------------------------------------------

const SHADOW_CHARGED_MOVE =
  'FRUSTRATION'

const PURIFIED_CHARGED_MOVE =
  'RETURN'

function formatToken(value) {
  if (!value) {
    return ''
  }

  return value
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(' ')
}

function getFormSuffix(pokemon) {
  if (
    !pokemon ||
    pokemon.form === 'NORMAL'
  ) {
    return ''
  }

  const speciesPrefix =
    `${pokemon.id}_`

  if (
    pokemon.form.startsWith(
      speciesPrefix
    )
  ) {
    return pokemon.form.slice(
      speciesPrefix.length
    )
  }

  return pokemon.form
}

function getRegionalFormName(
  formSuffix
) {
  return (
    REGIONAL_FORMS[
      formSuffix
    ] ?? null
  )
}

function buildMoveOptions(
  moveGroups,
  additionalSpecialMoves = []
) {
  if (
    !moveGroups &&
    additionalSpecialMoves.length === 0
  ) {
    return []
  }

  const options = []
  const seenMoveIds =
    new Set()

  const categories = [
    {
      moveIds:
        moveGroups?.normal ??
        [],

      availability:
        'NORMAL',
    },

    {
      moveIds:
        moveGroups?.elite ??
        [],

      availability:
        'ELITE',
    },

    {
      moveIds:
        moveGroups?.special ??
        [],

      availability:
        'SPECIAL',
    },

    {
      moveIds:
        additionalSpecialMoves,

      availability:
        'SPECIAL',
    },
  ]

  for (
    const category
    of categories
  ) {
    for (
      const moveId
      of category.moveIds
    ) {
      if (!moveId) {
        continue
      }

      if (
        seenMoveIds.has(
          moveId
        )
      ) {
        continue
      }

      seenMoveIds.add(
        moveId
      )

      options.push({
        id:
          moveId,

        availability:
          category.availability,
      })
    }
  }

  return options
}

function getMoveAvailability(
  options,
  moveId
) {
  if (!moveId) {
    return null
  }

  const option =
    options.find(
      (entry) =>
        entry.id ===
        moveId
    )

  return (
    option?.availability ??
    null
  )
}

function getPokemonAvailabilityKey(
  pokemon
) {
  if (!pokemon?.id) {
    return null
  }

  if (
    !pokemon.form ||
    pokemon.form ===
      'NORMAL'
  ) {
    return pokemon.id
  }

  return (
    `${pokemon.id}__${pokemon.form}`
  )
}

function getCollectionFormOverride(
  pokemon
) {
  const identity =
    getPokemonIdentity(
      pokemon
    )

  if (!identity) {
    return null
  }

  return (
    COLLECTION_FORM_OVERRIDES[
      identity
    ] ?? null
  )
}

// --------------------------------------------------
// Charged-move acquisition overrides
// --------------------------------------------------

function applyChargedMoveAvailabilityOverrides({
  pokemon,
  options,
}) {
  const identity =
    getPokemonIdentity(
      pokemon
    )

  if (!identity) {
    return options
  }

  const overrides =
    CHARGED_MOVE_AVAILABILITY_OVERRIDES[
      identity
    ]

  if (!overrides) {
    return options
  }

  const nextOptions =
    options.map(
      (option) => {
        const overrideAvailability =
          overrides[
            option.id
          ]

        if (
          !overrideAvailability
        ) {
          return option
        }

        return {
          ...option,

          availability:
            overrideAvailability,
        }
      }
    )

  const existingMoveIds =
    new Set(
      nextOptions.map(
        (option) =>
          option.id
      )
    )

  for (
    const [
      moveId,
      availability,
    ]
    of Object.entries(
      overrides
    )
  ) {
    if (
      existingMoveIds.has(
        moveId
      )
    ) {
      continue
    }

    nextOptions.push({
      id:
        moveId,

      availability,
    })

    existingMoveIds.add(
      moveId
    )
  }

  return nextOptions
}

function removeStateDependentChargedMoves(
  options
) {
  return options.filter(
    (option) =>
      option.id !==
        SHADOW_CHARGED_MOVE &&
      option.id !==
        PURIFIED_CHARGED_MOVE
  )
}

function addOwnedStateChargedMoves({
  options,
  shadow,
  purified,
}) {
  const nextOptions = [
    ...options,
  ]

  const seenMoveIds =
    new Set(
      nextOptions.map(
        (option) =>
          option.id
      )
    )

  if (
    shadow ===
      true &&
    !seenMoveIds.has(
      SHADOW_CHARGED_MOVE
    )
  ) {
    nextOptions.push({
      id:
        SHADOW_CHARGED_MOVE,

      availability:
        'SPECIAL',
    })

    seenMoveIds.add(
      SHADOW_CHARGED_MOVE
    )
  }

  if (
    purified ===
      true &&
    !seenMoveIds.has(
      PURIFIED_CHARGED_MOVE
    )
  ) {
    nextOptions.push({
      id:
        PURIFIED_CHARGED_MOVE,

      availability:
        'SPECIAL',
    })
  }

  return nextOptions
}

// --------------------------------------------------
// Form-change-derived move helpers
//
// Some moves do not belong to a form's ordinary TM
// pool but can exist on that form because a move is
// reassigned during a form change.
//
// Example:
//
// Zacian (Hero)
// IRON_HEAD
//      ↓
// Zacian (Crowned Sword)
// BEHEMOTH_BLADE
//
// These moves remain SPECIAL rather than being
// flattened into the target form's normal move pool.
// --------------------------------------------------

function getIncomingFormChangeReassignments(
  pokemon,
  moveType
) {
  if (
    !pokemon?.id ||
    !pokemon?.form
  ) {
    return []
  }

  const targetForm =
    pokemon.form

  const results = []
  const seen =
    new Set()

  for (
    const sourcePokemon
    of pokemonReferenceData
  ) {
    if (
      sourcePokemon.id !==
      pokemon.id
    ) {
      continue
    }

    for (
      const formChange
      of sourcePokemon.formChanges ??
      []
    ) {
      if (
        !formChange
          ?.targetForms
          ?.includes(
            targetForm
          )
      ) {
        continue
      }

      const reassignments =
        formChange
          ?.moveReassignments
          ?.[moveType] ??
        []

      for (
        const reassignment
        of reassignments
      ) {
        const moveId =
          reassignment?.to

        if (
          !moveId ||
          seen.has(
            moveId
          )
        ) {
          continue
        }

        seen.add(
          moveId
        )

        results.push({
          moveId,

          fromMoveId:
            reassignment
              ?.from ??
            null,

          sourcePokemonId:
            sourcePokemon.id,

          sourceForm:
            sourcePokemon.form,

          targetForm,

          formChange,
        })
      }
    }
  }

  return results
}

function getIncomingFormChangeMoveIds(
  pokemon,
  moveType
) {
  return (
    getIncomingFormChangeReassignments(
      pokemon,
      moveType
    ).map(
      (entry) =>
        entry.moveId
    )
  )
}

// --------------------------------------------------
// Pokémon identity / display
// --------------------------------------------------

export function getPokemonIdentity(
  pokemon
) {
  if (!pokemon?.id) {
    return null
  }

  return (
    `${pokemon.id}__${pokemon.form ?? 'NORMAL'}`
  )
}

export function getPokemonDisplayName(
  pokemon
) {
  if (!pokemon?.id) {
    return ''
  }

  const collectionOverride =
    getCollectionFormOverride(
      pokemon
    )

  if (
    collectionOverride
      ?.displayName
  ) {
    return (
      collectionOverride
        .displayName
    )
  }

  const speciesName =
    formatToken(
      pokemon.id
    )

  if (
    !pokemon.form ||
    pokemon.form ===
      'NORMAL'
  ) {
    return speciesName
  }

  const formSuffix =
    getFormSuffix(
      pokemon
    )

  const regionalName =
    getRegionalFormName(
      formSuffix
    )

  if (regionalName) {
    return (
      `${regionalName} ${speciesName}`
    )
  }

  return (
    `${speciesName} (${formatToken(formSuffix)})`
  )
}

// --------------------------------------------------
// Availability
// --------------------------------------------------

export function isPokemonPlayerUsable(
  pokemon
) {
  const availabilityKey =
    getPokemonAvailabilityKey(
      pokemon
    )

  if (!availabilityKey) {
    return false
  }

  const availability =
    pokemonAvailabilityData
      .overrides?.[
        availabilityKey
      ]

  if (!availability) {
    return (
      pokemonAvailabilityData
        .defaultPlayerUsable ===
      true
    )
  }

  return (
    availability
      .playerUsable ===
    true
  )
}

export function getPokemonAvailability(
  pokemon
) {
  const availabilityKey =
    getPokemonAvailabilityKey(
      pokemon
    )

  if (!availabilityKey) {
    return null
  }

  return (
    pokemonAvailabilityData
      .overrides?.[
        availabilityKey
      ] ?? null
  )
}

// --------------------------------------------------
// Collection selectability
//
// A record may legitimately exist in normalized
// reference data while still not being something a
// player should select as an owned Collection form.
// --------------------------------------------------

export function isPokemonCollectionSelectable(
  pokemon
) {
  if (
    !isPokemonPlayerUsable(
      pokemon
    )
  ) {
    return false
  }

  const override =
    getCollectionFormOverride(
      pokemon
    )

  if (
    override
      ?.selectable ===
    false
  ) {
    return false
  }

  return true
}

// --------------------------------------------------
// Reference lookup
// --------------------------------------------------

export function getAllPokemonReferences() {
  return (
    pokemonReferenceData.filter(
      isPokemonPlayerUsable
    )
  )
}

export function getCollectionPokemonReferences() {
  return (
    pokemonReferenceData.filter(
      isPokemonCollectionSelectable
    )
  )
}

export function getPokemonReference(
  id,
  form = 'NORMAL'
) {
  if (!id) {
    return null
  }

  return (
    pokemonReferenceData.find(
      (pokemon) =>
        pokemon.id ===
          id &&
        pokemon.form ===
          form
    ) ?? null
  )
}

export function getPokemonReferenceByIdentity(
  identity
) {
  if (!identity) {
    return null
  }

  return (
    pokemonReferenceData.find(
      (pokemon) =>
        getPokemonIdentity(
          pokemon
        ) ===
        identity
    ) ?? null
  )
}

// --------------------------------------------------
// Permanent evolution lookup
//
// pokemon.json preserves direct Game Master evolution
// branches. These helpers resolve those branches back
// into complete reference records and can traverse
// multi-stage permanent evolution chains.
//
// This layer describes what evolution relationships
// exist. It deliberately does not decide whether the
// player currently satisfies a special requirement or
// whether evolving is a worthwhile Raid Investment.
// --------------------------------------------------

function getEvolutionTargetReference(
  evolution
) {
  if (
    !evolution?.pokemonId
  ) {
    return null
  }

  return getPokemonReference(
    evolution.pokemonId,
    evolution.form ??
      'NORMAL'
  )
}

function normalizeEvolutionCosts(
  evolution
) {
  return {
    candy:
      evolution
        ?.costs
        ?.candy ??
      null,

    purifiedCandy:
      evolution
        ?.costs
        ?.purifiedCandy ??
      null,

    item:
      evolution
        ?.costs
        ?.item ??
      null,
  }
}

function normalizeEvolutionRequirements(
  evolution
) {
  return {
    buddyDistanceKm:
      evolution
        ?.requirements
        ?.buddyDistanceKm ??
      null,

    mustBeBuddy:
      evolution
        ?.requirements
        ?.mustBeBuddy ===
      true,

    daytime:
      evolution
        ?.requirements
        ?.daytime ===
      true,

    nighttime:
      evolution
        ?.requirements
        ?.nighttime ===
      true,

    fullMoon:
      evolution
        ?.requirements
        ?.fullMoon ===
      true,

    upsideDown:
      evolution
        ?.requirements
        ?.upsideDown ===
      true,

    lureItem:
      evolution
        ?.requirements
        ?.lureItem ??
      null,

    move:
      evolution
        ?.requirements
        ?.move ??
      null,

    gender:
      evolution
        ?.requirements
        ?.gender ??
      null,

    quests:
      Array.isArray(
        evolution
          ?.requirements
          ?.quests
      )
        ? [
            ...evolution
              .requirements
              .quests,
          ]
        : [],
  }
}

function buildEvolutionStep(
  source,
  evolution
) {
  const target =
    getEvolutionTargetReference(
      evolution
    )

  if (!target) {
    return {
      source,

      sourceIdentity:
        getPokemonIdentity(
          source
        ),

      target:
        null,

      targetIdentity:
        evolution?.pokemonId
          ? `${evolution.pokemonId}__${evolution.form ?? 'NORMAL'}`
          : null,

      pokemonId:
        evolution
          ?.pokemonId ??
        null,

      form:
        evolution
          ?.form ??
        'NORMAL',

      costs:
        normalizeEvolutionCosts(
          evolution
        ),

      requirements:
        normalizeEvolutionRequirements(
          evolution
        ),

      priority:
        evolution
          ?.priority ??
        null,

      resolved:
        false,
    }
  }

  return {
    source,

    sourceIdentity:
      getPokemonIdentity(
        source
      ),

    target,

    targetIdentity:
      getPokemonIdentity(
        target
      ),

    pokemonId:
      target.id,

    form:
      target.form,

    costs:
      normalizeEvolutionCosts(
        evolution
      ),

    requirements:
      normalizeEvolutionRequirements(
        evolution
      ),

    priority:
      evolution
        ?.priority ??
      null,

    resolved:
      true,
  }
}

function sumKnownEvolutionCost(
  steps,
  field
) {
  let total = 0
  let hasKnownValue = false

  for (
    const step
    of steps
  ) {
    const value =
      step
        ?.costs
        ?.[field]

    if (
      Number.isFinite(
        value
      )
    ) {
      total += value
      hasKnownValue = true
    }
  }

  return hasKnownValue
    ? total
    : null
}

function getEvolutionPathItems(
  steps
) {
  return steps
    .map(
      (step) =>
        step?.costs?.item ??
        null
    )
    .filter(
      Boolean
    )
}

function getEvolutionPathRequirements(
  steps
) {
  return steps.map(
    (step) => ({
      sourceIdentity:
        step.sourceIdentity,

      targetIdentity:
        step.targetIdentity,

      requirements:
        step.requirements,
    })
  )
}

function buildEvolutionPath(
  source,
  steps
) {
  const finalStep =
    steps[
      steps.length - 1
    ] ??
    null

  const target =
    finalStep?.target ??
    null

  return {
    source,

    sourceIdentity:
      getPokemonIdentity(
        source
      ),

    target,

    targetIdentity:
      finalStep
        ?.targetIdentity ??
      null,

    pokemonId:
      finalStep
        ?.pokemonId ??
      null,

    form:
      finalStep
        ?.form ??
      null,

    steps,

    stageCount:
      steps.length,

    costs: {
      candy:
        sumKnownEvolutionCost(
          steps,
          'candy'
        ),

      purifiedCandy:
        sumKnownEvolutionCost(
          steps,
          'purifiedCandy'
        ),

      items:
        getEvolutionPathItems(
          steps
        ),
    },

    requirements:
      getEvolutionPathRequirements(
        steps
      ),

    resolved:
      steps.length >
        0 &&
      steps.every(
        (step) =>
          step.resolved ===
          true
      ),
  }
}

function collectEvolutionPaths({
  root,
  current,
  steps,
  visited,
  results,
}) {
  const evolutions =
    current?.evolutions ??
    []

  for (
    const evolution
    of evolutions
  ) {
    const step =
      buildEvolutionStep(
        current,
        evolution
      )

    const nextSteps = [
      ...steps,
      step,
    ]

    results.push(
      buildEvolutionPath(
        root,
        nextSteps
      )
    )

    if (
      !step.target ||
      !step.targetIdentity ||
      visited.has(
        step.targetIdentity
      )
    ) {
      continue
    }

    const nextVisited =
      new Set(
        visited
      )

    nextVisited.add(
      step.targetIdentity
    )

    collectEvolutionPaths({
      root,
      current:
        step.target,
      steps:
        nextSteps,
      visited:
        nextVisited,
      results,
    })
  }
}

/**
 * Returns the direct permanent evolution branches for
 * a Pokémon.
 *
 * Each entry contains both the normalized Game Master
 * requirements/costs and the resolved target reference.
 */
export function getPokemonEvolutions(
  pokemon
) {
  if (!pokemon?.id) {
    return []
  }

  return (
    pokemon.evolutions ??
    []
  ).map(
    (evolution) =>
      buildEvolutionStep(
        pokemon,
        evolution
      )
  )
}

/**
 * Convenience helper for callers that only need the
 * directly reachable target reference records.
 *
 * Unresolved reference targets are omitted here. Use
 * getPokemonEvolutions() when unresolved branches must
 * remain visible for diagnostics.
 */
export function getPokemonEvolutionTargets(
  pokemon
) {
  return getPokemonEvolutions(
    pokemon
  )
    .map(
      (evolution) =>
        evolution.target
    )
    .filter(
      Boolean
    )
}

/**
 * Returns every permanent evolution destination
 * reachable through the normalized evolution graph.
 *
 * Example:
 *
 * Beldum produces:
 *
 * Beldum → Metang
 * Beldum → Metang → Metagross
 *
 * Costs are cumulative for each path.
 *
 * Special evolution requirements are preserved but are
 * not interpreted as currently satisfied/unsatisfied
 * at this reference layer.
 */
export function getPokemonEvolutionPaths(
  pokemon
) {
  if (!pokemon?.id) {
    return []
  }

  const sourceIdentity =
    getPokemonIdentity(
      pokemon
    )

  const visited =
    new Set()

  if (sourceIdentity) {
    visited.add(
      sourceIdentity
    )
  }

  const results = []

  collectEvolutionPaths({
    root:
      pokemon,

    current:
      pokemon,

    steps:
      [],

    visited,

    results,
  })

  return results
}

// --------------------------------------------------
// Form-change-derived move lookup
// --------------------------------------------------

export function getFormChangeFastMoveReassignments(
  pokemon
) {
  return (
    getIncomingFormChangeReassignments(
      pokemon,
      'fast'
    )
  )
}

export function getFormChangeChargedMoveReassignments(
  pokemon
) {
  return (
    getIncomingFormChangeReassignments(
      pokemon,
      'charged'
    )
  )
}

// --------------------------------------------------
// Move options
//
// Direct move pools and form-change-derived moves are
// deliberately kept conceptually separate.
//
// Derived form-change moves are exposed as SPECIAL so
// the Collection can represent a move that really can
// exist on the Pokémon without pretending it is
// obtainable through an ordinary TM.
//
// Frustration and Return are additionally dependent on
// the state of the owned Pokémon and are therefore
// supplied only when explicitly requested.
// --------------------------------------------------

export function getFastMoveOptions(
  pokemon
) {
  const derivedMoves =
    getIncomingFormChangeMoveIds(
      pokemon,
      'fast'
    )

  return buildMoveOptions(
    pokemon?.moves?.fast,
    derivedMoves
  )
}

export function getChargedMoveOptions(
  pokemon,
  {
    shadow = false,
    purified = false,
  } = {}
) {
  const derivedMoves =
    getIncomingFormChangeMoveIds(
      pokemon,
      'charged'
    )

  let options =
    buildMoveOptions(
      pokemon?.moves?.charged,
      derivedMoves
    )

  options =
    applyChargedMoveAvailabilityOverrides({
      pokemon,
      options,
    })

  options =
    removeStateDependentChargedMoves(
      options
    )

  options =
    addOwnedStateChargedMoves({
      options,
      shadow,
      purified,
    })

  return options
}

// --------------------------------------------------
// Move acquisition lookup
// --------------------------------------------------

export function getFastMoveAvailability(
  pokemon,
  moveId
) {
  return getMoveAvailability(
    getFastMoveOptions(
      pokemon
    ),
    moveId
  )
}

export function getChargedMoveAvailability(
  pokemon,
  moveId,
  ownedState = {}
) {
  if (!moveId) {
    return null
  }

  /**
   * These moves are always SPECIAL acquisition/state
   * moves when already owned. Returning SPECIAL here
   * allows preservation logic to recognize them even
   * when a generic raid-state query does not expose
   * them as teachable options.
   */
  if (
    moveId ===
      SHADOW_CHARGED_MOVE ||
    moveId ===
      PURIFIED_CHARGED_MOVE
  ) {
    return 'SPECIAL'
  }

  return getMoveAvailability(
    getChargedMoveOptions(
      pokemon,
      ownedState
    ),
    moveId
  )
}

// --------------------------------------------------
// Display helpers
// --------------------------------------------------

export function formatMoveName(
  moveId
) {
  if (!moveId) {
    return ''
  }

  const withoutFastSuffix =
    moveId.endsWith(
      '_FAST'
    )
      ? moveId.slice(
          0,
          -5
        )
      : moveId

  return formatToken(
    withoutFastSuffix
  )
}