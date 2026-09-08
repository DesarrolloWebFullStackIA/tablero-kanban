/**
 * Tablero Kanban - Main Application Entry Point
 * Orchestrates initialization, state store, UI updates, and theme handling
 */

import api from './api.js';
import store from './store.js';
import { renderBoard, updateMetricsUI, updateColumnState, isTaskOverdue, formatDate, updateCardCommentsCount } from './ui.js';
import { showToast, debounce } from './utils.js';
import {
  initCreateTaskModal,
  initTaskDeletion,
  initTaskDetailModal,
  initUserModal,
  populateAssigneeDropdowns,
} from './modal.js';
import { initDragAndDrop } from './dragdrop.js';

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
 * 4. App Initializer & State Wire-up
 */
export async function initApp() {
  initTheme();
  initMobileNav();
  initFilters();
  initCreateTaskModal();
  initTaskDeletion();
  initTaskDetailModal();
  initUserModal();

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
      // Optimistic UI update: SortableJS has already placed card in target DOM list
      updateMetricsUI(state.metrics);
      updateColumnState(payload.oldStatus);
      updateColumnState(payload.newStatus);

      // Update overdue styling if status changed to/from 'done'
      const cardEl = document.querySelector(`.kanban-card[data-id="${payload.task.id}"]`);
      if (cardEl) {
        const dueDateBadge = cardEl.querySelector('.card-due-date');
        if (dueDateBadge) {
          const overdue = isTaskOverdue(payload.task.dueDate, payload.newStatus);
          dueDateBadge.classList.toggle('is-overdue', overdue);
          dueDateBadge.title = overdue
            ? 'Tarea vencida'
            : 'Fecha de entrega: ' + formatDate(payload.task.dueDate);
        }
      }
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

  // Fetch initial tasks & users from json-server backend
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
    store.setTasks(tasks);
  } catch (err) {
    console.error('Error al inicializar el tablero Kanban:', err);
    showToast(
      'No se pudo conectar con el backend (json-server en puerto 3000). Asegúrate de iniciarlo con "npm run server".',
      'error',
      6000
    );
  }
}

// Auto-bootstrap on DOM load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
