import { getTagColorIndex } from './utils.js';
import store from './store.js';

/**
 * Escapes HTML entities to prevent XSS vulnerabilities
 * @param {string} str - Raw string
 * @returns {string} Sanitized string
 */
export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Formats a date string (YYYY-MM-DD or ISO) into a localized readable date
 * @param {string} dateStr - Date string
 * @returns {string} Formatted date (e.g., "15 mar 2026" or "15/03/2026")
 */
export function formatDate(dateStr) {
  if (!dateStr) return 'Sin fecha';
  try {
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return dateStr;

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Determines whether a task is overdue based on its due date and status
 * @param {string} dueDate - Due date string (YYYY-MM-DD)
 * @param {string} status - Current task status ('todo' | 'doing' | 'done')
 * @returns {boolean} True if overdue and not completed
 */
export function isTaskOverdue(dueDate, status) {
  if (!dueDate || status === 'done') return false;

  const [year, month, day] = dueDate.split('T')[0].split('-').map(Number);
  if (!year || !month || !day) return false;

  const targetDate = new Date(year, month - 1, day, 23, 59, 59, 999);
  const now = new Date();
  return targetDate.getTime() < now.getTime();
}

/**
 * Creates a DOM HTMLElement for a single Kanban task card
 * @param {Object} task - Task object
 * @param {number} [commentsCount=0] - Number of comments for this task
 * @returns {HTMLElement} The card element (<article class="kanban-card">)
 */
export function createCardElement(task, commentsCount = 0) {
  const card = document.createElement('article');
  card.className = 'kanban-card';
  card.dataset.id = String(task.id);
  card.tabIndex = 0;
  card.setAttribute('role', 'article');
  card.setAttribute('aria-label', task.title || 'Tarjeta de tarea');

  const overdue = isTaskOverdue(task.dueDate, task.status);
  const formattedDueDate = formatDate(task.dueDate);
  const priority = task.priority || 'Media';

  // SVG Icons
  const trashIcon = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>`;

  const calendarIcon = `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>`;

  const commentsIcon = `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>`;

  const checklistIcon = `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M9 11l3 3L22 4"></path>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
    </svg>`;

  const descHtml = task.description
    ? `<p class="card-desc">${escapeHtml(task.description)}</p>`
    : '';

  const tagsHtml =
    Array.isArray(task.tags) && task.tags.length > 0
      ? `<div class="card-tags">
          ${task.tags
            .map((tag) => {
              const colorIdx = getTagColorIndex(tag, 6);
              return `<button type="button" class="tag-chip tag-chip--color-${colorIdx}" data-tag="${escapeHtml(tag)}" title="Filtrar por ${escapeHtml(tag)}">${escapeHtml(tag)}</button>`;
            })
            .join('')}
        </div>`
      : '';

  let checklistBadgeHtml = '';
  if (Array.isArray(task.checklist) && task.checklist.length > 0) {
    const totalChk = task.checklist.length;
    const completedChk = task.checklist.filter((item) => item.completed).length;
    const allDone = completedChk === totalChk;
    checklistBadgeHtml = `
      <span class="card-checklist-badge ${allDone ? 'is-complete' : ''}" title="${completedChk} de ${totalChk} subtareas completadas">
        ${checklistIcon}
        <span>${completedChk}/${totalChk}</span>
      </span>`;
  }

  let assigneeHtml = '';
  const assignee = task.assignee || (task.assigneeId ? store.getUserById(task.assigneeId) : null);
  if (assignee) {
    const avatarUrl =
      assignee.avatar ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(assignee.name || 'User')}`;
    assigneeHtml = `
      <span class="card-avatar" title="Asignado a: ${escapeHtml(assignee.name || 'Usuario')}">
        <img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(assignee.name || 'Usuario')}" class="card-avatar-img" />
      </span>`;
  }

  const commentsBadgeHtml = commentsCount > 0
    ? `<span class="card-comments-badge" title="${commentsCount} comentario${commentsCount > 1 ? 's' : ''}">
        ${commentsIcon}
        <span>${commentsCount}</span>
       </span>`
    : '';

  card.innerHTML = `
    <header class="card-header">
      <span class="badge-priority badge-priority--${escapeHtml(priority)}">${escapeHtml(priority)}</span>
      <button
        type="button"
        class="btn-card-delete"
        data-id="${escapeHtml(String(task.id))}"
        aria-label="Eliminar tarea: ${escapeHtml(task.title)}"
        title="Eliminar tarea"
      >
        ${trashIcon}
      </button>
    </header>

    <h3 class="card-title">${escapeHtml(task.title)}</h3>
    ${descHtml}
    ${tagsHtml}

    <footer class="card-footer">
      <span
        class="card-due-date ${overdue ? 'is-overdue' : ''}"
        title="${overdue ? 'Tarea vencida' : 'Fecha de entrega: ' + formattedDueDate}"
      >
        ${calendarIcon}
        <span>${formattedDueDate}</span>
      </span>
      <div class="card-footer-indicators">
        ${assigneeHtml}
        ${checklistBadgeHtml}
        ${commentsBadgeHtml}
      </div>
    </footer>
  `;

  return card;
}

/**
 * Renders a list of task cards into a column dropzone container
 * Preserves the empty placeholder element while replacing any prior cards
 * @param {HTMLElement} container - Column dropzone element (e.g. #cards-todo)
 * @param {Array<Object>} tasks - Tasks assigned to this column
 * @param {Map<string, Array<object>>|Function} [getCommentsCount] - Function or comments count lookup
 */
export function renderCards(container, tasks = [], getCommentsCount = null) {
  if (!container) return;

  // Remove existing cards
  const existingCards = container.querySelectorAll('.kanban-card');
  existingCards.forEach((card) => card.remove());

  // Find empty state placeholder
  const emptyState = container.querySelector('.column-empty-state');
  if (emptyState) {
    emptyState.setAttribute('aria-hidden', tasks.length > 0 ? 'true' : 'false');
  }

  // Create fragment and append cards
  const fragment = document.createDocumentFragment();
  for (const task of tasks) {
    let count = 0;
    if (typeof getCommentsCount === 'function') {
      count = getCommentsCount(task.id);
    } else if (getCommentsCount && typeof getCommentsCount.get === 'function') {
      const cached = getCommentsCount.get(String(task.id));
      count = Array.isArray(cached) ? cached.length : 0;
    }
    fragment.appendChild(createCardElement(task, count));
  }

  container.appendChild(fragment);

  // Update corresponding column counter
  const status = container.dataset.status;
  if (status) {
    const counterEl = document.getElementById(`counter-${status}`);
    if (counterEl) {
      counterEl.textContent = String(tasks.length);
      const col = store.getColumnById(status);
      const colTitle = col ? col.title : status;
      counterEl.setAttribute('aria-label', `${tasks.length} tareas en ${colTitle}`);
    }
  }
}

/**
 * Renders all Kanban columns layout and the "+ Añadir Columna" action wrapper into #board-grid
 * @param {Array<{ id: string, title: string, isCustom?: boolean }>} [columns]
 */
export function renderBoardColumns(columns = store.getColumns()) {
  const grid = document.getElementById('board-grid') || document.querySelector('.board-grid');
  if (!grid) return;

  const columnsHtml = columns
    .map((col) => {
      const isDefault = !col.isCustom;
      const indicatorClass = isDefault
        ? `column-indicator--${col.id}`
        : 'column-indicator--custom';

      let emptyIconHtml = `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="9" y1="9" x2="15" y2="9"></line>
          <line x1="9" y1="13" x2="15" y2="13"></line>
          <line x1="9" y1="17" x2="11" y2="17"></line>
        </svg>`;
      let emptyText = 'Sin tareas pendientes';

      if (col.id === 'doing') {
        emptyIconHtml = `
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>`;
        emptyText = 'No hay tareas en progreso';
      } else if (col.id === 'done') {
        emptyIconHtml = `
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>`;
        emptyText = 'No hay tareas completadas aún';
      }

      return `
        <section class="kanban-column kanban-column--${escapeHtml(col.id)} ${col.isCustom ? 'kanban-column--custom' : ''}" id="column-${escapeHtml(col.id)}" data-status="${escapeHtml(col.id)}" aria-labelledby="heading-col-${escapeHtml(col.id)}">
          <header class="column-header">
            <div class="column-title-wrapper" data-column="${escapeHtml(col.id)}">
              <span class="column-indicator ${indicatorClass}" aria-hidden="true"></span>
              <h2 class="column-title" id="heading-col-${escapeHtml(col.id)}" data-column="${escapeHtml(col.id)}" title="Doble clic para editar">${escapeHtml(col.title)}</h2>
              <button
                type="button"
                class="btn-edit-column-title"
                data-column="${escapeHtml(col.id)}"
                aria-label="Editar título de columna ${escapeHtml(col.title)}"
                title="Editar título"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                </svg>
              </button>
              <span class="column-counter" id="counter-${escapeHtml(col.id)}" aria-label="0 tareas en ${escapeHtml(col.title)}">0</span>
            </div>
            <div class="column-header-actions">
              ${
                col.isCustom
                  ? `
              <button
                type="button"
                class="btn-column-delete"
                data-column="${escapeHtml(col.id)}"
                aria-label="Eliminar columna ${escapeHtml(col.title)}"
                title="Eliminar columna"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>`
                  : ''
              }
              <button
                type="button"
                class="btn-column-add"
                data-column="${escapeHtml(col.id)}"
                aria-label="Añadir tarea a ${escapeHtml(col.title)}"
                title="Añadir tarea aquí"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
          </header>

          <div
            class="kanban-cards-list"
            id="cards-${escapeHtml(col.id)}"
            data-status="${escapeHtml(col.id)}"
            role="region"
            aria-label="Lista de tareas ${escapeHtml(col.title)}"
          >
            <!-- Empty Placeholder -->
            <div class="column-empty-state" id="empty-${escapeHtml(col.id)}" aria-hidden="false">
              ${emptyIconHtml}
              <p class="empty-state-text">${emptyText}</p>
            </div>
          </div>
        </section>
      `;
    })
    .join('');

  const addColumnHtml = `
    <!-- Add Column Action Card -->
    <div class="add-column-wrapper" id="add-column-wrapper">
      <button type="button" class="btn-add-column" id="btn-add-column" aria-label="Añadir nueva columna">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>+ Añadir Columna</span>
      </button>
      <form class="add-column-form" id="add-column-form" hidden novalidate>
        <input
          type="text"
          class="form-input add-column-input"
          id="add-column-input"
          placeholder="Título de la columna..."
          maxlength="50"
          autocomplete="off"
          aria-label="Título de la nueva columna"
        />
        <div class="add-column-actions">
          <button type="submit" class="btn btn--primary btn--sm" id="btn-confirm-add-column">
            Añadir Columna
          </button>
          <button type="button" class="btn btn--secondary btn--sm btn-cancel-add-column" id="btn-cancel-add-column" aria-label="Cancelar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </form>
    </div>
  `;

  grid.innerHTML = columnsHtml + addColumnHtml;
}

/**
 * Renders all active Kanban columns from a complete or filtered tasks array
 * @param {Array<Object>} tasks - Complete or filtered tasks
 * @param {Map<string, Array<object>>|Function} [getCommentsCount] - Comments count provider
 */
export function renderBoard(tasks = [], getCommentsCount = null) {
  const allColumns = store.getColumns();
  const columnTasksMap = Object.create(null);

  for (const col of allColumns) {
    columnTasksMap[col.id] = [];
  }

  for (const task of tasks) {
    const statusKey = String(task.status);
    if (Array.isArray(columnTasksMap[statusKey])) {
      columnTasksMap[statusKey].push(task);
    } else {
      // Default fallback if status is missing or invalid
      if (Array.isArray(columnTasksMap.todo)) {
        columnTasksMap.todo.push(task);
      } else if (allColumns[0] && Array.isArray(columnTasksMap[allColumns[0].id])) {
        columnTasksMap[allColumns[0].id].push(task);
      }
    }
  }

  for (const col of allColumns) {
    const container = document.getElementById(`cards-${col.id}`);
    if (container) {
      renderCards(container, columnTasksMap[col.id] || [], getCommentsCount);
    }
  }
}

/**
 * Updates the header statistics dashboard metrics and column indicators
 * @param {{ todo: number, doing: number, done: number, total: number }} metrics
 */
export function updateMetricsUI(metrics) {
  if (!metrics) return;

  const todoVal = document.getElementById('metric-todo-count');
  const doingVal = document.getElementById('metric-doing-count');
  const doneVal = document.getElementById('metric-done-count');
  const totalVal = document.getElementById('metric-total-count');

  if (todoVal) todoVal.textContent = String(metrics.todo ?? 0);
  if (doingVal) doingVal.textContent = String(metrics.doing ?? 0);
  if (doneVal) doneVal.textContent = String(metrics.done ?? 0);
  if (totalVal) totalVal.textContent = String(metrics.total ?? 0);
}

/**
 * Updates an individual column counter element and empty state visibility
 * @param {string} status - Column status
 * @param {number} [count=null] - Optional explicit count; if null, counts .kanban-card in DOM
 */
export function updateColumnState(status, count = null) {
  const container = document.getElementById(`cards-${status}`);
  const counter = document.getElementById(`counter-${status}`);
  if (!container) return;

  const cards = container.querySelectorAll('.kanban-card');
  const actualCount = count !== null ? count : cards.length;

  if (counter) {
    counter.textContent = String(actualCount);
    const col = store.getColumnById(status);
    const colTitle = col ? col.title : status;
    counter.setAttribute('aria-label', `${actualCount} tareas en ${colTitle}`);
  }

  const emptyState = container.querySelector('.column-empty-state');
  if (emptyState) {
    emptyState.setAttribute('aria-hidden', actualCount > 0 ? 'true' : 'false');
  }
}

/**
 * Formats a comment timestamp into localized Spanish date and time
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date and time
 */
export function formatCommentDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Renders a list of comments into the task detail comments feed
 * @param {HTMLElement} container - Comments list container (#detail-comments-list)
 * @param {Array<Object>} comments - Array of comment objects
 * @param {HTMLElement} [countEl] - Comments count badge (#detail-comments-count)
 */
export function renderComments(container, comments = [], countEl = null) {
  if (!container) return;
  container.innerHTML = '';

  if (countEl) {
    countEl.textContent = `(${comments.length})`;
  }

  if (!comments || comments.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-comments-text';
    empty.style.color = 'var(--color-text-subtle)';
    empty.style.fontSize = 'var(--font-size-xs)';
    empty.style.fontStyle = 'italic';
    empty.textContent = 'No hay comentarios todavía. ¡Sé el primero en comentar!';
    container.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const c of comments) {
    const item = document.createElement('div');
    item.className = 'comment-item';
    item.dataset.commentId = String(c.id);

    const formattedDate = formatCommentDate(c.createdAt);

    item.innerHTML = `
      <div class="comment-header">
        <div class="comment-header-meta">
          <span class="comment-author">${escapeHtml(c.author || 'Anónimo')}</span>
          <span class="comment-date">${escapeHtml(formattedDate)}</span>
        </div>
        <button
          type="button"
          class="btn-comment-delete"
          data-comment-id="${escapeHtml(String(c.id))}"
          aria-label="Eliminar comentario"
          title="Eliminar comentario"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
      <p class="comment-text">${escapeHtml(c.text || '')}</p>
    `;

    fragment.appendChild(item);
  }

  container.appendChild(fragment);
}

/**
 * Updates the comment counter badge on a specific task card in the board
 * @param {string|number} taskId - Task identifier
 * @param {number} count - New comment count
 */
export function updateCardCommentsCount(taskId, count) {
  const card = document.querySelector(`.kanban-card[data-id="${taskId}"]`);
  if (!card) return;
  const commentsBadge = card.querySelector('.card-comments-badge, .card-meta-comments');
  if (commentsBadge) {
    commentsBadge.title = `${count} comentario${count > 1 ? 's' : ''}`;
    const countSpan = commentsBadge.querySelector('span');
    if (countSpan) {
      countSpan.textContent = String(count);
    }
  }
}

/**
 * Updates the checklist badge on a specific task card in the board
 * @param {string|number} taskId - Task identifier
 * @param {Array<{ id: string, text: string, completed: boolean }>} [checklist=[]]
 */
export function updateCardChecklistBadge(taskId, checklist = []) {
  const card = document.querySelector(`.kanban-card[data-id="${taskId}"]`);
  if (!card) return;

  const indicators = card.querySelector('.card-footer-indicators');
  let badge = card.querySelector('.card-checklist-badge');

  if (!checklist || checklist.length === 0) {
    if (badge) badge.remove();
    return;
  }

  const total = checklist.length;
  const completed = checklist.filter((item) => item.completed).length;
  const allDone = completed === total;

  if (!badge && indicators) {
    badge = document.createElement('span');
    indicators.prepend(badge);
  }

  if (badge) {
    badge.className = `card-checklist-badge ${allDone ? 'is-complete' : ''}`;
    badge.title = `${completed} de ${total} subtareas completadas`;
    badge.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M9 11l3 3L22 4"></path>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
      </svg>
      <span>${completed}/${total}</span>
    `;
  }
}
