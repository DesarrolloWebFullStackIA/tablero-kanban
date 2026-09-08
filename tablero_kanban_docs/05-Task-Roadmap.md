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

## Phase 8: Real-Time Search, Filters, Vitest Tests & Production Polish
- **Focus**: UX enhancements, bonus challenges, automated testing, and final review.
- **Deliverables**:
  - Real-time debounced title search.
  - Priority filter (`Todas`, `Baja`, `Media`, `Alta`).
  - Vitest test suite for date formatters and filter logic (+0.2 pts bonus).
  - Professional `README.md` with installation commands, architecture summary, and screenshots.

