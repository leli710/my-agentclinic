# Changelog

Notable user-facing changes are recorded here. This project has not had a versioned release yet.

## Unreleased

### Added

- Added a local Agent Clinic dashboard for software agents, ailments, severity, status, treatment, and outcome tracking.
- Added Hebrew right-to-left pages for agent and ailment management, with local SQLite persistence, sample data, and locally served Pico CSS.
- Added a separate course-progress page that reads task counts from `TASKS.md`.
- Added the `GET /api/hello` JSON example endpoint while reserving `/` for the Agent Clinic dashboard.
- Added responsive layouts tested at narrow and desktop viewport widths.

### Changed

- Updated the visual theme to use the course-requested orange and black brand colors.
- Limited the required course-progress total to lessons through the MVP.

### Fixed

- Removed the minimum page width that caused horizontal scrolling at a 320px viewport.
- Honored `AGENT_CLINIC_DB` when starting the application, as documented.
