# PokeIQ — Product Vision & Roadmap

**Last updated:** September 19, 2026  
**Status:** Planning document

## 1. Product Direction

PokeIQ is intended to be more than a Pokémon GO database or collection tracker.

The core product idea is:

> **PokeIQ knows your account and turns Pokémon GO information into what actually matters to you.**

The app should use a player's real collection, goals, strengths, weaknesses, and preferences to make Pokémon GO information personal and actionable.

Rather than only answering generic questions such as "What are the best Ice attackers?", PokeIQ should be able to answer questions such as:

- Which Pokémon should **I** invest in?
- How much would that investment improve **my** team?
- What are **my** best six Pokémon against this raid boss?
- Which current or upcoming raid bosses matter to **my** account?
- Which nearby Pokémon are worth going after **for me**?
- What am I missing from the Dexes and collections **I** care about?
- What should I work on next?

The long-term goal is for PokeIQ to filter the enormous amount of Pokémon GO information down to the opportunities that matter to each individual player.

---

## 2. Current State

### Collection Import

PokeIQ currently supports:

- Manual Pokémon entry
- Screenshot import
- Screen-recording import

The screen-recording import engine is nearing completion and is the primary active development task.

The eventual goal is for imports to become unnecessary through an official Pokémon GO/Scopely account integration. Until that is possible, manual, screenshot, and recording imports provide independent ways to reconstruct a player's collection.

### Collection Tracking

The collection system currently tracks imported Pokémon properly.

A remaining improvement is **collection-level duplicate protection**. PokeIQ should recognize when an imported Pokémon is probably the same individual Pokémon already stored in the collection, while still allowing players to legitimately own multiple Pokémon with identical or near-identical attributes.

### Investment Recommendations

PokeIQ can already:

- Recommend which Pokémon should be invested in
- Calculate how much an investment improves individual type teams
- Calculate how much an investment improves overall account strength

This recommendation system is one of PokeIQ's core features and should be thoroughly validated before public release.

### Raid Teams

Users can select a raid boss and PokeIQ can determine the best six Pokémon from their collection to use against that boss.

Some adjustments and polish are still planned.

Eventually, raid-team functionality should be connected to live/current raid rotations so users do not need to manually know which bosses are active.

---

## 3. Immediate Development Roadmap

The current priority is to finish and polish the existing core before expanding into major new feature areas.

### Phase 1 — Finish the Import Engine

Goals:

- Finish screen-recording import
- Reach an acceptable accuracy and reliability standard
- Resolve remaining alignment/tracking/deduplication problems
- Add protection against re-importing Pokémon already in the collection
- Ensure manual, screenshot, and recording imports all feed the same normalized collection system
- Polish the import/review experience

Once this is reliable, collection acquisition should be considered a largely solved problem unless actual bugs appear.

### Phase 2 — Validate Recommendations

The existing recommendation engine should be tested against known collections and expected outcomes.

Validation should include:

- Investment ranking
- Type-team improvement calculations
- Overall account-strength calculations
- Pokémon forms
- Shadow Pokémon
- Movesets
- Relevant level assumptions
- Edge cases
- Resource/investment scenarios

The objective is not to rebuild the recommendation engine, but to make sure it meets the standard required for users to trust its advice.

### Phase 3 — Turn PokeIQ Into a Real App

PokeIQ currently exists primarily as a React/Vite application run through a development environment.

The goal is to turn it into an installable application that feels like a finished product.

A likely path is:

**React + Vite → mobile-friendly production app → Capacitor → iOS/Android**

A PWA may also be useful for early testing or distribution.

Important work during this phase may include:

- Mobile-first UI polish
- App icon
- Splash/loading experience
- Proper navigation
- Error handling
- Persistent local data
- Backup/recovery
- Migration away from relying permanently on browser `localStorage`
- A proper data/storage abstraction
- Eventual account/cloud synchronization
- iOS testing
- Android testing
- TestFlight/public beta preparation
- App Store / Google Play preparation

The intelligence systems should not care whether Pokémon data originates from local storage, a database, OCR, cloud synchronization, or a future official Pokémon GO connection.

### Phase 4 — Raid Team Polish

Before major feature expansion:

- Finish planned raid-team adjustments
- Make boss selection and team generation release-quality
- Ensure raid recommendations integrate naturally with investment recommendations
- Improve explanation of why Pokémon were selected where useful

### Phase 5 — Explore Official Scopely / Pokémon GO Integration

Once PokeIQ Core is polished and demonstrable, investigate official access seriously.

Research should include:

- Official Scopely/Pokémon GO APIs
- Developer programs
- Partnership opportunities
- Account authorization options
- Available player/collection data
- Privacy requirements
- Security requirements
- Commercial-use restrictions
- Rate limits
- App-review requirements

The objective is an authorized account connection that could eventually keep a player's PokeIQ collection synchronized automatically.

If no public API exists, investigate legitimate partnership/developer routes rather than relying on unofficial/private APIs.

A public beta and evidence of actual PokeIQ usage may strengthen any future partnership request.

---

## 4. PokeIQ Core Milestone

Before major expansion, PokeIQ should reach a milestone that can roughly be described as:

> **Reliable collection acquisition + trustworthy personalized recommendations + polished raid teams + an installable standalone application.**

After reaching PokeIQ Core, the result of the official-integration investigation can help determine the next major development phase.

---

## 5. Official Pokémon GO Integration — Long-Term Goal

The ideal future experience is for a player to connect their Pokémon GO account to PokeIQ through an official, authorized integration.

If this becomes possible, PokeIQ could potentially keep track of changes such as:

- Newly caught Pokémon
- Transfers
- Evolutions
- Power-ups
- Collection changes
- Dex progress
- Other account information made available by the official integration

This would eliminate most import friction.

The existing import systems would still remain valuable as:

- Fallback methods
- Offline/manual alternatives
- Compatibility options
- Ways to use PokeIQ without linking an account

The internal PokeIQ data model should therefore remain independent of its data source.

---

## 6. Future Feature Vision

Major feature expansion should generally happen after PokeIQ Core is complete and official integration possibilities have been explored.

### Live Raids

Show:

- Currently active raid bosses
- Upcoming raid bosses
- Raid rotations
- Relevant dates/times
- Personalized best-six teams
- How valuable each boss is to the user's account

Eventually PokeIQ could tell a player not only that a boss is available, but whether obtaining and investing in it would materially improve their account.

### Events

Track:

- Community Days
- Raid Days
- Major events
- New Pokémon releases
- New shiny releases
- Relevant event bonuses
- Increased shiny odds
- Other meaningful opportunities

Event information should be personalized wherever possible.

Example:

> A Community Day Pokémon could improve your Grass team, is missing from your Shiny Dex, and can complete part of your Living Dex.

### Live Map

Long-term concept: a live map showing nearby Pokémon.

Potential information:

- Species
- Location
- IVs
- XXL/XXS status
- Other useful encounter information where available

The important PokeIQ differentiator would be personalized prioritization.

The map should eventually answer:

> **What's nearby that I care about?**

Examples of reasons to highlight a spawn:

- Improves a raid team
- Strong PvP candidate
- Missing Dex entry
- Missing shiny
- Missing XXL/XXS entry
- Needed for a custom Dex
- Strong showcase candidate
- Part of a user-defined goal

### PvP Integration

Future PvP functionality could include:

- Great League
- Ultra League
- Master League
- Limited cups/tournaments
- Best PvP Pokémon in the user's collection
- Best teams the user can currently build
- Missing pieces for strong teams
- Investment recommendations
- PvP-relevant nearby catches
- Advanced PvP analysis for Pro users

The goal should be personalized PvP advice rather than simply reproducing generic rankings.

### Raid Lobby System

A future Poké Genie-style system could allow users to:

- Host raids
- Join raid queues
- Create raid lobbies
- Coordinate remote participants
- Share friend codes
- Manage lobby flow

Possible future additions:

- Reputation
- No-show handling
- Friend-request flow
- Integration with personalized raid teams

This feature may become more useful once PokeIQ has a sufficiently large user base.

### Friend Code Sharing

Potential profile/social functionality:

- Trainer name
- Friend code
- QR code
- Team
- Level
- Raid availability/interests
- Gift interests
- Other optional profile information

Friend-code sharing could integrate directly with raid lobbies.

### Showcases

Potential showcase features:

- Active showcases
- Showcase species/rules
- Current score to beat where available
- Best eligible Pokémon in the user's collection
- Estimated score
- Whether the user can currently beat a known leader
- Identification of nearby Pokémon that may be strong showcase candidates

This could integrate closely with XXL/XXS tracking and the live map.

---

## 7. Dex & Collection Goal Tracking

PokeIQ should eventually support automatic tracking of multiple collection goals.

Potential built-in Dexes:

- Standard Dex
- Shiny Dex
- Living Dex
- Costume Dex
- XXL Dex
- XXS Dex
- Potentially Shadow Dex
- Potentially Purified Dex
- Potentially Lucky Dex

### Custom Dexes

Users should also be able to create their own collection goals.

Examples:

- Shiny Living Kanto Dex
- Level 1 collection
- Hundo collection
- Favorite species collection
- Costume collection
- User-defined themed collections

Custom Dexes should integrate with:

- Events
- Live maps
- Notifications
- Collection imports
- Goals
- Recommendations

A Pokémon can be unimportant for battle but extremely important to a player's personal collection goals. PokeIQ should understand both forms of value.

---

## 8. Additional Future Intelligence Features

### Goals / Wishlist

Allow players to define goals such as:

- Obtain a shiny Rayquaza
- Build a stronger Ice team
- Complete a regional shiny Dex
- Build a Great League Pokémon
- Obtain an XXL specimen

PokeIQ could then identify opportunities relevant to those goals.

### Resource & Investment Planning

Potential tools:

- Stardust budgeting
- Candy requirements
- XL Candy requirements
- Level 40 vs Level 50 comparisons
- Multi-Pokémon investment plans
- "Best way to spend X Stardust"
- Resource-efficiency analysis

### Transfer / Cleanup Assistant

Help answer:

> **What can I safely transfer?**

The system should protect potentially valuable Pokémon such as:

- Strong PvE Pokémon
- Strong PvP Pokémon
- Shinies
- Costumes
- XXL/XXS Pokémon
- Dex requirements
- Living Dex entries
- Favorites
- Custom Dex entries
- Other user-defined protected categories

PokeIQ should recommend transfers, not automatically perform destructive actions.

### Trade Intelligence

Potential functionality:

- Wishlist
- Available-for-trade list
- Compare two PokeIQ users' collections
- Identify mutually useful trades
- Lucky Friend planning
- Dex completion opportunities

### Evolution Intelligence

Help determine:

- Whether a Pokémon should be evolved
- Which branch evolution to choose
- Whether evolution completes a Dex
- Whether the player should wait for an event-exclusive move
- How the evolution changes team strength

### Elite TM / Special Move Advisor

Personalized Elite TM recommendations could show:

- Improvement to relevant teams
- Overall account impact
- Alternative investments
- Whether using the Elite TM is worthwhile

### Mega Planning

Potential features:

- Mega Level tracking
- Mega Energy tracking
- Event-specific Mega recommendations
- Candy/XL Candy optimization
- Raid-damage considerations
- Collection-goal considerations

### Research Intelligence

Track current research and highlight rewards relevant to:

- Dex goals
- Raid teams
- PvP
- Shinies
- Collection goals
- Investment opportunities

### Pokémon Comparison

Allow users to compare multiple copies based on:

- PvE value
- PvP value
- IVs
- Investment cost
- Rarity
- Size
- Dex relevance
- Moves
- Other collection considerations

The goal is to answer:

> **Which one should I keep/invest in?**

---

## 9. Account History & Progression

Account history is a strong candidate for a PokeIQ Pro feature.

Potential history:

- Overall account strength over time
- Individual type-team strength over time
- Investments made
- Largest account improvements
- Dex completion progress
- Shiny collection growth
- Hundo growth
- Raid-team progression
- Monthly recaps
- Annual recaps

Example:

> Your account is 14% stronger than it was three months ago.

---

## 10. Personalized Notifications

Basic notifications could remain free.

Examples:

- Community Day tomorrow
- New raid rotation
- Event starting
- Important general Pokémon GO reminders

PokeIQ Pro could provide advanced/custom notification rules.

Examples:

- Notify me when a Pokémon missing from my Shiny Dex becomes available
- Notify me when an upcoming raid boss would improve one of my teams by more than 5%
- Notify me when a wishlist Pokémon becomes available
- Notify me when a relevant XXL Pokémon is nearby
- Notify me when an event helps one of my custom Dexes
- Notify me when a nearby Pokémon would meaningfully improve my account

Notifications should be useful rather than noisy.

---

## 11. Future "Today" Experience

A long-term home-screen concept is a personalized **PokeIQ Today** experience.

Rather than making the player search through every feature, PokeIQ could summarize the most important opportunities.

Example:

> **Your PokeIQ Today**
>
> **Highest priority:** Current raid boss would significantly improve your Rock team  
> **Shiny opportunity:** Featured Pokémon has boosted shiny odds today  
> **Collection:** Missing event costume from your Costume Dex  
> **Showcase:** Your best eligible Pokémon can beat the current known score  
> **Investment:** One Pokémon currently offers your largest account improvement  
> **Nearby:** High-IV spawn that would improve one of your teams

This could eventually become the primary PokeIQ home screen.

---

## 12. Monetization Philosophy

PokeIQ should remain genuinely useful without payment.

The core philosophy is:

> **Free users get a complete useful product. Pro users pay for deeper intelligence, advanced tools, automation, history, and customization.**

PokeIQ should not intentionally make the free experience frustrating in order to force upgrades.

### PokeIQ Free

Current plan is for the following to remain free:

- Collection management
- Manual import
- Screenshot import
- Screen-recording import
- Core investment recommendations
- Team improvement calculations
- Overall account-strength calculations
- Raid-team recommendations
- Standard Dex tracking
- Shiny Dex tracking
- Costume Dex tracking
- XXL/XXS Dex tracking
- Living Dex tracking
- Custom Dexes
- Basic current/upcoming raid information
- Basic event information
- Shiny-odds information where available
- Basic notifications
- Other core functionality

### PokeIQ Pro

Potential Pro functionality:

- Deeper recommendation analysis
- More detailed explanations
- Advanced account analytics
- Advanced investment planning
- Resource optimization
- Stardust/Candy/XL planning
- Advanced Pokémon comparisons
- Advanced PvP analysis
- Long-term planning tools
- Account history
- Progression graphs
- Monthly/annual recaps
- Customizable notification rules
- Advanced automation
- Advanced event/account insights
- Other power-user tools
- No advertisements

A useful distinction:

> **Free tells the player what matters. Pro goes deeper into why, when, and what to do next.**

Free recommendations should still provide enough information to be genuinely useful. Pro should add analysis rather than hide the explanation required to understand a recommendation.

---

## 13. Advertising

The current concept allows advertising in the Free version while keeping it restrained.

### Banner Ads

Possible approach:

- One small, unobtrusive banner
- Typically positioned at the bottom of the screen
- No interference with navigation
- No layout jumping
- No covering important information
- Avoid ads during workflows where the banner materially harms usability
- Removed entirely for Pro users

Banner revenue should be considered supplemental income rather than assumed to be a major revenue source at small scale.

### Rewarded Ads

Free users may optionally watch a rewarded advertisement to temporarily access selected Pro tools.

Example:

> Watch an ad → unlock an advanced Pro tool for 30–60 minutes.

The unlock should generally be time-based rather than requiring another advertisement for every calculation.

Good candidates:

- Advanced investment optimizer
- Resource planner
- Advanced Pokémon comparison
- Advanced PvP analysis
- Advanced raid planning
- Other interactive advanced tools

Poor candidates:

- Account history
- Persistent notification rules
- Features whose value requires continuous background operation

### Advertising Rules

PokeIQ should not use:

- Forced full-screen ads
- Interstitial ads between normal pages
- Artificial energy systems
- Daily limits on core functionality designed to generate ad views
- Forced ads to continue imports
- Forced rewarded ads for features defined as Free
- Repeated interruptions during normal usage

Core principle:

> **No forced full-screen ads.**

A user should be able to use the normal Free PokeIQ experience without their workflow being interrupted by advertisements.

Rewarded ads are always initiated voluntarily by the user.

---

## 14. Optional Support

PokeIQ should include a **Support PokeIQ** option for users who voluntarily want to help fund the project.

This should be available regardless of whether someone uses Free or Pro.

Potential messaging:

> PokeIQ is independently developed. If you enjoy the app and want to help cover development and operating costs, you can optionally support the project.

Support should:

- Be completely optional
- Avoid guilt-based messaging
- Not affect core functionality
- Help cover development and operating costs
- Potentially offer purely cosmetic recognition

Possible cosmetic thank-you options:

- Supporter badge
- Special profile badge
- Optional app icon
- Optional theme
- Other non-functional recognition

The actual payment mechanism must follow the relevant App Store/platform rules at the time it is implemented.

---

## 15. Potential Revenue Structure

The current concept has three complementary paths.

### Free Users

- Full core product
- Small banner advertisement
- Optional rewarded advertisements

### Pro Users

- Advanced features
- Deeper intelligence
- Advanced tools
- History
- Automation
- Custom notifications
- No advertisements

### Supporters

- Optional contributions
- May be Free or Pro users
- Potential cosmetic recognition
- No required functional advantage

This allows PokeIQ to generate some revenue from free usage without deliberately degrading the core product.

---

## 16. Pro Pricing Model — Undecided

No final decision has been made between:

- One-time purchase
- Subscription
- Both

This should be decided later after PokeIQ's real operating costs are understood.

A one-time purchase may be attractive for users but could become difficult if future features create permanent per-user costs such as:

- Servers
- Databases
- Live-map infrastructure
- APIs
- Push notifications
- Cloud synchronization
- Other ongoing services

A subscription may better support ongoing costs, but should only be used if the recurring value and expenses justify it.

The decision should be made based on actual costs and product usage rather than prematurely.

---

## 17. App Store / Distribution Considerations

Publishing through Apple's App Store generally requires participation in Apple's paid developer program. Pricing and policies should be checked again when PokeIQ approaches distribution.

PokeIQ does not need App Store publication in order to continue development.

Possible progression:

1. Local development
2. Mobile-friendly production build
3. Install/test on personal devices
4. Early beta
5. TestFlight / equivalent Android testing
6. Public beta
7. App Store / Google Play release

The goal is to avoid paying distribution costs before the application is ready to benefit from them.

---

## 18. Public Beta & Official Integration Strategy

Before pursuing a major official partnership, PokeIQ should ideally be a polished, demonstrable product.

Useful evidence may include:

- Active users
- Pokémon managed
- Imports completed
- Personalized recommendations generated
- Raid teams generated
- User retention
- User feedback
- Testimonials
- Other evidence that PokeIQ solves a real problem

Exact target numbers have not been established.

The purpose is to approach a potential official integration discussion with a functioning product and demonstrated demand rather than only a concept.

---

## 19. Product Principles

As PokeIQ grows, new ideas should be evaluated against several principles.

### Personalize Rather Than Aggregate

Whenever possible, PokeIQ should use the player's account to make generic Pokémon GO information personally relevant.

### Connect Features Together

Features should not become isolated tools.

Examples:

**Live map → collection → Dex goals → recommendations**

**Events → raid bosses → collection strength → investment recommendations**

**XXL spawn → showcase → current score → personalized alert**

**PvP tournament → collection → available team → missing Pokémon**

### Explain Recommendations

PokeIQ should help users understand why something is recommended.

Avoid relying entirely on unexplained scores.

### Keep the Free Product Useful

Monetization should fund and improve PokeIQ rather than intentionally damage the free experience.

### Avoid Destructive Automation

For actions such as Pokémon cleanup/transfers, PokeIQ should provide recommendations and safeguards rather than automatically performing destructive actions.

### Build for Multiple Data Sources

PokeIQ's intelligence layer should work regardless of whether collection data came from:

- Manual entry
- Screenshot OCR
- Screen recording
- Local database
- Cloud synchronization
- Future official Pokémon GO integration

---

## 20. Long-Term Vision

In the ideal future, a player opens PokeIQ and the app already understands their Pokémon GO account.

It knows:

- What they own
- What they are missing
- Their strongest and weakest teams
- Their collection goals
- Their PvP options
- Their resources
- Their investment opportunities
- Current raids
- Upcoming raids
- Current events
- Upcoming events
- Shiny opportunities
- Nearby Pokémon
- Showcases
- Other relevant live-game information

Instead of forcing the player to interpret all of that separately, PokeIQ connects it.

The long-term experience should answer:

> **What's happening in Pokémon GO right now?**

> **What matters for my account?**

> **What should I do next?**

That personalized decision layer is the central long-term identity of PokeIQ.
