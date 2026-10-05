function DeveloperTools({
  collectionCount,
  onGenerateTestCollection,
  onGenerateBrandNewTrainer,
  onGenerateMessyCollection,
  onClearCollection,
  onGenerateDuplicateScenario,
  onGenerateEvolutionScenario,
  onOpenVisionLab,
  onOpenRecordingLab,
}) {
  function confirmClearCollection() {
    const shouldClear = window.confirm(
      'Clear the entire saved collection? This cannot be undone.'
    )

    if (shouldClear) {
      onClearCollection()
    }
  }

  function confirmReplacement(
    message,
    callback
  ) {
    const shouldReplace =
      window.confirm(message)

    if (shouldReplace) {
      callback()
    }
  }

  return (
    <main className="app">
      <header className="header">
        <p className="eyebrow">
          PokeIQ Development
        </p>

        <h1>Developer Tools</h1>

        <p className="subtitle">
          Generate controlled test scenarios and inspect
          PokeIQ’s internal systems.
        </p>
      </header>

      <section className="section">
        <div className="developer-status-grid">
          <div className="card developer-status-card">
            <span>
              Pokémon in Collection
            </span>

            <strong>
              {collectionCount}
            </strong>
          </div>

          <div className="card developer-status-card">
            <span>Local storage</span>

            <strong className="developer-status-good">
              Working
            </strong>
          </div>

          <div className="card developer-status-card">
            <span>Import pipeline</span>

            <strong className="developer-status-good">
              Connected
            </strong>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <h2>Account scenarios</h2>

            <p>
              Replace the collection with a complete test
              account.
            </p>
          </div>
        </div>

        <div className="developer-action-grid">
          <button
            className="card developer-action-card"
            type="button"
            onClick={() =>
              confirmReplacement(
                'Replace the current collection with a brand-new trainer account?',
                onGenerateBrandNewTrainer
              )
            }
          >
            <span className="developer-action-icon">
              🌱
            </span>

            <div>
              <h3>Brand-New Trainer</h3>

              <p>
                Replace the collection with a small beginner
                account.
              </p>
            </div>
          </button>

          <button
            className="card developer-action-card"
            type="button"
            onClick={() =>
              confirmReplacement(
                'Replace the current collection with a messy test account?',
                onGenerateMessyCollection
              )
            }
          >
            <span className="developer-action-icon">
              🗃️
            </span>

            <div>
              <h3>Messy Collection</h3>

              <p>
                Generate duplicates, varied IVs, and mixed
                traits.
              </p>
            </div>
          </button>

          <button
            className="card developer-action-card"
            type="button"
            onClick={onGenerateTestCollection}
          >
            <span className="developer-action-icon">
              🧪
            </span>

            <div>
              <h3>Add Test Pokémon</h3>

              <p>
                Add Mamoswine, Lucario, and Rayquaza to the
                current collection.
              </p>
            </div>
          </button>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <h2>Import scenarios</h2>

            <p>
              Create predictable matching situations.
            </p>
          </div>
        </div>

        <div className="developer-action-grid">
          <button
            className="card developer-action-card"
            type="button"
            onClick={
              onGenerateDuplicateScenario
            }
          >
            <span className="developer-action-icon">
              👯
            </span>

            <div>
              <h3>Duplicate Scenario</h3>

              <p>
                Add a Mamoswine matching the mock import
                data.
              </p>
            </div>
          </button>

          <button
            className="card developer-action-card"
            type="button"
            onClick={
              onGenerateEvolutionScenario
            }
          >
            <span className="developer-action-icon">
              🧬
            </span>

            <div>
              <h3>Evolution Scenario</h3>

              <p>
                Add a Swinub that can match an imported
                Mamoswine.
              </p>
            </div>
          </button>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <h2>Development labs</h2>

            <p>
              Inspect and debug PokeIQ’s recognition systems.
            </p>
          </div>
        </div>

        <div className="developer-action-grid">
          <button
            className="card developer-action-card"
            type="button"
            onClick={onOpenVisionLab}
          >
            <span className="developer-action-icon">
              👁️
            </span>

            <div>
              <h3>Vision Lab</h3>

              <p>
                Upload screenshots and inspect OCR, regions,
                parsed data, and confidence.
              </p>
            </div>
          </button>

          <button
            className="card developer-action-card"
            type="button"
            onClick={onOpenRecordingLab}
          >
            <span className="developer-action-icon">
              🎥
            </span>

            <div>
              <h3>Recording Lab</h3>

              <p>
                Upload screen recordings and extract
                timestamped frames for bulk-import research.
              </p>
            </div>
          </button>
        </div>
      </section>

      <section className="section">
        <div className="card developer-danger-zone">
          <div>
            <h2>Danger zone</h2>

            <p>
              Remove all saved Pokémon and return the
              collection to an empty state.
            </p>
          </div>

          <button
            className="danger-button"
            type="button"
            onClick={confirmClearCollection}
          >
            Clear Collection
          </button>
        </div>
      </section>
    </main>
  )
}

export default DeveloperTools