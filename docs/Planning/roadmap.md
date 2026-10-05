# PokeIQ Roadmap

## Purpose

This document translates the long-term PokeIQ vision into development horizons.

It is not intended to be a rigid release schedule.

PokeIQ is still evolving, and priorities will change as:

- Existing systems are validated
- New ideas emerge
- Player needs become clearer
- External data sources become available
- Technical limitations are discovered
- Opportunities for integrations appear

The roadmap should answer:

> Where is PokeIQ going from here?

For the exact current development state and next coding task, use `PROJECT_STATUS.md`.

For the long-term product philosophy, use `VISION.md`.

---

# Roadmap Philosophy

PokeIQ should grow outward from a strong intelligence foundation.

New features should generally follow this progression:

1. Understand the player's account.
2. Understand what is valuable to that account.
3. Understand what the player is trying to accomplish.
4. Understand what is happening in the game.
5. Connect those pieces together.
6. Proactively identify useful opportunities.
7. Make those capabilities accessible through a simple interface and AI assistant.

The roadmap should prioritize capabilities that unlock other capabilities.

For example:

A reliable Collection enables Raid Profile.

Raid Profile enables account weakness analysis.

Account weakness analysis combined with live spawn data enables personalized map recommendations.

Upcoming-event intelligence combined with resource intelligence enables smarter save-versus-spend recommendations.

The objective is not simply to build a large number of features.

The objective is to build increasingly connected intelligence.

---

# Current Foundation

PokeIQ already has a substantial working foundation.

## Collection

The application can maintain the player's owned Pokémon and important information about them.

Existing or established work includes:

- Pokémon Collection
- Exact owned Pokémon identity
- Forms
- CP
- IVs
- Traits
- Current moves
- Multiple Charged Moves
- Search
- Sorting
- Filtering
- Manual entry
- Import infrastructure

Collection data is becoming the foundation used by the rest of PokeIQ.

---

## Reference Data

PokeIQ maintains Pokémon GO reference information required by its intelligence systems.

This includes areas such as:

- Pokémon
- Forms
- Types
- Moves
- Combat data
- Candy families
- Evolutions
- Form changes
- Move reassignment information

Reference-data updates should remain maintainable as Pokémon GO changes.

---

## Raid Combat Intelligence

A substantial raid calculation foundation now exists.

This includes:

- Damage
- Move timing
- Energy
- Raid candidates
- Matchup calculations
- Raid Strength
- Boss offensive pressure
- Survivability
- TDO
- Raid Score
- Boss moveset scenarios

This foundation should be reused rather than replaced as raid features expand.

---

## 18-Type Raid Profile

Raid Profile V1 establishes account-wide raid team intelligence.

PokeIQ can evaluate:

- All 18 attacking types
- Exact current teams
- Team completeness
- Current team strength
- Theoretical benchmark strength
- Type Team Rating
- Best available improvement per type

This is an important foundation for future account-wide recommendation systems.

---

## Boss Analysis

Boss Analysis V2 establishes boss-specific raid intelligence.

PokeIQ can currently determine:

> What are the best six Pokémon I currently own against this specific raid boss?

The system considers:

- Current Pokémon
- Current moves
- Damage output
- Boss offensive pressure
- Survivability
- TDO
- Raid Score
- Possible boss movesets

Boss Analysis should evolve rather than be rebuilt.

---

## Projects

Projects allow the player to commit to developing exact owned Pokémon.

Projects provide a foundation for longer-term goal tracking.

The current concept may eventually evolve into a broader player-facing Goals system.

---

## Resource Intelligence

PokeIQ has begun connecting recommendations with actual player resources.

This foundation should eventually become a much deeper resource-advisory system.

---

# Horizon 1 — Strengthen the Core PokeIQ Experience

## Goal

Turn the existing collection of powerful systems into a cohesive player-facing application.

The immediate priority is not adding every future idea.

It is making the current intelligence foundation increasingly complete, connected, understandable, and useful.

---

## Raid Strength and Recommendation Refinement

Continue refining the existing raid intelligence where meaningful improvements are identified.

Potential work includes:

- Raid Strength accuracy improvements
- Theoretical reference refinements
- Recommendation quality improvements
- Better handling of edge cases
- More realistic assumptions where reliable mechanics are available
- Improved explanations of why recommendations were made

These should be deliberate refinements rather than endless simulation work.

---

## Account-Wide Weakness Prioritization

Build on the 18-Type Raid Profile to answer:

> Which parts of my raid account need the most help?

Potential outputs:

- Weakest attacking types
- Most valuable team to improve
- Largest achievable rating gains
- Missing team slots
- Best cross-team investments
- Account-wide improvement opportunities

This creates a bridge between Raid Profile and the broader PokeIQ recommendation engine.

---

## Recommendation Intelligence

Continue moving recommendations away from isolated Pokémon evaluations and toward account-impact evaluations.

PokeIQ should increasingly understand:

- How much an investment improves a team
- How many teams benefit
- Whether the player already has alternatives
- Resource cost
- Opportunity cost
- Whether another investment would create more value

---

## Resource Intelligence Expansion

Develop deeper understanding of:

- Stardust
- Species Candy
- Candy XL
- Rare Candy
- Rare Candy XL
- TMs
- Elite TMs
- Evolution resources

The eventual objective is not merely:

> Can you afford this?

It is:

> Is this a good use of these resources?

---

## Projects Refinement

Continue developing Projects as the current commitment-tracking system.

Potential improvements include:

- Better progress tracking
- Clearer remaining costs
- Completion state
- Project priorities
- Better resource interaction
- Better recommendation exclusion behavior
- Project history

Projects should eventually inform broader account planning.

---

## Import Experience

Continue improving the practical process of getting a player's Pokémon into PokeIQ.

Current and potential methods include:

- Manual entry
- Screenshots
- Screen recordings
- CSV
- Other structured imports where useful

CSV should be evaluated based on whether players can realistically obtain useful CSV data.

It should not be preserved simply because the feature already exists.

Screenshot and screen-recording imports should continue improving while official account synchronization remains unavailable.

---

# Horizon 2 — Reorganize PokeIQ Around Player Tasks

## Goal

Move away from a development-era "one feature = one tab" interface.

PokeIQ currently exposes several top-level areas, including:

- Dashboard
- Raid Profile
- Boss Analysis
- Projects
- Developer
- Collection
- Resources
- Imports

This is manageable during development but will become increasingly crowded as PokeIQ grows.

Future navigation should organize features around what the player is trying to accomplish.

---

## Home

The Dashboard should eventually evolve toward a personalized Home experience.

Home should answer:

> What matters to me right now?

Potential content:

- Highest-value recommendation
- Current Projects/Goals
- Account weaknesses
- Important upcoming events
- Resource warnings
- Relevant raids
- Collection opportunities
- Research opportunities
- Recent account changes

The player should not need to inspect every section manually to discover something important.

---

## Raid Hub

Raid Profile and Boss Analysis should eventually become parts of a unified Raid experience.

Potential Raid Hub sections:

### Current Raids

Show bosses currently available.

### Coming Soon

Show confirmed upcoming bosses.

### My Teams

Expose the 18-Type Raid Profile.

### Boss Analysis

Analyze the player's exact team against a boss.

### Raid Opportunities

Highlight bosses particularly valuable to the player's account.

### Advanced Analysis

Allow arbitrary Pokémon/tier combinations for testing, historical analysis, and hypothetical scenarios.

The player-facing default should focus on actual raid rotations rather than requiring manual boss and tier configuration.

---

## Collection Hub

Collection should eventually absorb collection-management workflows that do not deserve permanent top-level navigation.

Potential areas:

- Pokémon
- Imports
- Smart Collections
- Custom Collections
- Storage intelligence
- Collection goals
- Import history

Imports should likely become part of Collection rather than remaining a permanent primary navigation tab.

---

## Goals

Projects may eventually evolve into a broader Goals experience.

Goals could include both individual Pokémon development and account-wide objectives.

Examples:

- Power up this Mewtwo.
- Build a complete Ground team.
- Reach 75+ Raid Rating for every type.
- Complete a Living Dex.
- Prepare for an upcoming raid rotation.
- Save resources for a future target.

---

## Developer Tools

Development and diagnostic functionality should eventually be removed from normal player navigation.

Developer tools should remain accessible during development without occupying permanent player-facing navigation.

---

# Horizon 3 — Game-State and Event Intelligence

## Goal

Teach PokeIQ what is happening in Pokémon GO outside the player's account.

This is a major prerequisite for proactive recommendations.

---

## Current Raid Rotation

PokeIQ should know:

- Which raid bosses are currently available
- Their raid tiers
- Their availability window
- Relevant forms
- Mega/Primal status
- Special raid categories

Boss Analysis should use this information automatically.

The player should not normally need to tell PokeIQ that a boss is Tier 5.

---

## Full Raid Tier Support

Future Boss Analysis should support all relevant categories, including where applicable:

- 1-Star
- 2-Star
- 3-Star
- 5-Star
- Mega
- higher/special Mega raid categories
- Other special raid formats

Raid categories should come from game/event intelligence rather than manual selection whenever possible.

---

## Upcoming Raid Intelligence

Track confirmed upcoming raid rotations.

This enables PokeIQ to answer questions such as:

> Should I spend resources now or wait for something coming next week?

Upcoming bosses should connect directly to:

- Raid Profile
- Resources
- Projects/Goals
- Recommendations
- Notifications

---

## Event Calendar

Create structured awareness of Pokémon GO events.

Potential event types include:

- Community Days
- Spotlight Hours
- Raid Days
- Research Days
- Seasons
- Special events
- Limited-time bonuses
- Max Battle rotations
- Announced releases

The calendar itself is not the final value.

PokeIQ should determine what each event means for the player.

---

## Confirmed vs Predicted Information

Future intelligence should clearly distinguish:

### Confirmed

Officially announced information.

### Expected

Information with strong support but not necessarily formally confirmed.

### Predicted

PokeIQ analysis based on historical patterns or other signals.

Predictions should never be presented as confirmed facts.

---

## Availability Awareness

Track useful availability context.

Potential information:

- Last known availability
- Current availability
- Upcoming confirmed availability
- Historical frequency
- Estimated likelihood of return

This can influence investment decisions.

For example:

> This Pokémon is currently unavailable and historically returns infrequently.

or:

> Waiting may make sense because this Pokémon returns next week.

---

# Horizon 4 — Research, Collections, and Goal Intelligence

## Goal

Understand what the player is personally trying to accomplish beyond raw raid strength.

---

## Research Tracking

Allow players to track active Pokémon GO research.

PokeIQ should understand the requirements of each task.

Examples:

- Catch Pokémon from a particular generation
- Catch specific types
- Complete raids
- Make throws
- Evolve Pokémon
- Walk
- Earn Candy

Research should eventually connect to live-world opportunities.

---

## Smart Collections

PokeIQ should suggest useful Collections based on the player's account.

Potential examples:

- Near-perfect Pokémon
- Valuable Shadows
- Strong raid attackers
- Pokémon with investment potential
- Incomplete evolution families
- Pokémon worth preserving
- Possible future Projects

Suggestions should remain optional.

---

## Custom Collections

Players should be able to define their own Collections.

Examples:

- Living Dex
- Shiny Living Dex
- Favorite Pokémon
- Hundos
- Personal challenges
- Pokémon for trades
- Pokémon being prepared for future events

---

## Shareable Collections

Potential future functionality:

- Share Collection templates
- Follow community-created Collections
- Automatically measure personal progress

Example:

> Top 100 Raid Attackers — 63/100 owned

---

## Broader Goals

Allow goals that span multiple systems.

PokeIQ should eventually connect:

Collection + Resources + Events + Live World + Recommendations

to determine the best path toward a player's goal.

---

# Horizon 5 — Live World Intelligence

## Goal

Connect the player's account with real-world Pokémon GO opportunities.

This is one of PokeIQ's largest potential differentiators.

It is also dependent on access to reliable and legally/technically usable live data.

---

## Live Map

Explore integration with a reliable Pokémon GO map/scanner data source.

Potential map information:

- Pokémon spawns
- Despawn times
- Raids
- Raid timers
- Max Battles
- Nests
- Research-related opportunities
- Other relevant live-world information

Existing services such as iPlateau demonstrate that scanner-driven Pokémon GO maps are possible.

The exact technical and data-access path requires future investigation.

---

## Personalized Map Intelligence

PokeIQ should not merely display map markers.

Each opportunity should be evaluated against the player's account.

Examples:

> Mamoswine nearby  
> Potential Ground Team improvement: +5%

> Missing Living Dex entry nearby

> Pokémon required by active research

> Pokémon belonging to an active Collection

> Species required by a current Goal

The same map should produce different priorities for different players.

---

## Opportunity Ranking

PokeIQ should rank nearby opportunities.

Potential priority factors:

- Raid-team improvement
- Research progress
- Collection progress
- Goal relevance
- Rarity
- Distance
- Remaining availability
- Player preferences

---

## Smart Notifications

Allow players to receive alerts when something genuinely useful appears.

Potential rules:

- Notify me about any raid-team improvement.
- Only notify me about improvements greater than 3%.
- Notify me about active research targets.
- Notify me about missing Living Dex Pokémon.
- Notify me about selected species.
- Notify me about selected Collections.
- Only notify me within a chosen distance.

Notification quality should be prioritized over notification quantity.

---

## Route Planning

If live-world data becomes sufficiently reliable, PokeIQ could eventually identify efficient play routes.

Example:

> This 45-minute route contains:
> - 8 Pokémon relevant to your research
> - 2 missing Living Dex entries
> - 1 high-value raid
> - several useful Ground-type catches

This is a long-term intelligence feature rather than an immediate mapping requirement.

---

# Horizon 6 — The PokeIQ Assistant

## Goal

Make the entire application accessible through natural language.

As PokeIQ becomes more powerful, AI should prevent it from becoming harder to use.

---

## Ask PokeIQ

Create a universal natural-language interface.

Examples:

> What's the best thing I can do today?

> What should I use against the current legendary raid?

> Should I power up this Pokémon?

> Which Pokémon should I transfer?

> What is my weakest team?

> What nearby Pokémon can help my research?

> Should I save my Rare Candy?

The assistant should call into existing PokeIQ intelligence rather than inventing answers independently.

---

## Natural-Language Settings

Allow players to modify application behavior without searching through settings menus.

Examples:

> Stop notifying me about 1-Star raids.

> Only notify me about Pokémon that improve my teams.

> I'm getting too many notifications.

> Don't send notifications while I'm working.

> Alert me whenever a Pokémon missing from my Living Dex appears nearby.

PokeIQ should translate these requests into actual application settings.

---

## Context-Aware Conversations

The assistant should understand PokeIQ context.

A player should be able to ask:

> Is this worth catching?

without manually explaining:

- Their Collection
- Their teams
- Their resources
- Their research
- Their goals
- The current event

PokeIQ should already have the relevant context.

---

## Account Review

Potential AI-driven account review:

> Analyze my account.

PokeIQ could summarize:

- Strongest areas
- Weakest areas
- Highest-value opportunities
- Resource concerns
- Projects worth completing
- Upcoming events that matter
- Suggested next goals

---

# Horizon 7 — Advanced Planning and Optimization

## Goal

Allow PokeIQ to reason about future decisions rather than only current state.

---

## Rare Candy Advisor

Build the previously envisioned Rare Candy intelligence system.

It should consider:

- Immediate account improvement
- Alternative uses
- Resource scarcity
- Current availability
- Upcoming availability
- Future targets
- Projected meta value

Potential recommendation:

> Save.

with an explanation of why saving creates more expected value than spending now.

---

## What-If Simulator

Allow players to preview account changes.

Examples:

> What if I power this Pokémon to Level 50?

> What if I evolve this?

> What if I Elite TM this move?

> What if I catch this raid boss?

> What if I build six of these?

Projected changes could include:

- Raid Type Rating
- Boss performance
- Team membership
- Account-wide value
- Resource cost

---

## Resource Forecasting

Potential future forecasting:

- Expected Stardust accumulation
- Candy accumulation
- Rare Candy availability
- Time required for Projects
- Resource needs for upcoming events

Example:

> At your current pace, you should have enough Stardust to complete this Project before the raid rotation begins.

This requires sufficient player-history data and should not be fabricated from insufficient information.

---

## Storage Intelligence

Build intelligent transfer assistance.

PokeIQ should evaluate whether an owned Pokémon matters to:

- Raid teams
- Future investments
- Projects
- Collections
- Goals
- Research
- Evolution families
- Trading
- Other supported systems

The system should explain why something appears safe or unsafe to transfer.

---

## Trade Matching

Potential future system for comparing two players' Collections.

PokeIQ could identify:

- Pokémon Player A needs
- Pokémon Player B needs
- Duplicate opportunities
- Collection completion opportunities
- Potentially mutually useful trades

Any recommendations should respect the mechanics and limitations of Pokémon GO trading.

---

## Personal Analytics

Potential account-history features:

- Account growth over time
- Raid team improvement
- Resource spending
- Project completion
- Collection progress
- Catching trends
- Personal milestones

Possible annual experience:

> Your Year in Pokémon

---

# Horizon 8 — Production Platform

## Goal

Move PokeIQ from a local development application into an always-available product.

This transition should happen deliberately rather than through a complete unnecessary rewrite.

---

## Persistent Backend

Introduce backend infrastructure as required for:

- Player accounts
- Cloud data
- Synchronization
- Notifications
- Event intelligence
- Live map data
- AI
- Shared Collections
- Multi-device access

---

## Player Accounts

Players should eventually be able to securely maintain their PokeIQ data across devices.

---

## Web Application

Maintain an always-available web version where useful.

The current React application provides a foundation for this transition.

---

## Mobile Application

Mobile should become a major PokeIQ platform.

Mobile is especially important for:

- Pokémon GO usage
- Live map functionality
- Location-aware features
- Push notifications
- Quick recommendations
- Research tracking
- Assistant interactions

---

## Always-On Services

PokeIQ should eventually operate independently of:

- VS Code
- A developer terminal
- A local Vite server
- The developer's personal computer being turned on

The production product should be continuously available to players.

---

# Horizon 9 — Official Pokémon GO Integration

## Goal

Be prepared if an opportunity for official account integration becomes possible.

PokeIQ should not depend on this happening.

---

## Build Value First

Before pursuing official integration, PokeIQ should demonstrate:

- A functioning product
- Useful account intelligence
- Real player adoption
- Clear player value
- Responsible data handling
- A compelling reason for integration

The goal is eventually to be able to approach the company responsible for Pokémon GO and say:

> We built this. Players are using it. Official account access would remove significant friction and make the experience substantially better.

---

## Data-Source Independence

PokeIQ's intelligence systems should not be permanently coupled to screenshots or screen recordings.

The Collection should remain conceptually separate from the mechanism used to populate it.

Today:

Screen recording → Collection

Future possibility:

Official account connection → Collection

The intelligence above Collection should continue working either way.

---

## Ideal Integration

If official player-data integration ever becomes available, potential benefits include:

- Automatic Collection synchronization
- Current Pokémon state
- Moves
- CP
- IVs
- Resources
- Potential game-state information where permitted

Manual and visual import methods could remain available as fallbacks.

---

# Horizon 10 — PokeIQ Beyond Pokémon GO

## Goal

Explore whether PokeIQ should become an intelligence platform for the wider Pokémon franchise.

Pokémon GO should remain the primary focus while the core platform is established.

---

## Game Modules

Future Pokémon games could potentially exist as separate PokeIQ modules.

The first obvious candidate is the main-series Pokémon experience.

---

## Scarlet / Violet Module

Potential capabilities include:

### Living Dex

Track species owned and missing.

### Shiny Living Dex

Track shiny collection progress.

### Shiny Hunt Tracking

Track:

- Encounters
- Eggs
- Resets
- Hunt duration
- Successful shiny

### Egg Hunt Statistics

Example:

> Shiny Sprigatito obtained after 437 eggs.

### Species Hunting Assistance

Answer:

> Where should I hunt this Pokémon?

Potential considerations:

- Location
- Encounter rate
- Time of day
- Weather or environmental requirements where relevant
- Version exclusivity
- Special encounter requirements
- Sandwich strategies
- Outbreaks
- Evolution requirements

---

## Future Pokémon Games

New game modules should be considered when they fit the PokeIQ philosophy.

The objective is not to create another Pokédex.

The objective remains:

> Understand the player's goal and help them accomplish it.

---

# Horizon 11 — Sustainable Monetization

## Goal

Allow PokeIQ to support its own continued development without making the core experience hostile or inaccessible.

---

## Free Core Experience

The free version should remain genuinely useful.

Core functionality should not be intentionally crippled to force payment.

Players should be able to understand and improve their Pokémon account without paying simply to make the app usable.

---

## Optional Premium Capabilities

Advanced or peripheral functionality may be appropriate for a paid unlock.

Potential examples:

- Advanced live-map functionality
- Additional game modules
- Specialized integrations
- Advanced automation
- Other high-cost features

Where sustainable, a small one-time purchase is preferred.

---

## Recurring-Cost Exception

Some future capabilities may create meaningful ongoing costs.

Examples:

- AI inference
- Cloud hosting
- Large-scale live data
- Third-party APIs
- Notification infrastructure

PokeIQ should not promise that every possible future service can always be supported through a one-time payment.

If recurring pricing ever becomes necessary, it should be:

- Limited to capabilities that justify it
- Affordable
- Clearly explained
- Optional where practical
- Separate from a genuinely useful free core

Monetization should support PokeIQ.

PokeIQ should not exist primarily to support monetization.

---

# Ongoing — Competitive Learning

PokeIQ should continue studying existing Pokémon applications and services.

Examples may include:

- Poke Genie
- Live-map/scanner services
- Event-information services
- Discord notification communities
- Collection tools
- Raid coordination tools
- Pokémon databases

For each service, ask:

1. What problem does this solve?
2. Why do players use it?
3. What does it do exceptionally well?
4. Where is there friction?
5. What do players wish were different?
6. Can personalization improve it?
7. Can connecting it with other PokeIQ systems make it substantially more useful?

Ideas discovered through this process should go into `BRAINSTORM.md` or `COMPETITIVE_ANALYSIS.md` before automatically becoming roadmap commitments.

---

# Roadmap Dependencies

Many long-term features depend on earlier foundations.

A simplified dependency chain is:

Collection
    ↓
Account Intelligence
    ↓
Goals + Resources + Research
    ↓
Game/Event Intelligence
    ↓
Live World Intelligence
    ↓
Proactive Recommendations
    ↓
AI Assistant / Automation

Meanwhile:

Local Application
    ↓
Persistent Backend
    ↓
Player Accounts
    ↓
Always-Available Web/Mobile
    ↓
Notifications + Synchronization
    ↓
Large-Scale Live Intelligence

And potentially:

Proven Product
    ↓
Player Adoption
    ↓
Demonstrated Integration Value
    ↓
Official Partnership / Data Integration Opportunity

Not every branch needs to be completed sequentially.

These relationships simply help identify which systems unlock others.

---

# What Is Not Yet a Commitment

Ideas appearing in this roadmap are directions, not promises.

In particular, the following depend heavily on future feasibility:

- Live scanner/map integration
- Official Pokémon GO integration
- Worldwide raid matchmaking
- AI operating costs
- Automatic game-data synchronization
- Cross-player trading systems
- Additional Pokémon game integrations

These ideas should remain visible without forcing PokeIQ to depend on them.

---

# Near-Term Development Rule

When choosing the next milestone, ask:

### 1. Does it create meaningful new player value?

### 2. Does it strengthen a foundation required by future features?

### 3. Can it be built and validated as a contained milestone?

### 4. Does it connect existing PokeIQ systems rather than unnecessarily duplicating them?

### 5. Is it the right thing to build now?

The roadmap should guide development.

It should not prevent PokeIQ from changing direction when a better opportunity appears.

---

# Long-Term Destination

PokeIQ begins with:

> Here are the Pokémon you own.

It grows into:

> Here is how strong your account is.

Then:

> Here is how you can improve it.

Then:

> Here is what is happening in the game that matters to you.

And eventually:

> Here is the best thing you can do right now, based on your account, your goals, your resources, your surroundings, and what is coming next.

That progression is the PokeIQ roadmap.