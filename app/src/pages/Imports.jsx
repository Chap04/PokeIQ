const importMethods = [
  {
    id: 'screenshot',
    icon: '📸',
    title: 'Screenshot',
    description:
      'Upload Pokémon GO screenshots and review detected Pokémon.',
  },
  {
    id: 'recording',
    icon: '🎥',
    title: 'Screen Recording',
    description:
      'Import multiple Pokémon from a storage scroll recording.',
  },
  {
    id: 'csv',
    icon: '📄',
    title: 'CSV File',
    description:
      'Import structured collection data from a spreadsheet file.',
  },
  {
    id: 'manual',
    icon: '✍️',
    title: 'Manual Entry',
    description:
      'Continue adding Pokémon one at a time through Collection.',
  },
]

function Imports({ onSelectMethod }) {
  return (
    <main className="app">
      <header className="header">
        <p className="eyebrow">PokeIQ</p>
        <h1>Import Pokémon</h1>
        <p className="subtitle">
          Choose how you want to bring Pokémon into your collection.
        </p>
      </header>

      <section className="section">
        <div className="import-method-grid">
          {importMethods.map((method) => (
            <button
              key={method.id}
              className="card import-method-card"
              type="button"
              onClick={() => onSelectMethod(method.id)}
            >
              <span className="import-method-icon">
                {method.icon}
              </span>

              <div>
                <h2>{method.title}</h2>
                <p>{method.description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="card import-note">
          <h2>Import workflow</h2>
          <p>
            Imported Pokémon will always be reviewed before they are added to
            your collection. Nothing will be saved automatically without your
            confirmation.
          </p>
        </div>
      </section>
    </main>
  )
}

export default Imports