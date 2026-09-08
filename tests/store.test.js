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
});


