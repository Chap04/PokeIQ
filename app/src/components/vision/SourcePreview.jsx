function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  const kilobytes = bytes / 1024

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`
  }

  return `${(kilobytes / 1024).toFixed(1)} MB`
}

function SourcePreview({
  previewUrl,
  selectedFile,
  imageDimensions,
  onImageLoad,
  onChooseDifferentImage,
  onRemove,
}) {
  return (
    <div className="vision-source-panel card">
      <div className="vision-source-image">
        <img
          src={previewUrl}
          alt="Selected Pokémon GO screenshot"
          onLoad={onImageLoad}
        />
      </div>

      <div className="vision-source-details">
        <div>
          <p className="eyebrow">Source image</p>
          <h2>{selectedFile.name}</h2>
        </div>

        <div className="vision-file-metadata">
          <div>
            <span>File size</span>
            <strong>{formatFileSize(selectedFile.size)}</strong>
          </div>

          <div>
            <span>Resolution</span>
            <strong>
              {imageDimensions
                ? `${imageDimensions.width} × ${imageDimensions.height}`
                : 'Reading…'}
            </strong>
          </div>

          <div>
            <span>File type</span>
            <strong>{selectedFile.type || 'Unknown'}</strong>
          </div>
        </div>

        <div className="vision-file-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={onChooseDifferentImage}
          >
            Choose Different Image
          </button>

          <button
            className="danger-button"
            type="button"
            onClick={onRemove}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}

export default SourcePreview
