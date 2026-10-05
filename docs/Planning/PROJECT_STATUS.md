# PokeIQ — Project Status

**Last Updated:** September 13, 2026

**Status:** Active Development

**Current Phase:** Import Intelligence / Screen Recording Import

---

# 1. Purpose of This File

This is the primary development handoff document for PokeIQ.

Use this file when:

* Starting a new development chat
* Returning after a break
* Determining the current stable milestone
* Identifying the next development task
* Determining which files are relevant to the next change

This file should remain focused on the **current implementation state**.

Long-term information belongs elsewhere:

* `VISION.md` — long-term product vision
* `ROADMAP.md` — development horizons and planned direction
* `BRAINSTORM.md` — uncommitted ideas
* `ARCHITECTURE.md` — technical structure and architectural direction
* `COMPETITIVE_ANALYSIS.md` — observations about other Pokémon tools, if/when created

Do not turn this file back into a complete history of every PokeIQ idea.

---

# 2. Current Product State

PokeIQ is currently a local React + Vite Pokémon GO intelligence application.

The strongest completed systems currently are:

* Player Collection
* Pokémon GO reference-data pipeline
* Raid combat engine
* Raid Strength V6
* 18-Type Raid Profile
* Boss-Specific Raid Analysis
* Projects
* Resource-aware recommendation infrastructure
* Import infrastructure

The application is increasingly moving from:

> Pokémon database / collection manager

toward:

> Personalized Pokémon GO account intelligence.

The current active development focus is **making screen-recording imports reliable, accurate, and substantially faster than the current implementation**.

---

# 3. Current Navigation

Current top-level application areas are:

* Dashboard
* Raid Profile
* Boss Analysis
* Projects
* Developer
* Collection
* Resources
* Imports

This is the current development UI.

It is **not** considered the permanent long-term navigation structure.

Future navigation direction is documented in `VISION.md`, `ROADMAP.md`, and `ARCHITECTURE.md`.

---

# 4. Current System Ownership

These boundaries are important and should be preserved.

## Dashboard

Owns:

> Account-wide investment recommendations.

It answers questions about which owned Pokémon may be worth developing.

---

## Raid Profile

Owns:

> How strong are my attacking-type raid teams?

It evaluates all 18 attacking types.

It includes:

* Exact current team
* Team completeness
* Current team strength
* Theoretical benchmark strength
* Type Team Rating
* Best available recommendation per type

---

## Boss Analysis

Owns:

> What are the best six Pokémon I currently own against this specific raid boss?

It evaluates current-state combat performance.

It does **not** own investment advice.

---

## Projects

Owns:

> Which exact owned Pokémon has the player committed to developing?

Projects affect recommendation eligibility.

Projects do not remove Pokémon from current-state combat analysis.

---

## Collection

Owns:

> What exact Pokémon does the player currently own?

Exact Collection identity should be preserved using `collectionId`.

---

## Resources

Owns player resource state.

Resource intelligence can use this state to determine whether recommendations are actionable.

---

## Imports

Owns mechanisms for getting Pokémon into the normalized Collection.

Import-specific uncertainty should remain inside the import pipeline.

---

# 5. Reference Data

The reference-data update pipeline is established.

Current generated reference data includes areas such as:

* Pokémon
* Forms
* PvE moves
* Combat data
* Candy families
* Permanent evolutions
* Form changes
* Move reassignments
* Raid Strength references

The reference updater is intended to normalize external Pokémon GO data into PokeIQ-owned structures.

Important principle:

> Application intelligence should consume normalized PokeIQ reference data rather than directly depending on raw upstream Game Master structures.

---

# 6. Collection

The Collection system is established and is now foundational to account-specific intelligence.

Owned Pokémon can contain information including:

* Species
* Form
* CP
* IVs
* Fast Move
* Charged Move
* Second Charged Move
* Shadow state
* Shiny state
* Other supported traits

Important:

> A Pokémon may have two Charged Moves.

Raid candidate generation and downstream systems must preserve both valid Charged Move possibilities where relevant.

Forms are treated as distinct Pokémon identities where appropriate.

Example:

* Sneasel
* Hisuian Sneasel

should not be treated as interchangeable.

---

# 7. Import Pipeline

The current import architecture includes:

```text
Input
  ↓
Vision / parsing
  ↓
Normalized detected Pokémon
  ↓
processImport
  ↓
Import Review
  ↓
Collection
```

Existing concepts include:

* Species resolution using fuzzy matching
* CP extraction
* IV extraction
* Auto-approved imports
* Review-required imports
* Unreadable imports
* Exact duplicate detection
* Updated Pokémon detection
* Possible evolution detection

Current practical import methods include:

* Manual Entry
* Screenshot / visual import infrastructure
* Screen Recording Import
* CSV import

CSV remains available but its long-term player usefulness is uncertain.

Do not invest heavily into CSV without first establishing a realistic player workflow for obtaining useful Pokémon GO CSV data.

Long term, all import methods should normalize into the same Collection model.

---

# 8. Raid Engine

The raid engine is established and validated across several mechanical layers.

Relevant area:

`src/engine/Raid/`

The engine includes or supports concepts such as:

* Damage
* Move timing
* Energy
* Raid performance
* Boss parameters
* Boss movesets
* Boss offensive pressure
* Survivability
* Matchup survivability

The existing raid engine should be extended rather than rebuilt.

---

# 9. Raid Candidate System

Raid candidate generation converts exact owned Pokémon into usable raid loadouts.

Important validated behavior includes:

* Ready Pokémon builds a valid loadout
* Two Charged Moves can produce two valid loadouts
* Missing Fast Move is rejected
* Missing Charged Move is rejected
* Invalid Fast Move is rejected
* Invalid Charged Move is rejected
* One valid and one invalid Charged Move preserves the valid loadout
* Combat-state failures are propagated

Latest established Raid Candidate validation milestone:

**8 / 8 tests passed**

---

# 10. Raid Profile V1

**Status: COMPLETE / STABLE**

Raid Profile evaluates the player's raid strength across all 18 attacking types.

Current behavior includes:

* 18 type benchmarks
* Exact current teams
* Up to six attackers per type
* Team completeness
* Current team strength
* Theoretical benchmark strength
* Type Team Rating
* One recommendation per attacking type

The current benchmark concept compares the player's team against a theoretical high-end reference.

The intended theoretical team reference is based around:

* Level 50
* 15/15/15 IVs
* Best legal raid configurations
* Six team slots
* Standard Pokémon duplication where legal for the benchmark model
* Shadow attackers where included by the benchmark universe
* At most one temporary evolution

The Raid Profile should not be rebuilt from scratch.

Future changes should be targeted refinements.

---

# 11. Raid Strength V6

**Status: VALIDATED / STABLE**

Raid Strength measures how strong an exact owned or projected raid state is relative to theoretical individual attacker ceilings.

Relevant files include:

* `src/utils/raidStrength.js`
* `scripts/updateRaidStrengthReference.mjs`
* `scripts/testRaidStrength.mjs`
* `src/data/reference/raid-strength.json`

The current production utility is Raid Strength V6.

Important V6 rule:

> Owned/projected Pokémon receive credit only for Fast + Charged Move loadouts they actually possess.

Raid Strength does not substitute a Pokémon's theoretical best moveset for its exact current state.

Theoretical/reference ceilings remain theoretical.

This preserves the distinction between:

* What the Pokémon currently has
* What the species could theoretically have

---

# 12. Raid Strength Role Semantics

Raid Strength recognizes attacking roles from both sides of an exact loadout:

* Fast Move type
* Charged Move type

One Fast Move plus two owned Charged Moves can therefore allow an owned Pokémon to represent up to three attacking types across its valid loadouts.

Examples:

```text
Psycho Cut + Focus Blast

→ PSYCHIC + FIGHTING
```

```text
Rock Throw + Stone Edge

→ ROCK
```

The entire Fast + Charged combination remains the combat unit.

Raid Strength does not artificially split Cycle DPS into independent Fast-Move DPS and Charged-Move DPS.

Relevant roles are only counted where that attacking type is actually super effective against the benchmark defender.

---

# 13. Raid Strength Compact Reference V2

The generated compact Raid Strength reference currently uses:

**Schema Version: 2**

The reference deliberately contains two related theoretical concepts.

## Individual Raid Strength Ceilings

Used by Raid Strength V6.

Current theoretical level:

**Level 40**

These ceilings are used to compare exact owned/projected attackers against theoretical attackers for relevant roles and benchmark matchups.

## Type-Team Benchmarks

Used for theoretical Raid Profile team strength.

Current theoretical level:

**Level 50**

Current benchmark assumptions include:

* 15/15/15 IVs
* Six team slots
* Standard duplication allowed by the benchmark model
* Shadow attackers included in the standard theoretical universe where applicable
* Maximum one temporary evolution
* Missing slot strength = 0
* Team raw strength = sum of slot Cycle DPS

This distinction is deliberate.

Do not collapse the Level 40 individual Raid Strength ceiling and Level 50 Type Team benchmark into one concept without deliberately redesigning the system.

---

# 14. Raid Strength Reference Generation

The current Raid Strength reference generator:

`scripts/updateRaidStrengthReference.mjs`

builds:

* Level 40 theoretical attacker candidates
* Level 50 theoretical attacker candidates
* 18 benchmark matchups
* Individual role leaders
* Overall leaders
* Six-slot Type Team theoretical benchmarks
* Standard and temporary-evolution universes

The current attacking-role definition is:

`FAST_OR_CHARGED_MOVE_TYPE`

The current type-team selection rule is conceptually:

> Best of six standard attackers OR one temporary evolution plus five standard attackers.

At most one temporary evolution is permitted in the theoretical team.

---

# 15. Raid Strength Validation

The Raid Strength validation suite has been synchronized with the current V6 exact-state behavior and compact-reference V2 schema.

Latest validation milestone:

**164 / 164 tests passed**

The validation currently confirms areas including:

* Current candidate universe generation
* Released Shadow universe
* Compact schema version
* 18 benchmark references
* Level 40 individual ceiling metadata
* Level 50 Type Team benchmark metadata
* Current CPM values
* Current theoretical candidate count
* Temporary evolution team limit
* Role semantics
* Full theoretical ranking generation
* Exact-state loadout evaluation
* Full-theoretical vs compact-reference equivalence
* Strength scores
* Classifications
* Best matchups
* Best attacking roles
* Median strength
* Average strength
* Overall benchmark strength
* Relevant matchup counts
* Elite / Strong / Competitive breadth
* Role summaries
* Super-effective relevance filtering

Representative equivalence checks currently include:

* Amaura
* Aurorus
* Nihilego
* Mewtwo
* Shadow Mewtwo
* Mega Rayquaza

All representative compact-reference results matched the full theoretical-ranking path at the latest validation milestone.

---

# 16. Current Raid Strength Reference Baseline

At the latest successful validation:

```text
Level 40 CPM: 0.7903
Level 50 CPM: 0.8403

Released Shadow IDs: 475

All generated candidates: 1723
Player-usable candidates: 1608

Benchmark matchups: 18
```

Each of the 18 theoretical benchmark ranking passes produced:

```text
1607 ranked attackers
```

with no unexpected theoretical ranking errors.

The compact reference was regenerated before the successful validation so its candidate metadata matches the current reference-data universe.

---

# 17. Representative Raid Strength Sanity Checks

The latest successful Raid Strength validation also confirmed useful broad relationships.

Examples include:

* Nihilego scored higher than Amaura
* Shadow Mewtwo scored at least as highly as standard Mewtwo
* Mega Rayquaza only counted genuinely relevant matchups
* Mega Rayquaza did not incorrectly receive 18 Elite matchups

These are sanity checks rather than the definition of Raid Strength itself.

Do not hardcode these outcomes into production logic.

---

# 18. Raid Profile Recommendation Behavior

Current recommendation philosophy:

> One recommendation per attacking type.

This was chosen deliberately to prevent Raid Profile from becoming cluttered.

Recommendations should represent meaningful team improvement rather than simply listing every possible upgrade.

Active or paused Project Pokémon can be excluded from investment recommendations while remaining eligible for current-team membership.

---

# 19. Type Team Rating

The Raid Profile includes a normalized team rating intended to answer:

> How strong is my current team compared with the best theoretical team for this attacking type?

The target scale is:

**0–100**

The rating should represent absolute raid-team strength relative to the theoretical reference.

Team completeness should remain visible separately.

Example:

```text
Rating: 68 / 100
Completeness: 4 / 6
```

Do not collapse these into the same concept.

---

# 20. Boss Analysis V2

**Status: COMPLETE / STABLE**

Boss Analysis answers:

> What are the best six Pokémon I currently own against this specific raid boss?

It evaluates exact current owned Pokémon.

Current inputs include:

* Exact species/form
* Current level
* Current IVs
* Current moves
* Shadow state
* Boss typing
* Boss raid parameters
* Boss possible movesets

---

# 21. Boss Analysis Scoring

Boss Analysis V2 uses both outgoing and incoming combat context.

Current concepts include:

* Outgoing DPS
* Boss pressure
* Bulk
* Survival time
* TDO
* Raid Score

Current Raid Score formula:

```text
Raid Score = (DPS³ × TDO)^(1/4)
```

This intentionally favors damage output while still rewarding survivability.

Boss Analysis should not be converted into a pure DPS ranking without deliberate evidence that the scoring model should change.

---

# 22. Boss Moveset Handling

Boss Analysis evaluates possible boss moveset scenarios.

The service should not simply assume one arbitrary boss moveset.

The current implementation is intended to provide useful rankings across the boss's possible combat states.

Boss moveset handling is part of the established V2 analysis and should be preserved during future UI improvements.

---

# 23. Boss Analysis Validation

Boss Analysis has a dedicated service validation suite.

Latest stable milestone:

**40 / 40 tests passed**

The production build also passed after Boss Analysis V2.

This is an important regression baseline.

If future Boss Analysis changes cause failures, diagnose the change rather than casually rewriting the scoring system.

---

# 24. Boss Analysis Current UI

The current Boss Analysis UI allows the player to:

* Choose a Pokémon as the raid boss
* Choose a raid tier manually
* Run analysis
* View the best current team

Current manually selectable tiers include:

* 5-Star
* 3-Star
* 1-Star
* Standard Mega

Known future UI gap:

Additional relevant raid tiers/categories are not yet represented.

The current arbitrary boss selector remains useful for advanced/hypothetical analysis.

However, it is not the intended final default player experience.

Future direction is documented in `ROADMAP.md`.

---

# 25. Projects

Projects are established as exact owned-Pokémon commitments.

Projects should preserve exact `collectionId`.

The player can use Projects to represent Pokémon they intend to develop.

Project functionality includes resource-aware development planning.

Family-specific Candy can be changed from Projects.

---

# 26. Project Recommendation Interaction

Important rule:

> Project status affects investment recommendations, not current-state combat eligibility.

Therefore an active Project Pokémon:

* Can be excluded from another investment recommendation
* Can still appear in Raid Profile current teams
* Can still appear in Boss Analysis

A paused Project should follow the established recommendation-exclusion behavior unless deliberately changed.

---

# 27. Resource Actionability

Recommendation systems have begun using resource state to determine whether actions are currently affordable.

Known behavior includes:

* Recommendations can indicate missing Candy information
* "Needs candy check" flow exists
* Player can edit family-specific Candy
* Recommendation can become Affordable after the resource state is updated

This is an important foundation for future resource intelligence.

Current resource actionability primarily answers:

> Can I afford this?

Long-term resource intelligence will also need to answer:

> Should I spend these resources here?

That future work belongs in the roadmap, not this status file.

---

# 28. TM / Move Handling

A previous issue where recommendations displayed:

```text
No TM moves available
```

was fixed.

Species move options should come from the appropriate reference data and remain filtered to legal moves for that Pokémon/form.

Do not reintroduce unrestricted global move dropdowns.

---

# 29. Screenshot Import

Screenshot import is an established part of the Vision pipeline.

The existing screenshot path includes:

```text
Screenshot
  ↓
OCR
  ↓
Pokémon region detection
  ↓
Text parsing
  ↓
Species / CP / IV extraction
  ↓
processImport
  ↓
Import Review
```

The screenshot pipeline is not currently the main development focus.

The recording importer should ultimately reuse the same downstream normalization and review architecture rather than creating a separate Collection-import model.

---

# 30. Screen Recording Import

**Status: EXPERIMENTAL / IN DEVELOPMENT**

Screen Recording Import is now the **current active development area**.

The goal is:

> Import multiple Pokémon from a recording of Pokémon GO storage while scrolling through the player's collection.

The intended workflow is:

```text
Pokémon GO storage recording
        ↓
Video frame extraction
        ↓
Storage grid alignment
        ↓
Storage slot detection
        ↓
Slot cropping
        ↓
OCR / visual analysis
        ↓
Unique Pokémon tracking
        ↓
processImport
        ↓
Import Review
        ↓
Collection
```

The basic video and storage-grid infrastructure is functional.

The major unresolved problem is:

> **Reliable tracking of the same physical Pokémon across multiple video frames.**

A second major problem is:

> **OCR performance is currently far too slow because the same visible Pokémon are analyzed repeatedly.**

---

# 31. Recording Frame Extraction

The recording pipeline currently includes utilities for:

* Loading video
* Determining duration
* Seeking to timestamps
* Capturing video frames
* Building recording timestamps
* Reporting extraction progress

Current default sampling interval:

```text
0.5 seconds
```

Captured frames contain:

* ID
* Timestamp
* Preview image
* Width
* Height

This portion of the pipeline is functioning.

---

# 32. Storage Grid Detection

The Pokémon GO storage screen uses a predictable three-column layout.

Current geometry was calibrated against a:

```text
1206 × 2622
```

recording.

Current assumptions include:

* 3 columns
* Approximately 4 visible rows
* Repeating vertical row spacing
* Configurable vertical offset
* Configurable horizontal padding
* Storage-area boundaries

The detector produces aligned storage regions for subsequent cropping.

---

# 33. Storage Grid Alignment

The recording pipeline includes:

`findStorageGridAlignment`

Its purpose is to determine the vertical phase/position of the repeating storage grid.

The current pipeline is:

```text
Frame
  ↓
findStorageGridAlignment
  ↓
detectStorageRegions
  ↓
cropStorageRegions
  ↓
analyzeStorageCrop
```

Alignment is useful, but the current implementation does not yet provide sufficient information to reliably track every Pokémon across a scrolling recording.

---

# 34. Storage Crop Analysis

Each detected storage slot can be cropped and analyzed independently.

The current analysis can produce information such as:

* Pokémon name
* CP
* Pokémon ID
* API name
* Recognition state
* Review-required state
* Unreadable state

The slot analysis currently classifies each slot as:

* Recognized
* Review required
* Unreadable

---

# 35. Recording OCR Performance

OCR is currently the dominant performance cost of the recording importer.

Testing established:

### Long recording

A roughly 30-second recording produced approximately:

```text
~368 detections
~5 minutes analysis time
```

The exact detection count was not reliable because repeated appearances were being treated as separate Pokémon.

### Controlled recording

A roughly 7-second recording containing **exactly 36 Pokémon** was used as a controlled benchmark.

Previous versions produced:

```text
61 detected
~60–70 seconds
```

This established that the pipeline was detecting many duplicates and spending substantial time reprocessing the same visible Pokémon.

---

# 36. Controlled Recording Benchmark

The 7-second recording containing exactly:

```text
36 Pokémon
```

is now the primary development benchmark for the recording importer.

This recording should be used for iterative tracking development because the expected result is known.

Target:

```text
36 unique Pokémon
```

The longer recording should generally be reserved for later validation once the short controlled benchmark is behaving correctly.

---

# 37. Recording Tracking Experiment History

Several approaches have been tested.

## Initial Slot-by-Slot Processing

Every frame's visible storage slots were OCR'd independently.

This produced very large duplicate counts.

The system was effectively treating:

> Pokémon visible in multiple frames

as:

> Multiple Pokémon.

---

## OCR / Import-Level Deduplication

The existing import matching system was not sufficient to solve physical frame continuity.

It can identify relationships such as:

* Exact duplicates
* Updated Pokémon
* Possible evolutions

but it operates after Pokémon detections have already been produced.

It therefore cannot reliably prevent repeated frame observations from becoming separate detections.

---

## V5 / Tracking Improvements

Additional work attempted to reduce duplicate frame detections.

The long recording continued to produce approximately:

```text
355–368 detections
```

This indicated that the fundamental tracking problem remained.

---

# 38. V6 Visual Crop Matching

The latest experimental approach was V6.

The idea was:

```text
Current storage crop
        ↓
Compare against previous-frame crops
        ↓
If visually similar:
    reuse previous OCR
        ↓
Otherwise:
    OCR current crop
```

A visual crop comparison utility was introduced to generate normalized grayscale image signatures and calculate similarity.

The goal was to avoid re-running OCR when the same Pokémon remained visible across frames.

---

# 39. V6 Diagnostic Results

The controlled 7-second / 36-Pokémon recording was analyzed using V6.

Final diagnostic:

```text
Frames: 16

OCR crops: 162
Reused crops: 15

New tracks created: 162
Reused track matches: 15

Detected Pokémon: 162

Expected Pokémon: 36
```

Per-frame behavior showed that most frames were still being treated as entirely new content.

Example:

```text
Frame 1:
OCR 12
Reused 0
New tracks 12

Frame 2:
OCR 12
Reused 0
New tracks 12

Frame 3:
OCR 9
Reused 0
New tracks 9

Frame 4:
OCR 6
Reused 6
New tracks 6

Frame 5:
OCR 12
Reused 0
New tracks 12
```

The visual matcher therefore **does work**, but only for a small portion of the cases where it needs to.

V6 is not considered a successful recording-tracking solution.

---

# 40. Important V6 Conclusion

The V6 experiment established an important distinction.

The problem is **not** simply:

> "We have no way to compare frames."

Visual comparison successfully matched some crops.

The problem is that:

> **Comparing only individual visual crops against the immediately previous frame is not reliable enough to establish continuous Pokémon identity across a scrolling storage screen.**

Additionally, the current crop comparison is sensitive to changes in crop alignment and screen movement.

V6 therefore should be treated as a useful diagnostic experiment, not as the final tracking architecture.

---

# 41. Current Recording Architecture

The current experimental recording architecture includes components/utilities corresponding to:

* Video frame extraction
* Video seeking
* Video frame capture
* Storage grid alignment
* Storage region detection
* Storage region cropping
* Storage crop OCR
* Recording frame analysis
* Recording-level analysis
* Import normalization

The exact filenames should be confirmed from the current repository before future changes rather than assumed from memory.

Known relevant files currently include:

```text
src/utils/video/
```

and the storage-vision analysis modules used by the recording pipeline.

---

# 42. Current Recording Problem

The core problem can now be stated precisely:

> Given a scrolling Pokémon GO storage recording, determine which visible grid slot corresponds to the same Pokémon previously observed, and determine which Pokémon are genuinely new.

The current system is attempting to solve this using image similarity.

That has not been sufficiently reliable.

The next architecture should therefore make stronger use of the **known repeating storage-grid geometry and cumulative scroll position**.

---

# 43. Recommended Next Recording Architecture

The next planned experiment is **V7: cumulative grid / scroll tracking**.

The conceptual pipeline is:

```text
Video
  ↓
Sample frames
  ↓
Determine storage grid position
  ↓
Calculate cumulative vertical scroll
  ↓
Assign each crop an absolute storage row
  ↓
Identify same row + column across frames
  ↓
OCR only genuinely new positions
  ↓
Build unique Pokémon detections
```

The important change is:

> Do not primarily ask whether two images look alike.

Instead:

> Determine where each grid slot exists in the continuously scrolling storage layout.

If the grid position can be tracked reliably, the same Pokémon can be identified by:

```text
absolute row
+
column
```

rather than by OCR identity or pixel similarity.

This is the current intended direction.

---

# 44. Recording Performance Goal

The recording importer should eventually avoid repeatedly OCR'ing the same Pokémon.

The desired progression is roughly:

```text
Current:
many repeated OCR operations

Target:
OCR approximately once per genuinely new Pokémon
```

For the controlled 36-Pokémon recording, the ideal outcome is:

```text
36 unique Pokémon
```

with substantially fewer OCR operations than the current:

```text
162 OCR crops
```

The exact final OCR count is not yet defined.

Accuracy comes before aggressive optimization.

---

# 45. Recording Validation Strategy

Development should use the controlled 36-Pokémon recording first.

Each experimental version should report at minimum:

```text
Frames
OCR crops
Reused / skipped crops
New tracks
Final unique Pokémon
```

The primary correctness criterion is:

```text
Expected: 36
```

The primary performance criterion is:

> Significantly fewer OCR operations and substantially shorter analysis time once tracking is correct.

Only after the controlled recording is reliable should longer real-world storage recordings be used as the main validation case.

---

# 46. Tesseract Console Logging

The recording pipeline previously produced large quantities of Tesseract progress output through:

```text
[Vision OCR]
```

The OCR logger was removed from `runOcr.js` during the latest debugging session so the browser console could be used for recording diagnostics.

Tesseract may still produce native warning messages for very small/unreadable image regions, such as:

```text
Image too small to scale!!
Line cannot be recognized!!
```

These are not currently considered the primary tracking problem.

The important V6 diagnostic output is now available without the previous `[Vision OCR]` flood.

---

# 47. Projects

Projects are established as exact owned-Pokémon commitments.

Projects should preserve exact `collectionId`.

The player can use Projects to represent Pokémon they intend to develop.

Project functionality includes resource-aware development planning.

Family-specific Candy can be changed from Projects.

---

# 48. Project Recommendation Interaction

Important rule:

> Project status affects investment recommendations, not current-state combat eligibility.

Therefore an active Project Pokémon:

* Can be excluded from another investment recommendation
* Can still appear in Raid Profile current teams
* Can still appear in Boss Analysis

A paused Project should follow the established recommendation-exclusion behavior unless deliberately changed.

---

# 49. Resource Actionability

Recommendation systems have begun using resource state to determine whether actions are currently affordable.

Known behavior includes:

* Recommendations can indicate missing Candy information
* "Needs candy check" flow exists
* Player can edit family-specific Candy
* Recommendation can become Affordable after the resource state is updated

This is an important foundation for future resource intelligence.

Current resource actionability primarily answers:

> Can I afford this?

Long-term resource intelligence will also need to answer:

> Should I spend these resources here?

That future work belongs in the roadmap, not this status file.

---

# 50. TM / Move Handling

A previous issue where recommendations displayed:

```text
No TM moves available
```

was fixed.

Species move options should come from the appropriate reference data and remain filtered to legal moves for that Pokémon/form.

Do not reintroduce unrestricted global move dropdowns.

---

# 51. Current Stable Development Baseline

The following systems should currently be treated as established foundations.

## Stable / Established

* Collection
* Reference-data pipeline
* Raid mechanical engine
* Raid candidate generation
* Raid Strength V6
* Compact Raid Strength Reference V2
* Raid Profile V1
* 18 type benchmarks
* Type Team Rating concept
* Boss Analysis V2
* Boss Analysis service tests
* Projects
* Resource actionability foundation
* Screenshot import infrastructure
* Core video/frame extraction infrastructure
* Storage grid detection infrastructure

## Experimental / In Development

* Screen Recording Import
* Recording frame-to-frame Pokémon tracking
* Recording duplicate prevention
* Recording OCR optimization
* Recording-specific review workflow

## Still Expected to Evolve

* Recommendation intelligence
* Resource intelligence
* Boss Analysis player-facing raid selection
* Navigation
* Import UX
* Account-wide prioritization
* Raid Profile refinements

## Long-Term / Not Current Implementation

* Live map
* Event intelligence
* AI assistant
* Mobile app
* Cloud accounts
* Official Pokémon GO integration
* Other Pokémon game modules

Refer to the other documentation files for those systems.

---

# 52. Current Validation State

Important current validation milestones:

## Raid Candidate

**8 / 8 tests passed**

at the established candidate-validation milestone.

## Raid Strength V6

**164 / 164 tests passed**

Full theoretical-ranking and compact-reference equivalence is validated for the current representative test set.

## Boss Analysis V2

**40 / 40 tests passed**

at the latest stable Boss Analysis milestone.

## Production Build

Latest established production build:

```powershell
npm.cmd run build
```

**Passed** after the Raid Strength V6 validation milestone.

A large JavaScript bundle warning may exist but is not currently a correctness failure.

## Screen Recording

No final recording-import validation milestone exists yet.

The current controlled benchmark is:

```text
36 expected Pokémon
```

The latest V6 result was:

```text
162 detected
```

Therefore Screen Recording Import should **not** currently be considered stable or production-ready.

---

# 53. Resolved Raid Strength Schema/Test Issue

The previous active technical issue involved a mismatch between:

* Compact Raid Strength Reference Schema V2
* An older Raid Strength test harness still validating Schema V1 assumptions

The stale test expected fields such as:

```text
schemaVersion = 1

methodology.theoreticalLevel

methodology.theoreticalCandidateCount
```

while the current generated reference had moved to Schema V2.

The test was updated to validate the intended V2 structure.

The compact reference was also regenerated so its candidate metadata matched the current reference-data universe.

A second issue then became visible:

```text
NO_STATE_LOADOUTS
```

for representative Pokémon.

This was not a production Raid Strength defect.

Raid Strength V6 intentionally requires exact owned/projected Fast + Charged Move loadouts.

The validation harness was updated so synthetic representative Pokémon receive explicit legal test loadouts derived from their theoretical rankings.

This preserves the V6 exact-state rule while allowing the diagnostic full-theoretical and production compact-reference paths to evaluate identical states.

Final result:

**164 / 164 Raid Strength tests passed.**

The previous Raid Strength schema/test mismatch is therefore **resolved**.

---

# 54. Development Workflow

Preferred workflow for PokeIQ development:

1. Define one contained change.
2. Identify the relevant files.
3. Prefer pure logic before UI changes.
4. Add or update targeted validation.
5. Run the relevant tests.
6. Fix failures before continuing.
7. Integrate with the UI only after backend/service behavior is stable.
8. Validate against the real Collection where appropriate.
9. Run the production build.
10. Update this file at a stable stopping point.

For experimental Vision work:

1. Establish a controlled test recording.
2. Define the expected result.
3. Instrument the pipeline before optimizing.
4. Measure OCR volume separately from tracking accuracy.
5. Change one tracking assumption at a time.
6. Avoid repeatedly testing with long recordings until the controlled case works.

---

# 55. Code Change Preference

When providing code changes:

> Prefer complete file rewrites.

Do not provide small patch fragments unless there is a strong reason.

This is especially important for:

* React components
* Services
* Utilities
* Scripts
* Vision pipeline modules

Small isolated CSS additions may occasionally be handled separately if rewriting the entire stylesheet creates unnecessary risk.

---

# 56. Project Context Workflow

The full repository ZIP or project tree can be used to establish project structure when needed.

Do not repeatedly inspect the entire repository for every change.

Preferred workflow:

1. Use this file to establish current state.
2. Request only the files relevant to the next change.
3. Inspect additional project structure only when necessary.
4. Make one contained change.
5. Validate.
6. Continue.

The user's local repository is the authoritative code state.

If this document conflicts with the current code, inspect the code before making assumptions.

---

# 57. Useful Commands

## Start Development Server

From the app directory:

```powershell
npm.cmd run dev
```

## Production Build

```powershell
npm.cmd run build
```

## Update Reference Data

Known underlying script:

```text
scripts/updateReferenceData.mjs
```

Use the project's configured npm command/script when available.

## Update Raid Strength Reference

```powershell
node scripts/updateRaidStrengthReference.mjs
```

## Raid Candidate Validation

Known configured command:

```powershell
npm.cmd run raid:test-candidate
```

## Raid Strength Validation

```powershell
node scripts/testRaidStrength.mjs
```

Use the project's configured npm command instead if one exists in the current `package.json`.

---

# 58. Documentation Structure

The intended documentation structure is:

```text
docs/

│
├── VISION.md
├── ROADMAP.md
├── BRAINSTORM.md
├── ARCHITECTURE.md
├── PROJECT_STATUS.md
└── COMPETITIVE_ANALYSIS.md
```

The documents have different responsibilities.

Do not duplicate every future idea into this file.

---

# 59. When to Update This File

Update `PROJECT_STATUS.md` when:

* A meaningful milestone is completed
* A system's stable behavior changes
* A new major system becomes established
* Validation state changes
* Development stops at a new resume point
* An important architectural ownership boundary changes

It does not need to be rewritten after every tiny code edit.

At the end of a substantial development session, this should normally be the primary document updated.

---

# 60. Exact Resume Point

The Raid Strength compact-reference milestone is complete.

The stable baseline is:

```text
Raid Candidate
8 / 8 passed

Raid Strength V6
164 / 164 passed

Boss Analysis V2
40 / 40 passed

Production Build
passed
```

There is currently **no known blocking Raid Strength validation failure**.

The current active work is **Screen Recording Import**.

The latest controlled recording test contains:

```text
7 seconds
36 known Pokémon
16 analyzed frames
```

The latest V6 result was:

```text
OCR crops: 162
Reused crops: 15
New tracks: 162
Reused track matches: 15
Detected Pokémon: 162
Expected Pokémon: 36
```

Therefore V6 is considered **experimental and unsuccessful as the final tracking solution**.

The next planned development direction is:

> **V7 cumulative grid / scroll tracking**

The primary idea is to use the known three-column storage geometry and cumulative vertical movement to assign crops to an absolute storage row and column, rather than relying primarily on visual similarity.

Do not begin another long recording test before the V7 tracking logic has been implemented and tested against the controlled 36-Pokémon recording.

---

# 61. Handoff Summary

A new development chat should understand the following immediately:

* PokeIQ is a React + Vite local application.
* Collection is the source of exact owned Pokémon.
* Pokémon may have two Charged Moves.
* Raid candidate generation preserves valid exact loadouts.
* Raid Strength V6 evaluates exact owned/projected moves.
* Raid Strength individual theoretical ceilings currently use Level 40.
* Compact Raid Strength Reference uses Schema V2.
* Raid Strength V6 validation is **164 / 164**.
* Raid Profile V1 is established.
* Raid Profile evaluates all 18 attacking types.
* Type Team Rating compares current teams with Level 50 theoretical team references.
* Team completeness and Type Team Rating are separate concepts.
* Boss Analysis V2 is established.
* Boss Analysis uses DPS, survival, TDO, and Raid Score.
* Current Raid Score is `(DPS³ × TDO)^(1/4)`.
* Boss Analysis validation is **40 / 40**.
* Projects represent exact owned Pokémon committed for development.
* Project status affects recommendations, not current combat eligibility.
* Resource actionability exists.
* Production build passes at the established stable milestone.
* Complete file rewrites are preferred.
* Do not rebuild stable Raid Strength, Raid Profile, or Boss Analysis systems from scratch.
* Screenshot import infrastructure exists.
* Screen Recording Import is currently experimental.
* Video frame extraction is functional.
* Storage grid detection is functional.
* OCR works but is currently too slow for efficient recording imports.
* The controlled recording benchmark contains exactly **36 Pokémon**.
* V6 visual crop matching was tested and did not solve tracking.
* V6 produced **162 detections from 36 actual Pokémon**.
* The next planned approach is **V7 cumulative grid / scroll tracking**.
* The long-term vision lives outside this file.
* The Raid Strength baseline is stable.
* Screen Recording Import is the current active development problem.

---

# 62. Recommended Next Action

When development resumes:

1. Review this file for the current stable baseline.
2. Treat Raid Strength, Raid Profile, Boss Analysis, Projects, and Collection as established foundations.
3. Continue Screen Recording Import development.
4. Implement and test **V7 cumulative grid / scroll tracking**.
5. Use the controlled 7-second / 36-Pokémon recording as the primary benchmark.
6. Do not move to longer recordings until the controlled recording can reliably produce approximately **36 unique Pokémon**.
7. Once tracking is reliable, optimize OCR volume and analysis time.
8. Integrate the resulting detections into the existing `processImport` / Import Review pipeline.
9. Validate the complete recording-import workflow before considering the feature stable.

The immediate goal is therefore:

> **Make a 7-second recording containing exactly 36 Pokémon produce exactly those 36 unique Pokémon, without requiring hundreds of OCR operations.**
