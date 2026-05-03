// contexts/DataContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch } from '../services/api';

type DataContextType = {
  classes: any[];
  tasks: any[];
  notes: any[];
  reminders: any[];
  loading: boolean;
  refreshData: () => void;
};

const DataContext = createContext<DataContextType>({
  classes: [],
  tasks: [],
  notes: [],
  reminders: [],
  loading: true,
  refreshData: () => {},
});

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [classes, setClasses] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAllData = useCallback(async () => {
    // Only load if token exists
    const token = await AsyncStorage.getItem('@plansync:auth_token');
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      const [c, t, n, r] = await Promise.all([
        apiFetch('/courses'),
        apiFetch('/tasks'),
        apiFetch('/notes'),
        apiFetch('/reminders'),
      ]);
      setClasses(c || []);
      setTasks(t || []);
      setNotes(n || []);
      setReminders(r || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
    (global as any).refreshAllData = loadAllData;
  }, [loadAllData]);

  const refreshData = () => {
    loadAllData();
  };

  return (
    <DataContext.Provider value={{ classes, tasks, notes, reminders, loading, refreshData }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);