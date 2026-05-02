// services/authService.ts
import { AuthData, LoginCredentials, RegisterCredentials, User } from '../types/user';
import { apiFetch } from './api';
import { userStorage } from './userStorage';

export const authService = {
  register: async (credentials: RegisterCredentials): Promise<AuthData> => {
    try {
      const response = await apiFetch('/register', {
        method: 'POST',
        body: JSON.stringify({
          id: userStorage.generateId(),
          name: credentials.name,
          email: credentials.email.toLowerCase(),
          password: credentials.password,
          avatar_color: authService.generateAvatarColor(),
        }),
      });

      const { user, token } = response;
      await userStorage.saveToken(token);
      await userStorage.saveCurrentUser(user);

      if (credentials.remember) {
        await userStorage.saveRememberedCredentials(credentials.email, credentials.password);
      }

      return { user, token };
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Registration failed.');
    }
  },

  login: async (credentials: LoginCredentials): Promise<AuthData> => {
    try {
      const response = await apiFetch('/login', {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email.toLowerCase(),
          password: credentials.password,
        }),
      });

      const { user, token } = response;
      await userStorage.saveToken(token);
      await userStorage.saveCurrentUser(user);

      if (credentials.remember) {
        await userStorage.saveRememberedCredentials(credentials.email, credentials.password);
      } else {
        await userStorage.clearRememberedCredentials();
      }

      return { user, token };
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Invalid email or password');
    }
  },

  logout: async (): Promise<void> => {
    try {
      await apiFetch('/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Logout backend error:', error);
    } finally {
      await userStorage.clearAll();
    }
  },

  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = await userStorage.getToken();
      const user = await userStorage.getCurrentUser();
      return !!(token && user);
    } catch {
      return false;
    }
  },

  getAuthData: async (): Promise<AuthData | null> => {
    try {
      const token = await userStorage.getToken();
      const user = await userStorage.getCurrentUser();
      if (token && user) {
        return { user, token };
      }
      return null;
    } catch {
      return null;
    }
  },

  updateProfile: async (userId: string, updates: Partial<User>): Promise<User> => {
    try {
      const user = await apiFetch('/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      await userStorage.saveCurrentUser(user);
      return user;
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  },

  changePassword: async (userId: string, currentPassword: string, newPassword: string): Promise<void> => {
    try {
      await apiFetch('/profile/password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
    } catch (error: any) {
      console.error('Change password error:', error);
      throw new Error(error.message || 'Failed to change password');
    }
  },

  generateAvatarColor: (): string => {
    const colors = [
      '#4361EE', '#3A0CA3', '#7209B7', '#F72585',
      '#4CC9F0', '#4895EF', '#560BAD', '#E63946',
      '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  },
};
