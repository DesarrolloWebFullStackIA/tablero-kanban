# 04 - UI/UX Design System & Styling Architecture

## Design System Philosophy
The design system delivers an intuitive, distraction-free Kanban interface with modern software aesthetics (clean borders, subtle shadows, balanced whitespace, and purposeful micro-interactions). It is implemented using native CSS3 Custom Properties to ensure maintainability, performance, and dark/light theme switching without external styling libraries.

---

## Design Tokens (CSS Custom Properties)

### 1. Color Palette

```css
:root {
  /* Primary & Brand */
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-primary-light: #eff6ff;

  /* Priority Semantics */
  --color-priority-high: #ef4444;
  --color-priority-high-bg: #fef2f2;
  --color-priority-medium: #f59e0b;
  --color-priority-medium-bg: #fffbeb;
  --color-priority-low: #10b981;
  --color-priority-low-bg: #ecfdf5;

  /* Overdue Alert */
  --color-overdue: #dc2626;
  --color-overdue-bg: #fee2e2;

  /* Column Accents */
  --color-column-todo: #64748b;
  --color-column-doing: #3b82f6;
  --color-column-done: #10b981;

  /* Base Spacing Scale */
  --space-xs: 0.25rem;   /* 4px */
  --space-sm: 0.5rem;    /* 8px */
  --space-md: 1rem;      /* 16px */
  --space-lg: 1.5rem;    /* 24px */
  --space-xl: 2rem;      /* 32px */

  /* Border Radii */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  --shadow-card-drag: 0 20px 25px -5px rgba(0, 0, 0, 0.15);

  /* Transitions */
  --transition-fast: 150ms ease-in-out;
  --transition-normal: 250ms ease-in-out;
}
```

### 2. Theme Switching (Light / Dark)

```css
/* Light Theme Defaults */
:root, [data-theme="light"] {
  --color-bg-app: #f8fafc;
  --color-bg-surface: #ffffff;
  --color-bg-column: #f1f5f9;
  --color-bg-card: #ffffff;
  --color-text-main: #0f172a;
  --color-text-muted: #64748b;
  --color-border: #e2e8f0;
  --color-dialog-backdrop: rgba(15, 23, 42, 0.5);
}

/* Dark Theme */
[data-theme="dark"] {
  --color-bg-app: #090d16;
  --color-bg-surface: #131b2e;
  --color-bg-column: #182238;
  --color-bg-card: #1e293b;
  --color-text-main: #f8fafc;
  --color-text-muted: #94a3b8;
  --color-border: #334155;
  --color-dialog-backdrop: rgba(0, 0, 0, 0.75);
}
```

---

## Core Components Specification

### 1. Header & Navigation
- **Branding**: App title with badge indicator.
- **Metrics Dashboard**: 3 pill indicators displaying live counts (`Por Hacer: X`, `En Proceso: Y`, `Finalizado: Z`).
- **Global Actions**: "+ Nueva Tarea" button, Theme Toggle (Sun / Moon icon), and Mobile Hamburger Menu button (`aria-expanded`, `aria-label`).

### 2. Toolbar (Search & Filter)
- **Live Search Input**: Text input filtering tasks by title in real-time.
- **Priority Dropdown**: Filter cards by `Todas`, `Baja`, `Media`, `Alta`.
- **Reset Button**: Clears active filters with immediate UI restoration.

### 3. Kanban Board & Columns
- **Layout**: CSS Grid on desktop (`repeat(3, 1fr)` or auto-fit with min-width `300px`), horizontal smooth-scrolling or stacked view on mobile.
- **Column Card**:
  - Column Header with title, accent color pill, and task count badge.
  - Cards Container: Drop zone monitored by SortableJS.
  - Empty State Placeholder: Friendly illustrated text when a column has zero cards.

### 4. Task Card
- **Structure**:
  - Top: Priority tag pill (`Baja`, `Media`, `Alta`) and quick-action delete button.
  - Middle: Task title (bold, clamped to 2 lines) and brief description excerpt.
  - Bottom: Due date badge (with calendar icon; turns red/warning if overdue) and comments count indicator.
- **Drag State**: Card gains elevation shadow, slight rotation (1.5deg), and opacity reduction during active drag.

### 5. Dialog Modals (`<dialog>`)
- **Native Modal Behavior**: Triggered with `dialog.showModal()`.
- **Focus Rings**: High-contrast outline on focused form inputs (`outline: 2px solid var(--color-primary)`).
- **Close Button**: Accessible `X` button and `Cancel` button.

### 6. Responsive Breakpoints
- **Mobile (< 768px)**: Stacked single-column or swipeable board, collapsible hamburger menu for stats/actions.
- **Tablet (768px - 1024px)**: 3-column board with horizontal scroll if needed.
- **Desktop (> 1024px)**: Full 3-column equal-width grid with fixed header and full toolbar controls.

