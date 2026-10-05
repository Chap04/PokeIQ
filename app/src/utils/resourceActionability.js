export const RESOURCE_ACTIONABILITY_STATUS = {
  AFFORDABLE:
    'AFFORDABLE',

  ATTEMPTABLE:
    'ATTEMPTABLE',

  NEEDS_CANDY_CHECK:
    'NEEDS_CANDY_CHECK',

  BLOCKED:
    'BLOCKED',

  UNKNOWN:
    'UNKNOWN',
}

const RESOURCE_BALANCE_KEYS = {
  STARDUST:
    'stardust',

  FAST_TM:
    'fastTms',

  CHARGED_TM:
    'chargedTms',

  ELITE_FAST_TM:
    'eliteFastTms',

  ELITE_CHARGED_TM:
    'eliteChargedTms',
}

const RESOURCE_LABELS = {
  STARDUST:
    'Stardust',

  CANDY:
    'Candy',

  CANDY_XL:
    'Candy XL',

  FAST_TM:
    'Fast TM',

  CHARGED_TM:
    'Charged TM',

  ELITE_FAST_TM:
    'Elite Fast TM',

  ELITE_CHARGED_TM:
    'Elite Charged TM',

  SECOND_CHARGED_MOVE_UNLOCK:
    'Second Charged Move Unlock',

  SPECIAL_ACQUISITION:
    'Special Acquisition',
}

function getResourceLabel(
  requirement
) {
  if (
    requirement?.label
  ) {
    return requirement.label
  }

  return (
    RESOURCE_LABELS[
      requirement?.resource
    ] ??
    'Unknown Resource'
  )
}

function getExactRequiredQuantity(
  requirement
) {
  if (
    Number.isFinite(
      requirement
        ?.exactQuantity
    )
  ) {
    return requirement
      .exactQuantity
  }

  if (
    requirement?.exact ===
      true &&
    Number.isFinite(
      requirement?.quantity
    )
  ) {
    return requirement
      .quantity
  }

  return null
}

function getMinimumRequiredQuantity(
  requirement
) {
  if (
    Number.isFinite(
      requirement
        ?.minimumQuantity
    )
  ) {
    return requirement
      .minimumQuantity
  }

  const exactQuantity =
    getExactRequiredQuantity(
      requirement
    )

  if (
    Number.isFinite(
      exactQuantity
    )
  ) {
    return exactQuantity
  }

  return null
}

function isStochasticRequirement(
  requirement
) {
  return (
    requirement?.stochastic ===
      true ||
    requirement?.deterministic ===
      false
  )
}

// --------------------------------------------------
// Shared Candy resources
//
// Rare Candy and Rare Candy XL are intentionally
// treated as optional conversion resources.
//
// They do NOT:
// - automatically satisfy family Candy requirements
// - change Blocked into Affordable
// - get deducted here
//
// They only provide useful context about whether
// a known Candy shortfall could potentially be
// covered by a shared resource.
// --------------------------------------------------

function getSharedCandyResourceInfo(
  resource,
  playerResources
) {
  if (
    resource ===
    'CANDY'
  ) {
    const owned =
      playerResources
        ?.rareCandy

    return {
      resource:
        'RARE_CANDY',

      label:
        'Rare Candy',

      balanceKey:
        'rareCandy',

      owned:
        Number.isFinite(
          owned
        )
          ? owned
          : null,

      known:
        Number.isFinite(
          owned
        ),
    }
  }

  if (
    resource ===
    'CANDY_XL'
  ) {
    const owned =
      playerResources
        ?.rareCandyXl

    return {
      resource:
        'RARE_CANDY_XL',

      label:
        'Rare Candy XL',

      balanceKey:
        'rareCandyXl',

      owned:
        Number.isFinite(
          owned
        )
          ? owned
          : null,

      known:
        Number.isFinite(
          owned
        ),
    }
  }

  return null
}

function buildSharedCandySupport({
  resource,
  missing,
  playerResources,
}) {
  if (
    !Number.isFinite(
      missing
    ) ||
    missing <= 0
  ) {
    return null
  }

  const sharedResource =
    getSharedCandyResourceInfo(
      resource,
      playerResources
    )

  if (!sharedResource) {
    return null
  }

  if (
    sharedResource.known !==
    true
  ) {
    return {
      ...sharedResource,

      shortfall:
        missing,

      usableAmount:
        null,

      canFullyCover:
        null,

      canPartiallyCover:
        null,
    }
  }

  const usableAmount =
    Math.min(
      sharedResource.owned,
      missing
    )

  return {
    ...sharedResource,

    shortfall:
      missing,

    usableAmount,

    canFullyCover:
      sharedResource.owned >=
      missing,

    canPartiallyCover:
      sharedResource.owned >
        0 &&
      sharedResource.owned <
        missing,
  }
}

// --------------------------------------------------
// Candy-family balances
//
// Expected shape:
//
// {
//   FAMILY_ABRA: {
//     candy: 173,
//     candyXL: null,
//     updatedAt: '...'
//   }
// }
//
// These are last-known snapshots, not live
// synchronized Pokémon GO inventory values.
// --------------------------------------------------

function getCandyFamilyBalance(
  requirement,
  candyFamilyBalances
) {
  const candyFamilyId =
    requirement
      ?.candyFamilyId ??
    null

  if (!candyFamilyId) {
    return {
      candyFamilyId:
        null,

      candyFamilyName:
        requirement
          ?.candyFamilyName ??
        null,

      balanceKey:
        null,

      owned:
        null,

      known:
        false,

      reason:
        'CANDY_FAMILY_UNKNOWN',
    }
  }

  const familyBalance =
    candyFamilyBalances
      ?.[candyFamilyId]

  const balanceKey =
    requirement
      ?.resource ===
      'CANDY_XL'
      ? 'candyXL'
      : 'candy'

  const owned =
    familyBalance
      ?.[balanceKey]

  return {
    candyFamilyId,

    candyFamilyName:
      requirement
        ?.candyFamilyName ??
      null,

    balanceKey,

    owned:
      Number.isFinite(
        owned
      )
        ? owned
        : null,

    known:
      Number.isFinite(
        owned
      ),

    updatedAt:
      familyBalance
        ?.updatedAt ??
      null,

    reason:
      Number.isFinite(
        owned
      )
        ? null
        : 'CANDY_BALANCE_UNKNOWN',
  }
}

function evaluateCandyRequirement(
  requirement,
  playerResources,
  candyFamilyBalances
) {
  const resource =
    requirement.resource

  const label =
    getResourceLabel(
      requirement
    )

  const exactRequired =
    getExactRequiredQuantity(
      requirement
    )

  const minimumRequired =
    getMinimumRequiredQuantity(
      requirement
    )

  const stochastic =
    isStochasticRequirement(
      requirement
    )

  const family =
    getCandyFamilyBalance(
      requirement,
      candyFamilyBalances
    )

  const sharedCandyResource =
    getSharedCandyResourceInfo(
      resource,
      playerResources
    )

  if (
    !family.candyFamilyId
  ) {
    return {
      resource,

      label,

      candyFamilyId:
        null,

      candyFamilyName:
        family
          .candyFamilyName,

      balanceKey:
        family.balanceKey,

      status:
        RESOURCE_ACTIONABILITY_STATUS
          .UNKNOWN,

      owned:
        null,

      required:
        exactRequired,

      minimumRequired,

      stochastic,

      updatedAt:
        null,

      sharedCandyResource,

      sharedCandySupport:
        null,

      reason:
        'CANDY_FAMILY_UNKNOWN',
    }
  }

  if (
    family.known !==
    true
  ) {
    return {
      resource,

      label,

      candyFamilyId:
        family.candyFamilyId,

      candyFamilyName:
        family.candyFamilyName,

      balanceKey:
        family.balanceKey,

      status:
        RESOURCE_ACTIONABILITY_STATUS
          .NEEDS_CANDY_CHECK,

      owned:
        null,

      required:
        exactRequired,

      minimumRequired,

      stochastic,

      updatedAt:
        family.updatedAt,

      sharedCandyResource,

      sharedCandySupport:
        null,

      reason:
        resource ===
          'CANDY_XL'
          ? 'CANDY_XL_BALANCE_UNKNOWN'
          : 'CANDY_BALANCE_UNKNOWN',
    }
  }

  if (
    Number.isFinite(
      exactRequired
    )
  ) {
    if (
      family.owned <
      exactRequired
    ) {
      const missing =
        exactRequired -
        family.owned

      return {
        resource,

        label,

        candyFamilyId:
          family.candyFamilyId,

        candyFamilyName:
          family.candyFamilyName,

        balanceKey:
          family.balanceKey,

        status:
          RESOURCE_ACTIONABILITY_STATUS
            .BLOCKED,

        owned:
          family.owned,

        required:
          exactRequired,

        minimumRequired:
          exactRequired,

        missing,

        stochastic,

        updatedAt:
          family.updatedAt,

        sharedCandyResource,

        sharedCandySupport:
          buildSharedCandySupport({
            resource,
            missing,
            playerResources,
          }),

        reason:
          'INSUFFICIENT_CANDY_BALANCE',
      }
    }

    return {
      resource,

      label,

      candyFamilyId:
        family.candyFamilyId,

      candyFamilyName:
        family.candyFamilyName,

      balanceKey:
        family.balanceKey,

      status:
        RESOURCE_ACTIONABILITY_STATUS
          .AFFORDABLE,

      owned:
        family.owned,

      required:
        exactRequired,

      minimumRequired:
        exactRequired,

      missing:
        0,

      stochastic,

      updatedAt:
        family.updatedAt,

      sharedCandyResource,

      sharedCandySupport:
        null,

      reason:
        null,
    }
  }

  if (
    Number.isFinite(
      minimumRequired
    )
  ) {
    if (
      family.owned <
      minimumRequired
    ) {
      const missing =
        minimumRequired -
        family.owned

      return {
        resource,

        label,

        candyFamilyId:
          family.candyFamilyId,

        candyFamilyName:
          family.candyFamilyName,

        balanceKey:
          family.balanceKey,

        status:
          RESOURCE_ACTIONABILITY_STATUS
            .BLOCKED,

        owned:
          family.owned,

        required:
          null,

        minimumRequired,

        missing,

        stochastic,

        updatedAt:
          family.updatedAt,

        sharedCandyResource,

        sharedCandySupport:
          buildSharedCandySupport({
            resource,
            missing,
            playerResources,
          }),

        reason:
          'BELOW_MINIMUM_CANDY_REQUIREMENT',
      }
    }

    if (stochastic) {
      return {
        resource,

        label,

        candyFamilyId:
          family.candyFamilyId,

        candyFamilyName:
          family.candyFamilyName,

        balanceKey:
          family.balanceKey,

        status:
          RESOURCE_ACTIONABILITY_STATUS
            .ATTEMPTABLE,

        owned:
          family.owned,

        required:
          null,

        minimumRequired,

        missing:
          0,

        stochastic:
          true,

        updatedAt:
          family.updatedAt,

        sharedCandyResource,

        sharedCandySupport:
          null,

        reason:
          'STOCHASTIC_COST',
      }
    }

    return {
      resource,

      label,

      candyFamilyId:
        family.candyFamilyId,

      candyFamilyName:
        family.candyFamilyName,

      balanceKey:
        family.balanceKey,

      status:
        RESOURCE_ACTIONABILITY_STATUS
          .UNKNOWN,

      owned:
        family.owned,

      required:
        null,

      minimumRequired,

      stochastic,

      updatedAt:
        family.updatedAt,

      sharedCandyResource,

      sharedCandySupport:
        null,

      reason:
        'EXACT_REQUIREMENT_UNKNOWN',
    }
  }

  return {
    resource,

    label,

    candyFamilyId:
      family.candyFamilyId,

    candyFamilyName:
      family.candyFamilyName,

    balanceKey:
      family.balanceKey,

    status:
      RESOURCE_ACTIONABILITY_STATUS
        .UNKNOWN,

    owned:
      family.owned,

    required:
      null,

    minimumRequired:
      null,

    missing:
      null,

    stochastic,

    updatedAt:
      family.updatedAt,

    sharedCandyResource,

    sharedCandySupport:
      null,

    reason:
      'REQUIRED_QUANTITY_UNKNOWN',
  }
}

// --------------------------------------------------
// Globally tracked resources
// --------------------------------------------------

function evaluateTrackedRequirement(
  requirement,
  playerResources
) {
  const resource =
    requirement?.resource

  const resourceKey =
    RESOURCE_BALANCE_KEYS[
      resource
    ]

  const label =
    getResourceLabel(
      requirement
    )

  const exactRequired =
    getExactRequiredQuantity(
      requirement
    )

  const minimumRequired =
    getMinimumRequiredQuantity(
      requirement
    )

  const stochastic =
    isStochasticRequirement(
      requirement
    )

  const owned =
    resourceKey
      ? playerResources
          ?.[resourceKey]
      : null

  if (!resourceKey) {
    return {
      resource,

      label,

      status:
        RESOURCE_ACTIONABILITY_STATUS
          .UNKNOWN,

      owned:
        null,

      required:
        exactRequired,

      minimumRequired,

      stochastic,

      reason:
        'RESOURCE_NOT_TRACKED',
    }
  }

  if (
    !Number.isFinite(
      owned
    )
  ) {
    return {
      resource,

      label,

      resourceKey,

      status:
        RESOURCE_ACTIONABILITY_STATUS
          .UNKNOWN,

      owned:
        null,

      required:
        exactRequired,

      minimumRequired,

      stochastic,

      reason:
        'PLAYER_BALANCE_UNKNOWN',
    }
  }

  if (
    Number.isFinite(
      exactRequired
    )
  ) {
    if (
      owned <
      exactRequired
    ) {
      return {
        resource,

        label,

        resourceKey,

        status:
          RESOURCE_ACTIONABILITY_STATUS
            .BLOCKED,

        owned,

        required:
          exactRequired,

        minimumRequired:
          exactRequired,

        missing:
          exactRequired -
          owned,

        stochastic,

        reason:
          'INSUFFICIENT_BALANCE',
      }
    }

    return {
      resource,

      label,

      resourceKey,

      status:
        RESOURCE_ACTIONABILITY_STATUS
          .AFFORDABLE,

      owned,

      required:
        exactRequired,

      minimumRequired:
        exactRequired,

      missing:
        0,

      stochastic,

      reason:
        null,
    }
  }

  if (
    Number.isFinite(
      minimumRequired
    )
  ) {
    if (
      owned <
      minimumRequired
    ) {
      return {
        resource,

        label,

        resourceKey,

        status:
          RESOURCE_ACTIONABILITY_STATUS
            .BLOCKED,

        owned,

        required:
          null,

        minimumRequired,

        missing:
          minimumRequired -
          owned,

        stochastic,

        reason:
          'BELOW_MINIMUM_REQUIREMENT',
      }
    }

    if (stochastic) {
      return {
        resource,

        label,

        resourceKey,

        status:
          RESOURCE_ACTIONABILITY_STATUS
            .ATTEMPTABLE,

        owned,

        required:
          null,

        minimumRequired,

        missing:
          0,

        stochastic:
          true,

        reason:
          'STOCHASTIC_COST',
      }
    }

    return {
      resource,

      label,

      resourceKey,

      status:
        RESOURCE_ACTIONABILITY_STATUS
          .UNKNOWN,

      owned,

      required:
        null,

      minimumRequired,

      stochastic,

      reason:
        'EXACT_REQUIREMENT_UNKNOWN',
    }
  }

  return {
    resource,

    label,

    resourceKey,

    status:
      RESOURCE_ACTIONABILITY_STATUS
        .UNKNOWN,

    owned,

    required:
      null,

    minimumRequired:
      null,

    missing:
      null,

    stochastic,

    reason:
      'REQUIRED_QUANTITY_UNKNOWN',
  }
}

// --------------------------------------------------
// Requirement evaluation
// --------------------------------------------------

function evaluateRequirement(
  requirement,
  playerResources,
  candyFamilyBalances
) {
  if (
    !requirement
      ?.resource
  ) {
    return null
  }

  const resource =
    requirement.resource

  if (
    resource ===
      'CANDY' ||
    resource ===
      'CANDY_XL'
  ) {
    return evaluateCandyRequirement(
      requirement,
      playerResources,
      candyFamilyBalances
    )
  }

  if (
    resource ===
      'SECOND_CHARGED_MOVE_UNLOCK'
  ) {
    return {
      resource,

      label:
        getResourceLabel(
          requirement
        ),

      status:
        RESOURCE_ACTIONABILITY_STATUS
          .UNKNOWN,

      owned:
        null,

      required:
        getExactRequiredQuantity(
          requirement
        ),

      minimumRequired:
        getMinimumRequiredQuantity(
          requirement
        ),

      stochastic:
        isStochasticRequirement(
          requirement
        ),

      reason:
        'ACTION_REQUIREMENT',
    }
  }

  if (
    resource ===
      'SPECIAL_ACQUISITION'
  ) {
    return {
      resource,

      label:
        getResourceLabel(
          requirement
        ),

      status:
        RESOURCE_ACTIONABILITY_STATUS
          .UNKNOWN,

      owned:
        null,

      required:
        getExactRequiredQuantity(
          requirement
        ),

      minimumRequired:
        getMinimumRequiredQuantity(
          requirement
        ),

      stochastic:
        isStochasticRequirement(
          requirement
        ),

      reason:
        'SPECIAL_ACQUISITION_REQUIRED',
    }
  }

  return evaluateTrackedRequirement(
    requirement,
    playerResources
  )
}

// --------------------------------------------------
// Shared Candy explanatory text
// --------------------------------------------------

function buildSharedCandySupportText(
  evaluation
) {
  const support =
    evaluation
      ?.sharedCandySupport

  if (!support) {
    return null
  }

  if (
    support.known !==
    true
  ) {
    return null
  }

  if (
    support.owned <=
    0
  ) {
    return null
  }

  if (
    support.canFullyCover ===
    true
  ) {
    return (
      `You have ${support.owned.toLocaleString(
        'en-CA'
      )} ${support.label}; ${support.shortfall.toLocaleString(
        'en-CA'
      )} could cover this shortfall.`
    )
  }

  if (
    support.canPartiallyCover ===
      true &&
    Number.isFinite(
      support.usableAmount
    )
  ) {
    return (
      `You have ${support.owned.toLocaleString(
        'en-CA'
      )} ${support.label}, which could cover ${support.usableAmount.toLocaleString(
        'en-CA'
      )} of the ${support.shortfall.toLocaleString(
        'en-CA'
      )} missing ${evaluation.label}.`
    )
  }

  return null
}

// --------------------------------------------------
// Summary
// --------------------------------------------------

function buildCandyCheckSummary(
  evaluations
) {
  const candyCheck =
    evaluations.find(
      (evaluation) =>
        evaluation?.status ===
        RESOURCE_ACTIONABILITY_STATUS
          .NEEDS_CANDY_CHECK
    )

  if (!candyCheck) {
    return (
      'Check your current Pokémon Candy balance to confirm this investment.'
    )
  }

  const required =
    Number.isFinite(
      candyCheck.required
    )
      ? candyCheck.required
      : candyCheck
          .minimumRequired

  if (
    Number.isFinite(
      required
    )
  ) {
    return (
      `Requires ${required.toLocaleString(
        'en-CA'
      )} ${candyCheck.label}. Enter your current balance to check affordability.`
    )
  }

  return (
    `Enter your current ${candyCheck.label} balance to check affordability.`
  )
}

function buildSummary(
  status,
  evaluations
) {
  if (
    status ===
      RESOURCE_ACTIONABILITY_STATUS
        .BLOCKED
  ) {
    const blocked =
      evaluations.find(
        (evaluation) =>
          evaluation?.status ===
          RESOURCE_ACTIONABILITY_STATUS
            .BLOCKED
      )

    if (blocked) {
      let primaryText

      if (
        Number.isFinite(
          blocked.missing
        )
      ) {
        primaryText =
          `Missing ${blocked.missing.toLocaleString(
            'en-CA'
          )} ${blocked.label}.`
      } else {
        primaryText =
          `Not enough ${blocked.label}.`
      }

      const sharedCandyText =
        buildSharedCandySupportText(
          blocked
        )

      if (
        sharedCandyText
      ) {
        return (
          `${primaryText} ${sharedCandyText}`
        )
      }

      return primaryText
    }

    return (
      'This investment is currently blocked by your resources.'
    )
  }

  if (
    status ===
      RESOURCE_ACTIONABILITY_STATUS
        .UNKNOWN
  ) {
    const unknownBalance =
      evaluations.find(
        (evaluation) =>
          evaluation?.reason ===
            'PLAYER_BALANCE_UNKNOWN'
      )

    if (
      unknownBalance
    ) {
      return (
        `${unknownBalance.label} balance is unknown.`
      )
    }

    const unknownCandyFamily =
      evaluations.find(
        (evaluation) =>
          evaluation?.reason ===
            'CANDY_FAMILY_UNKNOWN'
      )

    if (
      unknownCandyFamily
    ) {
      return (
        'PokeIQ could not identify the Candy family for this requirement.'
      )
    }

    const uncertainQuantity =
      evaluations.find(
        (evaluation) =>
          evaluation?.reason ===
            'EXACT_REQUIREMENT_UNKNOWN' ||
          evaluation?.reason ===
            'REQUIRED_QUANTITY_UNKNOWN'
      )

    if (
      uncertainQuantity
    ) {
      return (
        `The exact ${uncertainQuantity.label} requirement is uncertain.`
      )
    }

    const specialRequirement =
      evaluations.find(
        (evaluation) =>
          evaluation?.reason ===
            'SPECIAL_ACQUISITION_REQUIRED'
      )

    if (
      specialRequirement
    ) {
      return (
        'A special acquisition requirement still needs to be resolved.'
      )
    }

    return (
      'PokeIQ does not have enough resource information to confirm affordability.'
    )
  }

  if (
    status ===
      RESOURCE_ACTIONABILITY_STATUS
        .NEEDS_CANDY_CHECK
  ) {
    return buildCandyCheckSummary(
      evaluations
    )
  }

  if (
    status ===
      RESOURCE_ACTIONABILITY_STATUS
        .ATTEMPTABLE
  ) {
    const attemptable =
      evaluations.find(
        (evaluation) =>
          evaluation?.status ===
          RESOURCE_ACTIONABILITY_STATUS
            .ATTEMPTABLE
      )

    if (attemptable) {
      return (
        `You have enough ${attemptable.label}s to attempt this change, but the exact number needed depends on rerolls.`
      )
    }

    return (
      'You have enough resources to begin this investment, but the final cost is uncertain.'
    )
  }

  return (
    'You have enough of every currently tracked required resource.'
  )
}

// --------------------------------------------------
// Public API
// --------------------------------------------------

export function evaluateResourceActionability(
  resourceRequirements,
  playerResources,
  candyFamilyBalances = {}
) {
  if (
    !Array.isArray(
      resourceRequirements
    ) ||
    resourceRequirements
      .length ===
      0
  ) {
    return {
      status:
        RESOURCE_ACTIONABILITY_STATUS
          .AFFORDABLE,

      label:
        'Affordable',

      summary:
        'No additional modeled resources are required.',

      requirementCount:
        0,

      knownRequirementCount:
        0,

      affordableRequirementCount:
        0,

      attemptableRequirementCount:
        0,

      candyCheckRequirementCount:
        0,

      blockedRequirementCount:
        0,

      unknownRequirementCount:
        0,

      candyChecks: [],

      sharedCandyOpportunities: [],

      evaluations: [],
    }
  }

  const evaluations =
    resourceRequirements
      .map(
        (requirement) =>
          evaluateRequirement(
            requirement,
            playerResources,
            candyFamilyBalances
          )
      )
      .filter(
        Boolean
      )

  const blockedRequirementCount =
    evaluations.filter(
      (evaluation) =>
        evaluation.status ===
        RESOURCE_ACTIONABILITY_STATUS
          .BLOCKED
    ).length

  const unknownRequirementCount =
    evaluations.filter(
      (evaluation) =>
        evaluation.status ===
        RESOURCE_ACTIONABILITY_STATUS
          .UNKNOWN
    ).length

  const candyCheckRequirementCount =
    evaluations.filter(
      (evaluation) =>
        evaluation.status ===
        RESOURCE_ACTIONABILITY_STATUS
          .NEEDS_CANDY_CHECK
    ).length

  const attemptableRequirementCount =
    evaluations.filter(
      (evaluation) =>
        evaluation.status ===
        RESOURCE_ACTIONABILITY_STATUS
          .ATTEMPTABLE
    ).length

  const affordableRequirementCount =
    evaluations.filter(
      (evaluation) =>
        evaluation.status ===
        RESOURCE_ACTIONABILITY_STATUS
          .AFFORDABLE
    ).length

  let status

  if (
    blockedRequirementCount >
    0
  ) {
    status =
      RESOURCE_ACTIONABILITY_STATUS
        .BLOCKED
  } else if (
    unknownRequirementCount >
    0
  ) {
    status =
      RESOURCE_ACTIONABILITY_STATUS
        .UNKNOWN
  } else if (
    candyCheckRequirementCount >
    0
  ) {
    status =
      RESOURCE_ACTIONABILITY_STATUS
        .NEEDS_CANDY_CHECK
  } else if (
    attemptableRequirementCount >
    0
  ) {
    status =
      RESOURCE_ACTIONABILITY_STATUS
        .ATTEMPTABLE
  } else {
    status =
      RESOURCE_ACTIONABILITY_STATUS
        .AFFORDABLE
  }

  const labels = {
    AFFORDABLE:
      'Affordable',

    ATTEMPTABLE:
      'Can Attempt',

    NEEDS_CANDY_CHECK:
      'Needs Candy Check',

    BLOCKED:
      'Blocked',

    UNKNOWN:
      'Unknown',
  }

  const candyChecks =
    evaluations
      .filter(
        (evaluation) =>
          evaluation.status ===
          RESOURCE_ACTIONABILITY_STATUS
            .NEEDS_CANDY_CHECK
      )
      .map(
        (evaluation) => ({
          resource:
            evaluation.resource,

          candyFamilyId:
            evaluation
              .candyFamilyId,

          candyFamilyName:
            evaluation
              .candyFamilyName,

          balanceKey:
            evaluation
              .balanceKey,

          label:
            evaluation.label,

          required:
            evaluation.required,

          minimumRequired:
            evaluation
              .minimumRequired,

          updatedAt:
            evaluation
              .updatedAt ??
            null,
        })
      )

  const sharedCandyOpportunities =
    evaluations
      .filter(
        (evaluation) =>
          evaluation
            ?.sharedCandySupport &&
          evaluation
            .sharedCandySupport
            .known ===
            true &&
          evaluation
            .sharedCandySupport
            .owned >
            0
      )
      .map(
        (evaluation) => ({
          resource:
            evaluation.resource,

          candyFamilyId:
            evaluation
              .candyFamilyId,

          candyFamilyName:
            evaluation
              .candyFamilyName,

          candyLabel:
            evaluation.label,

          candyOwned:
            evaluation.owned,

          candyMissing:
            evaluation.missing,

          sharedResource:
            evaluation
              .sharedCandySupport
              .resource,

          sharedResourceLabel:
            evaluation
              .sharedCandySupport
              .label,

          sharedResourceOwned:
            evaluation
              .sharedCandySupport
              .owned,

          usableAmount:
            evaluation
              .sharedCandySupport
              .usableAmount,

          canFullyCover:
            evaluation
              .sharedCandySupport
              .canFullyCover,

          canPartiallyCover:
            evaluation
              .sharedCandySupport
              .canPartiallyCover,
        })
      )

  return {
    status,

    label:
      labels[status] ??
      'Unknown',

    summary:
      buildSummary(
        status,
        evaluations
      ),

    requirementCount:
      evaluations.length,

    knownRequirementCount:
      affordableRequirementCount +
      attemptableRequirementCount +
      blockedRequirementCount,

    affordableRequirementCount,

    attemptableRequirementCount,

    candyCheckRequirementCount,

    blockedRequirementCount,

    unknownRequirementCount,

    candyChecks,

    sharedCandyOpportunities,

    evaluations,
  }
}