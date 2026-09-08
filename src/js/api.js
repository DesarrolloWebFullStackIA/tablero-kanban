/**
 * Tablero Kanban - Live Demo Mock API Module (GitHub Pages Standalone)
 * Operates 100% in-memory without requiring any backend server or external database.
 * Ideal for public web demos, portfolio showcases, and GitHub Pages hosting.
 */

const INITIAL_TASKS = [
  {
    id: "1",
    title: "Diseñar maqueta en Figma",
    description: "Crear los wireframes y prototipos interactivos del tablero.",
    priority: "Alta",
    dueDate: "2026-09-15",
    status: "todo",
    tags: ["#diseño", "#figma", "#ux"],
    assigneeId: "u3",
    checklist: [
      { id: "c1", text: "Wireframes en baja fidelidad", completed: true },
      { id: "c2", text: "Prototipo interactivo en Stitch", completed: false },
      { id: "c3", text: "Exportar assets a CSS", completed: false }
    ],
    createdAt: "2026-09-08T09:00:00Z"
  },
  {
    id: "2",
    title: "Configurar json-server",
    description: "Iniciar la API simulada con las colecciones de tareas y comentarios.",
    priority: "Media",
    dueDate: "2026-09-10",
    status: "doing",
    tags: ["#backend", "#api", "#mock"],
    assigneeId: "u2",
    checklist: [
      { id: "c4", text: "Crear db.json con datos iniciales", completed: true },
      { id: "c5", text: "Configurar script server en package.json", completed: true }
    ],
    createdAt: "2026-09-08T09:30:00Z"
  },
  {
    id: "3",
    title: "Estructurar HTML semántico",
    description: "Definir las columnas principales y la cabecera del tablero con accesibilidad.",
    priority: "Baja",
    dueDate: "2026-09-12",
    status: "done",
    tags: ["#html5", "#semantica", "#a11y"],
    assigneeId: "u1",
    checklist: [
      { id: "c6", text: "Estructurar elementos <main>, <header>, <section>", completed: true },
      { id: "c7", text: "Agregar atributos ARIA", completed: true }
    ],
    createdAt: "2026-09-08T10:00:00Z"
  },
  {
    id: "4",
    title: "Auditoría de accesibilidad WCAG AA",
    description: "Verificar contrastes de color, navegación por teclado y lectores de pantalla.",
    priority: "Alta",
    dueDate: "2026-09-05",
    status: "todo",
    tags: ["#a11y", "#wcag", "#calidad"],
    assigneeId: "u1",
    checklist: [
      { id: "c8", text: "Comprobar contraste en modo claro y oscuro", completed: false },
      { id: "c9", text: "Navegación completa por teclado (Tab/Enter/Espacio)", completed: false }
    ],
    createdAt: "2026-09-08T10:15:00Z"
  }
];

const INITIAL_COMMENTS = [
  {
    id: "101",
    taskId: "1",
    author: "Ana Gómez",
    text: "Recuerda incluir los estados de hover en los botones del modal.",
    createdAt: "2026-09-06T10:30:00Z"
  },
  {
    id: "102",
    taskId: "1",
    author: "Carlos Ruiz",
    text: "Ya subí la paleta de colores al canal de Figma.",
    createdAt: "2026-09-06T11:15:00Z"
  },
  {
    id: "103",
    taskId: "2",
    author: "Laura Martínez",
    text: "El script start-project.bat funciona correctamente en el puerto 3000.",
    createdAt: "2026-09-07T14:20:00Z"
  }
];

const INITIAL_USERS = [
  {
    id: "u1",
    name: "Ana García",
    email: "ana@example.com",
    role: "Frontend Lead",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana%20Garc%C3%ADa"
  },
  {
    id: "u2",
    name: "Carlos Ruiz",
    email: "carlos@example.com",
    role: "Backend Dev",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos%20Ruiz"
  },
  {
    id: "u3",
    name: "Elena Gómez",
    email: "elena@example.com",
    role: "UI/UX Designer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena%20G%C3%B3mez"
  }
];

// In-memory data collections for live session
let inMemoryTasks = JSON.parse(JSON.stringify(INITIAL_TASKS));
let inMemoryComments = JSON.parse(JSON.stringify(INITIAL_COMMENTS));
let inMemoryUsers = JSON.parse(JSON.stringify(INITIAL_USERS));

export const BASE_URL = 'https://desarrollowebfullstackia.github.io/tablero-kanban';

/**
 * Custom Error class for API response errors
 */
export class ApiError extends Error {
  constructor(message, status = 0, endpoint = '') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.endpoint = endpoint;
  }
}

// --------------------------------------------------------------------------
// Tasks API Endpoints (In-Memory Mock)
// --------------------------------------------------------------------------

/**
 * Fetch all tasks from in-memory collection
 * @returns {Promise<Array<object>>} List of tasks
 */
export async function getTasks() {
  return JSON.parse(JSON.stringify(inMemoryTasks));
}

/**
 * Fetch a single task by its unique ID
 * @param {string|number} id - Task identifier
 * @returns {Promise<object>} Task entity
 */
export async function getTaskById(id) {
  const task = inMemoryTasks.find((t) => String(t.id) === String(id));
  if (!task) {
    throw new ApiError(`Tarea con id ${id} no encontrada`, 404, `/tasks/${id}`);
  }
  return JSON.parse(JSON.stringify(task));
}

/**
 * Create a new task entity in-memory
 * @param {object} taskData - Task payload (title, description, priority, dueDate, status)
 * @returns {Promise<object>} Created task with generated ID
 */
export async function createTask(taskData) {
  const newTask = {
    ...taskData,
    id: String(Date.now()),
    status: taskData.status || 'todo',
    createdAt: taskData.createdAt || new Date().toISOString(),
  };
  inMemoryTasks.push(newTask);
  return JSON.parse(JSON.stringify(newTask));
}

/**
 * Update task fields partially in-memory
 * @param {string|number} id - Task identifier
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated task
 */
export async function updateTask(id, updates) {
  const index = inMemoryTasks.findIndex((t) => String(t.id) === String(id));
  if (index === -1) {
    throw new ApiError(`Tarea con id ${id} no encontrada`, 404, `/tasks/${id}`);
  }
  inMemoryTasks[index] = { ...inMemoryTasks[index], ...updates };
  return JSON.parse(JSON.stringify(inMemoryTasks[index]));
}

/**
 * Replace complete task entity in-memory
 * @param {string|number} id - Task identifier
 * @param {object} taskData - Full task entity
 * @returns {Promise<object>} Updated task
 */
export async function replaceTask(id, taskData) {
  const index = inMemoryTasks.findIndex((t) => String(t.id) === String(id));
  if (index === -1) {
    throw new ApiError(`Tarea con id ${id} no encontrada`, 404, `/tasks/${id}`);
  }
  inMemoryTasks[index] = { ...taskData, id: String(id) };
  return JSON.parse(JSON.stringify(inMemoryTasks[index]));
}

/**
 * Delete a task permanently from in-memory collection
 * @param {string|number} id - Task identifier
 * @returns {Promise<object|null>}
 */
export async function deleteTask(id) {
  const index = inMemoryTasks.findIndex((t) => String(t.id) === String(id));
  if (index === -1) {
    return null;
  }
  const [deleted] = inMemoryTasks.splice(index, 1);
  inMemoryComments = inMemoryComments.filter((c) => String(c.taskId) !== String(id));
  return deleted;
}

// --------------------------------------------------------------------------
// Comments API Endpoints (In-Memory Mock)
// --------------------------------------------------------------------------

/**
 * Fetch all comments associated with a specific task
 * @param {string|number} taskId - Task identifier
 * @returns {Promise<Array<object>>} List of comments
 */
export async function getCommentsByTaskId(taskId) {
  const comments = inMemoryComments.filter((c) => String(c.taskId) === String(taskId));
  return JSON.parse(JSON.stringify(comments));
}

/**
 * Create a new comment attached to a task in-memory
 * @param {object} commentData - Comment payload (taskId, author, text)
 * @returns {Promise<object>} Created comment
 */
export async function createComment(commentData) {
  const newComment = {
    ...commentData,
    id: String(Date.now()),
    createdAt: commentData.createdAt || new Date().toISOString(),
  };
  inMemoryComments.push(newComment);
  return JSON.parse(JSON.stringify(newComment));
}

/**
 * Delete an individual comment from in-memory collection
 * @param {string|number} id - Comment identifier
 * @returns {Promise<object|null>}
 */
export async function deleteComment(id) {
  const index = inMemoryComments.findIndex((c) => String(c.id) === String(id));
  if (index === -1) {
    return null;
  }
  const [deleted] = inMemoryComments.splice(index, 1);
  return deleted;
}

// --------------------------------------------------------------------------
// Users API Endpoints (In-Memory Mock)
// --------------------------------------------------------------------------

/**
 * Fetch all registered users
 * @returns {Promise<Array<object>>}
 */
export async function getUsers() {
  return JSON.parse(JSON.stringify(inMemoryUsers));
}

/**
 * Create a new user (POST /users)
 * @param {object} userData - User payload (name, email, role, avatar)
 * @returns {Promise<object>} Created user
 */
export async function createUser(userData) {
  const newUser = {
    ...userData,
    id: `u_${Date.now()}`,
    avatar:
      userData.avatar ||
      `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(userData.name || 'User')}`,
  };
  inMemoryUsers.push(newUser);
  return JSON.parse(JSON.stringify(newUser));
}

export default {
  BASE_URL,
  ApiError,
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  replaceTask,
  deleteTask,
  getCommentsByTaskId,
  createComment,
  deleteComment,
  getUsers,
  createUser,
};
