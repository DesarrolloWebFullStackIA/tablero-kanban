/**
 * Tablero Kanban - Modal Dialogs Controller
 * Handles modal lifecycle, forms validation, and submissions for task creation
 */

import api from './api.js';
import store from './store.js';
import { showToast, parseTags, getTagColorIndex } from './utils.js';
import { formatDate, isTaskOverdue, renderComments, updateCardChecklistBadge, escapeHtml } from './ui.js';

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
  const tagsInput = document.getElementById('create-task-tags');
  const assigneeSelect = document.getElementById('create-task-assignee');
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
    if (tagsInput) {
      tagsInput.value = '';
    }
    if (assigneeSelect) {
      assigneeSelect.value = '';
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
    const tags = parseTags(tagsInput?.value || '');
    const assigneeId = assigneeSelect?.value || null;
    const assignee = assigneeId ? store.getUserById(assigneeId) : null;

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
        tags,
        assigneeId,
        assignee,
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

/**
 * Maps task status key to human-readable Spanish label
 * @param {string} status - 'todo' | 'doing' | 'done'
 * @returns {string}
 */
export function getStatusLabel(status) {
  switch (status) {
    case 'todo':
      return 'Por Hacer';
    case 'doing':
      return 'En Proceso';
    case 'done':
      return 'Finalizado';
    default:
      return status || 'Por Hacer';
  }
}

/**
 * Renders the checklist items, progress bar, and counters for the specified task
 * @param {string|number} taskId
 */
export function renderChecklist(taskId) {
  const container = document.getElementById('detail-checklist-items');
  const countEl = document.getElementById('detail-checklist-count');
  const progressEl = document.getElementById('detail-checklist-progress');
  const percentageEl = document.getElementById('detail-checklist-percentage');

  if (!container) return;

  const task = store.getTaskById(taskId);
  const checklist = task && Array.isArray(task.checklist) ? task.checklist : [];

  const total = checklist.length;
  const completed = checklist.filter((item) => item.completed).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (countEl) countEl.textContent = `(${completed}/${total})`;
  if (percentageEl) percentageEl.textContent = `${percent}%`;
  if (progressEl) {
    progressEl.style.width = `${percent}%`;
    const track = progressEl.closest('.checklist-progress-bar-track');
    if (track) track.setAttribute('aria-valuenow', String(percent));
  }

  container.innerHTML = '';

  if (total === 0) {
    const emptyLi = document.createElement('li');
    emptyLi.className = 'checklist-empty-state';
    emptyLi.textContent = 'No hay subtareas añadidas. ¡Añade la primera abajo!';
    container.appendChild(emptyLi);
    return;
  }

  for (const item of checklist) {
    const li = document.createElement('li');
    li.className = 'checklist-item';
    li.dataset.subtaskId = String(item.id);

    li.innerHTML = `
      <label class="checklist-item-label">
        <input
          type="checkbox"
          class="checklist-item-checkbox"
          data-subtask-id="${escapeHtml(String(item.id))}"
          ${item.completed ? 'checked' : ''}
          aria-label="Completar subtarea: ${escapeHtml(item.text)}"
        />
        <span class="checklist-item-text ${item.completed ? 'is-completed' : ''}">${escapeHtml(item.text)}</span>
      </label>
      <button
        type="button"
        class="btn-delete-subtask"
        data-subtask-id="${escapeHtml(String(item.id))}"
        aria-label="Eliminar subtarea: ${escapeHtml(item.text)}"
        title="Eliminar subtarea"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    container.appendChild(li);
  }
}

/**
 * Toggles a subtask completion status and persists with PATCH
 * @param {string|number} taskId
 * @param {string} subtaskId
 */
export async function toggleSubtask(taskId, subtaskId) {
  const task = store.getTaskById(taskId);
  if (!task || !Array.isArray(task.checklist)) return;

  const previousChecklist = [...task.checklist];
  const updatedChecklist = task.checklist.map((item) =>
    String(item.id) === String(subtaskId)
      ? { ...item, completed: !item.completed }
      : item
  );

  // Optimistic update
  store.updateTask(taskId, { checklist: updatedChecklist });
  renderChecklist(taskId);
  updateCardChecklistBadge(taskId, updatedChecklist);

  try {
    await api.updateTask(taskId, { checklist: updatedChecklist });
  } catch (err) {
    console.error('Error al actualizar subtarea en el servidor:', err);
    store.updateTask(taskId, { checklist: previousChecklist });
    renderChecklist(taskId);
    updateCardChecklistBadge(taskId, previousChecklist);
    showToast('Error al actualizar subtarea. Se restableció el estado.', 'error');
  }
}

/**
 * Adds a new subtask to task checklist and persists with PATCH
 * @param {string|number} taskId
 * @param {string} text
 */
export async function addSubtask(taskId, text) {
  const cleanText = (text || '').trim();
  if (!cleanText) return;

  const task = store.getTaskById(taskId);
  if (!task) return;

  const currentChecklist = Array.isArray(task.checklist) ? [...task.checklist] : [];
  const newItem = {
    id: `chk_${Date.now()}`,
    text: cleanText,
    completed: false,
  };
  const updatedChecklist = [...currentChecklist, newItem];

  // Optimistic update
  store.updateTask(taskId, { checklist: updatedChecklist });
  renderChecklist(taskId);
  updateCardChecklistBadge(taskId, updatedChecklist);

  const input = document.getElementById('input-new-subtask');
  if (input) input.value = '';

  try {
    await api.updateTask(taskId, { checklist: updatedChecklist });
    showToast('Subtarea añadida', 'success', 2000);
  } catch (err) {
    console.error('Error al añadir subtarea:', err);
    store.updateTask(taskId, { checklist: currentChecklist });
    renderChecklist(taskId);
    updateCardChecklistBadge(taskId, currentChecklist);
    showToast('Error al guardar subtarea en el servidor.', 'error');
  }
}

/**
 * Deletes a subtask from task checklist and persists with PATCH
 * @param {string|number} taskId
 * @param {string} subtaskId
 */
export async function deleteSubtask(taskId, subtaskId) {
  const task = store.getTaskById(taskId);
  if (!task || !Array.isArray(task.checklist)) return;

  const previousChecklist = [...task.checklist];
  const updatedChecklist = task.checklist.filter(
    (item) => String(item.id) !== String(subtaskId)
  );

  // Optimistic update
  store.updateTask(taskId, { checklist: updatedChecklist });
  renderChecklist(taskId);
  updateCardChecklistBadge(taskId, updatedChecklist);

  try {
    await api.updateTask(taskId, { checklist: updatedChecklist });
    showToast('Subtarea eliminada', 'info', 2000);
  } catch (err) {
    console.error('Error al eliminar subtarea:', err);
    store.updateTask(taskId, { checklist: previousChecklist });
    renderChecklist(taskId);
    updateCardChecklistBadge(taskId, previousChecklist);
    showToast('Error al eliminar subtarea en el servidor.', 'error');
  }
}

/**
 * Opens and populates the Task Detail modal dialog
 * @param {string|number} taskId - ID of the task to view
 */
export async function openTaskDetailModal(taskId) {
  const dialog = document.getElementById('task-detail-dialog');
  const task = store.getTaskById(taskId);
  if (!dialog || !task) return;

  store.setActiveTaskId(taskId);

  // Populate header badges
  const priorityBadge = document.getElementById('detail-priority-badge');
  const statusBadge = document.getElementById('detail-status-badge');
  const dateBadge = document.getElementById('detail-date-badge');
  const dueDateText = document.getElementById('detail-due-date-text');

  if (priorityBadge) {
    priorityBadge.textContent = task.priority || 'Media';
    priorityBadge.className = `badge-priority badge-priority--${task.priority || 'Media'}`;
  }

  if (statusBadge) {
    statusBadge.textContent = getStatusLabel(task.status);
    statusBadge.className = `badge-status badge-status--${task.status}`;
  }

  const overdue = isTaskOverdue(task.dueDate, task.status);
  if (dueDateText) {
    dueDateText.textContent = formatDate(task.dueDate);
  }
  if (dateBadge) {
    dateBadge.classList.toggle('is-overdue', overdue);
    dateBadge.title = overdue ? 'Tarea vencida' : 'Fecha límite: ' + formatDate(task.dueDate);
  }

  // Populate editable fields
  const idInput = document.getElementById('detail-task-id');
  const titleInput = document.getElementById('detail-task-title-input');
  const descInput = document.getElementById('detail-task-desc-input');
  const tagsInput = document.getElementById('detail-task-tags-input');
  const tagsChips = document.getElementById('detail-tags-chips');

  if (idInput) idInput.value = String(task.id);
  if (titleInput) titleInput.value = task.title || '';
  if (descInput) descInput.value = task.description || '';
  if (tagsInput) tagsInput.value = (task.tags || []).join(' ');

  if (tagsChips) {
    if (task.tags && task.tags.length > 0) {
      tagsChips.innerHTML = task.tags
        .map((t) => {
          const idx = getTagColorIndex(t, 6);
          return `<span class="tag-chip tag-chip--color-${idx}">${t}</span>`;
        })
        .join('');
    } else {
      tagsChips.innerHTML = '<span class="detail-tags-empty">Sin etiquetas</span>';
    }
  }

  // Populate assignee select
  const detailAssigneeSelect = document.getElementById('detail-task-assignee');
  if (detailAssigneeSelect) {
    detailAssigneeSelect.value = task.assigneeId || (task.assignee?.id) || '';
  }

  // Populate checklist
  renderChecklist(taskId);
  const newSubtaskInput = document.getElementById('input-new-subtask');
  if (newSubtaskInput) {
    newSubtaskInput.value = '';
  }

  // Reset add comment form
  const addCommentForm = document.getElementById('form-add-comment');
  if (addCommentForm) {
    addCommentForm.reset();
  }

  // Comments feed setup
  const commentsList = document.getElementById('detail-comments-list');
  const commentsCount = document.getElementById('detail-comments-count');

  // Render cached comments immediately
  const cachedComments = store.getCommentsForTask(taskId);
  renderComments(commentsList, cachedComments, commentsCount);

  dialog.showModal();

  // Fetch fresh comments from server
  try {
    if (commentsList) {
      commentsList.setAttribute('aria-busy', 'true');
    }
    const comments = await api.getCommentsByTaskId(taskId);
    store.setCommentsForTask(taskId, comments);

    // If dialog is still showing this task, update rendered comments
    if (String(store.activeTaskId) === String(taskId)) {
      renderComments(commentsList, comments, commentsCount);
    }
  } catch (err) {
    console.error('Error al cargar comentarios:', err);
    showToast('Error al cargar comentarios de la tarea.', 'error');
  } finally {
    if (commentsList) {
      commentsList.setAttribute('aria-busy', 'false');
    }
  }
}

/**
 * Initializes the Task Detail modal dialog and card click handlers
 */
export function initTaskDetailModal() {
  const dialog = document.getElementById('task-detail-dialog');
  const closeBtn = document.getElementById('btn-close-detail-dialog');

  if (!dialog) return;

  const closeModal = () => {
    dialog.close();
    store.setActiveTaskId(null);
  };

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
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

  // Listen to card clicks on the board container using event delegation
  const boardContainer = document.getElementById('board-container');
  if (boardContainer) {
    boardContainer.addEventListener('click', (e) => {
      // Ignore click on quick delete button or tag chip
      if (e.target.closest('.btn-card-delete') || e.target.closest('.tag-chip')) return;

      const card = e.target.closest('.kanban-card');
      if (card && card.dataset.id) {
        openTaskDetailModal(card.dataset.id);
      }
    });

    // Keyboard accessibility: Enter or Space on focused card
    boardContainer.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target.closest('.btn-card-delete') || e.target.closest('.tag-chip')) return;
        const card = e.target.closest('.kanban-card');
        if (card && card.dataset.id) {
          e.preventDefault();
          openTaskDetailModal(card.dataset.id);
        }
      }
    });
  }

  // Handle Edit Task Form Submission
  const editForm = document.getElementById('form-edit-task');
  const idInput = document.getElementById('detail-task-id');
  const titleInput = document.getElementById('detail-task-title-input');
  const descInput = document.getElementById('detail-task-desc-input');
  const tagsInput = document.getElementById('detail-task-tags-input');
  const assigneeSelect = document.getElementById('detail-task-assignee');
  const tagsChips = document.getElementById('detail-tags-chips');
  const saveBtn = document.getElementById('btn-save-task-edits');

  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const taskId = idInput?.value;
      if (!taskId) return;

      const newTitle = (titleInput?.value || '').trim();
      const newDesc = (descInput?.value || '').trim();
      const newTags = parseTags(tagsInput?.value || '');
      const newAssigneeId = assigneeSelect?.value || null;
      const newAssignee = newAssigneeId ? store.getUserById(newAssigneeId) : null;

      if (!newTitle || newTitle.length < 3) {
        showToast('El título debe tener al menos 3 caracteres.', 'error');
        titleInput?.focus();
        return;
      }

      try {
        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.textContent = 'Guardando...';
        }

        const updatedTask = await api.updateTask(taskId, {
          title: newTitle,
          description: newDesc,
          tags: newTags,
          assigneeId: newAssigneeId,
          assignee: newAssignee,
        });

        // Update central reactive store
        store.updateTask(taskId, {
          title: updatedTask.title || newTitle,
          description: updatedTask.description ?? newDesc,
          tags: updatedTask.tags || newTags,
          assigneeId: updatedTask.assigneeId ?? newAssigneeId,
          assignee: updatedTask.assignee ?? newAssignee,
        });

        // Update tags preview chips in dialog
        if (tagsChips) {
          if (newTags.length > 0) {
            tagsChips.innerHTML = newTags
              .map((t) => {
                const idx = getTagColorIndex(t, 6);
                return `<span class="tag-chip tag-chip--color-${idx}">${t}</span>`;
              })
              .join('');
          } else {
            tagsChips.innerHTML = '<span class="detail-tags-empty">Sin etiquetas</span>';
          }
        }

        showToast('Cambios guardados correctamente', 'success');
      } catch (err) {
        console.error('Error al guardar cambios de la tarea:', err);
        showToast('Error al guardar cambios. Verifica la conexión con el servidor.', 'error', 5000);
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Guardar Cambios';
        }
      }
    });
  }

  // Handle Checklist Interactions: toggle checkbox & delete subtask
  const checklistContainer = document.getElementById('detail-checklist-items');
  if (checklistContainer) {
    checklistContainer.addEventListener('change', (e) => {
      const checkbox = e.target.closest('.checklist-item-checkbox');
      if (checkbox) {
        const subtaskId = checkbox.dataset.subtaskId;
        const taskId = idInput?.value || store.activeTaskId;
        if (taskId && subtaskId) {
          toggleSubtask(taskId, subtaskId);
        }
      }
    });

    checklistContainer.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.btn-delete-subtask');
      if (deleteBtn) {
        e.stopPropagation();
        const subtaskId = deleteBtn.dataset.subtaskId;
        const taskId = idInput?.value || store.activeTaskId;
        if (taskId && subtaskId) {
          deleteSubtask(taskId, subtaskId);
        }
      }
    });
  }

  // Handle Add Subtask
  const newSubtaskInput = document.getElementById('input-new-subtask');
  const addSubtaskBtn = document.getElementById('btn-add-subtask');

  const handleAddSubtask = () => {
    const taskId = idInput?.value || store.activeTaskId;
    if (taskId && newSubtaskInput) {
      addSubtask(taskId, newSubtaskInput.value);
    }
  };

  if (addSubtaskBtn) {
    addSubtaskBtn.addEventListener('click', handleAddSubtask);
  }

  if (newSubtaskInput) {
    newSubtaskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddSubtask();
      }
    });
  }

  // Handle Add Comment Form Submission
  const addCommentForm = document.getElementById('form-add-comment');
  const commentAuthorInput = document.getElementById('comment-author');
  const commentTextInput = document.getElementById('comment-text');
  const commentSubmitBtn = document.getElementById('btn-submit-comment');

  if (addCommentForm) {
    addCommentForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const taskId = idInput?.value || store.activeTaskId;
      if (!taskId) return;

      const author = (commentAuthorInput?.value || '').trim();
      const text = (commentTextInput?.value || '').trim();

      if (!author) {
        showToast('Por favor, ingresa tu nombre.', 'error');
        commentAuthorInput?.focus();
        return;
      }

      if (!text || text.length < 2) {
        showToast('El comentario debe tener al menos 2 caracteres.', 'error');
        commentTextInput?.focus();
        return;
      }

      try {
        if (commentSubmitBtn) {
          commentSubmitBtn.disabled = true;
          commentSubmitBtn.textContent = 'Añadiendo...';
        }

        const newComment = await api.createComment({
          taskId: String(taskId),
          author,
          text,
        });

        // Store update (emits COMMENT_ADDED, updating the board card comments badge)
        store.addComment(newComment);

        // Update modal comments list & count
        const commentsList = document.getElementById('detail-comments-list');
        const commentsCount = document.getElementById('detail-comments-count');
        const taskComments = store.getCommentsForTask(taskId);
        renderComments(commentsList, taskComments, commentsCount);

        // Smooth scroll to bottom of comments list
        if (commentsList) {
          commentsList.scrollTop = commentsList.scrollHeight;
        }

        // Reset comment text field and keep author for convenience
        if (commentTextInput) {
          commentTextInput.value = '';
          commentTextInput.focus();
        }

        showToast('Comentario añadido correctamente', 'success');
      } catch (err) {
        console.error('Error al añadir comentario:', err);
        showToast('Error al añadir comentario. Verifica la conexión con el servidor.', 'error', 5000);
      } finally {
        if (commentSubmitBtn) {
          commentSubmitBtn.disabled = false;
          commentSubmitBtn.textContent = 'Añadir Comentario';
        }
      }
    });
  }

  // Handle Comment Deletion
  const commentsListContainer = document.getElementById('detail-comments-list');
  if (commentsListContainer) {
    commentsListContainer.addEventListener('click', async (e) => {
      const deleteBtn = e.target.closest('.btn-comment-delete');
      if (!deleteBtn) return;

      e.stopPropagation();
      const commentId = deleteBtn.dataset.commentId;
      const taskId = idInput?.value || store.activeTaskId;
      if (!commentId || !taskId) return;

      const confirmed = window.confirm('¿Deseas eliminar este comentario permanentemente?');
      if (!confirmed) return;

      try {
        deleteBtn.disabled = true;
        await api.deleteComment(commentId);

        // Remove from state store (emits COMMENT_REMOVED, updating the board card badge)
        store.removeComment(commentId, taskId);

        // Re-render comments list and count in modal
        const taskComments = store.getCommentsForTask(taskId);
        const commentsCount = document.getElementById('detail-comments-count');
        renderComments(commentsListContainer, taskComments, commentsCount);

        showToast('Comentario eliminado', 'info');
      } catch (err) {
        console.error('Error al eliminar comentario:', err);
        showToast('Error al eliminar comentario. Verifica la conexión con el servidor.', 'error', 5000);
        deleteBtn.disabled = false;
      }
    });
  }
}

/**
 * Populates all assignee select elements across modals with current store users
 */
export function populateAssigneeDropdowns() {
  const users = store.getUsers();
  const selects = [
    document.getElementById('create-task-assignee'),
    document.getElementById('detail-task-assignee'),
  ];

  selects.forEach((select) => {
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = '<option value="">Sin asignar</option>';
    users.forEach((u) => {
      const option = document.createElement('option');
      option.value = String(u.id);
      option.textContent = `${u.name}${u.role ? ` (${u.role})` : ''}`;
      select.appendChild(option);
    });
    if (currentValue) {
      select.value = currentValue;
    }
  });
}

/**
 * Renders the users list in the user management dialog
 */
export function renderUsersList() {
  const list = document.getElementById('users-list');
  if (!list) return;

  const users = store.getUsers();
  if (users.length === 0) {
    list.innerHTML = '<p class="users-empty">No hay usuarios registrados.</p>';
    return;
  }

  list.innerHTML = users
    .map(
      (u) => `
    <div class="user-card-item" data-user-id="${escapeHtml(String(u.id))}">
      <img
        src="${escapeHtml(u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name || 'User')}`)}"
        alt="${escapeHtml(u.name)}"
        class="user-card-avatar"
      />
      <div class="user-card-info">
        <span class="user-card-name">${escapeHtml(u.name)}</span>
        <span class="user-card-email">${escapeHtml(u.email || '')}</span>
      </div>
      ${u.role ? `<span class="user-card-role-badge">${escapeHtml(u.role)}</span>` : ''}
    </div>
  `
    )
    .join('');
}

/**
 * Initializes the User Management modal dialog and form handlers
 */
export function initUserModal() {
  const dialog = document.getElementById('user-management-dialog');
  const openBtnHeader = document.getElementById('btn-open-users-modal');
  const openBtnMobile = document.getElementById('mobile-btn-open-users');
  const closeBtn = document.getElementById('btn-close-users-dialog');
  const form = document.getElementById('form-create-user');

  const nameInput = document.getElementById('new-user-name');
  const emailInput = document.getElementById('new-user-email');
  const roleInput = document.getElementById('new-user-role');
  const errorName = document.getElementById('error-user-name');
  const errorEmail = document.getElementById('error-user-email');
  const submitBtn = document.getElementById('btn-submit-create-user');

  if (!dialog) return;

  const clearErrors = () => {
    if (errorName) errorName.textContent = '';
    if (errorEmail) errorEmail.textContent = '';
  };

  const openModal = () => {
    if (form) form.reset();
    clearErrors();
    renderUsersList();
    dialog.showModal();
    setTimeout(() => nameInput?.focus(), 50);
  };

  const closeModal = () => {
    dialog.close();
    if (form) form.reset();
    clearErrors();
  };

  if (openBtnHeader) openBtnHeader.addEventListener('click', openModal);
  if (openBtnMobile) openBtnMobile.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

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

  // Validation listeners
  nameInput?.addEventListener('input', () => {
    if (nameInput.value.trim().length >= 2 && errorName) errorName.textContent = '';
  });

  emailInput?.addEventListener('input', () => {
    if (emailInput.value.trim() && errorEmail) errorEmail.textContent = '';
  });

  // Form submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors();

      const name = (nameInput?.value || '').trim();
      const email = (emailInput?.value || '').trim();
      const role = (roleInput?.value || '').trim();

      let isValid = true;

      if (!name || name.length < 2) {
        if (errorName) errorName.textContent = 'El nombre es obligatorio (mínimo 2 caracteres).';
        nameInput?.focus();
        isValid = false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        if (errorEmail) errorEmail.textContent = 'Introduce un correo electrónico válido.';
        if (isValid) emailInput?.focus();
        isValid = false;
      }

      if (!isValid) return;

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Registrando...';
        }

        const newUser = await api.createUser({
          name,
          email,
          role: role || 'Colaborador',
        });

        store.addUser(newUser);
        renderUsersList();
        populateAssigneeDropdowns();
        form.reset();
        showToast(`Usuario "${newUser.name}" registrado correctamente`, 'success');
      } catch (err) {
        console.error('Error al registrar usuario:', err);
        showToast('Error al registrar el usuario en el servidor.', 'error', 5000);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Registrar Miembro';
        }
      }
    });
  }
}



