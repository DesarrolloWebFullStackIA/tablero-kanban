# Tablero Kanban | Trello-style Project & Task Manager

[![Semantic Versioning](https://img.shields.io/badge/version-v10.0.1-blue.svg)](https://semver.org)
[![Vitest Unit Tests](https://img.shields.io/badge/vitest-79%2F79%20passing-brightgreen.svg)](https://vitest.dev)
[![Live Demo](https://img.shields.io/badge/demo-GitHub%20Pages-success.svg)](https://desarrollowebfullstackia.github.io/tablero-kanban/)
[![JavaScript](https://img.shields.io/badge/javascript-ES6%2B%20Modules-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS3](https://img.shields.io/badge/styling-CSS3%20BEM-1572B6.svg)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellowgreen.svg)](https://conventionalcommits.org)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

A production-grade, highly accessible Kanban board web application designed for software development teams to conceive, organize, track, and discuss work items. Built with **Vanilla JavaScript (ES6+ Modules)**, semantic **HTML5**, responsive **CSS3**, **SortableJS**, and backed by a simulated REST API via **json-server**.

---

## 🌟 Key Features

### 📋 Interactive 3-Column Kanban Board
- **Three Fixed Columns**: *Por Hacer* (`todo`), *En Proceso* (`doing`), and *Finalizado* (`done`).
- **Header Statistics Dashboard**: Real-time counter of total tasks and breakdown per status column.
- **Column Status Indicators & Counters**: Dynamic badges showing active task count per column with automatic empty-state placeholders.

### 🔄 Fluid Drag & Drop Synchronization
- **SortableJS Integration**: Smooth cross-column and intra-column drag & drop with 150ms mobile touch delay to prevent accidental scrolls.
- **Zero-Flicker Optimistic UI**: Instant DOM repositioning and store counter updates without jarring full board re-renders.
- **Server Persistence & Rollback**: Asynchronously dispatches `PATCH /tasks/:id` upon card drop, automatically reverting the card to its original position if a server connection error occurs.

### 📝 Complete Task CRUD Operations
- **Accessible Creation Dialog**: Native `<dialog id="create-task-dialog">` with field validation (Title, Description, Priority, Due Date).
- **Inline Editing**: Live editable task titles and descriptions in the detailed modal with immediate card synchronization.
- **Quick & Modal Task Deletion**: One-click quick delete button with confirmation dialog and permanent server removal via `DELETE /tasks/:id`.

### 💬 Discussion & Comments Feed
- **Task-Specific Comments**: Inspect any card to load its dedicated discussion feed via `GET /comments?taskId=:id`.
- **Instant Comment Posting**: Add comments with author and text via `POST /comments`, appending directly to the feed with smooth scrolling.
- **Comment Deletion**: Remove obsolete comments with one-click `DELETE /comments/:id` and real-time badge count updates on the board.

### 🔍 Real-Time Search & Priority Filters
- **Debounced Title Search**: Instant, non-blocking real-time filtering as you type with a dedicated clear button and `Escape` key shortcut.
- **Priority Filter**: Dropdown filter for `Todas`, `Alta`, `Media`, and `Baja`.
- **Active Filter Indicator**: Visual badge on the Reset button when any filter or query is active, allowing a single-click reset to display all cards.

### 🎨 Design System & Theme Engine
- **Light & Dark Theme Engine**: High-contrast, WCAG AA compliant color palette with persistent `localStorage` and system `prefers-color-scheme` detection.
- **Responsive Layout**: Adapts gracefully across desktop (3-column grid), tablet (compact grid), and mobile (single-column stack with slide-over drawer menu).
- **Toast Notification Service**: Non-intrusive, auto-dismissing accessible notifications (`success`, `error`, `info`).

### 🚀 Advanced Bonus Features (+1.5 Extra Points)
- **👤 User Management & Assignment (+0.5 pt)**: Registered users (`POST /users`), Bottts Neutral robot avatars, card assignee selector, and avatar badges on cards.
- **🏷️ Tags & Advanced Filters (+0.3 pt)**: Hashtag `#tag` extraction with 6 deterministic color themes and toolbar tag filter dropdown.
- **🔄 Subtasks & Checklists (+0.3 pt)**: Interactive checklist in task detail modal with immediate `PATCH` persistence, progress bar tracker, and card badges.
- **📋 Dynamic Columns (+0.2 pt)**: Create custom columns from the UI (*+ Añadir Columna*), rename inline, delete with automatic task relocation, and SortableJS dropzones.
- **🧪 Automated Unit Testing (+0.2 pt)**: 79 comprehensive unit tests in Vitest covering all core business logic, store reactions, and utilities.

---

## 🏗️ Architecture & Project Structure

```
tablero-kanban/
├── data/
│   └── data.json                  # Database schema for tasks and comments (json-server)
├── guideline/
│   └── guideline.md               # Project rubric and functional requirements
├── src/
│   ├── css/
│   │   └── index.css              # CSS3 Design System (tokens, layout, cards, dialogs, toasts)
│   └── js/
│       ├── api.js                 # Async REST API client with custom ApiError
│       ├── dragdrop.js            # SortableJS controller with optimistic sync and rollback
│       ├── index.js               # Application bootstrap, theme manager, and filter orchestration
│       ├── modal.js               # Dialog lifecycle, task creation, editing, and comments controller
│       ├── store.js               # Reactive central state store with subscriber pattern
│       ├── ui.js                  # DOM rendering, card templates, date formatting, and badges
│       ├── utils.js               # Toast alerts and debounce utility
│       └── vendor/
│           └── Sortable.min.js    # Vendored standalone SortableJS library
├── tests/
│   ├── store.test.js              # Unit tests for state store, filtering, and metrics
│   └── utils.test.js              # Unit tests for date formatters, overdue logic, and debounce
├── tablero_kanban_docs/           # Comprehensive English documentation vault
│   ├── 01-architecture-overview.md
│   ├── 02-data-contracts-and-api.md
│   ├── 03-component-design-system.md
│   ├── 04-accessibility-and-quality.md
│   ├── 05-Task-Roadmap.md
│   └── 06-GitFlow-and-Versioning.md
├── index.html                     # Semantic HTML5 single-page application entry point
├── package.json                   # Project scripts, metadata, and dependencies
└── README.md                      # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18.0.0 or higher
- **pnpm** (recommended) or **npm**

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/DesarrolloWebFullStackIA/tablero-kanban.git
cd tablero-kanban
pnpm install
# or: npm install
```

### 2. Start the Simulated REST Backend
Launch `json-server` on port `3000`:
```bash
pnpm server
# or: npm run server
```
The REST API will be accessible at `http://localhost:3000`.

### 3. Launch the Frontend
Open `index.html` in your browser using any local static file server:
```bash
# Using VS Code Live Server extension (recommended):
# Right-click index.html -> Open with Live Server (http://127.0.0.1:5500)

# Or using npx serve:
npx serve .
```

---

## 🧪 Automated Testing

The project includes an automated unit test suite powered by **Vitest**, covering date formatting, task overdue calculations, state store mutations, combined filters, and comments management.

Run the test suite:
```bash
pnpm test
# or: npm test
```

### Test Coverage Highlights (79 tests across 2 suites):
- **`tests/utils.test.js`** (16 tests):
  - XSS prevention and HTML sanitization (`escapeHtml`).
  - Localized Spanish date formatting (`formatDate`, `formatCommentDate`).
  - Task overdue detection (`isTaskOverdue`), ensuring completed tasks (`status: done`) are never marked overdue.
  - Asynchronous debounce delay and rapid call cancellation (`debounce`).
  - Hashtag extraction (`extractHashtags`) and deterministic color token assignment (`getTagColorClass`).
- **`tests/store.test.js`** (63 tests):
  - Reactive CRUD operations (`addTask`, `updateTask`, `moveTask`, `removeTask`).
  - Combined search, priority, and hashtag filtering logic (`getFilteredTasks`).
  - Header metrics computation (`getMetrics`).
  - Comments cache storage, additions, and deletions (`setCommentsForTask`, `addComment`, `removeComment`).
  - Team member management (`setUsers`, `addUser`, `getUserById`).
  - Subtask checklist management and progress calculations (`toggleSubtask`, `calculateChecklistStats`).
  - Dynamic column lifecycle (`addColumn`, `renameColumn`, `deleteColumn` with task migration).

---

## 📡 REST API Specification

The application integrates with `json-server` operating at `http://localhost:3000`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/tasks` | Retrieve all Kanban tasks |
| `GET` | `/tasks/:id` | Fetch a single task by ID |
| `POST` | `/tasks` | Create a new task (defaults to status `todo`) |
| `PATCH` | `/tasks/:id` | Partial update (status move, title, description, checklist) |
| `PUT` | `/tasks/:id` | Full replacement of task entity |
| `DELETE` | `/tasks/:id` | Permanently delete a task |
| `GET` | `/comments?taskId=:id` | Fetch all comments associated with a task |
| `POST` | `/comments` | Append a new comment to a task |
| `DELETE` | `/comments/:id` | Permanently delete an individual comment |
| `GET` | `/users` | Retrieve all registered team members |
| `POST` | `/users` | Register a new team member with avatar |

### Example Task Payload:
```json
{
  "id": "1",
  "title": "Diseñar maqueta en Figma #ux #design",
  "description": "Crear wireframes interactivos y paleta de colores.",
  "priority": "Alta",
  "dueDate": "2026-09-15",
  "status": "todo",
  "tags": ["#ux", "#design"],
  "assigneeId": "u1",
  "checklist": [
    { "id": "c1", "text": "Wireframe de baja fidelidad", "completed": true },
    { "id": "c2", "text": "Prototipo interactivo en Figma", "completed": false }
  ],
  "createdAt": "2026-09-08T09:00:00Z"
}
```

### Example User Payload:
```json
{
  "id": "u1",
  "name": "Ana Gómez",
  "email": "ana.gomez@example.com",
  "role": "Frontend Dev",
  "avatar": "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Ana"
}
```

---

## 🌿 GitFlow & Versioning Strategy

This project adheres strictly to **GitFlow** and **Semantic Versioning 2.0.0**:

- **`main`**: Production-ready code. Receives merges only from `release/*` and `hotfix/*` branches. Every release is tagged (`vX.0.0`).
- **`dev`**: Integration branch for day-to-day feature development.
- **`feat/*`**: Feature branches branched from and merged back into `dev`.
- **Commit Cadence**: Exactly one commit per task using **Conventional Commits** (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`).
- **SemVer Cadence**:
  - Major (`X.0.0`): Upon completing each milestone/phase.
  - Minor (`X.Y.0`): Upon completing every individual task within a phase.
  - Patch (`X.Y.Z`): Dedicated for bugfixes or emergency hotfixes.

---

## ♿ Accessibility (WCAG 2.1 AA)

- **Semantic HTML5**: Native `<dialog>`, `<main>`, `<header>`, `<nav>`, `<section>`, `<article>`.
- **Keyboard Navigation**:
  - `Tab` and `Shift+Tab` across all interactive elements with high-contrast `:focus-visible` rings.
  - `Enter` and `Space` to inspect cards from keyboard focus.
  - `Escape` closes active dialog modals and clears the search input.
- **Screen Reader Announcements**:
  - `aria-live="polite"` on toast notifications and search result states.
  - Explicit `aria-label` attributes on icon-only buttons (`.btn-card-delete`, `.btn-dialog-close`, `.btn-clear-search`).
  - `aria-busy` state indication while loading comments asynchronously.
- **Accessible Color Contrast**: Contrast ratios exceeding 4.5:1 across both light and dark themes.

---

## 📄 License
This project is licensed under the **ISC License**. Conceived and developed for the **Desarrollo Web Full Stack + IA** Master program (Factoría F5).
