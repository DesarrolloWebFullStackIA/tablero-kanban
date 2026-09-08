/**
 * Tablero Kanban - Modal Dialogs Controller
 * Handles modal lifecycle, forms validation, and submissions for task creation
 */

import api from './api.js';
import store from './store.js';
import { showToast } from './utils.js';

/**
 * Initializes the Create Task modal dialog and form handlers
 */
export function initCreateTaskModal() {
  const dialog = document.getElementById('create-task-dialog');
  const form = document.getElementById('form-create-task');
  const openBtnHeader = document.getElementById('btn-open-create-task');
  const openBtnMobile = document.getElementById('mobile-btn-open-create-task');
  const closeBtn = document.getElementById('btn-close-create-dialog');
  const cancelBtn = document.getElementById('btn-cancel-create-dialog');
  const submitBtn = document.getElementById('btn-submit-create-task');

  // Form inputs
  const titleInput = document.getElementById('create-task-title');
  const descInput = document.getElementById('create-task-desc');
  const prioritySelect = document.getElementById('create-task-priority');
  const dueDateInput = document.getElementById('create-task-due-date');
  const statusInput = document.getElementById('create-task-status');

  // Error validation containers
  const errorTitle = document.getElementById('error-create-title');
  const errorDate = document.getElementById('error-create-date');

  if (!dialog || !form) return;

  const clearErrors = () => {
    if (errorTitle) errorTitle.textContent = '';
    if (errorDate) errorDate.textContent = '';
  };

  /**
   * Opens the Create Task dialog
   * @param {string} [defaultStatus='todo']
   */
  const openModal = (defaultStatus = 'todo') => {
    form.reset();
    clearErrors();

    if (statusInput) {
      statusInput.value = defaultStatus;
    }
    if (prioritySelect) {
      prioritySelect.value = 'Media';
    }

    dialog.showModal();
    setTimeout(() => titleInput?.focus(), 50);
  };

  const closeModal = () => {
    dialog.close();
    form.reset();
    clearErrors();
  };

  // Open triggers: Header and Mobile Drawer
  if (openBtnHeader) {
    openBtnHeader.addEventListener('click', () => openModal('todo'));
  }

  if (openBtnMobile) {
    openBtnMobile.addEventListener('click', () => openModal('todo'));
  }

  // Column header "+" buttons
  const columnAddButtons = document.querySelectorAll('.btn-column-add');
  columnAddButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const colStatus = btn.dataset.column || 'todo';
      openModal(colStatus);
    });
  });

  // Close triggers
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeModal);
  }

  // Close when clicking modal backdrop
  dialog.addEventListener('click', (e) => {
    const rect = dialog.getBoundingClientRect();
    const isInDialog =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width;

    if (!isInDialog) {
      closeModal();
    }
  });

  // Inline input validation listeners
  titleInput?.addEventListener('input', () => {
    if (titleInput.value.trim().length >= 3 && errorTitle) {
      errorTitle.textContent = '';
    }
  });

  dueDateInput?.addEventListener('input', () => {
    if (dueDateInput.value && errorDate) {
      errorDate.textContent = '';
    }
  });

  // Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const title = (titleInput?.value || '').trim();
    const description = (descInput?.value || '').trim();
    const priority = prioritySelect?.value || 'Media';
    const dueDate = dueDateInput?.value || '';
    const status = statusInput?.value || 'todo';

    let isValid = true;

    if (!title || title.length < 3) {
      if (errorTitle) {
        errorTitle.textContent = 'El título es obligatorio (mínimo 3 caracteres).';
      }
      titleInput?.focus();
      isValid = false;
    }

    if (!dueDate) {
      if (errorDate) {
        errorDate.textContent = 'La fecha límite es obligatoria.';
      }
      if (isValid) dueDateInput?.focus();
      isValid = false;
    }

    if (!isValid) return;

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creando...';
      }

      const newTask = await api.createTask({
        title,
        description,
        priority,
        dueDate,
        status,
      });

      store.addTask(newTask);
      closeModal();
      showToast('Tarea creada correctamente', 'success');
    } catch (err) {
      console.error('Error al crear tarea:', err);
      showToast('Error al crear la tarea. Verifica la conexión con el servidor.', 'error', 5000);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Crear Tarea';
      }
    }
  });
}

/**
 * Executes task deletion with confirmation prompt, API call, and state removal
 * @param {string|number} taskId - Task identifier
 */
export async function deleteTaskWorkflow(taskId) {
  if (!taskId) return;
  const task = store.getTaskById(taskId);
  const taskTitle = task ? task.title : 'esta tarea';

  const confirmed = window.confirm(
    `¿Estás seguro de que deseas eliminar la tarea "${taskTitle}"?\nEsta acción no se puede deshacer.`
  );

  if (!confirmed) return;

  try {
    // If the task detail modal is open for this task, close it
    const detailDialog = document.getElementById('task-detail-dialog');
    if (detailDialog && detailDialog.open) {
      const detailTaskIdInput = document.getElementById('detail-task-id');
      if (detailTaskIdInput && String(detailTaskIdInput.value) === String(taskId)) {
        detailDialog.close();
      }
    }

    await api.deleteTask(taskId);
    store.removeTask(taskId);
    showToast('Tarea eliminada correctamente', 'info');
  } catch (err) {
    console.error('Error al eliminar la tarea:', err);
    showToast('Error al eliminar la tarea. Verifica la conexión con el servidor.', 'error', 5000);
  }
}

/**
 * Initializes task deletion listeners on the board and detail modal
 */
export function initTaskDeletion() {
  const boardContainer = document.getElementById('board-container');
  if (boardContainer) {
    boardContainer.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.btn-card-delete');
      if (deleteBtn) {
        e.stopPropagation();
        e.preventDefault();
        const taskId = deleteBtn.dataset.id;
        if (taskId) {
          deleteTaskWorkflow(taskId);
        }
      }
    });
  }

  const detailDeleteBtn = document.getElementById('btn-delete-task');
  if (detailDeleteBtn) {
    detailDeleteBtn.addEventListener('click', () => {
      const detailTaskIdInput = document.getElementById('detail-task-id');
      const activeTaskId = detailTaskIdInput?.value || store.activeTaskId;
      if (activeTaskId) {
        deleteTaskWorkflow(activeTaskId);
      }
    });
  }
}

