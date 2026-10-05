import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  buildRecordingTimestamps,
  extractRecordingFrames,
} from '../services/vision/extractRecordingFrames'

import {
  detectStorageRegions,
} from '../services/vision/detectStorageRegions'

import {
  cropStorageRegions,
} from '../services/vision/cropStorageRegions'

import {
  analyzeStorageCrop,
} from '../services/vision/analyzeStorageCrop'

import {
  analyzeStorageFrame,
} from '../services/vision/analyzeStorageFrame'

// --------------------------------------------------
// Recording Lab
// --------------------------------------------------

const samplingOptions = [
  {
    value: 0.25,
    label:
      'Every 0.25 seconds',
  },
  {
    value: 0.5,
    label:
      'Every 0.5 seconds',
  },
  {
    value: 1,
    label:
      'Every 1 second',
  },
  {
    value: 2,
    label:
      'Every 2 seconds',
  },
]

// --------------------------------------------------
// Display helpers
// --------------------------------------------------

function formatFileSize(
  bytes
) {
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

function formatTimestamp(
  seconds
) {
  const safeSeconds =
    Math.max(
      0,
      seconds
    )

  const minutes =
    Math.floor(
      safeSeconds / 60
    )

  const remainingSeconds =
    safeSeconds % 60

  return `${minutes}:${remainingSeconds
    .toFixed(2)
    .padStart(5, '0')}`
}

// --------------------------------------------------
// Component
// --------------------------------------------------

function RecordingLab({
  onBack,
}) {
  // ------------------------------------------------
  // Recording state
  // ------------------------------------------------

  const [
    selectedFile,
    setSelectedFile,
  ] =
    useState(null)

  const [
    previewUrl,
    setPreviewUrl,
  ] =
    useState(null)

  const [
    videoDetails,
    setVideoDetails,
  ] =
    useState(null)

  const [
    samplingInterval,
    setSamplingInterval,
  ] =
    useState(0.5)

  const [
    extractedFrames,
    setExtractedFrames,
  ] =
    useState([])

  // ------------------------------------------------
  // Storage geometry state
  // ------------------------------------------------

  const [
    detectedRegions,
    setDetectedRegions,
  ] =
    useState({})

  const [
    frameCrops,
    setFrameCrops,
  ] =
    useState({})

  // ------------------------------------------------
  // Individual crop OCR state
  // ------------------------------------------------

  const [
    cropOcrResults,
    setCropOcrResults,
  ] =
    useState({})

  const [
    croppingFrameId,
    setCroppingFrameId,
  ] =
    useState(null)

  const [
    analyzingCropId,
    setAnalyzingCropId,
  ] =
    useState(null)

  // ------------------------------------------------
  // Whole-frame OCR state
  // ------------------------------------------------

  const [
    analyzingFrameId,
    setAnalyzingFrameId,
  ] =
    useState(null)

  const [
    frameAnalysisResults,
    setFrameAnalysisResults,
  ] =
    useState({})

  const [
    frameAnalysisProgress,
    setFrameAnalysisProgress,
  ] =
    useState({
      current: 0,
      total: 0,
    })

  // ------------------------------------------------
  // General processing state
  // ------------------------------------------------

  const [
    isExtracting,
    setIsExtracting,
  ] =
    useState(false)

  const [
    progress,
    setProgress,
  ] =
    useState({
      current: 0,
      total: 0,
    })

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState('')

  const [
    isDragging,
    setIsDragging,
  ] =
    useState(false)

  const fileInputRef =
    useRef(null)

  const videoRef =
    useRef(null)

  // ------------------------------------------------
  // Recording preview URL
  // ------------------------------------------------

  useEffect(() => {
    if (!selectedFile) {
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
  }, [selectedFile])

  // ------------------------------------------------
  // Reset helpers
  // ------------------------------------------------

  function clearResults() {
    setExtractedFrames(
      []
    )

    setDetectedRegions(
      {}
    )

    setFrameCrops(
      {}
    )

    setCropOcrResults(
      {}
    )

    setFrameAnalysisResults(
      {}
    )

    setCroppingFrameId(
      null
    )

    setAnalyzingCropId(
      null
    )

    setAnalyzingFrameId(
      null
    )

    setProgress({
      current: 0,
      total: 0,
    })

    setFrameAnalysisProgress({
      current: 0,
      total: 0,
    })
  }

  function clearFrameAnalysis(
    frameId
  ) {
    setFrameAnalysisResults(
      (current) => {
        const next = {
          ...current,
        }

        delete next[
          frameId
        ]

        return next
      }
    )
  }

  // ------------------------------------------------
  // File selection
  // ------------------------------------------------

  function chooseFile() {
    if (
      isExtracting ||
      analyzingFrameId
    ) {
      return
    }

    fileInputRef.current
      ?.click()
  }

  function selectFile(
    file
  ) {
    if (
      !file ||
      isExtracting ||
      analyzingFrameId
    ) {
      return
    }

    if (
      !file.type.startsWith(
        'video/'
      )
    ) {
      setErrorMessage(
        'Please select a video recording.'
      )

      return
    }

    setSelectedFile(
      file
    )

    setVideoDetails(
      null
    )

    clearResults()

    setErrorMessage(
      ''
    )
  }

  function handleFileChange(
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

    if (
      !isExtracting &&
      !analyzingFrameId
    ) {
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
    if (
      isExtracting ||
      analyzingFrameId
    ) {
      return
    }

    setSelectedFile(
      null
    )

    setVideoDetails(
      null
    )

    clearResults()

    setErrorMessage(
      ''
    )

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        ''
    }
  }

  // ------------------------------------------------
  // Video metadata
  // ------------------------------------------------

  function handleVideoMetadata() {
    const video =
      videoRef.current

    if (!video) {
      return
    }

    setVideoDetails({
      duration:
        video.duration,

      width:
        video.videoWidth,

      height:
        video.videoHeight,
    })

    setErrorMessage(
      ''
    )
  }

  function handleVideoError() {
    setVideoDetails(
      null
    )

    setErrorMessage(
      'This browser could not decode the recording. The file may use an unsupported video codec.'
    )
  }

  // ------------------------------------------------
  // Frame extraction
  // ------------------------------------------------

  async function handleExtractFrames() {
    const video =
      videoRef.current

    if (
      !video ||
      !videoDetails ||
      isExtracting ||
      analyzingFrameId
    ) {
      return
    }

    setIsExtracting(
      true
    )

    setExtractedFrames(
      []
    )

    setDetectedRegions(
      {}
    )

    setFrameCrops(
      {}
    )

    setCropOcrResults(
      {}
    )

    setFrameAnalysisResults(
      {}
    )

    setCroppingFrameId(
      null
    )

    setAnalyzingCropId(
      null
    )

    setAnalyzingFrameId(
      null
    )

    setErrorMessage(
      ''
    )

    const timestamps =
      buildRecordingTimestamps(
        video.duration,
        samplingInterval
      )

    setProgress({
      current: 0,
      total:
        timestamps.length,
    })

    try {
      const frames =
        await extractRecordingFrames({
          video,

          interval:
            samplingInterval,

          onProgress: ({
            current,
            total,
          }) => {
            setProgress({
              current,
              total,
            })
          },
        })

      setExtractedFrames(
        frames
      )
    } catch (error) {
      console.error(
        'Recording frame extraction failed:',
        error
      )

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'PokeIQ could not extract frames from this recording.'
      )
    } finally {
      setIsExtracting(
        false
      )
    }
  }

  // ------------------------------------------------
  // Storage region detection
  // ------------------------------------------------

  function handleDetectRegions(
    frame
  ) {
    try {
      const result =
        detectStorageRegions({
          width:
            frame.width,

          height:
            frame.height,
        })

      setDetectedRegions(
        (current) => ({
          ...current,

          [frame.id]:
            result,
        })
      )

      setFrameCrops(
        (current) => {
          const next = {
            ...current,
          }

          delete next[
            frame.id
          ]

          return next
        }
      )

      setCropOcrResults(
        {}
      )

      clearFrameAnalysis(
        frame.id
      )

      setErrorMessage(
        ''
      )
    } catch (error) {
      console.error(
        'Storage region detection failed:',
        error
      )

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Storage regions could not be detected.'
      )
    }
  }

  function handleClearRegions(
    frame
  ) {
    setDetectedRegions(
      (current) => {
        const next = {
          ...current,
        }

        delete next[
          frame.id
        ]

        return next
      }
    )

    setFrameCrops(
      (current) => {
        const next = {
          ...current,
        }

        delete next[
          frame.id
        ]

        return next
      }
    )

    setCropOcrResults(
      {}
    )

    clearFrameAnalysis(
      frame.id
    )
  }

  // ------------------------------------------------
  // Storage crop generation
  // ------------------------------------------------

  async function handleCropRegions(
    frame
  ) {
    const detection =
      detectedRegions[
        frame.id
      ]

    if (
      !detection ||
      croppingFrameId ||
      analyzingFrameId
    ) {
      return
    }

    setCroppingFrameId(
      frame.id
    )

    setErrorMessage(
      ''
    )

    try {
      const crops =
        await cropStorageRegions({
          frame,
          detection,
        })

      setFrameCrops(
        (current) => ({
          ...current,

          [frame.id]:
            crops,
        })
      )

      setCropOcrResults(
        {}
      )

      clearFrameAnalysis(
        frame.id
      )

      console.log(
        'Storage crops:',
        crops
      )
    } catch (error) {
      console.error(
        'Storage crop generation failed:',
        error
      )

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Storage crops could not be generated.'
      )
    } finally {
      setCroppingFrameId(
        null
      )
    }
  }

  // ------------------------------------------------
  // Individual crop OCR
  // ------------------------------------------------

  async function handleAnalyzeCrop(
    crop
  ) {
    if (
      !crop ||
      analyzingCropId ||
      analyzingFrameId
    ) {
      return
    }

    setAnalyzingCropId(
      crop.id
    )

    setErrorMessage(
      ''
    )

    try {
      const result =
        await analyzeStorageCrop(
          crop
        )

      setCropOcrResults(
        (current) => ({
          ...current,

          [crop.id]:
            result,
        })
      )

      console.log(
        'Storage crop OCR:',
        result
      )
    } catch (error) {
      console.error(
        'Storage crop OCR failed:',
        error
      )

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'The storage crop could not be read.'
      )
    } finally {
      setAnalyzingCropId(
        null
      )
    }
  }

  // ------------------------------------------------
  // Whole-frame OCR
  // ------------------------------------------------

  async function handleAnalyzeFrame(
    frame
  ) {
    if (
      !frame ||
      analyzingFrameId ||
      analyzingCropId ||
      croppingFrameId
    ) {
      return
    }

    setAnalyzingFrameId(
      frame.id
    )

    setFrameAnalysisProgress({
      current: 0,
      total: 0,
    })

    setErrorMessage(
      ''
    )

    try {
      const result =
        await analyzeStorageFrame(
          frame,
          {
            onProgress: ({
              current,
              total,
            }) => {
              setFrameAnalysisProgress({
                current,
                total,
              })
            },
          }
        )

      setFrameAnalysisResults(
        (current) => ({
          ...current,

          [frame.id]:
            result,
        })
      )

      setDetectedRegions(
        (current) => ({
          ...current,

          [frame.id]:
            result.detection,
        })
      )

      setFrameCrops(
        (current) => ({
          ...current,

          [frame.id]:
            result.crops,
        })
      )

      setCropOcrResults(
        (current) => {
          const next = {
            ...current,
          }

          result.results.forEach(
            ({
              crop,
              analysis,
            }) => {
              if (
                crop?.id &&
                analysis
              ) {
                next[
                  crop.id
                ] =
                  analysis
              }
            }
          )

          return next
        }
      )

      console.log(
        'Storage frame analysis:',
        result
      )
    } catch (error) {
      console.error(
        'Storage frame analysis failed:',
        error
      )

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'The storage frame could not be analyzed.'
      )
    } finally {
      setAnalyzingFrameId(
        null
      )
    }
  }

  // ------------------------------------------------
  // Derived values
  // ------------------------------------------------

  const progressPercentage =
    progress.total > 0
      ? Math.round(
          (
            progress.current /
            progress.total
          ) * 100
        )
      : 0

  const estimatedFrameCount =
    videoDetails
      ? buildRecordingTimestamps(
          videoDetails.duration,
          samplingInterval
        ).length
      : 0

  const anyProcessing =
    isExtracting ||
    Boolean(
      croppingFrameId
    ) ||
    Boolean(
      analyzingCropId
    ) ||
    Boolean(
      analyzingFrameId
    )

  // ------------------------------------------------
  // Render
  // ------------------------------------------------

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
        <p className="eyebrow">
          PokeIQ Development
        </p>

        <h1>
          Recording Lab
        </h1>

        <p className="subtitle">
          Extract recording frames, detect Pokémon
          storage entries, create individual crops,
          and test storage OCR.
        </p>
      </header>

      {/* ------------------------------------------ */}
      {/* Recording upload                           */}
      {/* ------------------------------------------ */}

      <section className="section">
        <input
          ref={fileInputRef}
          className="visually-hidden"
          type="file"
          accept="video/mp4,video/quicktime,video/webm,.mov,.mp4,.webm"
          onChange={
            handleFileChange
          }
        />

        {!selectedFile ? (
          <section
            className={
              isDragging
                ? 'vision-drop-zone dragging'
                : 'vision-drop-zone'
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
            <span className="vision-drop-icon">
              🎥
            </span>

            <section>
              <h2>
                Drop a screen recording here
              </h2>

              <p>
                or choose one from your device
              </p>
            </section>

            <button
              className="primary-button"
              type="button"
              onClick={
                chooseFile
              }
            >
              Choose Recording
            </button>

            <small>
              MOV • MP4 • WEBM
            </small>
          </section>
        ) : (
          <section className="card">
            <header className="section-header">
              <section>
                <p className="eyebrow">
                  Selected recording
                </p>

                <h2>
                  {selectedFile.name}
                </h2>

                <p>
                  {selectedFile.type ||
                    'Unknown video type'}
                  {' · '}
                  {formatFileSize(
                    selectedFile.size
                  )}
                </p>
              </section>

              <section className="import-file-actions">
                <button
                  className="secondary-button"
                  type="button"
                  disabled={
                    anyProcessing
                  }
                  onClick={
                    chooseFile
                  }
                >
                  Choose Different File
                </button>

                <button
                  className="danger-button"
                  type="button"
                  disabled={
                    anyProcessing
                  }
                  onClick={
                    removeFile
                  }
                >
                  Remove
                </button>
              </section>
            </header>

            {previewUrl && (
              <section className="recording-lab-preview">
                <video
                  ref={videoRef}
                  src={previewUrl}
                  controls
                  preload="metadata"
                  onLoadedMetadata={
                    handleVideoMetadata
                  }
                  onError={
                    handleVideoError
                  }
                />
              </section>
            )}
          </section>
        )}
      </section>

      {/* ------------------------------------------ */}
      {/* Errors                                     */}
      {/* ------------------------------------------ */}

      {errorMessage && (
        <section className="section">
          <section className="card import-analysis-error">
            <strong>
              Recording could not be processed
            </strong>

            <p>
              {errorMessage}
            </p>
          </section>
        </section>
      )}

      {/* ------------------------------------------ */}
      {/* Recording metadata/settings                */}
      {/* ------------------------------------------ */}

      {videoDetails && (
        <>
          <section className="section">
            <section className="developer-status-grid">
              <article className="card developer-status-card">
                <span>
                  Duration
                </span>

                <strong>
                  {formatTimestamp(
                    videoDetails.duration
                  )}
                </strong>
              </article>

              <article className="card developer-status-card">
                <span>
                  Resolution
                </span>

                <strong>
                  {videoDetails.width}
                  {' × '}
                  {videoDetails.height}
                </strong>
              </article>

              <article className="card developer-status-card">
                <span>
                  Estimated frames
                </span>

                <strong>
                  {estimatedFrameCount}
                </strong>
              </article>
            </section>
          </section>

          <section className="section">
            <section className="card recording-lab-controls">
              <section>
                <p className="eyebrow">
                  Frame sampling
                </p>

                <h2>
                  Extraction Settings
                </h2>

                <p>
                  Choose how frequently PokeIQ should
                  capture a frame from the recording.
                </p>
              </section>

              <label htmlFor="recording-sampling-interval">
                Sampling interval
              </label>

              <select
                id="recording-sampling-interval"
                value={
                  samplingInterval
                }
                disabled={
                  anyProcessing
                }
                onChange={(
                  event
                ) => {
                  setSamplingInterval(
                    Number(
                      event.target.value
                    )
                  )

                  clearResults()
                }}
              >
                {samplingOptions.map(
                  (option) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>

              <button
                className="primary-button"
                type="button"
                disabled={
                  anyProcessing
                }
                onClick={
                  handleExtractFrames
                }
              >
                {isExtracting
                  ? 'Extracting Frames…'
                  : `Extract ${estimatedFrameCount} Frames`}
              </button>
            </section>
          </section>
        </>
      )}

      {/* ------------------------------------------ */}
      {/* Extraction progress                        */}
      {/* ------------------------------------------ */}

      {isExtracting && (
        <section className="section">
          <section className="import-processing">
            <span className="import-processing-spinner" />

            <section className="import-processing-content">
              <strong>
                Extracting recording frames
              </strong>

              <p>
                Frame {progress.current} of{' '}
                {progress.total}
              </p>

              <section className="progress-track">
                <span
                  className="progress-fill"
                  style={{
                    display:
                      'block',

                    width:
                      `${progressPercentage}%`,
                  }}
                />
              </section>

              <p className="import-processing-note">
                The recording is processed locally in
                your browser.
              </p>
            </section>
          </section>
        </section>
      )}

      {/* ------------------------------------------ */}
      {/* Extracted frames                           */}
      {/* ------------------------------------------ */}

      {extractedFrames.length > 0 && (
        <section className="section">
          <header className="section-header">
            <section>
              <p className="eyebrow">
                Extraction complete
              </p>

              <h2>
                Captured Frames
              </h2>

              <p>
                {extractedFrames.length} frames were
                captured. Choose a clean stationary
                frame to test.
              </p>
            </section>
          </header>

          {/* One large frame per row */}
          <section
            style={{
              display:
                'grid',

              gridTemplateColumns:
                'minmax(0, 1fr)',

              gap:
                '32px',

              width:
                '100%',
            }}
          >
            {extractedFrames.map(
              (
                frame,
                index
              ) => {
                const detection =
                  detectedRegions[
                    frame.id
                  ]

                const crops =
                  frameCrops[
                    frame.id
                  ]

                const frameAnalysis =
                  frameAnalysisResults[
                    frame.id
                  ]

                const isCropping =
                  croppingFrameId ===
                  frame.id

                const isAnalyzingFrame =
                  analyzingFrameId ===
                  frame.id

                return (
                  <article
                    className="card"
                    key={
                      frame.id
                    }
                    style={{
                      display:
                        'grid',

                      gap:
                        0,

                      width:
                        '100%',

                      overflow:
                        'hidden',
                    }}
                  >
                    {/* -------------------------------- */}
                    {/* Frame header                     */}
                    {/* -------------------------------- */}

                    <header
                      style={{
                        display:
                          'flex',

                        alignItems:
                          'center',

                        justifyContent:
                          'space-between',

                        flexWrap:
                          'wrap',

                        gap:
                          '12px',

                        padding:
                          '16px 20px',

                        borderBottom:
                          '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <section>
                        <strong
                          style={{
                            display:
                              'block',

                            fontSize:
                              '1rem',
                          }}
                        >
                          Frame {index + 1}
                        </strong>

                        <span>
                          {formatTimestamp(
                            frame.timestamp
                          )}
                        </span>
                      </section>

                      <span>
                        {frame.width}
                        {' × '}
                        {frame.height}
                      </span>
                    </header>

                    {/* -------------------------------- */}
                    {/* Main frame workspace             */}
                    {/* -------------------------------- */}

                    <section
                      style={{
                        display:
                          'grid',

                        gridTemplateColumns:
                          'minmax(320px, 0.8fr) minmax(420px, 1.2fr)',

                        gap:
                          '24px',

                        alignItems:
                          'start',

                        padding:
                          '20px',
                      }}
                    >
                      {/* ------------------------------ */}
                      {/* Frame preview                   */}
                      {/* ------------------------------ */}

                      <section
                        style={{
                          display:
                            'grid',

                          gap:
                            '14px',

                          minWidth:
                            0,
                        }}
                      >
                        <figure
                          style={{
                            position:
                              'relative',

                            width:
                              '100%',

                            maxWidth:
                              '520px',

                            margin:
                              '0 auto',

                            overflow:
                              'hidden',

                            borderRadius:
                              '12px',

                            background:
                              '#111',
                          }}
                        >
                          <img
                            src={
                              frame.previewUrl
                            }
                            alt={`Recording frame at ${formatTimestamp(
                              frame.timestamp
                            )}`}
                            style={{
                              display:
                                'block',

                              width:
                                '100%',

                              height:
                                'auto',

                              aspectRatio:
                                'auto',

                              objectFit:
                                'contain',

                              background:
                                '#111',
                            }}
                          />

                          {detection?.regions.map(
                            (
                              region
                            ) => (
                              <span
                                key={
                                  region.id
                                }
                                title={`Row ${
                                  region.row +
                                  1
                                }, Column ${
                                  region.column +
                                  1
                                }`}
                                style={{
                                  position:
                                    'absolute',

                                  left:
                                    `${(
                                      region.x /
                                      frame.width
                                    ) * 100}%`,

                                  top:
                                    `${(
                                      region.y /
                                      frame.height
                                    ) * 100}%`,

                                  width:
                                    `${(
                                      region.width /
                                      frame.width
                                    ) * 100}%`,

                                  height:
                                    `${(
                                      region.height /
                                      frame.height
                                    ) * 100}%`,

                                  border:
                                    '2px solid currentColor',

                                  boxSizing:
                                    'border-box',

                                  pointerEvents:
                                    'none',
                                }}
                              >
                                <span
                                  style={{
                                    display:
                                      'inline-block',

                                    background:
                                      'rgba(0, 0, 0, 0.78)',

                                    color:
                                      'white',

                                    padding:
                                      '2px 5px',

                                    fontSize:
                                      '10px',

                                    lineHeight:
                                      1.2,
                                  }}
                                >
                                  {region.row +
                                    1}
                                  -
                                  {region.column +
                                    1}
                                </span>
                              </span>
                            )
                          )}
                        </figure>

                        {/* ---------------------------- */}
                        {/* Frame actions                  */}
                        {/* ---------------------------- */}

                        <section
                          style={{
                            display:
                              'grid',

                            gridTemplateColumns:
                              'repeat(auto-fit, minmax(160px, 1fr))',

                            gap:
                              '10px',
                          }}
                        >
                          {!detection ? (
                            <button
                              className="secondary-button"
                              type="button"
                              disabled={
                                Boolean(
                                  analyzingFrameId
                                )
                              }
                              onClick={() =>
                                handleDetectRegions(
                                  frame
                                )
                              }
                            >
                              Detect Storage Regions
                            </button>
                          ) : (
                            <>
                              <button
                                className="secondary-button"
                                type="button"
                                disabled={
                                  isCropping ||
                                  Boolean(
                                    analyzingFrameId
                                  )
                                }
                                onClick={() =>
                                  handleCropRegions(
                                    frame
                                  )
                                }
                              >
                                {isCropping
                                  ? 'Creating Crops…'
                                  : crops
                                    ? 'Recreate Crops'
                                    : 'Create Storage Crops'}
                              </button>

                              <button
                                className="secondary-button"
                                type="button"
                                disabled={
                                  Boolean(
                                    analyzingFrameId
                                  )
                                }
                                onClick={() =>
                                  handleClearRegions(
                                    frame
                                  )
                                }
                              >
                                Hide Regions
                              </button>
                            </>
                          )}

                          <button
                            className="primary-button"
                            type="button"
                            disabled={
                              Boolean(
                                analyzingFrameId
                              ) ||
                              Boolean(
                                analyzingCropId
                              ) ||
                              Boolean(
                                croppingFrameId
                              )
                            }
                            onClick={() =>
                              handleAnalyzeFrame(
                                frame
                              )
                            }
                          >
                            {isAnalyzingFrame
                              ? `Reading ${frameAnalysisProgress.current}/${frameAnalysisProgress.total || 12}…`
                              : frameAnalysis
                                ? 'Analyze Frame Again'
                                : 'Analyze Whole Frame'}
                          </button>
                        </section>

                        {detection && (
                          <p
                            style={{
                              margin:
                                0,

                              textAlign:
                                'center',
                            }}
                          >
                            <strong>
                              {
                                detection
                                  .regions
                                  .length
                              }
                            </strong>{' '}
                            candidate storage slots
                          </p>
                        )}
                      </section>

                      {/* ------------------------------ */}
                      {/* Whole-frame results             */}
                      {/* ------------------------------ */}

                      <section
                        style={{
                          minWidth:
                            0,
                        }}
                      >
                        {!frameAnalysis ? (
                          <section
                            style={{
                              display:
                                'grid',

                              placeItems:
                                'center',

                              minHeight:
                                '260px',

                              padding:
                                '24px',

                              textAlign:
                                'center',

                              border:
                                '1px dashed rgba(255,255,255,0.16)',

                              borderRadius:
                                '12px',
                            }}
                          >
                            <section>
                              <strong>
                                Frame Results
                              </strong>

                              <p>
                                Analyze the whole frame to read
                                all 12 visible Pokémon slots.
                              </p>
                            </section>
                          </section>
                        ) : (
                          <section
                            style={{
                              display:
                                'grid',

                              gap:
                                '16px',
                            }}
                          >
                            <header
                              style={{
                                display:
                                  'flex',

                                justifyContent:
                                  'space-between',

                                alignItems:
                                  'center',

                                flexWrap:
                                  'wrap',

                                gap:
                                  '12px',
                              }}
                            >
                              <section>
                                <strong
                                  style={{
                                    display:
                                      'block',

                                    fontSize:
                                      '1.05rem',
                                  }}
                                >
                                  Frame Results
                                </strong>

                                <span>
                                  Recognized{' '}
                                  <strong>
                                    {
                                      frameAnalysis
                                        .summary
                                        .recognized
                                    }
                                  </strong>{' '}
                                  of{' '}
                                  {
                                    frameAnalysis
                                      .summary
                                      .totalSlots
                                  }{' '}
                                  slots
                                </span>
                              </section>

                              {(frameAnalysis
                                .summary
                                .reviewRequired >
                                0 ||
                                frameAnalysis
                                  .summary
                                  .unreadable >
                                0) && (
                                <section
                                  style={{
                                    display:
                                      'flex',

                                    gap:
                                      '12px',

                                    flexWrap:
                                      'wrap',
                                  }}
                                >
                                  {frameAnalysis
                                    .summary
                                    .reviewRequired >
                                    0 && (
                                    <span>
                                      Review:{' '}
                                      <strong>
                                        {
                                          frameAnalysis
                                            .summary
                                            .reviewRequired
                                        }
                                      </strong>
                                    </span>
                                  )}

                                  {frameAnalysis
                                    .summary
                                    .unreadable >
                                    0 && (
                                    <span>
                                      Unreadable:{' '}
                                      <strong>
                                        {
                                          frameAnalysis
                                            .summary
                                            .unreadable
                                        }
                                      </strong>
                                    </span>
                                  )}
                                </section>
                              )}
                            </header>

                            {/* Pokémon GO-style 3-column grid */}
                            <section
                              style={{
                                display:
                                  'grid',

                                gridTemplateColumns:
                                  'repeat(3, minmax(0, 1fr))',

                                gap:
                                  '10px',
                              }}
                            >
                              {frameAnalysis
                                .slotResults
                                .map(
                                  (
                                    result
                                  ) => (
                                    <article
                                      key={
                                        result.slot
                                      }
                                      style={{
                                        display:
                                          'grid',

                                        gap:
                                          '5px',

                                        minWidth:
                                          0,

                                        padding:
                                          '12px',

                                        border:
                                          '1px solid rgba(255,255,255,0.1)',

                                        borderRadius:
                                          '10px',
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize:
                                            '0.75rem',

                                          opacity:
                                            0.7,
                                        }}
                                      >
                                        Slot{' '}
                                        {result.slot}
                                      </span>

                                      <strong
                                        style={{
                                          overflow:
                                            'hidden',

                                          textOverflow:
                                            'ellipsis',

                                          whiteSpace:
                                            'nowrap',
                                        }}
                                        title={
                                          result.name ??
                                          'Unknown Pokémon'
                                        }
                                      >
                                        {result.name ??
                                          'Unknown Pokémon'}
                                      </strong>

                                      <span>
                                        CP{' '}
                                        <strong>
                                          {result.cp ??
                                            '—'}
                                        </strong>
                                      </span>

                                      {!result.recognized && (
                                        <small>
                                          Needs review
                                        </small>
                                      )}
                                    </article>
                                  )
                                )}
                            </section>
                          </section>
                        )}
                      </section>
                    </section>

                    {/* -------------------------------- */}
                    {/* Detailed crop inspector           */}
                    {/* -------------------------------- */}

                    {crops && (
                      <details
                        style={{
                          borderTop:
                            '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        <summary
                          style={{
                            cursor:
                              'pointer',

                            padding:
                              '16px 20px',

                            fontWeight:
                              700,
                          }}
                        >
                          Detailed Crop Inspector ({crops.length} slots)
                        </summary>

                        <section
                          style={{
                            display:
                              'grid',

                            gridTemplateColumns:
                              'repeat(auto-fit, minmax(260px, 1fr))',

                            gap:
                              '18px',

                            padding:
                              '0 20px 20px',
                          }}
                        >
                          {crops.map(
                            (
                              crop
                            ) => {
                              const ocrResult =
                                cropOcrResults[
                                  crop.id
                                ]

                              const isAnalyzing =
                                analyzingCropId ===
                                crop.id

                              return (
                                <article
                                  key={
                                    crop.id
                                  }
                                  style={{
                                    display:
                                      'grid',

                                    gap:
                                      '10px',

                                    minWidth:
                                      0,

                                    padding:
                                      '12px',

                                    border:
                                      '1px solid rgba(255,255,255,0.1)',

                                    borderRadius:
                                      '10px',
                                  }}
                                >
                                  <img
                                    src={
                                      crop.previewUrl
                                    }
                                    alt={`Storage crop ${
                                      crop.row +
                                      1
                                    }-${
                                      crop.column +
                                      1
                                    }`}
                                    style={{
                                      display:
                                        'block',

                                      width:
                                        '100%',

                                      height:
                                        'auto',

                                      aspectRatio:
                                        'auto',

                                      objectFit:
                                        'contain',

                                      borderRadius:
                                        '8px',

                                      background:
                                        'transparent',
                                    }}
                                  />

                                  <strong>
                                    Slot{' '}
                                    {crop.row +
                                      1}
                                    -
                                    {crop.column +
                                      1}
                                  </strong>

                                  <button
                                    className="secondary-button"
                                    type="button"
                                    disabled={
                                      Boolean(
                                        analyzingCropId
                                      ) ||
                                      Boolean(
                                        analyzingFrameId
                                      )
                                    }
                                    onClick={() =>
                                      handleAnalyzeCrop(
                                        crop
                                      )
                                    }
                                  >
                                    {isAnalyzing
                                      ? 'Reading…'
                                      : ocrResult
                                        ? 'Read Again'
                                        : 'Read Crop'}
                                  </button>

                                  {ocrResult && (
                                    <section
                                      style={{
                                        display:
                                          'grid',

                                        gap:
                                          '12px',
                                      }}
                                    >
                                      <section
                                        style={{
                                          display:
                                            'grid',

                                          gap:
                                            '4px',
                                        }}
                                      >
                                        <strong>
                                          CP
                                        </strong>

                                        <span>
                                          Parsed:{' '}
                                          {ocrResult
                                            .cp
                                            .value ??
                                            'Unknown'}
                                        </span>

                                        <span>
                                          Raw:{' '}
                                          {ocrResult
                                            .cp
                                            .rawText ||
                                            '(empty)'}
                                        </span>

                                        <span>
                                          OCR confidence:{' '}
                                          {
                                            ocrResult
                                              .cp
                                              .confidence
                                          }
                                          %
                                        </span>
                                      </section>

                                      <section
                                        style={{
                                          display:
                                            'grid',

                                          gap:
                                            '4px',
                                        }}
                                      >
                                        <strong>
                                          Name
                                        </strong>

                                        <span>
                                          Parsed:{' '}
                                          {ocrResult
                                            .name
                                            .value ??
                                            'Unknown'}
                                        </span>

                                        <span>
                                          Raw:{' '}
                                          {ocrResult
                                            .name
                                            .rawText ||
                                            '(empty)'}
                                        </span>

                                        <span>
                                          Species confidence:{' '}
                                          {
                                            ocrResult
                                              .name
                                              .confidence
                                          }
                                          %
                                        </span>

                                        <span>
                                          OCR confidence:{' '}
                                          {
                                            ocrResult
                                              .name
                                              .ocrConfidence ??
                                            0
                                          }
                                          %
                                        </span>

                                        {ocrResult
                                          .name
                                          .matchType && (
                                          <span>
                                            Match:{' '}
                                            {
                                              ocrResult
                                                .name
                                                .matchType
                                            }
                                          </span>
                                        )}
                                      </section>
                                    </section>
                                  )}
                                </article>
                              )
                            }
                          )}
                        </section>
                      </details>
                    )}
                  </article>
                )
              }
            )}
          </section>
        </section>
      )}
    </main>
  )
}

export default RecordingLab