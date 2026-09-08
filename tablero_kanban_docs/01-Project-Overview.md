# 01 - Project Overview: Tablero Kanban (P1 CRC)

## Executive Summary
The **Tablero Kanban** project is an interactive, responsive project and task management web application designed for agile software development teams, inspired by Trello and Kanban methodologies. The system provides real-time task visualization across workflow stages, drag-and-drop task movements, creation, inline editing, task details with comments, and live status metrics.

## Key Objectives
- **Semantic HTML5 & Accessibility**: Build an accessible, clean document structure using semantic elements (`<main>`, `<section>`, `<article>`, `<dialog>`, `<nav>`, `<header>`).
- **Responsive CSS3 Design System**: Create a modern visual interface utilizing CSS Custom Properties, Flexbox, and CSS Grid, fully adaptable from mobile viewports (375px) to desktop displays (1280px+), including dark and light theme support.
- **Dynamic Vanilla JavaScript (ES6+)**: Deliver robust state management and DOM manipulation using clean native ES Modules without heavy frontend frameworks.
- **RESTful API Interaction (`json-server`)**: Perform full CRUD operations (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) with asynchronous `fetch` and `async/await` communicating with a simulated local REST backend.
- **Interactive Drag & Drop**: Enable intuitive card movements across columns utilizing `SortableJS` with optimistic UI updates and server synchronization.

## Technology Stack
| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Markup** | HTML5 | Accessible, semantic web structure |
| **Styling** | CSS3 (Vanilla) | Design tokens, responsive grid/flexbox, transitions, themes |
| **Logic** | JavaScript (ES6+ Modules) | Application state, DOM rendering, async HTTP operations |
| **Drag & Drop** | SortableJS (v1.15.7) | Cross-column card reordering and status transition |
| **Mock API** | json-server (v1.0.0-beta) | RESTful persistence for tasks and comments |
| **Testing** | Vitest | Unit testing for business logic, validators, and filters |
| **Documentation** | Obsidian Vault / Markdown | Technical architecture and project tracking in English |
| **VCS & PM** | Git & GitHub Projects | Version control, Conventional Commits, issue tracking |

## Academic Competencies & Rubric Alignment (100 Pts Total)
1. **User Interface Design (20 pts)**: High-fidelity components, consistent Gestalt principles, atomic layout structure, and clear visual hierarchy.
2. **Static Layout & Responsive Web Design (30 pts)**: Mobile-first responsive layout, accessible contrast ratios, semantic landmarks, and fluid animations.
3. **Dynamic Interaction & REST CRUD (25 pts)**: Complete asynchronous CRUD lifecycle against `json-server`, error handling, and modular code separation.
4. **Deliverables & Production (10 pts)**: Professional GitHub repository, comprehensive `README.md`, reproduction steps, and structured git history.
5. **Oral Presentation (15 pts)**: 10-minute team presentation detailing design decisions, state architecture, and CRUD workflow.

## Bonus Challenges Roadmap (+1.5 Pts Extra)
- **User Management & Assignment (+0.5 pt)**: User entity with avatars and task assignee selection.
- **Advanced Tags & Priority Filters (+0.3 pt)**: Color-coded priority badges and compound filters.
- **Checklist / Subtasks (+0.3 pt)**: Interactive checklist items inside task details.
- **Dynamic Column Customization (+0.2 pt)**: Dynamic column creation and renaming.
- **Unit Testing (+0.2 pt)**: Automated unit tests with Vitest for utility and validation functions.

