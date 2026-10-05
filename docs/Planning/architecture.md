# PokeIQ Architecture

## Purpose

This document describes the technical architecture of PokeIQ.

Its goals are to:

- Explain how the application is structured today
- Preserve important ownership boundaries between systems
- Document architectural principles that should survive future development
- Provide direction for the transition from a local development application to a production platform
- Prevent future features from becoming tightly coupled to specific data sources, pages, or UI implementations
- Make it easier to resume development after long breaks
- Reduce unnecessary rewrites as PokeIQ grows

This document is not intended to list every file in the repository.

For exact current implementation state, validation results, and immediate development handoff, use:

`PROJECT_STATUS.md`

For product direction, use:

`VISION.md`

For feature priorities and horizons, use:

`ROADMAP.md`

For uncommitted ideas, use:

`BRAINSTORM.md`

---

# Architectural North Star

PokeIQ should increasingly be organized around this pipeline:

```text
External / Player Data
        ↓
Normalized PokeIQ Data
        ↓
Domain Engines
        ↓
Intelligence Services
        ↓
Player Context
        ↓
Recommendations / Decisions
        ↓
UI / Notifications / AI Assistant