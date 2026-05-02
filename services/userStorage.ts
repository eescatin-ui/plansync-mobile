// services/userStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/user';
import { apiFetch } from './api';

const USER_STORAGE_KEYS = {
  AUTH_TOKEN: '@plansync:auth_token',
  CURRENT_USER: '@plansync:current_user',
  USERS_LIST: '@plansync:users_list',
  REMEMBERED_CREDENTIALS: '@plansync:remembered_credentials',
  CLASSES: '@plansync:classes',
  TASKS: '@plansync:tasks',
  NOTES: '@plansync:notes',
  REMINDERS: '@plansync:reminders',
  PROFILE_IMAGE: '@plansync:profile_image',
};

export const userStorage = {
  // ==========================================
  // HELPER: Get current user ID for data isolation
  // ==========================================
  getUserId: async (): Promise<string | null> => {
    try {
      const user = await userStorage.getCurrentUser();
      return user?.id || null;
    } catch {
      return null;
    }
  },

  // Helper: Get user-specific storage key
  getUserKey: async (baseKey: string): Promise<string> => {
    const userId = await userStorage.getUserId();
    return userId ? `${baseKey}:${userId}` : baseKey;
  },

  // ==========================================
  // AUTH TOKEN METHODS
  // ==========================================
  saveToken: async (token: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEYS.AUTH_TOKEN, token);
    } catch (error) {
      console.error('Error saving token:', error);
      throw error;
    }
  },

  getToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(USER_STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  // ==========================================
  // CURRENT USER METHODS
  // ==========================================
  saveCurrentUser: async (user: User): Promise<void> => {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving current user:', error);
      throw error;
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      const userData = await AsyncStorage.getItem(USER_STORAGE_KEYS.CURRENT_USER);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // ==========================================
  // USERS LIST METHODS
  // ==========================================
  getAllUsers: async (): Promise<User[]> => {
    try {
      const usersData = await AsyncStorage.getItem(USER_STORAGE_KEYS.USERS_LIST);
      return usersData ? JSON.parse(usersData) : [];
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  },

  saveAllUsers: async (users: User[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEYS.USERS_LIST, JSON.stringify(users));
    } catch (error) {
      console.error('Error saving all users:', error);
      throw error;
    }
  },

  addUser: async (user: User): Promise<void> => {
    try {
      const users = await userStorage.getAllUsers();
      users.push(user);
      await userStorage.saveAllUsers(users);
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  },

  findUserByEmail: async (email: string): Promise<User | null> => {
    try {
      const users = await userStorage.getAllUsers();
      return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  },

  findUserById: async (id: string): Promise<User | null> => {
    try {
      const users = await userStorage.getAllUsers();
      return users.find(user => user.id === id) || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  },

  updateUser: async (updatedUser: User): Promise<void> => {
    try {
      const users = await userStorage.getAllUsers();
      const index = users.findIndex(user => user.id === updatedUser.id);
      if (index !== -1) {
        users[index] = { ...users[index], ...updatedUser, updated_at: new Date().toISOString() };
        await userStorage.saveAllUsers(users);
        const currentUser = await userStorage.getCurrentUser();
        if (currentUser && currentUser.id === updatedUser.id) {
          await userStorage.saveCurrentUser(users[index]);
        }
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  deleteUser: async (userId: string): Promise<void> => {
    try {
      const users = await userStorage.getAllUsers();
      const filteredUsers = users.filter(user => user.id !== userId);
      await userStorage.saveAllUsers(filteredUsers);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // ==========================================
  // REMEMBERED CREDENTIALS METHODS
  // ==========================================
  saveRememberedCredentials: async (email: string, password: string): Promise<void> => {
    try {
      const key = await userStorage.getUserKey(USER_STORAGE_KEYS.REMEMBERED_CREDENTIALS);
      const credentials = JSON.stringify({ email, password });
      await AsyncStorage.setItem(key, credentials);
    } catch (error) {
      console.error('Error saving remembered credentials:', error);
      throw error;
    }
  },

  getRememberedCredentials: async (): Promise<{ email: string; password: string } | null> => {
    try {
      const key = await userStorage.getUserKey(USER_STORAGE_KEYS.REMEMBERED_CREDENTIALS);
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting remembered credentials:', error);
      return null;
    }
  },

  clearRememberedCredentials: async (): Promise<void> => {
    try {
      const key = await userStorage.getUserKey(USER_STORAGE_KEYS.REMEMBERED_CREDENTIALS);
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing remembered credentials:', error);
      throw error;
    }
  },

  // ==========================================
  // CLASS SCHEDULE METHODS (User-Specific)
  // ==========================================
  getAllClasses: async (): Promise<any[]> => {
    try {
      return await apiFetch('/courses');
    } catch (error) {
      console.error('Error getting classes:', error);
      return [];
    }
  },

  saveAllClasses: async (classes: any[]): Promise<void> => {
    try {
      const key = await userStorage.getUserKey(USER_STORAGE_KEYS.CLASSES);
      await AsyncStorage.setItem(key, JSON.stringify(classes));
    } catch (error) {
      console.error('Error saving classes:', error);
      throw error;
    }
  },

  addClass: async (classItem: any): Promise<void> => {
    try {
      await apiFetch('/courses', {
        method: 'POST',
        body: JSON.stringify(classItem),
      });
    } catch (error) {
      console.error('Error adding class:', error);
      throw error;
    }
  },

  updateClass: async (updatedClass: any): Promise<void> => {
    try {
      await apiFetch(`/courses/${encodeURIComponent(updatedClass.id)}`, {
        method: 'PUT',
        body: JSON.stringify(updatedClass),
      });
    } catch (error) {
      console.error('Error updating class:', error);
      throw error;
    }
  },

  deleteClass: async (classId: string): Promise<void> => {
    try {
      await apiFetch(`/courses/${encodeURIComponent(classId)}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting class:', error);
      throw error;
    }
  },

  getClassesByDay: async (day: string): Promise<any[]> => {
    try {
      const classes = await userStorage.getAllClasses();
      return classes.filter((c: any) => c.day === day);
    } catch (error) {
      console.error('Error getting classes by day:', error);
      return [];
    }
  },

  // ==========================================
  // TASKS METHODS (User-Specific)
  // ==========================================
  getAllTasks: async (): Promise<any[]> => {
    try {
      return await apiFetch('/tasks');
    } catch (error) {
      console.error('Error getting tasks:', error);
      return [];
    }
  },

  saveAllTasks: async (tasks: any[]): Promise<void> => {
    try {
      const key = await userStorage.getUserKey(USER_STORAGE_KEYS.TASKS);
      await AsyncStorage.setItem(key, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
      throw error;
    }
  },

  addTask: async (task: any): Promise<void> => {
    try {
      await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify(task),
      });
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  },

  updateTask: async (updatedTask: any): Promise<void> => {
    try {
      await apiFetch(`/tasks/${encodeURIComponent(updatedTask.id)}`, {
        method: 'PUT',
        body: JSON.stringify(updatedTask),
      });
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  deleteTask: async (taskId: string): Promise<void> => {
    try {
      await apiFetch(`/tasks/${encodeURIComponent(taskId)}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  // ==========================================
  // NOTES METHODS (User-Specific)
  // ==========================================
  getAllNotes: async (): Promise<any[]> => {
    try {
      return await apiFetch('/notes');
    } catch (error) {
      console.error('Error getting notes:', error);
      return [];
    }
  },

  saveAllNotes: async (notes: any[]): Promise<void> => {
    try {
      const key = await userStorage.getUserKey(USER_STORAGE_KEYS.NOTES);
      await AsyncStorage.setItem(key, JSON.stringify(notes));
    } catch (error) {
      console.error('Error saving notes:', error);
      throw error;
    }
  },

  addNote: async (note: any): Promise<void> => {
    try {
      await apiFetch('/notes', {
        method: 'POST',
        body: JSON.stringify(note),
      });
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  },

  updateNote: async (updatedNote: any): Promise<void> => {
    try {
      await apiFetch(`/notes/${encodeURIComponent(updatedNote.id)}`, {
        method: 'PUT',
        body: JSON.stringify(updatedNote),
      });
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  },

  deleteNote: async (noteId: string): Promise<void> => {
    try {
      await apiFetch(`/notes/${encodeURIComponent(noteId)}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  },

  // ==========================================
  // REMINDERS METHODS (User-Specific)
  // ==========================================
  getAllReminders: async (): Promise<any[]> => {
    try {
      return await apiFetch('/reminders');
    } catch (error) {
      console.error('Error getting reminders:', error);
      return [];
    }
  },

  saveAllReminders: async (reminders: any[]): Promise<void> => {
    try {
      const key = await userStorage.getUserKey(USER_STORAGE_KEYS.REMINDERS);
      await AsyncStorage.setItem(key, JSON.stringify(reminders));
    } catch (error) {
      console.error('Error saving reminders:', error);
      throw error;
    }
  },

  addReminder: async (reminder: any): Promise<void> => {
    try {
      await apiFetch('/reminders', {
        method: 'POST',
        body: JSON.stringify(reminder),
      });
    } catch (error) {
      console.error('Error adding reminder:', error);
      throw error;
    }
  },

  updateReminder: async (updatedReminder: any): Promise<void> => {
    try {
      await apiFetch(`/reminders/${encodeURIComponent(updatedReminder.id)}`, {
        method: 'PUT',
        body: JSON.stringify(updatedReminder),
      });
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  },

  deleteReminder: async (reminderId: string): Promise<void> => {
    try {
      await apiFetch(`/reminders/${encodeURIComponent(reminderId)}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  },

  // ==========================================
  // PROFILE IMAGE METHODS (User-Specific)
  // ==========================================
  saveProfileImage: async (uri: string): Promise<void> => {
    try {
      const key = await userStorage.getUserKey(USER_STORAGE_KEYS.PROFILE_IMAGE);
      await AsyncStorage.setItem(key, uri);
    } catch (error) {
      console.error('Error saving profile image:', error);
      throw error;
    }
  },

  getProfileImage: async (): Promise<string | null> => {
    try {
      const key = await userStorage.getUserKey(USER_STORAGE_KEYS.PROFILE_IMAGE);
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Error getting profile image:', error);
      return null;
    }
  },

  // ==========================================
  // UTILITY METHODS
  // ==========================================
  clearAll: async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([
        USER_STORAGE_KEYS.AUTH_TOKEN,
        USER_STORAGE_KEYS.CURRENT_USER,
      ]);
    } catch (error) {
      console.error('Error clearing user data:', error);
      throw error;
    }
  },

  wipeAllData: async (): Promise<void> => {
    try {
      const userId = await userStorage.getUserId();
      if (userId) {
        await AsyncStorage.multiRemove([
          `${USER_STORAGE_KEYS.CLASSES}:${userId}`,
          `${USER_STORAGE_KEYS.TASKS}:${userId}`,
          `${USER_STORAGE_KEYS.NOTES}:${userId}`,
          `${USER_STORAGE_KEYS.REMINDERS}:${userId}`,
          `${USER_STORAGE_KEYS.PROFILE_IMAGE}:${userId}`,
          `${USER_STORAGE_KEYS.REMEMBERED_CREDENTIALS}:${userId}`,
        ]);
      }
    } catch (error) {
      console.error('Error wiping all data:', error);
      throw error;
    }
  },

  wipeSampleData: async (): Promise<void> => {
    try {
      const key = await userStorage.getUserKey(USER_STORAGE_KEYS.CLASSES);
      await AsyncStorage.setItem(key, JSON.stringify([]));
    } catch (error) {
      console.error('Error wiping sample data:', error);
    }
  },

  generateId: (): string => {
    return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  },

  hashPassword: (password: string): string => {
    return password.split('').reverse().join('') + '_plansync_hash';
  },

  verifyPassword: (password: string, hashedPassword: string): boolean => {
    const hashed = password.split('').reverse().join('') + '_plansync_hash';
    return hashed === hashedPassword;
  },
};