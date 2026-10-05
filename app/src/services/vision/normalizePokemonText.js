function addCorrection(corrections, type, description, before, after) {
  if (before === after) {
    return after
  }

  corrections.push({
    type,
    description,
    before,
    after,
  })

  return after
}

export function normalizePokemonText(rawText) {
  if (typeof rawText !== 'string') {
    throw new Error('Raw OCR text must be a string.')
  }

  const originalText = rawText
  const corrections = []

  let normalizedText = originalText

  normalizedText = addCorrection(
    corrections,
    'line-endings',
    'Normalized line endings',
    normalizedText,
    normalizedText.replace(/\r\n?/g, '\n')
  )

  normalizedText = addCorrection(
    corrections,
    'tabs',
    'Converted tabs to spaces',
    normalizedText,
    normalizedText.replace(/\t/g, ' ')
  )

  normalizedText = addCorrection(
    corrections,
    'duplicate-spaces',
    'Collapsed repeated spaces',
    normalizedText,
    normalizedText.replace(/[^\S\n]{2,}/g, ' ')
  )

  normalizedText = addCorrection(
    corrections,
    'blank-lines',
    'Removed extra blank lines',
    normalizedText,
    normalizedText.replace(/\n{3,}/g, '\n\n')
  )

  normalizedText = addCorrection(
    corrections,
    'trim',
    'Removed whitespace from the beginning and end',
    normalizedText,
    normalizedText.trim()
  )

  const correctedLines = normalizedText
    .split('\n')
    .map((line) => {
      if (!/^CP\b/i.test(line)) {
        return line
      }

      const correctedLine = line
        .replace(/[Oo]/g, '0')
        .replace(/[Zz]/g, '2')
        .replace(/[Il]/g, '1')

      if (correctedLine !== line) {
        corrections.push({
          type: 'cp-ocr-correction',
          description: `Corrected OCR characters in CP text: "${line}" → "${correctedLine}"`,
          before: line,
          after: correctedLine,
        })
      }

      return correctedLine
    })

  normalizedText = correctedLines.join('\n')

  return {
    originalText,
    normalizedText,
    corrections,
    changed: corrections.length > 0,
  }
}