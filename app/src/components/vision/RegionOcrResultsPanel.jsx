function getConfidenceStatus(confidence) {
  if (confidence >= 85) {
    return {
      label: 'Strong',
      className: 'success',
    }
  }

  if (confidence >= 55) {
    return {
      label: 'Review',
      className: 'warning',
    }
  }

  return {
    label: 'Weak',
    className: 'error',
  }
}

function RegionOcrResultsPanel({ regionOcr }) {
  const items = regionOcr?.items ?? []

  if (items.length === 0) {
    return null
  }

  return (
    <article className="card vision-debug-panel vision-region-ocr-panel">
      <div className="vision-region-ocr-heading">
        <div>
          <p className="eyebrow">Targeted recognition</p>
          <h2>Region OCR Results</h2>

          <p>
            Compare each processed crop with the text Tesseract
            recognized from that specific field.
          </p>
        </div>

        <span className="diagnostic-status unchanged">
          {items.length} region{items.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="vision-region-ocr-grid">
        {items.map((item) => {
          const status = getConfidenceStatus(item.confidence)

          return (
            <section
              className="vision-region-ocr-card"
              key={item.id}
            >
              <div className="vision-region-ocr-preview">
                {item.processedPreviewUrl ? (
                  <img
                    src={item.processedPreviewUrl}
                    alt={`${item.label} processed for OCR`}
                  />
                ) : (
                  <span>No processed preview</span>
                )}
              </div>

              <div className="vision-region-ocr-content">
                <div className="vision-region-ocr-title">
                  <div>
                    <strong>{item.label}</strong>
                    <span>{item.id}</span>
                  </div>

                  <span
                    className={`region-ocr-status ${status.className}`}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="vision-region-ocr-reading">
                  <span>OCR reading</span>

                  <code>
                    {item.rawText || 'No text detected'}
                  </code>
                </div>

                <dl className="vision-region-ocr-metadata">
                  <div>
                    <dt>Confidence</dt>
                    <dd>{item.confidence}%</dd>
                  </div>

                  <div>
                    <dt>Time</dt>
                    <dd>{item.timing?.duration ?? 0} ms</dd>
                  </div>
                </dl>
              </div>
            </section>
          )
        })}
      </div>
    </article>
  )
}

export default RegionOcrResultsPanel
