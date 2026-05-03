// contexts/ThemeContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  colors: typeof lightColors;
};

const lightColors = {
  background: '#fbfdff',
  card: '#FFFFFF',
  cardBorder: '#f0f4fc',
  text: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  primary: '#4361ee',
  headerBg: '#fbfdff',
  headerBorder: '#f1f5f9',
  inputBg: '#f1f5f9',
  inputBorder: '#e2e8f0',
  bottomNavBg: 'rgba(255, 255, 255, 0.94)',
  bottomNavBorder: '#edf2f7',
};

const darkColors = {
  background: '#0f172a',
  card: '#1e293b',
  cardBorder: '#334155',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  primary: '#4361ee',
  headerBg: '#0f172a',
  headerBorder: '#1e293b',
  inputBg: '#1e293b',
  inputBorder: '#334155',
  bottomNavBg: 'rgba(15, 23, 42, 0.94)',
  bottomNavBorder: '#1e293b',
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  colors: lightColors,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem('@plansync:theme');
      if (saved === 'dark') setTheme('dark');
    } catch (error) {}
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    await AsyncStorage.setItem('@plansync:theme', newTheme);
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);