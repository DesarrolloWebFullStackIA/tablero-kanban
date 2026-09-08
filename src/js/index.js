/**
 * Tablero Kanban - Main Application Entry Point
 * Orchestrates initialization, state store, UI updates, and theme handling
 */

import api from './api.js';
import store from './store.js';
import { renderBoard, updateMetricsUI } from './ui.js';
import { showToast } from './utils.js';
import { initCreateTaskModal } from './modal.js';

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
  const resetFiltersBtn = document.getElementById('btn-reset-filters');

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
      store.setSearchQuery(query);
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      clearSearchBtn.setAttribute('hidden', '');
      store.setSearchQuery('');
    });
  }

  if (prioritySelect) {
    prioritySelect.addEventListener('change', (e) => {
      store.setPriorityFilter(e.target.value);
    });
  }

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
      store.resetFilters();
    });
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

  // Reactive UI update whenever state changes
  store.subscribe(({ event, payload, state }) => {
    const filteredTasks = store.getFilteredTasks();
    renderBoard(filteredTasks, (taskId) => store.getCommentsForTask(taskId).length);
    updateMetricsUI(state.metrics);
  });

  // Fetch initial tasks from json-server backend
  try {
    const tasks = await api.getTasks();
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
