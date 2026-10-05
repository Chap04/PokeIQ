// --------------------------------------------------
// Raid Type Rating Tier
//
// Converts a 0–100 Raid Type Team Rating into the
// player-facing development tier used by Raid Profile.
// --------------------------------------------------

export const RAID_TYPE_RATING_TIERS = {
  FOUNDATION: {
    label: 'Foundation',
    className: 'foundation',
  },

  EARLY: {
    label: 'Early',
    className: 'early',
  },

  DEVELOPING: {
    label: 'Developing',
    className: 'developing',
  },

  STRONG: {
    label: 'Strong',
    className: 'strong',
  },

  INCREDIBLE: {
    label: 'Incredible',
    className: 'incredible',
  },

  ELITE: {
    label: 'Elite',
    className: 'elite',
  },

  PERFECT: {
    label: 'Perfect',
    className: 'perfect',
  },
}

export function getRaidTypeRatingTier(
  rating
) {
  const numericRating =
    Number(rating)

  if (
    !Number.isFinite(
      numericRating
    )
  ) {
    return (
      RAID_TYPE_RATING_TIERS
        .FOUNDATION
    )
  }

  if (
    numericRating >=
    100
  ) {
    return (
      RAID_TYPE_RATING_TIERS
        .PERFECT
    )
  }

  if (
    numericRating >=
    90
  ) {
    return (
      RAID_TYPE_RATING_TIERS
        .ELITE
    )
  }

  if (
    numericRating >=
    75
  ) {
    return (
      RAID_TYPE_RATING_TIERS
        .INCREDIBLE
    )
  }

  if (
    numericRating >=
    60
  ) {
    return (
      RAID_TYPE_RATING_TIERS
        .STRONG
    )
  }

  if (
    numericRating >=
    40
  ) {
    return (
      RAID_TYPE_RATING_TIERS
        .DEVELOPING
    )
  }

  if (
    numericRating >=
    20
  ) {
    return (
      RAID_TYPE_RATING_TIERS
        .EARLY
    )
  }

  return (
    RAID_TYPE_RATING_TIERS
      .FOUNDATION
  )
}

export default getRaidTypeRatingTier