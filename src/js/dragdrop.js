/**
 * Tablero Kanban - Drag & Drop Controller (SortableJS Integration)
 * Manages draggable column lists, drag states, and drop events
 */

/**
 * Default SortableJS configuration options
 */
export const defaultSortableOptions = {
  group: 'kanban-board', // Enables dragging between different lists in the same group
  animation: 150, // Animation speed in ms when moving items
  ghostClass: 'sortable-ghost', // Class name for drop placeholder
  chosenClass: 'sortable-chosen', // Class name for chosen item
  dragClass: 'sortable-drag', // Class name for dragging item
  handle: '.kanban-card', // Selector for the draggable handle
  filter: '.btn-card-delete, .column-empty-state', // Elements that cannot trigger drag
  preventOnFilter: false,
  fallbackOnBody: true,
  swapThreshold: 0.65,
  delay: 0,
  delayOnTouchOnly: true,
  touchStartThreshold: 5,
};

/** @type {Array<any>} */
let sortableInstances = [];

/**
 * Initializes SortableJS instances across all 3 Kanban column card lists
 * @param {Function} [onEndCallback] - Callback invoked when a card is dropped
 * @param {Object} [customOptions] - Optional configuration overrides
 * @returns {Array<any>} List of active SortableJS instances
 */
export function initDragAndDrop(onEndCallback = null, customOptions = {}) {
  // Clean up any existing instances first
  destroyDragAndDrop();

  const SortableLib = window.Sortable;
  if (!SortableLib) {
    console.warn('SortableJS library not available on window.Sortable');
    return [];
  }

  const columnStatuses = ['todo', 'doing', 'done'];

  columnStatuses.forEach((status) => {
    const container = document.getElementById(`cards-${status}`);
    if (!container) return;

    const options = {
      ...defaultSortableOptions,
      ...customOptions,
      onEnd: (event) => {
        if (typeof onEndCallback === 'function') {
          onEndCallback(event);
        }
      },
    };

    const instance = new SortableLib(container, options);
    sortableInstances.push(instance);
  });

  return sortableInstances;
}

/**
 * Destroys all active SortableJS instances
 */
export function destroyDragAndDrop() {
  sortableInstances.forEach((instance) => {
    if (instance && typeof instance.destroy === 'function') {
      instance.destroy();
    }
  });
  sortableInstances = [];
}

/**
 * Returns currently active SortableJS instances
 * @returns {Array<any>}
 */
export function getSortableInstances() {
  return [...sortableInstances];
}

export default {
  initDragAndDrop,
  destroyDragAndDrop,
  getSortableInstances,
  defaultSortableOptions,
};
