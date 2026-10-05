# PokeIQ Brainstorm

## Purpose

This document is the idea bank for PokeIQ.

Nothing in this document is automatically:

- Planned
- Approved
- Technically feasible
- Legally feasible
- Prioritized
- Scheduled
- Guaranteed to be built

Ideas belong here because they may be worth exploring.

Some may eventually move into `ROADMAP.md`.

Some may evolve into completely different ideas.

Some may never be built.

That is fine.

The purpose of this document is to make sure good ideas are not forgotten simply because PokeIQ is not ready for them yet.

---

# Brainstorming Philosophy

When adding ideas to this document, do not worry too much about:

- How difficult they would be to build
- Whether PokeIQ currently has the necessary data
- Whether external integrations currently exist
- Whether the architecture currently supports them
- Whether they belong in the next release
- Whether they sound overly ambitious

Those questions matter when an idea becomes a development candidate.

They do not need to kill an idea during brainstorming.

A useful question is:

> If PokeIQ could know anything and do anything reasonably useful with that information, what would we want it to do for the player?

---

# Core Intelligence Ideas

## "What Should I Do Next?"

Potential centerpiece of PokeIQ.

Instead of requiring the player to manually inspect every system, PokeIQ evaluates the entire account and identifies the highest-value current opportunities.

Potential inputs:

- Collection
- Raid teams
- Resources
- Projects
- Goals
- Research
- Current raids
- Upcoming events
- Nearby Pokémon
- Collections
- Player preferences
- Available play time

Example:

> You have about an hour. The best use of your time would be the nearby Mamoswine spawns because your Ground team is currently one of your weakest teams.

---

## "If I Were You"

A more opinionated recommendation mode.

The player asks:

> What would you do?

PokeIQ gives one clear recommendation instead of presenting several equivalent possibilities.

The explanation could still show alternatives.

---

## Account Review

One-button or AI-requested account analysis.

Potential output:

- Strongest teams
- Weakest teams
- Biggest Collection gaps
- Most valuable investments
- Resource concerns
- Projects worth completing
- Pokémon worth revisiting
- Upcoming opportunities
- Suggested goals

Could potentially support:

> Give me my weekly account review.

---

## Account Power / Progression Score

Explore whether PokeIQ could measure overall account development.

Possible components:

- Raid team strength
- Team completeness
- Collection depth
- Resource readiness
- Coverage
- Number of high-level attackers

Important concern:

A single account score could become misleading.

May be better represented as several dimensions rather than one number.

---

# AI Assistant Ideas

## Universal PokeIQ Assistant

Allow the player to ask questions naturally instead of navigating manually.

Examples:

> What's my best Dragon team?

> Should I power this up?

> What should I raid this week?

> What am I currently working on?

> Which of my Pokémon needs an Elite TM the most?

> What can I safely transfer?

> How close am I to finishing my Ground team?

The AI should use actual PokeIQ systems and player data rather than hallucinating account information.

---

## Natural-Language Settings

Allow players to modify settings conversationally.

Examples:

> I'm getting too many notifications.

> Stop notifying me about 1-Star raids.

> Only tell me about nearby Pokémon if they're actually useful to me.

> Notify me about anything I'm missing from my Shiny Living Dex.

> Don't send me notifications while I'm at work.

PokeIQ translates the request into actual settings.

---

## Natural-Language Navigation

Potentially allow:

> Show me my Ground team.

> Open my Mewtwo Project.

> Show me Pokémon I caught recently.

> Take me to current raids.

The assistant could navigate directly to the appropriate screen.

---

## Contextual Follow-Up Questions

Because PokeIQ knows the current context:

Player:

> Should I power this up?

PokeIQ:

> Yes. At Level 50 it would replace two members of your Ground team and increase its rating from 68 to 74.

Player:

> What if I only take it to 40?

PokeIQ should understand that "it" refers to the same Pokémon.

---

## AI Explanations

Allow the player to ask:

> Why?

after any recommendation.

PokeIQ could translate technical calculations into understandable explanations.

Potential modes:

- Simple
- Normal
- Advanced

---

## Learn Pokémon GO Mode

Teach game mechanics using the player's actual Pokémon.

Instead of generic examples:

> STAB gives a damage bonus.

PokeIQ could say:

> Your Hydreigon gets STAB when using Bite and Brutal Swing because Hydreigon is Dark-type and both attacks are Dark-type.

---

# Live Map Ideas

## Pokémon Spawn Scanner

Potential integration with a reliable live Pokémon GO scanner/map data source.

Existing scanner services demonstrate that this type of information can exist.

Future investigation required to determine:

- Data source
- API availability
- Partnership possibilities
- Technical feasibility
- Geographic coverage
- Terms and restrictions
- Cost

---

## Personalized Spawn Value

Do not treat every spawn equally.

Example:

> Mamoswine  
> 8 minutes remaining  
> 1.2 km away  
> HIGH VALUE  
> Could improve your Ground team by approximately 5%.

Another player with six stronger Ground attackers might see:

> LOW ACCOUNT VALUE

for the same spawn.

---

## Research Spawn Highlighting

If the player has:

> Catch 30 Pokémon originally discovered in Sinnoh.

PokeIQ highlights nearby qualifying Pokémon.

Potential message:

> 7 nearby Pokémon can progress your active research.

---

## Spawn Clusters

Identify areas containing several useful Pokémon.

Example:

> HIGH-VALUE AREA

> 9 Sinnoh Pokémon are currently available within this area, making it a strong location for your active research.

---

## Collection Map Filters

Potential filters:

- Missing Living Dex
- Missing Shiny Living Dex
- Selected Collection
- Hundos if data makes this possible
- Specific species
- Raid improvements
- Research targets
- Goal targets
- Evolution-family targets

---

## Smart Map Priorities

Instead of making the player choose dozens of filters:

> Show me anything worth going after.

PokeIQ decides what is relevant.

---

## Opportunity Score

Potentially calculate a personalized opportunity score based on:

- Account improvement
- Collection relevance
- Research relevance
- Rarity
- Distance
- Time remaining
- Goal relevance
- Current availability

---

## Route Builder

Player specifies:

> I have 45 minutes.

PokeIQ creates a route prioritizing useful opportunities.

Potential route goals:

- Research completion
- Raid improvement
- Living Dex
- Shiny hunting
- Resource collection
- Mixed optimization

---

## Driving vs Walking Awareness

Potential route preferences:

- Walking
- Cycling
- Driving/passenger
- Transit

Must avoid encouraging unsafe interaction while driving.

---

# Notification Ideas

## High-Value Spawn Alert

> Mamoswine nearby — could improve your Ground team by 5%.

---

## Research Alert

> Several Pokémon needed for your active research have appeared nearby.

---

## Collection Alert

> A Pokémon missing from your Living Dex is nearby.

---

## Raid Alert

> A raid boss valuable to your account has appeared nearby.

---

## Upcoming Event Alert

> Community Day begins tomorrow. Three bonuses are relevant to your current Projects.

---

## Resource Warning

Before an event:

> Consider saving your Stardust today. An upcoming event contains a higher-priority investment target.

---

## Notification Thresholds

Examples:

> Only notify me if the improvement is at least 3%.

> Only notify me within 5 km.

> Only send high-priority alerts.

---

## Intelligent Notification Reduction

Player:

> You're notifying me too much.

Instead of requiring them to configure ten switches, PokeIQ could recommend:

> I can restrict alerts to high-value account improvements and active goals.

---

## Temporary Notification Modes

Examples:

> I'm shiny hunting today.

> I'm working on research for the next two hours.

> I'm not raiding this week.

PokeIQ temporarily changes priorities.

---

# Event Intelligence Ideas

## Unified Pokémon GO Calendar

Track:

- Current events
- Upcoming events
- Raid rotations
- Community Days
- Spotlight Hours
- Raid Days
- Research Days
- Max Battles
- Seasons
- Special bonuses
- New releases

---

## Discord Information Integration

Investigate whether information currently received through Pokémon GO Discord communities can be ingested or replaced by structured data.

Possibilities:

- Discord bot/integration
- Public event feeds
- Community-maintained sources
- Official announcements
- Other APIs

The ideal result is that PokeIQ itself understands upcoming events.

---

## "What Matters to Me?"

Instead of showing the entire event announcement:

> This event has 14 bonuses.

PokeIQ could say:

> Three parts of this event are particularly relevant to your account.

---

## Event Preparation

Example:

> Raid Day is Saturday.

PokeIQ could prepare:

- Best teams
- Resource recommendations
- Catch priorities
- Storage preparation
- Relevant Projects
- Suggested Mega
- Potential account improvements

---

## Event Debrief

After an event:

> Here's how your account changed during Community Day.

Potential metrics:

- Pokémon caught
- New Collection entries
- Raid-team improvements
- Shinies
- Resources gained/spent

Requires sufficient data integration.

---

# Raid Ideas

## Live Raid Rotation

Replace the default arbitrary boss selector with current bosses.

Each boss already knows:

- Tier
- Typing
- Availability
- Raid parameters

Player simply taps the boss.

---

## Coming Soon Raids

Display confirmed future bosses.

Potentially show:

> Arrives in 4 days.

---

## Personalized Raid Priority

Rank current bosses based on player value.

Example:

### HIGH PRIORITY

Boss would substantially improve your account.

### MEDIUM

Useful but not urgent.

### LOW

Your account already has better options.

### COLLECTION ONLY

Little combat value, but relevant to a Collection.

---

## "Should I Raid This?"

Single-answer analysis combining:

- Current team
- Potential catch value
- Resources
- Existing copies
- Raid team weaknesses
- Future availability
- Collection relevance

---

## Automatic Raid Tier

If the boss is currently active, PokeIQ should already know its raid tier.

Manual tier selection becomes an Advanced Analysis feature.

---

## Expanded Raid Types

Explore support for:

- 1-Star
- 2-Star
- 3-Star
- 5-Star
- Mega
- special/higher Mega categories
- Shadow raids
- Elite Raids if relevant
- Other future raid formats

---

## Boss-Specific Team Rating

Potential:

> Your Mewtwo team: 74/100

compared with the theoretical strongest legal team against that exact boss.

---

## Raid Difficulty Estimate

Potentially estimate:

> Comfortable with 4 trainers like you.

or:

> Duo unlikely with your current teams.

Would require substantially more simulation and assumptions.

---

## Raid Lobby Hosting

Explore worldwide raid coordination.

Potential inspiration from Poke Genie while addressing areas of friction.

---

## Larger Remote Groups

Investigate coordination that better utilizes Pokémon GO's actual invitation limits rather than unnecessarily limiting every remote lobby to six participants.

Exact behavior must respect current Pokémon GO mechanics.

---

## Raid Readiness

Before joining:

> Your recommended team is ready.

or:

> You currently only have four strong counters. Consider healing these two Pokémon first.

---

## Raid Group Intelligence

Potentially combine multiple PokeIQ players' teams to estimate group strength.

---

# Resource Ideas

## Rare Candy Advisor

One of the major long-term PokeIQ intelligence features.

Questions:

> Should I spend my Rare Candy?

> Who should get it?

> Should I save it?

Consider:

- Immediate improvement
- Alternative investments
- Scarcity
- Upcoming bosses
- Future releases
- Existing Candy
- Project importance

---

## Rare Candy XL Advisor

Separate weighting due to much greater scarcity.

---

## Elite TM Advisor

Potential:

> Best use of my Elite Charged TM.

Evaluate actual account improvement rather than generic meta rankings.

---

## Stardust Advisor

Potential:

> I have 500,000 Stardust. What should I do with it?

PokeIQ proposes an investment plan.

---

## Resource Reserve

Player could specify:

> Never recommend spending below 250,000 Stardust.

or:

> Keep at least 100 Rare Candy available.

---

## Resource Forecast

Estimate future resource availability using player history where sufficient data exists.

---

## Event Resource Planning

Example:

> You will need approximately 420,000 Stardust to complete the three Projects you're targeting before the upcoming raid rotation.

---

# What-If Ideas

## Power-Up Preview

Before spending:

> Level 40 → Ground rating +2.4

> Level 50 → Ground rating +4.9

---

## Evolution Preview

Show account impact before evolving.

---

## TM Preview

Show how changing moves affects:

- Raid teams
- Boss Analysis
- Ratings

---

## Catch Preview

From the live map or raid rotation:

> If you caught a strong Mamoswine today, what could it do for your account?

Could use assumed IV/level ranges until the exact Pokémon is owned.

---

## Future Pokémon Preview

Potentially evaluate announced or datamined/unreleased Pokémon separately from current recommendations.

Must clearly identify speculative data.

Example:

> Projected potential: #1 Poison attacker.

---

## Investment Comparison

Player:

> Mewtwo or Rayquaza?

PokeIQ compares their actual value to the player's account.

---

# Collection Ideas

## Custom Collections

Allow arbitrary player-created Collections.

Potential examples:

- Living Dex
- Shiny Living Dex
- Hundos
- Favorites
- Gym defenders
- Raid Pokémon
- Pokémon from trips
- Funny names
- Personal challenges

PokeIQ should not dictate what players are allowed to care about.

---

## Suggested Collections

PokeIQ notices potential Collections.

Examples:

> You own 12/15 members of this group. Want to track the rest?

---

## Smart Collections

Automatically updating rule-based Collections.

Examples:

> All 96%+ IV Pokémon

> All useful Shadows

> All Pokémon currently used by raid teams

---

## Community Collections

Players publish Collection templates.

Examples:

- Top 100 Raid Attackers
- Complete Eeveelution Collection
- Regional Living Dex
- Legendary Shiny Collection

---

## Collection Progress

Example:

> Sinnoh Living Dex  
> 93 / 107

---

## Collection Opportunity Alerts

Connect Collections to the live world.

> One of your missing Collection Pokémon is nearby.

---

# Goal Ideas

## Player-Defined Goals

Examples:

> Finish my Ground team.

> Get every raid team above 70.

> Finish the Sinnoh Dex.

> Save 1,000 Rare Candy.

> Build this Mewtwo.

---

## Suggested Goals

PokeIQ could suggest:

> Your Rock team is significantly weaker than your other teams. Would you like to make improving it a Goal?

---

## Goal Progress

Show measurable progress.

---

## Goal Plan

Instead of only tracking:

> Build Ground Team

PokeIQ generates steps.

---

## Goal Priority

Players could specify:

- High
- Normal
- Low

PokeIQ uses these priorities when making recommendations.

---

## Goal Conflicts

Potentially detect:

> These two Projects compete for the same Rare Candy.

---

# Research Ideas

## Active Research Tracking

Track:

- Special Research
- Timed Research
- Masterwork Research
- Other relevant research

---

## Task Interpretation

PokeIQ understands:

> Catch 30 Sinnoh Pokémon

rather than storing it as plain text.

---

## Qualifying Pokémon

Player could tap a task and see every Pokémon that qualifies.

---

## Live Research Opportunities

Connect active research to nearby spawns.

---

## Research Planning

Example:

> The upcoming event will make this research substantially easier. Waiting until Saturday may save time.

---

## Multi-Task Optimization

A spawn might contribute to multiple objectives.

Example:

> HIGH VALUE

> This Pokémon progresses:
> - Sinnoh research
> - Ground-type research
> - Living Dex
> - Ground raid team

This could make opportunity ranking particularly powerful.

---

# Storage Management Ideas

## Safe-to-Transfer Analysis

Evaluate Pokémon against all PokeIQ systems before recommending transfer.

---

## Duplicate Intelligence

Instead of:

> You have seven Tyranitar.

Determine whether multiple copies actually have value.

---

## Better-Copy Detection

Example:

> This Tyranitar is completely outclassed by three copies you already own and is not part of any Project or Collection.

---

## Evolution Consideration

Do not recommend transferring something that becomes useful after evolution.

---

## Future Value Warning

Potential:

> Currently weak, but this species has a known future evolution.

---

## Transfer Review Queue

PokeIQ creates a list.

Player still makes the final transfer decision in Pokémon GO.

---

# Import Ideas

## Screen Recording Import

Continue improving as the likely practical import method without official integration.

---

## Screenshot Import

Useful for individual or small numbers of Pokémon.

---

## CSV Import Evaluation

Investigate:

- Which tools can export Pokémon GO collections to CSV?
- How difficult is that for normal players?
- Does CSV contain information PokeIQ needs?
- Is CSV actually easier than screen recording?

If not, consider de-emphasizing or removing it.

---

## Import Confidence

Show confidence for parsed information.

Example:

> Species: 99%
> CP: 100%
> IVs: 82%

---

## Intelligent Correction

If OCR produces something impossible, use game knowledge to suggest the likely intended value.

---

## Import History

Allow players to inspect:

- Recent imports
- Corrections
- Duplicates
- Updates

---

## Official Account Sync

Ultimate import dream.

Player authorizes PokeIQ.

Collection updates automatically.

Requires official support/partnership.

---

# Official Integration Ideas

## Future Partnership Pitch

Do not approach with:

> We have an idea.

Eventually approach with:

> We built PokeIQ.
> Players use it.
> Here is the friction official integration would solve.

---

## Integration-Ready Architecture

Avoid permanently coupling intelligence to OCR.

Conceptually:

Data Source
    ↓
Normalized PokeIQ Collection
    ↓
All Intelligence Systems

Possible data sources:

- Manual
- Screenshot
- Video
- CSV
- Official API

---

## Read-Only Integration First

If official access ever became possible, read-only account synchronization would already eliminate enormous import friction.

---

# Navigation Ideas

## Reduce Top-Level Tabs

Current development navigation is becoming crowded.

Existing areas include:

- Dashboard
- Raid Profile
- Boss Analysis
- Projects
- Developer
- Collection
- Resources
- Imports

Potential future organization:

- Home
- World
- Raids
- Collection
- Goals
- Assistant

---

## Home

Personalized current priorities.

---

## World

Potential home for:

- Live map
- Nearby opportunities
- Events
- Research opportunities

---

## Raids

Potentially combine:

- Raid Profile
- Current raids
- Upcoming raids
- Boss Analysis
- Raid planning

---

## Collection

Potentially combine:

- Pokémon
- Imports
- Custom Collections
- Smart Collections
- Storage management

---

## Goals

Potential evolution of Projects.

---

## Assistant

Universal natural-language access.

---

## Contextual Navigation

Some functionality may not need tabs at all.

Example:

Import could simply be an action inside Collection.

Resources could appear wherever relevant rather than requiring an entire primary page.

---

## Mobile Bottom Navigation

Potentially use a small number of primary destinations on mobile with secondary capabilities inside each hub.

---

# Home Screen Ideas

## "Today in PokeIQ"

Potential personalized briefing:

- Current best opportunity
- Upcoming important event
- Goal progress
- Resource warning
- Nearby opportunity
- Current raid recommendation

---

## Quick Actions

Examples:

- Ask PokeIQ
- Analyze Pokémon
- Current Raids
- Nearby
- Add Pokémon

---

## Daily Recommendation

One intentionally prominent suggestion.

> If you only do one thing today...

---

# Availability Ideas

## Last Available

Show when a Pokémon was last obtainable.

---

## Current Availability

Explain how it can currently be obtained.

---

## Upcoming Availability

Show confirmed future opportunities.

---

## Return Estimate

Potentially estimate likely return windows using historical patterns.

Must clearly identify estimates.

---

## Availability-Aware Investment

Example:

> A stronger option exists, but it has not been available for 18 months and has no announced return.

That could change the recommendation.

---

# Raid Matchmaking Ideas

## PokeIQ Raid Lobbies

Potential long-term remote raid coordination.

---

## Account-Aware Lobby Selection

If multiple raids are available:

> This raid is much more useful for your account.

---

## Host Tools

Potential:

- Player queue
- Friend-code handling
- Ready checks
- Invitation groups
- Lobby instructions

---

## Reliability Reputation

Potential host/guest reliability system.

Requires careful design to avoid punishing players unfairly for connection/game failures.

---

## Team Preparation Before Lobby

Before remote invite:

> Heal Hydreigon and Tyranitar.

> Recommended Mega: Mega Tyranitar.

---

# Friends and Trading Ideas

## Compare Collections

Two consenting players connect their PokeIQ Collections.

---

## Mutual Trade Finder

Example:

> You have three Pokémon they need.
> They have five Pokémon you need.

---

## Living Dex Trades

Prioritize mutual Collection completion.

---

## Lucky Trade Planning

Track intended Lucky Trades.

---

## Trade Wishlist

Player maintains species they are looking for.

---

## Nearby/Friend Alerts

Potential:

> A friend has something on your wishlist available for trade.

Would require appropriate privacy and opt-in controls.

---

# Personal Analytics Ideas

## Account History

Track changes over time.

---

## Team Growth

Example:

> Your Ground team increased from 42 → 76 this year.

---

## Investment History

Track where Stardust and Candy were committed through PokeIQ Projects.

---

## Catch Milestones

Where data exists.

---

## Your Year in Pokémon

Annual summary.

Potential categories:

- Biggest team improvement
- Most developed Pokémon
- Projects completed
- Collection progress
- Favorite types
- Biggest investment
- Rare catches
- Shiny hunts
- Raid activity

---

# Pokémon Scarlet / Violet Ideas

## Game Module

Potential optional PokeIQ expansion separate from the core Pokémon GO experience.

---

## Living Dex

Track all species required for a complete Living Dex.

Potential options:

- Base-game Dex
- Kitakami Dex
- Blueberry Dex
- Combined collection
- HOME-compatible broader goals

---

## Shiny Living Dex

Separate shiny ownership tracking.

---

## Shiny Hunt

Create a hunt:

> Sprigatito — Masuda Method

Track:

- Eggs collected
- Eggs hatched
- Shinies obtained
- Time spent
- Hunt attempts

---

## Egg Counter

Simple manual counter:

> +5 hatched

Could potentially support batch updates.

---

## Shiny Hunt Statistics

Example:

> Shiny obtained after 683 eggs.

Potential comparisons against method odds.

---

## Multiple Shiny Targets

Useful for Living Dex hunts requiring several copies of an evolutionary family.

Example:

> Sprigatito family
> 1 / 3 shinies obtained

---

## Species Location Assistant

Player:

> Where should I hunt Eevee?

PokeIQ provides:

- Best locations
- Encounter requirements
- Time requirements
- Version restrictions
- Relevant outbreaks
- Useful sandwich information

---

## Evolution Assistant

Explain special evolution requirements.

---

## Sandwich Assistant

Potentially help choose recipes for:

- Encounter Power
- Sparkling Power
- Egg Power
- Type-specific hunts

---

## Outbreak Tracking

Potential manual or external-data integration if feasible.

---

# Other Pokémon Game Ideas

Potential future modules could support games where PokeIQ can provide meaningful intelligence.

Possible concepts:

- Living Dex
- Shiny tracking
- Team planning
- Collection tracking
- Hunt assistance
- Completion goals

Do not add a game simply to say PokeIQ supports it.

There should be a meaningful problem to solve.

---

# Cross-Game Ideas

## Unified Pokémon Collection Goals

Potentially track:

> I want one of every Pokémon in Pokémon HOME.

PokeIQ could understand which games can supply missing species.

Very long-term concept.

---

## "Where Can I Get This Pokémon?"

Across supported games:

> You are missing Chikorita.

PokeIQ could identify which games the player owns that can obtain it.

---

## Cross-Game Shiny Collection

Potential broader shiny tracking.

---

# Monetization Ideas

## PokeIQ Pro

Potential small one-time unlock.

The exact name is undecided.

---

## Possible Premium Features

Ideas that may make sense outside the core free experience:

- Advanced live map
- Additional Pokémon game modules
- Advanced integrations
- Certain automation capabilities
- Premium customization

Nothing here is currently committed.

---

## Avoid Paywalling Core Intelligence

Potential principle:

A player should not need to pay simply to discover:

> What should I use against this raid boss?

or:

> How strong is my account?

---

## One-Time Payment Preference

Where economically sustainable, prefer:

> Buy PokeIQ Pro once.

rather than:

> Pay every month forever.

---

## Supporter Option

Potential optional way for users who really like PokeIQ to support continued development without locking features behind unnecessary subscriptions.

---

## Cosmetic Support

Possible future optional purchases:

- Themes
- Profile customization
- App icons

Only if they make sense.

---

## Recurring Service Tier

Only consider if specific features have unavoidable recurring costs.

Potential examples:

- Heavy AI usage
- Live-data infrastructure
- Cloud-heavy features

Could potentially separate:

PokeIQ Pro — one-time ownership

from:

Optional online service capabilities — recurring only if economically necessary

This is only a concept.

---

# Platform Ideas

## Always-Available Web App

Move beyond localhost development.

---

## Mobile App

Potential primary platform long-term.

---

## Desktop Experience

Could remain web-based unless there is a meaningful reason for a dedicated desktop application.

---

## Cloud Synchronization

Same account on:

- Phone
- PC
- Tablet

---

## Push Notifications

Required for many live-intelligence concepts.

---

## Offline Support

Potentially keep Collection and some calculations available when connectivity is poor.

---

## Background Intelligence

Cloud services could continue checking:

- Events
- Live opportunities
- Notifications

without requiring the app to remain open.

---

# Community Ideas

## Share Collections

Players share Collection templates.

---

## Share Teams

Potentially share raid teams.

---

## Share Goals

Community challenges.

---

## Community Recommendations

Potential curated content.

Careful not to undermine personalized PokeIQ recommendations.

---

## Community Event Guides

Potential community-created event plans layered with personal account intelligence.

---

# Competitive Learning Ideas

## Poke Genie

Areas worth studying:

- Raid hosting
- Raid queues
- Boss information
- Damage verification
- Battle simulation
- Remote raid coordination
- Lobby size/friction
- Player workflow

Questions:

> What does Poke Genie do extremely well?

> Where do users experience unnecessary friction?

> What becomes possible if raid matchmaking understands the player's PokeIQ account?

---

## iPlateau

Worth investigating:

- Scanner coverage
- Live map
- Spawn information
- Raid information
- Nest information
- Data sourcing
- Potential API/integration opportunities

Important question:

> Could PokeIQ consume scanner information rather than attempting to recreate the entire scanner infrastructure?

---

## Discord Communities

Worth studying:

- Event notifications
- Raid announcements
- Infographics
- Upcoming schedules
- Local community organization

Question:

> Which information currently requires Discord because Pokémon GO itself does not communicate it effectively?

---

## Other Pokémon Apps

Whenever another app is useful or frustrating, record:

- App/service
- Feature
- What works
- What does not
- What PokeIQ could learn
- Whether personalization creates a new opportunity

Potentially move detailed observations into `COMPETITIVE_ANALYSIS.md`.

---

# Crazy / Long-Term Ideas

These ideas are intentionally allowed to be ambitious.

---

## PokeIQ Knows Your Play Session

Player says:

> I'm going out for an hour.

PokeIQ builds a personalized session plan from:

- Location
- Nearby spawns
- Raids
- Research
- Goals
- Events

---

## Dynamic Replanning

During the session:

> A high-value spawn just appeared nearby. Your route has been adjusted.

---

## "Is It Worth Leaving the House?"

Player:

> Anything worth going out for?

PokeIQ evaluates the live world.

Potential answer:

> Probably not right now.

or:

> Yes. There are two high-value opportunities within 15 minutes.

---

## Vacation Mode

Player travels somewhere.

PokeIQ automatically recognizes opportunities relevant to:

- Regionals
- New Pokédex entries
- Local events
- Collections

---

## Event Game Plan

Player:

> What should I do during Community Day?

PokeIQ creates a personalized plan.

---

## PokeIQ Morning Brief

Potential notification:

> Here's what matters in Pokémon GO today.

Personalized rather than generic news.

---

## PokeIQ Weekly Plan

Potential:

> This week, prioritize Tuesday's Spotlight Hour and Saturday's Raid Day. Skip the current 3-Star rotation unless you need Collection entries.

---

## Automatic Goal Discovery

PokeIQ notices behavior:

> You've been keeping every shiny Eeveelution. Would you like me to track a complete Shiny Eeveelution Collection?

---

## Opportunity Stacking

One of the potentially strongest PokeIQ concepts.

Prioritize actions that accomplish several goals simultaneously.

Example:

> Catch this Pokémon.

Why?

- Active research progress
- Missing Collection entry
- Useful evolution
- Potential raid-team improvement
- Event bonus currently active

One action creates value across four systems.

---

## Scarcity Intelligence

PokeIQ understands not only strength but how difficult something is to obtain.

A slightly weaker Pokémon available today may be a better recommendation than an ideal Pokémon that may not return for a year.

---

## Personalized Meta

Instead of:

> The best Ground attackers are...

PokeIQ effectively creates:

> Your Ground meta.

The ranking reflects what the player actually owns and can realistically build.

---

## Player Time as a Resource

Eventually treat time similarly to Stardust and Candy.

Player:

> I only have 30 minutes.

PokeIQ changes recommendations accordingly.

---

## Player Effort Preferences

Potentially learn that a player:

- Likes raiding
- Dislikes PvP
- Enjoys collecting
- Does not want long drives
- Likes shiny hunting

Recommendations could respect these preferences instead of assuming maximum optimization is always the goal.

---

# Ideas Requiring Investigation

These concepts should not move into implementation without dedicated research.

## Live Scanner Data

Need to determine:

- How existing scanners work
- Whether usable APIs exist
- Geographic limitations
- Legal/terms implications
- Infrastructure requirements
- Partnership opportunities

---

## Official Pokémon GO Integration

Need to determine:

- Whether any appropriate official player API exists
- Partnership requirements
- Authentication requirements
- Data access restrictions
- Developer policies

---

## Discord Integration

Need to determine:

- Whether information should come directly from Discord
- Whether better original sources exist
- Bot/API possibilities
- Permission requirements

---

## AI Integration

Need to determine:

- Model architecture
- Cost
- Privacy
- Tool/function calling
- Account-data access
- Safety around automatic changes
- Local vs cloud inference possibilities

---

## Mobile Technology

Need to determine eventually:

- Native
- React Native
- Progressive Web App
- Other cross-platform approaches

Do not decide simply because the current app uses React.

---

## Cloud Architecture

Need to determine:

- Authentication
- Database
- Hosting
- Background jobs
- Notification infrastructure
- Scaling
- Cost

This should happen when product requirements justify it.

---

# Ideas That May Be Removed

Brainstorm ideas are allowed to die.

An idea should be abandoned or substantially changed if:

- It does not solve a meaningful player problem
- Reliable data cannot be obtained
- It introduces unacceptable risk
- It violates platform rules
- The operating cost is unreasonable
- Players do not actually want it
- Another feature solves the problem better
- It makes PokeIQ substantially more complicated without sufficient value

Removing an idea is not a failure.

The purpose of brainstorming is to explore possibilities.

---

# Adding New Ideas

When a new idea comes up, it can be recorded using:

## Idea Name

### Problem

What player problem might this solve?

### Concept

What could PokeIQ do?

### PokeIQ Connection

How could personalization or existing PokeIQ intelligence make this better than a standalone tool?

### Dependencies

What might be required?

### Questions

What do we still need to figure out?

### Status

Brainstorm / Investigating / Roadmap Candidate / Rejected / Moved to Roadmap

Not every idea needs this much detail.

A sentence is enough when an idea is still very early.

The important thing is preserving it.

---

# Current Brainstorm Themes

The ideas currently emerging around PokeIQ broadly fall into:

1. Account Intelligence
2. AI Assistant
3. Live World
4. Events
5. Raids
6. Resources
7. Research
8. Collections
9. Goals
10. Storage
11. Imports
12. Official Integration
13. Raid Coordination
14. Friends and Trading
15. Personal Analytics
16. Other Pokémon Games
17. Monetization
18. Platform Expansion
19. Community
20. Competitive Learning

These categories are not permanent.

They exist simply to make the idea bank easier to navigate.

---

# The Rule for This File

If an idea makes us say:

> That would be really cool.

put it here.

We can figure out whether we should actually build it later.