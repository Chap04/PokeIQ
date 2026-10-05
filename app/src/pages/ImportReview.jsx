import { useMemo, useState } from 'react'
import { processImport } from '../services/processImport'
import { matchImportedPokemon } from '../utils/matchImportedPokemon'
import ImportReviewCard from '../components/ImportReviewCard'

function normalizeImportedPokemon(importPayload) {
  const importedPokemon = importPayload?.importedPokemon

  if (!importedPokemon) {
    return []
  }

  return Array.isArray(importedPokemon)
    ? importedPokemon
    : [importedPokemon]
}

function ImportReview({
  pokemonCollection,
  importPayload,
  onBack,
  onConfirmImport,
}) {
  const detectedPokemon = useMemo(
    () => normalizeImportedPokemon(importPayload),
    [importPayload]
  )

  const importResult = useMemo(
    () => processImport(detectedPokemon, pokemonCollection),
    [detectedPokemon, pokemonCollection]
  )

  const {
    autoApproved,
    unreadable,
    summary,
  } = importResult

  const [reviewItems, setReviewItems] = useState(
    importResult.reviewRequired
  )

  const [currentIndex, setCurrentIndex] = useState(0)

  const [showSummary, setShowSummary] = useState(
    importResult.reviewRequired.length === 0
  )

  const currentPokemon = reviewItems[currentIndex] ?? null

  function setDecision(decision) {
    setReviewItems((currentItems) =>
      currentItems.map((pokemon, index) =>
        index === currentIndex
          ? {
              ...pokemon,
              decision,
            }
          : pokemon
      )
    )
  }

  function setManualCp(cp) {
  setReviewItems((currentItems) =>
    currentItems.map((pokemon, index) => {
      if (index !== currentIndex) {
        return pokemon
      }

      const parsedCp = Number.parseInt(cp, 10)

      if (!Number.isFinite(parsedCp) || parsedCp <= 0) {
        return {
          ...pokemon,
          cp: null,
          decision: 'pending',
          requiresManualCp: true,
          reviewReason: 'missing-cp',
          match: {
            found: false,
            type: 'missing-cp',
          },
        }
      }

      const updatedPokemon = {
        ...pokemon,
        cp: parsedCp,
        decision: 'pending',
        requiresManualCp: false,
        reviewReason: null,
        issues: [],
      }

      return {
        ...updatedPokemon,
        match: matchImportedPokemon(
          updatedPokemon,
          pokemonCollection
        ),
      }
    })
  )
}

  function goPrevious() {
    setCurrentIndex((index) => Math.max(index - 1, 0))
  }

  function goNext() {
    setCurrentIndex((index) =>
      Math.min(index + 1, reviewItems.length - 1)
    )
  }

  function openSummary() {
    setShowSummary(true)
  }

  function returnToUnresolved() {
    const firstPendingIndex = reviewItems.findIndex(
      (pokemon) => pokemon.decision === 'pending'
    )

    if (firstPendingIndex !== -1) {
      setCurrentIndex(firstPendingIndex)
    }

    setShowSummary(false)
  }

  function confirmProcessedImport() {
    onConfirmImport([
      ...autoApproved,
      ...reviewItems,
    ])
  }

  const reviewedCount = reviewItems.filter(
    (pokemon) => pokemon.decision !== 'pending'
  ).length

  const keptReviewItems = reviewItems.filter(
    (pokemon) =>
      pokemon.decision === 'keep' ||
      pokemon.decision === 'replace'
  )

  const skippedItems = reviewItems.filter(
    (pokemon) => pokemon.decision === 'skip'
  )

  const pendingItems = reviewItems.filter(
    (pokemon) => pokemon.decision === 'pending'
  )

  const totalApproved =
    autoApproved.length + keptReviewItems.length

  const progressPercentage =
    reviewItems.length > 0
      ? (reviewedCount / reviewItems.length) * 100
      : 100


  if (!importPayload) {
    return (
      <main className="app">
        <button
          className="back-button"
          type="button"
          onClick={onBack}
        >
          ← Back to Imports
        </button>

        <header className="header">
          <p className="eyebrow">PokeIQ Import</p>
          <h1>No Import Found</h1>
          <p className="subtitle">
            PokeIQ did not receive an analyzed screenshot to review.
          </p>
        </header>
      </main>
    )
  }

  if (showSummary) {
    return (
      <main className="app">
        {reviewItems.length > 0 && (
          <button
            className="back-button"
            type="button"
            onClick={() => setShowSummary(false)}
          >
            ← Back to Review
          </button>
        )}

        <header className="header">
          <p className="eyebrow">PokeIQ Import</p>
          <h1>Import Summary</h1>

          <p className="subtitle">
            PokeIQ handled confident detections automatically
            and separated anything needing attention.
          </p>
        </header>

        <section className="section">
          <div className="import-summary-stats">
            <div className="card import-summary-stat">
              <span>Detected</span>
              <strong>{summary.detected}</strong>
            </div>

            <div className="card import-summary-stat auto">
              <span>Auto-approved</span>
              <strong>{autoApproved.length}</strong>
            </div>

            <div className="card import-summary-stat review">
              <span>Needed review</span>
              <strong>{reviewItems.length}</strong>
            </div>

            <div className="card import-summary-stat unreadable">
              <span>Unreadable</span>
              <strong>{unreadable.length}</strong>
            </div>
          </div>
        </section>

        {pendingItems.length > 0 && (
          <section className="section">
            <div className="card import-summary-warning">
              <div>
                <h2>Review is incomplete</h2>

                <p>
                  {pendingItems.length} Pokémon still need a
                  decision before the import can continue.
                </p>
              </div>

              <button
                className="secondary-button"
                type="button"
                onClick={returnToUnresolved}
              >
                Review unresolved Pokémon
              </button>
            </div>
          </section>
        )}

        <section className="section">
          <div className="section-header">
            <div>
              <h2>Import results</h2>

              <p>
                {totalApproved} Pokémon will be added or
                updated, and {skippedItems.length} will be
                skipped.
              </p>
            </div>
          </div>

          <div className="import-summary-list">
            {autoApproved.map((pokemon) => (
              <div
                className="card import-summary-row"
                key={pokemon.importId}
              >
                <div>
                  <strong>{pokemon.name}</strong>

                  <span>
                    #
                    {String(pokemon.pokemonId).padStart(
                      4,
                      '0'
                    )}
                  </span>
                </div>

                <span className="auto-approved-label">
                  Auto-approved
                </span>
              </div>
            ))}

            {keptReviewItems.map((pokemon) => (
              <div
                className="card import-summary-row"
                key={pokemon.importId}
              >
                <div>
                  <strong>{pokemon.name}</strong>

                  <span>
                    #
                    {String(pokemon.pokemonId).padStart(
                      4,
                      '0'
                    )}
                  </span>
                </div>

                <span>
                  {pokemon.decision === 'replace'
                    ? 'Replace existing'
                    : 'Keep both'}
                </span>
              </div>
            ))}
          </div>
        </section>

        {unreadable.length > 0 && (
          <section className="section">
            <div className="section-header">
              <div>
                <h2>Unreadable detections</h2>

                <p>
                  These entries will not be imported.
                </p>
              </div>
            </div>

            <div className="import-summary-list">
              {unreadable.map((pokemon) => (
                <div
                  className="card import-summary-row unreadable-row"
                  key={pokemon.importId}
                >
                  <div>
                    <strong>
                      {pokemon.name || 'Unknown Pokémon'}
                    </strong>

                    <span>
                      {pokemon.issues.join(', ')}
                    </span>
                  </div>

                  <span>Not imported</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="section import-summary-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={onBack}
          >
            Cancel Import
          </button>

          <button
            className="primary-button"
            type="button"
            disabled={pendingItems.length > 0}
            onClick={confirmProcessedImport}
          >
            {totalApproved > 0
                ? `Import ${totalApproved} Pokémon`
                : 'Complete Analysis'}
          </button>
        </section>
      </main>
    )
  }

  if (!currentPokemon) {
    return (
      <main className="app">
        <button
          className="back-button"
          type="button"
          onClick={onBack}
        >
          ← Back to Imports
        </button>

        <header className="header">
          <p className="eyebrow">PokeIQ Import</p>
          <h1>Nothing to Review</h1>
          <p className="subtitle">
            This import did not produce a readable Pokémon that requires review.
          </p>
        </header>

        <section className="section import-summary-actions">
          <button
            className="primary-button"
            type="button"
            onClick={openSummary}
          >
            View Import Summary
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="app">
      <button
        className="back-button"
        type="button"
        onClick={onBack}
      >
        ← Back to Imports
      </button>

      <header className="header">
        <p className="eyebrow">PokeIQ Import</p>
        <h1>Review Required</h1>

        <p className="subtitle">
          PokeIQ handled {autoApproved.length} Pokémon
          automatically. These {reviewItems.length} need your
          attention.
        </p>
      </header>

      <section className="section">
        <div className="import-review-progress">
          <div className="import-review-progress-header">
            <span>
              Pokémon {currentIndex + 1} of{' '}
              {reviewItems.length}
            </span>

            <strong>{reviewedCount} reviewed</strong>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${progressPercentage}%`,
              }}
            />
          </div>
        </div>
      </section>

      <section className="section">
        <ImportReviewCard
  pokemon={currentPokemon}
  decision={currentPokemon.decision}
  match={currentPokemon.match}
  onCpChange={setManualCp}
  onKeep={() => setDecision('keep')}
  onReplace={() => setDecision('replace')}
  onSkip={() => setDecision('skip')}
/>
      </section>

      <section className="section import-review-navigation">
        <button
          className="secondary-button"
          type="button"
          onClick={goPrevious}
          disabled={currentIndex === 0}
        >
          ← Previous
        </button>

        <span>
          {currentIndex + 1} / {reviewItems.length}
        </span>

        <button
          className="primary-button"
          type="button"
          onClick={
            currentIndex === reviewItems.length - 1
              ? openSummary
              : goNext
          }
        >
          {currentIndex === reviewItems.length - 1
            ? 'Review Summary →'
            : 'Next →'}
        </button>
      </section>
    </main>
  )
}

export default ImportReview