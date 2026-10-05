import {
  useState,
} from 'react'

import PokemonArtwork from './PokemonArtwork'
import formatMoveName from '../utils/formatMoveName'

function formatLevel(level) {
  if (!Number.isFinite(level)) {
    return null
  }

  if (Number.isInteger(level)) {
    return `${level}`
  }

  return level.toFixed(1)
}

function formatResourceSummary(
  resourceSummary
) {
  if (!resourceSummary) {
    return null
  }

  return resourceSummary
    .replace(/,\s+/g, ' • ')
    .replace(/\s+and\s+/gi, ' • ')
}

function formatEnum(value) {
  if (!value) {
    return null
  }

  return String(value)
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map(
      part =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(' ')
}

function formatRaidStrengthScore(
  score
) {
  if (!Number.isFinite(score)) {
    return null
  }

  if (Number.isInteger(score)) {
    return `${score}`
  }

  return score.toFixed(1)
}

function formatActionPath(
  actionPath
) {
  if (
    !Array.isArray(
      actionPath
    ) ||
    actionPath.length === 0
  ) {
    return null
  }

  const labels =
    actionPath
      .map(
        step =>
          step?.label
      )
      .filter(Boolean)

  if (
    labels.length === 0
  ) {
    return null
  }

  return labels.join(
    ' → '
  )
}

function formatPokemonIdentityName(
  pokemonIdentity
) {
  if (
    typeof pokemonIdentity !==
      'string' ||
    pokemonIdentity
      .trim()
      .length === 0
  ) {
    return null
  }

  const speciesId =
    pokemonIdentity
      .split('__')[0]
      ?.trim()

  if (!speciesId) {
    return null
  }

  return speciesId
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map(
      part =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(' ')
}

function formatOwnedPokemonDetails(
  ownedPokemon
) {
  if (!ownedPokemon) {
    return null
  }

  const parts = []

  if (
    Number.isFinite(
      ownedPokemon.cp
    )
  ) {
    parts.push(
      `CP ${ownedPokemon.cp}`
    )
  }

  const attack =
    ownedPokemon
      ?.ivs
      ?.attack

  const defense =
    ownedPokemon
      ?.ivs
      ?.defense

  const stamina =
    ownedPokemon
      ?.ivs
      ?.stamina

  if (
    Number.isFinite(
      attack
    ) &&
    Number.isFinite(
      defense
    ) &&
    Number.isFinite(
      stamina
    )
  ) {
    parts.push(
      `${attack}/${defense}/${stamina}`
    )
  }

  if (
    parts.length === 0
  ) {
    return null
  }

  return parts.join(
    ' • '
  )
}

function getShortDescription({
  description,
  medianGain,
  improvementRate,
}) {
  if (!description) {
    return null
  }

  const benchmarkMatch =
    description.match(
      /improves\s+([0-9.]+)%\s+of\s+benchmark\s+matchups/i
    )

  if (benchmarkMatch) {
    return (
      `Improves ${benchmarkMatch[1]}% of benchmark matchups.`
    )
  }

  const performanceGain =
    Number.isFinite(
      medianGain
    )
      ? medianGain
      : improvementRate

  if (
    Number.isFinite(
      performanceGain
    ) &&
    description.length > 140
  ) {
    return null
  }

  return description
}

function getResourceActionabilityClass(
  status
) {
  if (
    status ===
    'AFFORDABLE'
  ) {
    return (
      'raid-resource-actionability-affordable'
    )
  }

  if (
    status ===
    'ATTEMPTABLE'
  ) {
    return (
      'raid-resource-actionability-attemptable'
    )
  }

  if (
    status ===
    'NEEDS_CANDY_CHECK'
  ) {
    return (
      'raid-resource-actionability-candy-check'
    )
  }

  if (
    status ===
    'BLOCKED'
  ) {
    return (
      'raid-resource-actionability-blocked'
    )
  }

  return (
    'raid-resource-actionability-unknown'
  )
}

function getCandyRequirementPriority(
  evaluation
) {
  if (!evaluation) {
    return 99
  }

  if (
    evaluation.status ===
      'BLOCKED' ||
    (
      Number.isFinite(
        evaluation.missing
      ) &&
      evaluation.missing > 0
    )
  ) {
    return 0
  }

  if (
    evaluation.status ===
      'NEEDS_CANDY_CHECK' ||
    !Number.isFinite(
      evaluation.owned
    )
  ) {
    return 1
  }

  return 2
}

function getCandyRequirement(
  resourceActionability
) {
  const evaluations =
    resourceActionability
      ?.evaluations

  if (
    Array.isArray(
      evaluations
    )
  ) {
    const candyEvaluations =
      evaluations
        .filter(
          evaluation =>
            (
              evaluation
                ?.resource ===
                'CANDY' ||
              evaluation
                ?.resource ===
                'CANDY_XL'
            ) &&
            evaluation
              ?.candyFamilyId &&
            evaluation
              ?.balanceKey
        )
        .sort(
          (
            first,
            second
          ) =>
            getCandyRequirementPriority(
              first
            ) -
            getCandyRequirementPriority(
              second
            )
        )

    if (
      candyEvaluations.length > 0
    ) {
      return (
        candyEvaluations[0]
      )
    }
  }

  const candyChecks =
    resourceActionability
      ?.candyChecks

  if (
    Array.isArray(
      candyChecks
    )
  ) {
    return (
      candyChecks[0] ??
      null
    )
  }

  return null
}

function getCandyInputLabel(
  candyRequirement
) {
  if (!candyRequirement) {
    return 'Candy'
  }

  if (
    candyRequirement
      .resource ===
    'CANDY_XL'
  ) {
    return (
      `${candyRequirement.candyFamilyName ?? 'Pokémon'} Candy XL`
    )
  }

  return (
    `${candyRequirement.candyFamilyName ?? 'Pokémon'} Candy`
  )
}

function getRareCandyOpportunities(
  rareCandyIntelligence
) {
  if (
    !rareCandyIntelligence
      ?.hasSharedCandyOpportunity
  ) {
    return []
  }

  return [
    rareCandyIntelligence
      ?.rareCandy,
    rareCandyIntelligence
      ?.rareCandyXL,
  ].filter(Boolean)
}

function isBestRareCandyTarget(
  opportunity
) {
  return (
    opportunity
      ?.recommendation
      ?.type ===
      'NOT_ENOUGH' &&
    opportunity
      ?.frontier ===
      true &&
    opportunity
      ?.sharedResourceRank ===
      1 &&
    opportunity
      ?.positiveAccountImpact ===
      true
  )
}

function getRareCandyDecisionClass(
  opportunity
) {
  const decisionType =
    opportunity
      ?.recommendation
      ?.type

  if (
    decisionType ===
    'BEST_CURRENT_USE'
  ) {
    return (
      'raid-rare-candy-best'
    )
  }

  if (
    isBestRareCandyTarget(
      opportunity
    )
  ) {
    return (
      'raid-rare-candy-best'
    )
  }

  if (
    decisionType ===
    'GOOD'
  ) {
    return (
      'raid-rare-candy-good'
    )
  }

  if (
    decisionType ===
    'SAVE'
  ) {
    return (
      'raid-rare-candy-save'
    )
  }

  if (
    decisionType ===
    'NOT_ENOUGH'
  ) {
    return (
      'raid-rare-candy-not-enough'
    )
  }

  return (
    'raid-rare-candy-neutral'
  )
}

function getRareCandyHeadline(
  opportunity
) {
  const resourceLabel =
    opportunity
      ?.sharedResourceLabel ??
    'Rare Candy'

  const decisionType =
    opportunity
      ?.recommendation
      ?.type

  if (
    decisionType ===
    'BEST_CURRENT_USE'
  ) {
    return (
      `${resourceLabel} · Best Current Use`
    )
  }

  if (
    isBestRareCandyTarget(
      opportunity
    )
  ) {
    return (
      `${resourceLabel} · Best Target`
    )
  }

  if (
    decisionType ===
    'GOOD'
  ) {
    return (
      `${resourceLabel} · Good Use`
    )
  }

  if (
    decisionType ===
    'SAVE'
  ) {
    return (
      `${resourceLabel} · Save`
    )
  }

  if (
    decisionType ===
    'NOT_ENOUGH'
  ) {
    return (
      `${resourceLabel} · Not Enough`
    )
  }

  if (
    decisionType ===
    'BALANCE_UNKNOWN'
  ) {
    return (
      `${resourceLabel} · Balance Unknown`
    )
  }

  return (
    `${resourceLabel} · Account Value Unknown`
  )
}

function getRareCandyCompactText(
  opportunity
) {
  if (!opportunity) {
    return null
  }

  const decisionType =
    opportunity
      ?.recommendation
      ?.type

  const resourceLabel =
    opportunity
      ?.sharedResourceLabel ??
    'Rare Candy'

  const required =
    opportunity
      ?.requiredSharedCandy

  if (
    decisionType ===
      'NOT_ENOUGH' &&
    Number.isFinite(
      required
    )
  ) {
    return (
      `${required.toLocaleString(
        'en-CA'
      )} needed to bridge`
    )
  }

  if (
    (
      decisionType ===
        'BEST_CURRENT_USE' ||
      decisionType ===
        'GOOD'
    ) &&
    Number.isFinite(
      required
    )
  ) {
    return (
      `${required.toLocaleString(
        'en-CA'
      )} ${resourceLabel}`
    )
  }

  return null
}

function getRareCandyDescription(
  opportunity
) {
  if (!opportunity) {
    return null
  }

  const resourceLabel =
    opportunity
      ?.sharedResourceLabel ??
    'Rare Candy'

  const decisionType =
    opportunity
      ?.recommendation
      ?.type

  const required =
    opportunity
      ?.requiredSharedCandy

  const owned =
    opportunity
      ?.coverage
      ?.owned

  const familyName =
    opportunity
      ?.candyFamilyName ??
    'this Pokémon'

  const familyResourceLabel =
    opportunity
      ?.candyResource ===
      'CANDY_XL'
      ? `${familyName} Candy XL`
      : `${familyName} Candy`

  if (
    decisionType ===
    'BEST_CURRENT_USE'
  ) {
    return (
      `This is PokeIQ's strongest currently known use of your ${resourceLabel}.`
    )
  }

  if (
    decisionType ===
    'GOOD'
  ) {
    return (
      `This is a strong current use of ${resourceLabel}. No known alternative gives at least as much account improvement for the same or lower shared-Candy cost.`
    )
  }

  if (
    decisionType ===
    'SAVE'
  ) {
    return (
      opportunity
        ?.recommendation
        ?.summary ??
      `PokeIQ currently recommends saving your ${resourceLabel} for a stronger known use.`
    )
  }

  if (
    decisionType ===
    'NOT_ENOUGH'
  ) {
    if (
      Number.isFinite(
        required
      ) &&
      Number.isFinite(
        owned
      )
    ) {
      const potentialCoverage =
        Math.min(
          required,
          owned
        )

      return (
        `This investment is short ${required.toLocaleString(
          'en-CA'
        )} ${familyResourceLabel}. ` +
        `You currently have ${owned.toLocaleString(
          'en-CA'
        )} ${resourceLabel}, which could cover up to ${potentialCoverage.toLocaleString(
          'en-CA'
        )} of that shortfall if you choose to use it.`
      )
    }

    return (
      opportunity
        ?.recommendation
        ?.summary ??
      `You do not currently have enough ${resourceLabel} to cover this investment's family-Candy shortfall.`
    )
  }

  if (
    decisionType ===
    'BALANCE_UNKNOWN'
  ) {
    return (
      `Enter your ${resourceLabel} balance so PokeIQ can judge whether this investment is currently affordable.`
    )
  }

  return (
    opportunity
      ?.recommendation
      ?.summary ??
    null
  )
}

function RecommendationCard({
  recommendation,
  displayRank = null,
  isInProjects = false,
  onAddProject,
  onUpdateCandyFamilyBalance,
}) {
  const [
    detailsOpen,
    setDetailsOpen,
  ] =
    useState(
      false
    )

  const [
    candyInputOpen,
    setCandyInputOpen,
  ] =
    useState(
      false
    )

  const [
    candyInputValue,
    setCandyInputValue,
  ] =
    useState(
      ''
    )

  const [
    projectMessage,
    setProjectMessage,
  ] =
    useState(
      null
    )

  if (!recommendation) {
    return null
  }

  const {
    action,
    actionPath,
    actionPathText,
    description,
    evolution,
    improvementRate,
    isEvolution,
    medianGain,
    moveChange,
    ownedPokemon,
    performance,
    pokemon,
    pokemonName,
    powerUp,
    raidStrengthClassification,
    raidStrengthScore,
    rank,
    rareCandyIntelligence,
    recommendationType,
    resourceActionability,
    resourceSummary,
    stochasticDestination,
    title,
    value,
    warning,
  } = recommendation

  const visibleRank =
    Number.isFinite(
      displayRank
    )
      ? displayRank
      : rank

  const isPotentialEvolution =
    recommendationType ===
      'POTENTIAL_EVOLUTION' ||
    Boolean(
      stochasticDestination
    )

  const canAddToProjects =
    Boolean(
      onAddProject &&
      !isPotentialEvolution
    )

  const formattedActionPath =
    actionPathText ||
    formatActionPath(
      actionPath
    )

  const formattedResourceSummary =
    formatResourceSummary(
      resourceSummary
    )

  const formattedRaidStrengthScore =
    formatRaidStrengthScore(
      raidStrengthScore
    )

  const ownedPokemonDetails =
    formatOwnedPokemonDetails(
      ownedPokemon
    )

  const evolutionTargetName =
    evolution?.targetName ||
    formatPokemonIdentityName(
      evolution
        ?.resultingPokemonIdentity
    ) ||
    formatPokemonIdentityName(
      recommendation
        ?.resultingPokemonIdentity
    ) ||
    null

  const displayTitle =
    isEvolution &&
    evolutionTargetName
      ? `Evolve into ${evolutionTargetName}`
      : title

  const formattedMoveFromName =
  moveChange?.fromName
    ? formatMoveName(
        moveChange.fromName
      )
    : null

const formattedMoveToName =
  moveChange?.toName
    ? formatMoveName(
        moveChange.toName
      )
    : null

const hasMoveChange =
  Boolean(
    formattedMoveFromName ||
    formattedMoveToName
  )

  const hasPowerUp =
    Boolean(
      powerUp &&
      (
        Number.isFinite(
          powerUp.fromLevel
        ) ||
        Number.isFinite(
          powerUp.targetLevel
        )
      )
    )

  const hasMedianGain =
    Number.isFinite(
      medianGain
    )

  const hasImprovementRate =
    Number.isFinite(
      improvementRate
    )

  const performanceGain =
    hasMedianGain
      ? medianGain
      : hasImprovementRate
        ? improvementRate
        : null

  const shortDescription =
    getShortDescription({
      description,
      medianGain,
      improvementRate,
    })

  const cardLabel =
    isPotentialEvolution
      ? 'Potential Evolution'
      : 'Raid Investment'

  const actionLabel =
    isPotentialEvolution
      ? 'Potential Investment'
      : 'Recommended Change'

  const raidStrengthLabel =
    isEvolution
      ? 'Resulting Raid Strength'
      : 'Raid Strength'

  const resourceActionabilityClass =
    getResourceActionabilityClass(
      resourceActionability
        ?.status
    )

  const candyRequirement =
    getCandyRequirement(
      resourceActionability
    )

  const candyInputLabel =
    getCandyInputLabel(
      candyRequirement
    )

  const currentCandyBalance =
    Number.isFinite(
      candyRequirement
        ?.owned
    )
      ? candyRequirement.owned
      : null

  const hasKnownCandyBalance =
    Number.isFinite(
      currentCandyBalance
    )

  const canEditCandy =
    Boolean(
      candyRequirement
        ?.candyFamilyId &&
      candyRequirement
        ?.balanceKey &&
      onUpdateCandyFamilyBalance
    )

  const rareCandyOpportunities =
    getRareCandyOpportunities(
      rareCandyIntelligence
    )

  const hasRareCandyIntelligence =
    rareCandyOpportunities
      .length > 0

  const hasExpandableDetails =
    Boolean(
      shortDescription ||
      resourceActionability
        ?.summary ||
      hasRareCandyIntelligence ||
      canEditCandy ||
      isPotentialEvolution ||
      warning
    )

  function toggleDetails() {
    setDetailsOpen(
      current =>
        !current
    )
  }

  function handleAddProject() {
    if (
      !canAddToProjects ||
      isInProjects
    ) {
      return
    }

    const result =
      onAddProject(
        recommendation
      )

    if (
      result?.success
    ) {
      setProjectMessage(
        'Added to Projects'
      )

      return
    }

    if (
      result?.duplicate
    ) {
      setProjectMessage(
        'Already in Projects'
      )

      return
    }

    setProjectMessage(
      'Could not create Project'
    )
  }

  function openCandyInput() {
    setCandyInputValue(
      hasKnownCandyBalance
        ? String(
            currentCandyBalance
          )
        : ''
    )

    setCandyInputOpen(
      true
    )
  }

  function cancelCandyInput() {
    setCandyInputValue(
      ''
    )

    setCandyInputOpen(
      false
    )
  }

  function saveCandyInput() {
    if (!canEditCandy) {
      return
    }

    const normalizedValue =
      candyInputValue
        .trim()

    if (
      normalizedValue
        .length === 0
    ) {
      return
    }

    const numericValue =
      Number(
        normalizedValue
      )

    if (
      !Number.isFinite(
        numericValue
      ) ||
      numericValue < 0 ||
      !Number.isInteger(
        numericValue
      )
    ) {
      return
    }

    onUpdateCandyFamilyBalance(
      candyRequirement
        .candyFamilyId,
      candyRequirement
        .balanceKey,
      numericValue
    )

    setCandyInputValue(
      ''
    )

    setCandyInputOpen(
      false
    )
  }

  function handleCandyInputKeyDown(
    event
  ) {
    if (
      event.key ===
      'Enter'
    ) {
      event.preventDefault()
      saveCandyInput()
    }

    if (
      event.key ===
      'Escape'
    ) {
      event.preventDefault()
      cancelCandyInput()
    }
  }

  return (
    <article className="card raid-recommendation-card">
      <div className="raid-recommendation-top">
        <div className="raid-rank-block">
          <p className="score-label">
            {cardLabel}
          </p>

          {Number.isFinite(
            visibleRank
          ) && (
            <p className="score">
              #{visibleRank}
            </p>
          )}
        </div>

        <div className="raid-pokemon-identity">
          {pokemon && (
            <PokemonArtwork
              pokemon={
                pokemon
              }
            />
          )}

          <div className="raid-pokemon-identity-text">
            <strong className="raid-pokemon-name">
              {pokemonName ||
                pokemon?.name ||
                'Pokémon'}
            </strong>

            {ownedPokemonDetails && (
              <span className="raid-pokemon-details">
                {
                  ownedPokemonDetails
                }
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="raid-recommendation-content">
        <p className="raid-action-label">
          {actionLabel}
        </p>

        <h3>
          {displayTitle}
        </h3>

        {hasMoveChange && (
  <p className="raid-move-change">
    {formattedMoveFromName && (
      <span className="raid-old-move">
        {formattedMoveFromName}
      </span>
    )}

    {formattedMoveFromName &&
      formattedMoveToName && (
        <span className="raid-move-arrow">
          →
        </span>
      )}

    {formattedMoveToName && (
      <strong className="raid-new-move">
        {formattedMoveToName}
      </strong>
    )}

    {formattedActionPath && (
      <>
        <span className="raid-move-arrow">
          •
        </span>

        <strong>
          {
            formattedActionPath
          }
        </strong>
      </>
    )}
  </p>
)}

        {!hasMoveChange &&
          !hasPowerUp &&
          !isEvolution &&
          formattedActionPath && (
            <p className="raid-action-detail">
              <strong>
                {
                  formattedActionPath
                }
              </strong>
            </p>
          )}

        {hasMoveChange &&
          !formattedActionPath &&
          action && (
            <p className="raid-action-detail">
              <strong>
                {action}
              </strong>
            </p>
          )}

        {hasPowerUp && (
          <p className="raid-action-detail">
            {Number.isFinite(
              powerUp.fromLevel
            ) &&
            Number.isFinite(
              powerUp.targetLevel
            ) ? (
              <>
                Level{' '}
                <strong>
                  {formatLevel(
                    powerUp
                      .fromLevel
                  )}
                </strong>{' '}
                →{' '}
                <strong>
                  {formatLevel(
                    powerUp
                      .targetLevel
                  )}
                </strong>
              </>
            ) : Number.isFinite(
                powerUp
                  .targetLevel
              ) ? (
              <>
                Power up to
                Level{' '}
                <strong>
                  {formatLevel(
                    powerUp
                      .targetLevel
                  )}
                </strong>
              </>
            ) : null}

            {formattedResourceSummary && (
              <>
                {' • '}
                {
                  formattedResourceSummary
                }
              </>
            )}
          </p>
        )}

        {Number.isFinite(
          performanceGain
        ) && (
          <div className="raid-performance-summary">
            <span>
              Median raid
              improvement
            </span>

            <strong>
              {performanceGain > 0
                ? '+'
                : ''}
              {performanceGain.toFixed(
                1
              )}
              %
            </strong>
          </div>
        )}
      </div>

      <div className="raid-recommendation-badges">
        {raidStrengthClassification && (
          <div className="raid-result-badge">
            <span>
              {
                raidStrengthLabel
              }
            </span>

            <strong>
              {formatEnum(
                raidStrengthClassification
              )}

              {formattedRaidStrengthScore &&
                ` • ${formattedRaidStrengthScore}`}
            </strong>
          </div>
        )}

        {value && (
          <div className="raid-result-badge raid-value-badge">
            <span>
              Investment Value
            </span>

            <strong>
              {formatEnum(
                value
              )}
            </strong>
          </div>
        )}

        {performance && (
          <div className="raid-result-badge raid-performance-badge">
            <span>
              Performance
            </span>

            <strong>
              {formatEnum(
                performance
              )}
            </strong>
          </div>
        )}

        {resourceActionability && (
          <div
            className={
              `raid-result-badge raid-resource-actionability-badge ${resourceActionabilityClass}`
            }
            title={
              resourceActionability
                .summary ??
              undefined
            }
          >
            <span>
              Resource
              Actionability
            </span>

            <strong>
              {
                resourceActionability
                  .label
              }
            </strong>
          </div>
        )}
      </div>

      {hasRareCandyIntelligence && (
        <div className="raid-rare-candy-compact">
          {rareCandyOpportunities.map(
            opportunity => {
              const headline =
                getRareCandyHeadline(
                  opportunity
                )

              const compactText =
                getRareCandyCompactText(
                  opportunity
                )

              const decisionClass =
                getRareCandyDecisionClass(
                  opportunity
                )

              return (
                <div
                  key={
                    opportunity.id
                  }
                  className={
                    `raid-rare-candy-compact-row ${decisionClass}`
                  }
                >
                  <strong>
                    {headline}
                  </strong>

                  {compactText && (
                    <span>
                      {' — '}
                      {
                        compactText
                      }
                    </span>
                  )}
                </div>
              )
            }
          )}
        </div>
      )}

      {canAddToProjects && (
        <div className="raid-project-control">
          <button
            type="button"
            className="raid-project-button"
            onClick={
              handleAddProject
            }
            disabled={
              isInProjects
            }
          >
            {isInProjects
              ? 'In Projects'
              : 'Add to Projects'}
          </button>

          {projectMessage &&
            !isInProjects && (
              <span className="raid-project-message">
                {
                  projectMessage
                }
              </span>
            )}
        </div>
      )}

      {hasExpandableDetails && (
        <button
          type="button"
          className="raid-recommendation-details-toggle"
          onClick={
            toggleDetails
          }
          aria-expanded={
            detailsOpen
          }
        >
          {detailsOpen
            ? 'Hide Details'
            : 'View Details'}
        </button>
      )}

      {detailsOpen && (
        <div className="raid-recommendation-details">
          {shortDescription && (
            <div className="raid-recommendation-detail-section">
              <p className="raid-action-label">
                Raid Evaluation
              </p>

              <p className="raid-action-detail">
                {
                  shortDescription
                }
              </p>
            </div>
          )}

          {resourceActionability
            ?.summary && (
            <div className="raid-recommendation-detail-section">
              <p className="raid-action-label">
                Resource Status
              </p>

              <p className="raid-resource-actionability-summary">
                {
                  resourceActionability
                    .summary
                }
              </p>
            </div>
          )}

          {hasRareCandyIntelligence && (
            <div className="raid-recommendation-detail-section">
              <p className="raid-action-label">
                Shared Candy
              </p>

              <div className="raid-rare-candy-intelligence">
                {rareCandyOpportunities.map(
                  opportunity => {
                    const description =
                      getRareCandyDescription(
                        opportunity
                      )

                    const decisionClass =
                      getRareCandyDecisionClass(
                        opportunity
                      )

                    return (
                      <div
                        key={
                          `${opportunity.id}-details`
                        }
                        className={
                          `raid-rare-candy-opportunity ${decisionClass}`
                        }
                      >
                        <strong className="raid-rare-candy-decision">
                          {
                            getRareCandyHeadline(
                              opportunity
                            )
                          }
                        </strong>

                        {description && (
                          <p className="raid-rare-candy-description">
                            {
                              description
                            }
                          </p>
                        )}
                      </div>
                    )
                  }
                )}
              </div>
            </div>
          )}

          {canEditCandy && (
            <div className="raid-recommendation-detail-section">
              <p className="raid-action-label">
                Family Candy
              </p>

              <div className="raid-candy-check">
                {!candyInputOpen ? (
                  <div className="raid-candy-check-display">
                    {hasKnownCandyBalance && (
                      <span className="raid-candy-known-balance">
                        Last known:{' '}
                        <strong>
                          {currentCandyBalance.toLocaleString(
                            'en-CA'
                          )}{' '}
                          {
                            candyInputLabel
                          }
                        </strong>
                      </span>
                    )}

                    <button
                      type="button"
                      className="raid-candy-check-button"
                      onClick={
                        openCandyInput
                      }
                    >
                      {hasKnownCandyBalance
                        ? `Update ${candyInputLabel}`
                        : `Enter ${candyInputLabel}`}
                    </button>
                  </div>
                ) : (
                  <div className="raid-candy-check-editor">
                    <label className="raid-candy-check-label">
                      <span>
                        Current {
                          candyInputLabel
                        }
                      </span>

                      <input
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        className="raid-candy-check-input"
                        value={
                          candyInputValue
                        }
                        onChange={
                          event =>
                            setCandyInputValue(
                              event
                                .target
                                .value
                            )
                        }
                        onKeyDown={
                          handleCandyInputKeyDown
                        }
                        autoFocus
                      />
                    </label>

                    <div className="raid-candy-check-actions">
                      <button
                        type="button"
                        className="raid-candy-check-save"
                        onClick={
                          saveCandyInput
                        }
                        disabled={
                          candyInputValue
                            .trim()
                            .length === 0
                        }
                      >
                        Save
                      </button>

                      <button
                        type="button"
                        className="raid-candy-check-cancel"
                        onClick={
                          cancelCandyInput
                        }
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {isPotentialEvolution && (
            <div className="raid-recommendation-warning">
              <strong>
                Exact moveset not
                guaranteed
              </strong>

              <span>
                This evolution is a
                planning opportunity.
                The exact
                post-evolution
                moveset may differ.
              </span>
            </div>
          )}

          {warning &&
            !isPotentialEvolution && (
              <div className="raid-recommendation-warning raid-requirement-warning">
                <span>
                  {warning}
                </span>
              </div>
            )}
        </div>
      )}
    </article>
  )
}

export default RecommendationCard