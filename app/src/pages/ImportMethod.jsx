import { useState } from 'react'

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

const importCategories = [
  {
    id: 'general',
    label: 'General Collection',
  },
  {
    id: '4star',
    label: '4★ Pokémon',
  },
  {
    id: '3star',
    label: '3★ Pokémon',
  },
  {
    id: '2star',
    label: '2★ Pokémon',
  },
  {
    id: '1star',
    label: '1★ Pokémon',
  },
  {
    id: '0star',
    label: '0★ Pokémon',
  },
]

const traitOptions = [
  'Shadow',
  'Shiny',
  'Lucky',
]

const availableImportTags = [
  '4★',
  '3★',
  '2★',
  '1★',
  '0★',
  'Shadow',
  'Shiny',
  'Lucky',
]

function ImportMethod({ method, onBack, onContinue }) {
  const details = methodDetails[method]

  if (!details) {
    return null
  }

  const [
  importCategory,
  setImportCategory,
] = useState('general')

const [
  traits,
  setTraits,
] = useState([])

function toggleTrait(trait) {
  setTraits(
    currentTraits =>
      currentTraits.includes(trait)
        ? currentTraits.filter(
            currentTrait =>
              currentTrait !== trait
          )
        : [
            ...currentTraits,
            trait,
          ]
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

          <div className="card">
            <h2>What are you importing?</h2>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                marginTop: '15px',
              }}
            >
              {importCategories.map((category) => (
                <label
                  key={category.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="import-category"
                    checked={importCategory === category.id}
                    onChange={() => setImportCategory(category.id)}
                  />

                  {category.label}
                </label>
              ))}
            </div>

            <h3
              style={{
                marginTop: '20px',
              }}
            >
              Additional Traits
            </h3>

            <div
              style={{
                display: 'flex',
                gap: '20px',
                flexWrap: 'wrap',
                marginTop: '10px',
              }}
            >
              {traitOptions.map((trait) => (
                <label
                  key={trait}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={traits.includes(trait)}
                    onChange={() => toggleTrait(trait)}
                  />

                  {trait}
                </label>
              ))}
            </div>

            <ImportUpload
              method={method}
              onAnalyze={(payload) =>
                onContinue({
                  ...payload,
                  importCategory,
                  traits,
                })
              }
            />
          </div>
        </div>
      </section>
    </main>
  )
}

export default ImportMethod