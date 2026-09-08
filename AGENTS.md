# Tablero Kanban Development Guidelines

## Language & Documentation Invariants
- **Documentation**: All project documentation, architecture notes, user guides, and decision records must be written in English inside `tablero_kanban_docs/`.
- **Git Commits**: All commit messages must be written in English following Conventional Commits format (e.g., `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `style:`).
- **GitHub Tasks / Issues**: All issues, tasks, labels, and Kanban board items must be written in English.

## Workflow & Execution
- **Step-by-Step Delivery**: Never write large chunks of code or skip ahead without discussing and validating each step first with the user.
- **Architectural Clarity Before Code**: Always plan and validate data schemas, component structures, and API contracts before creating implementation files.
- **Strict Guidelines Compliance**: Follow the project requirements from `guideline/guideline.md` (HTML5 semantic markup, CSS3 responsive styling, Vanilla JS ES6+ modules, SortableJS, json-server REST API at localhost:3000).

## GitFlow & Semantic Versioning Invariants
- **Branching Strategy**:
  - `main`: Stable production branch. Only receives merges from release or hotfix branches. Tagged on every release (e.g., `v1.0.0`).
  - `dev`: Active development and integration branch.
  - Feature branches: `feat/<phase-or-issue>-<short-description>` branched from `dev`, merged back into `dev`.
  - Release branches: `release/vX.0.0` branched from `dev`, merged into `main` (with tag `vX.0.0`) and back into `dev`.
  - Hotfix branches: `hotfix/vX.Y.Z` branched from `main`, merged into `main` and `dev`.

- **Commit Cadence**:
  - Exactly **one commit per task** of each phase.
  - Commit format: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `style:`) referencing the task/issue number.

- **Semantic Versioning**:
  - **Major (`X.0.0`)**: Incremented upon completing each major Phase / Milestone (e.g., `1.0.0` for Phase 1, `2.0.0` for Phase 2).
  - **Minor (`X.Y.0`)**: Incremented on every single task completion within a phase (e.g., `1.1.0`, `1.2.0` ...).
  - **Patch (`X.Y.Z`)**: Reserved for bugfixes or emergency hotfixes (`0.0.X`).
  - Update `version` in `package.json` with each commit.
