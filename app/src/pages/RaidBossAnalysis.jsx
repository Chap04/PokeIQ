import {
  useMemo,
  useState,
} from 'react'

import PokemonArtwork from '../components/PokemonArtwork'
import PokemonPicker from '../components/PokemonPicker'

import raidProfiles from '../data/reference/raid-profiles.json'

import {
  buildRaidBossAnalysis,
  RAID_BOSS_ANALYSIS_STATUS,
} from '../services/buildRaidBossAnalysis.js'

import {
  formatMoveName,
} from '../utils/formatMoveName.js'

const RAID_PROFILE_ORDER = [
  'TIER_1',
  'TIER_3',
  'TIER_5',
  'MEGA',
]

// --------------------------------------------------
// Formatting
// --------------------------------------------------

function formatLevel(
  level
) {
  if (!Number.isFinite(level)) {
    return '—'
  }

  return Number.isInteger(level)
    ? String(level)
    : level.toFixed(1)
}

function formatNumber(
  value,
  decimals = 2
) {
  if (!Number.isFinite(value)) {
    return '—'
  }

  return value.toFixed(
    decimals
  )
}

function formatWholeNumber(
  value
) {
  if (!Number.isFinite(value)) {
    return '—'
  }

  return Math.round(
    value
  ).toLocaleString()
}

function buildTraitLabels(
  attacker
) {
  const labels = []

  if (
    attacker?.traits?.shadow
  ) {
    labels.push(
      'Shadow'
    )
  }

  if (
    attacker?.traits?.purified
  ) {
    labels.push(
      'Purified'
    )
  }

  if (
    attacker?.traits?.lucky
  ) {
    labels.push(
      'Lucky'
    )
  }

  if (
    attacker?.traits?.shiny
  ) {
    labels.push(
      'Shiny'
    )
  }

  return labels
}

// --------------------------------------------------
// Boss summary
// --------------------------------------------------

function BossSummary({
  analysis,
}) {
  const boss =
    analysis?.boss

  if (!boss) {
    return null
  }

  return (
    <section className="card raid-boss-summary">
      <div className="raid-boss-summary-artwork">
        <PokemonArtwork
          pokemon={{
            id:
              boss.pokemonId,

            form:
              boss.pokemonForm,

            name:
              boss.pokemonName,

            shiny:
              false,
          }}
        />
      </div>

      <div className="raid-boss-summary-main">
        <span className="raid-boss-summary-label">
          Selected raid boss
        </span>

        <h2>
          {boss.pokemonName}
        </h2>

        <div className="raid-boss-summary-meta">
          <span>
            {boss.raidProfileName}
          </span>

          {boss.types.map(
            (type) => (
              <span
                key={type}
                className="raid-boss-type-chip"
              >
                {type}
              </span>
            )
          )}
        </div>
      </div>

      <div className="raid-boss-summary-stats">
        <div>
          <span>
            Boss HP
          </span>

          <strong>
            {boss.hp.toLocaleString()}
          </strong>
        </div>

        <div>
          <span>
            Timer
          </span>

          <strong>
            {boss.timerSeconds}s
          </strong>
        </div>
      </div>
    </section>
  )
}

// --------------------------------------------------
// Team member
// --------------------------------------------------

function TeamMember({
  attacker,
}) {
  const traits =
    buildTraitLabels(
      attacker
    )

  const artworkVariant =
    attacker?.traits?.shadow
      ? 'shadow'
      : attacker?.traits?.purified
        ? 'purified'
        : 'normal'

  const fastMoveName =
    formatMoveName(
      attacker
        ?.loadout
        ?.fastMoveId,
      'Unknown Fast Move'
    )

  const chargedMoveName =
    formatMoveName(
      attacker
        ?.loadout
        ?.chargedMoveId,
      'Unknown Charged Move'
    )

  return (
    <li className="raid-boss-team-member">
      <div className="raid-boss-team-slot">
        {attacker.teamSlot}
      </div>

      <div className="raid-boss-team-artwork">
        <PokemonArtwork
          pokemon={{
            id:
              attacker.pokemonId,

            form:
              attacker.pokemonForm,

            name:
              attacker.pokemonName,

            shiny:
              attacker
                ?.traits
                ?.shiny ??
              false,

            variant:
              artworkVariant,
          }}
        />
      </div>

      <div className="raid-boss-team-main">
        <div className="raid-boss-team-heading">
          <strong>
            {attacker.pokemonName}
          </strong>

          <span>
            {formatNumber(
              attacker.raidScore
            )}{' '}
            Raid Score
          </span>
        </div>

        <div className="raid-boss-team-meta">
          <span>
            CP{' '}
            {Number.isFinite(
              attacker.cp
            )
              ? attacker.cp
              : '—'}
          </span>

          <span>
            Lv.{' '}
            {formatLevel(
              attacker.level
            )}
          </span>

          {traits.map(
            (trait) => (
              <span
                key={trait}
                className="raid-boss-trait"
              >
                {trait}
              </span>
            )
          )}
        </div>

        <div className="raid-boss-team-performance">
          <span>
            <strong>
              {formatNumber(
                attacker.cycleDps
              )}
            </strong>{' '}
            DPS
          </span>

          <span>
            <strong>
              {formatNumber(
                attacker
                  .averageTimeToFaintSeconds,
                1
              )}
            </strong>{' '}
            sec avg survival
          </span>

          <span>
            <strong>
              {formatWholeNumber(
                attacker
                  .averageTotalDamageOutput
              )}
            </strong>{' '}
            TDO
          </span>
        </div>

        <div className="raid-boss-team-moves">
          <span>
            {fastMoveName}
          </span>

          <span aria-hidden="true">
            /
          </span>

          <span>
            {chargedMoveName}
          </span>
        </div>
      </div>
    </li>
  )
}

// --------------------------------------------------
// Page
// --------------------------------------------------

function RaidBossAnalysis({
  pokemonCollection = [],
}) {
  const [
    bossSearchTerm,
    setBossSearchTerm,
  ] = useState('')

  const [
    selectedBoss,
    setSelectedBoss,
  ] = useState(null)

  const [
    raidProfileId,
    setRaidProfileId,
  ] = useState(
    'TIER_5'
  )

  const analysis =
    useMemo(
      () => {
        if (
          !selectedBoss?.identity
        ) {
          return null
        }

        return buildRaidBossAnalysis({
          collection:
            pokemonCollection,

          bossPokemonIdentity:
            selectedBoss.identity,

          raidProfileId,
        })
      },
      [
        pokemonCollection,
        selectedBoss,
        raidProfileId,
      ]
    )

  const analysisSucceeded =
    analysis?.status ===
    RAID_BOSS_ANALYSIS_STATUS
      .SUCCESS

  const noAnalyzablePokemon =
    analysis?.status ===
    RAID_BOSS_ANALYSIS_STATUS
      .NO_ANALYZABLE_POKEMON

  return (
    <main className="app raid-boss-analysis-page">
      <header className="header raid-boss-analysis-header">
        <div>
          <p className="eyebrow">
            PokeIQ
          </p>

          <h1>
            Raid Boss Analysis
          </h1>

          <p className="subtitle">
            Pick a raid boss to see the strongest six Pokémon you currently own for that matchup.
          </p>
        </div>
      </header>

      <section className="section">
        <div className="card raid-boss-controls">
          <div className="raid-boss-picker-field">
            <PokemonPicker
              searchTerm={
                bossSearchTerm
              }

              onSearchTermChange={
                setBossSearchTerm
              }

              selectedPokemon={
                selectedBoss
              }

              onSelectPokemon={
                setSelectedBoss
              }
            />
          </div>

          <div className="raid-boss-tier-field">
            <label htmlFor="raid-boss-tier">
              Raid tier
            </label>

            <select
              id="raid-boss-tier"
              value={raidProfileId}
              onChange={
                (event) =>
                  setRaidProfileId(
                    event.target.value
                  )
              }
            >
              {RAID_PROFILE_ORDER.map(
                (profileId) => {
                  const profile =
                    raidProfiles[
                      profileId
                    ]

                  return (
                    <option
                      key={profileId}
                      value={profileId}
                    >
                      {profile.name}
                    </option>
                  )
                }
              )}
            </select>
          </div>
        </div>
      </section>

      {!selectedBoss && (
        <section className="section">
          <div className="card empty-state raid-boss-empty-state">
            <h2>
              Choose a raid boss
            </h2>

            <p>
              Search for a Pokémon or form above. PokeIQ will rank your exact current Collection once a boss is selected.
            </p>
          </div>
        </section>
      )}

      {analysisSucceeded && (
        <>
          <BossSummary
            analysis={
              analysis
            }
          />

          <section className="raid-boss-analysis-summary-grid">
            <div className="card raid-boss-analysis-summary-card">
              <span>
                Pokémon analyzed
              </span>

              <strong>
                {analysis
                  .summary
                  .analyzedCount}
              </strong>

              <small>
                From{' '}
                {analysis
                  .summary
                  .collectionCount}{' '}
                owned
              </small>
            </div>

            <div className="card raid-boss-analysis-summary-card">
              <span>
                Team slots filled
              </span>

              <strong>
                {analysis
                  .summary
                  .teamCount}{' '}
                / 6
              </strong>

              <small>
                {analysis
                  .summary
                  .completeTeam
                  ? 'Full raid team available'
                  : 'More usable Pokémon needed'}
              </small>
            </div>

            <div className="card raid-boss-analysis-summary-card">
              <span>
                Pokémon skipped
              </span>

              <strong>
                {analysis
                  .summary
                  .skippedCount}
              </strong>

              <small>
                Missing or unsupported combat data
              </small>
            </div>
          </section>

          <section className="section">
            <div className="section-header">
              <div>
                <h2>
                  Your best current team
                </h2>

                <p>
                  Ranked by overall raid performance using current moves, damage output, survivability, and possible boss movesets.
                </p>
              </div>
            </div>

            <ol className="raid-boss-team-list">
              {analysis.team.map(
                (attacker) => (
                  <TeamMember
                    key={
                      attacker.collectionId
                    }

                    attacker={
                      attacker
                    }
                  />
                )
              )}
            </ol>

            <p className="raid-boss-analysis-note">
              Raid Score balances damage output with estimated total damage before fainting. Survival and TDO are averages across the boss&apos;s supported legal movesets.
            </p>
          </section>
        </>
      )}

      {noAnalyzablePokemon && (
        <section className="section">
          <div className="card empty-state raid-boss-empty-state">
            <h2>
              No usable raid attackers found
            </h2>

            <p>
              PokeIQ found the boss, but none of the Pokémon in your current Collection could be evaluated with a supported current moveset.
            </p>
          </div>
        </section>
      )}

      {selectedBoss &&
        analysis &&
        !analysisSucceeded &&
        !noAnalyzablePokemon && (
          <section className="section">
            <div className="card empty-state raid-boss-empty-state">
              <h2>
                Boss analysis unavailable
              </h2>

              <p>
                PokeIQ could not build this matchup with the selected boss and raid tier.
              </p>
            </div>
          </section>
        )}
    </main>
  )
}

export default RaidBossAnalysis