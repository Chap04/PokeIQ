// --------------------------------------------------
// PokeIQ Raid Project Plan V2.1
//
// Builds a LIVE, account-aware investment plan for one
// Pokémon Project.
//
// Project:
//
//   "I have decided to invest in this exact Pokémon."
//
// Project Plan:
//
//   "Given my account RIGHT NOW, what further
//    investment in this Pokémon is actually justified?"
//
// Sources:
//
// Raid Investment
//      ↓
// All actionable opportunities for this collectionId
//      ↓
// Existing Raid quality gate
//      ↓
// 18-Type Account Impact
//      ↓
// Conflict / redundancy resolution
//      ↓
// Recommended Now
// Future Investment
// Not Currently Justified
//
// IMPORTANT:
//
// - The Project itself remains persistent.
// - The investment plan is always derived live.
// - Account impact is based on the exact resulting
//   possible state.
// - Rare Candy never silently satisfies family Candy.
// - Boss-specific value is never used.
// --------------------------------------------------

export const RAID_PROJECT_PLAN_STATUS = {
  SUCCESS:
    'SUCCESS',

  INVALID_PROJECT:
    'INVALID_PROJECT',

  RAID_DATA_UNAVAILABLE:
    'RAID_DATA_UNAVAILABLE',

  COLLECTION_ENTRY_NOT_FOUND:
    'COLLECTION_ENTRY_NOT_FOUND',
}

export const RAID_PROJECT_PLAN_SECTION = {
  RECOMMENDED_NOW:
    'RECOMMENDED_NOW',

  FUTURE_INVESTMENT:
    'FUTURE_INVESTMENT',

  NOT_CURRENTLY_JUSTIFIED:
    'NOT_CURRENTLY_JUSTIFIED',
}

export const RAID_PROJECT_JUSTIFICATION = {
  JUSTIFIED:
    'JUSTIFIED',

  PREMIUM_JUSTIFIED:
    'PREMIUM_JUSTIFIED',

  ACCOUNT_IMPACT_UNKNOWN:
    'ACCOUNT_IMPACT_UNKNOWN',

  NO_ACCOUNT_IMPROVEMENT:
    'NO_ACCOUNT_IMPROVEMENT',

  ACCOUNT_REGRESSION:
    'ACCOUNT_REGRESSION',

  PREMIUM_IMPACT_TOO_SMALL:
    'PREMIUM_IMPACT_TOO_SMALL',
}

// --------------------------------------------------
// Project-plan policy
//
// These thresholds are intentionally centralized and
// explicit.
//
// They are product policy, not Raid-engine mechanics.
//
// The account-wide profile is an equal-weight average
// across the 18 attacking types, so a seemingly small
// overall percentage can still represent a meaningful
// improvement to one or more type teams.
// --------------------------------------------------

export const RAID_PROJECT_POLICY = {
  MIN_RECOMMENDED_RAID_STRENGTH:
    50,

  PREMIUM_MIN_OVERALL_PERCENT:
    0.25,

  PREMIUM_MIN_BIGGEST_TYPE_PERCENT:
    2.5,

  PREMIUM_MIN_IMPROVED_TYPES:
    2,
}

// --------------------------------------------------
// Generic helpers
// --------------------------------------------------

function formatEnum(
  value
) {
  if (!value) {
    return 'Unknown'
  }

  return String(value)
    .replace(
      /_/g,
      ' '
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      character =>
        character.toUpperCase()
    )
}

function formatMoveName(
  moveId
) {
  if (!moveId) {
    return 'Unknown Move'
  }

  return String(moveId)
    .replace(
      /_FAST$/,
      ''
    )
    .replace(
      /_/g,
      ' '
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      character =>
        character.toUpperCase()
    )
}

function getFirstFinite(
  ...values
) {
  return (
    values.find(
      value =>
        Number.isFinite(
          value
        )
    ) ??
    null
  )
}

function finiteOrFallback(
  value,
  fallback = 0
) {
  return Number.isFinite(
    value
  )
    ? value
    : fallback
}

// --------------------------------------------------
// Opportunity access
// --------------------------------------------------

function getActions(
  opportunity
) {
  const actions =
    opportunity
      ?.actions ??
    opportunity
      ?.assessment
      ?.actions ??
    opportunity
      ?.evidence
      ?.actions ??
    opportunity
      ?.possibleState
      ?.actions ??
    null

  if (
    Array.isArray(
      actions
    ) &&
    actions.length > 0
  ) {
    return actions
  }

  const action =
    opportunity
      ?.action ??
    opportunity
      ?.assessment
      ?.action ??
    opportunity
      ?.possibleState
      ?.action ??
    null

  return action
    ? [action]
    : []
}

function getPrimaryAction(
  opportunity
) {
  return (
    getActions(
      opportunity
    )[0] ??
    null
  )
}

function getPossibleStateType(
  opportunity
) {
  return (
    opportunity
      ?.possibleStateType ??
    opportunity
      ?.possibleState
      ?.type ??
    null
  )
}

function getDestinationCertainty(
  opportunity
) {
  return (
    opportunity
      ?.destinationCertainty ??
    opportunity
      ?.assessment
      ?.destinationCertainty ??
    opportunity
      ?.evidence
      ?.destinationCertainty ??
    opportunity
      ?.possibleState
      ?.destinationCertainty ??
    'UNKNOWN'
  )
}

function getChanges(
  opportunity
) {
  return (
    opportunity
      ?.changes ??
    opportunity
      ?.assessment
      ?.changes ??
    opportunity
      ?.possibleState
      ?.changes ??
    null
  )
}

function getRaidStrengthScore(
  opportunity
) {
  const raidStrength =
    opportunity
      ?.raidStrength

  return getFirstFinite(
    raidStrength
      ?.bestOverallStrengthScore,

    raidStrength
      ?.bestStrengthScore
  )
}

function getPerformance(
  opportunity
) {
  return (
    opportunity
      ?.assessment
      ?.performance ??
    opportunity
      ?.performanceClassification ??
    null
  )
}

function getMedianGain(
  opportunity
) {
  return getFirstFinite(
    opportunity
      ?.medianPercentGain,

    opportunity
      ?.assessment
      ?.performanceEvidence
      ?.medianPercentGain,

    opportunity
      ?.assessment
      ?.medianPercentGain,

    opportunity
      ?.evidence
      ?.medianPercentGain
  )
}

function getImprovementRate(
  opportunity
) {
  return getFirstFinite(
    opportunity
      ?.improvementRate,

    opportunity
      ?.assessment
      ?.performanceEvidence
      ?.improvementRate,

    opportunity
      ?.assessment
      ?.improvementRate,

    opportunity
      ?.evidence
      ?.improvementRate
  )
}

// --------------------------------------------------
// Base Raid-quality gate
//
// This preserves the same deliberate >50 floor already
// used by the Dashboard.
//
// Account impact comes AFTER this mechanical Raid
// quality gate.
// --------------------------------------------------

function isBaseWorthwhileOpportunity(
  opportunity
) {
  if (!opportunity) {
    return false
  }

  if (
    opportunity
      ?.reachable ===
      false
  ) {
    return false
  }

  if (
    opportunity
      ?.destroysProtectedMove ===
      true
  ) {
    return false
  }

  if (
    getDestinationCertainty(
      opportunity
    ) ===
      'STOCHASTIC'
  ) {
    return false
  }

  const raidStrengthScore =
    getRaidStrengthScore(
      opportunity
    )

  if (
    !Number.isFinite(
      raidStrengthScore
    ) ||
    raidStrengthScore <=
      RAID_PROJECT_POLICY
        .MIN_RECOMMENDED_RAID_STRENGTH
  ) {
    return false
  }

  const performance =
    getPerformance(
      opportunity
    )

  return (
    performance ===
      'STRONG_IMPROVEMENT' ||
    performance ===
      'CONSISTENT_IMPROVEMENT'
  )
}

// --------------------------------------------------
// Opportunity classification
// --------------------------------------------------

function isPowerUpOpportunity(
  opportunity
) {
  if (
    getPossibleStateType(
      opportunity
    ) ===
      'POWER_UP'
  ) {
    return true
  }

  return getActions(
    opportunity
  ).some(
    action =>
      action?.type ===
        'POWER_UP'
  )
}

function isEvolutionOpportunity(
  opportunity
) {
  const stateType =
    getPossibleStateType(
      opportunity
    )

  if (
    stateType ===
      'EVOLUTION' ||
    stateType ===
      'EVOLUTION_MOVE_CHANGE'
  ) {
    return true
  }

  return getActions(
    opportunity
  ).some(
    action =>
      action?.type ===
        'EVOLVE'
  )
}

function isSecondMoveOpportunity(
  opportunity
) {
  return getActions(
    opportunity
  ).some(
    action =>
      action?.type ===
        'UNLOCK_SECOND_CHARGED_MOVE'
  )
}

function getMoveChange(
  opportunity
) {
  const changes =
    getChanges(
      opportunity
    )

  if (
    changes
      ?.chargedMove
  ) {
    return {
      moveType:
        'CHARGED',

      ...changes
        .chargedMove,
    }
  }

  if (
    changes
      ?.fastMove
  ) {
    return {
      moveType:
        'FAST',

      ...changes
        .fastMove,
    }
  }

  return null
}

// --------------------------------------------------
// Intent grouping
//
// Multiple raw opportunities can represent competing
// answers to the same player decision.
//
// Example:
//
// Teach Avalanche
// Teach High Horsepower
//
// to Charged Move slot 1.
//
// Projects must select one coherent destination rather
// than instructing the player to repeatedly TM the same
// slot.
// --------------------------------------------------

function getIntentKey(
  opportunity
) {
  if (
    isPowerUpOpportunity(
      opportunity
    )
  ) {
    return 'POWER_UP'
  }

  if (
    isEvolutionOpportunity(
      opportunity
    )
  ) {
    return 'EVOLUTION'
  }

  const moveChange =
    getMoveChange(
      opportunity
    )

  if (
    moveChange
      ?.moveType ===
      'FAST'
  ) {
    return 'FAST_MOVE'
  }

  if (
    moveChange
      ?.moveType ===
      'CHARGED'
  ) {
    return (
      `CHARGED_MOVE::${
        moveChange.slot ??
        'UNKNOWN'
      }`
    )
  }

  if (
    isSecondMoveOpportunity(
      opportunity
    )
  ) {
    return (
      'SECOND_CHARGED_MOVE'
    )
  }

  const action =
    getPrimaryAction(
      opportunity
    )

  return (
    action?.type ??
    getPossibleStateType(
      opportunity
    ) ??
    'OTHER'
  )
}

// --------------------------------------------------
// Power-up helpers
// --------------------------------------------------

function getPowerUpTargetLevel(
  opportunity
) {
  const action =
    getPrimaryAction(
      opportunity
    )

  const changes =
    getChanges(
      opportunity
    )

  return getFirstFinite(
    action
      ?.targetLevel,

    changes
      ?.level
      ?.to,

    opportunity
      ?.possibleState
      ?.combat
      ?.level,

    opportunity
      ?.powerUpContext
      ?.targetLevel
  )
}

function isPremiumPowerUp(
  opportunity
) {
  return (
    opportunity
      ?.powerUpContext
      ?.isPremiumOpportunity ===
    true
  )
}

function isOrdinaryStoppingPoint(
  opportunity
) {
  return (
    opportunity
      ?.powerUpContext
      ?.isOrdinaryStoppingPoint ===
    true
  )
}

// --------------------------------------------------
// Resource requirements
// --------------------------------------------------

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
  resource
) {
  return (
    RESOURCE_LABELS[
      resource
    ] ??
    formatEnum(
      resource
    )
  )
}

function normalizeCandyFamilyId(
  familyId
) {
  if (
    typeof familyId !==
      'string' ||
    familyId.trim().length ===
      0
  ) {
    return null
  }

  return familyId.trim()
}

function formatCandyFamilyName(
  familyId
) {
  const normalized =
    normalizeCandyFamilyId(
      familyId
    )

  if (!normalized) {
    return null
  }

  const token =
    normalized.replace(
      /^FAMILY_/,
      ''
    )

  return token
    ? formatEnum(
        token
      )
    : null
}

function getCandyFamilyId(
  entry,
  opportunity
) {
  const candidates = [
    opportunity
      ?.candyFamilyId,

    opportunity
      ?.possibleState
      ?.candidate
      ?.reference
      ?.familyId,

    opportunity
      ?.possibleState
      ?.reference
      ?.familyId,

    entry
      ?.candidate
      ?.reference
      ?.familyId,

    entry
      ?.currentState
      ?.candidate
      ?.reference
      ?.familyId,

    entry
      ?.currentState
      ?.reference
      ?.familyId,
  ]

  for (
    const candidate
    of candidates
  ) {
    const normalized =
      normalizeCandyFamilyId(
        candidate
      )

    if (normalized) {
      return normalized
    }
  }

  return null
}

function decorateCandyRequirement(
  requirement,
  candyFamilyId
) {
  if (
    requirement
      ?.resource !==
      'CANDY' &&
    requirement
      ?.resource !==
      'CANDY_XL'
  ) {
    return requirement
  }

  const familyId =
    normalizeCandyFamilyId(
      requirement
        ?.candyFamilyId ??
      candyFamilyId
    )

  const familyName =
    requirement
      ?.candyFamilyName ??
    formatCandyFamilyName(
      familyId
    )

  return {
    ...requirement,

    candyFamilyId:
      familyId,

    candyFamilyName:
      familyName,

    label:
      familyName
        ? (
            requirement
              .resource ===
            'CANDY_XL'
              ? `${familyName} Candy XL`
              : `${familyName} Candy`
          )
        : getResourceLabel(
            requirement
              .resource
          ),
  }
}

function normalizeRequirement(
  requirement,
  candyFamilyId
) {
  if (
    !requirement ||
    !requirement.resource
  ) {
    return null
  }

  const exactQuantity =
    Number.isFinite(
      requirement
        .exactQuantity
    )
      ? requirement
          .exactQuantity
      : Number.isFinite(
          requirement
            .quantity
        )
        ? requirement
            .quantity
        : null

  const minimumQuantity =
    Number.isFinite(
      requirement
        .minimumQuantity
    )
      ? requirement
          .minimumQuantity
      : exactQuantity

  return decorateCandyRequirement(
    {
      resource:
        requirement
          .resource,

      label:
        getResourceLabel(
          requirement
            .resource
        ),

      quantity:
        exactQuantity,

      minimumQuantity,

      exactQuantity,

      quantityKnown:
        exactQuantity !==
        null,

      exact:
        exactQuantity !==
        null,

      deterministic:
        requirement
          .deterministic ===
        true,

      stochastic:
        requirement
          .stochastic ===
        true,

      reason:
        requirement
          .reason ??
        null,
    },

    candyFamilyId
  )
}

function buildSummaryRequirements(
  cost,
  candyFamilyId
) {
  const summary =
    cost?.summary

  if (!summary) {
    return []
  }

  const resources = [
    {
      resource:
        'STARDUST',

      quantity:
        summary.stardust,
    },

    {
      resource:
        'CANDY',

      quantity:
        summary.candy,
    },

    {
      resource:
        'CANDY_XL',

      quantity:
        summary.candyXL,
    },
  ]

  return resources
    .filter(
      item =>
        Number.isFinite(
          item.quantity
        ) &&
        item.quantity > 0
    )
    .map(
      item =>
        decorateCandyRequirement(
          {
            resource:
              item.resource,

            label:
              getResourceLabel(
                item.resource
              ),

            quantity:
              item.quantity,

            minimumQuantity:
              item.quantity,

            exactQuantity:
              item.quantity,

            quantityKnown:
              true,

            exact:
              true,

            deterministic:
              true,

            stochastic:
              false,

            reason:
              null,
          },

          candyFamilyId
        )
    )
}

function buildPowerUpRequirements(
  opportunity,
  candyFamilyId
) {
  if (
    !isPowerUpOpportunity(
      opportunity
    )
  ) {
    return []
  }

  const cost =
    opportunity
      ?.powerUpContext
      ?.incrementalCost

  if (!cost) {
    return []
  }

  return [
    [
      'STARDUST',
      cost.stardust,
    ],

    [
      'CANDY',
      cost.candy,
    ],

    [
      'CANDY_XL',
      cost.candyXL,
    ],
  ]
    .filter(
      (
        [
          ,
          quantity,
        ]
      ) =>
        Number.isFinite(
          quantity
        ) &&
        quantity > 0
    )
    .map(
      (
        [
          resource,
          quantity,
        ]
      ) =>
        decorateCandyRequirement(
          {
            resource,

            label:
              getResourceLabel(
                resource
              ),

            quantity,

            minimumQuantity:
              quantity,

            exactQuantity:
              quantity,

            quantityKnown:
              true,

            exact:
              true,

            deterministic:
              true,

            stochastic:
              false,

            reason:
              null,
          },

          candyFamilyId
        )
    )
}

function mergeRequirements(
  requirements
) {
  const merged =
    new Map()

  for (
    const requirement
    of requirements
  ) {
    if (
      !requirement
        ?.resource
    ) {
      continue
    }

    const key =
      (
        requirement.resource ===
          'CANDY' ||
        requirement.resource ===
          'CANDY_XL'
      )
        ? (
            `${requirement.resource}::${requirement.candyFamilyId ?? 'UNKNOWN'}`
          )
        : requirement.resource

    const existing =
      merged.get(
        key
      )

    if (!existing) {
      merged.set(
        key,
        requirement
      )

      continue
    }

    const existingQuantity =
      getFirstFinite(
        existing
          .exactQuantity,

        existing.quantity,

        existing
          .minimumQuantity
      )

    const incomingQuantity =
      getFirstFinite(
        requirement
          .exactQuantity,

        requirement
          .quantity,

        requirement
          .minimumQuantity
      )

    if (
      Number.isFinite(
        incomingQuantity
      ) &&
      (
        !Number.isFinite(
          existingQuantity
        ) ||
        incomingQuantity >
          existingQuantity
      )
    ) {
      merged.set(
        key,
        requirement
      )
    }
  }

  return [
    ...merged.values(),
  ]
}

function buildResourceRequirements(
  entry,
  opportunity
) {
  const candyFamilyId =
    getCandyFamilyId(
      entry,
      opportunity
    )

  const cost =
    opportunity
      ?.cost ??
    opportunity
      ?.value
      ?.cost ??
    null

  const explicit =
    Array.isArray(
      cost?.requirements
    )
      ? cost.requirements
          .map(
            requirement =>
              normalizeRequirement(
                requirement,
                candyFamilyId
              )
          )
          .filter(Boolean)
      : []

  const summary =
    buildSummaryRequirements(
      cost,
      candyFamilyId
    )

  const powerUp =
    buildPowerUpRequirements(
      opportunity,
      candyFamilyId
    )

  return mergeRequirements([
    ...explicit,
    ...summary,
    ...powerUp,
  ])
}

function buildResourceSummary(
  requirements
) {
  if (
    !Array.isArray(
      requirements
    ) ||
    requirements.length ===
      0
  ) {
    return null
  }

  return requirements
    .map(
      requirement => {
        const quantity =
          getFirstFinite(
            requirement
              ?.quantity,

            requirement
              ?.minimumQuantity
          )

        if (
          Number.isFinite(
            quantity
          )
        ) {
          return (
            `${quantity.toLocaleString(
              'en-CA'
            )} ${requirement.label}`
          )
        }

        return (
          `${requirement.label} required`
        )
      }
    )
    .join(', ')
}

// --------------------------------------------------
// Premium detection
//
// A Project opportunity counts as premium when either:
//
// - Raid power-up intelligence explicitly marks it
//   premium, or
// - the exact resource requirements include Candy XL.
//
// This lets the account-justification policy remain
// conservative even if a future opportunity type uses
// XL without the existing powerUpContext flag.
// --------------------------------------------------

function opportunityUsesCandyXl({
  entry,
  opportunity,
}) {
  return buildResourceRequirements(
    entry,
    opportunity
  ).some(
    requirement =>
      requirement
        ?.resource ===
      'CANDY_XL'
  )
}

function isPremiumInvestment({
  entry,
  opportunity,
}) {
  return (
    isPremiumPowerUp(
      opportunity
    ) ||
    opportunityUsesCandyXl({
      entry,
      opportunity,
    })
  )
}

// --------------------------------------------------
// Account impact enrichment
//
// Production uses the same enrichment function as the
// Dashboard.
//
// An override is accepted for deterministic unit tests.
// --------------------------------------------------

function enrichOpportunityWithAccountImpact({
  entry,
  opportunity,
  currentProfile,
  accountImpactEnricher,
}) {
  const enriched =
    accountImpactEnricher({
      recommendation: {
        collectionId:
          entry.collectionId,

        opportunity,
      },

      currentProfile,
    })

  return {
    opportunity,

    accountImpact:
      enriched
        ?.accountImpact ??
      null,

    accountImpactSummary:
      enriched
        ?.accountImpactSummary ??
      null,

    accountImpactStatus:
      enriched
        ?.accountImpactStatus ??
      null,
  }
}

// --------------------------------------------------
// Account justification
// --------------------------------------------------

function getBiggestTypePercent(
  accountImpactSummary
) {
  return finiteOrFallback(
    accountImpactSummary
      ?.biggestImprovement
      ?.percentChange,

    0
  )
}

function classifyAccountJustification({
  accountImpactSummary,
  accountImpactStatus,
  premium,
}) {
  if (
    accountImpactStatus !==
      'SUCCESS' ||
    !accountImpactSummary
  ) {
    return {
      justified:
        false,

      classification:
        RAID_PROJECT_JUSTIFICATION
          .ACCOUNT_IMPACT_UNKNOWN,

      reason:
        'PokeIQ could not reliably measure how this investment changes your current raid account.',
    }
  }

  const pointChange =
    finiteOrFallback(
      accountImpactSummary
        .overallStrengthPointChange,
      0
    )

  const percentChange =
    finiteOrFallback(
      accountImpactSummary
        .overallStrengthPercentChange,
      0
    )

  const improvedTypeCount =
    finiteOrFallback(
      accountImpactSummary
        .improvedTypeCount,
      0
    )

  const regressedTypeCount =
    finiteOrFallback(
      accountImpactSummary
        .regressedTypeCount,
      0
    )

  const createsNewCoverage =
    accountImpactSummary
      ?.createsNewTypeCoverage ===
    true

  const biggestTypePercent =
    getBiggestTypePercent(
      accountImpactSummary
    )

  if (
    pointChange < 0 ||
    regressedTypeCount > 0
  ) {
    return {
      justified:
        false,

      classification:
        RAID_PROJECT_JUSTIFICATION
          .ACCOUNT_REGRESSION,

      reason:
        regressedTypeCount > 0
          ? (
              `This state would weaken ${regressedTypeCount} current attacking-type ${
                regressedTypeCount === 1
                  ? 'team'
                  : 'teams'
              }, so PokeIQ is not treating it as a durable account upgrade.`
            )
          : 'This investment would reduce overall raid account strength.',
    }
  }

  if (
    pointChange <= 0 ||
    improvedTypeCount <= 0
  ) {
    return {
      justified:
        false,

      classification:
        RAID_PROJECT_JUSTIFICATION
          .NO_ACCOUNT_IMPROVEMENT,

      reason:
        'This makes the Pokémon stronger in isolation, but it does not currently improve one of your 18 raid teams.',
    }
  }

  if (!premium) {
    return {
      justified:
        true,

      classification:
        RAID_PROJECT_JUSTIFICATION
          .JUSTIFIED,

      reason:
        'This investment produces a positive improvement to your current raid account.',
    }
  }

  const premiumJustified =
    createsNewCoverage ||
    improvedTypeCount >=
      RAID_PROJECT_POLICY
        .PREMIUM_MIN_IMPROVED_TYPES ||
    percentChange >=
      RAID_PROJECT_POLICY
        .PREMIUM_MIN_OVERALL_PERCENT ||
    biggestTypePercent >=
      RAID_PROJECT_POLICY
        .PREMIUM_MIN_BIGGEST_TYPE_PERCENT

  if (premiumJustified) {
    return {
      justified:
        true,

      classification:
        RAID_PROJECT_JUSTIFICATION
          .PREMIUM_JUSTIFIED,

      reason:
        createsNewCoverage
          ? 'This premium investment creates new raid-type coverage for your account.'
          : improvedTypeCount >=
              RAID_PROJECT_POLICY
                .PREMIUM_MIN_IMPROVED_TYPES
            ? (
                `This premium investment improves ${improvedTypeCount} attacking-type teams.`
              )
            : percentChange >=
                RAID_PROJECT_POLICY
                  .PREMIUM_MIN_OVERALL_PERCENT
              ? (
                  `This premium investment improves overall raid account strength by ${percentChange.toFixed(
                    2
                  )}%.`
                )
              : (
                  `Its strongest affected raid team improves by ${biggestTypePercent.toFixed(
                    2
                  )}%.`
                ),
    }
  }

  return {
    justified:
      false,

    classification:
      RAID_PROJECT_JUSTIFICATION
        .PREMIUM_IMPACT_TOO_SMALL,

    reason:
      'This premium investment improves the Pokémon, but its current account-level gain is too small to justify the resource commitment.',
  }
}

// --------------------------------------------------
// Account-aware opportunity comparator
//
// Used INSIDE one Project only.
//
// When multiple opportunities compete for the same
// intent, prefer:
//
// 1. justified investment
// 2. larger overall account improvement
// 3. larger account percentage improvement
// 4. more improved attacking types
// 5. larger best type-team gain
// 6. stronger resulting attacker
// 7. original Raid opportunity order
// --------------------------------------------------

function compareProjectOpportunities(
  first,
  second
) {
  if (
    first.justification
      .justified !==
    second.justification
      .justified
  ) {
    return first.justification
      .justified
      ? -1
      : 1
  }

  const firstSummary =
    first.accountImpactSummary

  const secondSummary =
    second.accountImpactSummary

  const pointDifference =
    finiteOrFallback(
      secondSummary
        ?.overallStrengthPointChange,
      Number.NEGATIVE_INFINITY
    ) -
    finiteOrFallback(
      firstSummary
        ?.overallStrengthPointChange,
      Number.NEGATIVE_INFINITY
    )

  if (
    pointDifference !==
    0
  ) {
    return pointDifference
  }

  const percentDifference =
    finiteOrFallback(
      secondSummary
        ?.overallStrengthPercentChange,
      Number.NEGATIVE_INFINITY
    ) -
    finiteOrFallback(
      firstSummary
        ?.overallStrengthPercentChange,
      Number.NEGATIVE_INFINITY
    )

  if (
    percentDifference !==
    0
  ) {
    return percentDifference
  }

  const typeDifference =
    finiteOrFallback(
      secondSummary
        ?.improvedTypeCount,
      0
    ) -
    finiteOrFallback(
      firstSummary
        ?.improvedTypeCount,
      0
    )

  if (
    typeDifference !==
    0
  ) {
    return typeDifference
  }

  const biggestDifference =
    getBiggestTypePercent(
      secondSummary
    ) -
    getBiggestTypePercent(
      firstSummary
    )

  if (
    biggestDifference !==
    0
  ) {
    return biggestDifference
  }

  const strengthDifference =
    finiteOrFallback(
      getRaidStrengthScore(
        second.opportunity
      ),
      Number.NEGATIVE_INFINITY
    ) -
    finiteOrFallback(
      getRaidStrengthScore(
        first.opportunity
      ),
      Number.NEGATIVE_INFINITY
    )

  if (
    strengthDifference !==
    0
  ) {
    return strengthDifference
  }

  return (
    finiteOrFallback(
      first.opportunity
        ?.originalIndex,
      Number.MAX_SAFE_INTEGER
    ) -
    finiteOrFallback(
      second.opportunity
        ?.originalIndex,
      Number.MAX_SAFE_INTEGER
    )
  )
}

// --------------------------------------------------
// Power-up selection
// --------------------------------------------------

function selectBest(
  opportunities
) {
  if (
    opportunities.length ===
    0
  ) {
    return null
  }

  return [
    ...opportunities,
  ].sort(
    compareProjectOpportunities
  )[0]
}

function selectPowerUpOpportunities(
  enrichedOpportunities
) {
  const powerUps =
    enrichedOpportunities.filter(
      item =>
        isPowerUpOpportunity(
          item.opportunity
        )
    )

  if (
    powerUps.length ===
      0
  ) {
    return []
  }

  const ordinaryStoppingPoints =
    powerUps.filter(
      item =>
        isOrdinaryStoppingPoint(
          item.opportunity
        )
    )

  const nonPremium =
    powerUps.filter(
      item =>
        item.premium !==
        true
    )

  const premium =
    powerUps.filter(
      item =>
        item.premium ===
        true
    )

  const ordinary =
    selectBest(
      ordinaryStoppingPoints
    ) ??
    selectBest(
      nonPremium
    )

  const premiumChoice =
    selectBest(
      premium
    )

  const selected = []

  if (ordinary) {
    selected.push(
      ordinary
    )
  }

  if (
    premiumChoice &&
    premiumChoice !==
      ordinary
  ) {
    selected.push(
      premiumChoice
    )
  }

  if (
    selected.length ===
      0
  ) {
    const fallback =
      selectBest(
        powerUps
      )

    if (fallback) {
      selected.push(
        fallback
      )
    }
  }

  return selected
}

// --------------------------------------------------
// Coherent plan selection
// --------------------------------------------------

function selectCoherentOpportunities(
  enrichedOpportunities
) {
  const selected =
    selectPowerUpOpportunities(
      enrichedOpportunities
    )

  const powerUpSet =
    new Set(
      selected
    )

  const nonPowerUps =
    enrichedOpportunities.filter(
      item =>
        !isPowerUpOpportunity(
          item.opportunity
        )
    )

  const groups =
    new Map()

  for (
    const item
    of nonPowerUps
  ) {
    const intentKey =
      getIntentKey(
        item.opportunity
      )

    if (
      !groups.has(
        intentKey
      )
    ) {
      groups.set(
        intentKey,
        []
      )
    }

    groups.get(
      intentKey
    ).push(
      item
    )
  }

  for (
    const group
    of groups.values()
  ) {
    const best =
      selectBest(
        group
      )

    if (best) {
      selected.push(
        best
      )
    }
  }

  // Keep selected power-ups and other intents in a
  // stable account-aware order.
  return selected
    .filter(
      item =>
        powerUpSet.has(
          item
        ) ||
        !isPowerUpOpportunity(
          item.opportunity
        )
    )
    .sort(
      compareProjectOpportunities
    )
}

// --------------------------------------------------
// Titles
// --------------------------------------------------

function getEvolutionTargetName(
  opportunity
) {
  const evolveAction =
    getActions(
      opportunity
    ).find(
      action =>
        action?.type ===
          'EVOLVE'
    )

  const possibleState =
    opportunity
      ?.possibleState

  const candidates = [
    evolveAction
      ?.toName,

    evolveAction
      ?.targetName,

    evolveAction
      ?.resultingName,

    evolveAction
      ?.target
      ?.name,

    possibleState
      ?.candidate
      ?.reference
      ?.name,

    possibleState
      ?.candidate
      ?.pokemon
      ?.name,

    possibleState
      ?.reference
      ?.name,

    possibleState
      ?.pokemon
      ?.name,
  ]

  return (
    candidates.find(
      value =>
        typeof value ===
          'string' &&
        value.trim().length >
          0
    ) ??
    null
  )
}

function buildTitle(
  opportunity
) {
  if (
    isPowerUpOpportunity(
      opportunity
    )
  ) {
    const level =
      getPowerUpTargetLevel(
        opportunity
      )

    return Number.isFinite(
      level
    )
      ? `Power up to Level ${level}`
      : 'Power up'
  }

  if (
    isEvolutionOpportunity(
      opportunity
    )
  ) {
    const targetName =
      getEvolutionTargetName(
        opportunity
      )

    return targetName
      ? `Evolve into ${targetName}`
      : 'Evolve Pokémon'
  }

  const moveChange =
    getMoveChange(
      opportunity
    )

  if (
    moveChange?.to
  ) {
    return (
      `Teach ${formatMoveName(
        moveChange.to
      )}`
    )
  }

  if (
    isSecondMoveOpportunity(
      opportunity
    )
  ) {
    return (
      'Unlock second Charged Move'
    )
  }

  const action =
    getPrimaryAction(
      opportunity
    )

  return formatEnum(
    action?.type ??
    getPossibleStateType(
      opportunity
    ) ??
    'Raid Investment'
  )
}

function buildActionPath(
  opportunity
) {
  return getActions(
    opportunity
  )
    .map(
      action => ({
        type:
          action?.type ??
          null,

        label:
          formatEnum(
            action?.type
          ),
      })
    )
    .filter(
      step =>
        Boolean(
          step.type
        )
    )
}

// --------------------------------------------------
// Final plan section
// --------------------------------------------------

function getPlanSection(
  item
) {
  if (
    !item
      ?.justification
      ?.justified
  ) {
    return (
      RAID_PROJECT_PLAN_SECTION
        .NOT_CURRENTLY_JUSTIFIED
    )
  }

  if (
    item.premium ===
      true
  ) {
    return (
      RAID_PROJECT_PLAN_SECTION
        .FUTURE_INVESTMENT
    )
  }

  return (
    RAID_PROJECT_PLAN_SECTION
      .RECOMMENDED_NOW
  )
}

// --------------------------------------------------
// Final item
// --------------------------------------------------

function buildPlanItem({
  entry,
  enrichedOpportunity,
  sourceIndex,
}) {
  const {
    opportunity,
    accountImpact,
    accountImpactSummary,
    accountImpactStatus,
    justification,
    premium,
  } =
    enrichedOpportunity

  const resources =
    buildResourceRequirements(
      entry,
      opportunity
    )

  const powerUp =
    isPowerUpOpportunity(
      opportunity
    )

  return {
    id:
      (
        `${entry.collectionId}::` +
        `${getIntentKey(
          opportunity
        )}::` +
        `${sourceIndex}`
      ),

    intentKey:
      getIntentKey(
        opportunity
      ),

    section:
      getPlanSection(
        enrichedOpportunity
      ),

    title:
      buildTitle(
        opportunity
      ),

    possibleStateType:
      getPossibleStateType(
        opportunity
      ),

    actionType:
      getPrimaryAction(
        opportunity
      )?.type ??
      null,

    actionPath:
      buildActionPath(
        opportunity
      ),

    moveChange:
      getMoveChange(
        opportunity
      ),

    isPowerUp:
      powerUp,

    targetLevel:
      powerUp
        ? getPowerUpTargetLevel(
            opportunity
          )
        : null,

    isEvolution:
      isEvolutionOpportunity(
        opportunity
      ),

    evolutionTargetName:
      isEvolutionOpportunity(
        opportunity
      )
        ? getEvolutionTargetName(
            opportunity
          )
        : null,

    isPremiumInvestment:
      premium,

    isOrdinaryStoppingPoint:
      isOrdinaryStoppingPoint(
        opportunity
      ),

    raidStrengthScore:
      getRaidStrengthScore(
        opportunity
      ),

    raidStrengthClassification:
      opportunity
        ?.raidStrength
        ?.bestClassification ??
      null,

    medianGain:
      getMedianGain(
        opportunity
      ),

    improvementRate:
      getImprovementRate(
        opportunity
      ),

    accountImpact,

    accountImpactSummary,

    accountImpactStatus,

    accountJustification:
      justification
        .classification,

    accountJustificationReason:
      justification.reason,

    accountJustified:
      justification
        .justified,

    resourceRequirements:
      resources,

    resourceSummary:
      buildResourceSummary(
        resources
      ),

    opportunity,
  }
}

// --------------------------------------------------
// Public API
// --------------------------------------------------

export function buildRaidProjectPlan({
  project,
  raidDashboard,
  currentProfile = null,
  accountImpactEnricher = null,
} = {}) {
  if (
    !project ||
    typeof project !==
      'object' ||
    !project.collectionId
  ) {
    return {
      status:
        RAID_PROJECT_PLAN_STATUS
          .INVALID_PROJECT,

      projectId:
        project?.id ??
        null,

      collectionId:
        project
          ?.collectionId ??
        null,

      recommendedNow: [],
      futureInvestments: [],
      notCurrentlyJustified: [],
      items: [],

      hasRemainingInvestment:
        false,

      hasJustifiedInvestment:
        false,
    }
  }

  const ranking =
    raidDashboard
      ?.ranking

  if (
    !ranking ||
    !Array.isArray(
      ranking.entries
    )
  ) {
    return {
      status:
        RAID_PROJECT_PLAN_STATUS
          .RAID_DATA_UNAVAILABLE,

      projectId:
        project.id,

      collectionId:
        project.collectionId,

      recommendedNow: [],
      futureInvestments: [],
      notCurrentlyJustified: [],
      items: [],

      hasRemainingInvestment:
        false,

      hasJustifiedInvestment:
        false,
    }
  }

  const entry =
    ranking.entries.find(
      candidate =>
        candidate
          ?.collectionId ===
        project.collectionId
    )

  if (!entry) {
    return {
      status:
        RAID_PROJECT_PLAN_STATUS
          .COLLECTION_ENTRY_NOT_FOUND,

      projectId:
        project.id,

      collectionId:
        project.collectionId,

      recommendedNow: [],
      futureInvestments: [],
      notCurrentlyJustified: [],
      items: [],

      hasRemainingInvestment:
        false,

      hasJustifiedInvestment:
        false,
    }
  }

  const actionable =
    Array.isArray(
      entry
        ?.opportunityResult
        ?.actionableOpportunities
    )
      ? entry
          .opportunityResult
          .actionableOpportunities
      : []

  const baseWorthwhile =
    actionable.filter(
      isBaseWorthwhileOpportunity
    )

      const resolvedAccountImpactEnricher =
    typeof accountImpactEnricher ===
      'function'
      ? accountImpactEnricher
      : ({
          recommendation,
        }) => ({
          ...recommendation,

          accountImpact:
            null,

          accountImpactSummary:
            null,

          accountImpactStatus:
            'ACCOUNT_IMPACT_UNAVAILABLE',
        })

  const accountEnriched =
    baseWorthwhile.map(
      opportunity => {
        const accountResult =
          enrichOpportunityWithAccountImpact({
            entry,
            opportunity,
            currentProfile,
            accountImpactEnricher:
  resolvedAccountImpactEnricher,
          })

        const premium =
          isPremiumInvestment({
            entry,
            opportunity,
          })

        const justification =
          classifyAccountJustification({
            accountImpactSummary:
              accountResult
                .accountImpactSummary,

            accountImpactStatus:
              accountResult
                .accountImpactStatus,

            premium,
          })

        return {
          ...accountResult,

          premium,

          justification,
        }
      }
    )

  const coherent =
    selectCoherentOpportunities(
      accountEnriched
    )

  const items =
    coherent.map(
      (
        enrichedOpportunity,
        index
      ) =>
        buildPlanItem({
          entry,
          enrichedOpportunity,
          sourceIndex:
            index,
        })
    )

  const recommendedNow =
    items.filter(
      item =>
        item.section ===
        RAID_PROJECT_PLAN_SECTION
          .RECOMMENDED_NOW
    )

  const futureInvestments =
    items.filter(
      item =>
        item.section ===
        RAID_PROJECT_PLAN_SECTION
          .FUTURE_INVESTMENT
    )

  const notCurrentlyJustified =
    items.filter(
      item =>
        item.section ===
        RAID_PROJECT_PLAN_SECTION
          .NOT_CURRENTLY_JUSTIFIED
    )

  const justifiedCount =
    recommendedNow.length +
    futureInvestments.length

  return {
    status:
      RAID_PROJECT_PLAN_STATUS
        .SUCCESS,

    projectId:
      project.id,

    collectionId:
      project.collectionId,

    pokemonIdentity:
      entry
        ?.pokemonIdentity ??
      null,

    candidate:
      entry
        ?.candidate ??
      null,

    currentState:
      entry
        ?.currentState ??
      null,

    consideredOpportunityCount:
      actionable.length,

    baseWorthwhileOpportunityCount:
      baseWorthwhile.length,

    accountEvaluatedOpportunityCount:
      accountEnriched.length,

    selectedOpportunityCount:
      items.length,

    recommendedNow,

    futureInvestments,

    notCurrentlyJustified,

    items,

    justifiedInvestmentCount:
      justifiedCount,

    hasRemainingInvestment:
      justifiedCount > 0,

    hasJustifiedInvestment:
      justifiedCount > 0,

    noRemainingInvestment:
      justifiedCount === 0,
  }
}

export default buildRaidProjectPlan