import {
  useMemo,
  useState,
} from 'react'
import PokemonArtwork from '../components/PokemonArtwork'

import {
  getRaidTypeRatingTier,
} from '../utils/raidTypeRatingTier'

import {
  formatMoveName,
} from '../utils/formatMoveName.js'

const TYPE_COLORS = {
  BUG: '#92bc2c',
  DARK: '#9b93ad',
  DRAGON: '#0c69c8',
  ELECTRIC: '#f2d94e',
  FAIRY: '#ee90e6',
  FIGHTING: '#d3425f',
  FIRE: '#fba54c',
  FLYING: '#a1bbec',
  GHOST: '#5f6dbc',
  GRASS: '#5fbd58',
  GROUND: '#da7c4d',
  ICE: '#75d0c1',
  NORMAL: '#a0a29f',
  POISON: '#b763cf',
  PSYCHIC: '#fa8581',
  ROCK: '#c9bb8a',
  STEEL: '#5695a3',
  WATER: '#539ddf',
}

function finiteOrFallback(
  value,
  fallback
) {
  return Number.isFinite(
    value
  )
    ? value
    : fallback
}

function formatTypeName(
  type
) {
  if (!type) {
    return 'Unknown'
  }

  return (
    String(type)
      .charAt(0)
      .toUpperCase() +
    String(type)
      .slice(1)
      .toLowerCase()
  )
}

function formatScore(
  value
) {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return '—'
  }

  return value.toFixed(
    2
  )
}

function formatSignedScore(
  value
) {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return '—'
  }

  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`
}

function buildTraitLabels(
  member
) {
  const labels = []

  if (
    member
      ?.traits
      ?.shadow
  ) {
    labels.push(
      'Shadow'
    )
  }

  if (
    member
      ?.traits
      ?.purified
  ) {
    labels.push(
      'Purified'
    )
  }

  if (
    member
      ?.traits
      ?.lucky
  ) {
    labels.push(
      'Lucky'
    )
  }

  if (
    member
      ?.traits
      ?.shiny
  ) {
    labels.push(
      'Shiny'
    )
  }

  return labels
}

function RaidTeamMember({
  member,
  slot,
}) {
  const traits =
    buildTraitLabels(
      member
    )
      const artworkVariant =
    member
      ?.traits
      ?.shadow
      ? 'shadow'
      : member
          ?.traits
          ?.purified
        ? 'purified'
        : 'normal'

  const artworkPokemon = {
    id:
      member
        ?.pokemonId,

    form:
      member
        ?.pokemonForm,

    name:
      member
        ?.pokemonName,

    shiny:
      member
        ?.traits
        ?.shiny ??
      false,

    variant:
      artworkVariant,
  }

  return (
    <li className="raid-profile-team-member">
      <div className="raid-profile-team-slot">
        {slot}
      </div>

      <div className="raid-profile-team-artwork">
        <PokemonArtwork
          pokemon={
            artworkPokemon
          }
        />
      </div>

      <div className="raid-profile-team-member-main">
        <div className="raid-profile-team-member-heading">
          <strong>
            {member?.pokemonName ?? 'Pokémon'}
          </strong>

          <span>
            {Number.isFinite(member?.cp)
              ? `CP ${member.cp}`
              : 'CP unavailable'}
          </span>
        </div>

        <div className="raid-profile-team-member-meta">
          <span>
            {Number.isFinite(member?.level)
              ? `Level ${member.level}`
              : 'Level unavailable'}
          </span>

          <span>
            Raw {formatScore(member?.rawStrengthScore)}
          </span>

          {traits.map(
            (trait) => (
              <span
                className="raid-profile-trait"
                key={trait}
              >
                {trait}
              </span>
            )
          )}
        </div>

        <div className="raid-profile-moveset">
          <span>
            {formatMoveName(
              member
                ?.bestCurrentLoadout
                ?.fastMoveId
            )}
          </span>

          <span aria-hidden="true">
            +
          </span>

          <span>
            {formatMoveName(
              member
                ?.bestCurrentLoadout
                ?.chargedMoveId
            )}
          </span>
        </div>
      </div>
    </li>
  )
}

function RaidTypeRecommendation({
  recommendation,
  type,
}) {
  if (!recommendation) {
    return null
  }

  const artworkPokemon =
    recommendation
      ?.pokemon ??
    null

  const title =
    recommendation
      ?.title ??
    recommendation
      ?.actionPathText ??
    `Improve your ${formatTypeName(type)} team`

  const resourceSummary =
    recommendation
      ?.resourceSummary ??
    null

  const ownedCp =
    recommendation
      ?.ownedPokemon
      ?.cp

  return (
    <aside className="raid-profile-recommendation">
      <div className="raid-profile-recommendation-label">
        Best next improvement
      </div>

      <div className="raid-profile-recommendation-content">
        {artworkPokemon && (
          <div className="raid-profile-recommendation-artwork">
            <PokemonArtwork
              pokemon={
                artworkPokemon
              }
            />
          </div>
        )}

        <div className="raid-profile-recommendation-main">
          <div className="raid-profile-recommendation-identity">
            <strong className="raid-profile-recommendation-name">
              {recommendation
                ?.pokemonName ??
                'Pokémon'}
            </strong>

            {Number.isFinite(
              ownedCp
            ) && (
              <span>
                CP {ownedCp}
              </span>
            )}
          </div>

          <h4>
            {title}
          </h4>

          {resourceSummary && (
            <p className="raid-profile-recommendation-cost">
              {resourceSummary}
            </p>
          )}

          {recommendation
            ?.createsNewCoverage && (
            <span className="raid-profile-recommendation-coverage">
              Creates new type coverage
            </span>
          )}
        </div>

        <div className="raid-profile-recommendation-result">
          <div className="raid-profile-recommendation-rating-change">
            <span>
              {formatScore(
                recommendation
                  ?.currentRating
              )}
            </span>

            <span aria-hidden="true">
              →
            </span>

            <strong>
              {formatScore(
                recommendation
                  ?.projectedRating
              )}
            </strong>
          </div>

          <strong className="raid-profile-recommendation-gain">
            {formatSignedScore(
              recommendation
                ?.ratingGain
            )}
          </strong>

          <span>
            rating
          </span>
        </div>
      </div>
    </aside>
  )
}

function RaidTypeCard({
  type,
  typeTeam,
  recommendation,
  expanded,
  onToggle,
}) {
  const rating =
    finiteOrFallback(
      typeTeam
        ?.typeTeamRating,
      0
    )

  const filledSlots =
    finiteOrFallback(
      typeTeam
        ?.filledSlotCount,
      0
    )

  const team =
    Array.isArray(
      typeTeam?.team
    )
      ? typeTeam.team
      : []

  const tier = 
  getRaidTypeRatingTier(
  rating
)

  const typeColor =
    TYPE_COLORS[type] ??
    '#8ea0ff'

  return (
    <article
      className={`raid-profile-type-card${expanded ? ' expanded' : ''}`}
      style={{
        '--raid-type-color':
          typeColor,
      }}
    >
      <button
        className="raid-profile-type-card-button"
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
      >
        <div className="raid-profile-type-heading">
          <span className="raid-profile-type-dot" />

          <div>
            <h2>
              {formatTypeName(type)}
            </h2>

            <span className={`raid-profile-tier ${tier.className}`}>
              {tier.label}
            </span>
          </div>
        </div>

        <div className="raid-profile-rating">
          <strong>
            {formatScore(rating)}
          </strong>

          <span>
            / 100
          </span>
        </div>

        <div className="raid-profile-rating-track">
          <span
            style={{
              width:
                `${Math.min(100, Math.max(0, rating))}%`,
            }}
          />
        </div>

        <div className="raid-profile-card-stats">
          <div>
            <span>
              Team
            </span>

            <strong>
              {filledSlots} / 6
            </strong>
          </div>

          <div>
            <span>
              Current strength
            </span>

            <strong>
              {formatScore(
                typeTeam
                  ?.rawStrengthScore
              )}
            </strong>
          </div>

          <div>
            <span>
              Best possible
            </span>

            <strong>
              {formatScore(
                typeTeam
                  ?.benchmarkRawStrengthScore
              )}
            </strong>
          </div>
        </div>

        <span className="raid-profile-expand-label">
          {expanded
            ? 'Hide team'
            : 'View team'}
        </span>
      </button>

      {expanded && (
        <div className="raid-profile-team-panel">
          <div className="raid-profile-team-panel-heading">
            <div>
              <h3>
                Current {formatTypeName(type)} team
              </h3>

              <p>
                Your strongest currently owned Pokémon for this attacking role.
              </p>
            </div>

            <strong>
              {filledSlots} / 6
            </strong>
          </div>

          {team.length === 0
            ? (
              <div className="raid-profile-empty-team">
                <strong>
                  No current attackers
                </strong>

                <p>
                  None of your analyzable Pokémon currently represents this attacking type.
                </p>
              </div>
            )
            : (
              <ol className="raid-profile-team-list">
                {team.map(
                  (
                    member,
                    index
                  ) => (
                    <RaidTeamMember
                      key={`${member?.collectionId ?? 'member'}-${index}`}
                      member={member}
                      slot={index + 1}
                    />
                  )
                )}
              </ol>
            )}

          {team.length < 6 && (
            <p className="raid-profile-missing-slots">
              {6 - team.length} empty {6 - team.length === 1 ? 'slot contributes' : 'slots contribute'} zero strength.
            </p>
          )}

                    <RaidTypeRecommendation
            recommendation={
              recommendation
            }
            type={type}
          />
        </div>
      )}
    </article>
  )
}

function RaidProfile({
  raidTypeProfile,
  raidTypeRecommendations = {},
}) {
  const [
    expandedType,
    setExpandedType,
  ] =
    useState(
      null
    )

  const typeOrder =
    Array.isArray(
      raidTypeProfile
        ?.typeOrder
    )
      ? raidTypeProfile.typeOrder
      : Object.keys(
          raidTypeProfile
            ?.types ??
          {}
        )

  const summary =
    useMemo(
      () => {
        const teams =
          typeOrder.map(
            (type) =>
              raidTypeProfile
                ?.types
                ?.[type]
          )

        const ratedTeams =
          teams.filter(
            (team) =>
              Number.isFinite(
                team
                  ?.typeTeamRating
              )
          )

        const strongestTeam =
          ratedTeams.reduce(
            (
              strongest,
              team
            ) =>
              !strongest ||
              team.typeTeamRating >
                strongest.typeTeamRating
                ? team
                : strongest,
            null
          )

        const averageRating =
          ratedTeams.length > 0
            ? ratedTeams.reduce(
                (
                  total,
                  team
                ) =>
                  total +
                  team.typeTeamRating,
                0
              ) /
              ratedTeams.length
            : 0

        return {
          strongestTeam,
          averageRating,
        }
      },
      [
        raidTypeProfile,
        typeOrder,
      ]
    )

  if (
    !raidTypeProfile ||
    !raidTypeProfile.types
  ) {
    return (
      <main className="app">
        <header className="header">
          <p className="eyebrow">
            PokeIQ
          </p>

          <h1>
            Raid Profile
          </h1>
        </header>

        <section className="section">
          <div className="card empty-state">
            <h2>
              Raid Profile unavailable
            </h2>

            <p>
              Add analyzable Pokémon to your Collection to build your profile.
            </p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="app raid-profile-page">
      <header className="header raid-profile-header">
        <div>
          <p className="eyebrow">
            PokeIQ
          </p>

          <h1>
            Raid Profile
          </h1>

          <p className="subtitle">
            See how each current attacking team compares with the strongest legal Level 50 team theoretically possible.
          </p>
        </div>
      </header>

      <section className="raid-profile-summary-grid">
        <div className="card raid-profile-summary-card">
          <span>
            Strongest type
          </span>

          <strong>
            {summary.strongestTeam
              ? formatTypeName(summary.strongestTeam.type)
              : '—'}
          </strong>

          <small>
            {summary.strongestTeam
              ? `${formatScore(summary.strongestTeam.typeTeamRating)} / 100`
              : 'No rated teams'}
          </small>
        </div>

        <div className="card raid-profile-summary-card">
          <span>
            Average rating
          </span>

          <strong>
            {formatScore(summary.averageRating)}
          </strong>

          <small>
            Across all 18 types
          </small>
        </div>

        <div className="card raid-profile-summary-card">
          <span>
            Complete teams
          </span>

          <strong>
            {finiteOrFallback(raidTypeProfile?.completeTeamCount, 0)} / 18
          </strong>

          <small>
            Teams with all six slots
          </small>
        </div>

        <div className="card raid-profile-summary-card">
          <span>
            Pokémon analyzed
          </span>

          <strong>
            {finiteOrFallback(raidTypeProfile?.analyzedCount, 0)}
          </strong>

          <small>
            {finiteOrFallback(raidTypeProfile?.skippedCount, 0)} skipped
          </small>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <h2>
              Your 18 attacking types
            </h2>

            <p>
              Select a type to inspect the exact Pokémon forming its current team.
            </p>
          </div>
        </div>

        <div className="raid-profile-type-grid">
          {typeOrder.map(
            (type) => (
                            <RaidTypeCard
                key={type}
                type={type}
                typeTeam={
                  raidTypeProfile
                    .types[type]
                }
                recommendation={
                  raidTypeRecommendations
                    ?.[type] ??
                  null
                }
                expanded={
                  expandedType ===
                  type
                }
                onToggle={() =>
                  setExpandedType(
                    expandedType === type
                      ? null
                      : type
                  )
                }
              />
            )
          )}
        </div>
      </section>
    </main>
  )
}

export default RaidProfile