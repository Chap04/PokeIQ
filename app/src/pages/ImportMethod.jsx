import ImportUpload from '../components/ImportUpload'

const methodDetails = {
  screenshot: {
    icon: '📸',
    title: 'Screenshot Import',
    description:
      'Upload screenshots of individual Pokémon and review the detected information.',
    instructions: [
      'Open the Pokémon’s detail screen in Pokémon GO.',
      'Make sure its CP and name are clearly visible.',
      'Include the appraisal screen when importing IVs.',
      'Review all detected details before confirming.',
    ],
  },

  recording: {
    icon: '🎥',
    title: 'Screen Recording Import',
    description:
      'Import multiple Pokémon from a recording of your Pokémon storage.',
    instructions: [
      'Sort your storage before recording.',
      'Record 4★ Pokémon separately, followed by 3★, 2★, 1★, and 0★.',
      'Scroll slowly and keep every Pokémon visible long enough to read.',
      'Review any uncertain detections before confirming.',
    ],
  },

  csv: {
    icon: '📄',
    title: 'CSV Import',
    description:
      'Import structured Pokémon collection data from a spreadsheet.',
    instructions: [
      'Use the PokeIQ CSV template.',
      'Keep the provided column names unchanged.',
      'Review invalid rows before importing.',
      'Resolve possible matches before confirming.',
    ],
  },
}

function ImportMethod({ method, onBack, onContinue }) {
  const details = methodDetails[method]

  if (!details) {
    return null
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

      <header className="header import-method-header">
        <span className="import-page-icon">
          {details.icon}
        </span>

        <div>
          <p className="eyebrow">PokeIQ Import</p>
          <h1>{details.title}</h1>
          <p className="subtitle">{details.description}</p>
        </div>
      </header>

      <section className="section">
        <div className="card import-instructions">
          <h2>Before you begin</h2>

          <ol>
            {details.instructions.map((instruction) => (
              <li key={instruction}>{instruction}</li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="card import-upload-card">
          <div className="section-header">
            <div>
              <h2>Select your file</h2>
              <p>
                Your file will be previewed before anything is
                processed or saved.
              </p>
            </div>
          </div>

          <ImportUpload
            method={method}
            onAnalyze={onContinue}
          />
        </div>
      </section>
    </main>
  )
}

export default ImportMethod