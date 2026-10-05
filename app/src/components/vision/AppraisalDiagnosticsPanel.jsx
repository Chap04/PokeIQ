function formatIvValue(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return '—'
  }

  return `${value}/15`
}

function AppraisalDiagnosticsPanel({
  appraisal,
}) {
  if (!appraisal) {
    return (
      <article className="card vision-debug-panel">
        <p className="eyebrow">
          Appraisal diagnostics
        </p>

        <h2>IV Detection</h2>

        <p>
          No appraisal diagnostic result was returned.
        </p>
      </article>
    )
  }

  const detectedBars =
    appraisal.detectedBars ?? []

  const previewUrl =
    appraisal.detectionPreviewUrl ??
    appraisal.cropPreviewUrl ??
    null

  return (
    <article className="card vision-debug-panel">
      <p className="eyebrow">
        Appraisal diagnostics
      </p>

      <h2>IV Bar Alignment</h2>

      <p>
        Blue rectangles show the expected IV-bar regions.
        Later, detected fill can be shown inside them.
      </p>

      {previewUrl ? (
        <div className="vision-debug-image">
          <img
            src={previewUrl}
            alt="Appraisal IV detection preview"
          />
        </div>
      ) : (
        <div className="empty-state">
          <p>
            No appraisal preview was generated.
          </p>
        </div>
      )}

      {detectedBars.length > 0 && (
        <div className="vision-extraction-grid">
          {detectedBars.map((bar) => (
            <div
              className="vision-extraction-card"
              key={bar.stat}
            >
              <span>
                {bar.stat === 'stamina'
                  ? 'HP'
                  : bar.stat.charAt(0).toUpperCase() +
                    bar.stat.slice(1)}
              </span>

              <strong>
                {formatIvValue(bar.value)}
              </strong>

              <p>
                Status:{' '}
                {bar.status ??
                  (bar.value === null
                    ? 'Not detected'
                    : 'Detected')}
              </p>

              <small>
                Confidence: {bar.confidence ?? 0}%
              </small>
            </div>
          ))}
        </div>
      )}

      {appraisal.appraisalRegion && (
        <details className="vision-diagnostic-details">
          <summary>
            Appraisal crop coordinates
          </summary>

          <pre className="vision-raw-text">
            {JSON.stringify(
              appraisal.appraisalRegion,
              null,
              2
            )}
          </pre>
        </details>
      )}

      {appraisal.barRegions && (
        <details className="vision-diagnostic-details">
          <summary>
            IV-bar coordinates
          </summary>

          <pre className="vision-raw-text">
            {JSON.stringify(
              appraisal.barRegions,
              null,
              2
            )}
          </pre>
        </details>
      )}
    </article>
  )
}

export default AppraisalDiagnosticsPanel