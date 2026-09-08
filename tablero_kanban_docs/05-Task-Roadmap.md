# 05 - Task Roadmap & Milestones

This document tracks the phased development lifecycle of the **Tablero Kanban** project. Each phase maps to a dedicated GitHub Issue and contains concrete acceptance criteria.

---

## Milestone Phases Overview

```
[Phase 1: Architecture & Docs] ➔ [Phase 2: Semantic HTML] ➔ [Phase 3: CSS Design System]
        ➔ [Phase 4: API & Data Layer] ➔ [Phase 5: CRUD & State Store]
        ➔ [Phase 6: SortableJS Drag & Drop] ➔ [Phase 7: Detail Modal & Comments]
        ➔ [Phase 8: Search, Filters & Vitest Tests]
```

---

## Phase 1: Architecture, Data Schema & Documentation Vault
- **Focus**: Pre-coding alignment, technical documentation, workspace rules, and GitHub project setup.
- **Deliverables**:
  - [x] Agreed architectural decisions via collaborative design session.
  - [x] Workspace rules persisted in `AGENTS.md`.
  - [x] Comprehensive documentation in English inside `tablero_kanban_docs/`.
  - [x] 8 Milestone issues opened on GitHub repo.

## Phase 2: Semantic HTML5 Layout & Dialog Modals
- **Focus**: Clean, accessible DOM skeleton.
- **Deliverables**:
  - Header with app branding and quick stats dashboard.
  - Mobile hamburger navigation drawer.
  - Search and filter toolbar.
  - 3 semantic columns (`Por Hacer`, `En Proceso`, `Finalizado`).
  - Native `<dialog>` elements for task creation and task detail/comments.
  - Full ARIA landmarks and accessible form labels.

## Phase 3: CSS3 Design System & Responsive Layout
- **Focus**: Visual styling, design tokens, responsiveness, and themes.
- **Deliverables**:
  - CSS Custom Properties definition (colors, typography, spacing, elevation).
  - Responsive board layout (Desktop grid, tablet, mobile adaptation).
  - Task card components with priority color chips and overdue styling.
  - Light & Dark theme toggle support.
  - Micro-interactions, button hover states, and smooth drag indicators.

## Phase 4: Data Layer & json-server REST API Integration
- **Focus**: Persistence engine and network communication module.
- **Deliverables**:
  - Seed dataset in `data/data.json` with realistic tasks and comments.
  - Validated `start-backend.bat` running `json-server` on port 3000.
  - `src/js/api.js` implementing async CRUD (`GET`, `POST`, `PATCH`, `DELETE`).
  - Error handling with status code verification.

## Phase 5: Dynamic UI Rendering, State Store & CRUD Operations
- **Focus**: Application state and reactive DOM updates.
- **Deliverables**:
  - `src/js/store.js` as single source of truth for tasks and metrics.
  - `src/js/ui.js` rendering cards dynamically per column.
  - Live header statistics updating upon state mutations.
  - New task creation modal with form validation.
  - Task deletion with DOM removal and server synchronization.

## Phase 6: Drag & Drop Synchronization with SortableJS
- **Focus**: Cross-column dragging and instant backend update.
- **Deliverables**:
  - SortableJS initialization across all three columns.
  - Drop event handler extracting task ID and destination status.
  - Optimistic UI update and real-time column metrics recalculation.
  - `PATCH /tasks/:id` server synchronization.
  - Rollback and toast alert on network failure.

## Phase 7: Task Detail View, Inline Editing & Comments System
- **Focus**: Detailed inspection, editing, and task discussions.
- **Deliverables**:
  - Task click opens `<dialog id="task-detail-dialog">`.
  - Inline editing for task title and description via `PATCH`.
  - Fetch and render comments (`GET /comments?taskId=:id`).
  - New comment form dispatching `POST /comments` with instant UI refresh.

## Phase 8: Real-Time Search, Filters, Vitest Tests & Production Polish (`v8.0.0`)
- **Focus**: UX enhancements, bonus challenges, automated testing, and final review.
- **Deliverables**:
  - [x] Real-time debounced title search.
  - [x] Priority filter (`Todas`, `Baja`, `Media`, `Alta`).
  - [x] Initial Vitest test suite (+0.2 pts bonus).
  - [x] Professional `README.md` with installation commands and architecture summary.

## Phase 9: Unified Batch Launcher & Standalone GitHub Pages (`v8.1.0`)
- **Focus**: Developer onboarding convenience and standalone web deployment.
- **Deliverables**:
  - [x] Combined batch launcher script `start-project.bat` starting `json-server` and static web server in parallel.
  - [x] Standalone `live-demo` branch with in-memory mock REST data repository for GitHub Pages deployment.

## Phase 10: Advanced Bonus Features Milestone (`v9.0.0`)
- **Focus**: Complete all 5 bonus challenges (+1.5 extra points).
- **Deliverables**:
  - [x] **Task 10.1: Hashtags & Tag Filter (`v8.2.0`)**: `#tag` extraction with 6 deterministic color themes and toolbar filter dropdown (+0.3 pt).
  - [x] **Task 10.2: Subtasks / Checklist (`v8.3.0`)**: Dynamic checklist in detail modal with immediate `PATCH` persistence, progress bar tracker, and card badges (+0.3 pt).
  - [x] **Task 10.3: User Management & Card Assignment (`v8.4.0`)**: User registration (`POST /users`), assignee selector, and card avatar badges (+0.5 pt).
  - [x] **Task 10.4: Dynamic Columns Management (`v8.5.0`)**: Create custom columns (`+ Añadir Columna`), rename inline, delete with task relocation (+0.2 pt).
  - [x] Expanded Vitest test suite to 79 tests (100% pass) covering all bonus features (+0.2 pt).

## Phase 11: Full-Screen Fluid Responsive Adaptation (`v10.0.0`)
- **Focus**: Complete responsive layout across desktop, tablet, and mobile.
- **Deliverables**:
  - [x] **Task 11.1: Fluid Full-Width & Full-Height Board Layout (`v9.1.0`)**: Removed `max-width: 1400px` bottlenecks, full viewport height (`100vh` / `100dvh`), independent card list scroll.
  - [x] **Task 11.2: Dynamic Column Sizing & Overflow Protection (`v9.2.0`)**: `clamp(290px, 21vw, 360px)` column flex basis, overflow protection for "+ Añadir Columna".
  - [x] **Task 11.3: Responsive Toolbar & Tablet Adaptation (`v9.3.0`)**: Flex wrap toolbar, compact metrics, responsive dialogs (`min(92vw, 520px)`).
  - [x] **Task 11.4: Mobile Optimization & Snap Scrolling (`v9.4.0`)**: Mobile horizontal snap scrolling (`scroll-snap-type: x mandatory`), stacked buttons on small viewports.

## Hotfix v10.0.1: Mobile Spacing & Bottts Neutral Avatars (`v10.0.1`)
- **Focus**: Bugfix for mobile toolbar vertical spacing and avatar theme update.
- **Deliverables**:
  - [x] Removed 240px vertical empty space in mobile toolbar caused by `flex-basis: 240px` on `.search-box`.
  - [x] Suppressed browser native search cancel button (`::-webkit-search-cancel-button`) to eliminate duplicate 'x' buttons.
  - [x] Switched avatar generation to DiceBear **Bottts Neutral** robot style across data and UI.
  - [x] Added cache-busting query parameter `?v=10.0.1` in `index.html`.

