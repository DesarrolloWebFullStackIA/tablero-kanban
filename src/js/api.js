/**
 * Tablero Kanban - REST API Service Module
 * Handles all asynchronous HTTP requests with json-server (localhost:3000)
 */

export const BASE_URL = 'http://localhost:3000';

/**
 * Custom Error class for API network and HTTP response errors
 */
export class ApiError extends Error {
  constructor(message, status = 0, endpoint = '') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.endpoint = endpoint;
  }
}

/**
 * Centralized fetch wrapper with JSON serialization and robust error handling
 * @param {string} endpoint - API endpoint path (e.g. '/tasks')
 * @param {RequestInit} [options={}] - Standard Fetch options
 * @returns {Promise<any>} Parsed JSON response or null
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {}),
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Response body was not JSON, retain default error message
      }
      throw new ApiError(errorMessage, response.status, endpoint);
    }

    // 204 No Content handling
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network connection failure (e.g. json-server offline)
    throw new ApiError(
      `No se pudo conectar con el servidor backend (${BASE_URL}). Asegúrate de haber ejecutado 'start-backend.bat'. Detalle: ${error.message}`,
      0,
      endpoint
    );
  }
}

// --------------------------------------------------------------------------
// Tasks API Endpoints
// --------------------------------------------------------------------------

/**
 * Fetch all tasks from the server
 * @returns {Promise<Array<object>>} List of tasks
 */
export async function getTasks() {
  return await request('/tasks');
}

/**
 * Fetch a single task by its unique ID
 * @param {string|number} id - Task identifier
 * @returns {Promise<object>} Task entity
 */
export async function getTaskById(id) {
  return await request(`/tasks/${id}`);
}

/**
 * Create a new task entity
 * @param {object} taskData - Task payload (title, description, priority, dueDate, status)
 * @returns {Promise<object>} Created task with server-assigned ID
 */
export async function createTask(taskData) {
  const payload = {
    ...taskData,
    status: taskData.status || 'todo',
    createdAt: taskData.createdAt || new Date().toISOString(),
  };
  return await request('/tasks', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Update task fields partially (e.g., status on drag & drop or title/description edits)
 * @param {string|number} id - Task identifier
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated task
 */
export async function updateTask(id, updates) {
  return await request(`/tasks/${id}`, {
    method: 'PATCH',
    body: updates,
  });
}

/**
 * Replace complete task entity
 * @param {string|number} id - Task identifier
 * @param {object} taskData - Full task entity
 * @returns {Promise<object>} Updated task
 */
export async function replaceTask(id, taskData) {
  return await request(`/tasks/${id}`, {
    method: 'PUT',
    body: taskData,
  });
}

/**
 * Delete a task permanently from the database
 * @param {string|number} id - Task identifier
 * @returns {Promise<object|null>}
 */
export async function deleteTask(id) {
  return await request(`/tasks/${id}`, {
    method: 'DELETE',
  });
}

// --------------------------------------------------------------------------
// Comments API Endpoints
// --------------------------------------------------------------------------

/**
 * Fetch all comments associated with a specific task
 * @param {string|number} taskId - Task identifier
 * @returns {Promise<Array<object>>} List of comments
 */
export async function getCommentsByTaskId(taskId) {
  return await request(`/comments?taskId=${taskId}`);
}

/**
 * Create a new comment attached to a task
 * @param {object} commentData - Comment payload (taskId, author, text)
 * @returns {Promise<object>} Created comment
 */
export async function createComment(commentData) {
  const payload = {
    ...commentData,
    createdAt: commentData.createdAt || new Date().toISOString(),
  };
  return await request('/comments', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Delete an individual comment
 * @param {string|number} id - Comment identifier
 * @returns {Promise<object|null>}
 */
export async function deleteComment(id) {
  return await request(`/comments/${id}`, {
    method: 'DELETE',
  });
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
};
