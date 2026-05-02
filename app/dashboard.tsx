// app/dashboard.tsx
import { FontAwesome5 } from '@expo/vector-icons';

import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import { userStorage } from '../services/userStorage';
export default function DashboardScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadAllData = useCallback(async () => {
    try {
      const currentUser = await userStorage.getCurrentUser();
      const token = await userStorage.getToken();
      
      if (!currentUser || !token) {
        router.replace('/');
        return;
      }
      
      setUser(currentUser);

      const [savedClasses, savedTasks, savedNotes, savedReminders] = await Promise.all([
        userStorage.getAllClasses(),
        userStorage.getAllTasks(),
        userStorage.getAllNotes(),
        userStorage.getAllReminders(),
      ]);

      if (savedClasses) setClasses(savedClasses);
      if (savedTasks) setTasks(savedTasks);
      if (savedNotes) setNotes(savedNotes);
      if (savedReminders) setReminders(savedReminders);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const getCurrentDate = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const now = new Date();
    return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  };

  const getToday = () => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getTodayClasses = () => {
    const today = getToday();
    return classes.filter(c => c.day === today);
  };

  const getPendingTasks = () => {
    return tasks.filter(t => t.status !== 'done');
  };

  const getUpcomingTasks = () => {
    return tasks.filter(t => t.status !== 'done').slice(0, 3);
  };

  const getRecentNotes = () => {
    return notes.slice(0, 2);
  };

  const getTodayReminders = () => {
    return reminders.slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date(); today.setHours(0,0,0,0);
    const due = new Date(dateString); due.setHours(0,0,0,0);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000*60*60*24));
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#e63946';
      case 'medium': return '#ffb300';
      case 'low': return '#28a745';
      default: return '#94a3b8';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4361ee" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fbfdff" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader title="Dashboard" icon="calendar-alt" />

        {/* Search */}
        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <FontAwesome5 name="search" size={16} color="#6c7a8e" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search classes, tasks..."
              placeholderTextColor="#9aa6b5"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Welcome */}
        <View style={styles.welcomeRow}>
          <View>
            <Text style={styles.welcomeText}>
              Welcome back,&apos; <Text style={styles.highlight}>{user?.name?.split(' ')[0] || 'User'}</Text>!
            </Text>
            <Text style={styles.welcomeSubtext}>Here&apos;s your academic day</Text>
          </View>
        </View>

        

        {/* Date Chip */}
        <View style={styles.dateChip}>
          <FontAwesome5 name="calendar-day" size={14} color="#334155" />
          <Text style={styles.dateText}>{getCurrentDate()}</Text>
        </View>

        {/* Stats Grid - Connected to real data */}
        <View style={styles.statsGrid}>
          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/schedule')}>
            <View style={[styles.statIcon, styles.bgBlue]}>
              <FontAwesome5 name="book-open" size={22} color="#4361ee" />
            </View>
            <Text style={styles.statNumber}>{getTodayClasses().length}</Text>
            <Text style={styles.statLabel}>Classes today</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/tasks')}>
            <View style={[styles.statIcon, styles.bgCoral]}>
              <FontAwesome5 name="tasks" size={22} color="#f25e5e" />
            </View>
            <Text style={styles.statNumber}>{getPendingTasks().length}</Text>
            <Text style={styles.statLabel}>Pending tasks</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/notes')}>
            <View style={[styles.statIcon, styles.bgCyan]}>
              <FontAwesome5 name="sticky-note" size={22} color="#0ea5e9" />
            </View>
            <Text style={styles.statNumber}>{notes.length}</Text>
            <Text style={styles.statLabel}>Notes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/reminders')}>
            <View style={[styles.statIcon, styles.bgPurple]}>
              <FontAwesome5 name="bell" size={22} color="#8b5cf6" />
            </View>
            <Text style={styles.statNumber}>{getTodayReminders().length}</Text>
            <Text style={styles.statLabel}>Reminders</Text>
          </TouchableOpacity>
        </View>
        {/* Quick Actions */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.quickRow}
        >
          <TouchableOpacity style={styles.quickChip} onPress={() => router.push('/tasks')}>
            <FontAwesome5 name="plus-circle" size={16} color="#4361ee" />
            <Text style={styles.quickChipText}>Add Task</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickChip} onPress={() => router.push('/notes')}>
            <FontAwesome5 name="plus-circle" size={16} color="#4361ee" />
            <Text style={styles.quickChipText}>Add Note</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickChip} onPress={() => router.push('/schedule')}>
            <FontAwesome5 name="plus-circle" size={16} color="#4361ee" />
            <Text style={styles.quickChipText}>Add Class</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickChip} onPress={() => router.push('/reminders')}>
            <FontAwesome5 name="plus-circle" size={16} color="#4361ee" />
            <Text style={styles.quickChipText}>Reminder</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Today's Classes */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            <FontAwesome5 name="calendar-day" size={16} color="#4361ee" />  Today&apos;s classes
          </Text>
          <TouchableOpacity onPress={() => router.push('/schedule')}>
            <Text style={styles.sectionLink}>View all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          {getTodayClasses().length === 0 ? (
            <View style={styles.emptyCard}>
              <FontAwesome5 name="calendar-day" size={24} color="#cbd5e1" />
              <Text style={styles.emptyCardText}>No classes today</Text>
              <TouchableOpacity onPress={() => router.push('/schedule')}>
                <Text style={styles.addLink}>+ Add class</Text>
              </TouchableOpacity>
            </View>
          ) : (
            getTodayClasses().slice(0, 3).map((cls, index) => (
              <TouchableOpacity 
                key={cls.id} 
                style={[styles.listItem, index < Math.min(getTodayClasses().length, 3) - 1 && styles.listItemBorder]}
                onPress={() => router.push('/schedule')}
              >
                <View style={styles.itemLeft}>
                  <View style={styles.timeChip}>
                    <FontAwesome5 name="clock" size={12} color="#64748b" />
                    <Text style={styles.timeText}> {cls.time?.split('-')[0]?.trim()}</Text>
                  </View>
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>{cls.name}</Text>
                  <View style={styles.itemMeta}>
                    <FontAwesome5 name="map-marker-alt" size={12} color="#7c8ba0" />
                    <Text style={styles.metaText}> {cls.location}</Text>
                  </View>
                </View>
                <View style={[styles.colorDot, { backgroundColor: cls.color || '#4361ee' }]} />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Upcoming Tasks */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            <FontAwesome5 name="hourglass-half" size={16} color="#4361ee" />  Upcoming tasks
          </Text>
          <TouchableOpacity onPress={() => router.push('/tasks')}>
            <Text style={styles.sectionLink}>View all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          {getUpcomingTasks().length === 0 ? (
            <View style={styles.emptyCard}>
              <FontAwesome5 name="clipboard-list" size={24} color="#cbd5e1" />
              <Text style={styles.emptyCardText}>No pending tasks</Text>
              <TouchableOpacity onPress={() => router.push('/tasks')}>
                <Text style={styles.addLink}>+ Add task</Text>
              </TouchableOpacity>
            </View>
          ) : (
            getUpcomingTasks().map((task, index) => (
              <TouchableOpacity 
                key={task.id} 
                style={[styles.listItem, index < getUpcomingTasks().length - 1 && styles.listItemBorder,
                  task.priority === 'high' && { backgroundColor: '#fff5f5' }
                ]}
                onPress={() => router.push('/tasks')}
              >
                <View style={styles.itemLeft}>
                  <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.priority) }]} />
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>{task.title}</Text>
                  <View style={styles.itemMeta}>
                    <FontAwesome5 name="calendar-alt" size={12} color="#7c8ba0" />
                    <Text style={styles.metaText}> {formatDate(task.dueDate)}</Text>
                    <View style={[styles.statusBadge, task.status === 'todo' ? styles.statusTodo : task.status === 'inprogress' ? styles.statusInProgress : styles.statusDone]}>
                      <Text style={styles.statusText}>{task.status === 'todo' ? 'To Do' : task.status === 'inprogress' ? 'In Progress' : 'Done'}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Recent Notes */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            <FontAwesome5 name="sticky-note" size={16} color="#4361ee" />  Recent notes
          </Text>
          <TouchableOpacity onPress={() => router.push('/notes')}>
            <Text style={styles.sectionLink}>All notes</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          {getRecentNotes().length === 0 ? (
            <View style={styles.emptyCard}>
              <FontAwesome5 name="sticky-note" size={24} color="#cbd5e1" />
              <Text style={styles.emptyCardText}>No notes yet</Text>
              <TouchableOpacity onPress={() => router.push('/notes')}>
                <Text style={styles.addLink}>+ Add note</Text>
              </TouchableOpacity>
            </View>
          ) : (
            getRecentNotes().map((note, index) => (
              <TouchableOpacity 
                key={note.id} 
                style={[
                  styles.listItem, 
                  index < getRecentNotes().length - 1 && styles.listItemBorder
                ]}
                onPress={() => router.push('/notes')}
              >
                <View style={styles.itemLeft}>
                  <View style={styles.noteIcon}>
                    <FontAwesome5 name="file-alt" size={18} color="#FFFFFF" />
                  </View>
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>{note.title}</Text>
                  <Text style={styles.metaText} numberOfLines={1}>
                    {note.content?.substring(0, 50) || 'No content'}
                  </Text>
                  {note.tags && note.tags.length > 0 && (
                    <View style={styles.tagsRow}>
                      {note.tags.slice(0, 2).map((tag: string, idx: number) => (
                        <View key={idx} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Reminders */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            <FontAwesome5 name="bell" size={16} color="#4361ee" />  Reminders
          </Text>
          <TouchableOpacity onPress={() => router.push('/reminders')}>
            <Text style={styles.sectionLink}>All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          {getTodayReminders().length === 0 ? (
            <View style={styles.emptyCard}>
              <FontAwesome5 name="bell" size={24} color="#cbd5e1" />
              <Text style={styles.emptyCardText}>No reminders</Text>
              <TouchableOpacity onPress={() => router.push('/reminders')}>
                <Text style={styles.addLink}>+ Add reminder</Text>
              </TouchableOpacity>
            </View>
          ) : (
            getTodayReminders().map((item, index) => (
              <TouchableOpacity 
                key={item.id || `rem-${index}`} 
                style={[styles.listItem, index < getTodayReminders().length - 1 && styles.listItemBorder]}
                onPress={() => router.push('/reminders')}
              >
                <View style={styles.itemLeft}>
                  <View style={[styles.reminderIcon, { backgroundColor: item.color || '#8b5cf6' }]}>
                    <FontAwesome5 name="bell" size={16} color="#FFFFFF" />
                  </View>
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>{item.name || item.title}</Text>
                  <View style={styles.itemMeta}>
                    <FontAwesome5 name="clock" size={12} color="#7c8ba0" />
                    <Text style={styles.metaText}> {item.time || 'No time'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fbfdff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fbfdff' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  
  searchSection: { marginBottom: 16 },
  searchBox: { backgroundColor: '#f1f5f9', borderRadius: 30, paddingHorizontal: 18, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#1e293b' },
  
  welcomeRow: { marginBottom: 12 },
  welcomeText: { fontSize: 22, fontWeight: '700', color: '#0f1825', marginBottom: 4 },
  highlight: { color: '#4361ee' },
  welcomeSubtext: { fontSize: 14, color: '#64748b' },
  
  dateChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', borderRadius: 40, paddingHorizontal: 18, paddingVertical: 8, borderWidth: 1, borderColor: '#eef2f6', alignSelf: 'flex-start', marginBottom: 20 },
  dateText: { fontSize: 13, fontWeight: '500', color: '#334155' },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 16, width: '47%', borderWidth: 1, borderColor: '#f0f4fa', elevation: 2 },
  statIcon: { width: 48, height: 48, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  bgBlue: { backgroundColor: '#eef3ff' },
  bgCoral: { backgroundColor: '#ffeae5' },
  bgCyan: { backgroundColor: '#e0f2fe' },
  bgPurple: { backgroundColor: '#f1e5ff' },
  statNumber: { fontSize: 28, fontWeight: '800', color: '#0b1a2a', marginBottom: 4 },
  statLabel: { fontSize: 13, color: '#65748c', fontWeight: '500' },
  
  quickRow: { marginBottom: 24 },
  quickChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#e4eaf2', borderRadius: 40, paddingHorizontal: 18, paddingVertical: 10, marginRight: 10 },
  quickChipText: { fontSize: 13, fontWeight: '500', color: '#2c3e50' },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  sectionLink: { fontSize: 13, fontWeight: '600', color: '#4361ee' },
  
  card: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: '#f0f4fc', elevation: 2 },
  
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12 },
  listItemBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  itemLeft: { flexShrink: 0 },
  timeChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 30 },
  timeText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  priorityDot: { width: 10, height: 10, borderRadius: 10, marginTop: 6 },
  noteIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#4361ee', justifyContent: 'center', alignItems: 'center' },
  reminderIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  metaText: { fontSize: 13, color: '#62748c' },
  colorDot: { width: 6, height: 40, borderRadius: 20, flexShrink: 0 },
  
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 40 },
  statusTodo: { backgroundColor: '#fff3cd' },
  statusInProgress: { backgroundColor: '#cce5ff' },
  statusDone: { backgroundColor: '#d4edda' },
  statusText: { fontSize: 10, fontWeight: '600', color: '#475569' },
  
  tagsRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  tag: { backgroundColor: '#eef2f6', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 30 },
  tagText: { fontSize: 11, color: '#44566c' },
  
  emptyCard: { alignItems: 'center', paddingVertical: 20 },
  emptyCardText: { fontSize: 14, color: '#94a3b8', marginTop: 8, marginBottom: 8 },
  addLink: { fontSize: 13, color: '#4361ee', fontWeight: '600' },
});