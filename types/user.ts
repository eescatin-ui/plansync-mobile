export type User = {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatar_color: string;
  created_at: string;
  updated_at: string;
};

export type AuthData = {
  user: User;
  token: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
  remember?: boolean;
};

export type RegisterCredentials = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  terms: boolean;
  remember?: boolean;
};

