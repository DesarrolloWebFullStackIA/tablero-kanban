/**
 * Tablero Kanban - Main Application Entry Point
 * Orchestrates initialization, state store, UI updates, and theme handling
 */

import api from './api.js';
import store from './store.js';
import {
  renderBoard,
  renderBoardColumns,
  updateMetricsUI,
  updateColumnState,
  isTaskOverdue,
  formatDate,
  updateCardCommentsCount,
} from './ui.js';
import { showToast, debounce } from './utils.js';
import {
  initCreateTaskModal,
  initTaskDeletion,
  initTaskDetailModal,
  initUserModal,
  populateAssigneeDropdowns,
  populateColumnStatusDropdowns,
} from './modal.js';
import { initDragAndDrop, destroyDragAndDrop } from './dragdrop.js';

/**
 * 1. Theme Management (Light / Dark mode)
 */
function initTheme() {
  const themeToggleBtn = document.getElementById('theme-toggle');
  const storedTheme = localStorage.getItem('kanban_theme');
  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light');

  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('kanban_theme', theme);
    if (themeToggleBtn) {
      const isDark = theme === 'dark';
      themeToggleBtn.setAttribute(
        'aria-label',
        isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
      );
      themeToggleBtn.setAttribute(
        'title',
        isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
      );
    }
  };

  applyTheme(initialTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
    });
  }

  // Listen to OS theme changes if user hasn't set an explicit preference
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('kanban_theme')) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
}

/**
 * 2. Mobile Navigation Drawer Handling
 */
function initMobileNav() {
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mobileNav = document.getElementById('mobile-nav');
  const mobileBackdrop = document.getElementById('mobile-nav-backdrop');
  const closeNavBtn = document.getElementById('btn-close-mobile-nav');

  if (!hamburgerBtn || !mobileNav || !mobileBackdrop) return;

  const openDrawer = () => {
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    mobileNav.removeAttribute('hidden');
    mobileBackdrop.classList.add('active');
    mobileBackdrop.setAttribute('aria-hidden', 'false');
  };

  const closeDrawer = () => {
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    mobileNav.setAttribute('hidden', '');
    mobileBackdrop.classList.remove('active');
    mobileBackdrop.setAttribute('aria-hidden', 'true');
  };

  hamburgerBtn.addEventListener('click', () => {
    const isExpanded = hamburgerBtn.getAttribute('aria-expanded') === 'true';
    if (isExpanded) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  if (closeNavBtn) {
    closeNavBtn.addEventListener('click', closeDrawer);
  }

  mobileBackdrop.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && hamburgerBtn.getAttribute('aria-expanded') === 'true') {
      closeDrawer();
    }
  });

  // Close drawer when mobile navigation links are clicked
  const mobileLinks = mobileNav.querySelectorAll('a');
  mobileLinks.forEach((link) => {
    link.addEventListener('click', closeDrawer);
  });
}

/**
 * 3. Search & Filter Controls Handling
 */
function initFilters() {
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('btn-clear-search');
  const prioritySelect = document.getElementById('filter-priority');
  const tagSelect = document.getElementById('filter-tag');
  const resetFiltersBtn = document.getElementById('btn-reset-filters');

  // Update reset button visual active state
  const updateResetButtonState = () => {
    const hasActiveFilters = Boolean(
      (searchInput && searchInput.value.trim().length > 0) ||
      (prioritySelect && prioritySelect.value !== 'all') ||
      (tagSelect && tagSelect.value !== 'all')
    );
    if (resetFiltersBtn) {
      resetFiltersBtn.classList.toggle('btn-reset--active', hasActiveFilters);
    }
  };

  // Debounced real-time search update to avoid UI re-render bottleneck on fast typing
  const debouncedSetSearch = debounce((query) => {
    store.setSearchQuery(query);
  }, 200);

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      if (clearSearchBtn) {
        if (query.trim().length > 0) {
          clearSearchBtn.removeAttribute('hidden');
        } else {
          clearSearchBtn.setAttribute('hidden', '');
        }
      }
      updateResetButtonState();
      debouncedSetSearch(query);
    });

    // Keyboard accessibility: Escape clears the search input
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && searchInput.value) {
        searchInput.value = '';
        if (clearSearchBtn) clearSearchBtn.setAttribute('hidden', '');
        updateResetButtonState();
        store.setSearchQuery('');
      }
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      clearSearchBtn.setAttribute('hidden', '');
      updateResetButtonState();
      store.setSearchQuery('');
    });
  }

  if (prioritySelect) {
    prioritySelect.addEventListener('change', (e) => {
      updateResetButtonState();
      store.setPriorityFilter(e.target.value);
    });
  }

  if (tagSelect) {
    tagSelect.addEventListener('change', (e) => {
      updateResetButtonState();
      store.setTagFilter(e.target.value);
    });
  }

  // Clicking a tag chip on a card filters the board by that tag
  document.addEventListener('click', (e) => {
    const tagChip = e.target.closest('.tag-chip');
    if (tagChip && tagChip.dataset.tag) {
      const tag = tagChip.dataset.tag;
      if (tagSelect) {
        tagSelect.value = tag;
      }
      store.setTagFilter(tag);
      updateResetButtonState();
    }
  });

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
      }
      if (clearSearchBtn) {
        clearSearchBtn.setAttribute('hidden', '');
      }
      if (prioritySelect) {
        prioritySelect.value = 'all';
      }
      if (tagSelect) {
        tagSelect.value = 'all';
      }
      updateResetButtonState();
      store.resetFilters();
    });
  }
}

/**
 * Populates and refreshes the tag filter select options based on store tags
 */
export function updateTagFilterOptions() {
  const tagSelect = document.getElementById('filter-tag');
  if (!tagSelect) return;

  const currentTag = store.filters.tag || 'all';
  const tags = store.getAllTags();

  tagSelect.innerHTML = '<option value="all">Todas las etiquetas</option>';
  tags.forEach((tag) => {
    const option = document.createElement('option');
    option.value = tag;
    option.textContent = tag;
    if (tag === currentTag) {
      option.selected = true;
    }
    tagSelect.appendChild(option);
  });

  if (currentTag !== 'all' && !tags.includes(currentTag)) {
    store.setTagFilter('all');
    tagSelect.value = 'all';
  }
}

/**
 * 4. Column Management (Creation, Inline Renaming & Safe Deletion)
 */
function initColumnManagement() {
  const boardContainer = document.getElementById('board-container');
  if (!boardContainer) return;

  const showAddColumnForm = () => {
    const btn = document.getElementById('btn-add-column');
    const form = document.getElementById('add-column-form');
    const input = document.getElementById('add-column-input');
    if (btn && form) {
      btn.setAttribute('hidden', '');
      form.removeAttribute('hidden');
      if (input) {
        input.value = '';
        input.focus();
      }
    }
  };

  const hideAddColumnForm = () => {
    const btn = document.getElementById('btn-add-column');
    const form = document.getElementById('add-column-form');
    const input = document.getElementById('add-column-input');
    if (btn && form) {
      form.setAttribute('hidden', '');
      btn.removeAttribute('hidden');
      if (input) input.value = '';
      btn.focus();
    }
  };

  boardContainer.addEventListener('click', (e) => {
    if (e.target.closest('#btn-add-column')) {
      showAddColumnForm();
      return;
    }

    if (e.target.closest('#btn-cancel-add-column')) {
      hideAddColumnForm();
      return;
    }
  });

  document.addEventListener('click', (e) => {
    const wrapper = document.getElementById('add-column-wrapper');
    const form = document.getElementById('add-column-form');
    if (wrapper && form && !form.hasAttribute('hidden')) {
      if (!wrapper.contains(e.target)) {
        hideAddColumnForm();
      }
    }
  });

  boardContainer.addEventListener('submit', (e) => {
    const form = e.target.closest('#add-column-form');
    if (form) {
      e.preventDefault();
      const input = document.getElementById('add-column-input');
      const title = (input?.value || '').trim();
      if (!title) {
        showToast('Por favor, indica un título para la columna.', 'warning');
        input?.focus();
        return;
      }

      const newCol = store.addColumn(title);
      hideAddColumnForm();
      showToast(`Columna "${newCol.title}" creada correctamente`, 'success');
    }
  });

  boardContainer.addEventListener('keydown', (e) => {
    const input = e.target.closest('#add-column-input');
    if (input && e.key === 'Escape') {
      e.preventDefault();
      hideAddColumnForm();
    }
  });

  const startEditingColumnTitle = (colId) => {
    if (!colId) return;
    const titleEl = document.getElementById(`heading-col-${colId}`);
    if (!titleEl || titleEl.dataset.isEditing === 'true') return;

    const currentTitle = titleEl.textContent.trim();
    titleEl.dataset.isEditing = 'true';
    titleEl.style.display = 'none';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'column-title-input';
    input.value = currentTitle;
    input.maxLength = 50;
    input.setAttribute('aria-label', `Editar título de la columna ${currentTitle}`);

    titleEl.parentNode.insertBefore(input, titleEl.nextSibling);
    input.focus();
    input.select();

    let committed = false;
    const finishEdit = (shouldSave) => {
      if (committed) return;
      committed = true;
      const newTitle = input.value.trim();
      input.remove();
      titleEl.style.display = '';
      delete titleEl.dataset.isEditing;

      if (shouldSave && newTitle && newTitle !== currentTitle) {
        const updated = store.renameColumn(colId, newTitle);
        if (updated) {
          titleEl.textContent = updated.title;
          showToast(`Columna renombrada a "${updated.title}"`, 'success', 2000);
        }
      }

      // Restore keyboard focus for accessibility
      const editBtn = document.querySelector(`.btn-edit-column-title[data-column="${colId}"]`);
      if (editBtn) {
        editBtn.focus();
      }
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finishEdit(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        finishEdit(false);
      }
    });

    input.addEventListener('blur', () => {
      finishEdit(true);
    });
  };

  boardContainer.addEventListener('dblclick', (e) => {
    const titleTarget = e.target.closest('.column-title') || e.target.closest('.column-title-wrapper');
    if (titleTarget && !e.target.closest('.btn-edit-column-title') && !e.target.closest('.column-counter')) {
      const colId = titleTarget.dataset.column || titleTarget.id.replace('heading-col-', '');
      startEditingColumnTitle(colId);
    }
  });

  boardContainer.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.btn-edit-column-title');
    if (editBtn) {
      const colId = editBtn.dataset.column;
      startEditingColumnTitle(colId);
      return;
    }

    const deleteBtn = e.target.closest('.btn-column-delete');
    if (deleteBtn) {
      const colId = deleteBtn.dataset.column;
      const col = store.getColumnById(colId);
      if (!col || !col.isCustom) return;

      const tasksInCol = store.getTasks().filter((t) => String(t.status) === String(colId));
      const confirmMsg =
        tasksInCol.length > 0
          ? `¿Estás seguro de que deseas eliminar la columna "${col.title}"?\nLas ${tasksInCol.length} tarea(s) contenida(s) se moverán a "Por Hacer".`
          : `¿Estás seguro de que deseas eliminar la columna "${col.title}"?`;

      if (!window.confirm(confirmMsg)) return;

      const removed = store.removeColumn(colId);

      if (tasksInCol.length > 0) {
        Promise.all(
          tasksInCol.map((task) =>
            api.updateTask(task.id, { status: 'todo' }).catch((err) => {
              console.error(`Error al sincronizar migración de tarea ${task.id}:`, err);
            })
          )
        );
      }

      showToast(`Columna "${removed?.title || col.title}" eliminada`, 'info');
    }
  });
}

/**
 * 5. App Initializer & State Wire-up
 */
export async function initApp() {
  initTheme();
  initMobileNav();
  initFilters();
  initCreateTaskModal();
  initTaskDeletion();
  initTaskDetailModal();
  initUserModal();
  renderBoardColumns(store.getColumns());
  initColumnManagement();
  populateColumnStatusDropdowns();

  // Initialize Drag and Drop between columns with optimistic UI & rollback
  initDragAndDrop(async (payload) => {
    if (!payload || !payload.hasPositionChanged) return;

    if (payload.isCrossColumn) {
      // 1. Optimistic UI update in store (triggers subscriber to recount & update metrics)
      store.moveTask(payload.taskId, payload.toStatus);

      // 2. Persist to server via PATCH /tasks/:id
      try {
        await api.updateTask(payload.taskId, { status: payload.toStatus });
      } catch (err) {
        console.error('Error al sincronizar movimiento de tarea con el servidor:', err);

        // 3. Rollback in store
        store.moveTask(payload.taskId, payload.fromStatus);

        // 4. Rollback in DOM: restore card to its original column and index
        if (payload.item && payload.fromContainer) {
          const cardsInFrom = Array.from(
            payload.fromContainer.querySelectorAll('.kanban-card')
          ).filter((c) => c !== payload.item);

          if (cardsInFrom[payload.oldIndex]) {
            payload.fromContainer.insertBefore(payload.item, cardsInFrom[payload.oldIndex]);
          } else {
            payload.fromContainer.appendChild(payload.item);
          }
        }

        // 5. Update column counters and empty states
        updateColumnState(payload.fromStatus);
        updateColumnState(payload.toStatus);

        // 6. Alert user of synchronization failure
        showToast(
          'Error de conexión con el servidor. Se canceló y revirtió el movimiento de la tarea.',
          'error',
          5000
        );
      }
    }
  });

  // Reactive UI update whenever state changes
  store.subscribe(({ event, payload, state }) => {
    if (event === 'TASK_MOVED' && payload) {
      const cardEl = document.querySelector(`.kanban-card[data-id="${payload.task.id}"]`);
      if (cardEl) {
        // If card is not yet in the target container (e.g. moved via modal status select or direct call)
        const targetContainer = document.getElementById(`cards-${payload.newStatus}`);
        if (targetContainer && cardEl.parentElement !== targetContainer) {
          targetContainer.appendChild(cardEl);
        }

        // Update overdue styling if status changed to/from 'done'
        const dueDateBadge = cardEl.querySelector('.card-due-date');
        if (dueDateBadge) {
          const overdue = isTaskOverdue(payload.task.dueDate, payload.newStatus);
          dueDateBadge.classList.toggle('is-overdue', overdue);
          dueDateBadge.title = overdue
            ? 'Tarea vencida'
            : 'Fecha de entrega: ' + formatDate(payload.task.dueDate);
        }
      }

      updateMetricsUI(state.metrics);
      updateColumnState(payload.oldStatus);
      updateColumnState(payload.newStatus);
      return;
    }

    if (
      event === 'COLUMN_ADDED' ||
      event === 'COLUMN_REMOVED' ||
      event === 'COLUMNS_LOADED'
    ) {
      destroyDragAndDrop();
      renderBoardColumns(state.columns);
      initDragAndDrop();
      populateColumnStatusDropdowns();
      const filteredTasks = store.getFilteredTasks();
      renderBoard(filteredTasks, (taskId) => store.getCommentsForTask(taskId).length);
      updateMetricsUI(state.metrics);
      return;
    }

    if (event === 'COLUMN_RENAMED' && payload) {
      const heading = document.getElementById(`heading-col-${payload.id}`);
      if (heading) {
        heading.textContent = payload.title;
      }
      const editBtn = document.querySelector(`.btn-edit-column-title[data-column="${payload.id}"]`);
      if (editBtn) {
        editBtn.setAttribute('aria-label', `Editar título de columna ${payload.title}`);
      }
      const deleteBtn = document.querySelector(`.btn-column-delete[data-column="${payload.id}"]`);
      if (deleteBtn) {
        deleteBtn.setAttribute('aria-label', `Eliminar columna ${payload.title}`);
      }
      const addBtn = document.querySelector(`.btn-column-add[data-column="${payload.id}"]`);
      if (addBtn) {
        addBtn.setAttribute('aria-label', `Añadir tarea a ${payload.title}`);
      }
      const cardsList = document.getElementById(`cards-${payload.id}`);
      if (cardsList) {
        cardsList.setAttribute('aria-label', `Lista de tareas ${payload.title}`);
      }

      // Synchronize task detail badge if detail dialog is open for a task in this column
      const statusBadge = document.getElementById('detail-status-badge');
      const activeTaskId = store.activeTaskId;
      if (statusBadge && activeTaskId) {
        const activeTask = store.getTaskById(activeTaskId);
        if (activeTask && String(activeTask.status) === String(payload.id)) {
          statusBadge.textContent = payload.title;
        }
      }

      populateColumnStatusDropdowns();
      updateColumnState(payload.id);
      return;
    }

    if (event === 'COMMENTS_LOADED' && payload) {
      updateCardCommentsCount(payload.taskId, payload.comments?.length ?? 0);
      return;
    }

    if (event === 'COMMENT_ADDED' && payload) {
      const count = store.getCommentsForTask(payload.taskId).length;
      updateCardCommentsCount(payload.taskId, count);
      return;
    }

    if (event === 'COMMENT_REMOVED' && payload) {
      const count = store.getCommentsForTask(payload.taskId).length;
      updateCardCommentsCount(payload.taskId, count);
      return;
    }

    if (event === 'USERS_LOADED' || event === 'USER_ADDED') {
      populateAssigneeDropdowns();
      return;
    }

    if (event === 'ACTIVE_TASK_CHANGED') {
      return;
    }

    if (
      event === 'TASKS_LOADED' ||
      event === 'TASK_ADDED' ||
      event === 'TASK_UPDATED' ||
      event === 'TASK_REMOVED'
    ) {
      updateTagFilterOptions();
    }

    const filteredTasks = store.getFilteredTasks();
    renderBoard(filteredTasks, (taskId) => store.getCommentsForTask(taskId).length);
    updateMetricsUI(state.metrics);
  });

  // Fetch initial tasks & users from in-memory mock repository
  try {
    const [tasks, users] = await Promise.all([
      api.getTasks(),
      api.getUsers().catch((err) => {
        console.warn('Could not load users from server, fallback to empty:', err);
        return [];
      }),
    ]);
    store.setUsers(users);
    populateAssigneeDropdowns();
    populateColumnStatusDropdowns();
    store.setTasks(tasks);
    showToast(
      '✨ Modo Live Demo activo: interactúa libremente con tareas, comentarios y drag & drop (100% en memoria para GitHub Pages).',
      'info',
      6000
    );
  } catch (err) {
    console.error('Error al inicializar el tablero Kanban:', err);
  }
}

// Auto-bootstrap on DOM load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
