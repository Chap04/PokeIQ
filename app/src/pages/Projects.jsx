import {
  useMemo,
} from 'react'

import {
  RAID_PROJECT_PLAN_STATUS,
} from '../services/buildRaidProjectPlan.js'

import {
  findProjectCollectionPokemon,
} from '../services/buildRaidProjectIntelligence.js'

import {
  getProjectHistoryEvents,
} from '../services/reconcileProjectHistory.js'

import {
  PROJECT_HEALTH,
  PROJECT_STATUS,
} from '../utils/projectConstants.js'

const PROJECT_PROGRESS = {
  ACTIVE:
    'ACTIVE',

  CAUGHT_UP:
    'CAUGHT_UP',

  FULLY_DEVELOPED:
    'FULLY_DEVELOPED',

  PAUSED:
    'PAUSED',
}

function formatEnum(
  value
) {
  if (!value) {
    return null
  }

  return String(value)
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map(
      part =>
        part
          .charAt(0)
          .toUpperCase() +
        part.slice(1)
    )
    .join(' ')
}

function formatNumber(
  value
) {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return '—'
  }

  return value.toLocaleString(
    'en-CA'
  )
}

function formatSigned(
  value,
  decimals = 2
) {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return '—'
  }

  const formatted =
    value.toFixed(
      decimals
    )

  return value > 0
    ? `+${formatted}`
    : formatted
}

function formatSignedPercent(
  value
) {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return '—'
  }

  return (
    `${formatSigned(
      value,
      2
    )}%`
  )
}

function formatPercent(
  value
) {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return '—'
  }

  return (
    `${Math.round(
      value * 100
    )}%`
  )
}

function formatHistoryDate(
  value
) {
  if (!value) {
    return 'Recently'
  }

  const date =
    new Date(
      value
    )

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'Recently'
  }

  return date.toLocaleDateString(
    'en-CA',
    {
      month:
        'short',

      day:
        'numeric',
    }
  )
}

// --------------------------------------------------
// Resources
// --------------------------------------------------

function getResourceBalance({
  requirement,
  playerResources,
  candyFamilyBalances,
}) {
  const resource =
    requirement
      ?.resource

  if (
    resource ===
    'STARDUST'
  ) {
    return Number.isFinite(
      playerResources
        ?.stardust
    )
      ? playerResources
          .stardust
      : null
  }

  if (
    resource ===
    'FAST_TM'
  ) {
    return Number.isFinite(
      playerResources
        ?.fastTms
    )
      ? playerResources
          .fastTms
      : null
  }

  if (
    resource ===
    'CHARGED_TM'
  ) {
    return Number.isFinite(
      playerResources
        ?.chargedTms
    )
      ? playerResources
          .chargedTms
      : null
  }

  if (
    resource ===
    'ELITE_FAST_TM'
  ) {
    return Number.isFinite(
      playerResources
        ?.eliteFastTms
    )
      ? playerResources
          .eliteFastTms
      : null
  }

  if (
    resource ===
    'ELITE_CHARGED_TM'
  ) {
    return Number.isFinite(
      playerResources
        ?.eliteChargedTms
    )
      ? playerResources
          .eliteChargedTms
      : null
  }

  if (
    resource ===
      'CANDY' ||
    resource ===
      'CANDY_XL'
  ) {
    const candyFamilyId =
      requirement
        ?.candyFamilyId

    if (!candyFamilyId) {
      return null
    }

    const family =
      candyFamilyBalances
        ?.[candyFamilyId]

    if (!family) {
      return null
    }

    if (
      resource ===
      'CANDY'
    ) {
      return Number.isFinite(
        family.candy
      )
        ? family.candy
        : null
    }

    return Number.isFinite(
      family.candyXL
    )
      ? family.candyXL
      : null
  }

  return null
}

function getRequiredAmount(
  requirement
) {
  const candidates = [
    requirement
      ?.exactQuantity,

    requirement
      ?.quantity,

    requirement
      ?.minimumQuantity,
  ]

  return (
    candidates.find(
      value =>
        Number.isFinite(
          value
        )
    ) ??
    null
  )
}

function getResourceRequirementStatus({
  requirement,
  playerResources,
  candyFamilyBalances,
}) {
  const owned =
    getResourceBalance({
      requirement,
      playerResources,
      candyFamilyBalances,
    })

  const required =
    getRequiredAmount(
      requirement
    )

  if (
    Number.isFinite(
      owned
    ) &&
    Number.isFinite(
      required
    )
  ) {
    return {
      owned,
      required,

      remaining:
        Math.max(
          0,
          required -
            owned
        ),

      enough:
        owned >=
        required,

      known:
        true,
    }
  }

  return {
    owned:
      Number.isFinite(
        owned
      )
        ? owned
        : null,

    required:
      Number.isFinite(
        required
      )
        ? required
        : null,

    remaining:
      null,

    enough:
      null,

    known:
      false,
  }
}

function isFamilyCandyRequirement(
  requirement
) {
  return (
    (
      requirement
        ?.resource ===
        'CANDY' ||
      requirement
        ?.resource ===
        'CANDY_XL'
    ) &&
    Boolean(
      requirement
        ?.candyFamilyId
    )
  )
}

function getCandyResourceKey(
  requirement
) {
  if (
    requirement
      ?.resource ===
      'CANDY'
  ) {
    return 'candy'
  }

  if (
    requirement
      ?.resource ===
      'CANDY_XL'
  ) {
    return 'candyXL'
  }

  return null
}

// --------------------------------------------------
// Project health
// --------------------------------------------------

function getProjectHealth({
  ownedPokemon,
  plan,
}) {
  if (!ownedPokemon) {
    return (
      PROJECT_HEALTH
        .INVALID
    )
  }

  if (
    plan?.status ===
      RAID_PROJECT_PLAN_STATUS
        .SUCCESS
  ) {
    return (
      PROJECT_HEALTH
        .VALID
    )
  }

  return (
    PROJECT_HEALTH
      .UNKNOWN
  )
}

function getProjectProgress({
  project,
  plan,
  ownedPokemon,
}) {
  if (
    project?.status ===
    PROJECT_STATUS
      .PAUSED
  ) {
    return (
      PROJECT_PROGRESS
        .PAUSED
    )
  }

  if (
    !ownedPokemon ||
    plan?.status !==
      RAID_PROJECT_PLAN_STATUS
        .SUCCESS
  ) {
    return (
      PROJECT_PROGRESS
        .ACTIVE
    )
  }

  const recommendedNow =
    Array.isArray(
      plan?.recommendedNow
    )
      ? plan.recommendedNow
      : []

  const futureInvestments =
    Array.isArray(
      plan?.futureInvestments
    )
      ? plan.futureInvestments
      : []

  if (
    recommendedNow.length >
    0
  ) {
    return (
      PROJECT_PROGRESS
        .ACTIVE
    )
  }

  if (
    futureInvestments.length >
    0
  ) {
    return (
      PROJECT_PROGRESS
        .CAUGHT_UP
    )
  }

  return (
    PROJECT_PROGRESS
      .FULLY_DEVELOPED
  )
}

function getProjectProgressClass(
  progress
) {
  if (
    progress ===
    PROJECT_PROGRESS
      .FULLY_DEVELOPED
  ) {
    return (
      'project-status-completed'
    )
  }

  if (
    progress ===
    PROJECT_PROGRESS
      .CAUGHT_UP
  ) {
    return (
      'project-status-caught-up'
    )
  }

  if (
    progress ===
    PROJECT_PROGRESS
      .PAUSED
  ) {
    return (
      'project-status-paused'
    )
  }

  return (
    'project-status-active'
  )
}

function getProjectProgressDescription(
  progress
) {
  if (
    progress ===
    PROJECT_PROGRESS
      .CAUGHT_UP
  ) {
    return (
      'All ordinary recommended investment is complete. Justified future investment remains.'
    )
  }

  if (
    progress ===
    PROJECT_PROGRESS
      .FULLY_DEVELOPED
  ) {
    return (
      'PokeIQ currently sees no further justified investment in this Pokémon.'
    )
  }

  if (
    progress ===
    PROJECT_PROGRESS
      .PAUSED
  ) {
    return (
      'This Project is paused. PokeIQ will continue evaluating it, but it remains out of the Dashboard recommendation pool.'
    )
  }

  return (
    'Worthwhile account-justified investment remains available now.'
  )
}

// --------------------------------------------------
// Resource row
// --------------------------------------------------

function ProjectResourceRequirement({
  requirement,
  playerResources,
  candyFamilyBalances,
  onUpdateCandyFamilyBalance,
}) {
  const state =
    getResourceRequirementStatus({
      requirement,
      playerResources,
      candyFamilyBalances,
    })

  const label =
    requirement
      ?.label ??
    formatEnum(
      requirement
        ?.resource
    ) ??
    'Resource'

  const editableCandy =
    isFamilyCandyRequirement(
      requirement
    )

  let statusText =
    'Balance unknown'

  if (
    state.enough ===
    true
  ) {
    statusText =
      'Available'
  } else if (
    state.enough ===
      false &&
    Number.isFinite(
      state.remaining
    )
  ) {
    statusText =
      `${formatNumber(
        state.remaining
      )} needed`
  }

  function handleCandyChange(
    event
  ) {
    if (
      !editableCandy
    ) {
      return
    }

    const resourceKey =
      getCandyResourceKey(
        requirement
      )

    const candyFamilyId =
      requirement
        ?.candyFamilyId

    if (
      !resourceKey ||
      !candyFamilyId
    ) {
      return
    }

    const rawValue =
      event
        .target
        .value

    if (
      rawValue ===
      ''
    ) {
      onUpdateCandyFamilyBalance?.(
        candyFamilyId,
        resourceKey,
        null
      )

      return
    }

    const parsedValue =
      Number(
        rawValue
      )

    if (
      !Number.isFinite(
        parsedValue
      )
    ) {
      return
    }

    onUpdateCandyFamilyBalance?.(
      candyFamilyId,
      resourceKey,
      Math.max(
        0,
        Math.floor(
          parsedValue
        )
      )
    )
  }

  return (
    <div className="project-plan-resource">
      <span className="project-plan-resource-name">
        {label}
      </span>

      {editableCandy ? (
        <div className="project-plan-resource-balance">
          <input
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            aria-label={`${label} owned`}
            value={
              Number.isFinite(
                state.owned
              )
                ? state.owned
                : ''
            }
            placeholder="?"
            onChange={
              handleCandyChange
            }
            style={{
              width:
                '5.5rem',

              padding:
                '0.35rem 0.5rem',

              borderRadius:
                '0.45rem',

              border:
                '1px solid rgba(255, 255, 255, 0.14)',

              background:
                'rgba(255, 255, 255, 0.04)',

              color:
                'inherit',

              font:
                'inherit',

              fontWeight:
                700,
            }}
          />

          {Number.isFinite(
            state.required
          ) && (
            <span>
              {' '}
              /{' '}
              {formatNumber(
                state.required
              )}
            </span>
          )}
        </div>
      ) : (
        <strong className="project-plan-resource-balance">
          {Number.isFinite(
            state.required
          )
            ? (
                Number.isFinite(
                  state.owned
                )
                  ? `${formatNumber(
                      state.owned
                    )} / ${formatNumber(
                      state.required
                    )}`
                  : `${formatNumber(
                      state.required
                    )} required`
              )
            : (
                Number.isFinite(
                  state.owned
                )
                  ? `${formatNumber(
                      state.owned
                    )} owned`
                  : 'Required'
              )}
        </strong>
      )}

      <span
        className={
          state.enough ===
            true
            ? 'project-plan-resource-state project-plan-resource-ready'
            : state.enough ===
                false
              ? 'project-plan-resource-state project-plan-resource-shortfall'
              : 'project-plan-resource-state project-plan-resource-unknown'
        }
      >
        {statusText}
      </span>
    </div>
  )
}

// --------------------------------------------------
// Account impact
// --------------------------------------------------

function ProjectAccountImpact({
  item,
}) {
  const summary =
    item
      ?.accountImpactSummary

  const reason =
    item
      ?.accountJustificationReason

  if (
    !summary &&
    !reason
  ) {
    return null
  }

  const pointChange =
    summary
      ?.overallStrengthPointChange

  const percentChange =
    summary
      ?.overallStrengthPercentChange

  const improvedTypeCount =
    summary
      ?.improvedTypeCount

  const regressedTypeCount =
    summary
      ?.regressedTypeCount

  const biggestImprovement =
    summary
      ?.biggestImprovement

  return (
    <div className="project-plan-account-impact">
      <span className="project-plan-block-label">
        Account Value
      </span>

      <div className="project-plan-account-stats">
        {(Number.isFinite(
          pointChange
        ) ||
          Number.isFinite(
            percentChange
          )) && (
          <div className="project-plan-account-stat">
            <span>
              Overall
            </span>

            <strong>
              {Number.isFinite(
                pointChange
              )
                ? formatSigned(
                    pointChange
                  )
                : '—'}

              {Number.isFinite(
                percentChange
              ) &&
                ` • ${formatSignedPercent(
                  percentChange
                )}`}
            </strong>
          </div>
        )}

        {Number.isFinite(
          improvedTypeCount
        ) && (
          <div className="project-plan-account-stat">
            <span>
              Teams Improved
            </span>

            <strong>
              {improvedTypeCount}
            </strong>
          </div>
        )}

        {biggestImprovement &&
          Number.isFinite(
            biggestImprovement
              ?.percentChange
          ) && (
          <div className="project-plan-account-stat">
            <span>
              Best Gain
            </span>

            <strong>
              {formatEnum(
                biggestImprovement
                  ?.type
              )}{' '}
              {formatSignedPercent(
                biggestImprovement
                  .percentChange
              )}
            </strong>
          </div>
        )}

        {Number.isFinite(
          regressedTypeCount
        ) &&
          regressedTypeCount >
            0 && (
          <div className="project-plan-account-stat project-plan-account-stat-warning">
            <span>
              Teams Weakened
            </span>

            <strong>
              {regressedTypeCount}
            </strong>
          </div>
        )}
      </div>

      {reason && (
        <div
          className={
            item
              ?.accountJustified
              ? 'project-plan-justification project-plan-justification-positive'
              : 'project-plan-justification project-plan-justification-muted'
          }
        >
          <span className="project-plan-justification-symbol">
            {item
              ?.accountJustified
              ? '✓'
              : '–'}
          </span>

          <p>
            {reason}
          </p>
        </div>
      )}
    </div>
  )
}

// --------------------------------------------------
// Investment item
// --------------------------------------------------

function ProjectPlanItem({
  item,
  index,
  playerResources,
  candyFamilyBalances,
  onUpdateCandyFamilyBalance,
  muted = false,
}) {
  const resourceRequirements =
    Array.isArray(
      item
        ?.resourceRequirements
    )
      ? item
          .resourceRequirements
      : []

  return (
    <article
      className={
        muted
          ? 'project-plan-item project-plan-item-muted'
          : 'project-plan-item'
      }
    >
      <div className="project-plan-item-header">
        <div className="project-plan-item-number">
          {index + 1}
        </div>

        <div className="project-plan-item-title">
          <strong>
            {item?.title ??
              'Raid Investment'}
          </strong>

          <div className="project-plan-item-badges">
            {item
              ?.isPremiumInvestment && (
              <span className="project-plan-premium-badge">
                Premium
              </span>
            )}

            {muted && (
              <span className="project-plan-hold-badge">
                Hold
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="project-plan-performance-row">
        {Number.isFinite(
          item
            ?.raidStrengthScore
        ) && (
          <div>
            <span>
              Raid Strength
            </span>

            <strong>
              {item
                .raidStrengthScore
                .toFixed(1)}

              {item
                ?.raidStrengthClassification &&
                ` • ${formatEnum(
                  item
                    .raidStrengthClassification
                )}`}
            </strong>
          </div>
        )}

        {Number.isFinite(
          item?.medianGain
        ) && (
          <div>
            <span>
              Pokémon DPS
            </span>

            <strong>
              {formatSignedPercent(
                item
                  .medianGain
              )}
            </strong>
          </div>
        )}

        {Number.isFinite(
          item
            ?.improvementRate
        ) && (
          <div>
            <span>
              Benchmarks
            </span>

            <strong>
              {formatPercent(
                item
                  .improvementRate
              )}
            </strong>
          </div>
        )}
      </div>

      <ProjectAccountImpact
        item={
          item
        }
      />

      {item
        ?.actionPath
        ?.length > 1 && (
        <div className="project-plan-path">
          <span>
            Path
          </span>

          <strong>
            {item
              .actionPath
              .map(
                step =>
                  step.label
              )
              .join(
                ' → '
              )}
          </strong>
        </div>
      )}

      {resourceRequirements.length >
        0 && (
        <div className="project-plan-resources">
          <span className="project-plan-block-label">
            Cost
          </span>

          <div className="project-plan-resource-list">
            {resourceRequirements.map(
              (
                requirement,
                requirementIndex
              ) => (
                <ProjectResourceRequirement
                  key={
                    `${item.id}-resource-${requirement.resource}-${requirement.candyFamilyId ?? 'global'}-${requirementIndex}`
                  }
                  requirement={
                    requirement
                  }
                  playerResources={
                    playerResources
                  }
                  candyFamilyBalances={
                    candyFamilyBalances
                  }
                  onUpdateCandyFamilyBalance={
                    onUpdateCandyFamilyBalance
                  }
                />
              )
            )}
          </div>
        </div>
      )}
    </article>
  )
}

// --------------------------------------------------
// Plan section
// --------------------------------------------------

function ProjectPlanSection({
  title,
  description,
  items,
  playerResources,
  candyFamilyBalances,
  onUpdateCandyFamilyBalance,
  muted = false,
}) {
  if (
    !Array.isArray(
      items
    ) ||
    items.length ===
      0
  ) {
    return null
  }

  return (
    <section className="project-plan-section">
      <div className="project-plan-section-heading">
        <div>
          <h4>
            {title}
          </h4>

          {description && (
            <p>
              {description}
            </p>
          )}
        </div>

        <span className="project-plan-section-count">
          {items.length}
        </span>
      </div>

      <div className="project-plan-items">
        {items.map(
          (
            item,
            index
          ) => (
            <ProjectPlanItem
              key={
                item.id
              }
              item={
                item
              }
              index={
                index
              }
              playerResources={
                playerResources
              }
              candyFamilyBalances={
                candyFamilyBalances
              }
              onUpdateCandyFamilyBalance={
                onUpdateCandyFamilyBalance
              }
              muted={
                muted
              }
            />
          )
        )}
      </div>
    </section>
  )
}

// --------------------------------------------------
// Historical source
// --------------------------------------------------

function ProjectSourceContext({
  project,
}) {
  const initial =
    project
      ?.source
      ?.initialRecommendation

  const legacyAccountImpact =
    project
      ?.source
      ?.originalAccountImpact

  const accountImpact =
    initial
      ?.accountImpact ??
    legacyAccountImpact ??
    null

  const initialTitle =
    initial
      ?.title ??
    project
      ?.source
      ?.recommendationTitle ??
    null

  const hasAccountImpact =
    Number.isFinite(
      accountImpact
        ?.pointChange
    ) ||
    Number.isFinite(
      accountImpact
        ?.percentChange
    )

  if (
    !initialTitle &&
    !hasAccountImpact
  ) {
    return null
  }

  return (
    <div className="project-source-context">
      <span>
        Started from
      </span>

      <strong>
        {initialTitle ??
          'Raid Investment'}

        {hasAccountImpact && (
          <small>
            {' '}
            •{' '}
            {Number.isFinite(
              accountImpact
                ?.pointChange
            )
              ? formatSigned(
                  accountImpact
                    .pointChange
                )
              : '—'}

            {Number.isFinite(
              accountImpact
                ?.percentChange
            ) &&
              ` • ${formatSignedPercent(
                accountImpact
                  .percentChange
              )}`}
          </small>
        )}
      </strong>
    </div>
  )
}

// --------------------------------------------------
// History
// --------------------------------------------------

function ProjectHistory({
  events,
}) {
  if (
    !Array.isArray(
      events
    ) ||
    events.length ===
      0
  ) {
    return null
  }

  return (
    <section className="project-plan-section">
      <div className="project-plan-section-heading">
        <div>
          <h4>
            History
          </h4>

          <p>
            Completed investments PokeIQ
            recognized from Collection
            changes.
          </p>
        </div>

        <span className="project-plan-section-count">
          {events.length}
        </span>
      </div>

      <div className="project-plan-items">
        {events.map(
          event => {
            const eventDate =
              event
                ?.completedAt ??
              event
                ?.createdAt ??
              event
                ?.recordedAt ??
              null

            const title =
              event
                ?.title ??
              formatEnum(
                event
                  ?.eventType
              ) ??
              'Investment Completed'

            return (
              <div
                key={
                  event.id
                }
                className="project-source-context"
              >
                <span>
                  {formatHistoryDate(
                    eventDate
                  )}
                </span>

                <strong>
                  ✓ {title}
                </strong>
              </div>
            )
          }
        )}
      </div>
    </section>
  )
}

// --------------------------------------------------
// Controls
// --------------------------------------------------

function ProjectControls({
  project,
  progress,
  pokemonName,
  onPauseProject,
  onResumeProject,
  onRemoveProject,
}) {
  const projectId =
    project?.id

  if (!projectId) {
    return null
  }

  const paused =
    project?.status ===
    PROJECT_STATUS.PAUSED

  function handleRemove() {
    const confirmed =
      window.confirm(
        `Remove ${pokemonName} from Projects? Its saved Project will be preserved, and this Pokémon can appear on the Dashboard again.`
      )

    if (
      confirmed
    ) {
      onRemoveProject?.(
        projectId
      )
    }
  }

  return (
    <div className="project-card-controls">
      <div
        className={
          `project-status-badge ${getProjectProgressClass(
            progress
          )}`
        }
        title={
          getProjectProgressDescription(
            progress
          )
        }
      >
        {formatEnum(
          progress
        )}
      </div>

      <div className="project-card-control-buttons">
        {paused ? (
          <button
            type="button"
            className="secondary-button project-control-button"
            onClick={() =>
              onResumeProject?.(
                projectId
              )
            }
          >
            Resume
          </button>
        ) : (
          <button
            type="button"
            className="secondary-button project-control-button"
            onClick={() =>
              onPauseProject?.(
                projectId
              )
            }
          >
            Pause
          </button>
        )}

        <button
          type="button"
          className="danger-button project-control-button"
          onClick={
            handleRemove
          }
        >
          Remove
        </button>
      </div>
    </div>
  )
}

function ProjectProgressMessage({
  progress,
}) {
  if (
    progress ===
    PROJECT_PROGRESS
      .ACTIVE
  ) {
    return null
  }

  if (
    progress ===
    PROJECT_PROGRESS
      .CAUGHT_UP
  ) {
    return (
      <div className="project-progress-message project-progress-caught-up">
        <span className="project-progress-symbol">
          ✓
        </span>

        <div>
          <strong>
            Caught up for now
          </strong>

          <p>
            All currently recommended
            ordinary investment is
            complete. This Pokémon still
            has justified future
            investment worth considering
            when you're ready.
          </p>
        </div>
      </div>
    )
  }

  if (
    progress ===
    PROJECT_PROGRESS
      .FULLY_DEVELOPED
  ) {
    return (
      <div className="project-complete-state">
        <span className="project-complete-state-symbol">
          ✓
        </span>

        <div>
          <strong>
            Fully developed for now
          </strong>

          <p>
            PokeIQ does not currently
            see another investment in
            this Pokémon worth the
            account resources. The
            Project will continue to be
            reevaluated as your
            Collection changes.
          </p>
        </div>
      </div>
    )
  }

  if (
    progress ===
    PROJECT_PROGRESS
      .PAUSED
  ) {
    return (
      <div className="project-progress-message project-progress-paused">
        <span className="project-progress-symbol">
          ‖
        </span>

        <div>
          <strong>
            Project paused
          </strong>

          <p>
            PokeIQ is still evaluating
            this Pokémon, but you've
            paused active development.
            Resume the Project whenever
            you want to continue.
          </p>
        </div>
      </div>
    )
  }

  return null
}

// --------------------------------------------------
// Card
// --------------------------------------------------

function ProjectCard({
  project,
  ownedPokemon,
  plan,
  historyEvents,
  playerResources,
  candyFamilyBalances,
  onUpdateCandyFamilyBalance,
  onPauseProject,
  onResumeProject,
  onRemoveProject,
}) {
  const health =
    getProjectHealth({
      ownedPokemon,
      plan,
    })

  const progress =
    getProjectProgress({
      project,
      plan,
      ownedPokemon,
    })

  const pokemonName =
    ownedPokemon
      ?.name ??
    plan
      ?.candidate
      ?.reference
      ?.name ??
    'Pokémon'

  const recommendedNow =
    Array.isArray(
      plan
        ?.recommendedNow
    )
      ? plan.recommendedNow
      : []

  const futureInvestments =
    Array.isArray(
      plan
        ?.futureInvestments
    )
      ? plan.futureInvestments
      : []

  const notCurrentlyJustified =
    Array.isArray(
      plan
        ?.notCurrentlyJustified
    )
      ? plan
          .notCurrentlyJustified
      : []

  const planReady =
    plan?.status ===
    RAID_PROJECT_PLAN_STATUS
      .SUCCESS

  return (
    <article className="card project-card project-v2-card">
      <div className="project-card-header">
        <div>
          <p className="score-label">
            Raid Investment Project
          </p>

          <h3>
            {pokemonName}
          </h3>

          <span className="project-v2-subtitle">
            Develop this exact Pokémon
            while worthwhile raid
            investments remain.
          </span>
        </div>

        <ProjectControls
          project={
            project
          }
          progress={
            progress
          }
          pokemonName={
            pokemonName
          }
          onPauseProject={
            onPauseProject
          }
          onResumeProject={
            onResumeProject
          }
          onRemoveProject={
            onRemoveProject
          }
        />
      </div>

      {!ownedPokemon && (
        <div className="project-health-warning">
          <strong>
            Project Pokémon not found
          </strong>

          <span>
            This Collection entry no
            longer exists, so PokeIQ
            cannot evaluate the
            Project.
          </span>
        </div>
      )}

      {ownedPokemon &&
        !planReady && (
        <div className="project-health-warning">
          <strong>
            Project intelligence
            unavailable
          </strong>

          <span>
            PokeIQ found this Pokémon
            in your Collection but
            could not build its live
            Raid Investment plan.
          </span>
        </div>
      )}

      {health ===
        PROJECT_HEALTH.VALID &&
        planReady && (
        <div className="project-v2-summary">
          <div className="project-v2-summary-stat">
            <span>
              Recommended
            </span>

            <strong>
              {
                recommendedNow.length
              }
            </strong>
          </div>

          <div className="project-v2-summary-stat">
            <span>
              Future
            </span>

            <strong>
              {
                futureInvestments.length
              }
            </strong>
          </div>

          <div className="project-v2-summary-stat">
            <span>
              On Hold
            </span>

            <strong>
              {
                notCurrentlyJustified.length
              }
            </strong>
          </div>
        </div>
      )}

      <ProjectSourceContext
        project={
          project
        }
      />

      {planReady && (
        <>
          <ProjectPlanSection
            title="Recommended Now"
            description="Account-justified improvements worth making now."
            items={
              recommendedNow
            }
            playerResources={
              playerResources
            }
            candyFamilyBalances={
              candyFamilyBalances
            }
            onUpdateCandyFamilyBalance={
              onUpdateCandyFamilyBalance
            }
          />

          <ProjectPlanSection
            title="Future Investment"
            description="Premium improvements that still justify their added cost."
            items={
              futureInvestments
            }
            playerResources={
              playerResources
            }
            candyFamilyBalances={
              candyFamilyBalances
            }
            onUpdateCandyFamilyBalance={
              onUpdateCandyFamilyBalance
            }
          />

          <ProjectPlanSection
            title="Not Currently Justified"
            description="Possible upgrades that do not currently provide enough account value."
            items={
              notCurrentlyJustified
            }
            playerResources={
              playerResources
            }
            candyFamilyBalances={
              candyFamilyBalances
            }
            onUpdateCandyFamilyBalance={
              onUpdateCandyFamilyBalance
            }
            muted={
              true
            }
          />
        </>
      )}

      <ProjectHistory
        events={
          historyEvents
        }
      />

      {planReady && (
        <ProjectProgressMessage
          progress={
            progress
          }
        />
      )}
    </article>
  )
}

// --------------------------------------------------
// Removed
// --------------------------------------------------

function RemovedProjectRow({
  project,
  pokemonCollection,
  onRestoreProject,
}) {
  const ownedPokemon =
    findProjectCollectionPokemon({
      pokemonCollection,

      collectionId:
        project
          ?.collectionId,
    })

  const initialTitle =
    project
      ?.source
      ?.initialRecommendation
      ?.title ??
    project
      ?.source
      ?.recommendationTitle ??
    'Raid Investment'

  const pokemonName =
    ownedPokemon
      ?.name ??
    project
      ?.sourcePokemonIdentity
      ?.name ??
    'Pokémon'

  return (
    <div className="project-removed-row">
      <div className="project-removed-info">
        <strong>
          {pokemonName}
        </strong>

        <span>
          {initialTitle}
        </span>
      </div>

      <button
        type="button"
        className="secondary-button project-control-button"
        onClick={() =>
          onRestoreProject?.(
            project.id
          )
        }
      >
        Restore
      </button>
    </div>
  )
}

// --------------------------------------------------
// Page
// --------------------------------------------------

function Projects({
  projectIntelligence,
  projectActions = [],
  pokemonCollection = [],
  playerResources = {},
  candyFamilyBalances = {},
  onUpdateCandyFamilyBalance,
  onPauseProject,
  onResumeProject,
  onRemoveProject,
  onRestoreProject,
}) {
  const removedProjects =
    Array.isArray(
      projectIntelligence
        ?.removedProjects
    )
      ? projectIntelligence
          .removedProjects
      : []

  const evaluatedProjects =
    useMemo(
      () => {
        const entries =
          Array.isArray(
            projectIntelligence
              ?.evaluatedProjects
          )
            ? projectIntelligence
                .evaluatedProjects
            : []

        return entries.map(
          entry => {
            const health =
              getProjectHealth({
                ownedPokemon:
                  entry
                    .ownedPokemon,

                plan:
                  entry.plan,
              })

            const progress =
              getProjectProgress({
                project:
                  entry.project,

                plan:
                  entry.plan,

                ownedPokemon:
                  entry
                    .ownedPokemon,
              })

            const historyEvents =
              getProjectHistoryEvents(
                projectActions,
                entry
                  ?.project
                  ?.id
              )

            return {
              ...entry,

              health,

              progress,

              historyEvents:
                Array.isArray(
                  historyEvents
                )
                  ? historyEvents
                  : [],
            }
          }
        )
      },
      [
        projectIntelligence,
        projectActions,
      ]
    )

  const projectStatusSummary =
    useMemo(
      () => {
        let active = 0
        let caughtUp = 0
        let fullyDeveloped = 0
        let paused = 0
        let invalid = 0

        for (
          const entry
          of evaluatedProjects
        ) {
          if (
            entry.health ===
            PROJECT_HEALTH
              .INVALID
          ) {
            invalid += 1
          }

          if (
            entry.progress ===
            PROJECT_PROGRESS
              .PAUSED
          ) {
            paused += 1
            continue
          }

          if (
            entry.progress ===
            PROJECT_PROGRESS
              .CAUGHT_UP
          ) {
            caughtUp += 1
            continue
          }

          if (
            entry.progress ===
            PROJECT_PROGRESS
              .FULLY_DEVELOPED
          ) {
            fullyDeveloped += 1
            continue
          }

          active += 1
        }

        return {
          total:
            evaluatedProjects
              .length,

          active,
          caughtUp,
          fullyDeveloped,
          paused,
          invalid,
        }
      },
      [
        evaluatedProjects,
      ]
    )

  return (
    <main className="app">
      <header className="header dashboard-hero">
        <p className="eyebrow">
          PokeIQ
        </p>

        <h1 className="dashboard-hero-title">
          Projects
        </h1>

        <p className="subtitle dashboard-hero-subtitle">
          Pokémon you've chosen to
          invest in, continuously
          reevaluated as your account
          and Collection change.
        </p>
      </header>

      <section className="section">
        <div className="project-overview-grid project-progress-overview-grid">
          <div className="card project-overview-card">
            <span>
              Projects
            </span>

            <strong>
              {
                projectStatusSummary
                  .total
              }
            </strong>
          </div>

          <div className="card project-overview-card">
            <span>
              Active
            </span>

            <strong>
              {
                projectStatusSummary
                  .active
              }
            </strong>
          </div>

          <div className="card project-overview-card">
            <span>
              Caught Up
            </span>

            <strong>
              {
                projectStatusSummary
                  .caughtUp
              }
            </strong>
          </div>

          <div className="card project-overview-card">
            <span>
              Fully Developed
            </span>

            <strong>
              {
                projectStatusSummary
                  .fullyDeveloped
              }
            </strong>
          </div>
        </div>

        {projectStatusSummary
          .paused >
          0 && (
          <p className="project-paused-summary">
            {
              projectStatusSummary
                .paused
            }{' '}
            paused{' '}
            {projectStatusSummary
              .paused ===
            1
              ? 'Project'
              : 'Projects'}
          </p>
        )}
      </section>

      <section className="section">
        <div className="section-header dashboard-section-header">
          <div>
            <h2>
              Your Projects
            </h2>

            <p>
              Each Project follows one
              exact Pokémon and updates
              as your Collection
              changes.
            </p>
          </div>
        </div>

        {evaluatedProjects.length ===
        0 ? (
          <div className="card empty-state">
            <h3>
              No active Projects
            </h3>

            <p>
              Add a Raid Investment
              from the Dashboard when
              you decide that Pokémon
              is worth developing.
            </p>
          </div>
        ) : (
          <div className="project-list">
            {evaluatedProjects.map(
              entry => (
                <ProjectCard
                  key={
                    entry
                      .project
                      .id
                  }
                  project={
                    entry.project
                  }
                  ownedPokemon={
                    entry
                      .ownedPokemon
                  }
                  plan={
                    entry.plan
                  }
                  historyEvents={
                    entry
                      .historyEvents
                  }
                  playerResources={
                    playerResources
                  }
                  candyFamilyBalances={
                    candyFamilyBalances
                  }
                  onUpdateCandyFamilyBalance={
                    onUpdateCandyFamilyBalance
                  }
                  onPauseProject={
                    onPauseProject
                  }
                  onResumeProject={
                    onResumeProject
                  }
                  onRemoveProject={
                    onRemoveProject
                  }
                />
              )
            )}
          </div>
        )}
      </section>

      {removedProjects.length >
        0 && (
        <section className="section project-removed-section">
          <div className="section-header">
            <div>
              <h2>
                Removed Projects
              </h2>

              <p>
                Removed Projects are
                preserved so you can
                restore them later.
              </p>
            </div>
          </div>

          <div className="card project-removed-list">
            {removedProjects.map(
              project => (
                <RemovedProjectRow
                  key={
                    project.id
                  }
                  project={
                    project
                  }
                  pokemonCollection={
                    pokemonCollection
                  }
                  onRestoreProject={
                    onRestoreProject
                  }
                />
              )
            )}
          </div>
        </section>
      )}
    </main>
  )
}

export default Projects