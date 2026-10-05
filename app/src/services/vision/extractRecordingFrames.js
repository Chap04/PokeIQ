export function waitForVideoEvent(
  video,
  eventName
) {
  return new Promise((resolve, reject) => {
    function handleSuccess() {
      cleanup()
      resolve()
    }

    function handleError() {
      cleanup()

      reject(
        new Error(
          'The recording could not be read by this browser.'
        )
      )
    }

    function cleanup() {
      video.removeEventListener(
        eventName,
        handleSuccess
      )

      video.removeEventListener(
        'error',
        handleError
      )
    }

    video.addEventListener(
      eventName,
      handleSuccess,
      {
        once: true,
      }
    )

    video.addEventListener(
      'error',
      handleError,
      {
        once: true,
      }
    )
  })
}

export async function seekVideo(
  video,
  timestamp
) {
  const maximumTimestamp = Math.max(
    0,
    video.duration - 0.01
  )

  const safeTimestamp = Math.min(
    Math.max(0, timestamp),
    maximumTimestamp
  )

  if (
    Math.abs(
      video.currentTime -
        safeTimestamp
    ) < 0.001
  ) {
    return
  }

  const seekPromise =
    waitForVideoEvent(
      video,
      'seeked'
    )

  video.currentTime = safeTimestamp

  await seekPromise
}

export function captureVideoFrame(
  video,
  timestamp
) {
  const canvas =
    document.createElement('canvas')

  canvas.width =
    video.videoWidth

  canvas.height =
    video.videoHeight

  const context =
    canvas.getContext('2d')

  if (!context) {
    throw new Error(
      'Canvas frame extraction is unavailable.'
    )
  }

  context.drawImage(
    video,
    0,
    0,
    canvas.width,
    canvas.height
  )

  return {
    id: crypto.randomUUID(),
    timestamp,

    previewUrl:
      canvas.toDataURL(
        'image/jpeg',
        0.82
      ),

    width:
      canvas.width,

    height:
      canvas.height,
  }
}

export function buildRecordingTimestamps(
  duration,
  interval
) {
  const safeDuration =
    Number(duration)

  const safeInterval =
    Number(interval)

  if (
    !Number.isFinite(safeDuration) ||
    safeDuration <= 0
  ) {
    return []
  }

  if (
    !Number.isFinite(safeInterval) ||
    safeInterval <= 0
  ) {
    throw new Error(
      'Recording sampling interval must be greater than zero.'
    )
  }

  const timestamps = []

  for (
    let timestamp = 0;
    timestamp < safeDuration;
    timestamp += safeInterval
  ) {
    timestamps.push(
      Number(
        timestamp.toFixed(3)
      )
    )
  }

  const finalTimestamp =
    Math.max(
      0,
      safeDuration - 0.05
    )

  const lastTimestamp =
    timestamps[
      timestamps.length - 1
    ]

  if (
    lastTimestamp === undefined ||
    finalTimestamp -
      lastTimestamp >
      safeInterval * 0.4
  ) {
    timestamps.push(
      Number(
        finalTimestamp.toFixed(3)
      )
    )
  }

  return timestamps
}

export async function extractRecordingFrames({
  video,
  interval = 0.5,
  onProgress = null,
}) {
  if (!video) {
    throw new Error(
      'A video element is required to extract recording frames.'
    )
  }

  if (
    !Number.isFinite(video.duration) ||
    video.duration <= 0
  ) {
    throw new Error(
      'The recording duration could not be determined.'
    )
  }

  if (
    !video.videoWidth ||
    !video.videoHeight
  ) {
    throw new Error(
      'The recording dimensions could not be determined.'
    )
  }

  const timestamps =
    buildRecordingTimestamps(
      video.duration,
      interval
    )

  const frames = []

  video.pause()

  for (
    let index = 0;
    index < timestamps.length;
    index += 1
  ) {
    const timestamp =
      timestamps[index]

    await seekVideo(
      video,
      timestamp
    )

    frames.push(
      captureVideoFrame(
        video,
        timestamp
      )
    )

    if (
      typeof onProgress ===
      'function'
    ) {
      onProgress({
        current: index + 1,
        total: timestamps.length,
        timestamp,
      })
    }

    /*
      Give React and the browser a chance to render
      progress updates during longer recordings.
    */
    await new Promise(
      (resolve) =>
        window.setTimeout(
          resolve,
          0
        )
    )
  }

  return frames
}

export default extractRecordingFrames