import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import store from '../src/js/store.js';
import {
  parseDragEvent,
  registerDropzone,
  initDragAndDrop,
  destroyDragAndDrop,
  getSortableInstances,
} from '../src/js/dragdrop.js';
import { getStatusLabel, populateColumnStatusDropdowns } from '../src/js/modal.js';
import { renderBoard } from '../src/js/ui.js';

describe('Central State Store (store.js)', () => {
  const sampleTasks = [
    {
      id: '1',
      title: 'Diseñar maqueta en Figma',
      description: 'Crear wireframes interactivos.',
      priority: 'Alta',
      dueDate: '2026-09-15',
      status: 'todo',
      tags: ['#diseño', '#figma'],
    },
    {
      id: '2',
      title: 'Configurar json-server',
      description: 'Iniciar la API simulada.',
      priority: 'Media',
      dueDate: '2026-09-10',
      status: 'doing',
      tags: ['#backend', '#api'],
    },
    {
      id: '3',
      title: 'Estructurar HTML semántico',
      description: 'Definir header y columnas.',
      priority: 'Baja',
      dueDate: '2026-09-12',
      status: 'done',
      tags: ['#frontend'],
    },
  ];

  beforeEach(() => {
    store.tasks = [];
    store.commentsMap.clear();
    store.subscribers.clear();
    store.resetFilters();
    store.resetColumns();
  });

  describe('Task CRUD Operations', () => {
    it('should set and retrieve tasks', () => {
      store.setTasks(sampleTasks);
      expect(store.getTasks()).toHaveLength(3);
      expect(store.getTaskById('2')?.title).toBe('Configurar json-server');
    });

    it('should add a new task and notify subscribers', () => {
      const subscriber = vi.fn();
      store.subscribe(subscriber);

      const newTask = {
        id: '4',
        title: 'Auditoría WCAG AA',
        priority: 'Alta',
        dueDate: '2026-09-20',
        status: 'todo',
      };

      store.addTask(newTask);

      expect(store.getTasks()).toHaveLength(1);
      expect(store.getTaskById('4')).toEqual(newTask);
      expect(subscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'TASK_ADDED',
          payload: newTask,
        })
      );
    });

    it('should update task fields in-place', () => {
      store.setTasks(sampleTasks);

      const updated = store.updateTask('1', {
        title: 'Nuevo título de Figma',
        priority: 'Media',
      });

      expect(updated?.title).toBe('Nuevo título de Figma');
      expect(updated?.priority).toBe('Media');
      expect(store.getTaskById('1')?.title).toBe('Nuevo título de Figma');
    });

    it('should move a task to a new status column', () => {
      store.setTasks(sampleTasks);

      const moved = store.moveTask('1', 'doing');
      expect(moved).not.toBeNull();
      expect(moved?.oldStatus).toBe('todo');
      expect(moved?.newStatus).toBe('doing');
      expect(store.getTaskById('1')?.status).toBe('doing');
    });

    it('should remove a task and clear its comments cache', () => {
      store.setTasks(sampleTasks);
      store.setCommentsForTask('1', [{ id: 'c1', text: 'Nota' }]);

      const removed = store.removeTask('1');
      expect(removed?.id).toBe('1');
      expect(store.getTasks()).toHaveLength(2);
      expect(store.getTaskById('1')).toBeUndefined();
      expect(store.getCommentsForTask('1')).toEqual([]);
    });
  });

  describe('Filters & Search', () => {
    beforeEach(() => {
      store.setTasks(sampleTasks);
    });

    it('should filter tasks by search query matching title or description', () => {
      store.setSearchQuery('figma');
      const filtered = store.getFilteredTasks();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should filter tasks by exact priority', () => {
      store.setPriorityFilter('Baja');
      const filtered = store.getFilteredTasks();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('3');
    });

    it('should filter tasks by tag', () => {
      store.setTagFilter('#backend');
      const filtered = store.getFilteredTasks();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2');

      store.setTagFilter('#inexistente');
      expect(store.getFilteredTasks()).toHaveLength(0);
    });

    it('should return all unique hashtags sorted across all tasks', () => {
      const allTags = store.getAllTags();
      expect(allTags).toEqual(['#api', '#backend', '#diseño', '#figma', '#frontend']);
    });

    it('should combine search query, priority filter, and tag filter', () => {
      store.setSearchQuery('figma');
      store.setPriorityFilter('Alta');
      store.setTagFilter('#diseño');
      expect(store.getFilteredTasks()).toHaveLength(1);

      store.setTagFilter('#backend');
      expect(store.getFilteredTasks()).toHaveLength(0);
    });

    it('should reset filters to show all tasks', () => {
      store.setSearchQuery('json');
      store.setPriorityFilter('Media');
      store.setTagFilter('#backend');
      expect(store.getFilteredTasks()).toHaveLength(1);

      store.resetFilters();
      expect(store.filters.tag).toBe('all');
      expect(store.getFilteredTasks()).toHaveLength(3);
    });
  });

  describe('Metrics Computation', () => {
    it('should accurately compute total and per-column counts', () => {
      store.setTasks(sampleTasks);
      const metrics = store.getMetrics();

      expect(metrics).toEqual({
        todo: 1,
        doing: 1,
        done: 1,
        total: 3,
      });
    });
  });

  describe('Comments Cache Management', () => {
    it('should store and retrieve comments by task ID', () => {
      const comments = [
        { id: '101', taskId: '1', author: 'Ana', text: 'Primer comentario' },
        { id: '102', taskId: '1', author: 'Carlos', text: 'Segundo comentario' },
      ];

      store.setCommentsForTask('1', comments);
      expect(store.getCommentsForTask('1')).toHaveLength(2);
      expect(store.getCommentsForTask('2')).toHaveLength(0);
    });

    it('should add a single comment and retrieve it', () => {
      const comment = { id: '103', taskId: '2', author: 'Laura', text: 'Nota' };
      store.addComment(comment);

      const cached = store.getCommentsForTask('2');
      expect(cached).toHaveLength(1);
      expect(cached[0].author).toBe('Laura');
    });

    it('should remove an existing comment by ID', () => {
      store.setCommentsForTask('1', [
        { id: '101', taskId: '1', text: 'Comentario 1' },
        { id: '102', taskId: '1', text: 'Comentario 2' },
      ]);

      const removed = store.removeComment('101', '1');
      expect(removed?.id).toBe('101');
      expect(store.getCommentsForTask('1')).toHaveLength(1);
      expect(store.getCommentsForTask('1')[0].id).toBe('102');
    });
  });

  describe('Subtasks & Checklist Operations', () => {
    const taskWithChecklist = {
      id: '10',
      title: 'Crear sistema de diseño',
      priority: 'Alta',
      dueDate: '2026-09-20',
      status: 'todo',
      checklist: [
        { id: 'c1', text: 'Diseñar paleta cromática', completed: true },
        { id: 'c2', text: 'Estructurar tipografías', completed: false },
        { id: 'c3', text: 'Documentar componentes accesibles', completed: false },
      ],
    };

    beforeEach(() => {
      store.setTasks([JSON.parse(JSON.stringify(taskWithChecklist))]);
    });

    it('should retrieve task with subtask checklist items', () => {
      const task = store.getTaskById('10');
      expect(task).toBeDefined();
      expect(task?.checklist).toHaveLength(3);
      expect(task?.checklist[0].completed).toBe(true);
      expect(task?.checklist[1].completed).toBe(false);
    });

    it('should toggle a subtask completed status in store', () => {
      const task = store.getTaskById('10');
      const updatedChecklist = task?.checklist.map((item) =>
        item.id === 'c2' ? { ...item, completed: true } : item
      );

      const updatedTask = store.updateTask('10', { checklist: updatedChecklist });
      expect(updatedTask?.checklist.find((i) => i.id === 'c2').completed).toBe(true);

      const completedCount = updatedTask?.checklist.filter((i) => i.completed).length;
      expect(completedCount).toBe(2);
    });

    it('should add a new subtask to the checklist in store', () => {
      const task = store.getTaskById('10');
      const newSubtask = {
        id: 'c4',
        text: 'Revisar contraste con WCAG',
        completed: false,
      };
      const updatedChecklist = [...(task?.checklist || []), newSubtask];

      const updatedTask = store.updateTask('10', { checklist: updatedChecklist });
      expect(updatedTask?.checklist).toHaveLength(4);
      expect(updatedTask?.checklist[3].text).toBe('Revisar contraste con WCAG');
    });

    it('should delete a subtask from the checklist in store', () => {
      const task = store.getTaskById('10');
      const updatedChecklist = task?.checklist.filter((item) => item.id !== 'c1');

      const updatedTask = store.updateTask('10', { checklist: updatedChecklist });
      expect(updatedTask?.checklist).toHaveLength(2);
      expect(updatedTask?.checklist.some((i) => i.id === 'c1')).toBe(false);
    });

    it('should correctly calculate completion percentage', () => {
      const task = store.getTaskById('10');
      const total = task?.checklist.length || 0;
      const completed = task?.checklist.filter((i) => i.completed).length || 0;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

      expect(percent).toBe(33);
    });
  });

  describe('User Management & Card Assignment', () => {
    const sampleUsers = [
      { id: 'u1', name: 'Ana García', email: 'ana@example.com', role: 'Frontend Lead', avatar: 'https://example.com/ana.svg' },
      { id: 'u2', name: 'Carlos Mendoza', email: 'carlos@example.com', role: 'Backend Dev', avatar: 'https://example.com/carlos.svg' },
    ];

    beforeEach(() => {
      store.setUsers(sampleUsers);
    });

    it('should set and get all users correctly', () => {
      const users = store.getUsers();
      expect(users).toHaveLength(2);
      expect(users[0].name).toBe('Ana García');
      expect(users[1].email).toBe('carlos@example.com');
    });

    it('should find user by id', () => {
      const user = store.getUserById('u1');
      expect(user).toBeDefined();
      expect(user?.name).toBe('Ana García');
      expect(user?.role).toBe('Frontend Lead');

      const nonExistent = store.getUserById('u999');
      expect(nonExistent).toBeUndefined();
    });

    it('should add a new user and emit USER_ADDED event', () => {
      let emittedEvent = null;
      let emittedUser = null;
      const unsubscribe = store.subscribe(({ event, payload }) => {
        emittedEvent = event;
        emittedUser = payload;
      });

      const newUser = {
        id: 'u3',
        name: 'Elena Ramos',
        email: 'elena@example.com',
        role: 'UI/UX Designer',
        avatar: 'https://example.com/elena.svg',
      };

      store.addUser(newUser);

      expect(store.getUsers()).toHaveLength(3);
      expect(store.getUserById('u3')?.name).toBe('Elena Ramos');
      expect(emittedEvent).toBe('USER_ADDED');
      expect(emittedUser).toEqual(newUser);

      unsubscribe();
    });

    it('should assign a user to a task via assigneeId and assignee object', () => {
      const task = {
        id: '99',
        title: 'Implementar autenticación',
        status: 'todo',
        priority: 'Alta',
        dueDate: '2026-09-30',
        assigneeId: 'u1',
        assignee: store.getUserById('u1'),
      };

      store.addTask(task);
      const savedTask = store.getTaskById('99');

      expect(savedTask).toBeDefined();
      expect(savedTask?.assigneeId).toBe('u1');
      expect(savedTask?.assignee?.name).toBe('Ana García');

      // Update assignee to Carlos
      const updated = store.updateTask('99', {
        assigneeId: 'u2',
        assignee: store.getUserById('u2'),
      });

      expect(updated?.assigneeId).toBe('u2');
      expect(updated?.assignee?.name).toBe('Carlos Mendoza');
    });

    it('should include users in getState()', () => {
      const state = store.getState();
      expect(state.users).toBeDefined();
      expect(state.users).toHaveLength(2);
    });
  });

  describe('Dynamic Column Management (addColumn, renameColumn, removeColumn)', () => {
    it('should initialize with 3 default columns (todo, doing, done)', () => {
      const columns = store.getColumns();
      expect(columns).toHaveLength(3);
      expect(columns.map((c) => c.id)).toEqual(['todo', 'doing', 'done']);
      expect(columns.every((c) => c.isCustom === false)).toBe(true);
    });

    it('should add a custom column with string title and notify subscribers', () => {
      const subscriber = vi.fn();
      store.subscribe(subscriber);

      const newCol = store.addColumn('En Revisión');

      expect(newCol.id).toBeDefined();
      expect(newCol.title).toBe('En Revisión');
      expect(newCol.isCustom).toBe(true);
      expect(store.getColumns()).toHaveLength(4);
      expect(store.getColumnById(newCol.id)).toEqual(newCol);

      expect(subscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'COLUMN_ADDED',
          payload: newCol,
        })
      );
    });

    it('should add a custom column with an explicit ID and object payload', () => {
      const col = store.addColumn({
        id: 'qa-testing',
        title: 'Pruebas QA',
        isCustom: true,
      });

      expect(col.id).toBe('qa-testing');
      expect(col.title).toBe('Pruebas QA');
      expect(store.getColumnById('qa-testing')?.title).toBe('Pruebas QA');
    });

    it('should generate unique IDs when adding columns with duplicate or empty names', () => {
      const col1 = store.addColumn('Diseño');
      const col2 = store.addColumn('Diseño');

      expect(col1.id).not.toBe(col2.id);
      expect(store.getColumns()).toHaveLength(5);
    });

    it('should rename an existing column title and notify subscribers', () => {
      const subscriber = vi.fn();
      store.subscribe(subscriber);

      const renamed = store.renameColumn('todo', 'Backlog');

      expect(renamed).not.toBeNull();
      expect(renamed?.title).toBe('Backlog');
      expect(store.getColumnById('todo')?.title).toBe('Backlog');

      expect(subscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'COLUMN_RENAMED',
          payload: expect.objectContaining({
            id: 'todo',
            title: 'Backlog',
          }),
        })
      );
    });

    it('should return null when renaming with empty or whitespace-only title', () => {
      const result1 = store.renameColumn('todo', '');
      const result2 = store.renameColumn('todo', '   ');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(store.getColumnById('todo')?.title).toBe('Por Hacer');
    });

    it('should return null when renaming a non-existent column', () => {
      const result = store.renameColumn('non-existent-id', 'Nuevo');
      expect(result).toBeNull();
    });

    it('should safely remove a custom column and notify subscribers', () => {
      const newCol = store.addColumn({ id: 'blocked', title: 'Bloqueado', isCustom: true });
      expect(store.getColumnById('blocked')).toBeDefined();

      const subscriber = vi.fn();
      store.subscribe(subscriber);

      const removed = store.removeColumn('blocked');
      expect(removed?.id).toBe('blocked');
      expect(store.getColumnById('blocked')).toBeUndefined();
      expect(store.getColumns()).toHaveLength(3);

      expect(subscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'COLUMN_REMOVED',
          payload: expect.objectContaining({
            id: 'blocked',
          }),
        })
      );
    });

    it('should NOT allow deletion of default columns (todo, doing, done)', () => {
      const removedTodo = store.removeColumn('todo');
      const removedDoing = store.removeColumn('doing');
      const removedDone = store.removeColumn('done');

      expect(removedTodo).toBeNull();
      expect(removedDoing).toBeNull();
      expect(removedDone).toBeNull();
      expect(store.getColumns()).toHaveLength(3);
    });

    it('should return null when attempting to remove a non-existent column', () => {
      const removed = store.removeColumn('random-404');
      expect(removed).toBeNull();
    });

    it('should safely migrate tasks to default "todo" column when custom column is removed', () => {
      const customCol = store.addColumn({ id: 'staging', title: 'En Staging', isCustom: true });

      const task1 = {
        id: 't1',
        title: 'Desplegar a Staging',
        status: 'staging',
        priority: 'Media',
        dueDate: '2026-09-30',
      };
      const task2 = {
        id: 't2',
        title: 'Test en Staging',
        status: 'staging',
        priority: 'Alta',
        dueDate: '2026-09-30',
      };
      const task3 = {
        id: 't3',
        title: 'Tarea en Done',
        status: 'done',
        priority: 'Baja',
        dueDate: '2026-09-30',
      };

      store.setTasks([task1, task2, task3]);
      expect(store.getTaskById('t1')?.status).toBe('staging');
      expect(store.getTaskById('t2')?.status).toBe('staging');

      // Remove the custom column
      const removed = store.removeColumn('staging');
      expect(removed?.id).toBe('staging');

      // Tasks previously in staging should now be safely moved to 'todo'
      expect(store.getTaskById('t1')?.status).toBe('todo');
      expect(store.getTaskById('t2')?.status).toBe('todo');
      expect(store.getTaskById('t3')?.status).toBe('done');
    });

    it('should calculate metrics dynamically across custom columns', () => {
      store.addColumn({ id: 'review', title: 'Revisión', isCustom: true });

      store.setTasks([
        { id: '1', title: 'T1', status: 'todo', priority: 'Alta', dueDate: '2026-09-15' },
        { id: '2', title: 'T2', status: 'doing', priority: 'Media', dueDate: '2026-09-15' },
        { id: '3', title: 'T3', status: 'done', priority: 'Baja', dueDate: '2026-09-15' },
        { id: '4', title: 'T4', status: 'review', priority: 'Alta', dueDate: '2026-09-15' },
      ]);

      const metrics = store.getMetrics();
      expect(metrics.total).toBe(4);
      expect(metrics.todo).toBe(1);
      expect(metrics.doing).toBe(1);
      expect(metrics.done).toBe(1);
      expect(metrics.review).toBe(1);
    });

    it('should include columns in getState() snapshot', () => {
      const state = store.getState();
      expect(state.columns).toBeDefined();
      expect(Array.isArray(state.columns)).toBe(true);
      expect(state.columns).toHaveLength(3);
    });

    it('should persist columns to localStorage under kanban_columns', () => {
      const storageMap = new Map();
      const mockStorage = {
        getItem: vi.fn((key) => storageMap.get(key) || null),
        setItem: vi.fn((key, val) => storageMap.set(key, String(val))),
        removeItem: vi.fn((key) => storageMap.delete(key)),
        clear: vi.fn(() => storageMap.clear()),
      };

      const originalStorage = globalThis.localStorage;
      globalThis.localStorage = mockStorage;

      try {
        store.addColumn({ id: 'persisted-col', title: 'Persistida', isCustom: true });
        expect(mockStorage.setItem).toHaveBeenCalledWith(
          'kanban_columns',
          expect.stringContaining('persisted-col')
        );

        store.renameColumn('persisted-col', 'Renombrada');
        expect(mockStorage.setItem).toHaveBeenCalledWith(
          'kanban_columns',
          expect.stringContaining('Renombrada')
        );

        store.removeColumn('persisted-col');
        expect(mockStorage.setItem).toHaveBeenCalledWith(
          'kanban_columns',
          expect.not.stringContaining('persisted-col')
        );
      } finally {
        if (originalStorage !== undefined) {
          globalThis.localStorage = originalStorage;
        } else {
          delete globalThis.localStorage;
        }
      }
    });

    it('should retrieve a column by ID or return undefined for invalid ID', () => {
      expect(store.getColumnById('todo')?.title).toBe('Por Hacer');
      expect(store.getColumnById('invalid-col-id')).toBeUndefined();
    });

    it('should support moving tasks into a custom column', () => {
      store.addColumn({ id: 'in-review', title: 'En Revisión', isCustom: true });
      store.setTasks([
        { id: '1', title: 'Tarea 1', status: 'todo', priority: 'Alta', dueDate: '2026-09-15' },
      ]);

      const moved = store.moveTask('1', 'in-review');
      expect(moved?.newStatus).toBe('in-review');
      expect(store.getTaskById('1')?.status).toBe('in-review');
      expect(store.getMetrics()['in-review']).toBe(1);
    });

    it('should fallback to default columns when setColumns receives empty or invalid array', () => {
      store.addColumn('Custom 1');
      expect(store.getColumns()).toHaveLength(4);

      store.setColumns([]);
      expect(store.getColumns()).toHaveLength(3);
      expect(store.getColumns().map((c) => c.id)).toEqual(['todo', 'doing', 'done']);
    });

    it('should reset columns to default schema on resetColumns', () => {
      store.addColumn('Custom Col');
      expect(store.getColumns()).toHaveLength(4);

      store.resetColumns();
      expect(store.getColumns()).toHaveLength(3);
      expect(store.getColumns().map((c) => c.id)).toEqual(['todo', 'doing', 'done']);
    });

    it('should sanitize column titles with emojis and Spanish accents into clean IDs', () => {
      const col = store.addColumn('🚀 En Validación & Despliegue');
      expect(col.id).toBe('en-validacion-despliegue');
      expect(col.title).toBe('🚀 En Validación & Despliegue');
      expect(store.getColumnById('en-validacion-despliegue')).toBeDefined();
    });

    it('should sanitize explicitly provided column IDs containing spaces or illegal characters', () => {
      const col = store.addColumn({
        id: '  Custom Bad ID #99!  ',
        title: 'Columna con ID Sucio',
        isCustom: true,
      });

      expect(col.id).toBe('custom-bad-id-99');
      expect(col.title).toBe('Columna con ID Sucio');
      expect(store.getColumnById('custom-bad-id-99')).toBeDefined();
    });

    it('should safely generate a valid ID when title contains only emojis or non-alphanumerics', () => {
      const col = store.addColumn('🔥✨');
      expect(col.id).toMatch(/^col(-\d+)?$/);
      expect(col.title).toBe('🔥✨');
    });

    it('should safely fall back to default columns if stored localStorage data is corrupted or missing default columns', () => {
      const storageMap = new Map();
      const mockStorage = {
        getItem: vi.fn((key) => storageMap.get(key) || null),
        setItem: vi.fn((key, val) => storageMap.set(key, String(val))),
        removeItem: vi.fn((key) => storageMap.delete(key)),
        clear: vi.fn(() => storageMap.clear()),
      };

      const originalStorage = globalThis.localStorage;
      globalThis.localStorage = mockStorage;

      try {
        // Case 1: Corrupted items in array
        storageMap.set('kanban_columns', JSON.stringify([null, { id: '', title: '' }]));
        expect(store.loadStoredColumns()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: 'todo' }),
            expect.objectContaining({ id: 'doing' }),
            expect.objectContaining({ id: 'done' }),
          ])
        );

        // Case 2: Custom column only, missing default columns
        storageMap.set(
          'kanban_columns',
          JSON.stringify([{ id: 'custom-only', title: 'Solo Custom', isCustom: true }])
        );
        expect(store.loadStoredColumns()).toHaveLength(3);
        expect(store.loadStoredColumns().map((c) => c.id)).toEqual(['todo', 'doing', 'done']);

        // Case 3: Valid columns including custom
        storageMap.set(
          'kanban_columns',
          JSON.stringify([
            { id: 'todo', title: 'Por Hacer', isCustom: false },
            { id: 'doing', title: 'En Proceso', isCustom: false },
            { id: 'done', title: 'Finalizado', isCustom: false },
            { id: 'qa', title: 'Control de Calidad', isCustom: true },
          ])
        );
        const loaded = store.loadStoredColumns();
        expect(loaded).toHaveLength(4);
        expect(loaded.find((c) => c.id === 'qa')?.title).toBe('Control de Calidad');
      } finally {
        if (originalStorage !== undefined) {
          globalThis.localStorage = originalStorage;
        } else {
          delete globalThis.localStorage;
        }
      }
    });

    it('should safely handle tasks whose status matches JavaScript prototype properties in getMetrics()', () => {
      store.setTasks([
        { id: '1', title: 'Task toString', status: 'toString', priority: 'Alta', dueDate: '2026-09-15' },
        { id: '2', title: 'Task valueOf', status: 'valueOf', priority: 'Media', dueDate: '2026-09-15' },
        { id: '3', title: 'Task constructor', status: 'constructor', priority: 'Baja', dueDate: '2026-09-15' },
        { id: '4', title: 'Task todo', status: 'todo', priority: 'Alta', dueDate: '2026-09-15' },
      ]);

      const metrics = store.getMetrics();
      expect(metrics.total).toBe(4);
      expect(metrics.todo).toBe(1);
      expect(metrics.toString).toBe(1);
      expect(metrics.valueOf).toBe(1);
      expect(metrics.constructor).toBe(1);
      expect(typeof metrics.toString).toBe('number');
      expect(Number.isNaN(metrics.toString)).toBe(false);
    });

    it('should preserve default columns and force isCustom to false even if omitted in setColumns()', () => {
      store.setColumns([{ id: 'custom-only', title: 'Solo Custom', isCustom: true }]);
      const columns = store.getColumns();

      expect(columns.some((c) => c.id === 'todo')).toBe(true);
      expect(columns.some((c) => c.id === 'doing')).toBe(true);
      expect(columns.some((c) => c.id === 'done')).toBe(true);
      expect(columns.some((c) => c.id === 'custom-only')).toBe(true);
      expect(store.getColumnById('todo')?.isCustom).toBe(false);
      expect(store.getColumnById('doing')?.isCustom).toBe(false);
      expect(store.getColumnById('done')?.isCustom).toBe(false);
      expect(store.getColumnById('custom-only')?.isCustom).toBe(true);
    });

    it('should prefix reserved prototype property names when adding a column', () => {
      const col1 = store.addColumn({ id: 'toString', title: 'To String' });
      const col2 = store.addColumn('constructor');

      expect(col1.id).toBe('col-tostring');
      expect(col2.id).toBe('col-constructor');
      expect(store.getColumnById('col-tostring')).toBeDefined();
      expect(store.getColumnById('col-constructor')).toBeDefined();
    });

    it('should ensure default columns in loadStoredColumns cannot have isCustom set to true', () => {
      const storageMap = new Map();
      const mockStorage = {
        getItem: vi.fn((key) => storageMap.get(key) || null),
        setItem: vi.fn((key, val) => storageMap.set(key, String(val))),
        removeItem: vi.fn((key) => storageMap.delete(key)),
        clear: vi.fn(() => storageMap.clear()),
      };

      const originalStorage = globalThis.localStorage;
      globalThis.localStorage = mockStorage;

      try {
        storageMap.set(
          'kanban_columns',
          JSON.stringify([
            { id: 'todo', title: 'Por Hacer', isCustom: true },
            { id: 'doing', title: 'En Proceso', isCustom: true },
            { id: 'done', title: 'Finalizado', isCustom: true },
          ])
        );
        const loaded = store.loadStoredColumns();
        expect(loaded.find((c) => c.id === 'todo')?.isCustom).toBe(false);
        expect(loaded.find((c) => c.id === 'doing')?.isCustom).toBe(false);
        expect(loaded.find((c) => c.id === 'done')?.isCustom).toBe(false);
      } finally {
        if (originalStorage !== undefined) {
          globalThis.localStorage = originalStorage;
        } else {
          delete globalThis.localStorage;
        }
      }
    });
  });

  describe('Dynamic Status Label Resolution (getStatusLabel)', () => {
    it('should resolve default column labels correctly', () => {
      expect(getStatusLabel('todo')).toBe('Por Hacer');
      expect(getStatusLabel('doing')).toBe('En Proceso');
      expect(getStatusLabel('done')).toBe('Finalizado');
    });

    it('should dynamically resolve custom column title from store', () => {
      store.addColumn({ id: 'staging-env', title: 'Ambiente de Staging', isCustom: true });
      expect(getStatusLabel('staging-env')).toBe('Ambiente de Staging');
    });

    it('should fall back to raw status or default if column is unrecognized', () => {
      expect(getStatusLabel('unknown-col')).toBe('unknown-col');
      expect(getStatusLabel('')).toBe('Por Hacer');
    });
  });

  describe('SortableJS Drag & Drop Event Normalization (parseDragEvent)', () => {
    it('should return null for null or invalid drag event objects', () => {
      expect(parseDragEvent(null)).toBeNull();
      expect(parseDragEvent({})).toBeNull();
      expect(parseDragEvent({ item: {} })).toBeNull();
      expect(parseDragEvent({ item: { dataset: {} } })).toBeNull();
    });

    it('should normalize cross-column drag event into custom column', () => {
      const mockCard = { dataset: { id: '42' } };
      const fromContainer = { dataset: { status: 'todo' } };
      const toContainer = { dataset: { status: 'qa-review' } };

      const event = {
        item: mockCard,
        from: fromContainer,
        to: toContainer,
        oldIndex: 0,
        newIndex: 2,
      };

      const parsed = parseDragEvent(event);
      expect(parsed).not.toBeNull();
      expect(parsed?.taskId).toBe('42');
      expect(parsed?.fromStatus).toBe('todo');
      expect(parsed?.toStatus).toBe('qa-review');
      expect(parsed?.isCrossColumn).toBe(true);
      expect(parsed?.hasPositionChanged).toBe(true);
    });

    it('should normalize cross-column drag event between two custom columns', () => {
      const mockCard = { dataset: { id: '101' } };
      const fromContainer = { dataset: { status: 'review' } };
      const toContainer = { dataset: { status: 'deploy' } };

      const event = {
        item: mockCard,
        from: fromContainer,
        to: toContainer,
        oldIndex: 1,
        newIndex: 0,
      };

      const parsed = parseDragEvent(event);
      expect(parsed?.fromStatus).toBe('review');
      expect(parsed?.toStatus).toBe('deploy');
      expect(parsed?.isCrossColumn).toBe(true);
    });

    it('should identify same-column reordering vs identical position', () => {
      const mockCard = { dataset: { id: '5' } };
      const container = { dataset: { status: 'todo' } };

      // Position changed
      const moved = parseDragEvent({
        item: mockCard,
        from: container,
        to: container,
        oldIndex: 0,
        newIndex: 3,
      });
      expect(moved?.isCrossColumn).toBe(false);
      expect(moved?.hasPositionChanged).toBe(true);

      // Position unchanged
      const unchanged = parseDragEvent({
        item: mockCard,
        from: container,
        to: container,
        oldIndex: 1,
        newIndex: 1,
      });
      expect(unchanged?.isCrossColumn).toBe(false);
      expect(unchanged?.hasPositionChanged).toBe(false);
    });
  });

  describe('SortableJS Dropzone Lifecycle & Registration', () => {
    let mockInstances = [];

    class MockSortable {
      constructor(el, opts) {
        this.el = el;
        this.options = opts;
        this.destroyed = false;
        MockSortable.instances.set(el, this);
        mockInstances.push(this);
      }
      destroy() {
        this.destroyed = true;
        MockSortable.instances.delete(this.el);
      }
      static get(el) {
        return MockSortable.instances.get(el) || null;
      }
    }
    MockSortable.instances = new Map();

    beforeEach(() => {
      mockInstances = [];
      MockSortable.instances.clear();
      globalThis.window = globalThis.window || {};
      globalThis.window.Sortable = MockSortable;
      destroyDragAndDrop();
    });

    afterEach(() => {
      destroyDragAndDrop();
      if (globalThis.window) {
        delete globalThis.window.Sortable;
      }
    });

    it('should register an individual dropzone container with registerDropzone', () => {
      const mockContainer = { dataset: { status: 'qa' } };
      const onEndSpy = vi.fn();

      const instance = registerDropzone(mockContainer, onEndSpy);
      expect(instance).not.toBeNull();
      expect(getSortableInstances()).toHaveLength(1);
      expect(getSortableInstances()[0]).toBe(instance);
    });

    it('should destroy previous Sortable instance if re-registered on the same container', () => {
      const mockContainer = { dataset: { status: 'qa' } };
      const inst1 = registerDropzone(mockContainer);
      expect(inst1.destroyed).toBe(false);

      const inst2 = registerDropzone(mockContainer);
      expect(inst1.destroyed).toBe(true);
      expect(inst2.destroyed).toBe(false);
      expect(getSortableInstances()).toHaveLength(1);
      expect(getSortableInstances()[0]).toBe(inst2);
    });

    it('should clean up all active Sortable instances on destroyDragAndDrop', () => {
      const c1 = { dataset: { status: 'c1' } };
      const c2 = { dataset: { status: 'c2' } };

      registerDropzone(c1);
      registerDropzone(c2);
      expect(getSortableInstances()).toHaveLength(2);

      destroyDragAndDrop();
      expect(getSortableInstances()).toHaveLength(0);
    });
  });

  describe('Modal Dropdowns & UI Board Synchronization', () => {
    it('should dynamically populate status selects across modals with active columns', () => {
      const createSelect = {
        tagName: 'SELECT',
        value: 'todo',
        innerHTML: '',
        children: [],
        appendChild(child) {
          this.children.push(child);
        },
      };
      const detailSelect = {
        tagName: 'SELECT',
        value: 'doing',
        innerHTML: '',
        children: [],
        appendChild(child) {
          this.children.push(child);
        },
      };

      const originalDoc = globalThis.document;
      globalThis.document = {
        getElementById: (id) => {
          if (id === 'create-task-status') return createSelect;
          if (id === 'detail-task-status') return detailSelect;
          return null;
        },
        createElement: (tag) => {
          return { tagName: tag.toUpperCase(), value: '', textContent: '' };
        },
      };

      try {
        store.addColumn({ id: 'in-staging', title: 'Staging Env', isCustom: true });

        populateColumnStatusDropdowns();

        expect(createSelect.children).toHaveLength(4);
        expect(createSelect.children.map((o) => o.value)).toEqual(['todo', 'doing', 'done', 'in-staging']);
        expect(createSelect.children.map((o) => o.textContent)).toEqual([
          'Por Hacer',
          'En Proceso',
          'Finalizado',
          'Staging Env',
        ]);
        expect(createSelect.value).toBe('todo');
        expect(detailSelect.value).toBe('doing');
      } finally {
        if (originalDoc !== undefined) {
          globalThis.document = originalDoc;
        } else {
          delete globalThis.document;
        }
      }
    });

    it('should render board without throwing when task status has prototype property name', () => {
      const originalDoc = globalThis.document;
      const containers = new Map();

      globalThis.document = {
        getElementById: (id) => containers.get(id) || null,
        createElement: () => ({
          dataset: {},
          setAttribute: vi.fn(),
          classList: { add: vi.fn(), remove: vi.fn(), toggle: vi.fn() },
          appendChild: vi.fn(),
          querySelectorAll: () => [],
        }),
      };

      try {
        const tasks = [
          { id: 't1', title: 'Task with toString status', status: 'toString' },
          { id: 't2', title: 'Task with normal status', status: 'todo' },
        ];

        // Should not throw TypeError: columnTasksMap[task.status].push is not a function
        expect(() => renderBoard(tasks)).not.toThrow();
      } finally {
        if (originalDoc !== undefined) {
          globalThis.document = originalDoc;
        } else {
          delete globalThis.document;
        }
      }
    });
  });
});



