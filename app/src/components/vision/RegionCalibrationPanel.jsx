import { useEffect, useMemo, useState } from 'react'

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value))
}

function roundValue(value) {
  return Math.round(value * 1000) / 1000
}

function RegionCalibrationPanel({ previewUrl, regions }) {
  const [selectedRegionId, setSelectedRegionId] = useState('')
  const [draftRegions, setDraftRegions] = useState([])

  useEffect(() => {
    const sourceWidth = regions?.source?.width ?? 0
    const sourceHeight = regions?.source?.height ?? 0
    const items = regions?.items ?? []

    const nextRegions = items.map((region) => ({
      ...region,
      xPercent: sourceWidth ? region.x / sourceWidth : 0,
      yPercent: sourceHeight ? region.y / sourceHeight : 0,
      widthPercent: sourceWidth ? region.width / sourceWidth : 0,
      heightPercent: sourceHeight ? region.height / sourceHeight : 0,
    }))

    setDraftRegions(nextRegions)

    if (nextRegions.length > 0) {
      setSelectedRegionId((currentId) =>
        nextRegions.some((region) => region.id === currentId)
          ? currentId
          : nextRegions[0].id
      )
    }
  }, [regions])

  const selectedRegion = useMemo(
    () =>
      draftRegions.find(
        (region) => region.id === selectedRegionId
      ) ?? null,
    [draftRegions, selectedRegionId]
  )

  function updateSelectedRegion(field, value) {
    const numericValue = Number(value)

    setDraftRegions((currentRegions) =>
      currentRegions.map((region) => {
        if (region.id !== selectedRegionId) {
          return region
        }

        const nextRegion = {
          ...region,
          [field]: numericValue,
        }

        if (field === 'xPercent') {
          nextRegion.xPercent = clamp(
            numericValue,
            0,
            1 - nextRegion.widthPercent
          )
        }

        if (field === 'yPercent') {
          nextRegion.yPercent = clamp(
            numericValue,
            0,
            1 - nextRegion.heightPercent
          )
        }

        if (field === 'widthPercent') {
          nextRegion.widthPercent = clamp(
            numericValue,
            0.01,
            1 - nextRegion.xPercent
          )
        }

        if (field === 'heightPercent') {
          nextRegion.heightPercent = clamp(
            numericValue,
            0.01,
            1 - nextRegion.yPercent
          )
        }

        return nextRegion
      })
    )
  }

  function copySelectedRegion() {
    if (!selectedRegion) {
      return
    }

    const output = `{
  id: '${selectedRegion.id}',
  label: '${selectedRegion.label}',
  purpose: '${selectedRegion.purpose ?? ''}',
  xPercent: ${roundValue(selectedRegion.xPercent)},
  yPercent: ${roundValue(selectedRegion.yPercent)},
  widthPercent: ${roundValue(selectedRegion.widthPercent)},
  heightPercent: ${roundValue(selectedRegion.heightPercent)},
},`

    navigator.clipboard
      .writeText(output)
      .then(() => {
        window.alert(
          `${selectedRegion.label} coordinates copied.`
        )
      })
      .catch(() => {
        window.prompt('Copy these coordinates:', output)
      })
  }

  if (!previewUrl || draftRegions.length === 0) {
    return null
  }

  return (
    <article className="card vision-debug-panel vision-calibration-panel">
      <div className="vision-calibration-heading">
        <div>
          <p className="eyebrow">Developer calibration</p>
          <h2>Region Calibration</h2>
          <p>
            Select a region and adjust its percentage-based
            coordinates while watching the overlay update live.
          </p>
        </div>

        <button
          className="secondary-button"
          type="button"
          disabled={!selectedRegion}
          onClick={copySelectedRegion}
        >
          Copy Selected Region
        </button>
      </div>

      <div className="vision-calibration-layout">
        <div className="vision-calibration-image-shell">
          <div className="vision-calibration-image">
            <img
              src={previewUrl}
              alt="Screenshot with calibration overlays"
            />

            {draftRegions.map((region) => (
              <button
                className={
                  region.id === selectedRegionId
                    ? 'vision-calibration-box active'
                    : 'vision-calibration-box'
                }
                key={region.id}
                type="button"
                style={{
                  left: `${region.xPercent * 100}%`,
                  top: `${region.yPercent * 100}%`,
                  width: `${region.widthPercent * 100}%`,
                  height: `${region.heightPercent * 100}%`,
                }}
                onClick={() =>
                  setSelectedRegionId(region.id)
                }
              >
                <span>{region.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="vision-calibration-controls">
          <label>
            Region
            <select
              value={selectedRegionId}
              onChange={(event) =>
                setSelectedRegionId(event.target.value)
              }
            >
              {draftRegions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.label}
                </option>
              ))}
            </select>
          </label>

          {selectedRegion && (
            <>
              {[
                ['xPercent', 'X position'],
                ['yPercent', 'Y position'],
                ['widthPercent', 'Width'],
                ['heightPercent', 'Height'],
              ].map(([field, label]) => (
                <div
                  className="vision-calibration-control"
                  key={field}
                >
                  <div>
                    <span>{label}</span>
                    <strong>
                      {roundValue(selectedRegion[field])}
                    </strong>
                  </div>

                  <input
                    type="range"
                    min={field.includes('Percent') ? '0' : '0.01'}
                    max="1"
                    step="0.001"
                    value={selectedRegion[field]}
                    onChange={(event) =>
                      updateSelectedRegion(
                        field,
                        event.target.value
                      )
                    }
                  />
                </div>
              ))}

              <div className="vision-calibration-values">
                <code>
                  x: {roundValue(selectedRegion.xPercent)}
                </code>
                <code>
                  y: {roundValue(selectedRegion.yPercent)}
                </code>
                <code>
                  w: {roundValue(
                    selectedRegion.widthPercent
                  )}
                </code>
                <code>
                  h: {roundValue(
                    selectedRegion.heightPercent
                  )}
                </code>
              </div>
            </>
          )}
        </div>
      </div>
    </article>
  )
}

export default RegionCalibrationPanel
