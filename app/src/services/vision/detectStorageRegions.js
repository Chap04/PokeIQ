// --------------------------------------------------
// Pokémon GO Storage Grid Detection
//
// The storage screen uses a predictable 3-column
// layout.
//
// V1 geometry was calibrated against a
// 1206 × 2622 recording.
//
// offsetY lets the same geometry follow the storage
// rows as they move vertically during scrolling.
// --------------------------------------------------

const DEFAULT_STORAGE_LAYOUT = {
  left: 0.02,
  right: 0.98,

  top: 0.19,
  bottom: 0.99,

  columnCount: 3,

  rowStep: 0.17,
  cropHeight: 0.17,

  horizontalPadding:
    0.018,

  maxRows: 4,
}

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function clamp(
  value,
  minimum,
  maximum
) {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value
    )
  )
}

// --------------------------------------------------
// Detector
// --------------------------------------------------

function detectStorageRegions({
  width,
  height,
  offsetY = 0,
  layout = {},
}) {
  if (
    !Number.isFinite(
      width
    ) ||
    width <= 0
  ) {
    throw new Error(
      'Storage detection requires a valid image width.'
    )
  }

  if (
    !Number.isFinite(
      height
    ) ||
    height <= 0
  ) {
    throw new Error(
      'Storage detection requires a valid image height.'
    )
  }

  const resolvedLayout = {
    ...DEFAULT_STORAGE_LAYOUT,
    ...layout,
  }

  const storageLeft =
    width *
    resolvedLayout.left

  const storageRight =
    width *
    resolvedLayout.right

  const storageTop =
    height *
    resolvedLayout.top

  const storageBottom =
    height *
    resolvedLayout.bottom

  const storageWidth =
    storageRight -
    storageLeft

  const columnWidth =
    storageWidth /
    resolvedLayout.columnCount

  const rowStep =
    height *
    resolvedLayout.rowStep

  const cropHeight =
    height *
    resolvedLayout.cropHeight

  const horizontalPadding =
    width *
    resolvedLayout.horizontalPadding

  // ------------------------------------------------
  // Vertical phase
  //
  // Keep the requested offset within one row's
  // repeating phase. A shift of one complete row is
  // visually equivalent to the next storage row.
  // ------------------------------------------------

  const halfRowStep =
    rowStep / 2

  let normalizedOffsetY =
    Number.isFinite(
      offsetY
    )
      ? offsetY
      : 0

  while (
    normalizedOffsetY >
    halfRowStep
  ) {
    normalizedOffsetY -=
      rowStep
  }

  while (
    normalizedOffsetY <
    -halfRowStep
  ) {
    normalizedOffsetY +=
      rowStep
  }

  // Begin from the calibrated first row, shifted by
  // the discovered phase.
  let firstRowY =
  storageTop +
  normalizedOffsetY

let skippedRowsAbove =
  0

  // If the shifted row begins above the clean
  // storage area, move forward one complete row.
  while (
  firstRowY <
  storageTop
) {
  firstRowY +=
    rowStep

  skippedRowsAbove += 1
}

  // If an earlier equivalent row still fits cleanly,
  // prefer it.
  while (
    firstRowY -
      rowStep >=
    storageTop
  ) {
    firstRowY -=
      rowStep
  }

  const regions =
    []

  let detectedRow =
    0

  for (
    let sourceRow = 0;
    sourceRow <
      resolvedLayout.maxRows +
        2;
    sourceRow += 1
  ) {
    const y =
      firstRowY +
      sourceRow *
        rowStep

    if (
      y +
        cropHeight >
      storageBottom
    ) {
      break
    }

    if (
      detectedRow >=
      resolvedLayout.maxRows
    ) {
      break
    }

    for (
      let column = 0;
      column <
        resolvedLayout.columnCount;
      column += 1
    ) {
      const rawX =
        storageLeft +
        column *
          columnWidth +
        horizontalPadding

      const rawWidth =
        columnWidth -
        horizontalPadding *
          2

      const x =
        clamp(
          rawX,
          0,
          width
        )

      const regionWidth =
        clamp(
          rawWidth,
          1,
          width - x
        )

      const regionHeight =
        clamp(
          cropHeight,
          1,
          height - y
        )

      regions.push({
        id:
          `storage-${detectedRow + 1}-${column + 1}`,

        row:
  detectedRow,

phaseRow:
  detectedRow +
  skippedRowsAbove,

column,

        x:
          Math.round(x),

        y:
          Math.round(y),

        width:
          Math.round(
            regionWidth
          ),

        height:
          Math.round(
            regionHeight
          ),
      })
    }

    detectedRow += 1
  }

  return {
    width,
    height,

    offsetY:
      Math.round(
        offsetY
      ),

    normalizedOffsetY:
      Math.round(
        normalizedOffsetY
      ),

    skippedRowsAbove,

    rowStep:
      Math.round(
        rowStep
      ),

    cropHeight:
      Math.round(
        cropHeight
      ),

    rowCount:
      detectedRow,

    columnCount:
      resolvedLayout.columnCount,

    regions,

    layout:
      resolvedLayout,
  }
}

export {
  DEFAULT_STORAGE_LAYOUT,
  detectStorageRegions,
}

export default detectStorageRegions