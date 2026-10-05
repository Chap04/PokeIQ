import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  analyzeScreenshot,
} from '../services/vision/analyzeScreenshot'

import {
  analyzeRecording,
} from '../services/vision/analyzeRecording'

import {
  buildImportPokemon,
} from '../services/buildImportPokemon'

const TEAM_STORAGE_KEY =
  'pokeiq-appraisal-team'

const uploadSettings = {
  screenshot: {
    accept:
      'image/png,image/jpeg,image/webp',

    label:
      'Choose Screenshot',

    emptyText:
      'Drag a Pokémon GO screenshot here',
  },

  recording: {
    accept:
      'video/mp4,video/quicktime,video/webm',

    label:
      'Choose Recording',

    emptyText:
      'Drag a Pokémon GO screen recording here',
  },

  csv: {
    accept:
      '.csv,text/csv',

    label:
      'Choose CSV File',

    emptyText:
      'Drag a PokeIQ CSV file here',
  },
}

const teamOptions = [
  {
    id:
      'mystic',

    name:
      'Team Mystic',

    leader:
      'Blanche',

    icon:
      '❄️',

    colour:
      '#4f8cff',
  },

  {
    id:
      'instinct',

    name:
      'Team Instinct',

    leader:
      'Spark',

    icon:
      '⚡',

    colour:
      '#f4c542',
  },

  {
    id:
      'valor',

    name:
      'Team Valor',

    leader:
      'Candela',

    icon:
      '🔥',

    colour:
      '#ef5350',
  },
]

const screenshotTypeOptions = [
  {
    id:
      'pokemon-details-appraisal',

    label:
      'Pokémon Details — Appraisal Open',
  },
]

const processingSteps = {
  screenshot: [
    'Loading screenshot',
    'Detecting appraisal layout',
    'Locating Pokémon details',
    'Reading screenshot regions',
    'Checking detected values',
  ],

  recording: [
    'Loading recording',
    'Preparing video frames',
    'Finding Pokémon entries',
    'Reading visible details',
    'Preparing review results',
  ],

  csv: [
    'Reading CSV file',
    'Checking column names',
    'Validating Pokémon data',
    'Preparing import rows',
  ],
}

function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  const kilobytes =
    bytes / 1024

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(
      1
    )} KB`
  }

  const megabytes =
    kilobytes / 1024

  return `${megabytes.toFixed(
    1
  )} MB`
}

function getSavedTeam() {
  const savedTeam =
    window.localStorage.getItem(
      TEAM_STORAGE_KEY
    )

  const validTeam =
    teamOptions.some(
      (team) =>
        team.id ===
        savedTeam
    )

  return validTeam
    ? savedTeam
    : 'mystic'
}

function ImportUpload({
  method,
  onAnalyze,
}) {
  const [
    selectedFile,
    setSelectedFile,
  ] = useState(null)

  const [
    previewUrl,
    setPreviewUrl,
  ] = useState(null)

  const [
    isDragging,
    setIsDragging,
  ] = useState(false)

  const [
    isAnalyzing,
    setIsAnalyzing,
  ] = useState(false)

  const [
    analysisError,
    setAnalysisError,
  ] = useState('')

  const [
    selectedTeam,
    setSelectedTeam,
  ] = useState(
    getSavedTeam
  )

  const [
    screenshotType,
    setScreenshotType,
  ] = useState(
    'pokemon-details-appraisal'
  )

  const [
    processingStepIndex,
    setProcessingStepIndex,
  ] = useState(0)

  const [
    recordingProgress,
    setRecordingProgress,
  ] = useState(null)

  const fileInputRef =
    useRef(null)

  const processingIntervalRef =
    useRef(null)

  const settings =
    uploadSettings[method]

  const steps =
    processingSteps[
      method
    ] ?? []

  const selectedTeamDetails =
    teamOptions.find(
      (team) =>
        team.id ===
        selectedTeam
    )

  useEffect(() => {
    if (
      !selectedFile ||
      method === 'csv'
    ) {
      setPreviewUrl(null)

      return undefined
    }

    const objectUrl =
      URL.createObjectURL(
        selectedFile
      )

    setPreviewUrl(
      objectUrl
    )

    return () => {
      URL.revokeObjectURL(
        objectUrl
      )
    }
  }, [
    selectedFile,
    method,
  ])

  useEffect(() => {
    window.localStorage.setItem(
      TEAM_STORAGE_KEY,
      selectedTeam
    )
  }, [
    selectedTeam,
  ])

  useEffect(() => {
    return () => {
      if (
        processingIntervalRef.current
      ) {
        window.clearInterval(
          processingIntervalRef.current
        )
      }
    }
  }, [])

  function chooseFile() {
    if (isAnalyzing) {
      return
    }

    fileInputRef.current?.click()
  }

  function selectFile(file) {
    if (
      !file ||
      isAnalyzing
    ) {
      return
    }

    setSelectedFile(
      file
    )

    setProcessingStepIndex(
      0
    )

    setRecordingProgress(
      null
    )

    setAnalysisError(
      ''
    )
  }

  function handleInputChange(
    event
  ) {
    selectFile(
      event.target.files?.[0]
    )
  }

  function handleDragOver(
    event
  ) {
    event.preventDefault()

    if (!isAnalyzing) {
      setIsDragging(
        true
      )
    }
  }

  function handleDragLeave(
    event
  ) {
    event.preventDefault()

    setIsDragging(
      false
    )
  }

  function handleDrop(
    event
  ) {
    event.preventDefault()

    setIsDragging(
      false
    )

    selectFile(
      event.dataTransfer
        .files?.[0]
    )
  }

  function removeFile() {
    if (isAnalyzing) {
      return
    }

    setSelectedFile(
      null
    )

    setProcessingStepIndex(
      0
    )

    setRecordingProgress(
      null
    )

    setAnalysisError(
      ''
    )

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        ''
    }
  }

  function stopProcessingInterval() {
    if (
      !processingIntervalRef.current
    ) {
      return
    }

    window.clearInterval(
      processingIntervalRef.current
    )

    processingIntervalRef.current =
      null
  }

  function startProcessingProgress() {
    stopProcessingInterval()

    setProcessingStepIndex(
      0
    )

    if (
      steps.length <= 1
    ) {
      return
    }

    processingIntervalRef.current =
      window.setInterval(
        () => {
          setProcessingStepIndex(
            (
              currentIndex
            ) => {
              const finalWaitingStep =
                Math.max(
                  steps.length -
                    2,
                  0
                )

              if (
                currentIndex >=
                finalWaitingStep
              ) {
                return finalWaitingStep
              }

              return (
                currentIndex +
                1
              )
            }
          )
        },
        700
      )
  }

  function handleRecordingProgress(
    progress
  ) {
    setRecordingProgress(
      progress
    )

    if (
      progress.phase ===
      'loading'
    ) {
      setProcessingStepIndex(
        0
      )

      return
    }

    if (
      progress.phase ===
      'frames'
    ) {
      setProcessingStepIndex(
        1
      )

      return
    }

    if (
      progress.phase ===
      'analysis'
    ) {
      setProcessingStepIndex(
        progress.current <
          progress.total
          ? 3
          : 4
      )
    }
  }

  async function handleAnalyze() {
    if (
      !selectedFile ||
      isAnalyzing ||
      steps.length === 0
    ) {
      return
    }

    setAnalysisError(
      ''
    )

    setRecordingProgress(
      null
    )

    setIsAnalyzing(
      true
    )

    startProcessingProgress()

    try {
      // --------------------------------------------
      // Screenshot
      // --------------------------------------------

      if (
        method ===
        'screenshot'
      ) {
        const analysis =
          await analyzeScreenshot(
            selectedFile,
            selectedTeam
          )

        setProcessingStepIndex(
          Math.max(
            steps.length -
              1,
            0
          )
        )

        const importedPokemon =
          buildImportPokemon(
            analysis,
            {
              team:
                selectedTeam,

              screenshotType,
            }
          )

        stopProcessingInterval()

        onAnalyze({
          file:
            selectedFile,

          method,

          team:
            selectedTeam,

          screenshotType,

          analysis,

          importedPokemon,
        })

        return
      }

      // --------------------------------------------
      // Screen recording
      // --------------------------------------------

      if (
        method ===
        'recording'
      ) {
        stopProcessingInterval()

        const analysis =
          await analyzeRecording(
            selectedFile,
            {
              onProgress:
                handleRecordingProgress,
            }
          )

        setProcessingStepIndex(
          Math.max(
            steps.length -
              1,
            0
          )
        )

        onAnalyze({
          file:
            selectedFile,

          method,

          team:
            null,

          screenshotType:
            null,

          analysis,

          importedPokemon:
            analysis.detectedPokemon,
        })

        return
      }

      // --------------------------------------------
      // CSV
      // --------------------------------------------

      stopProcessingInterval()

      onAnalyze({
        file:
          selectedFile,

        method,

        team:
          null,

        screenshotType:
          null,

        analysis:
          null,

        importedPokemon:
          null,
      })
    } catch (error) {
      console.error(
        'PokeIQ import analysis failed:',
        error
      )

      stopProcessingInterval()

      setProcessingStepIndex(
        0
      )

      setRecordingProgress(
        null
      )

      const fallbackMessage =
        method ===
        'recording'
          ? 'PokeIQ could not analyze this recording.'
          : method ===
              'screenshot'
            ? 'PokeIQ could not analyze this screenshot.'
            : 'PokeIQ could not read this file.'

      setAnalysisError(
        error instanceof Error
          ? error.message
          : fallbackMessage
      )
    } finally {
      setIsAnalyzing(
        false
      )
    }
  }

  if (!settings) {
    return null
  }

  return (
    <div className="import-upload">
      <input
        ref={
          fileInputRef
        }
        className="visually-hidden"
        type="file"
        accept={
          settings.accept
        }
        onChange={
          handleInputChange
        }
      />

      {method ===
        'screenshot' && (
        <div className="import-configuration">
          <div className="card import-setting-card">
            <div className="section-header">
              <div>
                <p className="eyebrow">
                  Appraisal settings
                </p>

                <h3>
                  Pokémon GO Team
                </h3>

                <p>
                  Choose the team
                  leader shown during
                  appraisal. PokeIQ
                  will remember this
                  selection.
                </p>
              </div>
            </div>

            <div className="import-team-options">
              {teamOptions.map(
                (team) => {
                  const isSelected =
                    selectedTeam ===
                    team.id

                  return (
                    <button
                      key={
                        team.id
                      }
                      className={
                        isSelected
                          ? 'import-team-option selected'
                          : 'import-team-option'
                      }
                      style={{
                        '--team-colour':
                          team.colour,
                      }}
                      type="button"
                      disabled={
                        isAnalyzing
                      }
                      onClick={() => {
                        setSelectedTeam(
                          team.id
                        )

                        setAnalysisError(
                          ''
                        )
                      }}
                    >
                      <span className="import-team-icon">
                        {
                          team.icon
                        }
                      </span>

                      <span>
                        <strong>
                          {
                            team.name
                          }
                        </strong>

                        <small>
                          {
                            team.leader
                          }
                        </small>
                      </span>

                      <span
                        className="import-team-check"
                        aria-hidden="true"
                      >
                        {isSelected
                          ? '✓'
                          : ''}
                      </span>
                    </button>
                  )
                }
              )}
            </div>

            {selectedTeamDetails && (
              <p className="import-setting-summary">
                Appraisal
                layout:{' '}
                <strong>
                  {
                    selectedTeamDetails.leader
                  }
                </strong>
              </p>
            )}
          </div>

          <div className="card import-setting-card">
            <label htmlFor="screenshot-type">
              <p className="eyebrow">
                Screenshot format
              </p>

              <h3>
                Screenshot Type
              </h3>

              <p>
                Select the screen
                shown in your
                uploaded screenshot.
              </p>
            </label>

            <select
              id="screenshot-type"
              className="import-setting-select"
              value={
                screenshotType
              }
              disabled={
                isAnalyzing
              }
              onChange={(
                event
              ) => {
                setScreenshotType(
                  event.target
                    .value
                )

                setAnalysisError(
                  ''
                )
              }}
            >
              {screenshotTypeOptions.map(
                (option) => (
                  <option
                    key={
                      option.id
                    }
                    value={
                      option.id
                    }
                  >
                    {
                      option.label
                    }
                  </option>
                )
              )}
            </select>

            <p className="import-setting-note">
              More screenshot
              formats will be added
              later.
            </p>
          </div>
        </div>
      )}

      {!selectedFile ? (
        <div
          className={
            isDragging
              ? 'import-drop-zone dragging'
              : 'import-drop-zone'
          }
          onDragOver={
            handleDragOver
          }
          onDragLeave={
            handleDragLeave
          }
          onDrop={
            handleDrop
          }
        >
          <span className="import-drop-icon">
            {method ===
              'screenshot' &&
              '📸'}

            {method ===
              'recording' &&
              '🎥'}

            {method ===
              'csv' &&
              '📄'}
          </span>

          <div>
            <h3>
              {
                settings.emptyText
              }
            </h3>

            <p>
              or select a file
              from your device
            </p>
          </div>

          <button
            className="secondary-button"
            type="button"
            onClick={
              chooseFile
            }
          >
            {
              settings.label
            }
          </button>
        </div>
      ) : (
        <div className="import-file-preview">
          <div className="import-preview-media">
            {method ===
              'screenshot' &&
              previewUrl && (
                <img
                  src={
                    previewUrl
                  }
                  alt="Selected Pokémon GO screenshot"
                />
              )}

            {method ===
              'recording' &&
              previewUrl && (
                <video
                  src={
                    previewUrl
                  }
                  controls
                />
              )}

            {method ===
              'csv' && (
              <div className="csv-file-icon">
                📄
              </div>
            )}
          </div>

          <div className="import-file-details">
            <p className="eyebrow">
              Selected file
            </p>

            <h3>
              {
                selectedFile.name
              }
            </h3>

            <p>
              {selectedFile.type ||
                'Unknown file type'}
              {' · '}
              {formatFileSize(
                selectedFile.size
              )}
            </p>

            {method ===
              'screenshot' &&
              selectedTeamDetails && (
                <p>
                  {
                    selectedTeamDetails.icon
                  }{' '}
                  {
                    selectedTeamDetails.name
                  }
                  {' · '}
                  {
                    selectedTeamDetails.leader
                  }
                </p>
              )}

            <div className="import-file-actions">
              <button
                className="secondary-button"
                type="button"
                disabled={
                  isAnalyzing
                }
                onClick={
                  chooseFile
                }
              >
                Choose Different
                File
              </button>

              <button
                className="danger-button"
                type="button"
                disabled={
                  isAnalyzing
                }
                onClick={
                  removeFile
                }
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {analysisError && (
        <div className="card import-analysis-error">
          <strong>
            Analysis could not be
            completed
          </strong>

          <p>
            {analysisError}
          </p>
        </div>
      )}

      <button
        className="primary-button import-analyze-button"
        type="button"
        disabled={
          !selectedFile ||
          isAnalyzing
        }
        onClick={
          handleAnalyze
        }
      >
        {isAnalyzing
          ? 'Analyzing…'
          : method ===
              'recording'
            ? 'Analyze Recording'
            : method ===
                'screenshot'
              ? 'Analyze Screenshot'
              : 'Read CSV File'}
      </button>

      {isAnalyzing && (
        <div className="import-processing">
          <div className="import-processing-spinner" />

          <div className="import-processing-content">
            <strong>
              {steps[
                processingStepIndex
              ] ??
                'Processing your file'}
            </strong>

            <p>
              Step{' '}
              {processingStepIndex +
                1}{' '}
              of {steps.length}
            </p>

            {method ===
              'recording' &&
              recordingProgress && (
                <p>
                  {recordingProgress.phase ===
                    'frames' &&
                    `Extracting frame ${recordingProgress.current} of ${recordingProgress.total}`}

                  {recordingProgress.phase ===
                    'analysis' &&
                    `Analyzing frame ${recordingProgress.current} of ${recordingProgress.total}`}
                </p>
              )}

            <div className="import-processing-steps">
              {steps.map(
                (
                  step,
                  index
                ) => {
                  const isComplete =
                    index <
                    processingStepIndex

                  const isCurrent =
                    index ===
                    processingStepIndex

                  return (
                    <div
                      key={
                        step
                      }
                      className={
                        isCurrent
                          ? 'import-processing-step current'
                          : isComplete
                            ? 'import-processing-step complete'
                            : 'import-processing-step'
                      }
                    >
                      <span>
                        {isComplete
                          ? '✓'
                          : isCurrent
                            ? '●'
                            : '○'}
                      </span>

                      <span>
                        {step}
                      </span>
                    </div>
                  )
                }
              )}
            </div>

            <p className="import-processing-note">
              {method ===
              'recording'
                ? 'PokeIQ is sampling the recording and reading your Pokémon storage. Longer recordings will require more OCR work.'
                : 'PokeIQ is running the real Vision pipeline.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImportUpload