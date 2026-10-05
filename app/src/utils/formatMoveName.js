import moves from '../data/reference/moves-pve.json'

// --------------------------------------------------
// Pokémon GO Move Display Formatting
//
// Converts PokeIQ / Game Master move identifiers into
// clean player-facing move names.
//
// Handles both:
//
// Named Game Master IDs:
//   METAL_CLAW_FAST
//   -> Metal Claw
//
// Numeric Game Master IDs:
//   406
//   -> Aura Wheel Electric
//
// Numeric IDs are resolved through moves-pve.json using
// the move record's displayId.
//
// The canonical move ID is never modified. This helper
// is strictly for player-facing display text.
// --------------------------------------------------

// --------------------------------------------------
// Move lookup
// --------------------------------------------------

const moveDisplayIdById =
  new Map(
    moves
      .filter(
        (move) =>
          move?.id !==
            null &&
          move?.id !==
            undefined
      )
      .map(
        (move) => [
          String(
            move.id
          ),

          move.displayId ??
          move.id,
        ]
      )
  )

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function resolveMoveDisplayId(
  moveId
) {
  if (
    moveId ===
      null ||
    moveId ===
      undefined ||
    moveId ===
      ''
  ) {
    return null
  }

  const canonicalId =
    String(
      moveId
    )

  return (
    moveDisplayIdById.get(
      canonicalId
    ) ??
    canonicalId
  )
}

function prettifyMoveId(
  moveId
) {
  return String(
    moveId
  )
    .replace(
      /_FAST$/,
      ''
    )
    .replaceAll(
      '_',
      ' '
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    )
}

// --------------------------------------------------
// Public formatter
// --------------------------------------------------

export function formatMoveName(
  moveId,
  fallback = 'Unknown move'
) {
  const displayId =
    resolveMoveDisplayId(
      moveId
    )

  if (
    !displayId
  ) {
    return fallback
  }

  return prettifyMoveId(
    displayId
  )
}

export default formatMoveName