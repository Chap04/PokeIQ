import fs from 'node:fs/promises'
import path from 'node:path'
import {
  fileURLToPath,
} from 'node:url'

// --------------------------------------------------
// Sources
// --------------------------------------------------

const GAME_MASTER_URL =
  'https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json'

const TIMESTAMP_URL =
  'https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/timestamp.txt'

// --------------------------------------------------
// Paths
// --------------------------------------------------

const __filename =
  fileURLToPath(
    import.meta.url
  )

const __dirname =
  path.dirname(
    __filename
  )

const OUTPUT_DIR =
  path.resolve(
    __dirname,
    '../src/data/reference'
  )

// --------------------------------------------------
// Type order
// --------------------------------------------------

const TYPE_ORDER = [
  'NORMAL',
  'FIGHTING',
  'FLYING',
  'POISON',
  'GROUND',
  'ROCK',
  'BUG',
  'GHOST',
  'STEEL',
  'FIRE',
  'WATER',
  'GRASS',
  'ELECTRIC',
  'PSYCHIC',
  'ICE',
  'DRAGON',
  'DARK',
  'FAIRY',
]

// --------------------------------------------------
// Player-facing form suppressions
// --------------------------------------------------

/**
 * PokeIQ deliberately suppresses a very small set of
 * redundant Game Master Pokémon identities.
 *
 * These are NOT inferred automatically.
 *
 * Every entry here should represent a duplicate Game
 * Master identity that has been manually verified.
 *
 * Examples:
 *
 * Tornadus has:
 *
 *   NORMAL
 *   TORNADUS_INCARNATE
 *   TORNADUS_THERIAN
 *
 * The generic NORMAL record duplicates Incarnate, so
 * PokeIQ suppresses NORMAL.
 *
 * Ho-Oh has:
 *
 *   NORMAL
 *   HO_OH_S
 *
 * HO_OH_S is not intended to be a separate Collection
 * form, so PokeIQ suppresses HO_OH_S and preserves the
 * normal Ho-Oh record.
 */

const PLAYER_FACING_FORM_SUPPRESSIONS = [
  {
    pokemonId:
      'TORNADUS',

    form:
      'NORMAL',

    reason:
      'REDUNDANT_GENERIC_INCARNATE_FORM',
  },

  {
    pokemonId:
      'THUNDURUS',

    form:
      'NORMAL',

    reason:
      'REDUNDANT_GENERIC_INCARNATE_FORM',
  },

  {
    pokemonId:
      'LANDORUS',

    form:
      'NORMAL',

    reason:
      'REDUNDANT_GENERIC_INCARNATE_FORM',
  },

  {
    pokemonId:
      'ENAMORUS',

    form:
      'NORMAL',

    reason:
      'REDUNDANT_GENERIC_INCARNATE_FORM',
  },

  {
    pokemonId:
      'RAIKOU',

    form:
      'RAIKOU_S',

    reason:
      'REDUNDANT_SPECIAL_GAME_MASTER_FORM',
  },

  {
    pokemonId:
      'ENTEI',

    form:
      'ENTEI_S',

    reason:
      'REDUNDANT_SPECIAL_GAME_MASTER_FORM',
  },

  {
    pokemonId:
      'SUICUNE',

    form:
      'SUICUNE_S',

    reason:
      'REDUNDANT_SPECIAL_GAME_MASTER_FORM',
  },

  {
    pokemonId:
      'LUGIA',

    form:
      'LUGIA_S',

    reason:
      'REDUNDANT_SPECIAL_GAME_MASTER_FORM',
  },

  {
    pokemonId:
      'HO_OH',

    form:
      'HO_OH_S',

    reason:
      'REDUNDANT_SPECIAL_GAME_MASTER_FORM',
  },

  {
    pokemonId:
      'LATIAS',

    form:
      'LATIAS_S',

    reason:
      'REDUNDANT_SPECIAL_GAME_MASTER_FORM',
  },

  {
    pokemonId:
      'LATIOS',

    form:
      'LATIOS_S',

    reason:
      'REDUNDANT_SPECIAL_GAME_MASTER_FORM',
  },
]

// --------------------------------------------------
// General helpers
// --------------------------------------------------

function unwrapTemplate(
  template
) {
  return (
    template?.data ??
    template
  )
}

function cleanType(
  type
) {
  if (!type) {
    return null
  }

  return type.replace(
    'POKEMON_TYPE_',
    ''
  )
}

function normalizeMoveId(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null
  }

  return String(
    value
  )
}

function extractMoveDisplayId(
  templateId,
  moveId
) {
  if (!templateId) {
    return moveId
  }

  const match =
    String(
      templateId
    ).match(
      /^V\d+_MOVE_(.+)$/
    )

  if (!match) {
    return moveId
  }

  return (
    match[1] ??
    moveId
  )
}

function unique(
  values = []
) {
  return [
    ...new Set(
      values
        .map(
          normalizeMoveId
        )
        .filter(
          Boolean
        )
    ),
  ]
}

function normalizeForm(
  pokemonId,
  form
) {
  if (!form) {
    return 'NORMAL'
  }

  if (
    form ===
    `${pokemonId}_NORMAL`
  ) {
    return 'NORMAL'
  }

  return form
}

// --------------------------------------------------
// Move normalization
// --------------------------------------------------

function normalizeMove(
  move,
  templateId
) {
  const id =
    normalizeMoveId(
      move.movementId ??
      move.uniqueId
    )

  return {
    id,

    displayId:
      extractMoveDisplayId(
        templateId,
        id
      ),

    type:
      cleanType(
        move.pokemonType
      ),

    power:
      move.power ??
      null,

    energyDelta:
      move.energyDelta ??
      null,

    durationMs:
      move.durationMs ??
      null,

    damageWindowStartMs:
      move.damageWindowStartMs ??
      null,

    damageWindowEndMs:
      move.damageWindowEndMs ??
      null,
  }
}

// --------------------------------------------------
// Move pools
// --------------------------------------------------

function extractMovePools(
  settings
) {
  return {
    fast: {
      normal:
        unique(
          settings.quickMoves ??
          []
        ),

      elite:
        unique(
          settings.eliteQuickMove ??
          []
        ),

      special:
        unique([
          ...(
            settings.nonTmQuickMoves ??
            []
          ),

          ...(
            settings.nonTmQuickMove ??
            []
          ),
        ]),
    },

    charged: {
      normal:
        unique(
          settings.cinematicMoves ??
          []
        ),

      elite:
        unique(
          settings.eliteCinematicMove ??
          []
        ),

      special:
        unique([
          ...(
            settings.nonTmCinematicMoves ??
            []
          ),

          ...(
            settings.nonTmCinematicMove ??
            []
          ),
        ]),
    },
  }
}

// --------------------------------------------------
// Supplemental move pools
// --------------------------------------------------

/**
 * Some player-facing forms have move behavior that is
 * not represented completely by their raw Game Master
 * Pokémon template.
 *
 * These supplements are intentionally explicit rather
 * than inferred.
 *
 * Necrozma fusion signature moves are placed in the
 * special Charged Move pool because they are granted
 * through fusion and should not be treated as ordinary
 * Charged TM or Elite Charged TM options.
 */

function getSupplementalMovePools({
  pokemonId,
  form,
}) {
  if (
    pokemonId ===
      'NECROZMA' &&
    form ===
      'NECROZMA_DUSK_MANE'
  ) {
    return {
      fast: {
        normal:
          [],

        elite:
          [],

        special:
          [],
      },

      charged: {
        normal:
          [],

        elite:
          [],

        special: [
          'SUNSTEEL_STRIKE',
        ],
      },
    }
  }

  if (
    pokemonId ===
      'NECROZMA' &&
    form ===
      'NECROZMA_DAWN_WINGS'
  ) {
    return {
      fast: {
        normal:
          [],

        elite:
          [],

        special:
          [],
      },

      charged: {
        normal:
          [],

        elite:
          [],

        special: [
          'MOONGEIST_BEAM',
        ],
      },
    }
  }

  return {
    fast: {
      normal:
        [],

      elite:
        [],

      special:
        [],
    },

    charged: {
      normal:
        [],

      elite:
        [],

      special:
        [],
    },
  }
}

function mergeMovePools(
  base,
  supplemental
) {
  return {
    fast: {
      normal:
        unique([
          ...(
            base
              ?.fast
              ?.normal ??
            []
          ),

          ...(
            supplemental
              ?.fast
              ?.normal ??
            []
          ),
        ]),

      elite:
        unique([
          ...(
            base
              ?.fast
              ?.elite ??
            []
          ),

          ...(
            supplemental
              ?.fast
              ?.elite ??
            []
          ),
        ]),

      special:
        unique([
          ...(
            base
              ?.fast
              ?.special ??
            []
          ),

          ...(
            supplemental
              ?.fast
              ?.special ??
            []
          ),
        ]),
    },

    charged: {
      normal:
        unique([
          ...(
            base
              ?.charged
              ?.normal ??
            []
          ),

          ...(
            supplemental
              ?.charged
              ?.normal ??
            []
          ),
        ]),

      elite:
        unique([
          ...(
            base
              ?.charged
              ?.elite ??
            []
          ),

          ...(
            supplemental
              ?.charged
              ?.elite ??
            []
          ),
        ]),

      special:
        unique([
          ...(
            base
              ?.charged
              ?.special ??
            []
          ),

          ...(
            supplemental
              ?.charged
              ?.special ??
            []
          ),
        ]),
    },
  }
}

// --------------------------------------------------
// Permanent evolutions
// --------------------------------------------------

function extractEvolutionQuestTemplateIds(
  questDisplay
) {
  if (
    !Array.isArray(
      questDisplay
    )
  ) {
    return []
  }

  return [
    ...new Set(
      questDisplay
        .map(
          (entry) =>
            entry
              ?.questRequirementTemplateId ??
            null
        )
        .filter(
          Boolean
        )
    ),
  ]
}

function extractPermanentEvolutions(
  settings
) {
  const branches =
    settings.evolutionBranch ??
    []

  if (
    !Array.isArray(
      branches
    )
  ) {
    return []
  }

  return branches
    .filter(
      (branch) =>
        Boolean(
          branch?.evolution
        ) &&
        !branch?.temporaryEvolution
    )
    .map(
      (branch) => {
        const pokemonId =
          branch.evolution

        const form =
          normalizeForm(
            pokemonId,
            branch.form
          )

        return {
          pokemonId,

          form,

          costs: {
            candy:
              branch.candyCost ??
              null,

            purifiedCandy:
              branch
                .candyCostPurified ??
              null,

            item:
              branch
                .evolutionItemRequirement ??
              null,
          },

          requirements: {
            buddyDistanceKm:
              branch
                .kmBuddyDistanceRequirement ??
              null,

            mustBeBuddy:
              branch.mustBeBuddy ===
              true,

            daytime:
              branch.onlyDaytime ===
              true,

            nighttime:
              branch.onlyNighttime ===
              true,

            fullMoon:
              branch.onlyFullMoon ===
              true,

            upsideDown:
              branch.onlyUpsideDown ===
              true,

            lureItem:
              branch
                .lureItemRequirement ??
              null,

            move:
              normalizeMoveId(
                branch
                  .evolutionMoveRequirement
              ),

            gender:
              branch
                .genderRequirement ??
              null,

            quests:
              extractEvolutionQuestTemplateIds(
                branch.questDisplay
              ),
          },

          priority:
            branch.priority ??
            null,
        }
      }
    )
}

// --------------------------------------------------
// Temporary evolutions
// --------------------------------------------------

function extractTemporaryEvolutions(
  settings
) {
  const branches =
    settings.evolutionBranch ??
    []

  const overrides =
    settings.tempEvoOverrides ??
    []

  return overrides.map(
    (override) => {
      const tempEvoId =
        override.tempEvoId ??
        null

      const branch =
        branches.find(
          (candidate) =>
            candidate.temporaryEvolution ===
            tempEvoId
        )

      return {
        id:
          tempEvoId,

        stats: {
          attack:
            override
              .stats
              ?.baseAttack ??
            null,

          defense:
            override
              .stats
              ?.baseDefense ??
            null,

          stamina:
            override
              .stats
              ?.baseStamina ??
            null,
        },

        types:
          [
            cleanType(
              override.typeOverride1
            ),

            cleanType(
              override.typeOverride2
            ),
          ].filter(
            Boolean
          ),

        requirements: {
          move:
            normalizeMoveId(
              branch
                ?.evolutionMoveRequirement
            ),

          initialEnergy:
            branch
              ?.temporaryEvolutionEnergyCost ??
            null,

          subsequentEnergy:
            branch
              ?.temporaryEvolutionEnergyCostSubsequent ??
            null,
        },
      }
    }
  )
}

// --------------------------------------------------
// Form-change move reassignment helpers
// --------------------------------------------------

function normalizeReassignmentGroup(
  group
) {
  const existingMoves =
    unique(
      group
        ?.existingMoves ??
      []
    )

  const replacementMoves =
    unique(
      group
        ?.replacementMoves ??
      []
    )

  const results = []

  if (
    existingMoves.length ===
      0 ||
    replacementMoves.length ===
      0
  ) {
    return results
  }

  if (
    existingMoves.length ===
    replacementMoves.length
  ) {
    for (
      let index = 0;
      index <
        existingMoves.length;
      index += 1
    ) {
      results.push({
        from:
          existingMoves[index],

        to:
          replacementMoves[index],
      })
    }

    return results
  }

  if (
    existingMoves.length ===
    1
  ) {
    for (
      const replacementMove
      of replacementMoves
    ) {
      results.push({
        from:
          existingMoves[0],

        to:
          replacementMove,
      })
    }

    return results
  }

  if (
    replacementMoves.length ===
    1
  ) {
    for (
      const existingMove
      of existingMoves
    ) {
      results.push({
        from:
          existingMove,

        to:
          replacementMoves[0],
      })
    }

    return results
  }

  const pairCount =
    Math.min(
      existingMoves.length,
      replacementMoves.length
    )

  for (
    let index = 0;
      index <
        pairCount;
      index += 1
    ) {
      results.push({
        from:
          existingMoves[index],

        to:
          replacementMoves[index],
      })
    }

  return results
}

function extractMoveReassignmentCategory(
  groups
) {
  if (
    !Array.isArray(
      groups
    )
  ) {
    return []
  }

  const results = []

  for (
    const group
    of groups
  ) {
    results.push(
      ...normalizeReassignmentGroup(
        group
      )
    )
  }

  const seen =
    new Set()

  return results.filter(
    (entry) => {
      const key =
        `${entry.from}|${entry.to}`

      if (
        seen.has(
          key
        )
      ) {
        return false
      }

      seen.add(
        key
      )

      return true
    }
  )
}

// --------------------------------------------------
// Form changes
// --------------------------------------------------

function extractGameMasterFormChanges(
  settings
) {
  const formChanges =
    settings.formChange ??
    []

  if (
    !Array.isArray(
      formChanges
    )
  ) {
    return []
  }

  return formChanges.map(
    (formChange) => {
      const componentSettings =
        formChange
          ?.componentPokemonSettings ??
        {}

      return {
        targetForms:
          unique(
            formChange
              ?.availableForm ??
            []
          ),

        type:
          componentSettings
            ?.formChangeType ??
          null,

        componentPokemonId:
          componentSettings
            ?.pokedexId ??
          null,

        costs: {
          candy:
            formChange
              ?.candyCost ??
            null,

          componentCandy:
            componentSettings
              ?.componentCandyCost ??
            null,

          item:
            formChange
              ?.item ??
            null,

          itemCount:
            formChange
              ?.itemCostCount ??
            null,
        },

        moveReassignments: {
          fast:
            extractMoveReassignmentCategory(
              formChange
                ?.moveReassignment
                ?.quickMoves ??
              []
            ),

          charged:
            extractMoveReassignmentCategory(
              formChange
                ?.moveReassignment
                ?.cinematicMoves ??
              []
            ),
        },

        source:
          'GAME_MASTER',
      }
    }
  )
}

function getSupplementalFormChanges({
  pokemonId,
  form,
}) {
  if (
    pokemonId ===
      'KELDEO' &&
    form ===
      'KELDEO_ORDINARY'
  ) {
    const chargedMovesThatCanBeReplaced = [
      'AQUA_JET',
      'CLOSE_COMBAT',
      'HYDRO_PUMP',
      'X_SCISSOR',
      'SACRED_SWORD',
    ]

    return [
      {
        targetForms: [
          'KELDEO_RESOLUTE',
        ],

        type:
          'FORM_CHANGE',

        componentPokemonId:
          null,

        costs: {
          candy:
            50,

          componentCandy:
            null,

          item:
            null,

          itemCount:
            null,
        },

        moveReassignments: {
          fast:
            [],

          charged:
            chargedMovesThatCanBeReplaced.map(
              (moveId) => ({
                from:
                  moveId,

                to:
                  'SECRET_SWORD',
              })
            ),
        },

        source:
          'POKEIQ_SUPPLEMENT',

        sourceReason:
          'KELDEO_RESOLUTE_SECRET_SWORD_FORM_CHANGE',
      },
    ]
  }

  if (
    pokemonId ===
      'KELDEO' &&
    form ===
      'KELDEO_RESOLUTE'
  ) {
    return [
      {
        targetForms: [
          'KELDEO_ORDINARY',
        ],

        type:
          'FORM_CHANGE',

        componentPokemonId:
          null,

        costs: {
          candy:
            50,

          componentCandy:
            null,

          item:
            null,

          itemCount:
            null,
        },

        moveReassignments: {
          fast:
            [],

          charged:
            [],
        },

        source:
          'POKEIQ_SUPPLEMENT',

        sourceReason:
          'KELDEO_ORDINARY_FORM_REVERSION',
      },
    ]
  }

  return []
}

function extractFormChanges({
  pokemonId,
  form,
  settings,
}) {
  return [
    ...extractGameMasterFormChanges(
      settings
    ),

    ...getSupplementalFormChanges({
      pokemonId,
      form,
    }),
  ]
}

// --------------------------------------------------
// Pokémon normalization
// --------------------------------------------------

function normalizePokemon(
  templateId,
  settings
) {
  const pokemonId =
    settings.pokemonId

  const form =
    normalizeForm(
      pokemonId,
      settings.form
    )

  const baseMoves =
    extractMovePools(
      settings
    )

  const supplementalMoves =
    getSupplementalMovePools({
      pokemonId,
      form,
    })

  const moves =
    mergeMovePools(
      baseMoves,
      supplementalMoves
    )

  return {
    id:
      pokemonId,

    form,

    templateId,

    familyId:
      settings.familyId ??
      null,

    types:
      [
        cleanType(
          settings.type
        ),

        cleanType(
          settings.type2
        ),
      ].filter(
        Boolean
      ),

    stats: {
      attack:
        settings
          .stats
          ?.baseAttack ??
        null,

      defense:
        settings
          .stats
          ?.baseDefense ??
        null,

      stamina:
        settings
          .stats
          ?.baseStamina ??
        null,
    },

    moves,

    evolutions:
      extractPermanentEvolutions(
        settings
      ),

    temporaryEvolutions:
      extractTemporaryEvolutions(
        settings
      ),

    formChanges:
      extractFormChanges({
        pokemonId,
        form,
        settings,
      }),

    specialMoveItem:
      settings.exclusiveKeyItem
        ? {
            item:
              settings
                .exclusiveKeyItem
                .item ??
              null,

            count:
              settings
                .exclusiveKeyItem
                .count ??
              null,
          }
        : null,
  }
}

// --------------------------------------------------
// Duplicate handling
// --------------------------------------------------

function pokemonKey(
  pokemon
) {
  return (
    `${pokemon.id}:` +
    `${pokemon.form}`
  )
}

function pokemonQualityScore(
  pokemon
) {
  let score = 0

  if (
    pokemon.types.length
  ) {
    score += 1
  }

  if (
    pokemon.familyId
  ) {
    score += 1
  }

  if (
    pokemon.stats.attack !==
      null &&
    pokemon.stats.defense !==
      null &&
    pokemon.stats.stamina !==
      null
  ) {
    score += 3
  }

  score +=
    pokemon
      .moves
      .fast
      .normal
      .length

  score +=
    pokemon
      .moves
      .fast
      .elite
      .length

  score +=
    pokemon
      .moves
      .fast
      .special
      .length

  score +=
    pokemon
      .moves
      .charged
      .normal
      .length

  score +=
    pokemon
      .moves
      .charged
      .elite
      .length

  score +=
    pokemon
      .moves
      .charged
      .special
      .length

  score +=
    pokemon
      .evolutions
      .length *
    3

  score +=
    pokemon
      .temporaryEvolutions
      .length *
    3

  score +=
    pokemon
      .formChanges
      .length *
    3

  for (
    const formChange
    of pokemon.formChanges
  ) {
    score +=
      formChange
        .moveReassignments
        .fast
        .length

    score +=
      formChange
        .moveReassignments
        .charged
        .length
  }

  if (
    pokemon.specialMoveItem
  ) {
    score += 1
  }

  return score
}

function deduplicatePokemon(
  records
) {
  const map =
    new Map()

  for (
    const pokemon
    of records
  ) {
    const key =
      pokemonKey(
        pokemon
      )

    const existing =
      map.get(
        key
      )

    if (!existing) {
      map.set(
        key,
        pokemon
      )

      continue
    }

    const existingScore =
      pokemonQualityScore(
        existing
      )

    const newScore =
      pokemonQualityScore(
        pokemon
      )

    if (
      newScore >
      existingScore
    ) {
      map.set(
        key,
        pokemon
      )
    }
  }

  return [
    ...map.values(),
  ]
}

// --------------------------------------------------
// Explicit player-facing form cleanup
// --------------------------------------------------

function suppressNonPlayerFacingForms(
  records
) {
  const suppressionMap =
    new Map(
      PLAYER_FACING_FORM_SUPPRESSIONS.map(
        (entry) => [
          `${entry.pokemonId}:${entry.form}`,
          entry,
        ]
      )
    )

  const suppressed = []

  const pokemon =
    records.filter(
      (entry) => {
        const key =
          `${entry.id}:${entry.form}`

        const suppression =
          suppressionMap.get(
            key
          )

        if (
          !suppression
        ) {
          return true
        }

        suppressed.push({
          pokemonId:
            entry.id,

          form:
            entry.form,

          templateId:
            entry.templateId,

          reason:
            suppression.reason,
        })

        return false
      }
    )

  return {
    pokemon,

    suppressed,
  }
}

// --------------------------------------------------
// Player-facing form validation
// --------------------------------------------------

function validateExactPokemonForms({
  pokemon,
  pokemonId,
  expectedForms,
}) {
  const actualForms =
    pokemon
      .filter(
        (entry) =>
          entry.id ===
          pokemonId
      )
      .map(
        (entry) =>
          entry.form
      )
      .sort()

  const expected =
    [
      ...expectedForms,
    ].sort()

  if (
    JSON.stringify(
      actualForms
    ) !==
    JSON.stringify(
      expected
    )
  ) {
    throw new Error(
      `Critical form validation failed: ${pokemonId} expected [${expected.join(', ')}], found [${actualForms.join(', ')}].`
    )
  }

  return actualForms
}

function validatePokemonHasForm({
  pokemon,
  pokemonId,
  form,
}) {
  const entry =
    pokemon.find(
      (candidate) =>
        candidate.id ===
          pokemonId &&
        candidate.form ===
          form
    )

  if (
    !entry
  ) {
    throw new Error(
      `Critical form validation failed: ${pokemonId} [${form}] was not generated.`
    )
  }

  return entry
}

function validatePokemonDoesNotHaveForm({
  pokemon,
  pokemonId,
  form,
}) {
  const entry =
    pokemon.find(
      (candidate) =>
        candidate.id ===
          pokemonId &&
        candidate.form ===
          form
    )

  if (
    entry
  ) {
    throw new Error(
      `Critical form validation failed: ${pokemonId} [${form}] should have been suppressed.`
    )
  }

  return true
}

// --------------------------------------------------
// Move-pool validation
// --------------------------------------------------

function validateMoveExists({
  moves,
  moveId,
}) {
  const move =
    moves.find(
      (entry) =>
        entry.id ===
        moveId
    )

  if (!move) {
    throw new Error(
      `Critical move validation failed: ${moveId} was not generated in moves-pve.json.`
    )
  }

  return move
}

function validateSpecialChargedMove({
  pokemon,
  pokemonId,
  form,
  moveId,
}) {
  const entry =
    validatePokemonHasForm({
      pokemon,
      pokemonId,
      form,
    })

  const inSpecial =
    entry
      .moves
      .charged
      .special
      .includes(
        moveId
      )

  const inNormal =
    entry
      .moves
      .charged
      .normal
      .includes(
        moveId
      )

  const inElite =
    entry
      .moves
      .charged
      .elite
      .includes(
        moveId
      )

  if (!inSpecial) {
    throw new Error(
      `Critical move-pool validation failed: ${pokemonId} [${form}] must include ${moveId} in charged.special.`
    )
  }

  if (
    inNormal ||
    inElite
  ) {
    throw new Error(
      `Critical move-pool validation failed: ${pokemonId} [${form}] ${moveId} must not appear in charged.normal or charged.elite.`
    )
  }

  return entry
}

// --------------------------------------------------
// Combat data
// --------------------------------------------------

function buildCpMultipliers(
  wholeLevelMultipliers
) {
  const wholeLevels = {}
  const allLevels = {}

  for (
    let index = 0;
    index <
      wholeLevelMultipliers.length;
    index += 1
  ) {
    const level =
      index + 1

    const cpm =
      wholeLevelMultipliers[
        index
      ]

    wholeLevels[
      String(level)
    ] =
      cpm

    allLevels[
      String(level)
    ] =
      cpm

    const nextCpm =
      wholeLevelMultipliers[
        index + 1
      ]

    if (
      nextCpm ===
      undefined
    ) {
      continue
    }

    const halfLevel =
      level + 0.5

    const halfLevelCpm =
      Math.sqrt(
        (
          Math.pow(
            cpm,
            2
          ) +
          Math.pow(
            nextCpm,
            2
          )
        ) /
        2
      )

    allLevels[
      String(
        halfLevel
      )
    ] =
      halfLevelCpm
  }

  return {
    wholeLevels,
    allLevels,
  }
}

function buildTypeEffectiveness(
  typeTemplates
) {
  const result = {}

  for (
    const typeTemplate
    of typeTemplates
  ) {
    const attackType =
      cleanType(
        typeTemplate.attackType
      )

    const scalars =
      typeTemplate.attackScalar ??
      []

    if (!attackType) {
      continue
    }

    const defendingTypes = {}

    for (
      let index = 0;
      index <
        TYPE_ORDER.length;
      index += 1
    ) {
      defendingTypes[
        TYPE_ORDER[index]
      ] =
        scalars[index] ??
        null
    }

    result[
      attackType
    ] =
      defendingTypes
  }

  return result
}

// --------------------------------------------------
// Reference validation helpers
// --------------------------------------------------

function collectPokemonMoveIds(
  pokemon
) {
  const moveIds = [
    ...pokemon.moves.fast.normal,
    ...pokemon.moves.fast.elite,
    ...pokemon.moves.fast.special,

    ...pokemon.moves.charged.normal,
    ...pokemon.moves.charged.elite,
    ...pokemon.moves.charged.special,
  ]

  for (
    const formChange
    of pokemon.formChanges ??
    []
  ) {
    for (
      const reassignment
      of formChange
        ?.moveReassignments
        ?.fast ??
      []
    ) {
      moveIds.push(
        reassignment.from,
        reassignment.to
      )
    }

    for (
      const reassignment
      of formChange
        ?.moveReassignments
        ?.charged ??
      []
    ) {
      moveIds.push(
        reassignment.from,
        reassignment.to
      )
    }
  }

  return unique(
    moveIds
  )
}

function findMissingMoveReferences({
  pokemon,
  moves,
}) {
  const moveIds =
    new Set(
      moves.map(
        (move) =>
          move.id
      )
    )

  const missing = []

  for (
    const entry
    of pokemon
  ) {
    const referencedMoves =
      collectPokemonMoveIds(
        entry
      )

    for (
      const moveId
      of referencedMoves
    ) {
      if (
        moveIds.has(
          moveId
        )
      ) {
        continue
      }

      missing.push({
        pokemonId:
          entry.id,

        form:
          entry.form,

        moveId,
      })
    }
  }

  return missing
}

function findFormChangeReassignment({
  pokemon,
  sourcePokemonId,
  targetForm,
  moveType,
  fromMoveId,
  toMoveId,
}) {
  const source =
    pokemon.find(
      (entry) =>
        entry.id ===
          sourcePokemonId &&
        entry.form ===
          'NORMAL'
    )

  if (!source) {
    return null
  }

  for (
    const formChange
    of source.formChanges ??
    []
  ) {
    if (
      !formChange
        .targetForms
        .includes(
          targetForm
        )
    ) {
      continue
    }

    const reassignment =
      formChange
        ?.moveReassignments
        ?.[moveType]
        ?.find(
          (entry) =>
            entry.from ===
              fromMoveId &&
            entry.to ===
              toMoveId
        )

    if (
      reassignment
    ) {
      return {
        source,
        formChange,
        reassignment,
      }
    }
  }

  return null
}

function findEvolution({
  pokemon,
  sourcePokemonId,
  sourceForm = 'NORMAL',
  targetPokemonId,
  targetForm = 'NORMAL',
}) {
  const source =
    pokemon.find(
      (entry) =>
        entry.id ===
          sourcePokemonId &&
        entry.form ===
          sourceForm
    )

  if (!source) {
    return null
  }

  const evolution =
    source
      .evolutions
      ?.find(
        (entry) =>
          entry.pokemonId ===
            targetPokemonId &&
          entry.form ===
            targetForm
      ) ??
    null

  if (!evolution) {
    return null
  }

  return {
    source,
    evolution,
  }
}

function validatePokemonFamily({
  pokemon,
  pokemonId,
  form = 'NORMAL',
  expectedFamilyId,
}) {
  const entry =
    pokemon.find(
      (candidate) =>
        candidate.id ===
          pokemonId &&
        candidate.form ===
          form
    )

  if (!entry) {
    throw new Error(
      `Critical family validation failed: ${pokemonId} [${form}] was not generated.`
    )
  }

  if (
    entry.familyId !==
    expectedFamilyId
  ) {
    throw new Error(
      `Critical family validation failed: ${pokemonId} [${form}] expected ${expectedFamilyId}, found ${entry.familyId ?? 'MISSING'}.`
    )
  }

  return entry
}

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  console.log(
    'Updating PokeIQ Reference Data...'
  )

  console.log('')
  console.log(
    'Downloading Pokémon GO Game Master...'
  )

  const [
    gameMasterResponse,
    timestampResponse,
  ] =
    await Promise.all([
      fetch(
        GAME_MASTER_URL
      ),

      fetch(
        TIMESTAMP_URL
      ),
    ])

  if (
    !gameMasterResponse.ok
  ) {
    throw new Error(
      `Game Master request failed: ${gameMasterResponse.status}`
    )
  }

  if (
    !timestampResponse.ok
  ) {
    throw new Error(
      `Timestamp request failed: ${timestampResponse.status}`
    )
  }

  const raw =
    await gameMasterResponse.json()

  const sourceTimestamp =
    (
      await timestampResponse.text()
    ).trim()

  const templates =
    Array.isArray(
      raw
    )
      ? raw
      : raw.itemTemplates ??
        raw.templates ??
        []

  console.log(
    `Loaded ${templates.length} templates.`
  )

  // ------------------------------------------------
  // Extract raw records
  // ------------------------------------------------

  const pokemonRecords = []
  const moveRecords = []

  let playerLevelSettings =
    null

  let combatSettings =
    null

  const typeEffectivenessRecords =
    []

  for (
    const template
    of templates
  ) {
    const data =
      unwrapTemplate(
        template
      )

    const templateId =
      data?.templateId ??
      template?.templateId ??
      null

    if (
      data?.pokemonSettings
    ) {
      pokemonRecords.push(
        normalizePokemon(
          templateId,
          data.pokemonSettings
        )
      )
    }

    if (
      data?.moveSettings
    ) {
      const move =
        normalizeMove(
          data.moveSettings,
          templateId
        )

      if (
        move.id
      ) {
        moveRecords.push(
          move
        )
      }
    }

    if (
      templateId ===
      'PLAYER_LEVEL_SETTINGS'
    ) {
      playerLevelSettings =
        data.playerLevel ??
        null
    }

    if (
      templateId ===
      'COMBAT_SETTINGS'
    ) {
      combatSettings =
        data.combatSettings ??
        null
    }

    if (
      data?.typeEffective
    ) {
      typeEffectivenessRecords.push(
        data.typeEffective
      )
    }
  }

  // ------------------------------------------------
  // Pokémon deduplication
  // ------------------------------------------------

  const deduplicatedPokemon =
    deduplicatePokemon(
      pokemonRecords
    )

  // ------------------------------------------------
  // Explicit player-facing form cleanup
  // ------------------------------------------------

  const {
    pokemon:
      cleanedPokemon,

    suppressed:
      suppressedForms,
  } =
    suppressNonPlayerFacingForms(
      deduplicatedPokemon
    )

  const pokemon =
    cleanedPokemon.sort(
      (a, b) => {
        if (
          a.id !==
          b.id
        ) {
          return String(
            a.id
          ).localeCompare(
            String(
              b.id
            )
          )
        }

        return String(
          a.form
        ).localeCompare(
          String(
            b.form
          )
        )
      }
    )

  // ------------------------------------------------
  // Move deduplication
  // ------------------------------------------------

  const moves = [
    ...new Map(
      moveRecords.map(
        (move) => [
          move.id,
          move,
        ]
      )
    ).values(),
  ].sort(
    (a, b) =>
      String(
        a.id
      ).localeCompare(
        String(
          b.id
        )
      )
  )

  // ------------------------------------------------
  // Required source validation
  // ------------------------------------------------

  if (
    !playerLevelSettings
      ?.cpMultiplier
  ) {
    throw new Error(
      'PLAYER_LEVEL_SETTINGS cpMultiplier data was not found.'
    )
  }

  if (
    !combatSettings
  ) {
    throw new Error(
      'COMBAT_SETTINGS was not found.'
    )
  }

  if (
    typeEffectivenessRecords.length !==
    TYPE_ORDER.length
  ) {
    throw new Error(
      `Expected ${TYPE_ORDER.length} type-effectiveness records, found ${typeEffectivenessRecords.length}.`
    )
  }

  // ------------------------------------------------
  // Critical player-facing form validation
  // ------------------------------------------------

  const genieFormChecks = [
    {
      pokemonId:
        'TORNADUS',

      expectedForms: [
        'TORNADUS_INCARNATE',
        'TORNADUS_THERIAN',
      ],
    },

    {
      pokemonId:
        'THUNDURUS',

      expectedForms: [
        'THUNDURUS_INCARNATE',
        'THUNDURUS_THERIAN',
      ],
    },

    {
      pokemonId:
        'LANDORUS',

      expectedForms: [
        'LANDORUS_INCARNATE',
        'LANDORUS_THERIAN',
      ],
    },

    {
      pokemonId:
        'ENAMORUS',

      expectedForms: [
        'ENAMORUS_INCARNATE',
        'ENAMORUS_THERIAN',
      ],
    },
  ]

  const validatedGenieForms =
    genieFormChecks.map(
      (check) => ({
        pokemonId:
          check.pokemonId,

        forms:
          validateExactPokemonForms({
            pokemon,
            ...check,
          }),
      })
    )

  const specialFormChecks = [
    {
      pokemonId:
        'RAIKOU',

      suppressedForm:
        'RAIKOU_S',
    },

    {
      pokemonId:
        'ENTEI',

      suppressedForm:
        'ENTEI_S',
    },

    {
      pokemonId:
        'SUICUNE',

      suppressedForm:
        'SUICUNE_S',
    },

    {
      pokemonId:
        'LUGIA',

      suppressedForm:
        'LUGIA_S',
    },

    {
      pokemonId:
        'HO_OH',

      suppressedForm:
        'HO_OH_S',
    },

    {
      pokemonId:
        'LATIAS',

      suppressedForm:
        'LATIAS_S',
    },

    {
      pokemonId:
        'LATIOS',

      suppressedForm:
        'LATIOS_S',
    },
  ]

  for (
    const check
    of specialFormChecks
  ) {
    validatePokemonHasForm({
      pokemon,

      pokemonId:
        check.pokemonId,

      form:
        'NORMAL',
    })

    validatePokemonDoesNotHaveForm({
      pokemon,

      pokemonId:
        check.pokemonId,

      form:
        check.suppressedForm,
    })
  }

  // ------------------------------------------------
  // Critical Necrozma fusion move validation
  // ------------------------------------------------

  const sunsteelStrike =
    validateMoveExists({
      moves,

      moveId:
        'SUNSTEEL_STRIKE',
    })

  const moongeistBeam =
    validateMoveExists({
      moves,

      moveId:
        'MOONGEIST_BEAM',
    })

  const duskManeNecrozma =
    validateSpecialChargedMove({
      pokemon,

      pokemonId:
        'NECROZMA',

      form:
        'NECROZMA_DUSK_MANE',

      moveId:
        'SUNSTEEL_STRIKE',
    })

  const dawnWingsNecrozma =
    validateSpecialChargedMove({
      pokemon,

      pokemonId:
        'NECROZMA',

      form:
        'NECROZMA_DAWN_WINGS',

      moveId:
        'MOONGEIST_BEAM',
    })

  // ------------------------------------------------
  // Build combat reference data
  // ------------------------------------------------

  const cpMultipliers =
    buildCpMultipliers(
      playerLevelSettings
        .cpMultiplier
    )

  const typeEffectiveness =
    buildTypeEffectiveness(
      typeEffectivenessRecords
    )

  const combat = {
    cpMultipliers,

    typeEffectiveness,

    modifiers: {
      stab:
        combatSettings
          .sameTypeAttackBonusMultiplier,

      shadowAttack:
        combatSettings
          .shadowPokemonAttackBonusMultiplier,

      shadowDefense:
        combatSettings
          .shadowPokemonDefenseBonusMultiplier,
    },

    source: {
      cpMultipliers:
        'PLAYER_LEVEL_SETTINGS',

      typeEffectiveness:
        'POKEMON_TYPE_*',

      modifiers:
        'COMBAT_SETTINGS',
    },
  }

  // ------------------------------------------------
  // Cross-reference move IDs
  // ------------------------------------------------

  const missingMoveReferences =
    findMissingMoveReferences({
      pokemon,
      moves,
    })

  // ------------------------------------------------
  // Critical permanent-evolution validation
  // ------------------------------------------------

  const anorithEvolution =
    findEvolution({
      pokemon,

      sourcePokemonId:
        'ANORITH',

      targetPokemonId:
        'ARMALDO',
    })

  const beldumEvolution =
    findEvolution({
      pokemon,

      sourcePokemonId:
        'BELDUM',

      targetPokemonId:
        'METANG',
    })

  const metangEvolution =
    findEvolution({
      pokemon,

      sourcePokemonId:
        'METANG',

      targetPokemonId:
        'METAGROSS',
    })

  if (
    anorithEvolution
      ?.evolution
      ?.costs
      ?.candy !==
    50
  ) {
    throw new Error(
      'Critical evolution validation failed: ANORITH → ARMALDO must cost 50 Candy.'
    )
  }

  if (
    beldumEvolution
      ?.evolution
      ?.costs
      ?.candy !==
      25 ||
    metangEvolution
      ?.evolution
      ?.costs
      ?.candy !==
      100
  ) {
    throw new Error(
      'Critical evolution validation failed: BELDUM → METANG → METAGROSS must preserve 25 + 100 Candy costs.'
    )
  }

  // ------------------------------------------------
  // Critical Candy-family validation
  // ------------------------------------------------

  const familyValidationChecks = [
    {
      pokemonId:
        'ABRA',

      expectedFamilyId:
        'FAMILY_ABRA',
    },

    {
      pokemonId:
        'KADABRA',

      expectedFamilyId:
        'FAMILY_ABRA',
    },

    {
      pokemonId:
        'ALAKAZAM',

      expectedFamilyId:
        'FAMILY_ABRA',
    },

    {
      pokemonId:
        'EEVEE',

      expectedFamilyId:
        'FAMILY_EEVEE',
    },

    {
      pokemonId:
        'VAPOREON',

      expectedFamilyId:
        'FAMILY_EEVEE',
    },

    {
      pokemonId:
        'SYLVEON',

      expectedFamilyId:
        'FAMILY_EEVEE',
    },

    {
      pokemonId:
        'TYROGUE',

      expectedFamilyId:
        'FAMILY_TYROGUE',
    },

    {
      pokemonId:
        'HITMONLEE',

      expectedFamilyId:
        'FAMILY_TYROGUE',
    },

    {
      pokemonId:
        'HITMONCHAN',

      expectedFamilyId:
        'FAMILY_TYROGUE',
    },

    {
      pokemonId:
        'HITMONTOP',

      expectedFamilyId:
        'FAMILY_TYROGUE',
    },
  ]

  const validatedFamilyEntries =
    familyValidationChecks.map(
      (check) =>
        validatePokemonFamily({
          pokemon,
          ...check,
        })
    )

  const candyFamilyCount =
    new Set(
      pokemon
        .map(
          (entry) =>
            entry.familyId ??
            null
        )
        .filter(
          Boolean
        )
    ).size

  if (
    candyFamilyCount ===
    0
  ) {
    throw new Error(
      'Critical family validation failed: no Pokémon Candy families were preserved from the Game Master.'
    )
  }

  // ------------------------------------------------
  // Critical Kyurem form-change validation
  // ------------------------------------------------

  const blackKyuremMapping =
    findFormChangeReassignment({
      pokemon,

      sourcePokemonId:
        'KYUREM',

      targetForm:
        'KYUREM_BLACK',

      moveType:
        'charged',

      fromMoveId:
        'GLACIATE',

      toMoveId:
        'FREEZE_SHOCK',
    })

  const whiteKyuremMapping =
    findFormChangeReassignment({
      pokemon,

      sourcePokemonId:
        'KYUREM',

      targetForm:
        'KYUREM_WHITE',

      moveType:
        'charged',

      fromMoveId:
        'GLACIATE',

      toMoveId:
        'ICE_BURN',
    })

  if (
    !blackKyuremMapping
  ) {
    throw new Error(
      'Critical form-change validation failed: KYUREM → KYUREM_BLACK must reassign GLACIATE → FREEZE_SHOCK.'
    )
  }

  if (
    !whiteKyuremMapping
  ) {
    throw new Error(
      'Critical form-change validation failed: KYUREM → KYUREM_WHITE must reassign GLACIATE → ICE_BURN.'
    )
  }

  // ------------------------------------------------
  // Metadata
  // ------------------------------------------------

  const evolutionCount =
    pokemon.reduce(
      (
        total,
        entry
      ) =>
        total +
        (
          entry
            ?.evolutions
            ?.length ??
          0
        ),
      0
    )

  const formChangeCount =
    pokemon.reduce(
      (
        total,
        entry
      ) =>
        total +
        (
          entry
            ?.formChanges
            ?.length ??
          0
        ),
      0
    )

  const moveReassignmentCount =
    pokemon.reduce(
      (
        total,
        entry
      ) => {
        let entryTotal = 0

        for (
          const formChange
          of entry.formChanges ??
          []
        ) {
          entryTotal +=
            formChange
              ?.moveReassignments
              ?.fast
              ?.length ??
            0

          entryTotal +=
            formChange
              ?.moveReassignments
              ?.charged
              ?.length ??
            0
        }

        return (
          total +
          entryTotal
        )
      },
      0
    )

  const pokemonWithFamilyIdCount =
    pokemon.filter(
      (entry) =>
        Boolean(
          entry.familyId
        )
    ).length

  const metadata = {
    source:
      'PokeMiners Game Master',

    sourceUrl:
      GAME_MASTER_URL,

    sourceTimestamp,

    generatedAt:
      new Date()
        .toISOString(),

    counts: {
      rawTemplates:
        templates.length,

      pokemon:
        pokemon.length,

      pokemonWithFamilyId:
        pokemonWithFamilyIdCount,

      candyFamilies:
        candyFamilyCount,

      pveMoves:
        moves.length,

      evolutions:
        evolutionCount,

      formChanges:
        formChangeCount,

      moveReassignments:
        moveReassignmentCount,

      suppressedPlayerFacingForms:
        suppressedForms.length,

      supplementalFusionMoves:
        2,

      missingMoveReferences:
        missingMoveReferences.length,
    },
  }

  // ------------------------------------------------
  // Write output
  // ------------------------------------------------

  await fs.mkdir(
    OUTPUT_DIR,
    {
      recursive:
        true,
    }
  )

  await Promise.all([
    fs.writeFile(
      path.join(
        OUTPUT_DIR,
        'pokemon.json'
      ),
      JSON.stringify(
        pokemon,
        null,
        2
      )
    ),

    fs.writeFile(
      path.join(
        OUTPUT_DIR,
        'moves-pve.json'
      ),
      JSON.stringify(
        moves,
        null,
        2
      )
    ),

    fs.writeFile(
      path.join(
        OUTPUT_DIR,
        'metadata.json'
      ),
      JSON.stringify(
        metadata,
        null,
        2
      )
    ),

    fs.writeFile(
      path.join(
        OUTPUT_DIR,
        'combat.json'
      ),
      JSON.stringify(
        combat,
        null,
        2
      )
    ),
  ])

  // ------------------------------------------------
  // Summary
  // ------------------------------------------------

  console.log('')
  console.log(
    'Reference data generated.'
  )

  console.log(
    `Pokémon records: ${pokemon.length}`
  )

  console.log(
    `Pokémon with familyId: ${pokemonWithFamilyIdCount}`
  )

  console.log(
    `Candy families: ${candyFamilyCount}`
  )

  console.log(
    `PvE moves: ${moves.length}`
  )

  console.log(
    `Permanent evolutions: ${evolutionCount}`
  )

  console.log(
    `Form changes: ${formChangeCount}`
  )

  console.log(
    `Move reassignments: ${moveReassignmentCount}`
  )

  console.log(
    `Suppressed player-facing forms: ${suppressedForms.length}`
  )

  console.log(
    'Supplemental fusion moves: 2'
  )

  console.log(
    `Missing move references: ${missingMoveReferences.length}`
  )

  if (
    suppressedForms.length >
    0
  ) {
    console.log('')
    console.log(
      'Suppressed player-facing forms:'
    )

    for (
      const entry
      of suppressedForms
    ) {
      console.log(
        `✅ ${entry.pokemonId}` +
        ` [${entry.form}]` +
        ` → ${entry.reason}`
      )
    }
  }

  if (
    missingMoveReferences.length >
    0
  ) {
    console.log('')
    console.log(
      'Missing move reference sample:'
    )

    for (
      const entry
      of missingMoveReferences.slice(
        0,
        30
      )
    ) {
      console.log(
        `${entry.pokemonId}` +
        ` [${entry.form}]` +
        ` → ${entry.moveId}`
      )
    }

    if (
      missingMoveReferences.length >
      30
    ) {
      console.log(
        `...and ${missingMoveReferences.length - 30} more`
      )
    }
  }

  // ------------------------------------------------
  // Player-facing form validation
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'PLAYER-FACING FORM VALIDATION'
  )
  console.log(
    '================================'
  )

  for (
    const entry
    of validatedGenieForms
  ) {
    console.log(
      `✅ ${entry.pokemonId}` +
      ` → ${entry.forms.join(', ')}`
    )
  }

  for (
    const check
    of specialFormChecks
  ) {
    console.log(
      `✅ ${check.pokemonId}` +
      ` → NORMAL preserved;` +
      ` ${check.suppressedForm} suppressed`
    )
  }

  // ------------------------------------------------
  // Necrozma fusion validation
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'NECROZMA FUSION MOVE VALIDATION'
  )
  console.log(
    '================================'
  )

  console.log(
    `✅ SUNSTEEL_STRIKE PvE move generated` +
    ` (${sunsteelStrike.type ?? 'UNKNOWN'} / ${sunsteelStrike.power ?? 'UNKNOWN'} power)`
  )

  console.log(
    `✅ MOONGEIST_BEAM PvE move generated` +
    ` (${moongeistBeam.type ?? 'UNKNOWN'} / ${moongeistBeam.power ?? 'UNKNOWN'} power)`
  )

  console.log(
    `✅ Dusk Mane Necrozma → SUNSTEEL_STRIKE` +
    ` [charged.special]`
  )

  console.log(
    `✅ Dawn Wings Necrozma → MOONGEIST_BEAM` +
    ` [charged.special]`
  )

  console.log('')
  console.log(
    'Dusk Mane charged pools:'
  )

  console.dir(
    duskManeNecrozma
      .moves
      .charged,
    {
      depth:
        null,
    }
  )

  console.log('')
  console.log(
    'Dawn Wings charged pools:'
  )

  console.dir(
    dawnWingsNecrozma
      .moves
      .charged,
    {
      depth:
        null,
    }
  )

  // ------------------------------------------------
  // Permanent evolution validation
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'PERMANENT EVOLUTION VALIDATION'
  )
  console.log(
    '================================'
  )

  console.log(
    `Anorith → Armaldo: ${
      anorithEvolution
        ? '✅'
        : '❌'
    }`
  )

  console.log(
    `Anorith evolution Candy: ${
      anorithEvolution
        ?.evolution
        ?.costs
        ?.candy ??
      'MISSING'
    }`
  )

  console.log(
    `Anorith purified Candy: ${
      anorithEvolution
        ?.evolution
        ?.costs
        ?.purifiedCandy ??
      'MISSING'
    }`
  )

  console.log(
    `Beldum → Metang: ${
      beldumEvolution
        ? '✅'
        : '❌'
    }`
  )

  console.log(
    `Metang → Metagross: ${
      metangEvolution
        ? '✅'
        : '❌'
    }`
  )

  console.log(
    `Beldum full evolution Candy: ${
      (
        beldumEvolution
          ?.evolution
          ?.costs
          ?.candy ??
        0
      ) +
      (
        metangEvolution
          ?.evolution
          ?.costs
          ?.candy ??
        0
      )
    }`
  )

  // ------------------------------------------------
  // Candy-family validation
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'CANDY FAMILY VALIDATION'
  )
  console.log(
    '================================'
  )

  console.log(
    `Unique Candy families: ${candyFamilyCount}`
  )

  for (
    const entry
    of validatedFamilyEntries
  ) {
    console.log(
      `✅ ${entry.id}` +
      ` [${entry.form}]` +
      ` → ${entry.familyId}`
    )
  }

  // ------------------------------------------------
  // Combat validation
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'COMBAT DATA VALIDATION'
  )
  console.log(
    '================================'
  )

  console.log(
    `Whole-level CPM entries: ${
      Object.keys(
        combat
          .cpMultipliers
          .wholeLevels
      ).length
    }`
  )

  console.log(
    `All CPM entries: ${
      Object.keys(
        combat
          .cpMultipliers
          .allLevels
      ).length
    }`
  )

  console.log(
    `Type charts: ${
      Object.keys(
        combat.typeEffectiveness
      ).length
    }`
  )

  console.log(
    `STAB: ${combat.modifiers.stab}`
  )

  console.log(
    `Shadow Attack: ${combat.modifiers.shadowAttack}`
  )

  console.log(
    `Shadow Defense: ${combat.modifiers.shadowDefense}`
  )

  console.log(
    `Dragon → Dragon: ${
      combat
        .typeEffectiveness
        .DRAGON
        .DRAGON
    }`
  )

  console.log(
    `Dragon → Steel: ${
      combat
        .typeEffectiveness
        .DRAGON
        .STEEL
    }`
  )

  console.log(
    `Dragon → Fairy: ${
      combat
        .typeEffectiveness
        .DRAGON
        .FAIRY
    }`
  )

  // ------------------------------------------------
  // Numeric move-ID validation
  // ------------------------------------------------

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'NUMERIC MOVE ID VALIDATION'
  )
  console.log(
    '================================'
  )

  const numericMoveChecks = [
    {
      pokemonId:
        'MORPEKO',

      form:
        'NORMAL',

      moveId:
        '406',

      expectedDisplayId:
        'AURA_WHEEL_ELECTRIC',
    },

    {
      pokemonId:
        'MORPEKO',

      form:
        'MORPEKO_HANGRY',

      moveId:
        '407',

      expectedDisplayId:
        'AURA_WHEEL_DARK',
    },

    {
      pokemonId:
        'ETERNATUS',

      form:
        'NORMAL',

      moveId:
        '482',

      expectedDisplayId:
        'DYNAMAX_CANNON',
    },
  ]

  for (
    const check
    of numericMoveChecks
  ) {
    const pokemonEntry =
      pokemon.find(
        (entry) =>
          entry.id ===
            check.pokemonId &&
          entry.form ===
            check.form
      )

    const moveEntry =
      moves.find(
        (entry) =>
          entry.id ===
          check.moveId
      )

    const referenced =
      pokemonEntry
        ? collectPokemonMoveIds(
            pokemonEntry
          ).includes(
            check.moveId
          )
        : false

    const displayIdMatches =
      moveEntry
        ?.displayId ===
      check.expectedDisplayId

    console.log(
      `${
        pokemonEntry &&
        moveEntry &&
        referenced &&
        displayIdMatches
          ? '✅'
          : '❌'
      } ` +
      `${check.pokemonId}` +
      ` [${check.form}]` +
      ` → ${check.moveId}` +
      ` → ${moveEntry?.displayId ?? 'MISSING'}`
    )
  }

  // ------------------------------------------------
  // Kyurem validation
  // ------------------------------------------------

  const kyurem =
    pokemon.find(
      (entry) =>
        entry.id ===
          'KYUREM' &&
        entry.form ===
          'NORMAL'
    )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'KYUREM FORM-CHANGE VALIDATION'
  )
  console.log(
    '================================'
  )

  console.log(
    `Kyurem generated: ${
      kyurem
        ? '✅'
        : '❌'
    }`
  )

  console.log(
    `Form-change rules: ${
      kyurem
        ?.formChanges
        ?.length ??
      0
    }`
  )

  console.log(
    `Black Kyurem GLACIATE → FREEZE_SHOCK: ${
      blackKyuremMapping
        ? '✅'
        : '❌'
    }`
  )

  console.log(
    `White Kyurem GLACIATE → ICE_BURN: ${
      whiteKyuremMapping
        ? '✅'
        : '❌'
    }`
  )

  if (
    kyurem
  ) {
    console.log('')

    console.dir(
      kyurem.formChanges,
      {
        depth:
          null,
      }
    )
  }

  // ------------------------------------------------
  // Rayquaza validation
  // ------------------------------------------------

  const rayquaza =
    pokemon.find(
      (entry) =>
        entry.id ===
          'RAYQUAZA' &&
        entry.form ===
          'NORMAL'
    )

  console.log('')
  console.log(
    '================================'
  )
  console.log(
    'RAYQUAZA VALIDATION'
  )
  console.log(
    '================================'
  )

  if (!rayquaza) {
    console.log(
      '❌ Rayquaza was not generated.'
    )
  } else {
    console.dir(
      rayquaza,
      {
        depth:
          null,
      }
    )

    const hasDragonAscent =
      rayquaza
        .moves
        .charged
        .special
        .includes(
          'DRAGON_ASCENT'
        )

    const mega =
      rayquaza
        .temporaryEvolutions
        .find(
          (entry) =>
            entry.id ===
            'TEMP_EVOLUTION_MEGA'
        )

    console.log('')

    console.log(
      `Dragon Ascent: ${
        hasDragonAscent
          ? '✅'
          : '❌'
      }`
    )

    console.log(
      `Mega Rayquaza: ${
        mega
          ? '✅'
          : '❌'
      }`
    )

    console.log(
      `Mega requires Dragon Ascent: ${
        mega
          ?.requirements
          ?.move ===
        'DRAGON_ASCENT'
          ? '✅'
          : '❌'
      }`
    )
  }

  console.log('')

  console.log(
    `Files written to: ${OUTPUT_DIR}`
  )
}

// --------------------------------------------------
// Run
// --------------------------------------------------

main().catch(
  (error) => {
    console.error('')

    console.error(
      'Reference data update failed:'
    )

    console.error(
      error
    )

    process.exitCode = 1
  }
)