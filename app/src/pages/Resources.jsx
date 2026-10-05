import {
  useMemo,
  useState,
} from 'react'

import {
  getPokemonReferenceByIdentity,
} from '../utils/pokemonReference.js'

const RECENT_FAMILY_LIMIT = 6

function ResourceField({
  label,
  value,
  onChange,
  description,
}) {
  function handleChange(event) {
    const rawValue =
      event.target.value

    if (rawValue === '') {
      onChange(null)
      return
    }

    const parsedValue =
      Number.parseInt(
        rawValue,
        10
      )

    if (
      !Number.isFinite(
        parsedValue
      )
    ) {
      return
    }

    onChange(
      Math.max(
        0,
        parsedValue
      )
    )
  }

  return (
    <label className="resource-field">
      <div className="resource-field-heading">
        <span>{label}</span>

        {value === null && (
          <small>
            Unknown
          </small>
        )}
      </div>

      <input
        type="number"
        min="0"
        step="1"
        value={
          value ?? ''
        }
        placeholder="Unknown"
        onChange={
          handleChange
        }
      />

      {description && (
        <small className="resource-field-description">
          {description}
        </small>
      )}
    </label>
  )
}

function CandyFamilyValueField({
  label,
  value,
  onChange,
}) {
  function handleChange(event) {
    const rawValue =
      event.target.value

    if (rawValue === '') {
      onChange(null)
      return
    }

    const parsedValue =
      Number.parseInt(
        rawValue,
        10
      )

    if (
      !Number.isFinite(
        parsedValue
      )
    ) {
      return
    }

    onChange(
      Math.max(
        0,
        parsedValue
      )
    )
  }

  return (
    <label className="candy-family-value-field">
      <span>
        {label}
      </span>

      <input
        type="number"
        min="0"
        step="1"
        value={
          value ?? ''
        }
        placeholder="Unknown"
        onChange={
          handleChange
        }
      />
    </label>
  )
}

function getFamilyDisplayName(
  familyId
) {
  if (!familyId) {
    return 'Unknown Family'
  }

  return String(
    familyId
  )
    .replace(
      /^FAMILY_/,
      ''
    )
    .replaceAll(
      '_',
      ' '
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      character =>
        character.toUpperCase()
    )
}

function getCollectionCandyFamilyIds(
  pokemonCollection
) {
  const familyIds =
    new Set()

  for (
    const pokemon
    of pokemonCollection ?? []
  ) {
    const pokemonIdentity =
      pokemon?.pokemonIdentity

    if (!pokemonIdentity) {
      continue
    }

    const reference =
      getPokemonReferenceByIdentity(
        pokemonIdentity
      )

    const familyId =
      reference?.familyId

    if (!familyId) {
      continue
    }

    familyIds.add(
      familyId
    )
  }

  return familyIds
}

function buildCandyFamilyEntries({
  pokemonCollection,
  candyFamilyBalances,
}) {
  const familyIds =
    getCollectionCandyFamilyIds(
      pokemonCollection
    )

  // Preserve saved balances even if the player
  // no longer owns a Pokémon from that family.
  for (
    const familyId
    of Object.keys(
      candyFamilyBalances ?? {}
    )
  ) {
    if (familyId) {
      familyIds.add(
        familyId
      )
    }
  }

  return [
    ...familyIds,
  ]
    .map(
      familyId => {
        const balance =
          candyFamilyBalances?.[
            familyId
          ] ?? {}

        return {
          familyId,

          displayName:
            getFamilyDisplayName(
              familyId
            ),

          balance: {
            candy:
              balance?.candy ??
              null,

            candyXL:
              balance?.candyXL ??
              null,

            updatedAt:
              balance?.updatedAt ??
              null,
          },
        }
      }
    )
    .sort(
      (
        first,
        second
      ) =>
        first.displayName
          .localeCompare(
            second.displayName
          )
    )
}

function getUpdatedTimestamp(
  entry
) {
  const timestamp =
    Date.parse(
      entry
        ?.balance
        ?.updatedAt ??
      ''
    )

  return Number.isFinite(
    timestamp
  )
    ? timestamp
    : null
}

function CandyFamilyRow({
  entry,
  onUpdateCandyFamilyBalance,
  recent = false,
}) {
  const {
    familyId,
    displayName,
    balance,
  } = entry

  return (
    <div
      className={
        recent
          ? 'candy-family-row candy-family-row-recent'
          : 'candy-family-row'
      }
    >
      <div className="candy-family-row-name">
        <strong>
          {displayName}
        </strong>

        <small>
          {familyId}
        </small>
      </div>

      <CandyFamilyValueField
        label="Candy"
        value={
          balance?.candy ??
          null
        }
        onChange={
          value =>
            onUpdateCandyFamilyBalance(
              familyId,
              'candy',
              value
            )
        }
      />

      <CandyFamilyValueField
        label="Candy XL"
        value={
          balance?.candyXL ??
          null
        }
        onChange={
          value =>
            onUpdateCandyFamilyBalance(
              familyId,
              'candyXL',
              value
            )
        }
      />
    </div>
  )
}

function Resources({
  pokemonCollection = [],
  playerResources,
  candyFamilyBalances,
  onUpdateResource,
  onUpdateCandyFamilyBalance,
  onClearResources,
}) {
  const [
    familySearch,
    setFamilySearch,
  ] =
    useState('')

  const candyFamilyEntries =
    useMemo(
      () =>
        buildCandyFamilyEntries({
          pokemonCollection,
          candyFamilyBalances,
        }),
      [
        pokemonCollection,
        candyFamilyBalances,
      ]
    )

  const recentCandyFamilyEntries =
    useMemo(
      () =>
        candyFamilyEntries
          .filter(
            entry =>
              getUpdatedTimestamp(
                entry
              ) !==
              null
          )
          .sort(
            (
              first,
              second
            ) =>
              getUpdatedTimestamp(
                second
              ) -
              getUpdatedTimestamp(
                first
              )
          )
          .slice(
            0,
            RECENT_FAMILY_LIMIT
          ),
      [
        candyFamilyEntries,
      ]
    )

  const normalizedFamilySearch =
    familySearch
      .trim()
      .toLowerCase()

  const filteredCandyFamilyEntries =
    useMemo(
      () => {
        if (
          !normalizedFamilySearch
        ) {
          return candyFamilyEntries
        }

        return candyFamilyEntries.filter(
          entry => {
            const displayName =
              entry.displayName
                .toLowerCase()

            const familyId =
              entry.familyId
                .toLowerCase()

            return (
              displayName.includes(
                normalizedFamilySearch
              ) ||
              familyId.includes(
                normalizedFamilySearch
              )
            )
          }
        )
      },
      [
        candyFamilyEntries,
        normalizedFamilySearch,
      ]
    )

  const showRecentFamilies =
    !normalizedFamilySearch &&
    recentCandyFamilyEntries.length >
      0

  return (
    <main className="app">
      <header className="header">
        <p className="eyebrow">
          Account Resources
        </p>

        <h1>
          Resources
        </h1>

        <p className="subtitle">
          Add the resources you currently
          have so PokeIQ can distinguish
          strong investments from
          investments you can make
          right now.
        </p>
      </header>

      <section className="section">
        <div className="section-header">
          <h2>
            General Resources
          </h2>

          <p>
            Leave a field blank if you
            do not know the amount.
            Unknown is different from
            having zero.
          </p>
        </div>

        <div className="card resources-card">
          <div className="resources-grid">
            <ResourceField
              label="Stardust"
              value={
                playerResources.stardust
              }
              onChange={
                value =>
                  onUpdateResource(
                    'stardust',
                    value
                  )
              }
            />

            <ResourceField
              label="Rare Candy"
              value={
                playerResources.rareCandy
              }
              onChange={
                value =>
                  onUpdateResource(
                    'rareCandy',
                    value
                  )
              }
              description="Tracked globally and kept separate from species-family Candy."
            />

            <ResourceField
              label="Rare Candy XL"
              value={
                playerResources.rareCandyXl
              }
              onChange={
                value =>
                  onUpdateResource(
                    'rareCandyXl',
                    value
                  )
              }
              description="Tracked globally and kept separate from species-family Candy XL."
            />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>
            TMs
          </h2>

          <p>
            These help PokeIQ determine
            whether move-change
            recommendations are
            immediately actionable.
          </p>
        </div>

        <div className="card resources-card">
          <div className="resources-grid">
            <ResourceField
              label="Fast TMs"
              value={
                playerResources.fastTms
              }
              onChange={
                value =>
                  onUpdateResource(
                    'fastTms',
                    value
                  )
              }
            />

            <ResourceField
              label="Charged TMs"
              value={
                playerResources.chargedTms
              }
              onChange={
                value =>
                  onUpdateResource(
                    'chargedTms',
                    value
                  )
              }
            />

            <ResourceField
              label="Elite Fast TMs"
              value={
                playerResources.eliteFastTms
              }
              onChange={
                value =>
                  onUpdateResource(
                    'eliteFastTms',
                    value
                  )
              }
            />

            <ResourceField
              label="Elite Charged TMs"
              value={
                playerResources.eliteChargedTms
              }
              onChange={
                value =>
                  onUpdateResource(
                    'eliteChargedTms',
                    value
                  )
              }
            />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <h2>
              Pokémon Candy Families
            </h2>

            <p>
              Search your Candy families
              or quickly edit the ones
              you've changed recently.
              Blank means unknown.
            </p>
          </div>
        </div>

        {candyFamilyEntries.length >
        0 ? (
          <>
            <div className="candy-family-toolbar">
              <div className="candy-family-search">
                <input
                  type="search"
                  value={
                    familySearch
                  }
                  placeholder="Search Pokémon family..."
                  onChange={
                    event =>
                      setFamilySearch(
                        event.target.value
                      )
                  }
                  aria-label="Search Pokémon Candy families"
                />

                {familySearch && (
                  <button
                    type="button"
                    className="candy-family-search-clear"
                    onClick={() =>
                      setFamilySearch(
                        ''
                      )
                    }
                  >
                    Clear
                  </button>
                )}
              </div>

              <span className="candy-family-result-count">
                {
                  filteredCandyFamilyEntries
                    .length
                }{' '}
                {filteredCandyFamilyEntries
                  .length === 1
                  ? 'family'
                  : 'families'}
              </span>
            </div>

            {showRecentFamilies && (
              <div className="candy-family-section-block">
                <div className="candy-family-subheading">
                  <div>
                    <h3>
                      Recently Updated
                    </h3>

                    <p>
                      Your most recently
                      edited Candy balances.
                    </p>
                  </div>
                </div>

                <div className="candy-family-table">
                  {recentCandyFamilyEntries.map(
                    entry => (
                      <CandyFamilyRow
                        key={
                          `recent-${entry.familyId}`
                        }
                        entry={
                          entry
                        }
                        recent
                        onUpdateCandyFamilyBalance={
                          onUpdateCandyFamilyBalance
                        }
                      />
                    )
                  )}
                </div>
              </div>
            )}

            <div className="candy-family-section-block">
              <div className="candy-family-subheading">
                <div>
                  <h3>
                    {normalizedFamilySearch
                      ? 'Search Results'
                      : 'All Families'}
                  </h3>

                  {!normalizedFamilySearch && (
                    <p>
                      All Candy families
                      represented in your
                      Collection or saved
                      resource history.
                    </p>
                  )}
                </div>
              </div>

              {filteredCandyFamilyEntries
                .length >
              0 ? (
                <div className="candy-family-table">
                  {filteredCandyFamilyEntries.map(
                    entry => (
                      <CandyFamilyRow
                        key={
                          entry.familyId
                        }
                        entry={
                          entry
                        }
                        onUpdateCandyFamilyBalance={
                          onUpdateCandyFamilyBalance
                        }
                      />
                    )
                  )}
                </div>
              ) : (
                <div className="card empty-state">
                  <h3>
                    No matching Candy families
                  </h3>

                  <p>
                    Nothing matches
                    “{familySearch}”.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="card empty-state">
            <h3>
              No Candy families yet
            </h3>

            <p>
              Add Pokémon to your
              Collection and their Candy
              families will automatically
              appear here.
            </p>
          </div>
        )}
      </section>

      <section className="section">
        <div className="card resources-note">
          <div>
            <h2>
              Resource tracking
            </h2>

            <p>
              Blank means unknown. Zero
              means you know you currently
              have none.
            </p>
          </div>

          <button
            className="danger-button"
            type="button"
            onClick={
              onClearResources
            }
          >
            Clear general resource balances
          </button>
        </div>
      </section>
    </main>
  )
}

export default Resources