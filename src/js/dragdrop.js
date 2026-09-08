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
  emptyInsertThreshold: 10,
  delay: 150,
  delayOnTouchOnly: true,
  touchStartThreshold: 5,
};

/**
 * Normalizes and extracts structured payload from a SortableJS onEnd event
 * @param {Object} evt - Raw SortableJS onEnd event
 * @returns {Object|null} Parsed drag event payload or null if invalid
 */
export function parseDragEvent(evt) {
  if (!evt || !evt.item) return null;

  const cardElement = evt.item;
  const taskId = cardElement.dataset?.id;
  if (!taskId) return null;

  const fromContainer = evt.from;
  const toContainer = evt.to;

  const fromStatus = fromContainer?.dataset?.status || 'todo';
  const toStatus = toContainer?.dataset?.status || 'todo';

  const oldIndex = typeof evt.oldIndex === 'number' ? evt.oldIndex : -1;
  const newIndex = typeof evt.newIndex === 'number' ? evt.newIndex : -1;

  const isCrossColumn = fromStatus !== toStatus;
  const hasPositionChanged = isCrossColumn || oldIndex !== newIndex;

  return {
    taskId,
    item: cardElement,
    fromStatus,
    toStatus,
    fromContainer,
    toContainer,
    oldIndex,
    newIndex,
    isCrossColumn,
    hasPositionChanged,
  };
}

/** @type {Array<any>} */
let sortableInstances = [];
let savedOnEndCallback = null;
let savedCustomOptions = {};

/**
 * Registers an individual dropzone container with SortableJS
 * @param {HTMLElement} container
 * @param {Function} [onEndCallback]
 * @param {Object} [customOptions]
 * @returns {any} Sortable instance
 */
export function registerDropzone(container, onEndCallback = null, customOptions = {}) {
  const SortableLib = typeof window !== 'undefined' ? window.Sortable : null;
  if (!SortableLib || !container) return null;

  if (onEndCallback) savedOnEndCallback = onEndCallback;
  if (customOptions && Object.keys(customOptions).length > 0) savedCustomOptions = customOptions;

  const existing = typeof SortableLib.get === 'function' ? SortableLib.get(container) : null;
  if (existing && typeof existing.destroy === 'function') {
    existing.destroy();
    sortableInstances = sortableInstances.filter((inst) => inst !== existing);
  }

  const options = {
    ...defaultSortableOptions,
    ...savedCustomOptions,
    onEnd: (event) => {
      const payload = parseDragEvent(event);
      if (typeof savedOnEndCallback === 'function') {
        savedOnEndCallback(payload, event);
      }
    },
  };

  const instance = typeof SortableLib.create === 'function'
    ? SortableLib.create(container, options)
    : new SortableLib(container, options);

  sortableInstances.push(instance);
  return instance;
}

/**
 * Initializes SortableJS instances across all Kanban column card lists
 * @param {Function} [onEndCallback] - Callback receiving (parsedPayload, rawEvent)
 * @param {Object} [customOptions] - Optional configuration overrides
 * @returns {Array<any>} List of active SortableJS instances
 */
export function initDragAndDrop(onEndCallback = null, customOptions = {}) {
  if (onEndCallback) savedOnEndCallback = onEndCallback;
  if (customOptions && Object.keys(customOptions).length > 0) savedCustomOptions = customOptions;

  // Clean up any existing instances first
  destroyDragAndDrop();

  const SortableLib = typeof window !== 'undefined' ? window.Sortable : null;
  if (!SortableLib) {
    console.warn('SortableJS library not available on window.Sortable');
    return [];
  }

  const containers = document.querySelectorAll('.kanban-cards-list');
  containers.forEach((container) => {
    registerDropzone(container);
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
  registerDropzone,
  parseDragEvent,
  defaultSortableOptions,
};
