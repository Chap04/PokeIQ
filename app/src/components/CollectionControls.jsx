function CollectionControls({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  activeFilter,
  onFilterChange,
}) {
  const filters = [
    { value: 'all', label: 'All' },
    { value: 'favorite', label: '★ Favorite' },
    { value: 'shiny', label: '✨ Shiny' },
    { value: 'shadow', label: 'Shadow' },
    { value: 'purified', label: 'Purified' },
    { value: 'lucky', label: 'Lucky' },
  ]

  return (
    <div className="card collection-controls">
      <div className="collection-control-fields">
        <label>
          Search collection
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by name or Pokédex number"
          />
        </label>

        <label>
          Sort by
          <select
            value={sortBy}
            onChange={(event) => onSortChange(event.target.value)}
          >
            <option value="recent">Recently added</option>
            <option value="cp-high">Highest CP</option>
            <option value="cp-low">Lowest CP</option>
            <option value="iv-high">Highest IV</option>
            <option value="name">Name</option>
            <option value="dex">Pokédex number</option>
          </select>
        </label>
      </div>

      <div className="collection-filter-group">
        <p>Filter</p>

        <div className="collection-filter-buttons">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={
                activeFilter === filter.value
                  ? 'filter-button active'
                  : 'filter-button'
              }
              onClick={() => onFilterChange(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CollectionControls