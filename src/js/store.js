/**
 * Tablero Kanban - Central State Store
 * Implements reactive state management and computed metrics with a subscriber pattern
 */

/**
 * @typedef {string} TaskStatus
 * @typedef {'Alta' | 'Media' | 'Baja'} TaskPriority
 *
 * @typedef {Object} Column
 * @property {string} id
 * @property {string} title
 * @property {boolean} [isCustom]
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

export const DEFAULT_COLUMNS = [
  { id: 'todo', title: 'Por Hacer', isCustom: false },
  { id: 'doing', title: 'En Proceso', isCustom: false },
  { id: 'done', title: 'Finalizado', isCustom: false },
];

class Store {
  constructor() {
    /** @type {Task[]} */
    this.tasks = [];

    /** @type {Array<object>} */
    this.users = [];

    /** @type {Column[]} */
    this.columns = this.loadStoredColumns();

    /** @type {Map<string, Array<object>>} */
    this.commentsMap = new Map();

    /** @type {{ query: string, priority: string, tag: string }} */
    this.filters = {
      query: '',
      priority: 'all',
      tag: 'all',
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
      users: [...this.users],
      columns: [...this.columns],
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
   * Set tag filter ('all' | '#tag')
   * @param {string} tag
   */
  setTagFilter(tag) {
    this.filters.tag = (tag || 'all').trim();
    this.notify('FILTER_CHANGED', this.filters);
  }

  /**
   * Reset all filters to default
   */
  resetFilters() {
    this.filters.query = '';
    this.filters.priority = 'all';
    this.filters.tag = 'all';
    this.notify('FILTER_CHANGED', this.filters);
  }

  /**
   * Get all unique hashtags across all stored tasks sorted alphabetically
   * @returns {string[]}
   */
  getAllTags() {
    const tagSet = new Set();
    for (const task of this.tasks) {
      if (Array.isArray(task.tags)) {
        for (const tag of task.tags) {
          if (tag) tagSet.add(tag);
        }
      }
    }
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }

  /**
   * Get tasks filtered by current search text, priority, and tag
   * @returns {Task[]} Filtered task list
   */
  getFilteredTasks() {
    return this.tasks.filter((task) => {
      // 1. Priority match
      if (this.filters.priority !== 'all' && task.priority !== this.filters.priority) {
        return false;
      }

      // 2. Tag filter match
      if (this.filters.tag !== 'all') {
        if (!Array.isArray(task.tags) || !task.tags.includes(this.filters.tag)) {
          return false;
        }
      }

      // 3. Search query match in title, description, or tags
      if (this.filters.query) {
        const titleMatch = (task.title || '').toLowerCase().includes(this.filters.query);
        const descMatch = (task.description || '').toLowerCase().includes(this.filters.query);
        const tagMatch =
          Array.isArray(task.tags) &&
          task.tags.some((t) => t.toLowerCase().includes(this.filters.query));
        if (!titleMatch && !descMatch && !tagMatch) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Compute total and per-column counts for all tasks
   * @returns {{ todo: number, doing: number, done: number, total: number, [key: string]: number }}
   */
  getMetrics() {
    const metrics = {
      todo: 0,
      doing: 0,
      done: 0,
      total: this.tasks.length,
    };

    if (Array.isArray(this.columns)) {
      for (const col of this.columns) {
        if (!Object.prototype.hasOwnProperty.call(metrics, col.id)) {
          metrics[col.id] = 0;
        }
      }
    }

    for (const task of this.tasks) {
      const statusKey = String(task.status);
      if (Object.prototype.hasOwnProperty.call(metrics, statusKey)) {
        metrics[statusKey]++;
      } else {
        metrics[statusKey] = 1;
      }
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

  /**
   * Remove a comment from cache
   * @param {string|number} commentId
   * @param {string|number} taskId
   * @returns {object|null} Deleted comment or null
   */
  removeComment(commentId, taskId) {
    const tId = String(taskId);
    const existing = this.commentsMap.get(tId) || [];
    const index = existing.findIndex((c) => String(c.id) === String(commentId));
    if (index === -1) return null;

    const [removed] = existing.splice(index, 1);
    this.commentsMap.set(tId, existing);
    this.notify('COMMENT_REMOVED', { commentId: String(commentId), taskId: tId, comment: removed });
    return removed;
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

  // ------------------------------------------------------------------------
  // User Management
  // ------------------------------------------------------------------------

  /**
   * Set entire users collection
   * @param {Array<object>} users
   */
  setUsers(users) {
    this.users = Array.isArray(users) ? [...users] : [];
    this.notify('USERS_LOADED', this.users);
  }

  /**
   * Get all registered users
   * @returns {Array<object>}
   */
  getUsers() {
    return [...this.users];
  }

  /**
   * Find a user by their ID
   * @param {string|number} id
   * @returns {object|undefined}
   */
  getUserById(id) {
    if (!id) return undefined;
    return this.users.find((u) => String(u.id) === String(id));
  }

  /**
   * Add a new user to store
   * @param {object} user
   */
  addUser(user) {
    this.users.push(user);
    this.notify('USER_ADDED', user);
  }

  // ------------------------------------------------------------------------
  // Column Management & State Persistence
  // ------------------------------------------------------------------------

  /**
   * Load persisted column schema from localStorage or fallback to defaults
   * @returns {Column[]}
   */
  loadStoredColumns() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('kanban_columns');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Validate that every entry is a valid column object
            const validColumns = parsed.filter(
              (c) =>
                c &&
                typeof c === 'object' &&
                typeof c.id === 'string' &&
                c.id.trim() &&
                typeof c.title === 'string' &&
                c.title.trim()
            );

            // Ensure the 3 default columns exist
            const hasTodo = validColumns.some((c) => c.id === 'todo');
            const hasDoing = validColumns.some((c) => c.id === 'doing');
            const hasDone = validColumns.some((c) => c.id === 'done');

            if (hasTodo && hasDoing && hasDone) {
              validColumns.forEach((c) => {
                if (DEFAULT_COLUMNS.some((def) => def.id === c.id)) {
                  c.isCustom = false;
                }
              });
              return validColumns;
            }
          }
        }
      }
    } catch (err) {
      console.warn('Could not load columns from localStorage:', err);
    }
    return DEFAULT_COLUMNS.map((col) => ({ ...col }));
  }

  /**
   * Persist current column schema to localStorage
   */
  saveStoredColumns() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('kanban_columns', JSON.stringify(this.columns));
      }
    } catch (err) {
      console.warn('Could not save columns to localStorage:', err);
    }
  }

  /**
   * Get all active Kanban columns
   * @returns {Column[]}
   */
  getColumns() {
    return [...this.columns];
  }

  /**
   * Find a column by its ID
   * @param {string} id
   * @returns {Column|undefined}
   */
  getColumnById(id) {
    if (!id) return undefined;
    return this.columns.find((c) => String(c.id) === String(id));
  }

  /**
   * Set columns collection and persist
   * @param {Column[]} columns
   */
  setColumns(columns) {
    let inputColumns = Array.isArray(columns) && columns.length > 0
      ? columns.map((c) => ({ ...c }))
      : DEFAULT_COLUMNS.map((c) => ({ ...c }));

    // Ensure the 3 default columns are always present and in canonical order
    const result = [];
    for (const defCol of DEFAULT_COLUMNS) {
      const existing = inputColumns.find((c) => String(c.id) === defCol.id);
      if (existing) {
        existing.isCustom = false;
        result.push(existing);
      } else {
        result.push({ ...defCol });
      }
    }

    // Append any custom columns in their specified order
    for (const col of inputColumns) {
      if (!DEFAULT_COLUMNS.some((def) => def.id === String(col.id))) {
        result.push({ ...col, isCustom: true });
      }
    }

    this.columns = result;
    this.saveStoredColumns();
    this.notify('COLUMNS_LOADED', this.columns);
  }

  /**
   * Add a new column to the store and persist
   * @param {string|{ id?: string, title: string, isCustom?: boolean }} columnOrTitle
   * @returns {Column}
   */
  addColumn(columnOrTitle) {
    let title = '';
    let id = '';
    let isCustom = true;

    if (typeof columnOrTitle === 'string') {
      title = columnOrTitle.trim();
    } else if (columnOrTitle && typeof columnOrTitle === 'object') {
      title = (columnOrTitle.title || '').trim();
      id = (columnOrTitle.id || '').trim();
      if (columnOrTitle.isCustom !== undefined) {
        isCustom = Boolean(columnOrTitle.isCustom);
      }
    }

    if (!title) {
      title = 'Nueva Columna';
    }

    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'col';

    const reservedIds = [
      '__proto__',
      'constructor',
      'prototype',
      'valueof',
      'tostring',
      'hasownproperty',
      'isprototypeof',
      'propertyisenumerable',
      'tolocalestring',
    ];
    let safeSlug = slug;
    if (reservedIds.includes(safeSlug)) {
      safeSlug = `col-${safeSlug}`;
    }

    if (!id) {
      let candidateId = safeSlug;
      let counter = 1;
      while (this.columns.some((c) => String(c.id) === candidateId)) {
        candidateId = `${safeSlug}-${counter++}`;
      }
      id = candidateId;
    } else {
      // Sanitize explicitly provided ID to valid HTML/DOM alphanumeric format
      id = id
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '') || safeSlug;

      if (reservedIds.includes(id)) {
        id = `col-${id}`;
      }

      if (this.columns.some((c) => String(c.id) === id)) {
        let counter = 1;
        let candidateId = `${id}-${counter}`;
        while (this.columns.some((c) => String(c.id) === candidateId)) {
          candidateId = `${id}-${++counter}`;
        }
        id = candidateId;
      }
    }

    // Enforce invariant: non-default columns are always custom
    isCustom = !DEFAULT_COLUMNS.some((def) => def.id === id);

    const newColumn = {
      id,
      title,
      isCustom,
    };

    this.columns.push(newColumn);
    this.saveStoredColumns();
    this.notify('COLUMN_ADDED', newColumn);
    return newColumn;
  }

  /**
   * Rename a column by ID
   * @param {string} id
   * @param {string} newTitle
   * @returns {Column|null}
   */
  renameColumn(id, newTitle) {
    const trimmedTitle = (newTitle || '').trim();
    if (!trimmedTitle) return null;

    const column = this.columns.find((c) => String(c.id) === String(id));
    if (!column) return null;

    column.title = trimmedTitle;
    this.saveStoredColumns();
    const updated = { ...column };
    this.notify('COLUMN_RENAMED', { id: String(id), title: trimmedTitle, column: updated });
    return updated;
  }

  /**
   * Remove a custom column safely. Moves any tasks in this column back to 'todo'.
   * Non-custom default columns cannot be removed.
   * @param {string} id
   * @returns {Column|null} Removed column or null
   */
  removeColumn(id) {
    const colId = String(id);
    const index = this.columns.findIndex((c) => String(c.id) === colId);
    if (index === -1) return null;

    const column = this.columns[index];
    if (!column.isCustom) {
      return null;
    }

    // Safely migrate tasks back to 'todo'
    const movedTasks = [];
    for (const task of this.tasks) {
      if (String(task.status) === colId) {
        task.status = 'todo';
        movedTasks.push(task);
      }
    }

    const [removed] = this.columns.splice(index, 1);
    this.saveStoredColumns();
    this.notify('COLUMN_REMOVED', {
      id: colId,
      column: removed,
      movedTasks,
    });
    return removed;
  }

  /**
   * Reset columns back to defaults
   */
  resetColumns() {
    this.columns = DEFAULT_COLUMNS.map((col) => ({ ...col }));
    this.saveStoredColumns();
  }
}

export const store = new Store();
export default store;
