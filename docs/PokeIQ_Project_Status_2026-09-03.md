# PokeIQ Project Status

Last updated: September 6, 2026

---

# Current development state

Two major player-facing raid intelligence surfaces are now complete:

## 18-Type Raid Profile V1

Answers:

> How strong are my 18 attacking-type teams, and what is the single best available way to improve each one?

## Boss-Specific Raid Analysis V2

Answers:

> Given a specific raid boss, what is the best team I can actually use from my current Pokémon collection?

Boss Analysis V2 is now fully integrated into the application and has passed:

- targeted engine validation
- service validation
- real-Collection browser validation
- UI validation
- production build validation

The Boss Analysis ranking is no longer based only on theoretical Cycle DPS.

It now combines:

- current outgoing damage
- boss offensive pressure
- owned Pokémon bulk
- estimated survival time
- estimated total damage output
- a blended Raid Score

The latest Boss Analysis service validation reached:

**40 / 40 tests passed**

Production `npm run build` also passed after the completed V2 integration.

---

# Product ownership boundaries

PokeIQ currently separates its major decision-support surfaces as follows.

## Dashboard

Answers:

> What should I invest in next across my whole account?

Responsibilities:

- Account-wide investment ranking
- Detailed recommendation reasoning
- Resource intelligence
- Raid Investment quality rules
- Converting recommendations into Projects

---

## Raid Profile

Answers:

> How strong are my 18 attacking-type teams?

Responsibilities:

- All 18 attacking teams
- Type Team Rating
- Current exact team members
- Team completeness
- One best improvement per type
- Current versus projected rating

Raid Profile V1 is complete.

---

## Projects

Answers:

> What exact Pokémon have I committed resources toward developing?

Responsibilities:

- Exact owned Pokémon
- Ongoing development plans
- Current Project state
- Pokémon-family-specific resources
- Active / Paused Project recommendation exclusion

Project exclusion affects recommendation eligibility only.

A Project Pokémon may still appear normally as a current Raid Profile or Boss Analysis team member.

---

## Boss Analysis

Answers:

> What should I actually use against this specific raid boss right now?

Responsibilities:

- Specific raid boss selection
- Raid tier
- Boss defensive typing
- Exact owned Pokémon
- Current combat state
- Current equipped moves
- Multiple current charged moves
- Boss legal movesets
- Outgoing damage
- Incoming boss pressure
- Survivability
- TDO
- Raid Score
- Best current six-Pokémon team

Boss Analysis is intentionally current-state focused.

It does not currently assume:

- Future power-ups
- Evolutions
- TMs
- Elite TMs
- Unowned moves
- Unowned Pokémon
- Dodging
- Relobbying
- Friendship bonuses
- Weather
- Party Power
- Mega ally boosts

Investment advice remains primarily owned by Dashboard and Raid Profile.

---

# Working development structure

PokeIQ development should continue using the workflow that has proven reliable throughout the raid-engine work.

## Code-change workflow

For meaningful code changes:

1. Work on one contained piece of functionality at a time.
2. Prefer pure backend logic before React/UI integration when possible.
3. Add or update targeted validation scripts.
4. Run the relevant validation command.
5. Do not move forward until the current layer passes.
6. Integrate into the UI only after the underlying behavior is stable.
7. Perform real-Collection browser validation after automated tests pass.
8. Run the production build before declaring a milestone complete.

## File-edit preference

When code needs to be changed, provide **complete file rewrites** rather than partial snippets, line-number patches, or instructions such as “replace this small section.”

Small isolated CSS additions may occasionally be appended when rewriting the entire stylesheet would introduce unnecessary risk.

## Project-context workflow

The full project ZIP or tree can be used to establish architecture and file relationships.

It should **not** be repeatedly reprocessed for every small development step.

Once the working architecture is understood:

- Request only the files needed for the current task when necessary.
- Use `PROJECT_STATUS.md` as the primary cross-chat handoff.
- Update this status file at stable milestones.
- Treat the user's current local repository as the authoritative code state.

---

# Completed milestone: 18-Type Raid Profile V1

For every attacking type, the player can see:

- A Type Team Rating from `0–100`
- A meaningful development tier
- Current absolute Raid Strength
- The theoretical best legal Level 50 team strength
- Team completeness as `X / 6`
- The six exact owned Pokémon currently forming the team
- One compact Best Next Improvement recommendation when worthwhile
- The exact owned Pokémon being recommended
- Sprite and CP for duplicate-species disambiguation
- Recommended action
- Exact resource cost
- Current Type Team Rating
- Projected Type Team Rating
- Rating gain
- New-coverage indication when applicable

The Raid Profile responsibility is:

> Show the strength of each attacking-type team and the single best available way to improve it.

---

# Type Team Rating definition

The Type Team Rating answers:

> How strong is my current team compared with the strongest legal team theoretically possible for this attacking type?

Formula:

```text
Current team raw strength
÷
Best legal theoretical team raw strength
× 100
The displayed rating is capped at 100.

Raw strength is used instead of the older normalized strengthScore because strengthScore is normalized against a Level 40 leader and capped at 100.

Missing team slots contribute zero.

Theoretical benchmark rules

Each attacking-type benchmark uses:

Level 50
15/15/15 IVs
Released and player-usable Pokémon only
Optimal legal movesets
Six team slots
Ordinary Pokémon duplicates allowed
Shadow Pokémon duplicates allowed
Maximum one temporary evolution, meaning Mega or Primal
Unreleased Pokémon excluded for V1
Missing slots worth zero

Because duplicates are legal, the benchmark compares:

6 × best standard or Shadow attacker

against:

1 × best Mega or Primal attacker
+
5 × best standard or Shadow attacker

Whichever legal team is stronger becomes the benchmark.

Raid Type Rating tiers

The player-facing scale is:

0–19.99 — Foundation
20–39.99 — Early
40–59.99 — Developing
60–74.99 — Strong
75–89.99 — Incredible
90–99.99 — Elite
100 — Perfect

Perfect is intentionally reserved for a true 100 / 100.

Tier logic:

src/utils/raidTypeRatingTier.js

Validation:

scripts/testRaidTypeRatingTier.mjs

14 / 14 tests passed

Raid Profile reference-data work
scripts/updateRaidStrengthReference.mjs

The generator preserves the existing Level 40 individual Raid Strength ceilings while generating Level 50 legal type-team benchmarks.

Generated data includes:

schemaVersion: 2
Existing Level 40 individual ceilings
Level 50 type-team benchmarks
Standard/Shadow leaders
Mega/Primal leaders
Selected legal six-member team
Benchmark raw strength
Exact benchmark slots
Fast-or-Charged move-role semantics

All 18 attacking types generate successfully.

Normal requires special handling because Normal attacks are never super-effective.

Result:

18 / 18 attacking types covered

Raid Type Team benchmark utility
src/utils/raidTypeTeamBenchmark.js

This pure utility:

Selects the best standard or Shadow attacker
Selects the best temporary-evolution attacker
Builds both legal benchmark options
Enforces the one-Mega/Primal limit
Allows ordinary and Shadow duplication
Calculates benchmark raw strength
Calculates the capped player rating
Rejects invalid inputs

Validation:

14 / 14 tests passed

Player Raid Profile builder
src/services/buildRaidTypeProfile.js

The service:

Builds the player's current best team for all 18 attacking types
Selects up to six exact owned Pokémon per type
Treats missing slots as zero
Calculates per-attacker raw role strength
Ranks team members by raw strength
Sums current team raw strength
Reads the matching Level 50 benchmark
Calculates the Type Team Rating
Exposes benchmark diagnostics
Exposes exact Pokémon identity
Exposes form and traits
Exposes CP and inferred level
Exposes current moveset
Exposes raw strength
Supports projected profiles for account-impact evaluation

Real Collection validation:

18 / 18 type teams passed

Raid Profile UI
src/pages/RaidProfile.jsx

Includes:

Four account summary cards
Strongest attacking type
Average rating across all 18 types
Complete-team count
Analyzed and skipped Pokémon counts
Two-column attacking-type layout
Type-specific colors
Rating tiers
Rating progress bars
Current strength
Best-possible strength
Expandable exact team details
Pokémon sprites
CP
Inferred level
Raw strength
Current fast move
Current charged move or moves
Shadow traits
Purified traits
Lucky traits
Shiny traits
Responsive mobile layout
Compact Best Next Improvement panel

Real Psychic example during validation:

Rating: 44.05 / 100
Tier: Developing
Current strength: 101.72
Best possible: 230.90
Completeness: 6 / 6
One-recommendation-per-type system
src/services/selectRaidTypeRecommendations.js

The selector consumes recommendations after account-impact enrichment.

It returns all 18 attacking-type keys and selects at most one recommendation for each type.

Selection rules:

Recommendation must improve that exact attacking type
Rating gain must be positive
Raw-strength impact must be positive
A clearly larger Type Team Rating gain wins
When gains are reasonably close, actionable recommendations are preferred
When gains remain close, lower resource burden is preferred
Existing Dashboard order is the final deterministic tie-breaker
Active and Paused Project Pokémon are excluded by exact collectionId
A type returns null when no worthwhile recommendation exists

Validation:

13 / 13 tests passed

Project exclusion lifecycle

Raid Profile recommendation exclusion was manually validated using an exact owned Mewtwo.

Confirmed behavior:

No Project → Pokémon eligible
Active Project → excluded from recommendation eligibility
Paused Project → remains excluded
Project removed → immediately eligible again

The Pokémon remains available as a current team member throughout.

This confirms that Project exclusion is dynamic and applies only to recommendation eligibility.

Completed milestone: Boss-Specific Raid Analysis V2

Boss Analysis V2 is now complete.

Its primary question is:

What are the best six Pokémon I currently own to use against this raid boss right now?

The feature uses the player's exact current Collection and does not assume investment actions.

Boss Analysis current-state contract

For each owned Pokémon, Boss Analysis respects:

Exact collection identity
Species
Form
Level
CP
IVs
Shadow state
Purified state
Lucky state
Shiny state
Current Fast Move
Current Charged Move
Second current Charged Move where present

A Pokémon with two usable Charged Moves may produce two legal current loadouts.

Both are evaluated.

The best current loadout is selected using Boss Analysis performance rather than arbitrarily choosing the first move.

Boss Analysis pipeline

The current V2 pipeline is:

Selected boss
+
Raid tier
+
Current Collection
        ↓
Build exact owned raid candidates
        ↓
Evaluate each current legal loadout
        ↓
Outgoing matchup damage
        ↓
Boss legal movesets
        ↓
Incoming boss pressure
        ↓
Owned HP / survivability
        ↓
Estimated TDO
        ↓
Blended Raid Score
        ↓
Best current loadout per Pokémon
        ↓
Rank exact owned Pokémon
        ↓
Best six current attackers
Boss Analysis outgoing damage

Outgoing damage uses the existing raid damage/performance engine.

Verified behavior includes:

Attacker effective Attack
Boss effective Defense
Raid boss CPM
STAB
Type effectiveness
Move power
Move duration
Fast Move energy
Charged Move energy cost
Shadow Attack modifier
Current legal movesets

This validation was important because the original Mewtwo browser result showed neutral Steel Zacian Crowned slightly ahead of super-effective Dark attackers.

Controlled diagnostics confirmed that this was not caused by missing type effectiveness.

Against Tier 5 Mewtwo:

Steel correctly received neutral effectiveness
Dark correctly received 1.6× effectiveness
STAB correctly applied
Boss Defense correctly applied

Zacian Crowned remained competitive because of its extremely high effective Attack and Behemoth Blade's move performance.

Raid boss move resolution
src/engine/Raid/bossMoves.js

Boss Analysis now resolves supported legal raid-boss movesets separately from owned-Pokémon move handling.

V1 boss move resolution currently uses the boss reference's normal move pools.

It:

Resolves Fast Moves
Resolves Charged Moves
Deduplicates move IDs
Builds legal Fast × Charged combinations
Rejects incomplete boss move data safely

Validation:

15 / 15 tests passed

Important current limitation:

Boss move resolution currently uses normal reference move pools rather than attempting to model every historical/legacy/special boss-move exception.

Boss offensive pressure
src/engine/Raid/bossPressure.js

Boss Pressure evaluates how much sustained incoming damage a raid boss can deal to one exact owned attacker.

For every supported legal boss moveset it evaluates:

Fast Move damage
Charged Move damage
Fast Move DPS
Charged Move DPS
Energy behavior
Sustained incoming Cycle DPS

It preserves boss typing and the owned defender's typing.

This means boss moveset differences can materially change attacker survivability.

Example controlled Mewtwo pressure against a Dark/Dragon defender:

Psycho Cut / Psychic
Incoming Cycle DPS: 7.5000

Psycho Cut / Focus Blast
Incoming Cycle DPS: 19.0336

Validation:

17 / 17 tests passed

Shadow defensive behavior

Shadow Pokémon receive:

Increased outgoing Attack using combatData.modifiers.shadowAttack
Reduced effective Defense using combatData.modifiers.shadowDefense

The current Shadow Defense reference modifier is approximately:

0.8333333

The damage engine now supports defender-side modifiers.

Controlled validation:

Normal effective Defense: 169.9145
Shadow effective Defense: 141.5954

Normal damage: 74
Shadow damage: 89

Defender-modifier validation:

15 / 15 tests passed

End-to-end Boss Pressure Shadow validation:

Normal Fast damage: 4
Shadow Fast damage: 5

Normal Charged damage: 111
Shadow Charged damage: 134

Normal incoming DPS: 13.6429
Shadow incoming DPS: 16.7143

Validation:

13 / 13 tests passed

Survivability engine
src/engine/Raid/survivability.js

Boss Analysis now models estimated survival rather than treating every attacker as if it can attack indefinitely.

Current calculations include:

Effective HP
floor(
  (base Stamina + Stamina IV)
  × CPM
)

with the project's minimum-HP handling.

Estimated time to faint
HP
÷
incoming Cycle DPS
Total Damage Output
outgoing Cycle DPS
×
time to faint
Raid Score

Current blended score:

(DPS³ × TDO)^(1/4)

The weighting intentionally keeps damage rate important because raid battles are timer constrained while still rewarding survivability and total contribution.

Validation:

16 / 16 tests passed

Matchup survivability
src/engine/Raid/matchupSurvivability.js

This layer combines:

Current outgoing Cycle DPS
Boss offensive-pressure scenarios
Owned Pokémon HP
Estimated survival
TDO
Raid Score

Each legal boss moveset is evaluated independently.

The system averages the resulting scenario values rather than averaging incoming DPS first.

This matters because TDO and Raid Score are nonlinear.

Validation:

20 / 20 tests passed

Controlled example against Tier 5 Mewtwo:

Owned HP: 178
Outgoing DPS: 24.8163

Psycho Cut / Psychic
Incoming DPS: 7.5000
Survival: 23.73s
TDO: 588.97
Raid Score: 54.7743

Psycho Cut / Focus Blast
Incoming DPS: 19.0336
Survival: 9.35s
TDO: 232.08
Raid Score: 43.3972
Boss Analysis service
src/services/buildRaidBossAnalysis.js

Boss Analysis V2 now coordinates the complete current-team pipeline.

For every owned Pokémon it:

Builds the current raid candidate.
Preserves every valid currently equipped loadout.
Calculates outgoing matchup performance.
Evaluates boss offensive pressure.
Calculates survivability for legal boss movesets.
Calculates TDO.
Calculates Raid Score.
Selects the Pokémon's best current loadout.
Ranks exact owned Pokémon by average Raid Score.
Selects the top six.

Primary ranking:

Average Raid Score

Tie-breakers:

Cycle DPS
CP
collectionId

The service also exposes:

Cycle DPS
Display Cycle DPS
HP
Average incoming Cycle DPS
Average time to faint
Average TDO
Average Raid Score
Minimum Raid Score
Maximum Raid Score
Safest supported boss moveset
Most dangerous supported boss moveset
Number of survivability scenarios
Full performance diagnostics

Service validation:

40 / 40 tests passed

The service validation confirms:

Invalid Collection handling
Invalid boss handling
Invalid raid profile handling
Exact boss identity
Exact raid tier
Exact Collection identity
Current Fast Move preservation
Current Charged Move preservation
Dual-Charged-Move support
Cycle DPS exposure
HP exposure
Incoming boss pressure exposure
Survival exposure
TDO exposure
Raid Score exposure
Boss moveset scenario exposure
Raid Score ordering
Six-Pokémon team cap
Full rankings preserved beyond six
Invalid Collection entries skipped safely
Controlled Boss Analysis V2 diagnostic

Tier 5 Mewtwo was evaluated against controlled Level 40 attackers.

Results:

Zacian Crowned
DPS: 26.07
Raid Score: 52.33
Average Survival: 16.47s
Average TDO: 429.53

Tyranitar
DPS: 24.65
Raid Score: 50.62
Average Survival: 18.90s
Average TDO: 465.87

Hydreigon
DPS: 24.82
Raid Score: 50.19
Average Survival: 17.62s
Average TDO: 437.38

Rayquaza
DPS: 18.46
Raid Score: 32.61
Average Survival: 10.07s
Average TDO: 185.84

This demonstrates why Boss Analysis no longer ranks purely by DPS.

Hydreigon slightly outdamages Tyranitar, but Tyranitar's additional survivability and TDO allow it to edge ahead on overall Raid Score in the controlled equal-level comparison.

Rayquaza is heavily penalized by poor survivability against some possible Mewtwo movesets, especially Ice Beam.

Real Collection Boss Analysis validation

Boss Analysis V2 was validated in the browser against the user's real Collection.

Test boss:

Mewtwo
Tier 5 / Legendary
Psychic
15,000 HP
300 second timer

Collection:

36 owned Pokémon analyzed
0 skipped
6 / 6 team slots filled

Final real-Collection team:

1. Zacian (Crowned Sword)
CP 5562
Level 49
Shiny

Metal Claw
Behemoth Blade

Raid Score: 55.38
DPS: 26.96
Average Survival: 18.1s
TDO: 487
2. Hydreigon
CP 3886
Level 47
Shiny

Bite
Brutal Swing

Raid Score: 54.80
DPS: 26.82
Average Survival: 18.4s
TDO: 492
3. Tyranitar
CP 3899
Level 44.5

Bite
Brutal Swing

Raid Score: 50.87
DPS: 24.82
Average Survival: 18.8s
TDO: 465
4. Tyranitar
CP 3803
Level 40

Bite
Stone Edge

Raid Score: 38.93
DPS: 19.00
Average Survival: 18.7s
TDO: 356
5. Reshiram
CP 4183
Level 44
Shiny

Dragon Breath
Draco Meteor

Raid Score: 34.56
DPS: 17.88
Average Survival: 14.2s
TDO: 254
6. Dragonite
CP 4117
Level 47

Dragon Tail
Outrage

Raid Score: 32.50
DPS: 17.49
Average Survival: 12.4s
TDO: 216

The result was judged internally consistent and useful.

Notably:

Zacian remains first because it combines the highest DPS with adequate survivability.
Hydreigon produces slightly more average TDO but slightly less DPS, resulting in a very close second-place Raid Score.
Brutal Swing Tyranitar combines strong Dark damage with excellent survival.
Stone Edge Tyranitar's similar survival cannot compensate for its much lower outgoing DPS.
Reshiram and Dragonite fall behind because their lower outgoing performance and poorer matchup survivability reduce total contribution.
Boss Analysis UI
src/pages/RaidBossAnalysis.jsx

Boss Analysis V2 is integrated into the main React application.

The page includes:

Pokémon/form boss picker
Raid tier selector
Boss artwork
Boss name
Boss type
Raid tier
Boss HP
Raid timer
Analyzed Collection count
Team completeness
Skipped Pokémon count
Six ranked exact owned Pokémon
Pokémon artwork
CP
Level
Traits
Current Fast Move
Current Charged Move
Raid Score
DPS
Average survival
TDO

The player-facing ranking explanation is:

Ranked by overall raid performance using current moves, damage output, survivability, and possible boss movesets.

Raid Score is presented as an absolute performance metric rather than /100.

The UI also explains:

Raid Score balances damage output with estimated total damage before fainting. Survival and TDO are averages across the boss's supported legal movesets.

The performance metrics are displayed as compact visual chips.

Final layout was browser-reviewed and accepted.

Boss Analysis V2 validation summary

Completed validation includes:

Raid candidate behavior: 8 / 8
Raid defender modifiers: 15 / 15
Raid boss move resolution: 15 / 15
Raid boss pressure: 17 / 17
Raid survivability engine: 16 / 16
Matchup survivability: 20 / 20
Shadow boss-pressure propagation: 13 / 13
Boss Analysis V2 service: 40 / 40
Real Collection browser validation: passed
Boss Analysis UI validation: passed
Production Vite build: passed
Production build

Command:

npm.cmd run build

Result:

✓ 150 modules transformed
✓ built successfully

Vite reports a bundle-size warning because the main JavaScript chunk exceeds 500 kB after minification.

This is not currently a correctness blocker.

Future code splitting may be considered as an optimization milestone.

Boss Analysis V2 modeling assumptions

The current implementation is substantially more realistic than the original DPS-only ranking, but it is not a complete event-by-event raid simulator.

Current assumptions include:

Equal legal boss moveset weighting

Every supported legal boss Fast + Charged moveset combination is currently treated as equally plausible.

Actual boss moveset probabilities are not modeled.

Continuous Cycle DPS

Outgoing and incoming performance use sustained Cycle DPS approximations.

The engine does not yet simulate every raid action on the timeline.

No damage-generated energy

The current Boss Pressure model does not include energy the boss may gain from receiving damage.

This was intentionally not added without confidence in the current Pokémon GO raid mechanic coefficient.

No dodging

All survivability assumes the attacker remains in combat and does not dodge.

No relobby modeling

Team-level relobby time and second-team behavior are not included.

No friendship / Party Power / weather

These external raid modifiers are not part of Boss Analysis V2.

No raid-timer survivability cap yet

Estimated time to faint is not currently capped by remaining raid timer.

A future refinement may use:

min(
  estimated time to faint,
  boss timer
)

where appropriate.

Boss move pool scope

Boss moves currently come from the supported normal reference move pool.

Historical, legacy, special-event, or exceptional boss move availability may require later refinement.

These limitations should be treated as future modeling improvements rather than blockers for V2.

Files added or materially involved in Boss Analysis V2

Known Boss Analysis files include:

Engine
src/engine/Raid/boss.js
src/engine/Raid/damage.js
src/engine/Raid/performance.js
src/engine/Raid/energy.js
src/engine/Raid/bossMoves.js
src/engine/Raid/bossPressure.js
src/engine/Raid/survivability.js
src/engine/Raid/matchupSurvivability.js
Utilities / services
src/utils/raidCandidate.js
src/utils/raidMatchup.js
src/services/buildRaidBossAnalysis.js
UI
src/pages/RaidBossAnalysis.jsx
src/App.jsx
src/App.css
Validation / diagnostics
scripts/testRaidCandidate.mjs
scripts/testRaidBoss.mjs
scripts/testRaidBossMoves.mjs
scripts/testRaidBossPressure.mjs
scripts/testRaidDefenderModifiers.mjs
scripts/testRaidBossShadowPressure.mjs
scripts/testMatchupSurvivability.mjs
scripts/testRaidBossAnalysis.mjs
scripts/inspectMewtwoBossMatchup.mjs

The current local repository remains authoritative if any filename differs.

Completed validation summary
Raid Profile
Type Team benchmark utility: 14 / 14
Recommendation selector: 13 / 13
Rating tier utility: 14 / 14
Real Collection type profiles: 18 / 18
Theoretical type benchmarks: 18 / 18
Project exclusion lifecycle: passed
Production build: passed
Boss Analysis
Candidate behavior: 8 / 8
Defender modifiers: 15 / 15
Boss move resolution: 15 / 15
Boss pressure: 17 / 17
Survivability: 16 / 16
Matchup survivability: 20 / 20
Shadow pressure propagation: 13 / 13
Boss Analysis service: 40 / 40
Real Collection validation: passed
UI validation: passed
Production build: passed
Broader PokeIQ roadmap

Important planned features remain preserved for later work.

Rare Candy value advisor

Evaluate whether Rare Candy should be spent now or saved.

Eventually include:

Current account benefit
Scarcity/value of the target
Alternative current uses
Future or unreleased Pokémon projections
Potential future meta importance

Example:

Save these Rare Candies for a projected top Poison attacker rather than spending them on a low-impact current upgrade.

This should remain recommendation intelligence rather than simple affordability checking.

Availability awareness

Track Pokémon or raid availability context such as:

Last known availability
How recently it was obtainable
Likely or estimated return windows
Whether waiting may be more sensible than heavy investment

This can eventually improve investment recommendations.

Boss Analysis future refinements

Boss Analysis V2 is complete, but future versions may add:

Current/historical boss availability
Boss moveset selection
Weather
Friendship
Party Power
Mega ally contribution
Dodge assumptions
Relobby modeling
Incoming damage-generated energy
More exact raid timeline simulation
Boss-specific theoretical optimum
Boss-specific team rating
Team alternatives
Investment/improvement mode
Actual boss moveset probabilities where supportable

These should be added deliberately rather than expanding V2 simply because the page has space.

Account-wide weakness prioritization

Eventually answer:

Which attacking types most urgently need development?

and:

Where does my next investment create the most account-wide value?

This should build on the existing 18-Type Raid Profile rather than duplicating it.

Product philosophy

PokeIQ should increasingly act as an account intelligence system, not merely a Pokémon database.

Its strongest workflows combine:

Exact owned Pokémon
Current combat state
Reference data
Raid strength
Resources
Projects
Account-wide team structure
Boss-specific matchups
Opportunity cost
Player-facing explanations

New features should be evaluated based on whether they create a genuinely new decision-support capability.

Avoid expanding existing pages simply because space is available.

Current handoff
Stable
Collection system
Core raid combat/reference pipeline
Raid investment recommendation infrastructure
Projects
Resource actionability
18-Type Raid Profile V1
One-recommendation-per-type system
Project recommendation exclusion lifecycle
Boss-Specific Raid Analysis V2
Boss Analysis status

Complete for V2.

Latest major validation:

Boss Analysis service
40 / 40 tests passed

Real Collection validation:

Passed

UI validation:

Passed

Production build:

Passed

Resume here

Do not rebuild Raid Profile or Boss Analysis from scratch.

Both are now stable player-facing features.

When development resumes:

Treat the current local repository as authoritative.
Use this file as the architectural handoff.
Select the next contained PokeIQ capability or a deliberate refinement of an existing system.
Build pure/testable logic first.
Validate each layer before UI integration.
Perform real-Collection validation.
Run the production build before marking the next milestone complete.

The immediate next task is to choose the next PokeIQ development milestone.



That gives us a much cleaner handoff: **Raid Profile V1 and Boss Analysis V2 are both stable**, rather than leaving the next chat thinking Boss Analysis is halfway through development.