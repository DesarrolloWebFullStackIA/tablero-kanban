# 03 - Data Model & REST API Specification

## Backend Environment
- **Server Engine**: `json-server` (v1.0.0-beta)
- **Base URL**: `http://localhost:3000`
- **Data File**: `data/data.json`
- **Startup Command**: `npx json-server ./data/data.json --port 3000` (or executing `start-backend.bat`)

---

## Data Schema & Entities

### 1. Task Entity (`/tasks`)
Represents an individual Kanban card.

```json
{
  "id": "1",
  "title": "Design Figma Wireframes",
  "description": "Create low-fidelity wireframes and interactive prototypes for the board.",
  "priority": "Alta",
  "dueDate": "2026-09-15",
  "status": "todo",
  "createdAt": "2026-09-08T09:00:00Z"
}
```

#### Fields Description
| Field | Type | Required | Values / Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | String | Yes (Auto) | Unique string identifier | Unique primary key |
| `title` | String | Yes | Non-empty, max 100 chars | Brief summary of the task |
| `description`| String | No | Text | Detailed explanation |
| `priority` | String | Yes | `"Baja"`, `"Media"`, `"Alta"` | Urgency level |
| `dueDate` | String | Yes | `YYYY-MM-DD` | Target deadline |
| `status` | String | Yes | `"todo"`, `"doing"`, `"done"` | Current column state |
| `createdAt` | String | No | ISO 8601 string | Creation timestamp |

### 2. Comment Entity (`/comments`)
Represents discussion entries attached to a task.

```json
{
  "id": "101",
  "taskId": "1",
  "author": "Ana Gómez",
  "text": "Remember to include hover states for modal action buttons.",
  "createdAt": "2026-09-08T10:30:00Z"
}
```

#### Fields Description
| Field | Type | Required | Values / Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | String | Yes (Auto) | Unique string identifier | Primary key |
| `taskId` | String | Yes | References `tasks.id` | Foreign key linking comment to task |
| `author` | String | Yes | Non-empty, max 50 chars | Display name of the author |
| `text` | String | Yes | Non-empty text | Comment message body |
| `createdAt` | String | Yes | ISO 8601 string | Timestamp of submission |

---

## REST API Endpoints Specification

| Method | Endpoint | Description | Request Body | Success Code |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/tasks` | Retrieve all tasks | None | `200 OK` |
| `GET` | `/tasks/:id` | Retrieve single task by ID | None | `200 OK` / `404 Not Found` |
| `POST` | `/tasks` | Create a new task | Task object without `id` | `201 Created` |
| `PATCH` | `/tasks/:id` | Partial update (status, title, etc.) | Partial fields `{ status: "doing" }` | `200 OK` |
| `PUT` | `/tasks/:id` | Full replacement of task object | Complete task object | `200 OK` |
| `DELETE`| `/tasks/:id` | Remove task permanently | None | `200 OK` |
| `GET` | `/comments?taskId=:id` | Fetch all comments for a specific task | None | `200 OK` |
| `POST` | `/comments` | Add a comment to a task | Comment object without `id` | `201 Created` |
| `DELETE`| `/comments/:id` | Remove an individual comment | None | `200 OK` |

---

## Initial Seed Data Template (`data/data.json`)
```json
{
  "tasks": [
    {
      "id": "1",
      "title": "Diseñar maqueta en Figma",
      "description": "Crear los wireframes y prototipos interactivos del tablero.",
      "priority": "Alta",
      "dueDate": "2026-09-15",
      "status": "todo",
      "createdAt": "2026-09-08T09:00:00Z"
    },
    {
      "id": "2",
      "title": "Configurar json-server",
      "description": "Iniciar la API simulada con las colecciones de tareas y comentarios.",
      "priority": "Media",
      "dueDate": "2026-09-10",
      "status": "doing",
      "createdAt": "2026-09-08T09:30:00Z"
    },
    {
      "id": "3",
      "title": "Estructurar HTML semántico",
      "description": "Definir las columnas principales y la cabecera del tablero con accesibilidad.",
      "priority": "Baja",
      "dueDate": "2026-09-12",
      "status": "done",
      "createdAt": "2026-09-08T10:00:00Z"
    }
  ],
  "comments": [
    {
      "id": "101",
      "taskId": "1",
      "author": "Ana Gómez",
      "text": "Recuerda incluir los estados de hover en los botones del modal.",
      "createdAt": "2026-09-08T10:30:00Z"
    },
    {
      "id": "102",
      "taskId": "1",
      "author": "Carlos Ruiz",
      "text": "Ya subí la paleta de colores al canal de diseño.",
      "createdAt": "2026-09-08T11:15:00Z"
    }
  ]
}
```

