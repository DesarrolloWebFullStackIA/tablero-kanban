import { describe, it, expect, beforeEach, vi } from 'vitest';
import store from '../src/js/store.js';

describe('Central State Store (store.js)', () => {
  const sampleTasks = [
    {
      id: '1',
      title: 'Diseñar maqueta en Figma',
      description: 'Crear wireframes interactivos.',
      priority: 'Alta',
      dueDate: '2026-09-15',
      status: 'todo',
    },
    {
      id: '2',
      title: 'Configurar json-server',
      description: 'Iniciar la API simulada.',
      priority: 'Media',
      dueDate: '2026-09-10',
      status: 'doing',
    },
    {
      id: '3',
      title: 'Estructurar HTML semántico',
      description: 'Definir header y columnas.',
      priority: 'Baja',
      dueDate: '2026-09-12',
      status: 'done',
    },
  ];

  beforeEach(() => {
    store.tasks = [];
    store.commentsMap.clear();
    store.subscribers.clear();
    store.resetFilters();
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

    it('should combine search query and priority filter', () => {
      store.setSearchQuery('HTML');
      store.setPriorityFilter('Baja');
      expect(store.getFilteredTasks()).toHaveLength(1);

      store.setPriorityFilter('Alta');
      expect(store.getFilteredTasks()).toHaveLength(0);
    });

    it('should reset filters to show all tasks', () => {
      store.setSearchQuery('json');
      store.setPriorityFilter('Media');
      expect(store.getFilteredTasks()).toHaveLength(1);

      store.resetFilters();
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
});

