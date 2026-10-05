function RegionDetectionPanel({ regions }) {
  const regionItems = regions?.items ?? []
  const source = regions?.source

  if (regionItems.length === 0) {
    return null
  }

  return (
    <article className="card vision-debug-panel vision-regions-panel">
      <div className="vision-regions-heading">
        <div>
          <p className="eyebrow">Image analysis</p>
          <h2>Region Detection</h2>

          <p>
            Inspect the screen areas PokeIQ selected for targeted
            OCR and visual analysis.
          </p>
        </div>

        {source && (
          <span className="diagnostic-status unchanged">
            {source.width} × {source.height}
          </span>
        )}
      </div>

      <div className="vision-region-grid">
        {regionItems.map((region) => (
          <section
            className="vision-region-card"
            key={region.id}
          >
            <div className="vision-region-preview">
              <img
                src={region.previewUrl}
                alt={`${region.label} detected region`}
              />
            </div>

            <div className="vision-region-details">
              <div>
                <strong>{region.label}</strong>
                <span>{region.id}</span>
              </div>

              <dl>
                <div>
                  <dt>Position</dt>
                  <dd>
                    {region.x}, {region.y}
                  </dd>
                </div>

                <div>
                  <dt>Size</dt>
                  <dd>
                    {region.width} × {region.height}
                  </dd>
                </div>
              </dl>
            </div>
          </section>
        ))}
      </div>
    </article>
  )
}

export default RegionDetectionPanel
