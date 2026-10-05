/**
 * PokeIQ Raid Engine
 * ------------------
 * Raid Candidate Builder V1
 *
 * Converts Pokémon reference records into standardized
 * attacker candidates for raid comparison.
 *
 * Responsibilities:
 *
 * - validate ordinary raid-attacker records
 * - resolve form-change-derived moves
 * - collapse combat-equivalent permanent forms
 * - preserve collectible identity outside the raid layer
 * - generate temporary-evolution combat candidates
 * - preserve temporary-evolution requirements
 * - generate released Shadow combat candidates
 * - preserve Shadow state as combat metadata
 *
 * Raw reference data is never mutated.
 *
 * Candidate types:
 *
 * PERMANENT
 * TEMPORARY_EVOLUTION
 * SHADOW
 *
 * Examples:
 *
 * KYUREM [NORMAL]
 *   GLACIATE -> ICE_BURN
 *   when fused into KYUREM_WHITE
 *
 * RAYQUAZA [NORMAL]
 *   -> TEMP_EVOLUTION_MEGA
 *
 * MAMOSWINE [NORMAL]
 *   -> MAMOSWINE__SHADOW
 *
 * Temporary evolutions inherit the source Pokémon's
 * legal move pool while using temporary-evolution
 * combat stats and typing.
 *
 * Shadow candidates inherit their permanent source
 * Pokémon's combat data and move pool while carrying
 * the Shadow Attack modifier separately.
 *
 * Shadow is intentionally NOT represented as a form.
 */

// --------------------------------------------------
// Constants
// --------------------------------------------------

export const DEFAULT_RAID_ATTACKER_IVS = {
  attack: 15,
  defense: 15,
  stamina: 15,
}

export const RAID_CANDIDATE_TYPE = {
  PERMANENT:
    'PERMANENT',

  TEMPORARY_EVOLUTION:
    'TEMPORARY_EVOLUTION',

  SHADOW:
    'SHADOW',
}

// --------------------------------------------------
// Basic helpers
// --------------------------------------------------

function hasArrayValues(
  value
) {
  return (
    Array.isArray(
      value
    ) &&
    value.length >
      0
  )
}

function hasMovePool(
  pokemon
) {
  const fast =
    pokemon?.moves?.fast

  const charged =
    pokemon
      ?.moves
      ?.charged

  if (
    !fast ||
    !charged
  ) {
    return false
  }

  const hasFastMove =
    hasArrayValues(
      fast.normal
    ) ||
    hasArrayValues(
      fast.elite
    ) ||
    hasArrayValues(
      fast.special
    )

  const hasChargedMove =
    hasArrayValues(
      charged.normal
    ) ||
    hasArrayValues(
      charged.elite
    ) ||
    hasArrayValues(
      charged.special
    )

  return (
    hasFastMove &&
    hasChargedMove
  )
}

function hasValidStats(
  pokemon
) {
  const stats =
    pokemon?.stats

  if (!stats) {
    return false
  }

  return (
    Number.isFinite(
      stats.attack
    ) &&
    stats.attack >
      0 &&
    Number.isFinite(
      stats.defense
    ) &&
    stats.defense >
      0 &&
    Number.isFinite(
      stats.stamina
    ) &&
    stats.stamina >
      0
  )
}

function hasValidTypes(
  pokemon
) {
  return (
    Array.isArray(
      pokemon?.types
    ) &&
    pokemon.types.length >
      0
  )
}

function unique(
  values = []
) {
  return [
    ...new Set(
      values.filter(
        Boolean
      )
    ),
  ]
}

function cloneMoveCategory(
  category
) {
  return {
    normal: [
      ...(
        category
          ?.normal ??
        []
      ),
    ],

    elite: [
      ...(
        category
          ?.elite ??
        []
      ),
    ],

    special: [
      ...(
        category
          ?.special ??
        []
      ),
    ],
  }
}

function cloneMoves(
  moves
) {
  return {
    fast:
      cloneMoveCategory(
        moves?.fast
      ),

    charged:
      cloneMoveCategory(
        moves?.charged
      ),
  }
}

function cloneStats(
  stats
) {
  return {
    attack:
      stats?.attack ??
      null,

    defense:
      stats?.defense ??
      null,

    stamina:
      stats?.stamina ??
      null,
  }
}

function normalizeTypes({
  overrideTypes,
  fallbackTypes,
}) {
  const validOverrides =
    (
      overrideTypes ??
      []
    ).filter(
      Boolean
    )

  if (
    validOverrides.length >
    0
  ) {
    return [
      ...validOverrides,
    ]
  }

  return [
    ...(
      fallbackTypes ??
      []
    ),
  ]
}

function requirePositiveNumber(
  value,
  label
) {
  if (
    !Number.isFinite(
      value
    ) ||
    value <=
      0
  ) {
    throw new Error(
      `${label} must be greater than 0.`
    )
  }

  return value
}

// --------------------------------------------------
// Eligibility
// --------------------------------------------------

export function inspectRaidCandidate(
  pokemon
) {
  const reasons = []

  if (!pokemon) {
    return {
      eligible:
        false,

      reasons: [
        'MISSING_POKEMON',
      ],
    }
  }

  if (!pokemon.id) {
    reasons.push(
      'MISSING_ID'
    )
  }

  if (
    !hasValidStats(
      pokemon
    )
  ) {
    reasons.push(
      'INVALID_STATS'
    )
  }

  if (
    !hasValidTypes(
      pokemon
    )
  ) {
    reasons.push(
      'INVALID_TYPES'
    )
  }

  if (
    !hasMovePool(
      pokemon
    )
  ) {
    reasons.push(
      'NO_USABLE_MOVESET'
    )
  }

  return {
    eligible:
      reasons.length ===
      0,

    reasons,
  }
}

export function isRaidCandidate(
  pokemon
) {
  return inspectRaidCandidate(
    pokemon
  ).eligible
}

// --------------------------------------------------
// Form-change helpers
// --------------------------------------------------

function normalizeTargetForm(
  form
) {
  if (
    !form ||
    form ===
      'NORMAL'
  ) {
    return 'NORMAL'
  }

  return form
}

function formChangeTargetsPokemon({
  sourcePokemon,
  targetPokemon,
  formChange,
}) {
  if (
    !sourcePokemon ||
    !targetPokemon ||
    !formChange
  ) {
    return false
  }

  if (
    sourcePokemon.id !==
    targetPokemon.id
  ) {
    return false
  }

  const targetForm =
    normalizeTargetForm(
      targetPokemon.form
    )

  return (
    formChange
      .targetForms ??
    []
  ).includes(
    targetForm
  )
}

export function findIncomingFormChanges({
  pokemon,
  targetPokemon,
}) {
  if (
    !Array.isArray(
      pokemon
    )
  ) {
    throw new Error(
      'pokemon must be an array.'
    )
  }

  if (!targetPokemon) {
    throw new Error(
      'targetPokemon is required.'
    )
  }

  const matches = []

  for (
    const sourcePokemon
    of pokemon
  ) {
    for (
      const formChange
      of sourcePokemon
        ?.formChanges ??
      []
    ) {
      if (
        !formChangeTargetsPokemon({
          sourcePokemon,
          targetPokemon,
          formChange,
        })
      ) {
        continue
      }

      matches.push({
        sourcePokemon,
        formChange,
      })
    }
  }

  return matches
}

// --------------------------------------------------
// Form-change move derivation
// --------------------------------------------------

function collectMoveReassignments({
  incomingFormChanges,
  moveType,
}) {
  const reassignments = []

  for (
    const {
      sourcePokemon,
      formChange,
    }
    of incomingFormChanges
  ) {
    const assignments =
      formChange
        ?.moveReassignments
        ?.[moveType] ??
      []

    for (
      const assignment
      of assignments
    ) {
      if (
        !assignment?.from ||
        !assignment?.to
      ) {
        continue
      }

      reassignments.push({
        from:
          assignment.from,

        to:
          assignment.to,

        sourcePokemonId:
          sourcePokemon.id,

        sourceForm:
          sourcePokemon.form,

        formChangeType:
          formChange.type,

        componentPokemonId:
          formChange
            .componentPokemonId ??
          null,
      })
    }
  }

  return reassignments
}

export function resolveRaidCandidatePokemon({
  pokemon,
  allPokemon,
}) {
  if (!pokemon) {
    throw new Error(
      'pokemon is required.'
    )
  }

  if (
    !Array.isArray(
      allPokemon
    )
  ) {
    throw new Error(
      'allPokemon must be an array.'
    )
  }

  const moves =
    cloneMoves(
      pokemon.moves
    )

  const incomingFormChanges =
    findIncomingFormChanges({
      pokemon:
        allPokemon,

      targetPokemon:
        pokemon,
    })

  const fastReassignments =
    collectMoveReassignments({
      incomingFormChanges,

      moveType:
        'fast',
    })

  const chargedReassignments =
    collectMoveReassignments({
      incomingFormChanges,

      moveType:
        'charged',
    })

  moves.fast.special =
    unique([
      ...moves
        .fast
        .special,

      ...fastReassignments.map(
        (entry) =>
          entry.to
      ),
    ])

  moves.charged.special =
    unique([
      ...moves
        .charged
        .special,

      ...chargedReassignments.map(
        (entry) =>
          entry.to
      ),
    ])

  return {
    ...pokemon,

    moves,

    raidCandidateMetadata: {
      candidateType:
        RAID_CANDIDATE_TYPE
          .PERMANENT,

      derivedMoves: {
        fast:
          fastReassignments,

        charged:
          chargedReassignments,
      },
    },
  }
}

// --------------------------------------------------
// Combat identity
// --------------------------------------------------

function sorted(
  values = []
) {
  return [
    ...values,
  ].sort()
}

export function buildCombatSignature(
  pokemon
) {
  return JSON.stringify({
    types:
      sorted(
        pokemon.types
      ),

    stats: {
      attack:
        pokemon
          .stats
          .attack,

      defense:
        pokemon
          .stats
          .defense,

      stamina:
        pokemon
          .stats
          .stamina,
    },

    moves: {
      fast: {
        normal:
          sorted(
            pokemon
              .moves
              .fast
              .normal
          ),

        elite:
          sorted(
            pokemon
              .moves
              .fast
              .elite
          ),

        special:
          sorted(
            pokemon
              .moves
              .fast
              .special
          ),
      },

      charged: {
        normal:
          sorted(
            pokemon
              .moves
              .charged
              .normal
          ),

        elite:
          sorted(
            pokemon
              .moves
              .charged
              .elite
          ),

        special:
          sorted(
            pokemon
              .moves
              .charged
              .special
          ),
      },
    },
  })
}

// --------------------------------------------------
// Canonical representative selection
// --------------------------------------------------

function candidatePreferenceScore(
  pokemon
) {
  let score = 0

  if (
    pokemon.form ===
    'NORMAL'
  ) {
    score += 1000
  }

  if (pokemon.form) {
    score -=
      pokemon.form.length
  }

  return score
}

function chooseCombatRepresentative(
  records
) {
  return [
    ...records,
  ].sort(
    (a, b) =>
      candidatePreferenceScore(
        b
      ) -
      candidatePreferenceScore(
        a
      )
  )[0]
}

// --------------------------------------------------
// Combat deduplication
// --------------------------------------------------

export function deduplicateCombatCandidates(
  pokemon
) {
  if (
    !Array.isArray(
      pokemon
    )
  ) {
    throw new Error(
      'pokemon must be an array.'
    )
  }

  const groups =
    new Map()

  for (
    const entry
    of pokemon
  ) {
    const key =
      `${entry.id}|` +
      `${buildCombatSignature(entry)}`

    if (
      !groups.has(
        key
      )
    ) {
      groups.set(
        key,
        []
      )
    }

    groups
      .get(
        key
      )
      .push(
        entry
      )
  }

  const kept = []
  const collapsed = []

  for (
    const records
    of groups.values()
  ) {
    const representative =
      chooseCombatRepresentative(
        records
      )

    kept.push(
      representative
    )

    for (
      const record
      of records
    ) {
      if (
        record ===
        representative
      ) {
        continue
      }

      collapsed.push({
        id:
          record.id,

        form:
          record.form,

        representativeId:
          representative.id,

        representativeForm:
          representative.form,

        reason:
          'COMBAT_EQUIVALENT',
      })
    }
  }

  return {
    kept,
    collapsed,
  }
}

// --------------------------------------------------
// Permanent candidate IDs / labels
// --------------------------------------------------

export function buildCandidateId(
  pokemon
) {
  if (!pokemon?.id) {
    throw new Error(
      'pokemon.id is required.'
    )
  }

  if (
    !pokemon.form ||
    pokemon.form ===
      'NORMAL'
  ) {
    return pokemon.id
  }

  return (
    `${pokemon.id}` +
    `__${pokemon.form}`
  )
}

export function buildCandidateLabel(
  pokemon
) {
  if (!pokemon?.id) {
    return 'Unknown Pokémon'
  }

  if (
    !pokemon.form ||
    pokemon.form ===
      'NORMAL'
  ) {
    return pokemon.id
  }

  return (
    `${pokemon.id}` +
    ` (${pokemon.form})`
  )
}

// --------------------------------------------------
// Temporary-evolution helpers
// --------------------------------------------------

function hasTemporaryEvolutionId(
  temporaryEvolution
) {
  return Boolean(
    temporaryEvolution?.id
  )
}

function buildTemporaryEvolutionId({
  pokemon,
  temporaryEvolution,
}) {
  return (
    `${buildCandidateId(pokemon)}` +
    `__${temporaryEvolution.id}`
  )
}

function normalizeTemporaryEvolutionName(
  temporaryEvolutionId
) {
  if (!temporaryEvolutionId) {
    return 'TEMPORARY'
  }

  return String(
    temporaryEvolutionId
  )
    .replace(
      /^TEMP_EVOLUTION_/,
      ''
    )
    .replace(
      /_/g,
      ' '
    )
}

function buildTemporaryEvolutionLabel({
  pokemon,
  temporaryEvolution,
}) {
  const temporaryName =
    normalizeTemporaryEvolutionName(
      temporaryEvolution.id
    )

  if (
    !pokemon.form ||
    pokemon.form ===
      'NORMAL'
  ) {
    return (
      `${pokemon.id}` +
      ` (${temporaryName})`
    )
  }

  return (
    `${pokemon.id}` +
    ` (${pokemon.form}` +
    ` / ${temporaryName})`
  )
}

// --------------------------------------------------
// Temporary-evolution Pokémon
// --------------------------------------------------

export function resolveTemporaryEvolutionPokemon({
  pokemon,
  temporaryEvolution,
}) {
  if (!pokemon) {
    throw new Error(
      'pokemon is required.'
    )
  }

  if (!temporaryEvolution) {
    throw new Error(
      'temporaryEvolution is required.'
    )
  }

  if (
    !hasTemporaryEvolutionId(
      temporaryEvolution
    )
  ) {
    throw new Error(
      'temporaryEvolution.id is required.'
    )
  }

  const stats = {
    attack:
      temporaryEvolution
        .stats
        ?.attack ??
      pokemon
        .stats
        ?.attack ??
      null,

    defense:
      temporaryEvolution
        .stats
        ?.defense ??
      pokemon
        .stats
        ?.defense ??
      null,

    stamina:
      temporaryEvolution
        .stats
        ?.stamina ??
      pokemon
        .stats
        ?.stamina ??
      null,
  }

  const types =
    normalizeTypes({
      overrideTypes:
        temporaryEvolution
          .types,

      fallbackTypes:
        pokemon.types,
    })

  return {
    ...pokemon,

    stats:
      cloneStats(
        stats
      ),

    types,

    moves:
      cloneMoves(
        pokemon.moves
      ),

    raidCandidateMetadata: {
      candidateType:
        RAID_CANDIDATE_TYPE
          .TEMPORARY_EVOLUTION,

      temporaryEvolution: {
        id:
          temporaryEvolution.id,

        sourcePokemonId:
          pokemon.id,

        sourceForm:
          pokemon.form,

        requirements: {
          move:
            temporaryEvolution
              .requirements
              ?.move ??
            null,

          initialEnergy:
            temporaryEvolution
              .requirements
              ?.initialEnergy ??
            null,

          subsequentEnergy:
            temporaryEvolution
              .requirements
              ?.subsequentEnergy ??
            null,
        },
      },

      derivedMoves: {
        fast: [
          ...(
            pokemon
              .raidCandidateMetadata
              ?.derivedMoves
              ?.fast ??
            []
          ),
        ],

        charged: [
          ...(
            pokemon
              .raidCandidateMetadata
              ?.derivedMoves
              ?.charged ??
            []
          ),
        ],
      },
    },
  }
}

export function buildTemporaryEvolutionRecords(
  pokemon
) {
  if (
    !Array.isArray(
      pokemon
    )
  ) {
    throw new Error(
      'pokemon must be an array.'
    )
  }

  const records = []
  const rejected = []

  for (
    const sourcePokemon
    of pokemon
  ) {
    const temporaryEvolutions =
      sourcePokemon
        ?.temporaryEvolutions ??
      []

    for (
      const temporaryEvolution
      of temporaryEvolutions
    ) {
      if (
        !hasTemporaryEvolutionId(
          temporaryEvolution
        )
      ) {
        rejected.push({
          id:
            sourcePokemon
              ?.id ??
            null,

          form:
            sourcePokemon
              ?.form ??
            null,

          temporaryEvolutionId:
            temporaryEvolution
              ?.id ??
            null,

          reasons: [
            'MISSING_TEMPORARY_EVOLUTION_ID',
          ],
        })

        continue
      }

      const resolved =
        resolveTemporaryEvolutionPokemon({
          pokemon:
            sourcePokemon,

          temporaryEvolution,
        })

      const inspection =
        inspectRaidCandidate(
          resolved
        )

      if (
        !inspection.eligible
      ) {
        rejected.push({
          id:
            sourcePokemon.id,

          form:
            sourcePokemon.form,

          temporaryEvolutionId:
            temporaryEvolution.id,

          reasons:
            inspection.reasons,
        })

        continue
      }

      records.push({
        pokemon:
          resolved,

        sourcePokemon,

        temporaryEvolution,
      })
    }
  }

  return {
    records,
    rejected,
  }
}

// --------------------------------------------------
// Shadow helpers
// --------------------------------------------------

export function buildShadowCandidateId(
  pokemon
) {
  return (
    `${buildCandidateId(
      pokemon
    )}` +
    '__SHADOW'
  )
}

export function buildShadowCandidateLabel(
  pokemon
) {
  if (!pokemon?.id) {
    return 'Unknown Pokémon (SHADOW)'
  }

  if (
    !pokemon.form ||
    pokemon.form ===
      'NORMAL'
  ) {
    return (
      `${pokemon.id}` +
      ' (SHADOW)'
    )
  }

  return (
    `${pokemon.id}` +
    ` (${pokemon.form}` +
    ' / SHADOW)'
  )
}

/**
 * Creates a raid-ready Shadow copy from an already
 * resolved permanent Pokémon.
 *
 * Shadow does not change:
 *
 * - base stats
 * - typing
 * - CPM
 * - IVs
 * - ordinary legal move pool
 *
 * Its combat effect is represented separately through
 * candidate.attackerModifiers.
 *
 * The source Pokémon is never mutated.
 */
export function resolveShadowPokemon(
  pokemon
) {
  if (!pokemon) {
    throw new Error(
      'pokemon is required.'
    )
  }

  const inspection =
    inspectRaidCandidate(
      pokemon
    )

  if (
    !inspection.eligible
  ) {
    throw new Error(
      `Cannot create Shadow Pokémon from invalid raid candidate: ` +
      `${pokemon.id ?? 'UNKNOWN'} ` +
      `[${inspection.reasons.join(', ')}]`
    )
  }

  return {
    ...pokemon,

    stats:
      cloneStats(
        pokemon.stats
      ),

    types: [
      ...(
        pokemon.types ??
        []
      ),
    ],

    moves:
      cloneMoves(
        pokemon.moves
      ),

    raidCandidateMetadata: {
      candidateType:
        RAID_CANDIDATE_TYPE
          .SHADOW,

      shadow: {
        sourcePokemonId:
          pokemon.id,

        sourceForm:
          pokemon.form ??
          'NORMAL',

        sourceCandidateId:
          buildCandidateId(
            pokemon
          ),
      },

      derivedMoves: {
        fast: [
          ...(
            pokemon
              .raidCandidateMetadata
              ?.derivedMoves
              ?.fast ??
            []
          ),
        ],

        charged: [
          ...(
            pokemon
              .raidCandidateMetadata
              ?.derivedMoves
              ?.charged ??
            []
          ),
        ],
      },
    },
  }
}

/**
 * Builds released Shadow records from the already
 * deduplicated permanent combat universe.
 *
 * shadowCandidateIds must contain exact candidate IDs
 * such as:
 *
 * MAMOSWINE__SHADOW
 * MEWTWO__SHADOW
 * SNEASEL__SNEASEL_HISUIAN__SHADOW
 *
 * Unknown IDs are reported separately instead of
 * causing the full candidate universe to crash.
 */
export function buildShadowRecords({
  pokemon,
  shadowCandidateIds = [],
}) {
  if (
    !Array.isArray(
      pokemon
    )
  ) {
    throw new Error(
      'pokemon must be an array.'
    )
  }

  if (
    !Array.isArray(
      shadowCandidateIds
    )
  ) {
    throw new Error(
      'shadowCandidateIds must be an array.'
    )
  }

  const requestedIds =
    new Set(
      shadowCandidateIds
        .filter(
          Boolean
        )
    )

  const records = []

  const matchedIds =
    new Set()

  for (
    const sourcePokemon
    of pokemon
  ) {
    const shadowCandidateId =
      buildShadowCandidateId(
        sourcePokemon
      )

    if (
      !requestedIds.has(
        shadowCandidateId
      )
    ) {
      continue
    }

    matchedIds.add(
      shadowCandidateId
    )

    records.push({
      pokemon:
        resolveShadowPokemon(
          sourcePokemon
        ),

      sourcePokemon,

      shadowCandidateId,
    })
  }

  const unmatchedIds =
    [
      ...requestedIds,
    ].filter(
      (id) =>
        !matchedIds.has(
          id
        )
    )

  return {
    records,

    unmatchedIds,
  }
}

// --------------------------------------------------
// Candidate creation
// --------------------------------------------------

export function createRaidCandidate({
  pokemon,
  cpMultiplier,
  id,
  label,

  ivs =
    DEFAULT_RAID_ATTACKER_IVS,

  attackerModifiers = [],
}) {
  if (!pokemon) {
    throw new Error(
      'pokemon is required.'
    )
  }

  requirePositiveNumber(
    cpMultiplier,
    'cpMultiplier'
  )

  if (
    !Array.isArray(
      attackerModifiers
    )
  ) {
    throw new Error(
      'attackerModifiers must be an array.'
    )
  }

  for (
    const modifier
    of attackerModifiers
  ) {
    requirePositiveNumber(
      modifier,
      'attackerModifier'
    )
  }

  const inspection =
    inspectRaidCandidate(
      pokemon
    )

  if (
    !inspection.eligible
  ) {
    throw new Error(
      `Pokémon is not a valid raid attacker: ` +
      `${pokemon.id ?? 'UNKNOWN'} ` +
      `[${inspection.reasons.join(', ')}]`
    )
  }

  const resolvedPokemon = {
    ...pokemon,

    ivs: {
      attack:
        ivs.attack,

      defense:
        ivs.defense,

      stamina:
        ivs.stamina,
    },
  }

  return {
    id:
      id ??
      buildCandidateId(
        pokemon
      ),

    label:
      label ??
      buildCandidateLabel(
        pokemon
      ),

    pokemon:
      resolvedPokemon,

    cpMultiplier,

    attackerModifiers: [
      ...attackerModifiers,
    ],
  }
}

// --------------------------------------------------
// Temporary candidate creation
// --------------------------------------------------

export function createTemporaryEvolutionRaidCandidate({
  sourcePokemon,
  temporaryEvolution,
  pokemon,
  cpMultiplier,

  ivs =
    DEFAULT_RAID_ATTACKER_IVS,

  attackerModifiers = [],
}) {
  if (!sourcePokemon) {
    throw new Error(
      'sourcePokemon is required.'
    )
  }

  if (!temporaryEvolution) {
    throw new Error(
      'temporaryEvolution is required.'
    )
  }

  if (!pokemon) {
    throw new Error(
      'pokemon is required.'
    )
  }

  return createRaidCandidate({
    pokemon,

    cpMultiplier,

    id:
      buildTemporaryEvolutionId({
        pokemon:
          sourcePokemon,

        temporaryEvolution,
      }),

    label:
      buildTemporaryEvolutionLabel({
        pokemon:
          sourcePokemon,

        temporaryEvolution,
      }),

    ivs,

    attackerModifiers,
  })
}

// --------------------------------------------------
// Shadow candidate creation
// --------------------------------------------------

export function createShadowRaidCandidate({
  sourcePokemon,
  pokemon,
  cpMultiplier,
  shadowAttackMultiplier,

  ivs =
    DEFAULT_RAID_ATTACKER_IVS,
}) {
  if (!sourcePokemon) {
    throw new Error(
      'sourcePokemon is required.'
    )
  }

  if (!pokemon) {
    throw new Error(
      'pokemon is required.'
    )
  }

  requirePositiveNumber(
    shadowAttackMultiplier,
    'shadowAttackMultiplier'
  )

  return createRaidCandidate({
    pokemon,

    cpMultiplier,

    id:
      buildShadowCandidateId(
        sourcePokemon
      ),

    label:
      buildShadowCandidateLabel(
        sourcePokemon
      ),

    ivs,

    attackerModifiers: [
      shadowAttackMultiplier,
    ],
  })
}

// --------------------------------------------------
// Bulk candidate generation
// --------------------------------------------------

export function buildRaidCandidates({
  pokemon,
  cpMultiplier,

  /**
   * Optional Shadow candidate IDs supplied by the
   * availability layer.
   *
   * If omitted, no Shadow candidates are generated.
   *
   * This is intentional: candidate generation does not
   * independently decide Shadow release availability.
   */
  shadowCandidateIds = [],

  /**
   * Current Shadow Attack modifier from combat.json.
   *
   * Required only when at least one Shadow candidate is
   * requested.
   */
  shadowAttackMultiplier = null,
}) {
  if (
    !Array.isArray(
      pokemon
    )
  ) {
    throw new Error(
      'pokemon must be an array.'
    )
  }

  requirePositiveNumber(
    cpMultiplier,
    'cpMultiplier'
  )

  if (
    !Array.isArray(
      shadowCandidateIds
    )
  ) {
    throw new Error(
      'shadowCandidateIds must be an array.'
    )
  }

  if (
    shadowCandidateIds.length >
      0
  ) {
    requirePositiveNumber(
      shadowAttackMultiplier,
      'shadowAttackMultiplier'
    )
  }

  // ------------------------------------------------
  // Resolve permanent-form mechanics
  // ------------------------------------------------

  const resolvedRecords =
    pokemon.map(
      (entry) =>
        resolveRaidCandidatePokemon({
          pokemon:
            entry,

          allPokemon:
            pokemon,
        })
    )

  const eligiblePermanentRecords = []

  const rejected = []

  for (
    const entry
    of resolvedRecords
  ) {
    const inspection =
      inspectRaidCandidate(
        entry
      )

    if (
      !inspection.eligible
    ) {
      rejected.push({
        id:
          entry?.id ??
          null,

        form:
          entry?.form ??
          null,

        candidateType:
          RAID_CANDIDATE_TYPE
            .PERMANENT,

        reasons:
          inspection.reasons,
      })

      continue
    }

    eligiblePermanentRecords.push(
      entry
    )
  }

  // ------------------------------------------------
  // Collapse combat-equivalent permanent records
  // ------------------------------------------------

  const {
    kept:
      keptPermanentRecords,

    collapsed,
  } =
    deduplicateCombatCandidates(
      eligiblePermanentRecords
    )

  // ------------------------------------------------
  // Permanent candidates
  // ------------------------------------------------

  const permanentCandidates =
    keptPermanentRecords.map(
      (entry) =>
        createRaidCandidate({
          pokemon:
            entry,

          cpMultiplier,
        })
    )

  // ------------------------------------------------
  // Temporary evolutions
  // ------------------------------------------------

  const {
    records:
      temporaryEvolutionRecords,

    rejected:
      rejectedTemporaryEvolutions,
  } =
    buildTemporaryEvolutionRecords(
      keptPermanentRecords
    )

  for (
    const entry
    of rejectedTemporaryEvolutions
  ) {
    rejected.push({
      ...entry,

      candidateType:
        RAID_CANDIDATE_TYPE
          .TEMPORARY_EVOLUTION,
    })
  }

  const temporaryEvolutionCandidates =
    temporaryEvolutionRecords.map(
      ({
        pokemon:
          temporaryPokemon,

        sourcePokemon,

        temporaryEvolution,
      }) =>
        createTemporaryEvolutionRaidCandidate({
          sourcePokemon,

          temporaryEvolution,

          pokemon:
            temporaryPokemon,

          cpMultiplier,
        })
    )

  // ------------------------------------------------
  // Shadows
  // ------------------------------------------------

  /**
   * Shadows are generated ONLY from kept permanent
   * combat representatives.
   *
   * This has several useful consequences:
   *
   * - costume aliases do not create duplicate Shadows
   * - Shadows never generate from temporary evolutions
   * - a Shadow Mega/Primal cannot accidentally exist
   * - permanent form mechanics are already resolved
   */
  const {
    records:
      shadowRecords,

    unmatchedIds:
      unmatchedShadowCandidateIds,
  } =
    buildShadowRecords({
      pokemon:
        keptPermanentRecords,

      shadowCandidateIds,
    })

  const shadowCandidates =
    shadowRecords.map(
      ({
        pokemon:
          shadowPokemon,

        sourcePokemon,
      }) =>
        createShadowRaidCandidate({
          sourcePokemon,

          pokemon:
            shadowPokemon,

          cpMultiplier,

          shadowAttackMultiplier,
        })
    )

  // ------------------------------------------------
  // Final universe
  // ------------------------------------------------

  const candidates = [
    ...permanentCandidates,

    ...temporaryEvolutionCandidates,

    ...shadowCandidates,
  ]

  return {
    candidates,

    permanentCandidates,

    temporaryEvolutionCandidates,

    shadowCandidates,

    rejected,

    collapsed,

    unmatchedShadowCandidateIds,

    metadata: {
      permanentCandidateCount:
        permanentCandidates.length,

      temporaryEvolutionCandidateCount:
        temporaryEvolutionCandidates.length,

      shadowCandidateCount:
        shadowCandidates.length,

      unmatchedShadowCandidateIdCount:
        unmatchedShadowCandidateIds.length,

      totalCandidateCount:
        candidates.length,
    },
  }
}