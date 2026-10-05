// --------------------------------------------------
// PokeIQ Project Constants V2
//
// PROJECTS V2
//
// A Raid Investment Project represents one exact
// owned Pokémon that the player has chosen to develop.
//
// The Project does NOT represent one frozen
// recommendation.
//
// Live Raid Investment intelligence determines what
// worthwhile improvements remain for that Pokémon.
//
// Important:
//
// - collectionId is the durable Project identity.
// - Project lifecycle status is persisted.
// - Current investment recommendations are derived.
// - Exact target states are NOT persisted as the
//   identity of a Project.
// - Legacy Action constants remain exported while the
//   V1 fixed-Action system is phased out.
// - Rare Candy is never silently spent or converted.
// --------------------------------------------------

export const PROJECT_SCHEMA_VERSION = 2

export const PROJECT_TYPE = {
  RAID_INVESTMENT:
    'RAID_INVESTMENT',
}

export const PROJECT_STATUS = {
  ACTIVE:
    'ACTIVE',

  PAUSED:
    'PAUSED',

  COMPLETED:
    'COMPLETED',

  ABANDONED:
    'ABANDONED',
}

export const PROJECT_HEALTH = {
  VALID:
    'VALID',

  INVALID:
    'INVALID',

  UNKNOWN:
    'UNKNOWN',
}

// --------------------------------------------------
// Legacy / future Action vocabulary
//
// Projects V2 does not require a persisted Action for
// every live recommendation.
//
// These exports remain because:
//
// 1. Existing saved V1 Projects may contain Actions.
// 2. Existing evaluator code still imports them.
// 3. Actions may later become Project history/events.
// --------------------------------------------------

export const PROJECT_ACTION_TYPE = {
  MEET_RESOURCE_REQUIREMENT:
    'MEET_RESOURCE_REQUIREMENT',

  POWER_UP_POKEMON:
    'POWER_UP_POKEMON',

  CHANGE_FAST_MOVE:
    'CHANGE_FAST_MOVE',

  CHANGE_CHARGED_MOVE:
    'CHANGE_CHARGED_MOVE',

  UNLOCK_SECOND_CHARGED_MOVE:
    'UNLOCK_SECOND_CHARGED_MOVE',

  EVOLVE_POKEMON:
    'EVOLVE_POKEMON',

  SPECIAL_ACQUISITION:
    'SPECIAL_ACQUISITION',

  MANUAL:
    'MANUAL',
}

export const PROJECT_ACTION_STATUS = {
  IN_PROGRESS:
    'IN_PROGRESS',

  BLOCKED:
    'BLOCKED',

  READY:
    'READY',

  COMPLETE:
    'COMPLETE',

  UNKNOWN:
    'UNKNOWN',
}

export const PROJECT_SOURCE_TYPE = {
  RAID_RECOMMENDATION:
    'RAID_RECOMMENDATION',
}

export const PROJECT_RESOURCE = {
  STARDUST:
    'STARDUST',

  CANDY:
    'CANDY',

  CANDY_XL:
    'CANDY_XL',

  FAST_TM:
    'FAST_TM',

  CHARGED_TM:
    'CHARGED_TM',

  ELITE_FAST_TM:
    'ELITE_FAST_TM',

  ELITE_CHARGED_TM:
    'ELITE_CHARGED_TM',

  SECOND_CHARGED_MOVE_UNLOCK:
    'SECOND_CHARGED_MOVE_UNLOCK',

  SPECIAL_ACQUISITION:
    'SPECIAL_ACQUISITION',
}

export const PROJECT_BUILD_STATUS = {
  SUCCESS:
    'SUCCESS',

  INVALID_RECOMMENDATION:
    'INVALID_RECOMMENDATION',

  MISSING_COLLECTION_ID:
    'MISSING_COLLECTION_ID',

  // Retained for V1 compatibility.
  UNSUPPORTED_RECOMMENDATION:
    'UNSUPPORTED_RECOMMENDATION',

  MISSING_TARGET_LEVEL:
    'MISSING_TARGET_LEVEL',
}