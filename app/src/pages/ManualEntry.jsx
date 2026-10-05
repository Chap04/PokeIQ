import AddPokemonForm from '../components/AddPokemonForm'

function ManualEntry({
  editingPokemon,
  onAddPokemon,
  onUpdatePokemon,
  onCancel,
}) {
  return (
    <main className="app">
      <button
        className="back-button"
        type="button"
        onClick={onCancel}
      >
        ← Back to Collection
      </button>

      <header className="header">
        <p className="eyebrow">PokeIQ Collection</p>

        <h1>
          {editingPokemon ? 'Edit Pokémon' : 'Add Pokémon'}
        </h1>

        <p className="subtitle">
          {editingPokemon
            ? `Update the saved details for ${editingPokemon.name}.`
            : 'Enter the details for a Pokémon on your account.'}
        </p>
      </header>

      <section className="section">
        <AddPokemonForm
          onAddPokemon={onAddPokemon}
          onUpdatePokemon={onUpdatePokemon}
          editingPokemon={editingPokemon}
          onCancelEditing={onCancel}
        />
      </section>
    </main>
  )
}

export default ManualEntry