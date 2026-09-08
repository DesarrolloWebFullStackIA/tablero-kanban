/**
 * Tablero Kanban - Central State Store
 * Implements reactive state management and computed metrics with a subscriber pattern
 */

/**
 * @typedef {'todo' | 'doing' | 'done'} TaskStatus
 * @typedef {'Alta' | 'Media' | 'Baja'} TaskPriority
 *
 * @typedef {Object} Task
 * @property {string|number} id
 * @property {string} title
 * @property {string} [description]
 * @property {TaskPriority} priority
 * @property {string} dueDate
 * @property {TaskStatus} status
 * @property {string} [createdAt]
 */

class Store {
  constructor() {
    /** @type {Task[]} */
    this.tasks = [];

    /** @type {Map<string, Array<object>>} */
    this.commentsMap = new Map();

    /** @type {{ query: string, priority: string }} */
    this.filters = {
      query: '',
      priority: 'all',
    };

    /** @type {string|number|null} */
    this.activeTaskId = null;

    /** @type {Set<Function>} */
    this.subscribers = new Set();
  }

  /**
   * Subscribe a listener to state changes
   * @param {Function} callback - Invoked when state changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    if (typeof callback === 'function') {
      this.subscribers.add(callback);
    }
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all registered subscribers
   * @param {string} event - Mutation event name
   * @param {any} [payload] - Event payload
   */
  notify(event, payload = null) {
    for (const callback of this.subscribers) {
      try {
        callback({ event, payload, state: this.getState() });
      } catch (err) {
        console.error('Error in store subscriber:', err);
      }
    }
  }

  /**
   * Get an immutable snapshot of current state
   */
  getState() {
    return {
      tasks: [...this.tasks],
      filters: { ...this.filters },
      metrics: this.getMetrics(),
      activeTaskId: this.activeTaskId,
    };
  }

  // ------------------------------------------------------------------------
  // Task Mutations
  // ------------------------------------------------------------------------

  /**
   * Set entire tasks collection (e.g. initial fetch)
   * @param {Task[]} tasks
   */
  setTasks(tasks) {
    this.tasks = Array.isArray(tasks) ? [...tasks] : [];
    this.notify('TASKS_LOADED', this.tasks);
  }

  /**
   * Get all tasks
   * @returns {Task[]}
   */
  getTasks() {
    return [...this.tasks];
  }

  /**
   * Get a single task by ID
   * @param {string|number} id
   * @returns {Task|undefined}
   */
  getTaskById(id) {
    return this.tasks.find((t) => String(t.id) === String(id));
  }

  /**
   * Add a new task to the store
   * @param {Task} task
   */
  addTask(task) {
    this.tasks.push(task);
    this.notify('TASK_ADDED', task);
  }

  /**
   * Update task fields in-place
   * @param {string|number} id - Task identifier
   * @param {Partial<Task>} updates - Changed properties
   * @returns {Task|null} Updated task or null
   */
  updateTask(id, updates) {
    const index = this.tasks.findIndex((t) => String(t.id) === String(id));
    if (index === -1) return null;

    this.tasks[index] = { ...this.tasks[index], ...updates };
    this.notify('TASK_UPDATED', this.tasks[index]);
    return this.tasks[index];
  }

  /**
   * Move a task to a new status column optimistically
   * @param {string|number} id - Task identifier
   * @param {TaskStatus} newStatus - Destination status
   * @returns {{ task: Task, oldStatus: TaskStatus, newStatus: TaskStatus }|null}
   */
  moveTask(id, newStatus) {
    const index = this.tasks.findIndex((t) => String(t.id) === String(id));
    if (index === -1) return null;

    const oldStatus = this.tasks[index].status;
    if (oldStatus === newStatus) return null;

    this.tasks[index] = { ...this.tasks[index], status: newStatus };
    const movedData = { task: this.tasks[index], oldStatus, newStatus };
    this.notify('TASK_MOVED', movedData);
    return movedData;
  }

  /**
   * Remove a task from the store
   * @param {string|number} id - Task identifier
   * @returns {Task|null} Deleted task or null
   */
  removeTask(id) {
    const index = this.tasks.findIndex((t) => String(t.id) === String(id));
    if (index === -1) return null;

    const [deletedTask] = this.tasks.splice(index, 1);
    this.commentsMap.delete(String(id));
    this.notify('TASK_REMOVED', deletedTask);
    return deletedTask;
  }

  // ------------------------------------------------------------------------
  // Filtering & Computed Metrics
  // ------------------------------------------------------------------------

  /**
   * Set search query filter
   * @param {string} query
   */
  setSearchQuery(query) {
    this.filters.query = (query || '').trim().toLowerCase();
    this.notify('FILTER_CHANGED', this.filters);
  }

  /**
   * Set priority filter ('all' | 'Alta' | 'Media' | 'Baja')
   * @param {string} priority
   */
  setPriorityFilter(priority) {
    this.filters.priority = priority || 'all';
    this.notify('FILTER_CHANGED', this.filters);
  }

  /**
   * Reset all filters to default
   */
  resetFilters() {
    this.filters.query = '';
    this.filters.priority = 'all';
    this.notify('FILTER_CHANGED', this.filters);
  }

  /**
   * Get tasks filtered by current search text and priority
   * @returns {Task[]} Filtered task list
   */
  getFilteredTasks() {
    return this.tasks.filter((task) => {
      // 1. Priority match
      if (this.filters.priority !== 'all' && task.priority !== this.filters.priority) {
        return false;
      }

      // 2. Search query match in title or description
      if (this.filters.query) {
        const titleMatch = (task.title || '').toLowerCase().includes(this.filters.query);
        const descMatch = (task.description || '').toLowerCase().includes(this.filters.query);
        if (!titleMatch && !descMatch) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Compute total and per-column counts for all tasks
   * @returns {{ todo: number, doing: number, done: number, total: number }}
   */
  getMetrics() {
    const metrics = {
      todo: 0,
      doing: 0,
      done: 0,
      total: this.tasks.length,
    };

    for (const task of this.tasks) {
      if (task.status === 'todo') metrics.todo++;
      else if (task.status === 'doing') metrics.doing++;
      else if (task.status === 'done') metrics.done++;
    }

    return metrics;
  }

  // ------------------------------------------------------------------------
  // Comments Cache
  // ------------------------------------------------------------------------

  /**
   * Set comments for a given task ID
   * @param {string|number} taskId
   * @param {Array<object>} comments
   */
  setCommentsForTask(taskId, comments) {
    this.commentsMap.set(String(taskId), Array.isArray(comments) ? [...comments] : []);
    this.notify('COMMENTS_LOADED', { taskId: String(taskId), comments });
  }

  /**
   * Get cached comments for task
   * @param {string|number} taskId
   * @returns {Array<object>}
   */
  getCommentsForTask(taskId) {
    return this.commentsMap.get(String(taskId)) || [];
  }

  /**
   * Add a comment to cache
   * @param {object} comment
   */
  addComment(comment) {
    const taskId = String(comment.taskId);
    const existing = this.commentsMap.get(taskId) || [];
    this.commentsMap.set(taskId, [...existing, comment]);
    this.notify('COMMENT_ADDED', comment);
  }

  // ------------------------------------------------------------------------
  // Active Task Inspection
  // ------------------------------------------------------------------------

  /**
   * Set currently focused task ID for details modal
   * @param {string|number|null} taskId
   */
  setActiveTaskId(taskId) {
    this.activeTaskId = taskId;
    this.notify('ACTIVE_TASK_CHANGED', taskId);
  }

  /**
   * Get currently focused task
   * @returns {Task|null}
   */
  getActiveTask() {
    if (!this.activeTaskId) return null;
    return this.getTaskById(this.activeTaskId) || null;
  }
}

export const store = new Store();
export default store;
