import { useEffect, useRef, useState } from 'react'
import PipelineSummary from '../components/vision/PipelineSummary'
import SourcePreview from '../components/vision/SourcePreview'
import ParsedPokemonCard from '../components/vision/ParsedPokemonCard'
import RegionDetectionPanel from '../components/vision/RegionDetectionPanel'
import RegionOcrResultsPanel from '../components/vision/RegionOcrResultsPanel'
import RegionCalibrationPanel from '../components/vision/RegionCalibrationPanel'
import { analyzeScreenshot } from '../services/vision/analyzeScreenshot'
import AppraisalDiagnosticsPanel from '../components/vision/AppraisalDiagnosticsPanel'

const TEAM_STORAGE_KEY = 'pokeiq-team'


function formatFieldName(field) {
  return field.charAt(0).toUpperCase() + field.slice(1)
}

function getConfidenceClass(confidence) {
  if (confidence >= 90) {
    return 'iv-perfect'
  }

  if (confidence >= 75) {
    return 'iv-good'
  }

  if (confidence >= 50) {
    return 'iv-average'
  }

  return 'iv-low'
}

function VisionLab({ onBack }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [imageDimensions, setImageDimensions] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [showAdvancedDiagnostics, setShowAdvancedDiagnostics] =
    useState(false)

  const [selectedTeam, setSelectedTeam] = useState(() => {
    return localStorage.getItem(TEAM_STORAGE_KEY) ?? 'mystic'
  })

  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null)
      setImageDimensions(null)
      return undefined
    }

    const objectUrl = URL.createObjectURL(selectedFile)
    setPreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [selectedFile])

  useEffect(() => {
    localStorage.setItem(
      TEAM_STORAGE_KEY,
      selectedTeam
    )
  }, [selectedTeam])

  function chooseFile() {
    fileInputRef.current?.click()
  }

  function selectFile(file) {
    if (!file) {
      return
    }

    setSelectedFile(file)
    setAnalysisResult(null)
    setImageDimensions(null)
    setShowAdvancedDiagnostics(false)
  }

  function handleFileChange(event) {
    selectFile(event.target.files?.[0])
  }

  function handleDragOver(event) {
    event.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(event) {
    event.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(event) {
    event.preventDefault()
    setIsDragging(false)
    selectFile(event.dataTransfer.files?.[0])
  }

  function removeFile() {
    setSelectedFile(null)
    setAnalysisResult(null)
    setImageDimensions(null)
    setShowAdvancedDiagnostics(false)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function runAnalysis() {
    if (!selectedFile || isAnalyzing) {
      return
    }

    setIsAnalyzing(true)
    setAnalysisResult(null)
    setShowAdvancedDiagnostics(false)

    try {
      const result = await analyzeScreenshot(
        selectedFile,
        selectedTeam
      )
      setAnalysisResult(result)
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : 'The screenshot could not be analyzed.'
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  const parsedPokemon = analysisResult?.parsedPokemon
  const diagnostics = analysisResult?.diagnostics
  const normalization = diagnostics?.normalization
  const extractedFields = diagnostics?.extractedFields
  const pipelineSummary = analysisResult?.pipelineSummary ?? []

  const corrections = normalization?.corrections ?? []

  return (
    <main className="app">
      <button
        className="back-button"
        type="button"
        onClick={onBack}
      >
        ← Back to Developer Tools
      </button>

      <header className="header">
        <p className="eyebrow">PokeIQ Development</p>
        <h1>Vision Lab</h1>

        <p className="subtitle">
          Inspect each stage of PokeIQ’s screenshot-recognition
          pipeline.
        </p>
      </header>

      <section className="section">
        <div className="vision-workspace">
          <input
            ref={fileInputRef}
            className="visually-hidden"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
          />

          {!selectedFile ? (
            <div
              className={
                isDragging
                  ? 'vision-drop-zone dragging'
                  : 'vision-drop-zone'
              }
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <span className="vision-drop-icon">👁️</span>

              <div>
                <h2>Drop a screenshot here</h2>
                <p>or choose one from your device</p>
              </div>

              <button
                className="primary-button"
                type="button"
                onClick={chooseFile}
              >
                Choose Screenshot
              </button>

              <small>PNG • JPEG • WEBP</small>
            </div>
          ) : (
            <>
              <SourcePreview
                previewUrl={previewUrl}
                selectedFile={selectedFile}
                imageDimensions={imageDimensions}
                onImageLoad={(event) =>
                  setImageDimensions({
                    width: event.currentTarget.naturalWidth,
                    height: event.currentTarget.naturalHeight,
                  })
                }
                onChooseDifferentImage={chooseFile}
                onRemove={removeFile}
              />

              <div className="vision-analysis-actions">
                <div className="vision-team-selector">
                  <label htmlFor="vision-team-select">
                    Pokémon GO Team
                  </label>

                  <select
                    id="vision-team-select"
                    value={selectedTeam}
                    disabled={isAnalyzing}
                    onChange={(event) => {
                      setSelectedTeam(event.target.value)
                      setAnalysisResult(null)
                    }}
                  >
                    <option value="mystic">
                      Mystic (Blanche)
                    </option>

                    <option value="instinct">
                      Instinct (Spark)
                    </option>

                    <option value="valor">
                      Valor (Candela)
                    </option>
                  </select>
                </div>

                <button
                  className="primary-button"
                  type="button"
                  disabled={isAnalyzing}
                  onClick={runAnalysis}
                >
                  {isAnalyzing
                    ? 'Running Analysis…'
                    : 'Analyze Screenshot'}
                </button>
              </div>
            </>
          )}

          {isAnalyzing && (
            <div className="import-processing">
              <div className="import-processing-spinner" />

              <div>
                <strong>Analyzing screenshot</strong>

                <p>
                  OCR, preprocessing, and appraisal diagnostics are
                  running.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {analysisResult && parsedPokemon && (
        <>
          <PipelineSummary stages={pipelineSummary} />

          <section className="section vision-debug-grid">
            <article className="card vision-debug-panel">
              <p className="eyebrow">Stage 1</p>
              <h2>Source Preview</h2>

              <div className="vision-debug-image">
                <img
                  src={previewUrl}
                  alt="Screenshot under analysis"
                />
              </div>
            </article>

            <article className="card vision-debug-panel">
              <p className="eyebrow">Stage 2</p>
              <h2>Raw OCR</h2>

              <pre className="vision-raw-text">
                {analysisResult.rawText}
              </pre>
            </article>

            <article className="card vision-debug-panel">
              <p className="eyebrow">Appraisal Layout</p>

              <h2>
                {analysisResult.regions?.leader ?? 'Unknown leader'}
              </h2>

              <p>
                Team:{' '}
                <strong>
                  {analysisResult.regions?.team ?? selectedTeam}
                </strong>
              </p>

              <small>
                {analysisResult.regions?.layout ??
                  'No layout information'}
              </small>
            </article>

            <RegionDetectionPanel
              regions={analysisResult.regions}
            />

            <RegionCalibrationPanel
              previewUrl={previewUrl}
              regions={analysisResult.regions}
            />

            <RegionOcrResultsPanel
              regionOcr={analysisResult.regionOcr}
            />

            <AppraisalDiagnosticsPanel
              appraisal={
                analysisResult.diagnostics?.appraisal
              }
            />

            <ParsedPokemonCard pokemon={parsedPokemon} />

            <article className="card vision-debug-panel">
              <p className="eyebrow">Stage 4</p>
              <h2>Confidence</h2>

              <div className="vision-confidence-list">
                {Object.entries(analysisResult.confidence).map(
                  ([field, confidence]) => (
                    <div
                      className="vision-confidence-item"
                      key={field}
                    >
                      <div>
                        <span>{formatFieldName(field)}</span>

                        <strong
                          className={getConfidenceClass(
                            confidence
                          )}
                        >
                          {confidence}%
                        </strong>
                      </div>

                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${confidence}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            </article>

            <article className="card vision-debug-panel vision-timing-panel">
              <p className="eyebrow">Diagnostics</p>
              <h2>Timing</h2>

              <div className="vision-timing-grid">
                <div>
                  <span>Preprocessing</span>
                  <strong>
                    {analysisResult.timing.preprocessing ?? 0} ms
                  </strong>
                </div>

                <div>
                  <span>OCR</span>
                  <strong>
                    {analysisResult.timing.ocr} ms
                  </strong>
                </div>

                <div>
                  <span>Region OCR</span>
                  <strong>
                    {analysisResult.timing.regionOcr ?? 0} ms
                  </strong>
                </div>

                <div>
                  <span>Parser</span>
                  <strong>
                    {analysisResult.timing.parser} ms
                  </strong>
                </div>

                <div>
                  <span>Appraisal</span>
                  <strong>
                    {analysisResult.timing.appraisal ?? 0} ms
                  </strong>
                </div>

                <div>
                  <span>Total</span>
                  <strong>
                    {analysisResult.timing.total} ms
                  </strong>
                </div>
              </div>
            </article>

            {diagnostics && (
              <article className="card vision-debug-panel vision-diagnostics-toggle-panel">
                <div className="vision-diagnostics-heading">
                  <div>
                    <p className="eyebrow">
                      Developer inspection
                    </p>

                    <h2>Parser Diagnostics</h2>

                    <p>
                      Inspect normalization, field extraction,
                      corrections, and species matching.
                    </p>
                  </div>

                  <label className="diagnostics-toggle">
                    <input
                      type="checkbox"
                      checked={showAdvancedDiagnostics}
                      onChange={(event) =>
                        setShowAdvancedDiagnostics(
                          event.target.checked
                        )
                      }
                    />

                    <span className="diagnostics-toggle-track">
                      <span className="diagnostics-toggle-thumb" />
                    </span>

                    Advanced Diagnostics
                  </label>
                </div>

                {showAdvancedDiagnostics && (
                  <div className="vision-diagnostics-content">
                    <section className="vision-diagnostic-section">
                      <div className="vision-diagnostic-title">
                        <h3>Normalization</h3>

                        <span
                          className={
                            normalization?.changed
                              ? 'diagnostic-status changed'
                              : 'diagnostic-status unchanged'
                          }
                        >
                          {normalization?.changed
                            ? `${corrections.length} correction${
                                corrections.length === 1
                                  ? ''
                                  : 's'
                              }`
                            : 'No corrections'}
                        </span>
                      </div>

                      <div className="vision-text-comparison">
                        <div>
                          <span>Original text</span>

                          <pre>
                            {normalization?.originalText ??
                              analysisResult.rawText}
                          </pre>
                        </div>

                        <div>
                          <span>Normalized text</span>

                          <pre>
                            {normalization?.normalizedText ??
                              analysisResult.rawText}
                          </pre>
                        </div>
                      </div>

                      <div className="vision-extraction-grid">
                        {corrections.length === 0 ? (
                          <div className="vision-extraction-card">
                            <span>Corrections applied</span>
                            <strong>None</strong>

                            <p>
                              The OCR text did not need normalization
                              changes.
                            </p>
                          </div>
                        ) : (
                          corrections.map(
                            (correction, index) => (
                              <div
                                className="vision-extraction-card"
                                key={`${correction.type}-${index}`}
                              >
                                <span>
                                  Correction {index + 1}
                                </span>

                                <strong>
                                  {correction.description}
                                </strong>

                                {correction.before !==
                                  correction.after && (
                                  <>
                                    <p>
                                      Before: {correction.before}
                                    </p>

                                    <p>
                                      After: {correction.after}
                                    </p>
                                  </>
                                )}
                              </div>
                            )
                          )
                        )}
                      </div>
                    </section>

                    <section className="vision-diagnostic-section">
                      <h3>Field Extraction</h3>

                      <div className="vision-extraction-grid">
                        <div className="vision-extraction-card">
                          <span>Species detected</span>

                          <strong>
                            {extractedFields?.species
                              ?.originalText || 'Not detected'}
                          </strong>

                          <p>
                            Matched:{' '}
                            {extractedFields?.species?.species
                              ?.name || 'Unknown'}
                          </p>

                          <small>
                            Similarity:{' '}
                            {extractedFields?.species
                              ?.confidence ?? 0}
                            %
                          </small>
                        </div>

                        <div className="vision-extraction-card">
                          <span>CP detected</span>

                          <strong>
                            {extractedFields?.cp?.rawValue ||
                              'Not detected'}
                          </strong>

                          <p>
                            Parsed:{' '}
                            {extractedFields?.cp?.value ??
                              'Unknown'}
                          </p>

                          <small>
                            Confidence:{' '}
                            {extractedFields?.cp?.confidence ??
                              0}
                            %
                          </small>
                        </div>

                        <div className="vision-extraction-card">
                          <span>IVs detected</span>

                          <strong>
                            {extractedFields?.ivs?.rawValue ||
                              'Not detected'}
                          </strong>

                          <p>
                            Parsed:{' '}
                            {extractedFields?.ivs?.value
                              ?.attack ?? '—'}{' '}
                            /{' '}
                            {extractedFields?.ivs?.value
                              ?.defense ?? '—'}{' '}
                            /{' '}
                            {extractedFields?.ivs?.value
                              ?.stamina ?? '—'}
                          </p>

                          <small>
                            Confidence:{' '}
                            {extractedFields?.ivs?.confidence ??
                              0}
                            %
                          </small>
                        </div>

                        <div className="vision-extraction-card">
                          <span>Traits detected</span>

                          <div className="pokemon-badges">
                            {extractedFields?.traits?.shiny ? (
                              <span className="pokemon-badge shiny-badge">
                                ✨ Shiny
                              </span>
                            ) : (
                              <span className="pokemon-badge">
                                Not Shiny
                              </span>
                            )}

                            {extractedFields?.traits?.shadow ? (
                              <span className="pokemon-badge shadow-badge">
                                Shadow
                              </span>
                            ) : (
                              <span className="pokemon-badge">
                                Not Shadow
                              </span>
                            )}

                            {extractedFields?.traits?.purified && (
                              <span className="pokemon-badge purified-badge">
                                Purified
                              </span>
                            )}

                            {extractedFields?.traits?.lucky && (
                              <span className="pokemon-badge lucky-badge">
                                Lucky
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                )}
              </article>
            )}
          </section>
        </>
      )}
    </main>
  )
}

export default VisionLab