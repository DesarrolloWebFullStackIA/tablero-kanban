# 07 - UI/UX Stitch & Figma AI Prototyping Prompts

## Overview & Evaluation Rubric Alignment
This document defines the high-fidelity AI UI generation prompts designed for **Stitch** (and compatible Figma AI / Galileo AI prototyping engines) to replicate and expand the **Tablero Kanban** interface.

These prompts are engineered to meet the **Avanzado (100% / 20 pts)** level of the **Diseñar interfaces de usuario** competency:
1. **Component-Driven Modular Architecture (Atomic Design)**: Breakdown into atoms (tokens, badges, chips), molecules (cards, search boxes, comment bubbles), organisms (columns, headers, modals), and screens.
2. **Gestalt Principles & Visual Hierarchy**: Strict application of proximity, similarity, common region, visual rhythm, and WCAG AA/AAA contrast ratios.
3. **Interactive States & Micro-interactions**: Simulation of drag-and-drop elevation, ghost dropzones, inline editing, checklist progress bars, and modal overlays.
4. **Multi-device Responsiveness**: Explicit desktop (1440x900 fluid) and mobile (390x844 snap-scrolling carousel with navigation drawer) views.

---

## 1. Master Stitch Prompt (All-in-One Generation)

```text
Design a modern, high-fidelity, responsive Kanban Project Management web application called "Tablero Kanban" in Spanish. Follow Atomic Design principles, clean SaaS aesthetics (linear/modern Minimalist style), subtle border outlines, soft elevation shadows, and rounded corners (6px for chips, 10px for cards, 16px for modals).

### 1. Brand Identity & Design Tokens
- Primary Accent: #3b82f6 (Vibrant Blue), Hover: #2563eb, Light BG: #eff6ff
- Backgrounds: App canvas #f8fafc, Card surface #ffffff, Column background #f1f5f9, Borders #e2e8f0
- Typography: Inter or modern system sans-serif (Bold 24px title, Semi-bold 14px cards, Regular 13px descriptions, 12px metadata)
- Semantic Priority Colors:
  * Alta (High): Text #ef4444, Pill Background #fef2f2, Border #fecaca
  * Media (Medium): Text #f59e0b, Pill Background #fffbeb, Border #fde68a
  * Baja (Low): Text #10b981, Pill Background #ecfdf5, Border #a7f3d0
- Overdue Alert: #dc2626 text on #fee2e2 badge with an alert triangle icon
- Column Accents: "Por Hacer" (#64748b Slate), "En Proceso" (#3b82f6 Blue), "Finalizado" (#10b981 Emerald)
- Avatars: DiceBear "Bottts Neutral" playful robot avatar icons in circular 28px/32px badges

### 2. Screen 1: Desktop Main Board (1440x900px fluid layout)
- Top Navigation Bar (Sticky header, height 64px, white surface, subtle bottom border):
  * Left: Brand logo (Kanban board icon inside rounded blue square) + App Title "Tablero Kanban" with subtitle "Gestión Ágil de Tareas"
  * Center: Quick Statistics Panel featuring 4 rounded metric pills with colored dot indicators: "Por Hacer: 5", "En Proceso: 3", "Finalizado: 8", and "Total: 16"
  * Right Actions: Theme Toggle button (Sun/Moon icon), "Usuarios" secondary button with user group icon, and "+ Nueva Tarea" primary blue button
- Toolbar (Height 56px, background #f8fafc):
  * Left: Search input field with search magnifying glass icon, placeholder "Buscar por título...", and clear button
  * Right: Filter controls with labels and custom select dropdowns: "Prioridad: [Todas, Alta, Media, Baja]", "Etiqueta: [Todas, #frontend, #api, #ux]", and a "Restablecer" reset button with circular refresh icon
- Main Kanban Canvas:
  * Horizontal fluid layout with columns. Fixed columns:
    1. "Por Hacer" (Slate indicator pill, counter badge "5", "+ Añadir tarea" header action)
    2. "En Proceso" (Blue indicator pill, counter badge "3", "+ Añadir tarea" header action)
    3. "Finalizado" (Emerald indicator pill, counter badge "8", "+ Añadir tarea" header action)
    4. "+ Añadir Columna" action button / placeholder column with dashed border
  * Task Cards inside columns (White surface, 1px #e2e8f0 border, soft shadow, padding 16px, border-radius 10px):
    - Top row: Priority badge ("Alta" in soft red pill), and a subtle trash can delete icon button on hover
    - Middle row: Bold card title (e.g. "Diseñar maquetas en Figma y Stitch"), 2-line clamped description ("Crear los wireframes y prototipos interactivos del tablero."), and colored category hashtag chips (e.g., "#design", "#ui", "#frontend")
    - Bottom footer row:
      * Left: Due date pill with calendar icon (e.g. "15 sep 2026", with overdue dates highlighted in bold red)
      * Right cluster: Checklist progress badge with check icon (e.g., "2/3"), comments counter with speech bubble icon ("4"), and assigned team member robot avatar (Bottts neutral circular 28px)
  * Interactive Drag & Drop State:
    - Show one card currently being dragged: lifted with 2-degree tilt, 1.02 scale, deep shadow (0 20px 25px -5px rgba(0,0,0,0.15)), and a dashed blue outline ghost placeholder in the target drop column
  * Empty Column State:
    - For an empty column, display a centered subtle illustration/icon of an empty clipboard and text "Sin tareas pendientes"

### 3. Screen 2: Task Detail & Interaction Modal (Desktop Overlay 720px width centered)
- Semi-transparent backdrop with 4px Gaussian blur (background: rgba(15, 23, 42, 0.5))
- Modal Container (White surface, border-radius 16px, shadow 0 25px 50px -12px rgba(0,0,0,0.25)):
  * Header: Editable Task Title input ("Diseñar maquetas en Figma y Stitch"), Status dropdown selector ("En Proceso"), and Close "✕" icon button
  * Body Grid:
    - Left/Main Column:
      * Description section with editable rich-text / markdown textarea
      * Subtasks / Checklist section: Section title with count ("Subtareas (2/4)"), an animated green/blue progress bar showing 50%, and an interactive list of checklist items with checkboxes (checked items have strike-through text). Input field with "+ Añadir subtarea" button
      * Comments & Activity Thread: Activity header, timeline of past comments displaying author robot avatar, author name, relative timestamp ("Hace 2 horas"), comment bubble message, and a form with textarea placeholder "Escribe un comentario..." and primary "Comentar" button
    - Right/Sidebar Column (Metadata):
      * Priority selector pill dropdown ("Alta")
      * Due date picker field ("2026-09-15")
      * Assignee dropdown with robot avatar preview ("Ana Gómez")
      * Tags / Hashtags manager
  * Footer: Danger button "Eliminar Tarea" (trash icon, red outline), and primary CTA "Guardar Cambios"

### 4. Screen 3: Mobile View (390x844px iPhone layout)
- Compact Mobile Header:
  * Brand logo + "Tablero Kanban"
  * Hamburger menu button (3 horizontal lines) triggering a slide-in navigation drawer with links, quick user management, and theme switcher
- Mobile Quick Stats Bar: Horizontal swipeable chips displaying live counters
- Mobile Search & Filters: Full-width search bar with collapsible filter drawer
- Mobile Kanban Board:
  * Horizontal snap-scrolling carousel (scroll-snap-type: x mandatory)
  * Each column takes ~88vw width with card containers having independent vertical scrolling
  * Sticky "+ Nueva Tarea" floating action button (FAB) at the bottom-right corner
```

---

## 2. Granular Modular Prompts (Iterative Generation)

If using a tool that generates screens one-by-one, use these targeted prompts:

### Prompt A: Desktop Kanban Board (Main Canvas)
```text
Create a desktop 1440x900px UI mockup for an Agile Kanban Board called "Tablero Kanban" in Spanish.
Style: Clean SaaS, modern minimalist, white cards on soft grey background (#f8fafc), subtle borders (#e2e8f0), border radius 10px.
Header: Left logo with Kanban icon + title "Tablero Kanban", center quick stats pills ("Por Hacer: 4", "En Proceso: 2", "Finalizado: 6", "Total: 12"), right actions: Theme Toggle, "Usuarios" button, and blue "+ Nueva Tarea" button.
Toolbar: Full-width bar with search input "Buscar por título...", priority filter ("Alta", "Media", "Baja"), tag filter, and reset button.
Columns: Three main columns ("Por Hacer" Slate, "En Proceso" Blue, "Finalizado" Emerald) plus an "+ Añadir Columna" action button.
Cards: Each card has a priority badge (Alta in red, Media in yellow, Baja in green), bold title, description excerpt, colored hashtag chips (#frontend, #api), due date pill, checklist badge "1/3", comments count "2", and a circular robot avatar (DiceBear Bottts Neutral). Include one card lifted in an active drag-and-drop state with shadow and tilt.
```

### Prompt B: Task Detail Modal with Checklist & Comments
```text
Design a high-fidelity modal dialog overlay (720px width) for task inspection in a Kanban board.
Theme: Clean SaaS, modern light mode, 16px rounded corners, soft shadow, backdrop blur.
Content:
- Header: Editable task title "Configurar json-server y API REST", status badge "En Proceso" (Blue), close button.
- Metadata row: Priority selector "Media" (Orange), Due date "2026-09-15", Assignee "Carlos Ruiz" with robot avatar.
- Description: Editable textarea with context notes.
- Subtasks / Checklist: Progress bar filled to 66% (2/3 completed), checklist items with custom checkboxes and strikethrough for completed items, inline input "+ Añadir subtarea".
- Comments section: List of comments with author robot avatars, names, timestamps ("Ayer a las 18:30"), comment text cards, and comment box with "Comentar" button.
- Footer: Red "Eliminar Tarea" danger button on the left, "Cerrar" and "Guardar Cambios" primary button on the right.
```

### Prompt C: Mobile Responsive View & Navigation Drawer
```text
Design a mobile UI (390x844px) for the "Tablero Kanban" application.
- Top bar: Brand logo, title "Tablero Kanban", and a hamburger menu icon.
- Slide-in navigation drawer: Shows navigation links, user switcher, theme mode toggle, and "+ Nueva Tarea" CTA.
- Toolbar: Compact search box with magnifying glass and quick filter pills.
- Board: Horizontal carousel with snap-scrolling where each Kanban column ("Por Hacer", "En Proceso", "Finalizado") occupies 88vw, displaying compact task cards with priority badges, titles, checklist badges, and robot avatars.
- Bottom right: Blue floating action button (FAB) with a plus icon to create tasks quickly.
```

### Prompt D: Team / User Management Modal
```text
Design a team member management modal dialog (560px width) for a Kanban application.
Title: "Gestión del Equipo" with user group icon.
Roster: Table/list of active members. Each row features a 40px circular robot avatar (DiceBear Bottts Neutral), member name (e.g., "Ana Gómez", "Carlos Ruiz", "Elena Torres"), role badge ("Frontend Dev", "Backend Dev", "UI/UX Designer"), and current active task counter ("3 tareas").
Form section: "+ Añadir Nuevo Miembro" with fields for Full Name, Role dropdown, and avatar seed preview with randomize button.
Footer: "Cerrar" button.
```

---

## 3. Gestalt & Accessibility Compliance Matrix

| Principle | Implementation in Prompt | Evaluation Impact |
| :--- | :--- | :--- |
| **Law of Proximity** | Card metadata (due date, checklist, comments, avatar) grouped tightly in the bottom footer row away from the title. | Clear visual hierarchy, prevents cognitive overload. |
| **Law of Similarity** | Strict semantic color tokens across priorities (Red = Alta, Amber = Media, Green = Baja) on cards, filters, and modal headers. | Immediate visual pattern recognition. |
| **Law of Common Region** | Soft column card container (`#f1f5f9`) encapsulating its list of white task cards (`#ffffff`). | Strong distinction between workflow stages. |
| **Visual Hierarchy** | Title (Bold 16px) > Excerpt (Regular 13px) > Metadata & Badges (12px Semi-bold). | Effortless scanning of the board in seconds. |
| **Accessibility (WCAG AA)** | Minimum 4.5:1 text contrast on all badges and buttons, visible focus outlines, and distinct icons accompanying all color-coded states. | Complies with universal design standards. |
